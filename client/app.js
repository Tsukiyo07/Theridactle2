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
let currentEventSource = null;
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
  currentTurnIndex: 0,
  gameId: null
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
let loupGarouVoteInterval = null;

// Loup-Garou State
let loupGarouState = {
  nickname: '',
  roomId: '',
  isHost: false,
  status: 'lobby',
  players: {},
  historyLogs: [],
  rolesConfig: {},
  myRole: null,
  myAlive: false,
  myCouple: false,
  nightState: {},
  winner: null,
  privateActionData: null
};

// Profile State
let currentProfile = { nickname: '', avatar: '🦖', avatarIsPhoto: false };

// Stats View State
let statsViewState = { game: 'all', period: 'week' };

// Load profile from localStorage on startup
function loadProfile() {
  const saved = localStorage.getItem('caraQuiz-profile');
  if (saved) {
    try { currentProfile = JSON.parse(saved); } catch(e) {}
  }
}

// ==========================================
// MODERN FLAT DESIGN VECTOR AVATARS LIBRARY
// ==========================================

const FLAT_AVATARS = {
  dino: {
    id: 'dino',
    name: 'Dino Rex',
    svg: `<svg width="100%" height="100%" viewBox="0 0 100 100" style="display:block;border-radius:50%;" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g_dino" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="#10B981"/><stop offset="1" stop-color="#047857"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g_dino)"/><path d="M68 32c0-8-6-14-14-14H38c-4 0-8 4-8 8v16c0 6 5 11 11 11h3v6c0 3 2 5 5 5h14c3 0 5-2 5-5v-7h-5c-2 0-3-1-3-3v-4h10c4 0 8-4 8-8V32z" fill="#D1FAE5"/><circle cx="44" cy="28" r="3.5" fill="#065F46"/><path d="M40 42h8c2 0 3-1 3-3s-1-3-3-3h-8c-2 0-3 1-3 3s1 3 3 3z" fill="#059669"/><path d="M30 38l-6 4 6 4V38zM30 26l-6 4 6 4V26z" fill="#34D399"/><circle cx="68" cy="62" r="7" fill="#6EE7B7"/><circle cx="32" cy="68" r="5" fill="#6EE7B7"/></svg>`
  },
  astronaut: {
    id: 'astronaut',
    name: 'Cosmonaute',
    svg: `<svg width="100%" height="100%" viewBox="0 0 100 100" style="display:block;border-radius:50%;" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g_astro" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="#6366F1"/><stop offset="1" stop-color="#312E81"/></linearGradient><linearGradient id="g_visor" x1="28" y1="32" x2="72" y2="58" gradientUnits="userSpaceOnUse"><stop stop-color="#F43F5E"/><stop offset="0.5" stop-color="#FB923C"/><stop offset="1" stop-color="#FBBF24"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g_astro)"/><rect x="24" y="24" width="52" height="48" rx="20" fill="#FFFFFF"/><rect x="28" y="30" width="44" height="34" rx="14" fill="url(#g_visor)"/><path d="M34 36c4-3 10-4 18-4 3 0 7 1 10 2-8 1-16 4-22 9-3-3-5-5-6-7z" fill="#FFFFFF" fill-opacity="0.6"/><circle cx="20" cy="48" r="4" fill="#E0E7FF"/><circle cx="80" cy="48" r="4" fill="#E0E7FF"/><rect x="36" y="74" width="28" height="14" rx="6" fill="#C7D2FE"/><circle cx="50" cy="81" r="3" fill="#6366F1"/></svg>`
  },
  fox: {
    id: 'fox',
    name: 'Cyber Fox',
    svg: `<svg width="100%" height="100%" viewBox="0 0 100 100" style="display:block;border-radius:50%;" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g_fox" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="#F97316"/><stop offset="1" stop-color="#C2410C"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g_fox)"/><path d="M22 22l14 24-16 10 2-34zM78 22L64 46l16 10-2-34z" fill="#7C2D12"/><path d="M25 28l11 18-12 7 1-25zM75 28L64 46l12 7-1-25z" fill="#FED7AA"/><polygon points="50,78 18,48 50,28 82,48" fill="#FFEDD5"/><polygon points="50,78 30,52 50,40 70,52" fill="#EA580C"/><circle cx="38" cy="50" r="4" fill="#1C1917"/><circle cx="62" cy="50" r="4" fill="#1C1917"/><polygon points="50,74 44,66 56,66" fill="#1C1917"/></svg>`
  },
  ninja: {
    id: 'ninja',
    name: 'Shadow Ninja',
    svg: `<svg width="100%" height="100%" viewBox="0 0 100 100" style="display:block;border-radius:50%;" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g_ninja" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="#1E293B"/><stop offset="1" stop-color="#0F172A"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g_ninja)"/><circle cx="50" cy="50" r="34" fill="#020617"/><rect x="26" y="32" width="48" height="10" rx="3" fill="#EF4444"/><rect x="30" y="44" width="40" height="14" rx="4" fill="#FED7AA"/><circle cx="40" cy="51" r="3" fill="#0F172A"/><circle cx="60" cy="51" r="3" fill="#0F172A"/><path d="M36 48l8 2M64 48l-8 2" stroke="#0F172A" stroke-width="2" stroke-linecap="round"/><circle cx="50" cy="37" r="3" fill="#FEF2F2"/></svg>`
  },
  gamer: {
    id: 'gamer',
    name: 'VR Gamer',
    svg: `<svg width="100%" height="100%" viewBox="0 0 100 100" style="display:block;border-radius:50%;" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g_gamer" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="#06B6D4"/><stop offset="1" stop-color="#0E7490"/></linearGradient><linearGradient id="g_vr" x1="20" y1="36" x2="80" y2="60" gradientUnits="userSpaceOnUse"><stop stop-color="#1E1B4B"/><stop offset="1" stop-color="#312E81"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g_gamer)"/><circle cx="50" cy="52" r="30" fill="#FDE047"/><rect x="22" y="38" width="56" height="24" rx="10" fill="url(#g_vr)"/><rect x="26" y="42" width="48" height="16" rx="6" fill="#06B6D4" fill-opacity="0.3"/><line x1="30" y1="50" x2="44" y2="50" stroke="#22D3EE" stroke-width="3" stroke-linecap="round"/><line x1="56" y1="50" x2="70" y2="50" stroke="#22D3EE" stroke-width="3" stroke-linecap="round"/><rect x="18" y="44" width="6" height="12" rx="2" fill="#0891B2"/><rect x="76" y="44" width="6" height="12" rx="2" fill="#0891B2"/><path d="M42 68c4 4 12 4 16 0" stroke="#713F12" stroke-width="3" stroke-linecap="round"/></svg>`
  },
  robot: {
    id: 'robot',
    name: 'Cyber Bot',
    svg: `<svg width="100%" height="100%" viewBox="0 0 100 100" style="display:block;border-radius:50%;" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g_bot" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="#14B8A6"/><stop offset="1" stop-color="#0F766E"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g_bot)"/><rect x="48" y="16" width="4" height="12" fill="#CCFBF1"/><circle cx="50" cy="16" r="4" fill="#F43F5E"/><rect x="24" y="28" width="52" height="46" rx="12" fill="#F0FDFA"/><rect x="32" y="36" width="36" height="20" rx="6" fill="#134E4A"/><circle cx="42" cy="46" r="4" fill="#2DD4BF"/><circle cx="58" cy="46" r="4" fill="#2DD4BF"/><line x1="36" y1="64" x2="64" y2="64" stroke="#0D9488" stroke-width="3" stroke-linecap="round" stroke-dasharray="4 3"/><rect x="18" y="44" width="6" height="14" rx="2" fill="#99F6E4"/><rect x="76" y="44" width="6" height="14" rx="2" fill="#99F6E4"/></svg>`
  },
  cat: {
    id: 'cat',
    name: 'Cool Cat',
    svg: `<svg width="100%" height="100%" viewBox="0 0 100 100" style="display:block;border-radius:50%;" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g_cat" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="#EC4899"/><stop offset="1" stop-color="#BE185D"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g_cat)"/><polygon points="26,44 22,18 44,30" fill="#831843"/><polygon points="74,44 78,18 56,30" fill="#831843"/><polygon points="26,40 24,24 40,32" fill="#F472B6"/><polygon points="74,40 76,24 60,32" fill="#F472B6"/><circle cx="50" cy="54" r="28" fill="#FDF2F8"/><rect x="28" y="44" width="44" height="14" rx="6" fill="#18181B"/><line x1="34" y1="48" x2="44" y2="48" stroke="#06B6D4" stroke-width="2"/><line x1="56" y1="48" x2="66" y2="48" stroke="#06B6D4" stroke-width="2"/><polygon points="50,64 46,60 54,60" fill="#EC4899"/><path d="M46 66c-2 3-5 3-7 1M54 66c2 3 5 3 7 1" stroke="#831843" stroke-width="2" stroke-linecap="round"/></svg>`
  },
  wizard: {
    id: 'wizard',
    name: 'Archimage',
    svg: `<svg width="100%" height="100%" viewBox="0 0 100 100" style="display:block;border-radius:50%;" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g_wiz" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="#8B5CF6"/><stop offset="1" stop-color="#5B21B6"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g_wiz)"/><circle cx="50" cy="56" r="22" fill="#FED7AA"/><path d="M28 58c0 14 10 24 22 24s22-10 22-24" fill="#EDE9FE"/><polygon points="50,12 24,46 76,46" fill="#4C1D95"/><ellipse cx="50" cy="46" rx="30" ry="6" fill="#6D28D9"/><circle cx="50" cy="30" r="4" fill="#FDE047"/><circle cx="42" cy="56" r="3" fill="#312E81"/><circle cx="58" cy="56" r="3" fill="#312E81"/><path d="M46 68l4 3 4-3" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round"/></svg>`
  },
  dragon: {
    id: 'dragon',
    name: 'Fire Dragon',
    svg: `<svg width="100%" height="100%" viewBox="0 0 100 100" style="display:block;border-radius:50%;" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g_drag" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="#EF4444"/><stop offset="1" stop-color="#991B1B"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g_drag)"/><path d="M28 20l6 18-14 4 8-22zM72 20l-6 18 14 4-8-22z" fill="#FDE047"/><circle cx="50" cy="54" r="28" fill="#B91C1C"/><polygon points="50,34 32,56 68,56" fill="#DC2626"/><circle cx="40" cy="52" r="4" fill="#FDE047"/><circle cx="60" cy="52" r="4" fill="#FDE047"/><circle cx="40" cy="52" r="2" fill="#000"/><circle cx="60" cy="52" r="2" fill="#000"/><circle cx="45" cy="66" r="2" fill="#450A0A"/><circle cx="55" cy="66" r="2" fill="#450A0A"/><path d="M38 72l6-4 6 4 6-4 6 4" stroke="#FEF08A" stroke-width="2" stroke-linecap="round"/></svg>`
  },
  king: {
    id: 'king',
    name: 'Monarque',
    svg: `<svg width="100%" height="100%" viewBox="0 0 100 100" style="display:block;border-radius:50%;" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g_king" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="#EAB308"/><stop offset="1" stop-color="#A16207"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g_king)"/><circle cx="50" cy="56" r="24" fill="#FED7AA"/><polygon points="26,38 32,24 50,32 68,24 74,38" fill="#FACC15" stroke="#CA8A04" stroke-width="2"/><circle cx="32" cy="24" r="3" fill="#EF4444"/><circle cx="50" cy="22" r="4" fill="#3B82F6"/><circle cx="68" cy="24" r="3" fill="#10B981"/><circle cx="42" cy="54" r="3" fill="#451A03"/><circle cx="58" cy="54" r="3" fill="#451A03"/><path d="M36 62c6 6 22 6 28 0" stroke="#78350F" stroke-width="4" stroke-linecap="round"/><path d="M44 68c3 2 9 2 12 0" stroke="#EF4444" stroke-width="2"/></svg>`
  },
  phoenix: {
    id: 'phoenix',
    name: 'Phoenix',
    svg: `<svg width="100%" height="100%" viewBox="0 0 100 100" style="display:block;border-radius:50%;" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g_phx" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="#FB923C"/><stop offset="1" stop-color="#EA580C"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g_phx)"/><path d="M50 14c-12 10-18 24-8 38-8-4-14-2-18 6 10 2 14 10 12 18 10-6 24-4 28 8 6-12 18-12 24-4-2-8 2-16 12-18-4-8-10-10-18-6 10-14 4-28-8-38-6 10-18 10-24-4z" fill="#FEF08A"/><polygon points="50,68 44,54 56,54" fill="#C2410C"/><circle cx="42" cy="46" r="3" fill="#7C2D12"/><circle cx="58" cy="46" r="3" fill="#7C2D12"/></svg>`
  },
  alien: {
    id: 'alien',
    name: 'Alien',
    svg: `<svg width="100%" height="100%" viewBox="0 0 100 100" style="display:block;border-radius:50%;" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g_aln" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="#84CC16"/><stop offset="1" stop-color="#4D7C0F"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g_aln)"/><path d="M50 20C32 20 22 36 26 54c4 16 18 26 24 26s20-10 24-26c4-18-6-34-24-34z" fill="#D9F99D"/><ellipse cx="38" cy="46" rx="8" ry="12" transform="rotate(-15 38 46)" fill="#0F172A"/><ellipse cx="62" cy="46" rx="8" ry="12" transform="rotate(15 62 46)" fill="#0F172A"/><circle cx="36" cy="42" r="3" fill="#FFFFFF"/><circle cx="60" cy="42" r="3" fill="#FFFFFF"/><circle cx="48" cy="64" r="1.5" fill="#365314"/><circle cx="52" cy="64" r="1.5" fill="#365314"/><line x1="44" y1="70" x2="56" y2="70" stroke="#365314" stroke-width="2" stroke-linecap="round"/></svg>`
  },
  skull: {
    id: 'skull',
    name: 'Cyber Skull',
    svg: `<svg width="100%" height="100%" viewBox="0 0 100 100" style="display:block;border-radius:50%;" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g_skl" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="#64748B"/><stop offset="1" stop-color="#334155"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g_skl)"/><path d="M50 20c-16 0-26 12-26 26 0 10 6 16 10 20v10h32V66c4-4 10-10 10-20 0-14-10-26-26-26z" fill="#F8FAFC"/><circle cx="40" cy="44" r="7" fill="#0EA5E9"/><circle cx="60" cy="44" r="7" fill="#0EA5E9"/><circle cx="40" cy="44" r="3" fill="#0F172A"/><circle cx="60" cy="44" r="3" fill="#0F172A"/><polygon points="50,56 46,62 54,62" fill="#475569"/><line x1="42" y1="70" x2="42" y2="76" stroke="#475569" stroke-width="2"/><line x1="50" y1="70" x2="50" y2="76" stroke="#475569" stroke-width="2"/><line x1="58" y1="70" x2="58" y2="76" stroke="#475569" stroke-width="2"/></svg>`
  },
  panda: {
    id: 'panda',
    name: 'Zen Panda',
    svg: `<svg width="100%" height="100%" viewBox="0 0 100 100" style="display:block;border-radius:50%;" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g_pnd" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="#10B981"/><stop offset="1" stop-color="#065F46"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g_pnd)"/><circle cx="28" cy="30" r="10" fill="#1E293B"/><circle cx="72" cy="30" r="10" fill="#1E293B"/><circle cx="50" cy="54" r="28" fill="#FFFFFF"/><ellipse cx="38" cy="50" rx="8" ry="10" transform="rotate(-15 38 50)" fill="#1E293B"/><ellipse cx="62" cy="50" rx="8" ry="10" transform="rotate(15 62 50)" fill="#1E293B"/><circle cx="38" cy="48" r="3" fill="#FFFFFF"/><circle cx="62" cy="48" r="3" fill="#FFFFFF"/><ellipse cx="50" cy="62" rx="4" ry="3" fill="#1E293B"/><path d="M46 66c2 2 6 2 8 0" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/></svg>`
  },
  wolf: {
    id: 'wolf',
    name: 'Moon Wolf',
    svg: `<svg width="100%" height="100%" viewBox="0 0 100 100" style="display:block;border-radius:50%;" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g_wlf" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="#3B82F6"/><stop offset="1" stop-color="#1D4ED8"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g_wlf)"/><polygon points="26,18 40,40 20,44" fill="#1E3A8A"/><polygon points="74,18 60,40 80,44" fill="#1E3A8A"/><polygon points="28,24 38,40 24,42" fill="#93C5FD"/><polygon points="72,24 62,40 76,42" fill="#93C5FD"/><polygon points="50,78 22,46 50,30 78,46" fill="#DBEAFE"/><polygon points="50,78 34,54 50,44 66,54" fill="#60A5FA"/><circle cx="38" cy="50" r="3" fill="#1E3A8A"/><circle cx="62" cy="50" r="3" fill="#1E3A8A"/><polygon points="50,72 44,64 56,64" fill="#1E3A8A"/></svg>`
  },
  tiger: {
    id: 'tiger',
    name: 'Cyber Tiger',
    svg: `<svg width="100%" height="100%" viewBox="0 0 100 100" style="display:block;border-radius:50%;" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g_tgr" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="#F59E0B"/><stop offset="1" stop-color="#B45309"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g_tgr)"/><circle cx="26" cy="32" r="9" fill="#78350F"/><circle cx="74" cy="32" r="9" fill="#78350F"/><circle cx="50" cy="54" r="28" fill="#FDE68A"/><polygon points="50,32 46,42 54,42" fill="#78350F"/><polygon points="34,36 38,44 32,44" fill="#78350F"/><polygon points="66,36 62,44 68,44" fill="#78350F"/><circle cx="38" cy="52" r="4" fill="#10B981"/><circle cx="62" cy="52" r="4" fill="#10B981"/><polygon points="50,66 45,60 55,60" fill="#78350F"/><path d="M44 68c3 3 9 3 12 0" stroke="#78350F" stroke-width="2" stroke-linecap="round"/></svg>`
  },
  hero: {
    id: 'hero',
    name: 'Super Hero',
    svg: `<svg width="100%" height="100%" viewBox="0 0 100 100" style="display:block;border-radius:50%;" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g_hero" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="#2563EB"/><stop offset="1" stop-color="#1E40AF"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g_hero)"/><circle cx="50" cy="54" r="26" fill="#FED7AA"/><path d="M26 38c0-12 10-18 24-18s24 6 24 18v8c-8-4-16-4-24-4s-16 0-24 4v-8z" fill="#EF4444"/><rect x="30" y="44" width="40" height="12" rx="4" fill="#1E293B"/><circle cx="40" cy="50" r="3" fill="#60A5FA"/><circle cx="60" cy="50" r="3" fill="#60A5FA"/><path d="M42 66c4 3 12 3 16 0" stroke="#9A3412" stroke-width="3" stroke-linecap="round"/></svg>`
  },
  knight: {
    id: 'knight',
    name: 'Paladin',
    svg: `<svg width="100%" height="100%" viewBox="0 0 100 100" style="display:block;border-radius:50%;" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g_knt" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="#94A3B8"/><stop offset="1" stop-color="#475569"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g_knt)"/><path d="M50 16l6 14-6 4-6-4 6-14z" fill="#EF4444"/><rect x="28" y="30" width="44" height="46" rx="14" fill="#E2E8F0"/><rect x="34" y="44" width="32" height="8" rx="2" fill="#0F172A"/><line x1="50" y1="40" x2="50" y2="68" stroke="#0F172A" stroke-width="3"/><line x1="38" y1="60" x2="62" y2="60" stroke="#64748B" stroke-width="2" stroke-dasharray="3 3"/></svg>`
  }
};

const EMOJI_TO_FLAT_KEY = {
  '🦖': 'dino',
  '👨‍🚀': 'astronaut',
  '🦊': 'fox',
  '🥷': 'ninja',
  '🎮': 'gamer',
  '🤖': 'robot',
  '🐱': 'cat',
  '🧙': 'wizard',
  '🐉': 'dragon',
  '👑': 'king',
  '🔥': 'phoenix',
  '👽': 'alien',
  '💀': 'skull',
  '🐼': 'panda',
  '🐺': 'wolf',
  '🐯': 'tiger',
  '🦸': 'hero',
  '⚔️': 'knight'
};

function renderAvatarHTML(avatar, isPhoto = false) {
  if (!avatar) {
    return FLAT_AVATARS.dino.svg;
  }
  if (isPhoto || (typeof avatar === 'string' && (avatar.startsWith('data:image/') || avatar.startsWith('http')))) {
    return `<img src="${escapeHtml(avatar)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;" alt="avatar">`;
  }
  const str = String(avatar).trim();
  const key = str.toLowerCase();
  
  if (FLAT_AVATARS[key]) {
    return FLAT_AVATARS[key].svg;
  }
  if (EMOJI_TO_FLAT_KEY[str] && FLAT_AVATARS[EMOJI_TO_FLAT_KEY[str]]) {
    return FLAT_AVATARS[EMOJI_TO_FLAT_KEY[str]].svg;
  }
  if (str.startsWith('<svg')) {
    return str;
  }
  const mapped = Object.values(FLAT_AVATARS).find(a => a.id === key || a.name.toLowerCase() === key);
  if (mapped) return mapped.svg;
  
  return FLAT_AVATARS.dino.svg;
}

function syncAllNicknameInputs(overrideNick) {
  const nick = overrideNick || (currentProfile ? currentProfile.nickname : '') || localStorage.getItem('last_user_nickname') || '';
  if (!nick) return;
  const inputIds = [
    'theridactle-player-nickname',
    'pokedactle-player-nickname',
    'pokecries-player-nickname',
    'merrydactle-player-nickname',
    'imposteur-player-nickname',
    'imposteur-nickname',
    'geographie-player-nickname',
    'geographie-nickname',
    'loup-garou-player-nickname',
    'loup-garou-nickname',
    'songless-player-nickname',
    'profile-nickname-input'
  ];
  inputIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = nick;
  });
}

function saveProfile(profile) {
  localStorage.setItem('caraQuiz-profile', JSON.stringify(profile));
  currentProfile = profile;
  updateNavAvatar();
  syncAllNicknameInputs();
}

function updateNavAvatar() {
  const navAvatarEl = document.getElementById('nav-profile-avatar');
  if (!navAvatarEl) return;

  const isLoggedIn = currentProfile && currentProfile.password;
  if (!isLoggedIn) {
    navAvatarEl.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 100 100" style="display:block;border-radius:50%;" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g_anon" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="#475569"/><stop offset="1" stop-color="#1e293b"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g_anon)"/><text x="50" y="67" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="700" fill="rgba(255,255,255,0.55)">?</text></svg>`;
    return;
  }

  const avatar = currentProfile.avatar;
  const isPhoto = currentProfile.avatarIsPhoto;
  navAvatarEl.innerHTML = renderAvatarHTML(avatar, isPhoto);
}

let geoTimeRemaining = 15;

// DOM Cache
const dom = {
  // Navigation & Core Views
  navLogo: document.getElementById('nav-logo'),
  navHome: document.getElementById('nav-home'),
  roomDisplay: document.getElementById('room-display'),
  roomCodeSpan: document.getElementById('room-code'),
  btnCopyInvite: document.getElementById('btn-copy-invite'),
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
  btnCreateRoom: document.getElementById('btn-create-room') || document.getElementById('btn-theri-create-room'),
  btnMerrydactleCreate: document.getElementById('btn-merrydactle-create'),
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
  impNicknameInput: document.getElementById('imposteur-player-nickname') || document.getElementById('imposteur-nickname'),
  impJoinCodeInput: document.getElementById('imposteur-join-code'),
  btnImpCreate: document.getElementById('btn-imposteur-create'),
  btnImpJoin: document.getElementById('btn-imposteur-join'),
  impMenuError: document.getElementById('imposteur-menu-error'),

  // Imposteur Game Controls
  impLobbyPanel: document.getElementById('imposteur-lobby-panel'),
  impThemeSelect: document.getElementById('imposteur-theme-select'),
  impImpostorCountSelect: document.getElementById('imposteur-count-select'),
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

  cardLoupGarou: document.getElementById('card-loup-garou'),
  btnBackLoupGarou: document.getElementById('btn-back-loup-garou'),
  lgMenuView: document.getElementById('loup-garou-menu-view'),
  lgGameView: document.getElementById('loup-garou-game-view'),

  // Songless
  cardSongless: document.getElementById('card-songless'),
  btnBackSongless: document.getElementById('btn-back-songless'),
  btnBackSonglessGame: document.getElementById('btn-back-songless-game'),
  songlessMenuView: document.getElementById('songless-menu-view'),
  songlessGameView: document.getElementById('songless-game-view'),

  // PokéCries
  cardPokecries: document.getElementById('card-pokecries'),
  btnBackPokecries: document.getElementById('btn-back-pokecries'),
  pokecriesMenuView: document.getElementById('pokecries-menu-view'),
  pokecriesGameView: document.getElementById('pokecries-game-view'),

  // Pokédactle
  cardPokedactle: document.getElementById('card-pokedactle'),
  btnBackPokedactle: document.getElementById('btn-back-pokedactle'),
  pokedactleMenuView: document.getElementById('pokedactle-menu-view'),
  pokedactleGameView: document.getElementById('pokedactle-game-view'),
  btnPokedactleSolo: document.getElementById('btn-pokedactle-solo'),
  btnPokedactleCreate: document.getElementById('btn-pokedactle-create'),
  btnPokedactleJoin: document.getElementById('btn-pokedactle-join'),
  pokedactleJoinInput: document.getElementById('pokedactle-join-input'),
  pokedactleMenuError: document.getElementById('pokedactle-menu-error'),
  pokedactleLoading: document.getElementById('pokedactle-loading'),
  pokedactleWinMessage: document.getElementById('pokedactle-win-message'),
  pokedactleArticleContent: document.getElementById('pokedactle-article-content'),
  pokedactleMainTitle: document.getElementById('pokedactle-main-title'),
  pokedactleWikiText: document.getElementById('pokedactle-wiki-text'),
  pokedactleSidebar: document.getElementById('pokedactle-sidebar'),
  btnPokedactleHint: document.getElementById('btn-pokedactle-hint'),
  pokedactleHintDropdown: document.getElementById('pokedactle-hint-dropdown'),
  pokedactleHintRevealWord: document.getElementById('pokedactle-hint-reveal-word'),
  btnPokedactleHintPhrase: document.getElementById('pokedactle-hint-phrase'),
  pokedactlePhraseHintContainer: document.getElementById('pokedactle-phrase-hint-container'),
  pokedactlePhraseHintText: document.getElementById('pokedactle-phrase-hint-text'),
  pokedactleHintCountTotal: document.getElementById('pokedactle-hint-count-total'),
  pokedactleHintCountWord: document.getElementById('pokedactle-hint-count-word'),
  btnPokedactleGiveUp: document.getElementById('btn-pokedactle-give-up'),
  btnPokedactleLeave: document.getElementById('pokedactle-leave-btn'),
  pokedactleGuessFormDesktop: document.getElementById('pokedactle-guess-form-desktop'),
  pokedactleGuessInputDesktop: document.getElementById('pokedactle-guess-input-desktop'),
  pokedactleGuessTotalDesktop: document.getElementById('pokedactle-guess-total-desktop'),
  pokedactleGuessList: document.getElementById('pokedactle-guess-list'),
  pokedactleGuessFormMobile: document.getElementById('pokedactle-guess-form-mobile'),
  pokedactleGuessInputMobile: document.getElementById('pokedactle-guess-input'),
  pokedactleGuessTotalMobile: document.getElementById('pokedactle-guess-total'),
  btnPokedactleScrollTop: document.getElementById('btn-pokedactle-scroll-top'),

  // Merrydactle
  cardMerrydactle: document.getElementById('card-merrydactle'),
  btnBackMerrydactle: document.getElementById('btn-back-merrydactle'),
  merrydactleMenuView: document.getElementById('merrydactle-menu-view'),
  merrydactleGameView: document.getElementById('merrydactle-game-view'),
  btnMerrydactleSolo: document.getElementById('btn-merrydactle-solo'),
  btnMerrydactleCreate: document.getElementById('btn-merrydactle-create'),
  btnMerrydactleJoin: document.getElementById('btn-merrydactle-join'),
  merrydactleJoinInput: document.getElementById('merrydactle-join-input'),
  merrydactleMenuError: document.getElementById('merrydactle-menu-error'),
  merrydactleLoading: document.getElementById('merrydactle-loading'),
  merrydactleWinMessage: document.getElementById('merrydactle-win-message'),
  merrydactleArticleContent: document.getElementById('merrydactle-article-content'),
  merrydactleMainTitle: document.getElementById('merrydactle-main-title'),
  merrydactleWikiText: document.getElementById('merrydactle-wiki-text'),
  merrydactleSidebar: document.getElementById('merrydactle-sidebar'),
  merrydactleMobileHandle: document.getElementById('merrydactle-mobile-handle'),
  btnMerrydactleHint: document.getElementById('btn-merrydactle-hint'),
  merrydactleHintDropdown: document.getElementById('merrydactle-hint-dropdown'),
  merrydactleHintRevealWord: document.getElementById('merrydactle-hint-reveal-word'),
  btnMerrydactleHintPhrase: document.getElementById('merrydactle-hint-phrase'),
  merrydactlePhraseHintContainer: document.getElementById('merrydactle-phrase-hint-container'),
  merrydactlePhraseHintText: document.getElementById('merrydactle-phrase-hint-text'),
  merrydactleHintCountTotal: document.getElementById('merrydactle-hint-count-total'),
  merrydactleHintCountWord: document.getElementById('merrydactle-hint-count-word'),
  btnMerrydactleGiveUp: document.getElementById('btn-merrydactle-give-up'),
  btnMerrydactleLeave: document.getElementById('merrydactle-leave-btn'),
  merrydactleGuessFormDesktop: document.getElementById('merrydactle-guess-form-desktop'),
  merrydactleGuessInputDesktop: document.getElementById('merrydactle-guess-input-desktop'),
  merrydactleGuessTotalDesktop: document.getElementById('merrydactle-guess-total-desktop'),
  merrydactleGuessList: document.getElementById('merrydactle-guess-list'),
  merrydactleGuessFormMobile: document.getElementById('merrydactle-guess-form-mobile'),
  merrydactleGuessInputMobile: document.getElementById('merrydactle-guess-input'),
  merrydactleGuessTotalMobile: document.getElementById('merrydactle-guess-total'),
  btnMerrydactleScrollTop: document.getElementById('btn-merrydactle-scroll-top'),
};

const views = {
  portal: dom.portalView,
  theriMenu: dom.theriMenuView,
  pokedactleMenu: document.getElementById('pokedactle-menu-view'),
  pokecriesMenu: document.getElementById('pokecries-menu-view'),
  merrydactleMenu: document.getElementById('merrydactle-menu-view'),
  songlessMenu: document.getElementById('songless-menu-view'),
  impMenu: dom.impMenuView,
  geoMenu: dom.geoMenuView,
  lgMenu: document.getElementById('loup-garou-menu-view'),
  statsMenu: document.getElementById('stats-view'),
  theriGame: dom.theriGameView,
  pokedactleGame: document.getElementById('pokedactle-game-view'),
  pokecriesGame: document.getElementById('pokecries-game-view'),
  merrydactleGame: document.getElementById('merrydactle-game-view'),
  songlessGame: document.getElementById('songless-game-view'),
  impGame: dom.impGameView,
  geoGame: dom.geoGameView,
  lgGame: document.getElementById('loup-garou-game-view')
};

// --- Room Top Nav Display Helper ---
function updateRoomDisplay(visible, code = '') {
  const topNav = document.querySelector('.top-nav');
  if (visible) {
    dom.roomDisplay.style.display = 'inline-flex';
    dom.roomCodeSpan.textContent = code;
    if (topNav) topNav.classList.add('in-room');
  } else {
    dom.roomDisplay.style.display = 'none';
    dom.roomCodeSpan.textContent = '';
    if (topNav) topNav.classList.remove('in-room');
  }
}

// --- View Router ---
function showView(viewName) {
  window.showView = showView;
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
  const menuViews = ['portal', 'theriMenu', 'pokedactleMenu', 'pokecriesMenu', 'merrydactleMenu', 'songlessMenu', 'impMenu', 'geoMenu', 'lgMenu', 'statsMenu'];
  if (menuViews.includes(viewName)) {
    if (dom.navHome) dom.navHome.classList.add('active');
    updateRoomDisplay(false);
    if (dom.btnLeaveNav) dom.btnLeaveNav.style.display = 'none';
    syncAllNicknameInputs();
  } else {
    if (dom.navHome) dom.navHome.classList.remove('active');
    if (dom.btnLeaveNav) dom.btnLeaveNav.style.display = 'none';
  }
}

// --- Vector SVG Icons for All Games ---
const GAME_SVG_ICONS = {
  theridactle: `<svg class="inline-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z"/></svg>`,
  pokedactle: `<svg class="inline-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h7m6 0h7"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>`,
  pokecries: `<svg class="inline-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`,
  merrydactle: `<svg class="inline-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l16 16M20 4L4 20"/><path d="M7.5 11v2a4.5 4.5 0 0 0 9 0v-2"/><circle cx="10" cy="13.5" r="1.2" fill="currentColor"/><circle cx="14" cy="13.5" r="1.2" fill="currentColor"/><path d="M9.8 16.5c1.4.8 3 0.8 4.4 0"/><path d="M7 10c0-3.5 2.2-5 5-5s5 1.5 5 5"/><path d="M7.2 9h9.6"/><path d="M2.5 10.5c3-1.8 16-1.8 19 0"/></svg>`,
  imposteur: `<svg class="inline-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11c-1.5 0-2.5.5-3 2"/><path d="M4 6a2 2 0 0 0-2 2v4a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V8a2 2 0 0 0-2-2h-3a8 8 0 0 0-5 2 8 8 0 0 0-5-2z"/><path d="M6 11c1.5 0 2.5.5 3 2"/></svg>`,
  geographie: `<svg class="inline-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
  loup_garou: `<svg class="inline-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 5h4"/><path d="M20 3v4"/><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>`,
  songless: `<svg class="inline-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`
};

// --- Global Custom Confirmation Modal ---
let confirmModalResolver = null;

function showConfirmModal({
  title = "Quitter la partie ?",
  message = "Voulez-vous vraiment quitter la partie en cours ?",
  icon = `<svg class="inline-svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
  confirmText = "Quitter",
  cancelText = "Rester"
} = {}) {
  return new Promise(resolve => {
    confirmModalResolver = resolve;
    const modal = document.getElementById('global-confirm-modal');
    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-modal-message');
    const iconEl = document.getElementById('confirm-modal-icon');
    const btnCancel = document.getElementById('confirm-modal-btn-cancel');
    const btnConfirm = document.getElementById('confirm-modal-btn-confirm');

    if (!modal) {
      return resolve(window.confirm(message));
    }

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    if (iconEl) {
      if (typeof icon === 'string' && icon.includes('<svg')) {
        iconEl.innerHTML = icon;
      } else {
        iconEl.textContent = icon;
      }
    }
    if (btnCancel) btnCancel.textContent = cancelText;
    if (btnConfirm) btnConfirm.textContent = confirmText;

    modal.style.display = 'flex';
    modal.classList.remove('fade-out');
    requestAnimationFrame(() => {
      modal.classList.add('active');
    });
  });
}

window.resolveConfirmModal = function(result) {
  const modal = document.getElementById('global-confirm-modal');
  if (modal) {
    modal.classList.add('fade-out');
    modal.classList.remove('active');
    setTimeout(() => {
      modal.style.display = 'none';
      modal.classList.remove('fade-out');
    }, 180);
  }
  if (typeof confirmModalResolver === 'function') {
    const fn = confirmModalResolver;
    confirmModalResolver = null;
    fn(result);
  }
};

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('global-confirm-modal');
    if (modal && modal.style.display !== 'none') {
      window.resolveConfirmModal(false);
    }
  }
});

// --- Leave Active Games ---
async function confirmLeave() {
  const isTheriActive = views.theriGame && !views.theriGame.classList.contains('view-hidden');
  const isPokedactleActive = views.pokedactleGame && !views.pokedactleGame.classList.contains('view-hidden');
  const isPokecriesActive = views.pokecriesGame && !views.pokecriesGame.classList.contains('view-hidden');
  const isMerrydactleActive = views.merrydactleGame && !views.merrydactleGame.classList.contains('view-hidden');
  const isSonglessActive = views.songlessGame && !views.songlessGame.classList.contains('view-hidden');
  const isImpActive = views.impGame && !views.impGame.classList.contains('view-hidden');
  const isGeoActive = views.geoGame && !views.geoGame.classList.contains('view-hidden');
  const isLgActive = views.lgGame && !views.lgGame.classList.contains('view-hidden');

  if (isTheriActive) {
    const confirmed = await showConfirmModal({
      title: "Quitter DinOtiste ?",
      message: "Voulez-vous vraiment quitter la partie en cours ?",
      icon: GAME_SVG_ICONS.theridactle
    });
    if (confirmed) leaveTheridactleRoom();
  } else if (isPokedactleActive) {
    const confirmed = await showConfirmModal({
      title: "Quitter PokemOtiste ?",
      message: "Voulez-vous vraiment quitter la partie de PokemOtiste en cours ?",
      icon: GAME_SVG_ICONS.pokedactle
    });
    if (confirmed) leavePokedactleRoom();
  } else if (isPokecriesActive) {
    const confirmed = await showConfirmModal({
      title: "Quitter Ahhhhhh ?",
      message: "Voulez-vous vraiment quitter la partie de blind-test de cris Pokémon en cours ?",
      icon: GAME_SVG_ICONS.pokecries
    });
    if (confirmed) {
      if (typeof leavePokecries === 'function') leavePokecries();
      showView('portal');
    }
  } else if (isMerrydactleActive) {
    const confirmed = await showConfirmModal({
      title: "Quitter Otiste Piece ?",
      message: "Voulez-vous vraiment quitter la partie de Otiste Piece en cours ?",
      icon: GAME_SVG_ICONS.merrydactle
    });
    if (confirmed) leaveMerrydactleRoom();
  } else if (isSonglessActive) {
    const confirmed = await showConfirmModal({
      title: "Quitter Blind Test² ?",
      message: "Voulez-vous vraiment quitter la session musicale en cours ?",
      icon: GAME_SVG_ICONS.songless
    });
    if (confirmed) leaveSongless();
  } else if (isImpActive) {
    const confirmed = await showConfirmModal({
      title: "Quitter SousLaCouverture ?",
      message: "Voulez-vous vraiment quitter le salon de jeu en cours ?",
      icon: GAME_SVG_ICONS.imposteur
    });
    if (confirmed) leaveImposteurRoom();
  } else if (isGeoActive) {
    const confirmed = await showConfirmModal({
      title: "Quitter Tiéou ?",
      message: "Voulez-vous vraiment quitter la partie de géographie en cours ?",
      icon: GAME_SVG_ICONS.geographie
    });
    if (confirmed) leaveGeographieRoom();
  } else if (isLgActive) {
    const confirmed = await showConfirmModal({
      title: "Quitter Graouu ?",
      message: "Voulez-vous vraiment quitter le village et abandonner la partie ?",
      icon: GAME_SVG_ICONS.loup_garou
    });
    if (confirmed) leaveLoupGarouRoom();
  } else {
    showView('portal');
  }
}

// --- Initialization ---
function init() {
  // Mobile Sidebar Toggle (Theridactle & Pokedactle)
  if (dom.mobileHandle) {
    dom.mobileHandle.addEventListener('click', () => {
      dom.sidebar.classList.toggle('open');
    });
  }
  if (dom.pokedactleMobileHandle) {
    dom.pokedactleMobileHandle.addEventListener('click', () => {
      dom.pokedactleSidebar.classList.toggle('open');
    });
  }
  if (dom.merrydactleMobileHandle) {
    dom.merrydactleMobileHandle.addEventListener('click', () => {
      dom.merrydactleSidebar.classList.toggle('open');
    });
  }

  // Back Buttons
  if (dom.btnBackTheri) dom.btnBackTheri.addEventListener('click', () => showView('portal'));
  if (dom.btnBackPokedactle) dom.btnBackPokedactle.addEventListener('click', () => showView('portal'));
  if (dom.btnBackPokecries) dom.btnBackPokecries.addEventListener('click', () => showView('portal'));
  if (dom.btnBackMerrydactle) dom.btnBackMerrydactle.addEventListener('click', () => showView('portal'));
  if (dom.btnBackImp) dom.btnBackImp.addEventListener('click', () => showView('portal'));
  if (dom.btnBackGeo) dom.btnBackGeo.addEventListener('click', () => showView('portal'));

  // Nav clicks
  if (dom.navLogo) dom.navLogo.addEventListener('click', confirmLeave);
  if (dom.navHome) dom.navHome.addEventListener('click', (e) => { e.preventDefault(); confirmLeave(); });
  if (dom.btnLeaveNav) dom.btnLeaveNav.addEventListener('click', confirmLeave);
  if (dom.btnCopyInvite) dom.btnCopyInvite.addEventListener('click', copyInvitationLink);

  // Portal routing
  if (dom.cardTheridactle) dom.cardTheridactle.addEventListener('click', () => showView('theriMenu'));
  if (dom.cardPokedactle) dom.cardPokedactle.addEventListener('click', () => showView('pokedactleMenu'));
  if (dom.cardPokecries) dom.cardPokecries.addEventListener('click', () => showView('pokecriesMenu'));
  if (dom.cardMerrydactle) dom.cardMerrydactle.addEventListener('click', () => showView('merrydactleMenu'));
  if (dom.cardSongless) dom.cardSongless.addEventListener('click', () => showView('songlessMenu'));
  if (dom.cardImposteur) dom.cardImposteur.addEventListener('click', () => showView('impMenu'));
  if (dom.cardGeographie) dom.cardGeographie.addEventListener('click', () => showView('geoMenu'));
  if (dom.btnBackSongless) dom.btnBackSongless.addEventListener('click', () => showView('portal'));
  if (dom.btnBackSonglessGame) dom.btnBackSonglessGame.addEventListener('click', confirmLeave);

  // --- Pokédactle Menu Actions ---
  if (dom.btnPokedactleSolo) dom.btnPokedactleSolo.addEventListener('click', () => createPokedactleRoom(true));
  if (dom.btnPokedactleCreate) dom.btnPokedactleCreate.addEventListener('click', () => createPokedactleRoom(false));
  if (dom.btnPokedactleJoin) {
    dom.btnPokedactleJoin.addEventListener('click', () => {
      const code = dom.pokedactleJoinInput.value.trim().toUpperCase();
      if (code.length >= 4) joinPokedactleRoom(code);
    });
  }
  if (dom.btnPokedactleLeave) dom.btnPokedactleLeave.addEventListener('click', leavePokedactleRoom);
  if (dom.btnPokedactleScrollTop) {
    dom.btnPokedactleScrollTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Pokédactle Hint Logic ---
  if (dom.btnPokedactleHint && dom.pokedactleHintDropdown) {
    dom.btnPokedactleHint.addEventListener('click', () => {
      dom.pokedactleHintDropdown.style.display = dom.pokedactleHintDropdown.style.display === 'none' ? 'block' : 'none';
    });
  }

  if (dom.pokedactleHintRevealWord) {
    dom.pokedactleHintRevealWord.addEventListener('click', () => {
      dom.pokedactleHintDropdown.style.display = 'none';
      if (pokedactleHintsRemaining <= 0) {
        alert("Vous n'avez plus d'indices disponibles pour cette partie !");
        return;
      }
      window.isPokedactleHintMode = true;
      document.body.style.cursor = 'help';
    });
  }

  if (dom.btnPokedactleHintPhrase) {
    dom.btnPokedactleHintPhrase.addEventListener('click', () => {
      if (dom.pokedactleHintDropdown) dom.pokedactleHintDropdown.style.display = 'none';
      if (pokedactlePhraseHintUsed) {
        alert("Vous avez déjà utilisé l'indice Pokédex !");
        return;
      }
      pokedactlePhraseHintUsed = true;
      const hint = getPokemonHint();
      if (dom.pokedactlePhraseHintText) dom.pokedactlePhraseHintText.textContent = hint;
      if (dom.pokedactlePhraseHintContainer) dom.pokedactlePhraseHintContainer.style.display = 'block';
      updatePokedactleHintUI();
    });
  }

  // Pokédactle Give Up
  if (dom.btnPokedactleGiveUp) {
    dom.btnPokedactleGiveUp.addEventListener('click', async () => {
      if (!currentRoomId) return;
      const confirmed = await showConfirmModal({
        title: "Abandonner la partie ?",
        message: "Le Pokémon mystère sera révélé et la partie sera terminée.",
        icon: "⚡",
        confirmText: "Abandonner",
        cancelText: "Continuer"
      });
      if (confirmed) {
        dom.btnPokedactleGiveUp.disabled = true;
        fetch('/api/pokedactle/give-up', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: currentRoomId })
        })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            if (data.title) pokedactleGameState.title = data.title;
            if (data.imageUrl) pokedactleGameState.imageUrl = data.imageUrl;
            pokedactleGameState.isWon = true;
            showPokedactleGiveUp();
          }
        })
        .catch(err => {
          console.error('Failed to give up in Pokedactle', err);
          showPokedactleGiveUp();
        })
        .finally(() => {
          dom.btnPokedactleGiveUp.disabled = false;
        });
      }
    });
  }

  // Pokédactle Guesses
  if (dom.pokedactleGuessFormDesktop) {
    dom.pokedactleGuessFormDesktop.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = dom.pokedactleGuessInputDesktop.value.trim();
      if (val) submitPokedactleGuess(val);
    });
  }
  if (dom.pokedactleGuessFormMobile) {
    dom.pokedactleGuessFormMobile.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = dom.pokedactleGuessInputMobile.value.trim();
      if (val) submitPokedactleGuess(val);
    });
  }

  // --- Merrydactle Menu Actions ---
  if (dom.btnMerrydactleSolo) dom.btnMerrydactleSolo.addEventListener('click', () => createMerrydactleRoom(true));
  if (dom.btnMerrydactleCreate) dom.btnMerrydactleCreate.addEventListener('click', () => createMerrydactleRoom(false));
  if (dom.btnMerrydactleJoin) {
    dom.btnMerrydactleJoin.addEventListener('click', () => {
      const code = dom.merrydactleJoinInput.value.trim().toUpperCase();
      if (code.length >= 4) joinMerrydactleRoom(code);
    });
  }
  if (dom.btnMerrydactleLeave) dom.btnMerrydactleLeave.addEventListener('click', leaveMerrydactleRoom);
  if (dom.btnMerrydactleScrollTop) {
    dom.btnMerrydactleScrollTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Merrydactle Hint Logic ---
  if (dom.btnMerrydactleHint && dom.merrydactleHintDropdown) {
    dom.btnMerrydactleHint.addEventListener('click', () => {
      dom.merrydactleHintDropdown.style.display = dom.merrydactleHintDropdown.style.display === 'none' ? 'block' : 'none';
    });
  }

  if (dom.merrydactleHintRevealWord) {
    dom.merrydactleHintRevealWord.addEventListener('click', () => {
      dom.merrydactleHintDropdown.style.display = 'none';
      if (merrydactleHintsRemaining <= 0) {
        alert("Vous n'avez plus d'indices disponibles pour cette partie !");
        return;
      }
      window.isMerrydactleHintMode = true;
      document.body.style.cursor = 'help';
    });
  }

  if (dom.btnMerrydactleHintPhrase) {
    dom.btnMerrydactleHintPhrase.addEventListener('click', () => {
      if (dom.merrydactleHintDropdown) dom.merrydactleHintDropdown.style.display = 'none';
      if (merrydactlePhraseHintUsed) {
        alert("Vous avez déjà utilisé l'indice de l'Équipage !");
        return;
      }
      merrydactlePhraseHintUsed = true;
      const hint = getMerrydactleHint();
      if (dom.merrydactlePhraseHintText) dom.merrydactlePhraseHintText.textContent = hint;
      if (dom.merrydactlePhraseHintContainer) dom.merrydactlePhraseHintContainer.style.display = 'block';
      updateMerrydactleHintUI();
    });
  }

  // Merrydactle Give Up
  if (dom.btnMerrydactleGiveUp) {
    dom.btnMerrydactleGiveUp.addEventListener('click', async () => {
      if (!currentRoomId) return;
      const confirmed = await showConfirmModal({
        title: "Abandonner la partie ?",
        message: "Le mystère de Grand Line sera révélé et la partie sera terminée.",
        icon: "🏴‍☠️",
        confirmText: "Abandonner",
        cancelText: "Continuer"
      });
      if (confirmed) {
        dom.btnMerrydactleGiveUp.disabled = true;
        fetch('/api/merrydactle/give-up', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: currentRoomId })
        })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            if (data.title) merrydactleGameState.title = data.title;
            if (data.imageUrl) merrydactleGameState.imageUrl = data.imageUrl;
            merrydactleGameState.isWon = true;
            showMerrydactleGiveUp();
          }
        })
        .catch(err => {
          console.error('Failed to give up in Merrydactle', err);
          showMerrydactleGiveUp();
        })
        .finally(() => {
          dom.btnMerrydactleGiveUp.disabled = false;
        });
      }
    });
  }

  // Merrydactle Guesses
  if (dom.merrydactleGuessFormDesktop) {
    dom.merrydactleGuessFormDesktop.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = dom.merrydactleGuessInputDesktop.value.trim();
      if (val) submitMerrydactleGuess(val);
    });
  }
  if (dom.merrydactleGuessFormMobile) {
    dom.merrydactleGuessFormMobile.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = dom.merrydactleGuessInputMobile.value.trim();
      if (val) submitMerrydactleGuess(val);
    });
  }

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

  // --- Otiste Games Multiplayer Lobby, Round & Podium Handlers ---
  ['theridactle', 'pokedactle', 'merrydactle'].forEach(gameKey => {
    const prefix = gameKey;
    
    // Settings change listeners
    const roundsSel = document.getElementById(`${prefix}-lobby-rounds-select`);
    const catSel = document.getElementById(`${prefix}-lobby-category-select`);
    const hintsSel = document.getElementById(`${prefix}-lobby-hints-select`);

    if (roundsSel) roundsSel.addEventListener('change', () => sendDactleSettings(gameKey));
    if (catSel) catSel.addEventListener('change', () => sendDactleSettings(gameKey));
    if (hintsSel) hintsSel.addEventListener('change', () => sendDactleSettings(gameKey));

    // Host Action buttons
    const btnStart = document.getElementById(`btn-${prefix}-start-game`);
    if (btnStart) btnStart.addEventListener('click', () => startDactleGame(gameKey));

    const btnNext = document.getElementById(`btn-${prefix}-next-round`);
    if (btnNext) btnNext.addEventListener('click', () => nextDactleRound(gameKey));

    const btnRestart = document.getElementById(`btn-${prefix}-restart-lobby`);
    if (btnRestart) btnRestart.addEventListener('click', () => restartDactleLobby(gameKey));
  });
  
  if (dom.btnGiveUp) {
    dom.btnGiveUp.addEventListener('click', async () => {
      if (!currentRoomId) return;
      const confirmed = await showConfirmModal({
        title: "Abandonner la partie ?",
        message: "Le mot secret sera révélé et la partie sera terminée pour tous les joueurs du salon.",
        icon: "🦖",
        confirmText: "Abandonner",
        cancelText: "Continuer"
      });
      if (confirmed) {
        dom.btnGiveUp.disabled = true;
        fetch('/api/give-up', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: currentRoomId,
            nickname: currentProfile && currentProfile.nickname ? currentProfile.nickname : '',
            avatar: currentProfile && currentProfile.avatar ? currentProfile.avatar : ''
          })
        })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            if (data.title) gameState.title = data.title;
            if (data.imageUrl) gameState.imageUrl = data.imageUrl;
            gameState.isWon = true;
            showGiveUp();
          }
        })
        .catch(err => {
          console.error('Failed to give up', err);
          showGiveUp();
        })
        .finally(() => {
          dom.btnGiveUp.disabled = false;
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
    const rawNorm = normalize(word.trim());
    const root = getRoot(rawNorm);
    
    // If already guessed, highlight existing words and scroll to it
    const alreadyGuessed = gameState.guesses.some(g => g.root === root);
    if (alreadyGuessed) {
      revealWord(root);
      if (dom.guessInput) dom.guessInput.value = '';
      if (dom.guessInputMobile) dom.guessInputMobile.value = '';
      return;
    }

    fetch('/api/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word,
        roomId: currentRoomId,
        nickname: currentProfile && currentProfile.nickname ? currentProfile.nickname : '',
        accountNickname: (currentProfile && currentProfile.password) ? currentProfile.nickname : null,
        avatar: currentProfile && currentProfile.avatar ? currentProfile.avatar : ''
      })
    }).then(r => r.json()).then(data => {
      if (data.success) {
        if (dom.guessInput) dom.guessInput.value = '';
        if (dom.guessInputMobile) dom.guessInputMobile.value = '';

        if (!gameState.guesses.some(g => g.root === data.root)) {
          gameState.guesses.push({ root: data.root, raw: data.raw, display: data.word });
          gameState.guessHistory.unshift({ word: data.word, hits: data.hits });
        }
        if (data.isWon) {
          gameState.isWon = true;
          if (data.title) gameState.title = data.title;
          if (data.imageUrl) gameState.imageUrl = data.imageUrl;
        }
        revealWord(data.root);
        updateSidebar();
        if (data.isWon) {
          showWin();
        }
      }
    }).catch(err => console.error('Theridactle guess error:', err));
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
        body: JSON.stringify({ nickname, avatar: currentProfile.avatar, avatarIsPhoto: currentProfile.avatarIsPhoto })
      })
      .then(res => res.json())
      .then(data => {
        if (data.roomId) {
          localStorage.setItem('imposteur-nickname', nickname);
          localStorage.setItem('imposteur-roomId', data.roomId);
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
        body: JSON.stringify({ roomId: code, nickname, avatar: currentProfile.avatar, avatarIsPhoto: currentProfile.avatarIsPhoto })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem('imposteur-nickname', nickname);
          localStorage.setItem('imposteur-roomId', data.roomId);
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

  const roundsSelect = document.getElementById('imposteur-rounds-select');
  if (roundsSelect) {
    roundsSelect.addEventListener('change', () => {
      if (imposteurState.isHost) {
        fetch('/api/imposteur/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: imposteurState.roomId, descriptionRounds: parseInt(roundsSelect.value) })
        });
      }
    });
  }

  const impostorCountSelect = document.getElementById('imposteur-count-select');
  if (impostorCountSelect) {
    impostorCountSelect.addEventListener('change', () => {
      if (imposteurState.isHost) {
        fetch('/api/imposteur/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: imposteurState.roomId, impostorCount: parseInt(impostorCountSelect.value) })
        });
      }
    });
  }

  const btnResetScores = document.getElementById('btn-imposteur-reset-scores');
  if (btnResetScores) {
    btnResetScores.addEventListener('click', () => {
      if (imposteurState.isHost && confirm('Voulez-vous vraiment réinitialiser les scores de tous les joueurs à 0 ?')) {
        fetch('/api/imposteur/reset-scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: imposteurState.roomId })
        });
      }
    });
  }

  if (dom.btnImpStart) {
    dom.btnImpStart.addEventListener('click', () => {
      const theme = dom.impThemeSelect.value;
      const rounds = roundsSelect ? parseInt(roundsSelect.value) : 1;
      const impostorCount = impostorCountSelect ? parseInt(impostorCountSelect.value) : 1;
      fetch('/api/imposteur/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: imposteurState.roomId, theme, descriptionRounds: rounds, impostorCount: impostorCount })
      })
      .then(res => res.json())
      .then(data => {
        if (!data.success && data.error) {
          showToast(data.error, 'error');
        }
      })
      .catch(err => {
        console.error('Failed to start game', err);
        showToast('Impossible de lancer la partie.', 'error');
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

  const btnTally = document.getElementById('btn-imposteur-tally');
  if (btnTally) {
    btnTally.addEventListener('click', () => {
      if (imposteurState.isHost) {
        btnTally.disabled = true;
        btnTally.textContent = 'Dépouillement...';
        fetch('/api/imposteur/tally-votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: imposteurState.roomId })
        })
        .finally(() => {
          setTimeout(() => {
            btnTally.disabled = false;
            btnTally.textContent = 'Dépouiller les votes';
          }, 1000);
        });
      }
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
  const geoNicknameInput = document.getElementById('geographie-player-nickname') || document.getElementById('geographie-nickname');
  const savedGeoNickname = localStorage.getItem('geographie-nickname');
  if (savedGeoNickname && geoNicknameInput && !geoNicknameInput.value) {
    geoNicknameInput.value = savedGeoNickname;
  }

  const btnGeoCreate = document.getElementById('btn-geographie-create');
  if (btnGeoCreate) {
    btnGeoCreate.addEventListener('click', () => {
      const nickname = (geoNicknameInput ? geoNicknameInput.value.trim() : '') || (currentProfile ? currentProfile.nickname : '');
      if (!nickname) {
        showGeoMenuError('Veuillez saisir un pseudo pour créer un salon !');
        return;
      }
      showGeoMenuError('');
      fetch('/api/geographie/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, avatar: currentProfile.avatar, avatarIsPhoto: currentProfile.avatarIsPhoto })
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
      const nickname = (geoNicknameInput ? geoNicknameInput.value.trim() : '') || (currentProfile ? currentProfile.nickname : '');
      const code = geoJoinCodeInput ? geoJoinCodeInput.value.trim().toUpperCase() : '';
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
        body: JSON.stringify({ roomId: code, nickname, avatar: currentProfile.avatar, avatarIsPhoto: currentProfile.avatarIsPhoto })
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

  // Check invitation link parameter first
  const urlParams = new URLSearchParams(window.location.search);
  const inviteRoom = urlParams.get('room');

  // If no invite link is being accessed, perform silent auto-reconnects
  if (!inviteRoom) {
    // 0. Silent Auto-reconnect for Theridactle
    const theriActiveRoomId = localStorage.getItem('theridactle-roomId');
    if (theriActiveRoomId) {
      fetch('/api/room/check?roomId=' + theriActiveRoomId)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.gameType === 'theridactle') {
            joinTheridactleRoom(theriActiveRoomId);
          } else {
            localStorage.removeItem('theridactle-roomId');
          }
        }).catch(() => {});
    }

    // 0.5. Silent Auto-reconnect for Pokedactle
    const pokeActiveRoomId = localStorage.getItem('pokedactle-roomId');
    if (pokeActiveRoomId) {
      fetch('/api/room/check?roomId=' + pokeActiveRoomId)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.gameType === 'pokedactle') {
            joinPokedactleRoom(pokeActiveRoomId);
          } else {
            localStorage.removeItem('pokedactle-roomId');
          }
        }).catch(() => {});
    }

    // 0.6. Silent Auto-reconnect for Merrydactle
    const merryActiveRoomId = localStorage.getItem('merrydactle-roomId');
    if (merryActiveRoomId) {
      fetch('/api/room/check?roomId=' + merryActiveRoomId)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.gameType === 'merrydactle') {
            joinMerrydactleRoom(merryActiveRoomId);
          } else {
            localStorage.removeItem('merrydactle-roomId');
          }
        }).catch(() => {});
    }

    // 1. Silent Auto-reconnect for L'Imposteur
    const activeRoomId = localStorage.getItem('imposteur-roomId');
    const activeNickname = localStorage.getItem('imposteur-nickname');
    if (activeRoomId && activeNickname) {
      console.log(`Silent auto-reconnection to ${activeRoomId} as ${activeNickname}`);
      fetch('/api/imposteur/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: activeRoomId, nickname: activeNickname })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          startPlayingImposteur(data.roomId, activeNickname);
        } else {
          localStorage.removeItem('imposteur-roomId');
        }
      })
      .catch(() => console.log('Reconnection failed'));
    }

    // 2. Silent Auto-reconnect for Loup-Garou
    const lgActiveRoomId = localStorage.getItem('loup-garou-roomId');
    const lgActiveNickname = localStorage.getItem('loup-garou-nickname');
    if (lgActiveRoomId && lgActiveNickname) {
      console.log(`Silent auto-reconnection to Loup-Garou room ${lgActiveRoomId} as ${lgActiveNickname}`);
      fetch('/api/loup-garou/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: lgActiveRoomId, nickname: lgActiveNickname })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          startPlayingLoupGarou(data.roomId, lgActiveNickname);
        } else {
          localStorage.removeItem('loup-garou-roomId');
        }
      })
      .catch(() => console.log('Loup-Garou reconnection failed'));
    }
  }

  // Helper function to handle manual routing with neon glows
  function routeToManualJoin(gameType, code) {
    if (gameType === 'imposteur') {
      showView('impMenu');
      if (dom.impJoinCodeInput) dom.impJoinCodeInput.value = code;
      const nickInput = dom.impNicknameInput;
      if (nickInput) {
        if (currentProfile.nickname) nickInput.value = currentProfile.nickname;
        nickInput.focus();
        nickInput.style.borderColor = 'var(--neon-pink)';
        nickInput.style.boxShadow = '0 0 15px rgba(236, 72, 153, 0.5)';
      }
    } else if (gameType === 'geographie') {
      showView('geoMenu');
      const geoInput = document.getElementById('geographie-join-code');
      if (geoInput) geoInput.value = code;
      const nickInput = document.getElementById('geographie-nickname');
      if (nickInput) {
        if (currentProfile.nickname) nickInput.value = currentProfile.nickname;
        nickInput.focus();
        nickInput.style.borderColor = 'var(--neon-cyan)';
        nickInput.style.boxShadow = '0 0 15px rgba(6, 182, 212, 0.5)';
      }
    } else if (gameType === 'loup_garou') {
      showView('lgMenu');
      const lgInput = document.getElementById('loup-garou-join-code');
      if (lgInput) lgInput.value = code;
      const nickInput = document.getElementById('loup-garou-nickname');
      if (nickInput) {
        if (currentProfile.nickname) nickInput.value = currentProfile.nickname;
        nickInput.focus();
        nickInput.style.borderColor = '#ef4444';
        nickInput.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.5)';
      }
    } else if (gameType === 'theridactle') {
      showView('theriMenu');
      if (dom.joinRoomInput) dom.joinRoomInput.value = code;
    } else if (gameType === 'pokedactle') {
      showView('pokedactleMenu');
      if (dom.pokedactleJoinInput) dom.pokedactleJoinInput.value = code;
    } else if (gameType === 'merrydactle') {
      showView('merrydactleMenu');
      if (dom.merrydactleJoinInput) dom.merrydactleJoinInput.value = code;
    } else if (gameType === 'songless') {
      showView('songlessMenu');
      const songlessInput = document.getElementById('songless-room-code-input');
      if (songlessInput) songlessInput.value = code;
      const nickInput = document.getElementById('songless-player-nickname');
      if (nickInput) {
        if (currentProfile && currentProfile.nickname) nickInput.value = currentProfile.nickname;
        nickInput.focus();
        nickInput.style.borderColor = '#a855f7';
        nickInput.style.boxShadow = '0 0 15px rgba(168, 85, 247, 0.5)';
      }
    } else if (gameType === 'pokecries') {
      showView('pokecriesMenu');
      const pokecriesInput = document.getElementById('pokecries-room-code-input');
      if (pokecriesInput) pokecriesInput.value = code;
      const nickInput = document.getElementById('pokecries-player-nickname');
      if (nickInput) {
        if (currentProfile && currentProfile.nickname) nickInput.value = currentProfile.nickname;
        nickInput.focus();
        nickInput.style.borderColor = '#f59e0b';
        nickInput.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.5)';
      }
    }
  }

  // 3. Invitation link detection & auto-join
  if (inviteRoom) {
    const code = inviteRoom.trim().toUpperCase();
    window.history.replaceState({}, document.title, window.location.pathname);
    
    fetch(`/api/room/check?roomId=${code}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const gameType = data.gameType;
          
          let savedNickname = currentProfile.nickname;
          if (!savedNickname) {
            if (gameType === 'imposteur') {
              savedNickname = localStorage.getItem('imposteur-nickname');
            } else if (gameType === 'geographie') {
              savedNickname = localStorage.getItem('geographie-nickname');
            } else if (gameType === 'loup_garou') {
              savedNickname = localStorage.getItem('loup-garou-nickname');
            } else if (gameType === 'pokecries') {
              savedNickname = localStorage.getItem('pokecries-nickname');
            }
          }
          
          if (savedNickname && gameType !== 'theridactle' && gameType !== 'pokedactle' && gameType !== 'merrydactle') {
            console.log(`Auto-joining room ${code} as ${savedNickname} for game ${gameType}`);
            const apiGameType = gameType === 'loup_garou' ? 'loup-garou' : gameType;
            fetch(`/api/${apiGameType}/room/join`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ roomId: code, nickname: savedNickname, avatar: currentProfile.avatar, avatarIsPhoto: currentProfile.avatarIsPhoto })
            })
            .then(res => res.json())
            .then(joinData => {
              if (joinData.success) {
                localStorage.setItem(`${gameType}-roomId`, code);
                if (gameType === 'imposteur') {
                  startPlayingImposteur(code, savedNickname);
                } else if (gameType === 'geographie') {
                  startPlayingGeographie(code, savedNickname);
                } else if (gameType === 'loup_garou') {
                  startPlayingLoupGarou(code, savedNickname);
                } else if (gameType === 'pokecries') {
                  joinPokecriesRoom(code, savedNickname);
                }
                showToast("Connexion au salon réussie !");
              } else {
                routeToManualJoin(gameType, code);
              }
            })
            .catch(() => routeToManualJoin(gameType, code));
          } else {
            if (gameType === 'theridactle') {
              joinTheridactleRoom(code);
            } else if (gameType === 'pokedactle') {
              joinPokedactleRoom(code);
            } else if (gameType === 'merrydactle') {
              joinMerrydactleRoom(code);
            } else {
              routeToManualJoin(gameType, code);
            }
          }
        } else {
          showToast("Ce salon n'existe plus ou a expiré.", "error");
          localStorage.removeItem('imposteur-roomId');
          localStorage.removeItem('loup-garou-roomId');
        }
      })
      .catch(err => {
        console.error('Check invitation failed', err);
        showToast("Erreur lors de la vérification du salon.", "error");
      });
  }

  // --- Loup-Garou Menu Actions ---
  if (dom.cardLoupGarou) {
    dom.cardLoupGarou.addEventListener('click', () => {
      showView('lgMenu');
      const saved = localStorage.getItem('loup-garou-nickname');
      const nickInput = document.getElementById('loup-garou-player-nickname') || document.getElementById('loup-garou-nickname');
      if (saved && nickInput && !nickInput.value) {
        nickInput.value = saved;
      }
    });
  }
  
  if (dom.btnBackLoupGarou) {
    dom.btnBackLoupGarou.addEventListener('click', () => showView('portal'));
  }

  const btnLgCreate = document.getElementById('btn-loup-garou-create');
  if (btnLgCreate) {
    btnLgCreate.addEventListener('click', () => {
      const nicknameInput = document.getElementById('loup-garou-player-nickname') || document.getElementById('loup-garou-nickname');
      const nickname = (nicknameInput ? nicknameInput.value.trim() : '') || (currentProfile ? currentProfile.nickname : '');
      if (!nickname) {
        showLgMenuError('Veuillez saisir un pseudo pour créer un village !');
        return;
      }
      showLgMenuError('');
      fetch('/api/loup-garou/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, avatar: currentProfile.avatar, avatarIsPhoto: currentProfile.avatarIsPhoto })
      })
      .then(res => res.json())
      .then(data => {
        if (data.roomId) {
          localStorage.setItem('loup-garou-nickname', nickname);
          localStorage.setItem('loup-garou-roomId', data.roomId);
          startPlayingLoupGarou(data.roomId, nickname);
        } else {
          showLgMenuError(data.error || 'Erreur lors de la création du village.');
        }
      })
      .catch(() => showLgMenuError('Impossible de joindre le serveur.'));
    });
  }

  const btnLgJoin = document.getElementById('btn-loup-garou-join');
  if (btnLgJoin) {
    btnLgJoin.addEventListener('click', () => {
      const nicknameInput = document.getElementById('loup-garou-player-nickname') || document.getElementById('loup-garou-nickname');
      const nickname = (nicknameInput ? nicknameInput.value.trim() : '') || (currentProfile ? currentProfile.nickname : '');
      const codeInput = document.getElementById('loup-garou-join-code');
      const code = codeInput ? codeInput.value.trim().toUpperCase() : '';
      
      if (!nickname) {
        showLgMenuError('Veuillez saisir un pseudo pour rejoindre un village !');
        return;
      }
      if (!code || code.length < 4) {
        showLgMenuError('Veuillez entrer un code de village valide (ex: WXYZ).');
        return;
      }
      showLgMenuError('');
      fetch('/api/loup-garou/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: code, nickname, avatar: currentProfile.avatar, avatarIsPhoto: currentProfile.avatarIsPhoto })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem('loup-garou-nickname', nickname);
          localStorage.setItem('loup-garou-roomId', data.roomId);
          startPlayingLoupGarou(data.roomId, nickname);
        } else {
          showLgMenuError(data.error || 'Village introuvable, déjà complet ou pseudo pris.');
        }
      })
      .catch(() => showLgMenuError('Impossible de joindre le serveur.'));
    });
  }

  const btnLgTtsToggle = document.getElementById('btn-loup-garou-tts-toggle');
  if (btnLgTtsToggle) {
    const ttsEnabled = localStorage.getItem('loup-garou-tts-enabled') !== 'false';
    const ttsIcon = document.getElementById('loup-garou-tts-icon');
    if (ttsIcon) ttsIcon.textContent = ttsEnabled ? '🔊' : '🔇';
    btnLgTtsToggle.innerHTML = `${ttsEnabled ? '<span id="loup-garou-tts-icon">🔊</span> Vocaux activés' : '<span id="loup-garou-tts-icon">🔇</span> Vocaux coupés'}`;
    
    btnLgTtsToggle.addEventListener('click', () => {
      const current = localStorage.getItem('loup-garou-tts-enabled') !== 'false';
      const next = !current;
      localStorage.setItem('loup-garou-tts-enabled', next ? 'true' : 'false');
      const icon = document.getElementById('loup-garou-tts-icon');
      if (icon) icon.textContent = next ? '🔊' : '🔇';
      btnLgTtsToggle.innerHTML = `${next ? '<span id="loup-garou-tts-icon">🔊</span> Vocaux activés' : '<span id="loup-garou-tts-icon">🔇</span> Vocaux coupés'}`;
      showToast(next ? "Narrateur vocal activé 🔊" : "Narrateur vocal désactivé 🔇");
    });
  }

  const btnLgVoleurSkip = document.getElementById('btn-loup-garou-voleur-skip');
  if (btnLgVoleurSkip) {
    btnLgVoleurSkip.addEventListener('click', () => {
      fetch('/api/loup-garou/night-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: loupGarouState.roomId,
          nickname: loupGarouState.nickname,
          actionType: 'voleur',
          targetName: ''
        })
      });
    });
  }

  const btnLgVoleurSteal = document.getElementById('btn-loup-garou-voleur-steal');
  if (btnLgVoleurSteal) {
    btnLgVoleurSteal.addEventListener('click', () => {
      const targetName = document.getElementById('loup-garou-voleur-target').value;
      if (!targetName) {
        alert("Veuillez sélectionner un joueur à voler !");
        return;
      }
      fetch('/api/loup-garou/night-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: loupGarouState.roomId,
          nickname: loupGarouState.nickname,
          actionType: 'voleur_steal',
          targetName
        })
      });
    });
  }

  const btnLgStart = document.getElementById('btn-loup-garou-start');

  const chkLgMayor = document.getElementById('chk-loup-garou-mayor');
  if (chkLgMayor) {
    chkLgMayor.addEventListener('change', () => {
      if (!loupGarouState.isHost) return;
      if (!loupGarouState.rolesConfig) loupGarouState.rolesConfig = {};
      loupGarouState.rolesConfig.useMayor = chkLgMayor.checked;
      
      fetch('/api/loup-garou/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: loupGarouState.roomId,
          rolesConfig: loupGarouState.rolesConfig
        })
      });
    });
  }

  const selLgTimer = document.getElementById('sel-loup-garou-timer');
  if (selLgTimer) {
    selLgTimer.addEventListener('change', () => {
      if (!loupGarouState.isHost) return;
      if (!loupGarouState.rolesConfig) loupGarouState.rolesConfig = {};
      loupGarouState.rolesConfig.voteTimer = parseInt(selLgTimer.value, 10);
      
      fetch('/api/loup-garou/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: loupGarouState.roomId,
          rolesConfig: loupGarouState.rolesConfig
        })
      });
    });
  }
  if (btnLgStart) {
    btnLgStart.addEventListener('click', () => {
      if (loupGarouState.isHost) {
        fetch('/api/loup-garou/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: loupGarouState.roomId })
        })
        .then(res => res.json())
        .then(data => {
          if (!data.success) {
            alert(data.error || "Impossible de lancer la partie.");
          }
        });
      }
    });
  }

  const btnLgTally = document.getElementById('btn-loup-garou-tally');
  if (btnLgTally) {
    btnLgTally.addEventListener('click', () => {
      if (loupGarouState.isHost) {
        fetch('/api/loup-garou/tally', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: loupGarouState.roomId })
        });
      }
    });
  }

  const btnLgRestart = document.getElementById('btn-loup-garou-restart');
  if (btnLgRestart) {
    btnLgRestart.addEventListener('click', () => {
      if (loupGarouState.isHost) {
        fetch('/api/loup-garou/restart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: loupGarouState.roomId })
        });
      }
    });
  }

  const btnLgCupid = document.getElementById('btn-loup-garou-cupid-submit');
  if (btnLgCupid) {
    btnLgCupid.addEventListener('click', () => {
      const targetName = document.getElementById('loup-garou-cupid-lover1').value;
      const targetName2 = document.getElementById('loup-garou-cupid-lover2').value;
      if (targetName === targetName2) {
        alert("Cupidon doit choisir deux personnes différentes !");
        return;
      }
      fetch('/api/loup-garou/night-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: loupGarouState.roomId,
          nickname: loupGarouState.nickname,
          actionType: 'cupidon',
          targetName,
          targetName2
        })
      });
    });
  }

  const btnLgGarde = document.getElementById('btn-loup-garou-garde-submit');
  if (btnLgGarde) {
    btnLgGarde.addEventListener('click', () => {
      const targetName = document.getElementById('loup-garou-garde-target').value;
      fetch('/api/loup-garou/night-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: loupGarouState.roomId,
          nickname: loupGarouState.nickname,
          actionType: 'garde',
          targetName
        })
      });
    });
  }

  const btnLgVoyante = document.getElementById('btn-loup-garou-voyante-submit');
  if (btnLgVoyante) {
    btnLgVoyante.addEventListener('click', () => {
      const targetName = document.getElementById('loup-garou-voyante-target').value;
      fetch('/api/loup-garou/night-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: loupGarouState.roomId,
          nickname: loupGarouState.nickname,
          actionType: 'voyante',
          targetName
        })
      });
    });
  }

  const btnLgWolf = document.getElementById('btn-loup-garou-wolf-submit');
  if (btnLgWolf) {
    btnLgWolf.addEventListener('click', () => {
      const targetName = document.getElementById('loup-garou-wolf-target').value;
      fetch('/api/loup-garou/night-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: loupGarouState.roomId,
          nickname: loupGarouState.nickname,
          actionType: 'loup',
          targetName
        })
      });
    });
  }

  const btnLgWitchHeal = document.getElementById('btn-loup-garou-witch-heal');
  if (btnLgWitchHeal) {
    btnLgWitchHeal.addEventListener('click', () => {
      fetch('/api/loup-garou/night-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: loupGarouState.roomId,
          nickname: loupGarouState.nickname,
          actionType: 'sorciere_heal'
        })
      }).then(() => {
        btnLgWitchHeal.disabled = true;
        btnLgWitchHeal.style.opacity = '0.5';
      });
    });
  }

  const btnLgWitchKill = document.getElementById('btn-loup-garou-witch-kill');
  if (btnLgWitchKill) {
    btnLgWitchKill.addEventListener('click', () => {
      const selectBox = document.getElementById('loup-garou-witch-kill-select-box');
      if (selectBox) {
        selectBox.classList.remove('view-hidden');
      }
    });
  }

  const btnLgWitchSkip = document.getElementById('btn-loup-garou-witch-skip');
  if (btnLgWitchSkip) {
    btnLgWitchSkip.addEventListener('click', () => {
      fetch('/api/loup-garou/night-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: loupGarouState.roomId,
          nickname: loupGarouState.nickname,
          actionType: 'sorciere_skip'
        })
      });
    });
  }

  const witchKillTargetSelect = document.getElementById('loup-garou-witch-kill-target');
  if (witchKillTargetSelect) {
    witchKillTargetSelect.addEventListener('change', () => {
      const targetName = witchKillTargetSelect.value;
      if (targetName && confirm(`Voulez-vous vraiment empoisonner ${targetName} ?`)) {
        fetch('/api/loup-garou/night-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: loupGarouState.roomId,
            nickname: loupGarouState.nickname,
            actionType: 'sorciere_kill',
            targetName
          })
        }).then(() => {
          const selectBox = document.getElementById('loup-garou-witch-kill-select-box');
          if (selectBox) selectBox.classList.add('view-hidden');
        });
      }
    });
  }

  const btnLgHunter = document.getElementById('btn-loup-garou-hunter-submit');
  if (btnLgHunter) {
    btnLgHunter.addEventListener('click', () => {
      const targetName = document.getElementById('loup-garou-hunter-target').value;
      if (!targetName) return;
      window.gmEliminatePlayer(targetName, 'hunter');
    });
  }
  // --- Profile Button & Stats Card ---
  const btnProfile = document.getElementById('btn-profile');
  if (btnProfile) {
    btnProfile.addEventListener('click', () => openProfileModal());
  }

  const cardStatistiques = document.getElementById('card-statistiques');
  if (cardStatistiques) {
    cardStatistiques.addEventListener('click', () => {
      showView('statsMenu');
      loadStatsView();
    });
  }

  const btnBackStats = document.getElementById('btn-back-stats');
  if (btnBackStats) {
    btnBackStats.addEventListener('click', () => showView('portal'));
  }

  // Stats game tabs
  document.querySelectorAll('.stats-game-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.stats-game-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      statsViewState.game = btn.dataset.game;
      loadStatsView();
    });
  });

  // Stats period tabs
  document.querySelectorAll('.stats-period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.stats-period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      statsViewState.period = btn.dataset.period;
      loadStatsView();
    });
  });

  // Stats sort tabs (Points / Win rate / Victoires)
  document.querySelectorAll('.stats-sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.stats-sort-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      statsViewState.sort = btn.dataset.sort;

      const noteEl = document.getElementById('stats-ranking-note');
      if (noteEl) {
        if (statsViewState.sort === 'winRate') {
          noteEl.textContent = 'Classement par pourcentage de victoires (minimum 3 parties).';
        } else if (statsViewState.sort === 'wins') {
          noteEl.textContent = 'Classement par nombre total de victoires enregistrées.';
        } else {
          noteEl.textContent = 'Points normalisés sur 100 par partie selon les règles du jeu.';
        }
      }
      loadStatsView();
    });
  });

  // Load profile
  loadProfile();
  updateNavAvatar();
  initProfileModal();

  // Silently sync avatar from server (fixes multi-device PP inconsistency)
  if (currentProfile && currentProfile.nickname && currentProfile.password) {
    fetch('/api/profile/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: currentProfile.nickname, password: currentProfile.password })
    }).then(r => r.json()).then(data => {
      if (data.success && data.user) {
        const synced = { ...currentProfile, avatar: data.user.avatar, avatarIsPhoto: data.user.avatarIsPhoto };
        currentProfile = synced;
        localStorage.setItem('caraQuiz-profile', JSON.stringify(synced));
        updateNavAvatar();
      }
    }).catch(() => {});
  }

}

// ==========================================
// STATS VIEW SYSTEM
// ==========================================

function loadStatsView() {
  const { game, period, sort } = statsViewState;
  const currentSort = sort || 'points';
  const listEl = document.getElementById('stats-leaderboard-list');
  const podiumEl = document.getElementById('stats-podium');
  if (!listEl) return;

  listEl.innerHTML = '<div class="stats-loading">⏳ Chargement...</div>';
  if (podiumEl) podiumEl.innerHTML = '';

  const gameParam = game === 'all' ? '' : game;
  fetch(`/api/stats/leaderboard?game=${encodeURIComponent(gameParam)}&period=${encodeURIComponent(period || 'week')}&sort=${encodeURIComponent(currentSort)}`)
    .then(r => r.json())
    .then(data => {
      const lb = data.leaderboard || [];
      if (lb.length === 0) {
        listEl.innerHTML = `<div class="stats-empty"><div class="stats-empty-emoji">🏜️</div><p>Aucune statistique disponible pour cette période.</p></div>`;
        if (podiumEl) podiumEl.innerHTML = '';
        return;
      }

      // Build classic 3D Olympic Stepped Podium
      if (podiumEl) {
        if (lb.length === 0) {
          podiumEl.innerHTML = '';
        } else {
          const podiumOrder = lb.length >= 3
            ? [lb[1], lb[0], lb[2]]
            : lb.length >= 2
              ? [lb[1], lb[0]]
              : [lb[0]];
          const podiumRanks = lb.length >= 3 ? [2, 1, 3] : lb.length >= 2 ? [2, 1] : [1];

          podiumEl.innerHTML = `
            <div class="podium-stepped-wrapper">
              ${podiumOrder.map((p, i) => {
                const rank = podiumRanks[i];
                const isMe = currentProfile && currentProfile.nickname && p.nickname.toLowerCase() === currentProfile.nickname.toLowerCase();
                const finalAvatar = isMe && currentProfile.avatar ? currentProfile.avatar : p.avatar;
                const finalIsPhoto = isMe && currentProfile.avatarIsPhoto !== undefined ? currentProfile.avatarIsPhoto : p.avatarIsPhoto;
                const avatarHtml = renderAvatarHTML(finalAvatar, finalIsPhoto);
                const isFirst = rank === 1;
                const isSecond = rank === 2;
                const rankClass = isFirst ? 'rank-1' : (isSecond ? 'rank-2' : 'rank-3');
                const crownSvg = isFirst ? `<div class="podium-crown">👑</div>` : '';

                let metricLabel = '';
                if (currentSort === 'winRate') metricLabel = `${p.winRate}%`;
                else if (currentSort === 'wins') metricLabel = `${p.wins} vict.`;
                else metricLabel = `${(p.points !== undefined ? p.points : (p.score || 0)).toLocaleString('fr-FR')} pts`;

                const rankText = isFirst ? '#1' : (isSecond ? '#2' : '#3');

                return `
                  <div class="podium-col ${rankClass}">
                    ${crownSvg}
                    <div class="podium-avatar-ring ${rankClass}">
                      <div class="podium-avatar">${avatarHtml}</div>
                    </div>
                    <div class="podium-player-name">${escapeHtml(p.nickname)}</div>
                    <div class="podium-metric-pill ${rankClass}">${metricLabel}</div>
                    <div class="podium-step ${rankClass}">
                      <span class="podium-step-number">${rankText}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `;
        }
      }

      // Build full table with clear focus on the active metric
      const myNickname = currentProfile.nickname;
      listEl.innerHTML = lb.map((p, idx) => {
        const rank = idx + 1;
        const rankClass = rank === 1 ? 'r1' : rank === 2 ? 'r2' : rank === 3 ? 'r3' : '';
        const isMe = currentProfile && currentProfile.nickname && p.nickname.toLowerCase() === currentProfile.nickname.toLowerCase();
        const finalAvatar = isMe && currentProfile.avatar ? currentProfile.avatar : p.avatar;
        const finalIsPhoto = isMe && currentProfile.avatarIsPhoto !== undefined ? currentProfile.avatarIsPhoto : p.avatarIsPhoto;
        const avatarHtml = renderAvatarHTML(finalAvatar, finalIsPhoto);

        let primaryValue = '';
        let primaryLabel = '';
        let contextSub = '';

        if (currentSort === 'winRate') {
          primaryValue = `${p.winRate}%`;
          primaryLabel = 'Win Rate';
          contextSub = `${p.wins} victoires · ${p.gamesPlayed} parties`;
        } else if (currentSort === 'wins') {
          primaryValue = `${p.wins}`;
          primaryLabel = `Victoire${p.wins !== 1 ? 's' : ''}`;
          contextSub = `${p.winRate}% win rate · ${p.gamesPlayed} parties`;
        } else {
          // Points
          const pts = p.points !== undefined ? p.points : (p.score || 0);
          primaryValue = `${pts.toLocaleString('fr-FR')}`;
          primaryLabel = 'Points';
          contextSub = `${p.wins} victoires · ${p.winRate}% win rate`;
        }

        return `
          <div class="stats-leaderboard-item ${isMe ? 'highlighted' : ''}">
            <div class="stats-rank-badge ${rankClass}">#${rank}</div>
            <div class="stats-player-avatar">${avatarHtml}</div>
            <div class="stats-player-info">
              <div class="stats-player-name">${escapeHtml(p.nickname)}${isMe ? ' <span class="stats-player-you">(Vous)</span>' : ''}</div>
              <div class="stats-player-sub">${contextSub}</div>
            </div>
            <div class="stats-player-metrics">
              <div class="stats-metric stats-metric-focus">
                <div class="stats-metric-value">${primaryValue}</div>
                <div class="stats-metric-label">${primaryLabel}</div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    })
    .catch((err) => {
      console.error('Stats leaderboard load error:', err);
      if (listEl) listEl.innerHTML = '<div class="stats-empty"><div class="stats-empty-icon"><svg class="inline-svg" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div><p>Impossible de charger les stats.</p></div>';
    });
}

// ==========================================
// PROFILE MODAL SYSTEM
// ==========================================

let tempProfileAvatar = null;
let tempProfileAvatarIsPhoto = false;

function initProfileModal() {
  const avatarGrid = document.getElementById('profile-emoji-grid');
  if (avatarGrid) {
    avatarGrid.innerHTML = Object.values(FLAT_AVATARS).map(av => `
      <button type="button" class="profile-avatar-btn" data-avatar-id="${av.id}" title="${av.name}">
        ${av.svg}
      </button>
    `).join('');

    avatarGrid.querySelectorAll('.profile-avatar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        avatarGrid.querySelectorAll('.profile-avatar-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        tempProfileAvatar = btn.dataset.avatarId;
        tempProfileAvatarIsPhoto = false;
        const preview = document.getElementById('profile-avatar-preview');
        if (preview) preview.innerHTML = renderAvatarHTML(tempProfileAvatar, false);
      });
    });
  }

  const photoInput = document.getElementById('profile-photo-upload');
  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 160;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // High quality compressed JPEG to avoid network bloat
          tempProfileAvatar = canvas.toDataURL('image/jpeg', 0.85);
          tempProfileAvatarIsPhoto = true;
          
          const preview = document.getElementById('profile-avatar-preview');
          if (preview) preview.innerHTML = renderAvatarHTML(tempProfileAvatar, true);
          
          // Deselect all avatar buttons
          if (avatarGrid) {
            avatarGrid.querySelectorAll('.profile-avatar-btn').forEach(b => b.classList.remove('selected'));
          }
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Auth & Profile Actions
  const btnSave = document.getElementById('btn-save-profile');
  const btnLogin = document.getElementById('btn-login-profile');
  const btnRegister = document.getElementById('btn-register-profile');
  const btnLogout = document.getElementById('btn-logout-profile');
  
  const nicknameInput = document.getElementById('profile-nickname-input');
  const passwordInput = document.getElementById('profile-password-input');
  
  function showError(msg) {
    const errorEl = document.getElementById('profile-error-msg');
    if(errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
      setTimeout(() => errorEl.style.display = 'none', 3000);
    }
  }

  function showSuccess(msg) {
    const msgEl = document.getElementById('profile-save-msg');
    if (msgEl) {
      msgEl.textContent = msg;
      msgEl.style.display = 'block';
      setTimeout(() => { msgEl.style.display = 'none'; }, 2500);
    }
  }

  if (btnRegister) {
    btnRegister.addEventListener('click', () => {
      const nickname = nicknameInput ? nicknameInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      if (!nickname || !password) return showError('Pseudo et mot de passe requis.');
      
      fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, password })
      }).then(r => r.json()).then(data => {
        if(data.success) {
          showSuccess('✅ Compte créé !');
          saveProfile({ ...data.user, password });
          openProfileModal(); // Refresh UI
        } else showError(data.error);
      });
    });
  }

  const loginForm = document.getElementById('profile-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // Use the submitter button if available to distinguish between Login and Register (if we wanted to), 
      // but since register is type="button" and has its own click handler, submit only triggers login.
      const nickname = nicknameInput ? nicknameInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      if (!nickname || !password) return showError('Pseudo et mot de passe requis.');
      
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, password })
      }).then(r => r.json()).then(data => {
        if(data.success) {
          showSuccess('✅ Connecté !');
          saveProfile({ ...data.user, password });
          openProfileModal(); // Refresh UI
        } else showError(data.error);
      });
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      currentProfile = { nickname: '', avatar: '🦖', avatarIsPhoto: false, password: '' };
      localStorage.removeItem('caraQuiz-profile');
      updateNavAvatar();
      openProfileModal();
      showSuccess('Déconnecté.');
    });
  }

  if (btnSave) {
    btnSave.addEventListener('click', () => {
      if (!currentProfile.password) return showError('Vous devez être connecté.');
      
      const newAvatar = tempProfileAvatar || currentProfile.avatar || '🦖';
      const newAvatarIsPhoto = tempProfileAvatarIsPhoto || (tempProfileAvatar === null && currentProfile.avatarIsPhoto);

      fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: currentProfile.nickname,
          password: currentProfile.password,
          avatar: newAvatar,
          avatarIsPhoto: newAvatarIsPhoto
        })
      }).then(r => r.json()).then(data => {
        if(data.success) {
          showSuccess('✅ Profil sauvegardé !');
          currentProfile.avatar = newAvatar;
          currentProfile.avatarIsPhoto = newAvatarIsPhoto;
          saveProfile(currentProfile);
        } else showError(data.error);
      });
    });
  }

  // Close button
  const btnClose = document.getElementById('btn-close-profile');
  if (btnClose) {
    btnClose.addEventListener('click', () => closeProfileModal());
  }

  // Click outside to close
  const overlay = document.getElementById('profile-modal');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeProfileModal();
    });
  }

  // Profile modal tabs
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.profile-tab-content').forEach(c => c.style.display = 'none');
      const tabName = tab.dataset.tab;
      const tabContent = document.getElementById(`profile-tab-${tabName}`);
      if (tabContent) tabContent.style.display = 'flex';

      if (tabName === 'stats' && currentProfile.nickname) {
        loadProfileStats(currentProfile.nickname);
      } else if (tabName === 'history' && currentProfile.nickname) {
        loadProfileHistory(currentProfile.nickname);
      }
    });
  });
}

function openProfileModal() {
  const modal = document.getElementById('profile-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  // Reset to default account tab
  document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
  const defaultTab = document.getElementById('ptab-account');
  if (defaultTab) defaultTab.classList.add('active');

  document.querySelectorAll('.profile-tab-content').forEach(c => c.style.display = 'none');
  const defaultContent = document.getElementById('profile-tab-account');
  if (defaultContent) defaultContent.style.display = 'flex';

  // Pre-fill form with current profile
  const nicknameInput = document.getElementById('profile-nickname-input');
  if (nicknameInput) nicknameInput.value = currentProfile.nickname || '';
  
  const passwordInput = document.getElementById('profile-password-input');
  if (passwordInput) passwordInput.value = currentProfile.password || '';

  const btnLogin = document.getElementById('btn-login-profile');
  const btnRegister = document.getElementById('btn-register-profile');
  const btnSave = document.getElementById('btn-save-profile');
  const btnLogout = document.getElementById('btn-logout-profile');

  const passwordField = passwordInput ? passwordInput.closest('.profile-field') : null;
  const loginRegisterArea = btnLogin ? btnLogin.closest('.profile-actions') : null;

  if (currentProfile.nickname && currentProfile.password) {
    if (nicknameInput) nicknameInput.disabled = true;
    if (passwordField) passwordField.style.display = 'none';
    if (loginRegisterArea) loginRegisterArea.style.display = 'none';
    if (btnSave) btnSave.style.display = 'block';
    if (btnLogout) btnLogout.style.display = 'block';
  } else {
    if (nicknameInput) nicknameInput.disabled = false;
    if (passwordField) passwordField.style.display = 'flex';
    if (loginRegisterArea) loginRegisterArea.style.display = 'flex';
    if (btnSave) btnSave.style.display = 'none';
    if (btnLogout) btnLogout.style.display = 'none';
  }

  const preview = document.getElementById('profile-avatar-preview');
  if (preview) {
    preview.innerHTML = renderAvatarHTML(currentProfile.avatar, currentProfile.avatarIsPhoto);
  }

  // Mark selected flat avatar
  const avatarGrid = document.getElementById('profile-emoji-grid');
  if (avatarGrid && !currentProfile.avatarIsPhoto) {
    avatarGrid.querySelectorAll('.profile-avatar-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.avatarId === currentProfile.avatar);
    });
  } else if (avatarGrid) {
    avatarGrid.querySelectorAll('.profile-avatar-btn').forEach(btn => btn.classList.remove('selected'));
  }

  // Reset temp values
  tempProfileAvatar = currentProfile.avatar || 'dino';
  tempProfileAvatarIsPhoto = currentProfile.avatarIsPhoto || false;

  // Update stats header
  const statsAvatar = document.getElementById('profile-stats-avatar');
  const statsName = document.getElementById('profile-stats-name');
  if (statsAvatar) {
    statsAvatar.innerHTML = renderAvatarHTML(currentProfile.avatar, currentProfile.avatarIsPhoto);
  }
  if (statsName) statsName.textContent = currentProfile.nickname || '—';

  // Update history header
  const historyAvatar = document.getElementById('profile-history-avatar');
  const historyName = document.getElementById('profile-history-name');
  if (historyAvatar) {
    historyAvatar.innerHTML = renderAvatarHTML(currentProfile.avatar, currentProfile.avatarIsPhoto);
  }
  if (historyName) historyName.textContent = currentProfile.nickname || '—';
}

function closeProfileModal() {
  const modal = document.getElementById('profile-modal');
  if (modal) modal.style.display = 'none';
}

function loadProfileStats(nickname) {
  const contentEl = document.getElementById('profile-stats-content');
  if (!contentEl || !nickname) return;
  contentEl.innerHTML = '<div class="stats-loading">⏳ Chargement...</div>';

  const statsAvatar = document.getElementById('profile-stats-avatar');
  const statsName = document.getElementById('profile-stats-name');
  if (statsAvatar) {
    statsAvatar.innerHTML = renderAvatarHTML(currentProfile.avatar, currentProfile.avatarIsPhoto);
  }
  if (statsName) statsName.textContent = nickname;

  fetch(`/api/stats/user?nickname=${encodeURIComponent(nickname)}`)
    .then(r => r.json())
    .then(data => {
      const stats = data.stats || {};
      const gameInfo = [
        { key: 'theridactle', label: 'DinOtiste', icon: GAME_SVG_ICONS.theridactle },
        { key: 'pokedactle', label: 'PokemOtiste', icon: GAME_SVG_ICONS.pokedactle },
        { key: 'pokecries', label: 'Ahhhhhh', icon: GAME_SVG_ICONS.pokecries },
        { key: 'merrydactle', label: 'Otiste Piece', icon: GAME_SVG_ICONS.merrydactle },
        { key: 'songless', label: 'Blind Test²', icon: GAME_SVG_ICONS.songless },
        { key: 'imposteur', label: 'SousLaCouverture', icon: GAME_SVG_ICONS.imposteur },
        { key: 'geographie', label: 'Tiéou', icon: GAME_SVG_ICONS.geographie },
        { key: 'loup_garou', label: 'Graouu', icon: GAME_SVG_ICONS.loup_garou }
      ];

      contentEl.innerHTML = gameInfo.map(g => {
        const s = stats[g.key] || { gamesPlayed: 0, wins: 0, points: 0, score: 0, winRate: 0, rank: null, totalPlayers: 0 };
        const rankText = s.rank ? `#${s.rank} / ${s.totalPlayers}` : '—';
        const hasActivity = s.gamesPlayed > 0;
        return `
          <div class="profile-stats-card ${hasActivity ? 'has-activity' : ''}">
            <div class="stats-card-header">
              <span class="stats-card-title" style="display: inline-flex; align-items: center; gap: 8px;">${g.icon} <span>${g.label}</span></span>
              ${s.points > 0 ? `<span class="stats-points-badge">${s.points} pts</span>` : (hasActivity ? `<span class="stats-points-badge active-game">${s.wins} vict.</span>` : '')}
            </div>
            <div class="stats-card-body">
              <div class="stats-metric-row">
                <span class="stats-metric-label">Parties</span>
                <span class="stats-metric-value">${s.gamesPlayed}</span>
              </div>
              <div class="stats-metric-row">
                <span class="stats-metric-label">Victoires</span>
                <span class="stats-metric-value">${s.wins}</span>
              </div>
              <div class="stats-metric-row">
                <span class="stats-metric-label">Win Rate</span>
                <span class="stats-metric-value">${s.winRate}%</span>
              </div>
              <div class="stats-metric-row">
                <span class="stats-metric-label">Classement</span>
                <span class="stats-metric-value">${rankText}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    })
    .catch(() => {
      if (contentEl) contentEl.innerHTML = '<div class="stats-loading">Erreur de chargement</div>';
    });
}

function loadProfileHistory(nickname) {
  const contentEl = document.getElementById('profile-history-content');
  if (!contentEl || !nickname) return;
  contentEl.innerHTML = '<div class="stats-loading">⏳ Chargement...</div>';

  const historyAvatar = document.getElementById('profile-history-avatar');
  const historyName = document.getElementById('profile-history-name');
  if (historyAvatar) {
    historyAvatar.innerHTML = renderAvatarHTML(currentProfile.avatar, currentProfile.avatarIsPhoto);
  }
  if (historyName) historyName.textContent = nickname;

  fetch(`/api/stats/user?nickname=${encodeURIComponent(nickname)}`)
    .then(r => r.json())
    .then(data => {
      const history = data.history || [];
      if (history.length === 0) {
        contentEl.innerHTML = '<div class="stats-loading">Aucune partie jouée pour le moment.</div>';
        return;
      }

      const gameNames = {
        theridactle: 'DinOtiste',
        pokedactle: 'PokemOtiste',
        pokecries: 'Ahhhhhh',
        merrydactle: 'Otiste Piece',
        songless: 'Blind Test²',
        imposteur: 'SousLaCouverture',
        geographie: 'Tiéou',
        loup_garou: 'Graouu'
      };

      contentEl.innerHTML = history.map(item => {
        const gameLabel = gameNames[item.game] || item.game;
        const gameIcon = GAME_SVG_ICONS[item.game] || '';
        const dateObj = new Date(item.timestamp);
        const formattedDate = dateObj.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });

        const badgeClass = item.isWinner ? 'history-badge-win' : 'history-badge-loss';
        const badgeText = item.isWinner ? 'Victoire' : 'Défaite';

        let details = [];
        if (item.role) {
          const roleMap = {
            imposteur: 'Imposteur',
            suspect: 'Innocent',
            loup: 'Loup-Garou',
            simple_villageois: 'Simple Villageois',
            voyante: 'Voyante',
            sorciere: 'Sorcière',
            chasseur: 'Chasseur',
            cupidon: 'Cupidon',
            petite_fille: 'Petite Fille',
            voleur: 'Voleur',
            maitre_du_jeu: 'Maître du Jeu'
          };
          details.push(roleMap[item.role] || item.role);
        }
        if (item.score !== undefined && item.score !== null) {
          details.push(`Score : ${item.score}`);
        }
        const scoreOrRoleText = details.join(' • ');

        return `
          <div class="profile-history-card">
            <div class="history-game-info">
              <div class="history-game-name" style="display: inline-flex; align-items: center; gap: 7px;">${gameIcon} <span>${escapeHtml(gameLabel)}</span></div>
              <div class="history-game-date">${formattedDate}</div>
            </div>
            <div class="history-game-result">
              <span class="history-badge ${badgeClass}">${badgeText}</span>
              <span class="history-role">${escapeHtml(scoreOrRoleText)}</span>
            </div>
          </div>
        `;
      }).join('');
    })
    .catch(() => {
      if (contentEl) contentEl.innerHTML = '<div class="stats-loading">Erreur de chargement</div>';
    });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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

// --- MULTIPLAYER DACTLE (DINOTISTE, POKEMOTISTE, OTISTE PIECE) ENGINE ---

const dactleRoomStates = {
  theridactle: { isHost: false, lastState: null, lastPlayersHtml: '' },
  pokedactle: { isHost: false, lastState: null, lastPlayersHtml: '' },
  merrydactle: { isHost: false, lastState: null, lastPlayersHtml: '' }
};

function handleDactleState(gameKey, state) {
  if (!state) return;
  const roomInfo = dactleRoomStates[gameKey];
  roomInfo.lastState = state;

  const myNick = currentProfile?.nickname || '';
  const isHost = (!state.host || state.host.toLowerCase() === myNick.toLowerCase());
  roomInfo.isHost = isHost;

  const prefix = gameKey === 'theridactle' ? 'theridactle' : (gameKey === 'pokedactle' ? 'pokedactle' : 'merrydactle');
  
  // Update Room Code Display
  const codeEl = document.getElementById(`${prefix}-lobby-code`);
  if (codeEl && currentRoomId) codeEl.textContent = currentRoomId;

  // Update Settings Controls
  const roundsSel = document.getElementById(`${prefix}-lobby-rounds-select`);
  const catSel = document.getElementById(`${prefix}-lobby-category-select`);
  const hintsSel = document.getElementById(`${prefix}-lobby-hints-select`);

  if (roundsSel && state.totalRounds) roundsSel.value = state.totalRounds;
  if (catSel && state.category) catSel.value = state.category;
  if (hintsSel && state.hintsAllowed !== undefined) hintsSel.value = state.hintsAllowed;

  if (roundsSel) roundsSel.disabled = !isHost;
  if (catSel) catSel.disabled = !isHost;
  if (hintsSel) hintsSel.disabled = !isHost;

  // Update Start Button & Helper
  const btnStart = document.getElementById(`btn-${prefix}-start-game`);
  const helperStart = document.getElementById(`${prefix}-lobby-helper`);
  if (btnStart) btnStart.style.display = isHost ? 'block' : 'none';
  if (helperStart) helperStart.style.display = isHost ? 'none' : 'block';

  // Update Sidebar Players List
  const playersList = document.getElementById(`${prefix}-sidebar-players`);
  const countEl = document.getElementById(`${prefix}-player-count`);
  const multiPlayersBox = document.getElementById(`${prefix}-multi-players-box`);
  
  if (multiPlayersBox) multiPlayersBox.style.display = 'block';

  const playersArr = state.players ? Object.values(state.players) : [];
  if (countEl) countEl.textContent = playersArr.length;

  if (playersList) {
    const newHtml = playersArr.map(p => {
      const isPlayerHost = state.host && p.nickname.toLowerCase() === state.host.toLowerCase();
      const isMe = p.nickname.toLowerCase() === myNick.toLowerCase();
      const avatarHtml = renderAvatarHTML(p.avatar, p.avatarIsPhoto);
      return `
        <li class="imposteur-player-item ${isMe ? 'is-me' : ''} ${!p.isConnected ? 'is-disconnected' : ''}">
          <div class="player-avatar-small">${avatarHtml}</div>
          <div class="player-info" style="flex: 1; display: flex; flex-direction: column;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="player-name">${escapeHtml(p.nickname)}</span>
              ${isPlayerHost ? '<span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; font-size: 10px; padding: 2px 6px; border-radius: 4px;">👑 Hôte</span>' : ''}
              ${isMe ? '<span class="badge" style="background: rgba(37, 99, 235, 0.2); color: #60a5fa; font-size: 10px; padding: 2px 6px; border-radius: 4px;">Moi</span>' : ''}
            </div>
            <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${p.score || 0} pts</span>
          </div>
        </li>
      `;
    }).join('');

    if (roomInfo.lastPlayersHtml !== newHtml) {
      roomInfo.lastPlayersHtml = newHtml;
      playersList.innerHTML = newHtml;
    }
  }

  // Section Views Toggle
  const lobbyPanel = document.getElementById(`${prefix}-multi-lobby`);
  const activeArea = document.getElementById(`${prefix}-active-area`);
  const roundIndicator = document.getElementById(`${prefix}-round-indicator`);
  const roundDisplay = document.getElementById(`${prefix}-round-display`);
  const totalRoundsDisplay = document.getElementById(`${prefix}-total-rounds-display`);
  const roundBanner = document.getElementById(`${prefix}-round-banner`);
  const roundWinnerText = document.getElementById(`${prefix}-round-winner-text`);
  const btnNextRound = document.getElementById(`btn-${prefix}-next-round`);
  const roundHelper = document.getElementById(`${prefix}-round-helper`);
  const podiumPanel = document.getElementById(`${prefix}-podium-panel`);
  const gameplayBox = document.getElementById(`${prefix}-sidebar-gameplay`);

  if (state.status === 'lobby') {
    if (lobbyPanel) lobbyPanel.classList.remove('view-hidden');
    if (activeArea) activeArea.classList.add('view-hidden');
    if (podiumPanel) podiumPanel.classList.add('view-hidden');
    if (roundBanner) roundBanner.classList.add('view-hidden');
    if (roundIndicator) roundIndicator.style.display = 'none';
    if (gameplayBox) gameplayBox.style.display = 'none';
  } else if (state.status === 'playing') {
    if (lobbyPanel) lobbyPanel.classList.add('view-hidden');
    if (activeArea) activeArea.classList.remove('view-hidden');
    if (podiumPanel) podiumPanel.classList.add('view-hidden');
    if (roundBanner) roundBanner.classList.add('view-hidden');
    if (gameplayBox) gameplayBox.style.display = 'block';
    if (roundIndicator) {
      roundIndicator.style.display = 'flex';
      if (roundDisplay) roundDisplay.textContent = state.roundNumber || 1;
      if (totalRoundsDisplay) totalRoundsDisplay.textContent = state.totalRounds || 3;
    }

    // Sync game state and render article if newly started
    if (gameKey === 'theridactle') {
      if (state.articleHTML && gameState.rawHtml !== state.articleHTML) {
        gameState.rawHtml = state.articleHTML;
        gameState.title = state.title || '';
        gameState.imageUrl = state.imageUrl || null;
        gameState.guesses = state.guesses || [];
        gameState.guessHistory = state.guessHistory || [];
        gameState.isWon = state.isWon || false;
        renderArticle();
        updateSidebar();
      }
    } else if (gameKey === 'pokedactle') {
      if (state.articleHTML && pokedactleGameState.rawHtml !== state.articleHTML) {
        pokedactleGameState.rawHtml = state.articleHTML;
        pokedactleGameState.title = state.title || '';
        pokedactleGameState.imageUrl = state.imageUrl || null;
        pokedactleGameState.guesses = state.guesses || [];
        pokedactleGameState.guessHistory = state.guessHistory || [];
        pokedactleGameState.isWon = state.isWon || false;
        renderPokedactleArticle();
        updatePokedactleSidebar();
      }
    } else if (gameKey === 'merrydactle') {
      if (state.articleHTML && merrydactleGameState.rawHtml !== state.articleHTML) {
        merrydactleGameState.rawHtml = state.articleHTML;
        merrydactleGameState.title = state.title || '';
        merrydactleGameState.imageUrl = state.imageUrl || null;
        merrydactleGameState.guesses = state.guesses || [];
        merrydactleGameState.guessHistory = state.guessHistory || [];
        merrydactleGameState.isWon = state.isWon || false;
        renderMerrydactleArticle();
        updateMerrydactleSidebar();
      }
    }
  } else if (state.status === 'round_ended') {
    if (lobbyPanel) lobbyPanel.classList.add('view-hidden');
    if (activeArea) activeArea.classList.remove('view-hidden');
    if (podiumPanel) podiumPanel.classList.add('view-hidden');
    if (roundBanner) {
      roundBanner.classList.remove('view-hidden');
      if (roundWinnerText) {
        roundWinnerText.innerHTML = `Bravo à <strong>${escapeHtml(state.winner || 'un joueur')}</strong> qui a découvert : <span style="font-weight: 800; color: #fff;">${escapeHtml(state.title || '')}</span> !`;
      }
      if (btnNextRound) btnNextRound.style.display = isHost ? 'inline-flex' : 'none';
      if (roundHelper) roundHelper.style.display = isHost ? 'none' : 'block';
    }
    if (roundIndicator) {
      roundIndicator.style.display = 'flex';
      if (roundDisplay) roundDisplay.textContent = state.roundNumber || 1;
      if (totalRoundsDisplay) totalRoundsDisplay.textContent = state.totalRounds || 3;
    }
  } else if (state.status === 'game_ended') {
    if (lobbyPanel) lobbyPanel.classList.add('view-hidden');
    if (activeArea) activeArea.classList.add('view-hidden');
    if (roundBanner) roundBanner.classList.add('view-hidden');
    if (roundIndicator) roundIndicator.style.display = 'none';
    if (gameplayBox) gameplayBox.style.display = 'none';
    if (podiumPanel) podiumPanel.classList.remove('view-hidden');

    renderDactlePodium(gameKey, state);
  }
}

function renderDactlePodium(gameKey, state) {
  const prefix = gameKey === 'theridactle' ? 'theridactle' : (gameKey === 'pokedactle' ? 'pokedactle' : 'merrydactle');
  const steppedContainer = document.getElementById(`${prefix}-podium-stepped`);
  const fullList = document.getElementById(`${prefix}-podium-full-list`);
  const fullListBox = document.getElementById(`${prefix}-podium-leaderboard-box`);
  const btnRestart = document.getElementById(`btn-${prefix}-restart-lobby`);
  const podiumHelper = document.getElementById(`${prefix}-podium-helper`);

  const isHost = dactleRoomStates[gameKey].isHost;
  if (btnRestart) btnRestart.style.display = isHost ? 'block' : 'none';
  if (podiumHelper) podiumHelper.style.display = isHost ? 'none' : 'block';

  const leaderboard = state.leaderboard || [];
  const top3 = leaderboard.slice(0, 3);

  const displayOrder = [];
  if (top3[1]) displayOrder.push({ player: top3[1], rank: 2 });
  if (top3[0]) displayOrder.push({ player: top3[0], rank: 1 });
  if (top3[2]) displayOrder.push({ player: top3[2], rank: 3 });

  if (steppedContainer) {
    steppedContainer.innerHTML = displayOrder.map(item => {
      const p = item.player;
      const rank = item.rank;
      const isWinner = rank === 1;
      const myNick = currentProfile?.nickname || '';
      const isCurrent = myNick && p.nickname.toLowerCase() === myNick.toLowerCase();
      const avatarHtml = renderAvatarHTML(p.avatar, p.avatarIsPhoto);
      return `
        <div class="podium-col rank-${rank}">
          ${isWinner ? `<div class="podium-crown">👑</div>` : ''}
          <div class="podium-avatar-ring rank-${rank}">
            <div class="podium-avatar">
              ${avatarHtml}
            </div>
          </div>
          <div class="podium-player-name" title="${escapeHtml(p.nickname)}">
            ${escapeHtml(p.nickname)} ${isCurrent ? '<span class="badge-mini-you" style="background: rgba(16,185,129,0.25); color: #10b981; font-size: 10px; padding: 2px 5px; border-radius: 4px; vertical-align: middle; margin-left: 4px;">VOUS</span>' : ''}
          </div>
          <div class="podium-metric-pill rank-${rank}">${p.score} pts</div>
          <div class="podium-step rank-${rank}">
            <span class="podium-step-number">#${rank}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Full list for players 4th and beyond
  const remaining = leaderboard.slice(3);
  if (fullList && fullListBox) {
    if (remaining.length > 0) {
      fullListBox.style.display = 'block';
      fullList.innerHTML = remaining.map((p, idx) => `
        <div class="stats-leaderboard-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-weight: 800; color: var(--text-muted); font-size: 13px; min-width: 24px;">#${idx + 4}</span>
            <div style="width: 28px; height: 28px; border-radius: 50%; overflow: hidden; display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.08);">
              ${renderAvatarHTML(p.avatar, p.avatarIsPhoto)}
            </div>
            <span style="font-weight: 600; font-size: 14px;">${escapeHtml(p.nickname)}</span>
          </div>
          <span style="font-weight: 800; font-family: var(--font-mono); color: var(--color-primary, #10b981); font-size: 14px;">${p.score} pts</span>
        </div>
      `).join('');
    } else {
      fullListBox.style.display = 'none';
      fullList.innerHTML = '';
    }
  }

  // Trigger celebration confetti
  if (typeof triggerConfetti === 'function') triggerConfetti();
}

function sendDactleSettings(gameKey) {
  if (!currentRoomId || !dactleRoomStates[gameKey].isHost) return;
  const prefix = gameKey === 'theridactle' ? 'theridactle' : (gameKey === 'pokedactle' ? 'pokedactle' : 'merrydactle');
  const totalRounds = document.getElementById(`${prefix}-lobby-rounds-select`)?.value || 3;
  const category = document.getElementById(`${prefix}-lobby-category-select`)?.value || 'all';
  const hintsAllowed = document.getElementById(`${prefix}-lobby-hints-select`)?.value || 3;

  fetch(`/api/${gameKey}/room/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: currentRoomId,
      totalRounds: parseInt(totalRounds),
      category,
      hintsAllowed: parseInt(hintsAllowed),
      nickname: currentProfile?.nickname
    })
  });
}

function startDactleGame(gameKey) {
  if (!currentRoomId || !dactleRoomStates[gameKey].isHost) return;
  fetch(`/api/${gameKey}/room/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: currentRoomId,
      nickname: currentProfile?.nickname
    })
  });
}

function nextDactleRound(gameKey) {
  if (!currentRoomId || !dactleRoomStates[gameKey].isHost) return;
  fetch(`/api/${gameKey}/room/next_round`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: currentRoomId,
      nickname: currentProfile?.nickname
    })
  });
}

function restartDactleLobby(gameKey) {
  if (!currentRoomId || !dactleRoomStates[gameKey].isHost) return;
  fetch(`/api/${gameKey}/room/restart_lobby`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: currentRoomId,
      nickname: currentProfile?.nickname
    })
  });
}

function startPlayingTheridactle(roomId, isSolo) {
  currentRoomId = roomId;
  showView('theriGame');
  
  const lobbyPanel = document.getElementById('theridactle-multi-lobby');
  const activeArea = document.getElementById('theridactle-active-area');
  const podiumPanel = document.getElementById('theridactle-podium-panel');
  const playersBox = document.getElementById('theridactle-multi-players-box');
  const gameplayBox = document.getElementById('theridactle-sidebar-gameplay');
  const codeEl = document.getElementById('theridactle-lobby-code');

  if (!isSolo) {
    updateRoomDisplay(true, roomId);
    if (codeEl) codeEl.textContent = roomId;
    if (lobbyPanel) lobbyPanel.classList.remove('view-hidden');
    if (activeArea) activeArea.classList.add('view-hidden');
    if (podiumPanel) podiumPanel.classList.add('view-hidden');
    if (playersBox) playersBox.style.display = 'block';
    if (gameplayBox) gameplayBox.style.display = 'none';
  } else {
    updateRoomDisplay(false);
    if (lobbyPanel) lobbyPanel.classList.add('view-hidden');
    if (activeArea) activeArea.classList.remove('view-hidden');
    if (podiumPanel) podiumPanel.classList.add('view-hidden');
    if (playersBox) playersBox.style.display = 'none';
    if (gameplayBox) gameplayBox.style.display = 'block';
    fetchTheridactleGame(roomId);
  }

  hintsRemaining = 3;
  phraseHintUsed = false;
  const phraseContainer = document.getElementById('phrase-hint-container');
  if (phraseContainer) phraseContainer.style.display = 'none';
  updateHintUI();

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
  const nick = encodeURIComponent(currentProfile?.nickname || 'Paléontologue');
  const av = encodeURIComponent(currentProfile?.avatar || '🦖');
  evtSource = new EventSource(`/api/events?roomId=${roomId}&nickname=${nick}&avatar=${av}`);
  
  evtSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    if (data.type === 'THERIDACTLE_STATE') {
      handleDactleState('theridactle', data.state);
    }
    else if (data.type === 'STATE') {
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
      if (data.state.title) gameState.title = data.state.title;
      if (data.state.imageUrl) gameState.imageUrl = data.state.imageUrl;
      updateSidebar();
      showGiveUp();
    }
    else if (data.type === 'GUESS') {
      if (!gameState.guesses.some(g => g.root === data.root)) {
        gameState.guesses.push({ root: data.root, raw: data.raw, display: data.word });
        gameState.guessHistory.unshift({ word: data.word, hits: data.hits });
      }
      if (data.isWon) {
        gameState.isWon = true;
        if (data.title) gameState.title = data.title;
        if (data.imageUrl) gameState.imageUrl = data.imageUrl;
      }
      
      revealWord(data.root);
      updateSidebar();
      if (gameState.isWon) showWin();
    }
    else if (data.type === 'RESTART') {
      gameState.guesses = [];
      gameState.guessHistory = [];
      gameState.isWon = false;
      gameState.title = data.state.title;
      gameState.rawHtml = data.state.html;
      gameState.imageUrl = data.state.imageUrl;
      hintsRemaining = 3;
      phraseHintUsed = false;
      selectedWord = null;
      const phraseContainer = document.getElementById('phrase-hint-container');
      if (phraseContainer) phraseContainer.style.display = 'none';
      if (dom.winMessage) dom.winMessage.style.display = 'none';
      if (dom.articleContent) dom.articleContent.classList.remove('is-won');
      updateHintUI();
      updateSidebar();
      renderArticle();
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

// --- POKEDACTLE CLIENT LOGIC ---
let pokedactleGameState = {
  guesses: [],
  guessHistory: [],
  isWon: false,
  title: '',
  rawHtml: '',
  imageUrl: null
};
let pokedactleHintsRemaining = 3;
let pokedactlePhraseHintUsed = false;
let isPokedactleHintMode = false;

function createPokedactleRoom(isSolo) {
  showPokedactleMenuError('');
  fetch('/api/pokedactle/room/create', { method: 'POST' })
    .then(r => r.json())
    .then(data => {
      if (data.roomId) startPlayingPokedactle(data.roomId, isSolo);
      else showPokedactleMenuError(data.error || 'Erreur lors de la création.');
    }).catch(() => showPokedactleMenuError('Serveur injoignable'));
}

function joinPokedactleRoom(roomId) {
  showPokedactleMenuError('');
  fetch('/api/pokedactle/room/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId })
  }).then(r => r.json()).then(data => {
    if (data.success) startPlayingPokedactle(data.roomId, false);
    else showPokedactleMenuError('Salon introuvable');
  });
}

function showPokedactleMenuError(msg) {
  if (dom.pokedactleMenuError) {
    dom.pokedactleMenuError.textContent = msg;
    dom.pokedactleMenuError.style.display = msg ? 'block' : 'none';
  }
}

function startPlayingPokedactle(roomId, isSolo) {
  currentRoomId = roomId;
  showView('pokedactleGame');
  
  const lobbyPanel = document.getElementById('pokedactle-multi-lobby');
  const activeArea = document.getElementById('pokedactle-active-area');
  const podiumPanel = document.getElementById('pokedactle-podium-panel');
  const playersBox = document.getElementById('pokedactle-multi-players-box');
  const gameplayBox = document.getElementById('pokedactle-sidebar-gameplay');
  const codeEl = document.getElementById('pokedactle-lobby-code');

  if (!isSolo) {
    updateRoomDisplay(true, roomId);
    localStorage.setItem('pokedactle-roomId', roomId);
    if (codeEl) codeEl.textContent = roomId;
    if (lobbyPanel) lobbyPanel.classList.remove('view-hidden');
    if (activeArea) activeArea.classList.add('view-hidden');
    if (podiumPanel) podiumPanel.classList.add('view-hidden');
    if (playersBox) playersBox.style.display = 'block';
    if (gameplayBox) gameplayBox.style.display = 'none';
  } else {
    updateRoomDisplay(false);
    localStorage.removeItem('pokedactle-roomId');
    if (lobbyPanel) lobbyPanel.classList.add('view-hidden');
    if (activeArea) activeArea.classList.remove('view-hidden');
    if (podiumPanel) podiumPanel.classList.add('view-hidden');
    if (playersBox) playersBox.style.display = 'none';
    if (gameplayBox) gameplayBox.style.display = 'block';
    fetchPokedactleGame(roomId);
  }

  pokedactleHintsRemaining = 3;
  pokedactlePhraseHintUsed = false;
  if (dom.pokedactlePhraseHintContainer) dom.pokedactlePhraseHintContainer.style.display = 'none';
  updatePokedactleHintUI();

  connectPokedactleSSE(roomId);
}

function leavePokedactleRoom() {
  if (evtSource) evtSource.close();
  currentRoomId = null;
  localStorage.removeItem('pokedactle-roomId');
  pokedactleGameState = { guesses: [], guessHistory: [], isWon: false, title: '', rawHtml: '', imageUrl: null };
  
  showView('portal');
  if (dom.pokedactleWinMessage) dom.pokedactleWinMessage.style.display = 'none';
  if (dom.pokedactleJoinInput) dom.pokedactleJoinInput.value = '';
  if (dom.pokedactleArticleContent) dom.pokedactleArticleContent.classList.remove('is-won');
}

function connectPokedactleSSE(roomId) {
  if (evtSource) evtSource.close();
  const nick = encodeURIComponent(currentProfile?.nickname || 'Dresseur');
  const av = encodeURIComponent(currentProfile?.avatar || '⚡');
  evtSource = new EventSource(`/api/events?roomId=${roomId}&nickname=${nick}&avatar=${av}`);
  
  evtSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    if (data.type === 'POKEDACTLE_STATE') {
      handleDactleState('pokedactle', data.state);
    }
    else if (data.type === 'STATE') {
      pokedactleGameState.guesses = data.state.guesses || [];
      pokedactleGameState.guessHistory = data.state.guessHistory || [];
      pokedactleGameState.isWon = data.state.isWon || false;
      updatePokedactleSidebar();
      if (pokedactleGameState.isWon) showPokedactleWin();
    } 
    else if (data.type === 'GIVE_UP') {
      pokedactleGameState.guesses = data.state.guesses || [];
      pokedactleGameState.guessHistory = data.state.guessHistory || [];
      pokedactleGameState.isWon = true;
      if (data.state.title) pokedactleGameState.title = data.state.title;
      if (data.state.imageUrl) pokedactleGameState.imageUrl = data.state.imageUrl;
      updatePokedactleSidebar();
      showPokedactleGiveUp();
    }
    else if (data.type === 'GUESS') {
      if (!pokedactleGameState.guesses.some(g => g.root === data.root)) {
        pokedactleGameState.guesses.push({ root: data.root, raw: data.raw, display: data.word });
        pokedactleGameState.guessHistory.unshift({ word: data.word, hits: data.hits });
      }
      if (data.isWon) {
        pokedactleGameState.isWon = true;
        if (data.title) pokedactleGameState.title = data.title;
        if (data.imageUrl) pokedactleGameState.imageUrl = data.imageUrl;
      }
      
      revealPokedactleWord(data.root);
      updatePokedactleSidebar();
      
      if (data.isWon) {
        showPokedactleWin();
      }
    }
    else if (data.type === 'RESTART') {
      pokedactleGameState.guesses = [];
      pokedactleGameState.guessHistory = [];
      pokedactleGameState.isWon = false;
      pokedactleGameState.title = data.state.title;
      pokedactleGameState.rawHtml = data.state.html;
      pokedactleGameState.imageUrl = data.state.imageUrl;
      pokedactleHintsRemaining = 3;
      pokedactlePhraseHintUsed = false;
      if (dom.pokedactlePhraseHintContainer) dom.pokedactlePhraseHintContainer.style.display = 'none';
      if (dom.pokedactleWinMessage) dom.pokedactleWinMessage.style.display = 'none';
      if (dom.pokedactleArticleContent) dom.pokedactleArticleContent.classList.remove('is-won');
      updatePokedactleHintUI();
      updatePokedactleSidebar();
      renderPokedactleArticle();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
}

function fetchPokedactleGame(roomId) {
  if (dom.pokedactleLoading) dom.pokedactleLoading.style.display = 'block';
  if (dom.pokedactleArticleContent) dom.pokedactleArticleContent.style.opacity = '0.3';
  
  fetch(`/api/pokedactle/game?roomId=${roomId}`)
    .then(r => r.json())
    .then(data => {
      pokedactleGameState.rawHtml = data.html;
      pokedactleGameState.title = data.title;
      pokedactleGameState.imageUrl = data.imageUrl;
      pokedactleGameState.isWon = data.isWon;
      
      if (dom.pokedactleLoading) dom.pokedactleLoading.style.display = 'none';
      if (dom.pokedactleArticleContent) dom.pokedactleArticleContent.style.opacity = '1';
      
      renderPokedactleArticle();
      
      pokedactleGameState.guesses.forEach(g => {
        revealPokedactleWord(g.root);
      });
      
      updatePokedactleSidebar();
      if (pokedactleGameState.isWon) {
        showPokedactleWin();
      }
    });
}

function getPokemonHint() {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = pokedactleGameState.rawHtml;
  const fullText = tempDiv.textContent || tempDiv.innerText;
  const sentences = fullText.split(/[\.\!]\s+/);
  const keywords = ['corps', 'queue', 'ailes', 'pattes', 'yeux', 'couleur', 'flamme', 'plante', 'poison', 'eau', 'feu', 'taille', 'poids', 'ressemble', 'apparence', 'vitesse', 'capacité', 'attaque', 'évolution', 'masque', 'cape', 'fleur', 'arôme'];
  
  for (let s of sentences) {
    s = s.toLowerCase();
    if (keywords.some(k => s.includes(k)) && s.length < 250 && s.length > 35) {
      let result = s;
      const normTitle = normalize(pokedactleGameState.title);
      const titleWords = normTitle.split(/[^a-z0-9]+/gi).filter(w => w.length > 2);
      
      titleWords.forEach(tw => {
        result = result.replace(new RegExp(`\\b${tw}\\b`, 'gi'), 'ce Pokémon');
      });
      return result.charAt(0).toUpperCase() + result.slice(1) + "...";
    }
  }
  return "Ce Pokémon remarquable possède une morphologie unique et des caractéristiques captivantes...";
}

function updatePokedactleHintUI() {
  const total = pokedactleHintsRemaining + (pokedactlePhraseHintUsed ? 0 : 1);
  if (dom.pokedactleHintCountTotal) dom.pokedactleHintCountTotal.textContent = total;
  if (dom.pokedactleHintCountWord) dom.pokedactleHintCountWord.textContent = pokedactleHintsRemaining;
  
  if (dom.pokedactleHintRevealWord) {
    if (pokedactleHintsRemaining <= 0) {
      dom.pokedactleHintRevealWord.classList.add('disabled');
    } else {
      dom.pokedactleHintRevealWord.classList.remove('disabled');
    }
  }
  
  if (dom.btnPokedactleHintPhrase) {
    if (pokedactlePhraseHintUsed) {
      dom.btnPokedactleHintPhrase.classList.add('disabled');
    } else {
      dom.btnPokedactleHintPhrase.classList.remove('disabled');
    }
  }
}

function submitPokedactleGuess(word) {
  if (!word || !currentRoomId) return;
  const rawNorm = normalize(word.trim());
  const root = getRoot(rawNorm);
  
  // If already guessed, highlight existing words and scroll to it
  const alreadyGuessed = pokedactleGameState.guesses.some(g => g.root === root);
  if (alreadyGuessed) {
    revealPokedactleWord(root);
    if (dom.pokedactleGuessInputDesktop) dom.pokedactleGuessInputDesktop.value = '';
    if (dom.pokedactleGuessInputMobile) dom.pokedactleGuessInputMobile.value = '';
    return;
  }

  fetch('/api/pokedactle/guess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      word,
      roomId: currentRoomId,
      nickname: currentProfile?.nickname || '',
      avatar: currentProfile?.avatar || '⚡'
    })
  }).then(r => r.json()).then(data => {
    if (data.success) {
      if (dom.pokedactleGuessInputDesktop) dom.pokedactleGuessInputDesktop.value = '';
      if (dom.pokedactleGuessInputMobile) dom.pokedactleGuessInputMobile.value = '';

      if (!pokedactleGameState.guesses.some(g => g.root === data.root)) {
        pokedactleGameState.guesses.push({ root: data.root, raw: data.raw, display: data.word });
        pokedactleGameState.guessHistory.unshift({ word: data.word, hits: data.hits });
      }
      if (data.isWon) {
        pokedactleGameState.isWon = true;
        if (data.title) pokedactleGameState.title = data.title;
        if (data.imageUrl) pokedactleGameState.imageUrl = data.imageUrl;
      }
      revealPokedactleWord(data.root);
      updatePokedactleSidebar();
      if (data.isWon) {
        showPokedactleWin();
      }
    }
  }).catch(err => console.error('Pokedactle guess error:', err));
}

function createPokedactleRedactedSpan(part, isTitle = false) {
  const norm = normalize(part);
  const root = getRoot(norm);
  
  if (isStopWord(part)) {
    return document.createTextNode(part);
  } else if (pokedactleGameState.guesses.some(g => g.root === root) || pokedactleGameState.isWon) {
    const span = document.createElement('span');
    span.textContent = part;
    span.className = 'revealed';
    span.setAttribute('data-word', norm);
    span.onclick = () => {
      const prevHighlights = dom.pokedactleGameView.querySelectorAll('.highlight');
      prevHighlights.forEach(h => h.classList.remove('highlight'));
      const allMatching = dom.pokedactleGameView.querySelectorAll(`.revealed[data-word="${norm}"]`);
      allMatching.forEach(m => m.classList.add('highlight'));
      span.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    return span;
  } else {
    const span = document.createElement('span');
    span.textContent = part;
    span.className = isTitle ? 'redacted title-word' : 'redacted';
    span.setAttribute('data-word', norm);
    span.setAttribute('data-original', part);
    span.setAttribute('data-length', part.length);
    span.setAttribute('data-root', root);
    
    span.onclick = () => {
      if (window.isPokedactleHintMode) {
        window.isPokedactleHintMode = false;
        document.body.style.cursor = 'default';
        
        const normTitle = normalize(pokedactleGameState.title);
        const titleWords = normTitle.split(/[^a-z0-9]+/gi).filter(w => w.length > 0);
        if (titleWords.includes(norm)) {
          alert("Vous ne pouvez pas utiliser d'indice sur le mot principal !");
          return;
        }

        if (pokedactleHintsRemaining > 0) {
          pokedactleHintsRemaining--;
          updatePokedactleHintUI();
          const originalWord = span.getAttribute('data-original');
          submitPokedactleGuess(originalWord);
        }
      } else {
        span.classList.toggle('show-length');
        if (dom.pokedactleGuessInputDesktop) dom.pokedactleGuessInputDesktop.focus();
        if (dom.pokedactleGuessInputMobile) dom.pokedactleGuessInputMobile.focus();
      }
    };
    return span;
  }
}

function renderPokedactleArticle() {
  if (!dom.pokedactleMainTitle || !dom.pokedactleWikiText) return;
  dom.pokedactleMainTitle.innerHTML = '';
  const titleParts = pokedactleGameState.title.split(/([a-zA-ZÀ-ÿœŒ0-9♀♂\-]+)/g);
  titleParts.forEach(part => {
    if (/[a-zA-ZÀ-ÿœŒ0-9♀♂\-]+/.test(part)) {
      dom.pokedactleMainTitle.appendChild(createPokedactleRedactedSpan(part, true));
    } else {
      dom.pokedactleMainTitle.appendChild(document.createTextNode(part));
    }
  });

  const container = document.createElement('div');
  container.innerHTML = pokedactleGameState.rawHtml;
  
  const selectorsToRemove = [
    '.infobox', '.navbox', '.metadata', '.hatnote', '.ambox', 
    '.reference', '.noprint', 'style', 'script', 'audio', '.thumb', '.mw-empty-elt',
    '.bandeau-portail', '.bandeau', '.toc', '.ruban', '.onglets', 'table', '.tableaustandard',
    '.mw-editsection', '#toc', '.mw-heading-actions', 'center', '.gallery'
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
    const parts = text.split(/([a-zA-ZÀ-ÿœŒ0-9♀♂\-]+)/g);
    
    if (parts.length > 1) {
      const fragment = document.createDocumentFragment();
      parts.forEach(part => {
        if (/[a-zA-ZÀ-ÿœŒ0-9♀♂\-]+/.test(part)) {
          fragment.appendChild(createPokedactleRedactedSpan(part, false));
        } else {
          fragment.appendChild(document.createTextNode(part));
        }
      });
      node.parentNode.replaceChild(fragment, node);
    }
  });

  dom.pokedactleWikiText.innerHTML = '';
  dom.pokedactleWikiText.appendChild(container);
}

function revealPokedactleWord(root) {
  if (!dom.pokedactleGameView) return;
  const spans = dom.pokedactleGameView.querySelectorAll('.redacted');
  const matchingSpans = [];
  
  spans.forEach(span => {
    const spanNorm = span.getAttribute('data-word');
    if (getRoot(spanNorm) === root) {
      span.textContent = span.getAttribute('data-original');
      span.className = 'revealed';
      matchingSpans.push(span);
    }
  });

  const prevHighlights = dom.pokedactleGameView.querySelectorAll('.highlight');
  prevHighlights.forEach(h => h.classList.remove('highlight'));

  if (matchingSpans.length > 0) {
    matchingSpans.forEach(span => span.classList.add('highlight'));
    matchingSpans[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function updatePokedactleSidebar() {
  if (!dom.pokedactleGuessList) return;
  dom.pokedactleGuessList.innerHTML = '';
  
  const total = pokedactleGameState.guessHistory.length;
  if (dom.pokedactleGuessTotalDesktop) dom.pokedactleGuessTotalDesktop.textContent = total;
  if (dom.pokedactleGuessTotalMobile) dom.pokedactleGuessTotalMobile.textContent = total;

  pokedactleGameState.guessHistory.forEach((g, index) => {
    const li = document.createElement('li');
    li.className = 'guess-item';
    
    const rank = total - index;
    li.innerHTML = `
      <span class="col-rank">${rank}</span>
      <span class="col-word">${escapeHtml(g.word)}</span>
      <span class="col-hits ${g.hits > 0 ? 'has-hits' : ''}">${g.hits}</span>
    `;

    li.addEventListener('click', () => {
      const spans = dom.pokedactleGameView.querySelectorAll('.revealed');
      let targetSpan = null;
      spans.forEach(span => {
        if (getRoot(span.getAttribute('data-word')) === getRoot(g.word)) {
          if (!targetSpan) targetSpan = span;
        }
      });
      
      if (targetSpan) {
        const prevHighlights = dom.pokedactleGameView.querySelectorAll('.highlight');
        prevHighlights.forEach(h => h.classList.remove('highlight'));
        
        spans.forEach(span => {
          if (getRoot(span.getAttribute('data-word')) === getRoot(g.word)) {
            span.classList.add('highlight');
          }
        });
        targetSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    dom.pokedactleGuessList.appendChild(li);
  });
}

function showPokedactleWin() {
  if (!dom.pokedactleWinMessage) return;
  const guessesCount = pokedactleGameState.guessHistory.length;
  const pokemonTitle = pokedactleGameState.title || 'Inconnu';
  dom.pokedactleWinMessage.innerHTML = `
    <h2>🎉 Félicitations, Pokémon capturé !</h2>
    <p>Vous avez découvert <strong>${escapeHtml(pokemonTitle)}</strong> en <strong>${guessesCount}</strong> essai(s) !</p>
  `;
  if (pokedactleGameState.imageUrl) {
    dom.pokedactleWinMessage.innerHTML += `<img src="${pokedactleGameState.imageUrl}" style="max-width:280px; border-radius:12px; margin-top:1.5rem; box-shadow: 0 8px 30px rgba(0,0,0,0.5);">`;
  }
  dom.pokedactleWinMessage.innerHTML += `
    <div style="margin-top: 1.5rem;">
      <button id="btn-poke-replay-win" class="btn-primary" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; font-weight: bold; border: none; padding: 0.85rem 2.2rem; font-size: 1rem; border-radius: 12px; cursor: pointer; box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4); transition: transform 0.2s;">
        🔄 Relancer une partie
      </button>
    </div>
  `;
  dom.pokedactleWinMessage.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
  dom.pokedactleWinMessage.style.borderColor = 'rgba(245, 158, 11, 0.4)';
  dom.pokedactleWinMessage.style.display = 'block';
  if (dom.pokedactleArticleContent) dom.pokedactleArticleContent.classList.add('is-won');
  
  const spans = dom.pokedactleGameView.querySelectorAll('.redacted');
  spans.forEach(span => {
    const orig = span.getAttribute('data-original');
    if (orig) span.textContent = orig;
    span.className = 'revealed';
  });

  const replayBtn = document.getElementById('btn-poke-replay-win');
  if (replayBtn) {
    replayBtn.onclick = () => {
      replayBtn.disabled = true;
      replayBtn.textContent = 'Chargement...';
      if (currentRoomId) {
        fetch('/api/pokedactle/restart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: currentRoomId })
        }).finally(() => { replayBtn.disabled = false; });
      } else {
        createPokedactleRoom(true);
      }
    };
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showPokedactleGiveUp() {
  if (!dom.pokedactleWinMessage) return;
  const pokemonTitle = pokedactleGameState.title || 'Inconnu';
  dom.pokedactleWinMessage.innerHTML = `
    <h2>Vous avez abandonné !</h2>
    <p>Le Pokémon mystère était : <strong>${escapeHtml(pokemonTitle)}</strong></p>
  `;
  if (pokedactleGameState.imageUrl) {
    dom.pokedactleWinMessage.innerHTML += `<img src="${pokedactleGameState.imageUrl}" style="max-width:280px; border-radius:12px; margin-top:1.5rem; box-shadow: 0 8px 30px rgba(0,0,0,0.5);">`;
  }
  dom.pokedactleWinMessage.innerHTML += `
    <div style="margin-top: 1.5rem;">
      <button id="btn-poke-replay-giveup" class="btn-primary" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; font-weight: bold; border: none; padding: 0.85rem 2.2rem; font-size: 1rem; border-radius: 12px; cursor: pointer; box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4); transition: transform 0.2s;">
        🔄 Relancer une partie
      </button>
    </div>
  `;
  dom.pokedactleWinMessage.style.backgroundColor = 'rgba(244, 63, 94, 0.15)';
  dom.pokedactleWinMessage.style.borderColor = 'rgba(244, 63, 94, 0.4)';
  dom.pokedactleWinMessage.style.display = 'block';
  if (dom.pokedactleArticleContent) dom.pokedactleArticleContent.classList.add('is-won');
  
  const spans = dom.pokedactleGameView.querySelectorAll('.redacted');
  spans.forEach(span => {
    const orig = span.getAttribute('data-original');
    if (orig) span.textContent = orig;
    span.className = 'revealed';
  });

  const replayBtn = document.getElementById('btn-poke-replay-giveup');
  if (replayBtn) {
    replayBtn.onclick = () => {
      replayBtn.disabled = true;
      replayBtn.textContent = 'Chargement...';
      if (currentRoomId) {
        fetch('/api/pokedactle/restart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: currentRoomId })
        }).finally(() => { replayBtn.disabled = false; });
      } else {
        createPokedactleRoom(true);
      }
    };
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// MERRYDACTLE (ONE PIECE) CLIENT LOGIC
// ==========================================

let merrydactleGameState = {
  guesses: [],
  guessHistory: [],
  isWon: false,
  title: '',
  rawHtml: '',
  imageUrl: null
};

let merrydactleHintsRemaining = 3;
let merrydactlePhraseHintUsed = false;
let isMerrydactleHintMode = false;

function createMerrydactleRoom(isSolo) {
  showMerrydactleMenuError('');
  fetch('/api/merrydactle/room/create', { method: 'POST' })
    .then(r => r.json())
    .then(data => {
      if (data.roomId) startPlayingMerrydactle(data.roomId, isSolo);
      else showMerrydactleMenuError(data.error || 'Erreur lors de la création.');
    }).catch(() => showMerrydactleMenuError('Serveur injoignable'));
}

function joinMerrydactleRoom(roomId) {
  showMerrydactleMenuError('');
  fetch('/api/merrydactle/room/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId })
  }).then(r => r.json()).then(data => {
    if (data.success) startPlayingMerrydactle(data.roomId, false);
    else showMerrydactleMenuError('Salon introuvable');
  });
}

function showMerrydactleMenuError(msg) {
  if (dom.merrydactleMenuError) {
    dom.merrydactleMenuError.textContent = msg;
    dom.merrydactleMenuError.style.display = msg ? 'block' : 'none';
  }
}

function startPlayingMerrydactle(roomId, isSolo) {
  currentRoomId = roomId;
  showView('merrydactleGame');
  
  const lobbyPanel = document.getElementById('merrydactle-multi-lobby');
  const activeArea = document.getElementById('merrydactle-active-area');
  const podiumPanel = document.getElementById('merrydactle-podium-panel');
  const playersBox = document.getElementById('merrydactle-multi-players-box');
  const gameplayBox = document.getElementById('merrydactle-sidebar-gameplay');
  const codeEl = document.getElementById('merrydactle-lobby-code');

  if (!isSolo) {
    updateRoomDisplay(true, roomId);
    localStorage.setItem('merrydactle-roomId', roomId);
    if (codeEl) codeEl.textContent = roomId;
    if (lobbyPanel) lobbyPanel.classList.remove('view-hidden');
    if (activeArea) activeArea.classList.add('view-hidden');
    if (podiumPanel) podiumPanel.classList.add('view-hidden');
    if (playersBox) playersBox.style.display = 'block';
    if (gameplayBox) gameplayBox.style.display = 'none';
  } else {
    updateRoomDisplay(false);
    localStorage.removeItem('merrydactle-roomId');
    if (lobbyPanel) lobbyPanel.classList.add('view-hidden');
    if (activeArea) activeArea.classList.remove('view-hidden');
    if (podiumPanel) podiumPanel.classList.add('view-hidden');
    if (playersBox) playersBox.style.display = 'none';
    if (gameplayBox) gameplayBox.style.display = 'block';
    fetchMerrydactleGame(roomId);
  }

  merrydactleHintsRemaining = 3;
  merrydactlePhraseHintUsed = false;
  if (dom.merrydactlePhraseHintContainer) dom.merrydactlePhraseHintContainer.style.display = 'none';
  updateMerrydactleHintUI();

  connectMerrydactleSSE(roomId);
}

function leaveMerrydactleRoom() {
  if (evtSource) evtSource.close();
  currentRoomId = null;
  localStorage.removeItem('merrydactle-roomId');
  merrydactleGameState = { guesses: [], guessHistory: [], isWon: false, title: '', rawHtml: '', imageUrl: null };
  
  showView('portal');
  if (dom.merrydactleWinMessage) dom.merrydactleWinMessage.style.display = 'none';
  if (dom.merrydactleJoinInput) dom.merrydactleJoinInput.value = '';
  if (dom.merrydactleArticleContent) dom.merrydactleArticleContent.classList.remove('is-won');
}

function connectMerrydactleSSE(roomId) {
  if (evtSource) evtSource.close();
  const nick = encodeURIComponent(currentProfile?.nickname || 'Pirate');
  const av = encodeURIComponent(currentProfile?.avatar || '🏴‍☠️');
  evtSource = new EventSource(`/api/events?roomId=${roomId}&nickname=${nick}&avatar=${av}`);
  
  evtSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    if (data.type === 'MERRYDACTLE_STATE') {
      handleDactleState('merrydactle', data.state);
    }
    else if (data.type === 'STATE') {
      merrydactleGameState.guesses = data.state.guesses || [];
      merrydactleGameState.guessHistory = data.state.guessHistory || [];
      merrydactleGameState.isWon = data.state.isWon || false;
      updateMerrydactleSidebar();
      if (merrydactleGameState.isWon) showMerrydactleWin();
    } 
    else if (data.type === 'GIVE_UP') {
      merrydactleGameState.guesses = data.state.guesses || [];
      merrydactleGameState.guessHistory = data.state.guessHistory || [];
      merrydactleGameState.isWon = true;
      if (data.state.title) merrydactleGameState.title = data.state.title;
      if (data.state.imageUrl) merrydactleGameState.imageUrl = data.state.imageUrl;
      updateMerrydactleSidebar();
      showMerrydactleGiveUp();
    }
    else if (data.type === 'GUESS') {
      if (!merrydactleGameState.guesses.some(g => g.root === data.root)) {
        merrydactleGameState.guesses.push({ root: data.root, raw: data.raw, display: data.word });
        merrydactleGameState.guessHistory.unshift({ word: data.word, hits: data.hits });
      }
      if (data.isWon) {
        merrydactleGameState.isWon = true;
        if (data.title) merrydactleGameState.title = data.title;
        if (data.imageUrl) merrydactleGameState.imageUrl = data.imageUrl;
      }
      
      revealMerrydactleWord(data.root);
      updateMerrydactleSidebar();
      
      if (data.isWon) {
        showMerrydactleWin();
      }
    }
    else if (data.type === 'RESTART') {
      merrydactleGameState.guesses = [];
      merrydactleGameState.guessHistory = [];
      merrydactleGameState.isWon = false;
      merrydactleGameState.title = data.state.title;
      merrydactleGameState.rawHtml = data.state.html;
      merrydactleGameState.imageUrl = data.state.imageUrl;
      merrydactleHintsRemaining = 3;
      merrydactlePhraseHintUsed = false;
      if (dom.merrydactlePhraseHintContainer) dom.merrydactlePhraseHintContainer.style.display = 'none';
      if (dom.merrydactleWinMessage) dom.merrydactleWinMessage.style.display = 'none';
      if (dom.merrydactleArticleContent) dom.merrydactleArticleContent.classList.remove('is-won');
      updateMerrydactleHintUI();
      updateMerrydactleSidebar();
      renderMerrydactleArticle();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
}

function fetchMerrydactleGame(roomId) {
  if (dom.merrydactleLoading) dom.merrydactleLoading.style.display = 'block';
  if (dom.merrydactleArticleContent) dom.merrydactleArticleContent.style.opacity = '0.3';
  
  fetch(`/api/merrydactle/game?roomId=${roomId}`)
    .then(r => r.json())
    .then(data => {
      merrydactleGameState.rawHtml = data.html;
      merrydactleGameState.title = data.title;
      merrydactleGameState.imageUrl = data.imageUrl;
      merrydactleGameState.isWon = data.isWon;
      
      if (dom.merrydactleLoading) dom.merrydactleLoading.style.display = 'none';
      if (dom.merrydactleArticleContent) dom.merrydactleArticleContent.style.opacity = '1';
      
      renderMerrydactleArticle();
      
      merrydactleGameState.guesses.forEach(g => {
        revealMerrydactleWord(g.root);
      });
      
      updateMerrydactleSidebar();
      if (merrydactleGameState.isWon) {
        showMerrydactleWin();
      }
    });
}

function getMerrydactleHint() {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = merrydactleGameState.rawHtml;
  const fullText = tempDiv.textContent || tempDiv.innerText;
  const sentences = fullText.split(/[\.\!]\s+/);
  const keywords = ['pirate', 'équipage', 'fruit', 'démon', 'marine', 'haki', 'capitaine', 'sabre', 'prime', 'chapeau', 'navire', 'île', 'amiral', 'grand line', 'mer', 'pouvoir', 'combat'];
  
  for (let s of sentences) {
    s = s.toLowerCase();
    if (keywords.some(k => s.includes(k)) && s.length < 250 && s.length > 35) {
      let result = s;
      const normTitle = normalize(merrydactleGameState.title);
      const titleWords = normTitle.split(/[^a-z0-9]+/gi).filter(w => w.length > 2);
      
      titleWords.forEach(tw => {
        result = result.replace(new RegExp(`\\b${tw}\\b`, 'gi'), 'cette entité');
      });
      return result.charAt(0).toUpperCase() + result.slice(1) + "...";
    }
  }
  return "Ce sujet emblématique de Grand Line joue un rôle marquant dans l'univers de One Piece...";
}

function updateMerrydactleHintUI() {
  const total = merrydactleHintsRemaining + (merrydactlePhraseHintUsed ? 0 : 1);
  if (dom.merrydactleHintCountTotal) dom.merrydactleHintCountTotal.textContent = total;
  if (dom.merrydactleHintCountWord) dom.merrydactleHintCountWord.textContent = merrydactleHintsRemaining;
  
  if (dom.merrydactleHintRevealWord) {
    if (merrydactleHintsRemaining <= 0) {
      dom.merrydactleHintRevealWord.classList.add('disabled');
    } else {
      dom.merrydactleHintRevealWord.classList.remove('disabled');
    }
  }
  
  if (dom.btnMerrydactleHintPhrase) {
    if (merrydactlePhraseHintUsed) {
      dom.btnMerrydactleHintPhrase.classList.add('disabled');
    } else {
      dom.btnMerrydactleHintPhrase.classList.remove('disabled');
    }
  }
}

function submitMerrydactleGuess(word) {
  if (!word || !currentRoomId) return;
  const rawNorm = normalize(word.trim());
  const root = getRoot(rawNorm);
  
  const alreadyGuessed = merrydactleGameState.guesses.some(g => g.root === root);
  if (alreadyGuessed) {
    revealMerrydactleWord(root);
    if (dom.merrydactleGuessInputDesktop) dom.merrydactleGuessInputDesktop.value = '';
    if (dom.merrydactleGuessInputMobile) dom.merrydactleGuessInputMobile.value = '';
    return;
  }

  fetch('/api/merrydactle/guess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      word,
      roomId: currentRoomId,
      nickname: currentProfile?.nickname || '',
      avatar: currentProfile?.avatar || '🏴‍☠️'
    })
  }).then(r => r.json()).then(data => {
    if (data.success) {
      if (dom.merrydactleGuessInputDesktop) dom.merrydactleGuessInputDesktop.value = '';
      if (dom.merrydactleGuessInputMobile) dom.merrydactleGuessInputMobile.value = '';

      if (!merrydactleGameState.guesses.some(g => g.root === data.root)) {
        merrydactleGameState.guesses.push({ root: data.root, raw: data.raw, display: data.word });
        merrydactleGameState.guessHistory.unshift({ word: data.word, hits: data.hits });
      }
      if (data.isWon) {
        merrydactleGameState.isWon = true;
        if (data.title) merrydactleGameState.title = data.title;
        if (data.imageUrl) merrydactleGameState.imageUrl = data.imageUrl;
      }
      revealMerrydactleWord(data.root);
      updateMerrydactleSidebar();
      if (data.isWon) {
        showMerrydactleWin();
      }
    }
  }).catch(err => console.error('Merrydactle guess error:', err));
}

function createMerrydactleRedactedSpan(part, isTitle = false) {
  const norm = normalize(part);
  const root = getRoot(norm);
  
  if (isStopWord(part)) {
    return document.createTextNode(part);
  } else if (merrydactleGameState.guesses.some(g => g.root === root) || merrydactleGameState.isWon) {
    const span = document.createElement('span');
    span.textContent = part;
    span.className = 'revealed';
    span.setAttribute('data-word', norm);
    span.onclick = () => {
      const prevHighlights = dom.merrydactleGameView.querySelectorAll('.highlight');
      prevHighlights.forEach(h => h.classList.remove('highlight'));
      const allMatching = dom.merrydactleGameView.querySelectorAll(`.revealed[data-word="${norm}"]`);
      allMatching.forEach(m => m.classList.add('highlight'));
      span.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    return span;
  } else {
    const span = document.createElement('span');
    span.textContent = part;
    span.className = isTitle ? 'redacted title-word' : 'redacted';
    span.setAttribute('data-word', norm);
    span.setAttribute('data-original', part);
    span.setAttribute('data-length', part.length);
    span.setAttribute('data-root', root);
    
    span.onclick = () => {
      if (window.isMerrydactleHintMode) {
        window.isMerrydactleHintMode = false;
        document.body.style.cursor = 'default';
        
        const normTitle = normalize(merrydactleGameState.title);
        const titleWords = normTitle.split(/[^a-z0-9]+/gi).filter(w => w.length > 0);
        if (titleWords.includes(norm)) {
          alert("Vous ne pouvez pas utiliser d'indice sur le mot principal !");
          return;
        }

        if (merrydactleHintsRemaining > 0) {
          merrydactleHintsRemaining--;
          updateMerrydactleHintUI();
          const originalWord = span.getAttribute('data-original');
          submitMerrydactleGuess(originalWord);
        }
      } else {
        span.classList.toggle('show-length');
        if (dom.merrydactleGuessInputDesktop) dom.merrydactleGuessInputDesktop.focus();
        if (dom.merrydactleGuessInputMobile) dom.merrydactleGuessInputMobile.focus();
      }
    };
    return span;
  }
}

function renderMerrydactleArticle() {
  if (!dom.merrydactleMainTitle || !dom.merrydactleWikiText) return;
  dom.merrydactleMainTitle.innerHTML = '';
  const titleParts = merrydactleGameState.title.split(/([a-zA-ZÀ-ÿœŒ0-9♀♂\-]+)/g);
  titleParts.forEach(part => {
    if (/[a-zA-ZÀ-ÿœŒ0-9♀♂\-]+/.test(part)) {
      dom.merrydactleMainTitle.appendChild(createMerrydactleRedactedSpan(part, true));
    } else {
      dom.merrydactleMainTitle.appendChild(document.createTextNode(part));
    }
  });

  const container = document.createElement('div');
  container.innerHTML = merrydactleGameState.rawHtml;
  
  const selectorsToRemove = [
    '.infobox', '.navbox', '.metadata', '.hatnote', '.ambox', 
    '.reference', '.noprint', 'style', 'script', 'audio', '.thumb', '.mw-empty-elt',
    '.bandeau-portail', '.bandeau', '.toc', '.ruban', '.onglets', 'table', '.tableaustandard',
    '.mw-editsection', '#toc', '.mw-heading-actions', 'center', '.gallery', '.portable-infobox'
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
    const parts = text.split(/([a-zA-ZÀ-ÿœŒ0-9♀♂\-]+)/g);
    
    if (parts.length > 1) {
      const fragment = document.createDocumentFragment();
      parts.forEach(part => {
        if (/[a-zA-ZÀ-ÿœŒ0-9♀♂\-]+/.test(part)) {
          fragment.appendChild(createMerrydactleRedactedSpan(part, false));
        } else {
          fragment.appendChild(document.createTextNode(part));
        }
      });
      node.parentNode.replaceChild(fragment, node);
    }
  });

  dom.merrydactleWikiText.innerHTML = '';
  dom.merrydactleWikiText.appendChild(container);
}

function revealMerrydactleWord(root) {
  if (!dom.merrydactleGameView) return;
  const spans = dom.merrydactleGameView.querySelectorAll('.redacted');
  const matchingSpans = [];
  
  spans.forEach(span => {
    const spanNorm = span.getAttribute('data-word');
    if (getRoot(spanNorm) === root) {
      span.textContent = span.getAttribute('data-original');
      span.className = 'revealed';
      matchingSpans.push(span);
    }
  });

  const prevHighlights = dom.merrydactleGameView.querySelectorAll('.highlight');
  prevHighlights.forEach(h => h.classList.remove('highlight'));

  if (matchingSpans.length > 0) {
    matchingSpans.forEach(span => span.classList.add('highlight'));
    matchingSpans[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function updateMerrydactleSidebar() {
  if (!dom.merrydactleGuessList) return;
  dom.merrydactleGuessList.innerHTML = '';
  
  const total = merrydactleGameState.guessHistory.length;
  if (dom.merrydactleGuessTotalDesktop) dom.merrydactleGuessTotalDesktop.textContent = total;
  if (dom.merrydactleGuessTotalMobile) dom.merrydactleGuessTotalMobile.textContent = total;

  merrydactleGameState.guessHistory.forEach((g, index) => {
    const li = document.createElement('li');
    li.className = 'guess-item';
    
    const rank = total - index;
    li.innerHTML = `
      <span class="col-rank">${rank}</span>
      <span class="col-word">${escapeHtml(g.word)}</span>
      <span class="col-hits ${g.hits > 0 ? 'has-hits' : ''}">${g.hits}</span>
    `;

    li.addEventListener('click', () => {
      const spans = dom.merrydactleGameView.querySelectorAll('.revealed');
      let targetSpan = null;
      spans.forEach(span => {
        if (getRoot(span.getAttribute('data-word')) === getRoot(g.word)) {
          if (!targetSpan) targetSpan = span;
        }
      });
      
      if (targetSpan) {
        const prevHighlights = dom.merrydactleGameView.querySelectorAll('.highlight');
        prevHighlights.forEach(h => h.classList.remove('highlight'));
        
        spans.forEach(span => {
          if (getRoot(span.getAttribute('data-word')) === getRoot(g.word)) {
            span.classList.add('highlight');
          }
        });
        targetSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    dom.merrydactleGuessList.appendChild(li);
  });
}

function showMerrydactleWin() {
  if (!dom.merrydactleWinMessage) return;
  const guessesCount = merrydactleGameState.guessHistory.length;
  const itemTitle = merrydactleGameState.title || 'Inconnu';
  dom.merrydactleWinMessage.innerHTML = `
    <h2>🎉 Trésor Découvert ! Félicitations !</h2>
    <p>Vous avez découvert <strong>${escapeHtml(itemTitle)}</strong> en <strong>${guessesCount}</strong> coup(s) !</p>
  `;
  if (merrydactleGameState.imageUrl) {
    dom.merrydactleWinMessage.innerHTML += `<img src="${merrydactleGameState.imageUrl}" style="max-width:280px; border-radius:12px; margin-top:1.5rem; box-shadow: 0 8px 30px rgba(0,0,0,0.5);">`;
  }
  dom.merrydactleWinMessage.innerHTML += `
    <div style="margin-top: 1.5rem;">
      <button id="btn-merry-replay-win" class="btn-primary" style="background: linear-gradient(135deg, #f59e0b, #ef4444); color: #fff; font-weight: bold; border: none; padding: 0.85rem 2.2rem; font-size: 1rem; border-radius: 12px; cursor: pointer; box-shadow: 0 4px 20px rgba(239, 68, 68, 0.45); transition: transform 0.2s;">
        🔄 Repartir à l'aventure
      </button>
    </div>
  `;
  dom.merrydactleWinMessage.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
  dom.merrydactleWinMessage.style.borderColor = 'rgba(239, 68, 68, 0.4)';
  dom.merrydactleWinMessage.style.display = 'block';
  if (dom.merrydactleArticleContent) dom.merrydactleArticleContent.classList.add('is-won');
  
  const spans = dom.merrydactleGameView.querySelectorAll('.redacted');
  spans.forEach(span => {
    const orig = span.getAttribute('data-original');
    if (orig) span.textContent = orig;
    span.className = 'revealed';
  });

  const replayBtn = document.getElementById('btn-merry-replay-win');
  if (replayBtn) {
    replayBtn.onclick = () => {
      replayBtn.disabled = true;
      replayBtn.textContent = 'Chargement...';
      if (currentRoomId) {
        fetch('/api/merrydactle/restart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: currentRoomId })
        }).finally(() => { replayBtn.disabled = false; });
      } else {
        createMerrydactleRoom(true);
      }
    };
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showMerrydactleGiveUp() {
  if (!dom.merrydactleWinMessage) return;
  const itemTitle = merrydactleGameState.title || 'Inconnu';
  dom.merrydactleWinMessage.innerHTML = `
    <h2>Vous avez abandonné !</h2>
    <p>Le mystère de Grand Line était : <strong>${escapeHtml(itemTitle)}</strong></p>
  `;
  if (merrydactleGameState.imageUrl) {
    dom.merrydactleWinMessage.innerHTML += `<img src="${merrydactleGameState.imageUrl}" style="max-width:280px; border-radius:12px; margin-top:1.5rem; box-shadow: 0 8px 30px rgba(0,0,0,0.5);">`;
  }
  dom.merrydactleWinMessage.innerHTML += `
    <div style="margin-top: 1.5rem;">
      <button id="btn-merry-replay-giveup" class="btn-primary" style="background: linear-gradient(135deg, #f59e0b, #ef4444); color: #fff; font-weight: bold; border: none; padding: 0.85rem 2.2rem; font-size: 1rem; border-radius: 12px; cursor: pointer; box-shadow: 0 4px 20px rgba(239, 68, 68, 0.45); transition: transform 0.2s;">
        🔄 Relancer une partie
      </button>
    </div>
  `;
  dom.merrydactleWinMessage.style.backgroundColor = 'rgba(244, 63, 94, 0.15)';
  dom.merrydactleWinMessage.style.borderColor = 'rgba(244, 63, 94, 0.4)';
  dom.merrydactleWinMessage.style.display = 'block';
  if (dom.merrydactleArticleContent) dom.merrydactleArticleContent.classList.add('is-won');
  
  const spans = dom.merrydactleGameView.querySelectorAll('.redacted');
  spans.forEach(span => {
    const orig = span.getAttribute('data-original');
    if (orig) span.textContent = orig;
    span.className = 'revealed';
  });

  const replayBtn = document.getElementById('btn-merry-replay-giveup');
  if (replayBtn) {
    replayBtn.onclick = () => {
      replayBtn.disabled = true;
      replayBtn.textContent = 'Chargement...';
      if (currentRoomId) {
        fetch('/api/merrydactle/restart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: currentRoomId })
        }).finally(() => { replayBtn.disabled = false; });
      } else {
        createMerrydactleRoom(true);
      }
    };
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- L'Imposteur Client Logic ---
function showImpMenuError(msg) {
  dom.impMenuError.textContent = msg;
  dom.impMenuError.style.display = msg ? 'block' : 'none';
}

function startPlayingImposteur(roomId, nickname) {
  showView('impGame');
  updateRoomDisplay(true, roomId);
  
  imposteurState.roomId = roomId;
  imposteurState.nickname = nickname;
  imposteurState.myWord = '';
  
  const codeEl = document.getElementById('imposteur-lobby-code');
  if (codeEl) codeEl.textContent = roomId;

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
    currentTurnIndex: 0,
    gameId: null
  };
  
  localStorage.removeItem('imposteur-roomId');
  showView('portal');
  dom.impJoinCodeInput.value = '';
  
  // reset panels visibility
  dom.impLobbyPanel.classList.remove('view-hidden');
  dom.impPlayPanel.classList.add('view-hidden');
  dom.impVotePanel.classList.add('view-hidden');
  dom.impResultsPanel.classList.add('view-hidden');
}

window.kickPlayer = function(targetNickname) {
  if (confirm(`Voulez-vous vraiment exclure ${targetNickname} de la partie ?`)) {
    fetch('/api/imposteur/kick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: imposteurState.roomId, targetNickname })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showToast(`❌ ${targetNickname} a été exclu.`);
      }
    })
    .catch(err => console.error('Failed to kick player', err));
  }
};

function showToast(msg, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '24px';
    container.style.right = '24px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '8px';
    container.style.zIndex = '999999';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `premium-toast ${type}`;
  toast.innerHTML = `<span>${msg}</span>`;
  container.appendChild(toast);
  
  // Force reflow
  toast.offsetHeight;
  
  // Slide in
  toast.classList.add('show');
  
  // Auto remove after 3s
  setTimeout(() => {
    toast.classList.remove('show');
    toast.style.transform = 'translateY(20px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 3000);
}

function copyInvitationLink() {
  const roomId = (dom.roomCodeSpan ? dom.roomCodeSpan.textContent.trim() : '') || currentRoomId || '';
  if (!roomId) return;
  const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
  
  function fallbackCopy(text) {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    el.style.top = '0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    el.setSelectionRange(0, 99999);
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        showToast('🔗 Lien d\'invitation copié !');
      } else {
        window.prompt('Copiez le lien d\'invitation :', text);
      }
    } catch (err) {
      window.prompt('Copiez le lien d\'invitation :', text);
    }
    document.body.removeChild(el);
  }

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(inviteUrl)
      .then(() => {
        showToast('🔗 Lien d\'invitation copié !');
      })
      .catch(() => {
        fallbackCopy(inviteUrl);
      });
  } else {
    fallbackCopy(inviteUrl);
  }
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
  // If game session changed, clear local cached word
  if (state.gameId && state.gameId !== imposteurState.gameId) {
    imposteurState.myWord = '';
    if (dom.impMyWordDisplay) {
      dom.impMyWordDisplay.textContent = '---';
    }
  }
  imposteurState.gameId = state.gameId || null;

  imposteurState.status = state.status;
  imposteurState.theme = state.theme;
  imposteurState.players = state.players;
  imposteurState.turnOrder = state.turnOrder || [];
  imposteurState.currentTurnIndex = state.currentTurnIndex || 0;
  
  // Announcement toast for vote tally results
  if (state.lastTallyResult && state.lastTallyResult.tallyId && state.lastTallyResult.tallyId !== imposteurState.lastTallyId) {
    imposteurState.lastTallyId = state.lastTallyResult.tallyId;
    const res = state.lastTallyResult;
    if (res.type === 'eliminated') {
      showToast(`💀 ${res.message}`, 'error');
    } else if (res.type === 'tie') {
      showToast(`⚖️ ${res.message}`, 'info');
    } else if (res.type === 'skip') {
      showToast(`⏭️ ${res.message}`, 'info');
    } else if (res.type === 'no_votes') {
      showToast(`⏳ ${res.message}`, 'warning');
    }
  }
  
  const playerNames = Object.keys(state.players);
  const myName = imposteurState.nickname;
  
  // Host detection
  const isHost = playerNames.length > 0 && playerNames[0] === myName;
  imposteurState.isHost = isHost;
  
  // Sidebar player list rendering
  dom.impPlayersCount.textContent = playerNames.length;
  
  const impListHtml = playerNames.map(name => {
    const p = state.players[name];
    const isPlayerHost = playerNames[0] === name;
    const isMe = (name === myName);
    
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
    if (p.isConnected === false) {
      badgeHtml += `<span class="badge-item badge-dead" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); color: #f87171;"><span class="badge-emoji">📡</span><span class="badge-text"> Déco</span></span>`;
    }
    
    let kickBtnHtml = '';
    if (isHost && name !== myName && p.isConnected === false) {
      kickBtnHtml = `<button class="btn-kick" onclick="kickPlayer('${escapeHtml(name)}')" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer; transition: all 0.2s; white-space: nowrap; margin-left: 5px;" onmouseover="this.style.background='rgba(239, 68, 68, 0.3)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.2)'">Virer</button>`;
    }
    
    const finalAvatar = isMe && currentProfile && currentProfile.avatar ? currentProfile.avatar : p.avatar;
    const finalIsPhoto = isMe && currentProfile ? currentProfile.avatarIsPhoto : p.avatarIsPhoto;
    const avatarContent = renderAvatarHTML(finalAvatar, finalIsPhoto);

    return `
      <li class="player-item ${isMe ? 'current-player' : ''}">
        <div class="player-info-left" style="opacity: ${p.isConnected === false ? '0.5' : '1'};">
          <div class="player-avatar" style="background: rgba(244, 63, 94, 0.15);">
            ${avatarContent}
          </div>
          <div style="min-width: 0; display: flex; flex-direction: column;">
            <div class="player-name">
              ${escapeHtml(name)}
              ${isMe ? '<span class="badge-mini-you" style="background: rgba(244,63,94,0.25); color: #fb7185;">VOUS</span>' : ''}
            </div>
            ${badgeHtml ? `<div class="player-badges" style="margin-top: 2px;">${badgeHtml}</div>` : ''}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div class="player-stats" style="color: var(--neon-pink);">
            ${p.score || 0} pts
          </div>
          ${kickBtnHtml}
        </div>
      </li>
    `;
  }).join('');

  if (dom.impPlayersList && dom.impPlayersList.dataset.lastHtml !== impListHtml) {
    dom.impPlayersList.innerHTML = impListHtml;
    dom.impPlayersList.dataset.lastHtml = impListHtml;
  }
  
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
    
    // Sync rounds selector dropdown
    const roundsSelect = document.getElementById('imposteur-rounds-select');
    if (roundsSelect) {
      roundsSelect.value = state.descriptionRounds || 1;
      roundsSelect.disabled = !isHost;
    }

    const impostorCountSelect = document.getElementById('imposteur-count-select');
    if (impostorCountSelect) {
      impostorCountSelect.value = state.impostorCount || 1;
      impostorCountSelect.disabled = !isHost;
    }
    
    // Sync scores reset button box
    const resetScoresBox = document.getElementById('imposteur-reset-scores-box');
    if (resetScoresBox) {
      resetScoresBox.style.display = isHost ? 'block' : 'none';
    }

    const impCount = state.impostorCount || 1;
    const minPlayers = (2 * impCount) + 1;
    
    if (isHost) {
      dom.impThemeSelect.disabled = false;
      dom.btnImpStart.style.display = 'block';
      
      if (playerNames.length >= minPlayers) {
        dom.btnImpStart.removeAttribute('disabled');
        dom.btnImpStart.disabled = false;
        dom.impStartHelper.textContent = 'Assez de joueurs ! Lancez la partie quand vous le souhaitez.';
        dom.impStartHelper.style.color = '#34d399';
      } else {
        dom.btnImpStart.setAttribute('disabled', 'true');
        dom.btnImpStart.disabled = true;
        dom.impStartHelper.textContent = `En attente de joueurs (min ${minPlayers} pour ${impCount} imposteur(s), actuel: ${playerNames.length}).`;
        dom.impStartHelper.style.color = 'var(--text-muted)';
      }
    } else {
      dom.impThemeSelect.disabled = true;
      dom.btnImpStart.style.display = 'none';
      dom.impStartHelper.textContent = `Attente que l'hôte configure les paramètres et lance la partie (min ${minPlayers} joueurs)...`;
      dom.impStartHelper.style.color = 'var(--text-muted)';
    }
  }
  
  // Fetch my secret word if empty and we are playing or discussing
  if (state.status === 'playing' || state.status === 'discussing') {
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
  }

  // 2. Playing Phase (Descriptions)
  if (state.status === 'playing') {
    dom.impLobbyPanel.classList.add('view-hidden');
    dom.impPlayPanel.classList.remove('view-hidden');
    dom.impVotePanel.classList.add('view-hidden');
    dom.impResultsPanel.classList.add('view-hidden');
    
    // Check active turn
    const activePlayer = state.turnOrder[state.currentTurnIndex];
    const isMyTurn = (activePlayer === myName);
    
    const myPlayerState = state.players[myName];
    const isMeEliminated = myPlayerState ? myPlayerState.isEliminated : false;
    
    if (isMyTurn && !isMeEliminated) {
      dom.impTurnBar.classList.add('my-turn');
      dom.impTurnStatusText.textContent = `🔔 C'est à votre tour (Tour ${state.currentDescriptionRound}/${state.descriptionRounds}) ! Décrivez votre mot.`;
      dom.impDescForm.classList.remove('view-hidden');
      dom.impDescInput.focus();
    } else if (isMeEliminated) {
      dom.impTurnBar.classList.remove('my-turn');
      dom.impTurnStatusText.textContent = `💀 Éliminé. Attente de la description de ${activePlayer}...`;
      dom.impDescForm.classList.add('view-hidden');
    } else {
      dom.impTurnBar.classList.remove('my-turn');
      dom.impTurnStatusText.textContent = `📢 C'est au tour de ${activePlayer} de donner sa description (Tour ${state.currentDescriptionRound}/${state.descriptionRounds}).`;
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
    
    // Tally button box
    const tallyBox = document.getElementById('imposteur-tally-box');
    if (tallyBox) {
      tallyBox.style.display = 'block';
      const btnTally = document.getElementById('btn-imposteur-tally');
      const helperTally = document.getElementById('tally-helper-text');
      if (isHost) {
        if (btnTally) btnTally.style.display = 'inline-block';
        if (helperTally) helperTally.style.display = 'none';
      } else {
        if (btnTally) btnTally.style.display = 'none';
        if (helperTally) {
          helperTally.style.display = 'block';
          helperTally.textContent = "Attente que l'hôte dépouille les votes...";
        }
      }
    }
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
  const history = state.descriptionHistory || [];
  if (history.length === 0) {
    dom.impDescriptionsList.innerHTML = `<div class="empty-state-text" style="color: var(--text-muted); text-align: center; padding: 1rem;">Aucune description pour le moment.</div>`;
    return;
  }
  history.forEach(item => {
    const p = state.players[item.nickname];
    const avatarHtml = (p && p.avatarIsPhoto && p.avatar) ? `<img src="${p.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : (p ? p.avatar : item.nickname.charAt(0));

    const div = document.createElement('div');
    div.className = 'desc-item';
    const roundBadge = `<span class="desc-round-badge" style="background: rgba(167, 139, 250, 0.12); border: 1px solid rgba(167, 139, 250, 0.25); color: var(--accent); margin-left: 10px; font-size: 10px; padding: 2px 6px; border-radius: 4px; white-space: nowrap; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; font-weight: 800;">Tour ${item.round}</span>`;
    div.innerHTML = `
      <span class="desc-player-avatar" style="overflow:hidden;">${avatarHtml}</span>
      <div class="desc-content">
        <div class="desc-player-name" style="display: flex; align-items: center;">
          ${item.nickname} ${item.nickname === imposteurState.nickname ? '(Vous)' : ''}
          ${roundBadge}
        </div>
        <div class="desc-player-bubble">« ${item.text} »</div>
      </div>
    `;
    dom.impDescriptionsList.appendChild(div);
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

    const avatarHtml = (p.avatarIsPhoto && p.avatar) ? `<img src="${p.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : (p.avatar || name.charAt(0));

    card.innerHTML = `
      <span class="vote-indicator">SUSPECTÉ</span>
      <span class="vote-avatar" style="overflow:hidden;">${avatarHtml}</span>
      <span class="vote-name">${name} ${name === myName ? '(Vous)' : ''}</span>
      ${countBadgeHtml}
    `;    
    // Add vote interaction (users can change their votes now)
    if (!p.isEliminated && !isMeEliminated && name !== myName) {
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

  // Skip Card
  const skipCard = document.createElement('div');
  skipCard.className = 'vote-card skip-card';
  if (myPlayer && myPlayer.votedFor === 'skip') {
    skipCard.classList.add('voted');
  }
  
  const skipCount = voteCounts['skip'] || 0;
  const skipBadgeHtml = skipCount > 0 ? `<span class="vote-count-badge">🗳️ ${skipCount} ${skipCount > 1 ? 'votes' : 'vote'}</span>` : '';
  
  skipCard.innerHTML = `
    <span class="vote-indicator">PASSER</span>
    <span class="vote-avatar" style="background: rgba(255, 255, 255, 0.1);">⏭️</span>
    <span class="vote-name">Passer le vote (Skip)</span>
    ${skipBadgeHtml}
  `;
  
  if (!isMeEliminated) {
    skipCard.addEventListener('click', () => {
      fetch('/api/imposteur/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: imposteurState.roomId,
          nickname: myName,
          votedNickname: 'skip'
        })
      });
    });
  } else {
    skipCard.style.cursor = 'default';
  }
  dom.impVotingGrid.appendChild(skipCard);
}

// --- Quiz Géographie Client Logic ---

function setupInteractiveSvgMap(svgEl, gEl, onCountryClick = null) {
  if (!svgEl || !gEl) return;

  const vbAttr = svgEl.getAttribute('viewBox') || "30.767 241.591 784.077 458.627";
  const vbParts = vbAttr.trim().split(/[\s,]+/).map(Number);
  const vbX = isNaN(vbParts[0]) ? 30.767 : vbParts[0];
  const vbY = isNaN(vbParts[1]) ? 241.591 : vbParts[1];
  const vbWidth = isNaN(vbParts[2]) ? 784.077 : vbParts[2];
  const vbHeight = isNaN(vbParts[3]) ? 458.627 : vbParts[3];

  if (typeof window.mapZoom !== 'number' || isNaN(window.mapZoom)) window.mapZoom = 1.0;
  if (typeof window.mapPanX !== 'number' || isNaN(window.mapPanX)) window.mapPanX = 0;
  if (typeof window.mapPanY !== 'number' || isNaN(window.mapPanY)) window.mapPanY = 0;

  function updateTransform() {
    gEl.setAttribute('transform', `translate(${window.mapPanX}, ${window.mapPanY}) scale(${window.mapZoom})`);
  }

  updateTransform();

  function getSvgCoordinates(clientX, clientY) {
    const rect = svgEl.getBoundingClientRect();
    const pixelX = clientX - rect.left;
    const pixelY = clientY - rect.top;
    const scaleX = vbWidth / (rect.width || 1);
    const scaleY = vbHeight / (rect.height || 1);
    return {
      x: vbX + pixelX * scaleX,
      y: vbY + pixelY * scaleY,
      scaleX,
      scaleY
    };
  }

  function zoomAtPoint(svgX, svgY, factor) {
    const oldZoom = window.mapZoom;
    const newZoom = Math.max(0.7, Math.min(10.0, oldZoom * factor));
    if (newZoom === oldZoom) return;

    const ratio = newZoom / oldZoom;
    window.mapPanX = window.mapPanX * ratio + svgX * (1 - ratio);
    window.mapPanY = window.mapPanY * ratio + svgY * (1 - ratio);
    window.mapZoom = newZoom;

    updateTransform();
  }

  function zoomAtCenter(factor) {
    const rect = svgEl.getBoundingClientRect();
    const center = getSvgCoordinates(rect.left + rect.width / 2, rect.top + rect.height / 2);
    zoomAtPoint(center.x, center.y, factor);
  }

  function resetView() {
    window.mapZoom = 1.0;
    window.mapPanX = 0;
    window.mapPanY = 0;
    updateTransform();
  }

  // Mouse wheel zoom focused on mouse position
  svgEl.addEventListener('wheel', (e) => {
    e.preventDefault();
    const coords = getSvgCoordinates(e.clientX, e.clientY);
    const factor = e.deltaY < 0 ? 1.22 : (1 / 1.22);
    zoomAtPoint(coords.x, coords.y, factor);
  }, { passive: false });

  // Mouse Dragging (1:1 with cursor)
  let isDragging = false;
  let hasDragged = false;
  let lastClientX = 0;
  let lastClientY = 0;

  svgEl.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isDragging = true;
    hasDragged = false;
    lastClientX = e.clientX;
    lastClientY = e.clientY;
    svgEl.style.cursor = 'grabbing';
  });

  const onMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastClientX;
    const dy = e.clientY - lastClientY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasDragged = true;
    }
    const rect = svgEl.getBoundingClientRect();
    const scaleX = vbWidth / (rect.width || 1);
    const scaleY = vbHeight / (rect.height || 1);

    window.mapPanX += dx * scaleX;
    window.mapPanY += dy * scaleY;
    lastClientX = e.clientX;
    lastClientY = e.clientY;
    updateTransform();
  };

  const onMouseUp = () => {
    if (isDragging) {
      isDragging = false;
      svgEl.style.cursor = 'grab';
    }
  };

  if (window._geoPreviousMouseUp) {
    window.removeEventListener('mouseup', window._geoPreviousMouseUp);
  }
  if (window._geoPreviousMouseMove) {
    window.removeEventListener('mousemove', window._geoPreviousMouseMove);
  }
  window._geoPreviousMouseUp = onMouseUp;
  window._geoPreviousMouseMove = onMouseMove;
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  // Touch Support (Pinch to Zoom & Pan)
  let touchStartDist = 0;
  let touchStartZoom = 1.0;
  let touchMidPoint = null;

  svgEl.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      hasDragged = false;
      lastClientX = e.touches[0].clientX;
      lastClientY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      isDragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDist = Math.hypot(dx, dy);
      touchStartZoom = window.mapZoom;
      const midClientX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midClientY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      touchMidPoint = getSvgCoordinates(midClientX, midClientY);
    }
  }, { passive: true });

  svgEl.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && isDragging) {
      hasDragged = true;
      const dx = e.touches[0].clientX - lastClientX;
      const dy = e.touches[0].clientY - lastClientY;
      const rect = svgEl.getBoundingClientRect();
      const scaleX = vbWidth / (rect.width || 1);
      const scaleY = vbHeight / (rect.height || 1);

      window.mapPanX += dx * scaleX;
      window.mapPanY += dy * scaleY;
      lastClientX = e.touches[0].clientX;
      lastClientY = e.touches[0].clientY;
      updateTransform();
    } else if (e.touches.length === 2 && touchStartDist > 0 && touchMidPoint) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const factor = dist / touchStartDist;
      
      const newZoom = Math.max(0.7, Math.min(10.0, touchStartZoom * factor));
      const ratio = newZoom / window.mapZoom;
      window.mapPanX = window.mapPanX * ratio + touchMidPoint.x * (1 - ratio);
      window.mapPanY = window.mapPanY * ratio + touchMidPoint.y * (1 - ratio);
      window.mapZoom = newZoom;
      updateTransform();
    }
  }, { passive: false });

  svgEl.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) touchStartDist = 0;
    if (e.touches.length === 0) isDragging = false;
  });

  // Connect Zoom / Reset buttons if present
  const container = svgEl.closest('.geo-map-container') || svgEl.parentElement;
  if (container) {
    const btnZoomIn = container.querySelector('.geo-btn-zoom-in');
    const btnZoomOut = container.querySelector('.geo-btn-zoom-out');
    const btnReset = container.querySelector('.geo-btn-zoom-reset');

    if (btnZoomIn) btnZoomIn.onclick = (e) => { e.stopPropagation(); zoomAtCenter(1.35); };
    if (btnZoomOut) btnZoomOut.onclick = (e) => { e.stopPropagation(); zoomAtCenter(1 / 1.35); };
    if (btnReset) btnReset.onclick = (e) => { e.stopPropagation(); resetView(); };
  }

  // Country Click Handler
  if (onCountryClick) {
    const countryEls = svgEl.querySelectorAll('#map-pannable-group [id]');
    countryEls.forEach(countryEl => {
      countryEl.addEventListener('click', (e) => {
        if (hasDragged) return;
        onCountryClick(countryEl);
      });
    });
  }
}

function showGeoMenuError(msg) {
  const errDiv = document.getElementById('geographie-menu-error');
  if (errDiv) {
    errDiv.textContent = msg;
    errDiv.style.display = msg ? 'block' : 'none';
  }
}

function startPlayingGeographie(roomId, nickname) {
  showView('geoGame');
  updateRoomDisplay(true, roomId);
  
  geographieState.roomId = roomId;
  geographieState.nickname = nickname;
  
  const codeEl = document.getElementById('geographie-lobby-code');
  if (codeEl) codeEl.textContent = roomId;

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
    const geoListHtml = playerNames.map(name => {
      const p = state.players[name];
      const isPlayerHost = playerNames[0] === name;
      const isMe = (name === myName);
      const finalAvatar = isMe && currentProfile && currentProfile.avatar ? currentProfile.avatar : p.avatar;
      const finalIsPhoto = isMe && currentProfile ? currentProfile.avatarIsPhoto : p.avatarIsPhoto;
      const avatarHtml = renderAvatarHTML(finalAvatar, finalIsPhoto);
      
      let badgeHtml = '';
      if (isPlayerHost) badgeHtml += `<span class="badge-item badge-host"><span class="badge-emoji">⭐</span><span class="badge-text"> Hôte</span></span>`;
      
      if (p.hasAnswered) {
        badgeHtml += `<span class="badge-item badge-voted"><span class="badge-emoji">✅</span><span class="badge-text"> Répondu</span></span>`;
      } else if (state.status === 'question') {
        badgeHtml += `<span class="badge-item badge-thinking"><span class="badge-emoji">💭</span><span class="badge-text"> Réfléchit...</span></span>`;
      }
      
      return `
        <li class="player-item ${isMe ? 'current-player' : ''}">
          <div class="player-info-left">
            <div class="player-avatar" style="background: rgba(0, 242, 254, 0.15);">
              ${avatarHtml}
            </div>
            <div style="min-width: 0; display: flex; flex-direction: column;">
              <div class="player-name">
                ${escapeHtml(name)}
                ${isMe ? '<span class="badge-mini-you" style="background: rgba(0,242,254,0.25); color: #38bdf8;">VOUS</span>' : ''}
              </div>
              ${badgeHtml ? `<div class="player-badges" style="margin-top: 2px;">${badgeHtml}</div>` : ''}
            </div>
          </div>
          <div class="player-stats" style="color: var(--neon-cyan);">
            ${p.score || 0} pts
          </div>
        </li>
      `;
    }).join('');

    if (listUl.dataset.lastHtml !== geoListHtml) {
      listUl.innerHTML = geoListHtml;
      listUl.dataset.lastHtml = geoListHtml;
    }
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
        <div class="geo-map-container" style="position: relative; width: 100%; max-width: 800px; margin: 0 auto; user-select: none;">
          ${hasAnswered ? '<div style="position: absolute; top: 12px; right: 12px; z-index: 10; font-size: 12px; color: #fff; background: rgba(16, 185, 129, 0.25); padding: 5px 10px; border: 1px solid rgba(16, 185, 129, 0.5); border-radius: 20px; pointer-events: none; font-weight: 600; backdrop-filter: blur(5px);">✅ Réponse enregistrée</div>' : '<div style="position: absolute; top: 12px; right: 12px; z-index: 10; font-size: 12px; color: var(--neon-cyan); background: rgba(0,0,0,0.5); padding: 5px 10px; border: 1px solid rgba(0, 242, 254, 0.3); border-radius: 20px; pointer-events: none; font-weight: 600; backdrop-filter: blur(5px);">👆 Cliquez sur le bon pays</div>'}
          
          <div class="geo-map-controls">
            <button type="button" class="geo-btn-zoom-in geo-zoom-btn" title="Zoomer">+</button>
            <button type="button" class="geo-btn-zoom-out geo-zoom-btn" title="Dézoomer">−</button>
            <button type="button" class="geo-btn-zoom-reset geo-zoom-btn" title="Réinitialiser la vue">⟲</button>
          </div>

          <svg id="geographie-interactive-map" viewBox="${window.worldMapSvgViewBox}" style="width: 100%; height: 420px; background: #0d1528; border: 2px solid rgba(0, 242, 254, 0.2); border-radius: 16px; cursor: grab; overflow: hidden; outline: none;">
            <g id="map-pannable-group" transform="translate(${window.mapPanX}, ${window.mapPanY}) scale(${window.mapZoom})">
              <!-- injected world map -->
              ${window.worldMapSvgContent}
            </g>
          </svg>
          
          <div style="margin-top: 0.5rem; text-align: center; font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 500; font-family: sans-serif; letter-spacing: 0.5px;">
            🖱️ Glissez pour déplacer • 🔍 Molette pour zoomer sur le curseur
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

        // Setup focal point zoom and smooth 1:1 panning
        setupInteractiveSvgMap(svgEl, gEl, (!hasAnswered && state.status === 'question') ? (countryEl) => {
          const code = countryEl.id.toLowerCase();
          let countryName = fallbackCountryNames[code] || code.toUpperCase();
          const sil = silhouettes.find(s => s.code && s.code.toLowerCase() === code);
          if (sil) countryName = sil.name;
          submitGeoAnswer(countryName);
        } : null);
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
          <div class="geo-map-container" style="position: relative; width: 100%; max-width: 800px; margin: 0 auto; user-select: none;">
            <div style="position: absolute; top: 12px; left: 12px; z-index: 10; font-size: 12px; font-weight: 700; color: #fff; background: rgba(16, 185, 129, 0.25); padding: 5px 10px; border: 1px solid rgba(16, 185, 129, 0.5); border-radius: 20px; pointer-events: none; backdrop-filter: blur(5px);">✅ ${correctCountryName}</div>
            
            <div class="geo-map-controls">
              <button type="button" class="geo-btn-zoom-in geo-zoom-btn" title="Zoomer">+</button>
              <button type="button" class="geo-btn-zoom-out geo-zoom-btn" title="Dézoomer">−</button>
              <button type="button" class="geo-btn-zoom-reset geo-zoom-btn" title="Réinitialiser la vue">⟲</button>
            </div>

            <svg id="geographie-correction-map" viewBox="${window.worldMapSvgViewBox}" style="width: 100%; height: 380px; background: #0d1528; border: 2px solid rgba(16, 185, 129, 0.3); border-radius: 16px; cursor: grab; overflow: hidden; outline: none;">
              <g id="correction-map-pannable-group" transform="translate(${window.mapPanX}, ${window.mapPanY}) scale(${window.mapZoom})">
                <!-- injected world map -->
                ${window.worldMapSvgContent}
              </g>
            </svg>
            
            <div style="margin-top: 0.5rem; text-align: center; font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 500; font-family: sans-serif; letter-spacing: 0.5px;">
              🖱️ Glissez pour déplacer • 🔍 Molette pour zoomer sur le curseur
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

          // Setup focal point zoom and smooth 1:1 panning
          setupInteractiveSvgMap(svgEl, gEl, null);
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

// --- Loup-Garou Client Logic ---

const loupGarouAllRoles = {
  maitre_du_jeu: { emoji: '👑', name: 'Maître du Jeu', isUnique: true },
  loup: { emoji: '🐺', name: 'Loup-Garou', isUnique: false },
  simple_villageois: { emoji: '👤', name: 'Simple Villageois', isUnique: false },
  voyante: { emoji: '👁️', name: 'Voyante', isUnique: true },
  sorciere: { emoji: '🧪', name: 'Sorcière', isUnique: true },
  chasseur: { emoji: '🎯', name: 'Chasseur', isUnique: true },
  cupidon: { emoji: '💘', name: 'Cupidon', isUnique: true },
  garde: { emoji: '🛡️', name: 'Garde', isUnique: true },
  voleur: { emoji: '🪶', name: 'Voleur', isUnique: true },
  petite_fille: { emoji: '👧', name: 'Petite Fille', isUnique: true },
  bouc_emissaire: { emoji: '🐐', name: 'Bouc Émissaire', isUnique: true },
  idiot_du_village: { emoji: '🤪', name: 'Idiot du Village', isUnique: true },
  montreur_d_ours: { emoji: '🐻', name: "Montreur d'Ours", isUnique: true },
  ancien: { emoji: '👴', name: 'Ancien', isUnique: true }
};

window.prevLoupGarouStatus = null;

window.showRoleTooltip = function(role) {
  const roleDetails = {
    'loup': { emoji: '🐺', name: 'Loup-Garou', desc: 'Dévore un villageois chaque nuit avec la meute.' },
    'voyante': { emoji: '👁️', name: 'Voyante', desc: 'Observe secrètement le rôle d\'un joueur chaque nuit.' },
    'sorciere': { emoji: '🧪', name: 'Sorcière', desc: 'Possède deux potions : une de vie (soigner) et une de mort (tuer).' },
    'chasseur': { emoji: '🎯', name: 'Chasseur', desc: 'En mourant, tire son coup de fusil de vengeance pour éliminer une cible.' },
    'cupidon': { emoji: '💘', name: 'Cupidon', desc: 'Unie deux amoureux éternels la première nuit de la partie.' },
    'garde': { emoji: '🛡️', name: 'Garde', desc: 'Protège un joueur des attaques nocturnes des loups-garous.' },
    'voleur': { emoji: '🪶', name: 'Voleur', desc: 'Choisit entre deux cartes du milieu ou vole le rôle d\'un joueur.' },
    'simple_villageois': { emoji: '👤', name: 'Simple Villageois', desc: 'N\'a aucun pouvoir spécial, tente de démasquer les loups de jour.' },
    'petite_fille': { emoji: '👧', name: 'Petite Fille', desc: 'Peut espionner les loups durant la nuit mais doit rester discrète.' },
    'bouc_emissaire': { emoji: '🐐', name: 'Bouc Émissaire', desc: 'En cas d\'égalité des votes diurnes, est désigné victime d\'office.' },
    'idiot_du_village': { emoji: '🤪', name: 'Idiot du Village', desc: 'Gracié par le village s\'il est voté, mais perd son droit de vote.' },
    'montreur_d_ours': { emoji: '🐻', name: "Montreur d'Ours", desc: 'Son ours grogne le matin si un loup-garou est assis à ses côtés.' },
    'ancien': { emoji: '👴', name: 'Ancien', desc: 'Survit à la première attaque nocturne des loups-garous.' }
  };
  
  const detail = roleDetails[role];
  if (detail) {
    showToast(`${detail.emoji} <strong>${detail.name}</strong> : ${detail.desc}`);
  }
};

window.speakLoupGarouVoice = function(text) {
  const ttsEnabled = localStorage.getItem('loup-garou-tts-enabled') !== 'false';
  if (!ttsEnabled) return;
  
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.volume = 1.0;
    utterance.rate = 0.9;
    
    const voices = window.speechSynthesis.getVoices();
    const frVoice = voices.find(v => v.lang.startsWith('fr'));
    if (frVoice) {
      utterance.voice = frVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  }
};

window.addLoupGarouCard = function(role) {
  if (!loupGarouState.isHost) return;
  if (!loupGarouState.rolesConfig) loupGarouState.rolesConfig = {};
  if (!loupGarouState.rolesConfig.activeCards) {
    loupGarouState.rolesConfig.activeCards = [];
  }
  
  const roleMeta = loupGarouAllRoles[role];
  if (roleMeta && roleMeta.isUnique) {
    if (loupGarouState.rolesConfig.activeCards.includes(role)) {
      showToast("Ce rôle unique est déjà sélectionné !", "error");
      return;
    }
  }
  
  loupGarouState.rolesConfig.activeCards.push(role);
  
  fetch('/api/loup-garou/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: loupGarouState.roomId,
      rolesConfig: loupGarouState.rolesConfig
    })
  });
};

window.removeLoupGarouCard = function(role) {
  if (!loupGarouState.isHost) return;
  if (!loupGarouState.rolesConfig || !loupGarouState.rolesConfig.activeCards) return;
  
  const index = loupGarouState.rolesConfig.activeCards.indexOf(role);
  if (index !== -1) {
    loupGarouState.rolesConfig.activeCards.splice(index, 1);
  }
  
  fetch('/api/loup-garou/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: loupGarouState.roomId,
      rolesConfig: loupGarouState.rolesConfig
    })
  });
};

window.submitVoleurSwap = function(role) {
  fetch('/api/loup-garou/night-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: loupGarouState.roomId,
      nickname: loupGarouState.nickname,
      actionType: 'voleur',
      targetName: role
    })
  });
};


function showLgMenuError(msg) {
  const err = document.getElementById('loup-garou-menu-error');
  if (err) {
    err.textContent = msg;
    err.style.display = msg ? 'block' : 'none';
  }
}

function startPlayingLoupGarou(roomId, nickname) {
  showView('lgGame');
  updateRoomDisplay(true, roomId);
  
  loupGarouState.roomId = roomId;
  loupGarouState.nickname = nickname;
  
  const codeEl = document.getElementById('loup-garou-lobby-code');
  if (codeEl) codeEl.textContent = roomId;

  connectLoupGarouSSE(roomId, nickname);
}

function connectLoupGarouSSE(roomId, nickname) {
  if (evtSource) evtSource.close();
  evtSource = new EventSource(`/api/events?roomId=${roomId}&nickname=${encodeURIComponent(nickname)}`);
  
  evtSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'LOUP_GAROU_STATE') {
      updateLoupGarouUI(data.state);
    }
  };
}

function leaveLoupGarouRoom() {
  if (evtSource) evtSource.close();
  loupGarouState = {
    nickname: '',
    roomId: '',
    isHost: false,
    status: 'lobby',
    players: {},
    historyLogs: [],
    rolesConfig: {},
    myRole: null,
    myAlive: false,
    myCouple: false,
    nightState: {},
    winner: null,
    privateActionData: null
  };
  
  localStorage.removeItem('loup-garou-roomId');
  showView('portal');
  const joinInput = document.getElementById('loup-garou-join-code');
  if (joinInput) joinInput.value = '';
  
  // reset panel visibility
  document.getElementById('loup-garou-lobby-panel').classList.remove('view-hidden');
  document.getElementById('loup-garou-play-panel').classList.add('view-hidden');
  document.getElementById('loup-garou-day-panel').classList.add('view-hidden');
  document.getElementById('loup-garou-results-panel').classList.add('view-hidden');
}

window.kickLoupGarouPlayer = function(targetNickname) {
  if (confirm(`Voulez-vous vraiment exclure ${targetNickname} du village ?`)) {
    fetch('/api/loup-garou/kick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: loupGarouState.roomId, targetNickname })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showToast(`❌ ${targetNickname} a été exclu.`);
      }
    })
    .catch(err => console.error('Failed to kick player', err));
  }
};

window.gmEliminatePlayer = function(targetName, reason) {
  if (!confirm(`Voulez-vous vraiment éliminer ${targetName} ?`)) return;
  fetch('/api/loup-garou/gm/eliminate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: loupGarouState.roomId,
      nickname: loupGarouState.nickname, // GM's nickname
      targetName,
      reason
    })
  });
};

function updateLoupGarouUI(state) {
  loupGarouState.status = state.status;
  loupGarouState.players = state.players;
  loupGarouState.historyLogs = state.historyLogs || [];
  loupGarouState.rolesConfig = state.rolesConfig;
  loupGarouState.myRole = state.myRole;
  loupGarouState.myAlive = state.myAlive;
  loupGarouState.myCouple = state.myCouple;
  loupGarouState.nightState = state.nightState || {};
  loupGarouState.winner = state.winner;
  loupGarouState.privateActionData = state.privateActionData;
  
  const playerNames = Object.keys(state.players);
  const myName = loupGarouState.nickname;
  
  // Host detection
  const isHost = playerNames.length > 0 && playerNames[0] === myName;
  loupGarouState.isHost = isHost;
  
  // Sidebar player list rendering
  const lgPlayersCount = document.getElementById('loup-garou-players-count');
  if (lgPlayersCount) lgPlayersCount.textContent = playerNames.length;
  
  const lgPlayersList = document.getElementById('loup-garou-players-list');
  if (lgPlayersList) {
    const lgListHtml = playerNames.map(name => {
      const p = state.players[name];
      const isPlayerHost = playerNames[0] === name;
      const isMe = (name === myName);
      
      let badgeHtml = '';
      if (isPlayerHost) badgeHtml += `<span class="badge-item badge-host"><svg class="inline-svg" viewBox="0 0 24 24" width="12" height="12" fill="#fbbf24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg><span class="badge-text"> Hôte</span></span>`;
      
      if (!p.isAlive) {
        const deadRoleObj = loupGarouAllRoles[p.role];
        const deadRoleName = deadRoleObj ? deadRoleObj.name : p.role;
        badgeHtml += `<span class="badge-item badge-dead"><svg class="inline-svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><line x1="9" y1="10" x2="9.01" y2="10"></line><line x1="15" y1="10" x2="15.01" y2="10"></line><line x1="10" y1="15" x2="14" y2="15"></line></svg><span class="badge-text"> Mort (${deadRoleName})</span></span>`;
      } else {
        badgeHtml += `<span class="badge-item badge-alive" style="background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3); color: #34d399;"><svg class="inline-svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#34d399" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg><span class="badge-text"> En vie</span></span>`;
        if (p.isLover) {
          badgeHtml += `<span class="badge-item badge-voted" style="background: rgba(236,72,153,0.15); border-color: rgba(236,72,153,0.3); color: #f472b6;"><svg class="inline-svg" viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg><span class="badge-text"> Amoureux</span></span>`;
        }
        if (p.isMayor) {
          badgeHtml += `<span class="badge-item" style="background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.3); color: #fbbf24; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 2px; margin-left: 3px;"><svg class="inline-svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fbbf24" stroke-width="2"><polygon points="2 4 5 20 19 20 22 4 15 10 12 2 9 10 2 4"></polygon></svg><span class="badge-text"> Maire</span></span>`;
        }
      }
      
      if (p.isConnected === false) {
        badgeHtml += `<span class="badge-item badge-dead" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); color: #f87171;"><svg class="inline-svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#f87171" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg><span class="badge-text"> Déco</span></span>`;
      }
      
      let kickBtnHtml = '';
      if (isHost && name !== myName && p.isConnected === false) {
        kickBtnHtml = `<button class="btn-kick" onclick="kickLoupGarouPlayer('${escapeHtml(name)}')" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer; transition: all 0.2s; white-space: nowrap; margin-left: 5px;" onmouseover="this.style.background='rgba(239, 68, 68, 0.3)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.2)'">Virer</button>`;
      }
      
      let roleDisplayHtml = '';
      if (p.role && p.role !== 'mystere') {
        const rObj = loupGarouAllRoles[p.role];
        const rName = rObj ? rObj.name : p.role;
        roleDisplayHtml = `<span style="font-size: 11px; color: #38bdf8; font-weight: 700;">${rName}</span>`;
      }

      const finalAvatar = isMe && currentProfile && currentProfile.avatar ? currentProfile.avatar : p.avatar;
      const finalIsPhoto = isMe && currentProfile ? currentProfile.avatarIsPhoto : p.avatarIsPhoto;
      const avatarContent = renderAvatarHTML(finalAvatar, finalIsPhoto);

      return `
        <li class="player-item ${isMe ? 'current-player' : ''}">
          <div class="player-info-left" style="opacity: ${p.isConnected === false ? '0.5' : '1'};">
            <div class="player-avatar" style="background: rgba(239, 68, 68, 0.15);">
              ${avatarContent}
            </div>
            <div style="min-width: 0; display: flex; flex-direction: column;">
              <div class="player-name" style="text-decoration: ${p.isAlive ? 'none' : 'line-through'}; color: ${p.isAlive ? '#f8fafc' : '#64748b'};">
                ${escapeHtml(name)}
                ${isMe ? '<span class="badge-mini-you" style="background: rgba(239,68,68,0.25); color: #f87171;">VOUS</span>' : ''}
              </div>
              <div style="display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                ${roleDisplayHtml}
                ${badgeHtml}
              </div>
            </div>
          </div>
          <div class="player-badges">
            ${kickBtnHtml}
          </div>
        </li>
      `;
    }).join('');

    if (lgPlayersList.dataset.lastHtml !== lgListHtml) {
      lgPlayersList.innerHTML = lgListHtml;
      lgPlayersList.dataset.lastHtml = lgListHtml;
    }
  }
  
  // Update state panel views
  const lobbyPanel = document.getElementById('loup-garou-lobby-panel');
  const playPanel = document.getElementById('loup-garou-play-panel');
  const dayPanel = document.getElementById('loup-garou-day-panel');
  const resultsPanel = document.getElementById('loup-garou-results-panel');
  
  // Helper to toggle panels
  function showPanel(panel) {
    [lobbyPanel, playPanel, dayPanel, resultsPanel].forEach(p => {
      if (p) {
        if (p === panel) p.classList.remove('view-hidden');
        else p.classList.add('view-hidden');
      }
    });
  }

  // TTS Voice Narration on status transitions
  if (state.status !== window.prevLoupGarouStatus) {
    const prevStatus = window.prevLoupGarouStatus;
    window.prevLoupGarouStatus = state.status;
    
    if (prevStatus && state.status !== 'lobby') {
      let speechText = "";
      switch (state.status) {
        case 'night_voleur':
          speechText = "Le village s'endort... Tout le monde ferme les yeux... Le Voleur se réveille. Voleur, réveillez-vous et choisissez un nouveau rôle.";
          break;
        case 'night_cupidon':
          speechText = (prevStatus === 'lobby' || prevStatus === 'night_voleur')
            ? "Tout le monde s'endort et ferme les yeux... Le Cupidon se réveille. Cupidon, réveillez-vous et unissez deux destins amoureux."
            : "Le Cupidon se réveille. Cupidon, réveillez-vous et unissez deux destins amoureux.";
          break;
        case 'night_garde':
          speechText = (prevStatus === 'lobby' || prevStatus === 'night_cupidon' || prevStatus === 'night_voleur')
            ? "Tout le monde ferme les yeux... Le Garde se réveille. Garde, réveillez-vous et protégez un villageois."
            : "Le Garde se réveille. Garde, réveillez-vous et protégez un villageois.";
          break;
        case 'night_voyante':
          speechText = "La Voyante se réveille. Voyante, réveillez-vous et scrutez l'identité secrète d'un joueur.";
          break;
        case 'night_loup':
          speechText = "Les Loups-Garous se réveillent. Loups-Garous, réveillez-vous, concertez-vous et désignez votre victime de la nuit.";
          break;
        case 'night_sorciere':
          speechText = "La Sorcière se réveille. Sorcière, réveillez-vous. Allez-vous utiliser votre potion de vie ou votre potion de mort ?";
          break;
        case 'day_announcements':
          speechText = "Le village se réveille... Tout le monde ouvre les yeux... Écoutons les nouvelles du matin.";
          break;
        case 'day_vote':
          speechText = "Les débats sont ouverts. C'est l'heure du conseil municipal. Citoyens, votez pour éliminer un suspect.";
          break;
        case 'day_hunter':
          speechText = "Attention, le Chasseur charge son fusil ! Chasseur, tirez votre coup de vengeance avant de mourir.";
          break;
        case 'game_over':
          speechText = "Fin de la partie ! Le rideau tombe et les secrets sont révélés.";
          break;
      }
      
      if (speechText) {
        window.speakLoupGarouVoice(speechText);
      }
    }
  }

  // Lobby Phase
  if (state.status === 'lobby') {
    showPanel(lobbyPanel);
    
    const activeCards = (state.rolesConfig && state.rolesConfig.activeCards) || [];
    const activeCardsCountSpan = document.getElementById('lg-active-cards-count');
    const activeCardsList = document.getElementById('lg-active-cards-list');
    
    if (activeCardsCountSpan) activeCardsCountSpan.textContent = activeCards.length;
    
    // Dynamic active cards render
    if (activeCardsList) {
      activeCardsList.innerHTML = '';
      if (activeCards.length === 0) {
        activeCardsList.innerHTML = '<span style="color: rgba(255,255,255,0.3); font-size: 11px; margin: auto;">Aucun rôle sélectionné. Ajoutez des rôles ci-dessous !</span>';
      } else {
        // Group cards by role to display stacked quantities
        const cardCounts = {};
        activeCards.forEach(role => {
          cardCounts[role] = (cardCounts[role] || 0) + 1;
        });

        Object.keys(cardCounts).forEach(role => {
          const count = cardCounts[role];
          const meta = loupGarouAllRoles[role] || { emoji: '👤', name: role };
          const chip = document.createElement('div');
          chip.style.display = 'inline-flex';
          chip.style.alignItems = 'center';
          chip.style.gap = '6px';
          chip.style.padding = '6px 12px';
          chip.style.background = 'rgba(255, 255, 255, 0.08)';
          chip.style.border = '1px solid rgba(255,255,255,0.15)';
          chip.style.borderRadius = '20px';
          chip.style.fontSize = '11px';
          chip.style.color = '#fff';
          
          let removeBtn = '';
          if (isHost) {
            removeBtn = `<button onclick="removeLoupGarouCard('${role}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-weight: bold; font-size: 14px; padding: 0 0 0 4px; display: flex; align-items: center;">&times;</button>`;
          }
          
          const countText = (count > 1 || role === 'loup' || role === 'simple_villageois') ? ` <span style="color: #ef4444; font-weight: bold; margin-left: 2px;">x${count}</span>` : '';
          chip.innerHTML = `<span>${meta.emoji} ${meta.name}${countText}</span>${removeBtn}`;
          activeCardsList.appendChild(chip);
        });
      }
    }
    
    // Validation
    const playersCount = playerNames.length;
    const isCountValid = activeCards.length === playersCount - 1 && playersCount > 1;
    
    const validationBadge = document.getElementById('lg-validation-badge');
    if (validationBadge) {
      if (isCountValid) {
        validationBadge.textContent = `Compte valide (${activeCards.length} cartes / ${playersCount - 1} joueurs réels) ✅`;
        validationBadge.style.background = 'rgba(16, 185, 129, 0.2)';
        validationBadge.style.borderColor = '#10b981';
        validationBadge.style.color = '#34d399';
      } else {
        validationBadge.textContent = `Compte invalide (${activeCards.length} cartes pour ${playersCount - 1} joueurs réels) ❌`;
        validationBadge.style.background = 'rgba(239, 68, 68, 0.2)';
        validationBadge.style.borderColor = '#ef4444';
        validationBadge.style.color = '#f87171';
      }
    }
    
    // Grid highlighting and lock uniques
    document.querySelectorAll('.role-config-card').forEach(card => {
      const role = card.getAttribute('data-role');
      const roleMeta = loupGarouAllRoles[role];
      const isInDeck = activeCards.includes(role);
      
      if (roleMeta && roleMeta.isUnique && isInDeck) {
        card.style.opacity = '0.5';
        const addBtn = card.querySelector('.btn-lg-add-role');
        if (addBtn) addBtn.style.display = 'none';
      } else {
        card.style.opacity = '1';
        const addBtn = card.querySelector('.btn-lg-add-role');
        if (addBtn) addBtn.style.display = 'flex';
      }
    });
    
    const btnLgStart = document.getElementById('btn-loup-garou-start');
    const startHelper = document.getElementById('loup-garou-start-helper');
    if (isHost) {
      if (btnLgStart) {
        btnLgStart.style.display = 'block';
        btnLgStart.disabled = !isCountValid;
        btnLgStart.style.opacity = isCountValid ? '1' : '0.4';
        btnLgStart.style.cursor = isCountValid ? 'pointer' : 'not-allowed';
        if (isCountValid) {
          btnLgStart.style.background = '#10b981';
          btnLgStart.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.4)';
        } else {
          btnLgStart.style.background = '#ef4444';
          btnLgStart.style.boxShadow = 'none';
        }
      }
      if (startHelper) startHelper.style.display = 'none';
    } else {
      if (btnLgStart) btnLgStart.style.display = 'none';
      if (startHelper) {
        startHelper.style.display = 'block';
        if (isCountValid) {
          startHelper.textContent = "Le paquet est configuré ! Attente que l'hôte lance la partie...";
          startHelper.style.color = '#34d399';
        } else {
          startHelper.textContent = `Configuration en cours par l'hôte (${activeCards.length}/${playersCount} joueurs)...`;
          startHelper.style.color = 'var(--text-muted)';
        }
      }
    }

    // Sync settings (Maire & Timer)
    const chkLgMayor = document.getElementById('chk-loup-garou-mayor');
    if (chkLgMayor) {
      chkLgMayor.checked = !!(state.rolesConfig && state.rolesConfig.useMayor);
      chkLgMayor.disabled = !isHost;
    }
    const selLgTimer = document.getElementById('sel-loup-garou-timer');
    if (selLgTimer) {
      selLgTimer.value = (state.rolesConfig && state.rolesConfig.voteTimer) !== undefined ? state.rolesConfig.voteTimer : 0;
      selLgTimer.disabled = !isHost;
    }
  }
  // Night Sequential Phase
  else if (state.status.startsWith('night_')) {
    showPanel(playPanel);
    
    // Private Secret Card Drawer
    const emojiSpan = document.getElementById('loup-garou-my-role-emoji');
    const nameSpan = document.getElementById('loup-garou-my-role-name');
    const descDiv = document.getElementById('loup-garou-my-role-desc');
    const coupleBadge = document.getElementById('loup-garou-my-couple-badge');
    
    const roleDetails = {
      'maitre_du_jeu': { emoji: '👑', name: 'Maître du Jeu', desc: 'Vous êtes le Maître du Jeu (MJ). Vous orchestrez la partie, réveillez les différents rôles et validez les éliminations sur votre téléphone.' },
      'loup': { emoji: '🐺', name: 'Loup-Garou', desc: 'Vous êtes un cruel Loup-Garou. Dévoilez-vous la nuit pour dévorer des villageois avec vos semblables.' },
      'voyante': { emoji: '👁️', name: 'Voyante', desc: "Vous êtes la Voyante. Chaque nuit, observez secrètement l'identité d'un villageois dans votre boule de cristal." },
      'sorciere': { emoji: '🧪', name: 'Sorcière', desc: 'Vous êtes la Sorcière. Vous possédez deux fioles uniques : une de guérison et un poison mortel.' },
      'chasseur': { emoji: '🎯', name: 'Chasseur', desc: 'Vous êtes le Chasseur. Si vous perdez la vie, votre coup de fusil de vengeance éliminera instantanément un autre joueur.' },
      'cupidon': { emoji: '💘', name: 'Cupidon', desc: 'Vous êtes Cupidon. La première nuit de la partie, vous devez unir deux destins amoureux inséparables.' },
      'garde': { emoji: '🛡️', name: 'Garde', desc: 'Vous êtes le Garde. Chaque nuit, placez votre bouclier protecteur sur un villageois pour lui éviter d\'être dévoré.' },
      'voleur': { emoji: '🪶', name: 'Voleur', desc: 'Vous êtes le Voleur. Choisissez secrètement une des deux cartes du milieu pour échanger votre rôle.' },
      'simple_villageois': { emoji: '👤', name: 'Simple Villageois', desc: 'Vous êtes un Simple Villageois. Votre seule arme est votre intuition diurne pour démasquer les loups.' },
      'petite_fille': { emoji: '👧', name: 'Petite Fille', desc: 'Vous êtes la Petite Fille. Vous pouvez espionner les loups durant la nuit, mais attention à ne pas vous faire surprendre !' },
      'bouc_emissaire': { emoji: '🐐', name: 'Bouc Émissaire', desc: 'Vous êtes le Bouc Émissaire. En cas d\'égalité des votes du village, vous serez automatiquement éliminé.' },
      'idiot_du_village': { emoji: '🤪', name: 'Idiot du Village', desc: 'Vous êtes l\'Idiot du Village. Si le village vote contre vous, votre rôle est révélé et vous survivez sans droit de vote.' },
      'montreur_d_ours': { emoji: '🐻', name: "Montreur d'Ours", desc: 'Vous êtes le Montreur d\'Ours. Si un loup est à côté de vous, votre ours grognera au lever du jour.' },
      'ancien': { emoji: '👴', name: 'Ancien', desc: 'Vous êtes l\'Ancien. Vous pouvez survivre à une première attaque de loups-garous.' }
    };
    
    const details = roleDetails[state.myRole] || { emoji: '👤', name: 'Inconnu', desc: 'Rôle mystère...' };
    if (emojiSpan) emojiSpan.textContent = details.emoji;
    if (nameSpan) nameSpan.textContent = details.name;
    if (descDiv) descDiv.textContent = details.desc;
    if (coupleBadge) coupleBadge.style.display = state.myCouple ? 'block' : 'none';
    
    const turnStatusText = document.getElementById('loup-garou-turn-status-text');
    if (turnStatusText) {
      let phaseFriendlyName = "La Nuit est paisible... 😴";
      switch (state.status) {
        case 'night_voleur': phaseFriendlyName = "Le Voleur s'éveille secrètement... 🪶"; break;
        case 'night_cupidon': phaseFriendlyName = "Cupidon lie deux destins éternels... 💘"; break;
        case 'night_garde': phaseFriendlyName = "Le Garde veille sur les habitants... 🛡️"; break;
        case 'night_voyante': phaseFriendlyName = "La Voyante consulte les astres... 👁️"; break;
        case 'night_loup': phaseFriendlyName = "La meute de Loups-Garous choisit une proie... 🐺🩸"; break;
        case 'night_sorciere': phaseFriendlyName = "La Sorcière s'éveille et prépare ses potions... 🧪"; break;
      }
      turnStatusText.textContent = phaseFriendlyName;
    }
    
    // Default sleep windows
    const sleepWindow = document.getElementById('loup-garou-sleep-window');
    const voleurWindow = document.getElementById('loup-garou-voleur-window');
    const cupidonWindow = document.getElementById('loup-garou-cupidon-window');
    const gardeWindow = document.getElementById('loup-garou-garde-window');
    const voyanteWindow = document.getElementById('loup-garou-voyante-window');
    const wolvesWindow = document.getElementById('loup-garou-wolves-window');
    const sorciereWindow = document.getElementById('loup-garou-sorciere-window');
    const hunterWindow = document.getElementById('loup-garou-hunter-window');
    
    [sleepWindow, voleurWindow, cupidonWindow, gardeWindow, voyanteWindow, wolvesWindow, sorciereWindow, hunterWindow].forEach(w => {
      if (w) {
        w.classList.add('view-hidden');
        if (loupGarouState.isHost && w.id !== 'loup-garou-sleep-window' && w.id !== 'loup-garou-hunter-window') {
           if (!w.querySelector('.gm-skip-btn')) {
             const btn = document.createElement('button');
             btn.className = 'btn btn-quit btn-block gm-skip-btn';
             btn.style.marginTop = '15px';
             btn.textContent = 'Passer cette phase (MJ) ⏩';
             btn.onclick = () => {
                fetch('/api/loup-garou/night-action', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ roomId: loupGarouState.roomId, nickname: loupGarouState.nickname, actionType: 'gm_skip' })
                });
             };
             w.appendChild(btn);
           }
        }
      }
    });
    
    let waken = false;
    
    if (loupGarouState.isHost) {
      const alivePlayers = Object.keys(state.players).filter(name => state.players[name].isAlive);
      
      // Voleur wakes
      if (state.status === 'night_voleur') {
        waken = true;
        if (voleurWindow) {
          voleurWindow.classList.remove('view-hidden');
          const cardsBox = document.getElementById('loup-garou-voleur-cards-box');
          if (cardsBox) {
            cardsBox.innerHTML = '';
            const middleCards = (state.privateActionData && state.privateActionData.voleurMiddleCards) || [];
            if (middleCards.length === 0) {
              cardsBox.innerHTML = '<span style="color: rgba(255,255,255,0.4); font-size: 12px;">Aucun choix possible ou déjà effectué.</span>';
            } else {
              middleCards.forEach(role => {
                const meta = loupGarouAllRoles[role] || { emoji: '❓', name: role };
                const cardBtn = document.createElement('button');
                cardBtn.className = 'btn btn-accent';
                cardBtn.style.padding = '12px';
                cardBtn.style.borderRadius = '10px';
                cardBtn.style.display = 'flex';
                cardBtn.style.flexDirection = 'column';
                cardBtn.style.alignItems = 'center';
                cardBtn.style.gap = '6px';
                cardBtn.style.minWidth = '110px';
                cardBtn.innerHTML = `
                  <div style="font-size: 1.8rem;">${meta.emoji}</div>
                  <div style="font-size: 11px; font-weight: bold; color: #fff;">${meta.name}</div>
                `;
                cardBtn.addEventListener('click', () => {
                  window.submitVoleurSwap(role);
                });
                cardsBox.appendChild(cardBtn);
              });
            }
          }
          const voleurTargetSelect = document.getElementById('loup-garou-voleur-target');
          if (voleurTargetSelect) {
            voleurTargetSelect.innerHTML = '<option value="">-- Choisissez qui voler --</option>';
            alivePlayers.forEach(name => {
              const opt = document.createElement('option');
              opt.value = name; opt.textContent = name;
              voleurTargetSelect.appendChild(opt);
            });
          }
        }
      }
      // Cupidon wakes
      else if (state.status === 'night_cupidon') {
        waken = true;
        if (cupidonWindow) {
          cupidonWindow.classList.remove('view-hidden');
          const lover1Select = document.getElementById('loup-garou-cupid-lover1');
          const lover2Select = document.getElementById('loup-garou-cupid-lover2');
          if (lover1Select && lover2Select) {
            lover1Select.innerHTML = '';
            lover2Select.innerHTML = '';
            alivePlayers.forEach(name => {
              const opt1 = document.createElement('option');
              opt1.value = name; opt1.textContent = name;
              lover1Select.appendChild(opt1);
              
              const opt2 = document.createElement('option');
              opt2.value = name; opt2.textContent = name;
              lover2Select.appendChild(opt2);
            });
          }
        }
      }
      // Garde wakes
      else if (state.status === 'night_garde') {
        waken = true;
        if (gardeWindow) {
          gardeWindow.classList.remove('view-hidden');
          const targetSelect = document.getElementById('loup-garou-garde-target');
          if (targetSelect) {
            targetSelect.innerHTML = '';
            alivePlayers.forEach(name => {
              const opt = document.createElement('option');
              opt.value = name; opt.textContent = name;
              targetSelect.appendChild(opt);
            });
          }
        }
      }
      // Voyante wakes
      else if (state.status === 'night_voyante') {
        waken = true;
        if (voyanteWindow) {
          voyanteWindow.classList.remove('view-hidden');
          const targetSelect = document.getElementById('loup-garou-voyante-target');
          const resultBox = document.getElementById('loup-garou-seer-result');
          const resultText = document.getElementById('loup-garou-seer-result-text');
          const voyanteBtn = document.getElementById('btn-loup-garou-voyante-submit');
          
          if (targetSelect) {
            targetSelect.innerHTML = '';
            alivePlayers.forEach(name => {
              const opt = document.createElement('option');
              opt.value = name; opt.textContent = name;
              targetSelect.appendChild(opt);
            });
          }
          
          if (state.privateActionData && state.privateActionData.seerTarget) {
            if (resultBox) resultBox.style.display = 'block';
            if (resultText) resultText.textContent = `${state.privateActionData.seerTarget} est ${state.privateActionData.seerTargetRole.toUpperCase()} ! 🔮`;
            if (voyanteBtn) voyanteBtn.disabled = true;
            if (targetSelect) targetSelect.disabled = true;
          } else {
            if (resultBox) resultBox.style.display = 'none';
            if (voyanteBtn) voyanteBtn.disabled = false;
            if (targetSelect) targetSelect.disabled = false;
          }
        }
      }
      // Wolves wake
      else if (state.status === 'night_loup') {
        waken = true;
        if (wolvesWindow) {
          wolvesWindow.classList.remove('view-hidden');
          const targetSelect = document.getElementById('loup-garou-wolf-target');
          const votesList = document.getElementById('loup-garou-wolf-votes-list');
          
          if (targetSelect) {
            targetSelect.innerHTML = '';
            alivePlayers.forEach(name => {
              const opt = document.createElement('option');
              opt.value = name; opt.textContent = name;
              targetSelect.appendChild(opt);
            });
          }
          if (votesList) votesList.innerHTML = '';
        }
      }
      // Witch wakes
      else if (state.status === 'night_sorciere') {
        waken = true;
        if (sorciereWindow) {
          sorciereWindow.classList.remove('view-hidden');
          const victimBanner = document.getElementById('loup-garou-witch-victim-banner');
          const healBtn = document.getElementById('btn-loup-garou-witch-heal');
          const killBtn = document.getElementById('btn-loup-garou-witch-kill');
          const killTargetSelect = document.getElementById('loup-garou-witch-kill-target');
          
          const wolfTarget = state.privateActionData ? state.privateActionData.wolfTarget : null;
          if (victimBanner) {
            victimBanner.textContent = wolfTarget 
              ? `Les Loups ont choisi de dévorer : ${wolfTarget} 🩸` 
              : `La meute n'a fait aucune victime cette nuit.`;
          }
          
          if (healBtn) {
            healBtn.disabled = false;
            healBtn.style.opacity = '1';
          }
          if (killBtn) {
            killBtn.disabled = false;
            killBtn.style.opacity = '1';
          }
          
          if (killTargetSelect) {
            killTargetSelect.innerHTML = '<option value="">-- Choisissez qui empoisonner --</option>';
            alivePlayers.forEach(name => {
              const opt = document.createElement('option');
              opt.value = name; opt.textContent = name;
              killTargetSelect.appendChild(opt);
            });
          }
        }
      }
    }
    
    if (!waken && sleepWindow) {
      sleepWindow.classList.remove('view-hidden');
      const h3 = sleepWindow.querySelector('h3');
      const p = sleepWindow.querySelector('p');
      if (h3) h3.textContent = "La Nuit est Sombre...";
      if (p) p.textContent = "Gardez les yeux fermés. Le Maître du Jeu accomplit les actions de la nuit.";
    }
  }
  // Hunter Vengeance Phase
  else if (state.status === 'day_hunter') {
    showPanel(playPanel);
    const sleepWindow = document.getElementById('loup-garou-sleep-window');
    const hunterWindow = document.getElementById('loup-garou-hunter-window');
    
    [sleepWindow, hunterWindow].forEach(w => { if (w) w.classList.add('view-hidden'); });
    
    let activeHunter = null;
    Object.keys(state.players).forEach(name => {
      const p = state.players[name];
      if (p.role === 'chasseur' && !p.isAlive && !p.hasShot) {
        activeHunter = name;
      }
    });
    
    const turnStatusText = document.getElementById('loup-garou-turn-status-text');
    if (turnStatusText) turnStatusText.textContent = "Le Chasseur tire son coup de fusil de vengeance ! 🔫";
    
    if (loupGarouState.isHost) {
      if (hunterWindow) {
        hunterWindow.classList.remove('view-hidden');
        const hunterTargetSelect = document.getElementById('loup-garou-hunter-target');
        if (hunterTargetSelect) {
          hunterTargetSelect.innerHTML = '';
          Object.keys(state.players).filter(n => state.players[n].isAlive).forEach(name => {
            const opt = document.createElement('option');
            opt.value = name; opt.textContent = name;
            hunterTargetSelect.appendChild(opt);
          });
        }
      }
    } else {
      if (sleepWindow) {
        sleepWindow.classList.remove('view-hidden');
        const h3 = sleepWindow.querySelector('h3');
        const p = sleepWindow.querySelector('p');
        if (h3) h3.textContent = "Bruit de fusil... 💥";
        if (p) p.textContent = "Le village retient son souffle pendant que le Maître du Jeu résout le tir...";
      }
    }
  }
  // Day / Debates & Votes Phase
  else if (state.status === 'day_announcements' || state.status === 'day_vote') {
    showPanel(dayPanel);
    
    // Ticking Vote Timer logic
    const timerBanner = document.getElementById('lg-vote-timer-banner');
    if (state.status === 'day_vote' && state.voteTimerEndsAt) {
      if (timerBanner) timerBanner.style.display = 'block';
      
      if (window.lgVoteTimerEndsAt !== state.voteTimerEndsAt) {
        window.lgVoteTimerEndsAt = state.voteTimerEndsAt;
        
        if (loupGarouVoteInterval) {
          clearInterval(loupGarouVoteInterval);
        }
        
        loupGarouVoteInterval = setInterval(() => {
          const remaining = Math.max(0, Math.ceil((window.lgVoteTimerEndsAt - Date.now()) / 1000));
          if (timerBanner) {
            timerBanner.textContent = `⏱️ Temps restant pour délibérer et voter : ${remaining}s`;
          }
          
          if (remaining <= 0) {
            clearInterval(loupGarouVoteInterval);
            loupGarouVoteInterval = null;
            window.lgVoteTimerEndsAt = null;
            // Removed auto tally since GM handles elimination manually
          }
        }, 1000);
        
        // Immediate first tick
        const initialRemaining = Math.max(0, Math.ceil((window.lgVoteTimerEndsAt - Date.now()) / 1000));
        if (timerBanner) {
          timerBanner.textContent = `⏱️ Temps restant pour délibérer et voter : ${initialRemaining}s`;
        }
      }
    } else {
      if (timerBanner) timerBanner.style.display = 'none';
      if (loupGarouVoteInterval) {
        clearInterval(loupGarouVoteInterval);
        loupGarouVoteInterval = null;
      }
      window.lgVoteTimerEndsAt = null;
    }
    
    // History logs entries
    const historyJournal = document.getElementById('loup-garou-history-journal');
    if (historyJournal) {
      historyJournal.innerHTML = '';
      state.historyLogs.forEach(log => {
        const div = document.createElement('div');
        div.style.marginBottom = '6px';
        div.style.borderBottom = '1px solid rgba(255,255,255,0.03)';
        div.style.paddingBottom = '4px';
        div.textContent = log;
        historyJournal.appendChild(div);
      });
      historyJournal.scrollTop = historyJournal.scrollHeight;
    }
    
    const votingArea = document.getElementById('loup-garou-voting-area');
    if (state.status === 'day_vote') {
      if (votingArea) votingArea.classList.remove('view-hidden');
      
      const votingGrid = document.getElementById('loup-garou-voting-grid');
      if (votingGrid) {
        votingGrid.innerHTML = '';
        
        const voteTallies = {};
        Object.keys(state.players).forEach(name => {
          const v = state.players[name].votedFor;
          if (v) {
            const isMayor = state.players[name].isMayor;
            const weight = isMayor ? 2 : 1;
            voteTallies[v] = (voteTallies[v] || 0) + weight;
          }
        });
        
        const myPlayer = state.players[myName];
        const canVote = myPlayer && myPlayer.isAlive;
        const myVote = myPlayer ? myPlayer.votedFor : null;
        
        // Render card for each alive player
        Object.keys(state.players).filter(n => state.players[n].isAlive).forEach(name => {
          const card = document.createElement('div');
          card.className = `vote-card`;
          card.style.border = '1px solid rgba(255,255,255,0.08)';
          card.style.background = 'rgba(255,255,255,0.02)';
          card.style.padding = '12px';
          card.style.borderRadius = '10px';
          card.style.display = 'flex';
          card.style.flexDirection = 'column';
          card.style.alignItems = 'center';
          card.style.position = 'relative';
          
          let actionBtn = '';
          if (loupGarouState.isHost) {
            actionBtn = `
              <button class="btn btn-accent btn-small" onclick="gmEliminatePlayer('${name}', 'vote')" style="margin-top: 10px; width: 100%; font-size: 10px; padding: 4px 8px; background: #ef4444; border-color: #ef4444;">
                Éliminer
              </button>
            `;
          }
          
          card.innerHTML = `
            <div style="font-size: 1.5rem; margin-bottom: 6px;">👤</div>
            <div style="font-weight: bold; font-size: 13px; text-align: center; color: #fff; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${name}</div>
            ${actionBtn}
          `;
          votingGrid.appendChild(card);
        });
        
        // Skip le vote option card
        if (loupGarouState.isHost) {
          const skipCard = document.createElement('div');
          skipCard.className = `vote-card`;
          skipCard.style.border = '1px solid rgba(255,255,255,0.08)';
          skipCard.style.background = 'rgba(255,255,255,0.02)';
          skipCard.style.padding = '12px';
          skipCard.style.borderRadius = '10px';
          skipCard.style.display = 'flex';
          skipCard.style.flexDirection = 'column';
          skipCard.style.alignItems = 'center';
          skipCard.style.position = 'relative';
          
          skipCard.innerHTML = `
            <div style="font-size: 1.5rem; margin-bottom: 6px;">🥱</div>
            <div style="font-weight: bold; font-size: 13px; text-align: center; color: #64748b;">Passer le vote</div>
            <button class="btn btn-small" onclick="gmEliminatePlayer('skip', 'vote')" style="margin-top: 10px; width: 100%; font-size: 10px; padding: 4px 8px; background: #64748b; border-color: #64748b; color: #fff;">
              Skip
            </button>
          `;
          votingGrid.appendChild(skipCard);
        }
      }
      
      const tallyBox = document.getElementById('loup-garou-tally-box');
      if (tallyBox) {
        tallyBox.style.display = 'none'; // Replaced by direct elimination
      }
    } else {
      if (votingArea) votingArea.classList.add('view-hidden');
    }
  }
  // Game Over Phase
  else if (state.status === 'game_over') {
    showPanel(resultsPanel);
    
    const emoji = document.getElementById('loup-garou-results-emoji');
    const title = document.getElementById('loup-garou-results-title');
    const subtitle = document.getElementById('loup-garou-results-subtitle');
    const revealList = document.getElementById('loup-garou-reveal-list');
    
    const winDetails = {
      'villageois': { emoji: '🏡🏆', title: 'Victoire du Village !', subtitle: 'Tous les Loups-Garous ont été éliminés. La paix revient au village.' },
      'loups': { emoji: '🐺🩸', title: 'Victoire des Loups-Garous !', subtitle: 'La meute a dévoré tous les villageois. La nuit régnera à jamais.' },
      'couple': { emoji: '💖🏆', title: 'Victoire des Amoureux !', subtitle: 'L\'amour éternel a surmonté la haine des factions. Seul le couple survit.' }
    };
    
    const wins = winDetails[state.winner] || { 
      emoji: '🏆', 
      title: `Victoire : ${state.winner ? state.winner.toUpperCase() : 'Fin de la Partie'} !`, 
      subtitle: 'La partie est terminée. Le destin a parlé !' 
    };
    if (emoji) emoji.textContent = wins.emoji;
    if (title) title.textContent = wins.title;
    if (subtitle) subtitle.textContent = wins.subtitle;
    
    if (revealList) {
      revealList.innerHTML = '';
      Object.keys(state.players).forEach(name => {
        const p = state.players[name];
        const isLoverText = p.isLover ? ' (💞 Amoureux)' : '';
        const item = document.createElement('div');
        item.style.padding = '8px';
        item.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.innerHTML = `
          <span>👤 <strong>${name}</strong>${isLoverText}</span>
          <span style="font-weight: bold; color: #ef4444;">${p.role.toUpperCase()} ${p.isAlive ? '❤️ En vie' : '💀 Mort'}</span>
        `;
        revealList.appendChild(item);
      });
    }
    
    const restartBtn = document.getElementById('btn-loup-garou-restart');
    const restartHelper = document.getElementById('loup-garou-restart-helper');
    if (isHost) {
      if (restartBtn) restartBtn.style.display = 'block';
      if (restartHelper) restartHelper.style.display = 'none';
    } else {
      if (restartBtn) restartBtn.style.display = 'none';
      if (restartHelper) {
        restartHelper.style.display = 'block';
        restartHelper.textContent = "Attente que l'hôte lance un nouveau rituel...";
      }
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
  const dinoTitle = gameState.title || 'Inconnu';
  const guessesCount = gameState.guessHistory.length;
  dom.winMessage.innerHTML = `
    <h2>🎉 Félicitations !</h2>
    <p>Vous avez découvert <strong>${escapeHtml(dinoTitle)}</strong> en <strong>${guessesCount}</strong> essai(s) !</p>
  `;
  if (gameState.imageUrl) {
    dom.winMessage.innerHTML += `<img src="${gameState.imageUrl}" style="max-width:100%; border-radius:12px; margin-top:1.5rem; box-shadow: 0 8px 30px rgba(0,0,0,0.5);">`;
  }
  dom.winMessage.innerHTML += `
    <div style="margin-top: 1.5rem;">
      <button id="btn-theri-replay-win" class="btn-primary" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; font-weight: bold; border: none; padding: 0.85rem 2.2rem; font-size: 1rem; border-radius: 12px; cursor: pointer; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4); transition: transform 0.2s;">
        🔄 Relancer une partie
      </button>
    </div>
  `;
  dom.winMessage.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
  dom.winMessage.style.borderColor = 'rgba(16, 185, 129, 0.4)';
  dom.winMessage.style.display = 'block';
  dom.articleContent.classList.add('is-won');
  
  const spans = document.querySelectorAll('.redacted');
  spans.forEach(span => {
    span.textContent = span.getAttribute('data-original');
    span.className = 'revealed';
  });

  const replayBtn = document.getElementById('btn-theri-replay-win');
  if (replayBtn) {
    replayBtn.onclick = () => {
      replayBtn.disabled = true;
      replayBtn.textContent = 'Chargement...';
      if (currentRoomId) {
        fetch('/api/restart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: currentRoomId })
        }).finally(() => { replayBtn.disabled = false; });
      } else {
        createTheridactleRoom(true);
      }
    };
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showGiveUp() {
  const dinoTitle = gameState.title || 'Inconnu';
  dom.winMessage.innerHTML = `
    <h2>Vous avez abandonné !</h2>
    <p>Le dinosaure était : <strong>${escapeHtml(dinoTitle)}</strong></p>
  `;
  if (gameState.imageUrl) {
    dom.winMessage.innerHTML += `<img src="${gameState.imageUrl}" style="max-width:100%; border-radius:12px; margin-top:1.5rem; box-shadow: 0 8px 30px rgba(0,0,0,0.5);">`;
  }
  dom.winMessage.innerHTML += `
    <div style="margin-top: 1.5rem;">
      <button id="btn-theri-replay-giveup" class="btn-primary" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; font-weight: bold; border: none; padding: 0.85rem 2.2rem; font-size: 1rem; border-radius: 12px; cursor: pointer; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4); transition: transform 0.2s;">
        🔄 Relancer une partie
      </button>
    </div>
  `;
  dom.winMessage.style.backgroundColor = 'rgba(244, 63, 94, 0.15)';
  dom.winMessage.style.borderColor = 'rgba(244, 63, 94, 0.4)';
  dom.winMessage.style.display = 'block';
  dom.articleContent.classList.add('is-won');
  
  const spans = document.querySelectorAll('.redacted');
  spans.forEach(span => {
    const orig = span.getAttribute('data-original');
    if (orig) span.textContent = orig;
    span.className = 'revealed';
  });

  const replayBtn = document.getElementById('btn-theri-replay-giveup');
  if (replayBtn) {
    replayBtn.onclick = () => {
      replayBtn.disabled = true;
      replayBtn.textContent = 'Chargement...';
      if (currentRoomId) {
        fetch('/api/restart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: currentRoomId })
        }).finally(() => { replayBtn.disabled = false; });
      } else {
        createTheridactleRoom(true);
      }
    };
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// ==========================================
// SONGLESS (CARASONG) MODULE - FULL ROOM & 2-COL UI
// ==========================================

let songlessAudio = new Audio();
let songlessFullAudio = new Audio();
let songlessStreak = 0;
let songlessScore = 0;

let songlessState = {
  songId: null,
  previewUrl: null,
  category: 'all',
  mode: 'infinite', // 'infinite', 'multi'
  durations: [0.1, 0.5, 1.0, 2.5, 5.0, 10.0],
  attemptIndex: 0,
  guesses: [], // [{ title, artist, status: 'correct'|'artist_match'|'wrong'|'skipped' }]
  isOver: false,
  isWon: false,
  solution: null,
  roomId: null,
  isHost: false,
  selectedSearchResult: null
};

let songlessPlayRaf = null;
let songlessPlayTimer = null;

function initSonglessUI() {
  const btnSolo = document.getElementById('btn-songless-solo');
  const btnNextSong = document.getElementById('btn-songless-next-song');
  const btnCreate = document.getElementById('btn-songless-create-room');
  const btnJoin = document.getElementById('btn-songless-join-room');
  const joinInput = document.getElementById('songless-room-code-input');
  const nickInput = document.getElementById('songless-player-nickname');

  const lobbyPillsContainer = document.getElementById('songless-lobby-theme-pills');
  const lobbyHelper = document.getElementById('songless-lobby-theme-helper');
  const lobbyRoundsSelect = document.getElementById('songless-lobby-rounds-select');

  function getSelectedSonglessCategories() {
    if (!lobbyPillsContainer) return 'all';
    const activePills = lobbyPillsContainer.querySelectorAll('.theme-pill.active');
    const vals = Array.from(activePills).map(p => p.getAttribute('data-value'));
    if (vals.includes('all') || vals.length === 0 || vals.length >= 9) return 'all';
    return vals.join(',');
  }

  function updateSonglessLobbyHelperText() {
    if (!lobbyHelper || !lobbyPillsContainer) return;
    const activePills = lobbyPillsContainer.querySelectorAll('.theme-pill.active');
    const vals = Array.from(activePills).map(p => p.getAttribute('data-value'));
    if (vals.includes('all') || vals.length === 0 || vals.length >= 9) {
      lobbyHelper.textContent = "Tous les thèmes sont activés pour cette session.";
    } else {
      lobbyHelper.textContent = `${vals.length} univers sélectionné${vals.length > 1 ? 's' : ''}.`;
    }
  }

  function syncSonglessLobbySettingsToServer() {
    if (songlessState.roomId && songlessState.isHost) {
      const cat = getSelectedSonglessCategories();
      const val = lobbyRoundsSelect ? lobbyRoundsSelect.value : '10';
      const rounds = (val === 'infinite' || val === '0') ? 0 : (parseInt(val, 10) || 10);
      fetch('/api/songless/room/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: songlessState.roomId, category: cat, totalRounds: rounds })
      });
    }
  }

  if (lobbyPillsContainer) {
    lobbyPillsContainer.querySelectorAll('.theme-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        if (!songlessState.isHost) return;
        const val = pill.getAttribute('data-value');
        if (val === 'all') {
          lobbyPillsContainer.querySelectorAll('.theme-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
        } else {
          const allPill = lobbyPillsContainer.querySelector('.theme-pill[data-value="all"]');
          if (allPill) allPill.classList.remove('active');
          pill.classList.toggle('active');
          const remainingActive = lobbyPillsContainer.querySelectorAll('.theme-pill.active');
          if (remainingActive.length === 0 && allPill) {
            allPill.classList.add('active');
          }
        }
        updateSonglessLobbyHelperText();
        syncSonglessLobbySettingsToServer();
      });
    });
  }

  if (lobbyRoundsSelect) {
    lobbyRoundsSelect.addEventListener('change', () => {
      syncSonglessLobbySettingsToServer();
    });
  }

  // Pre-fill profile nickname
  if (nickInput && currentProfile && currentProfile.nickname) {
    nickInput.value = currentProfile.nickname;
  }

  // Direct portal button
  const btnPortalSongless = document.getElementById('btn-portal-songless');
  if (btnPortalSongless) {
    btnPortalSongless.addEventListener('click', (e) => {
      e.stopPropagation();
      showView('songlessMenu');
    });
  }

  if (btnSolo) {
    btnSolo.addEventListener('click', () => {
      const nick = getSonglessNickname();
      if (!nick) return;
      startSonglessGame('infinite', 'all');
    });
  }

  if (btnNextSong) {
    btnNextSong.addEventListener('click', () => {
      startSonglessGame('infinite', songlessState.category || 'all');
    });
  }

  if (btnCreate) {
    btnCreate.addEventListener('click', () => {
      const nick = getSonglessNickname();
      if (!nick) return;
      createSonglessRoom(nick, 'all');
    });
  }

  if (btnJoin) {
    btnJoin.addEventListener('click', () => {
      const nick = getSonglessNickname();
      if (!nick) return;
      const code = (joinInput ? joinInput.value : '').trim().toUpperCase();
      if (code.length >= 4) {
        joinSonglessRoom(code, nick);
      } else {
        alert("Veuillez entrer un code de salon valide à 4 lettres.");
      }
    });
  }

  // Play button
  const btnPlay = document.getElementById('btn-songless-play');
  if (btnPlay) {
    btnPlay.addEventListener('click', toggleSonglessPlay);
  }

  // Skip button
  const btnSkip = document.getElementById('btn-songless-skip');
  if (btnSkip) {
    btnSkip.addEventListener('click', skipSonglessAttempt);
  }

  // Give up button
  const btnGiveUp = document.getElementById('btn-songless-giveup');
  if (btnGiveUp) {
    btnGiveUp.addEventListener('click', () => {
      if (!songlessState.isOver) {
        endSonglessGame(false);
      }
    });
  }

  // Submit button
  const btnSubmit = document.getElementById('btn-songless-submit');
  if (btnSubmit) {
    btnSubmit.addEventListener('click', submitSonglessGuess);
  }

  // Full 30s audio button in result panel
  const btnFullPlay = document.getElementById('btn-songless-full-play');
  if (btnFullPlay) {
    btnFullPlay.addEventListener('click', toggleSonglessFullAudio);
  }
  if (songlessFullAudio) {
    songlessFullAudio.addEventListener('play', () => updateSonglessFullPlayButtonState(true));
    songlessFullAudio.addEventListener('pause', () => updateSonglessFullPlayButtonState(false));
    songlessFullAudio.addEventListener('ended', () => updateSonglessFullPlayButtonState(false));
  }
  const fullAudioEl = document.getElementById('songless-full-audio');
  if (fullAudioEl) {
    fullAudioEl.addEventListener('play', () => updateSonglessFullPlayButtonState(true));
    fullAudioEl.addEventListener('pause', () => updateSonglessFullPlayButtonState(false));
    fullAudioEl.addEventListener('ended', () => updateSonglessFullPlayButtonState(false));
  }

  // Share score button
  const btnShare = document.getElementById('btn-songless-share');
  if (btnShare) {
    btnShare.addEventListener('click', shareSonglessScore);
  }

  // Host start multi button
  const btnHostStart = document.getElementById('btn-songless-host-start');
  if (btnHostStart) {
    btnHostStart.addEventListener('click', async () => {
      if (songlessState.roomId) {
        btnHostStart.disabled = true;
        btnHostStart.textContent = "Lancement en cours...";
        try {
          const cat = getSelectedSonglessCategories();
          const val = lobbyRoundsSelect ? lobbyRoundsSelect.value : '10';
          const rounds = (val === 'infinite' || val === '0') ? 0 : (parseInt(val, 10) || 10);
          const res = await fetch('/api/songless/room/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: songlessState.roomId, category: cat, totalRounds: rounds })
          });
          const data = await res.json();
          if (data.error) {
            alert("Erreur de lancement : " + data.error);
            btnHostStart.disabled = false;
            btnHostStart.textContent = "Lancer la partie musicale";
          } else {
            // Immediate state sync fallback
            const stateRes = await fetch(`/api/songless/room/state?roomId=${encodeURIComponent(songlessState.roomId)}`);
            const stateData = await stateRes.json();
            if (stateData.state) {
              handleSonglessSSEState(stateData.state);
            }
          }
        } catch (e) {
          console.error(e);
          btnHostStart.disabled = false;
          btnHostStart.textContent = "Lancer la partie musicale";
        }
      }
    });
  }

  // Next round multi button
  const btnNextRound = document.getElementById('btn-songless-next-round');
  if (btnNextRound) {
    btnNextRound.addEventListener('click', async () => {
      stopAllSonglessAudio();
      if (songlessState.roomId && songlessState.isHost) {
        btnNextRound.disabled = true;
        btnNextRound.classList.add('is-disabled');
        try {
          await fetch('/api/songless/room/next', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: songlessState.roomId })
          });
          const stateRes = await fetch(`/api/songless/room/state?roomId=${encodeURIComponent(songlessState.roomId)}`);
          const stateData = await stateRes.json();
          if (stateData.state) {
            handleSonglessSSEState(stateData.state);
          }
        } catch (e) {
          console.error("Next round error:", e);
        }
      }
    });
  }

  // Restart / return to lobby from podium button
  const btnRestartLobby = document.getElementById('btn-songless-restart-lobby');
  if (btnRestartLobby) {
    btnRestartLobby.addEventListener('click', async () => {
      if (!songlessState.roomId || !songlessState.isHost) return;
      btnRestartLobby.disabled = true;
      btnRestartLobby.textContent = "Retour aux paramètres...";
      try {
        await fetch('/api/songless/room/restart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: songlessState.roomId })
        });
        const stateRes = await fetch(`/api/songless/room/state?roomId=${encodeURIComponent(songlessState.roomId)}`);
        const stateData = await stateRes.json();
        if (stateData.state) {
          handleSonglessSSEState(stateData.state);
        }
      } catch (err) {
        console.error('Failed to restart songless room:', err);
      } finally {
        btnRestartLobby.disabled = false;
        btnRestartLobby.textContent = "⚙️ Modifier les paramètres & Rejouer";
      }
    });
  }

  // Search autocomplete logic
  initSonglessSearch();

  // Volume slider and mute toggle
  initSonglessVolume();
}

function initSonglessVolume() {
  const volSlider = document.getElementById('songless-volume-slider');
  const btnMute = document.getElementById('btn-songless-mute');
  const iconHigh = document.getElementById('songless-vol-high');
  const iconMuted = document.getElementById('songless-vol-muted');

  const savedVol = localStorage.getItem('songless_vol');
  let currentVol = savedVol !== null ? parseFloat(savedVol) : 0.8;
  if (isNaN(currentVol) || currentVol < 0 || currentVol > 1) currentVol = 0.8;

  function applyVolume(val) {
    songlessAudio.volume = val;
    if (songlessFullAudio) songlessFullAudio.volume = val;
    const fullAudio = document.getElementById('songless-full-audio');
    if (fullAudio) fullAudio.volume = val;
    if (volSlider) volSlider.value = val;
    if (iconHigh && iconMuted) {
      if (val === 0) {
        iconHigh.classList.add('view-hidden');
        iconMuted.classList.remove('view-hidden');
      } else {
        iconHigh.classList.remove('view-hidden');
        iconMuted.classList.add('view-hidden');
      }
    }
  }

  applyVolume(currentVol);

  if (volSlider) {
    volSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      applyVolume(val);
      localStorage.setItem('songless_vol', val);
    });
  }

  let lastNonZeroVol = currentVol > 0 ? currentVol : 0.8;
  if (btnMute) {
    btnMute.addEventListener('click', () => {
      if (songlessAudio.volume > 0) {
        lastNonZeroVol = songlessAudio.volume;
        applyVolume(0);
        localStorage.setItem('songless_vol', 0);
      } else {
        applyVolume(lastNonZeroVol);
        localStorage.setItem('songless_vol', lastNonZeroVol);
      }
    });
  }
}

let fullAudioPlayPromise = null;

function bindSonglessFullAudioEvents() {
  if (!songlessFullAudio) return;
  songlessFullAudio.onplay = () => updateSonglessFullPlayButtonState(true);
  songlessFullAudio.onpause = () => updateSonglessFullPlayButtonState(false);
  songlessFullAudio.onended = () => updateSonglessFullPlayButtonState(false);
}

function updateSonglessFullPlayButtonState(isPlaying) {
  const btnFullPlay = document.getElementById('btn-songless-full-play');
  if (!btnFullPlay) return;

  if (isPlaying) {
    btnFullPlay.classList.add('is-playing');
    btnFullPlay.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>
      <span>Mettre en pause l'extrait</span>
    `;
  } else {
    btnFullPlay.classList.remove('is-playing');
    btnFullPlay.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
      <span>Écouter l'extrait complet (30s)</span>
    `;
  }
}

const SILENT_AUDIO_SRC = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

function stopAllSonglessAudio() {
  stopSonglessAudio();

  // Stop single static JS Audio object instance cleanly
  if (songlessFullAudio) {
    try {
      songlessFullAudio.pause();
      songlessFullAudio.currentTime = 0;
      songlessFullAudio.src = SILENT_AUDIO_SRC;
      songlessFullAudio.load();
    } catch (e) {}
  }

  // Also stop DOM fullAudio if present
  const fullAudio = document.getElementById('songless-full-audio');
  if (fullAudio) {
    try {
      fullAudio.pause();
      fullAudio.currentTime = 0;
      fullAudio.src = SILENT_AUDIO_SRC;
      fullAudio.load();
    } catch (e) {}
  }

  fullAudioPlayPromise = null;
  updateSonglessFullPlayButtonState(false);
}

function toggleSonglessActiveUI(showActiveControls) {
  const playerCard = document.querySelector('.songless-player-card');
  const searchWrapper = document.getElementById('songless-search-wrapper');
  const guessesList = document.getElementById('songless-guesses-list');
  const resultPanel = document.getElementById('songless-result-panel');

  if (showActiveControls) {
    if (playerCard) playerCard.classList.remove('view-hidden');
    if (searchWrapper) searchWrapper.classList.remove('view-hidden');
    if (guessesList) guessesList.classList.remove('view-hidden');
    if (resultPanel) resultPanel.classList.add('view-hidden');
  } else {
    stopSonglessAudio();
    if (playerCard) playerCard.classList.add('view-hidden');
    if (searchWrapper) searchWrapper.classList.add('view-hidden');
    if (guessesList) guessesList.classList.add('view-hidden');
    if (resultPanel) resultPanel.classList.remove('view-hidden');
  }
}

function getSonglessNickname() {
  if (songlessState.nickname) return songlessState.nickname;
  const input = document.getElementById('songless-player-nickname');
  let nick = (input ? input.value : '').trim() || (currentProfile && currentProfile.nickname ? currentProfile.nickname : '');
  if (!nick) {
    nick = 'Mélomane' + Math.floor(Math.random() * 900 + 100);
    if (input) input.value = nick;
  }
  songlessState.nickname = nick;
  return nick;
}

function updateSonglessHeaderBadges() {
  const streakDisplay = document.getElementById('songless-streak-display');
  const scoreDisplay = document.getElementById('songless-score-display');
  const genrePill = document.getElementById('songless-genre-pill');

  if (streakDisplay) streakDisplay.textContent = songlessStreak;
  if (scoreDisplay) scoreDisplay.textContent = songlessScore;
  if (genrePill) genrePill.textContent = getCategoryLabel(songlessState.category);
}

async function startSonglessGame(mode = 'infinite', category = 'all') {
  stopAllSonglessAudio();
  songlessState.mode = mode;
  songlessState.category = category;
  songlessState.attemptIndex = 0;
  songlessState.guesses = [];
  songlessState.isOver = false;
  songlessState.isWon = false;
  songlessState.solution = null;
  songlessState.roomId = null;
  currentRoomId = 'SOLO';

  showView('songlessGame');
  updateRoomDisplay(true, 'SOLO');

  document.getElementById('songless-multi-lobby').classList.add('view-hidden');
  document.getElementById('songless-active-game').classList.remove('view-hidden');
  toggleSonglessActiveUI(true);

  updateSonglessHeaderBadges();
  renderSonglessGuesses();
  updateSonglessPlayerUI();
  renderSonglessSoloSidebar();

  try {
    const url = `/api/songless/random?category=${encodeURIComponent(category)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      alert("Erreur lors du chargement du morceau : " + data.error);
      return;
    }

    songlessState.songId = data.songId;
    songlessState.previewUrl = data.previewUrl;
    songlessState.durations = data.durations || [0.1, 0.5, 1.0, 2.5, 5.0, 10.0];

    // Preload audio
    songlessAudio.src = songlessState.previewUrl;
    songlessAudio.preload = 'auto';
    songlessAudio.load();

    renderSonglessTrack();
    updateSonglessPlayerUI();

    // Auto focus search input
    const searchInput = document.getElementById('songless-search-input');
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
  } catch (err) {
    alert("Impossible de charger la musique : " + err.message);
  }
}

function renderSonglessSoloSidebar() {
  const sidebar = document.getElementById('songless-sidebar-players');
  const countEl = document.getElementById('songless-player-count');
  if (countEl) countEl.textContent = '1';

  if (sidebar) {
    const avatar = currentProfile ? currentProfile.avatar : 'panda';
    const isPhoto = currentProfile ? currentProfile.avatarIsPhoto : false;
    sidebar.innerHTML = `
      <li class="player-item current-player" style="border-color: rgba(168, 85, 247, 0.4);">
        <div class="player-avatar">${renderAvatarHTML(avatar, isPhoto)}</div>
        <div class="player-info">
          <div class="player-name">${escapeHtml(getSonglessNickname())} <span class="badge" style="font-size: 10px; padding: 2px 6px; background: rgba(168, 85, 247, 0.2); color: #c084fc;">VOUS</span></div>
          <div class="player-stats" style="display: flex; align-items: center; gap: 8px; font-size: 11px;">
            <span style="display: inline-flex; align-items: center; gap: 4px;">
              <svg class="stat-icon" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              Série : ${songlessStreak}
            </span>
            <span style="opacity: 0.3;">|</span>
            <span style="display: inline-flex; align-items: center; gap: 4px;">
              <svg class="stat-icon" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
              ${songlessScore} pts
            </span>
          </div>
        </div>
      </li>
    `;
  }
}

function getCategoryLabel(cat) {
  switch (cat) {
    case 'pop': return 'Pop';
    case 'rap_fr': return 'Rap FR';
    case 'rock': return 'Rock';
    case 'annees_80_90': return 'Années 80/90';
    case 'electro': return 'Électro';
    case 'cinema': return 'Films & BO';
    case 'series': return 'Séries TV';
    case 'anime': return 'Animés';
    case 'gaming': return 'Jeux Vidéo';
    default: return 'Tous les Hits';
  }
}

function toggleSonglessPlay() {
  if (songlessState.isOver && songlessState.isWon) {
    toggleSonglessFullAudio();
    return;
  }

  if (songlessAudio.paused) {
    playSonglessSnippet();
  } else {
    stopSonglessAudio();
  }
}

function playSonglessSnippet() {
  if (!songlessState.previewUrl) return;

  const currentMaxDuration = songlessState.durations[songlessState.attemptIndex] || 0.1;
  const playhead = document.getElementById('songless-playhead');
  const playIcon = document.getElementById('songless-play-icon');
  const pauseIcon = document.getElementById('songless-pause-icon');
  const timeDisplay = document.getElementById('songless-time-display');

  if (songlessPlayRaf) {
    cancelAnimationFrame(songlessPlayRaf);
    songlessPlayRaf = null;
  }
  if (songlessPlayTimer) {
    clearTimeout(songlessPlayTimer);
    songlessPlayTimer = null;
  }

  if (songlessAudio.src !== songlessState.previewUrl) {
    songlessAudio.src = songlessState.previewUrl;
  }
  songlessAudio.currentTime = 0;

  songlessAudio.play().then(() => {
    if (playIcon) playIcon.classList.add('view-hidden');
    if (pauseIcon) pauseIcon.classList.remove('view-hidden');

    const startTime = performance.now();

    function checkTime() {
      const elapsed = (performance.now() - startTime) / 1000;
      const curr = Math.max(songlessAudio.currentTime, elapsed);

      if (elapsed >= currentMaxDuration || curr >= currentMaxDuration || songlessAudio.ended) {
        stopSonglessAudio();
      } else {
        const pct = Math.min(100, (curr / 10.0) * 100);
        if (playhead) playhead.style.left = `${pct}%`;
        if (timeDisplay) timeDisplay.textContent = `${curr.toFixed(1)}s / ${currentMaxDuration}s`;
        songlessPlayRaf = requestAnimationFrame(checkTime);
      }
    }
    songlessPlayRaf = requestAnimationFrame(checkTime);

    songlessPlayTimer = setTimeout(() => {
      stopSonglessAudio();
    }, (currentMaxDuration * 1000) + 30);
  }).catch(e => {
    console.error("Audio playback error:", e);
    if (playIcon) playIcon.classList.remove('view-hidden');
    if (pauseIcon) pauseIcon.classList.add('view-hidden');
  });
}

function stopSonglessAudio() {
  if (songlessPlayRaf) {
    cancelAnimationFrame(songlessPlayRaf);
    songlessPlayRaf = null;
  }
  if (songlessPlayTimer) {
    clearTimeout(songlessPlayTimer);
    songlessPlayTimer = null;
  }
  songlessAudio.pause();
  songlessAudio.currentTime = 0;

  const playhead = document.getElementById('songless-playhead');
  const playIcon = document.getElementById('songless-play-icon');
  const pauseIcon = document.getElementById('songless-pause-icon');
  const timeDisplay = document.getElementById('songless-time-display');
  const currentMaxDuration = songlessState.durations[songlessState.attemptIndex] || 0.1;

  if (playhead) playhead.style.left = '0%';
  if (playIcon) playIcon.classList.remove('view-hidden');
  if (pauseIcon) pauseIcon.classList.add('view-hidden');
  if (timeDisplay) timeDisplay.textContent = `0.0s / ${currentMaxDuration}s`;
}

function renderSonglessTrack() {
  const segmentsContainer = document.getElementById('songless-track-segments');
  if (!segmentsContainer) return;

  const segments = segmentsContainer.querySelectorAll('.songless-segment');
  segments.forEach((seg, idx) => {
    seg.classList.remove('is-unlocked', 'is-current');
    if (idx <= songlessState.attemptIndex) {
      seg.classList.add('is-unlocked');
    }
    if (idx === songlessState.attemptIndex) {
      seg.classList.add('is-current');
    }
  });
}

function updateSonglessPlayerUI() {
  const currentDuration = songlessState.durations[songlessState.attemptIndex] || 0.1;
  const nextDuration = songlessState.durations[songlessState.attemptIndex + 1];
  const timeDisplay = document.getElementById('songless-time-display');
  const btnSkip = document.getElementById('btn-songless-skip');

  if (timeDisplay) {
    timeDisplay.textContent = `0.0s / ${currentDuration}s`;
  }

  if (btnSkip) {
    if (songlessState.isOver || songlessState.attemptIndex >= 5) {
      btnSkip.style.display = 'none';
    } else {
      btnSkip.style.display = 'block';
      const diff = (nextDuration - currentDuration).toFixed(1);
      btnSkip.textContent = `Passer (+${diff}s)`;
    }
  }

  renderSonglessTrack();
}

function renderSonglessGuesses() {
  const list = document.getElementById('songless-guesses-list');
  if (!list) return;

  list.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const guess = songlessState.guesses[i];
    const row = document.createElement('div');
    row.className = 'songless-guess-row';

    if (!guess) {
      row.classList.add('is-empty');
      row.innerHTML = `<span style="opacity: 0.4; font-size: 12px; font-weight: 600;">#${i + 1}</span>`;
    } else if (guess.status === 'skipped') {
      row.classList.add('is-skipped');
      row.innerHTML = `
        <div class="songless-guess-title">
          <span>Passé</span>
        </div>
        <span class="songless-guess-indicator skipped">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>
        </span>
      `;
    } else if (guess.status === 'correct') {
      row.classList.add('is-correct');
      row.innerHTML = `
        <div class="songless-guess-title">
          <strong>${escapeHtml(guess.title)}</strong> <span style="opacity:0.8;">— ${escapeHtml(guess.artist)}</span>
        </div>
        <span class="songless-guess-indicator correct">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </span>
      `;
    } else if (guess.status === 'artist_match') {
      row.classList.add('is-partial');
      row.innerHTML = `
        <div class="songless-guess-title">
          <span>${escapeHtml(guess.title)}</span> <span style="opacity:0.8;">— <b>${escapeHtml(guess.artist)}</b></span>
        </div>
        <span class="songless-guess-indicator partial">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </span>
      `;
    } else {
      row.classList.add('is-wrong');
      row.innerHTML = `
        <div class="songless-guess-title">
          <span>${escapeHtml(guess.title)} <span style="opacity:0.7;">— ${escapeHtml(guess.artist)}</span></span>
        </div>
        <span class="songless-guess-indicator wrong">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </span>
      `;
    }

    list.appendChild(row);
  }
}

function skipSonglessAttempt() {
  if (songlessState.isOver) return;

  stopSonglessAudio();
  songlessState.guesses.push({ status: 'skipped' });
  songlessState.attemptIndex++;

  if (songlessState.mode === 'multi' && songlessState.roomId) {
    const nick = getSonglessNickname();
    fetch('/api/songless/room/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: songlessState.roomId,
        nickname: nick,
        guessTitle: 'Passé',
        guessArtist: '',
        attempt: songlessState.attemptIndex
      })
    }).catch(() => {});
  }

  if (songlessState.attemptIndex >= 6) {
    endSonglessGame(false);
  } else {
    renderSonglessGuesses();
    updateSonglessPlayerUI();
    const searchInput = document.getElementById('songless-search-input');
    if (searchInput) searchInput.focus({ preventScroll: true });
  }
}

async function submitSonglessGuess() {
  if (songlessState.isOver) return;
  const input = document.getElementById('songless-search-input');
  const query = (input ? input.value : '').trim();
  if (!query) return;

  stopSonglessAudio();
  const nick = getSonglessNickname();

  let title = query;
  let artist = '';
  if (songlessState.selectedSearchResult) {
    title = songlessState.selectedSearchResult.title;
    artist = songlessState.selectedSearchResult.artist;
  } else if (query.includes(' - ')) {
    const parts = query.split(' - ');
    title = parts[0].trim();
    artist = parts[1].trim();
  }

  try {
    let res;
    if (songlessState.mode === 'multi' && songlessState.roomId) {
      res = await fetch('/api/songless/room/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: songlessState.roomId,
          nickname: nick,
          guessTitle: title,
          guessArtist: artist,
          attempt: songlessState.attemptIndex + 1
        })
      });
    } else {
      res = await fetch('/api/songless/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songId: songlessState.songId,
          guessTitle: title,
          guessArtist: artist,
          attempt: songlessState.attemptIndex + 1,
          nickname: nick,
          accountNickname: (currentProfile && currentProfile.password) ? currentProfile.nickname : null,
          avatar: currentProfile ? currentProfile.avatar : '🎵'
        })
      });
    }

    const data = await res.json();
    songlessState.guesses.push({
      title,
      artist,
      status: data.status
    });

    if (input) input.value = '';
    songlessState.selectedSearchResult = null;
    const btnSubmit = document.getElementById('btn-songless-submit');
    if (btnSubmit) btnSubmit.disabled = true;

    if (data.status === 'correct') {
      songlessState.isOver = true;
      songlessState.isWon = true;
      songlessState.solution = data.solution;
      songlessStreak++;
      const earnedPoints = Math.max(10, 70 - (songlessState.attemptIndex * 10));
      songlessScore += earnedPoints;
      updateSonglessHeaderBadges();
      renderSonglessGuesses();
      if (songlessState.mode === 'infinite') renderSonglessSoloSidebar();
      showSonglessVictory(data.solution);
    } else {
      songlessState.attemptIndex++;
      if (songlessState.attemptIndex >= 6 || data.isOver) {
        songlessState.isOver = true;
        songlessState.isWon = false;
        songlessState.solution = data.solution;
        songlessStreak = 0;
        updateSonglessHeaderBadges();
        renderSonglessGuesses();
        if (songlessState.mode === 'infinite') renderSonglessSoloSidebar();
        showSonglessDefeat(data.solution);
      } else {
        renderSonglessGuesses();
        updateSonglessPlayerUI();
        if (input) input.focus({ preventScroll: true });
      }
    }
  } catch (err) {
    console.error("Error submitting guess:", err);
  }
}

async function endSonglessGame(won) {
  songlessState.isOver = true;
  songlessState.isWon = won;

  if (!won) songlessStreak = 0;
  updateSonglessHeaderBadges();
  if (songlessState.mode === 'infinite') renderSonglessSoloSidebar();

  const nick = getSonglessNickname();
  try {
    const res = await fetch('/api/songless/giveup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        songId: songlessState.songId,
        nickname: nick,
        accountNickname: (currentProfile && currentProfile.password) ? currentProfile.nickname : null,
        avatar: currentProfile ? currentProfile.avatar : '🎵',
        roomId: songlessState.roomId
      })
    });
    const data = await res.json();
    songlessState.solution = data.solution;
    renderSonglessGuesses();
    if (won) {
      showSonglessVictory(data.solution);
    } else {
      showSonglessDefeat(data.solution);
    }
  } catch (e) {
    console.error(e);
  }
}

function updateSonglessNextRoundButton(players) {
  const btnNextSong = document.getElementById('btn-songless-next-song');
  const btnNextRound = document.getElementById('btn-songless-next-round');

  if (!songlessState.roomId) {
    if (btnNextSong) btnNextSong.style.display = 'inline-flex';
    if (btnNextRound) btnNextRound.classList.add('view-hidden');
    return;
  }

  if (btnNextSong) btnNextSong.style.display = 'none';

  if (!btnNextRound) return;
  btnNextRound.classList.remove('view-hidden');

  const myNick = getSonglessNickname();
  const playerList = Object.values(players || {}).filter(p => p.isConnected !== false);
  const donePlayers = playerList.filter(p => {
    if (p.nickname === myNick && songlessState.isOver) return true;
    return p.isCorrect || p.hasGuessed || (p.attempts && p.attempts.length >= 6);
  });
  const totalPlayers = playerList.length || 1;

  const state = songlessState.currentSSEState;
  const isFinalRound = state && state.totalRounds > 0 && state.roundNumber >= state.totalRounds;

  if (donePlayers.length < totalPlayers) {
    btnNextRound.disabled = true;
    btnNextRound.classList.add('is-disabled');
    btnNextRound.textContent = `⏳ En attente des autres joueurs... (${donePlayers.length}/${totalPlayers})`;
    btnNextRound.style.background = "";
    btnNextRound.style.color = "";
    btnNextRound.style.boxShadow = "";
  } else {
    if (songlessState.isHost) {
      btnNextRound.disabled = false;
      btnNextRound.classList.remove('is-disabled');
      if (isFinalRound) {
        btnNextRound.textContent = "🏆 Voir le Podium Final";
        btnNextRound.style.background = "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)";
        btnNextRound.style.color = "#0b0f19";
        btnNextRound.style.fontWeight = "800";
        btnNextRound.style.boxShadow = "0 0 20px rgba(251, 191, 36, 0.4)";
      } else {
        btnNextRound.textContent = `Manche Suivante (${(state && state.roundNumber) || 1}/${(state && state.totalRounds) || 10})`;
        btnNextRound.style.background = "";
        btnNextRound.style.color = "";
        btnNextRound.style.boxShadow = "";
      }
    } else {
      btnNextRound.disabled = true;
      btnNextRound.classList.add('is-disabled');
      if (isFinalRound) {
        btnNextRound.textContent = "⏳ En attente de l'hôte pour afficher le podium final...";
      } else {
        btnNextRound.textContent = "⏳ En attente de l'hôte pour la manche suivante...";
      }
      btnNextRound.style.background = "";
      btnNextRound.style.color = "";
      btnNextRound.style.boxShadow = "";
    }
  }
}

function playSonglessFullPreview(previewUrl) {
  stopSonglessAudio();
  if (songlessFullAudio) {
    try {
      songlessFullAudio.pause();
      songlessFullAudio.currentTime = 0;
      songlessFullAudio.src = SILENT_AUDIO_SRC;
    } catch (e) {}
  }

  if (!previewUrl) {
    updateSonglessFullPlayButtonState(false);
    return;
  }

  songlessFullAudio.src = previewUrl;
  songlessFullAudio.currentTime = 0;
  songlessFullAudio.volume = songlessAudio.volume;

  fullAudioPlayPromise = songlessFullAudio.play();
  if (fullAudioPlayPromise) {
    fullAudioPlayPromise.then(() => {
      updateSonglessFullPlayButtonState(true);
    }).catch(() => {
      updateSonglessFullPlayButtonState(false);
    });
  }
}

function showSonglessVictory(solution) {
  const titleEl = document.getElementById('songless-result-status-title');
  const artworkEl = document.getElementById('songless-result-artwork');
  const songTitleEl = document.getElementById('songless-result-title');
  const songArtistEl = document.getElementById('songless-result-artist');
  const songYearEl = document.getElementById('songless-result-year');

  toggleSonglessActiveUI(false);

  if (titleEl) titleEl.innerHTML = `🎉 Trouvé en <b>${songlessState.guesses.length}</b> tentative${songlessState.guesses.length > 1 ? 's' : ''} (${songlessState.durations[songlessState.attemptIndex]}s) !`;
  if (artworkEl) {
    if (solution && solution.artworkUrl) {
      artworkEl.src = solution.artworkUrl;
      artworkEl.style.display = 'block';
    } else {
      artworkEl.style.display = 'none';
    }
  }
  if (songTitleEl) songTitleEl.textContent = (solution && solution.title) || 'Titre';
  if (songArtistEl) songArtistEl.textContent = (solution && solution.artist) || 'Artiste';
  if (songYearEl) songYearEl.textContent = (solution && solution.year) ? `${solution.year}` : '';

  if (solution && solution.previewUrl) {
    playSonglessFullPreview(solution.previewUrl);
  } else {
    updateSonglessFullPlayButtonState(false);
  }

  updateSonglessNextRoundButton(songlessState.multiPlayers || {});

  if (typeof createConfetti === 'function') {
    createConfetti();
  }
}

function showSonglessDefeat(solution) {
  const titleEl = document.getElementById('songless-result-status-title');
  const artworkEl = document.getElementById('songless-result-artwork');
  const songTitleEl = document.getElementById('songless-result-title');
  const songArtistEl = document.getElementById('songless-result-artist');
  const songYearEl = document.getElementById('songless-result-year');

  toggleSonglessActiveUI(false);

  if (titleEl) titleEl.innerHTML = `❌ Révélation : Le morceau mystère était`;
  if (artworkEl) {
    if (solution && solution.artworkUrl) {
      artworkEl.src = solution.artworkUrl;
      artworkEl.style.display = 'block';
    } else {
      artworkEl.style.display = 'none';
    }
  }
  if (songTitleEl) songTitleEl.textContent = (solution && solution.title) || 'Titre inconnu';
  if (songArtistEl) songArtistEl.textContent = (solution && solution.artist) || 'Artiste';
  if (songYearEl) songYearEl.textContent = (solution && solution.year) ? `${solution.year}` : '';

  if (solution && solution.previewUrl) {
    playSonglessFullPreview(solution.previewUrl);
  } else {
    updateSonglessFullPlayButtonState(false);
  }

  updateSonglessNextRoundButton(songlessState.multiPlayers || {});
}

function toggleSonglessFullAudio() {
  if (!songlessFullAudio) return;

  stopSonglessAudio();

  if (songlessFullAudio.paused) {
    if (songlessFullAudio.src) {
      fullAudioPlayPromise = songlessFullAudio.play();
      if (fullAudioPlayPromise) {
        fullAudioPlayPromise.then(() => {
          updateSonglessFullPlayButtonState(true);
        }).catch(() => {
          updateSonglessFullPlayButtonState(false);
        });
      }
    }
  } else {
    songlessFullAudio.pause();
    const fullAudioDom = document.getElementById('songless-full-audio');
    if (fullAudioDom) {
      try { fullAudioDom.pause(); } catch (e) {}
    }
    updateSonglessFullPlayButtonState(false);
  }
}

function shareSonglessScore() {
  let grid = '';
  songlessState.guesses.forEach(g => {
    if (g.status === 'correct') grid += '🟩';
    else if (g.status === 'artist_match') grid += '🟨';
    else if (g.status === 'wrong') grid += '🟥';
    else grid += '⬛';
  });

  const durationStr = songlessState.isWon ? `${songlessState.durations[songlessState.attemptIndex]}s` : 'X';
  const text = `SuperCaraQuiz Blind Test² 🎵\n🔥 Série: ${songlessStreak} | 🏆 Score: ${songlessScore} pts\n🔊 ${grid} (${durationStr})\nhttps://supercaraquiz.duckdns.org`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast("🔗 Résultat copié dans le presse-papier !");
    });
  }
}

function leaveSongless() {
  stopAllSonglessAudio();
  if (evtSource) {
    evtSource.close();
    evtSource = null;
  }
  updateRoomDisplay(false);
  showView('portal');
}

// --- Realtime Autocomplete Search ---
let songlessSearchTimeout = null;

function initSonglessSearch() {
  const input = document.getElementById('songless-search-input');
  const dropdown = document.getElementById('songless-autocomplete-dropdown');
  const btnSubmit = document.getElementById('btn-songless-submit');

  if (!input || !dropdown) return;

  input.addEventListener('input', () => {
    const q = input.value.trim();
    songlessState.selectedSearchResult = null;
    if (btnSubmit) btnSubmit.disabled = q.length === 0;

    if (songlessSearchTimeout) clearTimeout(songlessSearchTimeout);

    if (q.length < 2) {
      dropdown.classList.add('view-hidden');
      dropdown.innerHTML = '';
      return;
    }

    songlessSearchTimeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/songless/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        renderSonglessDropdown(data.results || []);
      } catch (err) {
        console.error("Search error:", err);
      }
    }, 200);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !btnSubmit.disabled) {
      submitSonglessGuess();
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#songless-search-wrapper')) {
      dropdown.classList.add('view-hidden');
    }
  });
}

function renderSonglessDropdown(results) {
  const dropdown = document.getElementById('songless-autocomplete-dropdown');
  const input = document.getElementById('songless-search-input');
  const btnSubmit = document.getElementById('btn-songless-submit');

  if (!dropdown) return;

  if (results.length === 0) {
    dropdown.classList.add('view-hidden');
    dropdown.innerHTML = '';
    return;
  }

  dropdown.innerHTML = '';
  results.forEach(song => {
    const item = document.createElement('div');
    item.className = 'songless-autocomplete-item';
    item.innerHTML = `
      <img src="${song.artworkUrl || ''}" class="songless-auto-artwork" alt="">
      <div class="songless-auto-info">
        <span class="songless-auto-title">${escapeHtml(song.title)}</span>
        <span class="songless-auto-artist">${escapeHtml(song.artist)}</span>
      </div>
    `;

    item.addEventListener('click', () => {
      songlessState.selectedSearchResult = song;
      if (input) input.value = `${song.title} - ${song.artist}`;
      if (btnSubmit) btnSubmit.disabled = false;
      dropdown.classList.add('view-hidden');
      input.focus();
    });

    dropdown.appendChild(item);
  });

  dropdown.classList.remove('view-hidden');
}

// --- Multiplayer Room Logic ---
async function createSonglessRoom(nick, category) {
  try {
    const res = await fetch('/api/songless/room/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostNickname: nick,
        hostAvatar: currentProfile ? currentProfile.avatar : '🎵',
        hostAvatarIsPhoto: currentProfile ? !!currentProfile.avatarIsPhoto : false,
        category,
        totalRounds: 5
      })
    });
    const data = await res.json();
    if (data.roomId) {
      joinSonglessRoom(data.roomId, nick, true);
    }
  } catch (e) {
    alert("Erreur lors de la création du salon : " + e.message);
  }
}

async function joinSonglessRoom(roomId, nick, isHost = false) {
  songlessState.roomId = roomId;
  songlessState.nickname = nick;
  songlessState.isHost = isHost;
  songlessState.mode = 'multi';
  songlessState.songId = null;
  songlessState.previewUrl = '';
  songlessState.attemptIndex = 0;
  songlessState.guesses = [];
  songlessState.isOver = false;
  songlessState.isWon = false;
  currentRoomId = roomId;

  showView('songlessGame');
  updateRoomDisplay(true, roomId);

  document.getElementById('songless-lobby-code').textContent = roomId;
  document.getElementById('songless-multi-lobby').classList.remove('view-hidden');
  document.getElementById('songless-active-game').classList.add('view-hidden');
  document.getElementById('songless-podium-panel').classList.add('view-hidden');

  const btnStart = document.getElementById('btn-songless-host-start');
  if (btnStart) {
    btnStart.style.display = isHost ? 'block' : 'none';
    btnStart.disabled = false;
    btnStart.textContent = "Lancer la partie musicale";
  }

  // Register player via POST body so avatar (including photos) is cleanly transmitted
  if (!isHost) {
    try {
      await fetch('/api/songless/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          nickname: nick,
          avatar: currentProfile ? currentProfile.avatar : '🎵',
          avatarIsPhoto: currentProfile ? !!currentProfile.avatarIsPhoto : false
        })
      });
    } catch (e) {
      console.error("Error joining room:", e);
    }
  }

  // Fetch initial room state immediately so sidebar and controls update with zero delay
  try {
    const initRes = await fetch(`/api/songless/room/state?roomId=${encodeURIComponent(roomId)}`);
    const initData = await initRes.json();
    if (initData.state) {
      handleSonglessSSEState(initData.state);
    }
  } catch (e) {
    console.error("Error fetching initial songless room state:", e);
  }

  // Connect SSE using lightweight URL (no huge photo data in GET string)
  const sseUrl = `/api/events?roomId=${encodeURIComponent(roomId)}&nickname=${encodeURIComponent(nick)}`;
  if (evtSource) evtSource.close();
  evtSource = new EventSource(sseUrl);

  evtSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.type === 'SONGLESS_STATE') {
        handleSonglessSSEState(data.state);
      }
    } catch (err) {
      console.error("SSE parse error:", err);
    }
  };

  evtSource.onerror = (err) => {
    console.warn("Songless SSE connection issue, polling fallback...", err);
  };

  // Heartbeat fallback interval for guests so they never get stranded on round_ended/podium
  if (songlessState.syncInterval) {
    clearInterval(songlessState.syncInterval);
  }
  songlessState.syncInterval = setInterval(async () => {
    if (!songlessState.roomId || songlessState.mode !== 'multi') {
      clearInterval(songlessState.syncInterval);
      songlessState.syncInterval = null;
      return;
    }
    const currStatus = songlessState.currentSSEState ? songlessState.currentSSEState.status : null;
    if (currStatus === 'round_ended' || currStatus === 'lobby' || songlessState.isOver || !songlessState.isHost) {
      try {
        const syncRes = await fetch(`/api/songless/room/state?roomId=${encodeURIComponent(songlessState.roomId)}`);
        const syncData = await syncRes.json();
        if (syncData.state) {
          handleSonglessSSEState(syncData.state);
        }
      } catch (e) {}
    }
  }, 1000);
}

function handleSonglessSSEState(state) {
  songlessState.currentSSEState = state;
  if (state.host) {
    songlessState.isHost = (getSonglessNickname() === state.host);
  }
  songlessState.multiPlayers = state.players;
  renderSonglessMultiPlayers(state.players, state.leaderboard);

  // 1. LOBBY STATE (or returned to lobby from podium)
  if (state.status === 'lobby') {
    stopAllSonglessAudio();
    songlessState.songId = null;
    songlessState.previewUrl = '';
    songlessState.attemptIndex = 0;
    songlessState.guesses = [];
    songlessState.isOver = false;
    songlessState.isWon = false;

    const lobbyPanel = document.getElementById('songless-multi-lobby');
    const activeGame = document.getElementById('songless-active-game');
    const podiumPanel = document.getElementById('songless-podium-panel');
    const resultPanel = document.getElementById('songless-result-panel');

    if (activeGame) activeGame.classList.add('view-hidden');
    if (podiumPanel) podiumPanel.classList.add('view-hidden');
    if (resultPanel) resultPanel.classList.add('view-hidden');
    if (lobbyPanel) lobbyPanel.classList.remove('view-hidden');

    const btnStart = document.getElementById('btn-songless-host-start');
    const startHelper = document.getElementById('songless-start-helper');
    const lobbyPillsContainer = document.getElementById('songless-lobby-theme-pills');
    const lobbyHelper = document.getElementById('songless-lobby-theme-helper');
    const lobbyRoundsSelect = document.getElementById('songless-lobby-rounds-select');

    if (songlessState.isHost) {
      if (btnStart) {
        btnStart.style.display = 'block';
        btnStart.disabled = false;
        btnStart.textContent = "Lancer la partie musicale";
      }
      if (startHelper) {
        startHelper.style.display = 'block';
        startHelper.textContent = "Le salon est prêt. Lancez dès que vos amis ont rejoint.";
      }
      if (lobbyPillsContainer) {
        lobbyPillsContainer.style.pointerEvents = 'auto';
        lobbyPillsContainer.style.opacity = '1';
        lobbyPillsContainer.style.filter = 'none';
      }
      if (lobbyRoundsSelect) lobbyRoundsSelect.disabled = false;
    } else {
      if (btnStart) btnStart.style.display = 'none';
      if (startHelper) {
        startHelper.style.display = 'block';
        startHelper.textContent = "En attente que l'hôte lance la partie...";
      }
      if (lobbyPillsContainer) {
        lobbyPillsContainer.style.pointerEvents = 'none';
        lobbyPillsContainer.style.opacity = '0.75';
        lobbyPillsContainer.style.filter = 'grayscale(0.2)';
      }
      if (lobbyRoundsSelect) lobbyRoundsSelect.disabled = true;

      // Sync lobby settings for guest
      if (lobbyPillsContainer && state.category) {
        const cats = String(state.category).split(',');
        lobbyPillsContainer.querySelectorAll('.theme-pill').forEach(p => {
          const v = p.getAttribute('data-value');
          if (state.category === 'all') {
            p.classList.toggle('active', v === 'all');
          } else {
            p.classList.toggle('active', cats.includes(v));
          }
        });
        if (lobbyHelper) {
          if (state.category === 'all' || cats.length >= 9) {
            lobbyHelper.textContent = "Tous les thèmes sont activés pour cette session.";
          } else {
            lobbyHelper.textContent = `${cats.length} univers sélectionné${cats.length > 1 ? 's' : ''}.`;
          }
        }
      }
      if (lobbyRoundsSelect && state.totalRounds !== undefined) {
        lobbyRoundsSelect.value = state.totalRounds === 0 ? 'infinite' : String(state.totalRounds);
      }
    }
  }

  // 2. PLAYING STATE
  else if (state.status === 'playing') {
    const lobbyPanel = document.getElementById('songless-multi-lobby');
    const activeGame = document.getElementById('songless-active-game');
    const podiumPanel = document.getElementById('songless-podium-panel');

    if (lobbyPanel) lobbyPanel.classList.add('view-hidden');
    if (podiumPanel) podiumPanel.classList.add('view-hidden');
    if (activeGame) activeGame.classList.remove('view-hidden');

    const newSongId = state.currentSong ? state.currentSong.songId : null;
    const isNewSong = newSongId !== null && songlessState.songId !== null && String(songlessState.songId) !== String(newSongId);
    const isFirstLoad = newSongId !== null && songlessState.songId === null;

    if (isNewSong || isFirstLoad) {
      // NEW ROUND / NEW SONG: Stop previous audio and load new song preview
      stopAllSonglessAudio();
      songlessState.songId = newSongId;
      songlessState.previewUrl = state.currentSong ? state.currentSong.previewUrl : '';
      songlessState.attemptIndex = 0;
      songlessState.guesses = [];
      songlessState.isOver = false;
      songlessState.isWon = false;

      songlessAudio.src = songlessState.previewUrl;
      songlessAudio.load();

      toggleSonglessActiveUI(true);
      renderSonglessGuesses();
      updateSonglessPlayerUI();
    } else {
      // SAME SONG (e.g. peer passed, submitted a guess or gave up):
      // STRICT ISOLATION: Never touch local audio playback, playhead, timer or attempt state.
      updateSonglessNextRoundButton(state.players);
    }
  }

  // 3. ROUND ENDED
  else if (state.status === 'round_ended') {
    if (state.currentSong && !songlessState.isOver) {
      showSonglessVictory(state.currentSong);
    }
    toggleSonglessActiveUI(false);
    updateSonglessNextRoundButton(state.players);
  }

  // 4. GAME ENDED (PODIUM)
  else if (state.status === 'game_ended') {
    renderSonglessPodium(state);
  }
}

function renderSonglessPodium(state) {
  const podiumPanel = document.getElementById('songless-podium-panel');
  const activeGame = document.getElementById('songless-active-game');
  const lobbyPanel = document.getElementById('songless-multi-lobby');
  const resultPanel = document.getElementById('songless-result-panel');
  const steppedContainer = document.getElementById('songless-podium-stepped');
  const fullList = document.getElementById('songless-podium-full-list');
  const fullListBox = document.getElementById('songless-podium-leaderboard-box');
  const btnRestart = document.getElementById('btn-songless-restart-lobby');
  const podiumHelper = document.getElementById('songless-podium-helper');

  if (activeGame) activeGame.classList.add('view-hidden');
  if (lobbyPanel) lobbyPanel.classList.add('view-hidden');
  if (resultPanel) resultPanel.classList.add('view-hidden');
  if (podiumPanel) podiumPanel.classList.remove('view-hidden');

  stopAllSonglessAudio();

  const leaderboard = state.leaderboard || [];
  const top3 = leaderboard.slice(0, 3);

  // Stepped podium order: 2nd place (left), 1st place (center), 3rd place (right)
  const displayOrder = [];
  if (top3[1]) displayOrder.push({ player: top3[1], rank: 2 });
  if (top3[0]) displayOrder.push({ player: top3[0], rank: 1 });
  if (top3[2]) displayOrder.push({ player: top3[2], rank: 3 });

  if (steppedContainer) {
    steppedContainer.innerHTML = displayOrder.map(item => {
      const p = item.player;
      const rank = item.rank;
      const isWinner = rank === 1;
      const isCurrent = currentProfile?.nickname && p.nickname.toLowerCase() === currentProfile.nickname.toLowerCase();
      const avatarHtml = renderAvatarHTML(p.avatar, p.avatarIsPhoto);
      return `
        <div class="podium-col rank-${rank}">
          ${isWinner ? `<div class="podium-crown">👑</div>` : ''}
          <div class="podium-avatar-ring rank-${rank}">
            <div class="podium-avatar">
              ${avatarHtml}
            </div>
          </div>
          <div class="podium-player-name" title="${escapeHtml(p.nickname)}">
            ${escapeHtml(p.nickname)} ${isCurrent ? '<span class="badge-mini-you" style="background: rgba(139,92,246,0.25); color: #a78bfa; font-size: 10px; padding: 2px 5px; border-radius: 4px; vertical-align: middle; margin-left: 4px;">VOUS</span>' : ''}
          </div>
          <div class="podium-metric-pill rank-${rank}">${p.score} pts</div>
          <div class="podium-step rank-${rank}">
            <span class="podium-step-number">#${rank}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Full list for players 4th and beyond
  const remaining = leaderboard.slice(3);
  if (fullList && fullListBox) {
    if (remaining.length > 0) {
      fullListBox.style.display = 'block';
      fullList.innerHTML = remaining.map((p, idx) => `
        <div class="stats-leaderboard-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-weight: 800; color: var(--text-muted); font-size: 13px; min-width: 24px;">#${idx + 4}</span>
            <div style="width: 28px; height: 28px; border-radius: 50%; overflow: hidden; display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.08);">
              ${renderAvatarHTML(p.avatar, p.avatarIsPhoto)}
            </div>
            <span style="font-weight: 600; font-size: 14px;">${escapeHtml(p.nickname)}</span>
          </div>
          <span style="font-weight: 800; font-family: var(--font-mono); color: #a855f7; font-size: 14px;">${p.score} pts</span>
        </div>
      `).join('');
    } else {
      fullListBox.style.display = 'none';
      fullList.innerHTML = '';
    }
  }

  // Controls
  if (songlessState.isHost) {
    if (btnRestart) btnRestart.style.display = 'block';
    if (podiumHelper) podiumHelper.style.display = 'none';
  } else {
    if (btnRestart) btnRestart.style.display = 'none';
    if (podiumHelper) podiumHelper.style.display = 'block';
  }
}

function renderSonglessMultiPlayers(players, leaderboard) {
  const sidebar = document.getElementById('songless-sidebar-players');
  const countEl = document.getElementById('songless-player-count');
  const playerArr = Object.values(players || {});

  if (countEl) countEl.textContent = playerArr.length || 1;

  if (sidebar) {
    const myNick = getSonglessNickname();
    const listToRender = (leaderboard && leaderboard.length > 0) ? leaderboard : playerArr;

    const newHtml = listToRender.map((p, idx) => {
      const isMe = (p.nickname === myNick);
      const isWinner = p.isCorrect;
      return `
        <li class="player-item ${isMe ? 'current-player' : ''}">
          <div class="player-info-left">
            <div class="player-avatar" style="background: rgba(168, 85, 247, 0.15);">
              ${renderAvatarHTML(p.avatar, p.avatarIsPhoto)}
            </div>
            <div style="min-width: 0; display: flex; flex-direction: column;">
              <div class="player-name">
                ${(leaderboard && leaderboard.length > 0) ? `<span class="badge-mini-rank">#${idx + 1}</span>` : ''}${escapeHtml(p.nickname)}
                ${isMe ? '<span class="badge-mini-you">VOUS</span>' : ''}
              </div>
              ${isWinner ? '<span class="status-indicator-success" style="color: #10b981; font-size: 11px; font-weight: 700;">✓ Trouvé</span>' : ''}
            </div>
          </div>
          <div class="player-stats" style="color: #a855f7;">
            ${p.score || 0} pts
          </div>
        </li>
      `;
    }).join('');

    if (sidebar.dataset.lastHtml !== newHtml) {
      sidebar.innerHTML = newHtml;
      sidebar.dataset.lastHtml = newHtml;
    }
  }
}

// ==========================================
// POKÉCRIES MODULE (CRIS POKÉMON BLIND-TEST)
// ==========================================

let pokecriesAudio = new Audio();
let pokecriesStreak = parseInt(localStorage.getItem('pokecries-streak') || '0', 10);
let pokecriesBestStreak = parseInt(localStorage.getItem('pokecries-best-streak') || '0', 10);
let pokecriesScore = parseInt(localStorage.getItem('pokecries-score') || '0', 10);

let pokecriesState = {
  mode: 'solo', // 'solo', 'multi'
  category: 'all',
  era: 'latest', // 'latest', 'legacy'
  inputMode: 'mcq', // 'mcq', 'search'
  currentPokemon: null,
  currentChoices: [],
  isAudioPlaying: false,
  hasAnswered: false,
  isCorrect: false,
  usedHints: { type: false, gen: false, silhouette: false },
  roomId: null,
  isHost: false,
  totalRounds: 10,
  roundNumber: 0,
  selectedSearchResult: null,
  sseSource: null
};

function getPokecriesNickname() {
  const input = document.getElementById('pokecries-player-nickname');
  let nick = input ? input.value.trim() : '';
  if (!nick && currentProfile && currentProfile.nickname) {
    nick = currentProfile.nickname;
  }
  if (!nick) {
    nick = 'Dresseur-' + Math.floor(1000 + Math.random() * 9000);
  }
  if (input) input.value = nick;
  localStorage.setItem('pokecries-nickname', nick);
  return nick;
}

function getPokecriesRegionName(gen) {
  const regions = {
    1: 'Kanto',
    2: 'Johto',
    3: 'Hoenn',
    4: 'Sinnoh',
    5: 'Unys',
    6: 'Kalos',
    7: 'Alola',
    8: 'Galar',
    9: 'Paldea'
  };
  return regions[gen] || 'Monde Pokémon';
}

function getPokecriesGenLabel(category) {
  const map = {
    all: 'Toutes les Générations (Gen 1 à 9)',
    gen1: 'Gen 1 : Kanto (#001 - #151)',
    gen2: 'Gen 2 : Johto (#152 - #251)',
    gen3: 'Gen 3 : Hoenn (#252 - #386)',
    gen4: 'Gen 4 : Sinnoh (#387 - #493)',
    gen5: 'Gen 5 : Unys (#494 - #649)',
    gen6: 'Gen 6 : Kalos (#650 - #721)',
    gen7: 'Gen 7 : Alola (#722 - #809)',
    gen8: 'Gen 8 : Galar (#810 - #905)',
    gen9: 'Gen 9 : Paldea (#906 - #1025)'
  };
  return map[category] || 'Toutes les Générations';
}

function pickRandomPokecriesPokemon(category, era) {
  if (typeof POKECRIES_DATA === 'undefined' || !Array.isArray(POKECRIES_DATA) || POKECRIES_DATA.length === 0) {
    console.error('POKECRIES_DATA non chargé !');
    return null;
  }

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

  return {
    id: picked.id,
    name: picked.name,
    enName: picked.enName,
    gen: picked.gen,
    types: picked.types || [],
    cryUrl: cryUrl,
    artworkUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${picked.id}.png`,
    spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${picked.id}.png`
  };
}

function generatePokecriesChoices(correctPokemon, category, era) {
  let pool = POKECRIES_DATA || [];
  if (category && category !== 'all') {
    const genNum = parseInt(category.replace('gen', ''), 10);
    if (!isNaN(genNum) && genNum >= 1 && genNum <= 9) {
      pool = pool.filter(p => p.gen === genNum);
    }
  }
  if (era === 'legacy') {
    pool = pool.filter(p => p.gen <= 5);
  }
  if (!pool || pool.length === 0) pool = POKECRIES_DATA || [];

  const choices = [correctPokemon.name];
  const others = pool.filter(p => p.id !== correctPokemon.id);
  const shuffledOthers = others.slice().sort(() => 0.5 - Math.random());
  for (let i = 0; i < 3 && i < shuffledOthers.length; i++) {
    choices.push(shuffledOthers[i].name);
  }
  choices.sort(() => 0.5 - Math.random());
  return choices;
}

// --- Audio Player Functions ---

function playPokecriesAudio(url) {
  if (!url && (!pokecriesState.currentPokemon || !pokecriesState.currentPokemon.cryUrl)) return;
  const audioSrc = url || pokecriesState.currentPokemon.cryUrl;

  try {
    pokecriesAudio.pause();
    pokecriesAudio.currentTime = 0;
    pokecriesAudio.src = audioSrc;
    const volSlider = document.getElementById('pokecries-volume-slider');
    pokecriesAudio.volume = volSlider ? parseFloat(volSlider.value) : 0.85;

    const playPromise = pokecriesAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setPokecriesAudioUIPlaying(true);
        })
        .catch(err => {
          console.warn("Audio autoplay blocked or error:", err);
          setPokecriesAudioUIPlaying(false);
          const statusText = document.getElementById('pokecries-status-text');
          if (statusText) statusText.textContent = "Cliquez sur le haut-parleur pour écouter";
        });
    }
  } catch (e) {
    console.error("Erreur lecture audio PokéCries:", e);
    setPokecriesAudioUIPlaying(false);
  }
}

function stopPokecriesAudio() {
  try {
    pokecriesAudio.pause();
    pokecriesAudio.currentTime = 0;
  } catch (e) {}
  setPokecriesAudioUIPlaying(false);
}

function setPokecriesAudioUIPlaying(isPlaying) {
  pokecriesState.isAudioPlaying = isPlaying;
  const speakerWrap = document.querySelector('.pokecries-speaker-wrap');
  const equalizer = document.getElementById('pokecries-equalizer');
  const playIcon = document.getElementById('pokecries-play-icon');
  const playingIcon = document.getElementById('pokecries-playing-icon');
  const statusText = document.getElementById('pokecries-status-text');

  if (speakerWrap) {
    if (isPlaying) speakerWrap.classList.add('is-playing');
    else speakerWrap.classList.remove('is-playing');
  }

  if (equalizer) {
    if (isPlaying) equalizer.classList.add('is-active');
    else equalizer.classList.remove('is-active');
  }

  if (playIcon && playingIcon) {
    if (isPlaying) {
      playIcon.classList.add('view-hidden');
      playingIcon.classList.remove('view-hidden');
    } else {
      playIcon.classList.remove('view-hidden');
      playingIcon.classList.add('view-hidden');
    }
  }

  if (statusText) {
    if (isPlaying) {
      statusText.textContent = "🔊 Écoute du cri Pokémon...";
    } else {
      statusText.textContent = "Cliquez pour réécouter le cri";
    }
  }
}

// --- Solo Mode Engine ---

function startPokecriesSolo(category, era, inputMode) {
  pokecriesState.mode = 'solo';
  pokecriesState.category = category || 'all';
  pokecriesState.era = era || 'latest';
  pokecriesState.inputMode = inputMode || 'mcq';
  pokecriesState.roomId = null;
  pokecriesState.isHost = false;

  showView('pokecriesGame');
  updateRoomDisplay(false);

  const lobby = document.getElementById('pokecries-multi-lobby');
  const activeGame = document.getElementById('pokecries-active-game');
  if (lobby) lobby.classList.add('view-hidden');
  if (activeGame) activeGame.classList.remove('view-hidden');

  loadNextPokecriesSoloRound();
}

function loadNextPokecriesSoloRound() {
  const pokemon = pickRandomPokecriesPokemon(pokecriesState.category, pokecriesState.era);
  if (!pokemon) {
    alert("Impossible de charger les données des Pokémon.");
    return;
  }

  pokecriesState.currentPokemon = pokemon;
  pokecriesState.hasAnswered = false;
  pokecriesState.isCorrect = false;
  pokecriesState.usedHints = { type: false, gen: false, silhouette: false };
  pokecriesState.currentChoices = generatePokecriesChoices(pokemon, pokecriesState.category, pokecriesState.era);

  setupPokecriesRoundUI();
  playPokecriesAudio(pokemon.cryUrl);
}

function setupPokecriesRoundUI() {
  const pokemon = pokecriesState.currentPokemon;
  if (!pokemon) return;

  // Streak & Score display
  const streakEl = document.getElementById('pokecries-streak-display');
  const scoreEl = document.getElementById('pokecries-score-display');
  if (streakEl) streakEl.textContent = pokecriesStreak;
  if (scoreEl) scoreEl.textContent = pokecriesScore;

  // Top banner label
  const genPill = document.getElementById('pokecries-gen-pill');
  const roundLabel = document.getElementById('pokecries-round-label');
  if (genPill) genPill.textContent = getPokecriesGenLabel(pokecriesState.category);
  if (roundLabel) {
    if (pokecriesState.mode === 'solo') {
      roundLabel.textContent = `Série en cours : ${pokecriesStreak} d'affilée`;
    } else {
      const maxRoundsStr = pokecriesState.totalRounds > 0 ? pokecriesState.totalRounds : '∞';
      roundLabel.textContent = `Manche ${pokecriesState.roundNumber} / ${maxRoundsStr}`;
    }
  }

  // Hide reveal card
  const revealCard = document.getElementById('pokecries-reveal-card');
  if (revealCard) revealCard.classList.add('view-hidden');

  // Reset hints
  const hintsContainer = document.getElementById('pokecries-hints-container');
  if (hintsContainer) {
    hintsContainer.style.display = pokecriesState.mode === 'solo' ? 'flex' : 'none';
  }

  const hintTypeCard = document.getElementById('hint-card-type');
  const hintGenCard = document.getElementById('hint-card-gen');
  const hintSilCard = document.getElementById('hint-card-silhouette');
  if (hintTypeCard) hintTypeCard.classList.add('view-hidden');
  if (hintGenCard) hintGenCard.classList.add('view-hidden');
  if (hintSilCard) hintSilCard.classList.add('view-hidden');

  const btnHintType = document.getElementById('btn-hint-type');
  const btnHintGen = document.getElementById('btn-hint-gen');
  const btnHintSil = document.getElementById('btn-hint-silhouette');
  if (btnHintType) btnHintType.classList.remove('is-used');
  if (btnHintGen) btnHintGen.classList.remove('is-used');
  if (btnHintSil) btnHintSil.classList.remove('is-used');

  // Input sections
  const mcqGrid = document.getElementById('pokecries-mcq-grid');
  const searchWrapper = document.getElementById('pokecries-search-wrapper');

  if (pokecriesState.inputMode === 'mcq') {
    if (mcqGrid) mcqGrid.classList.remove('view-hidden');
    if (searchWrapper) searchWrapper.classList.add('view-hidden');

    const choices = pokecriesState.currentChoices;
    const choiceButtons = document.querySelectorAll('.pokecries-mcq-btn');
    choiceButtons.forEach((btn, idx) => {
      btn.classList.remove('is-correct', 'is-wrong', 'is-selected');
      btn.disabled = false;
      const textSpan = document.getElementById(`pokecries-choice-${idx}`);
      if (textSpan) textSpan.textContent = choices[idx] || '—';
    });
  } else {
    if (mcqGrid) mcqGrid.classList.add('view-hidden');
    if (searchWrapper) searchWrapper.classList.remove('view-hidden');

    const searchInput = document.getElementById('pokecries-search-input');
    const submitBtn = document.getElementById('btn-pokecries-submit');
    const dropdown = document.getElementById('pokecries-autocomplete-dropdown');
    if (searchInput) {
      searchInput.value = '';
      searchInput.disabled = false;
      searchInput.focus();
    }
    if (submitBtn) submitBtn.disabled = true;
    if (dropdown) dropdown.classList.add('view-hidden');
    pokecriesState.selectedSearchResult = null;
  }
}

function handlePokecriesSoloAnswer(guessName, clickedBtn) {
  if (pokecriesState.hasAnswered || !pokecriesState.currentPokemon) return;
  pokecriesState.hasAnswered = true;

  const pokemon = pokecriesState.currentPokemon;
  const cleanGuess = (guessName || '').trim().toLowerCase();
  const cleanName = (pokemon.name || '').trim().toLowerCase();
  const cleanEnName = (pokemon.enName || '').trim().toLowerCase();

  const isCorrect = cleanGuess === cleanName || cleanGuess === cleanEnName;
  pokecriesState.isCorrect = isCorrect;

  // MCQ button styles
  const choiceButtons = document.querySelectorAll('.pokecries-mcq-btn');
  choiceButtons.forEach((btn, idx) => {
    btn.disabled = true;
    btn.classList.remove('is-selected');
    const choiceName = (pokecriesState.currentChoices[idx] || '').trim().toLowerCase();
    if (choiceName === cleanName || choiceName === cleanEnName) {
      btn.classList.add('is-correct');
    } else if (btn === clickedBtn && !isCorrect) {
      btn.classList.add('is-wrong');
    }
  });

  if (isCorrect) {
    pokecriesStreak++;
    if (pokecriesStreak > pokecriesBestStreak) {
      pokecriesBestStreak = pokecriesStreak;
      localStorage.setItem('pokecries-best-streak', pokecriesBestStreak);
    }
    let points = 100;
    if (pokecriesState.usedHints.type) points -= 20;
    if (pokecriesState.usedHints.gen) points -= 20;
    if (pokecriesState.usedHints.silhouette) points -= 30;
    if (points < 20) points = 20;
    pokecriesScore += points;

    localStorage.setItem('pokecries-streak', pokecriesStreak);
    localStorage.setItem('pokecries-score', pokecriesScore);

    // Record stats
    const playerNick = getPokecriesNickname();
    if (playerNick) {
      fetch('/api/pokecries/record-solo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: playerNick,
          accountNickname: (currentProfile && currentProfile.password) ? currentProfile.nickname : null,
          avatar: (currentProfile && currentProfile.avatar) ? currentProfile.avatar : '⚡',
          isWinner: true,
          score: points
        })
      }).catch(() => {});
    }
  } else {
    pokecriesStreak = 0;
    localStorage.setItem('pokecries-streak', 0);

    const playerNick = getPokecriesNickname();
    if (playerNick) {
      fetch('/api/pokecries/record-solo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: playerNick,
          accountNickname: (currentProfile && currentProfile.password) ? currentProfile.nickname : null,
          avatar: (currentProfile && currentProfile.avatar) ? currentProfile.avatar : '⚡',
          isWinner: false,
          score: 0
        })
      }).catch(() => {});
    }
  }

  // Update streak / score
  const streakEl = document.getElementById('pokecries-streak-display');
  const scoreEl = document.getElementById('pokecries-score-display');
  if (streakEl) streakEl.textContent = pokecriesStreak;
  if (scoreEl) scoreEl.textContent = pokecriesScore;

  showPokecriesRevealCard(pokemon, isCorrect, false);
}

function showPokecriesRevealCard(pokemon, isCorrect, isMulti) {
  const revealCard = document.getElementById('pokecries-reveal-card');
  const titleEl = document.getElementById('pokecries-reveal-title');
  const artworkImg = document.getElementById('pokecries-reveal-artwork');
  const numEl = document.getElementById('pokecries-reveal-num');
  const nameEl = document.getElementById('pokecries-reveal-name');
  const enEl = document.getElementById('pokecries-reveal-en');
  const typesRow = document.getElementById('pokecries-reveal-types');
  const nextPokemonBtn = document.getElementById('btn-pokecries-next-pokemon');
  const nextRoundBtn = document.getElementById('btn-pokecries-next-round');

  if (!revealCard || !pokemon) return;

  if (titleEl) {
    if (isCorrect) {
      titleEl.innerHTML = `🎉 Bravo ! C'est bien <span class="text-gradient">${escapeHtml(pokemon.name)}</span> !`;
      titleEl.style.color = '#10b981';
    } else {
      titleEl.innerHTML = `❌ Dommage ! Le Pokémon était <span class="text-gradient">${escapeHtml(pokemon.name)}</span>`;
      titleEl.style.color = '#f87171';
    }
  }

  if (artworkImg) {
    artworkImg.src = pokemon.artworkUrl || pokemon.spriteUrl || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
  }

  if (numEl) numEl.textContent = `N° ${String(pokemon.id).padStart(4, '0')}`;
  if (nameEl) nameEl.textContent = pokemon.name;
  if (enEl) enEl.textContent = `${pokemon.enName} • Gen ${pokemon.gen} (${getPokecriesRegionName(pokemon.gen)})`;

  if (typesRow) {
    typesRow.innerHTML = (pokemon.types || []).map(t => {
      const slug = t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return `<span class="poke-type-badge type-${slug}">${escapeHtml(t)}</span>`;
    }).join('');
  }

  if (nextPokemonBtn && nextRoundBtn) {
    if (isMulti) {
      nextPokemonBtn.classList.add('view-hidden');
      nextRoundBtn.classList.remove('view-hidden');
      nextRoundBtn.style.display = pokecriesState.isHost ? 'inline-block' : 'none';
      nextRoundBtn.textContent = pokecriesState.roundNumber >= pokecriesState.totalRounds ? 'Fin de Partie' : 'Manche Suivante';
    } else {
      nextPokemonBtn.classList.remove('view-hidden');
      nextRoundBtn.classList.add('view-hidden');
    }
  }

  // Update MCQ buttons on solution reveal
  const choiceButtons = document.querySelectorAll('.pokecries-mcq-btn');
  const cleanName = (pokemon.name || '').trim().toLowerCase();
  const cleanEnName = (pokemon.enName || '').trim().toLowerCase();
  choiceButtons.forEach((btn, idx) => {
    btn.disabled = true;
    const choiceName = (pokecriesState.currentChoices[idx] || '').trim().toLowerCase();
    if (choiceName === cleanName || choiceName === cleanEnName) {
      btn.classList.remove('is-selected', 'is-wrong');
      btn.classList.add('is-correct');
    } else if (btn.classList.contains('is-selected')) {
      btn.classList.remove('is-selected');
      btn.classList.add('is-wrong');
    }
  });

  revealCard.classList.remove('view-hidden');
}

// --- Autocomplete for Search Mode ---

function handlePokecriesSearchInput(query) {
  const dropdown = document.getElementById('pokecries-autocomplete-dropdown');
  const submitBtn = document.getElementById('btn-pokecries-submit');
  if (!dropdown) return;

  const q = (query || '').trim().toLowerCase();
  if (q.length < 1) {
    dropdown.innerHTML = '';
    dropdown.classList.add('view-hidden');
    if (submitBtn) submitBtn.disabled = true;
    pokecriesState.selectedSearchResult = null;
    return;
  }

  const pool = POKECRIES_DATA || [];
  const matches = pool.filter(p => 
    p.name.toLowerCase().includes(q) || p.enName.toLowerCase().includes(q)
  ).slice(0, 8);

  if (matches.length === 0) {
    dropdown.innerHTML = '<div class="autocomplete-no-res">Aucun Pokémon trouvé</div>';
    dropdown.classList.remove('view-hidden');
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  dropdown.innerHTML = matches.map(p => `
    <div class="songless-autocomplete-item pokecries-auto-item" data-id="${p.id}" data-name="${escapeHtml(p.name)}">
      <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png" alt="" style="width:28px; height:28px; object-fit:contain;">
      <div style="flex:1;">
        <span style="font-weight:700; color:#fff;">${escapeHtml(p.name)}</span>
        <span style="font-size:12px; color:var(--text-muted); margin-left:6px;">(${escapeHtml(p.enName)})</span>
      </div>
      <span style="font-size:11px; color:#fbbf24; font-weight:700;">#${String(p.id).padStart(3, '0')}</span>
    </div>
  `).join('');

  dropdown.classList.remove('view-hidden');

  dropdown.querySelectorAll('.pokecries-auto-item').forEach(item => {
    item.addEventListener('click', () => {
      const name = item.getAttribute('data-name');
      const input = document.getElementById('pokecries-search-input');
      if (input) input.value = name;
      pokecriesState.selectedSearchResult = name;
      dropdown.classList.add('view-hidden');
      if (submitBtn) submitBtn.disabled = false;
    });
  });
}

// --- Multiplayer Room Engine ---

function renderPokecriesPodium(state) {
  const podiumPanel = document.getElementById('pokecries-podium-panel');
  const activeGame = document.getElementById('pokecries-active-game');
  const lobbyPanel = document.getElementById('pokecries-multi-lobby');
  const revealCard = document.getElementById('pokecries-reveal-card');
  const steppedContainer = document.getElementById('pokecries-podium-stepped');
  const fullList = document.getElementById('pokecries-podium-full-list');
  const fullListBox = document.getElementById('pokecries-podium-leaderboard-box');
  const btnRestart = document.getElementById('btn-pokecries-restart-lobby');
  const podiumHelper = document.getElementById('pokecries-podium-helper');

  if (activeGame) activeGame.classList.add('view-hidden');
  if (lobbyPanel) lobbyPanel.classList.add('view-hidden');
  if (revealCard) revealCard.classList.add('view-hidden');
  if (podiumPanel) podiumPanel.classList.remove('view-hidden');

  stopPokecriesAudio();

  const leaderboard = state.leaderboard || [];
  const top3 = leaderboard.slice(0, 3);

  // Stepped podium order: 2nd place (left), 1st place (center), 3rd place (right)
  const displayOrder = [];
  if (top3[1]) displayOrder.push({ player: top3[1], rank: 2 });
  if (top3[0]) displayOrder.push({ player: top3[0], rank: 1 });
  if (top3[2]) displayOrder.push({ player: top3[2], rank: 3 });

  if (steppedContainer) {
    if (top3.length === 0) {
      steppedContainer.innerHTML = `<div class="empty-state" style="color:var(--text-muted); padding:2rem; text-align:center;">Aucun score enregistré</div>`;
    } else {
      steppedContainer.innerHTML = displayOrder.map(item => {
        const p = item.player;
        const rank = item.rank;
        const isWinner = rank === 1;
        const isCurrent = p.nickname === getPokecriesNickname();
        const avatarHtml = renderAvatarHTML(p.avatar, p.avatarIsPhoto);
        return `
          <div class="podium-col rank-${rank}">
            ${isWinner ? `<div class="podium-crown">👑</div>` : ''}
            <div class="podium-avatar-ring rank-${rank}">
              <div class="podium-avatar">
                ${avatarHtml}
              </div>
            </div>
            <div class="podium-player-name" title="${escapeHtml(p.nickname)}">
              ${escapeHtml(p.nickname)} ${isCurrent ? '<span class="badge-mini-you" style="background: rgba(245,158,11,0.25); color: #f59e0b; font-size: 10px; padding: 2px 5px; border-radius: 4px; vertical-align: middle; margin-left: 4px;">VOUS</span>' : ''}
            </div>
            <div class="podium-metric-pill rank-${rank}">${p.score} pts</div>
            <div class="podium-step rank-${rank}">
              <span class="podium-step-number">#${rank}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Full Leaderboard list (from 4th down, or all)
  const rest = leaderboard.slice(3);
  if (fullListBox && fullList) {
    if (rest.length > 0) {
      fullListBox.style.display = 'block';
      fullList.innerHTML = rest.map((p, idx) => `
        <div class="stats-leaderboard-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-weight: 800; color: var(--text-muted); font-size: 13px; min-width: 24px;">#${idx + 4}</span>
            <div style="width: 28px; height: 28px; border-radius: 50%; overflow: hidden; display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.08);">
              ${renderAvatarHTML(p.avatar, p.avatarIsPhoto)}
            </div>
            <span style="font-weight: 600; font-size: 14px;">${escapeHtml(p.nickname)} ${p.nickname === getPokecriesNickname() ? '<span class="badge-mini-you" style="background: rgba(245,158,11,0.25); color: #f59e0b; font-size: 10px; padding: 2px 5px; border-radius: 4px; margin-left: 4px;">VOUS</span>' : ''}</span>
          </div>
          <span style="font-weight: 800; font-family: var(--font-mono); color: #f59e0b; font-size: 14px;">${p.score} pts</span>
        </div>
      `).join('');
    } else {
      fullListBox.style.display = 'none';
      fullList.innerHTML = '';
    }
  }

  // Controls
  if (pokecriesState.isHost) {
    if (btnRestart) btnRestart.style.display = 'block';
    if (podiumHelper) podiumHelper.style.display = 'none';
  } else {
    if (btnRestart) btnRestart.style.display = 'none';
    if (podiumHelper) podiumHelper.style.display = 'block';
  }
}

function createPokecriesRoom(nick, category, era, inputMode, totalRounds) {
  const hostNick = nick || getPokecriesNickname();
  const avatar = currentProfile ? currentProfile.avatar : '⚡';
  const avatarIsPhoto = (currentProfile && currentProfile.avatarIsPhoto) || (typeof avatar === 'string' && (avatar.startsWith('data:image/') || avatar.startsWith('http')));

  fetch('/api/pokecries/room/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hostNickname: hostNick,
      hostAvatar: avatar,
      hostAvatarIsPhoto: avatarIsPhoto,
      category: category || 'all',
      era: era || 'latest',
      inputMode: inputMode || 'mcq',
      totalRounds: (totalRounds === 'infinite' || totalRounds === 0 || totalRounds === '0') ? 0 : (parseInt(totalRounds, 10) || 10)
    })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      pokecriesState.isHost = true;
      pokecriesState.roomId = data.roomId;
      joinPokecriesRoom(data.roomId, hostNick, true);
    } else {
      alert("Erreur création salon: " + (data.error || 'Erreur inconnue'));
    }
  })
  .catch(err => alert("Erreur réseau: " + err.message));
}

async function joinPokecriesRoom(roomId, nickname, isHost = false) {
  const code = (roomId || '').trim().toUpperCase();
  const nick = nickname || getPokecriesNickname();
  const avatar = currentProfile ? currentProfile.avatar : '⚡';
  const avatarIsPhoto = (currentProfile && currentProfile.avatarIsPhoto) || (typeof avatar === 'string' && (avatar.startsWith('data:image/') || avatar.startsWith('http')));

  pokecriesState.mode = 'multi';
  pokecriesState.roomId = code;
  pokecriesState.isHost = isHost;
  pokecriesState.currentCryId = null;
  pokecriesState.hasAnswered = false;
  pokecriesState.isCorrect = false;

  showView('pokecriesGame');
  updateRoomDisplay(true, code);

  const lobbyCode = document.getElementById('pokecries-lobby-code');
  if (lobbyCode) lobbyCode.textContent = code;

  // Post join body
  if (!isHost) {
    try {
      const res = await fetch('/api/pokecries/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: code, nickname: nick, avatar, avatarIsPhoto })
      });
      const data = await res.json();
      if (!data.success) {
        alert("Erreur de connexion: " + (data.error || 'Salon introuvable'));
        return;
      }
    } catch (err) {
      alert("Erreur réseau: " + err.message);
      return;
    }
  }

  // Instant State Fetch
  try {
    const stateRes = await fetch(`/api/pokecries/room/state?roomId=${encodeURIComponent(code)}`);
    const stateData = await stateRes.json();
    if (stateData.state) {
      handlePokecriesSSEState(stateData.state);
    }
  } catch (e) {}

  // Connect SSE
  if (pokecriesState.sseSource) {
    pokecriesState.sseSource.close();
  }
  const sseUrl = `/api/events?roomId=${encodeURIComponent(code)}&nickname=${encodeURIComponent(nick)}`;
  pokecriesState.sseSource = new EventSource(sseUrl);

  pokecriesState.sseSource.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'POKECRIES_STATE') {
        handlePokecriesSSEState(msg.state);
      }
    } catch (e) {
      console.error("PokéCries SSE JSON error:", e);
    }
  };

  pokecriesState.sseSource.onerror = (e) => {
    console.warn("PokéCries SSE error", e);
  };

  // 1-second background sync interval
  if (pokecriesState.syncInterval) {
    clearInterval(pokecriesState.syncInterval);
  }
  pokecriesState.syncInterval = setInterval(async () => {
    if (!pokecriesState.roomId || pokecriesState.mode !== 'multi') {
      clearInterval(pokecriesState.syncInterval);
      pokecriesState.syncInterval = null;
      return;
    }
    const currStatus = pokecriesState.currentSSEState ? pokecriesState.currentSSEState.status : null;
    if (currStatus === 'round_ended' || currStatus === 'lobby' || !pokecriesState.isHost) {
      try {
        const syncRes = await fetch(`/api/pokecries/room/state?roomId=${encodeURIComponent(pokecriesState.roomId)}`);
        const syncData = await syncRes.json();
        if (syncData.state) {
          handlePokecriesSSEState(syncData.state);
        }
      } catch (e) {}
    }
  }, 1000);
}

function handlePokecriesSSEState(state) {
  pokecriesState.currentSSEState = state;
  if (state.host) {
    pokecriesState.isHost = (getPokecriesNickname() === state.host);
  }

  const lobby = document.getElementById('pokecries-multi-lobby');
  const activeGame = document.getElementById('pokecries-active-game');
  const podiumPanel = document.getElementById('pokecries-podium-panel');
  const codeEl = document.getElementById('pokecries-lobby-code');
  const startBtn = document.getElementById('btn-pokecries-host-start');
  const revealCard = document.getElementById('pokecries-reveal-card');

  if (codeEl) codeEl.textContent = state.roomId || pokecriesState.roomId;

  pokecriesState.roundNumber = state.roundNumber;
  pokecriesState.totalRounds = state.totalRounds;
  pokecriesState.category = state.category;
  pokecriesState.era = state.era;
  pokecriesState.inputMode = state.inputMode;

  renderPokecriesMultiPlayers(state.players, state.leaderboard);

  // 1. LOBBY STATE
  if (state.status === 'lobby') {
    if (lobby) lobby.classList.remove('view-hidden');
    if (activeGame) activeGame.classList.add('view-hidden');
    if (podiumPanel) podiumPanel.classList.add('view-hidden');
    if (revealCard) revealCard.classList.add('view-hidden');
    stopPokecriesAudio();

    if (startBtn) {
      startBtn.style.display = pokecriesState.isHost ? 'block' : 'none';
      startBtn.disabled = false;
      startBtn.textContent = 'Lancer la partie Ahhhhhh';
    }

    const lobbyCat = document.getElementById('pokecries-lobby-category-select');
    const lobbyEra = document.getElementById('pokecries-lobby-era-select');
    const lobbyMode = document.getElementById('pokecries-lobby-mode-select');
    const lobbyRounds = document.getElementById('pokecries-lobby-rounds-select');
    if (!pokecriesState.isHost) {
      if (lobbyCat && state.category) lobbyCat.value = state.category;
      if (lobbyEra && state.era) lobbyEra.value = state.era;
      if (lobbyMode && state.inputMode) lobbyMode.value = state.inputMode;
      if (lobbyRounds && state.totalRounds !== undefined) {
        lobbyRounds.value = state.totalRounds === 0 ? 'infinite' : String(state.totalRounds);
      }
      if (lobbyCat) lobbyCat.disabled = true;
      if (lobbyEra) lobbyEra.disabled = true;
      if (lobbyMode) lobbyMode.disabled = true;
      if (lobbyRounds) lobbyRounds.disabled = true;
    } else {
      if (lobbyCat) lobbyCat.disabled = false;
      if (lobbyEra) lobbyEra.disabled = false;
      if (lobbyMode) lobbyMode.disabled = false;
      if (lobbyRounds) lobbyRounds.disabled = false;
    }
  }
  // 2. PLAYING STATE
  else if (state.status === 'playing') {
    if (lobby) lobby.classList.add('view-hidden');
    if (podiumPanel) podiumPanel.classList.add('view-hidden');
    if (activeGame) activeGame.classList.remove('view-hidden');

    const newCry = state.currentCry;
    const isNewCry = newCry && (!pokecriesState.currentCryId || pokecriesState.currentCryId !== newCry.id);

    if (isNewCry) {
      pokecriesState.currentCryId = newCry.id;
      pokecriesState.currentPokemon = {
        id: newCry.id,
        cryUrl: newCry.cryUrl,
        gen: newCry.gen
      };
      pokecriesState.currentChoices = newCry.choices || [];
      pokecriesState.hasAnswered = false;
      pokecriesState.isCorrect = false;

      setupPokecriesRoundUI();
      playPokecriesAudio(newCry.cryUrl);
    }
  }
  // 3. ROUND ENDED
  else if (state.status === 'round_ended') {
    if (state.currentSolution) {
      showPokecriesRevealCard(state.currentSolution, pokecriesState.isCorrect, true);
    }
    const btnNext = document.getElementById('btn-pokecries-next-round');
    if (btnNext) {
      btnNext.classList.remove('view-hidden');
      const isFinalRound = state.totalRounds > 0 && state.roundNumber >= state.totalRounds;
      if (pokecriesState.isHost) {
        btnNext.disabled = false;
        btnNext.classList.remove('is-disabled');
        if (isFinalRound) {
          btnNext.textContent = "🏆 Voir le Podium Final";
          btnNext.style.background = "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)";
          btnNext.style.color = "#0b0f19";
          btnNext.style.fontWeight = "800";
        } else {
          btnNext.textContent = `Manche Suivante (${state.roundNumber}/${state.totalRounds || 10})`;
          btnNext.style.background = "";
          btnNext.style.color = "";
          btnNext.style.fontWeight = "";
        }
      } else {
        btnNext.disabled = true;
        btnNext.classList.add('is-disabled');
        btnNext.textContent = isFinalRound ? "⏳ En attente de l'hôte pour afficher le podium..." : "⏳ En attente de l'hôte pour la manche suivante...";
        btnNext.style.background = "";
        btnNext.style.color = "";
        btnNext.style.fontWeight = "";
      }
    }
  }
  // 4. GAME ENDED (PODIUM)
  else if (state.status === 'game_ended') {
    renderPokecriesPodium(state);
  }
}

function renderPokecriesMultiPlayers(players, leaderboard) {
  const sidebar = document.getElementById('pokecries-sidebar-players');
  const countEl = document.getElementById('pokecries-player-count');
  const playerArr = Object.values(players || {});

  if (countEl) countEl.textContent = playerArr.length || 1;

  if (sidebar) {
    const myNick = getPokecriesNickname();
    const listToRender = (leaderboard && leaderboard.length > 0) ? leaderboard : playerArr;

    const newHtml = listToRender.map((p, idx) => {
      const isMe = (p.nickname === myNick);
      const isWinner = p.isCorrect;
      return `
        <li class="player-item ${isMe ? 'current-player' : ''}">
          <div class="player-info-left">
            <div class="player-avatar" style="background: rgba(245, 158, 11, 0.15);">
              ${renderAvatarHTML(p.avatar, p.avatarIsPhoto)}
            </div>
            <div style="min-width: 0; display: flex; flex-direction: column;">
              <div class="player-name">
                ${(leaderboard && leaderboard.length > 0) ? `<span class="badge-mini-rank">#${idx + 1}</span>` : ''}${escapeHtml(p.nickname)}
                ${isMe ? '<span class="badge-mini-you" style="background: rgba(245,158,11,0.25); color: #fbbf24;">VOUS</span>' : ''}
              </div>
              ${isWinner ? '<span class="status-indicator-success" style="color: #10b981; font-size: 11px; font-weight: 700;">✓ Trouvé</span>' : ''}
            </div>
          </div>
          <div class="player-stats" style="color: #fbbf24;">
            ${p.score || 0} pts
          </div>
        </li>
      `;
    }).join('');

    if (sidebar.dataset.lastHtml !== newHtml) {
      sidebar.innerHTML = newHtml;
      sidebar.dataset.lastHtml = newHtml;
    }
  }
}

function submitPokecriesMultiGuess(guess, clickedBtn = null) {
  if (pokecriesState.hasAnswered || !pokecriesState.roomId) return;
  pokecriesState.hasAnswered = true;

  // Immediately lock MCQ buttons and mark selected choice
  const choiceButtons = document.querySelectorAll('.pokecries-mcq-btn');
  choiceButtons.forEach(btn => {
    btn.disabled = true;
    btn.classList.remove('is-selected', 'is-correct', 'is-wrong');
    if (btn === clickedBtn) {
      btn.classList.add('is-selected');
    }
  });

  const searchInput = document.getElementById('pokecries-search-input');
  const submitSearchBtn = document.getElementById('btn-pokecries-submit');
  if (searchInput) searchInput.disabled = true;
  if (submitSearchBtn) submitSearchBtn.disabled = true;

  fetch('/api/pokecries/room/guess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId: pokecriesState.roomId,
      nickname: getPokecriesNickname(),
      guess: guess
    })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      pokecriesState.isCorrect = data.isCorrect;
      if (data.isCorrect) {
        showToast("⚡ Réponse correcte !", "success");
      }
      if (data.correctPokemon) {
        showPokecriesRevealCard(data.correctPokemon, data.isCorrect, true);
      }
    }
  })
  .catch(err => console.error("Guess submit error:", err));
}

function leavePokecries() {
  stopPokecriesAudio();
  if (pokecriesState.syncInterval) {
    clearInterval(pokecriesState.syncInterval);
    pokecriesState.syncInterval = null;
  }
  if (pokecriesState.sseSource) {
    pokecriesState.sseSource.close();
    pokecriesState.sseSource = null;
  }
  pokecriesState.roomId = null;
  pokecriesState.isHost = false;
  updateRoomDisplay(false);
}

// --- Init PokéCries UI Listeners ---

function initPokecriesUI() {
  const btnPortal = document.getElementById('btn-portal-pokecries');
  const cardPortal = document.getElementById('card-pokecries');
  const btnBackMenu = document.getElementById('btn-back-pokecries');

  // Navigation
  if (cardPortal) cardPortal.addEventListener('click', () => showView('pokecriesMenu'));
  if (btnPortal) {
    btnPortal.addEventListener('click', (e) => {
      e.stopPropagation();
      showView('pokecriesMenu');
    });
  }
  if (btnBackMenu) btnBackMenu.addEventListener('click', () => showView('portal'));

  // Pre-fill nickname
  const nickInput = document.getElementById('pokecries-player-nickname');
  if (nickInput && currentProfile && currentProfile.nickname) {
    nickInput.value = currentProfile.nickname;
  }

  // Solo Start
  const btnSolo = document.getElementById('btn-pokecries-solo');
  if (btnSolo) {
    btnSolo.addEventListener('click', () => {
      startPokecriesSolo('all', 'latest', 'mcq');
    });
  }

  // Multiplayer Create / Join
  const btnCreateRoom = document.getElementById('btn-pokecries-create-room');
  const btnJoinRoom = document.getElementById('btn-pokecries-join-room');
  const joinInput = document.getElementById('pokecries-room-code-input');

  if (btnCreateRoom) {
    btnCreateRoom.addEventListener('click', () => {
      const nick = getPokecriesNickname();
      createPokecriesRoom(nick, 'all', 'latest', 'mcq', 10);
    });
  }

  if (btnJoinRoom) {
    btnJoinRoom.addEventListener('click', () => {
      const nick = getPokecriesNickname();
      const code = (joinInput ? joinInput.value : '').trim().toUpperCase();
      if (code.length >= 4) {
        joinPokecriesRoom(code, nick);
      } else {
        alert("Veuillez entrer un code de salon valide à 4 lettres.");
      }
    });
  }

  // Live Sync for PokéCries Lobby Settings
  function syncPokecriesLobbySettingsToServer() {
    if (pokecriesState.roomId && pokecriesState.isHost) {
      const lobbyCat = document.getElementById('pokecries-lobby-category-select');
      const lobbyEra = document.getElementById('pokecries-lobby-era-select');
      const lobbyMode = document.getElementById('pokecries-lobby-mode-select');
      const lobbyRounds = document.getElementById('pokecries-lobby-rounds-select');
      const roundsVal = lobbyRounds ? lobbyRounds.value : '10';
      const rounds = (roundsVal === 'infinite' || roundsVal === '0') ? 0 : (parseInt(roundsVal, 10) || 10);

      fetch('/api/pokecries/room/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: pokecriesState.roomId,
          category: lobbyCat ? lobbyCat.value : 'all',
          era: lobbyEra ? lobbyEra.value : 'latest',
          inputMode: lobbyMode ? lobbyMode.value : 'mcq',
          totalRounds: rounds
        })
      });
    }
  }

  ['pokecries-lobby-category-select', 'pokecries-lobby-era-select', 'pokecries-lobby-mode-select', 'pokecries-lobby-rounds-select'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', syncPokecriesLobbySettingsToServer);
  });

  // Host Start & Next round
  const btnHostStart = document.getElementById('btn-pokecries-host-start');
  if (btnHostStart) {
    btnHostStart.addEventListener('click', async () => {
      const lobbyCat = document.getElementById('pokecries-lobby-category-select');
      const lobbyEra = document.getElementById('pokecries-lobby-era-select');
      const lobbyMode = document.getElementById('pokecries-lobby-mode-select');
      const lobbyRounds = document.getElementById('pokecries-lobby-rounds-select');
      const roundsVal = lobbyRounds ? lobbyRounds.value : '10';
      const rounds = (roundsVal === 'infinite' || roundsVal === '0') ? 0 : (parseInt(roundsVal, 10) || 10);

      btnHostStart.disabled = true;
      btnHostStart.textContent = "Lancement en cours...";

      try {
        await fetch('/api/pokecries/room/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: pokecriesState.roomId,
            category: lobbyCat ? lobbyCat.value : 'all',
            era: lobbyEra ? lobbyEra.value : 'latest',
            inputMode: lobbyMode ? lobbyMode.value : 'mcq',
            totalRounds: rounds
          })
        });

        const stateRes = await fetch(`/api/pokecries/room/state?roomId=${encodeURIComponent(pokecriesState.roomId)}`);
        const stateData = await stateRes.json();
        if (stateData.state) {
          handlePokecriesSSEState(stateData.state);
        }
      } catch (e) {
        console.error(e);
      }
    });
  }

  const btnNextRound = document.getElementById('btn-pokecries-next-round');
  if (btnNextRound) {
    btnNextRound.addEventListener('click', async () => {
      if (pokecriesState.roomId && pokecriesState.isHost) {
        btnNextRound.disabled = true;
        btnNextRound.textContent = "Chargement...";
        try {
          await fetch('/api/pokecries/room/next', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: pokecriesState.roomId })
          });
          const stateRes = await fetch(`/api/pokecries/room/state?roomId=${encodeURIComponent(pokecriesState.roomId)}`);
          const stateData = await stateRes.json();
          if (stateData.state) {
            handlePokecriesSSEState(stateData.state);
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
  }

  // Restart Lobby (from Podium)
  const btnRestartLobby = document.getElementById('btn-pokecries-restart-lobby');
  if (btnRestartLobby) {
    btnRestartLobby.addEventListener('click', async () => {
      if (pokecriesState.roomId && pokecriesState.isHost) {
        btnRestartLobby.disabled = true;
        btnRestartLobby.textContent = "Retour au salon...";
        try {
          await fetch('/api/pokecries/room/restart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: pokecriesState.roomId })
          });
          const stateRes = await fetch(`/api/pokecries/room/state?roomId=${encodeURIComponent(pokecriesState.roomId)}`);
          const stateData = await stateRes.json();
          if (stateData.state) {
            handlePokecriesSSEState(stateData.state);
          }
        } catch (e) {
          console.error(e);
        } finally {
          btnRestartLobby.disabled = false;
          btnRestartLobby.textContent = "⚙️ Modifier les paramètres & Rejouer";
        }
      }
    });
  }

  // MCQ Options click
  const mcqButtons = document.querySelectorAll('.pokecries-mcq-btn');
  mcqButtons.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      const choiceName = pokecriesState.currentChoices[idx];
      if (!choiceName) return;
      if (pokecriesState.mode === 'solo') {
        handlePokecriesSoloAnswer(choiceName, btn);
      } else {
        submitPokecriesMultiGuess(choiceName, btn);
      }
    });
  });

  // Audio Buttons
  const btnPlay = document.getElementById('btn-pokecries-play');
  const btnReplay = document.getElementById('btn-pokecries-replay');
  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      if (pokecriesState.currentPokemon) {
        playPokecriesAudio(pokecriesState.currentPokemon.cryUrl);
      }
    });
  }
  if (btnReplay) {
    btnReplay.addEventListener('click', () => {
      if (pokecriesState.currentPokemon) {
        playPokecriesAudio(pokecriesState.currentPokemon.cryUrl);
      }
    });
  }

  // Audio events
  pokecriesAudio.addEventListener('ended', () => setPokecriesAudioUIPlaying(false));
  pokecriesAudio.addEventListener('pause', () => setPokecriesAudioUIPlaying(false));
  pokecriesAudio.addEventListener('error', () => setPokecriesAudioUIPlaying(false));

  // Volume & Mute
  const volSlider = document.getElementById('pokecries-volume-slider');
  const btnMute = document.getElementById('btn-pokecries-mute');
  const volHigh = document.getElementById('pokecries-vol-high');
  const volMuted = document.getElementById('pokecries-vol-muted');

  if (volSlider) {
    volSlider.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      pokecriesAudio.volume = vol;
      if (vol === 0) {
        if (volHigh) volHigh.classList.add('view-hidden');
        if (volMuted) volMuted.classList.remove('view-hidden');
      } else {
        if (volHigh) volHigh.classList.remove('view-hidden');
        if (volMuted) volMuted.classList.add('view-hidden');
      }
    });
  }

  if (btnMute) {
    btnMute.addEventListener('click', () => {
      if (pokecriesAudio.muted) {
        pokecriesAudio.muted = false;
        if (volHigh) volHigh.classList.remove('view-hidden');
        if (volMuted) volMuted.classList.add('view-hidden');
      } else {
        pokecriesAudio.muted = true;
        if (volHigh) volHigh.classList.add('view-hidden');
        if (volMuted) volMuted.classList.remove('view-hidden');
      }
    });
  }


  // Search input and autocomplete
  const searchInput = document.getElementById('pokecries-search-input');
  const submitSearchBtn = document.getElementById('btn-pokecries-submit');
  let searchTimer = null;

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        handlePokecriesSearchInput(e.target.value);
      }, 150);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = pokecriesState.selectedSearchResult || searchInput.value.trim();
        if (val) {
          if (pokecriesState.mode === 'solo') {
            handlePokecriesSoloAnswer(val, null);
          } else {
            submitPokecriesMultiGuess(val);
          }
        }
      }
    });
  }

  if (submitSearchBtn) {
    submitSearchBtn.addEventListener('click', () => {
      const val = pokecriesState.selectedSearchResult || (searchInput ? searchInput.value.trim() : '');
      if (val) {
        if (pokecriesState.mode === 'solo') {
          handlePokecriesSoloAnswer(val, null);
        } else {
          submitPokecriesMultiGuess(val);
        }
      }
    });
  }

  // Hints Buttons
  const btnHintType = document.getElementById('btn-hint-type');
  const btnHintGen = document.getElementById('btn-hint-gen');
  const btnHintSil = document.getElementById('btn-hint-silhouette');

  if (btnHintType) {
    btnHintType.addEventListener('click', () => {
      if (pokecriesState.usedHints.type || !pokecriesState.currentPokemon) return;
      pokecriesState.usedHints.type = true;
      btnHintType.classList.add('is-used');
      const card = document.getElementById('hint-card-type');
      const val = document.getElementById('hint-val-type');
      if (card && val) {
        val.textContent = (pokecriesState.currentPokemon.types || []).join(' / ');
        card.classList.remove('view-hidden');
      }
    });
  }

  if (btnHintGen) {
    btnHintGen.addEventListener('click', () => {
      if (pokecriesState.usedHints.gen || !pokecriesState.currentPokemon) return;
      pokecriesState.usedHints.gen = true;
      btnHintGen.classList.add('is-used');
      const card = document.getElementById('hint-card-gen');
      const val = document.getElementById('hint-val-gen');
      if (card && val) {
        val.textContent = `Génération ${pokecriesState.currentPokemon.gen} (${getPokecriesRegionName(pokecriesState.currentPokemon.gen)})`;
        card.classList.remove('view-hidden');
      }
    });
  }

  if (btnHintSil) {
    btnHintSil.addEventListener('click', () => {
      if (pokecriesState.usedHints.silhouette || !pokecriesState.currentPokemon) return;
      pokecriesState.usedHints.silhouette = true;
      btnHintSil.classList.add('is-used');
      const card = document.getElementById('hint-card-silhouette');
      const img = document.getElementById('hint-img-silhouette');
      if (card && img) {
        img.src = pokecriesState.currentPokemon.artworkUrl || pokecriesState.currentPokemon.spriteUrl;
        card.classList.remove('view-hidden');
      }
    });
  }

  // Give Up Button
  const btnGiveUp = document.getElementById('btn-pokecries-giveup');
  if (btnGiveUp) {
    btnGiveUp.addEventListener('click', () => {
      if (pokecriesState.mode === 'solo') {
        handlePokecriesSoloAnswer('GIVEUP_MISMATCH', null);
      }
    });
  }

  // Next Pokemon Button (Solo)
  const btnNextPokemon = document.getElementById('btn-pokecries-next-pokemon');
  if (btnNextPokemon) {
    btnNextPokemon.addEventListener('click', () => {
      loadNextPokecriesSoloRound();
    });
  }

  // Share score button
  const btnShare = document.getElementById('btn-pokecries-share');
  if (btnShare) {
    btnShare.addEventListener('click', () => {
      const text = `SuperCaraQuiz Ahhhhhh ⚡\n🔥 Série : ${pokecriesStreak} d'affilée | 🏆 Score : ${pokecriesScore} pts\n🔊 Reconnaître les 1025 cris Pokémon\nhttps://supercaraquiz.duckdns.org`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          showToast("Score copié dans le presse-papier !");
        });
      } else {
        alert(text);
      }
    });
  }

  // Global Keyboard listener for Replay (Space or R)
  window.addEventListener('keydown', (e) => {
    const gameView = document.getElementById('pokecries-game-view');
    if (gameView && !gameView.classList.contains('view-hidden')) {
      const activeTag = (document.activeElement ? document.activeElement.tagName.toLowerCase() : '');
      if (activeTag !== 'input' && activeTag !== 'textarea') {
        if (e.code === 'Space' || e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          if (pokecriesState.currentPokemon) {
            playPokecriesAudio(pokecriesState.currentPokemon.cryUrl);
          }
        }
      }
    }
  });
}

// --- Run Init ---
init();
initSonglessUI();
initPokecriesUI();
syncAllNicknameInputs();




