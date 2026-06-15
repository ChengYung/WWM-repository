
import React, { useState, useMemo } from 'react';
import { Player, MartialArts, Availability, Member } from '../types';
import { useToast } from './Toast';
import { SESSION_LABELS } from '../constants';

interface RegistrationSheetProps {
  onAddPlayer: (player: Omit<Player, 'id' | 'createdAt'>) => void;
  martialArts: MartialArts[];
  teams: string[];
  players: Player[];
  availabilityOptions: Availability[];
  isRestricted?: boolean;
  members: Member[];
}

export const RegistrationSheet: React.FC<RegistrationSheetProps> = ({
  onAddPlayer,
  martialArts,
  teams,
  players,
  availabilityOptions,
  isRestricted,
  members = []
}) => {
  const [gameId, setGameId] = useState('');
  const [selectedArts, setSelectedArts] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedSatSessions, setSelectedSatSessions] = useState<string[]>(['RK1', 'NG1', 'NG2', 'NG3', 'NG4']);
  const [selectedSunSessions, setSelectedSunSessions] = useState<string[]>(['RK1', 'NG1', 'NG2', 'NG3', 'NG4']);
  const [notes, setNotes] = useState('');
  const [power, setPower] = useState('');
  const [noSelf, setNoSelf] = useState(false);
  const [hasDc, setHasDc] = useState(false);
  const [canMic, setCanMic] = useState(false);
  const { showToast } = useToast();

  const getArtColor = (artName: string) => {
    const ma = martialArts.find(m => m.name === artName);
    return ma?.color || '#94a3b8';
  };

  const lowercaseQuery = gameId.trim().toLowerCase();
  const matchedMembers = useMemo(() => {
    if (!lowercaseQuery || !members) return [];
    return members.filter(m => 
      m.gameName && m.gameName.toLowerCase().includes(lowercaseQuery)
    );
  }, [members, lowercaseQuery]);

  const handleSelectMatchedMember = (member: Member) => {
    setGameId(member.gameName);
    setNoSelf(!!member.noSelf);
    setHasDc(!!member.hasDc);
    setCanMic(!!member.canMic);
    
    // Auto-fill combo 1 (搭配1)
    if (member.combos && member.combos[0]) {
      const firstCombo = member.combos[0];
      const arts = firstCombo.arts ? firstCombo.arts.filter(Boolean) : [];
      setSelectedArts(arts);
      if (firstCombo.power !== undefined) {
        setPower(String(firstCombo.power));
      } else {
        setPower('');
      }
      showToast(`已載入「${member.gameName}」的武學搭配 1、戰力與狀態`, 'success');
    } else {
      setSelectedArts([]);
      setPower('');
      showToast(`已載入「${member.gameName}」的狀態設定 (無搭配資料)`, 'success');
    }
  };

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

    // 檢查重複報名
    const normalizedNewId = gameId.trim().toLowerCase();
    const isDuplicate = players.some(p => {
      const existingId = String(p.gameId || '').trim().toLowerCase();
      return existingId === normalizedNewId;
    });

    if (isDuplicate) {
      showToast(`名稱「${gameId.trim()}」已報名過`, 'error');
      return;
    }

    if (selectedArts.length === 0) {
      showToast('請至少選擇一個武學項目', 'error');
      return;
    }

    const matchedMemberExact = members?.find(m => m.gameName.trim().toLowerCase() === gameId.trim().toLowerCase());
    const finalNoSelf = matchedMemberExact ? (matchedMemberExact.noSelf || false) : noSelf;
    const finalHasDc = matchedMemberExact ? (matchedMemberExact.hasDc || false) : hasDc;
    const finalCanMic = matchedMemberExact ? (matchedMemberExact.canMic || false) : canMic;

    onAddPlayer({
      gameId: matchedMemberExact ? matchedMemberExact.gameName : gameId,
      martialArts: selectedArts,
      satAvailability: selectedSatSessions.length > 0 ? 'YES' : 'NO',
      sunAvailability: selectedSunSessions.length > 0 ? 'YES' : 'NO',
      satSessions: selectedSatSessions,
      sunSessions: selectedSunSessions,
      notes,
      team: '候補',
      power: power.trim() || undefined,
      noSelf: finalNoSelf,
      hasDc: finalHasDc,
      canMic: finalCanMic
    });
    setGameId('');
    setSelectedArts([]);
    setSelectedSatSessions(['RK1', 'NG1', 'NG2', 'NG3', 'NG4']);
    setSelectedSunSessions(['RK1', 'NG1', 'NG2', 'NG3', 'NG4']);
    setNotes('');
    setPower('');
    setNoSelf(false);
    setHasDc(false);
    setCanMic(false);
  };

  return (
    <div className="space-y-3">
      {/* Registration Form */}
      <section className="bg-[#0f172a] p-3 rounded-xl shadow-2xl border border-slate-800 hover:border-slate-800/80 transition-all">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-base font-bold flex items-center gap-2 text-slate-100">
            <i className="fa-solid fa-user-plus text-blue-500 text-sm"></i>
            報名登記
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Top row: Game Name and Status settings side-by-side */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
            <div className="space-y-0.5 relative">
              <label className="text-xs font-bold text-slate-400 block mb-1">遊戲名稱 *</label>
              <input
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  setTimeout(() => setIsFocused(false), 200);
                }}
                disabled={isRestricted}
                placeholder={isRestricted ? "此專案已鎖定" : "請輸入遊戲名稱"}
                className={`w-full bg-[#020617] text-slate-200 text-xs font-bold rounded-lg border border-slate-800 focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all h-[38px] px-3 py-2 ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
              />

              {/* Autocomplete Dropdown list */}
              {isFocused && matchedMembers.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden z-50 shadow-2xl divide-y divide-slate-800">
                  <div className="px-3 py-1 bg-[#020617]/55 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                    <span>可選百業成員 (模糊匹配)</span>
                    <span className="text-[9px] text-blue-400">點選自動帶入</span>
                  </div>
                  {matchedMembers.slice(0, 5).map(member => (
                    <div
                      key={member.id}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevents input onBlur from destroying selection
                        handleSelectMatchedMember(member);
                        setIsFocused(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-800/40 flex items-center justify-between transition-all cursor-pointer group"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-200 group-hover:text-white flex items-center gap-1.5">
                          <i className="fa-solid fa-user-circle text-blue-400 text-xs"></i>
                          {member.gameName}
                        </span>
                        {member.combos && member.combos[0] && (
                          <span className="text-[10px] text-slate-500 font-bold mt-0.5">
                            搭配1: {member.combos[0].arts.join(' + ')} ({member.combos[0].power}鵝)
                          </span>
                        )}
                      </div>
                      <span className="text-[9.5px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md font-bold tracking-wider group-hover:bg-blue-600 group-hover:text-white transition-all">
                        自動帶入
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-0.5">
              <label className="text-xs font-bold text-slate-400 block mb-1">通訊與狀態設定</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 bg-[#020617] p-0.5 rounded-lg border border-slate-800 h-[38px] items-center">
                <label className="flex items-center gap-1 px-1.5 py-1 bg-[#0f172a] hover:bg-slate-800/30 rounded-md cursor-pointer transition-all border border-slate-800/60 selection:bg-transparent h-7">
                  <input
                    type="checkbox"
                    checked={noSelf}
                    onChange={(e) => setNoSelf(e.target.checked)}
                    disabled={isRestricted}
                    className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 bg-[#020617] border-slate-700 rounded cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-slate-200 flex items-center gap-1">
                    <i className="fa-solid fa-trophy text-yellow-500 text-xs text-amber-500"></i>
                    是否無我
                  </span>
                </label>

                <label className="flex items-center gap-1 px-1.5 py-1 bg-[#0f172a] hover:bg-slate-800/30 rounded-md cursor-pointer transition-all border border-slate-800/60 selection:bg-transparent h-7 font-sans">
                  <input
                    type="checkbox"
                    checked={hasDc}
                    onChange={(e) => setHasDc(e.target.checked)}
                    disabled={isRestricted}
                    className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 bg-[#020617] border-slate-700 rounded cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-slate-200 flex items-center gap-1">
                    <i className="fa-brands fa-discord text-indigo-400 text-xs"></i>
                    是否有 DC
                  </span>
                </label>

                <label className="flex items-center gap-1 px-1.5 py-1 bg-[#0f172a] hover:bg-slate-800/30 rounded-md cursor-pointer transition-all border border-slate-800/60 selection:bg-transparent h-7">
                  <input
                    type="checkbox"
                    checked={canMic}
                    onChange={(e) => setCanMic(e.target.checked)}
                    disabled={isRestricted}
                    className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 bg-[#020617] border-slate-700 rounded cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-slate-200 flex items-center gap-1">
                    <i className="fa-solid fa-microphone text-green-400 text-xs"></i>
                    是否可開 Mic
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* New Row: Member styled Martial Arts Selection & power selector */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#020617] p-2.5 rounded-xl border border-slate-800/80 items-end">
            <div className="relative z-30">
              <label className="text-xs font-bold text-slate-400 block mb-1">武學 *</label>
              <button
                type="button"
                onClick={() => !isRestricted && setIsDropdownOpen(!isDropdownOpen)}
                disabled={isRestricted}
                className={`w-full bg-[#0f172a] border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-1.5 text-xs font-bold text-left outline-none transition-all flex items-center justify-between min-h-[34px] ${
                  isRestricted ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-700'
                }`}
              >
                <span className="text-[#94a3b8]">● 選擇武學</span>
                <i className={`fa-solid fa-chevron-down text-[10px] text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
              </button>

              {isDropdownOpen && (
                <>
                  {/* Invisible backdrop to dismiss */}
                  <div 
                    className="fixed inset-0 z-45" 
                    onClick={() => setIsDropdownOpen(false)} 
                  />
                  
                  {/* Dropdown panel */}
                  <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-[#090f1d] border border-slate-800 rounded-lg shadow-2xl p-1 z-50 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-800">
                    {martialArts.map((ma, i) => {
                      const isSelected = selectedArts.includes(ma.name);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedArts(selectedArts.filter(item => item !== ma.name));
                            } else {
                              setSelectedArts([...selectedArts, ma.name]);
                            }
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left text-xs font-bold transition-all ${
                            isSelected 
                              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                              : 'text-slate-300 hover:bg-[#0f172a] border border-transparent'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ma.color || '#94a3b8' }}></span>
                            {ma.name}
                          </span>
                          {isSelected ? (
                            <i className="fa-solid fa-check text-xs text-blue-400"></i>
                          ) : (
                            <span className="w-3 h-3 rounded border border-slate-700 shrink-0"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1 min-h-[34px] bg-[#0f172a]/20 border border-slate-800/40 rounded-lg px-2 py-1">
              {selectedArts.length === 0 ? (
                <span className="text-[10px] text-slate-600 italic font-semibold">尚未選擇武學</span>
              ) : (
                selectedArts.map((ma, i) => {
                  const maObj = martialArts.find(m => m.name === ma);
                  return (
                    <React.Fragment key={`${ma}-${i}`}>
                      {i > 0 && <span className="text-slate-600 text-xs font-bold">+</span>}
                      <span
                        onClick={() => {
                          if (!isRestricted) {
                            setSelectedArts(selectedArts.filter(item => item !== ma));
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold bg-[#020617] border-slate-800 text-slate-200 transition-all ${isRestricted ? 'cursor-not-allowed' : 'hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 cursor-pointer'}`}
                        title="點擊刪除"
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: maObj?.color || '#94a3b8' }}></span>
                        {ma}
                        {!isRestricted && <i className="fa-solid fa-circle-xmark ml-1 text-[8px] opacity-60"></i>}
                      </span>
                    </React.Fragment>
                  );
                })
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">戰力指數 (鵝)</label>
              <div className="relative">
                <input
                  type="text"
                  value={power}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    const parts = val.split('.');
                    if (parts.length > 2) return;
                    setPower(val);
                  }}
                  disabled={isRestricted}
                  placeholder={isRestricted ? "此專案已鎖定" : "例: 3.14"}
                  className={`w-full bg-[#0f172a]/95 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-200 font-bold outline-none font-mono transition-all h-[34px] ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-black font-sans">鵝</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div className="space-y-1.5 bg-indigo-950/10 p-2 rounded-lg border border-indigo-500/15 shadow">
              <label className="text-[10px] font-bold text-indigo-300 flex items-center gap-1 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow shadow-indigo-500/50 animate-pulse"></span>
                週六場次 (預設全選，可點擊取消)
              </label>
              <div className="grid grid-cols-5 gap-1">
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
                      className={`py-1 rounded-md border flex flex-col items-center justify-center transition-all duration-150 select-none ${
                        isSelected
                        ? 'bg-indigo-600 border-indigo-500 shadow scale-[1.01]'
                        : 'bg-[#020617] border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <span className={`text-[10px] font-black ${
                        sessionKey === 'RK1' 
                          ? 'text-yellow-400 font-extrabold'
                          : (isSelected ? 'text-cyan-200' : 'text-cyan-500/70 hover:text-cyan-400')
                      }`}>{sessionKey}</span>
                      <span className={`text-[7px] font-bold opacity-70 tracking-wider ${
                        sessionKey === 'RK1' 
                          ? 'text-yellow-500 font-black'
                          : (isSelected ? 'text-cyan-300/90' : 'text-cyan-600/70')
                      }`}>
                        {SESSION_LABELS[sessionKey]?.replace(/[^\d]/g, '')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5 bg-teal-950/10 p-2 rounded-lg border border-teal-500/15 shadow">
              <label className="text-[10px] font-bold text-teal-300 flex items-center gap-1 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow shadow-teal-500/50 animate-pulse"></span>
                週日場次 (預設全選，可點擊取消)
              </label>
              <div className="grid grid-cols-5 gap-1">
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
                      className={`py-1 rounded-md border flex flex-col items-center justify-center transition-all duration-150 select-none ${
                        isSelected
                        ? 'bg-teal-600 border-teal-500 shadow scale-[1.01]'
                        : 'bg-[#020617] border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <span className={`text-[10px] font-black ${
                        sessionKey === 'RK1' 
                          ? 'text-yellow-400 font-extrabold'
                          : (isSelected ? 'text-cyan-200' : 'text-cyan-500/70 hover:text-cyan-400')
                      }`}>{sessionKey}</span>
                      <span className={`text-[7px] font-bold opacity-70 tracking-wider ${
                        sessionKey === 'RK1' 
                          ? 'text-yellow-500 font-black'
                          : (isSelected ? 'text-cyan-300/90' : 'text-cyan-600/70')
                      }`}>
                        {SESSION_LABELS[sessionKey]?.replace(/[^\d]/g, '')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-12 space-y-0.5">
            <label className="text-xs font-bold text-slate-400">備註 (選填)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isRestricted}
              className={`w-full p-2 bg-[#020617] text-slate-100 text-xs font-bold rounded-lg border border-slate-700 outline-none focus:ring-1 focus:ring-blue-500/20 h-[34px] ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>

          <div className="lg:col-span-12 flex justify-end">
            <button
              type="submit"
              disabled={isRestricted}
              className={`w-full md:w-36 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-lg transition-all shadow-lg shadow-blue-600/10 active:scale-95 flex items-center justify-center gap-1.5 ${isRestricted ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
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
