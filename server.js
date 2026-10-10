const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const songsModule = require('./songs');
const POKECRIES_DATA = require('./client/pokecries-data.js');

// --- Load .env file locally if it exists ---
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  try {
    const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
    envLines.forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = (match[2] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  } catch (e) {
    console.error("Failed to load .env file:", e);
  }
}

const USERS_FILE = path.join(__dirname, 'users.json');

// --- Users & Stats DB ---
let cachedUsers = null;
function loadUsers() {
  if (cachedUsers) return cachedUsers;
  if (fs.existsSync(USERS_FILE)) {
    try {
      cachedUsers = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      return cachedUsers;
    } catch (e) {
      console.error("Erreur de lecture de users.json", e);
      cachedUsers = {};
      return cachedUsers;
    }
  }
  cachedUsers = {};
  return cachedUsers;
}

function saveUsers(users) {
  cachedUsers = users;
  fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8', (err) => {
    if (err) {
      console.error("Erreur d'écriture dans users.json", err);
    }
  });

  const key = process.env.JSONBIN_KEY;
  const usersBin = process.env.JSONBIN_USERS_BIN;
  if (key && usersBin) {
    fetch(`https://api.jsonbin.io/v3/b/${usersBin}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': key
      },
      body: JSON.stringify(users)
    }).then(r => r.json()).then(data => {
      if (data.record) console.log("Users synced to cloud successfully!");
      else console.error("Failed to sync users to cloud:", data);
    }).catch(e => {
      console.error("Failed to sync users to cloud:", e);
    });
  }
}

// --- Stats DB ---
const STATS_FILE = path.join(__dirname, 'stats.json');
let cachedStats = null;

function loadStats() {
  if (cachedStats) return cachedStats;
  try {
    if (fs.existsSync(STATS_FILE)) {
      cachedStats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
      return cachedStats;
    }
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
  cachedStats = { logs: [] };
  return cachedStats;
}

function saveStats(stats) {
  cachedStats = stats;
  fs.writeFile(STATS_FILE, JSON.stringify(stats, null, 2), 'utf8', (err) => {
    if (err) {
      console.error('Failed to save stats:', err);
    }
  });

  const key = process.env.JSONBIN_KEY;
  const statsBin = process.env.JSONBIN_STATS_BIN;
  if (key && statsBin) {
    fetch(`https://api.jsonbin.io/v3/b/${statsBin}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': key
      },
      body: JSON.stringify(stats)
    }).then(r => r.json()).then(data => {
      if (data.record) console.log("Stats synced to cloud successfully!");
      else console.error("Failed to sync stats to cloud:", data);
    }).catch(e => {
      console.error("Failed to sync stats to cloud:", e);
    });
  }
}

const STATS_GAMES = ['theridactle', 'pokedactle', 'pokecries', 'merrydactle', 'imposteur', 'geographie', 'loup_garou', 'songless'];
const STATS_SORTS = new Set(['points', 'wins', 'winRate']);

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Intelligent Competitive Points Normalization Engine
 * Balances rewards across all 8 game modes by factoring in:
 * 1. Average match duration (Temps moyen: 2.5 min à 12 min)
 * 2. Skill, performance & accuracy
 * 3. Standardized Points/Minute rate (~100 - 180 pts/min)
 */
function getCompetitivePoints(game, player) {
  if (!player) return 0;
  const isWon = player.isWinner === true;
  const rawScore = Math.max(0, safeNumber(player.score));

  switch (game) {
    // ----------------------------------------------------
    // DACTLE TRIO (Theridactle, Pokédactle, Merrydactle)
    // Avg Duration: ~5 - 7 minutes
    // Reward Range: 600 - 1 000 pts (Win) | 120 - 250 pts (Effort/Loss)
    // ----------------------------------------------------
    case 'theridactle':
    case 'pokedactle':
    case 'merrydactle': {
      if (isWon) {
        const attempts = rawScore > 0 ? rawScore : 15;
        // Exponential bonus for solving in few attempts
        // 1 guess (instant genius): 1000 pts
        // 5 guesses: 890 pts
        // 15 guesses: 730 pts
        // 30+ guesses: 600 pts floor
        const attemptBonus = Math.round(400 * Math.exp(-(Math.max(1, attempts) - 1) / 14));
        return clamp(600 + attemptBonus, 600, 1000);
      } else {
        // Effort compensation for attempting deduction
        const attempts = rawScore;
        return attempts >= 8 ? 200 : (attempts >= 3 ? 120 : 50);
      }
    }

    // ----------------------------------------------------
    // SONGLESS (Blind Test Paroles / Multi-round Speed)
    // Avg Duration: ~3.5 minutes
    // Reward Range: 500 - 850 pts (Win) | 150 - 350 pts (Loss)
    // ----------------------------------------------------
    case 'songless': {
      let normalizedPerf = rawScore;
      if (player.points && player.points > rawScore && player.points <= 100) {
        normalizedPerf = player.points;
      } else if (normalizedPerf <= 60 && normalizedPerf > 0) {
        normalizedPerf = (normalizedPerf / 60) * 100;
      }
      normalizedPerf = clamp(normalizedPerf, 0, 100);

      if (isWon) {
        return Math.round(250 + (normalizedPerf * 6.0)); // e.g. 100% -> 850 pts, 60% -> 610 pts
      } else {
        return Math.max(120, Math.round(normalizedPerf * 3.5)); // e.g. 50% -> 175 pts
      }
    }

    // ----------------------------------------------------
    // POKÉCRIES (Audio Speed Quiz / 10 Cries)
    // Avg Duration: ~2.5 minutes
    // Reward Range: 450 - 750 pts (Win) | 100 - 250 pts (Loss)
    // ----------------------------------------------------
    case 'pokecries': {
      const correctCount = rawScore > 10 ? Math.round(rawScore / 10) : rawScore;
      const accuracy = clamp(correctCount / 10, 0, 1);

      if (isWon || correctCount >= 6) {
        const baseWin = isWon ? 200 : 100;
        const scorePts = Math.round(accuracy * 450);
        const perfectBonus = correctCount >= 10 ? 100 : 0;
        return Math.round(baseWin + scorePts + perfectBonus); // 10/10 -> 750 pts, 7/10 -> 515 pts
      } else {
        return Math.max(80, Math.round(accuracy * 250));
      }
    }

    // ----------------------------------------------------
    // GÉOGRAPHIE (Map precision / Flags / Capitals)
    // Avg Duration: ~3.5 minutes
    // Reward Range: 500 - 800 pts (Win) | 150 - 300 pts (Loss)
    // ----------------------------------------------------
    case 'geographie': {
      const perfRatio = rawScore > 100 ? clamp(rawScore / 1000, 0, 1) : clamp(rawScore / 100, 0, 1);

      if (isWon || perfRatio >= 0.6) {
        const winBonus = isWon ? 200 : 100;
        return Math.round(winBonus + (perfRatio * 600)); // 100% -> 800 pts, 70% -> 620 pts
      } else {
        return Math.max(100, Math.round(perfRatio * 300));
      }
    }

    // ----------------------------------------------------
    // L'IMPOSTEUR (Social Deduction / Secret Word)
    // Avg Duration: ~8 minutes
    // Reward Range: 650 - 900 pts (Win) | 200 - 300 pts (Loss)
    // ----------------------------------------------------
    case 'imposteur': {
      if (isWon) {
        return player.role === 'impostor' ? 900 : 650;
      } else {
        return 220;
      }
    }

    // ----------------------------------------------------
    // LOUP-GAROU (Full Night/Day Roles Simulation)
    // Avg Duration: ~12 minutes
    // Reward Range: 900 - 1 400 pts (Win) | 300 - 450 pts (Loss)
    // ----------------------------------------------------
    case 'loup_garou': {
      if (isWon) {
        if (['ange', 'tueur_en_serie', 'joueur_flute'].includes(player.role)) {
          return 1400;
        }
        if (['loup_garou', 'grand_mechant_loup', 'loup_blanc'].includes(player.role)) {
          return 1100;
        }
        return 900;
      } else {
        return 320;
      }
    }

    default:
      return isWon ? 600 : 150;
  }
}

function normalizeNickname(value) {
  return String(value || '').trim().toLocaleLowerCase('fr-FR');
}

function recordGameStats(gameType, playersData, metadata = {}) {
  try {
    if (!STATS_GAMES.includes(gameType) || !Array.isArray(playersData)) return;
    const users = loadUsers();
    const players = playersData
      .filter(player => {
        if (!player || !String(player.nickname || '').trim()) return false;
        const norm = normalizeNickname(player.nickname);
        return norm && norm !== 'anonyme';
      })
      .map(player => {
        const accountTarget = (player.accountNickname && String(player.accountNickname).trim()) 
          ? String(player.accountNickname).trim() 
          : (player.account || player.nickname);
        const norm = normalizeNickname(accountTarget);
        const canonicalKey = Object.keys(users).find(k => normalizeNickname(k) === norm);
        const displayName = canonicalKey ? users[canonicalKey].nickname : String(accountTarget).trim().slice(0, 40);
        return {
          ...player,
          alias: String(player.nickname).trim().slice(0, 40),
          nickname: displayName,
          isWinner: player.isWinner === true,
          score: Math.max(0, Math.round(safeNumber(player.score))),
          points: getCompetitivePoints(gameType, player)
        };
      });
    if (!players.length) return;
    const stats = loadStats();
    if (!Array.isArray(stats.logs)) stats.logs = [];
    stats.logs.push({
      game: gameType,
      timestamp: Date.now(),
      version: 2,
      metadata,
      players
    });
    saveStats(stats);
  } catch (e) {
    console.error("Stats recording error:", e);
  }
}

function aggregateStats(logs, onlyRegistered = true) {
  const aggregates = {};
  let users = {};
  try {
    if (typeof loadUsers === 'function') users = loadUsers() || {};
  } catch (e) {}

  const registeredKeys = new Set(Object.keys(users).map(k => normalizeNickname(k)));

  (Array.isArray(logs) ? logs : []).forEach(log => {
    if (!log || !STATS_GAMES.includes(log.game) || !Array.isArray(log.players)) return;
    log.players.forEach(player => {
      const key = normalizeNickname(player.nickname);
      if (!key || key === 'anonyme') return;
      if (onlyRegistered && !registeredKeys.has(key)) return;

      if (!aggregates[key]) {
        const canonicalKey = Object.keys(users).find(k => normalizeNickname(k) === key);
        const displayName = canonicalKey ? users[canonicalKey].nickname : String(player.nickname).trim();

        aggregates[key] = {
          nickname: displayName,
          avatar: player.avatar || 'dino',
          avatarIsPhoto: !!player.avatarIsPhoto,
          gamesPlayed: 0,
          wins: 0,
          points: 0,
          rawScore: 0
        };
      }
      const aggregate = aggregates[key];
      aggregate.gamesPlayed += 1;
      if (player.isWinner === true) aggregate.wins += 1;
      aggregate.points += getCompetitivePoints(log.game, player);
      aggregate.rawScore += Math.max(0, safeNumber(player.score));
      if (player.avatar) aggregate.avatar = player.avatar;
      aggregate.avatarIsPhoto = !!player.avatarIsPhoto;
    });
  });

  // Attach latest user avatar & canonical nickname from account profile if registered
  if (users && typeof users === 'object') {
    Object.keys(users).forEach(uName => {
      const u = users[uName];
      const key = normalizeNickname(uName);
      if (aggregates[key] && u) {
        aggregates[key].nickname = u.nickname || uName;
        if (u.avatar) {
          aggregates[key].avatar = u.avatar;
          aggregates[key].avatarIsPhoto = !!u.avatarIsPhoto;
        }
      }
    });
  }

  return Object.values(aggregates).map(player => ({
    ...player,
    points: Math.round(player.points),
    winRate: player.gamesPlayed ? Math.round((player.wins / player.gamesPlayed) * 1000) / 10 : 0
  }));
}

function sortLeaderboard(players, sort = 'points') {
  const metric = STATS_SORTS.has(sort) ? sort : 'points';
  return [...players].sort((a, b) => {
    if (metric === 'winRate') {
      const aEligible = a.gamesPlayed >= 3 ? a.winRate : -1;
      const bEligible = b.gamesPlayed >= 3 ? b.winRate : -1;
      return bEligible - aEligible || b.wins - a.wins || b.points - a.points || a.nickname.localeCompare(b.nickname, 'fr');
    }
    if (metric === 'wins') return b.wins - a.wins || b.winRate - a.winRate || b.points - a.points || a.nickname.localeCompare(b.nickname, 'fr');
    return b.points - a.points || b.wins - a.wins || b.winRate - a.winRate || a.nickname.localeCompare(b.nickname, 'fr');
  });
}

let bcrypt = null;
try {
  bcrypt = require('bcryptjs');
} catch (e) {
  console.warn("bcryptjs non détecté en local. Les mots de passe utiliseront SHA-256 en fallback. (Faites npm install pour l'activer !)");
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    if (bcrypt) {
      return bcrypt.compareSync(password, storedHash);
    } else {
      console.error("Impossible de vérifier le mot de passe Bcrypt car bcryptjs n'est pas installé.");
      return false;
    }
  }
  // Fallback SHA-256
  return storedHash === crypto.createHash('sha256').update(password).digest('hex');
}

function hashPassword(password) {
  if (bcrypt) {
    return bcrypt.hashSync(password, 10);
  }
  return crypto.createHash('sha256').update(password).digest('hex');
}

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
    // Dragon Ball
    { civil: 'Son Goku', impostor: 'Végéta' },
    { civil: 'Son Gohan', impostor: 'Trunks du Futur' },
    { civil: 'Piccolo', impostor: 'Kamé Sennin' },
    { civil: 'Freezer', impostor: 'Cell' },
    { civil: 'Krilin', impostor: 'Yamcha' },
    { civil: 'Majin Bou', impostor: 'Kid Bou' },
    { civil: 'Bardock', impostor: 'Broly' },
    { civil: 'Beerus', impostor: 'Whis' },
    { civil: 'Gogeta', impostor: 'Vegetto' },
    { civil: 'Son Goten', impostor: 'Trunks' },
    { civil: 'C-17', impostor: 'C-18' },
    { civil: 'Raditz', impostor: 'Nappa' },

    // Naruto
    { civil: 'Naruto Uzumaki', impostor: 'Sasuke Uchiha' },
    { civil: 'Kakashi Hatake', impostor: 'Obito Uchiha' },
    { civil: 'Itachi Uchiha', impostor: 'Madara Uchiha' },
    { civil: 'Jiraiya', impostor: 'Orochimaru' },
    { civil: 'Tsunade', impostor: 'Orochimaru' },
    { civil: 'Gaara', impostor: 'Kankurô' },
    { civil: 'Minato Namikaze', impostor: 'Tobirama Senju' },
    { civil: 'Hashirama Senju', impostor: 'Madara Uchiha' },
    { civil: 'Hinata Hyûga', impostor: 'Sakura Haruno' },
    { civil: 'Shikamaru Nara', impostor: 'Chôji Akimichi' },
    { civil: 'Rock Lee', impostor: 'Neji Hyûga' },
    { civil: 'Pain (Nagato)', impostor: 'Konan' },
    { civil: 'Deidara', impostor: 'Sasori' },
    { civil: 'Hidan', impostor: 'Kakuzu' },
    { civil: 'Zabuza Momochi', impostor: 'Haku' },
    { civil: 'Kabuto Yakushi', impostor: 'Orochimaru' },

    // One Piece
    { civil: 'Monkey D. Luffy', impostor: 'Roronoa Zoro' },
    { civil: 'Sanji Vinsmoke', impostor: 'Roronoa Zoro' },
    { civil: 'Portgas D. Ace', impostor: 'Sabo' },
    { civil: 'Shanks le Roux', impostor: 'Dracule Mihawk' },
    { civil: 'Nami', impostor: 'Nico Robin' },
    { civil: 'Tony-Tony Chopper', impostor: 'Usopp' },
    { civil: 'Brook', impostor: 'Franky' },
    { civil: 'Jinbe', impostor: 'Franky' },
    { civil: 'Kaido', impostor: 'Big Mom' },
    { civil: 'Gold Roger', impostor: 'Barbe Blanche' },
    { civil: 'Trafalgar D. Water Law', impostor: 'Eustass Captain Kid' },
    { civil: 'Barbe Noire', impostor: 'Doflamingo' },
    { civil: 'Katakuri', impostor: 'King' },
    { civil: 'Akainu (Sakazuki)', impostor: 'Aokiji (Kuzan)' },
    { civil: 'Kizaru (Borsalino)', impostor: 'Fujitora (Issho)' },
    { civil: 'Crocodile', impostor: 'Rob Lucci' },
    { civil: 'Boa Hancock', impostor: 'Yamato' },
    { civil: 'Smoker', impostor: 'Tashigi' },

    // Death Note
    { civil: 'Light Yagami', impostor: 'L (Ryuzaki)' },
    { civil: 'Near', impostor: 'Mello' },
    { civil: 'Misa Amane', impostor: 'Kiyomi Takada' },
    { civil: 'Ryuk', impostor: 'Rem' },
    { civil: 'Soichiro Yagami', impostor: 'Touta Matsuda' },

    // Hunter x Hunter
    { civil: 'Gon Freecss', impostor: 'Killua Zoldyck' },
    { civil: 'Kurapika', impostor: 'Leorio Paradinight' },
    { civil: 'Hisoka Morow', impostor: 'Illumi Zoldyck' },
    { civil: 'Isaac Netero', impostor: 'Meruem' },
    { civil: 'Chrollo Lucilfer', impostor: 'Feitan Portor' },
    { civil: 'Neferupito (Pitou)', impostor: 'Shaiapouf (Pouf)' },
    { civil: 'Ging Freecss', impostor: 'Kite (Kaito)' },
    { civil: 'Silva Zoldyck', impostor: 'Zeno Zoldyck' },

    // Jujutsu Kaisen
    { civil: 'Yuji Itadori', impostor: 'Megumi Fushiguro' },
    { civil: 'Satoru Gojo', impostor: 'Suguru Geto' },
    { civil: 'Ryomen Sukuna', impostor: 'Mahito' },
    { civil: 'Nobara Kugisaki', impostor: 'Maki Zen\'in' },
    { civil: 'Kento Nanami', impostor: 'Aoi Todo' },
    { civil: 'Yuta Okkotsu', impostor: 'Toge Inumaki' },
    { civil: 'Toji Fushiguro', impostor: 'Naoya Zen\'in' },
    { civil: 'Choso', impostor: 'Kenjaku' },
    { civil: 'Panda', impostor: 'Toge Inumaki' },

    // Demon Slayer
    { civil: 'Tanjiro Kamado', impostor: 'Zenitsu Agatsuma' },
    { civil: 'Inosuke Hashibira', impostor: 'Zenitsu Agatsuma' },
    { civil: 'Nezuko Kamado', impostor: 'Kanao Tsuyuri' },
    { civil: 'Kyojuro Rengoku', impostor: 'Giyu Tomioka' },
    { civil: 'Muzan Kibutsuji', impostor: 'Kokushibo' },
    { civil: 'Shinobu Kocho', impostor: 'Mitsuri Kanroji' },
    { civil: 'Tengen Uzui', impostor: 'Muichiro Tokito' },
    { civil: 'Sanemi Shinazugawa', impostor: 'Genya Shinazugawa' },
    { civil: 'Akaza', impostor: 'Doma' },
    { civil: 'Gyutaro', impostor: 'Daki' },

    // Attack on Titan
    { civil: 'Eren Jäger', impostor: 'Armin Arlert' },
    { civil: 'Levi Ackerman', impostor: 'Erwin Smith' },
    { civil: 'Mikasa Ackerman', impostor: 'Annie Leonhart' },
    { civil: 'Reiner Braun', impostor: 'Bertholdt Hoover' },
    { civil: 'Sasha Blouse', impostor: 'Conny Springer' },
    { civil: 'Zeke Jäger', impostor: 'Eren Jäger' },
    { civil: 'Jean Kirschtein', impostor: 'Marco Bott' },
    { civil: 'Hansi Zoe', impostor: 'Erwin Smith' },
    { civil: 'Ymir', impostor: 'Historia Reiss' },

    // Bleach
    { civil: 'Ichigo Kurosaki', impostor: 'Uryu Ishida' },
    { civil: 'Rukia Kuchiki', impostor: 'Orihime Inoue' },
    { civil: 'Sousuke Aizen', impostor: 'Kisuke Urahara' },
    { civil: 'Toshiro Hitsugaya', impostor: 'Byakuya Kuchiki' },
    { civil: 'Kenpachi Zaraki', impostor: 'Renji Abarai' },
    { civil: 'Grimmjow Jaggerjack', impostor: 'Ulquiorra Cifer' },
    { civil: 'Gin Ichimaru', impostor: 'Kaname Tosen' },
    { civil: 'Genryusai Yamamoto', impostor: 'Shunsui Kyoraku' },

    // Fullmetal Alchemist
    { civil: 'Edward Elric', impostor: 'Alphonse Elric' },
    { civil: 'Roy Mustang', impostor: 'Riza Hawkeye' },
    { civil: 'Scar', impostor: 'King Bradley' },
    { civil: 'Envy (Envie)', impostor: 'Greed (Avarice)' },
    { civil: 'Winry Rockbell', impostor: 'Ling Yao' },

    // Chainsaw Man
    { civil: 'Denji', impostor: 'Aki Hayakawa' },
    { civil: 'Power', impostor: 'Makima' },
    { civil: 'Reze', impostor: 'Himeno' },
    { civil: 'Kishibe', impostor: 'Kobeni' },
    { civil: 'Pochita', impostor: 'Beam' },

    // One Punch Man
    { civil: 'Saitama', impostor: 'Genos' },
    { civil: 'Tatsumaki', impostor: 'Fubuki' },
    { civil: 'Garou', impostor: 'Bang' },
    { civil: 'King', impostor: 'Mumen Rider' },
    { civil: 'Speed-o\'-Sound Sonic', impostor: 'Flashy Flash' },

    // My Hero Academia
    { civil: 'Izuku Midoriya', impostor: 'Katsuki Bakugo' },
    { civil: 'Shoto Todoroki', impostor: 'Eijiro Kirishima' },
    { civil: 'All Might', impostor: 'Endeavor' },
    { civil: 'Tomura Shigaraki', impostor: 'Dabi' },
    { civil: 'Ochaco Uraraka', impostor: 'Tsuyu Asui' },
    { civil: 'Eraser Head (Aizawa)', impostor: 'Present Mic' },
    { civil: 'Hawks', impostor: 'Mirko' },
    { civil: 'Himiko Toga', impostor: 'Twice' },

    // Blue Lock & Haikyu!!
    { civil: 'Yoichi Isagi', impostor: 'Meguru Bachira' },
    { civil: 'Rin Itoshi', impostor: 'Sae Itoshi' },
    { civil: 'Seishiro Nagi', impostor: 'Reo Mikage' },
    { civil: 'Hyoma Chigiri', impostor: 'Rensuke Kunigami' },
    { civil: 'Shoyo Hinata', impostor: 'Tobio Kageyama' },
    { civil: 'Kei Tsukishima', impostor: 'Tadashi Yamaguchi' },
    { civil: 'Kenma Kozume', impostor: 'Tetsuro Kuroo' },
    { civil: 'Toru Oikawa', impostor: 'Hajime Iwaizumi' },

    // Solo Leveling, JoJo & Autres
    { civil: 'Sung Jinwoo', impostor: 'Cha Hae-in' },
    { civil: 'Yoo Jinho', impostor: 'Woo Jinchul' },
    { civil: 'Igris', impostor: 'Beru' },
    { civil: 'Jotaro Kujo', impostor: 'Dio Brando' },
    { civil: 'Jonathan Joestar', impostor: 'Joseph Joestar' },
    { civil: 'Josuke Higashikata', impostor: 'Giorno Giovanna' },
    { civil: 'Kakyoin Noriaki', impostor: 'Polnareff' },
    { civil: 'Loid Forger', impostor: 'Yor Forger' },
    { civil: 'Anya Forger', impostor: 'Bond Forger' },
    { civil: 'David Martinez', impostor: 'Lucy' },
    { civil: 'Rebecca', impostor: 'Maine' },
    { civil: 'Lelouch vi Britannia', impostor: 'Suzaku Kururugi' },
    { civil: 'C.C.', impostor: 'Kallen Stadtfeld' },
    { civil: 'Thorfinn', impostor: 'Askeladd' },
    { civil: 'Canute', impostor: 'Thorkell' },
    { civil: 'Kenzo Tenma', impostor: 'Johan Liebert' }
  ],

  jeux_video: [
    // Super Mario & Nintendo Universe
    { civil: 'Mario', impostor: 'Luigi' },
    { civil: 'Princesse Peach', impostor: 'Princesse Daisy' },
    { civil: 'Bowser', impostor: 'Bowser Jr.' },
    { civil: 'Wario', impostor: 'Waluigi' },
    { civil: 'Yoshi', impostor: 'Toad' },
    { civil: 'Harmonie (Rosalina)', impostor: 'Princesse Peach' },
    { civil: 'Donkey Kong', impostor: 'Diddy Kong' },
    { civil: 'King K. Rool', impostor: 'Donkey Kong' },
    { civil: 'Kirby', impostor: 'Meta Knight' },
    { civil: 'Roi Dadidou', impostor: 'Kirby' },
    { civil: 'Fox McCloud', impostor: 'Falco Lombardi' },
    { civil: 'Captain Falcon', impostor: 'Samus Aran' },

    // The Legend of Zelda
    { civil: 'Link', impostor: 'Princesse Zelda' },
    { civil: 'Ganondorf', impostor: 'Vaati' },
    { civil: 'Midona', impostor: 'Xanto' },
    { civil: 'Mipha', impostor: 'Prince Sidon' },
    { civil: 'Daruk', impostor: 'Urbosa' },
    { civil: 'Revali', impostor: 'Teba' },
    { civil: 'Skull Kid', impostor: 'Tingle' },
    { civil: 'Impa', impostor: 'Princesse Zelda' },

    // Pokémon
    { civil: 'Pikachu', impostor: 'Évoli' },
    { civil: 'Dracaufeu', impostor: 'Tortank' },
    { civil: 'Florizarre', impostor: 'Dracaufeu' },
    { civil: 'Mewtwo', impostor: 'Mew' },
    { civil: 'Lucario', impostor: 'Zoroark' },
    { civil: 'Gengar (Ectoplasma)', impostor: 'Alakazam' },
    { civil: 'Dialga', impostor: 'Palkia' },
    { civil: 'Groudon', impostor: 'Kyogre' },
    { civil: 'Rayquaza', impostor: 'Giratina' },
    { civil: 'Red', impostor: 'Blue' },
    { civil: 'Sacha Ketchum', impostor: 'Ondine' },
    { civil: 'Pierre (Brock)', impostor: 'Régis Chen' },
    { civil: 'Cynthia', impostor: 'Peter (Lance)' },

    // Grand Theft Auto (GTA)
    { civil: 'Michael De Santa', impostor: 'Trevor Philips' },
    { civil: 'Franklin Clinton', impostor: 'Lamar Davis' },
    { civil: 'Carl Johnson (CJ)', impostor: 'Big Smoke' },
    { civil: 'Ryder', impostor: 'Sweet Johnson' },
    { civil: 'Tommy Vercetti', impostor: 'Lance Vance' },
    { civil: 'Niko Bellic', impostor: 'Roman Bellic' },
    { civil: 'Lester Crest', impostor: 'Dave Norton' },

    // Red Dead Redemption
    { civil: 'Arthur Morgan', impostor: 'John Marston' },
    { civil: 'Dutch van der Linde', impostor: 'Hosea Matthews' },
    { civil: 'Micah Bell', impostor: 'Bill Williamson' },
    { civil: 'Sadie Adler', impostor: 'Charles Smith' },
    { civil: 'Javier Escuella', impostor: 'Lenny Summers' },

    // The Witcher
    { civil: 'Geralt de Riv', impostor: 'Ciri' },
    { civil: 'Yennefer de Vengerberg', impostor: 'Triss Merigold' },
    { civil: 'Jaskier', impostor: 'Zoltan Chivay' },
    { civil: 'Vesemir', impostor: 'Eskel' },
    { civil: 'Gaunter de Meuré', impostor: 'Olgierd von Everec' },

    // God of War
    { civil: 'Kratos', impostor: 'Atreus' },
    { civil: 'Thor', impostor: 'Odin' },
    { civil: 'Freya', impostor: 'Baldur' },
    { civil: 'Mimir', impostor: 'Brok' },
    { civil: 'Sindri', impostor: 'Brok' },
    { civil: 'Zeus', impostor: 'Arès' },

    // The Last of Us & Uncharted
    { civil: 'Joel Miller', impostor: 'Ellie Williams' },
    { civil: 'Tommy Miller', impostor: 'Joel Miller' },
    { civil: 'Abby Anderson', impostor: 'Lev' },
    { civil: 'Dina', impostor: 'Jesse' },
    { civil: 'Nathan Drake', impostor: 'Victor Sullivan (Sully)' },
    { civil: 'Elena Fisher', impostor: 'Chloe Frazer' },
    { civil: 'Sam Drake', impostor: 'Rafe Adler' },

    // Assassin's Creed
    { civil: 'Ezio Auditore', impostor: 'Altaïr Ibn-La\'Ahad' },
    { civil: 'Edward Kenway', impostor: 'Haytham Kenway' },
    { civil: 'Connor Kenway', impostor: 'Shay Patrick Cormac' },
    { civil: 'Bayek de Siwa', impostor: 'Aya d\'Alexandrie' },
    { civil: 'Kassandra', impostor: 'Alexios' },
    { civil: 'Eivor', impostor: 'Basim' },

    // Souls & Elden Ring
    { civil: 'Malenia', impostor: 'Général Radahn' },
    { civil: 'Ranni la Sorcière', impostor: 'Melina' },
    { civil: 'Godfrey', impostor: 'Radagon' },
    { civil: 'Margit le Déchu', impostor: 'Morgott' },
    { civil: 'Artorias de l\'Abysse', impostor: 'Solaire d\'Astora' },
    { civil: 'Ornstein', impostor: 'Smough' },
    { civil: 'Dame Maria', impostor: 'Père Gascoigne' },

    // Resident Evil
    { civil: 'Leon S. Kennedy', impostor: 'Chris Redfield' },
    { civil: 'Claire Redfield', impostor: 'Jill Valentine' },
    { civil: 'Albert Wesker', impostor: 'Nemesis' },
    { civil: 'Ada Wong', impostor: 'Lady Dimitrescu' },
    { civil: 'Ethan Winters', impostor: 'Mia Winters' },

    // Cyberpunk 2077
    { civil: 'V (Cyberpunk)', impostor: 'Johnny Silverhand' },
    { civil: 'Jackie Welles', impostor: 'Panam Palmer' },
    { civil: 'Judy Alvarez', impostor: 'Panam Palmer' },
    { civil: 'Goro Takemura', impostor: 'Adam Smasher' },

    // League of Legends / Arcane
    { civil: 'Jinx', impostor: 'Vi' },
    { civil: 'Yasuo', impostor: 'Yone' },
    { civil: 'Garen', impostor: 'Darius' },
    { civil: 'Lux', impostor: 'Morgana' },
    { civil: 'Zed', impostor: 'Shen' },
    { civil: 'Ahri', impostor: 'Akali' },
    { civil: 'Silco', impostor: 'Vander' },
    { civil: 'Jayce', impostor: 'Viktor' },
    { civil: 'Caitlyn', impostor: 'Vi' },

    // Overwatch
    { civil: 'Tracer', impostor: 'Sombra' },
    { civil: 'Genji', impostor: 'Hanzo' },
    { civil: 'Reinhardt', impostor: 'Winston' },
    { civil: 'Mercy (Ange)', impostor: 'Moira' },
    { civil: 'Widowmaker (Fatale)', impostor: 'Ashe' },
    { civil: 'Reaper (Faucheur)', impostor: 'Soldier: 76' },
    { civil: 'D.Va', impostor: 'Kiriko' },

    // Mortal Kombat & Street Fighter & Tekken
    { civil: 'Scorpion', impostor: 'Sub-Zero' },
    { civil: 'Liu Kang', impostor: 'Kung Lao' },
    { civil: 'Raiden', impostor: 'Shang Tsung' },
    { civil: 'Sonya Blade', impostor: 'Johnny Cage' },
    { civil: 'Ryu', impostor: 'Ken Masters' },
    { civil: 'Chun-Li', impostor: 'Cammy' },
    { civil: 'Guile', impostor: 'M. Bison' },
    { civil: 'Akuma', impostor: 'Gouken' },
    { civil: 'Jin Kazama', impostor: 'Kazuya Mishima' },
    { civil: 'Heihachi Mishima', impostor: 'Kazuya Mishima' },
    { civil: 'King (Tekken)', impostor: 'Armor King' },

    // Minecraft
    { civil: 'Steve', impostor: 'Alex' },
    { civil: 'Creeper', impostor: 'Zombie' },
    { civil: 'Squelette', impostor: 'Spider (Araignée)' },
    { civil: 'Enderman', impostor: 'Wither Squelette' },
    { civil: 'Ender Dragon', impostor: 'Wither Boss' },
    { civil: 'Villageois', impostor: 'Pillager (Pillard)' },

    // Sonic the Hedgehog
    { civil: 'Sonic', impostor: 'Shadow' },
    { civil: 'Tails', impostor: 'Knuckles' },
    { civil: 'Docteur Eggman', impostor: 'Metal Sonic' },
    { civil: 'Amy Rose', impostor: 'Rouge the Bat' },

    // Final Fantasy VII
    { civil: 'Cloud Strife', impostor: 'Zack Fair' },
    { civil: 'Tifa Lockhart', impostor: 'Aerith Gainsborough' },
    { civil: 'Sephiroth', impostor: 'Genesis' },
    { civil: 'Barret Wallace', impostor: 'Red XIII' },

    // Metal Gear Solid
    { civil: 'Solid Snake', impostor: 'Liquid Snake' },
    { civil: 'Big Boss (Naked Snake)', impostor: 'Revolver Ocelot' },
    { civil: 'Raiden (Metal Gear)', impostor: 'Gray Fox' },

    // Undertale & Deltarune
    { civil: 'Sans le squelette', impostor: 'Papyrus' },
    { civil: 'Frisk', impostor: 'Chara' },
    { civil: 'Toriel', impostor: 'Asgore' },
    { civil: 'Undyne', impostor: 'Alphys' },
    { civil: 'Kris (Deltarune)', impostor: 'Susie (Deltarune)' },

    // Portal, Hollow Knight & Cuphead
    { civil: 'GLaDOS', impostor: 'Wheatley' },
    { civil: 'Gordon Freeman', impostor: 'G-Man' },
    { civil: 'Le Chevalier (Knight)', impostor: 'Hornet' },
    { civil: 'Cuphead', impostor: 'Mugman' },
    { civil: 'King Dice', impostor: 'Le Diable' },

    // Genshin Impact
    { civil: 'Aether (Voyageur)', impostor: 'Lumine (Voyageuse)' },
    { civil: 'Zhongli', impostor: 'Raiden Shogun' },
    { civil: 'Diluc', impostor: 'Kaeya' },
    { civil: 'Hu Tao', impostor: 'Xiao' }
  ],

  films_series: [
    // Harry Potter
    { civil: 'Harry Potter', impostor: 'Ron Weasley' },
    { civil: 'Hermione Granger', impostor: 'Luna Lovegood' },
    { civil: 'Albus Dumbledore', impostor: 'Severus Rogue' },
    { civil: 'Lord Voldemort', impostor: 'Bellatrix Lestrange' },
    { civil: 'Sirius Black', impostor: 'Remus Lupin' },
    { civil: 'Drago Malefoy', impostor: 'Lucius Malefoy' },
    { civil: 'Rubeus Hagrid', impostor: 'Arthur Weasley' },
    { civil: 'Minerva McGonagall', impostor: 'Dolores Ombrage' },
    { civil: 'Fred Weasley', impostor: 'George Weasley' },
    { civil: 'Dobby', impostor: 'Kreattur' },

    // Star Wars
    { civil: 'Luke Skywalker', impostor: 'Anakin Skywalker' },
    { civil: 'Darth Vador', impostor: 'Empereur Palpatine' },
    { civil: 'Obi-Wan Kenobi', impostor: 'Qui-Gon Jinn' },
    { civil: 'Han Solo', impostor: 'Lando Calrissian' },
    { civil: 'Princesse Leia', impostor: 'Padmé Amidala' },
    { civil: 'Yoda', impostor: 'Mace Windu' },
    { civil: 'Kylo Ren', impostor: 'Darth Maul' },
    { civil: 'Boba Fett', impostor: 'Din Djarin (Mandalorian)' },
    { civil: 'Chewbacca', impostor: 'C-3PO' },
    { civil: 'R2-D2', impostor: 'BB-8' },
    { civil: 'Ahsoka Tano', impostor: 'Bo-Katan Kryze' },
    { civil: 'Comte Dooku', impostor: 'Général Grievous' },

    // Le Seigneur des Anneaux (LOTR)
    { civil: 'Frodon Sacquet', impostor: 'Sam Gamegie' },
    { civil: 'Gandalf', impostor: 'Saroumane' },
    { civil: 'Aragorn', impostor: 'Boromir' },
    { civil: 'Legolas', impostor: 'Gimli' },
    { civil: 'Gollum', impostor: 'Bilbon Sacquet' },
    { civil: 'Sauron', impostor: 'Roi-Sorcier d\'Angmar' },
    { civil: 'Pippin', impostor: 'Merry' },
    { civil: 'Théoden', impostor: 'Éomer' },
    { civil: 'Faramir', impostor: 'Boromir' },

    // Marvel Cinematic Universe (MCU)
    { civil: 'Iron Man (Tony Stark)', impostor: 'Captain America (Steve Rogers)' },
    { civil: 'Thor', impostor: 'Loki' },
    { civil: 'Spider-Man (Peter Parker)', impostor: 'Miles Morales' },
    { civil: 'Hulk (Bruce Banner)', impostor: 'Thor' },
    { civil: 'Black Widow (Natasha)', impostor: 'Hawkeye (Clint Barton)' },
    { civil: 'Doctor Strange', impostor: 'Wong' },
    { civil: 'Wanda Maximoff (Scarlet Witch)', impostor: 'Vision' },
    { civil: 'Thanos', impostor: 'Kang le Conquérant' },
    { civil: 'Black Panther (T\'Challa)', impostor: 'Killmonger' },
    { civil: 'Star-Lord (Peter Quill)', impostor: 'Rocket Raccoon' },
    { civil: 'Groot', impostor: 'Rocket Raccoon' },
    { civil: 'Deadpool (Wade Wilson)', impostor: 'Wolverine (Logan)' },
    { civil: 'Professeur X', impostor: 'Magnéto' },
    { civil: 'Bucky Barnes (Soldat de l\'Hiver)', impostor: 'Sam Wilson (Falcon)' },

    // DC Universe / Batman
    { civil: 'Batman (Bruce Wayne)', impostor: 'Nightwing (Dick Grayson)' },
    { civil: 'Le Joker', impostor: 'Le Sphinx (Riddler)' },
    { civil: 'Le Joker', impostor: 'Harley Quinn' },
    { civil: 'Superman (Clark Kent)', impostor: 'Supergirl' },
    { civil: 'Lex Luthor', impostor: 'Général Zod' },
    { civil: 'Wonder Woman', impostor: 'Aquaman' },
    { civil: 'Flash (Barry Allen)', impostor: 'Reverse Flash' },
    { civil: 'Catwoman', impostor: 'Poison Ivy' },
    { civil: 'Double-Face (Harvey Dent)', impostor: 'Le Pingouin' },
    { civil: 'Bane', impostor: 'Ra\'s al Ghul' },
    { civil: 'Robin (Damian Wayne)', impostor: 'Red Hood (Jason Todd)' },

    // Breaking Bad & Better Call Saul
    { civil: 'Walter White (Heisenberg)', impostor: 'Jesse Pinkman' },
    { civil: 'Saul Goodman (Jimmy McGill)', impostor: 'Kim Wexler' },
    { civil: 'Gustavo Fring', impostor: 'Lalo Salamanca' },
    { civil: 'Mike Ehrmantraut', impostor: 'Hank Schrader' },
    { civil: 'Tuco Salamanca', impostor: 'Hector Salamanca' },
    { civil: 'Skyler White', impostor: 'Marie Schrader' },
    { civil: 'Todd Alquist', impostor: 'Jack Welker' },

    // Game of Thrones & House of the Dragon
    { civil: 'Jon Snow', impostor: 'Robb Stark' },
    { civil: 'Daenerys Targaryen', impostor: 'Rhaenyra Targaryen' },
    { civil: 'Arya Stark', impostor: 'Sansa Stark' },
    { civil: 'Tyrion Lannister', impostor: 'Jaime Lannister' },
    { civil: 'Cersei Lannister', impostor: 'Margaery Tyrell' },
    { civil: 'Daemon Targaryen', impostor: 'Aemond Targaryen' },
    { civil: 'Ned Stark', impostor: 'Robert Baratheon' },
    { civil: 'Joffrey Baratheon', impostor: 'Ramsay Bolton' },
    { civil: 'Le Limier (Sandor Clegane)', impostor: 'La Montagne (Gregor Clegane)' },
    { civil: 'Viserys Targaryen', impostor: 'Otto Hightower' },

    // Peaky Blinders
    { civil: 'Thomas Shelby', impostor: 'Arthur Shelby' },
    { civil: 'Thomas Shelby', impostor: 'Alfie Solomons' },
    { civil: 'Polly Gray', impostor: 'Ada Thorne' },
    { civil: 'John Shelby', impostor: 'Finn Shelby' },
    { civil: 'Oswald Mosley', impostor: 'Luca Changretta' },

    // The Office (US)
    { civil: 'Michael Scott', impostor: 'Dwight Schrute' },
    { civil: 'Jim Halpert', impostor: 'Pam Beesly' },
    { civil: 'Ryan Howard', impostor: 'Kelly Kapoor' },
    { civil: 'Stanley Hudson', impostor: 'Phyllis Vance' },
    { civil: 'Kevin Malone', impostor: 'Oscar Martinez' },
    { civil: 'Creed Bratton', impostor: 'Meredith Palmer' },
    { civil: 'Andy Bernard', impostor: 'Toby Flenderson' },

    // Friends
    { civil: 'Chandler Bing', impostor: 'Joey Tribbiani' },
    { civil: 'Ross Geller', impostor: 'Chandler Bing' },
    { civil: 'Monica Geller', impostor: 'Rachel Green' },
    { civil: 'Phoebe Buffay', impostor: 'Rachel Green' },

    // Stranger Things
    { civil: 'Eleven (Onze)', impostor: 'Max Mayfield' },
    { civil: 'Mike Wheeler', impostor: 'Will Byers' },
    { civil: 'Dustin Henderson', impostor: 'Lucas Sinclair' },
    { civil: 'Steve Harrington', impostor: 'Robin Buckley' },
    { civil: 'Jim Hopper', impostor: 'Joyce Byers' },
    { civil: 'Eddie Munson', impostor: 'Jonathan Byers' },
    { civil: 'Vecna', impostor: 'Demogorgon' },

    // Pirates des Caraïbes
    { civil: 'Jack Sparrow', impostor: 'Hector Barbossa' },
    { civil: 'Will Turner', impostor: 'Elizabeth Swann' },
    { civil: 'Davy Jones', impostor: 'Barbe Noire' },

    // Shrek & DreamWorks
    { civil: 'Shrek', impostor: 'L\'Âne' },
    { civil: 'Shrek', impostor: 'Princesse Fiona' },
    { civil: 'Le Chat Potté', impostor: 'L\'Âne' },
    { civil: 'Lord Farquaad', impostor: 'Prince Charmant' },
    { civil: 'Tibiscuit (P\'tit Biscuit)', impostor: 'Pinocchio' },
    { civil: 'Po (Kung Fu Panda)', impostor: 'Maître Shifu' },
    { civil: 'Tai Lung', impostor: 'Seigneur Shen' },
    { civil: 'Alex le Lion', impostor: 'Marty le Zèbre' },

    // Disney & Pixar
    { civil: 'Woody (Toy Story)', impostor: 'Buzz l\'Éclair' },
    { civil: 'Rex (Toy Story)', impostor: 'Bayonne' },
    { civil: 'Flash McQueen', impostor: 'Martin (Cars)' },
    { civil: 'Bob Razowski', impostor: 'Jacques Sullivent (Sulley)' },
    { civil: 'Némo', impostor: 'Dory' },
    { civil: 'Simba (Roi Lion)', impostor: 'Mufasa' },
    { civil: 'Timon', impostor: 'Pumbaa' },
    { civil: 'Scar', impostor: 'Jafar' },
    { civil: 'Aladdin', impostor: 'Le Génie' },
    { civil: 'Elsa (La Reine des Neiges)', impostor: 'Anna' },
    { civil: 'Olaf', impostor: 'Sven' },
    { civil: 'Rémy (Ratatouille)', impostor: 'Linguini' },
    { civil: 'WALL-E', impostor: 'EVE' },

    // Matrix, Hunger Games & Fast/Furious
    { civil: 'Neo (Matrix)', impostor: 'Morpheus' },
    { civil: 'Trinity', impostor: 'Agent Smith' },
    { civil: 'Katniss Everdeen', impostor: 'Peeta Mellark' },
    { civil: 'Gale Hawthorne', impostor: 'Finnick Odair' },
    { civil: 'Haymitch Abernathy', impostor: 'Effie Trinket' },
    { civil: 'Président Snow', impostor: 'Présidente Coin' },
    { civil: 'Dominic Toretto', impostor: 'Brian O\'Conner' },
    { civil: 'Letty Ortiz', impostor: 'Mia Toretto' },
    { civil: 'Luke Hobbs', impostor: 'Deckard Shaw' },

    // Retour vers le Futur, Titanic & Séries cultes
    { civil: 'Marty McFly', impostor: 'Doc Brown' },
    { civil: 'Biff Tannen', impostor: 'George McFly' },
    { civil: 'Jack Dawson', impostor: 'Rose DeWitt Bukater' },
    { civil: 'Sergio Marquina (Le Professeur)', impostor: 'Berlin (Andrés)' },
    { civil: 'Tokyo (Silene)', impostor: 'Rio (Aníbal)' },
    { civil: 'Denver', impostor: 'Moscou' },
    { civil: 'Seong Gi-hun (Squid Game)', impostor: 'Cho Sang-woo' },
    { civil: 'Kang Sae-byeok', impostor: 'Ji-yeong' },
    { civil: 'Homelander (Le Protecteur)', impostor: 'Billy Butcher' },
    { civil: 'Hughie Campbell', impostor: 'La Crème (Mother\'s Milk)' },
    { civil: 'Starlight', impostor: 'Reine Maeve' },
    { civil: 'Ragnar Lothbrok', impostor: 'Bjorn Côtes-de-Fer' },
    { civil: 'Lagertha', impostor: 'Aslaug' },
    { civil: 'Ivar le Désossé', impostor: 'Ubbe' },
    { civil: 'Ted Mosby', impostor: 'Barney Stinson' },
    { civil: 'Marshall Eriksen', impostor: 'Lily Aldrin' },
    { civil: 'Sheldon Cooper', impostor: 'Leonard Hofstadter' },
    { civil: 'Howard Wolowitz', impostor: 'Rajesh Koothrappali' },
    { civil: 'Sherlock Holmes', impostor: 'Docteur John Watson' },
    { civil: 'Jim Moriarty', impostor: 'Mycroft Holmes' }
  ],

  general: [
    // Boissons & Nourriture
    { civil: 'Café', impostor: 'Thé' },
    { civil: 'Chocolat chaud', impostor: 'Cappuccino' },
    { civil: 'Pizza', impostor: 'Burger' },
    { civil: 'Frites', impostor: 'Potatoes' },
    { civil: 'Pain', impostor: 'Croissant' },
    { civil: 'Brioche', impostor: 'Pain au chocolat' },
    { civil: 'Beurre', impostor: 'Margarine' },
    { civil: 'Sel', impostor: 'Poivre' },
    { civil: 'Sucre', impostor: 'Miel' },
    { civil: 'Ketchup', impostor: 'Mayonnaise' },
    { civil: 'Moutarde', impostor: 'Wasabi' },
    { civil: 'Fraise', impostor: 'Framboise' },
    { civil: 'Pomme', impostor: 'Poire' },
    { civil: 'Orange', impostor: 'Clémentine' },
    { civil: 'Citron', impostor: 'Pamplemousse' },
    { civil: 'Banane', impostor: 'Plantain' },
    { civil: 'Pêche', impostor: 'Abricot' },
    { civil: 'Pâtes', impostor: 'Riz' },
    { civil: 'Semoule', impostor: 'Quinoa' },
    { civil: 'Bière', impostor: 'Cidre' },
    { civil: 'Vin rouge', impostor: 'Vin blanc' },
    { civil: 'Champagne', impostor: 'Prosecco' },
    { civil: 'Coca-Cola', impostor: 'Pepsi' },
    { civil: 'Eau plate', impostor: 'Eau gazeuse' },
    { civil: 'Lait', impostor: 'Lait d\'avoine' },
    { civil: 'Chocolat noir', impostor: 'Chocolat au lait' },
    { civil: 'Glace', impostor: 'Sorbet' },
    { civil: 'Crêpe', impostor: 'Gaufre' },
    { civil: 'Fromage', impostor: 'Yaourt' },
    { civil: 'Camembert', impostor: 'Brie' },
    { civil: 'Mozzarella', impostor: 'Burrata' },
    { civil: 'Raclette', impostor: 'Fondue' },
    { civil: 'Tacos', impostor: 'Burrito' },
    { civil: 'Sushis', impostor: 'Makis' },
    { civil: 'Nems', impostor: 'Samoussas' },

    // Animaux & Nature
    { civil: 'Chien', impostor: 'Chat' },
    { civil: 'Loup', impostor: 'Renard' },
    { civil: 'Lion', impostor: 'Tigre' },
    { civil: 'Léopard', impostor: 'Guépard' },
    { civil: 'Dauphin', impostor: 'Baleine' },
    { civil: 'Requin', impostor: 'Orque' },
    { civil: 'Éléphant', impostor: 'Rhinocéros' },
    { civil: 'Hippopotame', impostor: 'Rhinocéros' },
    { civil: 'Cheval', impostor: 'Zèbre' },
    { civil: 'Âne', impostor: 'Mule' },
    { civil: 'Aigle', impostor: 'Faucon' },
    { civil: 'Corbeau', impostor: 'Pie' },
    { civil: 'Pigeon', impostor: 'Colombe' },
    { civil: 'Canard', impostor: 'Cygne' },
    { civil: 'Poule', impostor: 'Dindon' },
    { civil: 'Lapin', impostor: 'Lièvre' },
    { civil: 'Souris', impostor: 'Rat' },
    { civil: 'Écureuil', impostor: 'Castor' },
    { civil: 'Serpent', impostor: 'Lézard' },
    { civil: 'Crocodile', impostor: 'Alligator' },
    { civil: 'Grenouille', impostor: 'Crapaud' },
    { civil: 'Abeille', impostor: 'Guêpe' },
    { civil: 'Papillon', impostor: 'Libellule' },
    { civil: 'Araignée', impostor: 'Scorpion' },
    { civil: 'Fourmi', impostor: 'Termite' },
    { civil: 'Forêt', impostor: 'Jungle' },
    { civil: 'Mer', impostor: 'Océan' },
    { civil: 'Rivière', impostor: 'Fleuve' },
    { civil: 'Lac', impostor: 'Étang' },
    { civil: 'Montagne', impostor: 'Colline' },
    { civil: 'Volcan', impostor: 'Montagne' },
    { civil: 'Désert', impostor: 'Savane' },
    { civil: 'Pluie', impostor: 'Neige' },
    { civil: 'Orage', impostor: 'Tempête' },
    { civil: 'Brouillard', impostor: 'Brume' },
    { civil: 'Lune', impostor: 'Soleil' },
    { civil: 'Étoile', impostor: 'Planète' },

    // Objets, Vêtements & Maison
    { civil: 'Livre', impostor: 'Liseuse' },
    { civil: 'Stylo', impostor: 'Crayon' },
    { civil: 'Feutre', impostor: 'Surligneur' },
    { civil: 'Cahier', impostor: 'Bloc-notes' },
    { civil: 'Chapeau', impostor: 'Casquette' },
    { civil: 'Bonnet', impostor: 'Béret' },
    { civil: 'Chaussures', impostor: 'Baskets' },
    { civil: 'Bottes', impostor: 'Bottines' },
    { civil: 'Chaussettes', impostor: 'Collants' },
    { civil: 'Pantoufle', impostor: 'Chausson' },
    { civil: 'Manteau', impostor: 'Veste' },
    { civil: 'Pull', impostor: 'Sweat à capuche' },
    { civil: 'Chemise', impostor: 'T-shirt' },
    { civil: 'Pantalon', impostor: 'Jean' },
    { civil: 'Short', impostor: 'Bermuda' },
    { civil: 'Lunettes de vue', impostor: 'Lentilles de contact' },
    { civil: 'Lunettes de soleil', impostor: 'Masque de ski' },
    { civil: 'Montre', impostor: 'Réveil' },
    { civil: 'Bague', impostor: 'Bracelet' },
    { civil: 'Collier', impostor: 'Pendentif' },
    { civil: 'Or', impostor: 'Argent' },
    { civil: 'Diamant', impostor: 'Rubis' },
    { civil: 'Télévision', impostor: 'Vidéoprojecteur' },
    { civil: 'Ordinateur portable', impostor: 'Tablette' },
    { civil: 'Smartphone', impostor: 'Talkie-walkie' },
    { civil: 'Casque audio', impostor: 'Écouteurs' },
    { civil: 'Enceinte Bluetooth', impostor: 'Barre de son' },
    { civil: 'Four', impostor: 'Micro-ondes' },
    { civil: 'Poêle', impostor: 'Casserole' },
    { civil: 'Fourchette', impostor: 'Cuillère' },
    { civil: 'Couteau', impostor: 'Ciseaux' },
    { civil: 'Verre', impostor: 'Tasse' },
    { civil: 'Assiette', impostor: 'Bol' },
    { civil: 'Savon', impostor: 'Gel douche' },
    { civil: 'Shampoing', impostor: 'Après-shampoing' },
    { civil: 'Brosse à dents', impostor: 'Fil dentaire' },
    { civil: 'Lit', impostor: 'Canapé' },
    { civil: 'Chaise', impostor: 'Tabouret' },
    { civil: 'Table', impostor: 'Bureau' },
    { civil: 'Porte', impostor: 'Fenêtre' },
    { civil: 'Rideau', impostor: 'Store' },
    { civil: 'Miroir', impostor: 'Vitre' },

    // Véhicules & Transports
    { civil: 'Voiture', impostor: 'Camion' },
    { civil: 'Moto', impostor: 'Scooter' },
    { civil: 'Vélo', impostor: 'Trottinette' },
    { civil: 'Avion', impostor: 'Hélicoptère' },
    { civil: 'Train', impostor: 'Métro' },
    { civil: 'Tramway', impostor: 'Bus' },
    { civil: 'Bateau', impostor: 'Sous-marin' },
    { civil: 'Ferry', impostor: 'Paquebot' },
    { civil: 'Fusée', impostor: 'Satellite' },
    { civil: 'Skateboard', impostor: 'Roller' },

    // Culture, Sports & Métiers
    { civil: 'Guitare', impostor: 'Basse' },
    { civil: 'Piano', impostor: 'Synthétiseur' },
    { civil: 'Batterie', impostor: 'Tam-tam' },
    { civil: 'Violon', impostor: 'Violoncelle' },
    { civil: 'Cinéma', impostor: 'Théâtre' },
    { civil: 'Concert', impostor: 'Festival' },
    { civil: 'Musée', impostor: 'Galerie d\'art' },
    { civil: 'Football', impostor: 'Rugby' },
    { civil: 'Tennis', impostor: 'Badminton' },
    { civil: 'Basketball', impostor: 'Handball' },
    { civil: 'Ski', impostor: 'Snowboard' },
    { civil: 'Échecs', impostor: 'Dames' },
    { civil: 'Médecin', impostor: 'Infirmier' },
    { civil: 'Dentiste', impostor: 'Orthodontiste' },
    { civil: 'Pompier', impostor: 'Policier' },
    { civil: 'Avocat', impostor: 'Juge' },
    { civil: 'Architecte', impostor: 'Ingénieur' },
    { civil: 'Professeur', impostor: 'Instituteur' }
  ]
};

const GEOGRAPHY_DATABASE = [
  // Europe
  { name: 'France', code: 'fr', capital: 'Paris', continent: 'europe', path: 'M 40,25 L 55,20 L 70,30 L 80,45 L 75,70 L 65,80 L 45,80 L 35,65 L 30,45 Z' },
  { name: 'Italie', code: 'it', capital: 'Rome', continent: 'europe', path: 'M 30,20 L 50,15 L 60,35 L 55,50 L 70,70 L 85,85 L 75,90 L 60,80 L 50,70 L 40,55 L 35,40 Z' },
  { name: 'Espagne', code: 'es', capital: 'Madrid', continent: 'europe', path: 'M 25,25 L 75,25 L 80,60 L 60,80 L 25,70 Z' },
  { name: 'Allemagne', code: 'de', capital: 'Berlin', continent: 'europe', path: 'M 25,20 L 75,20 L 85,45 L 70,80 L 40,75 L 20,50 Z' },
  { name: 'Royaume-Uni', code: 'gb', capital: 'Londres', continent: 'europe', path: 'M 35,20 L 45,25 L 40,50 L 30,70 L 20,60 Z' },
  { name: 'Suède', code: 'se', capital: 'Stockholm', continent: 'europe', path: 'M 30,15 L 45,15 L 45,45 L 35,80 L 20,70 L 25,45 Z' },
  { name: 'Grèce', code: 'gr', capital: 'Athènes', continent: 'europe', path: 'M 20,30 L 70,25 L 80,45 L 60,75 L 35,70 L 20,50 Z' },
  { name: 'Islande', code: 'is', capital: 'Reykjavik', continent: 'europe', path: 'M 20,45 L 50,35 L 80,40 L 75,60 L 45,60 L 25,50 Z' },
  { name: 'Suisse', code: 'ch', capital: 'Berne', continent: 'europe', path: 'M 20,35 L 80,35 L 80,65 L 20,65 Z' },
  { name: 'Portugal', code: 'pt', capital: 'Lisbonne', continent: 'europe', path: 'M 40,20 L 60,20 L 55,80 L 35,80 Z' },

  // Asie
  { name: 'Japon', code: 'jp', capital: 'Tokyo', continent: 'asie', path: 'M 20,80 L 35,65 L 50,50 L 65,35 L 80,20 L 85,15 L 82,20 L 65,38 L 50,55 L 35,70 L 18,85 Z' },
  { name: 'Chine', code: 'cn', capital: 'Pékin', continent: 'asie', path: 'M 15,30 L 85,25 L 90,60 L 75,85 L 45,80 L 25,60 Z' },
  { name: 'Inde', code: 'in', capital: 'New Delhi', continent: 'asie', path: 'M 25,20 L 65,25 L 70,38 L 55,55 L 48,80 L 38,55 L 30,38 Z' },
  { name: 'Corée du Sud', code: 'kr', capital: 'Séoul', continent: 'asie', path: 'M 35,25 L 65,25 L 70,60 L 40,75 L 30,55 Z' },
  { name: 'Turquie', code: 'tr', capital: 'Ankara', continent: 'asie', path: 'M 15,40 L 85,40 L 85,60 L 15,60 Z' },
  { name: 'Arabie Saoudite', code: 'sa', capital: 'Riyad', continent: 'asie', path: 'M 20,25 L 80,20 L 85,65 L 45,80 L 25,65 Z' },
  { name: 'Thaïlande', code: 'th', capital: 'Bangkok', continent: 'asie', path: 'M 30,20 L 65,20 L 60,50 L 45,85 L 35,85 Z' },

  // Afrique
  { name: 'Égypte', code: 'eg', capital: 'Le Caire', continent: 'afrique', path: 'M 25,25 L 75,25 L 75,75 L 25,75 Z' },
  { name: 'Afrique du Sud', code: 'za', capital: 'Pretoria', continent: 'afrique', path: 'M 25,25 L 75,25 L 80,50 L 60,70 L 40,70 Z' },
  { name: 'Madagascar', code: 'mg', capital: 'Antananarivo', continent: 'afrique', path: 'M 40,20 L 48,28 L 44,55 L 34,75 L 26,65 L 30,38 Z' },
  { name: 'Maroc', code: 'ma', capital: 'Rabat', continent: 'afrique', path: 'M 30,20 L 70,30 L 80,60 L 50,80 L 30,50 Z' },
  { name: 'Kenya', code: 'ke', capital: 'Nairobi', continent: 'afrique', path: 'M 35,25 L 65,20 L 75,55 L 50,75 L 30,50 Z' },
  { name: 'Algérie', code: 'dz', capital: 'Alger', continent: 'afrique', path: 'M 20,20 L 70,15 L 80,65 L 40,80 L 25,50 Z' },

  // Amérique
  { name: 'États-Unis', code: 'us', capital: 'Washington', continent: 'amerique', path: 'M 15,35 L 80,30 L 90,40 L 90,65 L 80,70 L 65,65 L 60,75 L 50,75 L 40,65 L 30,65 L 20,55 Z' },
  { name: 'Canada', code: 'ca', capital: 'Ottawa', continent: 'amerique', path: 'M 15,30 L 35,20 L 55,15 L 75,18 L 85,25 L 90,35 L 75,55 L 65,55 L 45,45 L 25,45 L 15,35 Z' },
  { name: 'Brésil', code: 'br', capital: 'Brasilia', continent: 'amerique', path: 'M 35,20 L 70,30 L 85,45 L 70,80 L 50,75 L 35,55 L 25,35 Z' },
  { name: 'Argentine', code: 'ar', capital: 'Buenos Aires', continent: 'amerique', path: 'M 35,25 L 55,30 L 50,60 L 45,85 L 35,50 Z' },
  { name: 'Mexique', code: 'mx', capital: 'Mexico', continent: 'amerique', path: 'M 20,30 L 70,35 L 80,65 L 55,75 L 35,60 Z' },
  { name: 'Colombie', code: 'co', capital: 'Bogota', continent: 'amerique', path: 'M 30,20 L 65,20 L 75,55 L 55,75 L 35,50 Z' },

  // Océanie
  { name: 'Australie', code: 'au', capital: 'Canberra', continent: 'oceanie', path: 'M 20,50 L 35,35 L 65,35 L 80,50 L 85,65 L 70,80 L 45,80 L 30,70 Z' },
  { name: 'Nouvelle-Zélande', code: 'nz', capital: 'Wellington', continent: 'oceanie', path: 'M 25,80 L 35,65 L 45,50 L 50,45 M 35,35 L 40,25 Z' }
];

let rooms = {}; // { roomId: { gameType, ... } }

function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
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

const POKEMONS = ["Abo","Abra","Absol","Aéromite","Aéroptéryx","Aflamanoir","Airmure","Akwakwak","Alakazam","Aligatueur","Altaria","Ama-Ama","Amagara","Amassel","Amonistar","Amonita","Amovénus","Amphinobi","Ampibidou","Anchwatt","Angoliath","Angoliath Gigamax","Anorith","Apireine","Apitrini","Aquali","Arakdo","Araqua","Arbok","Arboliva","Arcanin","Arcanin de Hisui","Arceus","Archéduc","Archéduc de Hisui","Archéodong","Archéomire","Arcko","Argouste","Arkéapti","Armaldo","Armulys","Arrozard","Artikodin","Artikodin de Galar","Aspicot","Astronelle","Astronelle Gigamax","Avaltout","Axoloto","Axoloto de Paldea","Azumarill","Azurill","Babimanta","Bacabouh","Badabouin","Baggaïd","Baggiguane","Balbalèze","Balbuto","Balignon","Bamboiselle","Banshitrouye","Baojian","Barbicha","Bargantua","Barloche","Barpau","Bastiodon","Batracné","Baudrive","Bazoucan","Bébécaille","Bekaglaçon","Bekipan","Beldeneige","Bérasca","Berserkatt","Bétochef","Bibichut","Blancoton","Bleuseille","Blindalys","Blindépique","Blizzaroi","Blizzeval","Blizzi","Boguérisse","Bombydou","Boréas","Boskara","Bouldeneu","Boumata","Bourrinos","Boustiflor","Braisillon","Branette","Braségali","Brindibou","Briochien","Brocélôme","Brouhabam","Brutalibré","Brutapode","Bruyverne","Bulbizarre","Câblifère","Cabriolaine","Cacnea","Cacturne","Cadoizo","Camérupt","Canarbello","Canarticho","Canarticho de Galar","Cancrelove","Candine","Caninos","Caninos de Hisui","Capidextre","Capumain","Carabaffe","Carabing","Carapagos","Carapuce","Caratroc","Carchacrok","Carmache","Carmadura","Carvanha","Castorno","Celebi","Cerbyllin","Cerfrousse","Ceribou","Ceriflor","Chacripan","Chaffreux","Chaglam","Chamallot","Chapignon","Chapotus","Charbambin","Charbi","Charibari","Charkos","Charmillon","Charmilly","Charmilly Gigamax","Charmina","Charpenti","Chartor","Chef-de-Fer","Chelours","Chenipan","Chenipotte","Cheniselle","Cheniti","Chétiflor","Chevroum","Chimpenfeu","Chinchidou","Chlorobule","Chochodile","Chongjian","Chovsourir","Chrysacier","Chrysapile","Chuchmur","Cizayox","Clamiral","Clamiral de Hisui","Cléopsytra","Clic","Cliticlic","Coatox","Cobaltium","Cochignon","Coconfort","Cocotine","Coiffeton","Coléodôme","Colhomard","Colimucus","Colimucus de Hisui","Colombeau","Colossinge","Compagnol","Concombaffe","Coquiperl","Corayôme","Corayon","Corayon de Galar","Corboss","Cornèbre","Corvaillus","Corvaillus Gigamax","Cosmog","Cosmovum","Cotovol","Couafarel","Couaneton","Coudlangue","Coupenotte","Courrousinge","Couverdure","Coxy","Coxyclaque","Crabagarre","Crabaraque","Crabicoque","Crabominable","Cradopaud","Craparoi","Crapustule","Créfadet","Créfollet","Créhelf","Crèmy","Cresselia","Crikzik","Croâporal","Crocogril","Crocorible","Crocrodil","Croquine","Crustabri","Cryodo","Cryptéro","Cupcanaille","Dardargnan","Darkrai","Darumacho","Darumacho de Galar","Darumarond","Darumarond de Galar","Debugant","Dedenne","Déflaisan","Delcatty","Délestin","Démanta","Démétéros","Démolosse","Denticrisse","Deoxys","Desséliande","Deusolourdo","Dialga","Diamat","Diancie","Dimoclès","Dimoret","Dinglu","Dinoclier","Dispareptil","Dodoala","Dodrio","Doduo","Dofin","Dogrino","Dolman","Donphan","Doudouvet","Draby","Dracaufeu","Dracaufeu Gigamax","Drackhaus","Draco","Dracolosse","Dragmara","Draïeul","Drakkarmin","Drascore","Dratatin","Dratatin Gigamax","Drattak","Dunaconda","Dunaconda Gigamax","Dunaja","Duralugon","Duralugon Gigamax","Dynavolt","Écaïd","Écayon","Écrapince","Écrémeuh","Ectoplasma","Ectoplasma Gigamax","Efflèche","Ékaïser","Élecsprint","Électhor","Électhor de Galar","Électrode","Électrode de Hisui","Élekable","Élekid","Élektek","Embrochet","Embrylex","Emolga","Empiflor","Engloutyran","Entei","Éoko","Épine-de-Fer","Escargaume","Escroco","Espèce convergente","Éthernatos","Éthernatos Infinimax","Étouraptor","Étourmi","Étourvol","Évoli","Évoli Gigamax","Exagide","Excavarenne","Excelangue","Famignol","Fantominus","Fantyrm","Farfaduvet","Farfuret","Farfuret de Hisui","Farfurex","Farigiraf","Favianos","Félicanis","Félinferno","Ferdeter","Fermite","Férosinge","Feu-Perçant","Feuforêve","Feuillajou","Feuiloutan","Feunard","Feunard d'Alola","Feunnec","Feurisson","Filentrappe","Flabébé","Flagadoss","Flagadoss de Galar","Flamajou","Flambino","Flambusard","Flamenroule","Flamiaou","Flâmigator","Flamoutan","Flingouste","Flobio","Floette","Floramantis","Floravol","Floréclat","Florges","Florizarre","Florizarre Gigamax","Flotajou","Flotillon","Flotoutan","Flotte-Mèche","Fluvetin","Fongus-Furie","Foretress","Forgelina","Forgella","Forgerette","Fort-Ivoire","Fortusimia","Fouinar","Fouinette","Fourbelin","Fragilady","Fragilady de Hisui","Fragroin","Frigodo","Frison","Frissonille","Froussardine","Fulgudog","Fulgulairo","Fulguris","Funécire","Furaiglon","Galegon","Galekid","Galeking","Galifeu","Gallame","Galopa","Galopa de Galar","Galvagla","Galvagon","Galvaran","Gambex","Gamblast","Garde-de-Fer","Gardevoir","Gaulet","Genesect","Géolithe","Germéclat","Germignon","Gigalithe","Gigansel","Girafarig","Giratina","Givrali","Glaivodo","Gloupti","Gobou","Goélise","Goinfrex","Golemastoc","Golgopathe","Gorythmic","Gorythmic Gigamax","Goupelin","Goupilou","Goupix","Goupix d'Alola","Gourmelet","Gouroutan","Grahyèna","Grainipiot","Granbull","Granivol","Gravalanch","Gravalanch d'Alola","Grelaçon","Grenousse","Gribouraigne","Griknot","Grillepattes","Grimalin","Grindur","Gringolem","Grodoudou","Grodrive","Grolem","Grolem d'Alola","Gromago","Grondogue","Groret","Grotadmorv","Grotadmorv d'Alola","Grotichon","Groudon","Gruikui","Gueriaigle","Gueriaigle de Hisui","Guérilande","Hachécateur","Hariyama","Hastacuda","Haydaim","Heatran","Hélédelle","Héliatronc","Hélionceau","Herbizarre","Héricendre","Hexadron","Hexagel","Hippodocus","Hippopotas","Ho-Oh","Hoopa","Hoothoot","Hotte-de-Fer","Hurle-Queue","Hydragla","Hydragon","Hypnomade","Hypocéan","Hyporoi","Hypotrempe","Iguolta","Incisache","Insécateur","Insolourdo","Ire-Foudre","Ixon","Jirachi","Joliflor","Judokrak","Jungko","Kabuto","Kabutops","Kadabra","Kaiminus","Kaimorse","Kangourex","Kaorine","Kapoera","Karaclée","Katagami","Kecleon","Keldeo","Keunotor","Khélocrok","Kicklee","Kirlia","Kokiyas","Koraidon","Korillon","Krabboss","Krabboss Gigamax","Krabby","Kraknoix","Krakos","Kranidos","Kravarech","Kungfouine","Kyogre","Kyurem","Kyurem Blanc","Kyurem Noir","Laggron","Lainergie","Lakmécygne","Lamantine","Lampéroie","Lampignon","Lançargot","Lanssorien","Lanturn","Laporeille","Lapyro","Larméléon","Larvadar","Larveyette","Larvibule","Latias","Latios","Léboulérou","Léopardus","Lépidonille","Lestombaile","Leuphorie","Leveinard","Léviator","Lewsor","Lézargus","Lézargus Gigamax","Lianaja","Libégon","Lilia","Lilliterelle","Limagma","Limaspeed","Limonde","Limonde de Galar","Linéon","Linéon de Galar","Lippouti","Lippoutou","Lixy","Lockpin","Lokhlass","Lokhlass Gigamax","Lombre","Lougaroc","Loupio","Lovdisc","Lucanon","Lucario","Ludicolo","Lugia","Lugulabre","Luminéon","Lumivole","Lunala","Luxio","Luxray","M. Glaquette","M. Mime","M. Mime de Galar","Machoc","Machopeur","Mackogneur","Mackogneur Gigamax","Macronium","Maganon","Magby","Magearna","Magicarpe","Magirêve","Magmar","Magnéti","Magnéton","Magnézone","Majaspic","Makuhita","Malamandre","Malosse","Malvalame","Mamanbo","Mammochon","Manaphy","Mandrillon","Manglouton","Mangriff","Manternel","Manzaï","Maracachi","Maraiste","Marcacrin","Marill","Marisson","Marshadow","Mascaïman","Maskadra","Massko","Mastouffe","Mateloutre","Matoufeu","Matourgeon","Medhyèna","Méditikka","Méga-Absol","Méga-Absol Z","Méga-Airmure","Méga-Alakazam","Méga-Aligatueur","Méga-Altaria","Méga-Amphinobi","Méga-Baggaïd","Méga-Blindépique","Méga-Blizzaroi","Méga-Branette","Méga-Braségali","Méga-Brutalibré","Méga-Brutapode","Méga-Camérupt","Méga-Carchacrok","Méga-Carchacrok Z","Méga-Charmina","Méga-Cizayox","Méga-Crabominable","Méga-Dardargnan","Méga-Darkrai","Méga-Démolosse","Méga-Diancie","Méga-Dracaufeu X","Méga-Dracaufeu Y","Méga-Dracolosse","Méga-Draïeul","Méga-Drattak","Méga-Ectoplasma","Méga-Élecsprint","Méga-Empiflor","Méga-Éoko","Méga-Étouraptor","Méga-Flagadoss","Méga-Floette","Méga-Floréclat","Méga-Florizarre","Méga-Galeking","Méga-Gallame","Méga-Gardevoir","Méga-Glaivodo","Méga-Golemastoc","Méga-Golgopathe","Méga-Goupelin","Méga-Heatran","Méga-Hexadron","Méga-Jungko","Méga-Kangourex","Méga-Kravarech","Méga-Laggron","Méga-Latias","Méga-Latios","Méga-Léviator","Méga-Lockpin","Méga-Lucario","Méga-Lucario Z","Méga-Lugulabre","Méga-Magearna","Méga-Méganium","Méga-Mélodelfe","Méga-Métalosse","Méga-Mewtwo X","Méga-Mewtwo Y","Méga-Minotaupe","Méga-Mistigrix","Méga-Momartik","Méga-Mysdibule","Méga-Nanméouïe","Méga-Némélios","Méga-Nigirigon","Méga-Ohmassacre","Méga-Oniglali","Méga-Pharamp","Méga-Ptéra","Méga-Raichu X","Méga-Raichu Y","Méga-Rayquaza","Méga-Roitiflam","Méga-Roucarnage","Méga-Sarmuraï","Méga-Scarabrute","Méga-Scarhino","Méga-Scovilain","Méga-Sepiatroce","Méga-Sharpedo","Méga-Staross","Méga-Steelix","Méga-Ténéfix","Méga-Tortank","Méga-Tyranocif","Méga-Zeraora","Méga-Zygarde","Méganium","Mégapagos","Méios","Mélancolux","Melmetal","Melmetal Gigamax","Mélo","Mélodelfe","Meloetta","Mélofée","Mélokrik","Meltan","Mentali","Mesmérella","Métalosse","Métamorph","Métang","Météno","Mew","Mewtwo","Miamiasme","Miaouss","Miaouss d'Alola","Miaouss de Galar","Miaouss Gigamax","Miascarade","Miasmax","Miasmax Gigamax","Migalos","Milobellus","Mimantis","Mime Jr.","Mimigal","Mimiqui","Mimitoss","Minidraco","Minisange","Minotaupe","Miradar","Miraidon","Mistigrix","Mite-de-Fer","Momartik","Monaflèmit","Monorpale","Monthracite","Monthracite Gigamax","Mordudor","Morpeko","Morphéo","Motisma","Motorizard","Moufflair","Moufouette","Moumouflon","Moumouton","Mouscoto","Moustillon","Moyade","Muciole","Mucuscule","Munja","Munna","Muplodocus","Muplodocus de Hisui","Mushana","Mustébouée","Mustéflott","Mygavolt","Mysdibule","Mystherbe","Nanméouïe","Natu","Necrozma","Necrozma Ailes de l'Aurore","Necrozma Crinière du Couchant","Négapi","Neitram","Némélios","Nénupiot","Nidoking","Nidoqueen","Nidoran♀","Nidoran♂","Nidorina","Nidorino","Nigirigon","Nigosier","Ningale","Ninjask","Nirondelle","Noacier","Noadkoko","Noadkoko d'Alola","Noarfang","Noctali","Noctunoir","Nodulithe","Noeunoeuf","Nosferalto","Nosferapti","Nostenfer","Nounourson","Nucléos","Nymphali","Obalie","Octillery","Ogerpon","Ohmassacre","Okéoké","Olivado","Olivini","Oniglali","Onix","Opermine","Oratoria","Ortide","Ossatueur","Ossatueur d'Alola","Osselait","Otaquin","Otaria","Otarlette","Ouistempo","Ouisticram","Ouvrifier","Oyacata","Pachirisu","Pachyradjah","Pachyradjah Gigamax","Palarticho","Palkia","Palmaval","Pandarbare","Pandespiègle","Papilord","Papilusion","Papilusion Gigamax","Papinox","Paragruel","Paras","Parasect","Parecool","Pashmilla","Passerouge","Pâtachiot","Paume-de-Fer","Pêchaminus","Pelage-Sablé","Pérégrain","Persian","Persian d'Alola","Phanpy","Pharamp","Phione","Phogleur","Phyllali","Piafabec","Picassaut","Pichu","Piclairon","Pierroteknik","Piétacé","Pifeuil","Pijako","Pikachu","Pikachu Gigamax","Pimito","Pingoléon","Pitrouille","Plumeline","Pohm","Pohmarmotte","Pohmotte","Poichigeon","Poissirène","Poissoroy","Pokémon fabuleux","Pokémon légendaire","Pokémon Paradoxe","Polagriffe","Polarhume","Polichombr","Poltchageist","Polthégeist","Pomdepik","Pomdorochi","Pomdramour","Pomdrapi","Pomdrapi Gigamax","Ponchien","Ponchiot","Pondralugon","Ponyta","Ponyta de Galar","Porygon","Porygon-Z","Porygon2","Posipi","Poulpaf","Poussacha","Poussifeu","Prédastérie","Primo-Groudon","Primo-Kyogre","Prinplouf","Prismillon","Psykokwak","Psystigri","Ptéra","Ptiravi","Ptitard","Ptyranidur","Pyrax","Pyrobut","Pyrobut Gigamax","Pyroli","Pyronille","Quartermac","Queulorior","Qulbutoké","Qwilfish","Qwilfish de Hisui","Qwilpik","Racaillou","Racaillou d'Alola","Rafflesia","Raichu","Raichu d'Alola","Raikou","Ramboum","Ramoloss","Ramoloss de Galar","Rampe-Ailes","Rapasdepic","Rapion","Ratentif","Rattata","Rattata d'Alola","Rattatac","Rattatac d'Alola","Rayquaza","Regice","Regidrago","Regieleki","Regigigas","Regirock","Registeel","Relicanth","Rémoraid","Reptincel","Reshiram","Rexillius","Rhinastoc","Rhinocorne","Rhinoféros","Rhinolove","Riolu","Roc-de-Fer","Rocabot","Roigada","Roigada de Galar","Roitiflam","Rondoudou","Ronflex","Ronflex Gigamax","Rongourmand","Rongrigou","Rosabyss","Rosélia","Roserade","Rototaupe","Roublenard","Roucarnage","Roucool","Roucoups","Roue-de-Fer","Roussil","Rozbouton","Rubombelle","Rugit-Lune","Sabelette","Sabelette d'Alola","Sablaireau","Sablaireau d'Alola","Salamèche","Salarsen","Salarsen Gigamax","Sancoki","Sapereau","Saquedeneu","Sarmuraï","Scalpereur","Scalpion","Scalproie","Scarabrute","Scarhino","Scobolide","Scolocendre","Scolocendre Gigamax","Scorplane","Scorvol","Scovilain","Scrutella","Séléroc","Selutin","Sepiatop","Sepiatroce","Séracrawl","Séracrawl de Hisui","Serpang","Serpente-Eau","Séviper","Shaofouine","Sharpedo","Shaymin","Shifours","Shifours Gigamax","Sidérella","Silvallié","Simiabraz","Simularbre","Sinistrail","Skelénox","Skitty","Smogo","Smogogo","Smogogo de Galar","Snubbull","Solaroc","Solgaleo","Solochi","Sonistrelle","Soporifik","Sorbébé","Sorbouboul","Sorboul","Sorcilence","Sorcilence Gigamax","Sovkipou","Spectreval","Spectrum","Spinda","Spiritomb","Spododo","Spoink","Stalgamin","Stari","Staross","Statitik","Steelix","Strassie","Sucreine","Sucroquin","Suicune","Sulfura","Sulfura de Galar","Superdofin","Sylveroy","Sylveroy, le Cavalier d'Effroi","Sylveroy, le Cavalier du Froid","Symbios","Tadmorv","Tadmorv d'Alola","Tag-Tag","Tapatoès","Tarenbulle","Tarinor","Tarinorme","Tarpaud","Tarsal","Tartard","Taupikeau","Taupiqueur","Taupiqueur d'Alola","Tauros","Tauros de Paldea","Teddiursa","Ténéfix","Tengalice","Tentacool","Tentacruel","Téraclope","Terapagos","Terhal","Terracool","Terracruel","Terraiste","Terrakium","Têtampoule","Têtarte","Têtes-de-Fer","Théffroi","Théffroyable","Tiboudet","Tic","Tiplouf","Tissenboule","Togedemaru","Togekiss","Togepi","Togetic","Tokopisco","Tokopiyon","Tokorico","Tokotoro","Tomberro","Torgamord","Torgamord Gigamax","Tortank","Tortank Gigamax","Torterra","Tortipouss","Toudoudou","Tournegrin","Tournicoton","Toutombe","Toxizap","Tranchodon","Trépassable","Triopikeau","Triopikeur","Triopikeur d'Alola","Trioxhydre","Tritonde","Tritosor","Tritox","Trompignon","Tropius","Trousselin","Tutafeh","Tutafeh de Galar","Tutankafer","Tutétékri","Tygnon","Tylton","Type:0","Typhlosion","Typhlosion de Hisui","Tyranocif","Ultra-Chimère","Ultra-Necrozma","Ursaking","Ursaring","Vacilys","Vaututrice","Vémini","Venalgue","Venipatte","Verpom","Vert-de-Fer","Vibraninf","Victini","Vigoroth","Vipélierre","Virevorreur","Viridium","Virovent","Viskuse","Vivaldaim","Volcanion","Volcaropod","Voltali","Voltorbe","Voltorbe de Hisui","Voltoutou","Vorastérie","Vortente","Vostourno","Vrombi","Vrombotor","Wagomine","Wailmer","Wailord","Wattapik","Wattouat","Wimessir","Wushours","Xatu","XD001","Xerneas","Yanma","Yanmega","Ymphect","Yuyu","Yveltal","Zacian","Zamazenta","Zapétrel","Zarbi","Zarude","Zébibron","Zéblitz","Zekrom","Zeraora","Zéroïd","Zigzaton","Zigzaton de Galar","Zoroark","Zoroark de Hisui","Zorua","Zorua de Hisui","Zygarde"];

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

async function createPokedactleRoomState(category = 'all') {
  let list = POKEMONS;
  if (category === 'gen1') list = POKEMONS.slice(0, 151);
  else if (category === 'gen2') list = POKEMONS.slice(151, 251);
  else if (category === 'gen3') list = POKEMONS.slice(251, 386);
  else if (category === 'gen4') list = POKEMONS.slice(386, 493);
  else if (category === 'gen5') list = POKEMONS.slice(493, 649);
  else if (category === 'gen6') list = POKEMONS.slice(649, 721);
  else if (category === 'gen7') list = POKEMONS.slice(721, 809);
  else if (category === 'gen8') list = POKEMONS.slice(809, 905);
  else if (category === 'gen9') list = POKEMONS.slice(905);
  if (!list || list.length === 0) list = POKEMONS;

  const pokemon = list[Math.floor(Math.random() * list.length)];
  console.log(`Fetching Pokepedia article for: ${pokemon} (category: ${category})`);
  
  const apiUrl = `https://www.pokepedia.fr/api.php?action=parse&page=${encodeURIComponent(pokemon)}&format=json&prop=text`;
  const imgApiUrl = `https://www.pokepedia.fr/api.php?action=query&titles=${encodeURIComponent(pokemon)}&prop=pageimages&format=json&pithumbsize=600`;
  
  const options = { headers: { 'User-Agent': 'Pokedactle/1.0 (pokemon-redactle-game)' } };
  
  const data = await new Promise((resolve, reject) => {
    https.get(apiUrl, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
  
  let imageUrl = null;
  try {
    const imgData = await new Promise((resolve, reject) => {
      https.get(imgApiUrl, options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch (e) { resolve(null); }
        });
      }).on('error', () => resolve(null));
    });
    
    if (imgData && imgData.query && imgData.query.pages) {
      const pages = Object.values(imgData.query.pages);
      if (pages.length > 0 && pages[0].thumbnail) {
        imageUrl = pages[0].thumbnail.source;
      }
    }
  } catch (e) {
    imageUrl = null;
  }

  if (data && data.parse && data.parse.text) {
    let html = data.parse.text['*'];
    
    // 1. Cut everything before the first intro paragraph <p><b>
    const introIdx = html.search(/<p>\s*<b>/i);
    if (introIdx !== -1) {
      html = html.substring(introIdx);
    }
    
    // 2. Remove TOC before cutting sections
    html = html.replace(/<div\b[^>]*class="[^"]*toc[^"]*"[\s\S]*?<\/ul>\s*<\/div>/gi, '');
    html = html.replace(/<div\b[^>]*id="toc"[\s\S]*?<\/ul>\s*<\/div>/gi, '');
    
    // 3. Cut heavy technical/gameplay sections after lore
    const cutSections = ['Localisations', 'Capacités', 'Sensibilités', 'Statistiques', 'Stratégie', 'Imagerie', 'Dans le Jeu de Cartes', 'Notes et références', 'Galerie', 'Apparitions', 'Distributions'];
    for (const sec of cutSections) {
      const idx = html.search(new RegExp('<h2[^>]*id="[^"]*' + sec + '[^"]*"[^>]*>', 'i'));
      if (idx !== -1) {
        html = html.substring(0, idx);
      }
    }

    // 4. Remove scripts, styles, audio, tables, edit sections, etc.
    html = html.replace(/<span\b[^>]*class="[^"]*mw-editsection[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '');
    html = html.replace(/<div\b[^>]*class="[^"]*mw-heading-actions[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    html = html.replace(/<center>[\s\S]*?<\/center>/gi, '');
    html = html.replace(/<ul\b[^>]*class="[^"]*gallery[^"]*"[^>]*>[\s\S]*?<\/ul>/gi, '');
    html = html.replace(/<div\b[^>]*class="[^"]*(toc|navbox|bandeau|ruban|onglets|thumbcaption|gallerytext|thumb)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    html = html.replace(/<audio\b[^<]*(?:(?!<\/audio>)<[^<]*)*<\/audio>/gi, '');
    html = html.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, '');
    html = html.replace(/<sup[^>]*class="reference"[^>]*>[\s\S]*?<\/sup>/gi, '');
    html = html.replace(/<span>modifier<\/span>/gi, '');
    html = html.replace(/\[\d+\]/g, '');
    html = html.replace(/\[\s*modifier\s*\]/gi, '');
    html = html.replace(/modifier\s*\]/gi, '');
    html = html.replace(/\[\s*modifier/gi, '');
    html = html.replace(/<a[^>]*>(.*?)<\/a>/gi, '$1');
    
    return {
      gameType: 'pokedactle',
      status: 'lobby',
      host: '',
      roundNumber: 1,
      totalRounds: 3,
      hintsAllowed: 3,
      category: category,
      title: pokemon,
      articleHTML: html,
      imageUrl: imageUrl,
      guesses: [],
      guessHistory: [],
      isWon: false,
      winner: null,
      players: {},
      leaderboard: [],
      clients: []
    };
  }
  throw new Error("Failed to fetch Pokepedia data");
}

const ONE_PIECE_ENTRIES = [
  // Équipage du Chapeau de Paille & Navires
  'Monkey D. Luffy', 'Roronoa Zoro', 'Nami', 'Usopp', 'Sanji Vinsmoke',
  'Tony-Tony Chopper', 'Nico Robin', 'Franky', 'Brook', 'Jinbe',
  'Nefertari Vivi', 'Going Merry', 'Thousand Sunny', 'Vogue Merry',
  
  // Alliés majeurs, Supernovas & Corsaires alliés
  'Trafalgar D. Water Law', 'Eustass Kid', 'Yamato', 'Kozuki Oden', 'Portgas D. Ace',
  'Sabo', 'Boa Hancock', 'Bartolomeo', 'Cavendish', 'Carrot', 'Kinemon',
  'Momonosuke Kozuki', 'Marco', 'Edward Newgate', 'Gol D. Roger', 'Silvers Rayleigh',
  'Shanks', 'Jewelry Bonney', 'Capone Bege', 'Basil Hawkins', 'Killer', 'X. Drake',
  'Scratchmen Apoo', 'Bartholomew Kuma', 'Don Quijote Rosinante', 'Fisher Tiger',
  'Otohime', 'Shirahoshi', 'Rebecca', 'Kyros', 'Laboon', 'Pedro', 'Inuarashi',
  'Nekomamushi', 'Raizo', 'Kanjuro', 'Denjiro', 'Izo', 'Shimotsuki Ryuma',
  'Zeff', 'Jaguar D. Saul', 'Koala', 'Vegapunk', 'Stussy',
  
  // Empereurs, Corsaires & Antagonistes
  'Kaido', 'Charlotte Linlin', 'Marshall D. Teach', 'Don Quijote Doflamingo',
  'Crocodile', 'Gecko Moria', 'Rob Lucci', 'Enel', 'Dracule Mihawk', 'Buggy',
  'Arlong', 'Hody Jones', 'César Clown', 'Charlotte Katakuri', 'King', 'Queen',
  'Jack', 'Charlotte Perospero', 'Charlotte Smoothie', 'Charlotte Cracker',
  'Charlotte Pudding', 'Vinsmoke Judge', 'Vinsmoke Reiju', 'Vinsmoke Ichiji',
  'Vinsmoke Niji', 'Vinsmoke Yonji', 'Don Krieg', 'Kuro', 'Morgan', 'Alvida',
  'Wapol', 'Bellamy', 'Foxy', 'Magellan', 'Shiryu', 'Trebol', 'Diamante', 'Pica',
  'Sugar', 'Monet', 'Vergo', 'Caribou', 'Perona', 'Señor Pink',
  
  // Marine & Gouvernement Mondial & Révolutionnaires
  'Sakazuki', 'Kuzan', 'Borsalino', 'Issho', 'Aramaki', 'Monkey D. Garp',
  'Sengoku', 'Koby', 'Smoker', 'Tashigi', 'Spandam', 'Im', 'Gorosei',
  'Monkey D. Dragon', 'Emporio Ivankov', 'Saint Jaygarcia Saturn', 'Kaku',
  'Jabura', 'Blueno', 'Kalifa', 'Hina', 'Sentomaru', 'Helmeppo',
  'Belo Betty', 'Karasu', 'Lindbergh', 'Morley',
  
  // Îles, Lieux légendaires & Géographie
  'Wano', 'Dressrosa', 'Alabasta', 'Skypiea', 'Enies Lobby', 'Marine Ford',
  'Impel Down', 'Whole Cake', 'Water 7', 'Sabaody', 'Laugh Tale', 'Egg Head',
  'Loguetown', 'Île des Hommes-Poissons',
  
  // Fruits du Démon, Armes Antiques & Concepts
  'One Piece', 'Gomu Gomu no Mi', 'Mera Mera no Mi', 'Ope Ope no Mi',
  'Fruit du Démon', 'Haki', 'Road Ponéglyphe', 'Ponéglyphe', 'Pluton', 'Poséidon', 'Uranus'
];

async function createMerrydactleRoomState(category = 'all') {
  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let list = ONE_PIECE_ENTRIES;
    if (category === 'characters') {
      list = ONE_PIECE_ENTRIES.slice(0, 25);
    } else if (category === 'islands_ships') {
      list = ONE_PIECE_ENTRIES.filter(e => e.includes('Going') || e.includes('Sunny') || e.includes('Merry') || e.includes('Wano') || e.includes('Dressrosa') || e.includes('Alabasta') || e.includes('Skypiea') || e.includes('Impel'));
      if (list.length === 0) list = ONE_PIECE_ENTRIES;
    } else if (category === 'fruits_lore') {
      list = ONE_PIECE_ENTRIES.filter(e => e.includes('Mi') || e.includes('Haki') || e.includes('Fruit') || e.includes('Ponéglyphe') || e.includes('Pluton'));
      if (list.length === 0) list = ONE_PIECE_ENTRIES;
    }
    const entry = list[Math.floor(Math.random() * list.length)];
    console.log(`Fetching One Piece wiki article for: ${entry} (category: ${category})`);
    
    try {
      const apiUrl = `https://onepiece.fandom.com/fr/api.php?action=parse&page=${encodeURIComponent(entry)}&redirects=1&format=json&prop=text|displaytitle`;
      const imgApiUrl = `https://onepiece.fandom.com/fr/api.php?action=query&titles=${encodeURIComponent(entry)}&redirects=1&prop=pageimages&format=json&pithumbsize=600`;
      
      const options = { headers: { 'User-Agent': 'Merrydactle/1.0 (one-piece-redactle-game)' } };
      
      const data = await new Promise((resolve, reject) => {
        https.get(apiUrl, options, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
          });
        }).on('error', reject);
      });
      
      let imageUrl = null;
      try {
        const imgData = await new Promise((resolve, reject) => {
          https.get(imgApiUrl, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
              try { resolve(JSON.parse(body)); } catch (e) { resolve(null); }
            });
          }).on('error', () => resolve(null));
        });
        
        if (imgData && imgData.query && imgData.query.pages) {
          const pages = Object.values(imgData.query.pages);
          if (pages.length > 0 && pages[0].thumbnail) {
            imageUrl = pages[0].thumbnail.source;
          }
        }
      } catch (e) {
        imageUrl = null;
      }

      if (data && data.parse && data.parse.text) {
        let html = data.parse.text['*'];
        const resolvedTitle = data.parse.title || entry;
        
        // 1. Cut everything before the first intro paragraph <p><b>
        const introIdx = html.search(/<p>\s*<b>/i);
        if (introIdx !== -1) {
          html = html.substring(introIdx);
        }
        
        // 2. Remove TOC before cutting sections
        html = html.replace(/<div\b[^>]*class="[^"]*toc[^"]*"[\s\S]*?<\/ul>\s*<\/div>/gi, '');
        html = html.replace(/<div\b[^>]*id="toc"[\s\S]*?<\/ul>\s*<\/div>/gi, '');
        
        // 3. Cut heavy technical/extra sections after lore
        const cutSections = ['Références', 'Galerie', 'Navigation du Site', 'Futilités', 'Marchandises', 'Anime et Manga Différences', 'Navigation', 'Notes et références'];
        for (const sec of cutSections) {
          const idx = html.search(new RegExp('<h2[^>]*id="[^"]*' + sec + '[^"]*"[^>]*>', 'i'));
          if (idx !== -1) {
            html = html.substring(0, idx);
          }
        }

        // 4. Remove scripts, styles, infoboxes, galleries, audio, tables, edit sections, etc.
        html = html.replace(/<span\b[^>]*class="[^"]*mw-editsection[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '');
        html = html.replace(/<div\b[^>]*class="[^"]*mw-heading-actions[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
        html = html.replace(/<center>[\s\S]*?<\/center>/gi, '');
        html = html.replace(/<ul\b[^>]*class="[^"]*gallery[^"]*"[^>]*>[\s\S]*?<\/ul>/gi, '');
        html = html.replace(/<div\b[^>]*class="[^"]*(toc|navbox|bandeau|ruban|onglets|thumbcaption|gallerytext|thumb|portable-infobox)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
        html = html.replace(/<aside\b[^>]*class="[^"]*portable-infobox[^"]*"[^>]*>[\s\S]*?<\/aside>/gi, '');
        html = html.replace(/<aside\b[^>]*>[\s\S]*?<\/aside>/gi, '');
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
        html = html.replace(/<audio\b[^<]*(?:(?!<\/audio>)<[^<]*)*<\/audio>/gi, '');
        html = html.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, '');
        html = html.replace(/<sup[^>]*class="reference"[^>]*>[\s\S]*?<\/sup>/gi, '');
        html = html.replace(/<span>modifier<\/span>/gi, '');
        html = html.replace(/\[\d+\]/g, '');
        html = html.replace(/\[\s*modifier\s*\]/gi, '');
        html = html.replace(/modifier\s*\]/gi, '');
        html = html.replace(/\[\s*modifier/gi, '');
        html = html.replace(/<a[^>]*>(.*?)<\/a>/gi, '$1');
        
        return {
          gameType: 'merrydactle',
          status: 'lobby',
          host: '',
          roundNumber: 1,
          totalRounds: 3,
          hintsAllowed: 3,
          category: category,
          title: resolvedTitle,
          articleHTML: html,
          imageUrl: imageUrl,
          guesses: [],
          guessHistory: [],
          isWon: false,
          winner: null,
          players: {},
          leaderboard: [],
          clients: []
        };
      }
    } catch (err) {
      console.warn(`Attempt ${attempt + 1} failed for ${entry}:`, err.message);
    }
  }
  throw new Error("Impossible de charger un article One Piece.");
}

async function createRoomState(category = 'all') {
  let list = DINOSAURS;
  if (category === 'theropodes') {
    list = DINOSAURS.filter(d => ['Tyrannosaurus', 'Spinosaurus', 'Velociraptor', 'Allosaurus', 'Giganotosaurus', 'Carnotaurus', 'Baryonyx', 'Dilophosaurus', 'Ceratosaurus', 'Megalosaurus'].includes(d));
    if (list.length === 0) list = DINOSAURS;
  } else if (category === 'sauropodes') {
    list = DINOSAURS.filter(d => ['Brachiosaurus', 'Diplodocus', 'Apatosaurus', 'Brontosaurus', 'Argentinosaurus', 'Titanosaurus', 'Dreadnoughtus'].includes(d));
    if (list.length === 0) list = DINOSAURS;
  }
  const dino = list[Math.floor(Math.random() * list.length)];
  console.log(`Fetching Wikipedia article for Dino: ${dino} (category: ${category})`);
  
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
      status: 'lobby',
      host: '',
      roundNumber: 1,
      totalRounds: 3,
      hintsAllowed: 3,
      category: category,
      title: dino,
      articleHTML: html,
      imageUrl: imageUrl,
      guesses: [],
      guessHistory: [],
      isWon: false,
      winner: null,
      players: {},
      leaderboard: [],
      clients: []
    };
  }
  throw new Error("Failed to fetch Wikipedia data");
}

function getSanitizedDactlePlayers(room) {
  const sanitized = {};
  if (!room.players) room.players = {};
  Object.keys(room.players).forEach(name => {
    const p = room.players[name];
    sanitized[name] = {
      nickname: p.nickname,
      avatar: p.avatar || (room.gameType === 'merrydactle' ? '🏴‍☠️' : (room.gameType === 'pokedactle' ? '⚡' : '🦖')),
      avatarIsPhoto: p.avatarIsPhoto || false,
      score: p.score || 0,
      isConnected: p.isConnected !== false,
      guessesCount: p.guessesCount || 0
    };
  });
  return sanitized;
}

function getDactleLeaderboard(room) {
  if (!room.players) return [];
  return Object.values(room.players)
    .map(p => ({
      nickname: p.nickname,
      avatar: p.avatar || (room.gameType === 'merrydactle' ? '🏴‍☠️' : (room.gameType === 'pokedactle' ? '⚡' : '🦖')),
      avatarIsPhoto: p.avatarIsPhoto || false,
      score: p.score || 0
    }))
    .sort((a, b) => b.score - a.score);
}

function getDactleStatePayload(room) {
  return {
    gameType: room.gameType,
    status: room.status || 'lobby',
    host: room.host || '',
    roundNumber: room.roundNumber || 1,
    totalRounds: room.totalRounds || 3,
    category: room.category || 'all',
    hintsAllowed: room.hintsAllowed !== undefined ? room.hintsAllowed : 3,
    title: (room.status === 'round_ended' || room.status === 'game_ended' || room.isWon) ? room.title : null,
    articleHTML: (room.status === 'playing' || room.status === 'round_ended' || room.status === 'game_ended') ? room.articleHTML : null,
    imageUrl: (room.status === 'round_ended' || room.status === 'game_ended' || room.isWon) ? room.imageUrl : null,
    guesses: room.guesses || [],
    guessHistory: room.guessHistory || [],
    isWon: room.isWon || false,
    winner: room.winner || null,
    players: getSanitizedDactlePlayers(room),
    leaderboard: getDactleLeaderboard(room)
  };
}

function broadcastDactleState(room) {
  if (!room) return;
  const payload = getDactleStatePayload(room);
  let eventType = 'THERIDACTLE_STATE';
  if (room.gameType === 'pokedactle') eventType = 'POKEDACTLE_STATE';
  else if (room.gameType === 'merrydactle') eventType = 'MERRYDACTLE_STATE';
  
  broadcast(room, {
    type: eventType,
    state: payload
  });
}

function broadcast(room, data) {
  if (!room || !room.clients) return;
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  room.clients = room.clients.filter(client => {
    try {
      client.res.write(msg);
      return true;
    } catch (e) {
      return false;
    }
  });
}

function getSanitizedPlayers(room) {
  const sanitized = {};
  Object.keys(room.players).forEach(name => {
    const p = room.players[name];
    sanitized[name] = {
      nickname: p.nickname,
      avatar: p.avatar || '🦖',
      avatarIsPhoto: p.avatarIsPhoto || false,
      votedFor: p.votedFor,
      hasVoted: p.votedFor !== null,
      isEliminated: p.isEliminated,
      score: p.score || 0,
      isConnected: p.isConnected !== false
    };
  });
  return sanitized;
}

function getFullImposteurState(room) {
  return {
    status: room.status,
    theme: room.theme,
    gameId: room.gameId || null,
    descriptionRounds: room.descriptionRounds || 1,
    impostorCount: room.impostorCount || 1,
    currentDescriptionRound: room.currentDescriptionRound || 1,
    descriptionHistory: room.descriptionHistory || [],
    players: getSanitizedPlayers(room),
    turnOrder: room.turnOrder || [],
    currentTurnIndex: room.currentTurnIndex || 0,
    winner: room.winner || null,
    lastTallyResult: room.lastTallyResult || null,
    civilWord: room.status === 'game_over' ? room.civilWord : null,
    impostorWord: room.status === 'game_over' ? room.impostorWord : null,
    impostorNickname: room.status === 'game_over' ? room.impostorNickname : null
  };
}

const staticCache = {};
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // ==========================================
  // THERIDACTLE, POKEDACTLE & MERRYDACTLE ENDPOINTS
  // ==========================================

  // Create Theridactle Room
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

  // Create Pokedactle Room
  if (parsedUrl.pathname === '/api/pokedactle/room/create' && req.method === 'POST') {
    createPokedactleRoomState().then(state => {
      let roomId = generateRoomId();
      while(rooms[roomId]) roomId = generateRoomId();
      rooms[roomId] = state;
      console.log(`Created Pokedactle room ${roomId} for pokemon: ${state.title}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ roomId }));
    }).catch(err => {
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // Create Merrydactle Room
  if (parsedUrl.pathname === '/api/merrydactle/room/create' && req.method === 'POST') {
    createMerrydactleRoomState().then(state => {
      let roomId = generateRoomId();
      while(rooms[roomId]) roomId = generateRoomId();
      rooms[roomId] = state;
      console.log(`Created Merrydactle room ${roomId} for One Piece: ${state.title}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ roomId }));
    }).catch(err => {
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // Update Dactle Room Settings (Host Only)
  if ((parsedUrl.pathname === '/api/theridactle/room/settings' || parsedUrl.pathname === '/api/pokedactle/room/settings' || parsedUrl.pathname === '/api/merrydactle/room/settings' || parsedUrl.pathname === '/api/room/settings') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, totalRounds, category, hintsAllowed, nickname } = JSON.parse(body);
        const id = (roomId || '').toUpperCase();
        const room = rooms[id] || rooms[roomId];
        if (!room) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Room not found' }));
        }
        if (totalRounds !== undefined) room.totalRounds = parseInt(totalRounds) || 3;
        if (category !== undefined) room.category = category;
        if (hintsAllowed !== undefined) room.hintsAllowed = parseInt(hintsAllowed);
        broadcastDactleState(room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // Start Dactle Game
  if ((parsedUrl.pathname === '/api/theridactle/room/start' || parsedUrl.pathname === '/api/pokedactle/room/start' || parsedUrl.pathname === '/api/merrydactle/room/start' || parsedUrl.pathname === '/api/room/start') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { roomId, nickname } = JSON.parse(body);
        const id = (roomId || '').toUpperCase();
        const room = rooms[id] || rooms[roomId];
        if (!room) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Room not found' }));
        }
        room.status = 'playing';
        room.roundNumber = 1;
        room.guesses = [];
        room.guessHistory = [];
        room.isWon = false;
        room.winner = null;
        broadcastDactleState(room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // Advance to Next Round in Dactle Game
  if ((parsedUrl.pathname === '/api/theridactle/room/next_round' || parsedUrl.pathname === '/api/pokedactle/room/next_round' || parsedUrl.pathname === '/api/merrydactle/room/next_round' || parsedUrl.pathname === '/api/room/next_round') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { roomId, nickname } = JSON.parse(body);
        const id = (roomId || '').toUpperCase();
        const room = rooms[id] || rooms[roomId];
        if (!room) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Room not found' }));
        }
        room.roundNumber = (room.roundNumber || 1) + 1;
        
        // Fetch new article for the next round
        let nextState;
        if (room.gameType === 'pokedactle') nextState = await createPokedactleRoomState(room.category);
        else if (room.gameType === 'merrydactle') nextState = await createMerrydactleRoomState(room.category);
        else nextState = await createRoomState(room.category);
        
        room.title = nextState.title;
        room.articleHTML = nextState.articleHTML;
        room.imageUrl = nextState.imageUrl;
        room.guesses = [];
        room.guessHistory = [];
        room.isWon = false;
        room.winner = null;
        room.status = 'playing';

        broadcastDactleState(room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Restart Dactle Room to Lobby
  if ((parsedUrl.pathname === '/api/theridactle/room/restart_lobby' || parsedUrl.pathname === '/api/pokedactle/room/restart_lobby' || parsedUrl.pathname === '/api/merrydactle/room/restart_lobby' || parsedUrl.pathname === '/api/room/restart_lobby') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, nickname } = JSON.parse(body);
        const id = (roomId || '').toUpperCase();
        const room = rooms[id] || rooms[roomId];
        if (!room) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Room not found' }));
        }
        room.status = 'lobby';
        room.roundNumber = 1;
        room.guesses = [];
        room.guessHistory = [];
        room.isWon = false;
        room.winner = null;
        broadcastDactleState(room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // Check Room Exist & Type
  if (parsedUrl.pathname === '/api/room/check') {
    const roomId = (parsedUrl.query.roomId || '').toUpperCase();
    const room = rooms[roomId];
    if (!room) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Salon introuvable' }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, gameType: room.gameType }));
    return;
  }

  // Join Room verification
  if ((parsedUrl.pathname === '/api/room/join' || parsedUrl.pathname === '/api/pokedactle/room/join' || parsedUrl.pathname === '/api/merrydactle/room/join') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId } = JSON.parse(body);
        const id = (roomId || '').toUpperCase();
        if (rooms[id] && (rooms[id].gameType === 'theridactle' || rooms[id].gameType === 'pokedactle' || rooms[id].gameType === 'merrydactle')) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, roomId: id, gameType: rooms[id].gameType }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Room not found' }));
        }
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // Get current game text
  if (parsedUrl.pathname === '/api/game' || parsedUrl.pathname === '/api/pokedactle/game' || parsedUrl.pathname === '/api/merrydactle/game') {
    const roomId = parsedUrl.query.roomId;
    const id = (roomId || '').toUpperCase();
    const room = rooms[id] || rooms[roomId];
    if (!room || (room.gameType !== 'theridactle' && room.gameType !== 'pokedactle' && room.gameType !== 'merrydactle')) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ html: room.articleHTML, title: room.title, isWon: room.isWon, imageUrl: room.imageUrl, gameType: room.gameType }));
    return;
  }

  // Submit guess
  if ((parsedUrl.pathname === '/api/guess' || parsedUrl.pathname === '/api/pokedactle/guess' || parsedUrl.pathname === '/api/merrydactle/guess') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { word, roomId, nickname, avatar } = JSON.parse(body);
        const id = (roomId || '').toUpperCase();
        const room = rooms[id] || rooms[roomId];
        if (!room || (room.gameType !== 'theridactle' && room.gameType !== 'pokedactle' && room.gameType !== 'merrydactle')) {
          res.writeHead(404);
          return res.end();
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
        
        const isTitleMatch = (rawNormWord === normTitle) || 
                             (rootWord === getRoot(normTitle)) || 
                             (wordsInTitle.length > 0 && rootWord === getRoot(wordsInTitle[0])) ||
                             allTitleWordsGuessed;

        if (nickname && room.players && room.players[nickname]) {
          room.players[nickname].guessesCount = (room.players[nickname].guessesCount || 0) + 1;
        }

        if (isTitleMatch) {
            room.isWon = true;
            room.winner = nickname || 'Un joueur';
            
            if (nickname && room.players && room.players[nickname]) {
              room.players[nickname].score = (room.players[nickname].score || 0) + 100;
            }

            if (room.roundNumber >= room.totalRounds) {
              room.status = 'game_ended';
            } else {
              room.status = 'round_ended';
            }

            room.leaderboard = getDactleLeaderboard(room);

            // Record game stats safely
            try {
              const attemptsCount = Array.isArray(room.guesses) ? room.guesses.length : 1;
              const pointsEarned = calculateDactlePoints(attemptsCount, true);
              let playersData = [];
              if (room.clients && room.clients.length > 0) {
                playersData = room.clients.map(c => ({
                  nickname: c.nickname || nickname || 'Anonyme',
                  avatar: c.avatar || avatar || (room.gameType === 'merrydactle' ? '🏴‍☠️' : (room.gameType === 'pokedactle' ? '⚡' : '🦖')),
                  isWinner: true,
                  score: attemptsCount,
                  points: pointsEarned,
                  role: 'coop'
                }));
              } else if (nickname) {
                playersData = [{
                  nickname: nickname,
                  avatar: avatar || (room.gameType === 'merrydactle' ? '🏴‍☠️' : (room.gameType === 'pokedactle' ? '⚡' : 'REX')),
                  isWinner: true,
                  score: attemptsCount,
                  points: pointsEarned,
                  role: 'solo'
                }];
              }
              if (playersData.length > 0) {
                recordGameStats(room.gameType, playersData);
              }
            } catch (err) {
              console.error('Stats recording error:', err);
            }
        }

        broadcast(room, { 
          type: 'GUESS', 
          word: displayWord, 
          hits, 
          isWon: room.isWon, 
          root: rootWord, 
          raw: rawNormWord, 
          title: room.title,
          imageUrl: room.imageUrl
        });
        
        broadcastDactleState(room);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          hits, 
          isWon: room.isWon, 
          word: displayWord, 
          root: rootWord, 
          raw: rawNormWord, 
          title: room.title,
          imageUrl: room.imageUrl
        }));
      } catch (e) {
        console.error('Guess processing error:', e);
        res.writeHead(400);
        res.end();
      }
    });
    return;
  }
  
  // Give up
  if ((parsedUrl.pathname === '/api/give-up' || parsedUrl.pathname === '/api/pokedactle/give-up' || parsedUrl.pathname === '/api/merrydactle/give-up') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { roomId, nickname, avatar } = JSON.parse(body);
        const id = (roomId || '').toUpperCase();
        const room = rooms[id] || rooms[roomId];
        if (room && (room.gameType === 'theridactle' || room.gameType === 'pokedactle' || room.gameType === 'merrydactle')) {
          if (room.isWon) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Partie déjà terminée' }));
          }
          room.isWon = true;
          broadcast(room, { 
            type: 'GIVE_UP', 
            state: { 
              guesses: room.guesses, 
              guessHistory: room.guessHistory, 
              isWon: true,
              title: room.title,
              imageUrl: room.imageUrl
            } 
          });
          
          // Record game stats (loss)
          let playersData = [];
          if (room.clients && room.clients.length > 0) {
            playersData = room.clients.map(c => ({
              nickname: c.nickname || nickname || 'Anonyme',
              avatar: c.avatar || avatar || (room.gameType === 'merrydactle' ? '🏴‍☠️' : (room.gameType === 'pokedactle' ? '⚡' : '🦖')),
              isWinner: false,
              score: 0,
              role: 'coop'
            }));
          } else if (nickname) {
            playersData = [{
              nickname: nickname,
              avatar: avatar || (room.gameType === 'merrydactle' ? '🏴‍☠️' : (room.gameType === 'pokedactle' ? '⚡' : '🦖')),
              isWinner: false,
              score: 0,
              role: 'abandon'
            }];
          }
          if (playersData.length > 0) {
            recordGameStats(room.gameType, playersData);
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, title: room.title, imageUrl: room.imageUrl }));
        }
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Salon introuvable' }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // Restart Room (Theridactle / Pokedactle / Merrydactle)
  if ((parsedUrl.pathname === '/api/restart' || parsedUrl.pathname === '/api/theridactle/restart' || parsedUrl.pathname === '/api/pokedactle/restart' || parsedUrl.pathname === '/api/merrydactle/restart') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { roomId } = JSON.parse(body);
        const id = (roomId || '').toUpperCase();
        const room = rooms[id] || rooms[roomId];
        if (!room || (room.gameType !== 'theridactle' && room.gameType !== 'pokedactle' && room.gameType !== 'merrydactle')) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Room not found' }));
        }

        const newState = room.gameType === 'pokedactle' 
          ? await createPokedactleRoomState() 
          : (room.gameType === 'merrydactle' ? await createMerrydactleRoomState() : await createRoomState());

        room.title = newState.title;
        room.articleHTML = newState.articleHTML;
        room.imageUrl = newState.imageUrl;
        room.guesses = [];
        room.guessHistory = [];
        room.isWon = false;

        console.log(`Restarted ${room.gameType} room ${id} with: ${room.title}`);

        broadcast(room, {
          type: 'RESTART',
          state: {
            guesses: [],
            guessHistory: [],
            isWon: false,
            title: room.title,
            imageUrl: room.imageUrl,
            html: room.articleHTML
          }
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, roomId: id }));
      } catch (e) {
        console.error('Restart failed:', e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
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
        const { nickname, avatar, avatarIsPhoto } = JSON.parse(body);
        const name = nickname.trim();
        if (!name) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Pseudo requis' }));
        }
        if (name.length > 15) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Le pseudo ne doit pas dépasser 15 caractères' }));
        }
        let roomId = generateRoomId();
        while(rooms[roomId]) roomId = generateRoomId();
        
        rooms[roomId] = {
          gameType: 'imposteur',
          roomId: roomId,
          status: 'lobby',
          theme: 'general',
          descriptionRounds: 1,
          currentDescriptionRound: 1,
          descriptionHistory: [],
          players: {
            [name]: { nickname: name, avatar: avatar || '🦖', avatarIsPhoto: avatarIsPhoto || false, word: '', isImpostor: false, votedFor: null, isEliminated: false, score: 0, isConnected: true }
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
        const { roomId, nickname, avatar, avatarIsPhoto } = JSON.parse(body);
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
        if (name.length > 15) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Le pseudo ne doit pas dépasser 15 caractères' }));
        }
        
        const room = rooms[id];
        
        // Reconnection logic
        const existingPlayer = room.players[name];
        if (existingPlayer) {
          existingPlayer.isConnected = true;
          if (avatar) existingPlayer.avatar = avatar;
          console.log(`Player ${name} reconnected to Imposteur room ${id}`);
          
          broadcast(room, {
            type: 'IMPOSTEUR_STATE',
            state: getFullImposteurState(room)
          });
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, roomId: id, nickname: name }));
        }

        if (room.status !== 'lobby') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Partie déjà commencée' }));
        }
        
        room.players[name] = { nickname: name, avatar: avatar || '🦖', avatarIsPhoto: avatarIsPhoto || false, word: '', isImpostor: false, votedFor: null, isEliminated: false, score: 0, isConnected: true };
        
        console.log(`Player ${name} joined Imposteur room ${id}`);
        
        broadcast(room, {
          type: 'IMPOSTEUR_STATE',
          state: getFullImposteurState(room)
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

  // Change Imposteur Theme
  if (parsedUrl.pathname === '/api/imposteur/theme' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, theme } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'imposteur') {
          res.writeHead(404); return res.end();
        }
        room.theme = theme;
        console.log(`Imposteur room ${roomId} changed theme to ${theme}`);
        broadcast(room, {
          type: 'IMPOSTEUR_STATE',
          state: getFullImposteurState(room)
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // Start Imposteur Game
  if (parsedUrl.pathname === '/api/imposteur/start' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, theme, descriptionRounds, impostorCount } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'imposteur') {
          res.writeHead(404); return res.end();
        }
        
        const playersList = Object.keys(room.players);
        const impCount = parseInt(impostorCount) || 1;
        const minPlayers = (2 * impCount) + 1;
        
        if (playersList.length < minPlayers) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: `Il faut au moins ${minPlayers} joueurs pour lancer une partie avec ${impCount} imposteur(s) !` }));
        }
        
        // Anti-streak and fair rotation tracking
        room.impostorHistory = room.impostorHistory || {};
        room.lastImpostors = room.lastImpostors || [];
        room.usedWordPairs = room.usedWordPairs || [];

        // 1. Pick random word pair with session anti-repetition
        const allPairs = IMPOSTEUR_WORDS[theme] || IMPOSTEUR_WORDS.general;
        let availablePairs = allPairs.filter(p => !room.usedWordPairs.includes(`${p.civil}::${p.impostor}`));
        if (availablePairs.length === 0) {
          room.usedWordPairs = [];
          availablePairs = allPairs;
        }
        const pair = availablePairs[Math.floor(Math.random() * availablePairs.length)] || allPairs[0];
        room.usedWordPairs.push(`${pair.civil}::${pair.impostor}`);
        
        // 2. Fair Impostor Selection (No back-to-back repeats & balanced rotation)
        let candidates = playersList.filter(name => !room.lastImpostors.includes(name));
        if (candidates.length < impCount) {
          candidates = [...playersList];
        }

        const buckets = {};
        candidates.forEach(name => {
          const count = room.impostorHistory[name] || 0;
          if (!buckets[count]) buckets[count] = [];
          buckets[count].push(name);
        });

        const sortedCounts = Object.keys(buckets).map(Number).sort((a, b) => a - b);
        const impostorNames = [];

        for (const count of sortedCounts) {
          const bucket = [...buckets[count]];
          for (let i = bucket.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
          }
          while (bucket.length > 0 && impostorNames.length < impCount) {
            impostorNames.push(bucket.pop());
          }
          if (impostorNames.length >= impCount) break;
        }

        if (impostorNames.length < impCount) {
          const remaining = playersList.filter(n => !impostorNames.includes(n));
          for (let i = remaining.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
          }
          while (remaining.length > 0 && impostorNames.length < impCount) {
            impostorNames.push(remaining.pop());
          }
        }

        // Update room impostor history
        room.lastImpostors = [...impostorNames];
        impostorNames.forEach(name => {
          room.impostorHistory[name] = (room.impostorHistory[name] || 0) + 1;
        });
        
        // Randomly swap civil and impostor roles
        const shouldSwap = Math.random() < 0.5;
        const civilWord = shouldSwap ? pair.impostor : pair.civil;
        const impostorWord = shouldSwap ? pair.civil : pair.impostor;

        playersList.forEach(name => {
          const p = room.players[name];
          p.isEliminated = false;
          p.votedFor = null;
          p.description = '';
          if (impostorNames.includes(name)) {
            p.isImpostor = true;
            p.word = impostorWord;
          } else {
            p.isImpostor = false;
            p.word = civilWord;
          }
        });
        
        room.civilWord = civilWord;
        room.impostorWord = impostorWord;
        room.impostorNickname = impostorNames.join(', ');
        room.status = 'playing';
        room.theme = theme;
        room.winner = null;
        room.impostorCount = impCount;
        room.gameId = generateRoomId();
        
        if (descriptionRounds) {
          room.descriptionRounds = parseInt(descriptionRounds) || 1;
        }
        room.currentDescriptionRound = 1;
        room.descriptionHistory = [];
        
        // True random Fisher-Yates shuffle
        const shuffledList = [...playersList];
        for (let i = shuffledList.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledList[i], shuffledList[j]] = [shuffledList[j], shuffledList[i]];
        }
        room.turnOrder = shuffledList;
        room.currentTurnIndex = 0;
        
        checkAndAdvanceTurnIfOffline(room);
        
        console.log(`Imposteur Game started in room ${roomId}. Impostors: ${room.impostorNickname}. Word A: ${pair.civil}, Word B: ${pair.impostor}`);
        
        broadcast(room, {
          type: 'IMPOSTEUR_STATE',
          state: getFullImposteurState(room)
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

function checkAndAdvanceTurnIfOffline(room) {
  if (room.status !== 'playing') return;
  
  // Guard: check if there's any active player who is not eliminated
  const hasActivePlayer = Object.values(room.players).some(p => !p.isEliminated);
  if (!hasActivePlayer) {
    console.log(`No active players in room ${room.roomId}. Stopping turn skip recursion.`);
    return;
  }
  
  const activePlayerName = room.turnOrder[room.currentTurnIndex];
  const activePlayer = room.players[activePlayerName];
  
  if (!activePlayer || activePlayer.isEliminated) {
    console.log(`Skipping player ${activePlayerName} because they are eliminated`);
    advanceTurnAndCheckRoundEnd(room);
  }
}

function advanceTurnAndCheckRoundEnd(room) {
  room.currentTurnIndex++;
  
  if (room.currentTurnIndex >= room.turnOrder.length) {
    const rounds = room.descriptionRounds || 1;
    const currentRound = room.currentDescriptionRound || 1;
    
    if (currentRound < rounds) {
      room.currentDescriptionRound++;
      // Rotate the turnOrder to change the starting player for the next round
      if (room.turnOrder && room.turnOrder.length > 0) {
        const first = room.turnOrder.shift();
        room.turnOrder.push(first);
      }
      room.currentTurnIndex = 0;
      console.log(`Advancing to description round ${room.currentDescriptionRound} in room ${room.roomId}. New turnOrder: ${room.turnOrder.join(', ')}`);
      checkAndAdvanceTurnIfOffline(room);
    } else {
      room.status = 'discussing';
      Object.keys(room.players).forEach(name => {
        room.players[name].votedFor = null;
      });
    }
  } else {
    checkAndAdvanceTurnIfOffline(room);
  }
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
        
        if (!room.descriptionHistory) room.descriptionHistory = [];
        room.descriptionHistory.push({
          nickname: nickname,
          text: desc,
          round: room.currentDescriptionRound || 1
        });
        room.players[nickname].description = desc;
        
        advanceTurnAndCheckRoundEnd(room);
        
        broadcast(room, {
          type: 'IMPOSTEUR_STATE',
          state: getFullImposteurState(room)
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
        
        broadcast(room, {
          type: 'IMPOSTEUR_STATE',
          state: getFullImposteurState(room)
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // Tally Votes
  if (parsedUrl.pathname === '/api/imposteur/tally-votes' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'imposteur' || room.status !== 'discussing') {
          res.writeHead(404); return res.end();
        }
        
        const alivePlayers = Object.values(room.players).filter(p => !p.isEliminated);
        
        // Count votes
        const voteCounts = {};
        alivePlayers.forEach(p => voteCounts[p.nickname] = 0);
        voteCounts['skip'] = 0;
        
        let totalVotes = 0;
        alivePlayers.forEach(p => {
          if (p.votedFor) {
            voteCounts[p.votedFor] = (voteCounts[p.votedFor] || 0) + 1;
            totalVotes++;
          }
        });
        
        let maxVotes = 0;
        Object.keys(voteCounts).forEach(choice => {
          if (voteCounts[choice] > maxVotes) {
            maxVotes = voteCounts[choice];
          }
        });

        const topChoices = Object.keys(voteCounts).filter(choice => voteCounts[choice] === maxVotes && maxVotes > 0);
        
        let tallyResult = {
          tallyId: Date.now(),
          type: 'none',
          message: '',
          eliminatedNickname: null,
          isImpostor: null,
          voteCounts: { ...voteCounts }
        };

        if (totalVotes === 0 || maxVotes === 0) {
          // No votes cast
          tallyResult.type = 'no_votes';
          tallyResult.message = "Aucun vote n'a été émis. Nouvelle manche de descriptions !";
          
          room.status = 'playing';
          room.currentTurnIndex = 0;
          room.currentDescriptionRound = 1;
          Object.keys(room.players).forEach(name => {
            room.players[name].description = '';
            room.players[name].votedFor = null;
          });
          checkAndAdvanceTurnIfOffline(room);
        } else if (topChoices.length > 1) {
          // Equality / Tie: Nobody eliminated
          tallyResult.type = 'tie';
          tallyResult.message = `Égalité entre ${topChoices.join(' et ')} (${maxVotes} vote${maxVotes > 1 ? 's' : ''}) ! Personne n'est éliminé.`;
          
          room.status = 'playing';
          room.currentTurnIndex = 0;
          room.currentDescriptionRound = 1;
          Object.keys(room.players).forEach(name => {
            room.players[name].description = '';
            room.players[name].votedFor = null;
          });
          checkAndAdvanceTurnIfOffline(room);
        } else if (topChoices[0] === 'skip') {
          // Majority chose Skip
          tallyResult.type = 'skip';
          tallyResult.message = "La majorité a voté pour passer. Nouvelle manche de descriptions !";
          
          room.status = 'playing';
          room.currentTurnIndex = 0;
          room.currentDescriptionRound = 1;
          Object.keys(room.players).forEach(name => {
            room.players[name].description = '';
            room.players[name].votedFor = null;
          });
          checkAndAdvanceTurnIfOffline(room);
        } else {
          // A specific player was voted out
          const eliminatedNickname = topChoices[0];
          if (room.players[eliminatedNickname]) {
            room.players[eliminatedNickname].isEliminated = true;
            const isImp = !!room.players[eliminatedNickname].isImpostor;
            
            tallyResult.type = 'eliminated';
            tallyResult.eliminatedNickname = eliminatedNickname;
            tallyResult.isImpostor = isImp;
            tallyResult.message = `${eliminatedNickname} a été éliminé avec ${maxVotes} vote${maxVotes > 1 ? 's' : ''} !`;
            
            console.log(`Player ${eliminatedNickname} was eliminated in room ${roomId} (was impostor: ${isImp})`);
            
            const remainingPlayers = Object.values(room.players).filter(p => !p.isEliminated);
            const remainingImpostors = remainingPlayers.filter(p => p.isImpostor);
            const remainingCitizens = remainingPlayers.filter(p => !p.isImpostor);

            if (remainingImpostors.length === 0) {
              room.status = 'game_over';
              room.winner = 'civils';
              
              // Score system: +2 for surviving civils, +1 for eliminated civils
              Object.values(room.players).forEach(p => {
                if (!p.isImpostor) {
                  p.score = (p.score || 0) + (p.isEliminated ? 1 : 2);
                }
              });

              // Record stats
              const playersData = Object.values(room.players).map(p => ({
                nickname: p.nickname,
                avatar: p.avatar || '🦖',
                avatarIsPhoto: p.avatarIsPhoto || false,
                isWinner: !p.isImpostor,
                score: p.score || 0,
                points: !p.isImpostor ? 100 : 15,
                role: p.isImpostor ? 'imposteur' : 'civil'
              }));
              recordGameStats('imposteur', playersData);
            } else if (remainingCitizens.length <= remainingImpostors.length) {
              room.status = 'game_over';
              room.winner = 'impostor';
              
              // Score system: +3 for the impostor(s)
              Object.values(room.players).forEach(p => {
                if (p.isImpostor) {
                  p.score = (p.score || 0) + 3;
                }
              });

              // Record stats
              const playersData = Object.values(room.players).map(p => ({
                nickname: p.nickname,
                avatar: p.avatar || '🦖',
                avatarIsPhoto: p.avatarIsPhoto || false,
                isWinner: !!p.isImpostor,
                score: p.score || 0,
                points: p.isImpostor ? 100 : 15,
                role: p.isImpostor ? 'imposteur' : 'civil'
              }));
              recordGameStats('imposteur', playersData);
            } else {
              room.status = 'playing';
              room.currentTurnIndex = 0;
              room.currentDescriptionRound = 1;
              room.turnOrder = room.turnOrder.filter(name => !room.players[name].isEliminated);
              
              Object.keys(room.players).forEach(name => {
                room.players[name].description = '';
                room.players[name].votedFor = null;
              });
              
              checkAndAdvanceTurnIfOffline(room);
            }
          }
        }
        
        room.lastTallyResult = tallyResult;
        
        broadcast(room, {
          type: 'IMPOSTEUR_STATE',
          state: getFullImposteurState(room)
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, tallyResult }));
      } catch (e) {
        console.error('Error in tally-votes:', e);
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // Change Imposteur Settings (Description rounds & impostor count)
  if (parsedUrl.pathname === '/api/imposteur/settings' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, descriptionRounds, impostorCount } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'imposteur') {
          res.writeHead(404); return res.end();
        }
        if (descriptionRounds !== undefined) {
          room.descriptionRounds = parseInt(descriptionRounds) || 1;
        }
        if (impostorCount !== undefined) {
          room.impostorCount = parseInt(impostorCount) || 1;
        }
        console.log(`Imposteur room ${roomId} set description rounds to ${room.descriptionRounds}, impostor count to ${room.impostorCount}`);
        broadcast(room, {
          type: 'IMPOSTEUR_STATE',
          state: getFullImposteurState(room)
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // Reset Imposteur Scores
  if (parsedUrl.pathname === '/api/imposteur/reset-scores' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'imposteur') {
          res.writeHead(404); return res.end();
        }
        Object.keys(room.players).forEach(name => {
          room.players[name].score = 0;
        });
        console.log(`Scores reset for Imposteur room ${roomId}`);
        broadcast(room, {
          type: 'IMPOSTEUR_STATE',
          state: getFullImposteurState(room)
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
        room.descriptionHistory = [];
        room.gameId = null;
        
        Object.keys(room.players).forEach(name => {
          room.players[name].word = '';
          room.players[name].description = '';
          room.players[name].votedFor = null;
          room.players[name].isEliminated = false;
          room.players[name].isImpostor = false;
        });
        
        broadcast(room, {
          type: 'IMPOSTEUR_STATE',
          state: getFullImposteurState(room)
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // Kick Player from Imposteur Room
  if (parsedUrl.pathname === '/api/imposteur/kick' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, targetNickname } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'imposteur') {
          res.writeHead(404); return res.end();
        }
        
        if (room.players[targetNickname]) {
          const isCurrentTurnPlayer = (room.status === 'playing' && room.turnOrder[room.currentTurnIndex] === targetNickname);
          
          // Remove player
          delete room.players[targetNickname];
          
          // Remove from turnOrder
          const oldTurnOrder = [...room.turnOrder];
          room.turnOrder = room.turnOrder.filter(name => name !== targetNickname);
          
          // Clear votes referencing kicked player
          Object.values(room.players).forEach(p => {
            if (p.votedFor === targetNickname) {
              p.votedFor = null;
            }
          });
          
          // Close player connection
          room.clients = room.clients.filter(client => {
            if (client.nickname === targetNickname) {
              try { client.res.end(); } catch(err) {}
              return false;
            }
            return true;
          });
          
          console.log(`Kicked ${targetNickname} from room ${roomId}`);
          
          if (room.status === 'playing') {
            if (isCurrentTurnPlayer) {
              if (room.currentTurnIndex >= room.turnOrder.length) {
                advanceTurnAndCheckRoundEnd(room);
              } else {
                checkAndAdvanceTurnIfOffline(room);
              }
            } else {
              const kickedIndex = oldTurnOrder.indexOf(targetNickname);
              if (kickedIndex !== -1 && kickedIndex < room.currentTurnIndex) {
                room.currentTurnIndex = Math.max(0, room.currentTurnIndex - 1);
              }
              checkAndAdvanceTurnIfOffline(room);
            }
          }
          
          broadcast(room, {
            type: 'IMPOSTEUR_STATE',
            state: getFullImposteurState(room)
          });
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // ==========================================
  // GEOGRAPHIE HELPERS & ENDPOINTS
  // ==========================================

  function getSanitizedGeoPlayers(room) {
    const sanitized = {};
    Object.keys(room.players).forEach(name => {
      const p = room.players[name];
      sanitized[name] = {
        nickname: p.nickname,
        avatar: p.avatar || '🦖',
        avatarIsPhoto: p.avatarIsPhoto || false,
        score: p.score,
        hasAnswered: p.currentAnswer !== null,
        currentAnswer: (room.status === 'correction' || room.status === 'game_over') ? p.currentAnswer : null,
        isCorrect: (room.status === 'correction' || room.status === 'game_over') ? p.isCorrect : null,
        pointsEarned: (room.status === 'correction' || room.status === 'game_over') ? p.pointsEarned : 0
      };
    });
    return sanitized;
  }

  function getGeoLeaderboard(room) {
    return Object.values(room.players)
      .map(p => ({ nickname: p.nickname, score: p.score }))
      .sort((a, b) => b.score - a.score);
  }

  function cleanString(str) {
    if (!str) return '';
    return str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/-/g, " ");
  }

  function getSanitizedQuestion(room) {
    const currentQuestion = room.questions[room.currentQuestionIndex];
    if (!currentQuestion) return null;
    if (room.status !== 'question' && room.status !== 'correction' && room.status !== 'game_over') return null;

    const sanitizedQuestion = {
      choices: currentQuestion.choices,
      prompt: currentQuestion.prompt,
      media: currentQuestion.media,
      correctAnswer: (room.status === 'correction' || room.status === 'game_over') ? currentQuestion.correctAnswer : null,
      target: (room.status === 'correction' || room.status === 'game_over') ? currentQuestion.target : null
    };

    if (room.mode === 'localisation') {
      sanitizedQuestion.silhouettes = GEOGRAPHY_DATABASE.map(c => ({
        name: c.name,
        code: c.code,
        path: c.path
      }));
    }
    return sanitizedQuestion;
  }

  function broadcastGeoState(room) {
    broadcast(room, {
      type: 'GEOGRAPHIE_STATE',
      state: {
        status: room.status,
        mode: room.mode,
        scope: room.scope,
        questionCount: room.questionCount,
        currentQuestionIndex: room.currentQuestionIndex,
        players: getSanitizedGeoPlayers(room),
        question: getSanitizedQuestion(room),
        leaderboard: getGeoLeaderboard(room)
      }
    });
  }

  // Create Geography Room
  if (parsedUrl.pathname === '/api/geographie/room/create' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { nickname, avatar, avatarIsPhoto } = JSON.parse(body);
        const name = nickname.trim();
        if (!name) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Pseudo requis' }));
        }
        if (name.length > 15) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Le pseudo ne doit pas dépasser 15 caractères' }));
        }
        let roomId = generateRoomId();
        while(rooms[roomId]) roomId = generateRoomId();
        
        rooms[roomId] = {
          gameType: 'geographie',
          roomId: roomId,
          status: 'lobby',
          mode: 'drapeaux',
          scope: 'monde',
          questionCount: 10,
          currentQuestionIndex: 0,
          questions: [],
          players: {
            [name]: { nickname: name, avatar: avatar || '🦖', avatarIsPhoto: avatarIsPhoto || false, score: 0, currentAnswer: null, isCorrect: false, pointsEarned: 0 }
          },
          clients: []
        };
        
        console.log(`Created Geographie room ${roomId} by ${name}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ roomId, nickname: name }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // Join Geography Room
  if (parsedUrl.pathname === '/api/geographie/room/join' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, nickname, avatar, avatarIsPhoto } = JSON.parse(body);
        const id = (roomId || '').toUpperCase();
        const name = nickname.trim();
        
        if (!rooms[id] || rooms[id].gameType !== 'geographie') {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Salon introuvable' }));
        }
        if (!name) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Pseudo requis' }));
        }
        if (name.length > 15) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Le pseudo ne doit pas dépasser 15 caractères' }));
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
        
        room.players[name] = { nickname: name, avatar: avatar || '🦖', avatarIsPhoto: avatarIsPhoto || false, score: 0, currentAnswer: null, isCorrect: false, pointsEarned: 0 };
        
        console.log(`Player ${name} joined Geographie room ${id}`);
        broadcastGeoState(room);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, roomId: id, nickname: name }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // Change Geography Settings/Theme
  if (parsedUrl.pathname === '/api/geographie/theme' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, mode, scope, questionCount } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'geographie') {
          res.writeHead(404); return res.end();
        }
        room.mode = mode || room.mode;
        room.scope = scope || room.scope;
        room.questionCount = questionCount || room.questionCount;
        
        broadcastGeoState(room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // Start Geography Game
  if (parsedUrl.pathname === '/api/geographie/start' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'geographie') {
          res.writeHead(404); return res.end();
        }
        
        let pool = GEOGRAPHY_DATABASE;
        if (room.scope !== 'monde') {
          pool = GEOGRAPHY_DATABASE.filter(c => c.continent === room.scope);
        }
        
        const count = Math.min(parseInt(room.questionCount) || 10, pool.length);
        room.questionCount = count;
        
        const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
        
        room.questions = [];
        for (let i = 0; i < count; i++) {
          const target = shuffledPool[i];
          
          let distractors = pool.filter(c => c.code !== target.code);
          distractors = distractors.sort(() => Math.random() - 0.5).slice(0, 3);
          
          let choices = [];
          let prompt = '';
          let media = '';
          let correctAnswer = '';
          
          if (room.mode === 'drapeaux') {
            correctAnswer = target.name;
            choices = [target.name, ...distractors.map(c => c.name)];
            prompt = "Quel pays possède ce drapeau ?";
            media = target.code;
          } else if (room.mode === 'capitales') {
            correctAnswer = target.capital;
            choices = [target.capital, ...distractors.map(c => c.capital)];
            prompt = `Quelle est la capitale du pays suivant : ${target.name} ?`;
            media = target.name;
          } else if (room.mode === 'localisation') {
            correctAnswer = target.name;
            choices = [target.name, ...distractors.map(c => c.name)];
            prompt = `Trouvez et cliquez sur ce pays sur la carte : ${target.name}`;
            media = target.code;
          }
          
          choices = choices.sort(() => Math.random() - 0.5);
          
          room.questions.push({
            target: target,
            choices: choices,
            prompt: prompt,
            media: media,
            correctAnswer: correctAnswer
          });
        }
        
        Object.keys(room.players).forEach(name => {
          room.players[name].score = 0;
          room.players[name].currentAnswer = null;
          room.players[name].isCorrect = false;
          room.players[name].pointsEarned = 0;
        });
        
        room.currentQuestionIndex = 0;
        room.status = 'question';
        room.questionStartTime = Date.now();
        
        console.log(`Starting Geographie game in room ${roomId} with ${count} questions`);
        broadcastGeoState(room);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // Submit Answer
  if (parsedUrl.pathname === '/api/geographie/submit' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, nickname, choice } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'geographie') {
          res.writeHead(404); return res.end();
        }
        
        if (room.status !== 'question') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: "Ce n'est pas le moment de répondre" }));
        }
        
        const p = room.players[nickname];
        if (!p) {
          res.writeHead(404); return res.end();
        }
        
        if (p.currentAnswer === null) {
          p.currentAnswer = choice || "";
          p.answeredTime = Date.now();
        }
        
        const playersList = Object.values(room.players);
        const answeredCount = playersList.filter(pl => pl.currentAnswer !== null).length;
        
        if (answeredCount === playersList.length) {
          const currentQuestion = room.questions[room.currentQuestionIndex];
          playersList.forEach(pl => {
            if (cleanString(pl.currentAnswer) === cleanString(currentQuestion.correctAnswer)) {
              pl.isCorrect = true;
              const timeTaken = Math.max(0, pl.answeredTime - room.questionStartTime);
              const speedBonus = Math.max(0, Math.round((15000 - timeTaken) / 100)); // up to 150 pts bonus
              pl.pointsEarned = 100 + speedBonus;
              pl.score += pl.pointsEarned;
            } else {
              pl.isCorrect = false;
              pl.pointsEarned = 0;
            }
          });
          
          room.status = 'correction';
        }
        
        broadcastGeoState(room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // Next Question
  if (parsedUrl.pathname === '/api/geographie/next' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'geographie') {
          res.writeHead(404); return res.end();
        }
        
        if (room.status !== 'correction') {
          res.writeHead(400); return res.end();
        }
        
        Object.keys(room.players).forEach(name => {
          room.players[name].currentAnswer = null;
          room.players[name].isCorrect = false;
          room.players[name].pointsEarned = 0;
        });
        
        room.currentQuestionIndex++;
        if (room.currentQuestionIndex >= room.questions.length) {
          room.status = 'game_over';
          
          // Record game stats
          const leaderboard = getGeoLeaderboard(room);
          const highestScore = leaderboard.length > 0 ? leaderboard[0].score : 0;
          
          const playersData = Object.values(room.players).map(p => {
            const isWinner = p.score === highestScore && highestScore > 0;
            return {
              nickname: p.nickname,
              avatar: p.avatar || '🦖',
              isWinner,
              score: p.score,
              points: Math.round(clamp((p.score / Math.max(1, room.questions.length * 250)) * 100, 0, 100)),
              role: 'joueur'
            };
          });
          recordGameStats('geographie', playersData, { rounds: room.questions.length });
        } else {
          room.status = 'question';
          room.questionStartTime = Date.now();
        }
        
        broadcastGeoState(room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // Restart Room
  if (parsedUrl.pathname === '/api/geographie/restart' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'geographie') {
          res.writeHead(404); return res.end();
        }
        
        room.status = 'lobby';
        room.currentQuestionIndex = 0;
        room.questions = [];
        
        Object.keys(room.players).forEach(name => {
          room.players[name].score = 0;
          room.players[name].currentAnswer = null;
          room.players[name].isCorrect = false;
          room.players[name].pointsEarned = 0;
        });
        
        broadcastGeoState(room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // ==========================================
  // SONGLESS (CARASONG) HELPERS & ENDPOINTS
  // ==========================================

  function getSanitizedSonglessPlayers(room) {
    const players = {};
    for (const [nick, p] of Object.entries(room.players || {})) {
      players[nick] = {
        nickname: p.nickname,
        avatar: p.avatar || '🎵',
        avatarIsPhoto: p.avatarIsPhoto || (typeof p.avatar === 'string' && (p.avatar.startsWith('data:image/') || p.avatar.startsWith('http'))),
        score: p.score || 0,
        isConnected: p.isConnected !== false,
        hasGuessed: !!p.hasGuessed,
        isCorrect: !!p.isCorrect,
        attemptsCount: p.attempts ? p.attempts.length : 0
      };
    }
    return players;
  }

  function getSonglessLeaderboard(room) {
    return Object.values(room.players || {})
      .map(p => ({
        nickname: p.nickname,
        avatar: p.avatar || '🎵',
        avatarIsPhoto: p.avatarIsPhoto || (typeof p.avatar === 'string' && (p.avatar.startsWith('data:image/') || p.avatar.startsWith('http'))),
        score: p.score || 0,
        isCorrect: !!p.isCorrect,
        attemptsCount: p.attempts ? p.attempts.length : 0
      }))
      .sort((a, b) => b.score - a.score);
  }

  function broadcastSonglessState(room) {
    const payload = {
      type: 'SONGLESS_STATE',
      state: {
        status: room.status, // 'lobby', 'playing', 'round_ended', 'game_ended'
        host: room.host,
        category: room.category,
        roundNumber: room.roundNumber,
        totalRounds: room.totalRounds,
        durations: [0.1, 0.5, 1.0, 2.5, 5.0, 10.0],
        currentSong: (room.status === 'playing' && room.currentSong) ? {
          songId: room.currentSong.songId,
          previewUrl: room.currentSong.previewUrl
        } : (room.status === 'round_ended' || room.status === 'game_ended' ? room.currentSolution : null),
        players: getSanitizedSonglessPlayers(room),
        leaderboard: getSonglessLeaderboard(room)
      }
    };
    broadcast(room, payload);
  }

  // GET /api/songless/daily
  if (parsedUrl.pathname === '/api/songless/daily') {
    songsModule.getDailySong(parsedUrl.query.date).then(song => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(song));
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // GET /api/songless/random
  if (parsedUrl.pathname === '/api/songless/random') {
    const category = parsedUrl.query.category || 'all';
    songsModule.getRandomSong(category).then(song => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(song));
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // GET /api/songless/search
  if (parsedUrl.pathname === '/api/songless/search') {
    const q = parsedUrl.query.q || '';
    songsModule.searchSongs(q).then(results => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ results }));
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // GET /api/audio-proxy?url=...
  if (parsedUrl.pathname === '/api/audio-proxy') {
    const targetUrl = parsedUrl.query.url;
    if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
      res.writeHead(400); return res.end("Invalid URL");
    }
    try {
      const parsedTarget = new URL(targetUrl);
      const httpLib = parsedTarget.protocol === 'https:' ? https : require('http');
      const proxyReq = httpLib.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*'
        }
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, {
          'Content-Type': proxyRes.headers['content-type'] || 'audio/mpeg',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400',
          'Accept-Ranges': 'bytes'
        });
        proxyRes.pipe(res);
      });
      proxyReq.on('error', (err) => {
        res.writeHead(500); res.end("Audio proxy error");
      });
    } catch (e) {
      res.writeHead(500); res.end();
    }
    return;
  }

  // GET /api/songless/audio-fallback?songId=...
  if (parsedUrl.pathname === '/api/songless/audio-fallback') {
    const songId = parsedUrl.query.songId;
    songsModule.refreshSongAudio(songId).then(refreshed => {
      if (refreshed && refreshed.previewUrl) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ previewUrl: refreshed.previewUrl, artworkUrl: refreshed.artworkUrl }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Audio preview not found" }));
      }
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // POST /api/songless/guess
  if (parsedUrl.pathname === '/api/songless/guess' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { songId, guessTitle, guessArtist, attempt, nickname, avatar, accountNickname } = JSON.parse(body);
        const result = songsModule.evaluateGuess(songId, guessTitle, guessArtist, attempt || 1);
        
        if (result.isOver && nickname) {
          const safeAttempt = clamp(Math.round(safeNumber(attempt, 1)), 1, 6);
          const score = result.status === 'correct' ? 70 - (safeAttempt * 10) : 0;
          recordGameStats('songless', [{
            nickname,
            accountNickname,
            avatar: avatar || '🎵',
            isWinner: result.status === 'correct',
            score
          }]);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // POST /api/songless/giveup
  if (parsedUrl.pathname === '/api/songless/giveup' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { songId, nickname, avatar, roomId, accountNickname } = JSON.parse(body);
        const actualSong = songsModule.getBaseSong(songId);
        if (nickname) {
          recordGameStats('songless', [{
            nickname,
            accountNickname,
            avatar: avatar || '🎵',
            isWinner: false,
            score: 0
          }]);
        }

        if (roomId) {
          const room = rooms[(roomId || '').toUpperCase()];
          if (room && room.gameType === 'songless' && nickname && room.players[nickname]) {
            const player = room.players[nickname];
            player.hasGuessed = true;
            const activePlayers = Object.values(room.players).filter(p => p.isConnected !== false);
            const allDone = activePlayers.length > 0 && activePlayers.every(p => p.hasGuessed || p.isCorrect);
            if (allDone) {
              room.status = 'round_ended';
            }
            broadcastSonglessState(room);
          }
        }

        const mediaLabel = actualSong.mediaTitleFr || actualSong.mediaTitle || '';
        let solutionTitle = actualSong.title;
        if (mediaLabel && !solutionTitle.toLowerCase().includes(mediaLabel.toLowerCase())) {
          solutionTitle = `${actualSong.title} (${mediaLabel})`;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'revealed',
          solution: {
            title: solutionTitle,
            artist: actualSong.curatedArtist || actualSong.artist,
            mediaTitle: mediaLabel,
            category: actualSong.category || '',
            year: actualSong.year,
            artworkUrl: actualSong.artworkUrl,
            previewUrl: actualSong.previewUrl
          }
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // POST /api/songless/room/create
  if (parsedUrl.pathname === '/api/songless/room/create' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { hostNickname, hostAvatar, hostAvatarIsPhoto, category, totalRounds } = JSON.parse(body);
        let roomId = generateRoomId();
        while (rooms[roomId]) roomId = generateRoomId();

        rooms[roomId] = {
          id: roomId,
          host: hostNickname,
          gameType: 'songless',
          status: 'lobby',
          category: category || 'all',
          totalRounds: (totalRounds === 'infinite' || totalRounds === 0 || totalRounds === '0') ? 0 : (parseInt(totalRounds, 10) || 10),
          roundNumber: 0,
          currentSong: null,
          currentSolution: null,
          players: {
            [hostNickname]: {
              nickname: hostNickname,
              avatar: hostAvatar || '🎵',
              avatarIsPhoto: hostAvatarIsPhoto || (typeof hostAvatar === 'string' && (hostAvatar.startsWith('data:image/') || hostAvatar.startsWith('http'))),
              score: 0,
              isConnected: true,
              hasGuessed: false,
              isCorrect: false,
              attempts: []
            }
          },
          clients: []
        };

        console.log(`Created Songless room ${roomId} by ${hostNickname}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, roomId }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // GET /api/songless/room/state
  if (parsedUrl.pathname === '/api/songless/room/state' && req.method === 'GET') {
    const roomId = (parsedUrl.query.roomId || '').toUpperCase();
    const room = rooms[roomId];
    if (!room || room.gameType !== 'songless') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Salon introuvable' }));
    }
    const payload = {
      status: room.status,
      host: room.host,
      category: room.category,
      roundNumber: room.roundNumber,
      totalRounds: room.totalRounds,
      durations: [0.1, 0.5, 1.0, 2.5, 5.0, 10.0],
      currentSong: (room.status === 'playing' && room.currentSong) ? {
        songId: room.currentSong.songId,
        previewUrl: room.currentSong.previewUrl
      } : (room.status === 'round_ended' || room.status === 'game_ended' ? room.currentSolution : null),
      players: getSanitizedSonglessPlayers(room),
      leaderboard: getSonglessLeaderboard(room)
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, state: payload }));
  }

  // POST /api/songless/room/join
  if (parsedUrl.pathname === '/api/songless/room/join' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, nickname, avatar, avatarIsPhoto } = JSON.parse(body);
        const id = (roomId || '').toUpperCase();
        const room = rooms[id];

        if (!room || room.gameType !== 'songless') {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Salon Songless introuvable' }));
        }

        if (!room.players[nickname]) {
          room.players[nickname] = {
            nickname,
            avatar: avatar || '🎵',
            avatarIsPhoto: avatarIsPhoto || (typeof avatar === 'string' && (avatar.startsWith('data:image/') || avatar.startsWith('http'))),
            score: 0,
            isConnected: true,
            hasGuessed: false,
            isCorrect: false,
            attempts: []
          };
        } else {
          room.players[nickname].isConnected = true;
          if (avatar) room.players[nickname].avatar = avatar;
          if (avatarIsPhoto !== undefined) room.players[nickname].avatarIsPhoto = avatarIsPhoto;
        }

        broadcastSonglessState(room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, roomId: id }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // POST /api/songless/room/settings
  if (parsedUrl.pathname === '/api/songless/room/settings' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, category, totalRounds } = JSON.parse(body);
        const room = rooms[(roomId || '').toUpperCase()];
        if (room && room.gameType === 'songless') {
          if (category !== undefined) room.category = category;
          if (totalRounds !== undefined) {
            room.totalRounds = (totalRounds === 'infinite' || totalRounds === 0 || totalRounds === '0') ? 0 : (parseInt(totalRounds, 10) || 10);
          }
          broadcastSonglessState(room);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // POST /api/songless/room/restart (Return to lobby / settings in same room)
  if (parsedUrl.pathname === '/api/songless/room/restart' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId } = JSON.parse(body);
        const room = rooms[(roomId || '').toUpperCase()];
        if (!room || room.gameType !== 'songless') {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Salon introuvable' }));
        }

        room.status = 'lobby';
        room.roundNumber = 0;
        room.currentSong = null;
        room.currentSolution = null;

        Object.keys(room.players).forEach(nick => {
          room.players[nick].score = 0;
          room.players[nick].hasGuessed = false;
          room.players[nick].isCorrect = false;
          room.players[nick].attempts = [];
        });

        broadcastSonglessState(room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // POST /api/songless/room/start
  if (parsedUrl.pathname === '/api/songless/room/start' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { roomId, category, totalRounds } = JSON.parse(body);
        const room = rooms[(roomId || '').toUpperCase()];
        if (!room || room.gameType !== 'songless') {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Salon introuvable' }));
        }

        if (category) room.category = category;
        if (totalRounds !== undefined) {
          room.totalRounds = (totalRounds === 'infinite' || totalRounds === 0 || totalRounds === '0') ? 0 : (parseInt(totalRounds, 10) || 10);
        }

        room.roundNumber = 1;
        room.status = 'playing';
        const songData = await songsModule.getRandomSong(room.category);
        room.currentSong = songData;
        const actual = songsModule.getBaseSong(songData.songId);
        const mediaLabel = actual.mediaTitleFr || actual.mediaTitle || '';
        let solutionTitle = actual.title;
        if (mediaLabel && !solutionTitle.toLowerCase().includes(mediaLabel.toLowerCase())) {
          solutionTitle = `${actual.title} (${mediaLabel})`;
        }
        room.currentSolution = {
          title: solutionTitle,
          artist: actual.curatedArtist || actual.artist,
          mediaTitle: mediaLabel,
          category: actual.category || '',
          year: actual.year,
          artworkUrl: actual.artworkUrl,
          previewUrl: actual.previewUrl
        };

        Object.keys(room.players).forEach(nick => {
          room.players[nick].hasGuessed = false;
          room.players[nick].isCorrect = false;
          room.players[nick].attempts = [];
        });

        broadcastSonglessState(room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // POST /api/songless/room/guess
  if (parsedUrl.pathname === '/api/songless/room/guess' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, nickname, guessTitle, guessArtist, attempt } = JSON.parse(body);
        const room = rooms[(roomId || '').toUpperCase()];
        if (!room || room.gameType !== 'songless' || !room.currentSong) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Salon introuvable' }));
        }

        const player = room.players[nickname];
        if (!player) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Joueur non trouvé' }));
        }

        const result = songsModule.evaluateGuess(room.currentSong.songId, guessTitle, guessArtist, attempt || (player.attempts.length + 1));
        player.attempts.push({ guess: { title: guessTitle, artist: guessArtist }, status: result.status });

        if (result.status === 'correct') {
          player.isCorrect = true;
          player.hasGuessed = true;
          const points = Math.max(10, 70 - (player.attempts.length * 10));
          player.score += points;
        } else if (player.attempts.length >= 6) {
          player.hasGuessed = true;
        }

        // Check if all connected players finished
        const activePlayers = Object.values(room.players).filter(p => p.isConnected !== false);
        const allDone = activePlayers.length > 0 && activePlayers.every(p => p.hasGuessed || p.isCorrect);

        if (allDone) {
          room.status = 'round_ended';
        }

        broadcastSonglessState(room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // POST /api/songless/room/next
  if (parsedUrl.pathname === '/api/songless/room/next' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { roomId } = JSON.parse(body);
        const room = rooms[(roomId || '').toUpperCase()];
        if (!room || room.gameType !== 'songless') {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Salon introuvable' }));
        }

        if (room.totalRounds > 0 && room.roundNumber >= room.totalRounds) {
          room.status = 'game_ended';
          const playersData = Object.values(room.players).map(p => ({
            nickname: p.nickname,
            avatar: p.avatar,
            score: p.score,
            points: Math.round(clamp((p.score / Math.max(1, (room.totalRounds || room.roundNumber) * 60)) * 100, 0, 100)),
            isWinner: p.score === Math.max(...Object.values(room.players).map(x => x.score)) && p.score > 0
          }));
          recordGameStats('songless', playersData, { rounds: room.totalRounds || room.roundNumber });
        } else {
          room.roundNumber++;
          room.status = 'playing';
          const songData = await songsModule.getRandomSong(room.category);
          room.currentSong = songData;
          const actual = songsModule.getBaseSong(songData.songId);
          const mediaLabel = actual.mediaTitleFr || actual.mediaTitle || '';
          let solutionTitle = actual.title;
          if (mediaLabel && !solutionTitle.toLowerCase().includes(mediaLabel.toLowerCase())) {
            solutionTitle = `${actual.title} (${mediaLabel})`;
          }
          room.currentSolution = {
            title: solutionTitle,
            artist: actual.curatedArtist || actual.artist,
            mediaTitle: mediaLabel,
            category: actual.category || '',
            year: actual.year,
            artworkUrl: actual.artworkUrl,
            previewUrl: actual.previewUrl
          };

          Object.keys(room.players).forEach(nick => {
            room.players[nick].hasGuessed = false;
            room.players[nick].isCorrect = false;
            room.players[nick].attempts = [];
          });
        }

        broadcastSonglessState(room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ==========================================
  // POKECRIES (CRIS POKEMON) HELPERS & ENDPOINTS
  // ==========================================

  function getPokecriesPokemon(category, era) {
    let pool = POKECRIES_DATA;
    if (category && category !== 'all') {
      const genNum = parseInt(category.replace('gen', ''), 10);
      if (!isNaN(genNum) && genNum >= 1 && genNum <= 9) {
        pool = pool.filter(p => p.gen === genNum);
      }
    }
    if (era === 'legacy') {
      pool = pool.filter(p => p.gen <= 5);
    }
    if (!pool || pool.length === 0) pool = POKECRIES_DATA;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    const cryUrl = era === 'legacy' && picked.gen <= 5
      ? `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/${picked.id}.ogg`
      : `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${picked.id}.ogg`;

    // 4 multiple choices (including correct answer)
    const choices = [picked.name];
    const otherPool = pool.filter(p => p.id !== picked.id);
    const shuffledOthers = otherPool.slice().sort(() => 0.5 - Math.random());
    for (let i = 0; i < 3 && i < shuffledOthers.length; i++) {
      choices.push(shuffledOthers[i].name);
    }
    choices.sort(() => 0.5 - Math.random());

    return {
      id: picked.id,
      name: picked.name,
      enName: picked.enName,
      gen: picked.gen,
      types: picked.types,
      cryUrl: cryUrl,
      artworkUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${picked.id}.png`,
      spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${picked.id}.png`,
      choices: choices
    };
  }

  function getSanitizedPokecriesPlayers(room) {
    const sanitized = {};
    Object.keys(room.players || {}).forEach(nick => {
      const p = room.players[nick];
      sanitized[nick] = {
        nickname: p.nickname,
        avatar: p.avatar,
        avatarIsPhoto: p.avatarIsPhoto || (typeof p.avatar === 'string' && (p.avatar.startsWith('data:image/') || p.avatar.startsWith('http'))),
        score: p.score,
        isConnected: p.isConnected !== false,
        hasGuessed: p.hasGuessed,
        isCorrect: p.isCorrect,
        guess: (room.status === 'round_ended' || room.status === 'game_ended') ? p.guess : (p.hasGuessed ? '✓ Répondu' : null)
      };
    });
    return sanitized;
  }

  function getPokecriesLeaderboard(room) {
    return Object.values(room.players || {})
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({
        rank: index + 1,
        nickname: p.nickname,
        avatar: p.avatar,
        avatarIsPhoto: p.avatarIsPhoto || (typeof p.avatar === 'string' && (p.avatar.startsWith('data:image/') || p.avatar.startsWith('http'))),
        score: p.score,
        isConnected: p.isConnected !== false
      }));
  }

  function broadcastPokecriesState(room) {
    broadcast(room, {
      type: 'POKECRIES_STATE',
      state: {
        status: room.status,
        host: room.host,
        category: room.category,
        era: room.era,
        inputMode: room.inputMode,
        roundNumber: room.roundNumber,
        totalRounds: room.totalRounds,
        currentCry: (room.status === 'playing' && room.currentPokemon) ? {
          id: room.currentPokemon.id,
          cryUrl: room.currentPokemon.cryUrl,
          choices: room.currentPokemon.choices,
          gen: room.currentPokemon.gen
        } : null,
        currentSolution: (room.status === 'round_ended' || room.status === 'game_ended') ? room.currentPokemon : null,
        players: getSanitizedPokecriesPlayers(room),
        leaderboard: getPokecriesLeaderboard(room)
      }
    });
  }

  // GET /api/pokecries/room/state
  if (parsedUrl.pathname === '/api/pokecries/room/state' && req.method === 'GET') {
    const roomId = (parsedUrl.query.roomId || '').toUpperCase();
    const room = rooms[roomId];
    if (!room || room.gameType !== 'pokecries') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Salon introuvable' }));
    }
    const payload = {
      status: room.status,
      host: room.host,
      category: room.category,
      era: room.era,
      inputMode: room.inputMode,
      roundNumber: room.roundNumber,
      totalRounds: room.totalRounds,
      currentCry: (room.status === 'playing' && room.currentPokemon) ? {
        id: room.currentPokemon.id,
        cryUrl: room.currentPokemon.cryUrl,
        choices: room.currentPokemon.choices,
        gen: room.currentPokemon.gen
      } : null,
      currentSolution: (room.status === 'round_ended' || room.status === 'game_ended') ? room.currentPokemon : null,
      players: getSanitizedPokecriesPlayers(room),
      leaderboard: getPokecriesLeaderboard(room)
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, state: payload }));
  }

  // POST /api/pokecries/room/restart
  if (parsedUrl.pathname === '/api/pokecries/room/restart' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId } = JSON.parse(body);
        const room = rooms[(roomId || '').toUpperCase()];
        if (!room || room.gameType !== 'pokecries') {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Salon introuvable' }));
        }

        room.status = 'lobby';
        room.roundNumber = 0;
        room.currentPokemon = null;

        Object.keys(room.players).forEach(nick => {
          room.players[nick].score = 0;
          room.players[nick].hasGuessed = false;
          room.players[nick].isCorrect = false;
          room.players[nick].guess = null;
        });

        broadcastPokecriesState(room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // POST /api/pokecries/room/create
  if (parsedUrl.pathname === '/api/pokecries/room/create' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { hostNickname, hostAvatar, hostAvatarIsPhoto, category, era, inputMode, totalRounds } = JSON.parse(body);
        let roomId = generateRoomId();
        while (rooms[roomId]) roomId = generateRoomId();

        rooms[roomId] = {
          id: roomId,
          host: hostNickname,
          gameType: 'pokecries',
          status: 'lobby',
          category: category || 'all',
          era: era || 'latest',
          inputMode: inputMode || 'mcq',
          totalRounds: (totalRounds === 'infinite' || totalRounds === 0 || totalRounds === '0') ? 0 : (parseInt(totalRounds, 10) || 10),
          roundNumber: 0,
          currentPokemon: null,
          players: {
            [hostNickname]: {
              nickname: hostNickname,
              avatar: hostAvatar || '⚡',
              avatarIsPhoto: hostAvatarIsPhoto || (typeof hostAvatar === 'string' && (hostAvatar.startsWith('data:image/') || hostAvatar.startsWith('http'))),
              score: 0,
              isConnected: true,
              hasGuessed: false,
              isCorrect: false,
              guess: null
            }
          },
          clients: []
        };

        console.log(`Created PokéCries room ${roomId} by ${hostNickname}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, roomId }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // POST /api/pokecries/room/join
  if (parsedUrl.pathname === '/api/pokecries/room/join' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, nickname, avatar, avatarIsPhoto } = JSON.parse(body);
        const id = (roomId || '').toUpperCase();
        const room = rooms[id];

        if (!room || room.gameType !== 'pokecries') {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Salon PokéCries introuvable' }));
        }

        if (!room.players[nickname]) {
          room.players[nickname] = {
            nickname: nickname,
            avatar: avatar || '⚡',
            avatarIsPhoto: avatarIsPhoto || (typeof avatar === 'string' && (avatar.startsWith('data:image/') || avatar.startsWith('http'))),
            score: 0,
            isConnected: true,
            hasGuessed: false,
            isCorrect: false,
            guess: null
          };
        } else {
          room.players[nickname].isConnected = true;
          if (avatar) room.players[nickname].avatar = avatar;
          if (avatarIsPhoto !== undefined) room.players[nickname].avatarIsPhoto = avatarIsPhoto;
        }

        broadcastPokecriesState(room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, roomId: id }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // POST /api/pokecries/room/settings
  if (parsedUrl.pathname === '/api/pokecries/room/settings' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, category, era, inputMode, totalRounds } = JSON.parse(body);
        const room = rooms[(roomId || '').toUpperCase()];
        if (room && room.gameType === 'pokecries') {
          if (category !== undefined) room.category = category;
          if (era !== undefined) room.era = era;
          if (inputMode !== undefined) room.inputMode = inputMode;
          if (totalRounds !== undefined) {
            room.totalRounds = (totalRounds === 'infinite' || totalRounds === 0 || totalRounds === '0') ? 0 : (parseInt(totalRounds, 10) || 10);
          }
          broadcastPokecriesState(room);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // POST /api/pokecries/room/start
  if (parsedUrl.pathname === '/api/pokecries/room/start' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, category, era, inputMode, totalRounds } = JSON.parse(body);
        const room = rooms[(roomId || '').toUpperCase()];
        if (!room || room.gameType !== 'pokecries') {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Salon introuvable' }));
        }

        if (category) room.category = category;
        if (era) room.era = era;
        if (inputMode) room.inputMode = inputMode;
        if (totalRounds !== undefined) {
          room.totalRounds = (totalRounds === 'infinite' || totalRounds === 0 || totalRounds === '0') ? 0 : (parseInt(totalRounds, 10) || 10);
        }

        room.roundNumber = 1;
        room.status = 'playing';
        room.currentPokemon = getPokecriesPokemon(room.category, room.era);

        Object.keys(room.players).forEach(nick => {
          room.players[nick].hasGuessed = false;
          room.players[nick].isCorrect = false;
          room.players[nick].guess = null;
        });

        broadcastPokecriesState(room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // POST /api/pokecries/room/guess
  if (parsedUrl.pathname === '/api/pokecries/room/guess' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, nickname, guess } = JSON.parse(body);
        const room = rooms[(roomId || '').toUpperCase()];
        if (!room || room.gameType !== 'pokecries' || !room.currentPokemon) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Salon ou cri introuvable' }));
        }

        const player = room.players[nickname];
        if (!player) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Joueur non trouvé' }));
        }

        if (player.hasGuessed) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Réponse déjà soumise pour cette manche' }));
        }

        player.hasGuessed = true;
        player.guess = guess;

        const cleanGuess = (guess || '').trim().toLowerCase();
        const cleanName = (room.currentPokemon.name || '').trim().toLowerCase();
        const cleanEnName = (room.currentPokemon.enName || '').trim().toLowerCase();

        const isCorrect = cleanGuess === cleanName || cleanGuess === cleanEnName;
        player.isCorrect = isCorrect;

        if (isCorrect) {
          // Speed points bonus: First gets 100, second 80, third 70, etc.
          const correctCount = Object.values(room.players).filter(p => p.isCorrect).length;
          let points = 100;
          if (correctCount === 2) points = 80;
          else if (correctCount === 3) points = 70;
          else if (correctCount > 3) points = 60;
          player.score += points;
        }

        // Check if all active players guessed
        const activePlayers = Object.values(room.players).filter(p => p.isConnected);
        const allDone = activePlayers.every(p => p.hasGuessed);

        if (allDone) {
          room.status = 'round_ended';
        }

        broadcastPokecriesState(room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, isCorrect, correctPokemon: room.status === 'round_ended' ? room.currentPokemon : null }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // POST /api/pokecries/room/next
  if (parsedUrl.pathname === '/api/pokecries/room/next' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId } = JSON.parse(body);
        const room = rooms[(roomId || '').toUpperCase()];
        if (!room || room.gameType !== 'pokecries') {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Salon introuvable' }));
        }

        if (room.roundNumber >= room.totalRounds && room.totalRounds > 0) {
          room.status = 'game_ended';
          const playersData = Object.values(room.players).map(p => ({
            nickname: p.nickname,
            avatar: p.avatar,
            score: p.score,
            points: Math.round(clamp((p.score / Math.max(1, room.totalRounds * 100)) * 100, 0, 100)),
            isWinner: p.score === Math.max(...Object.values(room.players).map(x => x.score)) && p.score > 0
          }));
          recordGameStats('pokecries', playersData, { rounds: room.totalRounds });
        } else {
          room.roundNumber++;
          room.status = 'playing';
          room.currentPokemon = getPokecriesPokemon(room.category, room.era);

          Object.keys(room.players).forEach(nick => {
            room.players[nick].hasGuessed = false;
            room.players[nick].isCorrect = false;
            room.players[nick].guess = null;
          });
        }

        broadcastPokecriesState(room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // POST /api/pokecries/record-solo
  if (parsedUrl.pathname === '/api/pokecries/record-solo' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { nickname, accountNickname, avatar, isWinner, score } = JSON.parse(body);
        if (nickname) {
          recordGameStats('pokecries', [{
            nickname,
            accountNickname,
            avatar: avatar || '⚡',
            isWinner: !!isWinner,
            score: clamp(Math.round(safeNumber(score)), 0, 100),
            points: isWinner ? clamp(Math.round(safeNumber(score)), 0, 100) : 0
          }]);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ==========================================
  // LOUP-GAROU HELPERS & ENDPOINTS
  // ==========================================

  function getSanitizedLoupGarouPlayers(room, forNickname) {
    const sanitized = {};
    const viewer = room.players[forNickname];
    const viewerIsWolf = viewer && viewer.role === 'loup';
    const viewerCoupleId = room.players[forNickname] ? room.players[forNickname].coupleId : null;
    const isHost = Object.keys(room.players)[0] === forNickname;

    Object.keys(room.players).forEach(name => {
      const p = room.players[name];
      let roleRevealed = false;
      
      if (!p.isAlive || room.status === 'game_over' || isHost) {
        roleRevealed = true;
      } else if (name === forNickname) {
        roleRevealed = true;
      } else if (viewerIsWolf && p.role === 'loup') {
        roleRevealed = true;
      } else if (viewer && viewer.role === 'voyante' && room.nightState.inspectedPlayers && room.nightState.inspectedPlayers.includes(name)) {
        roleRevealed = true;
      }

      const isLoverWithViewer = viewerCoupleId && p.coupleId === viewerCoupleId;

      sanitized[name] = {
        nickname: p.nickname,
        avatar: p.avatar || '🦖',
        avatarIsPhoto: p.avatarIsPhoto || false,
        isAlive: p.isAlive,
        isConnected: p.isConnected,
        role: roleRevealed ? p.role : 'mystere',
        isLover: !!isLoverWithViewer,
        isMayor: !!(room.nightState && room.nightState.mayor === name),
        votedFor: (room.status === 'day_vote') ? p.votedFor : null
      };
    });
    return sanitized;
  }

  function getFullLoupGarouState(room, forNickname) {
    const viewer = room.players[forNickname];
    const isAlive = viewer ? viewer.isAlive : false;
    const isHost = Object.keys(room.players)[0] === forNickname;
    
    let privateActionData = null;
    
    if (isHost || (viewer && isAlive)) {
      if (room.status === 'night_voyante') {
        if (isHost || viewer.role === 'voyante') {
          const target = room.players[room.nightState.seerTarget];
          privateActionData = {
            seerTarget: room.nightState.seerTarget,
            seerTargetRole: target ? target.role : null
          };
        }
      }
      else if (room.status === 'night_sorciere') {
        if (isHost || viewer.role === 'sorciere') {
          privateActionData = {
            wolfTarget: room.nightState.wolfTarget,
            hasHealPotion: !room.nightState.witchHealed,
            hasKillPotion: !room.nightState.witchKilled
          };
        }
      }
      else if (room.status === 'night_loup') {
        if (isHost || viewer.role === 'loup') {
          const wolfVotes = {};
          Object.values(room.players).forEach(p => {
            if (p.role === 'loup' && p.votedFor && p.isAlive) {
              wolfVotes[p.nickname] = p.votedFor;
            }
          });
          privateActionData = {
            wolfVotes
          };
        }
      }
      else if (room.status === 'night_voleur') {
        if (isHost || viewer.role === 'voleur') {
          privateActionData = {
            voleurMiddleCards: room.voleurMiddleCards || []
          };
        }
      }
    }

    return {
      status: room.status,
      roomId: room.roomId,
      players: getSanitizedLoupGarouPlayers(room, forNickname),
      turnOrder: room.turnOrder || [],
      winner: room.winner || null,
      historyLogs: room.historyLogs || [],
      rolesConfig: room.rolesConfig,
      myRole: viewer ? viewer.role : null,
      myAlive: isAlive,
      myCouple: viewer && viewer.coupleId ? true : false,
      nightState: {
        lovers: (room.status === 'game_over' || (viewer && viewer.coupleId)) ? room.nightState.lovers : [],
        protectedPlayer: (room.status === 'game_over' || (viewer && viewer.role === 'garde')) ? room.nightState.protectedPlayer : null
      },
      voteTimerEndsAt: room.voteTimerEndsAt || null,
      privateActionData
    };
  }

  function broadcastLoupGarouState(room) {
    room.clients.forEach(client => {
      try {
        client.res.write(`data: ${JSON.stringify({
          type: 'LOUP_GAROU_STATE',
          state: getFullLoupGarouState(room, client.nickname)
        })}\n\n`);
      } catch (err) {}
    });
  }

  function advanceLoupGarouNight(room) {
    if (room.status === 'lobby' || room.status === 'game_over') return;
    if (!room.nightActionsPerformed) room.nightActionsPerformed = [];

    // Order of classic waking roles
    const sequence = ['voleur', 'cupidon', 'garde', 'voyante', 'loup', 'sorciere'];

    for (const role of sequence) {
      if (room.nightActionsPerformed.includes(role)) continue;

      const roleIsActive = room.rolesConfig.activeCards && room.rolesConfig.activeCards.includes(role);
      const playerWithRole = Object.values(room.players).find(p => p.role === role && p.isAlive);

      if (role === 'loup') {
        const aliveWolves = Object.values(room.players).filter(p => p.role === 'loup' && p.isAlive);
        if (aliveWolves.length > 0) {
          room.status = 'night_loup';
          return;
        } else {
          room.nightActionsPerformed.push('loup');
          continue;
        }
      }

      if (role === 'voleur') {
        if (roleIsActive && room.currentNight === 1 && playerWithRole) {
          room.status = 'night_voleur';
          return;
        } else {
          room.nightActionsPerformed.push('voleur');
          continue;
        }
      }

      if (role === 'cupidon') {
        if (roleIsActive && room.currentNight === 1 && playerWithRole) {
          room.status = 'night_cupidon';
          return;
        } else {
          room.nightActionsPerformed.push('cupidon');
          continue;
        }
      }

      if (role === 'garde') {
        if (roleIsActive && playerWithRole) {
          room.status = 'night_garde';
          return;
        } else {
          room.nightActionsPerformed.push('garde');
          continue;
        }
      }

      if (role === 'voyante') {
        if (roleIsActive && playerWithRole) {
          room.status = 'night_voyante';
          return;
        } else {
          room.nightActionsPerformed.push('voyante');
          continue;
        }
      }

      if (role === 'sorciere') {
        if (roleIsActive && playerWithRole) {
          room.status = 'night_sorciere';
          return;
        } else {
          room.nightActionsPerformed.push('sorciere');
          continue;
        }
      }
    }

    // No roles left, resolve night!
    resolveNight(room);
  }

  function checkMayorDeathAndSuccession(room) {
    if (room.rolesConfig && room.rolesConfig.useMayor && room.nightState && room.nightState.mayor) {
      const currentMayor = room.players[room.nightState.mayor];
      if (currentMayor && !currentMayor.isAlive) {
        const alivePlayers = Object.keys(room.players).filter(name => room.players[name].isAlive);
        if (alivePlayers.length > 0) {
          const oldMayor = room.nightState.mayor;
          const newMayor = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
          room.nightState.mayor = newMayor;
          room.historyLogs.push(`${oldMayor} est mort ! Il transmet son écharpe de Maire à ${newMayor} !`);
        } else {
          room.nightState.mayor = null;
        }
      }
    }
  }

  function resolveNight(room) {
    room.status = 'day_announcements';
    console.log(`Loup-Garou room ${room.roomId} night ending. Processing casualties.`);

    const wolfVictim = room.nightState.wolfTarget;
    let wolfVictimDied = false;

    // Check Garde protection
    const isProtected = wolfVictim && room.nightState.protectedPlayer === wolfVictim;
    
    // Check Witch heal
    const isHealed = wolfVictim && room.nightState.witchHealedThisTurn;

    if (wolfVictim && !isProtected && !isHealed) {
      wolfVictimDied = true;
      room.players[wolfVictim].isAlive = false;
      room.historyLogs.push(`${wolfVictim} a été dévoré par les Loups-Garous.`);
    }

    // Check Witch kill
    const witchVictim = room.nightState.witchKilledThisTurn;
    if (witchVictim) {
      room.players[witchVictim].isAlive = false;
      room.historyLogs.push(`${witchVictim} a été empoisonné par la Sorcière.`);
    }

    if (!wolfVictimDied && !witchVictim) {
      room.historyLogs.push(`Une nuit calme s'achève. Personne n'est mort cette nuit !`);
    }

    // Lovers (Cupidon Couple) check
    if (room.nightState.lovers.length === 2) {
      const [loverA, loverB] = room.nightState.lovers;
      if (!room.players[loverA].isAlive && room.players[loverB].isAlive) {
        room.players[loverB].isAlive = false;
        room.historyLogs.push(`${loverB} s'est suicidé par chagrin d'amour pour ${loverA}.`);
      } else if (!room.players[loverB].isAlive && room.players[loverA].isAlive) {
        room.players[loverA].isAlive = false;
        room.historyLogs.push(`${loverA} s'est suicidé par chagrin d'amour pour ${loverB}.`);
      }
    }

    // Initial Mayor election on Day 1
    if (room.rolesConfig && room.rolesConfig.useMayor && (!room.nightState || !room.nightState.mayor)) {
      const aliveList = Object.keys(room.players).filter(name => room.players[name].isAlive);
      if (aliveList.length > 0) {
        const firstMayor = aliveList[0];
        room.nightState.mayor = firstMayor;
        room.historyLogs.push(`${firstMayor} a été désigné d'office comme premier Maire du village !`);
      }
    }

    // Check Mayor death and succession
    checkMayorDeathAndSuccession(room);

    // Check if Hunter died and has a shot pending
    let hunterShotPending = false;
    if (room.rolesConfig.chasseur) {
      Object.values(room.players).forEach(p => {
        if (p.role === 'chasseur' && !p.isAlive && !p.hasShot) {
          room.status = 'day_hunter';
          room.hunterPendingNickname = p.nickname;
          hunterShotPending = true;
          room.historyLogs.push(`Le Chasseur (${p.nickname}) va rendre son dernier soupir. Il charge son fusil !`);
        }
      });
    }

    if (!hunterShotPending) {
      room.status = 'day_vote';
      if (room.rolesConfig && room.rolesConfig.voteTimer > 0) {
        room.voteTimerEndsAt = Date.now() + room.rolesConfig.voteTimer * 1000;
      } else {
        room.voteTimerEndsAt = null;
      }
      checkLoupGarouWin(room);
    }
  }

  function checkLoupGarouWin(room) {
    const alivePlayers = Object.values(room.players).filter(p => p.isAlive && p.role !== 'maitre_du_jeu');
    const aliveWolves = alivePlayers.filter(p => p.role === 'loup');
    const aliveVillagers = alivePlayers.filter(p => p.role !== 'loup');

    // Helper to log stats
    function logLoupGarouGameStats() {
      const playersData = Object.values(room.players)
        .filter(p => p.role !== 'maitre_du_jeu')
        .map(p => {
          let isWinner = false;
          if (room.winner === 'villageois' && p.role !== 'loup') isWinner = true;
          else if (room.winner === 'loups' && p.role === 'loup') isWinner = true;
          else if (room.winner === 'couple' && room.nightState.lovers.includes(p.nickname)) isWinner = true;
        
        return {
          nickname: p.nickname,
          avatar: p.avatar || '🦖',
          avatarIsPhoto: p.avatarIsPhoto || false,
          isWinner,
          score: isWinner ? 3 : 0,
          points: isWinner ? 100 : 15,
          role: p.role
        };
      });
      recordGameStats('loup_garou', playersData);
    }

    // Couple mixed win check
    if (room.nightState.lovers.length === 2) {
      const [loverA, loverB] = room.nightState.lovers;
      const loverAPlayer = room.players[loverA];
      const loverBPlayer = room.players[loverB];
      
      if (loverAPlayer.isAlive && loverBPlayer.isAlive && alivePlayers.length === 2) {
        const hasMixedRoles = (loverAPlayer.role === 'loup' && loverBPlayer.role !== 'loup') ||
                             (loverBPlayer.role === 'loup' && loverAPlayer.role !== 'loup');
        if (hasMixedRoles) {
          room.status = 'game_over';
          room.winner = 'couple';
          room.historyLogs.push(`Victoire Royale ! Les Amoureux (${loverA} et ${loverB}) remportent la partie !`);
          logLoupGarouGameStats();
          return true;
        }
      }
    }

    if (aliveWolves.length === 0) {
      room.status = 'game_over';
      room.winner = 'villageois';
      room.historyLogs.push(`Victoire du Village ! Tous les Loups-Garous ont été éliminés.`);
      logLoupGarouGameStats();
      return true;
    }

    if (aliveWolves.length >= aliveVillagers.length) {
      room.status = 'game_over';
      room.winner = 'loups';
      room.historyLogs.push(`Victoire des Loups-Garous ! Ils ont dévoré tout le village.`);
      logLoupGarouGameStats();
      return true;
    }

    return false;
  }

  // CREATE ROOM
  if (parsedUrl.pathname === '/api/loup-garou/room/create' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { nickname, avatar, avatarIsPhoto } = JSON.parse(body);
        const name = nickname.trim();
        if (!name) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Pseudo requis' }));
        }

        const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
        rooms[roomId] = {
          roomId,
          gameType: 'loup_garou',
          clients: [],
          status: 'lobby',
          players: {
            [name]: { nickname: name, avatar: avatar || '🦖', avatarIsPhoto: avatarIsPhoto || false, role: 'simple_villageois', votedFor: null, isAlive: true, isConnected: true, coupleId: null, hasShot: false }
          },
          rolesConfig: {
            activeCards: ['loup', 'simple_villageois', 'voyante', 'sorciere', 'chasseur']
          },
          nightState: {
            lovers: [],
            protectedPlayer: null,
            seerTarget: null,
            wolfTarget: null,
            witchHealed: false,
            witchKilled: null,
            witchHealedThisTurn: false,
            witchKilledThisTurn: null
          },
          historyLogs: [],
          currentNight: 0
        };

        console.log(`Loup-Garou room created: ${roomId} by ${name}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, roomId, nickname: name }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // JOIN ROOM
  if (parsedUrl.pathname === '/api/loup-garou/room/join' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, nickname, avatar, avatarIsPhoto } = JSON.parse(body);
        const id = (roomId || '').toUpperCase();
        const name = nickname.trim();

        if (!rooms[id] || rooms[id].gameType !== 'loup_garou') {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Salon introuvable' }));
        }
        if (!name) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Pseudo requis' }));
        }
        if (name.length > 15) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Le pseudo ne doit pas dépasser 15 caractères' }));
        }

        const room = rooms[id];

        // Reconnection logic
        if (room.players[name]) {
          room.players[name].isConnected = true;
          if (avatar) room.players[name].avatar = avatar;
          console.log(`Player ${name} reconnected to Loup-Garou room ${id}`);
          broadcastLoupGarouState(room);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, roomId: id, nickname: name }));
        }

        if (room.status !== 'lobby') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Partie déjà commencée' }));
        }

        room.players[name] = { nickname: name, avatar: avatar || '🦖', avatarIsPhoto: avatarIsPhoto || false, role: 'simple_villageois', votedFor: null, isAlive: true, isConnected: true, coupleId: null, hasShot: false };
        console.log(`Player ${name} joined Loup-Garou room ${id}`);
        broadcastLoupGarouState(room);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, roomId: id, nickname: name }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // SAVE SETTINGS
  if (parsedUrl.pathname === '/api/loup-garou/settings' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, rolesConfig } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'loup_garou') {
          res.writeHead(404); return res.end();
        }
        if (rolesConfig) {
          room.rolesConfig = rolesConfig;
        }
        console.log(`Loup-Garou room ${roomId} updated settings:`, room.rolesConfig);
        broadcastLoupGarouState(room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // START GAME
  if (parsedUrl.pathname === '/api/loup-garou/start' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'loup_garou') {
          res.writeHead(404); return res.end();
        }

        const playersList = Object.keys(room.players);
        const hostNickname = playersList[0];
        const realPlayers = playersList.filter(name => name !== hostNickname);
        const config = room.rolesConfig || {};
        let activeCards = config.activeCards || ['loup', 'simple_villageois'];

        if (activeCards.length !== realPlayers.length) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: `Le nombre de cartes sélectionnées (${activeCards.length}) doit être exactement égal au nombre de joueurs réels (${realPlayers.length}) !` }));
        }

        let rolesPool = [...activeCards];

        // Shuffle roles
        for (let i = rolesPool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [rolesPool[i], rolesPool[j]] = [rolesPool[j], rolesPool[i]];
        }

        // Assign roles
        room.players[hostNickname].role = 'maitre_du_jeu';
        room.players[hostNickname].isAlive = true;
        room.players[hostNickname].votedFor = null;
        room.players[hostNickname].coupleId = null;
        room.players[hostNickname].hasShot = true; // GM can't shot

        realPlayers.forEach((name, index) => {
          const p = room.players[name];
          p.role = rolesPool[index];
          p.isAlive = true;
          p.votedFor = null;
          p.coupleId = null;
          p.hasShot = false;
        });

        // Initialize state
        room.currentNight = 1;
        room.nightActionsPerformed = [];
        room.historyLogs = [`La Nuit n°1 tombe sur le village... Tout le monde s'endort.`];
        room.nightState = {
          lovers: [],
          protectedPlayer: null,
          seerTarget: null,
          wolfTarget: null,
          witchHealed: false,
          witchKilled: null,
          witchHealedThisTurn: false,
          witchKilledThisTurn: null
        };

        // Voleur middle cards setup
        if (activeCards.includes('voleur')) {
          const possibleExtras = ['simple_villageois', 'loup', 'voyante', 'garde', 'chasseur'];
          const ex1 = possibleExtras[Math.floor(Math.random() * possibleExtras.length)];
          const ex2 = possibleExtras[Math.floor(Math.random() * possibleExtras.length)];
          room.voleurMiddleCards = [ex1, ex2];
        } else {
          room.voleurMiddleCards = [];
        }

        // Shuffle turn order (who votes first)
        const shuffledList = [...playersList];
        for (let i = shuffledList.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledList[i], shuffledList[j]] = [shuffledList[j], shuffledList[i]];
        }
        room.turnOrder = shuffledList;
        room.status = 'night_actions';

        advanceLoupGarouNight(room);

        console.log(`Loup-Garou room ${roomId} game started successfully sequentially!`);
        broadcastLoupGarouState(room);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // NIGHT ACTION
  if (parsedUrl.pathname === '/api/loup-garou/night-action' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, nickname, actionType, targetName, targetName2 } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'loup_garou') {
          res.writeHead(404); return res.end();
        }

        const isHost = Object.keys(room.players)[0] === nickname;
        if (!isHost) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Seul le Maître du Jeu (Hôte) peut faire des actions.' }));
        }

        if (actionType === 'gm_skip') {
           let currentRole = '';
           if (room.status === 'night_voleur') currentRole = 'voleur';
           else if (room.status === 'night_cupidon') currentRole = 'cupidon';
           else if (room.status === 'night_garde') currentRole = 'garde';
           else if (room.status === 'night_voyante') currentRole = 'voyante';
           else if (room.status === 'night_loup') currentRole = 'loup';
           else if (room.status === 'night_sorciere') currentRole = 'sorciere';
           
           if (currentRole) {
             room.nightActionsPerformed.push(currentRole);
             advanceLoupGarouNight(room);
           }
        }
        else if (actionType === 'voleur' && room.currentNight === 1) {
          const voleurPlayer = Object.values(room.players).find(pl => pl.role === 'voleur');
          if (voleurPlayer && targetName && room.voleurMiddleCards && room.voleurMiddleCards.includes(targetName)) {
            const originalRole = voleurPlayer.role;
            voleurPlayer.role = targetName;
            const idx = room.voleurMiddleCards.indexOf(targetName);
            if (idx !== -1) {
              room.voleurMiddleCards[idx] = originalRole;
            }
            room.historyLogs.push(`Le Voleur a choisi d'échanger sa carte.`);
          } else if (voleurPlayer) {
            room.historyLogs.push(`Le Voleur a choisi de garder sa carte.`);
          }
          room.nightActionsPerformed.push('voleur');
          advanceLoupGarouNight(room);
        }
        else if (actionType === 'voleur_steal' && room.currentNight === 1) {
          const voleurPlayer = Object.values(room.players).find(pl => pl.role === 'voleur');
          const targetPlayer = room.players[targetName];
          if (voleurPlayer && targetPlayer && targetPlayer.nickname !== voleurPlayer.nickname) {
            const targetOriginalRole = targetPlayer.role;
            targetPlayer.role = voleurPlayer.role;
            voleurPlayer.role = targetOriginalRole;
            room.historyLogs.push(`Le Voleur a secrètement dérobé le rôle de ${targetName}.`);
          }
          room.nightActionsPerformed.push('voleur');
          advanceLoupGarouNight(room);
        }
        else if (actionType === 'cupidon' && room.currentNight === 1) {
          if (targetName && targetName2) {
            room.nightState.lovers = [targetName, targetName2];
            room.players[targetName].coupleId = 'couple_1';
            room.players[targetName2].coupleId = 'couple_1';
            room.historyLogs.push(`Cupidon a lié deux cœurs d'un amour indestructible.`);
          }
          room.nightActionsPerformed.push('cupidon');
          advanceLoupGarouNight(room);
        }
        else if (actionType === 'garde') {
          room.nightState.protectedPlayer = targetName;
          room.nightActionsPerformed.push('garde');
          advanceLoupGarouNight(room);
        }
        else if (actionType === 'voyante') {
          room.nightState.seerTarget = targetName;
          if (!room.nightState.inspectedPlayers) room.nightState.inspectedPlayers = [];
          if (targetName && !room.nightState.inspectedPlayers.includes(targetName)) {
            room.nightState.inspectedPlayers.push(targetName);
          }
          room.nightActionsPerformed.push('voyante');
          advanceLoupGarouNight(room);
        }
        else if (actionType === 'loup') {
          room.nightState.wolfTarget = targetName; // Host decides directly
          room.nightActionsPerformed.push('loup');
          advanceLoupGarouNight(room);
        }
        else if (actionType === 'sorciere_heal') {
          room.nightState.witchHealed = true;
          room.nightState.witchHealedThisTurn = true;
          room.nightActionsPerformed.push('sorciere');
          advanceLoupGarouNight(room);
        }
        else if (actionType === 'sorciere_kill') {
          room.nightState.witchKilled = true;
          room.nightState.witchKilledThisTurn = targetName;
          room.nightActionsPerformed.push('sorciere');
          advanceLoupGarouNight(room);
        }
        else if (actionType === 'sorciere_skip') {
          room.nightActionsPerformed.push('sorciere');
          advanceLoupGarouNight(room);
        }

        broadcastLoupGarouState(room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // HUNTER VENGEANCE SHOT
  if (parsedUrl.pathname === '/api/loup-garou/hunter-shot' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, nickname, targetName } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'loup_garou' || room.status !== 'day_hunter') {
          res.writeHead(404); return res.end();
        }

        const p = room.players[nickname];
        if (!p || p.role !== 'chasseur' || p.hasShot) {
          res.writeHead(400); return res.end();
        }

        p.hasShot = true;
        if (targetName && room.players[targetName]) {
          room.players[targetName].isAlive = false;
          room.historyLogs.push(`PAN ! Le Chasseur venge sa mort en éliminant ${targetName}.`);

          // Couple suicide checks
          if (room.nightState.lovers.length === 2) {
            const [loverA, loverB] = room.nightState.lovers;
            if (!room.players[loverA].isAlive && room.players[loverB].isAlive) {
              room.players[loverB].isAlive = false;
              room.historyLogs.push(`${loverB} s'est suicidé par chagrin d'amour pour ${loverA}.`);
            } else if (!room.players[loverB].isAlive && room.players[loverA].isAlive) {
              room.players[loverA].isAlive = false;
              room.historyLogs.push(`${loverA} s'est suicidé par chagrin d'amour pour ${loverB}.`);
            }
          }
          
          // Check Mayor death and succession
          checkMayorDeathAndSuccession(room);
        }

        room.status = 'day_vote';
        if (room.rolesConfig && room.rolesConfig.voteTimer > 0) {
          room.voteTimerEndsAt = Date.now() + room.rolesConfig.voteTimer * 1000;
        } else {
          room.voteTimerEndsAt = null;
        }
        checkLoupGarouWin(room);
        broadcastLoupGarouState(room);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // GM ELIMINATE ACTION (replaces tally and hunter-shot)
  if (parsedUrl.pathname === '/api/loup-garou/gm/eliminate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, nickname, targetName, reason } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'loup_garou') {
          res.writeHead(404); return res.end();
        }

        const isHost = Object.keys(room.players)[0] === nickname;
        if (!isHost) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Seul le Maître du Jeu (Hôte) peut faire des actions.' }));
        }

        if (targetName === 'skip') {
          room.historyLogs.push(`Le village n'a désigné aucun coupable.`);
        } else {
          const target = room.players[targetName];
          if (target && target.isAlive) {
            target.isAlive = false;
            
            if (reason === 'vote') {
              room.historyLogs.push(`Le village a éliminé ${targetName} (Rôle : ${target.role.toUpperCase()}).`);
            } else if (reason === 'hunter') {
              room.historyLogs.push(`Le Chasseur a emporté ${targetName} dans sa tombe.`);
            } else {
              room.historyLogs.push(`${targetName} a été éliminé.`);
            }

            // Couple check
            if (room.nightState && room.nightState.lovers && room.nightState.lovers.length === 2) {
              const [loverA, loverB] = room.nightState.lovers;
              if (targetName === loverA && room.players[loverB].isAlive) {
                room.players[loverB].isAlive = false;
                room.historyLogs.push(`${loverB} s'est suicidé par chagrin d'amour pour ${loverA}.`);
              } else if (targetName === loverB && room.players[loverA].isAlive) {
                room.players[loverA].isAlive = false;
                room.historyLogs.push(`${loverA} s'est suicidé par chagrin d'amour pour ${loverB}.`);
              }
            }
            
            // Mayor check
            checkMayorDeathAndSuccession(room);
          }
        }
        
        // Reset timers and advance
        room.voteTimerEndsAt = null;
        Object.values(room.players).forEach(p => p.votedFor = null);

        checkLoupGarouWin(room);
        
        // Move to night if it was day vote and game isn't over.
        // If reason was hunter, the GM still needs to decide if it's night or day, but let's assume it moves to next phase.
        if (room.status !== 'game_over') {
           // Find if hunter is dead and hasn't shot.
           const deadHunter = Object.values(room.players).find(p => p.role === 'chasseur' && !p.isAlive && !p.hasShot);
           if (deadHunter) {
              deadHunter.hasShot = true;
              room.status = 'day_hunter';
              room.historyLogs.push(`Le Chasseur (${deadHunter.nickname}) va tirer ! (Le MJ doit choisir la cible)`);
           } else {
              room.currentNight++;
              room.status = 'night_actions';
              room.historyLogs.push(`La nuit n°${room.currentNight} retombe sur le village de Thiercelieux...`);
              
              room.nightState.protectedPlayer = null;
              room.nightState.seerTarget = null;
              room.nightState.wolfTarget = null;
              room.nightState.witchHealedThisTurn = false;
              room.nightState.witchKilledThisTurn = null;
              room.voteTimerEndsAt = null;
              Object.keys(room.players).forEach(name => room.players[name].votedFor = null);
           }
        }

        broadcastLoupGarouState(room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // DAY VOTE
  if (parsedUrl.pathname === '/api/loup-garou/vote' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, nickname, votedNickname } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'loup_garou' || room.status !== 'day_vote') {
          res.writeHead(404); return res.end();
        }

        const p = room.players[nickname];
        if (!p || !p.isAlive) {
          res.writeHead(400); return res.end();
        }

        p.votedFor = votedNickname === 'skip' ? 'skip' : votedNickname;
        broadcastLoupGarouState(room);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // TALLY DAY VOTES
  if (parsedUrl.pathname === '/api/loup-garou/tally' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'loup_garou' || room.status !== 'day_vote') {
          res.writeHead(404); return res.end();
        }

        // Count votes
        const voteCounts = {};
        Object.values(room.players).forEach(p => {
          if (p.isAlive && p.votedFor) {
            const isMayor = room.nightState && room.nightState.mayor === p.nickname;
            const weight = isMayor ? 2 : 1;
            voteCounts[p.votedFor] = (voteCounts[p.votedFor] || 0) + weight;
          }
        });

        // Reset timer
        room.voteTimerEndsAt = null;

        let highestVotes = 0;
        let selectedChoice = null;
        let isTie = false;

        Object.keys(voteCounts).forEach(choice => {
          if (voteCounts[choice] > highestVotes) {
            highestVotes = voteCounts[choice];
            selectedChoice = choice;
            isTie = false;
          } else if (voteCounts[choice] === highestVotes) {
            isTie = true;
          }
        });

        if (!selectedChoice || selectedChoice === 'skip' || isTie) {
          room.historyLogs.push(`Le village n'a désigné aucun coupable lors du conseil municipal.`);
        } else {
          // Eliminate
          room.players[selectedChoice].isAlive = false;
          room.historyLogs.push(`Le conseil du village a voté l'élimination de ${selectedChoice} (était : ${room.players[selectedChoice].role.toUpperCase()}).`);

          // Lovers couple check
          if (room.nightState.lovers.length === 2) {
            const [loverA, loverB] = room.nightState.lovers;
            if (!room.players[loverA].isAlive && room.players[loverB].isAlive) {
              room.players[loverB].isAlive = false;
              room.historyLogs.push(`${loverB} s'est suicidé par chagrin d'amour pour ${loverA}.`);
            } else if (!room.players[loverB].isAlive && room.players[loverA].isAlive) {
              room.players[loverA].isAlive = false;
              room.historyLogs.push(`${loverA} s'est suicidé par chagrin d'amour pour ${loverB}.`);
            }
          }

          // Check Mayor death and succession
          checkMayorDeathAndSuccession(room);
        }

        // Check Hunter
        let hunterShotPending = false;
        if (room.rolesConfig.chasseur) {
          Object.values(room.players).forEach(p => {
            if (p.role === 'chasseur' && !p.isAlive && !p.hasShot) {
              room.status = 'day_hunter';
              room.hunterPendingNickname = p.nickname;
              hunterShotPending = true;
              room.historyLogs.push(`Le Chasseur (${p.nickname}) charge son fusil avant de mourir !`);
            }
          });
        }

        // Transition back to night if not game over and no hunter pending
        if (!hunterShotPending) {
          const gameOver = checkLoupGarouWin(room);
          if (!gameOver) {
            // Re-init for next Night
            room.currentNight++;
            room.status = 'night_actions';
            room.historyLogs.push(`La nuit n°${room.currentNight} retombe sur le village de Thiercelieux...`);
            
            // Clean temp states
            room.nightState.protectedPlayer = null;
            room.nightState.seerTarget = null;
            room.nightState.wolfTarget = null;
            room.nightState.witchHealedThisTurn = false;
            room.nightState.witchKilledThisTurn = null;
            room.voteTimerEndsAt = null;

            Object.keys(room.players).forEach(name => {
              room.players[name].votedFor = null;
            });
          }
        }

        broadcastLoupGarouState(room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // RESTART
  if (parsedUrl.pathname === '/api/loup-garou/restart' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'loup_garou') {
          res.writeHead(404); return res.end();
        }

        room.status = 'lobby';
        room.currentNight = 0;
        room.historyLogs = [];
        room.winner = null;
        room.nightState = {
          lovers: [],
          protectedPlayer: null,
          seerTarget: null,
          wolfTarget: null,
          witchHealed: false,
          witchKilled: null,
          witchHealedThisTurn: false,
          witchKilledThisTurn: null
        };

        Object.keys(room.players).forEach(name => {
          const p = room.players[name];
          p.role = 'simple_villageois';
          p.votedFor = null;
          p.isAlive = true;
          p.coupleId = null;
          p.hasShot = false;
        });

        console.log(`Loup-Garou room ${roomId} returned to lobby.`);
        broadcastLoupGarouState(room);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // KICK LOUP-GAROU PLAYER
  if (parsedUrl.pathname === '/api/loup-garou/kick' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, targetNickname } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'loup_garou') {
          res.writeHead(404); return res.end();
        }

        if (room.players[targetNickname]) {
          delete room.players[targetNickname];

          room.clients = room.clients.filter(client => {
            if (client.nickname === targetNickname) {
              try { client.res.end(); } catch(err) {}
              return false;
            }
            return true;
          });

          console.log(`Kicked ${targetNickname} from Loup-Garou room ${roomId}`);

          if (room.status !== 'lobby') {
            checkLoupGarouWin(room);
          }

          broadcastLoupGarouState(room);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(404); res.end();
        }
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // ==========================================
  // AUTHENTICATION API
  // ==========================================
  if (parsedUrl.pathname === '/api/auth/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { nickname, password } = JSON.parse(body);
        if (!nickname || !password || nickname.length > 15) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Pseudo invalide ou mot de passe manquant.' }));
        }

        const users = loadUsers();
        if (users[nickname]) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Ce pseudo est déjà pris.' }));
        }

        users[nickname] = {
          nickname,
          passwordHash: hashPassword(password),
          avatar: '🦖',
          avatarIsPhoto: false,
          createdAt: Date.now()
        };
        saveUsers(users);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, user: { nickname, avatar: '🦖', avatarIsPhoto: false } }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  if (parsedUrl.pathname === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { nickname, password } = JSON.parse(body);
        const users = loadUsers();
        const user = users[nickname];

        if (!user || !verifyPassword(password, user.passwordHash)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Identifiants incorrects.' }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, user: { nickname: user.nickname, avatar: user.avatar, avatarIsPhoto: user.avatarIsPhoto } }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  if (parsedUrl.pathname === '/api/profile/me' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { nickname, password } = JSON.parse(body);
        const users = loadUsers();
        const user = users[nickname];

        if (!user || !verifyPassword(password, user.passwordHash)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Non autorisé.' }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, user: { nickname: user.nickname, avatar: user.avatar, avatarIsPhoto: user.avatarIsPhoto } }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  if (parsedUrl.pathname === '/api/profile/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { nickname, password, avatar, avatarIsPhoto } = JSON.parse(body);
        const users = loadUsers();
        const user = users[nickname];

        if (!user || !verifyPassword(password, user.passwordHash)) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Non autorisé.' }));
        }

        user.avatar = avatar;
        user.avatarIsPhoto = avatarIsPhoto;
        saveUsers(users);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400); res.end();
      }
    });
    return;
  }

  // Statistics API Endpoints
  if (parsedUrl.pathname === '/api/stats/leaderboard') {
    const game = STATS_GAMES.includes(parsedUrl.query.game) ? parsedUrl.query.game : '';
    const period = ['week', 'month', 'year', 'all'].includes(parsedUrl.query.period) ? parsedUrl.query.period : 'all';
    const sort = STATS_SORTS.has(parsedUrl.query.sort) ? parsedUrl.query.sort : 'points';
    const now = Date.now();
    const durations = { week: 7, month: 30, year: 365 };
    const cutoff = durations[period] ? now - durations[period] * 24 * 3600 * 1000 : 0;
    const logs = (loadStats().logs || []).filter(log =>
      (!game || log.game === game) && (!cutoff || safeNumber(log.timestamp) >= cutoff)
    );
    const leaderboard = sortLeaderboard(aggregateStats(logs), sort).map((player, index) => ({
      ...player,
      rank: index + 1,
      eligibleForWinRate: player.gamesPlayed >= 3
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ leaderboard, sort, game: game || 'all', period, minimumGamesForWinRate: 3 }));
    return;
  }

  if (parsedUrl.pathname === '/api/stats/user') {
    const nickname = String(parsedUrl.query.nickname || '').trim();
    const nicknameKey = normalizeNickname(nickname);
    const allLogs = loadStats().logs || [];
    const userStats = {};

    STATS_GAMES.forEach(game => {
      const gamePlayers = aggregateStats(allLogs.filter(log => log.game === game));
      const pointsRanking = sortLeaderboard(gamePlayers, 'points');
      const winsRanking = sortLeaderboard(gamePlayers, 'wins');
      const winRateRanking = sortLeaderboard(gamePlayers, 'winRate');
      const user = gamePlayers.find(player => normalizeNickname(player.nickname) === nicknameKey) || {
        gamesPlayed: 0, wins: 0, points: 0, rawScore: 0, winRate: 0
      };
      const rankFor = list => {
        const index = list.findIndex(player => normalizeNickname(player.nickname) === nicknameKey);
        return index < 0 ? null : index + 1;
      };
      userStats[game] = {
        gamesPlayed: user.gamesPlayed,
        wins: user.wins,
        points: user.points,
        score: user.points,
        winRate: user.winRate,
        rank: rankFor(pointsRanking),
        ranks: { points: rankFor(pointsRanking), wins: rankFor(winsRanking), winRate: user.gamesPlayed >= 3 ? rankFor(winRateRanking) : null },
        totalPlayers: gamePlayers.length
      };
    });

    const history = allLogs
      .filter(log => Array.isArray(log.players) && log.players.some(player => normalizeNickname(player.nickname) === nicknameKey))
      .sort((a, b) => safeNumber(b.timestamp) - safeNumber(a.timestamp))
      .slice(0, 15)
      .map(log => {
        const player = log.players.find(item => normalizeNickname(item.nickname) === nicknameKey);
        return {
          game: log.game, timestamp: log.timestamp, isWinner: player?.isWinner === true,
          score: Math.max(0, safeNumber(player?.score)), points: getCompetitivePoints(log.game, player || {}), role: player?.role || ''
        };
      });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ nickname, stats: userStats, history }));
    return;
  }

  // ==========================================
  // SSE CONNECTION
  // ==========================================
  
  if (parsedUrl.pathname === '/api/events') {
    const roomId = parsedUrl.query.roomId;
    const nickname = parsedUrl.query.nickname;
    const avatar = parsedUrl.query.avatar;
    const room = rooms[roomId];
    
    if (!room) {
      res.writeHead(404);
      return res.end();
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    
    const client = { id: Date.now(), nickname, avatar: avatar || '🦖', res };
    room.clients.push(client);

    // Heartbeat to keep SSE connection alive through proxies/browsers
    const keepAliveTimer = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch (err) {
        clearInterval(keepAliveTimer);
      }
    }, 10000);
    
    // Send initial state depending on gameType
    if (room.gameType === 'imposteur') {
      if (nickname) {
        if (!room.players[nickname] && room.status === 'lobby') {
          room.players[nickname] = {
            nickname: nickname,
            avatar: avatar || '🦖',
            avatarIsPhoto: false,
            word: '',
            isImpostor: false,
            votedFor: null,
            isEliminated: false,
            score: 0,
            isConnected: true
          };
        } else if (room.players[nickname]) {
          room.players[nickname].isConnected = true;
          if (avatar) room.players[nickname].avatar = avatar;
        }
        console.log(`Player ${nickname} connected in Imposteur room ${roomId}`);
        
        broadcast(room, {
          type: 'IMPOSTEUR_STATE',
          state: getFullImposteurState(room)
        });
      }
      
      res.write(`data: ${JSON.stringify({ 
        type: 'IMPOSTEUR_STATE', 
        state: getFullImposteurState(room)
      })}\n\n`);
    } else if (room.gameType === 'geographie') {
      if (nickname) {
        if (!room.players[nickname] && room.status === 'lobby') {
          room.players[nickname] = {
            nickname: nickname,
            avatar: avatar || '🦖',
            score: 0,
            lastAnswer: null,
            lastAnswerCorrect: false,
            lastPointsEarned: 0,
            hasAnswered: false,
            timeTaken: null,
            isConnected: true
          };
        } else if (room.players[nickname]) {
          room.players[nickname].isConnected = true;
          if (avatar) room.players[nickname].avatar = avatar;
        }
        broadcastGeoState(room);
      }
      res.write(`data: ${JSON.stringify({ 
        type: 'GEOGRAPHIE_STATE', 
        state: { 
          status: room.status,
          mode: room.mode,
          scope: room.scope,
          questionCount: room.questionCount,
          currentQuestionIndex: room.currentQuestionIndex,
          players: getSanitizedGeoPlayers(room),
          question: getSanitizedQuestion(room),
          leaderboard: getGeoLeaderboard(room)
        }
      })}\n\n`);
    } else if (room.gameType === 'loup_garou') {
      if (nickname) {
        if (!room.players[nickname] && room.status === 'lobby') {
          room.players[nickname] = {
            nickname: nickname,
            avatar: avatar || '🦖',
            avatarIsPhoto: false,
            role: null,
            alive: true,
            votedFor: null,
            isConnected: true
          };
        } else if (room.players[nickname]) {
          room.players[nickname].isConnected = true;
          if (avatar) room.players[nickname].avatar = avatar;
        }
        console.log(`Player ${nickname} connected in Loup-Garou room ${roomId}`);
        broadcastLoupGarouState(room);
      }
    } else if (room.gameType === 'songless') {
      if (nickname) {
        if (!room.players[nickname] && room.status === 'lobby') {
          room.players[nickname] = {
            nickname: nickname,
            avatar: avatar || '🎵',
            score: 0,
            isConnected: true,
            hasGuessed: false,
            isCorrect: false,
            attempts: []
          };
        } else if (room.players[nickname]) {
          room.players[nickname].isConnected = true;
          if (avatar) room.players[nickname].avatar = avatar;
        }
        console.log(`Player ${nickname} connected in Songless room ${roomId}`);
        broadcastSonglessState(room);
      }
      res.write(`data: ${JSON.stringify({ 
        type: 'SONGLESS_STATE', 
        state: {
          status: room.status,
          host: room.host,
          category: room.category,
          roundNumber: room.roundNumber,
          totalRounds: room.totalRounds,
          durations: [0.1, 0.5, 1.0, 2.5, 5.0, 10.0],
          currentSong: (room.status === 'playing' && room.currentSong) ? {
            songId: room.currentSong.songId,
            previewUrl: room.currentSong.previewUrl
          } : (room.status === 'round_ended' || room.status === 'game_ended' ? room.currentSolution : null),
          players: getSanitizedSonglessPlayers(room),
          leaderboard: getSonglessLeaderboard(room)
        }
      })}\n\n`);
    } else if (room.gameType === 'pokecries') {
      if (nickname) {
        if (!room.players[nickname] && room.status === 'lobby') {
          room.players[nickname] = {
            nickname: nickname,
            avatar: avatar || '⚡',
            score: 0,
            isConnected: true,
            hasGuessed: false,
            isCorrect: false,
            guess: null
          };
        } else if (room.players[nickname]) {
          room.players[nickname].isConnected = true;
          if (avatar) room.players[nickname].avatar = avatar;
        }
        console.log(`Player ${nickname} connected in PokéCries room ${roomId}`);
        broadcastPokecriesState(room);
      }
      res.write(`data: ${JSON.stringify({ 
        type: 'POKECRIES_STATE', 
        state: {
          status: room.status,
          category: room.category,
          era: room.era,
          inputMode: room.inputMode,
          roundNumber: room.roundNumber,
          totalRounds: room.totalRounds,
          currentCry: (room.status === 'playing' && room.currentPokemon) ? {
            cryUrl: room.currentPokemon.cryUrl,
            choices: room.currentPokemon.choices,
            gen: room.currentPokemon.gen
          } : null,
          currentSolution: (room.status === 'round_ended' || room.status === 'game_ended') ? room.currentPokemon : null,
          players: getSanitizedPokecriesPlayers(room),
          leaderboard: getPokecriesLeaderboard(room)
        }
      })}\n\n`);
    } else if (room.gameType === 'theridactle' || room.gameType === 'pokedactle' || room.gameType === 'merrydactle') {
      if (nickname) {
        if (!room.players[nickname]) {
          room.players[nickname] = {
            nickname: nickname,
            avatar: avatar || (room.gameType === 'merrydactle' ? '🏴‍☠️' : (room.gameType === 'pokedactle' ? '⚡' : '🦖')),
            avatarIsPhoto: false,
            score: 0,
            isConnected: true,
            guessesCount: 0
          };
        } else {
          room.players[nickname].isConnected = true;
          if (avatar) room.players[nickname].avatar = avatar;
        }
        if (!room.host) room.host = nickname;
        broadcastDactleState(room);
      }
      const eventType = room.gameType === 'theridactle' ? 'THERIDACTLE_STATE' : (room.gameType === 'pokedactle' ? 'POKEDACTLE_STATE' : 'MERRYDACTLE_STATE');
      res.write(`data: ${JSON.stringify({ 
        type: eventType, 
        state: getDactleStatePayload(room) 
      })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ type: 'STATE', state: { 
        guesses: room.guesses, 
        guessHistory: room.guessHistory, 
        isWon: room.isWon 
      }})}\n\n`);
    }
    
    req.on('close', () => {
      clearInterval(keepAliveTimer);
      room.clients = room.clients.filter(c => c.id !== client.id);
      
      if (nickname && room.players && room.players[nickname]) {
        room.players[nickname].isConnected = false;
        
        // Grace period before removing from lobby
        setTimeout(() => {
          if (rooms[roomId] && rooms[roomId].players[nickname] && !rooms[roomId].players[nickname].isConnected) {
            if (rooms[roomId].status === 'lobby') {
              delete rooms[roomId].players[nickname];
              console.log(`Player ${nickname} left lobby ${roomId} after disconnect`);
              if (rooms[roomId].gameType === 'imposteur') {
                broadcast(rooms[roomId], { type: 'IMPOSTEUR_STATE', state: getFullImposteurState(rooms[roomId]) });
              } else if (rooms[roomId].gameType === 'geographie') {
                broadcastGeoState(rooms[roomId]);
              } else if (rooms[roomId].gameType === 'loup_garou') {
                broadcastLoupGarouState(rooms[roomId]);
              } else if (rooms[roomId].gameType === 'songless') {
                broadcastSonglessState(rooms[roomId]);
              } else if (rooms[roomId].gameType === 'pokecries') {
                broadcastPokecriesState(rooms[roomId]);
              } else if (rooms[roomId].gameType === 'theridactle' || rooms[roomId].gameType === 'pokedactle' || rooms[roomId].gameType === 'merrydactle') {
                broadcastDactleState(rooms[roomId]);
              }
            }
          }
        }, 60000);
      }
      
      // Clean up empty rooms after 10 minutes
      if (room.clients.length === 0) {
        setTimeout(() => {
          if (rooms[roomId] && rooms[roomId].clients.length === 0) {
            delete rooms[roomId];
            console.log(`Deleted empty room ${roomId}`);
          }
        }, 10 * 60 * 1000);
      }
    });
    return;
  }

  // ==========================================
  // STATIC FILES SERVING (STRIP QUERY PARAMS & NO-CACHE)
  // ==========================================
  const pathname = parsedUrl.pathname || '/';
  if (pathname === '/hub' || pathname === '/portal' || pathname === '/portal.html') {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }
  let targetFile = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  let filePath = path.join(__dirname, 'client', targetFile);
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code == 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
      }
    } else {
      const headers = { 
        'Content-Type': mimeTypes[extname] || 'application/octet-stream',
        'X-Robots-Tag': 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
      };
      if (extname === '.xml' || extname === '.txt') {
        headers['Cache-Control'] = 'public, max-age=3600';
      } else {
        headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
        headers['Pragma'] = 'no-cache';
        headers['Expires'] = '0';
      }
      res.writeHead(200, headers);
      res.end(content, 'utf-8');
    }
  });
});

// Pre-load from cloud if configured
if (process.env.JSONBIN_KEY) {
  console.log("Preloading databases from JSONBin cloud storage...");
  Promise.all([
    // Preload users
    process.env.JSONBIN_USERS_BIN ? fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_USERS_BIN}/latest`, {
      headers: { 'X-Master-Key': process.env.JSONBIN_KEY }
    }).then(r => r.json()).then(data => {
      if (data.record) {
        cachedUsers = data.record;
        console.log("Loaded users from JSONBin successfully.");
      }
    }).catch(e => console.error("Failed to preload users from cloud:", e)) : Promise.resolve(),

    // Preload stats
    process.env.JSONBIN_STATS_BIN ? fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_STATS_BIN}/latest`, {
      headers: { 'X-Master-Key': process.env.JSONBIN_KEY }
    }).then(r => r.json()).then(data => {
      if (data.record) {
        cachedStats = data.record;
        console.log("Loaded stats from JSONBin successfully.");
      }
    }).catch(e => console.error("Failed to preload stats from cloud:", e)) : Promise.resolve()
  ]).then(() => {
    startServer();
  });
} else {
  startServer();
}

function startServer() {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}/`);
  });
}
