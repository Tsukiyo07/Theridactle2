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
    // Dragon Ball
    { civil: 'Son Goku', impostor: 'Végéta' },
    { civil: 'Son Gohan', impostor: 'Trunks' },
    { civil: 'Piccolo', impostor: 'Kamé Sennin' },
    { civil: 'Freezer', impostor: 'Cell' },
    { civil: 'Krilin', impostor: 'Yamcha' },
    { civil: 'Majin Bou', impostor: 'Kid Bou' },
    { civil: 'Bardock', impostor: 'Broly' },

    // Naruto
    { civil: 'Naruto Uzumaki', impostor: 'Sasuke Uchiha' },
    { civil: 'Kakashi Hatake', impostor: 'Obito Uchiha' },
    { civil: 'Itachi Uchiha', impostor: 'Sasuke Uchiha' },
    { civil: 'Jiraiya', impostor: 'Orochimaru' },
    { civil: 'Gaara', impostor: 'Kankurô' },
    { civil: 'Minato Namikaze', impostor: 'Tobirama Senju' },
    { civil: 'Hinata Hyûga', impostor: 'Sakura Haruno' },
    { civil: 'Shikamaru Nara', impostor: 'Chôji Akimichi' },

    // One Piece
    { civil: 'Monkey D. Luffy', impostor: 'Roronoa Zoro' },
    { civil: 'Sanji Vinsmoke', impostor: 'Roronoa Zoro' },
    { civil: 'Portgas D. Ace', impostor: 'Sabo' },
    { civil: 'Shanks le Roux', impostor: 'Dracule Mihawk' },
    { civil: 'Nami', impostor: 'Nico Robin' },
    { civil: 'Tony-Tony Chopper', impostor: 'Usopp' },
    { civil: 'Brook', impostor: 'Franky' },
    { civil: 'Kaido', impostor: 'Big Mom' },
    { civil: 'Gold Roger', impostor: 'Barbe Blanche' },

    // Death Note
    { civil: 'Light Yagami', impostor: 'L (Ryuzaki)' },
    { civil: 'Near', impostor: 'Mello' },
    { civil: 'Misa Amane', impostor: 'Kiyomi Takada' },
    { civil: 'Ryuk', impostor: 'Rem' },

    // Hunter x Hunter
    { civil: 'Gon Freecss', impostor: 'Killua Zoldyck' },
    { civil: 'Kurapika', impostor: 'Leorio Paradinight' },
    { civil: 'Hisoka Morow', impostor: 'Illumi Zoldyck' },
    { civil: 'Netero', impostor: 'Meruem' },
    { civil: 'Chrollo Lucilfer', impostor: 'Feitan Portor' },

    // My Hero Academia
    { civil: 'Izuku Midoriya', impostor: 'Katsuki Bakugo' },
    { civil: 'Shoto Todoroki', impostor: 'Eijiro Kirishima' },
    { civil: 'All Might', impostor: 'Endeavor' },
    { civil: 'Tomura Shigaraki', impostor: 'Dabi' },
    { civil: 'Ochaco Uraraka', impostor: 'Tsuyu Asui' },

    // Jujutsu Kaisen
    { civil: 'Yuji Itadori', impostor: 'Megumi Fushiguro' },
    { civil: 'Satoru Gojo', impostor: 'Suguru Geto' },
    { civil: 'Ryomen Sukuna', impostor: 'Mahito' },
    { civil: 'Nobara Kugisaki', impostor: 'Maki Zen\'in' },
    { civil: 'Kento Nanami', impostor: 'Aoi Todo' },
    { civil: 'Yuta Okkotsu', impostor: 'Toge Inumaki' },

    // Demon Slayer
    { civil: 'Tanjiro Kamado', impostor: 'Zenitsu Agatsuma' },
    { civil: 'Inosuke Hashibira', impostor: 'Zenitsu Agatsuma' },
    { civil: 'Nezuko Kamado', impostor: 'Kanao Tsuyuri' },
    { civil: 'Kyojuro Rengoku', impostor: 'Giyu Tomioka' },
    { civil: 'Muzan Kibutsuji', impostor: 'Kokushibo' },
    { civil: 'Shinobu Kocho', impostor: 'Mitsuri Kanroji' },

    // Attack on Titan
    { civil: 'Eren Jäger', impostor: 'Armin Arlert' },
    { civil: 'Levi Ackerman', impostor: 'Erwin Smith' },
    { civil: 'Mikasa Ackerman', impostor: 'Annie Leonhart' },
    { civil: 'Reiner Braun', impostor: 'Bertholdt Hoover' },
    { civil: 'Sasha Blouse', impostor: 'Conny Springer' },

    // Bleach
    { civil: 'Ichigo Kurosaki', impostor: 'Uryu Ishida' },
    { civil: 'Rukia Kuchiki', impostor: 'Orihime Inoue' },
    { civil: 'Sousuke Aizen', impostor: 'Kisuke Urahara' },
    { civil: 'Toshiro Hitsugaya', impostor: 'Byakuya Kuchiki' },
    { civil: 'Kenpachi Zaraki', impostor: 'Renji Abarai' },

    // Fullmetal Alchemist
    { civil: 'Edward Elric', impostor: 'Alphonse Elric' },
    { civil: 'Roy Mustang', impostor: 'Riza Hawkeye' },
    { civil: 'Scar', impostor: 'King Bradley' },

    // Chainsaw Man
    { civil: 'Denji', impostor: 'Aki Hayakawa' },
    { civil: 'Power', impostor: 'Makima' },
    { civil: 'Reze', impostor: 'Himeno' },

    // Fairy Tail
    { civil: 'Natsu Dragneel', impostor: 'Gray Fullbuster' },
    { civil: 'Lucy Heartfilia', impostor: 'Erza Scarlet' },
    { civil: 'Happy', impostor: 'Carla' },
    { civil: 'Gajeel Redfox', impostor: 'Laxus Dreyar' },

    // Neon Genesis Evangelion
    { civil: 'Shinji Ikari', impostor: 'Asuka Langley Soryu' },
    { civil: 'Rei Ayanami', impostor: 'Mari Makinami' },
    { civil: 'Misato Katsuragi', impostor: 'Ritsuko Akagi' },

    // Solo Leveling
    { civil: 'Sung Jinwoo', impostor: 'Cha Hae-in' },
    { civil: 'Yoo Jinho', impostor: 'Woo Jinchul' },

    // One Punch Man
    { civil: 'Saitama', impostor: 'Genos' },
    { civil: 'Tatsumaki', impostor: 'Fubuki' },
    { civil: 'Garou', impostor: 'Bang' },
    { civil: 'King', impostor: 'Mumen Rider' },

    // Tokyo Ghoul
    { civil: 'Ken Kaneki', impostor: 'Touka Kirishima' },
    { civil: 'Shu Tsukiyama', impostor: 'Koutarou Amon' },

    // Black Clover
    { civil: 'Asta', impostor: 'Yuno' },
    { civil: 'Noelle Silva', impostor: 'Yami Sukehiro' },

    // Code Geass
    { civil: 'Lelouch vi Britannia', impostor: 'Suzaku Kururugi' },
    { civil: 'C.C.', impostor: 'Kallen Stadtfeld' },

    // Sword Art Online
    { civil: 'Kirito (Kazuto Kirigaya)', impostor: 'Asuna Yuuki' },
    { civil: 'Sinon (Shino Asada)', impostor: 'Leafa (Suguha Kirigaya)' },

    // Steins;Gate
    { civil: 'Okabe Rintarou', impostor: 'Makise Kurisu' },
    { civil: 'Hashida Itaru', impostor: 'Shiina Mayuri' },

    // Assassination Classroom
    { civil: 'Koro-sensei', impostor: 'Nagisa Shiota' },
    { civil: 'Karma Akabane', impostor: 'Nagisa Shiota' },

    // Mob Psycho 100
    { civil: 'Shigeo Kageyama (Mob)', impostor: 'Arataka Reigen' },
    { civil: 'Ritsu Kageyama', impostor: 'Teruki Hanazawa' },

    // Vinland Saga
    { civil: 'Thorfinn', impostor: 'Askeladd' },
    { civil: 'Canute', impostor: 'Thorkell' },

    // JoJo's Bizarre Adventure
    { civil: 'Jotaro Kujo', impostor: 'Dio Brando' },
    { civil: 'Jonathan Joestar', impostor: 'Joseph Joestar' },
    { civil: 'Josuke Higashikata', impostor: 'Giorno Giovanna' },
    { civil: 'Kakyoin Noriaki', impostor: 'Polnareff' },

    // Cyberpunk Edgerunners
    { civil: 'David Martinez', impostor: 'Lucy' },
    { civil: 'Rebecca', impostor: 'Maine' },

    // Seven Deadly Sins
    { civil: 'Meliodas', impostor: 'Zeldris' },
    { civil: 'Ban', impostor: 'King' },
    { civil: 'Escanor', impostor: 'Merlin' },

    // Blue Lock
    { civil: 'Yoichi Isagi', impostor: 'Meguru Bachira' },
    { civil: 'Rin Itoshi', impostor: 'Sae Itoshi' },
    { civil: 'Seishiro Nagi', impostor: 'Reo Mikage' },

    // Haikyu!!
    { civil: 'Shoyo Hinata', impostor: 'Tobio Kageyama' },
    { civil: 'Kei Tsukishima', impostor: 'Tadashi Yamaguchi' },
    { civil: 'Kenma Kozume', impostor: 'Tetsuro Kuroo' },

    // Spy x Family
    { civil: 'Loid Forger', impostor: 'Yor Forger' },
    { civil: 'Anya Forger', impostor: 'Bond Forger' },

    // Monster
    { civil: 'Kenzo Tenma', impostor: 'Johan Liebert' },

    // Studio Ghibli
    { civil: 'Totoro', impostor: 'Calcifer' },
    { civil: 'Chihiro', impostor: 'Haku' },

    // Pokémon
    { civil: 'Pikachu', impostor: 'Évoli' },
    { civil: 'Sacha Ketchum', impostor: 'Ondine' }
  ],
  jeux_video: [
    { civil: 'Mario', impostor: 'Luigi' },
    { civil: 'Zelda', impostor: 'Link' },
    { civil: 'Sonic', impostor: 'Shadow' },
    { civil: 'Kratos (God of War)', impostor: 'Master Chief (Halo)' },
    { civil: 'Joel (The Last of Us)', impostor: 'Ellie (The Last of Us)' },
    { civil: 'Lara Croft (Tomb Raider)', impostor: 'Nathan Drake (Uncharted)' },
    { civil: 'Sans (Undertale)', impostor: 'Papyrus (Undertale)' },
    { civil: 'Steve (Minecraft)', impostor: 'Alex (Minecraft)' },
    { civil: 'Pikachu (Pokémon)', impostor: 'Évoli (Pokémon)' },
    { civil: 'Sub-Zero (Mortal Kombat)', impostor: 'Scorpion (Mortal Kombat)' },
    { civil: 'Ryu (Street Fighter)', impostor: 'Ken Masters (Street Fighter)' },
    { civil: 'Geralt de Riv (The Witcher)', impostor: 'Arthur Morgan (RDR2)' },
    { civil: 'Crash Bandicoot', impostor: 'Spyro le Dragon' },
    { civil: 'Rayman', impostor: 'Lapin Crétin' },
    { civil: 'Doom Slayer (Doom)', impostor: 'Duke Nukem' },
    { civil: 'Bowser (Mario)', impostor: 'Donkey Kong' },
    { civil: 'Princesse Peach', impostor: 'Princesse Daisy' },
    { civil: 'Solid Snake (Metal Gear)', impostor: 'Sam Fisher (Splinter Cell)' },
    { civil: 'Ezio Auditore (Assassin\'s Creed)', impostor: 'Altaïr Ibn-La\'Ahad (Assassin\'s Creed)' },
    { civil: 'Trevor Philips (GTA V)', impostor: 'Michael De Santa (GTA V)' },
    { civil: 'Arthur Morgan (RDR2)', impostor: 'John Marston (RDR)' },
    { civil: 'Cloud Strife (Final Fantasy VII)', impostor: 'Sephiroth (Final Fantasy VII)' },
    { civil: 'Kirby', impostor: 'Meta Knight' },
    { civil: 'Tracer (Overwatch)', impostor: 'Widowmaker (Overwatch)' },
    { civil: 'Phoenix Wright (Ace Attorney)', impostor: 'Professeur Layton' },
    { civil: 'Cuphead', impostor: 'Mugman' },
    { civil: 'Jinx (League of Legends)', impostor: 'Vi (League of Legends)' },
    { civil: 'Glados (Portal)', impostor: 'Wheatley (Portal)' },
    { civil: 'Sans (Undertale)', impostor: 'Flowey (Undertale)' },
    { civil: 'Leon S. Kennedy (Resident Evil)', impostor: 'Chris Redfield (Resident Evil)' }
  ],
  films_series: [
    { civil: 'Harry Potter', impostor: 'Lord Voldemort' },
    { civil: 'Batman (Bruce Wayne)', impostor: 'Le Joker' },
    { civil: 'Jack Sparrow', impostor: 'Indiana Jones' },
    { civil: 'Shrek', impostor: 'Princesse Fiona' },
    { civil: 'Luke Skywalker', impostor: 'Darth Vador' },
    { civil: 'Walter White (Heisenberg)', impostor: 'Jesse Pinkman' },
    { civil: 'Sherlock Holmes', impostor: 'Docteur Watson' },
    { civil: 'Iron Man (Tony Stark)', impostor: 'Captain America (Steve Rogers)' },
    { civil: 'Gandalf (LGDF)', impostor: 'Albus Dumbledore (Harry Potter)' },
    { civil: 'Frodon Sacquet', impostor: 'Sam Gamegie' },
    { civil: 'Shrek', impostor: 'L\'Âne' },
    { civil: 'Jon Snow', impostor: 'Daenerys Targaryen' },
    { civil: 'Neo (Matrix)', impostor: 'Morpheus (Matrix)' },
    { civil: 'Michael Scott', impostor: 'Dwight Schrute' },
    { civil: 'Rick Sanchez', impostor: 'Morty Smith' },
    { civil: 'Mercredi Addams', impostor: 'Eleven (Stranger Things)' },
    { civil: 'James Bond (007)', impostor: 'Ethan Hunt (Mission Impossible)' },
    { civil: 'Marty McFly', impostor: 'Doc Brown (Emmett Brown)' },
    { civil: 'Jack Dawson (Titanic)', impostor: 'Rose DeWitt Bukater' },
    { civil: 'Le Joker', impostor: 'Harley Quinn' },
    { civil: 'Thanos (Marvel)', impostor: 'Darth Vador (Star Wars)' },
    { civil: 'Thor (Marvel)', impostor: 'Loki (Marvel)' },
    { civil: 'Forrest Gump', impostor: 'Benjamin Button' },
    { civil: 'Dominic Toretto (Fast & Furious)', impostor: 'Brian O\'Conner (Fast & Furious)' },
    { civil: 'Barney Stinson (HIMYM)', impostor: 'Ted Mosby (HIMYM)' },
    { civil: 'Chandler Bing (Friends)', impostor: 'Joey Tribbiani (Friends)' },
    { civil: 'Spider-Man (Peter Parker)', impostor: 'Batman (Bruce Wayne)' },
    { civil: 'Gollum', impostor: 'Bilbon Sacquet' },
    { civil: 'Legolas', impostor: 'Gimli' },
    { civil: 'Thomas Shelby (Peaky Blinders)', impostor: 'Alfie Solomons (Peaky Blinders)' },
    { civil: 'Jim Halpert', impostor: 'Pam Beesly' },
    { civil: 'Sheldon Cooper', impostor: 'Leonard Hofstadter' },
    { civil: 'Dracula', impostor: 'Monstre de Frankenstein' }
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
    { civil: 'Vélo', impostor: 'Trottinette' },
    { civil: 'Paris', impostor: 'Londres' },
    { civil: 'Mer', impostor: 'Océan' },
    { civil: 'Pluie', impostor: 'Neige' },
    { civil: 'Orage', impostor: 'Tempête' },
    { civil: 'Moto', impostor: 'Scooter' },
    { civil: 'Fraise', impostor: 'Framboise' },
    { civil: 'Pomme', impostor: 'Poire' },
    { civil: 'Pain', impostor: 'Croissant' },
    { civil: 'Beurre', impostor: 'Margarine' },
    { civil: 'Sel', impostor: 'Poivre' },
    { civil: 'Or', impostor: 'Argent' },
    { civil: 'Diamant', impostor: 'Rubis' },
    { civil: 'Livre', impostor: 'Liseuse' },
    { civil: 'Stylo', impostor: 'Crayon' },
    { civil: 'Chapeau', impostor: 'Casquette' },
    { civil: 'Chaussures', impostor: 'Chaussettes' },
    { civil: 'Lunettes', impostor: 'Lentilles' },
    { civil: 'Cinéma', impostor: 'Théâtre' },
    { civil: 'Télévision', impostor: 'Projecteur' },
    { civil: 'Coca-Cola', impostor: 'Pepsi' }
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
    descriptionRounds: room.descriptionRounds || 1,
    impostorCount: room.impostorCount || 1,
    currentDescriptionRound: room.currentDescriptionRound || 1,
    descriptionHistory: room.descriptionHistory || [],
    players: getSanitizedPlayers(room),
    turnOrder: room.turnOrder || [],
    currentTurnIndex: room.currentTurnIndex || 0,
    winner: room.winner || null,
    civilWord: room.status === 'game_over' ? room.civilWord : null,
    impostorWord: room.status === 'game_over' ? room.impostorWord : null,
    impostorNickname: room.status === 'game_over' ? room.impostorNickname : null
  };
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
            [name]: { nickname: name, word: '', isImpostor: false, votedFor: null, isEliminated: false, score: 0, isConnected: true }
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
        if (name.length > 15) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Le pseudo ne doit pas dépasser 15 caractères' }));
        }
        
        const room = rooms[id];
        
        // Reconnection logic
        const existingPlayer = room.players[name];
        if (existingPlayer) {
          existingPlayer.isConnected = true;
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
        if (room.players[name]) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Pseudo déjà utilisé dans ce salon' }));
        }
        
        room.players[name] = { nickname: name, word: '', isImpostor: false, votedFor: null, isEliminated: false, score: 0, isConnected: true };
        
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
        
        const pairs = IMPOSTEUR_WORDS[theme] || IMPOSTEUR_WORDS.general;
        const pair = pairs[Math.floor(Math.random() * pairs.length)];
        
        // True random selection of N unique impostor names
        const shuffledForImpostors = [...playersList];
        for (let i = shuffledForImpostors.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledForImpostors[i], shuffledForImpostors[j]] = [shuffledForImpostors[j], shuffledForImpostors[i]];
        }
        const impostorNames = shuffledForImpostors.slice(0, impCount);
        
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
        // Initialize
        alivePlayers.forEach(p => voteCounts[p.nickname] = 0);
        voteCounts['skip'] = 0;
        
        alivePlayers.forEach(p => {
          if (p.votedFor) {
            voteCounts[p.votedFor] = (voteCounts[p.votedFor] || 0) + 1;
          }
        });
        
        let maxVotes = -1;
        let selectedChoice = null;
        let isTie = false;
        
        Object.keys(voteCounts).forEach(choice => {
          if (voteCounts[choice] > maxVotes) {
            maxVotes = voteCounts[choice];
            selectedChoice = choice;
            isTie = false;
          } else if (voteCounts[choice] === maxVotes) {
            isTie = true;
          }
        });
        
        if (isTie) {
          const tied = Object.keys(voteCounts).filter(choice => voteCounts[choice] === maxVotes);
          selectedChoice = tied[Math.floor(Math.random() * tied.length)];
        }
        
        if (selectedChoice === 'skip') {
          // Vote is skipped! Nobody is eliminated, start another round of descriptions.
          console.log(`Vote skipped in room ${roomId}. Resetting descriptions for another round.`);
          room.status = 'playing';
          room.currentTurnIndex = 0;
          room.currentDescriptionRound = 1;
          
          Object.keys(room.players).forEach(name => {
            room.players[name].description = '';
            room.players[name].votedFor = null;
          });
          
          checkAndAdvanceTurnIfOffline(room);
        } else {
          // Eliminate the voted player
          const eliminatedNickname = selectedChoice;
          room.players[eliminatedNickname].isEliminated = true;
          const eliminatedPlayer = room.players[eliminatedNickname];
          console.log(`Player ${eliminatedNickname} was eliminated in room ${roomId}`);
          
          const remainingPlayers = Object.values(room.players).filter(p => !p.isEliminated);
          const remainingImpostors = remainingPlayers.filter(p => p.isImpostor);
          const remainingCitizens = remainingPlayers.filter(p => !p.isImpostor);

          if (remainingImpostors.length === 0) {
            room.status = 'game_over';
            room.winner = 'civils';
            
            // Score system: +2 for surviving civils, +1 for eliminated civils
            Object.values(room.players).forEach(p => {
              if (!p.isImpostor) {
                if (!p.isEliminated) {
                  p.score = (p.score || 0) + 2;
                } else {
                  p.score = (p.score || 0) + 1;
                }
              }
            });
          } else if (remainingCitizens.length <= remainingImpostors.length) {
            room.status = 'game_over';
            room.winner = 'impostor';
            
            // Score system: +3 for the impostor(s)
            Object.values(room.players).forEach(p => {
              if (p.isImpostor) {
                p.score = (p.score || 0) + 3;
              }
            });
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
        const { nickname } = JSON.parse(body);
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
            [name]: { nickname: name, score: 0, currentAnswer: null, isCorrect: false, pointsEarned: 0 }
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
        const { roomId, nickname } = JSON.parse(body);
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
        
        room.players[name] = { nickname: name, score: 0, currentAnswer: null, isCorrect: false, pointsEarned: 0 };
        
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
  // LOUP-GAROU HELPERS & ENDPOINTS
  // ==========================================

  function getSanitizedLoupGarouPlayers(room, forNickname) {
    const sanitized = {};
    const viewer = room.players[forNickname];
    const viewerIsWolf = viewer && viewer.role === 'loup';
    const viewerCoupleId = room.players[forNickname] ? room.players[forNickname].coupleId : null;

    Object.keys(room.players).forEach(name => {
      const p = room.players[name];
      let roleRevealed = false;
      
      if (!p.isAlive || room.status === 'game_over') {
        roleRevealed = true;
      } else if (name === forNickname) {
        roleRevealed = true;
      } else if (viewerIsWolf && p.role === 'loup') {
        roleRevealed = true;
      }

      const isLoverWithViewer = viewerCoupleId && p.coupleId === viewerCoupleId;

      sanitized[name] = {
        nickname: p.nickname,
        isAlive: p.isAlive,
        isConnected: p.isConnected,
        role: roleRevealed ? p.role : 'mystere',
        isLover: !!isLoverWithViewer,
        votedFor: (room.status === 'day_vote') ? p.votedFor : null
      };
    });
    return sanitized;
  }

  function getFullLoupGarouState(room, forNickname) {
    const viewer = room.players[forNickname];
    const isAlive = viewer ? viewer.isAlive : false;
    
    let privateActionData = null;
    if (viewer && isAlive) {
      if (viewer.role === 'voyante' && room.nightState.seerTarget) {
        const target = room.players[room.nightState.seerTarget];
        privateActionData = {
          seerTarget: room.nightState.seerTarget,
          seerTargetRole: target ? target.role : null
        };
      }
      else if (viewer.role === 'sorciere' && room.status === 'night_sorciere') {
        privateActionData = {
          wolfTarget: room.nightState.wolfTarget,
          hasHealPotion: !room.nightState.witchHealed,
          hasKillPotion: !room.nightState.witchKilled
        };
      }
      else if (viewer.role === 'loup' && room.status === 'night_loup') {
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
      else if (viewer.role === 'voleur' && room.status === 'night_voleur') {
        privateActionData = {
          voleurMiddleCards: room.voleurMiddleCards || []
        };
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
      room.historyLogs.push(`🐺 ${wolfVictim} a été dévoré par les Loups-Garous.`);
    }

    // Check Witch kill
    const witchVictim = room.nightState.witchKilledThisTurn;
    if (witchVictim) {
      room.players[witchVictim].isAlive = false;
      room.historyLogs.push(`🧪 ${witchVictim} a été empoisonné par la Sorcière.`);
    }

    if (!wolfVictimDied && !witchVictim) {
      room.historyLogs.push(`🌅 Une nuit calme s'achève. Personne n'est mort cette nuit !`);
    }

    // Lovers (Cupidon Couple) check
    if (room.nightState.lovers.length === 2) {
      const [loverA, loverB] = room.nightState.lovers;
      if (!room.players[loverA].isAlive && room.players[loverB].isAlive) {
        room.players[loverB].isAlive = false;
        room.historyLogs.push(`💔 ${loverB} s'est suicidé par chagrin d'amour pour ${loverA}.`);
      } else if (!room.players[loverB].isAlive && room.players[loverA].isAlive) {
        room.players[loverA].isAlive = false;
        room.historyLogs.push(`💔 ${loverA} s'est suicidé par chagrin d'amour pour ${loverB}.`);
      }
    }

    // Check if Hunter died and has a shot pending
    let hunterShotPending = false;
    if (room.rolesConfig.chasseur) {
      Object.values(room.players).forEach(p => {
        if (p.role === 'chasseur' && !p.isAlive && !p.hasShot) {
          room.status = 'day_hunter';
          room.hunterPendingNickname = p.nickname;
          hunterShotPending = true;
          room.historyLogs.push(`🎯 Le Chasseur (${p.nickname}) va rendre son dernier soupir. Il charge son fusil !`);
        }
      });
    }

    if (!hunterShotPending) {
      room.status = 'day_vote';
      checkLoupGarouWin(room);
    }
  }

  function checkLoupGarouWin(room) {
    const alivePlayers = Object.values(room.players).filter(p => p.isAlive);
    const aliveWolves = alivePlayers.filter(p => p.role === 'loup');
    const aliveVillagers = alivePlayers.filter(p => p.role !== 'loup');

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
          room.historyLogs.push(`🏆 Victoire Royale ! Les Amoureux (${loverA} et ${loverB}) remportent la partie !`);
          return true;
        }
      }
    }

    if (aliveWolves.length === 0) {
      room.status = 'game_over';
      room.winner = 'villageois';
      room.historyLogs.push(`🏆 Victoire du Village ! Tous les Loups-Garous ont été éliminés.`);
      return true;
    }

    if (aliveWolves.length >= aliveVillagers.length) {
      room.status = 'game_over';
      room.winner = 'loups';
      room.historyLogs.push(`🏆 Victoire des Loups-Garous ! Ils ont dévoré tout le village.`);
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
        const { nickname } = JSON.parse(body);
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
            [name]: { nickname: name, role: 'simple_villageois', votedFor: null, isAlive: true, isConnected: true, coupleId: null, hasShot: false }
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
        const { roomId, nickname } = JSON.parse(body);
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
          console.log(`Player ${name} reconnected to Loup-Garou room ${id}`);
          broadcastLoupGarouState(room);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, roomId: id, nickname: name }));
        }

        if (room.status !== 'lobby') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Partie déjà commencée' }));
        }

        room.players[name] = { nickname: name, role: 'simple_villageois', votedFor: null, isAlive: true, isConnected: true, coupleId: null, hasShot: false };
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
        const config = room.rolesConfig || {};
        let activeCards = config.activeCards || ['loup', 'simple_villageois'];

        if (activeCards.length !== playersList.length) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: `Le nombre de cartes sélectionnées (${activeCards.length}) doit être exactement égal au nombre de joueurs (${playersList.length}) !` }));
        }

        let rolesPool = [...activeCards];

        // Shuffle roles
        for (let i = rolesPool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [rolesPool[i], rolesPool[j]] = [rolesPool[j], rolesPool[i]];
        }

        // Assign roles
        playersList.forEach((name, index) => {
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
        room.historyLogs = [`🌒 La Nuit n°1 tombe sur le village... Tout le monde s'endort.`];
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

        const p = room.players[nickname];
        if (!p || !p.isAlive) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Action impossible ou joueur éliminé' }));
        }

        if (actionType === 'voleur' && p.role === 'voleur' && room.currentNight === 1) {
          if (targetName && room.voleurMiddleCards && room.voleurMiddleCards.includes(targetName)) {
            const originalRole = p.role;
            p.role = targetName;
            const idx = room.voleurMiddleCards.indexOf(targetName);
            if (idx !== -1) {
              room.voleurMiddleCards[idx] = originalRole;
            }
            room.historyLogs.push(`🪶 Le Voleur a choisi d'échanger sa carte.`);
          } else {
            room.historyLogs.push(`🪶 Le Voleur a choisi de garder sa carte.`);
          }
          room.nightActionsPerformed.push('voleur');
          advanceLoupGarouNight(room);
        }
        else if (actionType === 'cupidon' && p.role === 'cupidon' && room.currentNight === 1) {
          if (targetName && targetName2) {
            room.nightState.lovers = [targetName, targetName2];
            room.players[targetName].coupleId = 'couple_1';
            room.players[targetName2].coupleId = 'couple_1';
            room.historyLogs.push(`💘 Cupidon a lié deux cœurs d'un amour indestructible.`);
          }
          room.nightActionsPerformed.push('cupidon');
          advanceLoupGarouNight(room);
        }
        else if (actionType === 'garde' && p.role === 'garde') {
          room.nightState.protectedPlayer = targetName;
          room.nightActionsPerformed.push('garde');
          advanceLoupGarouNight(room);
        }
        else if (actionType === 'voyante' && p.role === 'voyante') {
          room.nightState.seerTarget = targetName;
          room.nightActionsPerformed.push('voyante');
          advanceLoupGarouNight(room);
        }
        else if (actionType === 'loup' && p.role === 'loup') {
          p.votedFor = targetName;
          
          const aliveWolves = Object.values(room.players).filter(pl => pl.role === 'loup' && pl.isAlive);
          const votes = {};
          let votesCount = 0;
          aliveWolves.forEach(w => {
            if (w.votedFor) {
              votes[w.votedFor] = (votes[w.votedFor] || 0) + 1;
              votesCount++;
            }
          });
          
          if (votesCount >= aliveWolves.length) {
            let consensusTarget = null;
            Object.keys(votes).forEach(target => {
              if (votes[target] >= aliveWolves.length / 2) {
                consensusTarget = target;
              }
            });
            
            if (consensusTarget) {
              room.nightState.wolfTarget = consensusTarget;
              room.nightActionsPerformed.push('loup');
              advanceLoupGarouNight(room);
            }
          }
        }
        else if (actionType === 'sorciere_heal' && p.role === 'sorciere') {
          room.nightState.witchHealed = true;
          room.nightState.witchHealedThisTurn = true;
        }
        else if (actionType === 'sorciere_kill' && p.role === 'sorciere') {
          room.nightState.witchKilled = true;
          room.nightState.witchKilledThisTurn = targetName;
        }
        else if (actionType === 'sorciere_skip' && p.role === 'sorciere') {
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
          room.historyLogs.push(`💥 PAN ! Le Chasseur venge sa mort en éliminant ${targetName}.`);

          // Couple suicide checks
          if (room.nightState.lovers.length === 2) {
            const [loverA, loverB] = room.nightState.lovers;
            if (!room.players[loverA].isAlive && room.players[loverB].isAlive) {
              room.players[loverB].isAlive = false;
              room.historyLogs.push(`💔 ${loverB} s'est suicidé par chagrin d'amour pour ${loverA}.`);
            } else if (!room.players[loverB].isAlive && room.players[loverA].isAlive) {
              room.players[loverA].isAlive = false;
              room.historyLogs.push(`💔 ${loverA} s'est suicidé par chagrin d'amour pour ${loverB}.`);
            }
          }
        }

        room.status = 'day_vote';
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
            voteCounts[p.votedFor] = (voteCounts[p.votedFor] || 0) + 1;
          }
        });

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
          room.historyLogs.push(`🌅 Le village n'a désigné aucun coupable lors du conseil municipal.`);
        } else {
          // Eliminate
          room.players[selectedChoice].isAlive = false;
          room.historyLogs.push(`⚖️ Le conseil du village a voté l'élimination de ${selectedChoice} (était : ${room.players[selectedChoice].role.toUpperCase()}).`);

          // Lovers couple check
          if (room.nightState.lovers.length === 2) {
            const [loverA, loverB] = room.nightState.lovers;
            if (!room.players[loverA].isAlive && room.players[loverB].isAlive) {
              room.players[loverB].isAlive = false;
              room.historyLogs.push(`💔 ${loverB} s'est suicidé par chagrin d'amour pour ${loverA}.`);
            } else if (!room.players[loverB].isAlive && room.players[loverA].isAlive) {
              room.players[loverA].isAlive = false;
              room.historyLogs.push(`💔 ${loverA} s'est suicidé par chagrin d'amour pour ${loverB}.`);
            }
          }
        }

        // Check Hunter
        let hunterShotPending = false;
        if (room.rolesConfig.chasseur) {
          Object.values(room.players).forEach(p => {
            if (p.role === 'chasseur' && !p.isAlive && !p.hasShot) {
              room.status = 'day_hunter';
              room.hunterPendingNickname = p.nickname;
              hunterShotPending = true;
              room.historyLogs.push(`🎯 Le Chasseur (${p.nickname}) charge son fusil avant de mourir !`);
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
            room.historyLogs.push(`🌒 La nuit n°${room.currentNight} retombe sur le village de Thiercelieux...`);
            
            // Clean temp states
            room.nightState.protectedPlayer = null;
            room.nightState.seerTarget = null;
            room.nightState.wolfTarget = null;
            room.nightState.witchHealedThisTurn = false;
            room.nightState.witchKilledThisTurn = null;

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
      if (nickname && room.players[nickname]) {
        room.players[nickname].isConnected = true;
        console.log(`Player ${nickname} marked connected in Imposteur room ${roomId}`);
        
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
      if (nickname && room.players[nickname]) {
        room.players[nickname].isConnected = true;
        console.log(`Player ${nickname} marked connected in Loup-Garou room ${roomId}`);
        broadcastLoupGarouState(room);
      }
      res.write(`data: ${JSON.stringify({ 
        type: 'LOUP_GAROU_STATE', 
        state: getFullLoupGarouState(room, nickname)
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
        if (nickname && room.players[nickname]) {
          if (room.status === 'lobby') {
            delete room.players[nickname];
            console.log(`Player ${nickname} left Imposteur room ${roomId} (connection closed)`);
          } else {
            room.players[nickname].isConnected = false;
            console.log(`Player ${nickname} disconnected from Imposteur room ${roomId}`);
          }
          
          broadcast(room, {
            type: 'IMPOSTEUR_STATE',
            state: getFullImposteurState(room)
          });
        }
      } else if (room.gameType === 'geographie') {
        if (nickname && room.players[nickname] && room.status === 'lobby') {
          delete room.players[nickname];
          console.log(`Player ${nickname} left Geographie room ${roomId} (connection closed)`);
          broadcastGeoState(room);
        }
      } else if (room.gameType === 'loup_garou') {
        if (nickname && room.players[nickname]) {
          if (room.status === 'lobby') {
            delete room.players[nickname];
            console.log(`Player ${nickname} left Loup-Garou room ${roomId} (connection closed)`);
          } else {
            room.players[nickname].isConnected = false;
            console.log(`Player ${nickname} disconnected from Loup-Garou room ${roomId}`);
          }
          broadcastLoupGarouState(room);
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
