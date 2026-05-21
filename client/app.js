const stopWords = new Set([
  'le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de', 'd', 'et', 'ou', 'a', 'à', 'au', 'aux',
  'en', 'dans', 'par', 'pour', 'sur', 'sous', 'avec', 'sans', 'est', 'sont', 'c', 'il', 'elle',
  'ils', 'elles', 'on', 'nous', 'vous', 'je', 'tu', 'ce', 'cet', 'cette', 'ces', 'mon', 'ton',
  'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses', 'se', 's', 'y', 'ne', 'pas', 'plus', 'qui', 'que',
  'quoi', 'dont', 'où', 'comment', 'pourquoi', 'quand', 'très', 'trop', 'peu', 'car', 'donc',
  'or', 'ni', 'mais', 'être', 'avoir', 'été', 'était', 'ont', 'as', 'avons', 'avez', 'suis',
  'es', 'sommes', 'êtes', 'fait', 'faire', 'peut', 'peuvent', 'moins', 'aussi', 'tout', 'tous',
  'toute', 'toutes', 'leur', 'leurs', 'comme', 'bien', 'puis', 'alors', 'ça', 'n', 'qu', 'j', 'm',
  't', 'jusqu', 'lors', 'depuis', 'entre', 'vers', 'chez', 'pendant', 'après', 'avant', 'selon',
  'cette', 'celui', 'celle', 'ceux', 'celles', 'ici', 'là', 'même', 'autres', 'autre', 'sur'
]);

// --- State Mappings ---
let gameState = { guesses: [], guessHistory: [], isWon: false, title: '', rawHtml: '' };
let currentRoomId = null;
let evtSource = null;
let selectedWord = null;
let selectedWordIndex = 0;
let hintsRemaining = 3;
let phraseHintUsed = false;

// Imposteur State
let imposteurState = {
  nickname: '',
  roomId: '',
  myWord: '',
  isHost: false,
  status: 'lobby',
  theme: 'general',
  players: {},
  turnOrder: [],
  currentTurnIndex: 0
};

// DOM Cache
const dom = {
  // Navigation & Core Views
  navLogo: document.getElementById('nav-logo'),
  navHome: document.getElementById('nav-home'),
  roomDisplay: document.getElementById('room-display'),
  roomCodeSpan: document.getElementById('room-code'),
  btnLeaveNav: document.getElementById('btn-leave-nav'),
  
  portalView: document.getElementById('portal-view'),
  theriMenuView: document.getElementById('theridactle-menu-view'),
  impMenuView: document.getElementById('imposteur-menu-view'),
  theriGameView: document.getElementById('game-view'),
  impGameView: document.getElementById('imposteur-game-view'),
  
  // Portal Cards
  cardTheridactle: document.getElementById('card-theridactle'),
  cardImposteur: document.getElementById('card-imposteur'),
  btnBackTheri: document.getElementById('btn-back-theridactle'),
  btnBackImp: document.getElementById('btn-back-imposteur'),

  // Theridactle Menu Controls
  btnSolo: document.getElementById('btn-solo'),
  btnCreateRoom: document.getElementById('btn-create-room'),
  btnJoinRoom: document.getElementById('btn-join-room'),
  joinRoomInput: document.getElementById('join-room-input'),
  theriMenuError: document.getElementById('theridactle-menu-error'),

  // Theridactle Play Controls
  loading: document.getElementById('loading'),
  articleContent: document.getElementById('article-content'),
  mainTitle: document.getElementById('main-title'),
  wikiText: document.getElementById('wiki-text'),
  winMessage: document.getElementById('win-message'),
  btnGiveUp: document.getElementById('btn-give-up'),
  leaveBtn: document.getElementById('leave-btn'),
  btnScrollTop: document.getElementById('btn-scroll-top'),
  mobileHandle: document.getElementById('mobile-handle'),
  sidebar: document.getElementById('sidebar'),
  hintCountTotal: document.getElementById('hint-count-total'),
  hintCountWord: document.getElementById('hint-count-word'),
  
  guessForm: document.getElementById('guess-form-desktop'),
  guessInput: document.getElementById('guess-input-desktop'),
  guessFormMobile: document.getElementById('guess-form-mobile'),
  guessInputMobile: document.getElementById('guess-input'),
  guessList: document.getElementById('guess-list'),
  guessTotal: document.getElementById('guess-total'),
  guessTotalDesktop: document.getElementById('guess-total-desktop'),

  // Imposteur Menu Controls
  impNicknameInput: document.getElementById('imposteur-nickname'),
  impJoinCodeInput: document.getElementById('imposteur-join-code'),
  btnImpCreate: document.getElementById('btn-imposteur-create'),
  btnImpJoin: document.getElementById('btn-imposteur-join'),
  impMenuError: document.getElementById('imposteur-menu-error'),

  // Imposteur Game Controls
  impLobbyPanel: document.getElementById('imposteur-lobby-panel'),
  impThemeSelect: document.getElementById('imposteur-theme-select'),
  btnImpStart: document.getElementById('btn-imposteur-start'),
  impStartHelper: document.getElementById('imposteur-start-helper'),

  impPlayPanel: document.getElementById('imposteur-play-panel'),
  impMyWordDisplay: document.getElementById('imposteur-my-word-display'),
  impTurnBar: document.getElementById('imposteur-turn-bar'),
  impTurnStatusText: document.getElementById('imposteur-turn-status-text'),
  impDescForm: document.getElementById('imposteur-desc-form'),
  impDescInput: document.getElementById('imposteur-desc-input'),
  impDescriptionsList: document.getElementById('imposteur-descriptions-list'),

  impVotePanel: document.getElementById('imposteur-vote-panel'),
  impVotingGrid: document.getElementById('imposteur-voting-grid'),

  impResultsPanel: document.getElementById('imposteur-results-panel'),
  impResultsEmoji: document.getElementById('imposteur-results-emoji'),
  impResultsTitle: document.getElementById('imposteur-results-title'),
  impResultsSubtitle: document.getElementById('imposteur-results-subtitle'),
  impRevealCivil: document.getElementById('imposteur-reveal-civil'),
  impRevealImpostor: document.getElementById('imposteur-reveal-impostor'),
  impRevealName: document.getElementById('imposteur-reveal-name'),
  btnImpRestart: document.getElementById('btn-imposteur-restart'),
  impRestartHelper: document.getElementById('imposteur-restart-helper'),

  impPlayersCount: document.getElementById('imposteur-players-count'),
  impPlayersList: document.getElementById('imposteur-players-list'),
};

const views = {
  portal: dom.portalView,
  theriMenu: dom.theriMenuView,
  impMenu: dom.impMenuView,
  theriGame: dom.theriGameView,
  impGame: dom.impGameView
};

// --- View Router ---
function showView(viewName) {
  Object.keys(views).forEach(key => {
    if (views[key]) {
      if (key === viewName) {
        views[key].classList.remove('view-hidden');
      } else {
        views[key].classList.add('view-hidden');
      }
    }
  });

  // Top Nav updates
  if (viewName === 'portal' || viewName === 'theriMenu' || viewName === 'impMenu') {
    dom.navHome.classList.add('active');
    dom.roomDisplay.style.display = 'none';
    dom.btnLeaveNav.style.display = 'none';
  } else {
    dom.navHome.classList.remove('active');
    dom.btnLeaveNav.style.display = 'block';
  }
}

// --- Leave Active Games ---
function confirmLeave() {
  const isTheriActive = views.theriGame && !views.theriGame.classList.contains('view-hidden');
  const isImpActive = views.impGame && !views.impGame.classList.contains('view-hidden');

  if (isTheriActive) {
    if (confirm("Voulez-vous quitter la partie coopérative de Theridactle en cours ?")) {
      leaveTheridactleRoom();
    }
  } else if (isImpActive) {
    if (confirm("Voulez-vous quitter le salon ou la partie en cours de L'Imposteur ?")) {
      leaveImposteurRoom();
    }
  } else {
    showView('portal');
  }
}

// --- Initialization ---
function init() {
  // Mobile Sidebar Toggle (Theridactle)
  if (dom.mobileHandle) {
    dom.mobileHandle.addEventListener('click', () => {
      dom.sidebar.classList.toggle('open');
    });
  }

  // Back Buttons
  if (dom.btnBackTheri) dom.btnBackTheri.addEventListener('click', () => showView('portal'));
  if (dom.btnBackImp) dom.btnBackImp.addEventListener('click', () => showView('portal'));

  // Nav clicks
  if (dom.navLogo) dom.navLogo.addEventListener('click', confirmLeave);
  if (dom.navHome) dom.navHome.addEventListener('click', (e) => { e.preventDefault(); confirmLeave(); });
  if (dom.btnLeaveNav) dom.btnLeaveNav.addEventListener('click', confirmLeave);

  // Portal routing
  if (dom.cardTheridactle) dom.cardTheridactle.addEventListener('click', () => showView('theriMenu'));
  if (dom.cardImposteur) dom.cardImposteur.addEventListener('click', () => showView('impMenu'));

  // --- Theridactle Menu Actions ---
  if (dom.btnSolo) dom.btnSolo.addEventListener('click', () => createTheridactleRoom(true));
  if (dom.btnCreateRoom) dom.btnCreateRoom.addEventListener('click', () => createTheridactleRoom(false));
  if (dom.btnJoinRoom) {
    dom.btnJoinRoom.addEventListener('click', () => {
      const code = dom.joinRoomInput.value.trim().toUpperCase();
      if (code.length >= 4) joinTheridactleRoom(code);
    });
  }
  if (dom.leaveBtn) dom.leaveBtn.addEventListener('click', leaveTheridactleRoom);
  
  if (dom.btnGiveUp) {
    dom.btnGiveUp.addEventListener('click', () => {
      if (confirm("Êtes-vous sûr de vouloir abandonner ? Vous découvrirez la réponse, mais la partie sera terminée pour tous les joueurs du salon.")) {
        fetch('/api/give-up', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: currentRoomId })
        });
      }
    });
  }
  
  if (dom.btnScrollTop) {
    dom.btnScrollTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Theridactle Hint Logic ---
  const btnHint = document.getElementById('btn-hint');
  const hintDropdown = document.getElementById('hint-dropdown');
  const btnRevealWord = document.getElementById('hint-reveal-word');
  const btnHintPhrase = document.getElementById('hint-phrase');
  
  if (btnHint && hintDropdown) {
    btnHint.addEventListener('click', () => {
      hintDropdown.style.display = hintDropdown.style.display === 'none' ? 'block' : 'none';
    });
  }
  
  if (btnRevealWord) {
    btnRevealWord.addEventListener('click', () => {
      hintDropdown.style.display = 'none';
      if (hintsRemaining <= 0) {
        alert("Vous n'avez plus d'indices disponibles pour cette partie !");
        return;
      }
      window.isHintMode = true;
      document.body.style.cursor = 'help';
    });
  }

  if (btnHintPhrase) {
    btnHintPhrase.addEventListener('click', () => {
      hintDropdown.style.display = 'none';
      if (phraseHintUsed) {
        alert("Vous avez déjà utilisé l'indice physique !");
        return;
      }
      phraseHintUsed = true;
      const hint = getPhysicalHint();
      document.getElementById('phrase-hint-text').textContent = hint;
      document.getElementById('phrase-hint-container').style.display = 'block';
    });
  }

  // Guess submission
  window.submitGuess = function(word) {
    if (!word || !currentRoomId) return;
    fetch('/api/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, roomId: currentRoomId })
    }).then(res => {
      if (res.ok) {
        if (dom.guessInput) dom.guessInput.value = '';
        if (dom.guessInputMobile) dom.guessInputMobile.value = '';
      }
    });
  };

  if (dom.guessForm) {
    dom.guessForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const word = dom.guessInput.value.trim();
      window.submitGuess(word);
    });
  }
  
  if (dom.guessFormMobile) {
    dom.guessFormMobile.addEventListener('submit', (e) => {
      e.preventDefault();
      const word = dom.guessInputMobile.value.trim();
      window.submitGuess(word);
    });
  }

  // --- L'Imposteur Menu Actions ---
  // Load saved pseudo from localStorage if present
  const savedNickname = localStorage.getItem('imposteur-nickname');
  if (savedNickname && dom.impNicknameInput) {
    dom.impNicknameInput.value = savedNickname;
  }

  if (dom.btnImpCreate) {
    dom.btnImpCreate.addEventListener('click', () => {
      const nickname = dom.impNicknameInput.value.trim();
      if (!nickname) {
        showImpMenuError('Veuillez saisir un pseudo pour créer un salon !');
        return;
      }
      showImpMenuError('');
      fetch('/api/imposteur/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname })
      })
      .then(res => res.json())
      .then(data => {
        if (data.roomId) {
          localStorage.setItem('imposteur-nickname', nickname);
          startPlayingImposteur(data.roomId, nickname);
        } else {
          showImpMenuError(data.error || 'Erreur lors de la création du salon.');
        }
      })
      .catch(() => showImpMenuError('Impossible de joindre le serveur.'));
    });
  }

  if (dom.btnImpJoin) {
    dom.btnImpJoin.addEventListener('click', () => {
      const nickname = dom.impNicknameInput.value.trim();
      const code = dom.impJoinCodeInput.value.trim().toUpperCase();
      if (!nickname) {
        showImpMenuError('Veuillez saisir un pseudo pour rejoindre un salon !');
        return;
      }
      if (!code || code.length < 4) {
        showImpMenuError('Veuillez entrer un code de salon valide (ex: WXYZ).');
        return;
      }
      showImpMenuError('');
      fetch('/api/imposteur/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: code, nickname })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem('imposteur-nickname', nickname);
          startPlayingImposteur(data.roomId, nickname);
        } else {
          showImpMenuError(data.error || 'Salon introuvable ou déjà complet.');
        }
      })
      .catch(() => showImpMenuError('Impossible de joindre le serveur.'));
    });
  }

  // --- L'Imposteur Game Actions ---
  if (dom.btnImpStart) {
    dom.btnImpStart.addEventListener('click', () => {
      const theme = dom.impThemeSelect.value;
      fetch('/api/imposteur/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: imposteurState.roomId, theme })
      });
    });
  }

  if (dom.impDescForm) {
    dom.impDescForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const description = dom.impDescInput.value.trim();
      if (!description) return;
      
      fetch('/api/imposteur/submit-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: imposteurState.roomId,
          nickname: imposteurState.nickname,
          description
        })
      }).then(res => {
        if (res.ok) {
          dom.impDescInput.value = '';
        }
      });
    });
  }

  if (dom.btnImpRestart) {
    dom.btnImpRestart.addEventListener('click', () => {
      fetch('/api/imposteur/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: imposteurState.roomId })
      });
    });
  }
}

// --- Theridactle APIs ---
function createTheridactleRoom(isSolo) {
  showTheriMenuError('');
  fetch('/api/room/create', { method: 'POST' })
    .then(r => r.json())
    .then(data => {
      if (data.roomId) startPlayingTheridactle(data.roomId, isSolo);
      else showTheriMenuError(data.error || 'Erreur lors de la création.');
    }).catch(() => showTheriMenuError('Serveur injoignable'));
}

function joinTheridactleRoom(roomId) {
  showTheriMenuError('');
  fetch('/api/room/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId })
  }).then(r => r.json()).then(data => {
    if (data.success) startPlayingTheridactle(data.roomId, false);
    else showTheriMenuError('Salon introuvable');
  });
}

function showTheriMenuError(msg) {
  dom.theriMenuError.textContent = msg;
  dom.theriMenuError.style.display = msg ? 'block' : 'none';
}

function startPlayingTheridactle(roomId, isSolo) {
  currentRoomId = roomId;
  showView('theriGame');
  
  if (!isSolo) {
    dom.roomDisplay.style.display = 'inline-block';
    dom.roomCodeSpan.textContent = roomId;
  } else {
    dom.roomDisplay.style.display = 'none';
  }

  hintsRemaining = 3;
  phraseHintUsed = false;
  document.getElementById('phrase-hint-container').style.display = 'none';
  updateHintUI();

  fetchTheridactleGame(roomId);
  connectTheridactleSSE(roomId);
}

function leaveTheridactleRoom() {
  if (evtSource) evtSource.close();
  currentRoomId = null;
  gameState = { guesses: [], guessHistory: [], isWon: false, title: '', rawHtml: '' };
  
  showView('portal');
  dom.winMessage.style.display = 'none';
  dom.joinRoomInput.value = '';
  dom.articleContent.classList.remove('is-won');
}

function connectTheridactleSSE(roomId) {
  if (evtSource) evtSource.close();
  evtSource = new EventSource(`/api/events?roomId=${roomId}`);
  
  evtSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    if (data.type === 'STATE') {
      gameState.guesses = data.state.guesses || [];
      gameState.guessHistory = data.state.guessHistory || [];
      gameState.isWon = data.state.isWon || false;
      updateSidebar();
      if (gameState.isWon) showWin();
    } 
    else if (data.type === 'GIVE_UP') {
      gameState.guesses = data.state.guesses || [];
      gameState.guessHistory = data.state.guessHistory || [];
      gameState.isWon = true;
      updateSidebar();
      showGiveUp();
    }
    else if (data.type === 'GUESS') {
      gameState.guesses.push({ root: data.root, raw: data.raw, display: data.word });
      gameState.guessHistory.unshift({ word: data.word, hits: data.hits });
      if (data.isWon) gameState.isWon = true;
      
      revealWord(data.root);
      if (gameState.isWon) showWin();
    }
  };
}

function fetchTheridactleGame(roomId) {
  dom.loading.style.display = 'block';
  dom.articleContent.style.display = 'none';
  
  fetch(`/api/game?roomId=${roomId}`)
    .then(r => r.json())
    .then(data => {
      gameState.rawHtml = data.html;
      gameState.title = data.title;
      gameState.isWon = data.isWon;
      gameState.imageUrl = data.imageUrl;
      renderArticle();
      dom.loading.style.display = 'none';
      dom.articleContent.style.display = 'block';
      if (gameState.isWon) showWin();
    });
}

// --- L'Imposteur Client Logic ---
function showImpMenuError(msg) {
  dom.impMenuError.textContent = msg;
  dom.impMenuError.style.display = msg ? 'block' : 'none';
}

function startPlayingImposteur(roomId, nickname) {
  showView('impGame');
  dom.roomDisplay.style.display = 'inline-block';
  dom.roomCodeSpan.textContent = roomId;
  
  imposteurState.roomId = roomId;
  imposteurState.nickname = nickname;
  imposteurState.myWord = '';
  
  connectImposteurSSE(roomId, nickname);
}

function leaveImposteurRoom() {
  if (evtSource) evtSource.close();
  imposteurState = {
    nickname: '',
    roomId: '',
    myWord: '',
    isHost: false,
    status: 'lobby',
    theme: 'general',
    players: {},
    turnOrder: [],
    currentTurnIndex: 0
  };
  
  showView('portal');
  dom.impJoinCodeInput.value = '';
  
  // reset panels visibility
  dom.impLobbyPanel.classList.remove('view-hidden');
  dom.impPlayPanel.classList.add('view-hidden');
  dom.impVotePanel.classList.add('view-hidden');
  dom.impResultsPanel.classList.add('view-hidden');
}

function connectImposteurSSE(roomId, nickname) {
  if (evtSource) evtSource.close();
  evtSource = new EventSource(`/api/events?roomId=${roomId}&nickname=${encodeURIComponent(nickname)}`);
  
  evtSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'IMPOSTEUR_STATE') {
      updateImposteurUI(data.state);
    }
  };
}

function updateImposteurUI(state) {
  imposteurState.status = state.status;
  imposteurState.theme = state.theme;
  imposteurState.players = state.players;
  imposteurState.turnOrder = state.turnOrder || [];
  imposteurState.currentTurnIndex = state.currentTurnIndex || 0;
  
  const playerNames = Object.keys(state.players);
  const myName = imposteurState.nickname;
  
  // Host detection
  const isHost = playerNames.length > 0 && playerNames[0] === myName;
  imposteurState.isHost = isHost;
  
  // Sidebar player list rendering
  dom.impPlayersCount.textContent = playerNames.length;
  dom.impPlayersList.innerHTML = '';
  
  playerNames.forEach(name => {
    const p = state.players[name];
    const li = document.createElement('li');
    li.className = 'player-item';
    
    const isPlayerHost = playerNames[0] === name;
    
    let badgeHtml = '';
    if (isPlayerHost) badgeHtml += `<span class="badge-item badge-host">⭐ Hôte</span>`;
    
    if (state.status === 'playing' || state.status === 'discussing') {
      const activePlayer = state.turnOrder[state.currentTurnIndex];
      if (name === activePlayer) {
        badgeHtml += `<span class="badge-item badge-thinking">💭 Décrit...</span>`;
      }
    }
    
    if (p.hasVoted) badgeHtml += `<span class="badge-item badge-voted">✅ Voté</span>`;
    if (p.isEliminated) badgeHtml += `<span class="badge-item badge-dead">💀 Éliminé</span>`;
    
    li.innerHTML = `
      <div class="player-info-left">
        <span class="player-avatar">${name.charAt(0)}</span>
        <span class="player-name">${name} ${name === myName ? '(Vous)' : ''}</span>
      </div>
      <div class="player-badges">
        ${badgeHtml}
      </div>
    `;
    dom.impPlayersList.appendChild(li);
  });
  
  // --- Game State Panel Toggles ---
  
  // 1. Lobby Phase
  if (state.status === 'lobby') {
    dom.impLobbyPanel.classList.remove('view-hidden');
    dom.impPlayPanel.classList.add('view-hidden');
    dom.impVotePanel.classList.add('view-hidden');
    dom.impResultsPanel.classList.add('view-hidden');
    
    dom.impThemeSelect.value = state.theme;
    
    if (isHost) {
      dom.impThemeSelect.disabled = false;
      dom.btnImpStart.style.display = 'block';
      
      if (playerNames.length >= 3) {
        dom.btnImpStart.removeAttribute('disabled');
        dom.impStartHelper.textContent = 'Assez de joueurs ! Lancez la partie quand vous le souhaitez.';
        dom.impStartHelper.style.color = '#34d399';
      } else {
        dom.btnImpStart.setAttribute('disabled', 'true');
        dom.impStartHelper.textContent = `En attente de joueurs (min 3, actuel: ${playerNames.length}).`;
        dom.impStartHelper.style.color = 'var(--text-muted)';
      }
    } else {
      dom.impThemeSelect.disabled = true;
      dom.btnImpStart.style.display = 'none';
      dom.impStartHelper.textContent = "Attente que l'hôte configure le thème et lance la partie...";
      dom.impStartHelper.style.color = 'var(--text-muted)';
    }
  }
  
  // 2. Playing Phase (Descriptions)
  if (state.status === 'playing') {
    dom.impLobbyPanel.classList.add('view-hidden');
    dom.impPlayPanel.classList.remove('view-hidden');
    dom.impVotePanel.classList.add('view-hidden');
    dom.impResultsPanel.classList.add('view-hidden');
    
    // Fetch my secret word if empty
    if (!imposteurState.myWord) {
      fetch(`/api/imposteur/my-word?roomId=${imposteurState.roomId}&nickname=${encodeURIComponent(myName)}`)
        .then(r => r.json())
        .then(data => {
          imposteurState.myWord = data.word || '';
          dom.impMyWordDisplay.textContent = imposteurState.myWord;
        });
    } else {
      dom.impMyWordDisplay.textContent = imposteurState.myWord;
    }
    
    // Check active turn
    const activePlayer = state.turnOrder[state.currentTurnIndex];
    const isMyTurn = (activePlayer === myName);
    
    const myPlayerState = state.players[myName];
    const isMeEliminated = myPlayerState ? myPlayerState.isEliminated : false;
    
    if (isMyTurn && !isMeEliminated) {
      dom.impTurnBar.classList.add('my-turn');
      dom.impTurnStatusText.textContent = "🔔 C'est à votre tour ! Entrez un mot ou une courte expression.";
      dom.impDescForm.classList.remove('view-hidden');
      dom.impDescInput.focus();
    } else if (isMeEliminated) {
      dom.impTurnBar.classList.remove('my-turn');
      dom.impTurnStatusText.textContent = `💀 Éliminé. Attente de la description de ${activePlayer}...`;
      dom.impDescForm.classList.add('view-hidden');
    } else {
      dom.impTurnBar.classList.remove('my-turn');
      dom.impTurnStatusText.textContent = `📢 C'est au tour de ${activePlayer} de donner sa description.`;
      dom.impDescForm.classList.add('view-hidden');
    }
    
    renderDescriptions(state);
  }
  
  // 3. Discussing Phase (Debates & Voting)
  if (state.status === 'discussing') {
    dom.impLobbyPanel.classList.add('view-hidden');
    dom.impPlayPanel.classList.remove('view-hidden'); // Keep secret word card and description feed visible
    dom.impVotePanel.classList.remove('view-hidden');
    dom.impResultsPanel.classList.add('view-hidden');
    
    dom.impTurnBar.classList.remove('my-turn');
    dom.impTurnStatusText.textContent = "🗳️ Phase de Vote : Débattez puis suspectez quelqu'un !";
    dom.impDescForm.classList.add('view-hidden');
    
    renderDescriptions(state);
    renderVotingGrid(state);
  }
  
  // 4. Game Over (Results)
  if (state.status === 'game_over') {
    dom.impLobbyPanel.classList.add('view-hidden');
    dom.impPlayPanel.classList.add('view-hidden');
    dom.impVotePanel.classList.add('view-hidden');
    dom.impResultsPanel.classList.remove('view-hidden');
    
    if (state.winner === 'civils') {
      dom.impResultsEmoji.textContent = '🏆';
      dom.impResultsTitle.textContent = 'Victoire des Citoyens !';
      dom.impResultsSubtitle.textContent = "L'imposteur a été éliminé et démasqué.";
    } else {
      dom.impResultsEmoji.textContent = '🕵️‍♂️';
      dom.impResultsTitle.textContent = "Victoire de l'Imposteur !";
      dom.impResultsSubtitle.textContent = "L'imposteur a trompé tout le monde et remporté la partie.";
    }
    
    dom.impRevealCivil.textContent = state.civilWord || '------';
    dom.impRevealImpostor.textContent = state.impostorWord || '------';
    dom.impRevealName.textContent = state.impostorNickname || '------';
    
    if (isHost) {
      dom.btnImpRestart.style.display = 'block';
      dom.impRestartHelper.style.display = 'none';
    } else {
      dom.btnImpRestart.style.display = 'none';
      dom.impRestartHelper.style.display = 'block';
      dom.impRestartHelper.textContent = "Attente que l'hôte relance une nouvelle partie...";
    }
  }
}

function renderDescriptions(state) {
  dom.impDescriptionsList.innerHTML = '';
  
  state.turnOrder.forEach(name => {
    const p = state.players[name];
    if (p && p.description) {
      const item = document.createElement('div');
      item.className = 'desc-item';
      item.innerHTML = `
        <span class="desc-player-avatar">${name.charAt(0)}</span>
        <div class="desc-content">
          <div class="desc-player-name">${name}</div>
          <div class="desc-player-bubble">« ${p.description} »</div>
        </div>
      `;
      dom.impDescriptionsList.appendChild(item);
    }
  });
}

function renderVotingGrid(state) {
  dom.impVotingGrid.innerHTML = '';
  
  const myName = imposteurState.nickname;
  const myPlayer = state.players[myName];
  const isMeEliminated = myPlayer ? myPlayer.isEliminated : false;
  
  // Count votes
  const voteCounts = {};
  Object.values(state.players).forEach(p => {
    if (p.votedFor) {
      voteCounts[p.votedFor] = (voteCounts[p.votedFor] || 0) + 1;
    }
  });
  
  Object.keys(state.players).forEach(name => {
    const p = state.players[name];
    const card = document.createElement('div');
    card.className = 'vote-card';
    
    if (p.isEliminated) {
      card.classList.add('eliminated');
    }
    
    const myVotedName = myPlayer ? myPlayer.votedFor : null;
    if (myVotedName === name) {
      card.classList.add('voted');
    }
    
    const count = voteCounts[name] || 0;
    const countBadgeHtml = count > 0 ? `<span class="vote-count-badge">🗳️ ${count} ${count > 1 ? 'votes' : 'vote'}</span>` : '';
    
    card.innerHTML = `
      <span class="vote-indicator">SUSPECTÉ</span>
      <span class="vote-avatar">${name.charAt(0)}</span>
      <span class="vote-name">${name} ${name === myName ? '(Vous)' : ''}</span>
      ${countBadgeHtml}
    `;
    
    // Add vote interaction
    if (!p.isEliminated && !isMeEliminated && name !== myName && !myVotedName) {
      card.addEventListener('click', () => {
        fetch('/api/imposteur/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: imposteurState.roomId,
            nickname: myName,
            votedNickname: name
          })
        });
      });
    } else {
      card.style.cursor = 'default';
    }
    
    dom.impVotingGrid.appendChild(card);
  });
}


// --- Theridactle Redaction Engine ---
function normalize(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function isStopWord(word) {
  return stopWords.has(normalize(word));
}

function getRoot(word) {
  let w = normalize(word);
  
  const irreg = {
    'suis': 'etre', 'es': 'etre', 'est': 'etre', 'sommes': 'etre', 'etes': 'etre', 'sont': 'etre', 'ete': 'etre', 'etais': 'etre', 'etait': 'etre', 'etions': 'etre', 'etiez': 'etre', 'etaient': 'etre', 'serai': 'etre', 'sera': 'etre', 'serons': 'etre', 'serez': 'etre', 'seront': 'etre', 'etre': 'etre',
    'ai': 'avoir', 'as': 'avoir', 'a': 'avoir', 'avons': 'avoir', 'avez': 'avoir', 'ont': 'avoir', 'avais': 'avoir', 'avait': 'avoir', 'avions': 'avoir', 'aviez': 'avoir', 'avaient': 'avoir', 'aurai': 'avoir', 'aura': 'avoir', 'aurons': 'avoir', 'aurez': 'avoir', 'auront': 'avoir', 'avoir': 'avoir',
    'vais': 'aller', 'vas': 'aller', 'va': 'aller', 'allons': 'aller', 'allez': 'aller', 'vont': 'aller', 'irai': 'aller', 'ira': 'aller', 'irons': 'aller', 'irez': 'aller', 'iront': 'aller', 'aller': 'aller',
    'fais': 'faire', 'fait': 'faire', 'faisons': 'faire', 'faites': 'faire', 'font': 'faire', 'ferai': 'faire', 'fera': 'faire', 'ferons': 'faire', 'ferez': 'faire', 'feront': 'faire', 'faire': 'faire',
    'peux': 'pouvoir', 'peut': 'pouvoir', 'pouvons': 'pouvoir', 'pouvez': 'pouvoir', 'peuvent': 'pouvoir', 'pourrai': 'pouvoir', 'pourra': 'pouvoir', 'pourrons': 'pouvoir', 'pourrez': 'pouvoir', 'pourront': 'pouvoir', 'pouvoir': 'pouvoir'
  };
  if (irreg[w]) return irreg[w];

  if (w.length < 4) return w;

  if (w.endsWith('aux')) return w.slice(0, -3) + 'al';
  if (w.endsWith('eux')) return w.slice(0, -1);
  if (w.endsWith('s')) w = w.slice(0, -1);
  if (w.endsWith('e') && w.length > 4) w = w.slice(0, -1);
  
  const suf = ['er', 'ir', 'ant', 'ai', 'as', 'ons', 'ez', 'ont', 'ais', 'ait', 'ions', 'iez', 'aient', 'erent', 'ees', 'ee', 'es'];
  for (let s of suf) {
    if (w.endsWith(s) && w.length - s.length >= 3) {
      return w.slice(0, -s.length);
    }
  }
  return w;
}

function createRedactedSpan(part, isTitle = false) {
  const norm = normalize(part);
  const root = getRoot(norm);
  
  if (isStopWord(part)) {
    return document.createTextNode(part);
  } else if (gameState.guesses.some(g => g.root === root) || gameState.isWon) {
    const span = document.createElement('span');
    span.textContent = part;
    span.className = 'revealed';
    if (norm === selectedWord && !gameState.isWon) {
        span.classList.add('highlight');
    }
    span.setAttribute('data-word', norm);
    return span;
  } else {
    const span = document.createElement('span');
    span.textContent = part;
    span.className = 'redacted';
    span.setAttribute('data-word', norm);
    span.setAttribute('data-original', part);
    span.setAttribute('data-length', part.length);
    span.onclick = () => { 
      if (window.isHintMode) {
        window.isHintMode = false;
        document.body.style.cursor = 'default';
        
        const normTitle = normalize(gameState.title);
        const titleWords = normTitle.split(/[^a-z0-9]+/gi).filter(w => w.length > 0);
        if (titleWords.includes(norm)) {
          alert("Vous ne pouvez pas utiliser d'indice sur le mot principal !");
          return;
        }

        hintsRemaining--;
        updateHintUI();

        const originalWord = span.getAttribute('data-original');
        window.submitGuess(originalWord);
      } else {
        span.classList.toggle('show-length');
        dom.guessInput.focus(); 
      }
    };
    return span;
  }
}

function renderArticle() {
  const highlights = document.querySelectorAll('.highlight');
  highlights.forEach(h => h.classList.remove('highlight'));

  dom.mainTitle.innerHTML = '';
  const titleParts = gameState.title.split(/([a-zA-ZÀ-ÿœŒ0-9]+)/g);
  titleParts.forEach(part => {
    if (/[a-zA-ZÀ-ÿœŒ0-9]+/.test(part)) {
      dom.mainTitle.appendChild(createRedactedSpan(part, true));
    } else {
      dom.mainTitle.appendChild(document.createTextNode(part));
    }
  });

  const container = document.createElement('div');
  container.innerHTML = gameState.rawHtml;
  
  const selectorsToRemove = [
    '.infobox', '.navbox', '.metadata', '.hatnote', '.ambox', 
    '.reference', '.noprint', 'style', 'script', '.thumb', '.mw-empty-elt',
    '.bandeau-portail', '.bandeau', '.toc'
  ];
  selectorsToRemove.forEach(sel => {
    container.querySelectorAll(sel).forEach(el => el.remove());
  });

  container.querySelectorAll('a').forEach(a => {
    const parent = a.parentNode;
    while(a.firstChild) parent.insertBefore(a.firstChild, a);
    parent.removeChild(a);
  });
  
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
  const nodesToReplace = [];

  let node;
  while (node = walker.nextNode()) {
    nodesToReplace.push(node);
  }

  nodesToReplace.forEach(node => {
    const text = node.nodeValue;
    const parts = text.split(/([a-zA-ZÀ-ÿœŒ0-9]+)/g);
    
    if (parts.length > 1) {
      const fragment = document.createDocumentFragment();
      parts.forEach(part => {
        if (/[a-zA-ZÀ-ÿœŒ0-9]+/.test(part)) {
          fragment.appendChild(createRedactedSpan(part, false));
        } else {
          fragment.appendChild(document.createTextNode(part));
        }
      });
      node.parentNode.replaceChild(fragment, node);
    }
  });

  dom.wikiText.innerHTML = '';
  dom.wikiText.appendChild(container);
}

function getPhysicalHint() {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = gameState.rawHtml;
  const fullText = tempDiv.textContent || tempDiv.innerText;
  const sentences = fullText.split(/[\.\!]\s+/);
  const keywords = ['mesure', 'longueur', 'hauteur', 'poids', 'tonnes', 'mètres', 'bipède', 'quadrupède', 'carnivore', 'herbivore', 'crâne', 'dents'];
  
  for (let s of sentences) {
    s = s.toLowerCase();
    if (keywords.some(k => s.includes(k)) && s.length < 250 && s.length > 30) {
      let result = s;
      const normTitle = normalize(gameState.title);
      const titleWords = normTitle.split(/[^a-z0-9]+/gi).filter(w => w.length > 2);
      
      titleWords.forEach(tw => {
        result = result.replace(new RegExp(`\\b${tw}\\b`, 'gi'), 'ce dinosaure');
      });
      return result.charAt(0).toUpperCase() + result.slice(1) + "...";
    }
  }
  return "Ce dinosaure préhistorique est un spécimen fascinant, bien que ses caractéristiques précises soient débattues...";
}

function revealWord(root) {
  const spans = document.querySelectorAll('.redacted');
  const matchingSpans = [];
  
  spans.forEach(span => {
    const spanNorm = span.getAttribute('data-word');
    if (getRoot(spanNorm) === root) {
      span.textContent = span.getAttribute('data-original');
      span.className = 'revealed';
      matchingSpans.push(span);
    }
  });
  
  if (matchingSpans.length > 0) {
    const guessObj = gameState.guesses.find(g => g.root === root);
    if (guessObj) selectWord(guessObj.display);
  } else {
    document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
    selectedWord = null;
    updateSidebar();
  }
}

function selectWord(displayWord) {
  if (selectedWord === displayWord) {
    selectedWordIndex++;
  } else {
    selectedWord = displayWord;
    selectedWordIndex = 0;
  }
  
  updateSidebar();
  
  const root = getRoot(displayWord);
  
  const allRevealed = document.querySelectorAll('.revealed');
  const spans = Array.from(allRevealed).filter(el => getRoot(el.getAttribute('data-word') || '') === root);
  
  document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
  
  if (spans.length > 0) {
    selectedWordIndex = selectedWordIndex % spans.length;
    const targetSpan = spans[selectedWordIndex];
    targetSpan.classList.add('highlight');
    targetSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function updateHintUI() {
  if (dom.hintCountTotal) dom.hintCountTotal.textContent = hintsRemaining;
  if (dom.hintCountWord) dom.hintCountWord.textContent = hintsRemaining;
}

function updateSidebar() {
  const count = gameState.guessHistory.length;
  dom.guessTotal.textContent = count;
  if (dom.guessTotalDesktop) dom.guessTotalDesktop.textContent = count;
  dom.guessList.innerHTML = '';
  
  let rank = gameState.guessHistory.length;
  gameState.guessHistory.forEach(guess => {
    const li = document.createElement('li');
    if (guess.hits > 0) li.classList.add('hit');
    if (guess.word === selectedWord) li.classList.add('selected');
    
    li.innerHTML = `
      <span class="col-rank">#${rank}</span>
      <span class="col-word">${guess.word}</span>
      <span class="col-hits">${guess.hits > 0 ? guess.hits : 0}</span>
    `;
    
    if (guess.hits > 0) {
      li.style.cursor = 'pointer';
      li.onclick = () => selectWord(guess.word);
    }
    
    dom.guessList.appendChild(li);
    rank--;
  });
}

function showWin() {
  dom.winMessage.innerHTML = '<h2>Félicitations !</h2><p>Vous avez trouvé le dinosaure !</p>';
  if (gameState.imageUrl) {
    dom.winMessage.innerHTML += `<img src="${gameState.imageUrl}" style="max-width:100%; border-radius:12px; margin-top:1.5rem; box-shadow: 0 8px 30px rgba(0,0,0,0.5);">`;
  }
  dom.winMessage.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
  dom.winMessage.style.borderColor = 'rgba(16, 185, 129, 0.4)';
  dom.winMessage.style.display = 'block';
  dom.articleContent.classList.add('is-won');
  
  const spans = document.querySelectorAll('.redacted');
  spans.forEach(span => {
    span.textContent = span.getAttribute('data-original');
    span.className = 'revealed';
  });
}

function showGiveUp() {
  dom.winMessage.innerHTML = '<h2>Vous avez abandonné !</h2><p>Le dinosaure était : <strong>' + gameState.title + '</strong></p>';
  if (gameState.imageUrl) {
    dom.winMessage.innerHTML += `<img src="${gameState.imageUrl}" style="max-width:100%; border-radius:12px; margin-top:1.5rem; box-shadow: 0 8px 30px rgba(0,0,0,0.5);">`;
  }
  dom.winMessage.style.backgroundColor = 'rgba(244, 63, 94, 0.15)';
  dom.winMessage.style.borderColor = 'rgba(244, 63, 94, 0.4)';
  dom.winMessage.style.display = 'block';
  dom.articleContent.classList.add('is-won');
  
  const spans = document.querySelectorAll('.redacted');
  spans.forEach(span => {
    span.textContent = span.getAttribute('data-original');
    span.className = 'revealed';
  });
}

// --- Run Init ---
init();
