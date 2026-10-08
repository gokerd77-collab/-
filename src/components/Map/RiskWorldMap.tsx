import React, { useState, useRef, useMemo } from 'react';
import { TERRITORIES, CONTINENTS, TERRITORY_LOOKUP } from '../../data/riskMapData';
import { RoomState, Territory } from '../../types/game';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair, ShieldAlert } from 'lucide-react';

interface RiskWorldMapProps {
  room: RoomState;
  selectedTerritoryId: string | null;
  targetTerritoryId: string | null;
  onTerritoryClick: (territory: Territory) => void;
  hoveredTerritoryId?: string | null;
  onTerritoryHover?: (territory: Territory | null) => void;
}

export const RiskWorldMap: React.FC<RiskWorldMapProps> = ({
  room,
  selectedTerritoryId,
  targetTerritoryId,
  onTerritoryClick,
  onTerritoryHover
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Teams map lookup for fast color extraction
  const teamsMap = useMemo(() => {
    const map = new Map<string, { color: string; nameAr: string }>();
    room.teams.forEach((t) => map.set(t.id, { color: t.color, nameAr: t.nameAr }));
    return map;
  }, [room.teams]);

  // Handle Pan Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click for pan
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(2.2, z + 0.2));
  const handleZoomOut = () => setZoom((z) => Math.max(0.7, z - 0.2));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Deduplicate connection lines for rendering
  const connectionLines = useMemo(() => {
    const lines: { key: string; from: Territory; to: Territory; isSea: boolean; isPacific?: boolean }[] = [];
    const seen = new Set<string>();

    TERRITORIES.forEach((t1) => {
      t1.neighbors.forEach((nId) => {
        const t2 = TERRITORY_LOOKUP.get(nId);
        if (!t2) return;

        const pairKey = [t1.id, t2.id].sort().join('--');
        if (seen.has(pairKey)) return;
        seen.add(pairKey);

        const isSea = t1.continentId !== t2.continentId;
        const isPacific =
          (t1.id === 'alaska' && t2.id === 'kamchatka') ||
          (t1.id === 'kamchatka' && t2.id === 'alaska');

        lines.push({ key: pairKey, from: t1, to: t2, isSea, isPacific });
      });
    });

    return lines;
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[560px] bg-[#070B14] rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl select-none flex items-center justify-center cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background Strategic Tactical Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(30, 58, 138, 0.15) 0%, transparent 80%),
            linear-gradient(to right, rgba(51, 65, 85, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(51, 65, 85, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 40px 40px, 40px 40px'
        }}
      />

      {/* Continents Strategic HUD Header Badges */}
      <div className="absolute top-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between pointer-events-none gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {Object.values(CONTINENTS).map((continent) => {
            // Check if any team currently holds this continent
            const holdingTeam = room.teams.find((tm) =>
              continent.territoryIds.every(
                (tid) => room.territories[tid]?.teamId === tm.id
              )
            );

            return (
              <div
                key={continent.id}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-md text-xs font-semibold shadow-md pointer-events-auto"
                style={{
                  borderLeftColor: continent.color,
                  borderLeftWidth: '3px'
                }}
              >
                <span className="text-slate-300">{continent.nameAr}</span>
                <span
                  className="font-mono px-1 py-0.2 rounded text-[10px] font-bold"
                  style={{
                    backgroundColor: `${continent.color}25`,
                    color: continent.color
                  }}
                >
                  +{continent.bonus}
                </span>
                {holdingTeam && (
                  <span
                    className="w-2 h-2 rounded-full animate-ping"
                    style={{ backgroundColor: holdingTeam.color }}
                    title={`تحت سيطرة: ${holdingTeam.nameAr}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Zoom & Pan Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700/60 pointer-events-auto shadow-lg">
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="تكبير الخريطة"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="تصغير الخريطة"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="إعادة التوسيط"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tactical Canvas SVG */}
      <div
        className="w-[1020px] h-[680px] shrink-0 transition-transform duration-75 ease-out relative"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center'
        }}
      >
        <svg
          viewBox="0 0 1020 680"
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Glow filters for attacker and conquered */}
            <filter id="glow-attack" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-target" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feColorMatrix
                type="matrix"
                values="1 0 0 0 0  0 0.2 0 0 0  0 0 0.2 0 0  0 0 0 1 0"
              />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Continent Zones Soft Radial Gradients */}
            {Object.values(CONTINENTS).map((c) => (
              <radialGradient key={`grad-${c.id}`} id={`grad-${c.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={c.color} stopOpacity="0.12" />
                <stop offset="100%" stopColor={c.color} stopOpacity="0.0" />
              </radialGradient>
            ))}
          </defs>

          {/* Continent Ambient Backdrop Regions */}
          <g className="continent-backdrops">
            {/* North America */}
            <ellipse cx="210" cy="200" rx="160" ry="140" fill="url(#grad-north_america)" />
            {/* South America */}
            <ellipse cx="290" cy="500" rx="90" ry="130" fill="url(#grad-south_america)" />
            {/* Europe */}
            <ellipse cx="500" cy="200" rx="130" ry="100" fill="url(#grad-europe)" />
            {/* Africa */}
            <ellipse cx="550" cy="460" rx="120" ry="140" fill="url(#grad-africa)" />
            {/* Asia */}
            <ellipse cx="790" cy="220" rx="180" ry="160" fill="url(#grad-asia)" />
            {/* Australia */}
            <ellipse cx="880" cy="510" rx="100" ry="90" fill="url(#grad-australia)" />
          </g>

          {/* Inter-Territory Adjacency Routes */}
          <g className="routes opacity-75">
            {connectionLines.map((line) => {
              if (line.isPacific) {
                // Pacific Wrap: Alaska to left edge, Kamchatka to right edge
                return (
                  <g key={line.key}>
                    <line
                      x1={line.from.x}
                      y1={line.from.y}
                      x2={0}
                      y2={line.from.y}
                      stroke="#38BDF8"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                    <line
                      x1={line.to.x}
                      y1={line.to.y}
                      x2={1020}
                      y2={line.to.y}
                      stroke="#38BDF8"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  </g>
                );
              }

              const isHighlighted =
                (selectedTerritoryId === line.from.id && targetTerritoryId === line.to.id) ||
                (selectedTerritoryId === line.to.id && targetTerritoryId === line.from.id);

              return (
                <line
                  key={line.key}
                  x1={line.from.x}
                  y1={line.from.y}
                  x2={line.to.x}
                  y2={line.to.y}
                  stroke={
                    isHighlighted
                      ? '#F43F5E'
                      : line.isSea
                      ? '#38BDF8'
                      : '#334155'
                  }
                  strokeWidth={isHighlighted ? '3.5' : line.isSea ? '2' : '1.5'}
                  strokeDasharray={line.isSea ? '4 3' : 'none'}
                  strokeOpacity={isHighlighted ? 1 : line.isSea ? 0.6 : 0.45}
                  className={isHighlighted ? 'animate-pulse' : ''}
                />
              );
            })}
          </g>

          {/* Territory Nodes and Markers */}
          <g className="territories">
            {TERRITORIES.map((territory) => {
              const state = room.territories[territory.id] || { troops: 3, teamId: 'team_lions' };
              const team = teamsMap.get(state.teamId) || { color: '#64748B', nameAr: 'محايد' };
              const isSelected = selectedTerritoryId === territory.id;
              const isTarget = targetTerritoryId === territory.id;
              const isUnderAttack = room.battle?.defenderTerritoryId === territory.id;
              const isAttacking = room.battle?.attackerTerritoryId === territory.id;

              return (
                <g
                  key={territory.id}
                  className="cursor-pointer group"
                  transform={`translate(${territory.x}, ${territory.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTerritoryClick(territory);
                  }}
                  onMouseEnter={() => onTerritoryHover && onTerritoryHover(territory)}
                  onMouseLeave={() => onTerritoryHover && onTerritoryHover(null)}
                >
                  {/* Active selection pulse ring */}
                  {(isSelected || isAttacking) && (
                    <circle
                      r="32"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2.5"
                      strokeDasharray="5 3"
                      className="animate-spin"
                      style={{ animationDuration: '8s' }}
                    />
                  )}

                  {/* Target enemy pulse ring */}
                  {(isTarget || isUnderAttack) && (
                    <circle
                      r="34"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="3"
                      className="animate-ping"
                      style={{ animationDuration: '1.8s' }}
                    />
                  )}

                  {/* Territory Base Tactical Hex/Circle */}
                  <circle
                    r="22"
                    fill="#0F172A"
                    stroke={team.color}
                    strokeWidth={isSelected || isTarget ? '3.5' : '2.5'}
                    className="transition-all duration-200 group-hover:scale-110"
                    style={{
                      filter: isSelected
                        ? 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.75))'
                        : isTarget
                        ? 'drop-shadow(0 0 14px rgba(239, 68, 68, 0.85))'
                        : `drop-shadow(0 0 6px ${team.color}40)`
                    }}
                  />

                  {/* Inner team fill disc */}
                  <circle
                    r="18"
                    fill={team.color}
                    fillOpacity="0.25"
                    className="transition-opacity group-hover:fill-opacity-40"
                  />

                  {/* Troop Count Display (Bold, tabular-nums) */}
                  <text
                    y="5"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="13"
                    fontWeight="800"
                    className="font-mono tracking-tight pointer-events-none drop-shadow-md select-none"
                  >
                    {state.troops}
                  </text>

                  {/* Attack / Under Attack Tactical Icon Badge */}
                  {isAttacking && (
                    <g transform="translate(14, -18)">
                      <circle r="9" fill="#F59E0B" />
                      <Crosshair className="w-3.5 h-3.5 text-black -translate-x-[7px] -translate-y-[7px]" />
                    </g>
                  )}
                  {isUnderAttack && (
                    <g transform="translate(14, -18)">
                      <circle r="9" fill="#EF4444" />
                      <ShieldAlert className="w-3.5 h-3.5 text-white -translate-x-[7px] -translate-y-[7px]" />
                    </g>
                  )}

                  {/* Territory Arabic Label Tag underneath */}
                  <g transform="translate(0, 32)" className="pointer-events-none select-none">
                    <rect
                      x="-55"
                      y="-10"
                      width="110"
                      height="18"
                      rx="4"
                      fill="#090E17"
                      fillOpacity="0.88"
                      stroke="#334155"
                      strokeWidth="1"
                    />
                    <text
                      y="2"
                      textAnchor="middle"
                      fill="#E2E8F0"
                      fontSize="9.5"
                      fontWeight="600"
                      className="font-sans"
                    >
                      {territory.nameAr}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Floating Tactical Helper Legend in Bottom Left */}
      <div className="absolute bottom-3 left-4 z-20 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-[11px] text-slate-300 pointer-events-none shadow-md">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />
          <span>المنطقة المحددة</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white" />
          <span>الهدف المعادي</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t border-dashed border-sky-400" />
          <span>خط بحري</span>
        </div>
      </div>
    </div>
  );
};
