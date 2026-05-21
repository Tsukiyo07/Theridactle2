const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

const DINOSAURS = [
  'Triceratops', 'Tyrannosaurus', 'Stegosaurus', 'Velociraptor', 'Brachiosaurus',
  'Diplodocus', 'Allosaurus', 'Spinosaurus', 'Ankylosaurus', 'Iguanodon',
  'Baryonyx', 'Carnotaurus', 'Compsognathus', 'Dilophosaurus', 'Gallimimus',
  'Parasaurolophus', 'Oviraptor', 'Pachycephalosaurus', 'Therizinosaurus', 'Troodon',
  'Maiasaura', 'Apatosaurus', 'Brontosaurus', 'Giganotosaurus', 'Albertosaurus',
  'Ceratosaurus', 'Coelophysis', 'Corythosaurus', 'Deinonychus', 'Edmontosaurus',
  'Microraptor', 'Protoceratops', 'Styracosaurus', 'Argentinosaurus', 'Camarasaurus',
  'Chasmosaurus', 'Dryosaurus', 'Euoplocephalus', 'Herrerasaurus', 'Kentrosaurus',
  'Lambeosaurus', 'Muttaburrasaurus', 'Ornithomimus', 'Pachyrhinosaurus', 'Plateosaurus',
  'Psittacosaurus', 'Saltasaurus', 'Saurolophus', 'Tarbosaurus'
];

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

const IMPOSTEUR_WORDS = {
  anime: [
    { civil: 'Pikachu', impostor: 'Raichu' },
    { civil: 'Naruto', impostor: 'Sasuke' },
    { civil: 'Luffy', impostor: 'Zoro' },
    { civil: 'Goku', impostor: 'Vegeta' },
    { civil: 'Death Note', impostor: 'Code Geass' },
    { civil: 'Totoro', impostor: 'Pikachu' },
    { civil: 'One Piece', impostor: 'Naruto' },
    { civil: 'Eren Jäger', impostor: 'Armin Arlert' },
    { civil: 'Saitama', impostor: 'Goku' }
  ],
  jeux_video: [
    { civil: 'Mario', impostor: 'Luigi' },
    { civil: 'Zelda', impostor: 'Link' },
    { civil: 'Minecraft', impostor: 'Roblox' },
    { civil: 'Fortnite', impostor: 'Apex Legends' },
    { civil: 'Sonic', impostor: 'Shadow' },
    { civil: 'PlayStation', impostor: 'Xbox' },
    { civil: 'Pokemon', impostor: 'Digimon' },
    { civil: 'Tetris', impostor: 'Pac-Man' },
    { civil: 'Nintendo Switch', impostor: 'GameBoy' }
  ],
  films_series: [
    { civil: 'Harry Potter', impostor: 'Voldemort' },
    { civil: 'Batman', impostor: 'Joker' },
    { civil: 'Star Wars', impostor: 'Star Trek' },
    { civil: 'Marvel', impostor: 'DC Comics' },
    { civil: 'Jack Sparrow', impostor: 'Indiana Jones' },
    { civil: 'Breaking Bad', impostor: 'Better Call Saul' },
    { civil: 'Game of Thrones', impostor: 'House of the Dragon' },
    { civil: 'Shrek', impostor: 'Fiona' },
    { civil: 'Netflix', impostor: 'Disney+' }
  ],
  general: [
    { civil: 'Café', impostor: 'Thé' },
    { civil: 'Chien', impostor: 'Chat' },
    { civil: 'Lion', impostor: 'Tigre' },
    { civil: 'Dauphin', impostor: 'Baleine' },
    { civil: 'Pizza', impostor: 'Burger' },
    { civil: 'Avion', impostor: 'Train' },
    { civil: 'Lune', impostor: 'Soleil' },
    { civil: 'Chocolat', impostor: 'Vanille' },
    { civil: 'Mer', impostor: 'Piscine' },
    { civil: 'Guitare', impostor: 'Piano' },
    { civil: 'Orage', impostor: 'Pluie' },
    { civil: 'Vélo', impostor: 'Trottinette' }
  ]
};

let rooms = {}; // { roomId: { gameType, ... } }

function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function normalize(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function isStopWord(word) {
  return stopWords.has(normalize(word));
}

async function createRoomState() {
  const dino = DINOSAURS[Math.floor(Math.random() * DINOSAURS.length)];
  console.log(`Fetching article for: ${dino}`);
  
  const apiUrl = `https://fr.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(dino)}&format=json&prop=text`;
  const imgApiUrl = `https://fr.wikipedia.org/w/api.php?action=query&prop=pageimages&titles=${encodeURIComponent(dino)}&format=json&pithumbsize=600`;
  
  const options = { headers: { 'User-Agent': 'Theridactle/2.0 (local-multiplayer-game)' } };
  
  const data = await new Promise((resolve, reject) => {
    https.get(apiUrl, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });
  
  const imgData = await new Promise((resolve, reject) => {
    https.get(imgApiUrl, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    }).on('error', resolve); // resolve empty on error to not crash
  });

  let imageUrl = null;
  if (imgData && imgData.query && imgData.query.pages) {
    const pages = Object.values(imgData.query.pages);
    if (pages.length > 0 && pages[0].thumbnail) {
      imageUrl = pages[0].thumbnail.source;
    }
  }

  if (data && data.parse && data.parse.text) {
    let html = data.parse.text['*'];
    
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
    html = html.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, "");
    
    html = html.replace(/<div[^>]*class="[^"]*thumbcaption[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
    html = html.replace(/<div[^>]*class="[^"]*gallerytext[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
    html = html.replace(/<figcaption[^>]*>[\s\S]*?<\/figcaption>/gi, "");
    
    html = html.replace(/\[\d+\]/g, "");
    html = html.replace(/<a[^>]*>(.*?)<\/a>/gi, "$1");
    html = html.replace(/<span class="mw-editsection">[\s\S]*?<\/span>/gi, "");

    return {
      gameType: 'theridactle',
      title: dino,
      articleHTML: html,
      imageUrl: imageUrl,
      guesses: [],
      guessHistory: [],
      isWon: false,
      clients: []
    };
  }
  throw new Error("Failed to fetch Wikipedia data");
}

function broadcast(room, data) {
  if (!room || !room.clients) return;
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  room.clients.forEach(client => client.res.write(msg));
}

function getSanitizedPlayers(room) {
  const sanitized = {};
  Object.keys(room.players).forEach(name => {
    const p = room.players[name];
    sanitized[name] = {
      nickname: p.nickname,
      description: p.description,
      votedFor: p.votedFor,
      hasVoted: p.votedFor !== null,
      isEliminated: p.isEliminated
    };
  });
  return sanitized;
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // ==========================================
  // THERIDACTLE ENDPOINTS
  // ==========================================

  // Create Room
  if (parsedUrl.pathname === '/api/room/create' && req.method === 'POST') {
    createRoomState().then(state => {
      let roomId = generateRoomId();
      while(rooms[roomId]) roomId = generateRoomId();
      rooms[roomId] = state;
      console.log(`Created Theridactle room ${roomId} for dino: ${state.title}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ roomId }));
    }).catch(err => {
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // Join Room verification
  if (parsedUrl.pathname === '/api/room/join' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      const { roomId } = JSON.parse(body);
      const id = (roomId || '').toUpperCase();
      if (rooms[id] && rooms[id].gameType === 'theridactle') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, roomId: id }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Room not found' }));
      }
    });
    return;
  }

  // Get current game text
  if (parsedUrl.pathname === '/api/game') {
    const roomId = parsedUrl.query.roomId;
    const room = rooms[roomId];
    if (!room || room.gameType !== 'theridactle') {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ html: room.articleHTML, title: room.title, isWon: room.isWon, imageUrl: room.imageUrl }));
    return;
  }

  // Submit guess
  if (parsedUrl.pathname === '/api/guess' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { word, roomId } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'theridactle') {
          res.writeHead(404);
          return res.end();
        }

        function getRoot(word) {
          let w = normalize(word);
          
          const irreg = {
            'suis': 'etre', 'es': 'etre', 'est': 'etre', 'sommes': 'etre', 'etes': 'etre', 'sont': 'etre', 'ete': 'etre', 'etais': 'etre', 'etait': 'etre', 'etions': 'etre', 'etiez': 'etre', 'etaient': 'etre', 'serai': 'etre', 'sera': 'etre', 'serons': 'etre', 'serez': 'etre', 'seront': 'etre', 'etre': 'etre',
            'ai': 'avoir', 'as': 'avoir', 'a': 'avoir', 'avons': 'avoir', 'avez': 'avoir', 'ont': 'avoir', 'avais': 'avoir', 'avait': 'avoir', 'avions': 'avoir', 'aviez': 'avoir', 'avaient': 'avoir', 'aurai': 'avoir', 'aura': 'avoir', 'aurons': 'avoir', 'aurez': 'avoir', 'auront': 'avoir', 'avoir': 'avoir',
            'vais': 'aller', 'vas': 'aller', 'va': 'aller', 'allons': 'aller', 'allez': 'aller', 'vont': 'aller', 'irai': 'aller', 'ira': 'aller', 'irons': 'aller', 'irez': 'aller', 'iront': 'aller', 'aller': 'aller',
            'fais': 'faire', 'fait': 'faire', 'faisons': 'faire', 'faites': 'faire', 'font': 'faire', 'ferai': 'faire', 'fera': 'faire', 'ferons': 'faire', 'ferez': 'faire', 'feront': 'faire', 'faire': 'faire',
            'peux': 'pouvoir', 'peut': 'pouvoir', 'pouvons': 'pouvoir', 'pouvez': 'pouvoir', 'peuvent': 'pouvoir', 'pourrai': 'pouvoir', 'pourra': 'pouvoir', 'pourrons': 'pouvoir', 'pourrez': 'pouvoir', 'pourront': 'pouvoir', 'pouvoir': 'pouvoir',
            'vivre': 'vivre', 'vis': 'vivre', 'vit': 'vivre', 'vivons': 'vivre', 'vivez': 'vivre', 'vivent': 'vivre', 'vecu': 'vivre', 'vecus': 'vivre', 'vecue': 'vivre', 'vecues': 'vivre', 'vivrai': 'vivre', 'vivra': 'vivre', 'vivrons': 'vivre', 'vivrez': 'vivre', 'vivront': 'vivre', 'vivais': 'vivre', 'vivait': 'vivre', 'vivions': 'vivre', 'viviez': 'vivre', 'vivaient': 'vivre', 'vecut': 'vivre', 'vecurent': 'vivre',
            'voir': 'voir', 'vois': 'voir', 'voit': 'voir', 'voyons': 'voir', 'voyez': 'voir', 'voient': 'voir', 'vu': 'voir', 'vus': 'voir', 'vue': 'voir', 'vues': 'voir', 'verrai': 'voir', 'verra': 'voir', 'verrons': 'voir', 'verrez': 'voir', 'verront': 'voir', 'voyais': 'voir', 'voyait': 'voir', 'voyaient': 'voir',
            'prendre': 'prendre', 'prends': 'prendre', 'prend': 'prendre', 'prenons': 'prendre', 'prenez': 'prendre', 'prennent': 'prendre', 'pris': 'prendre', 'prise': 'prendre', 'prises': 'prendre', 'prendrai': 'prendre', 'prendra': 'prendre', 'prenais': 'prendre', 'prenait': 'prendre', 'prenaient': 'prendre',
            'devoir': 'devoir', 'dois': 'devoir', 'doit': 'devoir', 'devons': 'devoir', 'devez': 'devoir', 'doivent': 'devoir', 'du': 'devoir', 'due': 'devoir', 'dus': 'devoir', 'dues': 'devoir', 'devrai': 'devoir', 'devra': 'devoir', 'devais': 'devoir', 'devait': 'devoir', 'devaient': 'devoir',
            'venir': 'venir', 'viens': 'venir', 'vient': 'venir', 'venons': 'venir', 'venez': 'venir', 'viennent': 'venir', 'venu': 'venir', 'venue': 'venir', 'venus': 'venir', 'venues': 'venir', 'viendrai': 'venir', 'viendra': 'venir', 'viendront': 'venir', 'venais': 'venir', 'venait': 'venir', 'venaient': 'venir',
            'savoir': 'savoir', 'sais': 'savoir', 'sait': 'savoir', 'savons': 'savoir', 'savez': 'savoir', 'savent': 'savoir', 'su': 'savoir', 'sus': 'savoir', 'sue': 'savoir', 'sues': 'savoir', 'saurai': 'savoir', 'saura': 'savoir', 'saurons': 'savoir', 'saurez': 'savoir', 'sauront': 'savoir', 'savais': 'savoir', 'savait': 'savoir', 'savaient': 'savoir',
            'connaitre': 'connaitre', 'connais': 'connaitre', 'connait': 'connaitre', 'connaissons': 'connaitre', 'connaissez': 'connaitre', 'connaissent': 'connaitre', 'connu': 'connaitre', 'connue': 'connaitre', 'connus': 'connaitre', 'connues': 'connaitre', 'connaissais': 'connaitre', 'connaissait': 'connaitre', 'connaissaient': 'connaitre', 'connut': 'connaitre'
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

        function getDisplayWord(word) {
          let w = normalize(word);
          const irreg = {
            'suis': 'être', 'es': 'être', 'est': 'être', 'sommes': 'être', 'etes': 'être', 'sont': 'être', 'ete': 'être', 'etais': 'être', 'etait': 'être', 'etions': 'être', 'etiez': 'être', 'etaient': 'être', 'etre': 'être',
            'ai': 'avoir', 'as': 'avoir', 'a': 'avoir', 'avons': 'avoir', 'avez': 'avoir', 'ont': 'avoir', 'avais': 'avoir', 'avait': 'avoir', 'avions': 'avoir', 'aviez': 'avoir', 'avaient': 'avoir', 'avoir': 'avoir',
            'vivre': 'vivre', 'vis': 'vivre', 'vit': 'vivre', 'vivons': 'vivre', 'vivez': 'vivre', 'vivent': 'vivre', 'vecu': 'vivre', 'vecus': 'vivre', 'vecue': 'vivre', 'vecues': 'vivre', 'vivrai': 'vivre', 'vivra': 'vivre', 'vivrons': 'vivre', 'vivrez': 'vivre', 'vivront': 'vivre', 'vivais': 'vivre', 'vivait': 'vivre', 'vivions': 'vivre', 'viviez': 'vivre', 'vivaient': 'vivre', 'vecut': 'vivre', 'vecurent': 'vivre',
            'voir': 'voir', 'vois': 'voir', 'voit': 'voir', 'voyons': 'voir', 'voyez': 'voir', 'voient': 'voir', 'vu': 'voir', 'vus': 'voir', 'vue': 'voir', 'vues': 'voir', 'verrai': 'voir', 'verra': 'voir', 'verrons': 'voir', 'verrez': 'voir', 'verront': 'voir', 'voyais': 'voir', 'voyait': 'voir', 'voyaient': 'voir',
            'prendre': 'prendre', 'prends': 'prendre', 'prend': 'prendre', 'prenons': 'prendre', 'prenez': 'prendre', 'prennent': 'prendre', 'pris': 'prendre', 'prise': 'prendre', 'prises': 'prendre', 'prendrai': 'prendre', 'prendra': 'prendre', 'prenais': 'prendre', 'prenait': 'prendre', 'prenaient': 'prendre',
            'devoir': 'devoir', 'dois': 'devoir', 'doit': 'devoir', 'devons': 'devoir', 'devez': 'devoir', 'doivent': 'devoir', 'du': 'devoir', 'due': 'devoir', 'dus': 'devoir', 'dues': 'devoir', 'devrai': 'devoir', 'devra': 'devoir', 'devais': 'devoir', 'devait': 'devoir', 'devaient': 'devoir',
            'venir': 'venir', 'viens': 'venir', 'vient': 'venir', 'venons': 'venir', 'venez': 'venir', 'viennent': 'venir', 'venu': 'venir', 'venue': 'venir', 'venus': 'venir', 'venues': 'venir', 'viendrai': 'venir', 'viendra': 'venir', 'viendront': 'venir', 'venais': 'venir', 'venait': 'venir', 'venaient': 'venir',
            'savoir': 'savoir', 'sais': 'savoir', 'sait': 'savoir', 'savons': 'savoir', 'savez': 'savoir', 'savent': 'savoir', 'su': 'savoir', 'sus': 'savoir', 'sue': 'savoir', 'sues': 'savoir', 'saurai': 'savoir', 'saura': 'savoir', 'saurons': 'savoir', 'saurez': 'savoir', 'sauront': 'savoir', 'savais': 'savoir', 'savait': 'savoir', 'savaient': 'savoir',
            'connaitre': 'connaître', 'connais': 'connaître', 'connait': 'connaître', 'connaissons': 'connaître', 'connaissez': 'connaître', 'connaissent': 'connaître', 'connu': 'connaître', 'connue': 'connaître', 'connus': 'connaître', 'connues': 'connaître', 'connaissais': 'connaître', 'connaissait': 'connaître', 'connaissaient': 'connaître', 'connut': 'connaître'
          };
          if (irreg[w]) return irreg[w];
          
          const clearVerbSuf = ['aient', 'iez', 'ions', 'ait', 'ais', 'erent', 'ant'];
          for (let s of clearVerbSuf) {
            if (w.endsWith(s) && w.length - s.length >= 3) {
              return w.slice(0, -s.length) + 'er';
            }
          }
          return word;
        }

        const rawNormWord = normalize(word.trim());
        const displayWord = getDisplayWord(word.trim());
        const rootWord = getRoot(rawNormWord);
        
        if (!rawNormWord || room.guesses.some(g => getRoot(g.raw) === rootWord)) {
          res.writeHead(400);
          return res.end();
        }

        room.guesses.push({ raw: rawNormWord, display: displayWord, root: rootWord });
        
        const normHtml = normalize(room.articleHTML.replace(/<[^>]*>?/gm, ' '));
        const normTitle = normalize(room.title);
        
        const wordsInHtml = normHtml.split(/[^a-z0-9]+/gi).filter(w => w.length > 0);
        const wordsInTitle = normTitle.split(/[^a-z0-9]+/gi).filter(w => w.length > 0);
        
        let textHits = 0;
        wordsInHtml.forEach(w => {
           if (!isStopWord(w) && getRoot(w) === rootWord) textHits++;
        });
        
        let titleHits = 0;
        wordsInTitle.forEach(w => {
           if (!isStopWord(w) && getRoot(w) === rootWord) titleHits++;
        });
        
        const hits = textHits + titleHits;

        room.guessHistory.unshift({ word: displayWord, hits, root: rootWord, raw: rawNormWord });

        let allTitleWordsGuessed = true;
        for (let w of wordsInTitle) {
          if (w.length > 2) {
             const titleRoot = getRoot(w);
             if (!room.guesses.some(g => g.root === titleRoot)) {
                allTitleWordsGuessed = false;
                break;
             }
          }
        }
        
        if (rootWord === getRoot(normTitle) || allTitleWordsGuessed) {
            room.isWon = true;
        }

        broadcast(room, { type: 'GUESS', word: displayWord, hits, isWon: room.isWon, root: rootWord, raw: rawNormWord });
        
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, hits }));
      } catch (e) {
        res.writeHead(400);
        res.end();
      }
    });
    return;
  }
  
  // Give up
  if (parsedUrl.pathname === '/api/give-up' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { roomId } = JSON.parse(body);
        const room = rooms[roomId];
        if (room && room.gameType === 'theridactle' && !room.isWon) {
          room.isWon = true;
          broadcast(room, { type: 'GIVE_UP', state: { guesses: room.guesses, guessHistory: room.guessHistory, isWon: true } });
        }
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // ==========================================
  // L'IMPOSTEUR ENDPOINTS
  // ==========================================

  // Create Imposteur Room
  if (parsedUrl.pathname === '/api/imposteur/room/create' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { nickname } = JSON.parse(body);
        const name = nickname.trim();
        if (!name) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Pseudo requis' }));
        }
        let roomId = generateRoomId();
        while(rooms[roomId]) roomId = generateRoomId();
        
        rooms[roomId] = {
          gameType: 'imposteur',
          roomId: roomId,
          status: 'lobby',
          theme: 'general',
          players: {
            [name]: { nickname: name, word: '', description: '', isImpostor: false, votedFor: null, isEliminated: false }
          },
          turnOrder: [],
          currentTurnIndex: 0,
          clients: []
        };
        
        console.log(`Created Imposteur room ${roomId} by ${name}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ roomId, nickname: name }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // Join Imposteur Room
  if (parsedUrl.pathname === '/api/imposteur/room/join' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, nickname } = JSON.parse(body);
        const id = (roomId || '').toUpperCase();
        const name = nickname.trim();
        
        if (!rooms[id] || rooms[id].gameType !== 'imposteur') {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Salon introuvable' }));
        }
        if (!name) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Pseudo requis' }));
        }
        
        const room = rooms[id];
        if (room.status !== 'lobby') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Partie déjà commencée' }));
        }
        if (room.players[name]) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Pseudo déjà utilisé dans ce salon' }));
        }
        
        room.players[name] = { nickname: name, word: '', description: '', isImpostor: false, votedFor: null, isEliminated: false };
        
        console.log(`Player ${name} joined Imposteur room ${id}`);
        
        broadcast(room, {
          type: 'IMPOSTEUR_STATE',
          state: {
            status: room.status,
            theme: room.theme,
            players: getSanitizedPlayers(room),
            turnOrder: room.turnOrder,
            currentTurnIndex: room.currentTurnIndex
          }
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, roomId: id, nickname: name }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // Get Player's Word Secretly
  if (parsedUrl.pathname === '/api/imposteur/my-word') {
    const roomId = parsedUrl.query.roomId;
    const nickname = parsedUrl.query.nickname;
    const room = rooms[roomId];
    if (!room || room.gameType !== 'imposteur' || !room.players[nickname]) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ word: room.players[nickname].word }));
    return;
  }

  // Start Imposteur Game
  if (parsedUrl.pathname === '/api/imposteur/start' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, theme } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'imposteur') {
          res.writeHead(404); return res.end();
        }
        
        const playersList = Object.keys(room.players);
        if (playersList.length < 3) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Il faut au moins 3 joueurs pour lancer une partie !' }));
        }
        
        const pairs = IMPOSTEUR_WORDS[theme] || IMPOSTEUR_WORDS.general;
        const pair = pairs[Math.floor(Math.random() * pairs.length)];
        const impostorName = playersList[Math.floor(Math.random() * playersList.length)];
        
        playersList.forEach(name => {
          const p = room.players[name];
          p.isEliminated = false;
          p.votedFor = null;
          p.description = '';
          if (name === impostorName) {
            p.isImpostor = true;
            p.word = pair.impostor;
          } else {
            p.isImpostor = false;
            p.word = pair.civil;
          }
        });
        
        room.civilWord = pair.civil;
        room.impostorWord = pair.impostor;
        room.impostorNickname = impostorName;
        room.status = 'playing';
        room.theme = theme;
        room.winner = null;
        
        room.turnOrder = [...playersList].sort(() => Math.random() - 0.5);
        room.currentTurnIndex = 0;
        
        console.log(`Imposteur Game started in room ${roomId}. Impostor is ${impostorName}. Word A: ${pair.civil}, Word B: ${pair.impostor}`);
        
        broadcast(room, {
          type: 'IMPOSTEUR_STATE',
          state: {
            status: room.status,
            theme: room.theme,
            players: getSanitizedPlayers(room),
            turnOrder: room.turnOrder,
            currentTurnIndex: room.currentTurnIndex
          }
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // Submit Description
  if (parsedUrl.pathname === '/api/imposteur/submit-description' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, nickname, description } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'imposteur') {
          res.writeHead(404); return res.end();
        }
        
        const activeTurnPlayer = room.turnOrder[room.currentTurnIndex];
        if (activeTurnPlayer !== nickname) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: "Ce n'est pas votre tour !" }));
        }
        
        const desc = description.trim().substring(0, 100);
        if (!desc) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: "La description ne peut pas être vide" }));
        }
        
        room.players[nickname].description = desc;
        room.currentTurnIndex++;
        
        if (room.currentTurnIndex >= room.turnOrder.length) {
          room.status = 'discussing';
        }
        
        broadcast(room, {
          type: 'IMPOSTEUR_STATE',
          state: {
            status: room.status,
            theme: room.theme,
            players: getSanitizedPlayers(room),
            turnOrder: room.turnOrder,
            currentTurnIndex: room.currentTurnIndex
          }
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // Vote for a player
  if (parsedUrl.pathname === '/api/imposteur/vote' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, nickname, votedNickname } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'imposteur') {
          res.writeHead(404); return res.end();
        }
        
        if (room.players[nickname].isEliminated) {
          res.writeHead(400); return res.end();
        }
        
        room.players[nickname].votedFor = votedNickname;
        
        const alivePlayers = Object.values(room.players).filter(p => !p.isEliminated);
        const votesCast = alivePlayers.filter(p => p.votedFor !== null);
        
        if (votesCast.length === alivePlayers.length) {
          const voteCounts = {};
          alivePlayers.forEach(p => voteCounts[p.nickname] = 0);
          alivePlayers.forEach(p => {
            if (p.votedFor) {
              voteCounts[p.votedFor] = (voteCounts[p.votedFor] || 0) + 1;
            }
          });
          
          let maxVotes = -1;
          let eliminatedNickname = null;
          let isTie = false;
          
          Object.keys(voteCounts).forEach(name => {
            if (voteCounts[name] > maxVotes) {
              maxVotes = voteCounts[name];
              eliminatedNickname = name;
              isTie = false;
            } else if (voteCounts[name] === maxVotes) {
              isTie = true;
            }
          });
          
          if (isTie) {
            const tied = Object.keys(voteCounts).filter(name => voteCounts[name] === maxVotes);
            eliminatedNickname = tied[Math.floor(Math.random() * tied.length)];
          }
          
          room.players[eliminatedNickname].isEliminated = true;
          const eliminatedPlayer = room.players[eliminatedNickname];
          
          if (eliminatedPlayer.isImpostor) {
            room.status = 'game_over';
            room.winner = 'civils';
          } else {
            const remainingPlayers = Object.values(room.players).filter(p => !p.isEliminated);
            const remainingImpostors = remainingPlayers.filter(p => p.isImpostor);
            
            if (remainingImpostors.length > 0 && remainingPlayers.length <= 2) {
              room.status = 'game_over';
              room.winner = 'impostor';
            } else {
              room.status = 'playing';
              room.currentTurnIndex = 0;
              room.turnOrder = room.turnOrder.filter(name => !room.players[name].isEliminated);
              
              Object.keys(room.players).forEach(name => {
                room.players[name].description = '';
                room.players[name].votedFor = null;
              });
            }
          }
        }
        
        broadcast(room, {
          type: 'IMPOSTEUR_STATE',
          state: {
            status: room.status,
            theme: room.theme,
            players: getSanitizedPlayers(room),
            turnOrder: room.turnOrder,
            currentTurnIndex: room.currentTurnIndex,
            winner: room.winner,
            civilWord: room.status === 'game_over' ? room.civilWord : null,
            impostorWord: room.status === 'game_over' ? room.impostorWord : null,
            impostorNickname: room.status === 'game_over' ? room.impostorNickname : null
          }
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // Restart Imposteur Room
  if (parsedUrl.pathname === '/api/imposteur/restart' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'imposteur') {
          res.writeHead(404); return res.end();
        }
        
        room.status = 'lobby';
        room.turnOrder = [];
        room.currentTurnIndex = 0;
        room.winner = null;
        room.civilWord = null;
        room.impostorWord = null;
        room.impostorNickname = null;
        
        Object.keys(room.players).forEach(name => {
          room.players[name].word = '';
          room.players[name].description = '';
          room.players[name].votedFor = null;
          room.players[name].isEliminated = false;
          room.players[name].isImpostor = false;
        });
        
        broadcast(room, {
          type: 'IMPOSTEUR_STATE',
          state: {
            status: room.status,
            theme: room.theme,
            players: getSanitizedPlayers(room),
            turnOrder: room.turnOrder,
            currentTurnIndex: room.currentTurnIndex
          }
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }


  // ==========================================
  // SSE CONNECTION
  // ==========================================
  
  if (parsedUrl.pathname === '/api/events') {
    const roomId = parsedUrl.query.roomId;
    const nickname = parsedUrl.query.nickname;
    const room = rooms[roomId];
    
    if (!room) {
      res.writeHead(404);
      return res.end();
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    const client = { id: Date.now(), nickname, res };
    room.clients.push(client);
    
    // Send initial state depending on gameType
    if (room.gameType === 'imposteur') {
      res.write(`data: ${JSON.stringify({ 
        type: 'IMPOSTEUR_STATE', 
        state: { 
          status: room.status,
          theme: room.theme,
          players: getSanitizedPlayers(room),
          turnOrder: room.turnOrder,
          currentTurnIndex: room.currentTurnIndex,
          winner: room.winner,
          civilWord: room.status === 'game_over' ? room.civilWord : null,
          impostorWord: room.status === 'game_over' ? room.impostorWord : null,
          impostorNickname: room.status === 'game_over' ? room.impostorNickname : null
        }
      })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ type: 'STATE', state: { 
        guesses: room.guesses, 
        guessHistory: room.guessHistory, 
        isWon: room.isWon 
      }})}\n\n`);
    }
    
    req.on('close', () => {
      room.clients = room.clients.filter(c => c.id !== client.id);
      
      // Cleanup for Imposteur if still in lobby
      if (room.gameType === 'imposteur') {
        if (nickname && room.players[nickname] && room.status === 'lobby') {
          delete room.players[nickname];
          console.log(`Player ${nickname} left Imposteur room ${roomId} (connection closed)`);
          
          broadcast(room, {
            type: 'IMPOSTEUR_STATE',
            state: {
              status: room.status,
              theme: room.theme,
              players: getSanitizedPlayers(room),
              turnOrder: room.turnOrder,
              currentTurnIndex: room.currentTurnIndex
            }
          });
        }
      }
      
      // Clean up empty rooms after 5 minutes
      if (room.clients.length === 0) {
        setTimeout(() => {
          if (rooms[roomId] && rooms[roomId].clients.length === 0) {
            delete rooms[roomId];
            console.log(`Deleted empty room ${roomId}`);
          }
        }, 5 * 60 * 1000);
      }
    });
    return;
  }

  // ==========================================
  // STATIC FILES SERVING
  // ==========================================
  let filePath = path.join(__dirname, 'client', req.url === '/' ? 'index.html' : req.url);
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpg', '.svg': 'image/svg+xml'
  };

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code == 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': mimeTypes[extname] || 'application/octet-stream' });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
});
