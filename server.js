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
        const { roomId, theme, descriptionRounds } = JSON.parse(body);
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
        
        // Randomly swap civil and impostor roles
        const shouldSwap = Math.random() < 0.5;
        const civilWord = shouldSwap ? pair.impostor : pair.civil;
        const impostorWord = shouldSwap ? pair.civil : pair.impostor;

        playersList.forEach(name => {
          const p = room.players[name];
          p.isEliminated = false;
          p.votedFor = null;
          p.description = '';
          if (name === impostorName) {
            p.isImpostor = true;
            p.word = impostorWord;
          } else {
            p.isImpostor = false;
            p.word = civilWord;
          }
        });
        
        room.civilWord = civilWord;
        room.impostorWord = impostorWord;
        room.impostorNickname = impostorName;
        room.status = 'playing';
        room.theme = theme;
        room.winner = null;
        
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
        
        console.log(`Imposteur Game started in room ${roomId}. Impostor is ${impostorName}. Word A: ${pair.civil}, Word B: ${pair.impostor}`);
        
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
  
  // Guard: check if there's any active player who is both connected and not eliminated
  const hasConnectedActivePlayer = Object.values(room.players).some(p => p.isConnected !== false && !p.isEliminated);
  if (!hasConnectedActivePlayer) {
    console.log(`No active connected players in room ${room.roomId}. Stopping turn skip recursion.`);
    return;
  }
  
  const activePlayerName = room.turnOrder[room.currentTurnIndex];
  const activePlayer = room.players[activePlayerName];
  
  if (!activePlayer || activePlayer.isConnected === false || activePlayer.isEliminated) {
    console.log(`Skipping player ${activePlayerName} because they are offline or eliminated`);
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
      room.currentTurnIndex = 0;
      console.log(`Advancing to description round ${room.currentDescriptionRound} in room ${room.roomId}`);
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
          
          if (eliminatedPlayer.isImpostor) {
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
          } else {
            const remainingPlayers = Object.values(room.players).filter(p => !p.isEliminated);
            const remainingImpostors = remainingPlayers.filter(p => p.isImpostor);
            
            if (remainingImpostors.length > 0 && remainingPlayers.length <= 2) {
              room.status = 'game_over';
              room.winner = 'impostor';
              
              // Score system: +3 for the impostor
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

  // Change Imposteur Settings (Description rounds)
  if (parsedUrl.pathname === '/api/imposteur/settings' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { roomId, descriptionRounds } = JSON.parse(body);
        const room = rooms[roomId];
        if (!room || room.gameType !== 'imposteur') {
          res.writeHead(404); return res.end();
        }
        if (descriptionRounds) {
          room.descriptionRounds = parseInt(descriptionRounds) || 1;
        }
        console.log(`Imposteur room ${roomId} set description rounds to ${room.descriptionRounds}`);
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
            if (room.turnOrder[room.currentTurnIndex] === nickname) {
              checkAndAdvanceTurnIfOffline(room);
            }
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
