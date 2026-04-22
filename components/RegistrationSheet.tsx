
import React, { useState, useMemo } from 'react';
import { Player, MartialArts, Availability } from '../types';
import { useToast } from './Toast';

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
  const [sat, setSat] = useState<Availability>('YES');
  const [sun, setSun] = useState<Availability>('YES');
  const [notes, setNotes] = useState('');
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
    // ... rest of logic

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
      satAvailability: sat,
      sunAvailability: sun,
      notes,
      team: '候補'
    });
    setGameId('');
    setSelectedMAs([]);
    setNotes('');
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

          <div className="lg:col-span-9 space-y-2">
            <label className="text-sm font-bold text-slate-400">武學選擇 (可多選)</label>
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 bg-[#020617] p-3 rounded-xl border border-slate-800 max-h-[160px] overflow-y-auto ${isRestricted ? 'opacity-50 grayscale' : ''}`}>
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

          <div className="grid grid-cols-2 lg:col-span-6 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">週六場</label>
              <button
                type="button"
                disabled={isRestricted}
                onClick={() => setSat(sat === 'YES' ? 'NO' : 'YES')}
                className={`w-full py-3 rounded-xl font-black transition-all border-2 flex items-center justify-center gap-2 ${
                  sat === 'YES' 
                  ? 'bg-green-500 border-green-400 text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.3)] scale-[1.02]' 
                  : 'bg-[#020617] border-slate-800 text-slate-500 hover:border-slate-700'
                } ${isRestricted ? 'opacity-50 cursor-not-allowed animate-none scale-100' : ''}`}
              >
                <i className={`fa-solid ${sat === 'YES' ? 'fa-check-circle' : 'fa-xmark-circle'}`}></i>
                <span className="text-xs uppercase">{sat === 'YES' ? '參加' : '不參加'}</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400">週日場</label>
              <button
                type="button"
                disabled={isRestricted}
                onClick={() => setSun(sun === 'YES' ? 'NO' : 'YES')}
                className={`w-full py-3 rounded-xl font-black transition-all border-2 flex items-center justify-center gap-2 ${
                  sun === 'YES' 
                  ? 'bg-green-500 border-green-400 text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.3)] scale-[1.02]' 
                  : 'bg-[#020617] border-slate-800 text-slate-500 hover:border-slate-700'
                } ${isRestricted ? 'opacity-50 cursor-not-allowed animate-none scale-100' : ''}`}
              >
                <i className={`fa-solid ${sun === 'YES' ? 'fa-check-circle' : 'fa-xmark-circle'}`}></i>
                <span className="text-xs uppercase">{sun === 'YES' ? '參加' : '不參加'}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-2">
            <label className="text-sm font-bold text-slate-400">備註 (選填)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isRestricted}
              className={`w-full p-2.5 bg-[#020617] text-slate-100 font-bold rounded-lg border border-slate-700 outline-none focus:ring-4 focus:ring-blue-500/20 ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
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
