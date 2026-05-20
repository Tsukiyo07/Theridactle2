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

let rooms = {}; // { roomId: { articleHTML, title, guesses, guessHistory, isWon, clients: [] } }

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
    
    // Remove hidden captions that inflate hit counts
    html = html.replace(/<div[^>]*class="[^"]*thumbcaption[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
    html = html.replace(/<div[^>]*class="[^"]*gallerytext[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
    html = html.replace(/<figcaption[^>]*>[\s\S]*?<\/figcaption>/gi, "");
    
    // Keeping .thumb divs so we can show images when won (but captions are gone)
    html = html.replace(/\[\d+\]/g, "");
    html = html.replace(/<a[^>]*>(.*?)<\/a>/gi, "$1");
    html = html.replace(/<span class="mw-editsection">[\s\S]*?<\/span>/gi, ""); // Remove edit links

    return {
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

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Create Room
  if (parsedUrl.pathname === '/api/room/create' && req.method === 'POST') {
    createRoomState().then(state => {
      let roomId = generateRoomId();
      while(rooms[roomId]) roomId = generateRoomId();
      rooms[roomId] = state;
      console.log(`Created room ${roomId} for dino: ${state.title}`);
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
      if (rooms[id]) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, roomId: id }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Room not found' }));
      }
    });
    return;
  }

  // SSE Endpoint
  if (parsedUrl.pathname === '/api/events') {
    const roomId = parsedUrl.query.roomId;
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
    
    const client = { id: Date.now(), res };
    room.clients.push(client);
    
    // Send initial state
    res.write(`data: ${JSON.stringify({ type: 'STATE', state: { 
      guesses: room.guesses, 
      guessHistory: room.guessHistory, 
      isWon: room.isWon 
    }})}\n\n`);
    
    req.on('close', () => {
      room.clients = room.clients.filter(c => c.id !== client.id);
      // Clean up empty rooms after 5 minutes (for memory)
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

  // Get current game text
  if (parsedUrl.pathname === '/api/game') {
    const roomId = parsedUrl.query.roomId;
    const room = rooms[roomId];
    if (!room) {
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
        if (!room) {
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
  
  // Only reconstruct infinitive for CLEAR verb conjugation suffixes
  // (imperfect, past historic, present participle)
  // Do NOT strip 's', 'e', 'es', 'ent' — too common in nouns (souris, bras, sauropodes...)
  const clearVerbSuf = ['aient', 'iez', 'ions', 'ait', 'ais', 'erent', 'ant'];
  for (let s of clearVerbSuf) {
    if (w.endsWith(s) && w.length - s.length >= 3) {
      return w.slice(0, -s.length) + 'er';
    }
  }
  // Return the word exactly as the user typed it
  return word;
}

// ... inside the POST /api/guess handler ...
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
        
        // Count hits based on ROOT matching
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

        // Win condition: guessed the entire title word(s)
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
  
  if (parsedUrl.pathname === '/api/give-up' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { roomId } = JSON.parse(body);
        const room = rooms[roomId];
        if (room && !room.isWon) {
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

// Serve Static Files
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
  console.log(`Theridactle Server running at http://0.0.0.0:${PORT}/`);
});
