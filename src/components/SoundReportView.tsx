import React, { useState } from 'react';
import { SoundReportHeader, TakeRecord } from '../types/recorder';
import { SoundReportService } from '../services/SoundReportService';
import {
  FileSpreadsheet,
  Printer,
  Star,
  Trash2,
  Edit3,
  Check,
  Search,
  Settings,
} from 'lucide-react';

interface SoundReportViewProps {
  takes: TakeRecord[];
  onToggleCircle: (takeId: string) => void;
  onUpdateNotes: (takeId: string, notes: string) => void;
  onDeleteTake: (takeId: string) => void;
}

export const SoundReportView: React.FC<SoundReportViewProps> = ({
  takes,
  onToggleCircle,
  onUpdateNotes,
  onDeleteTake,
}) => {
  const [header, setHeader] = useState<SoundReportHeader>(SoundReportService.defaultHeader);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTakeId, setEditingTakeId] = useState<string | null>(null);
  const [editingNotesText, setEditingNotesText] = useState('');

  const filteredTakes = takes.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.scene.toLowerCase().includes(q) ||
      String(t.take).includes(q) ||
      t.notes.toLowerCase().includes(q) ||
      t.filename.toLowerCase().includes(q)
    );
  });

  const handleDownloadCsv = () => {
    SoundReportService.downloadCsv(header, takes);
  };

  const handlePrint = () => {
    SoundReportService.printSoundReport(header, takes);
  };

  const handleStartEditNote = (take: TakeRecord) => {
    setEditingTakeId(take.id);
    setEditingNotesText(take.notes);
  };

  const handleSaveNote = (takeId: string) => {
    onUpdateNotes(takeId, editingNotesText);
    setEditingTakeId(null);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-950 text-slate-100 rounded-xl border border-slate-800">
      {/* Sound Report Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="font-mono-broadcast text-sm font-bold text-white tracking-wide">
              SOUND REPORT LOGGER & EXPORT
            </h2>
            <span className="text-[10px] font-mono-broadcast text-slate-400">
              {takes.length} Takes Logged · Roll {header.soundRoll} · {header.date}
            </span>
          </div>
        </div>

        {/* Action Buttons: CSV & Print/PDF */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditingHeader(!isEditingHeader)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono-broadcast text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>HEADER</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono-broadcast font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            title="Export CSV for Avid / DaVinci / Soundminer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono-broadcast font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            title="Print or Save PDF Sound Report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT / PDF</span>
          </button>
        </div>
      </div>

      {/* Production Metadata Details Header Card */}
      {isEditingHeader ? (
        <div className="p-3 bg-slate-900 rounded-lg border border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-broadcast">
          <div>
            <label className="text-[9px] text-slate-400 block mb-1">PROJECT TITLE</label>
            <input
              type="text"
              value={header.projectTitle}
              onChange={(e) => setHeader({ ...header, projectTitle: e.target.value })}
              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white"
            />
          </div>
          <div>
            <label className="text-[9px] text-slate-400 block mb-1">SOUND RECORDIST</label>
            <input
              type="text"
              value={header.soundRecordist}
              onChange={(e) => setHeader({ ...header, soundRecordist: e.target.value })}
              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white"
            />
          </div>
          <div>
            <label className="text-[9px] text-slate-400 block mb-1">BOOM OPERATOR</label>
            <input
              type="text"
              value={header.boomOperator}
              onChange={(e) => setHeader({ ...header, boomOperator: e.target.value })}
              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white"
            />
          </div>
          <div>
            <label className="text-[9px] text-slate-400 block mb-1">DIRECTOR</label>
            <input
              type="text"
              value={header.director}
              onChange={(e) => setHeader({ ...header, director: e.target.value })}
              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white"
            />
          </div>
        </div>
      ) : (
        <div className="african-inactive-panel-header flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-xs font-mono-broadcast">
          <div className="flex items-center gap-4 text-slate-300">
            <span>
              <strong className="text-white">{header.projectTitle}</strong>
            </span>
            <span className="text-amber-500/60">·</span>
            <span>Dir: {header.director}</span>
            <span className="text-amber-500/60">·</span>
            <span>Sound Rec: {header.soundRecordist}</span>
            <span className="text-amber-500/60">·</span>
            <span>Roll: <strong className="text-amber-400">{header.soundRoll}</strong></span>
          </div>
          <span className="text-slate-400 text-[10px]">
            {header.frameRate} fps · {header.sampleRate}
          </span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search scene, take, notes, or filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono-broadcast text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Main Table of Logged Takes */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left border-collapse text-xs font-mono-broadcast">
          <thead>
            <tr className="african-inactive-panel-header text-[10px] text-slate-300">
              <th className="py-2.5 px-2 text-center w-10">KEEP</th>
              <th className="py-2 px-2 w-14">SCENE</th>
              <th className="py-2 px-2 w-14">TAKE</th>
              <th className="py-2 px-2 w-24">TC START</th>
              <th className="py-2 px-2 w-24">TC END</th>
              <th className="py-2 px-2 w-16">DUR.</th>
              <th className="py-2 px-2">TRACKS</th>
              <th className="py-2 px-2 min-w-[200px]">NOTES</th>
              <th className="py-2 px-2 text-right w-12">ACT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredTakes.map((take) => (
              <tr
                key={take.id}
                className={`hover:bg-slate-900/60 transition-colors ${
                  take.isFalseTake ? 'opacity-60 bg-rose-950/20' : ''
                }`}
              >
                {/* Circle / Star keeper */}
                <td className="py-2 px-2 text-center">
                  <button
                    type="button"
                    onClick={() => onToggleCircle(take.id)}
                    className="cursor-pointer"
                    title={take.isCircled ? 'Circled Take (Keeper)' : 'Click to Circle Take'}
                  >
                    <Star
                      className={`w-4 h-4 mx-auto ${
                        take.isCircled
                          ? 'text-amber-400 fill-current'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                    />
                  </button>
                </td>

                {/* Scene */}
                <td className="py-2 px-2 font-bold text-white">
                  {take.scene}
                </td>

                {/* Take */}
                <td className="py-2 px-2">
                  <span
                    className={`font-bold ${
                      take.isFalseTake
                        ? 'text-rose-400 line-through'
                        : take.isCircled
                        ? 'text-amber-400'
                        : 'text-slate-200'
                    }`}
                  >
                    {take.take}{take.takeSuffix || ''}
                  </span>
                  {take.isFalseTake && (
                    <span className="block text-[8px] text-rose-500 font-bold uppercase">
                      FALSE
                    </span>
                  )}
                </td>

                {/* TC Start */}
                <td className="py-2 px-2 text-slate-300">
                  {take.startTc}
                </td>

                {/* TC End */}
                <td className="py-2 px-2 text-slate-300">
                  {take.endTc}
                </td>

                {/* Duration */}
                <td className="py-2 px-2 text-emerald-400 font-medium">
                  {SoundReportService.formatDuration(take.durationSeconds)}
                </td>

                {/* Track Names */}
                <td className="py-2 px-2 text-[10px] text-slate-400 truncate max-w-[200px]" title={take.trackNames.join(', ')}>
                  {take.trackNames.join(', ')}
                </td>

                {/* Notes (Editable) */}
                <td className="py-2 px-2">
                  {editingTakeId === take.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingNotesText}
                        onChange={(e) => setEditingNotesText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveNote(take.id)}
                        className="w-full px-2 py-0.5 bg-slate-950 border border-blue-500 rounded text-xs text-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveNote(take.id)}
                        className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartEditNote(take)}
                      className="group flex items-center gap-1 text-left hover:text-blue-400 transition-colors cursor-pointer w-full"
                    >
                      <span className="text-slate-300 truncate">
                        {take.notes || <em className="text-slate-600">No notes (click to add)</em>}
                      </span>
                      <Edit3 className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  )}
                </td>

                {/* Delete Take button */}
                <td className="py-2 px-2 text-right">
                  <button
                    type="button"
                    onClick={() => onDeleteTake(take.id)}
                    className="p-1 text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete take record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}

            {filteredTakes.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  No takes recorded yet. Press RECORD to create the first take!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
