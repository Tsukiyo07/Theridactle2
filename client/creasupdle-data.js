// client/creasupdle-data.js - Roster & Dataset for Creasupdle
(function(window) {
  'use strict';

  // Base starter roster for Creasupdle (Promo Alfred Grévin)
  // Users can also add, edit or remove people directly from the in-game Trombinoscope!
  const DEFAULT_ROSTER = [
    {
      id: 'tibo',
      nom: 'Tibo',
      nomComplet: 'Tibo',
      surnom: 'Graph & Ancien',
      genre: 'Homme',
      situation: 'Célibataire',
      orientation: 'Hétéro',
      cheveux: 'Marron',
      taille: '1m73',
      role: 'Graph, Ancien',
      promo: 'Alfred Grévin',
      age: 21,
      initiales: 'TB',
      avatarColor: '#6366f1',
      punchline: '« Toujours dans la place, le graphisme dans le sang ! »'
    },
    {
      id: 'clement',
      nom: 'Clément',
      nomComplet: 'Clément',
      surnom: 'Le Graph Suspicieux',
      genre: 'Homme',
      situation: 'Célibataire',
      orientation: 'Suspicieux',
      cheveux: 'Châtain',
      taille: '1m71',
      role: 'Graph',
      promo: 'Alfred Grévin',
      age: 21,
      initiales: 'CL',
      avatarColor: '#8b5cf6',
      punchline: '« T\'as l\'air bien suspicieux toi... »'
    },
    {
      id: 'charlelie',
      nom: 'Charlélie',
      nomComplet: 'Charlélie',
      surnom: 'Dev Polyvalent',
      genre: 'Homme',
      situation: 'Couple',
      orientation: 'Polyvalent',
      cheveux: 'Châtain, Blond',
      taille: '1m70',
      role: 'Dev',
      promo: 'Alfred Grévin',
      age: 22,
      initiales: 'CH',
      avatarColor: '#06b6d4',
      punchline: '« Tout est codé, tout est polyvalent ! »'
    },
    {
      id: 'theo',
      nom: 'Théo',
      nomComplet: 'Théo',
      surnom: 'L\'Ancien Polyvalent',
      genre: 'Homme',
      situation: 'Célibataire',
      orientation: 'Polyvalent',
      cheveux: 'Marron',
      taille: '1m73',
      role: 'Ancien',
      promo: 'Alfred Grévin',
      age: 21,
      initiales: 'TH',
      avatarColor: '#10b981',
      punchline: '« Un vrai ancien sait toujours s\'adapter. »'
    },
    {
      id: 'ethan',
      nom: 'Ethan',
      nomComplet: 'Ethan',
      surnom: 'Le Grand Ancien',
      genre: 'Homme',
      situation: 'Couple',
      orientation: 'Hétéro',
      cheveux: 'Marron',
      taille: '1m82',
      role: 'Graph, Ancien',
      promo: 'Alfred Grévin',
      age: 21,
      initiales: 'ET',
      avatarColor: '#f59e0b',
      punchline: '« 1m82 au compteur, du haut de mon expérience ! »'
    }
  ];

  // Storage key bumped to v3 to refresh active roster
  const STORAGE_KEY = 'supercaraquiz_creasupdle_roster_v3';
  const STATS_STORAGE_KEY = 'supercaraquiz_creasupdle_stats_v3';

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
