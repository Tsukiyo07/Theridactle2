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

// Geographie State
let geographieState = {
  nickname: '',
  roomId: '',
  isHost: false,
  status: 'lobby',
  mode: 'drapeaux',
  scope: 'monde',
  questionCount: 10,
  currentQuestionIndex: 0,
  players: {},
  question: null,
  leaderboard: []
};
let geoCountdownInterval = null;

// Loup-Garou State
let loupGarouState = {
  nickname: '',
  roomId: '',
  isHost: false,
  status: 'lobby',
  players: {},
  historyLogs: [],
  rolesConfig: {},
  myRole: null,
  myAlive: false,
  myCouple: false,
  nightState: {},
  winner: null,
  privateActionData: null
};
let geoTimeRemaining = 15;

// DOM Cache
const dom = {
  // Navigation & Core Views
  navLogo: document.getElementById('nav-logo'),
  navHome: document.getElementById('nav-home'),
  roomDisplay: document.getElementById('room-display'),
  roomCodeSpan: document.getElementById('room-code'),
  btnCopyInvite: document.getElementById('btn-copy-invite'),
  btnLeaveNav: document.getElementById('btn-leave-nav'),
  
  portalView: document.getElementById('portal-view'),
  theriMenuView: document.getElementById('theridactle-menu-view'),
  impMenuView: document.getElementById('imposteur-menu-view'),
  geoMenuView: document.getElementById('geographie-menu-view'),
  theriGameView: document.getElementById('game-view'),
  impGameView: document.getElementById('imposteur-game-view'),
  geoGameView: document.getElementById('geographie-game-view'),
  
  // Portal Cards
  cardTheridactle: document.getElementById('card-theridactle'),
  cardImposteur: document.getElementById('card-imposteur'),
  cardGeographie: document.getElementById('card-geographie'),
  btnBackTheri: document.getElementById('btn-back-theridactle'),
  btnBackImp: document.getElementById('btn-back-imposteur'),
  btnBackGeo: document.getElementById('btn-back-geographie'),

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
  impImpostorCountSelect: document.getElementById('imposteur-count-select'),
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

  cardLoupGarou: document.getElementById('card-loup-garou'),
  btnBackLoupGarou: document.getElementById('btn-back-loup-garou'),
  lgMenuView: document.getElementById('loup-garou-menu-view'),
  lgGameView: document.getElementById('loup-garou-game-view'),
};

const views = {
  portal: dom.portalView,
  theriMenu: dom.theriMenuView,
  impMenu: dom.impMenuView,
  geoMenu: dom.geoMenuView,
  lgMenu: document.getElementById('loup-garou-menu-view'),
  theriGame: dom.theriGameView,
  impGame: dom.impGameView,
  geoGame: dom.geoGameView,
  lgGame: document.getElementById('loup-garou-game-view')
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
  if (viewName === 'portal' || viewName === 'theriMenu' || viewName === 'impMenu' || viewName === 'geoMenu') {
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
  const isGeoActive = views.geoGame && !views.geoGame.classList.contains('view-hidden');
  const isLgActive = views.lgGame && !views.lgGame.classList.contains('view-hidden');

  if (isTheriActive) {
    if (confirm("Voulez-vous quitter la partie coopérative de Theridactle en cours ?")) {
      leaveTheridactleRoom();
    }
  } else if (isImpActive) {
    if (confirm("Voulez-vous quitter le salon ou la partie en cours de L'Imposteur ?")) {
      leaveImposteurRoom();
    }
  } else if (isGeoActive) {
    if (confirm("Voulez-vous quitter le salon ou la partie en cours du Quiz Géographie ?")) {
      leaveGeographieRoom();
    }
  } else if (isLgActive) {
    if (confirm("Voulez-vous quitter le village ou la partie en cours de Loup-Garou ?")) {
      leaveLoupGarouRoom();
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
  if (dom.btnBackGeo) dom.btnBackGeo.addEventListener('click', () => showView('portal'));

  // Nav clicks
  if (dom.navLogo) dom.navLogo.addEventListener('click', confirmLeave);
  if (dom.navHome) dom.navHome.addEventListener('click', (e) => { e.preventDefault(); confirmLeave(); });
  if (dom.btnLeaveNav) dom.btnLeaveNav.addEventListener('click', confirmLeave);
  if (dom.btnCopyInvite) dom.btnCopyInvite.addEventListener('click', copyInvitationLink);

  // Portal routing
  if (dom.cardTheridactle) dom.cardTheridactle.addEventListener('click', () => showView('theriMenu'));
  if (dom.cardImposteur) dom.cardImposteur.addEventListener('click', () => showView('impMenu'));
  if (dom.cardGeographie) dom.cardGeographie.addEventListener('click', () => showView('geoMenu'));

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
          localStorage.setItem('imposteur-roomId', data.roomId);
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
          localStorage.setItem('imposteur-roomId', data.roomId);
          startPlayingImposteur(data.roomId, nickname);
        } else {
          showImpMenuError(data.error || 'Salon introuvable ou déjà complet.');
        }
      })
      .catch(() => showImpMenuError('Impossible de joindre le serveur.'));
    });
  }

  // --- L'Imposteur Game Actions ---
  if (dom.impThemeSelect) {
    dom.impThemeSelect.addEventListener('change', () => {
      if (imposteurState.isHost) {
        fetch('/api/imposteur/theme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: imposteurState.roomId, theme: dom.impThemeSelect.value })
        });
      }
    });
  }

  const roundsSelect = document.getElementById('imposteur-rounds-select');
  if (roundsSelect) {
    roundsSelect.addEventListener('change', () => {
      if (imposteurState.isHost) {
        fetch('/api/imposteur/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: imposteurState.roomId, descriptionRounds: parseInt(roundsSelect.value) })
        });
      }
    });
  }

  const impostorCountSelect = document.getElementById('imposteur-count-select');
  if (impostorCountSelect) {
    impostorCountSelect.addEventListener('change', () => {
      if (imposteurState.isHost) {
        fetch('/api/imposteur/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: imposteurState.roomId, impostorCount: parseInt(impostorCountSelect.value) })
        });
      }
    });
  }

  const btnResetScores = document.getElementById('btn-imposteur-reset-scores');
  if (btnResetScores) {
    btnResetScores.addEventListener('click', () => {
      if (imposteurState.isHost && confirm('Voulez-vous vraiment réinitialiser les scores de tous les joueurs à 0 ?')) {
        fetch('/api/imposteur/reset-scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: imposteurState.roomId })
        });
      }
    });
  }

  if (dom.btnImpStart) {
    dom.btnImpStart.addEventListener('click', () => {
      const theme = dom.impThemeSelect.value;
      const rounds = roundsSelect ? parseInt(roundsSelect.value) : 1;
      const impostorCount = impostorCountSelect ? parseInt(impostorCountSelect.value) : 1;
      fetch('/api/imposteur/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: imposteurState.roomId, theme, descriptionRounds: rounds, impostorCount: impostorCount })
      })
      .then(res => res.json())
      .then(data => {
        if (!data.success && data.error) {
          showToast(data.error, 'error');
        }
      })
      .catch(err => {
        console.error('Failed to start game', err);
        showToast('Impossible de lancer la partie.', 'error');
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

  const btnTally = document.getElementById('btn-imposteur-tally');
  if (btnTally) {
    btnTally.addEventListener('click', () => {
      if (imposteurState.isHost) {
        fetch('/api/imposteur/tally-votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: imposteurState.roomId })
        });
      }
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

  // --- Geographie Menu Actions ---
  const savedGeoNickname = localStorage.getItem('geographie-nickname');
  const geoNicknameInput = document.getElementById('geographie-nickname');
  if (savedGeoNickname && geoNicknameInput) {
    geoNicknameInput.value = savedGeoNickname;
  }

  const btnGeoCreate = document.getElementById('btn-geographie-create');
  if (btnGeoCreate) {
    btnGeoCreate.addEventListener('click', () => {
      const nickname = geoNicknameInput.value.trim();
      if (!nickname) {
        showGeoMenuError('Veuillez saisir un pseudo pour créer un salon !');
        return;
      }
      showGeoMenuError('');
      fetch('/api/geographie/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname })
      })
      .then(res => res.json())
      .then(data => {
        if (data.roomId) {
          localStorage.setItem('geographie-nickname', nickname);
          startPlayingGeographie(data.roomId, nickname);
        } else {
          showGeoMenuError(data.error || 'Erreur lors de la création du salon.');
        }
      })
      .catch(() => showGeoMenuError('Impossible de joindre le serveur.'));
    });
  }

  const btnGeoJoin = document.getElementById('btn-geographie-join');
  const geoJoinCodeInput = document.getElementById('geographie-join-code');
  if (btnGeoJoin) {
    btnGeoJoin.addEventListener('click', () => {
      const nickname = geoNicknameInput.value.trim();
      const code = geoJoinCodeInput.value.trim().toUpperCase();
      if (!nickname) {
        showGeoMenuError('Veuillez saisir un pseudo pour rejoindre un salon !');
        return;
      }
      if (!code || code.length < 4) {
        showGeoMenuError('Veuillez entrer un code de salon valide (ex: ABCD).');
        return;
      }
      showGeoMenuError('');
      fetch('/api/geographie/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: code, nickname })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem('geographie-nickname', nickname);
          startPlayingGeographie(data.roomId, nickname);
        } else {
          showGeoMenuError(data.error || 'Salon introuvable ou déjà complet.');
        }
      })
      .catch(() => showGeoMenuError('Impossible de joindre le serveur.'));
    });
  }

  // Lobby change listeners
  const geoModeSelect = document.getElementById('geographie-mode-select');
  const geoScopeSelect = document.getElementById('geographie-scope-select');
  const geoCountSelect = document.getElementById('geographie-count-select');

  const onGeoSettingChange = () => {
    if (geographieState.isHost) {
      fetch('/api/geographie/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: geographieState.roomId,
          mode: geoModeSelect.value,
          scope: geoScopeSelect.value,
          questionCount: parseInt(geoCountSelect.value)
        })
      });
    }
  };

  if (geoModeSelect) geoModeSelect.addEventListener('change', onGeoSettingChange);
  if (geoScopeSelect) geoScopeSelect.addEventListener('change', onGeoSettingChange);
  if (geoCountSelect) geoCountSelect.addEventListener('change', onGeoSettingChange);

  const btnGeoStart = document.getElementById('btn-geographie-start');
  if (btnGeoStart) {
    btnGeoStart.addEventListener('click', () => {
      fetch('/api/geographie/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: geographieState.roomId })
      });
    });
  }

  const btnGeoNext = document.getElementById('btn-geographie-next');
  if (btnGeoNext) {
    btnGeoNext.addEventListener('click', () => {
      fetch('/api/geographie/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: geographieState.roomId })
      });
    });
  }

  const btnGeoRestart = document.getElementById('btn-geographie-restart');
  if (btnGeoRestart) {
    btnGeoRestart.addEventListener('click', () => {
      fetch('/api/geographie/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: geographieState.roomId })
      });
    });
  }

  const btnGeoSubmitText = document.getElementById('btn-geographie-submit-text');
  const inputGeoText = document.getElementById('geographie-text-answer');
  
  const submitTextAnswer = () => {
    if (!inputGeoText) return;
    const answer = inputGeoText.value.trim();
    submitGeoAnswer(answer);
    
    inputGeoText.disabled = true;
    if (btnGeoSubmitText) btnGeoSubmitText.disabled = true;
  };
  
  if (btnGeoSubmitText) {
    btnGeoSubmitText.addEventListener('click', submitTextAnswer);
  }
  if (inputGeoText) {
    inputGeoText.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        submitTextAnswer();
      }
    });
  }

  // 1. Silent Auto-reconnect for L'Imposteur
  const activeRoomId = localStorage.getItem('imposteur-roomId');
  const activeNickname = localStorage.getItem('imposteur-nickname');
  if (activeRoomId && activeNickname) {
    console.log(`Silent auto-reconnection to ${activeRoomId} as ${activeNickname}`);
    fetch('/api/imposteur/room/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: activeRoomId, nickname: activeNickname })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        startPlayingImposteur(data.roomId, activeNickname);
      } else {
        localStorage.removeItem('imposteur-roomId');
      }
    })
    .catch(() => console.log('Reconnection failed'));
  }

  // 2. Silent Auto-reconnect for Loup-Garou
  const lgActiveRoomId = localStorage.getItem('loup-garou-roomId');
  const lgActiveNickname = localStorage.getItem('loup-garou-nickname');
  if (lgActiveRoomId && lgActiveNickname) {
    console.log(`Silent auto-reconnection to Loup-Garou room ${lgActiveRoomId} as ${lgActiveNickname}`);
    fetch('/api/loup-garou/room/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: lgActiveRoomId, nickname: lgActiveNickname })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        startPlayingLoupGarou(data.roomId, lgActiveNickname);
      } else {
        localStorage.removeItem('loup-garou-roomId');
      }
    })
    .catch(() => console.log('Loup-Garou reconnection failed'));
  }

  // Helper function to handle manual routing with neon glows
  function routeToManualJoin(gameType, code) {
    if (gameType === 'imposteur') {
      showView('impMenu');
      if (dom.impJoinCodeInput) {
        dom.impJoinCodeInput.value = code;
      }
      const nickInput = dom.impNicknameInput;
      if (nickInput) {
        nickInput.focus();
        nickInput.style.borderColor = 'var(--neon-pink)';
        nickInput.style.boxShadow = '0 0 15px rgba(236, 72, 153, 0.5)';
      }
    } else if (gameType === 'geographie') {
      showView('geoMenu');
      const geoInput = document.getElementById('geographie-join-code');
      if (geoInput) {
        geoInput.value = code;
      }
      const nickInput = document.getElementById('geographie-nickname');
      if (nickInput) {
        nickInput.focus();
        nickInput.style.borderColor = 'var(--neon-cyan)';
        nickInput.style.boxShadow = '0 0 15px rgba(6, 182, 212, 0.5)';
      }
    } else if (gameType === 'loup_garou') {
      showView('lgMenu');
      const lgInput = document.getElementById('loup-garou-join-code');
      if (lgInput) {
        lgInput.value = code;
      }
      const nickInput = document.getElementById('loup-garou-nickname');
      if (nickInput) {
        nickInput.focus();
        nickInput.style.borderColor = '#ef4444';
        nickInput.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.5)';
      }
    }
  }

  // 3. Invitation link detection & auto-join correction
  const urlParams = new URLSearchParams(window.location.search);
  const inviteRoom = urlParams.get('room');
  if (inviteRoom) {
    const code = inviteRoom.trim().toUpperCase();
    
    // Clean URL query parameters immediately using replaceState to prevent reload loops
    window.history.replaceState({}, document.title, window.location.pathname);
    
    fetch(`/api/room/check?roomId=${code}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const gameType = data.gameType;
          
          let savedNickname = '';
          if (gameType === 'imposteur') {
            savedNickname = localStorage.getItem('imposteur-nickname');
          } else if (gameType === 'geographie') {
            savedNickname = localStorage.getItem('geographie-nickname');
          } else if (gameType === 'loup_garou') {
            savedNickname = localStorage.getItem('loup-garou-nickname');
          }
          
          if (savedNickname && gameType !== 'theridactle') {
            console.log(`Auto-joining room ${code} as ${savedNickname} for game ${gameType}`);
            fetch(`/api/${gameType}/room/join`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ roomId: code, nickname: savedNickname })
            })
            .then(res => res.json())
            .then(joinData => {
              if (joinData.success) {
                localStorage.setItem(`${gameType}-roomId`, code);
                if (gameType === 'imposteur') {
                  startPlayingImposteur(code, savedNickname);
                } else if (gameType === 'geographie') {
                  startPlayingGeographie(code, savedNickname);
                } else if (gameType === 'loup_garou') {
                  startPlayingLoupGarou(code, savedNickname);
                }
                showToast("Reconnexion automatique réussie !");
              } else {
                routeToManualJoin(gameType, code);
              }
            })
            .catch(() => routeToManualJoin(gameType, code));
          } else {
            if (gameType === 'theridactle') {
              joinTheridactleRoom(code);
            } else {
              routeToManualJoin(gameType, code);
            }
          }
        } else {
          showToast("Ce salon n'existe plus ou a expiré.", "error");
          localStorage.removeItem('imposteur-roomId');
          localStorage.removeItem('loup-garou-roomId');
        }
      })
      .catch(err => {
        console.error('Check invitation failed', err);
        showToast("Erreur lors de la vérification du salon.", "error");
      });
  }

  // --- Loup-Garou Menu Actions ---
  if (dom.cardLoupGarou) {
    dom.cardLoupGarou.addEventListener('click', () => {
      showView('lgMenu');
      const saved = localStorage.getItem('loup-garou-nickname');
      if (saved) {
        const nickInput = document.getElementById('loup-garou-nickname');
        if (nickInput) nickInput.value = saved;
      }
    });
  }
  
  if (dom.btnBackLoupGarou) {
    dom.btnBackLoupGarou.addEventListener('click', () => showView('portal'));
  }

  const btnLgCreate = document.getElementById('btn-loup-garou-create');
  if (btnLgCreate) {
    btnLgCreate.addEventListener('click', () => {
      const nicknameInput = document.getElementById('loup-garou-nickname');
      const nickname = nicknameInput ? nicknameInput.value.trim() : '';
      if (!nickname) {
        showLgMenuError('Veuillez saisir un pseudo pour créer un village !');
        return;
      }
      showLgMenuError('');
      fetch('/api/loup-garou/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname })
      })
      .then(res => res.json())
      .then(data => {
        if (data.roomId) {
          localStorage.setItem('loup-garou-nickname', nickname);
          localStorage.setItem('loup-garou-roomId', data.roomId);
          startPlayingLoupGarou(data.roomId, nickname);
        } else {
          showLgMenuError(data.error || 'Erreur lors de la création du village.');
        }
      })
      .catch(() => showLgMenuError('Impossible de joindre le serveur.'));
    });
  }

  const btnLgJoin = document.getElementById('btn-loup-garou-join');
  if (btnLgJoin) {
    btnLgJoin.addEventListener('click', () => {
      const nicknameInput = document.getElementById('loup-garou-nickname');
      const nickname = nicknameInput ? nicknameInput.value.trim() : '';
      const codeInput = document.getElementById('loup-garou-join-code');
      const code = codeInput ? codeInput.value.trim().toUpperCase() : '';
      
      if (!nickname) {
        showLgMenuError('Veuillez saisir un pseudo pour rejoindre un village !');
        return;
      }
      if (!code || code.length < 4) {
        showLgMenuError('Veuillez entrer un code de village valide (ex: WXYZ).');
        return;
      }
      showLgMenuError('');
      fetch('/api/loup-garou/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: code, nickname })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem('loup-garou-nickname', nickname);
          localStorage.setItem('loup-garou-roomId', data.roomId);
          startPlayingLoupGarou(data.roomId, nickname);
        } else {
          showLgMenuError(data.error || 'Village introuvable, déjà complet ou pseudo pris.');
        }
      })
      .catch(() => showLgMenuError('Impossible de joindre le serveur.'));
    });
  }

  const btnLgTtsToggle = document.getElementById('btn-loup-garou-tts-toggle');
  if (btnLgTtsToggle) {
    const ttsEnabled = localStorage.getItem('loup-garou-tts-enabled') !== 'false';
    const ttsIcon = document.getElementById('loup-garou-tts-icon');
    if (ttsIcon) ttsIcon.textContent = ttsEnabled ? '🔊' : '🔇';
    btnLgTtsToggle.innerHTML = `${ttsEnabled ? '<span id="loup-garou-tts-icon">🔊</span> Vocaux activés' : '<span id="loup-garou-tts-icon">🔇</span> Vocaux coupés'}`;
    
    btnLgTtsToggle.addEventListener('click', () => {
      const current = localStorage.getItem('loup-garou-tts-enabled') !== 'false';
      const next = !current;
      localStorage.setItem('loup-garou-tts-enabled', next ? 'true' : 'false');
      const icon = document.getElementById('loup-garou-tts-icon');
      if (icon) icon.textContent = next ? '🔊' : '🔇';
      btnLgTtsToggle.innerHTML = `${next ? '<span id="loup-garou-tts-icon">🔊</span> Vocaux activés' : '<span id="loup-garou-tts-icon">🔇</span> Vocaux coupés'}`;
      showToast(next ? "Narrateur vocal activé 🔊" : "Narrateur vocal désactivé 🔇");
    });
  }

  const btnLgVoleurSkip = document.getElementById('btn-loup-garou-voleur-skip');
  if (btnLgVoleurSkip) {
    btnLgVoleurSkip.addEventListener('click', () => {
      fetch('/api/loup-garou/night-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: loupGarouState.roomId,
          nickname: loupGarouState.nickname,
          actionType: 'voleur',
          targetName: ''
        })
      });
    });
  }

  const btnLgStart = document.getElementById('btn-loup-garou-start');
  if (btnLgStart) {
    btnLgStart.addEventListener('click', () => {
      if (loupGarouState.isHost) {
        fetch('/api/loup-garou/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: loupGarouState.roomId })
        })
        .then(res => res.json())
        .then(data => {
          if (!data.success) {
            alert(data.error || "Impossible de lancer la partie.");
          }
        });
      }
    });
  }

  const btnLgTally = document.getElementById('btn-loup-garou-tally');
  if (btnLgTally) {
    btnLgTally.addEventListener('click', () => {
      if (loupGarouState.isHost) {
        fetch('/api/loup-garou/tally', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: loupGarouState.roomId })
        });
      }
    });
  }

  const btnLgRestart = document.getElementById('btn-loup-garou-restart');
  if (btnLgRestart) {
    btnLgRestart.addEventListener('click', () => {
      if (loupGarouState.isHost) {
        fetch('/api/loup-garou/restart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: loupGarouState.roomId })
        });
      }
    });
  }

  const btnLgCupid = document.getElementById('btn-loup-garou-cupid-submit');
  if (btnLgCupid) {
    btnLgCupid.addEventListener('click', () => {
      const targetName = document.getElementById('loup-garou-cupid-lover1').value;
      const targetName2 = document.getElementById('loup-garou-cupid-lover2').value;
      if (targetName === targetName2) {
        alert("Cupidon doit choisir deux personnes différentes !");
        return;
      }
      fetch('/api/loup-garou/night-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: loupGarouState.roomId,
          nickname: loupGarouState.nickname,
          actionType: 'cupidon',
          targetName,
          targetName2
        })
      });
    });
  }

  const btnLgGarde = document.getElementById('btn-loup-garou-garde-submit');
  if (btnLgGarde) {
    btnLgGarde.addEventListener('click', () => {
      const targetName = document.getElementById('loup-garou-garde-target').value;
      fetch('/api/loup-garou/night-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: loupGarouState.roomId,
          nickname: loupGarouState.nickname,
          actionType: 'garde',
          targetName
        })
      });
    });
  }

  const btnLgVoyante = document.getElementById('btn-loup-garou-voyante-submit');
  if (btnLgVoyante) {
    btnLgVoyante.addEventListener('click', () => {
      const targetName = document.getElementById('loup-garou-voyante-target').value;
      fetch('/api/loup-garou/night-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: loupGarouState.roomId,
          nickname: loupGarouState.nickname,
          actionType: 'voyante',
          targetName
        })
      });
    });
  }

  const btnLgWolf = document.getElementById('btn-loup-garou-wolf-submit');
  if (btnLgWolf) {
    btnLgWolf.addEventListener('click', () => {
      const targetName = document.getElementById('loup-garou-wolf-target').value;
      fetch('/api/loup-garou/night-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: loupGarouState.roomId,
          nickname: loupGarouState.nickname,
          actionType: 'loup',
          targetName
        })
      });
    });
  }

  const btnLgWitchHeal = document.getElementById('btn-loup-garou-witch-heal');
  if (btnLgWitchHeal) {
    btnLgWitchHeal.addEventListener('click', () => {
      fetch('/api/loup-garou/night-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: loupGarouState.roomId,
          nickname: loupGarouState.nickname,
          actionType: 'sorciere_heal'
        })
      }).then(() => {
        btnLgWitchHeal.disabled = true;
        btnLgWitchHeal.style.opacity = '0.5';
      });
    });
  }

  const btnLgWitchKill = document.getElementById('btn-loup-garou-witch-kill');
  if (btnLgWitchKill) {
    btnLgWitchKill.addEventListener('click', () => {
      const selectBox = document.getElementById('loup-garou-witch-kill-select-box');
      if (selectBox) {
        selectBox.classList.remove('view-hidden');
      }
    });
  }

  const btnLgWitchSkip = document.getElementById('btn-loup-garou-witch-skip');
  if (btnLgWitchSkip) {
    btnLgWitchSkip.addEventListener('click', () => {
      fetch('/api/loup-garou/night-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: loupGarouState.roomId,
          nickname: loupGarouState.nickname,
          actionType: 'sorciere_skip'
        })
      });
    });
  }

  const witchKillTargetSelect = document.getElementById('loup-garou-witch-kill-target');
  if (witchKillTargetSelect) {
    witchKillTargetSelect.addEventListener('change', () => {
      const targetName = witchKillTargetSelect.value;
      if (targetName && confirm(`Voulez-vous vraiment empoisonner ${targetName} ?`)) {
        fetch('/api/loup-garou/night-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: loupGarouState.roomId,
            nickname: loupGarouState.nickname,
            actionType: 'sorciere_kill',
            targetName
          })
        }).then(() => {
          const selectBox = document.getElementById('loup-garou-witch-kill-select-box');
          if (selectBox) selectBox.classList.add('view-hidden');
        });
      }
    });
  }

  const btnLgHunter = document.getElementById('btn-loup-garou-hunter-submit');
  if (btnLgHunter) {
    btnLgHunter.addEventListener('click', () => {
      const targetName = document.getElementById('loup-garou-hunter-target').value;
      if (!targetName) return;
      fetch('/api/loup-garou/hunter-shot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: loupGarouState.roomId,
          nickname: loupGarouState.nickname,
          targetName
        })
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
  
  localStorage.removeItem('imposteur-roomId');
  showView('portal');
  dom.impJoinCodeInput.value = '';
  
  // reset panels visibility
  dom.impLobbyPanel.classList.remove('view-hidden');
  dom.impPlayPanel.classList.add('view-hidden');
  dom.impVotePanel.classList.add('view-hidden');
  dom.impResultsPanel.classList.add('view-hidden');
}

window.kickPlayer = function(targetNickname) {
  if (confirm(`Voulez-vous vraiment exclure ${targetNickname} de la partie ?`)) {
    fetch('/api/imposteur/kick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: imposteurState.roomId, targetNickname })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showToast(`❌ ${targetNickname} a été exclu.`);
      }
    })
    .catch(err => console.error('Failed to kick player', err));
  }
};

function showToast(msg, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '24px';
    container.style.right = '24px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '8px';
    container.style.zIndex = '999999';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `premium-toast ${type}`;
  toast.innerHTML = `<span>${msg}</span>`;
  container.appendChild(toast);
  
  // Force reflow
  toast.offsetHeight;
  
  // Slide in
  toast.classList.add('show');
  
  // Auto remove after 3s
  setTimeout(() => {
    toast.classList.remove('show');
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 3000);
}

function copyInvitationLink() {
  const roomId = dom.roomCodeSpan.textContent;
  if (!roomId) return;
  const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
  
  navigator.clipboard.writeText(inviteUrl)
    .then(() => {
      showToast('🔗 Lien d\'invitation copié !');
    })
    .catch(err => {
      console.error('Failed to copy', err);
      // Fallback
      const el = document.createElement('textarea');
      el.value = inviteUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      showToast('🔗 Lien d\'invitation copié !');
    });
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
    if (isPlayerHost) badgeHtml += `<span class="badge-item badge-host"><span class="badge-emoji">⭐</span><span class="badge-text"> Hôte</span></span>`;
    
    if (state.status === 'playing' || state.status === 'discussing') {
      const activePlayer = state.turnOrder[state.currentTurnIndex];
      if (name === activePlayer) {
        badgeHtml += `<span class="badge-item badge-thinking"><span class="badge-emoji">💭</span><span class="badge-text"> Décrit...</span></span>`;
      }
    }
    
    if (p.hasVoted) badgeHtml += `<span class="badge-item badge-voted"><span class="badge-emoji">✅</span><span class="badge-text"> Voté</span></span>`;
    if (p.isEliminated) badgeHtml += `<span class="badge-item badge-dead"><span class="badge-emoji">💀</span><span class="badge-text"> Éliminé</span></span>`;
    if (p.isConnected === false) {
      badgeHtml += `<span class="badge-item badge-dead" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); color: #f87171;"><span class="badge-emoji">📡</span><span class="badge-text"> Déco</span></span>`;
    }
    
    let kickBtnHtml = '';
    if (isHost && name !== myName && p.isConnected === false) {
      kickBtnHtml = `<button class="btn-kick" onclick="kickPlayer('${name}')" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer; transition: all 0.2s; white-space: nowrap; margin-left: 5px;" onmouseover="this.style.background='rgba(239, 68, 68, 0.3)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.2)'">Virer</button>`;
    }
    
    li.innerHTML = `
      <div class="player-info-left" style="opacity: ${p.isConnected === false ? '0.5' : '1'}; display: flex; align-items: center; gap: 0.75rem;">
        <span class="player-avatar">${name.charAt(0)}</span>
        <div style="display: flex; flex-direction: column;">
          <span class="player-name" style="margin: 0; line-height: 1.2;">${name} ${name === myName ? '(Vous)' : ''}</span>
          <span style="color: var(--neon-pink); font-size: 11px; font-weight: bold; margin-top: 2px;">${p.score || 0} pts</span>
        </div>
      </div>
      <div class="player-badges" style="display: flex; align-items: center; gap: 0.35rem;">
        ${badgeHtml}
        ${kickBtnHtml}
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
    
    // Clear my word for round restart bug
    imposteurState.myWord = '';
    if (dom.impMyWordDisplay) {
      dom.impMyWordDisplay.textContent = '---';
    }
    
    dom.impThemeSelect.value = state.theme;
    
    // Sync rounds selector dropdown
    const roundsSelect = document.getElementById('imposteur-rounds-select');
    if (roundsSelect) {
      roundsSelect.value = state.descriptionRounds || 1;
      roundsSelect.disabled = !isHost;
    }

    const impostorCountSelect = document.getElementById('imposteur-count-select');
    if (impostorCountSelect) {
      impostorCountSelect.value = state.impostorCount || 1;
      impostorCountSelect.disabled = !isHost;
    }
    
    // Sync scores reset button box
    const resetScoresBox = document.getElementById('imposteur-reset-scores-box');
    if (resetScoresBox) {
      resetScoresBox.style.display = isHost ? 'block' : 'none';
    }

    const impCount = state.impostorCount || 1;
    const minPlayers = (2 * impCount) + 1;
    
    if (isHost) {
      dom.impThemeSelect.disabled = false;
      dom.btnImpStart.style.display = 'block';
      
      if (playerNames.length >= minPlayers) {
        dom.btnImpStart.removeAttribute('disabled');
        dom.impStartHelper.textContent = 'Assez de joueurs ! Lancez la partie quand vous le souhaitez.';
        dom.impStartHelper.style.color = '#34d399';
      } else {
        dom.btnImpStart.setAttribute('disabled', 'true');
        dom.impStartHelper.textContent = `En attente de joueurs (min ${minPlayers} pour ${impCount} imposteur(s), actuel: ${playerNames.length}).`;
        dom.impStartHelper.style.color = 'var(--text-muted)';
      }
    } else {
      dom.impThemeSelect.disabled = true;
      dom.btnImpStart.style.display = 'none';
      dom.impStartHelper.textContent = `Attente que l'hôte configure les paramètres et lance la partie (min ${minPlayers} joueurs)...`;
      dom.impStartHelper.style.color = 'var(--text-muted)';
    }
  }
  
  // Fetch my secret word if empty and we are playing or discussing
  if (state.status === 'playing' || state.status === 'discussing') {
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
  }

  // 2. Playing Phase (Descriptions)
  if (state.status === 'playing') {
    dom.impLobbyPanel.classList.add('view-hidden');
    dom.impPlayPanel.classList.remove('view-hidden');
    dom.impVotePanel.classList.add('view-hidden');
    dom.impResultsPanel.classList.add('view-hidden');
    
    // Check active turn
    const activePlayer = state.turnOrder[state.currentTurnIndex];
    const isMyTurn = (activePlayer === myName);
    
    const myPlayerState = state.players[myName];
    const isMeEliminated = myPlayerState ? myPlayerState.isEliminated : false;
    
    if (isMyTurn && !isMeEliminated) {
      dom.impTurnBar.classList.add('my-turn');
      dom.impTurnStatusText.textContent = `🔔 C'est à votre tour (Tour ${state.currentDescriptionRound}/${state.descriptionRounds}) ! Décrivez votre mot.`;
      dom.impDescForm.classList.remove('view-hidden');
      dom.impDescInput.focus();
    } else if (isMeEliminated) {
      dom.impTurnBar.classList.remove('my-turn');
      dom.impTurnStatusText.textContent = `💀 Éliminé. Attente de la description de ${activePlayer}...`;
      dom.impDescForm.classList.add('view-hidden');
    } else {
      dom.impTurnBar.classList.remove('my-turn');
      dom.impTurnStatusText.textContent = `📢 C'est au tour de ${activePlayer} de donner sa description (Tour ${state.currentDescriptionRound}/${state.descriptionRounds}).`;
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
    
    // Tally button box
    const tallyBox = document.getElementById('imposteur-tally-box');
    if (tallyBox) {
      tallyBox.style.display = 'block';
      const btnTally = document.getElementById('btn-imposteur-tally');
      const helperTally = document.getElementById('tally-helper-text');
      if (isHost) {
        if (btnTally) btnTally.style.display = 'inline-block';
        if (helperTally) helperTally.style.display = 'none';
      } else {
        if (btnTally) btnTally.style.display = 'none';
        if (helperTally) {
          helperTally.style.display = 'block';
          helperTally.textContent = "Attente que l'hôte dépouille les votes...";
        }
      }
    }
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
  const history = state.descriptionHistory || [];
  if (history.length === 0) {
    dom.impDescriptionsList.innerHTML = `<div class="empty-state-text" style="color: var(--text-muted); text-align: center; padding: 1rem;">Aucune description pour le moment.</div>`;
    return;
  }
  history.forEach(item => {
    const div = document.createElement('div');
    div.className = 'desc-item';
    const roundBadge = `<span class="desc-round-badge" style="background: rgba(167, 139, 250, 0.12); border: 1px solid rgba(167, 139, 250, 0.25); color: var(--accent); margin-left: 10px; font-size: 10px; padding: 2px 6px; border-radius: 4px; white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; font-weight: 800;">Tour ${item.round}</span>`;
    div.innerHTML = `
      <span class="desc-player-avatar">${item.nickname.charAt(0)}</span>
      <div class="desc-content">
        <div class="desc-player-name" style="display: flex; align-items: center;">
          ${item.nickname} ${item.nickname === imposteurState.nickname ? '(Vous)' : ''}
          ${roundBadge}
        </div>
        <div class="desc-player-bubble">« ${item.text} »</div>
      </div>
    `;
    dom.impDescriptionsList.appendChild(div);
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
    
    // Add vote interaction (users can change their votes now)
    if (!p.isEliminated && !isMeEliminated && name !== myName) {
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

  // Skip Card
  const skipCard = document.createElement('div');
  skipCard.className = 'vote-card skip-card';
  if (myPlayer && myPlayer.votedFor === 'skip') {
    skipCard.classList.add('voted');
  }
  
  const skipCount = voteCounts['skip'] || 0;
  const skipBadgeHtml = skipCount > 0 ? `<span class="vote-count-badge">🗳️ ${skipCount} ${skipCount > 1 ? 'votes' : 'vote'}</span>` : '';
  
  skipCard.innerHTML = `
    <span class="vote-indicator">PASSER</span>
    <span class="vote-avatar" style="background: rgba(255, 255, 255, 0.1);">⏭️</span>
    <span class="vote-name">Passer le vote (Skip)</span>
    ${skipBadgeHtml}
  `;
  
  if (!isMeEliminated) {
    skipCard.addEventListener('click', () => {
      fetch('/api/imposteur/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: imposteurState.roomId,
          nickname: myName,
          votedNickname: 'skip'
        })
      });
    });
  } else {
    skipCard.style.cursor = 'default';
  }
  dom.impVotingGrid.appendChild(skipCard);
}

// --- Quiz Géographie Client Logic ---

function showGeoMenuError(msg) {
  const errDiv = document.getElementById('geographie-menu-error');
  if (errDiv) {
    errDiv.textContent = msg;
    errDiv.style.display = msg ? 'block' : 'none';
  }
}

function startPlayingGeographie(roomId, nickname) {
  showView('geoGame');
  dom.roomDisplay.style.display = 'inline-block';
  dom.roomCodeSpan.textContent = roomId;
  
  geographieState.roomId = roomId;
  geographieState.nickname = nickname;
  
  connectGeographieSSE(roomId, nickname);
}

function leaveGeographieRoom() {
  if (evtSource) evtSource.close();
  clearInterval(geoCountdownInterval);
  
  geographieState = {
    nickname: '',
    roomId: '',
    isHost: false,
    status: 'lobby',
    mode: 'drapeaux',
    scope: 'monde',
    questionCount: 10,
    currentQuestionIndex: 0,
    players: {},
    question: null,
    leaderboard: []
  };
  
  showView('portal');
  const codeInput = document.getElementById('geographie-join-code');
  if (codeInput) codeInput.value = '';
  
  // Reset panels visibility
  document.getElementById('geographie-lobby-panel').classList.remove('view-hidden');
  document.getElementById('geographie-play-panel').classList.add('view-hidden');
  document.getElementById('geographie-correction-panel').classList.add('view-hidden');
  document.getElementById('geographie-results-panel').classList.add('view-hidden');
}

function connectGeographieSSE(roomId, nickname) {
  if (evtSource) evtSource.close();
  evtSource = new EventSource(`/api/events?roomId=${roomId}&nickname=${encodeURIComponent(nickname)}`);
  
  evtSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'GEOGRAPHIE_STATE') {
      updateGeographieUI(data.state);
    }
  };
}

function submitGeoAnswer(choice) {
  fetch('/api/geographie/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: geographieState.roomId,
      nickname: geographieState.nickname,
      choice
    })
  });
}

function updateGeographieUI(state) {
  const previousStatus = geographieState.status;
  const previousIndex = geographieState.currentQuestionIndex;

  const fallbackCountryNames = {
    // North America / Central America
    ca: "Canada", us: "États-Unis", mx: "Mexique", gl: "Groenland",
    gt: "Guatemala", bz: "Belize", hn: "Honduras", sv: "Salvador",
    ni: "Nicaragua", cr: "Costa Rica", pa: "Panama", cu: "Cuba",
    jm: "Jamaïque", ht: "Haïti", do: "République Dominicaine",
    pr: "Porto Rico", bs: "Bahamas",
    // South America
    co: "Colombie", ve: "Venezuela", gy: "Guyana", sr: "Suriname",
    gf: "Guyane Française", ec: "Équateur", pe: "Pérou", br: "Brésil",
    bo: "Bolivie", py: "Paraguay", cl: "Chili", ar: "Argentine",
    uy: "Uruguay", fk: "Îles Malouines",
    // Europe
    is: "Islande", gb: "Royaume-Uni", ie: "Irlande", pt: "Portugal",
    es: "Espagne", fr: "France", be: "Belgique", nl: "Pays-Bas",
    lu: "Luxembourg", ch: "Suisse", it: "Italie", de: "Allemagne",
    dk: "Danemark", no: "Norvège", se: "Suède", fi: "Finlande",
    ee: "Estonie", lv: "Lettonie", lt: "Lituanie", by: "Biélorussie",
    ua: "Ukraine", pl: "Pologne", cz: "République Tchèque", sk: "Slovaquie",
    at: "Autriche", hu: "Hongrie", si: "Slovénie", hr: "Croatie",
    ba: "Bosnie-Herzégovine", rs: "Serbie", me: "Monténégro", al: "Albanie",
    mk: "Macédoine du Nord", gr: "Grèce", bg: "Bulgarie", ro: "Roumanie",
    md: "Moldavie", tr: "Turquie", cy: "Chypre", ge: "Géorgie",
    am: "Arménie", az: "Azerbaïdjan", _kosovo: "Kosovo",
    // Asia
    ru: "Russie", kz: "Kazakhstan", uz: "Ouzbékistan", tm: "Turkménistan",
    kg: "Kirghizistan", tj: "Tadjikistan", ir: "Iran", iq: "Irak",
    sy: "Syrie", jo: "Jordanie", lb: "Liban", il: "Israël",
    ps: "Palestine", sa: "Arabie Saoudite", ye: "Yémen", om: "Oman",
    ae: "Émirats Arabes Unis", qa: "Qatar", kw: "Koweït", af: "Afghanistan",
    pk: "Pakistan", in: "Inde", np: "Népal", npl: "Népal",
    btn: "Bhoutan", bd: "Bangladesh", lk: "Sri Lanka", mv: "Maldives",
    mn: "Mongolie", cn: "Chine", tw: "Taïwan", jp: "Japon",
    kp: "Corée du Nord", kr: "Corée du Sud", mm: "Myanmar", th: "Thaïlande",
    la: "Laos", kh: "Cambodge", vn: "Vietnam", my: "Malaisie",
    sg: "Singapour", id: "Indonésie", ph: "Philippines", tl: "Timor oriental",
    // Africa
    ma: "Maroc", dz: "Algérie", tn: "Tunisie", ly: "Libye",
    eg: "Égypte", eh: "Sahara Occidental", mr: "Mauritanie", ml: "Mali",
    ne: "Niger", td: "Tchad", sd: "Soudan", ss: "Soudan du Sud",
    er: "Érythrée", dj: "Djibouti", so: "Somalie", et: "Éthiopie",
    sn: "Sénégal", gm: "Gambie", gw: "Guinée-Bissau", gn: "Guinée",
    sl: "Sierra Leone", lr: "Libéria", ci: "Côte d'Ivoire", gh: "Ghana",
    tg: "Togo", bj: "Bénin", ng: "Nigeria", cm: "Cameroun",
    cf: "République Centrafricaine", gq: "Guinée Équatoriale", ga: "Gabon",
    cg: "Congo", cd: "République Démocratique du Congo", crd: "République Démocratique du Congo",
    ao: "Angola", na: "Namibie", za: "Afrique du Sud", ls: "Lesotho",
    sz: "Eswatini", bw: "Botswana", zw: "Zimbabwe", mz: "Mozambique",
    mw: "Malawi", zm: "Zambie", tz: "Tanzanie", bi: "Burundi",
    rw: "Rwanda", ug: "Ouganda", ke: "Kenya", mg: "Madagascar",
    _somaliland: "Somaliland",
    // Oceania
    au: "Australie", nz: "Nouvelle-Zélande", pg: "Papouasie-Nouvelle-Guinée",
    fj: "Fidji", sb: "Îles Salomon", vu: "Vanuatu", nc: "Nouvelle-Calédonie"
  };

  geographieState.status = state.status;
  geographieState.mode = state.mode;
  geographieState.scope = state.scope;
  geographieState.questionCount = state.questionCount;
  geographieState.currentQuestionIndex = state.currentQuestionIndex;
  geographieState.players = state.players;
  geographieState.question = state.question;
  geographieState.leaderboard = state.leaderboard;
  
  const playerNames = Object.keys(state.players);
  const myName = geographieState.nickname;
  
  // Host detection
  const isHost = playerNames.length > 0 && playerNames[0] === myName;
  geographieState.isHost = isHost;
  
  // Sidebar player list rendering
  const countSpan = document.getElementById('geographie-players-count');
  if (countSpan) countSpan.textContent = playerNames.length;
  
  const listUl = document.getElementById('geographie-players-list');
  if (listUl) {
    listUl.innerHTML = '';
    playerNames.forEach(name => {
      const p = state.players[name];
      const li = document.createElement('li');
      li.className = 'player-item';
      
      const isPlayerHost = playerNames[0] === name;
      let badgeHtml = '';
      if (isPlayerHost) badgeHtml += `<span class="badge-item badge-host"><span class="badge-emoji">⭐</span><span class="badge-text"> Hôte</span></span>`;
      
      if (p.hasAnswered) {
        badgeHtml += `<span class="badge-item badge-voted"><span class="badge-emoji">✅</span><span class="badge-text"> Répondu</span></span>`;
      } else if (state.status === 'question') {
        badgeHtml += `<span class="badge-item badge-thinking"><span class="badge-emoji">💭</span><span class="badge-text"> Réfléchit...</span></span>`;
      }
      
      li.innerHTML = `
        <div class="player-info-left">
          <span class="player-avatar" style="background: var(--geo-primary);">${name.charAt(0)}</span>
          <span class="player-name">${name} ${name === myName ? '(Vous)' : ''}</span>
        </div>
        <div class="player-badges">
          ${badgeHtml}
        </div>
      `;
      listUl.appendChild(li);
    });
  }
  
  // Views panels toggles
  const lobbyPanel = document.getElementById('geographie-lobby-panel');
  const playPanel = document.getElementById('geographie-play-panel');
  const correctionPanel = document.getElementById('geographie-correction-panel');
  const resultsPanel = document.getElementById('geographie-results-panel');
  
  // 1. Lobby Phase
  if (state.status === 'lobby') {
    clearInterval(geoCountdownInterval);
    window.geographieLastQuestionIndex = -1; // Reset to ensure first question loads properly
    lobbyPanel.classList.remove('view-hidden');
    playPanel.classList.add('view-hidden');
    correctionPanel.classList.add('view-hidden');
    resultsPanel.classList.add('view-hidden');
    
    document.getElementById('geographie-mode-select').value = state.mode;
    document.getElementById('geographie-scope-select').value = state.scope;
    document.getElementById('geographie-count-select').value = state.questionCount;
    
    const btnStart = document.getElementById('btn-geographie-start');
    const helper = document.getElementById('geographie-start-helper');
    
    if (isHost) {
      document.getElementById('geographie-mode-select').disabled = false;
      document.getElementById('geographie-scope-select').disabled = false;
      document.getElementById('geographie-count-select').disabled = false;
      
      btnStart.style.display = 'block';
      btnStart.removeAttribute('disabled');
      helper.textContent = 'Configurez les options et lancez la partie quand vous le souhaitez.';
      helper.style.color = '#34d399';
    } else {
      document.getElementById('geographie-mode-select').disabled = true;
      document.getElementById('geographie-scope-select').disabled = true;
      document.getElementById('geographie-count-select').disabled = true;
      
      btnStart.style.display = 'none';
      helper.textContent = "Attente que l'organisateur configure les options et lance la partie...";
      helper.style.color = 'var(--text-muted)';
    }
  }
  
  // 2. Playing Question Phase
  else if (state.status === 'question') {
    lobbyPanel.classList.add('view-hidden');
    playPanel.classList.remove('view-hidden');
    correctionPanel.classList.add('view-hidden');
    resultsPanel.classList.add('view-hidden');
    
    // Clear inputs and reset map on new question
    if (window.geographieLastQuestionIndex !== state.currentQuestionIndex) {
      window.geographieLastQuestionIndex = state.currentQuestionIndex;
      window.mapPanX = 0;
      window.mapPanY = 0;
      window.mapZoom = 1.0;
      const textInput = document.getElementById('geographie-text-answer');
      if (textInput) {
        textInput.value = '';
        textInput.disabled = false;
      }
      const textBtn = document.getElementById('btn-geographie-submit-text');
      if (textBtn) {
        textBtn.disabled = false;
      }
    }

    if (window.mapPanX === undefined) window.mapPanX = 0;
    if (window.mapPanY === undefined) window.mapPanY = 0;
    if (window.mapZoom === undefined) window.mapZoom = 1.0;
    if (window.mapIsDragging === undefined) window.mapIsDragging = false;
    if (window.mapStartX === undefined) window.mapStartX = 0;
    if (window.mapStartY === undefined) window.mapStartY = 0;

    document.getElementById('geographie-question-number').textContent = `Question ${state.currentQuestionIndex + 1}/${state.questionCount}`;
    document.getElementById('geographie-question-prompt').textContent = state.question.prompt;
    
    // Countdown Timer logic
    if (previousStatus !== 'question' || previousIndex !== state.currentQuestionIndex) {
      clearInterval(geoCountdownInterval);
      geoTimeRemaining = 15;
      document.getElementById('geographie-timer-text').textContent = geoTimeRemaining;
      document.getElementById('geographie-progress-fill').style.width = '100%';
      
      geoCountdownInterval = setInterval(() => {
        geoTimeRemaining--;
        if (geoTimeRemaining <= 0) {
          clearInterval(geoCountdownInterval);
          geoTimeRemaining = 0;
          const myPlayerObj = state.players[myName];
          if (myPlayerObj && !myPlayerObj.hasAnswered) {
            submitGeoAnswer("");
          }
        }
        document.getElementById('geographie-timer-text').textContent = geoTimeRemaining;
        const progressPercent = (geoTimeRemaining / 15) * 100;
        document.getElementById('geographie-progress-fill').style.width = `${progressPercent}%`;
      }, 1000);
    }

    const grid = document.getElementById('geographie-choices-grid');
    const textInputContainer = document.getElementById('geographie-text-input-container');
    const myPlayerObj = state.players[myName];
    const hasAnswered = myPlayerObj ? myPlayerObj.hasAnswered : false;
    const myAnswerVal = myPlayerObj ? myPlayerObj.currentAnswer : null;
    
    // Toggle UI grids depending on mode
    if (state.mode === 'capitales' || state.mode === 'drapeaux') {
      grid.classList.add('view-hidden');
      textInputContainer.classList.remove('view-hidden');
      
      const textInput = document.getElementById('geographie-text-answer');
      const textBtn = document.getElementById('btn-geographie-submit-text');
      if (textInput) {
        textInput.disabled = hasAnswered;
        if (hasAnswered && myAnswerVal !== null) {
          textInput.value = myAnswerVal;
        }
        if (state.mode === 'drapeaux') {
          textInput.placeholder = "Écrivez le pays ici...";
        } else {
          textInput.placeholder = "Écrivez la capitale ici...";
        }
      }
      if (textBtn) {
        textBtn.disabled = hasAnswered;
      }
    } else if (state.mode === 'localisation') {
      grid.classList.add('view-hidden');
      textInputContainer.classList.add('view-hidden');
    }
    
    // Render media content
    const mediaContainer = document.getElementById('geographie-media-container');
    if (state.mode === 'drapeaux') {
      const code = state.question.media.toLowerCase();
      mediaContainer.innerHTML = `
        <img src="https://flagcdn.com/w320/${code}.png" alt="Drapeau" style="max-height: 180px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);">
      `;
    } else if (state.mode === 'capitales') {
      const name = state.question.media;
      mediaContainer.innerHTML = `
        <div style="font-size: 2.2rem; font-weight: 800; text-transform: uppercase; color: #fff; text-shadow: 0 0 15px rgba(255,255,255,0.4); text-align: center;">${name}</div>
      `;
    } else if (state.mode === 'localisation') {
      const silhouettes = state.question.silhouettes || [];
      const myPlayerObj = state.players[myName];
      const hasAnswered = myPlayerObj ? myPlayerObj.hasAnswered : false;
      const myAnswerVal = myPlayerObj ? myPlayerObj.currentAnswer : null;

      // 1. If map SVG is not fetched yet, fetch it and show loader
      if (!window.worldMapSvgContent) {
        if (!window.worldMapSvgLoading) {
          window.worldMapSvgLoading = true;
          fetch('/world.svg')
            .then(res => {
              if (!res.ok) throw new Error("Could not fetch world.svg");
              return res.text();
            })
            .then(svgText => {
              const parser = new DOMParser();
              const doc = parser.parseFromString(svgText, 'image/svg+xml');
              const svgNode = doc.querySelector('svg');
              if (svgNode) {
                window.worldMapSvgContent = svgNode.innerHTML;
                window.worldMapSvgViewBox = svgNode.getAttribute('viewBox') || "30.767 241.591 784.077 458.627";
              }
              window.worldMapSvgLoading = false;
              updateGeographieUI(state);
            })
            .catch(err => {
              console.error(err);
              window.worldMapSvgLoading = false;
            });
        }
        
        mediaContainer.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 420px; background: #07090e; border: 2px solid rgba(0, 242, 254, 0.25); border-radius: 16px; box-shadow: inset 0 0 40px rgba(0,0,0,0.9);">
            <div class="loader" style="width: 48px; height: 48px; border: 4px solid rgba(0, 242, 254, 0.1); border-top: 4px solid var(--neon-cyan); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <span style="margin-top: 1rem; font-family: monospace; font-size: 0.85rem; color: var(--neon-cyan); letter-spacing: 1px;">INITIALISATION DE LA CARTE RADAR...</span>
          </div>
        `;
        return;
      }

      mediaContainer.innerHTML = `
        <div style="position: relative; width: 100%; max-width: 800px; margin: 0 auto; user-select: none;">
          ${hasAnswered ? '<div style="position: absolute; top: 12px; right: 12px; z-index: 10; font-size: 12px; color: #fff; background: rgba(16, 185, 129, 0.25); padding: 5px 10px; border: 1px solid rgba(16, 185, 129, 0.5); border-radius: 20px; pointer-events: none; font-weight: 600; backdrop-filter: blur(5px);">✅ Réponse enregistrée</div>' : '<div style="position: absolute; top: 12px; right: 12px; z-index: 10; font-size: 12px; color: var(--neon-cyan); background: rgba(0,0,0,0.5); padding: 5px 10px; border: 1px solid rgba(0, 242, 254, 0.3); border-radius: 20px; pointer-events: none; font-weight: 600; backdrop-filter: blur(5px);">👆 Cliquez sur le bon pays</div>'}
          
          <svg id="geographie-interactive-map" viewBox="${window.worldMapSvgViewBox}" style="width: 100%; height: 420px; background: #0d1528; border: 2px solid rgba(0, 242, 254, 0.2); border-radius: 16px; cursor: grab; overflow: hidden; outline: none;">
            <g id="map-pannable-group" transform="translate(${window.mapPanX}, ${window.mapPanY}) scale(${window.mapZoom})">
              <!-- injected world map -->
              ${window.worldMapSvgContent}
            </g>
          </svg>
          
          <div style="margin-top: 0.5rem; text-align: center; font-size: 11px; color: rgba(255,255,255,0.3); font-weight: 500; font-family: sans-serif; letter-spacing: 0.5px;">
            🖱️ Glissez pour déplacer • 🔍 Molette pour zoomer
          </div>
        </div>
      `;

      // 3. Apply visual styles statefully to ALL country DOM nodes inside injected SVG!
      const svgEl = document.getElementById('geographie-interactive-map');
      const gEl = document.getElementById('map-pannable-group');

      if (svgEl && gEl) {
        // Set all paths inside the SVG to default background first
        const allPaths = svgEl.querySelectorAll('#map-pannable-group path');
        allPaths.forEach(item => {
          item.className.baseVal = 'world-map-country';
        });

        // Find all interactive countries (elements with an ID) and style them
        const countryEls = svgEl.querySelectorAll('#map-pannable-group [id]');
        countryEls.forEach(countryEl => {
          const code = countryEl.id.toLowerCase();
          
          // Get the country name (either from silhouettes list or fallback dictionary)
          let countryName = fallbackCountryNames[code] || code.toUpperCase();
          const sil = silhouettes.find(s => s.code && s.code.toLowerCase() === code);
          if (sil) countryName = sil.name;

          let targetClass = 'world-map-interactive';
          const isSelected = (myAnswerVal === countryName);

          if (state.status === 'question') {
            if (isSelected) {
              targetClass = 'world-map-selected';
            } else {
              targetClass = 'world-map-interactive';
            }
          } else if (state.status === 'correction') {
            const isCorrect = (state.question.correctAnswer === countryName);
            if (isCorrect) {
              targetClass = 'world-map-correct';
            } else if (isSelected) {
              targetClass = 'world-map-wrong';
            } else {
              targetClass = 'world-map-muted';
            }
          }

          countryEl.className.baseVal = targetClass;
          countryEl.querySelectorAll('path').forEach(p => {
            p.className.baseVal = targetClass;
          });

          // Set pointer style for guessing phase
          if (state.status === 'question' && !hasAnswered) {
            countryEl.style.cursor = 'pointer';
            countryEl.querySelectorAll('path').forEach(p => p.style.cursor = 'pointer');
          } else {
            countryEl.style.cursor = 'default';
            countryEl.querySelectorAll('path').forEach(p => p.style.cursor = 'default');
          }
        });

        if (state.status === 'correction') {
          allPaths.forEach(item => {
            if (item.className.baseVal === 'world-map-country') {
              item.className.baseVal = 'world-map-muted';
            }
          });
        }

        // 4. Bind dragging and zooming
        const startDrag = (clientX, clientY) => {
          window.mapIsDragging = true;
          svgEl.style.cursor = 'grabbing';
          window.mapStartX = clientX - window.mapPanX;
          window.mapStartY = clientY - window.mapPanY;
        };
        
        const moveDrag = (clientX, clientY) => {
          if (!window.mapIsDragging) return;
          window.mapPanX = clientX - window.mapStartX;
          window.mapPanY = clientY - window.mapStartY;
          gEl.setAttribute('transform', `translate(${window.mapPanX}, ${window.mapPanY}) scale(${window.mapZoom})`);
        };
        
        const stopDrag = () => {
          window.mapIsDragging = false;
          svgEl.style.cursor = 'grab';
        };
        
        svgEl.addEventListener('mousedown', (e) => {
          startDrag(e.clientX, e.clientY);
          svgEl.dataset.dragged = "false";
        });
        
        svgEl.addEventListener('mousemove', (e) => {
          if (window.mapIsDragging) {
            svgEl.dataset.dragged = "true";
            moveDrag(e.clientX, e.clientY);
          }
        });
        
        if (window.previousStopDrag) {
          window.removeEventListener('mouseup', window.previousStopDrag);
        }
        window.previousStopDrag = stopDrag;
        window.addEventListener('mouseup', stopDrag);
        
        svgEl.addEventListener('touchstart', (e) => {
          if (e.touches.length === 1) {
            startDrag(e.touches[0].clientX, e.touches[0].clientY);
            svgEl.dataset.dragged = "false";
          }
        });

        svgEl.addEventListener('touchmove', (e) => {
          if (window.mapIsDragging && e.touches.length === 1) {
            svgEl.dataset.dragged = "true";
            moveDrag(e.touches[0].clientX, e.touches[0].clientY);
          }
        });
        
        svgEl.addEventListener('touchend', stopDrag);
        
        svgEl.addEventListener('wheel', (e) => {
          e.preventDefault();
          const zoomFactor = 1.1;
          const newZoom = e.deltaY < 0 ? window.mapZoom * zoomFactor : window.mapZoom / zoomFactor;
          window.mapZoom = Math.max(0.5, Math.min(4.0, newZoom));
          gEl.setAttribute('transform', `translate(${window.mapPanX}, ${window.mapPanY}) scale(${window.mapZoom})`);
        }, { passive: false });

        // 5. Click handler for guessing any country on the map
        if (!hasAnswered && state.status === 'question') {
          countryEls.forEach(countryEl => {
            const code = countryEl.id.toLowerCase();
            
            let countryName = fallbackCountryNames[code] || code.toUpperCase();
            const sil = silhouettes.find(s => s.code && s.code.toLowerCase() === code);
            if (sil) countryName = sil.name;

            countryEl.addEventListener('click', (e) => {
              if (svgEl.dataset.dragged === "true") return;
              submitGeoAnswer(countryName);
            });
          });
        }
      }
    }
  }
  
  // 3. Correction Phase
  else if (state.status === 'correction') {
    clearInterval(geoCountdownInterval);
    lobbyPanel.classList.add('view-hidden');
    playPanel.classList.add('view-hidden');
    correctionPanel.classList.remove('view-hidden');
    resultsPanel.classList.add('view-hidden');
    
    // Correct Showcase mini-media
    const miniMedia = document.getElementById('geographie-correction-mini-media');
    const targetCode = state.question?.target?.code;
    
    if (state.mode === 'drapeaux' && targetCode) {
      const code = targetCode.toLowerCase();
      miniMedia.innerHTML = `
        <img src="https://flagcdn.com/w320/${code}.png" alt="Drapeau" style="max-height: 80px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
      `;
    } else if (state.mode === 'localisation') {
      const silhouettes = state.question.silhouettes || [];
      const correctCountryName = state.question.correctAnswer;
      const myPlayerObj = state.players[myName];
      const myAnswerVal = myPlayerObj ? myPlayerObj.currentAnswer : null;

      // 1. If map SVG is not fetched yet, fetch it and show loader
      if (!window.worldMapSvgContent) {
        if (!window.worldMapSvgLoading) {
          window.worldMapSvgLoading = true;
          fetch('/world.svg')
            .then(res => {
              if (!res.ok) throw new Error("Could not fetch world.svg");
              return res.text();
            })
            .then(svgText => {
              const parser = new DOMParser();
              const doc = parser.parseFromString(svgText, 'image/svg+xml');
              const svgNode = doc.querySelector('svg');
              if (svgNode) {
                window.worldMapSvgContent = svgNode.innerHTML;
                window.worldMapSvgViewBox = svgNode.getAttribute('viewBox') || "30.767 241.591 784.077 458.627";
              }
              window.worldMapSvgLoading = false;
              updateGeographieUI(state);
            })
            .catch(err => {
              console.error(err);
              window.worldMapSvgLoading = false;
            });
        }
        
        miniMedia.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 380px; background: #07090e; border: 2px solid rgba(16, 185, 129, 0.25); border-radius: 16px;">
            <div class="loader" style="width: 48px; height: 48px; border: 4px solid rgba(16, 185, 129, 0.1); border-top: 4px solid var(--neon-emerald); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <span style="margin-top: 1rem; font-family: monospace; font-size: 0.85rem; color: var(--neon-emerald); letter-spacing: 1px;">CHARGEMENT DE LA CARTE...</span>
          </div>
        `;
      } else {
        // We have the map SVG! Render full world map for correction
        miniMedia.innerHTML = `
          <div style="position: relative; width: 100%; max-width: 800px; margin: 0 auto; user-select: none;">
            <div style="position: absolute; top: 12px; left: 12px; z-index: 10; font-size: 12px; font-weight: 700; color: #fff; background: rgba(16, 185, 129, 0.25); padding: 5px 10px; border: 1px solid rgba(16, 185, 129, 0.5); border-radius: 20px; pointer-events: none; backdrop-filter: blur(5px);">✅ ${correctCountryName}</div>
            
            <svg id="geographie-correction-map" viewBox="${window.worldMapSvgViewBox}" style="width: 100%; height: 380px; background: #0d1528; border: 2px solid rgba(16, 185, 129, 0.3); border-radius: 16px; cursor: grab; overflow: hidden; outline: none;">
              <g id="correction-map-pannable-group" transform="translate(${window.mapPanX}, ${window.mapPanY}) scale(${window.mapZoom})">
                <!-- injected world map -->
                ${window.worldMapSvgContent}
              </g>
            </svg>
            
            <div style="margin-top: 0.5rem; text-align: center; font-size: 11px; color: rgba(255,255,255,0.3); font-weight: 500; font-family: sans-serif; letter-spacing: 0.5px;">
              🖱️ Glissez pour déplacer • 🔍 Molette pour zoomer
            </div>
          </div>
        `;

        const svgEl = document.getElementById('geographie-correction-map');
        const gEl = document.getElementById('correction-map-pannable-group');

        if (svgEl && gEl) {
          // First, apply baseline "muted" styles to ALL paths
          const allPaths = svgEl.querySelectorAll('#correction-map-pannable-group path');
          allPaths.forEach(item => {
            item.className.baseVal = 'world-map-muted';
          });

          // Find country elements (elements with an ID) and style them
          const countryEls = svgEl.querySelectorAll('#correction-map-pannable-group [id]');
          countryEls.forEach(countryEl => {
            const code = countryEl.id.toLowerCase();
            
            // Get corresponding country name
            let countryName = fallbackCountryNames[code] || code.toUpperCase();
            const sil = silhouettes.find(s => s.code && s.code.toLowerCase() === code);
            if (sil) countryName = sil.name;

            const isCorrect = (correctCountryName === countryName);
            const isWrongSelection = (myAnswerVal && myAnswerVal === countryName && myAnswerVal !== correctCountryName);

            let targetClass = 'world-map-muted';
            if (isCorrect) {
              targetClass = 'world-map-correct';
            } else if (isWrongSelection) {
              targetClass = 'world-map-wrong';
            }

            countryEl.className.baseVal = targetClass;
            countryEl.querySelectorAll('path').forEach(p => {
              p.className.baseVal = targetClass;
            });

            countryEl.style.cursor = 'default';
            countryEl.querySelectorAll('path').forEach(p => p.style.cursor = 'default');
          });

          // Bind pan and zoom events
          const startDrag = (clientX, clientY) => {
            window.mapIsDragging = true;
            svgEl.style.cursor = 'grabbing';
            window.mapStartX = clientX - window.mapPanX;
            window.mapStartY = clientY - window.mapPanY;
          };
          
          const moveDrag = (clientX, clientY) => {
            if (!window.mapIsDragging) return;
            window.mapPanX = clientX - window.mapStartX;
            window.mapPanY = clientY - window.mapStartY;
            gEl.setAttribute('transform', `translate(${window.mapPanX}, ${window.mapPanY}) scale(${window.mapZoom})`);
          };
          
          const stopDrag = () => {
            window.mapIsDragging = false;
            svgEl.style.cursor = 'grab';
          };
          
          svgEl.addEventListener('mousedown', (e) => {
            startDrag(e.clientX, e.clientY);
          });
          
          svgEl.addEventListener('mousemove', (e) => {
            if (window.mapIsDragging) {
              moveDrag(e.clientX, e.clientY);
            }
          });
          
          if (window.previousStopDrag) {
            window.removeEventListener('mouseup', window.previousStopDrag);
          }
          window.previousStopDrag = stopDrag;
          window.addEventListener('mouseup', stopDrag);
          
          svgEl.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
              startDrag(e.touches[0].clientX, e.touches[0].clientY);
            }
          });
          
          svgEl.addEventListener('touchmove', (e) => {
            if (window.mapIsDragging && e.touches.length === 1) {
              moveDrag(e.touches[0].clientX, e.touches[0].clientY);
            }
          });
          
          svgEl.addEventListener('touchend', stopDrag);
          
          svgEl.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = 1.1;
            const newZoom = e.deltaY < 0 ? window.mapZoom * zoomFactor : window.mapZoom / zoomFactor;
            window.mapZoom = Math.max(0.5, Math.min(4.0, newZoom));
            gEl.setAttribute('transform', `translate(${window.mapPanX}, ${window.mapPanY}) scale(${window.mapZoom})`);
          }, { passive: false });
        }
      }
    } else {
      miniMedia.innerHTML = '';
    }
    
    // Set correct answer text
    document.getElementById('geographie-correct-answer-text').textContent = state.question?.correctAnswer || '...';
    
    // List correct players
    const correctContainer = document.getElementById('geographie-correct-players');
    correctContainer.innerHTML = '';
    
    const correctPlayers = Object.values(state.players).filter(p => p.isCorrect);
    if (correctPlayers.length > 0) {
      correctPlayers.forEach(p => {
        const span = document.createElement('span');
        span.style.padding = '0.35rem 0.75rem';
        span.style.fontSize = '0.85rem';
        span.style.fontWeight = '700';
        span.style.borderRadius = '20px';
        span.style.background = 'rgba(16, 185, 129, 0.2)';
        span.style.border = '1px solid var(--neon-emerald)';
        span.style.color = '#fff';
        span.textContent = `✨ ${p.nickname} (+${p.pointsEarned})`;
        correctContainer.appendChild(span);
      });
    } else {
      correctContainer.innerHTML = '<span style="color: rgba(255,255,255,0.4); font-style: italic;">Personne n\'a trouvé ! 😢</span>';
    }
    
    // Run sequential correction reveal animation
    if (previousStatus !== 'correction') {
      const incorrectList = document.getElementById('geographie-incorrect-reveals-list');
      incorrectList.innerHTML = '';
      
      const correctCard = document.getElementById('geographie-correct-card');
      correctCard.style.opacity = '0';
      correctCard.style.transform = 'scale(0.9)';
      
      setTimeout(() => {
        correctCard.style.opacity = '1';
        correctCard.style.transform = 'none';
        correctCard.style.borderColor = 'var(--neon-emerald)';
        correctCard.style.boxShadow = '0 0 25px rgba(16, 185, 129, 0.4)';
      }, 300);
      
      const incorrectChoicesWithVotes = {};
      Object.values(state.players).forEach(p => {
        if (p.currentAnswer && !p.isCorrect) {
          if (!incorrectChoicesWithVotes[p.currentAnswer]) {
            incorrectChoicesWithVotes[p.currentAnswer] = [];
          }
          incorrectChoicesWithVotes[p.currentAnswer].push(p.nickname);
        }
      });
      
      const badChoicesKeys = Object.keys(incorrectChoicesWithVotes);
      badChoicesKeys.forEach((choice, index) => {
        setTimeout(() => {
          const playersListStr = incorrectChoicesWithVotes[choice].join(', ');
          const div = document.createElement('div');
          div.style.padding = '0.85rem 1.25rem';
          div.style.borderRadius = '10px';
          div.style.background = 'rgba(239, 68, 68, 0.08)';
          div.style.border = '1px solid rgba(239, 68, 68, 0.25)';
          div.style.display = 'flex';
          div.style.justifyContent = 'space-between';
          div.style.alignItems = 'center';
          div.style.animation = 'shakeRed 0.5s ease, slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
          div.innerHTML = `
            <span style="font-weight: 700; color: #fca5a5;">❌ ${choice || "(Sans réponse)"}</span>
            <span style="font-size: 0.85rem; color: #fca5a5;">choisi par : <strong style="color: #fff;">${playersListStr}</strong></span>
          `;
          incorrectList.appendChild(div);
        }, 1200 + (index * 800));
      });
    }
    
    // Host buttons
    const btnNext = document.getElementById('btn-geographie-next');
    const helper = document.getElementById('geographie-next-helper');
    if (isHost) {
      btnNext.style.display = 'inline-block';
      helper.style.display = 'none';
    } else {
      btnNext.style.display = 'none';
      helper.style.display = 'block';
      helper.textContent = "Attente que l'hôte passe à la question suivante...";
    }
  }
  
  // 4. Game Over (Results / Podium)
  else if (state.status === 'game_over') {
    clearInterval(geoCountdownInterval);
    lobbyPanel.classList.add('view-hidden');
    playPanel.classList.add('view-hidden');
    correctionPanel.classList.add('view-hidden');
    resultsPanel.classList.remove('view-hidden');
    
    // Render custom 3D neon podium
    const podiumContainer = document.getElementById('geographie-podium-container');
    podiumContainer.innerHTML = '';
    
    const topPlayers = [...state.leaderboard].slice(0, 3);
    const displayOrder = [];
    if (topPlayers[1]) displayOrder.push({ player: topPlayers[1], rank: 2, height: '120px', color: 'rgba(255,255,255,0.4)', text: '🥈' });
    if (topPlayers[0]) displayOrder.push({ player: topPlayers[0], rank: 1, height: '170px', color: 'var(--neon-cyan)', text: '👑' });
    if (topPlayers[2]) displayOrder.push({ player: topPlayers[2], rank: 3, height: '90px', color: 'rgba(180, 83, 9, 0.6)', text: '🥉' });
    
    displayOrder.forEach(item => {
      const col = document.createElement('div');
      col.className = 'podium-column';
      col.style.display = 'flex';
      col.style.flexDirection = 'column';
      col.style.alignItems = 'center';
      col.style.width = '90px';
      col.style.transition = 'all 1s cubic-bezier(0.16, 1, 0.3, 1)';
      
      col.innerHTML = `
        <span style="font-size: 1.5rem; margin-bottom: 0.25rem;">${item.text}</span>
        <strong style="font-size: 0.95rem; margin-bottom: 0.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 85px;">${item.player.nickname}</strong>
        <div class="podium-bar" style="width: 100%; height: ${item.height}; background: linear-gradient(180deg, ${item.color}, rgba(0,0,0,0.4)); border-radius: 8px 8px 0 0; border: 1px solid ${item.color}; box-shadow: 0 0 15px ${item.color === 'var(--neon-cyan)' ? 'rgba(0, 242, 254, 0.2)' : 'none'}; display: flex; flex-direction: column; justify-content: flex-end; padding-bottom: 1rem; align-items: center;">
          <span style="font-size: 1.1rem; font-weight: 800; color: #fff;">${item.player.score}</span>
          <span style="font-size: 0.75rem; color: rgba(255,255,255,0.6);">pts</span>
        </div>
      `;
      podiumContainer.appendChild(col);
    });
    
    // Render full leaderboard
    const fullLeaderboard = document.getElementById('geographie-full-leaderboard');
    fullLeaderboard.innerHTML = '';
    state.leaderboard.forEach((p, idx) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.padding = '0.65rem 0';
      row.style.borderBottom = '1px solid rgba(255,255,255,0.03)';
      row.style.fontSize = '0.95rem';
      
      row.innerHTML = `
        <span><strong>#${idx + 1}</strong> ${p.nickname}</span>
        <span style="font-weight: 700; color: var(--neon-cyan);">${p.score} pts</span>
      `;
      fullLeaderboard.appendChild(row);
    });
    
    // Restart controls
    const btnRestart = document.getElementById('btn-geographie-restart');
    const helper = document.getElementById('geographie-restart-helper');
    if (isHost) {
      btnRestart.style.display = 'block';
      helper.style.display = 'none';
    } else {
      btnRestart.style.display = 'none';
      helper.style.display = 'block';
      helper.textContent = "Attente que l'hôte relance une nouvelle partie...";
    }
  }
}

// --- Loup-Garou Client Logic ---

const loupGarouAllRoles = {
  loup: { emoji: '🐺', name: 'Loup-Garou', isUnique: false },
  simple_villageois: { emoji: '👤', name: 'Simple Villageois', isUnique: false },
  voyante: { emoji: '👁️', name: 'Voyante', isUnique: true },
  sorciere: { emoji: '🧪', name: 'Sorcière', isUnique: true },
  chasseur: { emoji: '🎯', name: 'Chasseur', isUnique: true },
  cupidon: { emoji: '💘', name: 'Cupidon', isUnique: true },
  garde: { emoji: '🛡️', name: 'Garde', isUnique: true },
  voleur: { emoji: '🪶', name: 'Voleur', isUnique: true },
  petite_fille: { emoji: '👧', name: 'Petite Fille', isUnique: true },
  bouc_emissaire: { emoji: '🐐', name: 'Bouc Émissaire', isUnique: true },
  idiot_du_village: { emoji: '🤪', name: 'Idiot du Village', isUnique: true },
  montreur_d_ours: { emoji: '🐻', name: "Montreur d'Ours", isUnique: true },
  ancien: { emoji: '👴', name: 'Ancien', isUnique: true }
};

window.prevLoupGarouStatus = null;

window.speakLoupGarouVoice = function(text) {
  const ttsEnabled = localStorage.getItem('loup-garou-tts-enabled') !== 'false';
  if (!ttsEnabled) return;
  
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.volume = 1.0;
    utterance.rate = 0.9;
    
    const voices = window.speechSynthesis.getVoices();
    const frVoice = voices.find(v => v.lang.startsWith('fr'));
    if (frVoice) {
      utterance.voice = frVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  }
};

window.addLoupGarouCard = function(role) {
  if (!loupGarouState.isHost) return;
  if (!loupGarouState.rolesConfig) loupGarouState.rolesConfig = {};
  if (!loupGarouState.rolesConfig.activeCards) {
    loupGarouState.rolesConfig.activeCards = [];
  }
  
  const roleMeta = loupGarouAllRoles[role];
  if (roleMeta && roleMeta.isUnique) {
    if (loupGarouState.rolesConfig.activeCards.includes(role)) {
      showToast("Ce rôle unique est déjà sélectionné !", "error");
      return;
    }
  }
  
  loupGarouState.rolesConfig.activeCards.push(role);
  
  fetch('/api/loup-garou/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: loupGarouState.roomId,
      rolesConfig: loupGarouState.rolesConfig
    })
  });
};

window.removeLoupGarouCard = function(index) {
  if (!loupGarouState.isHost) return;
  if (!loupGarouState.rolesConfig || !loupGarouState.rolesConfig.activeCards) return;
  
  loupGarouState.rolesConfig.activeCards.splice(index, 1);
  
  fetch('/api/loup-garou/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: loupGarouState.roomId,
      rolesConfig: loupGarouState.rolesConfig
    })
  });
};

window.submitVoleurSwap = function(role) {
  fetch('/api/loup-garou/night-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: loupGarouState.roomId,
      nickname: loupGarouState.nickname,
      actionType: 'voleur',
      targetName: role
    })
  });
};


function showLgMenuError(msg) {
  const err = document.getElementById('loup-garou-menu-error');
  if (err) {
    err.textContent = msg;
    err.style.display = msg ? 'block' : 'none';
  }
}

function startPlayingLoupGarou(roomId, nickname) {
  showView('lgGame');
  dom.roomDisplay.style.display = 'inline-block';
  dom.roomCodeSpan.textContent = roomId;
  
  loupGarouState.roomId = roomId;
  loupGarouState.nickname = nickname;
  
  connectLoupGarouSSE(roomId, nickname);
}

function connectLoupGarouSSE(roomId, nickname) {
  if (evtSource) evtSource.close();
  evtSource = new EventSource(`/api/events?roomId=${roomId}&nickname=${encodeURIComponent(nickname)}`);
  
  evtSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'LOUP_GAROU_STATE') {
      updateLoupGarouUI(data.state);
    }
  };
}

function leaveLoupGarouRoom() {
  if (evtSource) evtSource.close();
  loupGarouState = {
    nickname: '',
    roomId: '',
    isHost: false,
    status: 'lobby',
    players: {},
    historyLogs: [],
    rolesConfig: {},
    myRole: null,
    myAlive: false,
    myCouple: false,
    nightState: {},
    winner: null,
    privateActionData: null
  };
  
  localStorage.removeItem('loup-garou-roomId');
  showView('portal');
  const joinInput = document.getElementById('loup-garou-join-code');
  if (joinInput) joinInput.value = '';
  
  // reset panel visibility
  document.getElementById('loup-garou-lobby-panel').classList.remove('view-hidden');
  document.getElementById('loup-garou-play-panel').classList.add('view-hidden');
  document.getElementById('loup-garou-day-panel').classList.add('view-hidden');
  document.getElementById('loup-garou-results-panel').classList.add('view-hidden');
}

window.kickLoupGarouPlayer = function(targetNickname) {
  if (confirm(`Voulez-vous vraiment exclure ${targetNickname} du village ?`)) {
    fetch('/api/loup-garou/kick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: loupGarouState.roomId, targetNickname })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showToast(`❌ ${targetNickname} a été exclu.`);
      }
    })
    .catch(err => console.error('Failed to kick player', err));
  }
};

window.submitLoupGarouVote = function(votedNickname) {
  fetch('/api/loup-garou/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: loupGarouState.roomId,
      nickname: loupGarouState.nickname,
      votedNickname
    })
  });
};

function updateLoupGarouUI(state) {
  loupGarouState.status = state.status;
  loupGarouState.players = state.players;
  loupGarouState.historyLogs = state.historyLogs || [];
  loupGarouState.rolesConfig = state.rolesConfig;
  loupGarouState.myRole = state.myRole;
  loupGarouState.myAlive = state.myAlive;
  loupGarouState.myCouple = state.myCouple;
  loupGarouState.nightState = state.nightState || {};
  loupGarouState.winner = state.winner;
  loupGarouState.privateActionData = state.privateActionData;
  
  const playerNames = Object.keys(state.players);
  const myName = loupGarouState.nickname;
  
  // Host detection
  const isHost = playerNames.length > 0 && playerNames[0] === myName;
  loupGarouState.isHost = isHost;
  
  // Sidebar player list rendering
  const lgPlayersCount = document.getElementById('loup-garou-players-count');
  if (lgPlayersCount) lgPlayersCount.textContent = playerNames.length;
  
  const lgPlayersList = document.getElementById('loup-garou-players-list');
  if (lgPlayersList) {
    lgPlayersList.innerHTML = '';
    playerNames.forEach(name => {
      const p = state.players[name];
      const li = document.createElement('li');
      li.className = 'player-item';
      
      const isPlayerHost = playerNames[0] === name;
      let badgeHtml = '';
      if (isPlayerHost) badgeHtml += `<span class="badge-item badge-host"><span class="badge-emoji">⭐</span><span class="badge-text"> Hôte</span></span>`;
      
      if (!p.isAlive) {
        badgeHtml += `<span class="badge-item badge-dead"><span class="badge-emoji">💀</span><span class="badge-text"> Mort (${p.role})</span></span>`;
      } else {
        badgeHtml += `<span class="badge-item badge-alive" style="background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3); color: #34d399;"><span class="badge-emoji">❤️</span><span class="badge-text"> En vie</span></span>`;
        if (p.isLover) {
          badgeHtml += `<span class="badge-item badge-voted" style="background: rgba(236,72,153,0.15); border-color: rgba(236,72,153,0.3); color: #f472b6;"><span class="badge-emoji">💞</span><span class="badge-text"> Amoureux</span></span>`;
        }
      }
      
      if (p.isConnected === false) {
        badgeHtml += `<span class="badge-item badge-dead" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); color: #f87171;"><span class="badge-emoji">📡</span><span class="badge-text"> Déco</span></span>`;
      }
      
      let kickBtnHtml = '';
      if (isHost && name !== myName && p.isConnected === false) {
        kickBtnHtml = `<button class="btn-kick" onclick="kickLoupGarouPlayer('${name}')" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer; transition: all 0.2s; white-space: nowrap; margin-left: 5px;" onmouseover="this.style.background='rgba(239, 68, 68, 0.3)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.2)'">Virer</button>`;
      }
      
      li.innerHTML = `
        <div class="player-info-left" style="opacity: ${p.isConnected === false ? '0.5' : '1'}; display: flex; align-items: center; gap: 0.75rem;">
          <span class="player-avatar" style="background: ${p.isAlive ? 'var(--bg-card)' : 'rgba(255,255,255,0.05)'}; color: ${p.isAlive ? '#fff' : '#64748b'};">${name.charAt(0)}</span>
          <div style="display: flex; flex-direction: column;">
            <span class="player-name" style="margin: 0; line-height: 1.2; text-decoration: ${p.isAlive ? 'none' : 'line-through'}; color: ${p.isAlive ? '#f8fafc' : '#64748b'};">${name} ${name === myName ? '(Vous)' : ''}</span>
            ${(p.role && p.role !== 'mystere') ? `<span style="font-size: 10px; color: #ef4444; font-weight: bold;">${p.role}</span>` : ''}
          </div>
        </div>
        <div class="player-badges" style="display: flex; align-items: center; gap: 0.35rem;">
          ${badgeHtml}
          ${kickBtnHtml}
        </div>
      `;
      lgPlayersList.appendChild(li);
    });
  }
  
  // Update state panel views
  const lobbyPanel = document.getElementById('loup-garou-lobby-panel');
  const playPanel = document.getElementById('loup-garou-play-panel');
  const dayPanel = document.getElementById('loup-garou-day-panel');
  const resultsPanel = document.getElementById('loup-garou-results-panel');
  
  // Helper to toggle panels
  function showPanel(panel) {
    [lobbyPanel, playPanel, dayPanel, resultsPanel].forEach(p => {
      if (p) {
        if (p === panel) p.classList.remove('view-hidden');
        else p.classList.add('view-hidden');
      }
    });
  }

  // TTS Voice Narration on status transitions
  if (state.status !== window.prevLoupGarouStatus) {
    const prevStatus = window.prevLoupGarouStatus;
    window.prevLoupGarouStatus = state.status;
    
    if (prevStatus && state.status !== 'lobby') {
      let speechText = "";
      switch (state.status) {
        case 'night_voleur':
          speechText = "Le village s'endort... Tout le monde ferme les yeux... Le Voleur se réveille. Voleur, réveillez-vous et choisissez un nouveau rôle.";
          break;
        case 'night_cupidon':
          speechText = (prevStatus === 'lobby' || prevStatus === 'night_voleur')
            ? "Tout le monde s'endort et ferme les yeux... Le Cupidon se réveille. Cupidon, réveillez-vous et unissez deux destins amoureux."
            : "Le Cupidon se réveille. Cupidon, réveillez-vous et unissez deux destins amoureux.";
          break;
        case 'night_garde':
          speechText = (prevStatus === 'lobby' || prevStatus === 'night_cupidon' || prevStatus === 'night_voleur')
            ? "Tout le monde ferme les yeux... Le Garde se réveille. Garde, réveillez-vous et protégez un villageois."
            : "Le Garde se réveille. Garde, réveillez-vous et protégez un villageois.";
          break;
        case 'night_voyante':
          speechText = "La Voyante se réveille. Voyante, réveillez-vous et scrutez l'identité secrète d'un joueur.";
          break;
        case 'night_loup':
          speechText = "Les Loups-Garous se réveillent. Loups-Garous, réveillez-vous, concertez-vous et désignez votre victime de la nuit.";
          break;
        case 'night_sorciere':
          speechText = "La Sorcière se réveille. Sorcière, réveillez-vous. Allez-vous utiliser votre potion de vie ou votre potion de mort ?";
          break;
        case 'day_announcements':
          speechText = "Le village se réveille... Tout le monde ouvre les yeux... Écoutons les nouvelles du matin.";
          break;
        case 'day_vote':
          speechText = "Les débats sont ouverts. C'est l'heure du conseil municipal. Citoyens, votez pour éliminer un suspect.";
          break;
        case 'day_hunter':
          speechText = "Attention, le Chasseur charge son fusil ! Chasseur, tirez votre coup de vengeance avant de mourir.";
          break;
        case 'game_over':
          speechText = "Fin de la partie ! Le rideau tombe et les secrets sont révélés.";
          break;
      }
      
      if (speechText) {
        window.speakLoupGarouVoice(speechText);
      }
    }
  }

  // Lobby Phase
  if (state.status === 'lobby') {
    showPanel(lobbyPanel);
    
    const activeCards = (state.rolesConfig && state.rolesConfig.activeCards) || [];
    const activeCardsCountSpan = document.getElementById('lg-active-cards-count');
    const activeCardsList = document.getElementById('lg-active-cards-list');
    
    if (activeCardsCountSpan) activeCardsCountSpan.textContent = activeCards.length;
    
    // Dynamic active cards render
    if (activeCardsList) {
      activeCardsList.innerHTML = '';
      if (activeCards.length === 0) {
        activeCardsList.innerHTML = '<span style="color: rgba(255,255,255,0.3); font-size: 11px; margin: auto;">Aucun rôle sélectionné. Ajoutez des rôles ci-dessous !</span>';
      } else {
        activeCards.forEach((role, index) => {
          const meta = loupGarouAllRoles[role] || { emoji: '👤', name: role };
          const chip = document.createElement('div');
          chip.style.display = 'inline-flex';
          chip.style.alignItems = 'center';
          chip.style.gap = '6px';
          chip.style.padding = '6px 12px';
          chip.style.background = 'rgba(255, 255, 255, 0.08)';
          chip.style.border = '1px solid rgba(255,255,255,0.15)';
          chip.style.borderRadius = '20px';
          chip.style.fontSize = '11px';
          chip.style.color = '#fff';
          
          let removeBtn = '';
          if (isHost) {
            removeBtn = `<button onclick="removeLoupGarouCard(${index})" style="background: none; border: none; color: #ef4444; cursor: pointer; font-weight: bold; font-size: 14px; padding: 0 0 0 4px; display: flex; align-items: center;">&times;</button>`;
          }
          
          chip.innerHTML = `<span>${meta.emoji} ${meta.name}</span>${removeBtn}`;
          activeCardsList.appendChild(chip);
        });
      }
    }
    
    // Validation
    const playersCount = playerNames.length;
    const isCountValid = activeCards.length === playersCount && playersCount > 0;
    
    const validationBadge = document.getElementById('lg-validation-badge');
    if (validationBadge) {
      if (isCountValid) {
        validationBadge.textContent = `Compte valide (${activeCards.length} cartes / ${playersCount} joueurs) ✅`;
        validationBadge.style.background = 'rgba(16, 185, 129, 0.2)';
        validationBadge.style.borderColor = '#10b981';
        validationBadge.style.color = '#34d399';
      } else {
        validationBadge.textContent = `Compte invalide (${activeCards.length} cartes pour ${playersCount} joueurs) ❌`;
        validationBadge.style.background = 'rgba(239, 68, 68, 0.2)';
        validationBadge.style.borderColor = '#ef4444';
        validationBadge.style.color = '#f87171';
      }
    }
    
    // Grid highlighting and lock uniques
    document.querySelectorAll('.role-config-card').forEach(card => {
      const role = card.getAttribute('data-role');
      const roleMeta = loupGarouAllRoles[role];
      const isInDeck = activeCards.includes(role);
      
      if (roleMeta && roleMeta.isUnique && isInDeck) {
        card.style.opacity = '0.5';
        const addBtn = card.querySelector('.btn-lg-add-role');
        if (addBtn) addBtn.style.display = 'none';
      } else {
        card.style.opacity = '1';
        const addBtn = card.querySelector('.btn-lg-add-role');
        if (addBtn) addBtn.style.display = 'flex';
      }
    });
    
    const btnLgStart = document.getElementById('btn-loup-garou-start');
    const startHelper = document.getElementById('loup-garou-start-helper');
    if (isHost) {
      if (btnLgStart) {
        btnLgStart.style.display = 'block';
        btnLgStart.disabled = !isCountValid;
        btnLgStart.style.opacity = isCountValid ? '1' : '0.4';
        btnLgStart.style.cursor = isCountValid ? 'pointer' : 'not-allowed';
        if (isCountValid) {
          btnLgStart.style.background = '#10b981';
          btnLgStart.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.4)';
        } else {
          btnLgStart.style.background = '#ef4444';
          btnLgStart.style.boxShadow = 'none';
        }
      }
      if (startHelper) startHelper.style.display = 'none';
    } else {
      if (btnLgStart) btnLgStart.style.display = 'none';
      if (startHelper) {
        startHelper.style.display = 'block';
        if (isCountValid) {
          startHelper.textContent = "Le paquet est configuré ! Attente que l'hôte lance la partie...";
          startHelper.style.color = '#34d399';
        } else {
          startHelper.textContent = `Configuration en cours par l'hôte (${activeCards.length}/${playersCount} joueurs)...`;
          startHelper.style.color = 'var(--text-muted)';
        }
      }
    }
  }
  // Night Sequential Phase
  else if (state.status.startsWith('night_')) {
    showPanel(playPanel);
    
    // Private Secret Card Drawer
    const emojiSpan = document.getElementById('loup-garou-my-role-emoji');
    const nameSpan = document.getElementById('loup-garou-my-role-name');
    const descDiv = document.getElementById('loup-garou-my-role-desc');
    const coupleBadge = document.getElementById('loup-garou-my-couple-badge');
    
    const roleDetails = {
      'loup': { emoji: '🐺', name: 'Loup-Garou', desc: 'Vous êtes un cruel Loup-Garou. Dévoilez-vous la nuit pour dévorer des villageois avec vos semblables.' },
      'voyante': { emoji: '👁️', name: 'Voyante', desc: "Vous êtes la Voyante. Chaque nuit, observez secrètement l'identité d'un villageois dans votre boule de cristal." },
      'sorciere': { emoji: '🧪', name: 'Sorcière', desc: 'Vous êtes la Sorcière. Vous possédez deux fioles uniques : une de guérison et un poison mortel.' },
      'chasseur': { emoji: '🎯', name: 'Chasseur', desc: 'Vous êtes le Chasseur. Si vous perdez la vie, votre coup de fusil de vengeance éliminera instantanément un autre joueur.' },
      'cupidon': { emoji: '💘', name: 'Cupidon', desc: 'Vous êtes Cupidon. La première nuit de la partie, vous devez unir deux destins amoureux inséparables.' },
      'garde': { emoji: '🛡️', name: 'Garde', desc: 'Vous êtes le Garde. Chaque nuit, placez votre bouclier protecteur sur un villageois pour lui éviter d\'être dévoré.' },
      'voleur': { emoji: '🪶', name: 'Voleur', desc: 'Vous êtes le Voleur. Choisissez secrètement une des deux cartes du milieu pour échanger votre rôle.' },
      'simple_villageois': { emoji: '👤', name: 'Simple Villageois', desc: 'Vous êtes un Simple Villageois. Votre seule arme est votre intuition diurne pour démasquer les loups.' },
      'petite_fille': { emoji: '👧', name: 'Petite Fille', desc: 'Vous êtes la Petite Fille. Vous pouvez espionner les loups durant la nuit, mais attention à ne pas vous faire surprendre !' },
      'bouc_emissaire': { emoji: '🐐', name: 'Bouc Émissaire', desc: 'Vous êtes le Bouc Émissaire. En cas d\'égalité des votes du village, vous serez automatiquement éliminé.' },
      'idiot_du_village': { emoji: '🤪', name: 'Idiot du Village', desc: 'Vous êtes l\'Idiot du Village. Si le village vote contre vous, votre rôle est révélé et vous survivez sans droit de vote.' },
      'montreur_d_ours': { emoji: '🐻', name: "Montreur d'Ours", desc: 'Vous êtes le Montreur d\'Ours. Si un loup est à côté de vous, votre ours grognera au lever du jour.' },
      'ancien': { emoji: '👴', name: 'Ancien', desc: 'Vous êtes l\'Ancien. Vous pouvez survivre à une première attaque de loups-garous.' }
    };
    
    const details = roleDetails[state.myRole] || { emoji: '👤', name: 'Inconnu', desc: 'Rôle mystère...' };
    if (emojiSpan) emojiSpan.textContent = details.emoji;
    if (nameSpan) nameSpan.textContent = details.name;
    if (descDiv) descDiv.textContent = details.desc;
    if (coupleBadge) coupleBadge.style.display = state.myCouple ? 'block' : 'none';
    
    const turnStatusText = document.getElementById('loup-garou-turn-status-text');
    if (turnStatusText) {
      let phaseFriendlyName = "La Nuit est paisible... 😴";
      switch (state.status) {
        case 'night_voleur': phaseFriendlyName = "Le Voleur s'éveille secrètement... 🪶"; break;
        case 'night_cupidon': phaseFriendlyName = "Cupidon lie deux destins éternels... 💘"; break;
        case 'night_garde': phaseFriendlyName = "Le Garde veille sur les habitants... 🛡️"; break;
        case 'night_voyante': phaseFriendlyName = "La Voyante consulte les astres... 👁️"; break;
        case 'night_loup': phaseFriendlyName = "La meute de Loups-Garous choisit une proie... 🐺🩸"; break;
        case 'night_sorciere': phaseFriendlyName = "La Sorcière s'éveille et prépare ses potions... 🧪"; break;
      }
      turnStatusText.textContent = phaseFriendlyName;
    }
    
    // Default sleep windows
    const sleepWindow = document.getElementById('loup-garou-sleep-window');
    const voleurWindow = document.getElementById('loup-garou-voleur-window');
    const cupidonWindow = document.getElementById('loup-garou-cupidon-window');
    const gardeWindow = document.getElementById('loup-garou-garde-window');
    const voyanteWindow = document.getElementById('loup-garou-voyante-window');
    const wolvesWindow = document.getElementById('loup-garou-wolves-window');
    const sorciereWindow = document.getElementById('loup-garou-sorciere-window');
    const hunterWindow = document.getElementById('loup-garou-hunter-window');
    
    [sleepWindow, voleurWindow, cupidonWindow, gardeWindow, voyanteWindow, wolvesWindow, sorciereWindow, hunterWindow].forEach(w => {
      if (w) w.classList.add('view-hidden');
    });
    
    let waken = false;
    
    if (state.myAlive) {
      const alivePlayers = Object.keys(state.players).filter(name => state.players[name].isAlive);
      
      // Voleur wakes
      if (state.myRole === 'voleur' && state.status === 'night_voleur') {
        waken = true;
        if (voleurWindow) {
          voleurWindow.classList.remove('view-hidden');
          const cardsBox = document.getElementById('loup-garou-voleur-cards-box');
          if (cardsBox) {
            cardsBox.innerHTML = '';
            const middleCards = (state.privateActionData && state.privateActionData.voleurMiddleCards) || [];
            if (middleCards.length === 0) {
              cardsBox.innerHTML = '<span style="color: rgba(255,255,255,0.4); font-size: 12px;">Aucun choix possible ou déjà effectué.</span>';
            } else {
              middleCards.forEach(role => {
                const meta = loupGarouAllRoles[role] || { emoji: '❓', name: role };
                const cardBtn = document.createElement('button');
                cardBtn.className = 'btn btn-accent';
                cardBtn.style.padding = '12px';
                cardBtn.style.borderRadius = '10px';
                cardBtn.style.display = 'flex';
                cardBtn.style.flexDirection = 'column';
                cardBtn.style.alignItems = 'center';
                cardBtn.style.gap = '6px';
                cardBtn.style.minWidth = '110px';
                cardBtn.innerHTML = `
                  <div style="font-size: 1.8rem;">${meta.emoji}</div>
                  <div style="font-size: 11px; font-weight: bold; color: #fff;">${meta.name}</div>
                `;
                cardBtn.addEventListener('click', () => {
                  window.submitVoleurSwap(role);
                });
                cardsBox.appendChild(cardBtn);
              });
            }
          }
        }
      }
      // Cupidon wakes
      else if (state.myRole === 'cupidon' && state.status === 'night_cupidon') {
        waken = true;
        if (cupidonWindow) {
          cupidonWindow.classList.remove('view-hidden');
          const lover1Select = document.getElementById('loup-garou-cupid-lover1');
          const lover2Select = document.getElementById('loup-garou-cupid-lover2');
          if (lover1Select && lover2Select) {
            lover1Select.innerHTML = '';
            lover2Select.innerHTML = '';
            alivePlayers.forEach(name => {
              const opt1 = document.createElement('option');
              opt1.value = name; opt1.textContent = name;
              lover1Select.appendChild(opt1);
              
              const opt2 = document.createElement('option');
              opt2.value = name; opt2.textContent = name;
              lover2Select.appendChild(opt2);
            });
          }
        }
      }
      // Garde wakes
      else if (state.myRole === 'garde' && state.status === 'night_garde') {
        waken = true;
        if (gardeWindow) {
          gardeWindow.classList.remove('view-hidden');
          const targetSelect = document.getElementById('loup-garou-garde-target');
          if (targetSelect) {
            targetSelect.innerHTML = '';
            alivePlayers.forEach(name => {
              const opt = document.createElement('option');
              opt.value = name; opt.textContent = name;
              targetSelect.appendChild(opt);
            });
          }
        }
      }
      // Voyante wakes
      else if (state.myRole === 'voyante' && state.status === 'night_voyante') {
        waken = true;
        if (voyanteWindow) {
          voyanteWindow.classList.remove('view-hidden');
          const targetSelect = document.getElementById('loup-garou-voyante-target');
          const resultBox = document.getElementById('loup-garou-seer-result');
          const resultText = document.getElementById('loup-garou-seer-result-text');
          const voyanteBtn = document.getElementById('btn-loup-garou-voyante-submit');
          
          if (targetSelect) {
            targetSelect.innerHTML = '';
            alivePlayers.filter(n => n !== myName).forEach(name => {
              const opt = document.createElement('option');
              opt.value = name; opt.textContent = name;
              targetSelect.appendChild(opt);
            });
          }
          
          if (state.privateActionData && state.privateActionData.seerTarget) {
            if (resultBox) resultBox.style.display = 'block';
            if (resultText) resultText.textContent = `${state.privateActionData.seerTarget} est ${state.privateActionData.seerTargetRole.toUpperCase()} ! 🔮`;
            if (voyanteBtn) voyanteBtn.disabled = true;
            if (targetSelect) targetSelect.disabled = true;
          } else {
            if (resultBox) resultBox.style.display = 'none';
            if (voyanteBtn) voyanteBtn.disabled = false;
            if (targetSelect) targetSelect.disabled = false;
          }
        }
      }
      // Wolves wake
      else if (state.myRole === 'loup' && state.status === 'night_loup') {
        waken = true;
        if (wolvesWindow) {
          wolvesWindow.classList.remove('view-hidden');
          const targetSelect = document.getElementById('loup-garou-wolf-target');
          const votesList = document.getElementById('loup-garou-wolf-votes-list');
          
          if (targetSelect) {
            targetSelect.innerHTML = '';
            alivePlayers.forEach(name => {
              const opt = document.createElement('option');
              opt.value = name; opt.textContent = name;
              targetSelect.appendChild(opt);
            });
          }
          
          if (votesList && state.privateActionData && state.privateActionData.wolfVotes) {
            votesList.innerHTML = '<strong>Votes en cours de la meute :</strong><br>';
            Object.keys(state.privateActionData.wolfVotes).forEach(wolf => {
              votesList.innerHTML += `🐾 ${wolf} cible 👉 ${state.privateActionData.wolfVotes[wolf]}<br>`;
            });
          }
        }
      }
      // Witch wakes
      else if (state.myRole === 'sorciere' && state.status === 'night_sorciere') {
        waken = true;
        if (sorciereWindow) {
          sorciereWindow.classList.remove('view-hidden');
          const victimBanner = document.getElementById('loup-garou-witch-victim-banner');
          const healBtn = document.getElementById('btn-loup-garou-witch-heal');
          const killBtn = document.getElementById('btn-loup-garou-witch-kill');
          const killTargetSelect = document.getElementById('loup-garou-witch-kill-target');
          
          const wolfTarget = state.privateActionData ? state.privateActionData.wolfTarget : null;
          if (victimBanner) {
            victimBanner.textContent = wolfTarget 
              ? `Les Loups ont choisi de dévorer : ${wolfTarget} 🩸` 
              : `La meute n'a fait aucune victime cette nuit.`;
          }
          
          if (healBtn) {
            const canHeal = state.privateActionData && state.privateActionData.hasHealPotion && wolfTarget;
            healBtn.disabled = !canHeal;
            healBtn.style.opacity = canHeal ? '1' : '0.4';
          }
          
          if (killBtn) {
            const canKill = state.privateActionData && state.privateActionData.hasKillPotion;
            killBtn.disabled = !canKill;
            killBtn.style.opacity = canKill ? '1' : '0.4';
          }
          
          if (killTargetSelect) {
            killTargetSelect.innerHTML = '<option value="">-- Choisissez qui empoisonner --</option>';
            alivePlayers.forEach(name => {
              const opt = document.createElement('option');
              opt.value = name; opt.textContent = name;
              killTargetSelect.appendChild(opt);
            });
          }
        }
      }
    }
    
    if (!waken && sleepWindow) {
      sleepWindow.classList.remove('view-hidden');
      const h3 = sleepWindow.querySelector('h3');
      const p = sleepWindow.querySelector('p');
      if (h3) h3.textContent = "La Nuit est Sombre...";
      if (p) p.textContent = "Gardez les yeux fermés. Les forces de l'ombre et du bien accomplissent leur destin.";
    }
  }
  // Hunter Vengeance Phase
  else if (state.status === 'day_hunter') {
    showPanel(playPanel);
    const sleepWindow = document.getElementById('loup-garou-sleep-window');
    const hunterWindow = document.getElementById('loup-garou-hunter-window');
    
    [sleepWindow, hunterWindow].forEach(w => { if (w) w.classList.add('view-hidden'); });
    
    let activeHunter = null;
    Object.keys(state.players).forEach(name => {
      const p = state.players[name];
      if (p.role === 'chasseur' && !p.isAlive && !p.hasShot) {
        activeHunter = name;
      }
    });
    
    const turnStatusText = document.getElementById('loup-garou-turn-status-text');
    if (turnStatusText) turnStatusText.textContent = "Le Chasseur tire son coup de fusil de vengeance ! 🔫";
    
    if (activeHunter === myName) {
      if (hunterWindow) {
        hunterWindow.classList.remove('view-hidden');
        const hunterTargetSelect = document.getElementById('loup-garou-hunter-target');
        if (hunterTargetSelect) {
          hunterTargetSelect.innerHTML = '';
          Object.keys(state.players).filter(n => state.players[n].isAlive).forEach(name => {
            const opt = document.createElement('option');
            opt.value = name; opt.textContent = name;
            hunterTargetSelect.appendChild(opt);
          });
        }
      }
    } else {
      if (sleepWindow) {
        sleepWindow.classList.remove('view-hidden');
        const h3 = sleepWindow.querySelector('h3');
        const p = sleepWindow.querySelector('p');
        if (h3) h3.textContent = "Bruit de fusil... 💥";
        if (p) p.textContent = "Le village retient son souffle pendant que le Chasseur ajuste sa cible...";
      }
    }
  }
  // Day / Debates & Votes Phase
  else if (state.status === 'day_announcements' || state.status === 'day_vote') {
    showPanel(dayPanel);
    
    // History logs entries
    const historyJournal = document.getElementById('loup-garou-history-journal');
    if (historyJournal) {
      historyJournal.innerHTML = '';
      state.historyLogs.forEach(log => {
        const div = document.createElement('div');
        div.style.marginBottom = '6px';
        div.style.borderBottom = '1px solid rgba(255,255,255,0.03)';
        div.style.paddingBottom = '4px';
        div.textContent = log;
        historyJournal.appendChild(div);
      });
      historyJournal.scrollTop = historyJournal.scrollHeight;
    }
    
    const votingArea = document.getElementById('loup-garou-voting-area');
    if (state.status === 'day_vote') {
      if (votingArea) votingArea.classList.remove('view-hidden');
      
      const votingGrid = document.getElementById('loup-garou-voting-grid');
      if (votingGrid) {
        votingGrid.innerHTML = '';
        
        const voteTallies = {};
        Object.keys(state.players).forEach(name => {
          const v = state.players[name].votedFor;
          if (v) {
            voteTallies[v] = (voteTallies[v] || 0) + 1;
          }
        });
        
        const myPlayer = state.players[myName];
        const canVote = myPlayer && myPlayer.isAlive;
        const myVote = myPlayer ? myPlayer.votedFor : null;
        
        // Render card for each alive player
        Object.keys(state.players).filter(n => state.players[n].isAlive).forEach(name => {
          const card = document.createElement('div');
          card.className = `vote-card ${myVote === name ? 'active' : ''}`;
          card.style.border = myVote === name ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.08)';
          card.style.background = myVote === name ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.02)';
          card.style.padding = '12px';
          card.style.borderRadius = '10px';
          card.style.display = 'flex';
          card.style.flexDirection = 'column';
          card.style.alignItems = 'center';
          card.style.position = 'relative';
          
          const voteCount = voteTallies[name] || 0;
          let tallyBadge = '';
          if (voteCount > 0) {
            tallyBadge = `<span style="position: absolute; top: -6px; right: -6px; background: #ef4444; color: #fff; font-size: 10px; font-weight: bold; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(239,68,68,0.5);">${voteCount}</span>`;
          }
          
          card.innerHTML = `
            ${tallyBadge}
            <div style="font-size: 1.5rem; margin-bottom: 6px;">👤</div>
            <div style="font-weight: bold; font-size: 13px; text-align: center; color: #fff; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${name}</div>
            <button class="btn btn-accent btn-small" ${canVote ? '' : 'disabled'} onclick="submitLoupGarouVote('${name}')" style="margin-top: 10px; width: 100%; font-size: 10px; padding: 4px 8px; ${myVote === name ? 'background: #3b82f6; border-color: #3b82f6;' : 'background: #ef4444; border-color: #ef4444;'}">
              ${myVote === name ? 'Voté !' : 'Accuser'}
            </button>
          `;
          votingGrid.appendChild(card);
        });
        
        // Skip le vote option card
        const skipCard = document.createElement('div');
        skipCard.className = `vote-card ${myVote === 'skip' ? 'active' : ''}`;
        skipCard.style.border = myVote === 'skip' ? '2px solid #64748b' : '1px solid rgba(255,255,255,0.08)';
        skipCard.style.background = myVote === 'skip' ? 'rgba(100, 116, 139, 0.15)' : 'rgba(255,255,255,0.02)';
        skipCard.style.padding = '12px';
        skipCard.style.borderRadius = '10px';
        skipCard.style.display = 'flex';
        skipCard.style.flexDirection = 'column';
        skipCard.style.alignItems = 'center';
        skipCard.style.position = 'relative';
        
        const skipCount = voteTallies['skip'] || 0;
        let skipBadge = '';
        if (skipCount > 0) {
          skipBadge = `<span style="position: absolute; top: -6px; right: -6px; background: #64748b; color: #fff; font-size: 10px; font-weight: bold; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">${skipCount}</span>`;
        }
        
        skipCard.innerHTML = `
          ${skipBadge}
          <div style="font-size: 1.5rem; margin-bottom: 6px;">🥱</div>
          <div style="font-weight: bold; font-size: 13px; text-align: center; color: #64748b;">Passer le vote</div>
          <button class="btn btn-small" ${canVote ? '' : 'disabled'} onclick="submitLoupGarouVote('skip')" style="margin-top: 10px; width: 100%; font-size: 10px; padding: 4px 8px; background: #64748b; border-color: #64748b; color: #fff;">
            ${myVote === 'skip' ? 'Voté Skip' : 'Skip'}
          </button>
        `;
        votingGrid.appendChild(skipCard);
      }
      
      const tallyBox = document.getElementById('loup-garou-tally-box');
      const tallyBtn = document.getElementById('btn-loup-garou-tally');
      const tallyHelper = document.getElementById('loup-garou-tally-helper');
      if (tallyBox) {
        tallyBox.style.display = 'block';
        if (isHost) {
          if (tallyBtn) tallyBtn.style.display = 'inline-block';
          if (tallyHelper) tallyHelper.style.display = 'none';
        } else {
          if (tallyBtn) tallyBtn.style.display = 'none';
          if (tallyHelper) {
            tallyHelper.style.display = 'block';
            tallyHelper.textContent = "Attente que l'hôte ferme le scrutin...";
          }
        }
      }
    } else {
      if (votingArea) votingArea.classList.add('view-hidden');
    }
  }
  // Game Over Phase
  else if (state.status === 'game_over') {
    showPanel(resultsPanel);
    
    const emoji = document.getElementById('loup-garou-results-emoji');
    const title = document.getElementById('loup-garou-results-title');
    const subtitle = document.getElementById('loup-garou-results-subtitle');
    const revealList = document.getElementById('loup-garou-reveal-list');
    
    const winDetails = {
      'village': { emoji: '🏡🏆', title: 'Victoire du Village !', subtitle: 'Tous les Loups-Garous ont été éliminés. La paix revient au village.' },
      'loups': { emoji: '🐺🩸', title: 'Victoire des Loups !', subtitle: 'La meute a dévoré tous les villageois. La nuit régnera à jamais.' },
      'couple': { emoji: '💖🏆', title: 'Victoire des Amoureux !', subtitle: 'L\'amour éternel a surmonté la haine des factions. Seul le couple survit.' }
    };
    
    const wins = winDetails[state.winner] || { emoji: '🏆', title: 'Fin de la Partie', subtitle: 'Le rituel s\'achève...' };
    if (emoji) emoji.textContent = wins.emoji;
    if (title) title.textContent = wins.title;
    if (subtitle) subtitle.textContent = wins.subtitle;
    
    if (revealList) {
      revealList.innerHTML = '';
      Object.keys(state.players).forEach(name => {
        const p = state.players[name];
        const isLoverText = p.isLover ? ' (💞 Amoureux)' : '';
        const item = document.createElement('div');
        item.style.padding = '8px';
        item.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.innerHTML = `
          <span>👤 <strong>${name}</strong>${isLoverText}</span>
          <span style="font-weight: bold; color: #ef4444;">${p.role.toUpperCase()} ${p.isAlive ? '❤️ En vie' : '💀 Mort'}</span>
        `;
        revealList.appendChild(item);
      });
    }
    
    const restartBtn = document.getElementById('btn-loup-garou-restart');
    const restartHelper = document.getElementById('loup-garou-restart-helper');
    if (isHost) {
      if (restartBtn) restartBtn.style.display = 'block';
      if (restartHelper) restartHelper.style.display = 'none';
    } else {
      if (restartBtn) restartBtn.style.display = 'none';
      if (restartHelper) {
        restartHelper.style.display = 'block';
        restartHelper.textContent = "Attente que l'hôte lance un nouveau rituel...";
      }
    }
  }
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
