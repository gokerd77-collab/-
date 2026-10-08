import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- TYPE DEFINITIONS ---
export type ContinentId = 'north_america' | 'south_america' | 'europe' | 'africa' | 'asia' | 'australia';

export interface Territory {
  id: string;
  name: string;
  nameAr: string;
  continentId: ContinentId;
  neighbors: string[];
  x: number;
  y: number;
}

export type RiskCardType = 'infantry' | 'cavalry' | 'artillery' | 'wildcard';

export interface RiskCard {
  id: string;
  type: RiskCardType;
  territoryId?: string;
  territoryName?: string;
}

export interface Team {
  id: string;
  name: string;
  nameAr: string;
  color: string;
  secondaryColor: string;
  icon: string;
  territoryCount: number;
  totalTroops: number;
  cards: RiskCard[];
  eliminated: boolean;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  isHost: boolean;
  isOnline: boolean;
  joinedAt: number;
  socketId?: string;
}

export type GamePhase =
  | 'LOBBY'
  | 'DEPLOY'
  | 'ATTACK'
  | 'CONQUEST'
  | 'FORTIFY'
  | 'VICTORY';

export interface BattleState {
  attackerTerritoryId: string;
  defenderTerritoryId: string;
  attackerTeamId: string;
  defenderTeamId: string;
  lastWinner: 'attacker' | 'defender' | null;
  attackerLosses: number;
  defenderLosses: number;
  conquered: boolean;
  minTroopsToMove: number;
  maxTroopsToMove: number;
  movedTroops: number;
  clashCount: number;
  timestamp: number;
}

export interface GameLog {
  id: string;
  timestamp: number;
  text: string;
  textAr: string;
  type: 'deploy' | 'attack' | 'conquer' | 'fortify' | 'card' | 'turn' | 'system' | 'victory';
  teamId?: string;
}

export interface TerritoryState {
  id: string;
  teamId: string;
  troops: number;
}

export interface GameStats {
  startTime: number;
  endTime?: number;
  totalTurns: number;
  totalBattles: number;
  totalTroopsLost: Record<string, number>;
  territoriesConquered: Record<string, number>;
}

export interface RoomState {
  roomCode: string;
  createdAt: number;
  status: 'lobby' | 'playing' | 'paused' | 'finished';
  phase: GamePhase;
  turnIndex: number;
  activeTeamId: string;
  availableReinforcements: number;
  teams: Team[];
  players: Player[];
  territories: Record<string, TerritoryState>;
  battle: BattleState | null;
  logs: GameLog[];
  stats: GameStats;
  winnerTeamId: string | null;
  conqueredTerritoryThisTurn: boolean;
  tradeInCount: number;
}

// --- RISK MAP DATA & HELPERS ---
const CONTINENTS: Record<ContinentId, { id: ContinentId; nameAr: string; bonus: number; territoryIds: string[] }> = {
  north_america: {
    id: 'north_america',
    nameAr: 'أمريكا الشمالية',
    bonus: 5,
    territoryIds: ['alaska', 'northwest_territory', 'greenland', 'alberta', 'ontario', 'quebec', 'western_united_states', 'eastern_united_states', 'central_america']
  },
  south_america: {
    id: 'south_america',
    nameAr: 'أمريكا الجنوبية',
    bonus: 2,
    territoryIds: ['venezuela', 'peru', 'brazil', 'argentina']
  },
  europe: {
    id: 'europe',
    nameAr: 'أوروبا',
    bonus: 5,
    territoryIds: ['iceland', 'great_britain', 'western_europe', 'northern_europe', 'southern_europe', 'scandinavia', 'ukraine']
  },
  africa: {
    id: 'africa',
    nameAr: 'أفريقيا',
    bonus: 3,
    territoryIds: ['north_africa', 'egypt', 'east_africa', 'congo', 'south_africa', 'madagascar']
  },
  asia: {
    id: 'asia',
    nameAr: 'آسيا',
    bonus: 7,
    territoryIds: ['ural', 'siberia', 'yakutsk', 'kamchatka', 'afghanistan', 'china', 'mongolia', 'irkutsk', 'middle_east', 'india', 'southeast_asia', 'japan']
  },
  australia: {
    id: 'australia',
    nameAr: 'أستراليا وأوقيانوسيا',
    bonus: 2,
    territoryIds: ['indonesia', 'new_guinea', 'western_australia', 'eastern_australia']
  }
};

const TERRITORIES: Territory[] = [
  { id: 'alaska', name: 'Alaska', nameAr: 'ألاسكا', continentId: 'north_america', neighbors: ['northwest_territory', 'alberta', 'kamchatka'], x: 75, y: 110 },
  { id: 'northwest_territory', name: 'Northwest Territory', nameAr: 'الإقليم الشمالي الغربي', continentId: 'north_america', neighbors: ['alaska', 'alberta', 'ontario', 'greenland'], x: 165, y: 115 },
  { id: 'greenland', name: 'Greenland', nameAr: 'جرينلاند', continentId: 'north_america', neighbors: ['northwest_territory', 'quebec', 'ontario', 'iceland'], x: 350, y: 85 },
  { id: 'alberta', name: 'Alberta', nameAr: 'ألبرتا', continentId: 'north_america', neighbors: ['alaska', 'northwest_territory', 'ontario', 'western_united_states'], x: 155, y: 175 },
  { id: 'ontario', name: 'Ontario', nameAr: 'أونتاريو', continentId: 'north_america', neighbors: ['northwest_territory', 'alberta', 'quebec', 'western_united_states', 'eastern_united_states', 'greenland'], x: 230, y: 185 },
  { id: 'quebec', name: 'Quebec', nameAr: 'كيبيك', continentId: 'north_america', neighbors: ['greenland', 'ontario', 'eastern_united_states'], x: 300, y: 180 },
  { id: 'western_united_states', name: 'Western United States', nameAr: 'غرب أمريكا', continentId: 'north_america', neighbors: ['alberta', 'ontario', 'eastern_united_states', 'central_america'], x: 160, y: 250 },
  { id: 'eastern_united_states', name: 'Eastern United States', nameAr: 'شرق أمريكا', continentId: 'north_america', neighbors: ['quebec', 'ontario', 'western_united_states', 'central_america'], x: 245, y: 260 },
  { id: 'central_america', name: 'Central America', nameAr: 'أمريكا الوسطى', continentId: 'north_america', neighbors: ['western_united_states', 'eastern_united_states', 'venezuela'], x: 185, y: 345 },
  { id: 'venezuela', name: 'Venezuela', nameAr: 'فنزويلا', continentId: 'south_america', neighbors: ['central_america', 'peru', 'brazil'], x: 265, y: 405 },
  { id: 'peru', name: 'Peru', nameAr: 'بيرو', continentId: 'south_america', neighbors: ['venezuela', 'brazil', 'argentina'], x: 255, y: 490 },
  { id: 'brazil', name: 'Brazil', nameAr: 'البرازيل', continentId: 'south_america', neighbors: ['venezuela', 'peru', 'argentina', 'north_africa'], x: 340, y: 475 },
  { id: 'argentina', name: 'Argentina', nameAr: 'الأرجنتين', continentId: 'south_america', neighbors: ['peru', 'brazil'], x: 275, y: 585 },
  { id: 'iceland', name: 'Iceland', nameAr: 'آيسلندا', continentId: 'europe', neighbors: ['greenland', 'great_britain', 'scandinavia'], x: 435, y: 125 },
  { id: 'scandinavia', name: 'Scandinavia', nameAr: 'إسكندنافيا', continentId: 'europe', neighbors: ['iceland', 'great_britain', 'northern_europe', 'ukraine'], x: 520, y: 135 },
  { id: 'great_britain', name: 'Great Britain', nameAr: 'بريطانيا العظمى', continentId: 'europe', neighbors: ['iceland', 'scandinavia', 'northern_europe', 'western_europe'], x: 440, y: 200 },
  { id: 'northern_europe', name: 'Northern Europe', nameAr: 'شمال أوروبا', continentId: 'europe', neighbors: ['great_britain', 'scandinavia', 'ukraine', 'western_europe', 'southern_europe'], x: 515, y: 215 },
  { id: 'western_europe', name: 'Western Europe', nameAr: 'غرب أوروبا', continentId: 'europe', neighbors: ['great_britain', 'northern_europe', 'southern_europe', 'north_africa'], x: 445, y: 285 },
  { id: 'southern_europe', name: 'Southern Europe', nameAr: 'جنوب أوروبا', continentId: 'europe', neighbors: ['western_europe', 'northern_europe', 'ukraine', 'north_africa', 'egypt', 'middle_east'], x: 525, y: 280 },
  { id: 'ukraine', name: 'Ukraine', nameAr: 'أوكرانيا وروسيا الغربية', continentId: 'europe', neighbors: ['scandinavia', 'northern_europe', 'southern_europe', 'ural', 'afghanistan', 'middle_east'], x: 605, y: 185 },
  { id: 'north_africa', name: 'North Africa', nameAr: 'شمال أفريقيا', continentId: 'africa', neighbors: ['western_europe', 'southern_europe', 'brazil', 'egypt', 'east_africa', 'congo'], x: 465, y: 380 },
  { id: 'egypt', name: 'Egypt', nameAr: 'مصر', continentId: 'africa', neighbors: ['north_africa', 'southern_europe', 'middle_east', 'east_africa'], x: 545, y: 360 },
  { id: 'east_africa', name: 'East Africa', nameAr: 'شرق أفريقيا', continentId: 'africa', neighbors: ['egypt', 'north_africa', 'congo', 'south_africa', 'madagascar', 'middle_east'], x: 585, y: 445 },
  { id: 'congo', name: 'Congo', nameAr: 'الكونغو', continentId: 'africa', neighbors: ['north_africa', 'east_africa', 'south_africa'], x: 535, y: 475 },
  { id: 'south_africa', name: 'South Africa', nameAr: 'جنوب أفريقيا', continentId: 'africa', neighbors: ['congo', 'east_africa', 'madagascar'], x: 540, y: 565 },
  { id: 'madagascar', name: 'Madagascar', nameAr: 'مدغشقر', continentId: 'africa', neighbors: ['east_africa', 'south_africa'], x: 635, y: 560 },
  { id: 'ural', name: 'Ural', nameAr: 'جبال الأورال', continentId: 'asia', neighbors: ['ukraine', 'siberia', 'china', 'afghanistan'], x: 690, y: 145 },
  { id: 'siberia', name: 'Siberia', nameAr: 'سيبيريا', continentId: 'asia', neighbors: ['ural', 'yakutsk', 'irkutsk', 'mongolia', 'china'], x: 755, y: 115 },
  { id: 'yakutsk', name: 'Yakutsk', nameAr: 'ياكوتسك', continentId: 'asia', neighbors: ['siberia', 'irkutsk', 'kamchatka'], x: 835, y: 95 },
  { id: 'kamchatka', name: 'Kamchatka', nameAr: 'كامتشاتكا', continentId: 'asia', neighbors: ['yakutsk', 'irkutsk', 'mongolia', 'japan', 'alaska'], x: 915, y: 105 },
  { id: 'afghanistan', name: 'Afghanistan', nameAr: 'أفغانستان', continentId: 'asia', neighbors: ['ukraine', 'ural', 'china', 'india', 'middle_east'], x: 675, y: 240 },
  { id: 'china', name: 'China', nameAr: 'الصين', continentId: 'asia', neighbors: ['afghanistan', 'ural', 'siberia', 'mongolia', 'southeast_asia', 'india'], x: 775, y: 275 },
  { id: 'mongolia', name: 'Mongolia', nameAr: 'منغوليا', continentId: 'asia', neighbors: ['siberia', 'irkutsk', 'kamchatka', 'japan', 'china'], x: 825, y: 205 },
  { id: 'irkutsk', name: 'Irkutsk', nameAr: 'إيركوتسك', continentId: 'asia', neighbors: ['siberia', 'yakutsk', 'kamchatka', 'mongolia'], x: 810, y: 155 },
  { id: 'japan', name: 'Japan', nameAr: 'اليابان', continentId: 'asia', neighbors: ['kamchatka', 'mongolia'], x: 910, y: 215 },
  { id: 'middle_east', name: 'Middle East', nameAr: 'الشرق الأوسط', continentId: 'asia', neighbors: ['southern_europe', 'ukraine', 'afghanistan', 'india', 'egypt', 'east_africa'], x: 615, y: 315 },
  { id: 'india', name: 'India', nameAr: 'الهند', continentId: 'asia', neighbors: ['middle_east', 'afghanistan', 'china', 'southeast_asia'], x: 720, y: 345 },
  { id: 'southeast_asia', name: 'Southeast Asia', nameAr: 'جنوب شرق آسيا', continentId: 'asia', neighbors: ['india', 'china', 'indonesia'], x: 805, y: 365 },
  { id: 'indonesia', name: 'Indonesia', nameAr: 'إندونيسيا', continentId: 'australia', neighbors: ['southeast_asia', 'new_guinea', 'western_australia'], x: 820, y: 470 },
  { id: 'new_guinea', name: 'New Guinea', nameAr: 'غينيا الجديدة', continentId: 'australia', neighbors: ['indonesia', 'eastern_australia'], x: 915, y: 450 },
  { id: 'western_australia', name: 'Western Australia', nameAr: 'غرب أستراليا', continentId: 'australia', neighbors: ['indonesia', 'eastern_australia', 'new_guinea'], x: 855, y: 565 },
  { id: 'eastern_australia', name: 'Eastern Australia', nameAr: 'شرق أستراليا', continentId: 'australia', neighbors: ['western_australia', 'new_guinea'], x: 935, y: 550 }
];

const DEFAULT_TEAMS = [
  { id: 'team_crimson', name: 'الفيلق الأحمر', nameAr: 'الفيلق الأحمر', color: '#EF4444', secondaryColor: '#991B1B', icon: 'Sword' },
  { id: 'team_azure', name: 'الدرع الأزرق', nameAr: 'الدرع الأزرق', color: '#3B82F6', secondaryColor: '#1E40AF', icon: 'Shield' },
  { id: 'team_emerald', name: 'الفرقة الخضراء', nameAr: 'الفرقة الخضراء', color: '#10B981', secondaryColor: '#065F46', icon: 'Crown' },
  { id: 'team_amber', name: 'العاصفة الصفراء', nameAr: 'العاصفة الصفراء', color: '#F59E0B', secondaryColor: '#92400E', icon: 'Zap' },
  { id: 'team_violet', name: 'النسر البنفسجي', nameAr: 'النسر البنفسجي', color: '#8B5CF6', secondaryColor: '#5B21B6', icon: 'Compass' },
  { id: 'team_cyan', name: 'الصقر السماوي', nameAr: 'الصقر السماوي', color: '#06B6D4', secondaryColor: '#0E7490', icon: 'Anchor' }
];

function calculateReinforcements(territoryCount: number, continentsHeld: ContinentId[]): { base: number; continentBonus: number; total: number } {
  const base = Math.max(3, Math.floor(territoryCount / 3));
  let continentBonus = 0;
  for (const cid of continentsHeld) {
    continentBonus += CONTINENTS[cid]?.bonus || 0;
  }
  return { base, continentBonus, total: base + continentBonus };
}

function getContinentsHeldByTeam(teamId: string, territories: Record<string, { teamId: string }>): ContinentId[] {
  const held: ContinentId[] = [];
  for (const continent of Object.values(CONTINENTS)) {
    const ownsAll = continent.territoryIds.every((tid) => territories[tid] && territories[tid].teamId === teamId);
    if (ownsAll) held.push(continent.id);
  }
  return held;
}

// --- SERVER SETUP ---
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(express.json());

// In-memory Room State store
const rooms = new Map<string, RoomState>();

function generateRoomCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const num = Math.floor(100 + Math.random() * 900);
  const prefix = letters[Math.floor(Math.random() * letters.length)] +
                 letters[Math.floor(Math.random() * letters.length)] +
                 letters[Math.floor(Math.random() * letters.length)];
  return `${prefix}-${num}`;
}

function createCardDeck(): RiskCard[] {
  const types: ('infantry' | 'cavalry' | 'artillery')[] = ['infantry', 'cavalry', 'artillery'];
  const deck: RiskCard[] = [];
  TERRITORIES.forEach((t, i) => {
    deck.push({
      id: `card_${t.id}`,
      type: types[i % 3],
      territoryId: t.id,
      territoryName: t.nameAr
    });
  });
  deck.push({ id: 'card_wild_1', type: 'wildcard' });
  deck.push({ id: 'card_wild_2', type: 'wildcard' });
  return deck.sort(() => Math.random() - 0.5);
}

let cardDeck = createCardDeck();

function drawCard(): RiskCard {
  if (cardDeck.length === 0) {
    cardDeck = createCardDeck();
  }
  return cardDeck.pop()!;
}

function setupTerritoriesForTeams(teams: Team[]): Record<string, { id: string; teamId: string; troops: number }> {
  const shuffledTerritories = [...TERRITORIES].sort(() => Math.random() - 0.5);
  const territoriesState: Record<string, { id: string; teamId: string; troops: number }> = {};

  shuffledTerritories.forEach((t, index) => {
    const assignedTeam = teams[index % teams.length];
    const initialArmies = 2 + (Math.random() > 0.6 ? 1 : 0);
    territoriesState[t.id] = {
      id: t.id,
      teamId: assignedTeam.id,
      troops: initialArmies
    };
  });

  return territoriesState;
}

function updateTeamTotals(room: RoomState) {
  const totals: Record<string, { count: number; troops: number }> = {};
  room.teams.forEach((t) => {
    totals[t.id] = { count: 0, troops: 0 };
  });

  Object.values(room.territories).forEach((t) => {
    if (totals[t.teamId]) {
      totals[t.teamId].count += 1;
      totals[t.teamId].troops += t.troops;
    }
  });

  room.teams.forEach((t) => {
    t.territoryCount = totals[t.id]?.count || 0;
    t.totalTroops = totals[t.id]?.troops || 0;
    if (t.territoryCount === 0 && room.status === 'playing') {
      t.eliminated = true;
    }
  });
}

function addLog(room: RoomState, textAr: string, text: string, type: GameLog['type'], teamId?: string) {
  const log: GameLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    text,
    textAr,
    type,
    teamId
  };
  room.logs.unshift(log);
  if (room.logs.length > 50) {
    room.logs.pop();
  }
}

// --- REST API ENDPOINTS ---

app.post('/api/rooms/create', (req, res) => {
  const { teamCount = 3, customTeams } = req.body;
  const roomCode = generateRoomCode();

  const selectedTeamsConfig = (customTeams && customTeams.length > 0)
    ? customTeams
    : DEFAULT_TEAMS.slice(0, Math.min(6, Math.max(2, teamCount)));

  const teams: Team[] = selectedTeamsConfig.map((tc: any, index: number) => ({
    id: tc.id || `team_${index + 1}`,
    name: tc.name || `فريق ${index + 1}`,
    nameAr: tc.nameAr || tc.name || `فريق ${index + 1}`,
    color: tc.color || '#3B82F6',
    secondaryColor: tc.secondaryColor || '#1E40AF',
    icon: tc.icon || 'Shield',
    territoryCount: 0,
    totalTroops: 0,
    cards: [],
    eliminated: false
  }));

  const initialTerritories = setupTerritoriesForTeams(teams);

  const room: RoomState = {
    roomCode,
    createdAt: Date.now(),
    status: 'lobby',
    phase: 'LOBBY',
    turnIndex: 0,
    activeTeamId: teams[0].id,
    availableReinforcements: 3,
    teams,
    players: [],
    territories: initialTerritories,
    battle: null,
    logs: [],
    stats: {
      startTime: Date.now(),
      totalTurns: 0,
      totalBattles: 0,
      totalTroopsLost: {},
      territoriesConquered: {}
    },
    winnerTeamId: null,
    conqueredTerritoryThisTurn: false,
    tradeInCount: 0
  };

  updateTeamTotals(room);
  addLog(room, `تم إنشاء غرفة المعركة [${roomCode}] بنجاح`, `Room ${roomCode} created`, 'system');

  rooms.set(roomCode, room);
  res.json({ success: true, roomCode, room });
});

app.get('/api/rooms/:code', (req, res) => {
  const code = req.params.code.toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json(room);
});

app.post('/api/rooms/:code/join', (req, res) => {
  const code = req.params.code.toUpperCase();
  const { name, teamId, playerId } = req.body;
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const existingPlayerIndex = room.players.findIndex((p) => p.id === playerId);
  let player: Player;

  if (existingPlayerIndex >= 0) {
    player = room.players[existingPlayerIndex];
    player.name = name || player.name;
    player.teamId = teamId || player.teamId;
    player.isOnline = true;
  } else {
    player = {
      id: playerId || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name || 'مقاتل',
      teamId: teamId || room.teams[0].id,
      isHost: false,
      isOnline: true,
      joinedAt: Date.now()
    };
    room.players.push(player);
  }

  const team = room.teams.find((t) => t.id === player.teamId);
  addLog(
    room,
    `انضم المقاتل [${player.name}] إلى صفوف [${team?.nameAr || 'المجموعة'}]`,
    `Player ${player.name} joined ${team?.name}`,
    'system',
    player.teamId
  );

  io.to(`room:${code}`).emit('room:updated', room);
  res.json({ success: true, player, room });
});

// Host Actions Logic
function handleHostAction(code: string, payload: { action: string; data?: any }): { success: boolean; error?: string } {
  const room = rooms.get(code);
  if (!room) return { success: false, error: 'Room not found' };

  switch (payload.action) {
    case 'START_GAME': {
      room.status = 'playing';
      room.phase = 'DEPLOY';
      room.turnIndex = 0;
      room.activeTeamId = room.teams[0].id;
      room.stats.startTime = Date.now();
      room.stats.totalTurns = 1;

      const activeTeam = room.teams[0];
      const continentsHeld = getContinentsHeldByTeam(activeTeam.id, room.territories);
      const rf = calculateReinforcements(activeTeam.territoryCount, continentsHeld);
      room.availableReinforcements = rf.total;

      addLog(
        room,
        `بدأت معركة السيطرة الكبرى! الدور الأول لـ [${activeTeam.nameAr}] مع تعزيزات (+${rf.total})`,
        `Battle started! Turn 1 for ${activeTeam.name} (+${rf.total} troops)`,
        'turn',
        activeTeam.id
      );
      break;
    }

    case 'DEPLOY_TROOPS': {
      const { territoryId, count } = payload.data;
      const territory = room.territories[territoryId];
      if (!territory) return { success: false, error: 'Territory not found' };
      if (territory.teamId !== room.activeTeamId) return { success: false, error: 'Not active team territory' };
      if (count > room.availableReinforcements || count <= 0) return { success: false, error: 'Invalid troop count' };

      territory.troops += count;
      room.availableReinforcements -= count;
      updateTeamTotals(room);

      const terrInfo = TERRITORIES.find((t) => t.id === territoryId);
      const team = room.teams.find((t) => t.id === room.activeTeamId);
      addLog(
        room,
        `نشرت [${team?.nameAr}] عدد ${count} جنود في [${terrInfo?.nameAr || territoryId}]`,
        `${team?.name} deployed ${count} troops in ${terrInfo?.name}`,
        'deploy',
        team?.id
      );
      break;
    }

    case 'SET_PHASE': {
      const { phase } = payload.data as { phase: GamePhase };
      room.phase = phase;
      const team = room.teams.find((t) => t.id === room.activeTeamId);
      addLog(
        room,
        `انتقلت اللعبة إلى مرحلة [${phase}] لدور [${team?.nameAr}]`,
        `Phase changed to ${phase}`,
        'system',
        team?.id
      );
      break;
    }

    case 'INITIATE_ATTACK': {
      const { attackerTerritoryId, defenderTerritoryId } = payload.data;
      const attTerr = room.territories[attackerTerritoryId];
      const defTerr = room.territories[defenderTerritoryId];

      if (!attTerr || !defTerr) return { success: false, error: 'Territory not found' };
      if (attTerr.teamId !== room.activeTeamId) return { success: false, error: 'Attacker must be active team' };
      if (attTerr.teamId === defTerr.teamId) return { success: false, error: 'Cannot attack own territory' };
      if (attTerr.troops < 2) return { success: false, error: 'Attacker needs at least 2 troops' };

      room.battle = {
        attackerTerritoryId,
        defenderTerritoryId,
        attackerTeamId: attTerr.teamId,
        defenderTeamId: defTerr.teamId,
        lastWinner: null,
        attackerLosses: 0,
        defenderLosses: 0,
        conquered: false,
        minTroopsToMove: 1,
        maxTroopsToMove: attTerr.troops - 1,
        movedTroops: 1,
        clashCount: 0,
        timestamp: Date.now()
      };

      room.phase = 'ATTACK';

      const attInfo = TERRITORIES.find((t) => t.id === attackerTerritoryId);
      const defInfo = TERRITORIES.find((t) => t.id === defenderTerritoryId);
      const attTeam = room.teams.find((t) => t.id === attTerr.teamId);
      const defTeam = room.teams.find((t) => t.id === defTerr.teamId);

      addLog(
        room,
        `بدأ هجوم وتحدي شفهي من [${attInfo?.nameAr}] (${attTeam?.nameAr}) على [${defInfo?.nameAr}] (${defTeam?.nameAr})!`,
        `${attTeam?.name} attacks ${defInfo?.name} from ${attInfo?.name}!`,
        'attack',
        attTeam?.id
      );
      break;
    }

    // THE CORE VERDICT MECHANIC: 'attacker' (هجوم صحيح) or 'defender' (دفاع صحيح)
    case 'BATTLE_VERDICT': {
      if (!room.battle) return { success: false, error: 'No active battle' };
      const { verdict } = payload.data as { verdict: 'attacker' | 'defender' };

      const b = room.battle;
      const attTerr = room.territories[b.attackerTerritoryId];
      const defTerr = room.territories[b.defenderTerritoryId];

      if (!attTerr || !defTerr) return { success: false, error: 'Territories missing' };

      const attTeam = room.teams.find((t) => t.id === b.attackerTeamId);
      const defTeam = room.teams.find((t) => t.id === b.defenderTeamId);
      const defInfo = TERRITORIES.find((t) => t.id === b.defenderTerritoryId);
      const attInfo = TERRITORIES.find((t) => t.id === b.attackerTerritoryId);

      b.clashCount++;
      room.stats.totalBattles++;

      if (verdict === 'attacker') {
        b.lastWinner = 'attacker';
        b.defenderLosses++;
        defTerr.troops = Math.max(0, defTerr.troops - 1);
        room.stats.totalTroopsLost[b.defenderTeamId] = (room.stats.totalTroopsLost[b.defenderTeamId] || 0) + 1;

        if (defTerr.troops === 0) {
          b.conquered = true;
          room.phase = 'CONQUEST';

          defTerr.teamId = b.attackerTeamId;
          defTerr.troops = 1;
          attTerr.troops -= 1;

          b.minTroopsToMove = 1;
          b.maxTroopsToMove = attTerr.troops - 1;
          b.movedTroops = 1;

          room.conqueredTerritoryThisTurn = true;
          room.stats.territoriesConquered[b.attackerTeamId] = (room.stats.territoriesConquered[b.attackerTeamId] || 0) + 1;

          addLog(
            room,
            `🏆 هجوم صحيح وسقوط المنطقة! [${attTeam?.nameAr}] احتلت [${defInfo?.nameAr}]!`,
            `Territory conquered! ${attTeam?.name} took ${defInfo?.name}!`,
            'conquer',
            attTeam?.id
          );

          updateTeamTotals(room);

          const activeTerrsCount = Object.values(room.territories).filter((t) => t.teamId === b.attackerTeamId).length;
          if (activeTerrsCount >= TERRITORIES.length) {
            room.phase = 'VICTORY';
            room.status = 'finished';
            room.winnerTeamId = b.attackerTeamId;
            room.stats.endTime = Date.now();
            addLog(
              room,
              `👑 النصر الإمبراطوري الشامل! [${attTeam?.nameAr}] بسطت سيطرتها على كافة أرجاء كوكب الأرض!`,
              `VICTORY! ${attTeam?.name} has conquered the entire world!`,
              'victory',
              attTeam?.id
            );
          }
        } else {
          addLog(
            room,
            `⚔️ هجوم صحيح! [${attTeam?.nameAr}] أصابت الهدف، وخسرت [${defInfo?.nameAr}] جنديًا (المتبقي: ${defTerr.troops})`,
            `Attacker scored! Defender lost 1 troop`,
            'attack',
            attTeam?.id
          );
          updateTeamTotals(room);
        }
      } else {
        b.lastWinner = 'defender';
        b.attackerLosses++;
        attTerr.troops = Math.max(1, attTerr.troops - 1);
        room.stats.totalTroopsLost[b.attackerTeamId] = (room.stats.totalTroopsLost[b.attackerTeamId] || 0) + 1;

        addLog(
          room,
          `🛡️ دفاع صحيح! [${defTeam?.nameAr}] صدت الهجوم بنجاح، وخسر المهاجم في [${attInfo?.nameAr}] جنديًا (المتبقي: ${attTerr.troops})`,
          `Defender scored! Attacker lost 1 troop`,
          'attack',
          defTeam?.id
        );

        updateTeamTotals(room);

        if (attTerr.troops < 2) {
          addLog(
            room,
            `توقف الهجوم: لم يعد لدى [${attTeam?.nameAr}] في [${attInfo?.nameAr}] جنود كافية لمواصلة الهجوم (مطلوب 2+).`,
            `Attack stopped: insufficient troops remaining`,
            'system',
            attTeam?.id
          );
        }
      }
      break;
    }

    case 'MOVE_CONQUERED_TROOPS': {
      if (!room.battle || !room.battle.conquered) return { success: false, error: 'Not in conquest' };
      const { additionalTroops } = payload.data;
      const b = room.battle;
      const attTerr = room.territories[b.attackerTerritoryId];
      const defTerr = room.territories[b.defenderTerritoryId];

      if (additionalTroops > 0 && attTerr.troops > additionalTroops) {
        attTerr.troops -= additionalTroops;
        defTerr.troops += additionalTroops;
        b.movedTroops += additionalTroops;
      }

      updateTeamTotals(room);
      room.battle = null;
      room.phase = 'ATTACK';
      break;
    }

    case 'STOP_ATTACKING': {
      room.battle = null;
      room.phase = 'ATTACK';
      break;
    }

    case 'FORTIFY_TROOPS': {
      const { fromTerritoryId, toTerritoryId, count } = payload.data;
      const fromTerr = room.territories[fromTerritoryId];
      const toTerr = room.territories[toTerritoryId];

      if (!fromTerr || !toTerr) return { success: false, error: 'Territories missing' };
      if (fromTerr.teamId !== room.activeTeamId || toTerr.teamId !== room.activeTeamId) {
        return { success: false, error: 'Both territories must belong to active team' };
      }
      if (count <= 0 || fromTerr.troops <= count) {
        return { success: false, error: 'Must leave at least 1 army behind' };
      }

      fromTerr.troops -= count;
      toTerr.troops += count;

      const fromInfo = TERRITORIES.find((t) => t.id === fromTerritoryId);
      const toInfo = TERRITORIES.find((t) => t.id === toTerritoryId);
      const team = room.teams.find((t) => t.id === room.activeTeamId);

      addLog(
        room,
        `تحصين استراتيجي: [${team?.nameAr}] نقلت ${count} جنود من [${fromInfo?.nameAr}] إلى [${toInfo?.nameAr}]`,
        `Fortify: ${team?.name} moved ${count} troops`,
        'fortify',
        team?.id
      );

      updateTeamTotals(room);
      break;
    }

    case 'TRADE_CARDS': {
      const { cardIds } = payload.data;
      const activeTeam = room.teams.find((t) => t.id === room.activeTeamId);
      if (!activeTeam) return { success: false, error: 'Active team missing' };

      room.tradeInCount++;
      const bonusTable = [4, 6, 8, 10, 12, 15];
      const bonus = room.tradeInCount <= bonusTable.length
        ? bonusTable[room.tradeInCount - 1]
        : 15 + (room.tradeInCount - bonusTable.length) * 5;

      room.availableReinforcements += bonus;
      activeTeam.cards = activeTeam.cards.filter((c) => !cardIds.includes(c.id));

      addLog(
        room,
        `🎴 استبدال بطاقات النصر! حصلت [${activeTeam.nameAr}] على +${bonus} تعزيزات إضافية!`,
        `${activeTeam.name} traded cards for +${bonus} reinforcements`,
        'card',
        activeTeam.id
      );
      break;
    }

    case 'NEXT_TURN': {
      const currentTeam = room.teams.find((t) => t.id === room.activeTeamId);
      if (currentTeam && room.conqueredTerritoryThisTurn) {
        const newCard = drawCard();
        currentTeam.cards.push(newCard);
        addLog(
          room,
          `حصلت [${currentTeam.nameAr}] على بطاقة استراتيجية جديدة 🎴`,
          `${currentTeam.name} earned a Risk Card`,
          'card',
          currentTeam.id
        );
      }

      room.conqueredTerritoryThisTurn = false;
      room.battle = null;

      let nextIndex = (room.turnIndex + 1) % room.teams.length;
      let loops = 0;
      while (room.teams[nextIndex].eliminated && loops < room.teams.length) {
        nextIndex = (nextIndex + 1) % room.teams.length;
        loops++;
      }

      room.turnIndex = nextIndex;
      const nextTeam = room.teams[nextIndex];
      room.activeTeamId = nextTeam.id;
      room.phase = 'DEPLOY';
      room.stats.totalTurns++;

      const continentsHeld = getContinentsHeldByTeam(nextTeam.id, room.territories);
      const rf = calculateReinforcements(nextTeam.territoryCount, continentsHeld);
      room.availableReinforcements = rf.total;

      addLog(
        room,
        `بدأ دور [${nextTeam.nameAr}]! القوات المتاحة للتعزيز: +${rf.total}${continentsHeld.length > 0 ? ` (شامل بونص القارات)` : ''}`,
        `Turn begins for ${nextTeam.name} (+${rf.total} troops)`,
        'turn',
        nextTeam.id
      );
      break;
    }

    case 'PAUSE_GAME': {
      room.status = 'paused';
      addLog(room, `تم إيقاف اللعبة مؤقتًا بواسطة المضيف`, `Game paused by host`, 'system');
      break;
    }

    case 'RESUME_GAME': {
      room.status = 'playing';
      addLog(room, `تم استئناف اللعبة بواسطة المضيف`, `Game resumed by host`, 'system');
      break;
    }

    case 'RESTART_GAME': {
      const resetTerritories = setupTerritoriesForTeams(room.teams);
      room.territories = resetTerritories;
      room.teams.forEach((t) => {
        t.cards = [];
        t.eliminated = false;
      });
      room.status = 'lobby';
      room.phase = 'LOBBY';
      room.turnIndex = 0;
      room.activeTeamId = room.teams[0].id;
      room.battle = null;
      room.winnerTeamId = null;
      room.conqueredTerritoryThisTurn = false;
      room.stats = {
        startTime: Date.now(),
        totalTurns: 0,
        totalBattles: 0,
        totalTroopsLost: {},
        territoriesConquered: {}
      };
      updateTeamTotals(room);
      addLog(room, `تمت إعادة تهيئة اللعبة بالكامل`, `Game reset by host`, 'system');
      break;
    }

    default:
      return { success: false, error: 'Unknown action' };
  }

  io.to(`room:${code}`).emit('room:updated', room);
  return { success: true };
}

app.post('/api/rooms/:code/host-action', (req, res) => {
  const code = req.params.code.toUpperCase();
  const result = handleHostAction(code, req.body);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json({ success: true, room: rooms.get(code) });
});

io.on('connection', (socket) => {
  let currentRoomCode: string | null = null;
  let currentPlayerId: string | null = null;

  socket.on('room:join', ({ roomCode, playerId, isHost }) => {
    const code = roomCode.toUpperCase();
    currentRoomCode = code;
    currentPlayerId = playerId;
    socket.join(`room:${code}`);

    const room = rooms.get(code);
    if (room) {
      const player = room.players.find((p) => p.id === playerId);
      if (player) {
        player.isOnline = true;
        player.socketId = socket.id;
      }
      io.to(`room:${code}`).emit('room:updated', room);
      socket.emit('room:init', room);
    }
  });

  socket.on('host:action', ({ roomCode, payload }) => {
    const code = roomCode.toUpperCase();
    handleHostAction(code, payload);
  });

  socket.on('disconnect', () => {
    if (currentRoomCode && currentPlayerId) {
      const room = rooms.get(currentRoomCode);
      if (room) {
        const player = room.players.find((p) => p.id === currentPlayerId);
        if (player) {
          player.isOnline = false;
          io.to(`room:${currentRoomCode}`).emit('room:updated', room);
        }
      }
    }
  });
});

async function startServer() {
  const PORT = process.env.PORT || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`[SOVEREIGN] Game Server listening on port ${PORT}`);
  });
}

startServer();
