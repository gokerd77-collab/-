import React, { useState, useEffect } from 'react';
import { RoomState, Player, HostActionPayload } from './types/game';
import {
  getSocket,
  createRoomApi,
  getRoomApi,
  joinRoomApi,
  sendHostActionApi
} from './services/socket';
import { HostLobby } from './components/Lobby/HostLobby';
import { JoinScreen } from './components/Lobby/JoinScreen';
import { HostDashboard } from './components/Host/HostDashboard';
import { MobilePlayerView } from './components/Mobile/MobilePlayerView';
import { DEFAULT_TEAMS_CONFIG } from './data/riskMapData';
import { soundManager } from './utils/audio';
import {
  Crown,
  Swords,
  Users,
  Play,
  ArrowRight,
  Shield,
  Volume2,
  VolumeX,
  Compass,
  CheckCircle2
} from 'lucide-react';

type AppMode = 'SPLASH' | 'CREATE_SETUP' | 'HOST_LOBBY' | 'HOST_GAME' | 'JOIN_INPUT' | 'PLAYER_JOIN' | 'PLAYER_GAME';

export default function App() {
  const [mode, setMode] = useState<AppMode>('SPLASH');
  const [room, setRoom] = useState<RoomState | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [teamCount, setTeamCount] = useState<number>(3);
  const [customTeams, setCustomTeams] = useState(DEFAULT_TEAMS_CONFIG.slice(0, 3));
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  // Check URL query parameters for ?join=ROOMCODE
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const joinParam = params.get('join');
      if (joinParam) {
        handleLoadRoomForJoin(joinParam.toUpperCase());
      }
    }
  }, []);

  // Update custom teams list when team count changes
  const handleTeamCountChange = (count: number) => {
    setTeamCount(count);
    setCustomTeams(DEFAULT_TEAMS_CONFIG.slice(0, count));
  };

  const handleCustomTeamNameChange = (index: number, newName: string) => {
    setCustomTeams((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name: newName, nameAr: newName };
      return updated;
    });
  };

  // Socket sync effect
  useEffect(() => {
    if (!room) return;

    const socket = getSocket();

    // Register into room channel
    socket.emit('room:join', {
      roomCode: room.roomCode,
      playerId: player?.id || 'host',
      isHost: !player
    });

    const handleRoomUpdated = (updatedRoom: RoomState) => {
      if (updatedRoom.roomCode === room.roomCode) {
        setRoom(updatedRoom);
      }
    };

    socket.on('room:updated', handleRoomUpdated);
    socket.on('room:init', handleRoomUpdated);

    // Fallback polling every 4 seconds in case of strict network socket interruptions
    const interval = setInterval(async () => {
      try {
        const fresh = await getRoomApi(room.roomCode);
        setRoom(fresh);
      } catch (e) {
        // Ignore background polling error
      }
    }, 4000);

    return () => {
      socket.off('room:updated', handleRoomUpdated);
      socket.off('room:init', handleRoomUpdated);
      clearInterval(interval);
    };
  }, [room?.roomCode, player?.id]);

  // Load Room for Mobile Join
  const handleLoadRoomForJoin = async (code: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const foundRoom = await getRoomApi(code);
      setRoom(foundRoom);
      setMode('PLAYER_JOIN');
    } catch (e) {
      setErrorMsg('لم يتم العثور على الغرفة. تأكد من صحة الكود');
    } finally {
      setIsLoading(false);
    }
  };

  // Create Room as Host
  const handleCreateRoom = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      soundManager.playAttackHorn();
      const res = await createRoomApi(teamCount, customTeams);
      setRoom(res.room);
      setMode('HOST_LOBBY');
    } catch (e) {
      setErrorMsg('فشل إنشاء الغرفة. يرجى المحاولة مرة أخرى');
    } finally {
      setIsLoading(false);
    }
  };

  // Join Room as Player
  const handlePlayerJoin = async (name: string, teamId: string) => {
    if (!room) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const pId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const res = await joinRoomApi(room.roomCode, name, teamId, pId);
      setPlayer(res.player);
      setRoom(res.room);
      setMode('PLAYER_GAME');
    } catch (e) {
      setErrorMsg('تعذر الانضمام للغرفة');
    } finally {
      setIsLoading(false);
    }
  };

  // Host Action Handler
  const handleHostAction = async (payload: HostActionPayload) => {
    if (!room) return;
    try {
      const res = await sendHostActionApi(room.roomCode, payload);
      setRoom(res.room);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // ROUTING VIEW RENDERERS

  // 1. Host Dashboard (Playing)
  if (room && (mode === 'HOST_GAME' || (mode === 'HOST_LOBBY' && room.status === 'playing'))) {
    return <HostDashboard room={room} onHostAction={handleHostAction} />;
  }

  // 2. Host Lobby (Waiting for players)
  if (room && mode === 'HOST_LOBBY') {
    return (
      <HostLobby
        room={room}
        onStartGame={() => {
          handleHostAction({ action: 'START_GAME' });
          setMode('HOST_GAME');
        }}
      />
    );
  }

  // 3. Mobile Player View
  if (room && player && mode === 'PLAYER_GAME') {
    return <MobilePlayerView room={room} player={player} />;
  }

  // 4. Mobile Join Form
  if (room && mode === 'PLAYER_JOIN') {
    return <JoinScreen room={room} onJoin={handlePlayerJoin} isLoading={isLoading} />;
  }

  // 5. Create Room Setup Modal / Screen
  if (mode === 'CREATE_SETUP') {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col items-center justify-center p-4 font-sans select-none">
        <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">إعداد معركة جديدة للمضيف</h2>
                <p className="text-xs text-slate-400">تخصيص عدد المجموعات وقواعد السيطرة</p>
              </div>
            </div>

            <button
              onClick={() => setMode('SPLASH')}
              className="text-xs text-slate-400 hover:text-white"
            >
              رجوع
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          {/* Number of Teams Selector */}
          <div className="space-y-2 text-right">
            <label className="text-xs font-semibold text-slate-300 block">
              عدد المجموعات المتنافسة:
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[2, 3, 4, 5, 6].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => handleTeamCountChange(count)}
                  className={`py-3 rounded-xl font-bold text-sm border transition-all ${
                    teamCount === count
                      ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {count} مجموعات
                </button>
              ))}
            </div>
          </div>

          {/* Customizing Teams List */}
          <div className="space-y-3 text-right">
            <label className="text-xs font-semibold text-slate-300 block">
              أسماء وألوان المجموعات:
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {customTeams.map((team, index) => (
                <div
                  key={team.id}
                  className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800"
                >
                  <span
                    className="w-5 h-5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: team.color }}
                  />
                  <input
                    type="text"
                    value={team.nameAr}
                    onChange={(e) => handleCustomTeamNameChange(index, e.target.value)}
                    className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none text-right"
                    placeholder={`اسم المجموعة ${index + 1}`}
                  />
                  <span className="text-[11px] text-slate-500 font-mono">
                    #{index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreateRoom}
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-slate-950 font-extrabold text-base shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>{isLoading ? 'جاري تجهيز الغرفة...' : 'إنشاء الغرفة وعرض كود الدخول (CREATE ROOM)'}</span>
          </button>
        </div>
      </div>
    );
  }

  // 6. Join Room Input Code Modal
  if (mode === 'JOIN_INPUT') {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col items-center justify-center p-4 font-sans select-none">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <Compass className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">الدخول إلى غرفة المعركة</h2>
            <p className="text-xs text-slate-400 mt-1">
              أدخل كود الغرفة الموضح على شاشة المضيف الرئيسية
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <input
              type="text"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              placeholder="مثال: WAR-789"
              className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 text-center font-mono text-2xl font-bold tracking-widest placeholder-slate-700 focus:outline-none focus:border-amber-500"
            />

            <button
              onClick={() => handleLoadRoomForJoin(roomCodeInput.trim())}
              disabled={isLoading || !roomCodeInput.trim()}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'جاري البحث...' : 'متابعة لاختيار المجموعة'}</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>

            <button
              onClick={() => setMode('SPLASH')}
              className="text-xs text-slate-400 hover:text-white"
            >
              العودة للشاشة الرئيسية
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 7. GRAND CINEMATIC SPLASH / TITLE SCREEN
  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans select-none relative overflow-hidden">
      {/* Background World Tactical Aura */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 30%, rgba(245, 158, 11, 0.15) 0%, transparent 60%),
            radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            linear-gradient(to right, rgba(51, 65, 85, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(51, 65, 85, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 48px 48px, 48px 48px'
        }}
      />

      {/* Top Header */}
      <header className="px-8 py-5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Crown className="w-4 h-4" />
          </div>
          <span className="font-['Cinzel',sans-serif] font-bold text-sm tracking-wider text-slate-300">
            SOVEREIGN
          </span>
        </div>

        <button
          onClick={handleToggleMute}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto relative z-10 space-y-8 my-auto">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Swords className="w-3.5 h-3.5" />
            <span>لعبة الاستراتيجية والسيطرة العالمية الجماعية</span>
          </div>

          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-white font-['Cinzel',sans-serif]">
            SOVEREIGN
          </h1>

          <h2 className="text-xl sm:text-2xl font-bold text-amber-400/90 tracking-widest font-['Cinzel',sans-serif] uppercase">
            GLOBAL CONQUEST · معركة السيطرة الكبرى
          </h2>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed pt-2">
            تجربة استراتيجية كلاسيكية مستوحاة من ريسك بتصميم ويب حديث وتفاعلي.
            شاشة رئيسية للمضيف بكامل تفاصيل الخريطة والأدوار، مع مشاركة حية للاعبين من جوالاتهم.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md pt-4">
          <button
            onClick={() => setMode('CREATE_SETUP')}
            className="w-full sm:w-auto flex-1 min-h-[56px] py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-base shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Crown className="w-5 h-5 fill-slate-950" />
            <span>إنشاء لعبة (CREATE GAME)</span>
          </button>

          <button
            onClick={() => setMode('JOIN_INPUT')}
            className="w-full sm:w-auto flex-1 min-h-[56px] py-4 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-base border border-slate-700 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Users className="w-5 h-5 text-amber-400" />
            <span>انضمام من الجوال (JOIN GAME)</span>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-8 text-right">
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-1">
            <strong className="text-xs text-white block">تحكم المشرف والتحكيم الفوري</strong>
            <p className="text-[11px] text-slate-400 leading-normal">
              المضيف يطرح الأسئلة شفهياً ويسجل «هجوم صحيح» أو «دفاع صحيح» بضغطة زر واحدة وسريعة.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-1">
            <strong className="text-xs text-white block">تفاعل فوري من الجوال</strong>
            <p className="text-[11px] text-slate-400 leading-normal">
              تصل تنبيهات فورية للمجموعات عند بدء الهجمات لمعرفة المنطقة المستهدفة وتنسيق الإجابة.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-1">
            <strong className="text-xs text-white block">خريطة واستراتيجية كلاسيكية</strong>
            <p className="text-[11px] text-slate-400 leading-normal">
              42 إقليمًا، 6 قارات مع بونص الجيوش، تعزيز وتحصين، وبطاقات الغزو الاستراتيجية.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 relative z-10 border-t border-slate-900">
        SOVEREIGN : GLOBAL CONQUEST · غرفة تحكم ومزامنة حية لحظية
      </footer>
    </div>
  );
}
