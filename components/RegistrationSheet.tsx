
import React, { useState, useMemo } from 'react';
import { Player, MartialArts, Availability } from '../types';
import { useToast } from './Toast';
import { SESSION_LABELS } from '../constants';

interface RegistrationSheetProps {
  onAddPlayer: (player: Omit<Player, 'id' | 'createdAt'>) => void;
  martialArts: MartialArts[];
  teams: string[];
  players: Player[];
  availabilityOptions: Availability[];
  isRestricted?: boolean;
}

export const RegistrationSheet: React.FC<RegistrationSheetProps> = ({
  onAddPlayer,
  martialArts,
  teams,
  players,
  availabilityOptions,
  isRestricted
}) => {
  const [gameId, setGameId] = useState('');
  const [selectedMAs, setSelectedMAs] = useState<string[]>([]);
  const [selectedSatSessions, setSelectedSatSessions] = useState<string[]>(['RK1', 'NG1', 'NG2', 'NG3', 'NG4']);
  const [selectedSunSessions, setSelectedSunSessions] = useState<string[]>(['RK1', 'NG1', 'NG2', 'NG3', 'NG4']);
  const [notes, setNotes] = useState('');
  const [power, setPower] = useState('');
  const [noSelf, setNoSelf] = useState(false);
  const [hasDc, setHasDc] = useState(false);
  const [canMic, setCanMic] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRestricted) {
      showToast('此專案目前遭到限制，無法進行報名', 'error');
      return;
    }
    if (!gameId.trim()) {
      showToast('請填入遊戲名稱', 'error');
      return;
    }

    // 檢查重複報名 (增加更嚴謹的過濾與字串處理)
    const normalizedNewId = gameId.trim().toLowerCase();
    const isDuplicate = players.some(p => {
      const existingId = String(p.gameId || '').trim().toLowerCase();
      return existingId === normalizedNewId;
    });

    if (isDuplicate) {
      showToast(`名稱「${gameId.trim()}」已報名過`, 'error');
      return;
    }

    if (selectedMAs.length === 0) {
      showToast('請至少選擇一門武學', 'error');
      return;
    }
    onAddPlayer({
      gameId,
      martialArts: selectedMAs,
      satAvailability: selectedSatSessions.length > 0 ? 'YES' : 'NO',
      sunAvailability: selectedSunSessions.length > 0 ? 'YES' : 'NO',
      satSessions: selectedSatSessions,
      sunSessions: selectedSunSessions,
      notes,
      team: '候補',
      power: power.trim() || undefined,
      noSelf,
      hasDc,
      canMic
    });
    setGameId('');
    setSelectedMAs([]);
    setSelectedSatSessions(['RK1', 'NG1', 'NG2', 'NG3', 'NG4']);
    setSelectedSunSessions(['RK1', 'NG1', 'NG2', 'NG3', 'NG4']);
    setNotes('');
    setPower('');
    setNoSelf(false);
    setHasDc(false);
    setCanMic(false);
  };

  const toggleMA = (name: string) => {
    setSelectedMAs(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  return (
    <div className="space-y-8">
      {/* Registration Form */}
      <section className="bg-[#0f172a] p-6 rounded-2xl shadow-2xl border border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100">
            <i className="fa-solid fa-user-plus text-blue-500"></i>
            報名登記
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-2">
            <label className="text-sm font-bold text-slate-400">遊戲名稱 *</label>
            <input
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              disabled={isRestricted}
              placeholder={isRestricted ? "此專案已鎖定" : "請輸入遊戲名稱"}
              className={`w-full p-2.5 bg-[#020617] text-slate-100 font-bold rounded-lg border border-slate-700 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-inner ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>

          <div className="lg:col-span-3 space-y-2">
            <label className="text-sm font-bold text-slate-400">戰力指數 (選填)</label>
            <input
              type="text"
              value={power}
              onChange={(e) => setPower(e.target.value)}
              disabled={isRestricted}
              placeholder={isRestricted ? "此專案已鎖定" : "例如: 3.093鵝"}
              className={`w-full p-2.5 bg-[#020617] text-slate-100 font-bold rounded-lg border border-slate-700 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-inner ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>

          <div className="lg:col-span-6 space-y-2">
            <label className="text-sm font-bold text-slate-400">武學選擇 (可多選)</label>
            <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 bg-[#020617] p-3 rounded-xl border border-slate-800 max-h-[160px] overflow-y-auto ${isRestricted ? 'opacity-50 grayscale' : ''}`}>
              {martialArts.map(ma => (
                <label 
                  key={ma.name} 
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all ${
                    selectedMAs.includes(ma.name) 
                    ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.1)]' 
                    : 'bg-[#0f172a] border-slate-800 hover:border-slate-600'
                  } ${isRestricted ? 'cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedMAs.includes(ma.name)}
                    onChange={() => !isRestricted && toggleMA(ma.name)}
                    disabled={isRestricted}
                    className="hidden"
                  />
                  <span className="w-3 h-3 rounded-full shadow-inner shrink-0" style={{ backgroundColor: ma.color }}></span>
                  <span className={`text-[10px] font-bold truncate ${selectedMAs.includes(ma.name) ? 'text-blue-300' : 'text-slate-400'}`}>
                    {ma.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3 bg-indigo-950/15 p-4 rounded-xl border border-indigo-500/20 shadow-md">
              <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50"></span>
                週六場次 (預設全選，可點擊取消)
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {['RK1', 'NG1', 'NG2', 'NG3', 'NG4'].map(sessionKey => {
                  const isSelected = selectedSatSessions.includes(sessionKey);
                  return (
                    <button
                      key={`sat-${sessionKey}`}
                      type="button"
                      disabled={isRestricted}
                      title={SESSION_LABELS[sessionKey]}
                      onClick={() => {
                        setSelectedSatSessions(prev =>
                          prev.includes(sessionKey) ? prev.filter(s => s !== sessionKey) : [...prev, sessionKey]
                        );
                      }}
                      className={`py-2 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-200 select-none ${
                        isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.35)] scale-[1.03]'
                        : 'bg-[#020617] border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <span className="text-[11px] font-black">{sessionKey}</span>
                      <span className="text-[8px] font-medium opacity-60 tracking-wider">
                        {SESSION_LABELS[sessionKey]?.replace(/[^\d]/g, '')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 bg-teal-950/15 p-4 rounded-xl border border-teal-500/20 shadow-md">
              <label className="text-xs font-bold text-teal-300 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-teal-500 shadow-lg shadow-teal-500/50"></span>
                週日場次 (預設全選，可點擊取消)
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {['RK1', 'NG1', 'NG2', 'NG3', 'NG4'].map(sessionKey => {
                  const isSelected = selectedSunSessions.includes(sessionKey);
                  return (
                    <button
                      key={`sun-${sessionKey}`}
                      type="button"
                      disabled={isRestricted}
                      title={SESSION_LABELS[sessionKey]}
                      onClick={() => {
                        setSelectedSunSessions(prev =>
                          prev.includes(sessionKey) ? prev.filter(s => s !== sessionKey) : [...prev, sessionKey]
                        );
                      }}
                      className={`py-2 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-200 select-none ${
                        isSelected
                        ? 'bg-teal-600 border-teal-500 text-white shadow-[0_0_15px_rgba(20,185,129,0.35)] scale-[1.03]'
                        : 'bg-[#020617] border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <span className="text-[11px] font-black">{sessionKey}</span>
                      <span className="text-[8px] font-medium opacity-60 tracking-wider">
                        {SESSION_LABELS[sessionKey]?.replace(/[^\d]/g, '')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-12 space-y-2">
            <label className="text-sm font-bold text-slate-400">備註 (選填)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isRestricted}
              className={`w-full p-2.5 bg-[#020617] text-slate-100 font-bold rounded-lg border border-slate-700 outline-none focus:ring-4 focus:ring-blue-500/20 ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>

          <div className="lg:col-span-12 space-y-2">
            <label className="text-sm font-bold text-slate-400">通訊與狀態設定</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#020617] p-4 rounded-xl border border-slate-800">
              <label className="flex items-center gap-3 p-3 bg-[#0f172a] hover:bg-slate-800/30 rounded-xl cursor-pointer transition-all border border-slate-800">
                <input
                  type="checkbox"
                  checked={noSelf}
                  onChange={(e) => setNoSelf(e.target.checked)}
                  disabled={isRestricted}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 bg-[#020617] border-slate-700 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 selection:bg-transparent">
                  <i className="fa-solid fa-trophy text-yellow-500 text-sm"></i>
                  是否無我 (勾選為無我)
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-[#0f172a] hover:bg-slate-800/30 rounded-xl cursor-pointer transition-all border border-slate-800">
                <input
                  type="checkbox"
                  checked={hasDc}
                  onChange={(e) => setHasDc(e.target.checked)}
                  disabled={isRestricted}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 bg-[#020617] border-slate-700 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 selection:bg-transparent">
                  <i className="fa-brands fa-discord text-indigo-400 text-sm"></i>
                  是否有 Discord (DC)
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-[#0f172a] hover:bg-slate-800/30 rounded-xl cursor-pointer transition-all border border-slate-800">
                <input
                  type="checkbox"
                  checked={canMic}
                  onChange={(e) => setCanMic(e.target.checked)}
                  disabled={isRestricted}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 bg-[#020617] border-slate-700 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 selection:bg-transparent">
                  <i className="fa-solid fa-microphone text-green-400 text-sm"></i>
                  是否可開麥克風 (開Mic)
                </span>
              </label>
            </div>
          </div>

          <div className="lg:col-span-12 flex justify-end">
            <button
              type="submit"
              disabled={isRestricted}
              className={`w-full md:w-48 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2 ${isRestricted ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
            >
              <i className="fa-solid fa-paper-plane"></i>
              {isRestricted ? '報名功能已鎖定' : '報名'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
