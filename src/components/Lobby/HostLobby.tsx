import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RoomState } from '../../types/game';
import { soundManager } from '../../utils/audio';
import {
  Users,
  Play,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Shield,
  Crown,
  Sparkles,
  QrCode
} from 'lucide-react';

interface HostLobbyProps {
  room: RoomState;
  onStartGame: () => void;
  onUpdateTeams?: (teams: any[]) => void;
}

export const HostLobby: React.FC<HostLobbyProps> = ({ room, onStartGame }) => {
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [showQrModal, setShowQrModal] = useState(false);

  // Generate join URL
  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?join=${room.roomCode}`
    : `https://game.app?join=${room.roomCode}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans">
      {/* Top Strategic Bar */}
      <header className="px-8 py-5 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-extrabold shadow-lg shadow-amber-500/20">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-wide text-white font-['Cinzel',sans-serif]">
              SOVEREIGN : GLOBAL CONQUEST
            </h1>
            <p className="text-xs text-slate-400">منظومة الإشراف الاستراتيجي — شاشة المضيف الرئيسية</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleToggleMute}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title={isMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Main Lobby Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Room Code & QR Scan Station */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>دخول سريع وفوري بدون تسجيل حساب</span>
            </div>

            <div>
              <span className="text-xs font-mono uppercase text-slate-400 tracking-widest block">
                ROOM CODE / كود الغرفة
              </span>
              <div className="text-5xl font-extrabold font-mono text-amber-400 tracking-wider my-2">
                {room.roomCode}
              </div>
              <p className="text-xs text-slate-400">
                امسح الرمز بالجوال للانضمام واختيار مجموعتك
              </p>
            </div>

            {/* QR Code Container */}
            <div className="p-4 bg-white rounded-2xl w-fit mx-auto shadow-xl border-4 border-slate-800">
              <QRCodeSVG
                value={joinUrl}
                size={210}
                level="M"
                includeMargin={false}
              />
            </div>

            {/* Direct Join Link Box */}
            <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-right">
              <span className="text-xs text-slate-300 truncate flex-1 font-mono text-left px-2" dir="ltr">
                {joinUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Teams & Joined Players Roster */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">المجموعات واللاعبون المنضمون</h2>
              <p className="text-xs text-slate-400">
                إجمالي اللاعبين المتصلين: {room.players.length} مقاتل
              </p>
            </div>

            <button
              onClick={() => {
                soundManager.playAttackHorn();
                onStartGame();
              }}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-base shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-3"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              بدء معركة السيطرة الكبرى (START GAME)
            </button>
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {room.teams.map((team, idx) => {
              const teamPlayers = room.players.filter((p) => p.teamId === team.id);

              return (
                <div
                  key={team.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 space-y-3 transition-all hover:border-slate-700"
                  style={{ borderRightWidth: '4px', borderRightColor: team.color }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shadow-md"
                        style={{ backgroundColor: team.color }}
                      >
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{team.nameAr}</h3>
                        <span className="text-[11px] text-slate-400">المجموعة #{idx + 1}</span>
                      </div>
                    </div>

                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {teamPlayers.length} أعضاء
                    </span>
                  </div>

                  {/* Players in this group */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/60 min-h-[60px]">
                    {teamPlayers.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {teamPlayers.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-slate-200 border border-slate-700/60"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                p.isOnline ? 'bg-emerald-400' : 'bg-rose-500'
                              }`}
                            />
                            {p.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 py-2 text-right">
                        بانتظار انضمام مقاتلين من الجوال إلى هذه المجموعة...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Host Rules Brief */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 leading-relaxed text-right">
            <strong className="text-white block mb-1">تعليمات المضيف:</strong>
            المضيف هو صاحب الإشراف الكامل على طرح الأسئلة شفهياً والتحكيم وحسابات التعزيزات ونقل الجيوش على الخريطة الكبرى.
            يستطيع المضيف بدء اللعبة فور اكتمال اللاعبين.
          </div>
        </div>
      </main>
    </div>
  );
};
