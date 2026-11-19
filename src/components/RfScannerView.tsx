import React, { useState, useEffect, useMemo } from 'react';
import {
  RfScanBand,
  RfScanPoint,
  ToiIntermodProduct,
  TransmitterRF,
} from '../types/recorder';
import { RfCoordinationService } from '../services/RfCoordinationService';
import {
  Activity,
  Play,
  Square,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Sliders,
  Radio,
  Zap,
  Info,
  ChevronDown,
  RefreshCw,
  Check,
} from 'lucide-react';

interface RfScannerViewProps {
  transmitters: TransmitterRF[];
  onUpdateTransmitterFrequency: (txId: string, freqMhz: number) => void;
  supportsZaxNet?: boolean;
}

export const RfScannerView: React.FC<RfScannerViewProps> = ({
  transmitters,
  onUpdateTransmitterFrequency,
  supportsZaxNet = false,
}) => {
  const bands = RfCoordinationService.defaultBands;
  const [selectedBand, setSelectedBand] = useState<RfScanBand>(bands[0]);
  const [thresholdDbm, setThresholdDbm] = useState<number>(-85);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(100);
  const [hoveredPoint, setHoveredPoint] = useState<RfScanPoint | null>(null);

  // Suggested clean frequencies
  const [suggestedPlan, setSuggestedPlan] = useState<
    { txId: string; currentFreq: number; suggestedFreq: number; reason: string }[] | null
  >(null);

  // Scan points state
  const [scanPoints, setScanPoints] = useState<RfScanPoint[]>(() =>
    RfCoordinationService.generateScanSpectrum(bands[0], transmitters, thresholdDbm)
  );

  // Calculate live TOI products
  const toiProducts = useMemo(() => {
    return RfCoordinationService.calculateToiProducts(transmitters);
  }, [transmitters]);

  // Critical and warning collisions count
  const criticalToiCollisions = useMemo(() => {
    return toiProducts.filter((p) => p.severity === 'CRITICAL_COLLISION');
  }, [toiProducts]);

  const warningToiCollisions = useMemo(() => {
    return toiProducts.filter((p) => p.severity === 'WARNING_NEARBY');
  }, [toiProducts]);

  // Handle Scan Sweep animation
  const handleStartScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setSuggestedPlan(null);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setScanProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setIsScanning(false);
        setScanPoints(
          RfCoordinationService.generateScanSpectrum(selectedBand, transmitters, thresholdDbm)
        );
      }
    }, 60);
  };

  // Re-run scan when band or threshold changes
  useEffect(() => {
    setScanPoints(
      RfCoordinationService.generateScanSpectrum(selectedBand, transmitters, thresholdDbm)
    );
  }, [selectedBand, thresholdDbm, transmitters]);

  // Auto-coordination solver
  const handleAutoCoordinate = () => {
    const plan = RfCoordinationService.calculateCleanFrequencies(
      transmitters,
      scanPoints,
      selectedBand,
      thresholdDbm
    );
    setSuggestedPlan(plan);
  };

  // Apply suggested frequencies to all transmitters
  const handleApplyCleanPlan = () => {
    if (!suggestedPlan) return;
    suggestedPlan.forEach((item) => {
      onUpdateTransmitterFrequency(item.txId, item.suggestedFreq);
    });
    setSuggestedPlan(null);
  };

  // Chart dimensions & scaling
  const chartWidth = 900;
  const chartHeight = 240;
  const minFreq = selectedBand.startMhz;
  const maxFreq = selectedBand.endMhz;
  const minDbm = -110;
  const maxDbm = -35;

  const getX = (freq: number) => {
    return ((freq - minFreq) / (maxFreq - minFreq)) * chartWidth;
  };

  const getY = (dbm: number) => {
    return chartHeight - ((dbm - minDbm) / (maxDbm - minDbm)) * chartHeight;
  };

  // Build SVG path for RF spectrum curve
  const spectrumPath = useMemo(() => {
    if (scanPoints.length === 0) return '';
    return scanPoints
      .map((p, i) => {
        const x = getX(p.frequencyMhz);
        const y = getY(p.rssiDbm);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [scanPoints, selectedBand]);

  // Build area fill path
  const areaPath = useMemo(() => {
    if (scanPoints.length === 0) return '';
    const firstX = getX(scanPoints[0].frequencyMhz);
    const lastX = getX(scanPoints[scanPoints.length - 1].frequencyMhz);
    const bottomY = getY(minDbm);
    return `${spectrumPath} L ${lastX.toFixed(1)} ${bottomY} L ${firstX.toFixed(1)} ${bottomY} Z`;
  }, [spectrumPath, scanPoints]);

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-950 text-slate-100 rounded-xl border border-slate-800">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="font-mono-broadcast text-sm font-bold text-white tracking-wide">
              RF SPECTRUM SCANNER & TOI INTERMODULATION DETECTOR
            </h2>
            <span className="text-[10px] font-mono-broadcast text-slate-400">
              Third-Order Intermod (2f₁ - f₂ / f₁ + f₂ - f₃) · DTV Broadcast Interference
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Band Selector */}
          <select
            value={selectedBand.id}
            onChange={(e) => {
              const b = bands.find((x) => x.id === e.target.value);
              if (b) setSelectedBand(b);
            }}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-xs font-mono-broadcast text-white rounded-lg focus:outline-none"
          >
            {bands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Sweep Scan Button */}
          <button
            type="button"
            onClick={handleStartScan}
            disabled={isScanning}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono-broadcast font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 transition-colors"
          >
            {isScanning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isScanning ? `Sweeping ${scanProgress}%` : 'SWEEP SCAN'}</span>
          </button>

          {/* Auto-Coordinate Button */}
          <button
            type="button"
            onClick={handleAutoCoordinate}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono-broadcast font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
            title="Auto-solve intermod-free frequencies avoiding TOI collisions"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AUTO-COORDINATE</span>
          </button>
        </div>
      </div>

      {/* TOI Collision Alert Banner */}
      {criticalToiCollisions.length > 0 && (
        <div className="p-3 bg-rose-950/70 border border-rose-600 rounded-xl flex items-start justify-between gap-3 text-rose-200 font-mono-broadcast text-xs animate-pulse">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block text-sm">
                CRITICAL TOI INTERMODULATION DETECTED ({criticalToiCollisions.length} Collisions)
              </strong>
              <p className="text-[11px] text-rose-300 mt-0.5">
                Third-order products ({criticalToiCollisions.map((c) => c.formula).join(', ')}) collide directly
                with microphone frequencies! High risk of sudden RF dropouts and digital squeal.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAutoCoordinate}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs shrink-0 cursor-pointer shadow-md"
          >
            Fix Frequencies
          </button>
        </div>
      )}

      {/* Main Interactive Spectrum Canvas / SVG */}
      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col gap-2 overflow-hidden">
        {/* Spectrum Top Status */}
        <div className="african-inactive-panel-header -mx-3 -mt-3 px-3 py-2 flex flex-wrap items-center justify-between text-[11px] font-mono-broadcast text-slate-300">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-cyan-400 rounded-xs" />
              RF Spectrum Curve
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
              Active Transmitters ({transmitters.length})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-xs" />
              TOI Intermod Risk Points
            </span>
          </div>

          {/* Squelch Slider */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">Threshold:</span>
            <span className="text-amber-400 font-bold">{thresholdDbm} dBm</span>
            <input
              type="range"
              min="-100"
              max="-65"
              step="1"
              value={thresholdDbm}
              onChange={(e) => setThresholdDbm(parseInt(e.target.value))}
              className="w-24 accent-amber-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Sweep Progress Bar */}
        {isScanning && (
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-75"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        )}

        {/* The Spectrum SVG Chart */}
        <div className="relative w-full overflow-hidden bg-slate-950 rounded-lg border border-slate-800 py-1">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-56 select-none"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="spectrumGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid lines (dBm horizontal) */}
            {[-40, -60, -80, -100].map((db) => {
              const y = getY(db);
              return (
                <g key={db}>
                  <line
                    x1="0"
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x="8"
                    y={y - 4}
                    fill="#475569"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {db} dBm
                  </text>
                </g>
              );
            })}

            {/* Squelch / Threshold Line */}
            <line
              x1="0"
              y1={getY(thresholdDbm)}
              x2={chartWidth}
              y2={getY(thresholdDbm)}
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="6 3"
            />

            {/* Spectrum Area Fill */}
            <path d={areaPath} fill="url(#spectrumGradient)" />

            {/* Spectrum Line */}
            <path
              d={spectrumPath}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.75"
              strokeLinecap="round"
            />

            {/* TOI Intermod Risk Highlight Regions */}
            {toiProducts.map((p) => {
              if (p.freqMhz < minFreq || p.freqMhz > maxFreq) return null;
              const x = getX(p.freqMhz);
              const isCrit = p.severity === 'CRITICAL_COLLISION';
              const isWarn = p.severity === 'WARNING_NEARBY';

              if (!isCrit && !isWarn) return null;

              return (
                <g key={p.id}>
                  {/* Vertical risk line */}
                  <line
                    x1={x}
                    y1="0"
                    x2={x}
                    y2={chartHeight}
                    stroke={isCrit ? '#ef4444' : '#f59e0b'}
                    strokeWidth={isCrit ? '2' : '1'}
                    strokeDasharray="2 2"
                  />
                  {/* Warning Flag */}
                  <circle
                    cx={x}
                    cy={isCrit ? 22 : 36}
                    r={isCrit ? 6 : 4}
                    fill={isCrit ? '#dc2626' : '#d97706'}
                    className={isCrit ? 'animate-pulse' : ''}
                  />
                </g>
              );
            })}

            {/* Active Transmitter Marker Flags */}
            {transmitters.map((tx, idx) => {
              if (tx.frequencyMhz < minFreq || tx.frequencyMhz > maxFreq) return null;
              const x = getX(tx.frequencyMhz);
              const txPoint = scanPoints.find((p) => Math.abs(p.frequencyMhz - tx.frequencyMhz) < 0.2);
              const currentY = txPoint ? getY(txPoint.rssiDbm) : getY(-45);

              // Check if collided with TOI
              const isHitByToi = criticalToiCollisions.some((c) => c.affectedTxId === tx.id);

              return (
                <g key={tx.id}>
                  {/* Carrier Pin line */}
                  <line
                    x1={x}
                    y1={currentY}
                    x2={x}
                    y2={chartHeight}
                    stroke={isHitByToi ? '#ef4444' : '#3b82f6'}
                    strokeWidth="2"
                  />

                  {/* Top Flag Banner */}
                  <circle
                    cx={x}
                    cy={currentY}
                    r="5"
                    fill={isHitByToi ? '#ef4444' : '#3b82f6'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <rect
                    x={x - 30}
                    y={Math.max(10, currentY - 26)}
                    width="60"
                    height="16"
                    rx="3"
                    fill={isHitByToi ? '#991b1b' : '#1e3a8a'}
                    stroke={isHitByToi ? '#f87171' : '#60a5fa'}
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={Math.max(10, currentY - 26) + 11}
                    fill="#ffffff"
                    fontSize="8"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {tx.actor} ({tx.frequencyMhz.toFixed(2)})
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Frequency Scale along Bottom */}
          <div className="flex justify-between px-2 pt-1 text-[9px] font-mono-broadcast text-slate-400 border-t border-slate-800">
            <span>{selectedBand.startMhz.toFixed(1)} MHz</span>
            <span>{((selectedBand.startMhz + selectedBand.endMhz) / 2).toFixed(1)} MHz</span>
            <span>{selectedBand.endMhz.toFixed(1)} MHz</span>
          </div>
        </div>
      </div>

      {/* Suggested Clean Frequency Plan Modal / Box */}
      {suggestedPlan && (
        <div className="p-4 bg-blue-950/60 border border-blue-500 rounded-xl flex flex-col gap-3 font-mono-broadcast">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h3 className="text-sm font-bold text-white">
                RECOMMENDED INTERMOD-FREE FREQUENCY PLAN
              </h3>
            </div>
            <button
              type="button"
              onClick={handleApplyCleanPlan}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>DEPLOY FREQUENCIES TO TRANSMITTERS</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {suggestedPlan.map((item) => {
              const tx = transmitters.find((t) => t.id === item.txId);
              const changed = item.currentFreq !== item.suggestedFreq;

              return (
                <div
                  key={item.txId}
                  className={`p-2.5 rounded-lg border text-xs ${
                    changed
                      ? 'bg-blue-900/60 border-amber-400'
                      : 'bg-slate-900 border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">{tx?.actor}</span>
                    <span className="text-[10px] text-slate-400">{tx?.name}</span>
                  </div>

                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-400 line-through">
                      {item.currentFreq.toFixed(2)} MHz
                    </span>
                    <span className="text-sm font-black text-amber-300">
                      → {item.suggestedFreq.toFixed(2)} MHz
                    </span>
                  </div>

                  <span className="text-[9px] text-slate-300 block mt-1">
                    {item.reason}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TOI Intermodulation Diagnostic Matrix */}
      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col gap-2.5 overflow-hidden">
        <div className="african-inactive-panel-header -mx-3 -mt-3 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" />
            <h3 className="font-mono-broadcast text-xs font-bold text-white uppercase tracking-wider">
              TOI INTERMODULATION PRODUCTS & COLLISION MATRIX
            </h3>
          </div>
          <span className="text-[10px] font-mono-broadcast text-slate-400">
            {toiProducts.length} Intermod Products Analyzed
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left border-collapse text-xs font-mono-broadcast">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400">
                <th className="py-2 px-3">STATUS</th>
                <th className="py-2 px-3">INTERMOD FREQ</th>
                <th className="py-2 px-3">FORMULA</th>
                <th className="py-2 px-3">SOURCE TRANSMITTERS</th>
                <th className="py-2 px-3">TARGET COLLISION</th>
                <th className="py-2 px-3">DELTA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {toiProducts.map((p) => {
                const isCrit = p.severity === 'CRITICAL_COLLISION';
                const isWarn = p.severity === 'WARNING_NEARBY';

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-850/60 transition-colors ${
                      isCrit
                        ? 'bg-rose-950/40 text-rose-200'
                        : isWarn
                        ? 'bg-amber-950/30 text-amber-200'
                        : 'text-slate-300'
                    }`}
                  >
                    <td className="py-2 px-3">
                      {isCrit ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-black text-[9px]">
                          COLLISION
                        </span>
                      ) : isWarn ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-600 text-slate-950 font-black text-[9px]">
                          WARNING
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[9px]">SAFE</span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-bold">
                      {p.freqMhz.toFixed(3)} MHz
                    </td>
                    <td className="py-2 px-3 text-[10px] text-slate-300">
                      {p.formula}
                    </td>
                    <td className="py-2 px-3 text-[10px] text-slate-400">
                      {p.sourceTxNames.join(' + ')}
                    </td>
                    <td className="py-2 px-3 font-bold text-white">
                      {p.affectedTxName || <span className="text-slate-400 font-normal">None</span>}
                    </td>
                    <td className="py-2 px-3 text-slate-400">
                      {p.deltaKhz !== undefined ? `${p.deltaKhz} kHz` : '-'}
                    </td>
                  </tr>
                );
              })}

              {toiProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    Need at least 2 active transmitters to calculate Third-Order Intermod (TOI).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
