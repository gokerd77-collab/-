import { io, Socket } from 'socket.io-client';
import { RoomState, HostActionPayload } from '../types/game';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(typeof window !== 'undefined' ? window.location.origin : '', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1000
    });
  }
  return socket;
}

// REST API fallback helpers
export async function createRoomApi(teamCount: number, customTeams?: any): Promise<{ roomCode: string; room: RoomState }> {
  const res = await fetch('/api/rooms/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamCount, customTeams })
  });
  if (!res.ok) throw new Error('Failed to create room');
  return res.json();
}

export async function getRoomApi(roomCode: string): Promise<RoomState> {
  const res = await fetch(`/api/rooms/${roomCode}`);
  if (!res.ok) throw new Error('Room not found');
  return res.json();
}

export async function joinRoomApi(roomCode: string, name: string, teamId: string, playerId: string): Promise<{ player: any; room: RoomState }> {
  const res = await fetch(`/api/rooms/${roomCode}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, teamId, playerId })
  });
  if (!res.ok) throw new Error('Failed to join room');
  return res.json();
}

export async function sendHostActionApi(roomCode: string, payload: HostActionPayload): Promise<{ room: RoomState }> {
  // Try sending via socket first for zero latency
  const s = getSocket();
  if (s.connected) {
    s.emit('host:action', { roomCode, payload });
  }

  // Also call REST endpoint to guarantee atomic state mutation
  const res = await fetch(`/api/rooms/${roomCode}/host-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Action failed');
  return res.json();
}
