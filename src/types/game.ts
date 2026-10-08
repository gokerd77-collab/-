export type ContinentId = 'north_america' | 'south_america' | 'europe' | 'africa' | 'asia' | 'australia';

export interface Continent {
  id: ContinentId;
  name: string;
  nameAr: string;
  bonus: number;
  color: string;
  territoryIds: string[];
}

export interface Territory {
  id: string;
  name: string;
  nameAr: string;
  continentId: ContinentId;
  neighbors: string[];
  x: number;
  y: number;
  path?: string;
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

export type RiskCardType = 'infantry' | 'cavalry' | 'artillery' | 'wildcard';

export interface RiskCard {
  id: string;
  type: RiskCardType;
  territoryId?: string;
  territoryName?: string;
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

export interface HostActionPayload {
  action:
    | 'START_GAME'
    | 'PAUSE_GAME'
    | 'RESUME_GAME'
    | 'RESTART_GAME'
    | 'SET_PHASE'
    | 'NEXT_TURN'
    | 'DEPLOY_TROOPS'
    | 'INITIATE_ATTACK'
    | 'BATTLE_VERDICT' // 'attacker' = هجوم صحيح, 'defender' = دفاع صحيح
    | 'MOVE_CONQUERED_TROOPS'
    | 'STOP_ATTACKING'
    | 'FORTIFY_TROOPS'
    | 'TRADE_CARDS'
    | 'OVERRIDE_TROOPS'
    | 'KICK_PLAYER';
  data?: any;
}
