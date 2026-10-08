import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RoomState } from '../../types/game';
import { soundManager } from '../../utils/audio';
import { Trophy, RotateCcw, Swords, Shield, Skull, Clock, MapPin } from 'lucide-react';

interface VictoryScreenProps {
  room: RoomState;
  onRestartGame: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ room, onRestartGame }) => {
  const winnerTeam = room.teams.find((t) => t.id === room.winnerTeamId);

  useEffect(() => {
    soundManager.playVictoryCeremony();

    // Trigger fireworks confetti
    const duration = 4 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const durationMin = Math.round(
    ((room.stats.endTime || Date.now()) - room.stats.startTime) / 60000
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fadeIn select-none">
      <div className="w-full max-w-2xl bg-[#090E17] border-2 border-amber-500/70 rounded-3xl p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
        {/* Glow backdrop */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: winnerTeam?.color || '#F59E0B' }}
        />

        <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-amber-400 mx-auto shadow-2xl shadow-amber-500/30 animate-bounce">
          <Trophy className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
            SUPREME WORLD DOMINATION
          </span>
          <h1 className="text-4xl font-extrabold text-white mt-1">
            {winnerTeam?.nameAr}
          </h1>
          <h2 className="text-xl font-bold text-amber-400 tracking-wide mt-1">
            HAS CONQUERED THE WORLD!
          </h2>
          <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto">
            بسطت المجموعة نفوذها العسكري التام على كافة القارات والـ 42 إقليمًا حول كوكب الأرض!
          </p>
        </div>

        {/* Game Stats Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>مدة الحرب</span>
            </div>
            <strong className="text-lg font-mono text-white">{durationMin} دقيقة</strong>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
              <Swords className="w-3.5 h-3.5" />
              <span>إجمالي المعارك</span>
            </div>
            <strong className="text-lg font-mono text-amber-400">{room.stats.totalBattles}</strong>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>المناطق المحتلة</span>
            </div>
            <strong className="text-lg font-mono text-emerald-400">42 / 42</strong>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
              <Skull className="w-3.5 h-3.5" />
              <span>الأدوار المستغرقة</span>
            </div>
            <strong className="text-lg font-mono text-sky-400">{room.stats.totalTurns}</strong>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onRestartGame}
            className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-base rounded-2xl shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto"
          >
            <RotateCcw className="w-5 h-5" />
            بدء حرب عالمية جديدة (RESTART GAME)
          </button>
        </div>
      </div>
    </div>
  );
};
