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

let gameState = { guesses: [], guessHistory: [], isWon: false, title: '', rawHtml: '' };
let currentRoomId = null;
let evtSource = null;
let selectedWord = null;
let selectedWordIndex = 0;
let hintsRemaining = 3;
let phraseHintUsed = false;

const dom = {
  menuOverlay: document.getElementById('menu-overlay'),
  gameView: document.getElementById('game-view'),
  roomDisplay: document.getElementById('room-display'),
  roomCodeSpan: document.getElementById('room-code'),
  leaveBtn: document.getElementById('leave-btn'),
  btnGiveUp: document.getElementById('btn-give-up'),
  btnScrollTop: document.getElementById('btn-scroll-top'),
  
  btnSolo: document.getElementById('btn-solo'),
  btnCreateRoom: document.getElementById('btn-create-room'),
  btnJoinRoom: document.getElementById('btn-join-room'),
  joinRoomInput: document.getElementById('join-room-input'),
  menuError: document.getElementById('menu-error'),

  loading: document.getElementById('loading'),
  articleContent: document.getElementById('article-content'),
  mainTitle: document.getElementById('main-title'),
  wikiText: document.getElementById('wiki-text'),
  winMessage: document.getElementById('win-message'),

  guessForm: document.getElementById('guess-form-desktop'),
  guessInput: document.getElementById('guess-input-desktop'),
  guessFormMobile: document.getElementById('guess-form-mobile'),
  guessInputMobile: document.getElementById('guess-input'),
  guessList: document.getElementById('guess-list'),
  guessTotal: document.getElementById('guess-total'),
  guessTotalDesktop: document.getElementById('guess-total-desktop'),

  sidebar: document.getElementById('sidebar'),
  mobileHandle: document.getElementById('mobile-handle'),
  
  navNewGame: document.getElementById('nav-new-game'),
  navCreateRoom: document.getElementById('nav-create-room'),
  navJoinRoom: document.getElementById('nav-join-room'),
  
  hintCountTotal: document.getElementById('hint-count-total'),
  hintCountWord: document.getElementById('hint-count-word'),
};

// --- Initialization ---
function init() {
  // Mobile Sidebar Toggle
  dom.mobileHandle.addEventListener('click', () => {
    dom.sidebar.classList.toggle('open');
  });
  
  // Menu Actions
  dom.btnSolo.addEventListener('click', () => createRoom(true));
  dom.btnCreateRoom.addEventListener('click', () => createRoom(false));
  dom.btnJoinRoom.addEventListener('click', () => {
    const code = dom.joinRoomInput.value.trim().toUpperCase();
    if (code.length >= 4) joinRoom(code);
  });
  dom.leaveBtn.addEventListener('click', leaveRoom);
  
  dom.btnGiveUp.addEventListener('click', () => {
    if (confirm("Êtes-vous sûr de vouloir abandonner ? Vous découvrirez la réponse, mais la partie sera terminée pour tous les joueurs du salon.")) {
      fetch('/api/give-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: currentRoomId })
      });
    }
  });
  
  dom.btnScrollTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  
  // Nav links
  dom.navNewGame.addEventListener('click', (e) => { e.preventDefault(); leaveRoom(); createRoom(true); });
  dom.navCreateRoom.addEventListener('click', (e) => { e.preventDefault(); leaveRoom(); createRoom(false); });
  dom.navJoinRoom.addEventListener('click', (e) => { e.preventDefault(); leaveRoom(); dom.joinRoomInput.focus(); });

  // Hint Logic
  const btnHint = document.getElementById('btn-hint');
  const hintDropdown = document.getElementById('hint-dropdown');
  const btnRevealWord = document.getElementById('hint-reveal-word');
  const btnHintPhrase = document.getElementById('hint-phrase');
  
  btnHint.addEventListener('click', () => {
    hintDropdown.style.display = hintDropdown.style.display === 'none' ? 'block' : 'none';
  });
  
  btnRevealWord.addEventListener('click', () => {
    hintDropdown.style.display = 'none';
    if (hintsRemaining <= 0) {
      alert("Vous n'avez plus d'indices disponibles pour cette partie !");
      return;
    }
    window.isHintMode = true;
    document.body.style.cursor = 'help';
  });

  btnHintPhrase.addEventListener('click', () => {
    hintDropdown.style.display = 'none';
    if (phraseHintUsed) {
      alert("Vous avez déjà utilisé l'indice phrase !");
      return;
    }
    phraseHintUsed = true;
    const hint = getPhysicalHint();
    document.getElementById('phrase-hint-text').textContent = hint;
    document.getElementById('phrase-hint-container').style.display = 'block';
  });

  // Guess function
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

  // Desktop form submit
  if (dom.guessForm) {
    dom.guessForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const word = dom.guessInput.value.trim();
      window.submitGuess(word);
    });
  }
  
  // Mobile form submit
  if (dom.guessFormMobile) {
    dom.guessFormMobile.addEventListener('submit', (e) => {
      e.preventDefault();
      const word = dom.guessInputMobile.value.trim();
      window.submitGuess(word);
    });
  }
}

function createRoom(isSolo) {
  showMenuError('');
  fetch('/api/room/create', { method: 'POST' })
    .then(r => r.json())
    .then(data => {
      if (data.roomId) startPlaying(data.roomId, isSolo);
      else showMenuError(data.error || 'Erreur création');
    }).catch(() => showMenuError('Serveur injoignable'));
}

function joinRoom(roomId) {
  showMenuError('');
  fetch('/api/room/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId })
  }).then(r => r.json()).then(data => {
    if (data.success) startPlaying(data.roomId, false);
    else showMenuError('Salon introuvable');
  });
}

function showMenuError(msg) {
  dom.menuError.textContent = msg;
  dom.menuError.style.display = msg ? 'block' : 'none';
}

function startPlaying(roomId, isSolo) {
  currentRoomId = roomId;
  dom.menuOverlay.style.display = 'none';
  dom.gameView.style.display = 'flex';
  
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

  fetchGame(roomId);
  connectSSE(roomId);
}

function leaveRoom() {
  if (evtSource) evtSource.close();
  currentRoomId = null;
  gameState = { guesses: [], guessHistory: [], isWon: false, title: '', rawHtml: '' };
  
  dom.menuOverlay.style.display = 'flex';
  dom.gameView.style.display = 'none';
  dom.roomDisplay.style.display = 'none';
  dom.winMessage.style.display = 'none';
  dom.joinRoomInput.value = '';
  dom.articleContent.classList.remove('is-won');
}

function connectSSE(roomId) {
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

function fetchGame(roomId) {
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

// --- Redaction Engine ---
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
        span.classList.add('highlight'); // Pink highlight
    }
    span.setAttribute('data-word', norm);
    return span;
  } else {
    const span = document.createElement('span');
    span.textContent = part; // Put original word so width is exactly correct
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
  // Clear highlighted state when rendering full article
  const highlights = document.querySelectorAll('.highlight');
  highlights.forEach(h => h.classList.remove('highlight'));

  // Render Title
  dom.mainTitle.innerHTML = '';
  const titleParts = gameState.title.split(/([a-zA-ZÀ-ÿœŒ0-9]+)/g);
  titleParts.forEach(part => {
    if (/[a-zA-ZÀ-ÿœŒ0-9]+/.test(part)) {
      dom.mainTitle.appendChild(createRedactedSpan(part, true));
    } else {
      dom.mainTitle.appendChild(document.createTextNode(part));
    }
  });

  // Render HTML Body
  const container = document.createElement('div');
  container.innerHTML = gameState.rawHtml;
  
  // Clean up Wikipedia noise
  const selectorsToRemove = [
    '.infobox', '.navbox', '.metadata', '.hatnote', '.ambox', 
    '.reference', '.noprint', 'style', 'script', '.thumb', '.mw-empty-elt',
    '.bandeau-portail', '.bandeau', '.toc'
  ];
  selectorsToRemove.forEach(sel => {
    container.querySelectorAll(sel).forEach(el => el.remove());
  });

  // Unwrap links (replace <a> with their children to remove hyperlinks)
  container.querySelectorAll('a').forEach(a => {
    const parent = a.parentNode;
    while(a.firstChild) parent.insertBefore(a.firstChild, a);
    parent.removeChild(a);
  });

  // Also remove bold/italic if they break things, but usually it's fine.
  
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
    // Select the display word associated with this root to highlight it
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

// --- UI Updates ---
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
    dom.winMessage.innerHTML += `<img src="${gameState.imageUrl}" style="max-width:100%; border-radius:8px; margin-top:1rem; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">`;
  }
  dom.winMessage.style.backgroundColor = 'rgba(74, 222, 128, 0.2)';
  dom.winMessage.style.borderColor = 'rgba(74, 222, 128, 0.5)';
  dom.winMessage.style.display = 'block';
  dom.articleContent.classList.add('is-won');
  // Reveal all
  const spans = document.querySelectorAll('.redacted');
  spans.forEach(span => {
    span.textContent = span.getAttribute('data-original');
    span.className = 'revealed';
  });
}

function showGiveUp() {
  dom.winMessage.innerHTML = '<h2>Vous avez abandonné !</h2><p>Le dinosaure était : <strong>' + gameState.title + '</strong></p>';
  if (gameState.imageUrl) {
    dom.winMessage.innerHTML += `<img src="${gameState.imageUrl}" style="max-width:100%; border-radius:8px; margin-top:1rem; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">`;
  }
  dom.winMessage.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'; // Red styling
  dom.winMessage.style.borderColor = 'rgba(239, 68, 68, 0.5)';
  dom.winMessage.style.display = 'block';
  dom.articleContent.classList.add('is-won');
  // Reveal all
  const spans = document.querySelectorAll('.redacted');
  spans.forEach(span => {
    span.textContent = span.getAttribute('data-original');
    span.className = 'revealed';
  });
}

init();
