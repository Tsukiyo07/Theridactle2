// client/creasupdle-data.js - Roster & Dataset for Creasupdle
(function(window) {
  'use strict';

  // Base starter roster for Creasup (Graphistes, Concepteurs, DA, Motion, etc.)
  // Users can also add, edit or remove people directly from the in-game Trombinoscope!
  const DEFAULT_ROSTER = [
    {
      id: 'arthur-m',
      nom: 'Arthur',
      nomComplet: 'Arthur Mercier',
      surnom: 'Le Concepteur Fou',
      genre: 'Homme',
      cheveux: 'Brun',
      taille: 'Grand', // Grand (> 1m80), Moyen (1m70-1m80), Petit (< 1m70)
      role: 'Concepteur', // Graphiste, Concepteur, DA, Motion, etc.
      annee: 2023, // Année d'intégration
      age: 22,
      apparence: 'Beau', // Beau / Moche
      logiciel: 'Figma & Notion',
      punchline: '« Les gars, j\'ai une idée de concept incroyable à 3h du mat ! »',
      initiales: 'AM',
      avatarColor: '#6366f1'
    },
    {
      id: 'lea-b',
      nom: 'Léa',
      nomComplet: 'Léa Bernard',
      surnom: 'Vector Queen',
      genre: 'Femme',
      cheveux: 'Châtain',
      taille: 'Moyen',
      role: 'Graphiste',
      annee: 2022,
      age: 23,
      apparence: 'Beau',
      logiciel: 'Illustrator & InDesign',
      punchline: '« Ton texte n\'est pas aligné sur la grille de 8px, ça me stresse. »',
      initiales: 'LB',
      avatarColor: '#ec4899'
    },
    {
      id: 'lucas-d',
      nom: 'Lucas',
      nomComplet: 'Lucas Dupont',
      surnom: 'Dark Mode',
      genre: 'Homme',
      cheveux: 'Noir',
      taille: 'Grand',
      role: 'Graphiste',
      annee: 2024,
      age: 21,
      apparence: 'Beau',
      logiciel: 'Photoshop',
      punchline: '« Pourquoi utiliser des couleurs quand le noir et blanc existe ? »',
      initiales: 'LD',
      avatarColor: '#8b5cf6'
    },
    {
      id: 'camille-r',
      nom: 'Camille',
      nomComplet: 'Camille Roux',
      surnom: 'Pitch Master',
      genre: 'Femme',
      cheveux: 'Roux',
      taille: 'Petit',
      role: 'Concepteur',
      annee: 2021,
      age: 24,
      apparence: 'Beau',
      logiciel: 'Keynote & Miro',
      punchline: '« C\'est validé par le client, on ne touche plus à rien ! »',
      initiales: 'CR',
      avatarColor: '#f97316'
    },
    {
      id: 'maxime-g',
      nom: 'Maxime',
      nomComplet: 'Maxime Garnier',
      surnom: 'Le Boss du Render',
      genre: 'Homme',
      cheveux: 'Blond',
      taille: 'Moyen',
      role: 'Motion Designer',
      annee: 2023,
      age: 23,
      apparence: 'Moche',
      logiciel: 'After Effects & Blender',
      punchline: '« Mon render plante encore à 99%, qui a éteint la multiprise ? »',
      initiales: 'MG',
      avatarColor: '#eab308'
    },
    {
      id: 'chloe-m',
      nom: 'Chloé',
      nomComplet: 'Chloé Martin',
      surnom: 'Typo Nazi',
      genre: 'Femme',
      cheveux: 'Brun',
      taille: 'Petit',
      role: 'Graphiste',
      annee: 2022,
      age: 22,
      apparence: 'Beau',
      logiciel: 'Fontself & Illustrator',
      punchline: '« Si tu touches au kerning de ce titre, je te bloque. »',
      initiales: 'CM',
      avatarColor: '#06b6d4'
    },
    {
      id: 'valentin-p',
      nom: 'Valentin',
      nomComplet: 'Valentin Petit',
      surnom: 'Caféine Pure',
      genre: 'Homme',
      cheveux: 'Chauve',
      taille: 'Grand',
      role: 'Concepteur',
      annee: 2020,
      age: 25,
      apparence: 'Moche',
      logiciel: 'Google Docs',
      punchline: '« J\'en suis à mon sixième espresso de la matinée. »',
      initiales: 'VP',
      avatarColor: '#10b981'
    },
    {
      id: 'sarah-k',
      nom: 'Sarah',
      nomComplet: 'Sarah Klein',
      surnom: 'Moodboard Addict',
      genre: 'Femme',
      cheveux: 'Noir',
      taille: 'Moyen',
      role: 'DA (Direction Artistique)',
      annee: 2021,
      age: 24,
      apparence: 'Beau',
      logiciel: 'Pinterest & Figma',
      punchline: '« J\'ai 450 épingles pour ce projet, on commence quand ? »',
      initiales: 'SK',
      avatarColor: '#a855f7'
    },
    {
      id: 'theo-v',
      nom: 'Théo',
      nomComplet: 'Théo Vincent',
      surnom: 'Ctrl+Z Man',
      genre: 'Homme',
      cheveux: 'Châtain',
      taille: 'Petit',
      role: 'Graphiste',
      annee: 2024,
      age: 20,
      apparence: 'Moche',
      logiciel: 'Photoshop',
      punchline: '« J\'ai écrasé la maquette finale sans faire de backup... »',
      initiales: 'TV',
      avatarColor: '#ef4444'
    },
    {
      id: 'emma-f',
      nom: 'Emma',
      nomComplet: 'Emma Favre',
      surnom: 'Copywriter Légendaire',
      genre: 'Femme',
      cheveux: 'Blond',
      taille: 'Grand',
      role: 'Concepteur',
      annee: 2023,
      age: 22,
      apparence: 'Beau',
      logiciel: 'Notion',
      punchline: '« En 3 mots : audacieux, disruptif, incontournable. »',
      initiales: 'EF',
      avatarColor: '#14b8a6'
    },
    {
      id: 'alexandre-l',
      nom: 'Alexandre',
      nomComplet: 'Alexandre Leroy',
      surnom: 'Pixel Perfect',
      genre: 'Homme',
      cheveux: 'Brun',
      taille: 'Moyen',
      role: 'Graphiste',
      annee: 2022,
      age: 23,
      apparence: 'Beau',
      logiciel: 'Illustrator',
      punchline: '« Le bleu marine c\'est le nouveau noir, faites-moi confiance. »',
      initiales: 'AL',
      avatarColor: '#3b82f6'
    },
    {
      id: 'manon-d',
      nom: 'Manon',
      nomComplet: 'Manon Dubois',
      surnom: 'Brand Whisperer',
      genre: 'Femme',
      cheveux: 'Brun',
      taille: 'Petit',
      role: 'Concepteur',
      annee: 2024,
      age: 21,
      apparence: 'Moche',
      logiciel: 'Canva (en cachette)',
      punchline: '« Ne dites à personne que j\'ai ouvert Canva hier soir. »',
      initiales: 'MD',
      avatarColor: '#f43f5e'
    },
    {
      id: 'julien-c',
      nom: 'Julien',
      nomComplet: 'Julien Caron',
      surnom: 'Keyframer',
      genre: 'Homme',
      cheveux: 'Blond',
      taille: 'Grand',
      role: 'Motion Designer',
      annee: 2021,
      age: 25,
      apparence: 'Beau',
      logiciel: 'Cinema 4D & Octane',
      punchline: '« La courbe de Bézier doit être plus élastique, regarde ce rebond ! »',
      initiales: 'JC',
      avatarColor: '#f59e0b'
    },
    {
      id: 'ines-b',
      nom: 'Inès',
      nomComplet: 'Inès Benali',
      surnom: 'Trendsetter',
      genre: 'Femme',
      cheveux: 'Noir',
      taille: 'Moyen',
      role: 'DA (Direction Artistique)',
      annee: 2023,
      age: 22,
      apparence: 'Beau',
      logiciel: 'Figma',
      punchline: '« Le néomorphisme c\'est fini, maintenant on fait du brutaliste chic. »',
      initiales: 'IB',
      avatarColor: '#8b5cf6'
    },
    {
      id: 'nathan-m',
      nom: 'Nathan',
      nomComplet: 'Nathan Morel',
      surnom: 'Le Stratège',
      genre: 'Homme',
      cheveux: 'Châtain',
      taille: 'Moyen',
      role: 'Concepteur',
      annee: 2022,
      age: 24,
      apparence: 'Moche',
      logiciel: 'Excel & PowerPoint',
      punchline: '« Le ROI de ce visuel n\'est pas prouvé par nos métriques. »',
      initiales: 'NM',
      avatarColor: '#64748b'
    },
    {
      id: 'oceane-p',
      nom: 'Océane',
      nomComplet: 'Océane Perrin',
      surnom: 'Color Palette Guru',
      genre: 'Femme',
      cheveux: 'Coloré',
      taille: 'Petit',
      role: 'Graphiste',
      annee: 2024,
      age: 20,
      apparence: 'Beau',
      logiciel: 'Coolors & Photoshop',
      punchline: '« Mes cheveux changent de couleur au même rythme que mes dégradés. »',
      initiales: 'OP',
      avatarColor: '#06b6d4'
    },
    {
      id: 'romain-t',
      nom: 'Romain',
      nomComplet: 'Romain Tessier',
      surnom: 'Dev Créatif',
      genre: 'Homme',
      cheveux: 'Brun',
      taille: 'Grand',
      role: 'Développeur / Tech',
      annee: 2021,
      age: 26,
      apparence: 'Moche',
      logiciel: 'VS Code & Three.js',
      punchline: '« Ton Figma est super beau mais c\'est impossible à coder en CSS. »',
      initiales: 'RT',
      avatarColor: '#10b981'
    },
    {
      id: 'clara-h',
      nom: 'Clara',
      nomComplet: 'Clara Henry',
      surnom: 'Storyteller',
      genre: 'Femme',
      cheveux: 'Châtain',
      taille: 'Moyen',
      role: 'Concepteur',
      annee: 2023,
      age: 23,
      apparence: 'Beau',
      logiciel: 'Notion & Scrivener',
      punchline: '« Chaque marque a une âme, il suffit de trouver le bon ton. »',
      initiales: 'CH',
      avatarColor: '#a855f7'
    },
    {
      id: 'gabriel-s',
      nom: 'Gabriel',
      nomComplet: 'Gabriel Simon',
      surnom: 'Mockup Hunter',
      genre: 'Homme',
      cheveux: 'Noir',
      taille: 'Moyen',
      role: 'Graphiste',
      annee: 2022,
      age: 22,
      apparence: 'Beau',
      logiciel: 'Yellow Images & PS',
      punchline: '« 80% du design c\'est un mockup de packaging en haute définition. »',
      initiales: 'GS',
      avatarColor: '#6366f1'
    },
    {
      id: 'zoe-b',
      nom: 'Zoé',
      nomComplet: 'Zoé Blanchard',
      surnom: 'Sprint Master',
      genre: 'Femme',
      cheveux: 'Blond',
      taille: 'Grand',
      role: 'Concepteur',
      annee: 2024,
      age: 21,
      apparence: 'Moche',
      logiciel: 'Trello & Miro',
      punchline: '« On a 48h de charrette, apportez des pizzas et des boissons énergisantes. »',
      initiales: 'ZB',
      avatarColor: '#e11d48'
    }
  ];

  // Storage key
  const STORAGE_KEY = 'supercaraquiz_creasupdle_roster_v1';
  const STATS_STORAGE_KEY = 'supercaraquiz_creasupdle_stats_v1';

  // Retrieve current active roster (custom + defaults)
  function getCreasupdleRoster() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to read Creasupdle roster from storage', e);
    }
    return DEFAULT_ROSTER.slice();
  }

  // Save full roster to storage
  function saveCreasupdleRoster(roster) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
    } catch (e) {
      console.error('Failed to save Creasupdle roster', e);
    }
  }

  // Add or update a person
  function saveMember(member) {
    const roster = getCreasupdleRoster();
    const idx = roster.findIndex(m => m.id === member.id);
    if (idx >= 0) {
      roster[idx] = { ...roster[idx], ...member };
    } else {
      if (!member.id) {
        member.id = 'custom-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
      }
      roster.push(member);
    }
    saveCreasupdleRoster(roster);
    return roster;
  }

  // Delete a person by ID
  function deleteMember(id) {
    let roster = getCreasupdleRoster();
    roster = roster.filter(m => m.id !== id);
    if (roster.length === 0) {
      roster = DEFAULT_ROSTER.slice();
    }
    saveCreasupdleRoster(roster);
    return roster;
  }

  // Reset to default roster
  function resetRoster() {
    saveCreasupdleRoster(DEFAULT_ROSTER.slice());
    return DEFAULT_ROSTER.slice();
  }

  // Stats storage
  function getCreasupdleStats() {
    try {
      const raw = localStorage.getItem(STATS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      played: 0,
      won: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, '6+': 0 }
    };
  }

  function recordCreasupdleWin(guessCount) {
    const stats = getCreasupdleStats();
    stats.played += 1;
    stats.won += 1;
    stats.currentStreak += 1;
    if (stats.currentStreak > stats.maxStreak) stats.maxStreak = stats.currentStreak;
    const key = guessCount <= 5 ? String(guessCount) : '6+';
    stats.guessDistribution[key] = (stats.guessDistribution[key] || 0) + 1;
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {}
    return stats;
  }

  // Expose to global window
  window.CREASUPDLE = {
    DEFAULT_ROSTER,
    getRoster: getCreasupdleRoster,
    saveRoster: saveCreasupdleRoster,
    saveMember,
    deleteMember,
    resetRoster,
    getStats: getCreasupdleStats,
    recordWin: recordCreasupdleWin
  };

})(window);
