import { io, Socket } from 'socket.io-client';
import { RoomState, HostActionPayload, Team, GameLog } from '../types/game';
import {
  TERRITORIES,
  DEFAULT_TEAMS_CONFIG,
  calculateReinforcements,
  getContinentsHeldByTeam
} from '../data/riskMapData';

let socket: Socket | null = null;

// Allow custom backend URL via VITE_SERVER_URL if frontend is hosted statically (e.g. GitHub Pages)
const getBaseUrl = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SERVER_URL) {
    return String(import.meta.env.VITE_SERVER_URL).replace(/\/$/, '');
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
};

export function getSocket(): Socket {
  if (!socket) {
    const baseUrl = getBaseUrl();
    socket = io(baseUrl || undefined, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1000
    });
  }
  return socket;
}

// --- IN-BROWSER FALLBACK ENGINE FOR STATIC HOSTS (GitHub Pages) ---
// If the app is hosted statically without an active Express backend, this fallback
// provides seamless offline / tab-to-tab real-time sync via BroadcastChannel & LocalStorage.
const broadcastChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('sovereign_sync_channel')
  : null;

function getLocalRoom(code: string): RoomState | null {
  try {
    const raw = localStorage.getItem(`sovereign_room_${code.toUpperCase()}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveLocalRoom(room: RoomState): void {
  try {
    localStorage.setItem(`sovereign_room_${room.roomCode}`, JSON.stringify(room));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'ROOM_UPDATE', room });
    }
  } catch (e) {
    console.error(e);
  }
}

function createLocalRoom(teamCount: number, customTeams?: any): RoomState {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const num = Math.floor(100 + Math.random() * 900);
  const roomCode = letters[Math.floor(Math.random() * letters.length)] +
                   letters[Math.floor(Math.random() * letters.length)] +
                   letters[Math.floor(Math.random() * letters.length)] +
                   `-${num}`;

  const selectedTeamsConfig = (customTeams && customTeams.length > 0)
    ? customTeams
    : DEFAULT_TEAMS_CONFIG.slice(0, Math.min(6, Math.max(2, teamCount)));

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

  const shuffledTerritories = [...TERRITORIES].sort(() => Math.random() - 0.5);
  const territoriesState: Record<string, { id: string; teamId: string; troops: number }> = {};

  shuffledTerritories.forEach((t, index) => {
    const assignedTeam = teams[index % teams.length];
    territoriesState[t.id] = {
      id: t.id,
      teamId: assignedTeam.id,
      troops: 3
    };
  });

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
    territories: territoriesState,
    battle: null,
    logs: [
      {
        id: `log_${Date.now()}`,
        timestamp: Date.now(),
        text: `Room ${roomCode} created`,
        textAr: `تم إنشاء غرفة المعركة [${roomCode}] بنجاح`,
        type: 'system'
      }
    ],
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

  // Calculate totals
  const totals: Record<string, { count: number; troops: number }> = {};
  room.teams.forEach((t) => (totals[t.id] = { count: 0, troops: 0 }));
  Object.values(room.territories).forEach((t) => {
    if (totals[t.teamId]) {
      totals[t.teamId].count += 1;
      totals[t.teamId].troops += t.troops;
    }
  });
  room.teams.forEach((t) => {
    t.territoryCount = totals[t.id]?.count || 0;
    t.totalTroops = totals[t.id]?.troops || 0;
  });

  saveLocalRoom(room);
  return room;
}

// Subscribe to local sync events if on static hosting
export function onLocalRoomSync(callback: (room: RoomState) => void): () => void {
  if (!broadcastChannel) return () => {};
  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'ROOM_UPDATE' && event.data.room) {
      callback(event.data.room);
    }
  };
  broadcastChannel.addEventListener('message', handler);
  return () => broadcastChannel.removeEventListener('message', handler);
}

// --- REST API & LOCAL ENGINE FALLBACKS ---

export async function createRoomApi(teamCount: number, customTeams?: any): Promise<{ roomCode: string; room: RoomState }> {
  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamCount, customTeams })
    });
    if (!res.ok) throw new Error('API server returned error');
    return await res.json();
  } catch (error) {
    // Graceful fallback for static GitHub Pages hosting
    console.warn('[SOVEREIGN] Backend unreachable, using in-browser local engine fallback:', error);
    const room = createLocalRoom(teamCount, customTeams);
    return { roomCode: room.roomCode, room };
  }
}

export async function getRoomApi(roomCode: string): Promise<RoomState> {
  const code = roomCode.toUpperCase();
  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/rooms/${code}`);
    if (!res.ok) throw new Error('Room not found on server');
    return await res.json();
  } catch (error) {
    const local = getLocalRoom(code);
    if (local) return local;
    throw new Error('Room not found');
  }
}

export async function joinRoomApi(roomCode: string, name: string, teamId: string, playerId: string): Promise<{ player: any; room: RoomState }> {
  const code = roomCode.toUpperCase();
  const baseUrl = getBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/api/rooms/${code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, teamId, playerId })
    });
    if (!res.ok) throw new Error('Server join failed');
    return await res.json();
  } catch (error) {
    const room = getLocalRoom(code);
    if (!room) throw new Error('Room not found');

    const existingIndex = room.players.findIndex((p) => p.id === playerId);
    let player: any;
    if (existingIndex >= 0) {
      player = room.players[existingIndex];
      player.name = name;
      player.teamId = teamId;
      player.isOnline = true;
    } else {
      player = {
        id: playerId,
        name,
        teamId,
        isHost: false,
        isOnline: true,
        joinedAt: Date.now()
      };
      room.players.push(player);
    }

    const team = room.teams.find((t) => t.id === teamId);
    room.logs.unshift({
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      text: `Player ${player.name} joined`,
      textAr: `انضم المقاتل [${player.name}] إلى صفوف [${team?.nameAr || 'المجموعة'}]`,
      type: 'system',
      teamId
    });

    saveLocalRoom(room);
    return { player, room };
  }
}

export async function sendHostActionApi(roomCode: string, payload: HostActionPayload): Promise<{ room: RoomState }> {
  const code = roomCode.toUpperCase();
  const baseUrl = getBaseUrl();

  // Socket attempt
  const s = getSocket();
  if (s.connected) {
    s.emit('host:action', { roomCode: code, payload });
  }

  try {
    const res = await fetch(`${baseUrl}/api/rooms/${code}/host-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Action failed on server');
    return await res.json();
  } catch (error) {
    // Local fallback handler for static hosts
    const room = getLocalRoom(code);
    if (!room) throw new Error('Room not found');

    if (payload.action === 'START_GAME') {
      room.status = 'playing';
      room.phase = 'DEPLOY';
      room.turnIndex = 0;
      room.activeTeamId = room.teams[0].id;
      const activeTeam = room.teams[0];
      const continentsHeld = getContinentsHeldByTeam(activeTeam.id, room.territories);
      const rf = calculateReinforcements(activeTeam.territoryCount, continentsHeld);
      room.availableReinforcements = rf.total;
    } else if (payload.action === 'DEPLOY_TROOPS') {
      const { territoryId, count } = payload.data;
      if (room.territories[territoryId]) {
        room.territories[territoryId].troops += count;
        room.availableReinforcements -= count;
      }
    } else if (payload.action === 'SET_PHASE') {
      room.phase = payload.data.phase;
    } else if (payload.action === 'INITIATE_ATTACK') {
      const { attackerTerritoryId, defenderTerritoryId } = payload.data;
      const attTerr = room.territories[attackerTerritoryId];
      const defTerr = room.territories[defenderTerritoryId];
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
    } else if (payload.action === 'BATTLE_VERDICT') {
      if (room.battle) {
        const b = room.battle;
        const attTerr = room.territories[b.attackerTerritoryId];
        const defTerr = room.territories[b.defenderTerritoryId];
        b.clashCount++;
        if (payload.data.verdict === 'attacker') {
          b.lastWinner = 'attacker';
          b.defenderLosses++;
          defTerr.troops = Math.max(0, defTerr.troops - 1);
          if (defTerr.troops === 0) {
            b.conquered = true;
            room.phase = 'CONQUEST';
            defTerr.teamId = b.attackerTeamId;
            defTerr.troops = 1;
            attTerr.troops -= 1;
            room.conqueredTerritoryThisTurn = true;
          }
        } else {
          b.lastWinner = 'defender';
          b.attackerLosses++;
          attTerr.troops = Math.max(1, attTerr.troops - 1);
        }
      }
    } else if (payload.action === 'MOVE_CONQUERED_TROOPS') {
      if (room.battle && room.battle.conquered) {
        const { additionalTroops } = payload.data;
        const b = room.battle;
        if (additionalTroops > 0 && room.territories[b.attackerTerritoryId].troops > additionalTroops) {
          room.territories[b.attackerTerritoryId].troops -= additionalTroops;
          room.territories[b.defenderTerritoryId].troops += additionalTroops;
        }
        room.battle = null;
        room.phase = 'ATTACK';
      }
    } else if (payload.action === 'STOP_ATTACKING') {
      room.battle = null;
      room.phase = 'ATTACK';
    } else if (payload.action === 'NEXT_TURN') {
      room.conqueredTerritoryThisTurn = false;
      room.battle = null;
      room.turnIndex = (room.turnIndex + 1) % room.teams.length;
      const nextTeam = room.teams[room.turnIndex];
      room.activeTeamId = nextTeam.id;
      room.phase = 'DEPLOY';
      const continentsHeld = getContinentsHeldByTeam(nextTeam.id, room.territories);
      const rf = calculateReinforcements(nextTeam.territoryCount, continentsHeld);
      room.availableReinforcements = rf.total;
    } else if (payload.action === 'PAUSE_GAME') {
      room.status = 'paused';
    } else if (payload.action === 'RESUME_GAME') {
      room.status = 'playing';
    }

    saveLocalRoom(room);
    return { room };
  }
}
