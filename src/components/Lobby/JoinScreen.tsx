import React, { useState } from 'react';
import { RoomState } from '../../types/game';
import { Shield, User, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface JoinScreenProps {
  room: RoomState;
  onJoin: (name: string, teamId: string) => void;
  isLoading?: boolean;
}

export const JoinScreen: React.FC<JoinScreenProps> = ({ room, onJoin, isLoading }) => {
  const [name, setName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(room.teams[0]?.id || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى كتابة اسمك أولاً');
      return;
    }
    if (!selectedTeamId) {
      setError('يرجى اختيار المجموعة التي تنتمي إليها');
      return;
    }
    setError(null);
    onJoin(name.trim(), selectedTeamId);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-center items-center p-4 font-sans select-none">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-lg">
            <Shield className="w-7 h-7" />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
            JOIN BATTLE · غرفة {room.roomCode}
          </span>
          <h1 className="text-2xl font-extrabold text-white">
            انضم إلى صراع القلاع
          </h1>
          <p className="text-xs text-slate-400">
            أدخل اسمك واختر قلعتك للمشاركة (الأسود، الذئاب، أو الصقور)
          </p>
        </div>

        {/* Join Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl text-center">
              {error}
            </div>
          )}

          {/* Name Input */}
          <div className="space-y-1.5 text-right">
            <label className="text-xs font-semibold text-slate-300 block">
              اسمك / لقبك القتالي:
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: القائد صقر"
                maxLength={20}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 text-sm"
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* Group / Team Selection */}
          <div className="space-y-2 text-right">
            <label className="text-xs font-semibold text-slate-300 block">
              اختر قلعتك وانضم لصفوفها:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {room.teams.map((team) => {
                const isSelected = selectedTeamId === team.id;
                const membersCount = room.players.filter((p) => p.teamId === team.id).length;

                return (
                  <button
                    type="button"
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between min-h-[70px] ${
                      isSelected
                        ? 'bg-slate-800 border-amber-400 shadow-lg shadow-amber-950/20 ring-1 ring-amber-400'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full shadow-sm"
                          style={{ backgroundColor: team.color }}
                        />
                        <strong className="text-xs text-white">{team.nameAr}</strong>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-2">
                      {membersCount} منضمين
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[48px] py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isLoading ? 'جاري الانضمام...' : 'تأكيد الانضمام والدخول'}</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-500">
          لا يلزم إنشاء حساب · دخول سريع مناسب للشباب والفعاليات
        </div>
      </div>
    </div>
  );
};
