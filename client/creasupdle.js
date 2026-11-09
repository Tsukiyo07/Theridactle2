// client/creasupdle.js - Creasupdle Game Engine (OnePieceDle style for Creasup)
(function(window) {
  'use strict';

  // --- Sound Effects Synthesizer (Web Audio API, zero dependencies) ---
  const CreasupdleAudio = {
    ctx: null,
    muted: false,

    init() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
        const savedMute = localStorage.getItem('creasupdle_muted');
        if (savedMute !== null) {
          this.muted = savedMute === 'true';
        }
      } catch (e) {
        console.warn('Web Audio not supported', e);
      }
    },

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },

    playFlip(index = 0) {
      if (this.muted || !this.ctx) return;
      this.resume();
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const baseFreq = 320 + (index * 45);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq + 80, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
      } catch (e) {}
    },

    playWin() {
      if (this.muted || !this.ctx) return;
      this.resume();
      try {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const startTime = this.ctx.currentTime + (i * 0.11);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.12, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.35);
        });
      } catch (e) {}
    },

    playError() {
      if (this.muted || !this.ctx) return;
      this.resume();
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
      } catch (e) {}
    },

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem('creasupdle_muted', String(this.muted));
      return this.muted;
    }
  };

  // --- Game Engine State ---
  const state = {
    mode: 'daily', // 'daily' or 'infinite'
    target: null,
    guesses: [],
    isWon: false,
    dailyDateStr: '',
    selectedDropdownIndex: -1,
    history: []
  };

  // Parse height in cm from string (e.g. "1m73" -> 173, "1m82" -> 182)
  function parseTailleCm(str) {
    if (!str) return 170;
    if (typeof str === 'number') return str;
    const s = String(str).toLowerCase().trim();
    const mMatch = s.match(/(\d+)m(\d+)/);
    if (mMatch) {
      const meters = parseInt(mMatch[1], 10);
      const cm = parseInt(mMatch[2], 10);
      return meters * 100 + (cm < 10 ? cm * 10 : cm);
    }
    const numMatch = s.match(/(\d+)/);
    if (numMatch) {
      const val = parseInt(numMatch[1], 10);
      if (val < 3) return Math.round(val * 100);
      return val;
    }
    return 170;
  }

  // Normalize string for clean comparison (lowercase, trim, strip accents)
  function norm(str) {
    if (!str) return '';
    return String(str)
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  // Normalize situation (handles "couple", "en couple", "celibataire", "celib")
  function normSituation(s) {
    const n = norm(s);
    if (n.includes('couple')) return 'couple';
    if (n.includes('celib')) return 'celibataire';
    return n;
  }

  // Split string into sorted unique tokens (for multi-values like "Graph, Ancien" or "Alfred Grévin, Marguerite de Bourgogne")
  function splitTokens(str) {
    if (!str) return [];
    return norm(str)
      .split(/[,/]+/)
      .map(s => {
        const t = s.trim();
        return t === 'concepteur' ? 'dev' : t;
      })
      .filter(Boolean);
  }

  // Compare Hair exact match
  function isHairExact(h1, h2) {
    const p1 = splitTokens(h1).sort().join(',');
    const p2 = splitTokens(h2).sort().join(',');
    return p1 === p2;
  }

  // Compare Hair partial match (ONLY for shared color tokens in multi-colored hair like "Châtain, Blond" or "Brun, Blond")
  function isCloseHair(h1, h2) {
    if (!h1 || !h2) return false;
    if (isHairExact(h1, h2)) return false;
    const partsA = splitTokens(h1);
    const partsB = splitTokens(h2);
    // Strict exact token match: e.g. "Brun, Blond" shares "Blond" with "Châtain, Blond", but NEVER matches "Noir"
    return partsA.some(p => partsB.some(q => p === q));
  }

  // Compare Role exact match (irrespective of order: "Graph, Ancien" === "Ancien, Graph")
  function isRoleExact(r1, r2) {
    const p1 = splitTokens(r1).sort().join(',');
    const p2 = splitTokens(r2).sort().join(',');
    return p1 === p2;
  }

  // Compare Role partial match (supports partial matches like "Graph, Ancien" with "Graph" or "Ancien")
  function isCloseRole(r1, r2) {
    if (!r1 || !r2) return false;
    if (isRoleExact(r1, r2)) return false;
    const partsA = splitTokens(r1);
    const partsB = splitTokens(r2);
    return partsA.some(p => partsB.some(q => p === q));
  }

  // Compare Promo exact match (handles single or double promos)
  function isPromoExact(p1, p2) {
    const p1Sorted = splitTokens(p1 || 'Alfred Grévin').sort().join(',');
    const p2Sorted = splitTokens(p2 || 'Alfred Grévin').sort().join(',');
    return p1Sorted === p2Sorted;
  }

  // Compare Promo partial match (e.g. sharing "Alfred Grévin")
  function isClosePromo(p1, p2) {
    if (!p1 || !p2) return false;
    if (isPromoExact(p1, p2)) return false;
    const partsA = splitTokens(p1);
    const partsB = splitTokens(p2);
    return partsA.some(p => partsB.some(q => p === q));
  }

  // Pick deterministic Daily Target based on current calendar date
  function getDailyTarget(roster) {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % roster.length;
    return { target: roster[index], dateStr };
  }

  // Pick random target for infinite mode
  function getRandomTarget(roster, excludeId = null) {
    const pool = roster.filter(m => m.id !== excludeId);
    if (pool.length === 0) return roster[0];
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  }

  // Compare a guess with the target across all 8 categories
  function compareGuess(guess, target) {
    // 1. Genre
    const genreMatch = norm(guess.genre) === norm(target.genre);

    // 2. Situation (Célibataire / Couple)
    const situationMatch = normSituation(guess.situation) === normSituation(target.situation);

    // 3. Orientation (Hétéro / Suspicieux / Polyvalent / Inconnu)
    const orientationMatch = norm(guess.orientation) === norm(target.orientation);

    // 4. Cheveux (Noir / Marron / Châtain / Blond / Roux / Brun / Bonnet)
    const cheveuxMatch = isHairExact(guess.cheveux, target.cheveux);
    const cheveuxPartial = !cheveuxMatch && isCloseHair(guess.cheveux, target.cheveux);

    // 5. Taille (numeric cm comparison with ▲ / ▼ arrows)
    const guessCm = parseTailleCm(guess.taille);
    const targetCm = parseTailleCm(target.taille);
    const tailleMatch = guessCm === targetCm;
    let tailleArrow = '';
    if (targetCm > guessCm) tailleArrow = 'up';
    else if (targetCm < guessCm) tailleArrow = 'down';

    // 6. Rôle (Dev / Graph / Ancien)
    const roleMatch = isRoleExact(guess.role, target.role);
    const rolePartial = !roleMatch && isCloseRole(guess.role, target.role);

    // 7. Promo (Alfred Grévin / Louise de Clermont / Marguerite de Bourgogne / etc.)
    const promoMatch = isPromoExact(guess.promo, target.promo);
    const promoPartial = !promoMatch && isClosePromo(guess.promo, target.promo);

    // 8. Âge (numeric comparison with ▲ / ▼ arrows)
    const guessAge = Number(guess.age);
    const targetAge = Number(target.age);
    const ageMatch = guessAge === targetAge;
    let ageArrow = '';
    if (targetAge > guessAge) ageArrow = 'up';
    else if (targetAge < guessAge) ageArrow = 'down';

    const result = {
      person: guess,
      genre: {
        value: guess.genre,
        status: genreMatch ? 'correct' : 'wrong'
      },
      situation: {
        value: guess.situation,
        status: situationMatch ? 'correct' : 'wrong'
      },
      orientation: {
        value: guess.orientation,
        status: orientationMatch ? 'correct' : 'wrong'
      },
      cheveux: {
        value: guess.cheveux,
        status: cheveuxMatch ? 'correct' : (cheveuxPartial ? 'partial' : 'wrong')
      },
      taille: {
        value: guess.taille,
        status: tailleMatch ? 'correct' : 'wrong',
        arrow: tailleArrow
      },
      role: {
        value: guess.role,
        status: roleMatch ? 'correct' : (rolePartial ? 'partial' : 'wrong')
      },
      promo: {
        value: guess.promo || 'Alfred Grévin',
        status: promoMatch ? 'correct' : (promoPartial ? 'partial' : 'wrong')
      },
      age: {
        value: guess.age,
        status: ageMatch ? 'correct' : 'wrong',
        arrow: ageArrow
      }
    };

    const isMatch = guess.id === target.id || (
      genreMatch && situationMatch && orientationMatch &&
      cheveuxMatch && tailleMatch && roleMatch &&
      promoMatch && ageMatch
    );

    return { result, isMatch };
  }

  // --- DOM Elements Cache ---
  let dom = {};

  function cacheDom() {
    dom = {
      view: document.getElementById('creasupdle-game-view'),
      btnBack: document.getElementById('btn-back-creasupdle'),
      btnRules: document.getElementById('btn-creasupdle-rules'),
      btnRoster: document.getElementById('btn-creasupdle-roster'),
      btnStats: document.getElementById('btn-creasupdle-stats'),
      btnSound: document.getElementById('btn-creasupdle-sound'),
      modeDailyBtn: document.getElementById('creasupdle-mode-daily'),
      modeInfiniteBtn: document.getElementById('creasupdle-mode-infinite'),
      searchInput: document.getElementById('creasupdle-search-input'),
      dropdown: document.getElementById('creasupdle-search-dropdown'),
      btnSubmit: document.getElementById('creasupdle-submit-btn'),
      guessesContainer: document.getElementById('creasupdle-guesses-list'),
      guessesCountBadge: document.getElementById('creasupdle-guesses-count'),
      rosterCountBadge: document.getElementById('creasupdle-roster-count'),
      // Clues
      clueInitiales: document.getElementById('creasupdle-clue-initiales'),
      clueRole: document.getElementById('creasupdle-clue-role'),
      cluePunchline: document.getElementById('creasupdle-clue-punchline'),
      // Modals
      winModal: document.getElementById('creasupdle-win-modal'),
      btnWinShare: document.getElementById('btn-creasupdle-win-share'),
      btnWinReplay: document.getElementById('btn-creasupdle-win-replay'),
      btnWinClose: document.getElementById('btn-creasupdle-win-close'),
      rulesModal: document.getElementById('creasupdle-rules-modal'),
      btnRulesClose: document.getElementById('btn-creasupdle-rules-close'),
      rosterModal: document.getElementById('creasupdle-roster-modal'),
      btnRosterClose: document.getElementById('btn-creasupdle-roster-close'),
      btnAddMemberModal: document.getElementById('btn-creasupdle-add-member'),
      rosterListContainer: document.getElementById('creasupdle-roster-items'),
      memberFormModal: document.getElementById('creasupdle-member-form-modal'),
      memberForm: document.getElementById('creasupdle-member-form'),
      btnCancelMemberForm: document.getElementById('btn-creasupdle-form-cancel'),
      statsModal: document.getElementById('creasupdle-stats-modal'),
      btnStatsClose: document.getElementById('btn-creasupdle-stats-close'),
      btnStatsDone: document.getElementById('btn-creasupdle-stats-done')
    };
  }

  const SESSION_STORAGE_KEY = 'creasupdle_active_session_v7';

  function saveSessionState() {
    try {
      if (!state.target) return;
      const data = {
        mode: state.mode,
        targetId: state.target.id,
        guesses: state.guesses,
        isWon: state.isWon,
        dailyDateStr: state.dailyDateStr
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function clearSessionState() {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {}
  }

  // Initialize new game round (with automatic session restore on reload F5)
  function startNewRound(mode = 'daily', forceReset = false) {
    const roster = window.CREASUPDLE.getRoster();
    cacheDom();

    // Synchronize unique page URL so refreshing stays in Creasupdle
    const url = new URL(window.location.href);
    url.searchParams.set('game', 'creasupdle');
    window.history.replaceState({ game: 'creasupdle' }, document.title, url.toString());

    // Restore existing session on reload (if not a manual new game)
    if (!forceReset) {
      try {
        const rawSaved = localStorage.getItem(SESSION_STORAGE_KEY);
        if (rawSaved) {
          const saved = JSON.parse(rawSaved);
          const todayDateStr = getDailyTarget(roster).dateStr;
          const isDailyMatch = (mode === 'daily' && saved.mode === 'daily' && saved.dailyDateStr === todayDateStr);
          const isInfiniteMatch = (mode === 'infinite' && saved.mode === 'infinite');

          if (isDailyMatch || isInfiniteMatch) {
            const restoredTarget = roster.find(m => m.id === saved.targetId);
            if (restoredTarget && Array.isArray(saved.guesses)) {
              state.mode = saved.mode;
              state.target = restoredTarget;
              state.dailyDateStr = saved.dailyDateStr || todayDateStr;
              state.guesses = saved.guesses;
              state.isWon = !!saved.isWon;
              state.selectedDropdownIndex = -1;

              if (dom.modeDailyBtn) dom.modeDailyBtn.classList.toggle('active', state.mode === 'daily');
              if (dom.modeInfiniteBtn) dom.modeInfiniteBtn.classList.toggle('active', state.mode === 'infinite');

              if (dom.searchInput) {
                dom.searchInput.value = '';
                dom.searchInput.disabled = state.isWon;
              }
              if (dom.btnSubmit) dom.btnSubmit.disabled = state.isWon;
              if (dom.dropdown) dom.dropdown.classList.add('hidden');
              if (dom.guessesContainer) {
                dom.guessesContainer.innerHTML = '';
                // Render restored guesses (reverse so newest is on top) without animation delay
                saved.guesses.slice().reverse().forEach(g => {
                  appendGuessRow(g, g.person.id === state.target.id, false);
                });
              }

              updateGuessesCounter();
              updateCluesUI();
              updateSoundButtonUI();

              if (state.isWon) {
                showVictoryModal();
              } else if (dom.winModal) {
                dom.winModal.classList.add('hidden');
              }
              return;
            }
          }
        }
      } catch (e) {
        console.warn('Failed to restore Creasupdle session', e);
      }
    }

    // Fresh round setup
    clearSessionState();
    state.mode = mode;
    state.guesses = [];
    state.isWon = false;
    state.selectedDropdownIndex = -1;

    if (mode === 'daily') {
      const { target, dateStr } = getDailyTarget(roster);
      state.target = target;
      state.dailyDateStr = dateStr;
      if (dom.modeDailyBtn) dom.modeDailyBtn.classList.add('active');
      if (dom.modeInfiniteBtn) dom.modeInfiniteBtn.classList.remove('active');
    } else {
      state.target = getRandomTarget(roster, state.target ? state.target.id : null);
      if (dom.modeDailyBtn) dom.modeDailyBtn.classList.remove('active');
      if (dom.modeInfiniteBtn) dom.modeInfiniteBtn.classList.add('active');
    }

    // Reset UI
    if (dom.searchInput) {
      dom.searchInput.value = '';
      dom.searchInput.disabled = false;
      dom.searchInput.focus();
    }
    if (dom.btnSubmit) dom.btnSubmit.disabled = false;
    if (dom.dropdown) dom.dropdown.classList.add('hidden');
    if (dom.guessesContainer) dom.guessesContainer.innerHTML = '';
    
    updateGuessesCounter();
    updateCluesUI();
    updateSoundButtonUI();

    if (dom.winModal) dom.winModal.classList.add('hidden');
    saveSessionState();
  }

  function updateGuessesCounter() {
    const roster = window.CREASUPDLE.getRoster();
    if (dom.guessesCountBadge) {
      dom.guessesCountBadge.textContent = `${state.guesses.length} essai${state.guesses.length > 1 ? 's' : ''}`;
    }
    if (dom.rosterCountBadge) {
      dom.rosterCountBadge.textContent = `${roster.length} membres`;
    }
    const scrollHint = document.getElementById('creasupdle-scroll-hint');
    if (scrollHint) {
      scrollHint.style.display = state.guesses.length > 0 ? '' : 'none';
    }
  }

  function updateCluesUI() {
    const tries = state.guesses.length;
    // Clue 1: Initiales (unlocks after 2 tries)
    if (dom.clueInitiales) {
      if (tries >= 2 || state.isWon) {
        dom.clueInitiales.classList.remove('locked');
        dom.clueInitiales.innerHTML = `<span class="clue-tag">Indice 1</span> <strong>Initiales :</strong> ${state.target.initiales || state.target.nom.charAt(0)}`;
      } else {
        dom.clueInitiales.classList.add('locked');
        dom.clueInitiales.innerHTML = `<span class="clue-tag">Verrouillé</span> Débloqué après 2 essais (${tries}/2)`;
      }
    }

    // Clue 2: Rôle & Orientation (unlocks after 3 tries)
    if (dom.clueRole) {
      if (tries >= 3 || state.isWon) {
        dom.clueRole.classList.remove('locked');
        dom.clueRole.innerHTML = `<span class="clue-tag">Indice 2</span> <strong>Rôle &amp; Orientation :</strong> ${state.target.role} • ${state.target.orientation}`;
      } else {
        dom.clueRole.classList.add('locked');
        dom.clueRole.innerHTML = `<span class="clue-tag">Verrouillé</span> Débloqué après 3 essais (${tries}/3)`;
      }
    }

    // Clue 3: Citation culte (unlocks after 4 tries)
    if (dom.cluePunchline) {
      if (tries >= 4 || state.isWon) {
        dom.cluePunchline.classList.remove('locked');
        dom.cluePunchline.innerHTML = `<span class="clue-tag">Indice 3</span> <em>${state.target.punchline || '« Pas d\'inspi sur ce coup-là... »'}</em>`;
      } else {
        dom.cluePunchline.classList.add('locked');
        dom.cluePunchline.innerHTML = `<span class="clue-tag">Verrouillé</span> Débloqué après 4 essais (${tries}/4)`;
      }
    }
  }

  function updateSoundButtonUI() {
    if (!dom.btnSound) return;
    if (CreasupdleAudio.muted) {
      dom.btnSound.innerHTML = `<svg class="inline-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
      dom.btnSound.setAttribute('title', 'Activer le son');
    } else {
      dom.btnSound.innerHTML = `<svg class="inline-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`;
      dom.btnSound.setAttribute('title', 'Couper le son');
    }
  }

  // --- Autocomplete Search ---
  function filterRoster(query) {
    const clean = query.trim().toLowerCase();
    const roster = window.CREASUPDLE.getRoster();
    const guessedIds = new Set(state.guesses.map(g => g.person.id));

    return roster.filter(m => {
      if (guessedIds.has(m.id)) return false;
      if (!clean) return true;
      const nom = (m.nom || '').toLowerCase();
      const nomComplet = (m.nomComplet || '').toLowerCase();
      const surnom = (m.surnom || '').toLowerCase();
      const role = (m.role || '').toLowerCase();
      return nom.includes(clean) || nomComplet.includes(clean) || surnom.includes(clean) || role.includes(clean);
    });
  }

  function renderDropdown(matches) {
    if (!dom.dropdown) return;
    if (matches.length === 0) {
      dom.dropdown.innerHTML = `<div class="creasupdle-dropdown-empty">Aucun étudiant ou membre Créasup trouvé</div>`;
      dom.dropdown.classList.remove('hidden');
      return;
    }

    const html = matches.slice(0, 8).map((m, idx) => {
      const isSelected = idx === state.selectedDropdownIndex;
      return `
        <div class="creasupdle-dropdown-item ${isSelected ? 'selected' : ''}" data-id="${m.id}" data-index="${idx}">
          <div class="creasupdle-mini-avatar" style="background-color: ${m.avatarColor || '#6366f1'};">
            ${m.initiales || m.nom.charAt(0)}
          </div>
          <div class="creasupdle-dropdown-info">
            <div class="creasupdle-dropdown-name">${m.nomComplet || m.nom} ${m.surnom ? `<span class="creasupdle-dropdown-surnom">(${m.surnom})</span>` : ''}</div>
            <div class="creasupdle-dropdown-role">${m.role} • Promo ${m.promo || 'Alfred Grévin'} • ${m.age} ans</div>
          </div>
          <span class="creasupdle-dropdown-arrow">↵</span>
        </div>
      `;
    }).join('');

    dom.dropdown.innerHTML = html;
    dom.dropdown.classList.remove('hidden');

    // Attach click events
    dom.dropdown.querySelectorAll('.creasupdle-dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const id = item.getAttribute('data-id');
        const roster = window.CREASUPDLE.getRoster();
        const selected = roster.find(m => m.id === id);
        if (selected) {
          submitGuess(selected);
        }
      });
    });
  }

  // --- Submit Guess ---
  let isSubmittingGuess = false;

  function submitGuess(person) {
    if (state.isWon || !person || isSubmittingGuess) return;

    // Prevent duplicate guess in the same round
    if (state.guesses && state.guesses.some(g => g.person && g.person.id === person.id)) {
      showToast(`${person.nomComplet || person.nom} a déjà été proposé !`);
      if (dom.searchInput) {
        dom.searchInput.value = '';
        dom.searchInput.focus();
      }
      if (dom.dropdown) dom.dropdown.classList.add('hidden');
      return;
    }

    isSubmittingGuess = true;
    try {
      // Close dropdown
      if (dom.dropdown) dom.dropdown.classList.add('hidden');
      if (dom.searchInput) {
        dom.searchInput.value = '';
        dom.searchInput.focus();
      }

      const { result, isMatch } = compareGuess(person, state.target);
      state.guesses.unshift(result); // prepend so newest is on top

      // Render Row with Animated Tile Reveal
      appendGuessRow(result, isMatch, true);
      updateGuessesCounter();
      updateCluesUI();
      saveSessionState();

      if (isMatch) {
        state.isWon = true;
        if (dom.searchInput) dom.searchInput.disabled = true;
        if (dom.btnSubmit) dom.btnSubmit.disabled = true;
        saveSessionState();
        
        // Record Stats
        window.CREASUPDLE.recordWin(state.guesses.length);

        // Trigger Confetti & Victory Audio
        setTimeout(() => {
          CreasupdleAudio.playWin();
          if (typeof window.triggerConfetti === 'function') {
            window.triggerConfetti();
          } else if (typeof window.createConfetti === 'function') {
            window.createConfetti();
          }
          showVictoryModal();
        }, 1200);
      }
    } finally {
      setTimeout(() => {
        isSubmittingGuess = false;
      }, 350);
    }
  }

  function appendGuessRow(guessResult, isMatch, animate = true) {
    if (!dom.guessesContainer) return;

    const row = document.createElement('div');
    row.className = `creasupdle-guess-row ${isMatch ? 'match-win' : ''}`;

    const p = guessResult.person;
    
    // Tiles configuration:
    // 1. Photo / Nom
    // 2. Genre
    // 3. Situation
    // 4. Orientation
    // 5. Cheveux
    // 6. Taille (avec flèche)
    // 7. Rôle
    // 8. Promo
    // 9. Âge (avec flèche)

    const tilesData = [
      {
        type: 'person',
        label: p.nomComplet || p.nom,
        sub: p.surnom || p.role,
        status: isMatch ? 'correct' : 'person-tile',
        initiales: p.initiales || p.nom.charAt(0),
        color: p.avatarColor || '#6366f1'
      },
      {
        type: 'genre',
        label: guessResult.genre.value,
        status: guessResult.genre.status
      },
      {
        type: 'situation',
        label: guessResult.situation.value,
        status: guessResult.situation.status
      },
      {
        type: 'orientation',
        label: guessResult.orientation.value,
        status: guessResult.orientation.status
      },
      {
        type: 'cheveux',
        label: guessResult.cheveux.value,
        status: guessResult.cheveux.status
      },
      {
        type: 'taille',
        label: guessResult.taille.value,
        status: guessResult.taille.status,
        arrow: guessResult.taille.arrow
      },
      {
        type: 'role',
        label: guessResult.role.value,
        status: guessResult.role.status
      },
      {
        type: 'promo',
        label: guessResult.promo.value,
        status: guessResult.promo.status
      },
      {
        type: 'age',
        label: `${guessResult.age.value} ans`,
        status: guessResult.age.status,
        arrow: guessResult.age.arrow
      }
    ];

    row.innerHTML = tilesData.map((tile, i) => {
      let arrowHtml = '';
      if (tile.arrow === 'up') {
        arrowHtml = `<span class="creasupdle-arrow-indicator arrow-up" title="La personne mystère est au-dessus !">▲</span>`;
      } else if (tile.arrow === 'down') {
        arrowHtml = `<span class="creasupdle-arrow-indicator arrow-down" title="La personne mystère est en-dessous !">▼</span>`;
      }

      if (tile.type === 'person') {
        const animStyle = animate ? `style="animation-delay: ${i * 60}ms;"` : 'style="opacity:1;"';
        const animClass = animate ? 'flip-tile' : '';
        return `
          <div class="creasupdle-tile creasupdle-tile-person ${animClass}" ${animStyle}>
            <div class="creasupdle-tile-inner">
              <div class="creasupdle-mini-avatar" style="background-color: ${tile.color};">
                ${tile.initiales}
              </div>
              <div class="creasupdle-tile-name-wrap">
                <span class="creasupdle-tile-name">${tile.label}</span>
                <span class="creasupdle-tile-role-sub">${tile.sub}</span>
              </div>
            </div>
          </div>
        `;
      }

      const animStyle = animate ? `style="animation-delay: ${i * 60}ms;"` : 'style="opacity:1;"';
      const animClass = animate ? 'flip-tile' : '';
      return `
        <div class="creasupdle-tile tile-${tile.status} ${animClass}" ${animStyle}>
          <div class="creasupdle-tile-content">
            <span class="creasupdle-tile-val">${tile.label}</span>
            ${arrowHtml}
          </div>
        </div>
      `;
    }).join('');

    // Prepend to list
    dom.guessesContainer.prepend(row);

    const tableContainer = document.querySelector('.creasupdle-table-container');
    if (tableContainer && animate) {
      tableContainer.scrollTo({ left: 0, behavior: 'smooth' });
    }

    // Audio flips only on live guess
    if (animate) {
      tilesData.forEach((_, i) => {
        setTimeout(() => {
          CreasupdleAudio.playFlip(i);
        }, i * 60);
      });

      // Clean up animation classes once finished to prevent GPU compositor rasterization drops
      row.querySelectorAll('.flip-tile').forEach(tile => {
        tile.addEventListener('animationend', () => {
          tile.classList.remove('flip-tile');
          tile.style.opacity = '1';
          tile.style.transform = '';
          tile.style.animationDelay = '';
        }, { once: true });
      });

      // Safety fallback to guarantee complete visibility even on background tab or throttled frames
      setTimeout(() => {
        row.querySelectorAll('.flip-tile').forEach(tile => {
          tile.classList.remove('flip-tile');
          tile.style.opacity = '1';
          tile.style.transform = '';
          tile.style.animationDelay = '';
        });
      }, (tilesData.length * 60) + 300);
    }
  }

  // --- Victory Modal & Share ---
  function showVictoryModal() {
    if (!dom.winModal) return;
    const t = state.target;

    const avatarEl = document.getElementById('creasupdle-win-avatar');
    const nameEl = document.getElementById('creasupdle-win-name');
    const bioEl = document.getElementById('creasupdle-win-bio');
    const countEl = document.getElementById('creasupdle-win-count');
    const quoteEl = document.getElementById('creasupdle-win-quote');

    if (avatarEl) {
      avatarEl.textContent = t.initiales || t.nom.charAt(0);
      avatarEl.style.backgroundColor = t.avatarColor || '#6366f1';
    }
    if (nameEl) nameEl.textContent = t.nomComplet || t.nom;
    if (bioEl) bioEl.textContent = `${t.role} • Promo ${t.promo || 'Alfred Grévin'} • ${t.age} ans • ${t.taille} • Cheveux ${t.cheveux}`;
    if (countEl) countEl.textContent = `${state.guesses.length} tentative${state.guesses.length > 1 ? 's' : ''}`;
    if (quoteEl) quoteEl.textContent = t.punchline || `« C'est bien moi le membre mystère ! »`;

    dom.winModal.classList.remove('hidden');
  }

  function generateShareText() {
    const isDaily = state.mode === 'daily';
    const title = isDaily 
      ? `🎓 Creasupdle Quotidien (${state.dailyDateStr}) — ${state.guesses.length} essais` 
      : `🎓 Creasupdle Infini — Trouvé en ${state.guesses.length} essais !`;

    const reversedGuesses = state.guesses.slice().reverse();
    const matrix = reversedGuesses.map(g => {
      const row = [];
      // 1. Genre
      row.push(g.genre.status === 'correct' ? '🟩' : '🟥');
      // 2. Situation
      row.push(g.situation.status === 'correct' ? '🟩' : '🟥');
      // 3. Orientation
      row.push(g.orientation.status === 'correct' ? '🟩' : '🟥');
      // 4. Cheveux
      row.push(g.cheveux.status === 'correct' ? '🟩' : (g.cheveux.status === 'partial' ? '🟧' : '🟥'));
      // 5. Taille
      if (g.taille.status === 'correct') row.push('🟩');
      else row.push(g.taille.arrow === 'up' ? '⬆️' : '⬇️');
      // 6. Role
      row.push(g.role.status === 'correct' ? '🟩' : (g.role.status === 'partial' ? '🟧' : '🟥'));
      // 7. Promo
      row.push(g.promo.status === 'correct' ? '🟩' : (g.promo.status === 'partial' ? '🟧' : '🟥'));
      // 8. Age
      if (g.age.status === 'correct') row.push('🟩');
      else row.push(g.age.arrow === 'up' ? '⬆️' : '⬇️');
      return row.join('');
    }).join('\n');

    return `${title}\n\n${matrix}\n\n👉 Jouer sur SuperCaraQuiz : https://supercaraquiz.duckdns.org`;
  }

  function handleShare() {
    const text = generateShareText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Score copié dans le presse-papier !');
      }).catch(() => {
        showShareFallback(text);
      });
    } else {
      showShareFallback(text);
    }
  }

  function showShareFallback(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Score copié dans le presse-papier !');
      }).catch(() => {
        showToast('Score copié !');
      });
    } else {
      showToast('Score généré !');
    }
  }

  function showToast(msg) {
    let toast = document.getElementById('creasupdle-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'creasupdle-toast';
      toast.className = 'creasupdle-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2600);
  }

  // --- Trombinoscope & Roster Manager ---
  function renderRosterList() {
    if (!dom.rosterListContainer) return;
    const roster = window.CREASUPDLE.getRoster();
    
    dom.rosterListContainer.innerHTML = roster.map(m => {
      const isCustom = m.id.startsWith('custom-');
      return `
        <div class="creasupdle-roster-card">
          <div class="creasupdle-roster-avatar" style="background-color: ${m.avatarColor || '#6366f1'};">
            ${m.initiales || m.nom.charAt(0)}
          </div>
          <div class="creasupdle-roster-details">
            <div class="creasupdle-roster-header">
              <span class="creasupdle-roster-name">${m.nomComplet || m.nom}</span>
              ${m.surnom ? `<span class="creasupdle-roster-surnom">« ${m.surnom} »</span>` : ''}
            </div>
            <div class="creasupdle-roster-tags">
              <span class="rtag"><svg class="inline-svg" viewBox="0 0 24 24" width="12" height="12" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> ${m.genre}</span>
              <span class="rtag"><svg class="inline-svg" viewBox="0 0 24 24" width="12" height="12" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg> ${m.situation || 'Célibataire'}</span>
              <span class="rtag"><svg class="inline-svg" viewBox="0 0 24 24" width="12" height="12" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg> ${m.orientation || 'Hétéro'}</span>
              <span class="rtag"><svg class="inline-svg" viewBox="0 0 24 24" width="12" height="12" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg> ${m.cheveux}</span>
              <span class="rtag"><svg class="inline-svg" viewBox="0 0 24 24" width="12" height="12" stroke-width="2"><path d="M2 12h20M7 8v8M12 10v4M17 8v8"></path></svg> ${m.taille}</span>
              <span class="rtag"><svg class="inline-svg" viewBox="0 0 24 24" width="12" height="12" stroke-width="2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> ${m.role}</span>
              <span class="rtag"><svg class="inline-svg" viewBox="0 0 24 24" width="12" height="12" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg> ${m.promo || 'Alfred Grévin'}</span>
              <span class="rtag"><svg class="inline-svg" viewBox="0 0 24 24" width="12" height="12" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${m.age} ans</span>
            </div>
            ${m.punchline ? `<div class="creasupdle-roster-punchline">${m.punchline}</div>` : ''}
          </div>
          <div class="creasupdle-roster-actions">
            <button type="button" class="btn btn-sm btn-edit-member" data-id="${m.id}" title="Proposer une modification"><svg class="inline-svg" viewBox="0 0 24 24" width="13" height="13" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Modifier</button>
            ${isCustom ? `
              <button class="btn btn-sm btn-danger btn-delete-member" data-id="${m.id}" title="Supprimer">
                <svg class="inline-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Attach edit listeners
    dom.rosterListContainer.querySelectorAll('.btn-edit-member').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openEditMemberModal(id);
      });
    });

    // Attach delete listeners
    dom.rosterListContainer.querySelectorAll('.btn-delete-member').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Voulez-vous vraiment retirer cette personne du roster Créasupdle ?')) {
          window.CREASUPDLE.deleteMember(id);
          renderRosterList();
          updateGuessesCounter();
          showToast('Personne retirée du roster.');
        }
      });
    });
  }

  let pendingMemberSubmission = null;

  function setModalStep(step) {
    const stepConfig = document.getElementById('creasupdle-step-config');
    const stepAuthor = document.getElementById('creasupdle-step-author');
    const stepSuccess = document.getElementById('creasupdle-step-success');
    if (stepConfig) stepConfig.classList.toggle('hidden', step !== 'config');
    if (stepAuthor) stepAuthor.classList.toggle('hidden', step !== 'author');
    if (stepSuccess) stepSuccess.classList.toggle('hidden', step !== 'success');
  }

  function getSelectedPills(group) {
    if (!dom.memberForm) return [];
    const pills = dom.memberForm.querySelectorAll(`.form-pill-check[data-group="${group}"].active`);
    return Array.from(pills).map(p => p.getAttribute('data-value')).filter(Boolean);
  }

  function setSelectedPills(group, valuesString) {
    if (!dom.memberForm) return;
    const rawTokens = (valuesString || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    const pills = dom.memberForm.querySelectorAll(`.form-pill-check[data-group="${group}"]`);
    pills.forEach(p => {
      const val = (p.getAttribute('data-value') || '').toLowerCase();
      const isMatched = rawTokens.some(t => t === val || t.includes(val) || val.includes(t));
      if (isMatched) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
  }

  function openEditMemberModal(id) {
    if (!dom.memberFormModal || !dom.memberForm) return;
    const roster = window.CREASUPDLE.getRoster();
    const member = roster.find(m => m.id === id);
    if (!member) return;

    dom.memberForm.reset();
    setModalStep('config');
    pendingMemberSubmission = null;

    const editIdInput = dom.memberForm.querySelector('#member-edit-id');
    if (editIdInput) editIdInput.value = member.id;

    const titleEl = document.getElementById('creasupdle-form-modal-title');
    if (titleEl) titleEl.textContent = `Modifier : ${member.nomComplet || member.nom}`;

    const submitBtn = dom.memberForm.querySelector('#btn-creasupdle-form-submit');
    if (submitBtn) submitBtn.textContent = 'Envoyer la demande';

    // Pre-fill inputs
    const nomInput = dom.memberForm.querySelector('#member-nom');
    if (nomInput) nomInput.value = member.nomComplet || member.nom;

    const surnomInput = dom.memberForm.querySelector('#member-surnom');
    if (surnomInput) surnomInput.value = member.surnom || '';

    const genreSelect = dom.memberForm.querySelector('#member-genre');
    if (genreSelect) genreSelect.value = member.genre || 'Homme';

    const sitSelect = dom.memberForm.querySelector('#member-situation');
    if (sitSelect) sitSelect.value = member.situation || 'Célibataire';

    const oriSelect = dom.memberForm.querySelector('#member-orientation');
    if (oriSelect) oriSelect.value = member.orientation || 'Hétéro';

    setSelectedPills('cheveux', member.cheveux || 'Noir');

    const tailleInput = dom.memberForm.querySelector('#member-taille');
    if (tailleInput) tailleInput.value = member.taille || '1m73';

    setSelectedPills('role', member.role || 'Graph');
    setSelectedPills('promo', member.promo || 'Alfred Grévin');

    const ageInput = dom.memberForm.querySelector('#member-age');
    if (ageInput) ageInput.value = member.age || 21;

    const quoteInput = dom.memberForm.querySelector('#member-punchline');
    if (quoteInput) quoteInput.value = member.punchline ? member.punchline.replace(/^[«"'\s]+|[»"'\s]+$/g, '').trim() : '';

    dom.memberFormModal.classList.remove('hidden');
  }

  function openAddMemberModal() {
    if (!dom.memberFormModal || !dom.memberForm) return;
    dom.memberForm.reset();
    setModalStep('config');
    pendingMemberSubmission = null;

    const editIdInput = dom.memberForm.querySelector('#member-edit-id');
    if (editIdInput) editIdInput.value = '';

    const titleEl = document.getElementById('creasupdle-form-modal-title');
    if (titleEl) titleEl.textContent = 'Proposer un membre de Créasup';

    const submitBtn = dom.memberForm.querySelector('#btn-creasupdle-form-submit');
    if (submitBtn) submitBtn.textContent = 'Envoyer la demande';

    setSelectedPills('cheveux', 'Noir');
    setSelectedPills('role', 'Graph');
    setSelectedPills('promo', 'Alfred Grévin');

    const quoteInput = dom.memberForm.querySelector('#member-punchline');
    if (quoteInput) quoteInput.value = '';

    dom.memberFormModal.classList.remove('hidden');
  }

  function handleSaveMember(e) {
    e.preventDefault();
    const form = dom.memberForm;
    if (!form) return;

    const nom = form.querySelector('#member-nom').value.trim();
    if (!nom) {
      showToast('Veuillez renseigner le prénom ou nom.');
      return;
    }

    const editId = form.querySelector('#member-edit-id') ? form.querySelector('#member-edit-id').value.trim() : '';
    const isUpdate = Boolean(editId);

    const selectedCheveux = getSelectedPills('cheveux');
    if (selectedCheveux.length === 0) {
      showToast('Sélectionnez au moins une couleur de cheveux.');
      return;
    }

    const selectedRoles = getSelectedPills('role');
    if (selectedRoles.length === 0) {
      showToast('Sélectionnez au moins un rôle (Graph, Dev, Ancien...).');
      return;
    }

    const selectedPromos = getSelectedPills('promo');
    if (selectedPromos.length === 0) {
      showToast('Sélectionnez au moins une promo Créasup.');
      return;
    }

    const initials = nom.split(' ').map(w => w.charAt(0).toUpperCase()).join('').slice(0, 2) || nom.charAt(0).toUpperCase();
    const colors = ['#6366f1', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#3b82f6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const rawQuote = form.querySelector('#member-punchline') ? form.querySelector('#member-punchline').value.trim() : '';
    const cleanQuote = rawQuote.replace(/^[«"'\s]+|[»"'\s]+$/g, '').trim();
    const punchline = cleanQuote ? `« ${cleanQuote} »` : '';

    const memberData = {
      id: editId || ('member-' + Date.now()),
      nom: nom.split(' ')[0],
      nomComplet: nom,
      surnom: form.querySelector('#member-surnom') ? form.querySelector('#member-surnom').value.trim() : '',
      genre: form.querySelector('#member-genre') ? form.querySelector('#member-genre').value : 'Homme',
      situation: form.querySelector('#member-situation') ? form.querySelector('#member-situation').value : 'Célibataire',
      orientation: form.querySelector('#member-orientation') ? form.querySelector('#member-orientation').value : 'Hétéro',
      cheveux: selectedCheveux.join(', '),
      taille: form.querySelector('#member-taille') ? form.querySelector('#member-taille').value.trim() : '1m73',
      role: selectedRoles.join(', '),
      promo: selectedPromos.join(', '),
      age: parseInt(form.querySelector('#member-age') ? form.querySelector('#member-age').value : '21', 10) || 21,
      punchline: punchline,
      initiales: initials,
      avatarColor: randomColor
    };

    // Store for Step 2
    pendingMemberSubmission = { isUpdate, memberData };

    // Move to Step 2: "Qui envoie la demande ?"
    setModalStep('author');
    const authorInput = document.getElementById('member-author-nickname');
    if (authorInput) {
      let savedNick = '';
      try {
        savedNick = localStorage.getItem('supercaraquiz_nickname') || localStorage.getItem('playerNickname') || '';
      } catch (err) {}
      authorInput.value = savedNick;
      setTimeout(() => authorInput.focus(), 60);
    }
  }

  async function handleAuthorSubmit(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!pendingMemberSubmission) {
      setModalStep('config');
      return;
    }

    const authorInput = document.getElementById('member-author-nickname');
    let authorNickname = authorInput ? authorInput.value.trim() : '';
    if (!authorNickname) {
      try {
        authorNickname = localStorage.getItem('supercaraquiz_nickname') || localStorage.getItem('playerNickname') || '';
      } catch (err) {}
    }
    if (!authorNickname) {
      authorNickname = 'Un membre de Créasup';
    }

    try {
      localStorage.setItem('supercaraquiz_nickname', authorNickname);
    } catch (err) {}

    const submitBtn = document.getElementById('btn-creasupdle-author-submit');
    const origText = submitBtn ? submitBtn.textContent : 'Envoyer la demande';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Envoi du mail en cours... ⏳';
    }

    try {
      const response = await window.CREASUPDLE.requestMemberModeration({
        type: pendingMemberSubmission.isUpdate ? 'update' : 'create',
        member: pendingMemberSubmission.memberData,
        authorNickname
      });

      if (response && response.success) {
        const targetNameEl = document.getElementById('success-member-target-name');
        if (targetNameEl) {
          targetNameEl.textContent = pendingMemberSubmission.memberData.nomComplet || pendingMemberSubmission.memberData.nom;
        }
        setModalStep('success');
      } else {
        showToast(response && (response.message || response.error) ? (response.message || response.error) : 'Erreur lors de l\'envoi de la demande.');
      }
    } catch (err) {
      console.error('Failed to submit moderation request:', err);
      showToast('Erreur lors de la communication avec le serveur.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = origText;
      }
    }
  }

  // --- Attach Event Listeners ---
  let eventsAttached = false;

  
  function openStatsModal() {
    if (!dom.statsModal) return;
    const stats = window.CREASUPDLE.getStats();

    const playedEl = document.getElementById('creasupdle-stat-played');
    const winrateEl = document.getElementById('creasupdle-stat-winrate');
    const streakEl = document.getElementById('creasupdle-stat-streak');
    const maxStreakEl = document.getElementById('creasupdle-stat-maxstreak');
    const distribContainer = document.getElementById('creasupdle-distrib-bars');

    if (playedEl) playedEl.textContent = stats.played || 0;
    if (winrateEl) {
      const rate = stats.played > 0 ? Math.round(((stats.won || 0) / stats.played) * 100) : 0;
      winrateEl.textContent = `${rate}%`;
    }
    if (streakEl) streakEl.textContent = stats.currentStreak || 0;
    if (maxStreakEl) maxStreakEl.textContent = stats.maxStreak || 0;

    if (distribContainer) {
      const distrib = stats.guessDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, '6+': 0 };
      const keys = ['1', '2', '3', '4', '5', '6+'];
      const maxVal = Math.max(1, ...keys.map(k => distrib[k] || 0));

      distribContainer.innerHTML = keys.map(k => {
        const val = distrib[k] || 0;
        const pct = Math.max(8, Math.round((val / maxVal) * 100));
        const isCurrentWin = state.isWon && (
          (k === '6+' && state.guesses.length >= 6) ||
          (String(state.guesses.length) === k)
        );
        return `
          <div class="distrib-row ${isCurrentWin ? 'current-win' : ''}">
            <span class="distrib-label">${k}</span>
            <div class="distrib-bar-track">
              <div class="distrib-bar-fill" style="width: ${val > 0 ? pct : 8}%;">
                <span class="distrib-count">${val}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    dom.statsModal.classList.remove('hidden');
  }

  function attachEvents() {
    if (eventsAttached) return;
    eventsAttached = true;

    CreasupdleAudio.init();

    // Portal Navigation
    if (dom.btnBack) {
      dom.btnBack.addEventListener('click', () => {
        if (typeof window.showView === 'function') {
          window.showView('portal');
        }
      });
    }

    // Portal Game Spotlight & Card click
    const spotlightPortal = document.getElementById('spotlight-creasupdle');
    if (spotlightPortal) {
      spotlightPortal.addEventListener('click', () => {
        if (typeof window.showView === 'function') {
          window.showView('creasupdleGame');
          startNewRound('daily');
        }
      });
    }

    const btnSpotlight = document.getElementById('btn-spotlight-creasupdle');
    if (btnSpotlight) {
      btnSpotlight.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof window.showView === 'function') {
          window.showView('creasupdleGame');
          startNewRound('daily');
        }
      });
    }

    const cardPortal = document.getElementById('card-creasupdle');
    if (cardPortal) {
      cardPortal.addEventListener('click', () => {
        if (typeof window.showView === 'function') {
          window.showView('creasupdleGame');
          startNewRound('daily');
        }
      });
    }

    const btnPortal = document.getElementById('btn-portal-creasupdle');
    if (btnPortal) {
      btnPortal.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof window.showView === 'function') {
          window.showView('creasupdleGame');
          startNewRound('daily');
        }
      });
    }

    // Sound toggle
    if (dom.btnSound) {
      dom.btnSound.addEventListener('click', () => {
        CreasupdleAudio.toggleMute();
        updateSoundButtonUI();
      });
    }

    // Mode Switcher
    if (dom.modeDailyBtn) {
      dom.modeDailyBtn.addEventListener('click', () => startNewRound('daily'));
    }
    if (dom.modeInfiniteBtn) {
      dom.modeInfiniteBtn.addEventListener('click', () => startNewRound('infinite'));
    }

    // Search Input Autocomplete
    if (dom.searchInput) {
      dom.searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        state.selectedDropdownIndex = -1;
        if (query.trim().length === 0) {
          if (dom.dropdown) dom.dropdown.classList.add('hidden');
          return;
        }
        const matches = filterRoster(query);
        renderDropdown(matches);
      });

      dom.searchInput.addEventListener('keydown', (e) => {
        const items = dom.dropdown ? dom.dropdown.querySelectorAll('.creasupdle-dropdown-item') : [];
        if (!items || items.length === 0) return;

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          state.selectedDropdownIndex = (state.selectedDropdownIndex + 1) % items.length;
          items.forEach((item, idx) => item.classList.toggle('selected', idx === state.selectedDropdownIndex));
          items[state.selectedDropdownIndex]?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          state.selectedDropdownIndex = (state.selectedDropdownIndex - 1 + items.length) % items.length;
          items.forEach((item, idx) => item.classList.toggle('selected', idx === state.selectedDropdownIndex));
          items[state.selectedDropdownIndex]?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          if (state.selectedDropdownIndex >= 0 && items[state.selectedDropdownIndex]) {
            const id = items[state.selectedDropdownIndex].getAttribute('data-id');
            const roster = window.CREASUPDLE.getRoster();
            const person = roster.find(m => m.id === id);
            if (person) submitGuess(person);
          } else if (items.length > 0) {
            // Pick first match by default
            const id = items[0].getAttribute('data-id');
            const roster = window.CREASUPDLE.getRoster();
            const person = roster.find(m => m.id === id);
            if (person) submitGuess(person);
          } else {
            const query = dom.searchInput ? dom.searchInput.value.trim() : '';
            if (query) {
              const matches = filterRoster(query);
              if (matches.length > 0) submitGuess(matches[0]);
            }
          }
        } else if (e.key === 'Escape') {
          if (dom.dropdown) dom.dropdown.classList.add('hidden');
        }
      });
    }

    // Submit button click
    if (dom.btnSubmit) {
      dom.btnSubmit.addEventListener('click', (e) => {
        e.preventDefault();
        const items = dom.dropdown ? dom.dropdown.querySelectorAll('.creasupdle-dropdown-item') : [];
        if (state.selectedDropdownIndex >= 0 && items[state.selectedDropdownIndex]) {
          const id = items[state.selectedDropdownIndex].getAttribute('data-id');
          const roster = window.CREASUPDLE.getRoster();
          const person = roster.find(m => m.id === id);
          if (person) submitGuess(person);
        } else if (items.length > 0) {
          const id = items[0].getAttribute('data-id');
          const roster = window.CREASUPDLE.getRoster();
          const person = roster.find(m => m.id === id);
          if (person) submitGuess(person);
        } else {
          const query = dom.searchInput ? dom.searchInput.value.trim() : '';
          if (query) {
            const matches = filterRoster(query);
            if (matches.length > 0) submitGuess(matches[0]);
          }
        }
      });
    }

    // Document click to close search dropdown
    document.addEventListener('click', (e) => {
      if (dom.dropdown && !dom.dropdown.contains(e.target) && e.target !== dom.searchInput) {
        dom.dropdown.classList.add('hidden');
      }
    });

    // Modals: Rules
    if (dom.btnRules && dom.rulesModal) {
      dom.btnRules.addEventListener('click', () => dom.rulesModal.classList.remove('hidden'));
    }
    if (dom.btnRulesClose && dom.rulesModal) {
      dom.btnRulesClose.addEventListener('click', () => dom.rulesModal.classList.add('hidden'));
    }

    // Modals: Roster & Trombinoscope
    if (dom.btnRoster && dom.rosterModal) {
      dom.btnRoster.addEventListener('click', () => {
        renderRosterList();
        dom.rosterModal.classList.remove('hidden');
      });
    }
    if (dom.btnRosterClose && dom.rosterModal) {
      dom.btnRosterClose.addEventListener('click', () => dom.rosterModal.classList.add('hidden'));
    }
    if (dom.btnAddMemberModal) {
      dom.btnAddMemberModal.addEventListener('click', openAddMemberModal);
    }
    if (dom.btnCancelMemberForm && dom.memberFormModal) {
      dom.btnCancelMemberForm.addEventListener('click', () => dom.memberFormModal.classList.add('hidden'));
    }
    if (dom.memberForm) {
      dom.memberForm.addEventListener('click', (e) => {
        const pill = e.target.closest('.form-pill-check');
        if (pill) {
          e.preventDefault();
          pill.classList.toggle('active');
        }
      });
      dom.memberForm.addEventListener('submit', handleSaveMember);
    }

    // Step 2 & 3: Author Form & Success Screen
    const authorForm = document.getElementById('creasupdle-author-form');
    if (authorForm) {
      authorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleAuthorSubmit(e);
      });
    }
    const btnAuthorSubmit = document.getElementById('btn-creasupdle-author-submit');
    if (btnAuthorSubmit) {
      btnAuthorSubmit.addEventListener('click', (e) => {
        e.preventDefault();
        handleAuthorSubmit(e);
      });
    }
    const authorInput = document.getElementById('member-author-nickname');
    if (authorInput) {
      authorInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAuthorSubmit(e);
        }
      });
    }
    const btnAuthorBack = document.getElementById('btn-creasupdle-author-back');
    if (btnAuthorBack) {
      btnAuthorBack.addEventListener('click', () => setModalStep('config'));
    }
    const btnSuccessClose = document.getElementById('btn-creasupdle-success-close');
    if (btnSuccessClose && dom.memberFormModal) {
      btnSuccessClose.addEventListener('click', () => {
        dom.memberFormModal.classList.add('hidden');
        setModalStep('config');
        pendingMemberSubmission = null;
      });
    }

    // Victory Modal Actions
    if (dom.btnWinShare) {
      dom.btnWinShare.addEventListener('click', handleShare);
    }
    if (dom.btnWinReplay) {
      dom.btnWinReplay.addEventListener('click', () => {
        startNewRound('infinite', true);
      });
    }
    if (dom.btnWinClose && dom.winModal) {
      dom.btnWinClose.addEventListener('click', () => dom.winModal.classList.add('hidden'));
    }

    // Stats modal button
    if (dom.btnStats) {
      dom.btnStats.addEventListener('click', openStatsModal);
    }
    if (dom.btnStatsClose && dom.statsModal) {
      dom.btnStatsClose.addEventListener('click', () => dom.statsModal.classList.add('hidden'));
    }
    if (dom.btnStatsDone && dom.statsModal) {
      dom.btnStatsDone.addEventListener('click', () => dom.statsModal.classList.add('hidden'));
    }

    // Dismiss modals when clicking on background overlay
    document.querySelectorAll('.creasupdle-modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.add('hidden');
      });
    });
  }

  // --- Public Entrypoint ---
  window.initCreasupdle = function() {
    cacheDom();
    attachEvents();
  };

  window.startCreasupdle = function(mode = 'daily') {
    cacheDom();
    startNewRound(mode);
  };

  window.openCreasupdle = function(mode = 'daily') {
    if (typeof window.showView === 'function') {
      window.showView('creasupdleGame');
    } else {
      document.querySelectorAll('.portal-container, .menu-container, .app-container').forEach(el => el.classList.add('view-hidden'));
      const game = document.getElementById('creasupdle-game-view');
      if (game) game.classList.remove('view-hidden');
    }
    if (typeof window.startCreasupdle === 'function') {
      window.startCreasupdle(mode);
    }
  };

  // Auto-initialize as soon as DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.initCreasupdle();
    });
  } else {
    window.initCreasupdle();
  }

})(window);
