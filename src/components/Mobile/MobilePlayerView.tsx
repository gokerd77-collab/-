import React, { useState } from 'react';
import { RoomState, Player } from '../../types/game';
import { TERRITORY_LOOKUP } from '../../data/riskMapData';
import {
  ShieldAlert,
  Shield,
  Clock,
  Layers,
  MapPin,
  Sparkles,
  Zap,
  Swords
} from 'lucide-react';

interface MobilePlayerViewProps {
  room: RoomState;
  player: Player;
}

export const MobilePlayerView: React.FC<MobilePlayerViewProps> = ({ room, player }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'territories' | 'cards'>('status');

  const myTeam = room.teams.find((t) => t.id === player.teamId);
  const activeTeam = room.teams.find((t) => t.id === room.activeTeamId);
  const isMyTurn = room.activeTeamId === player.teamId;

  // Territories owned by player's team
  const myTerritories = Object.values(room.territories).filter(
    (t) => t.teamId === player.teamId
  );

  // Check if player's team is currently under attack
  const isUnderAttack =
    room.battle !== null &&
    room.battle.defenderTeamId === player.teamId &&
    !room.battle.conquered;

  // Check if player's team is attacking
  const isAttackingNow =
    room.battle !== null &&
    room.battle.attackerTeamId === player.teamId &&
    !room.battle.conquered;

  const battle = room.battle;
  const defTerritory = battle ? TERRITORY_LOOKUP.get(battle.defenderTerritoryId) : null;
  const attTerritory = battle ? TERRITORY_LOOKUP.get(battle.attackerTerritoryId) : null;
  const attTeam = battle ? room.teams.find((t) => t.id === battle.attackerTeamId) : null;
  const defTeam = battle ? room.teams.find((t) => t.id === battle.defenderTeamId) : null;
  const defTerrState = battle ? room.territories[battle.defenderTerritoryId] : null;
  const attTerrState = battle ? room.territories[battle.attackerTerritoryId] : null;

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans pb-20 select-none">
      {/* Top Mobile Tactical Bar */}
      <header className="sticky top-0 z-40 bg-[#090E17]/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-md"
            style={{ backgroundColor: myTeam?.color || '#3B82F6' }}
          >
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">{player.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">({myTeam?.nameAr})</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>متصل بالجلسة</span>
            </div>
          </div>
        </div>

        <div className="text-left">
          <span className="text-[10px] font-mono text-slate-500 block">غرفة</span>
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            {room.roomCode}
          </span>
        </div>
      </header>

      {/* ALERT: UNDER ATTACK (DEFENDER SCREEN) */}
      {isUnderAttack && (
        <div className="m-3 p-5 rounded-2xl bg-gradient-to-b from-rose-950/90 to-[#12080C] border-2 border-rose-500 shadow-2xl shadow-rose-950/50 animate-pulse">
          <div className="flex items-center gap-2.5 text-rose-400 mb-3">
            <ShieldAlert className="w-6 h-6 animate-bounce" />
            <span className="text-base font-extrabold tracking-wide uppercase">
              ⚔️ منطقتك تحت الهجوم الآن!
            </span>
          </div>

          <div className="bg-slate-900/90 rounded-xl p-3.5 border border-rose-900/50 space-y-2 mb-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs">المهاجم:</span>
              <span className="font-bold text-rose-400">{attTeam?.nameAr}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs">المنطقة المستهدفة:</span>
              <span className="font-bold text-white text-base">{defTerritory?.nameAr}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-800 pt-2 text-xs">
              <span className="text-slate-400">جيوش المهاجم: <strong className="text-rose-400 font-mono text-sm">{attTerrState?.troops}</strong></span>
              <span className="text-slate-400">جيوش دفاعكم: <strong className="text-sky-400 font-mono text-sm">{defTerrState?.troops}</strong></span>
            </div>
          </div>

          <div className="p-3.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-amber-300 font-bold text-sm">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>استمع لسؤال المضيف شفهياً!</span>
            </div>
            <p className="text-[11px] text-amber-200/90">
              أجب بصوت واضح أولاً ليضغط المضيف على «دفاع صحيح» لصالح مجموعتكم ويصد الهجوم!
            </p>
          </div>
        </div>
      )}

      {/* ALERT: ATTACKING ENEMY (ATTACKER SCREEN) */}
      {isAttackingNow && (
        <div className="m-3 p-5 rounded-2xl bg-gradient-to-b from-amber-950/80 to-[#12080C] border-2 border-amber-500 shadow-2xl">
          <div className="flex items-center gap-2.5 text-amber-400 mb-3">
            <Swords className="w-6 h-6 animate-bounce" />
            <span className="text-base font-extrabold tracking-wide uppercase">
              🗡️ مجموعتكم تشن هجومًا الآن!
            </span>
          </div>

          <div className="bg-slate-900/90 rounded-xl p-3.5 border border-amber-900/50 space-y-2 mb-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs">الهدف المعادي:</span>
              <span className="font-bold text-rose-400">{defTerritory?.nameAr} ({defTeam?.nameAr})</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-800 pt-2 text-xs">
              <span className="text-slate-400">جيوشكم: <strong className="text-amber-400 font-mono text-sm">{attTerrState?.troops}</strong></span>
              <span className="text-slate-400">جيوش المدافع: <strong className="text-sky-400 font-mono text-sm">{defTerrState?.troops}</strong></span>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-center space-y-1">
            <span className="text-emerald-300 font-bold text-sm block">
              أجب على سؤال المضيف أسرع من الخصم!
            </span>
            <p className="text-[11px] text-emerald-200/80">
              إجابتكم الصحيحة تسجل «هجوم صحيح» وتخصم من جيوش المدافع حتى احتلال منطقته!
            </p>
          </div>
        </div>
      )}

      {/* Current Turn Status Banner */}
      <div className="mx-3 my-2 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
            {isMyTurn ? 'حالة اللعب الآن' : 'بانتظار دور فريقك'}
          </span>
          <h2 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
            {isMyTurn ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-amber-400">دور مجموعتك الآن!</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-slate-400" />
                <span>الدور الحالي: {activeTeam?.nameAr}</span>
              </>
            )}
          </h2>
          <span className="text-xs text-slate-400 block mt-1">
            المرحلة الحالية: <strong className="text-white font-mono">{room.phase}</strong>
          </span>
        </div>

        <div className="text-left font-mono">
          <span className="text-[10px] text-slate-400 block">جيوش فريقك</span>
          <span className="text-xl font-extrabold text-white">{myTeam?.totalTroops}</span>
        </div>
      </div>

      {/* Host Control Notice */}
      <div className="mx-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed text-right flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <span>
          المضيف هو الحكم الكامل؛ يطرح الأسئلة شفهيًا ويسجل هجوم صحيح أو دفاع صحيح فور إجابتكم.
        </span>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 p-1 mx-3 my-3 bg-slate-900/90 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('status')}
          className={`flex-1 min-h-[44px] py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'status'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          أحداث المعركة
        </button>
        <button
          onClick={() => setActiveTab('territories')}
          className={`flex-1 min-h-[44px] py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'territories'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          مناطقنا ({myTerritories.length})
        </button>
        <button
          onClick={() => setActiveTab('cards')}
          className={`flex-1 min-h-[44px] py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'cards'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          بطاقات الفريق ({myTeam?.cards.length || 0})
        </button>
      </div>

      {/* Tab 1: Live Logs & Battle Stream */}
      {activeTab === 'status' && (
        <div className="mx-3 space-y-2">
          <h3 className="text-xs font-bold text-slate-400 mb-2">سجل الأحداث المباشر:</h3>
          {room.logs.slice(0, 10).map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <div className="flex-1">
                <p className="leading-snug">{log.textAr}</p>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                  {new Date(log.timestamp).toLocaleTimeString('ar-SA')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Team Territories */}
      {activeTab === 'territories' && (
        <div className="mx-3 space-y-2">
          <h3 className="text-xs font-bold text-slate-400 mb-2">
            القلاع التابعة لكم ({myTerritories.length} قلعة):
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {myTerritories.map((t) => {
              const info = TERRITORY_LOOKUP.get(t.id);
              return (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/90 flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-white">{info?.nameAr || t.id}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    {t.troops} جندي
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Tactical Risk Cards */}
      {activeTab === 'cards' && (
        <div className="mx-3 space-y-3">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
            البطاقات المكتسبة سريًا بواسطة فريقك بعد احتلال مناطق خلال دوركم:
          </div>

          {myTeam?.cards && myTeam.cards.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {myTeam.cards.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 shadow-lg text-center space-y-2"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-amber-400 font-bold block">
                      {c.type}
                    </span>
                    <strong className="text-xs text-white block mt-0.5">
                      {c.territoryName || 'بطاقة خاصة'}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
              لم يكتسب فريقكم أي بطاقات بعد. احتلوا منطقة في دوركم لكسب بطاقة!
            </div>
          )}
        </div>
      )}
    </div>
  );
};
