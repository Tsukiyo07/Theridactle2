const https = require('https');
const http = require('http');
const crypto = require('crypto');

// Helper: Normalize string for flexible matching
function normalizeText(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/\s*\([^)]*\)/g, "")   // remove (feat. ...), (Remastered)
    .replace(/\s*\[[^\]]*\]/g, "")  // remove [Remix], [Live]
    .replace(/[^a-z0-9]/g, " ")    // keep only alphanumerics
    .replace(/\s+/g, " ")
    .trim();
}

// Levenshtein distance helper for fuzzy typo tolerance
function levenshteinDistance(s1, s2) {
  s1 = s1 || '';
  s2 = s2 || '';
  const m = s1.length;
  const n = s2.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const d = [];
  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,      // deletion
        d[i][j - 1] + 1,      // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return d[m][n];
}

function isFuzzyMatch(guess, target, maxDist = null) {
  const g = normalizeText(guess);
  const t = normalizeText(target);
  if (!g || !t) return false;
  if (g === t) return true;
  if (g.includes(t) || t.includes(g)) return true;

  const allowedDist = maxDist !== null ? maxDist : (t.length > 7 ? 2 : (t.length > 3 ? 1 : 0));
  if (Math.abs(g.length - t.length) <= allowedDist) {
    if (levenshteinDistance(g, t) <= allowedDist) return true;
  }
  return false;
}

// Comprehensive Curated Pool of 250+ 100% Authentic Original Works & Hits
const CURATED_HITS = [
  // ==========================================
  // --- CINÉMA & FILMS CULTES (ORIGINAL OST) ---
  // ==========================================
  {
    title: "Star Wars (Main Title)",
    artist: "John Williams",
    category: "cinema",
    mediaTitle: "Star Wars",
    mediaTitleFr: "Star Wars",
    year: 1977,
    aliases: ["star wars", "guerre des etoiles", "la guerre des etoiles", "starwars", "vador", "darth vader", "luke skywalker", "jedi", "main title"],
    search: "john williams star wars main title london symphony orchestra"
  },
  {
    title: "The Imperial March",
    artist: "John Williams",
    category: "cinema",
    mediaTitle: "Star Wars",
    mediaTitleFr: "Star Wars",
    year: 1980,
    aliases: ["star wars", "guerre des etoiles", "marche imperiale", "imperial march", "darth vader", "vador"],
    search: "john williams the imperial march darth vader"
  },
  {
    title: "Hedwig's Theme",
    artist: "John Williams",
    category: "cinema",
    mediaTitle: "Harry Potter",
    mediaTitleFr: "Harry Potter",
    year: 2001,
    aliases: ["harry potter", "harry potter a lecole des sorciers", "poudlard", "hogwarts", "hedwig", "hedwigs theme", "hp"],
    search: "john williams hedwigs theme harry potter"
  },
  {
    title: "He's a Pirate",
    artist: "Klaus Badelt & Hans Zimmer",
    category: "cinema",
    mediaTitle: "Pirates of the Caribbean",
    mediaTitleFr: "Pirates des Caraïbes",
    year: 2003,
    aliases: ["pirates des caraibes", "pirates of the caribbean", "jack sparrow", "black pearl", "hes a pirate"],
    search: "klaus badelt hes a pirate pirates of the caribbean"
  },
  {
    title: "My Heart Will Go On",
    artist: "Céline Dion",
    category: "cinema",
    mediaTitle: "Titanic",
    mediaTitleFr: "Titanic",
    year: 1997,
    aliases: ["titanic", "celine dion titanic", "my heart will go on", "jack et rose", "rose", "jack dawson"],
    search: "celine dion my heart will go on titanic"
  },
  {
    title: "Circle of Life",
    artist: "Elton John",
    category: "cinema",
    mediaTitle: "The Lion King",
    mediaTitleFr: "Le Roi Lion",
    year: 1994,
    aliases: ["le roi lion", "the lion king", "roi lion", "circle of life", "histoire de la vie", "simba", "mufasa"],
    search: "elton john circle of life lion king"
  },
  {
    title: "Hakuna Matata",
    artist: "Elton John & Timon Pumbaa",
    category: "cinema",
    mediaTitle: "The Lion King",
    mediaTitleFr: "Le Roi Lion",
    year: 1994,
    aliases: ["le roi lion", "the lion king", "roi lion", "hakuna matata", "timon et pumbaa", "timon", "pumbaa"],
    search: "lion king hakuna matata"
  },
  {
    title: "Theme from Jurassic Park",
    artist: "John Williams",
    category: "cinema",
    mediaTitle: "Jurassic Park",
    mediaTitleFr: "Jurassic Park",
    year: 1993,
    aliases: ["jurassic park", "jurassic world", "dinosaure", "john williams jurassic park"],
    search: "john williams theme from jurassic park"
  },
  {
    title: "Cornfield Chase",
    artist: "Hans Zimmer",
    category: "cinema",
    mediaTitle: "Interstellar",
    mediaTitleFr: "Interstellar",
    year: 2014,
    aliases: ["interstellar", "cornfield chase", "hans zimmer interstellar", "cooper"],
    search: "hans zimmer cornfield chase interstellar"
  },
  {
    title: "Now We Are Free",
    artist: "Hans Zimmer & Lisa Gerrard",
    category: "cinema",
    mediaTitle: "Gladiator",
    mediaTitleFr: "Gladiator",
    year: 2000,
    aliases: ["gladiator", "maximus", "now we are free", "hans zimmer gladiator"],
    search: "hans zimmer now we are free gladiator"
  },
  {
    title: "Time",
    artist: "Hans Zimmer",
    category: "cinema",
    mediaTitle: "Inception",
    mediaTitleFr: "Inception",
    year: 2010,
    aliases: ["inception", "time hans zimmer", "christopher nolan inception"],
    search: "hans zimmer time inception soundtrack"
  },
  {
    title: "The Fellowship of the Ring (Main Theme)",
    artist: "Howard Shore",
    category: "cinema",
    mediaTitle: "The Lord of the Rings",
    mediaTitleFr: "Le Seigneur des Anneaux",
    year: 2001,
    aliases: ["le seigneur des anneaux", "seigneur des anneaux", "lord of the rings", "lotr", "la communaute de lanneau", "frodon", "hobbit", "howard shore"],
    search: "howard shore the fellowship of the ring lord of the rings"
  },
  {
    title: "James Bond Theme",
    artist: "John Barry & Monty Norman",
    category: "cinema",
    mediaTitle: "James Bond",
    mediaTitleFr: "James Bond 007",
    year: 1962,
    aliases: ["james bond", "james bond 007", "007", "agent 007", "dr no", "skyfall"],
    search: "john barry orchestra james bond theme"
  },
  {
    title: "Misirlou",
    artist: "Dick Dale & His Del-Tones",
    category: "cinema",
    mediaTitle: "Pulp Fiction",
    mediaTitleFr: "Pulp Fiction",
    year: 1994,
    aliases: ["pulp fiction", "tarantino", "quentin tarantino", "misirlou", "dick dale"],
    search: "dick dale misirlou pulp fiction"
  },
  {
    title: "Mission: Impossible Theme",
    artist: "Lalo Schifrin",
    category: "cinema",
    mediaTitle: "Mission Impossible",
    mediaTitleFr: "Mission Impossible",
    year: 1996,
    aliases: ["mission impossible", "mission impossible theme", "ethan hunt", "tom cruise"],
    search: "lalo schifrin mission impossible theme original"
  },
  {
    title: "Let It Go",
    artist: "Idina Menzel",
    category: "cinema",
    mediaTitle: "Frozen",
    mediaTitleFr: "La Reine des Neiges",
    year: 2013,
    aliases: ["la reine des neiges", "reine des neiges", "frozen", "liberee delivree", "let it go", "elsa"],
    search: "idina menzel let it go frozen soundtrack"
  },
  {
    title: "Libérée, Délivrée",
    artist: "Anaïs Delva",
    category: "cinema",
    mediaTitle: "Frozen",
    mediaTitleFr: "La Reine des Neiges",
    year: 2013,
    aliases: ["la reine des neiges", "reine des neiges", "frozen", "liberee delivree", "let it go", "elsa"],
    search: "anais delva liberee delivree reine des neiges"
  },
  {
    title: "Gonna Fly Now (Theme from Rocky)",
    artist: "Bill Conti",
    category: "cinema",
    mediaTitle: "Rocky",
    mediaTitleFr: "Rocky",
    year: 1976,
    aliases: ["rocky", "rocky balboa", "gonna fly now", "bill conti rocky"],
    search: "bill conti gonna fly now rocky soundtrack"
  },
  {
    title: "Raiders March",
    artist: "John Williams",
    category: "cinema",
    mediaTitle: "Indiana Jones",
    mediaTitleFr: "Indiana Jones",
    year: 1981,
    aliases: ["indiana jones", "raiders march", "les aventuriers de larche perdue", "harrison ford"],
    search: "john williams raiders march indiana jones"
  },
  {
    title: "Back to the Future (Main Theme)",
    artist: "Alan Silvestri",
    category: "cinema",
    mediaTitle: "Back to the Future",
    mediaTitleFr: "Retour vers le Futur",
    year: 1985,
    aliases: ["retour vers le futur", "back to the future", "marty mcfly", "delorean", "doc brown"],
    search: "alan silvestri back to the future main theme"
  },
  {
    title: "All Star",
    artist: "Smash Mouth",
    category: "cinema",
    mediaTitle: "Shrek",
    mediaTitleFr: "Shrek",
    year: 2001,
    aliases: ["shrek", "all star", "smash mouth all star", "ogre", "l ane"],
    search: "smash mouth all star shrek"
  },
  {
    title: "Clubbed to Death",
    artist: "Rob Dougan",
    category: "cinema",
    mediaTitle: "The Matrix",
    mediaTitleFr: "Matrix",
    year: 1999,
    aliases: ["matrix", "the matrix", "neo", "morpheus", "clubbed to death", "rob dougan"],
    search: "rob dougan clubbed to death matrix soundtrack"
  },
  {
    title: "The Pink Panther Theme",
    artist: "Henry Mancini",
    category: "cinema",
    mediaTitle: "The Pink Panther",
    mediaTitleFr: "La Panthère Rose",
    year: 1963,
    aliases: ["la panthere rose", "panthere rose", "the pink panther", "henry mancini"],
    search: "henry mancini the pink panther theme"
  },
  {
    title: "Ghostbusters",
    artist: "Ray Parker Jr.",
    category: "cinema",
    mediaTitle: "Ghostbusters",
    mediaTitleFr: "SOS Fantômes",
    year: 1984,
    aliases: ["sos fantomes", "ghostbusters", "fantomes", "ray parker jr"],
    search: "ray parker jr ghostbusters"
  },

  // ==========================================
  // --- SÉRIES TV CULTES (ORIGINAL OST) ---
  // ==========================================
  {
    title: "Main Title (Game of Thrones)",
    artist: "Ramin Djawadi",
    category: "series",
    mediaTitle: "Game of Thrones",
    mediaTitleFr: "Game of Thrones",
    year: 2011,
    aliases: ["game of thrones", "got", "le trone de fer", "trone de fer", "westeros", "ramin djawadi"],
    search: "ramin djawadi game of thrones main title"
  },
  {
    title: "Stranger Things Theme",
    artist: "Kyle Dixon & Michael Stein",
    category: "series",
    mediaTitle: "Stranger Things",
    mediaTitleFr: "Stranger Things",
    year: 2016,
    aliases: ["stranger things", "upside down", "eleven", "demogorgon", "kyle dixon"],
    search: "kyle dixon michael stein stranger things main theme"
  },
  {
    title: "I'll Be There for You",
    artist: "The Rembrandts",
    category: "series",
    mediaTitle: "Friends",
    mediaTitleFr: "Friends",
    year: 1994,
    aliases: ["friends", "serie friends", "central perk", "chandler", "joey", "rachel", "monica", "ross", "ill be there for you"],
    search: "the rembrandts ill be there for you friends"
  },
  {
    title: "The Simpsons Theme",
    artist: "Danny Elfman",
    category: "series",
    mediaTitle: "The Simpsons",
    mediaTitleFr: "Les Simpson",
    year: 1989,
    aliases: ["les simpson", "simpson", "the simpsons", "homer simpson", "bart simpson", "danny elfman"],
    search: "danny elfman the simpsons theme original"
  },
  {
    title: "Red Right Hand",
    artist: "Nick Cave & The Bad Seeds",
    category: "series",
    mediaTitle: "Peaky Blinders",
    mediaTitleFr: "Peaky Blinders",
    year: 1994,
    aliases: ["peaky blinders", "thomas shelby", "shelby", "red right hand", "nick cave"],
    search: "nick cave and the bad seeds red right hand peaky blinders"
  },
  {
    title: "Bella Ciao",
    artist: "Manu Pilas",
    category: "series",
    mediaTitle: "Money Heist",
    mediaTitleFr: "La Casa de Papel",
    year: 2017,
    aliases: ["la casa de papel", "casa de papel", "money heist", "el profesor", "tokyo", "bella ciao"],
    search: "manu pilas bella ciao la casa de papel"
  },
  {
    title: "Attrapez-les tous !",
    artist: "Jean-Marc Anthony Kabeya",
    category: "series",
    mediaTitle: "Pokemon",
    mediaTitleFr: "Pokémon",
    year: 1999,
    aliases: ["pokemon", "pokemon generique", "attrapez les tous", "pikachu", "sacha", "pokeball"],
    search: "jean marc anthony kabeya attrapez les tous pokemon"
  },
  {
    title: "Boss of Me",
    artist: "They Might Be Giants",
    category: "series",
    mediaTitle: "Malcolm in the Middle",
    mediaTitleFr: "Malcolm",
    year: 2000,
    aliases: ["malcolm", "malcolm in the middle", "boss of me", "dewey", "reese", "hal"],
    search: "they might be giants boss of me malcolm"
  },
  {
    title: "The X-Files Theme",
    artist: "Mark Snow",
    category: "series",
    mediaTitle: "The X-Files",
    mediaTitleFr: "X-Files",
    year: 1993,
    aliases: ["x files", "the x files", "x-files", "aux frontieres du reel", "mulder", "scully", "mark snow"],
    search: "mark snow the x files theme"
  },
  {
    title: "The Office Theme",
    artist: "The Scrantones",
    category: "series",
    mediaTitle: "The Office",
    mediaTitleFr: "The Office",
    year: 2005,
    aliases: ["the office", "michael scott", "dunder mifflin", "jim halpert", "dwight schrute"],
    search: "the scrantones the office theme"
  },
  {
    title: "Kaamelott (Thème Principal)",
    artist: "Alexandre Astier",
    category: "series",
    mediaTitle: "Kaamelott",
    mediaTitleFr: "Kaamelott",
    year: 2005,
    aliases: ["kaamelott", "roi arthur", "alexandre astier", "perceval", "karadoc"],
    search: "alexandre astier kaamelott ouverture"
  },
  {
    title: "Breaking Bad (Main Title Theme)",
    artist: "Dave Porter",
    category: "series",
    mediaTitle: "Breaking Bad",
    mediaTitleFr: "Breaking Bad",
    year: 2008,
    aliases: ["breaking bad", "walter white", "heisenberg", "jesse pinkman", "dave porter"],
    search: "dave porter breaking bad main title theme"
  },
  {
    title: "The Walking Dead (Main Title Theme)",
    artist: "Bear McCreary",
    category: "series",
    mediaTitle: "The Walking Dead",
    mediaTitleFr: "The Walking Dead",
    year: 2010,
    aliases: ["the walking dead", "walking dead", "twd", "rick grimes", "bear mccreary"],
    search: "bear mccreary the walking dead main title theme"
  },

  // ==========================================
  // --- ANIMÉS JAPONAIS (ORIGINAL OPENINGS) ---
  // ==========================================
  {
    title: "A Cruel Angel's Thesis",
    artist: "Yoko Takahashi",
    category: "anime",
    mediaTitle: "Neon Genesis Evangelion",
    mediaTitleFr: "Evangelion",
    year: 1995,
    aliases: ["evangelion", "eva", "neon genesis evangelion", "a cruel angels thesis", "shinji", "zankoku na tenshi no teeze", "yoko takahashi"],
    search: "yoko takahashi a cruel angels thesis evangelion"
  },
  {
    title: "Guren no Yumiya",
    artist: "Linked Horizon",
    category: "anime",
    mediaTitle: "Attack on Titan",
    mediaTitleFr: "L'Attaque des Titans",
    year: 2013,
    aliases: ["lattaque des titans", "attaque des titans", "snk", "shingeki no kyojin", "shingeki", "attack on titan", "eren", "guren no yumiya", "linked horizon"],
    search: "linked horizon guren no yumiya attack on titan"
  },
  {
    title: "Blue Bird",
    artist: "Ikimonogakari",
    category: "anime",
    mediaTitle: "Naruto Shippuden",
    mediaTitleFr: "Naruto",
    year: 2008,
    aliases: ["naruto", "naruto shippuden", "blue bird", "ikimonogakari", "sasuke", "konoha", "opening naruto"],
    search: "ikimonogakari blue bird naruto shippuden"
  },
  {
    title: "Silhouette",
    artist: "KANA-BOON",
    category: "anime",
    mediaTitle: "Naruto Shippuden",
    mediaTitleFr: "Naruto",
    year: 2014,
    aliases: ["naruto", "naruto shippuden", "silhouette", "kana boon", "sasuke", "madara"],
    search: "kana boon silhouette naruto shippuden"
  },
  {
    title: "Cha-La Head-Cha-La",
    artist: "Hironobu Kageyama",
    category: "anime",
    mediaTitle: "Dragon Ball Z",
    mediaTitleFr: "DBZ",
    year: 1989,
    aliases: ["dragon ball z", "dbz", "dragon ball", "chala head chala", "goku", "songoku", "vegeta", "kamehameha"],
    search: "hironobu kageyama cha la head cha la dragon ball z"
  },
  {
    title: "We Are!",
    artist: "Hiroshi Kitadani",
    category: "anime",
    mediaTitle: "One Piece",
    mediaTitleFr: "One Piece",
    year: 1999,
    aliases: ["one piece", "luffy", "mugiwara", "we are", "zoro", "hiroshi kitadani", "chapeau de paille"],
    search: "hiroshi kitadani we are one piece opening"
  },
  {
    title: "Gurenge",
    artist: "LiSA",
    category: "anime",
    mediaTitle: "Demon Slayer",
    mediaTitleFr: "Kimetsu no Yaiba",
    year: 2019,
    aliases: ["demon slayer", "kimetsu no yaiba", "kimetsu", "gurenge", "tanjiro", "nezuko", "lisa gurenge"],
    search: "lisa gurenge demon slayer"
  },
  {
    title: "The World",
    artist: "NIGHTMARE",
    category: "anime",
    mediaTitle: "Death Note",
    mediaTitleFr: "Death Note",
    year: 2006,
    aliases: ["death note", "light yagami", "kira", "ryuk", "the world nightmare"],
    search: "nightmare the world death note opening"
  },
  {
    title: "Unravel",
    artist: "TK from Ling Tosite Sigure",
    category: "anime",
    mediaTitle: "Tokyo Ghoul",
    mediaTitleFr: "Tokyo Ghoul",
    year: 2014,
    aliases: ["tokyo ghoul", "kaneki", "kaneki ken", "unravel", "tk from ling tosite sigure"],
    search: "tk from ling tosite sigure unravel tokyo ghoul"
  },
  {
    title: "Kaikai Kitan",
    artist: "Eve",
    category: "anime",
    mediaTitle: "Jujutsu Kaisen",
    mediaTitleFr: "Jujutsu Kaisen",
    year: 2020,
    aliases: ["jujutsu kaisen", "jjk", "itadori", "gojo", "gojo satoru", "sukuna", "kaikai kitan", "eve"],
    search: "eve kaikai kitan jujutsu kaisen"
  },
  {
    title: "KICK BACK",
    artist: "Kenshi Yonezu",
    category: "anime",
    mediaTitle: "Chainsaw Man",
    mediaTitleFr: "Chainsaw Man",
    year: 2022,
    aliases: ["chainsaw man", "denji", "makima", "power", "kick back", "kenshi yonezu"],
    search: "kenshi yonezu kick back chainsaw man"
  },
  {
    title: "Tank!",
    artist: "The Seatbelts",
    category: "anime",
    mediaTitle: "Cowboy Bebop",
    mediaTitleFr: "Cowboy Bebop",
    year: 1998,
    aliases: ["cowboy bebop", "spike spiegel", "tank", "yoko kanno", "the seatbelts"],
    search: "the seatbelts tank cowboy bebop"
  },
  {
    title: "The Day",
    artist: "Porno Graffitti",
    category: "anime",
    mediaTitle: "My Hero Academia",
    mediaTitleFr: "My Hero Academia",
    year: 2016,
    aliases: ["my hero academia", "mha", "boku no hero academia", "deku", "all might", "the day"],
    search: "porno graffitti the day my hero academia"
  },
  {
    title: "Melissa",
    artist: "Porno Graffitti",
    category: "anime",
    mediaTitle: "Fullmetal Alchemist",
    mediaTitleFr: "Fullmetal Alchemist",
    year: 2003,
    aliases: ["fullmetal alchemist", "fma", "edward elric", "alchemist", "melissa"],
    search: "porno graffitti melissa fullmetal alchemist"
  },

  // ==========================================
  // --- JEUX VIDÉO CULTES (ORIGINAL OST) ---
  // ==========================================
  {
    title: "Super Mario Bros. Theme (Ground Theme)",
    artist: "Koji Kondo",
    category: "gaming",
    mediaTitle: "Super Mario",
    mediaTitleFr: "Super Mario Bros",
    year: 1985,
    aliases: ["super mario", "mario", "mario bros", "super mario bros", "super mario bross", "nintendo", "koji kondo", "overworld", "ground theme", "mario 64"],
    search: "super mario bros theme koji kondo nintendo original"
  },
  {
    title: "The Legend of Zelda Main Theme",
    artist: "Koji Kondo",
    category: "gaming",
    mediaTitle: "The Legend of Zelda",
    mediaTitleFr: "Zelda",
    year: 1986,
    aliases: ["zelda", "the legend of zelda", "legend of zelda", "link", "triforce", "ocarina of time", "breath of the wild", "koji kondo"],
    search: "koji kondo the legend of zelda main theme original"
  },
  {
    title: "Sweden",
    artist: "C418",
    category: "gaming",
    mediaTitle: "Minecraft",
    mediaTitleFr: "Minecraft",
    year: 2011,
    aliases: ["minecraft", "c418", "sweden", "steve", "creeper", "mojang"],
    search: "c418 sweden minecraft volume alpha"
  },
  {
    title: "Wet Hands",
    artist: "C418",
    category: "gaming",
    mediaTitle: "Minecraft",
    mediaTitleFr: "Minecraft",
    year: 2011,
    aliases: ["minecraft", "c418", "wet hands", "steve", "creeper", "mojang"],
    search: "c418 wet hands minecraft volume alpha"
  },
  {
    title: "Megalovania",
    artist: "Toby Fox",
    category: "gaming",
    mediaTitle: "Undertale",
    mediaTitleFr: "Undertale",
    year: 2015,
    aliases: ["undertale", "sans", "sans undertale", "megalovania", "toby fox"],
    search: "toby fox megalovania undertale soundtrack"
  },
  {
    title: "Dragonborn (Skyrim Theme)",
    artist: "Jeremy Soule",
    category: "gaming",
    mediaTitle: "The Elder Scrolls V: Skyrim",
    mediaTitleFr: "Skyrim",
    year: 2011,
    aliases: ["skyrim", "the elder scrolls", "elder scrolls", "dragonborn", "fus ro dah", "jeremy soule", "dovahkiin"],
    search: "jeremy soule dragonborn skyrim soundtrack"
  },
  {
    title: "Tetris Theme (Korobeiniki)",
    artist: "Hirokazu Tanaka",
    category: "gaming",
    mediaTitle: "Tetris",
    mediaTitleFr: "Tetris",
    year: 1989,
    aliases: ["tetris", "korobeiniki", "tetris theme", "game boy tetris", "nintendo tetris"],
    search: "tetris theme korobeiniki hirokazu tanaka original"
  },
  {
    title: "Halo Theme",
    artist: "Martin O'Donnell & Michael Salvatori",
    category: "gaming",
    mediaTitle: "Halo",
    mediaTitleFr: "Halo",
    year: 2001,
    aliases: ["halo", "master chief", "halo combat evolved", "halo main theme", "martin odonnell"],
    search: "martin odonnell halo theme original soundtrack"
  },
  {
    title: "Legends Never Die",
    artist: "League of Legends & Against The Current",
    category: "gaming",
    mediaTitle: "League of Legends",
    mediaTitleFr: "LoL",
    year: 2017,
    aliases: ["league of legends", "lol", "riot games", "legends never die", "against the current", "worlds"],
    search: "league of legends legends never die against the current"
  },
  {
    title: "Enemy",
    artist: "Imagine Dragons & League of Legends",
    category: "gaming",
    mediaTitle: "Arcane",
    mediaTitleFr: "Arcane (League of Legends)",
    year: 2021,
    aliases: ["arcane", "league of legends", "lol", "jinx", "vi", "imagine dragons enemy arcane"],
    search: "imagine dragons enemy arcane league of legends"
  },
  {
    title: "Still Alive",
    artist: "Ellen McLain & Jonathan Coulton",
    category: "gaming",
    mediaTitle: "Portal",
    mediaTitleFr: "Portal",
    year: 2007,
    aliases: ["portal", "portal 2", "glados", "still alive", "valve", "the cake is a lie"],
    search: "ellen mclain still alive portal soundtrack jonathan coulton"
  },
  {
    title: "Toss a Coin to Your Witcher",
    artist: "Sonya Belousova & Joey Batey",
    category: "gaming",
    mediaTitle: "The Witcher",
    mediaTitleFr: "The Witcher",
    year: 2019,
    aliases: ["the witcher", "witcher", "geralt", "geralt de riv", "jaskier", "toss a coin to your witcher"],
    search: "toss a coin to your witcher sonya belousova joey batey"
  },
  {
    title: "San Andreas Theme Song",
    artist: "Michael Hunter",
    category: "gaming",
    mediaTitle: "GTA San Andreas",
    mediaTitleFr: "GTA",
    year: 2004,
    aliases: ["gta", "grand theft auto", "gta san andreas", "san andreas", "cj", "carl johnson", "rockstar games"],
    search: "michael hunter theme from san andreas gta"
  },
  {
    title: "Last Surprise",
    artist: "Shoji Meguro & Lyn",
    category: "gaming",
    mediaTitle: "Persona 5",
    mediaTitleFr: "Persona 5",
    year: 2016,
    aliases: ["persona 5", "persona", "joker", "last surprise", "shoji meguro", "lyn"],
    search: "shoji meguro last surprise persona 5"
  },
  {
    title: "I Really Want to Stay at Your House",
    artist: "Rosa Walton & Hallie Coggins",
    category: "gaming",
    mediaTitle: "Cyberpunk 2077",
    mediaTitleFr: "Cyberpunk 2077 / Edgerunners",
    year: 2020,
    aliases: ["cyberpunk", "cyberpunk 2077", "edgerunners", "david martinez", "lucy", "i really want to stay at your house"],
    search: "rosa walton i really want to stay at your house cyberpunk 2077"
  },
  {
    title: "Green Hill Zone",
    artist: "Masato Nakamura",
    category: "gaming",
    mediaTitle: "Sonic the Hedgehog",
    mediaTitleFr: "Sonic",
    year: 1991,
    aliases: ["sonic", "sonic the hedgehog", "green hill zone", "sega", "masato nakamura"],
    search: "masato nakamura green hill zone sonic the hedgehog original"
  },
  {
    title: "Wii Sports Theme",
    artist: "Kazumi Totaka",
    category: "gaming",
    mediaTitle: "Wii Sports",
    mediaTitleFr: "Wii Sports",
    year: 2006,
    aliases: ["wii sports", "wii", "nintendo wii", "wii sports theme", "kazumi totaka"],
    search: "wii sports theme kazumi totaka nintendo"
  },
  {
    title: "Guile's Theme",
    artist: "Yoko Shimomura",
    category: "gaming",
    mediaTitle: "Street Fighter II",
    mediaTitleFr: "Street Fighter",
    year: 1991,
    aliases: ["street fighter", "street fighter 2", "guile", "guiles theme", "capcom"],
    search: "yoko shimomura guile theme street fighter ii original"
  },

  // ==========================================
  // --- POP INTERNATIONALE & HITS DU MOMENT ---
  // ==========================================
  { title: "Get Lucky", artist: "Daft Punk & Pharrell Williams", category: "pop", year: 2013, search: "daft punk get lucky feat pharrell williams" },
  { title: "Blinding Lights", artist: "The Weeknd", category: "pop", year: 2020, search: "the weeknd blinding lights" },
  { title: "Starboy", artist: "The Weeknd & Daft Punk", category: "pop", year: 2016, search: "the weeknd starboy daft punk" },
  { title: "Can't Feel My Face", artist: "The Weeknd", category: "pop", year: 2015, search: "the weeknd cant feel my face" },
  { title: "Billie Jean", artist: "Michael Jackson", category: "pop", year: 1982, search: "michael jackson billie jean original master" },
  { title: "Thriller", artist: "Michael Jackson", category: "pop", year: 1982, search: "michael jackson thriller original master" },
  { title: "Beat It", artist: "Michael Jackson", category: "pop", year: 1982, search: "michael jackson beat it original master" },
  { title: "Shape of You", artist: "Ed Sheeran", category: "pop", year: 2017, search: "ed sheeran shape of you" },
  { title: "Bad Habits", artist: "Ed Sheeran", category: "pop", year: 2021, search: "ed sheeran bad habits" },
  { title: "Uptown Funk", artist: "Mark Ronson & Bruno Mars", category: "pop", year: 2014, search: "mark ronson uptown funk bruno mars" },
  { title: "24K Magic", artist: "Bruno Mars", category: "pop", year: 2016, search: "bruno mars 24k magic" },
  { title: "Locked Out of Heaven", artist: "Bruno Mars", category: "pop", year: 2012, search: "bruno mars locked out of heaven" },
  { title: "Bad Guy", artist: "Billie Eilish", category: "pop", year: 2019, search: "billie eilish bad guy" },
  { title: "As It Was", artist: "Harry Styles", category: "pop", year: 2022, search: "harry styles as it was" },
  { title: "Watermelon Sugar", artist: "Harry Styles", category: "pop", year: 2019, search: "harry styles watermelon sugar" },
  { title: "Rolling in the Deep", artist: "Adele", category: "pop", year: 2010, search: "adele rolling in the deep" },
  { title: "Someone Like You", artist: "Adele", category: "pop", year: 2011, search: "adele someone like you" },
  { title: "Levitating", artist: "Dua Lipa", category: "pop", year: 2020, search: "dua lipa levitating" },
  { title: "Don't Start Now", artist: "Dua Lipa", category: "pop", year: 2019, search: "dua lipa dont start now" },
  { title: "Poker Face", artist: "Lady Gaga", category: "pop", year: 2008, search: "lady gaga poker face" },
  { title: "Bad Romance", artist: "Lady Gaga", category: "pop", year: 2009, search: "lady gaga bad romance" },
  { title: "Counting Stars", artist: "OneRepublic", category: "pop", year: 2013, search: "onerepublic counting stars" },
  { title: "Believer", artist: "Imagine Dragons", category: "pop", year: 2017, search: "imagine dragons believer" },
  { title: "Radioactive", artist: "Imagine Dragons", category: "pop", year: 2012, search: "imagine dragons radioactive" },
  { title: "Can't Stop the Feeling!", artist: "Justin Timberlake", category: "pop", year: 2016, search: "justin timberlake cant stop the feeling" },
  { title: "Stay", artist: "The Kid LAROI & Justin Bieber", category: "pop", year: 2021, search: "the kid laroi justin bieber stay" },
  { title: "Sorry", artist: "Justin Bieber", category: "pop", year: 2015, search: "justin bieber sorry" },
  { title: "Firework", artist: "Katy Perry", category: "pop", year: 2010, search: "katy perry firework" },
  { title: "Roar", artist: "Katy Perry", category: "pop", year: 2013, search: "katy perry roar" },
  { title: "Diamonds", artist: "Rihanna", category: "pop", year: 2012, search: "rihanna diamonds" },
  { title: "Umbrella", artist: "Rihanna & JAY-Z", category: "pop", year: 2007, search: "rihanna umbrella jay z" },
  { title: "Chandelier", artist: "Sia", category: "pop", year: 2014, search: "sia chandelier" },
  { title: "Sugar", artist: "Maroon 5", category: "pop", year: 2014, search: "maroon 5 sugar" },
  { title: "Happy", artist: "Pharrell Williams", category: "pop", year: 2013, search: "pharrell williams happy" },
  { title: "Viva La Vida", artist: "Coldplay", category: "pop", year: 2008, search: "coldplay viva la vida" },
  { title: "Waka Waka", artist: "Shakira", category: "pop", year: 2010, search: "shakira waka waka this time for africa" },
  { title: "Hips Don't Lie", artist: "Shakira & Wyclef Jean", category: "pop", year: 2005, search: "shakira hips dont lie" },
  { title: "Shake It Off", artist: "Taylor Swift", category: "pop", year: 2014, search: "taylor swift shake it off" },
  { title: "Blank Space", artist: "Taylor Swift", category: "pop", year: 2014, search: "taylor swift blank space" },
  { title: "Flowers", artist: "Miley Cyrus", category: "pop", year: 2023, search: "miley cyrus flowers" },
  { title: "Señorita", artist: "Shawn Mendes & Camila Cabello", category: "pop", year: 2019, search: "shawn mendes camila cabello senorita" },
  { title: "Circles", artist: "Post Malone", category: "pop", year: 2019, search: "post malone circles" },
  { title: "Sunflower", artist: "Post Malone & Swae Lee", category: "pop", year: 2018, search: "post malone swae lee sunflower" },
  { title: "Heat Waves", artist: "Glass Animals", category: "pop", year: 2020, search: "glass animals heat waves" },
  { title: "Unholy", artist: "Sam Smith & Kim Petras", category: "pop", year: 2022, search: "sam smith kim petras unholy" },

  // ==========================================
  // --- RAP FRANÇAIS & URBAIN ---
  // ==========================================
  { title: "Au DD", artist: "PNL", category: "rap_fr", year: 2019, search: "pnl au dd deux freres" },
  { title: "Deux Frères", artist: "PNL", category: "rap_fr", year: 2019, search: "pnl deux freres" },
  { title: "Da", artist: "PNL", category: "rap_fr", year: 2016, search: "pnl da dans la legende" },
  { title: "Onizuka", artist: "PNL", category: "rap_fr", year: 2016, search: "pnl onizuka dans la legende" },
  { title: "Bande Organisée", artist: "Jul, SCH, Kofs, Naps, Soso Maness", category: "rap_fr", year: 2020, search: "13 organise bande organisee" },
  { title: "Tchikita", artist: "Jul", category: "rap_fr", year: 2016, search: "jul tchikita" },
  { title: "On m'appelle l'ovni", artist: "Jul", category: "rap_fr", year: 2016, search: "jul on mappelle lovni" },
  { title: "JCVD", artist: "Jul", category: "rap_fr", year: 2019, search: "jul jcvd rien 100 rien" },
  { title: "Sousou", artist: "Jul", category: "rap_fr", year: 2020, search: "jul sousou la machine" },
  { title: "Basique", artist: "Orelsan", category: "rap_fr", year: 2017, search: "orelsan basique la fete est finie" },
  { title: "La Quête", artist: "Orelsan", category: "rap_fr", year: 2021, search: "orelsan la quete civilisation" },
  { title: "Jour meilleur", artist: "Orelsan", category: "rap_fr", year: 2021, search: "orelsan jour meilleur civilisation" },
  { title: "Lettre à une femme", artist: "Ninho", category: "rap_fr", year: 2020, search: "ninho lettre a une femme" },
  { title: "Jefe", artist: "Ninho", category: "rap_fr", year: 2021, search: "ninho jefe" },
  { title: "Tout va bien", artist: "Orelsan", category: "rap_fr", year: 2017, search: "orelsan tout va bien" },
  { title: "Goutte d'eau", artist: "Ninho", category: "rap_fr", year: 2019, search: "ninho goutte deau destins" },
  { title: "Die", artist: "Gazo", category: "rap_fr", year: 2022, search: "gazo die kmt" },
  { title: "Drill FR 4", artist: "Gazo & Freeze Corleone", category: "rap_fr", year: 2020, search: "gazo drill fr 4 freeze corleone" },
  { title: "DKR", artist: "Booba", category: "rap_fr", year: 2016, search: "booba dkr trone" },
  { title: "92i Veyron", artist: "Booba", category: "rap_fr", year: 2015, search: "booba 92i veyron nero nemesis" },
  { title: "Mona Lisa", artist: "Booba & JSX", category: "rap_fr", year: 2021, search: "booba mona lisa ultra" },
  { title: "Macarena", artist: "Damso", category: "rap_fr", year: 2017, search: "damso macarena ipseite" },
  { title: "Smog", artist: "Damso", category: "rap_fr", year: 2018, search: "damso smog lithopedion" },
  { title: "Morose", artist: "Damso", category: "rap_fr", year: 2021, search: "damso morose qalf" },
  { title: "Petrouchka", artist: "Soso Maness & PLK", category: "rap_fr", year: 2021, search: "soso maness petrouchka plk" },
  { title: "Demain", artist: "PLK", category: "rap_fr", year: 2023, search: "plk demain 2069" },
  { title: "Pilote", artist: "PLK & Hamza", category: "rap_fr", year: 2020, search: "plk pilote hamza enna" },
  { title: "Balader", artist: "Soolking & Niska", category: "rap_fr", year: 2022, search: "soolking niska balader sans visa" },
  { title: "Médicament", artist: "Niska & Booba", category: "rap_fr", year: 2019, search: "niska medicament booba mr sal" },
  { title: "Booska Charo", artist: "Niska", category: "rap_fr", year: 2015, search: "niska booska charo" },
  { title: "Fade Up", artist: "Zeg P, Hamza & SCH", category: "rap_fr", year: 2022, search: "zeg p fade up hamza sch" },
  { title: "Autobahn", artist: "SCH", category: "rap_fr", year: 2022, search: "sch autobahn" },
  { title: "Papaoutai", artist: "Stromae", category: "rap_fr", year: 2013, search: "stromae papaoutai racine carree" },
  { title: "Alors on danse", artist: "Stromae", category: "rap_fr", year: 2009, search: "stromae alors on danse cheese" },
  { title: "Tous les mêmes", artist: "Stromae", category: "rap_fr", year: 2013, search: "stromae tous les memes" },
  { title: "Djadja", artist: "Aya Nakamura", category: "rap_fr", year: 2018, search: "aya nakamura djadja nakamura" },
  { title: "Pookie", artist: "Aya Nakamura", category: "rap_fr", year: 2018, search: "aya nakamura pookie nakamura" },
  { title: "Bella", artist: "Gims", category: "rap_fr", year: 2013, search: "gims bella subliminal" },
  { title: "Sapés comme jamais", artist: "Gims & Niska", category: "rap_fr", year: 2015, search: "gims sapes comme jamais niska" },
  { title: "J'me tire", artist: "Gims", category: "rap_fr", year: 2013, search: "gims jme tire subliminal" },
  { title: "Casanova", artist: "Soolking & Gazo", category: "rap_fr", year: 2023, search: "soolking casanova gazo" },
  { title: "Guérilla", artist: "Soolking", category: "rap_fr", year: 2018, search: "soolking guerilla fruit du demon" },
  { title: "Moulaga", artist: "Heuss L'enfoiré & Jul", category: "rap_fr", year: 2019, search: "heuss lenfoire moulaga jul" },
  { title: "Désaccordé", artist: "Vald", category: "rap_fr", year: 2018, search: "vald desacorde xeu" },
  { title: "Freeze Raël", artist: "Freeze Corleone", category: "rap_fr", year: 2020, search: "freeze corleone freeze rael lmf" },
  { title: "Meuda", artist: "Tiakola", category: "rap_fr", year: 2022, search: "tiakola meuda melo" },
  { title: "Gasolina", artist: "Tiakola & Rsko", category: "rap_fr", year: 2022, search: "tiakola gasolina rsko" },
  { title: "Laboratoire", artist: "Werenoi", category: "rap_fr", year: 2023, search: "werenoi laboratoire carre" },
  { title: "Chemin d'or", artist: "Werenoi", category: "rap_fr", year: 2023, search: "werenoi chemin dor carre" },
  { title: "Bolide allemand", artist: "SDM", category: "rap_fr", year: 2022, search: "sdm bolide allemand liens du 100" },
  { title: "Passat", artist: "SDM & Maes", category: "rap_fr", year: 2022, search: "sdm passat maes" },
  { title: "Tchoin", artist: "Kaaris", category: "rap_fr", year: 2016, search: "kaaris tchoin okou gnakouri" },
  { title: "Trop beau", artist: "Lomepal", category: "rap_fr", year: 2018, search: "lomepal trop beau jeannine" },
  { title: "Yeux disent", artist: "Lomepal", category: "rap_fr", year: 2017, search: "lomepal yeux disent flip" },
  { title: "On verra", artist: "Nekfeu", category: "rap_fr", year: 2015, search: "nekfeu on verra feu" },
  { title: "Désolé", artist: "Sexion d'Assaut", category: "rap_fr", year: 2010, search: "sexion dassaut desole lecole des points vitaux" },
  { title: "Wati By Night", artist: "Sexion d'Assaut", category: "rap_fr", year: 2010, search: "sexion dassaut wati by night" },

  // ==========================================
  // --- ROCK & LÉGENDES ---
  // ==========================================
  { title: "Bohemian Rhapsody", artist: "Queen", category: "rock", year: 1975, search: "queen bohemian rhapsody original master" },
  { title: "Don't Stop Me Now", artist: "Queen", category: "rock", year: 1978, search: "queen dont stop me now original master" },
  { title: "Another One Bites the Dust", artist: "Queen", category: "rock", year: 1980, search: "queen another one bites the dust original master" },
  { title: "Smells Like Teen Spirit", artist: "Nirvana", category: "rock", year: 1991, search: "nirvana smells like teen spirit nevermind" },
  { title: "Come As You Are", artist: "Nirvana", category: "rock", year: 1991, search: "nirvana come as you are nevermind" },
  { title: "In the End", artist: "Linkin Park", category: "rock", year: 2000, search: "linkin park in the end hybrid theory" },
  { title: "Numb", artist: "Linkin Park", category: "rock", year: 2003, search: "linkin park numb meteora" },
  { title: "Highway to Hell", artist: "AC/DC", category: "rock", year: 1979, search: "ac/dc highway to hell original" },
  { title: "Back in Black", artist: "AC/DC", category: "rock", year: 1980, search: "ac/dc back in black original" },
  { title: "Thunderstruck", artist: "AC/DC", category: "rock", year: 1990, search: "ac/dc thunderstruck the razors edge" },
  { title: "Seven Nation Army", artist: "The White Stripes", category: "rock", year: 2003, search: "the white stripes seven nation army" },
  { title: "Sweet Child O' Mine", artist: "Guns N' Roses", category: "rock", year: 1987, search: "guns n roses sweet child o mine appetite for destruction" },
  { title: "Welcome to the Jungle", artist: "Guns N' Roses", category: "rock", year: 1987, search: "guns n roses welcome to the jungle" },
  { title: "Californication", artist: "Red Hot Chili Peppers", category: "rock", year: 1999, search: "red hot chili peppers californication" },
  { title: "Can't Stop", artist: "Red Hot Chili Peppers", category: "rock", year: 2002, search: "red hot chili peppers cant stop by the way" },
  { title: "Zombie", artist: "The Cranberries", category: "rock", year: 1994, search: "the cranberries zombie no need to argue" },
  { title: "Wonderwall", artist: "Oasis", category: "rock", year: 1995, search: "oasis wonderwall whats the story morning glory" },
  { title: "Don't Look Back in Anger", artist: "Oasis", category: "rock", year: 1995, search: "oasis dont look back in anger" },
  { title: "Eye of the Tiger", artist: "Survivor", category: "rock", year: 1982, search: "survivor eye of the tiger" },
  { title: "Livin' on a Prayer", artist: "Bon Jovi", category: "rock", year: 1986, search: "bon jovi livin on a prayer slippery when wet" },
  { title: "Wind of Change", artist: "Scorpions", category: "rock", year: 1990, search: "scorpions wind of change crazy world" },
  { title: "Smoke on the Water", artist: "Deep Purple", category: "rock", year: 1972, search: "deep purple smoke on the water machine head" },
  { title: "Another Brick in the Wall, Pt. 2", artist: "Pink Floyd", category: "rock", year: 1979, search: "pink floyd another brick in the wall pt 2 the wall" },
  { title: "Paint It Black", artist: "The Rolling Stones", category: "rock", year: 1966, search: "the rolling stones paint it black" },
  { title: "Let It Be", artist: "The Beatles", category: "rock", year: 1970, search: "the beatles let it be" },
  { title: "Hey Jude", artist: "The Beatles", category: "rock", year: 1968, search: "the beatles hey jude" },
  { title: "Boulevard of Broken Dreams", artist: "Green Day", category: "rock", year: 2004, search: "green day boulevard of broken dreams american idiot" },
  { title: "American Idiot", artist: "Green Day", category: "rock", year: 2004, search: "green day american idiot" },
  { title: "Uprising", artist: "Muse", category: "rock", year: 2009, search: "muse uprising the resistance" },
  { title: "Starlight", artist: "Muse", category: "rock", year: 2006, search: "muse starlight black holes and revelations" },
  { title: "Creep", artist: "Radiohead", category: "rock", year: 1992, search: "radiohead creep pablo honey" },
  { title: "Mr. Brightside", artist: "The Killers", category: "rock", year: 2004, search: "the killers mr brightside hot fuss" },
  { title: "Do I Wanna Know?", artist: "Arctic Monkeys", category: "rock", year: 2013, search: "arctic monkeys do i wanna know am" },

  // ==========================================
  // --- ANNÉES 80, 90 & VARIÉTÉ ---
  // ==========================================
  { title: "L'Aventurier", artist: "Indochine", category: "annees_80_90", year: 1982, search: "indochine laventurier original 1982" },
  { title: "J'ai demandé à la lune", artist: "Indochine", category: "annees_80_90", year: 2002, search: "indochine jai demande a la lune paradize" },
  { title: "3e sexe", artist: "Indochine", category: "annees_80_90", year: 1985, search: "indochine 3e sexe 3" },
  { title: "J'irai où tu iras", artist: "Céline Dion & Jean-Jacques Goldman", category: "annees_80_90", year: 1995, search: "celine dion jean jacques goldman jirai ou tu iras deux" },
  { title: "Pour que tu m'aimes encore", artist: "Céline Dion", category: "annees_80_90", year: 1995, search: "celine dion pour que tu maimes encore deux" },
  { title: "Les Démons de minuit", artist: "Images", category: "annees_80_90", year: 1986, search: "images les demons de minuit" },
  { title: "Envole-moi", artist: "Jean-Jacques Goldman", category: "annees_80_90", year: 1984, search: "jean jacques goldman envole moi positiv" },
  { title: "Quand la musique est bonne", artist: "Jean-Jacques Goldman", category: "annees_80_90", year: 1982, search: "jean jacques goldman quand la musique est bonne" },
  { title: "Il changeait la vie", artist: "Jean-Jacques Goldman", category: "annees_80_90", year: 1987, search: "jean jacques goldman il changeait la vie entre gris clair et gris fonce" },
  { title: "Tous les cris les SOS", artist: "Daniel Balavoine", category: "annees_80_90", year: 1985, search: "daniel balavoine tous les cris les sos sauve qui peut" },
  { title: "L'Aziza", artist: "Daniel Balavoine", category: "annees_80_90", year: 1985, search: "daniel balavoine laziza sauve qui peut" },
  { title: "Le Chanteur", artist: "Daniel Balavoine", category: "annees_80_90", year: 1978, search: "daniel balavoine le chanteur" },
  { title: "Take On Me", artist: "a-ha", category: "annees_80_90", year: 1985, search: "a-ha take on me hunting high and low" },
  { title: "Never Gonna Give You Up", artist: "Rick Astley", category: "annees_80_90", year: 1987, search: "rick astley never gonna give you up whenever you need somebody" },
  { title: "Africa", artist: "TOTO", category: "annees_80_90", year: 1982, search: "toto africa toto iv" },
  { title: "Hold the Line", artist: "TOTO", category: "annees_80_90", year: 1978, search: "toto hold the line" },
  { title: "Gimme! Gimme! Gimme!", artist: "ABBA", category: "annees_80_90", year: 1979, search: "abba gimme gimme gimme a man after midnight" },
  { title: "Dancing Queen", artist: "ABBA", category: "annees_80_90", year: 1976, search: "abba dancing queen arrival" },
  { title: "Mamma Mia", artist: "ABBA", category: "annees_80_90", year: 1975, search: "abba mamma mia" },
  { title: "Cendrillon", artist: "Téléphone", category: "annees_80_90", year: 1982, search: "telephone cendrillon dure limite" },
  { title: "Ça (C'est vraiment toi)", artist: "Téléphone", category: "annees_80_90", year: 1982, search: "telephone ca cest vraiment toi dure limite" },
  { title: "Un autre monde", artist: "Téléphone", category: "annees_80_90", year: 1984, search: "telephone un autre monde" },
  { title: "Ella, elle l'a", artist: "France Gall", category: "annees_80_90", year: 1987, search: "france gall ella elle la babacar" },
  { title: "Il jouait du piano debout", artist: "France Gall", category: "annees_80_90", year: 1980, search: "france gall il jouait du piano debout paris france" },
  { title: "Mistral gagnant", artist: "Renaud", category: "annees_80_90", year: 1985, search: "renaud mistral gagnant" },
  { title: "Les Lacs du Connemara", artist: "Michel Sardou", category: "annees_80_90", year: 1981, search: "michel sardou les lacs du connemara" },
  { title: "Les Sunlights des tropiques", artist: "Gilbert Montagné", category: "annees_80_90", year: 1984, search: "gilbert montagne les sunlights des tropiques liberte" },
  { title: "Voyage Voyage", artist: "Desireless", category: "annees_80_90", year: 1986, search: "desireless voyage voyage francois" },
  { title: "Nuit de folie", artist: "Début de Soirée", category: "annees_80_90", year: 1988, search: "debut de soiree nuit de folie" },
  { title: "Wake Me Up Before You Go-Go", artist: "Wham!", category: "annees_80_90", year: 1984, search: "wham make it big wake me up before you go go" },
  { title: "Girls Just Want to Have Fun", artist: "Cyndi Lauper", category: "annees_80_90", year: 1983, search: "cyndi lauper girls just want to have fun shes so unusual" },
  { title: "Careless Whisper", artist: "George Michael", category: "annees_80_90", year: 1984, search: "george michael careless whisper" },
  { title: "Total Eclipse of the Heart", artist: "Bonnie Tyler", category: "annees_80_90", year: 1983, search: "bonnie tyler total eclipse of the heart faster than the speed of night" },
  { title: "Sweet Dreams (Are Made of This)", artist: "Eurythmics", category: "annees_80_90", year: 1983, search: "eurythmics sweet dreams are made of this" },
  { title: "Like a Virgin", artist: "Madonna", category: "annees_80_90", year: 1984, search: "madonna like a virgin" },
  { title: "Material Girl", artist: "Madonna", category: "annees_80_90", year: 1984, search: "madonna material girl like a virgin" },
  { title: "Purple Rain", artist: "Prince", category: "annees_80_90", year: 1984, search: "prince and the revolution purple rain" },
  { title: "I'm Still Standing", artist: "Elton John", category: "annees_80_90", year: 1983, search: "elton john im still standing too low for zero" },
  { title: "September", artist: "Earth, Wind & Fire", category: "annees_80_90", year: 1978, search: "earth wind and fire september the best of vol 1" },
  { title: "Cheri Cheri Lady", artist: "Modern Talking", category: "annees_80_90", year: 1985, search: "modern talking cheri cheri lady lets talk about love" },

  // ==========================================
  // --- ÉLECTRO, DANCE & HOUSE ---
  // ==========================================
  { title: "One More Time", artist: "Daft Punk", category: "electro", year: 2001, search: "daft punk one more time discovery" },
  { title: "Around the World", artist: "Daft Punk", category: "electro", year: 1997, search: "daft punk around the world homework" },
  { title: "Harder, Better, Faster, Stronger", artist: "Daft Punk", category: "electro", year: 2001, search: "daft punk harder better faster stronger discovery" },
  { title: "Da Funk", artist: "Daft Punk", category: "electro", year: 1995, search: "daft punk da funk homework" },
  { title: "Titanium", artist: "David Guetta & Sia", category: "electro", year: 2011, search: "david guetta titanium sia nothing but the beat" },
  { title: "Memories", artist: "David Guetta & Kid Cudi", category: "electro", year: 2010, search: "david guetta memories kid cudi one love" },
  { title: "Sexy Bitch", artist: "David Guetta & Akon", category: "electro", year: 2009, search: "david guetta sexy bitch akon one love" },
  { title: "Wake Me Up", artist: "Avicii", category: "electro", year: 2013, search: "avicii wake me up true" },
  { title: "Levels", artist: "Avicii", category: "electro", year: 2011, search: "avicii levels radio edit" },
  { title: "The Nights", artist: "Avicii", category: "electro", year: 2014, search: "avicii the nights the days the nights" },
  { title: "Lean On", artist: "Major Lazer, DJ Snake & MØ", category: "electro", year: 2015, search: "major lazer dj snake mo lean on peace is the mission" },
  { title: "Turn Down for What", artist: "DJ Snake & Lil Jon", category: "electro", year: 2013, search: "dj snake lil jon turn down for what" },
  { title: "Let Me Love You", artist: "DJ Snake & Justin Bieber", category: "electro", year: 2016, search: "dj snake let me love you justin bieber encore" },
  { title: "Summer", artist: "Calvin Harris", category: "electro", year: 2014, search: "calvin harris summer motion" },
  { title: "Feel So Close", artist: "Calvin Harris", category: "electro", year: 2011, search: "calvin harris feel so close 18 months" },
  { title: "One Kiss", artist: "Calvin Harris & Dua Lipa", category: "electro", year: 2018, search: "calvin harris dua lipa one kiss" },
  { title: "Don't You Worry Child", artist: "Swedish House Mafia", category: "electro", year: 2012, search: "swedish house mafia dont you worry child until now" },
  { title: "Animals", artist: "Martin Garrix", category: "electro", year: 2013, search: "martin garrix animals original mix" },
  { title: "Firestone", artist: "Kygo & Conrad Sewell", category: "electro", year: 2014, search: "kygo firestone conrad sewell cloud nine" },
  { title: "Sugar", artist: "Robin Schulz & Francesco Yates", category: "electro", year: 2015, search: "robin schulz sugar francesco yates" },
  { title: "Closer", artist: "The Chainsmokers & Halsey", category: "electro", year: 2016, search: "the chainsmokers halsey closer collage" },
  { title: "Don't Let Me Down", artist: "The Chainsmokers & Daya", category: "electro", year: 2016, search: "the chainsmokers daya dont let me down collage" },
  { title: "This Girl", artist: "Kungs vs Cookin' on 3 Burners", category: "electro", year: 2016, search: "kungs cookin on 3 burners this girl layers" },
  { title: "Love Generation", artist: "Bob Sinclar", category: "electro", year: 2005, search: "bob sinclar love generation western dream" },
  { title: "World, Hold On", artist: "Bob Sinclar", category: "electro", year: 2006, search: "bob sinclar world hold on western dream" },
  { title: "D.A.N.C.E.", artist: "Justice", category: "electro", year: 2007, search: "justice dance cross" },
  { title: "Pursuit", artist: "Gesaffelstein", category: "electro", year: 2013, search: "gesaffelstein pursuit aleph" },
  { title: "Nightcall", artist: "Kavinsky", category: "electro", year: 2010, search: "kavinsky nightcall drive soundtrack" }
];

// Memory cache for songs with verified audio previews
const songCache = new Map();
const searchCache = new Map();
const activeSongs = new Map();

function getSongSlug(songDef, index) {
  const raw = `${songDef.artist}_${songDef.title}`;
  const slug = normalizeText(raw).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return slug || `song_${index}`;
}

// Pre-populate fallback records so getBaseSong never returns undefined
const fallbackSongsMap = new Map();
CURATED_HITS.forEach((hit, idx) => {
  const slug = getSongSlug(hit, idx);
  const record = {
    id: slug,
    legacyId: `song_${idx}`,
    title: hit.title,
    artist: hit.artist,
    curatedArtist: hit.artist,
    mediaTitle: hit.mediaTitle || '',
    mediaTitleFr: hit.mediaTitleFr || '',
    aliases: hit.aliases || [],
    category: hit.category || 'all',
    year: hit.year || 2020,
    previewUrl: '',
    artworkUrl: '',
    cleanTitle: normalizeText(hit.title),
    cleanArtist: normalizeText(hit.artist),
    cleanCuratedArtist: normalizeText(hit.artist),
    cleanMediaTitle: normalizeText(hit.mediaTitle || ''),
    cleanMediaTitleFr: normalizeText(hit.mediaTitleFr || ''),
    cleanAliases: (hit.aliases || []).map(a => normalizeText(a)),
    itunesTitle: normalizeText(hit.title),
    itunesArtist: normalizeText(hit.artist)
  };
  songCache.set(record.id, record);
  songCache.set(record.legacyId, record);
  songCache.set(`curated_${slug}`, record);
  fallbackSongsMap.set(record.id, record);
  fallbackSongsMap.set(record.legacyId, record);
});

let resolvedPool = [];

// Keywords that indicate amateur/unauthorized covers, karaoke, remix singles, or fake knockoffs
const JUNK_KEYWORDS = [
  'phonk', 'remix', 'remixes', 'tribute', 'karaoke', 'cover', 'covers', 'slowed', 'speed up', 'sped up',
  'nightcore', '8d audio', 'lofi', 'lo-fi', 'instrumental version', 'tribute to',
  'ready player piano', 'boyce avenue', 'tony evans', 'cia era uma vez', 'sing2piano',
  'steve aoki', 'rifti beats', 'the endless', 'samuraito', 'samuel kim', 'styzmask',
  'l\'orchestra cinematique', 'epic orchestra', 'orchestral cover', 'lofi remix',
  'lofi hip hop', 'pianocover', 'pianoteq', 'pianist', 'soundalike', 'parody', 'parodie', 'bootleg',
  'acoustic cover', 'piano tribute', 'orchestral tribute', 'viennese waltz', 'waltz version',
  'future rave', 'extended mix', 'club mix', 'dj mix', 'vip mix', 'dub mix', 'dance remix', 'techno mix',
  'house remix', 'trance remix', 're-recorded'
];

function isUnwantedRemixOrCover(rawTitle, rawArtist, expectedTitle = '', expectedArtist = '', collectionName = '') {
  const normT = (rawTitle || '').toLowerCase();
  const normA = (rawArtist || '').toLowerCase();
  const normC = (collectionName || '').toLowerCase();
  const expT = (expectedTitle || '').toLowerCase();
  const expA = (expectedArtist || '').toLowerCase();

  for (const kw of JUNK_KEYWORDS) {
    if (!expT.includes(kw) && !expA.includes(kw)) {
      if (normT.includes(kw) || normA.includes(kw) || normC.includes(kw)) {
        return true;
      }
    }
  }

  // If a specific artist was requested (e.g. Yoko Takahashi, John Williams, Koji Kondo)
  // and the returned artist is completely different (e.g. Steve Aoki, Rifti Beats, Boyce Avenue)
  if (expA && normA) {
    const cleanExpA = normalizeText(expA);
    const cleanNormA = normalizeText(normA);
    if (cleanExpA.length >= 4 && !cleanNormA.includes(cleanExpA) && !cleanExpA.includes(cleanNormA)) {
      return true;
    }
  }

  return false;
}

// Helper: Verify if an audio preview URL is live
function verifyAudioUrl(url) {
  return new Promise((resolve) => {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return resolve(false);
    }
    try {
      const parsed = new URL(url);
      const httpModule = parsed.protocol === 'https:' ? https : http;
      const req = httpModule.request(url, { method: 'HEAD', timeout: 3500 }, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    } catch (e) {
      resolve(false);
    }
  });
}

// Fetch from Deezer API
async function fetchFromDeezer(query, limit = 10) {
  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(`https://api.deezer.com/search?q=${encoded}&limit=${limit}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        return data.data.map(t => ({
          title: t.title,
          artist: t.artist ? t.artist.name : '',
          collectionName: t.album ? t.album.title : '',
          artworkUrl: t.album ? (t.album.cover_big || t.album.cover_medium || t.album.cover) : '',
          previewUrl: t.preview || '',
          year: t.album && t.album.release_date ? new Date(t.album.release_date).getFullYear() : null
        }));
      }
    }
  } catch (err) {
    // Deezer search error silent fallback
  }
  return [];
}

// Fetch from iTunes Search API with high fidelity Apple headers
async function fetchFromITunes(term, country = 'FR', limit = 10) {
  try {
    const encodedTerm = encodeURIComponent(term);
    const url = `https://itunes.apple.com/search?term=${encodedTerm}&country=${country}&media=music&entity=song&limit=${limit}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'iTunes/12.9.5 (Macintosh; OS X 10.14.6)',
        'Accept': 'application/json'
      }
    });

    if (res.status === 200) {
      const text = await res.text();
      const json = JSON.parse(text);
      if (json.results && json.results.length > 0) {
        return json.results;
      }
    }

    if (country === 'FR') {
      return await fetchFromITunes(term, 'US', limit);
    }
  } catch (err) {
    // iTunes API error silent fallback
  }
  return [];
}

// Resolve curated song into verified authentic track
async function resolveSong(songDef, index) {
  const songSlug = getSongSlug(songDef, index);
  const cacheKey = `curated_${songSlug}`;
  if (songCache.has(cacheKey) && songCache.get(cacheKey).previewUrl) {
    const cached = songCache.get(cacheKey);
    const isValid = await verifyAudioUrl(cached.previewUrl);
    if (isValid) return cached;
  }

  const normArtist = normalizeText(songDef.artist);
  const normTitle = normalizeText(songDef.title);
  const normSearch = songDef.search || `${songDef.artist} ${songDef.title}`;

  // 1. Try iTunes Search (Highest fidelity for authentic masters & official OST releases)
  const itunesResults = await fetchFromITunes(normSearch, 'FR', 15);
  for (const r of itunesResults) {
    if (!r.previewUrl) continue;
    if (isUnwantedRemixOrCover(r.trackName, r.artistName, songDef.title, songDef.artist, r.collectionName)) continue;

    const rArtist = normalizeText(r.artistName || '');
    const rTitle = normalizeText(r.trackName || '');

    let matchScore = 0;
    if (rTitle === normTitle || rTitle.includes(normTitle) || normTitle.includes(rTitle)) matchScore += 40;
    if (rArtist === normArtist || rArtist.includes(normArtist) || normArtist.includes(rArtist)) matchScore += 40;

    // Favor official full albums over standalone remix single releases
    if (r.collectionName && !r.collectionName.toLowerCase().includes('remix') && !r.collectionName.toLowerCase().includes('single')) {
      matchScore += 20;
    }

    // For soundtracks, accept if media name or official OST tags are found
    if (songDef.mediaTitle && (rTitle.includes(normalizeText(songDef.mediaTitle)) || (r.collectionName && normalizeText(r.collectionName).includes(normalizeText(songDef.mediaTitle))))) {
      matchScore += 30;
    }

    if (matchScore >= 35) {
      const isLive = await verifyAudioUrl(r.previewUrl);
      if (isLive) {
        const songRecord = {
          id: songSlug,
          legacyId: `song_${index}`,
          title: songDef.title, // CANONICAL ORIGINAL TITLE
          artist: songDef.artist, // CANONICAL ORIGINAL ARTIST
          curatedArtist: songDef.artist,
          mediaTitle: songDef.mediaTitle || '',
          mediaTitleFr: songDef.mediaTitleFr || '',
          aliases: songDef.aliases || [],
          category: songDef.category || 'all',
          year: songDef.year || (r.releaseDate ? new Date(r.releaseDate).getFullYear() : 2020),
          previewUrl: r.previewUrl,
          artworkUrl: r.artworkUrl100 ? r.artworkUrl100.replace('100x100bb', '600x600bb') : '',
          cleanTitle: normTitle,
          cleanArtist: normArtist,
          cleanCuratedArtist: normArtist,
          cleanMediaTitle: normalizeText(songDef.mediaTitle || ''),
          cleanMediaTitleFr: normalizeText(songDef.mediaTitleFr || ''),
          cleanAliases: (songDef.aliases || []).map(a => normalizeText(a)),
          itunesTitle: normTitle,
          itunesArtist: normArtist
        };
        songCache.set(cacheKey, songRecord);
        songCache.set(songSlug, songRecord);
        songCache.set(`song_${index}`, songRecord);
        return songRecord;
      }
    }
  }

  // 2. Try Deezer Search with strict cover rejection
  const deezerResults = await fetchFromDeezer(normSearch, 10);
  for (const r of deezerResults) {
    if (!r.previewUrl) continue;
    if (isUnwantedRemixOrCover(r.title, r.artist, songDef.title, songDef.artist, r.collectionName)) continue;

    const rArtist = normalizeText(r.artist || '');
    const rTitle = normalizeText(r.title || '');

    let matchScore = 0;
    if (rTitle === normTitle || rTitle.includes(normTitle) || normTitle.includes(rTitle)) matchScore += 40;
    if (rArtist === normArtist || rArtist.includes(normArtist) || normArtist.includes(rArtist)) matchScore += 40;

    if (matchScore >= 35) {
      const isLive = await verifyAudioUrl(r.previewUrl);
      if (isLive) {
        const songRecord = {
          id: songSlug,
          legacyId: `song_${index}`,
          title: songDef.title,
          artist: songDef.artist,
          curatedArtist: songDef.artist,
          mediaTitle: songDef.mediaTitle || '',
          mediaTitleFr: songDef.mediaTitleFr || '',
          aliases: songDef.aliases || [],
          category: songDef.category || 'all',
          year: songDef.year || r.year || 2020,
          previewUrl: r.previewUrl,
          artworkUrl: r.artworkUrl,
          cleanTitle: normTitle,
          cleanArtist: normArtist,
          cleanCuratedArtist: normArtist,
          cleanMediaTitle: normalizeText(songDef.mediaTitle || ''),
          cleanMediaTitleFr: normalizeText(songDef.mediaTitleFr || ''),
          cleanAliases: (songDef.aliases || []).map(a => normalizeText(a)),
          itunesTitle: normTitle,
          itunesArtist: normArtist
        };
        songCache.set(cacheKey, songRecord);
        songCache.set(songSlug, songRecord);
        songCache.set(`song_${index}`, songRecord);
        return songRecord;
      }
    }
  }

  // 3. Fallback to any valid preview with canonical metadata preserved
  const validItunes = itunesResults.find(r => r.previewUrl && !isUnwantedRemixOrCover(r.trackName, r.artistName, songDef.title, songDef.artist, r.collectionName));
  const validDeezer = deezerResults.find(r => r.previewUrl && !isUnwantedRemixOrCover(r.title, r.artist, songDef.title, songDef.artist, r.collectionName));
  const validPreviewUrl = validItunes ? validItunes.previewUrl : (validDeezer ? validDeezer.previewUrl : '');

  const fallbackRecord = {
    id: songSlug,
    legacyId: `song_${index}`,
    title: songDef.title,
    artist: songDef.artist,
    curatedArtist: songDef.artist,
    mediaTitle: songDef.mediaTitle || '',
    mediaTitleFr: songDef.mediaTitleFr || '',
    aliases: songDef.aliases || [],
    category: songDef.category || 'all',
    year: songDef.year || 2020,
    previewUrl: validPreviewUrl,
    artworkUrl: validItunes ? (validItunes.artworkUrl100 || '') : (validDeezer ? validDeezer.artworkUrl : ''),
    cleanTitle: normTitle,
    cleanArtist: normArtist,
    cleanCuratedArtist: normArtist,
    cleanMediaTitle: normalizeText(songDef.mediaTitle || ''),
    cleanMediaTitleFr: normalizeText(songDef.mediaTitleFr || ''),
    cleanAliases: (songDef.aliases || []).map(a => normalizeText(a)),
    itunesTitle: normTitle,
    itunesArtist: normArtist
  };
  songCache.set(cacheKey, fallbackRecord);
  songCache.set(songSlug, fallbackRecord);
  songCache.set(`song_${index}`, fallbackRecord);
  return fallbackRecord;
}

// Preload all curated hits on startup
let preloadPromise = null;
async function preloadSongs() {
  if (preloadPromise) return preloadPromise;
  preloadPromise = (async () => {
    console.log("Loading Songless curated authentic original tracks...");
    const results = [];
    const batchSize = 6;
    for (let i = 0; i < CURATED_HITS.length; i += batchSize) {
      const batch = CURATED_HITS.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map((hit, idx) => resolveSong(hit, i + idx)));
      results.push(...batchResults.filter(s => s.previewUrl && s.previewUrl.length > 0));
      if (i + batchSize < CURATED_HITS.length) {
        await new Promise(r => setTimeout(r, 30));
      }
    }
    resolvedPool = results.filter(s => s.previewUrl && s.previewUrl.length > 0);
    console.log(`Songless: ${resolvedPool.length} verified authentic master tracks loaded.`);
    return resolvedPool;
  })();
  return preloadPromise;
}
preloadSongs();

// Deterministic Daily Song
async function getDailySong(dateStr) {
  if (resolvedPool.length === 0) await preloadSongs();
  
  const today = dateStr || new Date().toISOString().slice(0, 10);
  const hash = crypto.createHash('md5').update(`songless_daily_${today}`).digest('hex');
  const index = parseInt(hash.substring(0, 8), 16) % resolvedPool.length;
  
  const song = resolvedPool[index];
  const generatedId = `daily_${today}_${song.id}`;
  activeSongs.set(generatedId, song);

  return {
    songId: generatedId,
    previewUrl: song.previewUrl,
    category: 'Quotidien',
    date: today,
    durations: [0.1, 0.5, 1.0, 2.5, 5.0, 10.0]
  };
}

// Random Song for categories / infinite replay
async function getRandomSong(category) {
  if (resolvedPool.length === 0) await preloadSongs();
  
  let selectedCategories = [];
  if (Array.isArray(category)) {
    selectedCategories = category.filter(c => c && c !== 'all');
  } else if (typeof category === 'string' && category && category !== 'all') {
    selectedCategories = category.split(',').map(c => c.trim()).filter(c => c && c !== 'all');
  }

  let candidates = resolvedPool.filter(s => s.previewUrl && s.previewUrl.length > 0);
  if (selectedCategories.length > 0) {
    const filtered = candidates.filter(s => selectedCategories.includes(s.category));
    if (filtered.length > 0) candidates = filtered;
  }

  if (candidates.length === 0) {
    const firstSong = await resolveSong(CURATED_HITS[0], 0);
    candidates = [firstSong];
  }
  
  const randomIndex = Math.floor(Math.random() * candidates.length);
  const song = candidates[randomIndex];
  const generatedId = `random_${Date.now()}_${Math.random().toString(36).slice(2, 7)}__${song.id}`;
  activeSongs.set(generatedId, song);
  
  return {
    songId: generatedId,
    previewUrl: song.previewUrl,
    category: song.category,
    durations: [0.1, 0.5, 1.0, 2.5, 5.0, 10.0]
  };
}

// Extract base song
function getBaseSong(songId) {
  if (!songId) return resolvedPool[0] || fallbackSongsMap.get('song_0');
  if (activeSongs.has(songId)) return activeSongs.get(songId);

  let slug = songId;
  if (songId.includes('__')) {
    slug = songId.split('__').pop();
  } else if (songId.startsWith('random_')) {
    const parts = songId.split('_');
    slug = parts.slice(3).join('_') || parts[parts.length - 1];
  }

  if (songCache.has(slug)) return songCache.get(slug);
  if (songCache.has(`song_${slug}`)) return songCache.get(`song_${slug}`);

  const foundInPool = resolvedPool.find(s => s.id === slug || s.legacyId === `song_${slug}` || s.id === `song_${slug}`);
  if (foundInPool) return foundInPool;

  return resolvedPool[0] || fallbackSongsMap.get('song_0');
}

// Refresh song audio preview if needed
async function refreshSongAudio(songId) {
  const baseSong = getBaseSong(songId);
  if (!baseSong) return null;

  const query = `${baseSong.curatedArtist || baseSong.artist} ${baseSong.title}`;
  const itunesRes = await fetchFromITunes(query, 'FR', 8);
  for (const it of itunesRes) {
    if (it.previewUrl && !isUnwantedRemixOrCover(it.trackName, it.artistName, baseSong.title, baseSong.artist) && await verifyAudioUrl(it.previewUrl)) {
      baseSong.previewUrl = it.previewUrl;
      if (it.artworkUrl100) baseSong.artworkUrl = it.artworkUrl100.replace('100x100bb', '600x600bb');
      return baseSong;
    }
  }

  return baseSong;
}

// ==========================================
// --- SMART GUESS EVALUATION (100% ACCURATE) ---
// ==========================================
function evaluateGuess(songId, guessTitle, guessArtist, attempt = 1) {
  const actualSong = getBaseSong(songId);
  if (!actualSong) return { error: "Song not found" };

  const normGuessTitle = normalizeText(guessTitle || '');
  const normGuessArtist = normalizeText(guessArtist || '');
  const combinedGuess = normalizeText(`${guessTitle || ''} ${guessArtist || ''}`);

  const normActualTitle = actualSong.cleanTitle || normalizeText(actualSong.title);
  const normActualArtist = actualSong.cleanArtist || normalizeText(actualSong.artist);
  const normCuratedArtist = actualSong.cleanCuratedArtist || normalizeText(actualSong.curatedArtist || '');
  const normMedia = actualSong.cleanMediaTitle || normalizeText(actualSong.mediaTitle || '');
  const normMediaFr = actualSong.cleanMediaTitleFr || normalizeText(actualSong.mediaTitleFr || '');
  const cleanAliases = actualSong.cleanAliases || (actualSong.aliases || []).map(a => normalizeText(a));

  // --- 1. MEDIA / UNIVERSE VALIDATION (CINÉMA, SÉRIES, ANIMÉS, JEUX VIDÉO) ---
  // If the work has a media tag, guessing the universe IS A DIRECT WIN (🟩)!
  let isMediaMatch = false;
  if (normMedia || normMediaFr || cleanAliases.length > 0) {
    // Check primary media titles
    if (normMedia && (isFuzzyMatch(normGuessTitle, normMedia) || isFuzzyMatch(combinedGuess, normMedia) || normGuessTitle.includes(normMedia) || normMedia.includes(normGuessTitle))) {
      isMediaMatch = true;
    }
    if (normMediaFr && (isFuzzyMatch(normGuessTitle, normMediaFr) || isFuzzyMatch(combinedGuess, normMediaFr) || normGuessTitle.includes(normMediaFr) || normMediaFr.includes(normGuessTitle))) {
      isMediaMatch = true;
    }
    // Check all accepted aliases (acronyms, French/English translations, character names, typos)
    for (const alias of cleanAliases) {
      if (!alias) continue;
      if (normGuessTitle === alias || combinedGuess === alias || normGuessTitle.includes(alias) || combinedGuess.includes(alias) || alias.includes(normGuessTitle) || isFuzzyMatch(normGuessTitle, alias) || isFuzzyMatch(combinedGuess, alias)) {
        isMediaMatch = true;
        break;
      }
    }
  }

  // --- 2. SONG TITLE VALIDATION ---
  let isTitleMatch = false;
  if (normGuessTitle && (
    normGuessTitle === normActualTitle ||
    isFuzzyMatch(normGuessTitle, normActualTitle) ||
    normActualTitle.includes(normGuessTitle) ||
    normGuessTitle.includes(normActualTitle) ||
    combinedGuess.includes(normActualTitle) ||
    isFuzzyMatch(combinedGuess, normActualTitle)
  )) {
    isTitleMatch = true;
  }

  // --- 3. ARTIST VALIDATION ---
  let isArtistMatch = false;
  if (normGuessArtist) {
    if (normGuessArtist === normActualArtist || isFuzzyMatch(normGuessArtist, normActualArtist) || normActualArtist.includes(normGuessArtist)) {
      isArtistMatch = true;
    }
    if (normCuratedArtist && (normGuessArtist === normCuratedArtist || isFuzzyMatch(normGuessArtist, normCuratedArtist) || normCuratedArtist.includes(normGuessArtist))) {
      isArtistMatch = true;
    }
  }
  if (!isArtistMatch && (normGuessTitle === normActualArtist || isFuzzyMatch(normGuessTitle, normActualArtist) || (normCuratedArtist && (normGuessTitle === normCuratedArtist || isFuzzyMatch(normGuessTitle, normCuratedArtist))))) {
    isArtistMatch = true;
  }

  // --- 4. DETERMINE WIN / STATUS ---
  let status = 'wrong';

  if (isMediaMatch || isTitleMatch || (isArtistMatch && (isTitleMatch || isMediaMatch))) {
    status = 'correct';
  } else if (isArtistMatch) {
    status = 'artist_match';
  }

  const isOver = status === 'correct' || attempt >= 6;

  // Build nice canonical solution title
  let solutionTitle = actualSong.title;
  const mediaLabel = actualSong.mediaTitleFr || actualSong.mediaTitle;
  if (mediaLabel && !solutionTitle.toLowerCase().includes(mediaLabel.toLowerCase())) {
    solutionTitle = `${actualSong.title} (${mediaLabel})`;
  }

  return {
    status,
    attempt,
    isOver,
    guess: { title: guessTitle, artist: guessArtist },
    solution: isOver ? {
      title: solutionTitle,
      artist: actualSong.curatedArtist || actualSong.artist,
      mediaTitle: mediaLabel || '',
      category: actualSong.category || '',
      year: actualSong.year,
      artworkUrl: actualSong.artworkUrl,
      previewUrl: actualSong.previewUrl
    } : null
  };
}

// ==========================================
// --- AUTOCOMPLETE SEARCH INDEX ---
// ==========================================
async function searchSongs(query) {
  if (!query || query.trim().length < 2) return [];
  const cleanQ = query.trim().toLowerCase();
  const normQ = normalizeText(query);

  if (searchCache.has(cleanQ)) return searchCache.get(cleanQ);

  const seen = new Set();
  const combined = [];

  // 1. Search Curated Authentic Works First (Guarantee instant media suggestions)
  const poolToSearch = resolvedPool.length > 0 ? resolvedPool : Array.from(fallbackSongsMap.values());
  for (const song of poolToSearch) {
    const normTitle = song.cleanTitle || normalizeText(song.title);
    const normArtist = song.cleanArtist || normalizeText(song.artist);
    const normMedia = song.cleanMediaTitle || normalizeText(song.mediaTitle || '');
    const normMediaFr = song.cleanMediaTitleFr || normalizeText(song.mediaTitleFr || '');
    const aliases = song.cleanAliases || (song.aliases || []).map(a => normalizeText(a));

    const isMatch = normTitle.includes(normQ) ||
                    normArtist.includes(normQ) ||
                    (normMedia && (normMedia.includes(normQ) || isFuzzyMatch(normQ, normMedia))) ||
                    (normMediaFr && (normMediaFr.includes(normQ) || isFuzzyMatch(normQ, normMediaFr))) ||
                    aliases.some(a => a.includes(normQ) || isFuzzyMatch(normQ, a));

    if (isMatch) {
      // Suggest Media Name if available
      if (song.mediaTitleFr || song.mediaTitle) {
        const mediaName = song.mediaTitleFr || song.mediaTitle;
        const mediaKey = `media_${normalizeText(mediaName)}`;
        if (!seen.has(mediaKey)) {
          seen.add(mediaKey);
          let catLabel = 'Bande Originale';
          if (song.category === 'cinema') catLabel = 'Film / Cinéma';
          if (song.category === 'series') catLabel = 'Série TV';
          if (song.category === 'anime') catLabel = 'Anime';
          if (song.category === 'gaming') catLabel = 'Jeu Vidéo';

          combined.push({
            title: mediaName,
            artist: song.artist,
            artworkUrl: song.artworkUrl,
            year: song.year,
            displayTitle: mediaName,
            subTitle: `${catLabel} • ${song.artist}`,
            isMedia: true
          });
        }
      }

      // Suggest Song Title
      const songKey = `${normTitle}||${normArtist}`;
      if (!seen.has(songKey)) {
        seen.add(songKey);
        const sub = (song.mediaTitleFr || song.mediaTitle) ? `${song.artist} • ${song.mediaTitleFr || song.mediaTitle}` : song.artist;
        combined.push({
          title: song.title,
          artist: song.artist,
          artworkUrl: song.artworkUrl,
          year: song.year,
          displayTitle: song.title,
          subTitle: sub,
          isMedia: false
        });
      }
    }
  }

  // 2. Search Deezer for external mainstream hits (with strict anti-cover filtering)
  const deezerResults = await fetchFromDeezer(query, 12);
  for (const t of deezerResults) {
    if (!t.title || !t.artist) continue;
    if (isUnwantedRemixOrCover(t.title, t.artist)) continue;

    const key = `${normalizeText(t.title)}||${normalizeText(t.artist)}`;
    if (!seen.has(key)) {
      seen.add(key);
      combined.push({
        title: t.title,
        artist: t.artist,
        artworkUrl: t.artworkUrl,
        year: t.year,
        displayTitle: t.title,
        subTitle: t.artist,
        isMedia: false
      });
    }
  }

  // 3. Fallback to iTunes API if suggestions are fewer than 10
  if (combined.length < 10) {
    const itunesResults = await fetchFromITunes(query, 'FR', 10);
    for (const r of itunesResults) {
      if (!r.trackName || !r.artistName) continue;
      if (isUnwantedRemixOrCover(r.trackName, r.artistName)) continue;

      const key = `${normalizeText(r.trackName)}||${normalizeText(r.artistName)}`;
      if (!seen.has(key)) {
        seen.add(key);
        combined.push({
          title: r.trackName,
          artist: r.artistName,
          artworkUrl: r.artworkUrl100 ? r.artworkUrl100.replace('100x100bb', '300x300bb') : '',
          year: r.releaseDate ? new Date(r.releaseDate).getFullYear() : null,
          displayTitle: r.trackName,
          subTitle: r.artistName,
          isMedia: false
        });
      }
      if (combined.length >= 15) break;
    }
  }

  const finalResults = combined.slice(0, 15);
  searchCache.set(cleanQ, finalResults);
  return finalResults;
}

module.exports = {
  preloadSongs,
  getDailySong,
  getRandomSong,
  evaluateGuess,
  getBaseSong,
  searchSongs,
  refreshSongAudio
};