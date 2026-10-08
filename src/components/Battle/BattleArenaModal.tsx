import React, { useState } from 'react';
import { BattleState, RoomState } from '../../types/game';
import { TERRITORY_LOOKUP } from '../../data/riskMapData';
import { soundManager } from '../../utils/audio';
import {
  Swords,
  Shield,
  Award,
  CheckCircle2,
  AlertTriangle,
  X,
  Zap,
  ArrowRight
} from 'lucide-react';

interface BattleArenaModalProps {
  room: RoomState;
  battle: BattleState;
  onVerdict: (verdict: 'attacker' | 'defender') => void;
  onMoveConqueredTroops: (troops: number) => void;
  onStopAttacking: () => void;
}

export const BattleArenaModal: React.FC<BattleArenaModalProps> = ({
  room,
  battle,
  onVerdict,
  onMoveConqueredTroops,
  onStopAttacking
}) => {
  const [extraMoveTroops, setExtraMoveTroops] = useState(0);

  const attTerritory = TERRITORY_LOOKUP.get(battle.attackerTerritoryId);
  const defTerritory = TERRITORY_LOOKUP.get(battle.defenderTerritoryId);
  const attTerrState = room.territories[battle.attackerTerritoryId];
  const defTerrState = room.territories[battle.defenderTerritoryId];

  const attTeam = room.teams.find((t) => t.id === battle.attackerTeamId);
  const defTeam = room.teams.find((t) => t.id === battle.defenderTeamId);

  const attackerCanAttack = (attTerrState?.troops || 0) >= 2;
  const maxExtraCanMove = Math.max(0, (attTerrState?.troops || 1) - 1);

  const handleAttackerCorrect = () => {
    soundManager.playAttackCorrect();
    onVerdict('attacker');
  };

  const handleDefenderCorrect = () => {
    soundManager.playDefendCorrect();
    onVerdict('defender');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-4xl bg-[#090E17] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                ساحة التحكيم والمواجهة المباشرة
              </h2>
              <p className="text-xs text-slate-400">
                المضيف يطرح السؤال شفهيًا ويحكم بناءً على سرعة وصحة الإجابة
              </p>
            </div>
          </div>

          <button
            onClick={onStopAttacking}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title="إغلاق الهجوم"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Combatants Showcase Header */}
        <div className="grid grid-cols-2 divide-x divide-x-reverse divide-slate-800 bg-slate-950/70 p-6 border-b border-slate-800/80">
          {/* Attacker Team Info */}
          <div className="flex items-center gap-4 pr-2">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 transition-all ${
                battle.lastWinner === 'attacker' ? 'scale-105 ring-4 ring-emerald-400' : ''
              }`}
              style={{
                backgroundColor: attTeam?.color || '#EF4444',
                borderColor: `${attTeam?.color}99`
              }}
            >
              <Swords className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-rose-400 font-bold">المهاجم</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  صاحب المبادرة
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mt-0.5">{attTeam?.nameAr}</h3>
              <div className="text-sm text-slate-300 flex items-center gap-3 mt-1">
                <span>المنطقة: <strong className="text-white">{attTerritory?.nameAr}</strong></span>
                <span>الجيوش: <strong className="font-mono text-amber-400 text-base">{attTerrState?.troops}</strong></span>
              </div>
            </div>
          </div>

          {/* Defender Team Info */}
          <div className="flex items-center gap-4 pl-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 transition-all ${
                battle.lastWinner === 'defender' ? 'scale-105 ring-4 ring-sky-400' : ''
              }`}
              style={{
                backgroundColor: defTeam?.color || '#3B82F6',
                borderColor: `${defTeam?.color}99`
              }}
            >
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-sky-400 font-bold">المدافع</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  دفاع إقليمي
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mt-0.5">{defTeam?.nameAr}</h3>
              <div className="text-sm text-slate-300 flex items-center gap-3 mt-1">
                <span>المنطقة: <strong className="text-white">{defTerritory?.nameAr}</strong></span>
                <span>الجيوش: <strong className="font-mono text-sky-400 text-base">{defTerrState?.troops}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* CONQUEST VICTORY STATE */}
        {battle.conquered ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent">
            <div className="p-4 rounded-full bg-amber-500/20 border-2 border-amber-500/40 text-amber-400 animate-bounce">
              <Award className="w-12 h-12" />
            </div>

            <div>
              <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                TERRITORY CONQUERED!
              </span>
              <h2 className="text-3xl font-extrabold text-white mt-1">
                تم سقوط [ {defTerritory?.nameAr} ] بالكامل!
              </h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto mt-2">
                انتصرت قوات <strong className="text-white">{attTeam?.nameAr}</strong> وسيطرت على المنطقة بالكامل.
              </p>
            </div>

            {/* Troop Relocation Slider */}
            {maxExtraCanMove > 0 && (
              <div className="w-full max-w-md bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-right">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>نقل جيوش إضافية من [{attTerritory?.nameAr}]</span>
                  <span className="font-mono text-amber-400 font-bold text-sm">+{extraMoveTroops}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxExtraCanMove}
                  value={extraMoveTroops}
                  onChange={(e) => setExtraMoveTroops(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>0 (الحد الأدنى)</span>
                  <span>{maxExtraCanMove} (الحد الأقصى)</span>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                soundManager.playConquestFanfare();
                onMoveConqueredTroops(extraMoveTroops);
              }}
              className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-base rounded-xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              تأكيد السيطرة على المنطقة والعودة للخريطة
            </button>
          </div>
        ) : (
          /* ACTIVE JUDGMENT CONTROLS */
          <div className="p-8 space-y-6">
            {/* Host Question Prompt Card */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1.5">
              <span className="text-xs text-amber-400 font-semibold tracking-wide">
                🗣️ اطرح سؤالك الآن على المتنافسين شفهيًا
              </span>
              <p className="text-xs text-slate-400">
                المتسابق الذي يجيب إجابة صحيحة أولاً، اضغط مباشرة على الزر المخصص لفريقه أدناه:
              </p>
            </div>

            {/* THE TWO CORE INSTANT ACTION BUTTONS: «هجوم صحيح» & «دفاع صحيح» */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              {/* BUTTON 1: هجوم صحيح */}
              <button
                disabled={!attackerCanAttack}
                onClick={handleAttackerCorrect}
                className="group relative min-h-[92px] p-5 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 hover:from-emerald-500 hover:to-emerald-700 text-white shadow-xl shadow-emerald-950/50 border-2 border-emerald-400 active:scale-[0.98] transition-all flex flex-col justify-between text-right disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-2xl font-black tracking-tight">هجوم صحيح</span>
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white">
                    <Swords className="w-6 h-6" />
                  </div>
                </div>
                <div className="text-xs text-emerald-100/90 font-medium pt-1">
                  المهاجم ({attTeam?.nameAr}) أجاب صح أولاً · المدافع يخسر (-1 جندي)
                </div>
              </button>

              {/* BUTTON 2: دفاع صحيح */}
              <button
                onClick={handleDefenderCorrect}
                className="group relative min-h-[92px] p-5 rounded-2xl bg-gradient-to-br from-sky-600 via-blue-700 to-blue-900 hover:from-sky-500 hover:to-blue-700 text-white shadow-xl shadow-blue-950/50 border-2 border-sky-400 active:scale-[0.98] transition-all flex flex-col justify-between text-right"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-2xl font-black tracking-tight">دفاع صحيح</span>
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white">
                    <Shield className="w-6 h-6" />
                  </div>
                </div>
                <div className="text-xs text-sky-100/90 font-medium pt-1">
                  المدافع ({defTeam?.nameAr}) أجاب صح أولاً · المهاجم يخسر (-1 جندي)
                </div>
              </button>
            </div>

            {/* Battle Round Feedback Status */}
            {battle.clashCount > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
                <div className="flex items-center justify-center gap-6 text-xs font-bold">
                  <span className="text-rose-400">
                    خسارة المهاجم الإجمالية: <strong className="font-mono text-sm">-{battle.attackerLosses}</strong>
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-sky-400">
                    خسارة المدافع الإجمالية: <strong className="font-mono text-sm">-{battle.defenderLosses}</strong>
                  </span>
                </div>
              </div>
            )}

            {!attackerCanAttack && (
              <div className="p-3 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  توقف الهجوم: تبقى جندي واحد فقط في [{attTerritory?.nameAr}] ولا يمكن مواصلة الهجوم.
                </span>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <button
                onClick={onStopAttacking}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors"
              >
                إنهاء الهجوم والعودة للخريطة
              </button>

              <span className="text-xs text-slate-400 font-mono">
                جولات هذا الاشتباك: {battle.clashCount}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
