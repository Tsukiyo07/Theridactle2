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
let geoTimeRemaining = 15;

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
  geoMenu: dom.geoMenuView,
  theriGame: dom.theriGameView,
  impGame: dom.impGameView,
  geoGame: dom.geoGameView
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
    if (isPlayerHost) badgeHtml += `<span class="badge-item badge-host"><span class="badge-emoji">⭐</span><span class="badge-text"> Hôte</span></span>`;
    
    if (state.status === 'playing' || state.status === 'discussing') {
      const activePlayer = state.turnOrder[state.currentTurnIndex];
      if (name === activePlayer) {
        badgeHtml += `<span class="badge-item badge-thinking"><span class="badge-emoji">💭</span><span class="badge-text"> Décrit...</span></span>`;
      }
    }
    
    if (p.hasVoted) badgeHtml += `<span class="badge-item badge-voted"><span class="badge-emoji">✅</span><span class="badge-text"> Voté</span></span>`;
    if (p.isEliminated) badgeHtml += `<span class="badge-item badge-dead"><span class="badge-emoji">💀</span><span class="badge-text"> Éliminé</span></span>`;
    
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
    
    // Clear my word for round restart bug
    imposteurState.myWord = '';
    if (dom.impMyWordDisplay) {
      dom.impMyWordDisplay.textContent = '---';
    }
    
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
