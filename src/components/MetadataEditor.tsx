import React, { useState } from 'react';
import { AudioChannel } from '../types/recorder';
import { FileText, Plus, Minus, BookmarkCheck, Sparkles, Check } from 'lucide-react';

interface MetadataEditorProps {
  scene: string;
  take: number;
  takeSuffix: string;
  roll: string;
  notes: string;
  channels: AudioChannel[];
  onUpdateScene: (scene: string) => void;
  onUpdateTake: (take: number) => void;
  onUpdateTakeSuffix: (suffix: string) => void;
  onUpdateRoll: (roll: string) => void;
  onUpdateNotes: (notes: string) => void;
  onApplyPreset: (presetNames: string[]) => void;
}

export const MetadataEditor: React.FC<MetadataEditorProps> = ({
  scene,
  take,
  takeSuffix,
  roll,
  notes,
  channels,
  onUpdateScene,
  onUpdateTake,
  onUpdateTakeSuffix,
  onUpdateRoll,
  onUpdateNotes,
  onApplyPreset,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('FEATURE');

  const presetTemplates: Record<string, { label: string; tracks: string[] }> = {
    FEATURE: {
      label: 'Feature Cinema (8-ch)',
      tracks: [
        'BOOM 1',
        'LAV 1 - LEAD A',
        'LAV 2 - LEAD B',
        'LAV 3 - SUPPORT',
        'PLANT CAR',
        'BOOM 2 WIDE',
        'AMBIENCE L',
        'AMBIENCE R',
      ],
    },
    DOCUMENTARY: {
      label: 'Documentary Bag (4-ch)',
      tracks: [
        'BOOM 1 SCHOEPS',
        'LAV 1 SUBJECT',
        'LAV 2 JOURNALIST',
        'STEREO AMBIENCE',
      ],
    },
    MULTI_LAV: {
      label: 'Ensemble Dialog (8-ch)',
      tracks: [
        'BOOM 1',
        'LAV 1 - ALICE',
        'LAV 2 - BOB',
        'LAV 3 - CHARLIE',
        'LAV 4 - DAVID',
        'LAV 5 - EMMA',
        'PLANT TABLE',
        'SPARE 8',
      ],
    },
  };

  const commonNotes = [
    'Room Tone',
    'Wildtrack',
    'Aborted Take',
    'Dialog Overlap',
    'Boom in Frame',
    'Plane Overhead',
    'Good Dialog ⭐',
    'Re-slate at End',
  ];

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-950 text-slate-100 rounded-xl border border-slate-800">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <h2 className="font-mono-broadcast text-sm font-bold text-white tracking-wide">
            iXML METADATA & SOUND CART PRESETS
          </h2>
        </div>
        <span className="text-[10px] font-mono-broadcast text-slate-400">
          Syncs to Sound Devices / Aaton Madeline / Zoom / Zaxcom
        </span>
      </div>

      {/* Grid: Scene / Take / Roll Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* SCENE CARD */}
        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex flex-col gap-2 overflow-hidden">
          <div className="african-inactive-panel-header -mx-3 -mt-3 px-3 py-1.5 flex items-center justify-between">
            <span className="text-[10px] font-mono-broadcast text-slate-300 uppercase font-bold tracking-wider">
              SCENE IDENTIFIER
            </span>
            <span className="text-[8px] font-mono-broadcast text-amber-500/80">iXML #01</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={scene}
              onChange={(e) => onUpdateScene(e.target.value)}
              placeholder="e.g. 12 or EXT-4A"
              className="w-full px-3 py-2 text-base font-bold bg-slate-950 text-white rounded-lg border border-slate-700 font-mono-broadcast focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1">
            {['1', '12', '12A', '12B', 'EXT-4'].map((sc) => (
              <button
                key={sc}
                type="button"
                onClick={() => onUpdateScene(sc)}
                className={`px-2 py-0.5 text-[9px] font-mono-broadcast rounded border cursor-pointer ${
                  scene === sc
                    ? 'bg-amber-600 text-white border-amber-400 font-bold'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {sc}
              </button>
            ))}
          </div>
        </div>

        {/* TAKE CARD with Smart Auto-Increment */}
        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex flex-col gap-2 overflow-hidden">
          <div className="african-inactive-panel-header -mx-3 -mt-3 px-3 py-1.5 flex items-center justify-between">
            <span className="text-[10px] font-mono-broadcast text-slate-300 uppercase font-bold tracking-wider">
              TAKE NUMBER & SUFFIX
            </span>
            <span className="text-[8px] font-mono-broadcast text-amber-500/80">AUTO-INC</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onUpdateTake(Math.max(1, take - 1))}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 cursor-pointer"
              title="Decrement Take"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              min="1"
              value={take}
              onChange={(e) => onUpdateTake(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 text-center py-2 text-base font-bold bg-slate-950 text-emerald-400 rounded-lg border border-slate-700 font-mono-broadcast focus:border-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onUpdateTake(take + 1)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 cursor-pointer"
              title="Increment Take"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Suffix selector */}
            <select
              value={takeSuffix}
              onChange={(e) => onUpdateTakeSuffix(e.target.value)}
              className="px-2 py-2 text-xs bg-slate-950 text-white rounded-lg border border-slate-700 font-mono-broadcast focus:outline-none"
            >
              <option value="">No Suffix</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="WT">WT (Wildtrack)</option>
              <option value="RT">RT (Room Tone)</option>
            </select>
          </div>
        </div>

        {/* SOUND ROLL CARD */}
        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex flex-col gap-2 overflow-hidden">
          <div className="african-inactive-panel-header -mx-3 -mt-3 px-3 py-1.5 flex items-center justify-between">
            <span className="text-[10px] font-mono-broadcast text-slate-300 uppercase font-bold tracking-wider">
              SOUND ROLL
            </span>
            <span className="text-[8px] font-mono-broadcast text-amber-500/80">REEL</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={roll}
              onChange={(e) => onUpdateRoll(e.target.value)}
              placeholder="e.g. R001"
              className="w-full px-3 py-2 text-base font-bold bg-slate-950 text-amber-400 rounded-lg border border-slate-700 font-mono-broadcast focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1">
            {['R001', 'R002', 'R003'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onUpdateRoll(r)}
                className={`px-2 py-0.5 text-[9px] font-mono-broadcast rounded border cursor-pointer ${
                  roll === r
                    ? 'bg-amber-600 text-white border-amber-400 font-bold'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAKE NOTES & PRE-FILLED QUICK COMMENTS */}
      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex flex-col gap-2 overflow-hidden">
        <div className="african-inactive-panel-header -mx-3 -mt-3 px-3 py-1.5 flex items-center justify-between">
          <span className="text-[10px] font-mono-broadcast text-slate-300 uppercase font-bold tracking-wider">
            SOUND REPORT NOTES (FOR CURRENT / NEXT TAKE)
          </span>
          <span className="text-[8px] font-mono-broadcast text-amber-500/80">LOG NOTE</span>
        </div>
        <div className="pt-1">
          <input
            type="text"
            value={notes}
            onChange={(e) => onUpdateNotes(e.target.value)}
            placeholder="e.g. Actor delivered lines whispered, slight traffic background noise..."
            className="w-full px-3 py-2 text-xs bg-slate-950 text-white rounded-lg border border-slate-700 font-mono-broadcast focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Quick Tag pills for notes */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[9px] font-mono-broadcast text-slate-400 mr-1">QUICK INSERTS:</span>
          {commonNotes.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                const updated = notes ? `${notes}, ${tag}` : tag;
                onUpdateNotes(updated);
              }}
              className="px-2 py-1 text-[10px] font-mono-broadcast bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 hover:text-white transition-colors cursor-pointer"
            >
              + {tag}
            </button>
          ))}
        </div>
      </div>

      {/* TRACK NAMING PRESETS DICTIONARY */}
      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex flex-col gap-3 overflow-hidden">
        <div className="african-inactive-panel-header -mx-3 -mt-3 px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-mono-broadcast text-slate-300 uppercase font-bold tracking-wider">
              TRACK NAMING PRESETS
            </span>
          </div>
          <span className="text-[9px] font-mono-broadcast text-slate-400">
            Apply batch names to armed ISO channels
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(presetTemplates).map(([key, item]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setSelectedPreset(key);
                onApplyPreset(item.tracks);
              }}
              className={`px-3 py-1.5 text-xs font-mono-broadcast rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedPreset === key
                  ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Preview of active preset tracks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800">
          {channels.slice(0, 8).map((ch) => (
            <div
              key={ch.id}
              className="flex items-center gap-1.5 px-2 py-1 bg-slate-950 rounded border border-slate-800 text-[10px] font-mono-broadcast"
            >
              <span className="text-slate-400 font-bold">CH{ch.number}:</span>
              <span className="text-slate-200 truncate">{ch.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
