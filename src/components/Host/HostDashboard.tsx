import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RoomState, Territory, HostActionPayload } from '../../types/game';
import { RiskWorldMap } from '../Map/RiskWorldMap';
import { BattleArenaModal } from '../Battle/BattleArenaModal';
import { VictoryScreen } from '../Modals/VictoryScreen';
import { TERRITORY_LOOKUP, getContinentsHeldByTeam, CONTINENTS } from '../../data/riskMapData';
import { soundManager } from '../../utils/audio';
import {
  Crown,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  QrCode,
  Shield,
  Swords,
  ChevronRight,
  Plus,
  ArrowRight,
  Users,
  ScrollText,
  AlertCircle,
  X
} from 'lucide-react';

interface HostDashboardProps {
  room: RoomState;
  onHostAction: (payload: HostActionPayload) => void;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({ room, onHostAction }) => {
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [targetTerritory, setTargetTerritory] = useState<Territory | null>(null);
  const [deployCount, setDeployCount] = useState<number>(1);
  const [fortifyCount, setFortifyCount] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [showQrModal, setShowQrModal] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  const activeTeam = room.teams.find((t) => t.id === room.activeTeamId);
  const isPlaying = room.status === 'playing';

  // Join URL for QR modal
  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?join=${room.roomCode}`
    : `https://game.app?join=${room.roomCode}`;

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Map territory click routing based on current phase
  const handleTerritoryClick = (territory: Territory) => {
    const terrState = room.territories[territory.id];
    if (!terrState) return;

    if (room.phase === 'DEPLOY') {
      // In Deploy phase: only active team territories can be chosen
      if (terrState.teamId === room.activeTeamId) {
        setSelectedTerritory(territory);
        setDeployCount(Math.min(room.availableReinforcements, 1));
      }
    } else if (room.phase === 'ATTACK') {
      // In Attack phase:
      // If no source territory chosen yet, choose active team territory with >= 2 troops
      if (!selectedTerritory) {
        if (terrState.teamId === room.activeTeamId && terrState.troops >= 2) {
          setSelectedTerritory(territory);
        }
      } else {
        // Source is already chosen
        if (territory.id === selectedTerritory.id) {
          // Deselect
          setSelectedTerritory(null);
          setTargetTerritory(null);
        } else if (terrState.teamId === room.activeTeamId) {
          // Switch source territory if it has >= 2 troops
          if (terrState.troops >= 2) {
            setSelectedTerritory(territory);
            setTargetTerritory(null);
          }
        } else {
          // Enemy territory clicked! Check adjacency
          const sourceTerr = TERRITORY_LOOKUP.get(selectedTerritory.id);
          const isAdjacent = sourceTerr?.neighbors.includes(territory.id);

          if (isAdjacent) {
            setTargetTerritory(territory);
            soundManager.playAttackHorn();
            // Launch attack!
            onHostAction({
              action: 'INITIATE_ATTACK',
              data: {
                attackerTerritoryId: selectedTerritory.id,
                defenderTerritoryId: territory.id
              }
            });
          }
        }
      }
    } else if (room.phase === 'FORTIFY') {
      // In Fortify phase:
      if (!selectedTerritory) {
        if (terrState.teamId === room.activeTeamId && terrState.troops >= 2) {
          setSelectedTerritory(territory);
        }
      } else {
        if (territory.id === selectedTerritory.id) {
          setSelectedTerritory(null);
          setTargetTerritory(null);
        } else if (terrState.teamId === room.activeTeamId) {
          setTargetTerritory(territory);
          setFortifyCount(1);
        }
      }
    }
  };

  // Deploy Action
  const handleConfirmDeploy = () => {
    if (!selectedTerritory) return;
    soundManager.playDeploySound();
    onHostAction({
      action: 'DEPLOY_TROOPS',
      data: {
        territoryId: selectedTerritory.id,
        count: deployCount
      }
    });
    setSelectedTerritory(null);
  };

  // Fortify Action
  const handleConfirmFortify = () => {
    if (!selectedTerritory || !targetTerritory) return;
    soundManager.playDeploySound();
    onHostAction({
      action: 'FORTIFY_TROOPS',
      data: {
        fromTerritoryId: selectedTerritory.id,
        toTerritoryId: targetTerritory.id,
        count: fortifyCount
      }
    });
    setSelectedTerritory(null);
    setTargetTerritory(null);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans select-none">
      {/* Top Strategic HUD Bar */}
      <header className="px-6 py-3.5 border-b border-slate-800/90 bg-[#090E17]/90 backdrop-blur-md flex items-center justify-between shrink-0">
        {/* Brand & Room Info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-wide font-['Cinzel',sans-serif]">
              SOVEREIGN : COMMAND CENTER
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>كود الغرفة:</span>
              <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {room.roomCode}
              </span>
            </div>
          </div>
        </div>

        {/* Central Turn & Phase Banner */}
        <div className="hidden md:flex items-center gap-4 bg-slate-950/80 px-5 py-2 rounded-2xl border border-slate-800 shadow-inner">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-400 font-semibold">الدور الحالي:</span>
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full ring-2 ring-white/20 animate-pulse"
                style={{ backgroundColor: activeTeam?.color || '#3B82F6' }}
              />
              <strong className="text-sm font-bold text-white">{activeTeam?.nameAr}</strong>
            </div>
          </div>

          <span className="text-slate-700">|</span>

          {/* Phase Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">المرحلة:</span>
            <span
              className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                room.phase === 'DEPLOY'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : room.phase === 'ATTACK'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : room.phase === 'FORTIFY'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {room.phase}
            </span>
          </div>
        </div>

        {/* Host Control Actions Bar */}
        <div className="flex items-center gap-2">
          {/* QR Code Trigger */}
          <button
            onClick={() => setShowQrModal(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="رمز QR لجوالات اللاعبين"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">دخول الجوال</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleMute}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title={isMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Pause / Resume */}
          <button
            onClick={() => {
              onHostAction({ action: isPlaying ? 'PAUSE_GAME' : 'RESUME_GAME' });
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title={isPlaying ? 'إيقاف مؤقت' : 'استئناف اللعب'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Reset Game with confirmation */}
          <button
            onClick={() => setShowRestartConfirm(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
            title="إعادة تشغيل اللعبة"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Command Dashboard Layout */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 p-4 gap-4 overflow-hidden items-stretch">
        {/* Left / Center Major Area: Giant World Map (Col-8 or 9) */}
        <div className="xl:col-span-8 flex flex-col h-full min-h-[580px]">
          <RiskWorldMap
            room={room}
            selectedTerritoryId={selectedTerritory?.id || null}
            targetTerritoryId={targetTerritory?.id || null}
            onTerritoryClick={handleTerritoryClick}
          />
        </div>

        {/* Right Area: Strategic Tactical HUD Controls & Overrides (Col-4) */}
        <div className="xl:col-span-4 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-80px)] pr-1">
          {/* PHASE CONTROLS PANEL */}
          <div className="p-5 rounded-2xl bg-[#090E17] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
                تحكم المضيف بمراحل الدور
              </span>
              <span className="text-xs font-bold text-amber-400 font-mono">
                {room.phase}
              </span>
            </div>

            {/* PHASE 1: DEPLOY (تعزيز القوات) */}
            {room.phase === 'DEPLOY' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-right space-y-1">
                  <span className="text-xs text-amber-300 font-semibold block">
                    القوات المتاحة للتعزيز لمجموعة [{activeTeam?.nameAr}]:
                  </span>
                  <div className="text-3xl font-mono font-extrabold text-amber-400">
                    +{room.availableReinforcements} <span className="text-sm font-sans">جندي</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    اضغط على أي منطقة تابعة للمجموعة على الخريطة لتوزيع القوات
                  </p>
                </div>

                {/* Selected Territory Deploy Dialog */}
                {selectedTerritory && room.territories[selectedTerritory.id]?.teamId === room.activeTeamId && (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 text-right space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">المنطقة المحددة:</span>
                      <strong className="text-sm text-white font-bold">{selectedTerritory.nameAr}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">القوات الحالية:</span>
                      <span className="font-mono text-amber-400 font-bold">
                        {room.territories[selectedTerritory.id]?.troops} جنود
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>عدد الجنود المراد نشرهم:</span>
                        <strong className="font-mono text-amber-400 text-sm">+{deployCount}</strong>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max={Math.max(1, room.availableReinforcements)}
                        value={deployCount}
                        onChange={(e) => setDeployCount(Number(e.target.value))}
                        disabled={room.availableReinforcements <= 0}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleConfirmDeploy}
                        disabled={room.availableReinforcements <= 0}
                        className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                      >
                        <Plus className="w-4 h-4" />
                        نشر القوات (DEPLOY)
                      </button>
                      <button
                        onClick={() => setSelectedTerritory(null)}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}

                {/* Transition to Attack Button */}
                <button
                  onClick={() => onHostAction({ action: 'SET_PHASE', data: { phase: 'ATTACK' } })}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 transition-all"
                >
                  <Swords className="w-4 h-4" />
                  الانتقال لمرحلة الهجوم (ATTACK PHASE)
                </button>
              </div>
            )}

            {/* PHASE 2: ATTACK (الهجوم والغزو) */}
            {room.phase === 'ATTACK' && (
              <div className="space-y-4 animate-fadeIn text-right">
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1">
                  <span className="text-xs text-rose-300 font-bold block">مرحلة الهجوم (ATTACK):</span>
                  <p className="text-[11px] text-slate-400">
                    1. اختر منطقة تابعة للمجموعة تملك (2+ جنود).<br />
                    2. اختر منطقة معادية متصلة بها لبدء التحدي والمواجهة الشفهية.
                  </p>
                </div>

                {selectedTerritory && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 space-y-1">
                    <span className="text-slate-400 block">المنطقة المهاجمة المحددة:</span>
                    <strong className="text-white text-sm block">{selectedTerritory.nameAr}</strong>
                    <span className="text-amber-400 font-mono text-[11px] block">
                      القوات: {room.territories[selectedTerritory.id]?.troops} جنود
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setSelectedTerritory(null);
                      setTargetTerritory(null);
                      onHostAction({ action: 'SET_PHASE', data: { phase: 'FORTIFY' } });
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>الانتقال للتحصين (FORTIFY)</span>
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 3: FORTIFY (تحصين ونقل القوات) */}
            {room.phase === 'FORTIFY' && (
              <div className="space-y-4 animate-fadeIn text-right">
                <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/30 space-y-1">
                  <span className="text-xs text-sky-300 font-bold block">مرحلة التحصين (FORTIFY):</span>
                  <p className="text-[11px] text-slate-400">
                    يمكن للمجموعة نقل جنود من منطقة تابعة لها إلى منطقة أخرى تابعة لها لتعزيز الدفاع قبل إنهاء الدور.
                  </p>
                </div>

                {selectedTerritory && targetTerritory && (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-3">
                    <div className="text-xs text-slate-300 flex justify-between">
                      <span>من: <strong>{selectedTerritory.nameAr}</strong></span>
                      <span>إلى: <strong>{targetTerritory.nameAr}</strong></span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>العدد المنقول:</span>
                        <strong className="font-mono text-sky-400 text-sm">{fortifyCount}</strong>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max={Math.max(1, (room.territories[selectedTerritory.id]?.troops || 2) - 1)}
                        value={fortifyCount}
                        onChange={(e) => setFortifyCount(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                    </div>

                    <button
                      onClick={handleConfirmFortify}
                      className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      تنفيذ نقل القوات
                    </button>
                  </div>
                )}

                {/* END TURN BUTTON */}
                <button
                  onClick={() => {
                    setSelectedTerritory(null);
                    setTargetTerritory(null);
                    onHostAction({ action: 'NEXT_TURN' });
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  بدء دور المجموعة التالية (END TURN & NEXT)
                </button>
              </div>
            )}
          </div>

          {/* TEAMS SCORECARDS & LEADERBOARD */}
          <div className="p-4 rounded-2xl bg-[#090E17] border border-slate-800 shadow-xl space-y-3">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold block text-right">
              ترتيب القلاع والسيطرة
            </span>

            <div className="space-y-2">
              {room.teams.map((team, idx) => {
                const isActive = team.id === room.activeTeamId;
                const continentsHeld = getContinentsHeldByTeam(team.id, room.territories);

                return (
                  <div
                    key={team.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-slate-800/90 border-amber-500/70 shadow-md ring-1 ring-amber-500/40'
                        : team.eliminated
                        ? 'bg-slate-950/40 border-slate-900 opacity-40'
                        : 'bg-slate-950/70 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="text-xs font-bold text-white">{team.nameAr}</span>
                        {isActive && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                            دورها الآن
                          </span>
                        )}
                        {team.eliminated && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 font-bold">
                            سقطت القلعة
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-slate-300">
                          {team.territoryCount} <span className="text-[10px] font-sans text-slate-500">قلعة</span>
                        </span>
                        <span className="text-amber-400 font-bold">
                          {team.totalTroops} <span className="text-[10px] font-sans text-slate-500">جندي</span>
                        </span>
                      </div>
                    </div>

                    {/* Continent bonuses & cards held info */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
                      <div>
                        {continentsHeld.length > 0 ? (
                          <span className="text-emerald-400">
                            مسيطر على: {continentsHeld.map((c) => CONTINENTS[c]?.nameAr).join('، ')}
                          </span>
                        ) : (
                          <span>لا توجد قارة كاملة</span>
                        )}
                      </div>
                      <span className="text-slate-400 font-mono">
                        البطاقات: {team.cards.length}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CONNECTED PLAYERS LIST */}
          <div className="p-4 rounded-2xl bg-[#090E17] border border-slate-800 shadow-xl space-y-2.5">
            <div className="flex items-center justify-between text-right">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
                اللاعبون المتصلون بالجلسة ({room.players.length})
              </span>
              <Users className="w-4 h-4 text-slate-500" />
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {room.players.map((p) => {
                const team = room.teams.find((t) => t.id === p.teamId);
                return (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        p.isOnline ? 'bg-emerald-400' : 'bg-rose-500'
                      }`}
                      title={p.isOnline ? 'Online' : 'Offline'}
                    />
                    <span>{p.name}</span>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: team?.color }}
                    />
                  </span>
                );
              })}
            </div>
          </div>

          {/* LIVE EVENT LOG */}
          <div className="p-4 rounded-2xl bg-[#090E17] border border-slate-800 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-right">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400 font-bold">
                سجل العمليات الحربية المباشر
              </span>
              <ScrollText className="w-4 h-4 text-slate-500" />
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-right">
              {room.logs.slice(0, 15).map((log) => (
                <div
                  key={log.id}
                  className="p-2 rounded-lg bg-slate-950/60 border border-slate-900 text-[11px] text-slate-300"
                >
                  <p className="leading-relaxed">{log.textAr}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE BATTLE ARENA MODAL */}
      {room.battle && (
        <BattleArenaModal
          room={room}
          battle={room.battle}
          onVerdict={(verdict) => {
            onHostAction({ action: 'BATTLE_VERDICT', data: { verdict } });
          }}
          onMoveConqueredTroops={(troops) => {
            onHostAction({ action: 'MOVE_CONQUERED_TROOPS', data: { additionalTroops: troops } });
          }}
          onStopAttacking={() => {
            setSelectedTerritory(null);
            setTargetTerritory(null);
            onHostAction({ action: 'STOP_ATTACKING' });
          }}
        />
      )}

      {/* VICTORY SCREEN MODAL */}
      {room.phase === 'VICTORY' && (
        <VictoryScreen
          room={room}
          onRestartGame={() => onHostAction({ action: 'RESTART_GAME' })}
        />
      )}

      {/* QR Code Quick Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4 relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-xs font-mono text-amber-400 font-bold block uppercase">
              ROOM CODE / كود الغرفة
            </span>
            <div className="text-4xl font-extrabold font-mono text-white tracking-wider">
              {room.roomCode}
            </div>

            <div className="p-4 bg-white rounded-2xl w-fit mx-auto shadow-xl">
              <QRCodeSVG value={joinUrl} size={190} level="M" />
            </div>

            <p className="text-xs text-slate-400">
              امسح الكود بجوالك للانضمام الفوري واختيار مجموعتك
            </p>
          </div>
        </div>
      )}

      {/* Restart Game Confirmation Modal */}
      {showRestartConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">تأكيد إعادة تشغيل اللعبة</h3>
            <p className="text-xs text-slate-400">
              هل أنت متأكد من رغبتك في إعادة ضبط اللعبة بالكامل وإعادة توزيع المناطق؟
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setShowRestartConfirm(false);
                  onHostAction({ action: 'RESTART_GAME' });
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                نعم، إعادة التشغيل
              </button>
              <button
                onClick={() => setShowRestartConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
