
import React, { useState } from 'react';
import { MartialArts, Player } from '../types';
import { useToast } from './Toast';

interface ConfigSheetProps {
  martialArts: MartialArts[];
  teams: string[];
  players: Player[];
  onUpdateMartialArts: (newMa: MartialArts[]) => void;
  onUpdateTeams: (newTeams: string[]) => void;
  onBatchUpdatePlayers: (updates: { id: string; team: string }[]) => void;
  onRestoreDefaults: () => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  isRestricted?: boolean;
}

export const ConfigSheet: React.FC<ConfigSheetProps> = ({ 
  martialArts, 
  teams, 
  players,
  onUpdateMartialArts,
  onUpdateTeams,
  onBatchUpdatePlayers,
  onRestoreDefaults,
  showConfirm,
  isRestricted
}) => {
  const [newMaName, setNewMaName] = useState('');
  const [newMaColor, setNewMaColor] = useState('#3b82f6');
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [editingMaIdx, setEditingMaIdx] = useState<number | null>(null);
  const [editingTeamIdx, setEditingTeamIdx] = useState<number | null>(null);
  const [editBuffer, setEditBuffer] = useState('');
  const { showToast } = useToast();

  const addMartialArt = () => {
    if (!newMaName || isRestricted) return;
    onUpdateMartialArts([...martialArts, { name: newMaName, color: newMaColor }]);
    setNewMaName('');
  };

  const removeMa = (index: number) => {
    if (isRestricted) return;
    const maToRemove = martialArts[index];
    const affectedPlayers = players.filter(p => p.martialArts.includes(maToRemove.name));
    
    const executeRemove = () => {
      if (affectedPlayers.length > 0) {
        const backfillTeam = teams.find(t => t.includes('候補')) || teams[teams.length - 1];
        onBatchUpdatePlayers(affectedPlayers.map(p => ({ id: p.id, team: backfillTeam })));
      }
      onUpdateMartialArts(martialArts.filter((_, i) => i !== index));
    };

    if (affectedPlayers.length > 0) {
      showConfirm(
        "目前已存在人員，是否變動？", 
        `已有 ${affectedPlayers.length} 位人員使用「${maToRemove.name}」，移除後預設會將他們移動到候補隊伍。`, 
        executeRemove
      );
    } else {
      executeRemove();
    }
  };

  const getAvailableSlots = () => {
    const actualTeams = teams.filter(t => !t.includes('候補'));
    const maxNum = actualTeams.length + 1;
    const slots = [];
    for (let i = 1; i <= maxNum; i++) {
      const prefix = `第${['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][i] || i}隊:`;
      if (!teams.some(t => t.startsWith(prefix))) {
        slots.push(i);
      }
    }
    return slots;
  };

  const addTeam = () => {
    if (!newTeamName || !selectedSlot || isRestricted) return;
    
    const numWords = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    const numStr = numWords[selectedSlot] || selectedSlot.toString();
    const formattedName = `第${numStr}隊:${newTeamName}`;

    if (teams.some(t => t.startsWith(`第${numStr}隊:`))) {
      showToast(`已經存在第${numStr}隊，請選擇其他序號`, 'error');
      return;
    }

    const newTeams = [...teams];
    const candidateIdx = newTeams.findIndex(t => t.includes('候補'));
    
    // Find correct insertion index to maintain order 第1, 第2, 第3...
    let insertIdx = candidateIdx !== -1 ? candidateIdx : newTeams.length;
    for (let i = 0; i < (candidateIdx !== -1 ? candidateIdx : newTeams.length); i++) {
      const match = newTeams[i].match(/第(.+?)隊/);
      if (match) {
        const currentNum = numWords.indexOf(match[1]);
        if (currentNum > selectedSlot) {
          insertIdx = i;
          break;
        }
      }
    }

    newTeams.splice(insertIdx, 0, formattedName);
    onUpdateTeams(newTeams);
    setNewTeamName('');
    setSelectedSlot(null);
  };

  const removeTeam = (index: number) => {
    if (isRestricted) return;
    const teamToRemove = teams[index];
    
    if (teamToRemove.includes('候補')) {
      const otherCandidates = teams.filter((t, i) => i !== index && t.includes('候補'));
      if (otherCandidates.length === 0) {
        showToast('最少必須保留一個候補隊伍', 'error');
        return;
      }
    }

    const affectedPlayers = players.filter(p => p.team === teamToRemove);

    const executeRemove = () => {
      if (affectedPlayers.length > 0) {
        const backfillTeam = teams.find((t, i) => i !== index && t.includes('候補')) || (teams[0] !== teamToRemove ? teams[0] : teams[1]);
        onBatchUpdatePlayers(affectedPlayers.map(p => ({ id: p.id, team: backfillTeam })));
      }
      onUpdateTeams(teams.filter((_, i) => i !== index));
    };

    if (affectedPlayers.length > 0) {
      showConfirm(
        "目前已存在人員，是否變動？",
        `已有 ${affectedPlayers.length} 位人員在「${teamToRemove}」，移除後預設會將他們移動到候補隊伍。`,
        executeRemove
      );
    } else {
      executeRemove();
    }
  };

  const handleUpdateMa = (index: number) => {
    if (isRestricted) return;
    const oldName = martialArts[index].name;
    const newName = editBuffer.trim();
    if (!newName || oldName === newName) {
      setEditingMaIdx(null);
      return;
    }

    const affectedPlayers = players.filter(p => p.martialArts.includes(oldName));
    
    const execute = () => {
      if (affectedPlayers.length > 0) {
        const backfillTeam = teams.find(t => t.includes('候補')) || teams[teams.length - 1];
        onBatchUpdatePlayers(affectedPlayers.map(p => ({ id: p.id, team: backfillTeam })));
      }
      const newMa = [...martialArts];
      newMa[index] = { ...newMa[index], name: newName };
      onUpdateMartialArts(newMa);
      setEditingMaIdx(null);
    };

    if (affectedPlayers.length > 0) {
      showConfirm(
        "目前已存在人員，是否變動？",
        `已有 ${affectedPlayers.length} 位人員使用「${oldName}」，更換武學名稱後預設會將他們移動到候補隊伍。`,
        execute
      );
    } else {
      execute();
    }
  };

  const handleUpdateTeam = (index: number) => {
    if (isRestricted) return;
    const oldName = teams[index];
    const newName = editBuffer.trim();
    if (!newName || oldName === newName) {
      setEditingTeamIdx(null);
      return;
    }

    const affectedPlayers = players.filter(p => p.team === oldName);

    const execute = () => {
      if (affectedPlayers.length > 0) {
        const backfillTeam = teams.find((t, i) => i === index ? false : t.includes('候補')) || (teams[0] !== oldName ? teams[0] : teams[1]);
        onBatchUpdatePlayers(affectedPlayers.map(p => ({ id: p.id, team: backfillTeam })));
      }
      const newTeams = [...teams];
      newTeams[index] = newName;
      onUpdateTeams(newTeams);
      setEditingTeamIdx(null);
    };

    if (affectedPlayers.length > 0) {
      showConfirm(
        "目前已存在人員，是否變動？",
        `已有 ${affectedPlayers.length} 位人員在「${oldName}」，更改隊伍名稱後預設會將他們移動到候補隊伍。`,
        execute
      );
    } else {
      execute();
    }
  };

  const handleRestoreDefaultsInternal = () => {
    if (isRestricted) {
      showToast('此專案目前遭到限制，無法還原配置', 'error');
      return;
    }
    const execute = () => {
      onRestoreDefaults();
      if (players.length > 0) {
        // We know '候補' is in default TEAMS
        onBatchUpdatePlayers(players.map(p => ({ id: p.id, team: '候補' })));
      }
    };

    showConfirm(
      "還原預設配置",
      "這將會把所有武學、隊伍、任務說明及攻略還原至系統初始狀態。注意：還原後所有報名人員將被移動至「候補」隊伍以確保資料安全且不亂套。",
      execute
    );
  };

  return (
    <div className="space-y-8">
      {/* Restore Defaults */}
      <section className="bg-red-500/5 border border-red-500/20 p-8 rounded-2xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2">
            <h3 className="text-xl font-black flex items-center gap-3 text-red-500 uppercase tracking-tighter">
              <i className="fa-solid fa-triangle-exclamation"></i>
              配置初始化
            </h3>
            <p className="text-xs text-slate-500 font-bold max-w-xl">
              如果不小心將武學或隊伍配置改亂了，可以使用此功能還原至系統預設狀態（包含：常用二十大武學、標準一二三小隊配置、任務說明及攻略指引）。
            </p>
          </div>
          <button 
            disabled={isRestricted}
            onClick={handleRestoreDefaultsInternal}
            className={`px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-red-600/20 active:scale-95 whitespace-nowrap ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            還原預設配置
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Martial Arts Config */}
        <section className={`bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 ${isRestricted ? 'opacity-80' : ''}`}>
          <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
            <i className="fa-solid fa-database"></i>
            武學配置
          </h3>
          
          <div className="grid grid-cols-12 gap-3 mb-8 p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="col-span-12 md:col-span-6">
              <input
                type="text"
                value={newMaName}
                onChange={(e) => setNewMaName(e.target.value)}
                disabled={isRestricted}
                placeholder="武學名稱"
                className={`w-full p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-300 border border-slate-300 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500 text-xs ${isRestricted ? 'cursor-not-allowed' : ''}`}
              />
            </div>
            <div className="col-span-12 md:col-span-4">
              <input
                type="color"
                value={newMaColor}
                onChange={(e) => setNewMaColor(e.target.value)}
                disabled={isRestricted}
                className={`w-full h-8 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded cursor-pointer p-0 ${isRestricted ? 'cursor-not-allowed' : ''}`}
              />
            </div>
            <button
               onClick={addMartialArt}
               disabled={isRestricted}
               className={`col-span-12 md:col-span-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-600/10 text-xs ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              新增
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
            {martialArts.map((ma, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 group hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-3 flex-1">
                  <span className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: ma.color }}></span>
                  {editingMaIdx === idx && !isRestricted ? (
                    <input
                      autoFocus
                      className="bg-[#0f172a] text-indigo-400 font-bold text-xs outline-none border-b border-indigo-500 w-full"
                      value={editBuffer}
                      onChange={(e) => setEditBuffer(e.target.value)}
                      onBlur={() => handleUpdateMa(idx)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateMa(idx)}
                    />
                  ) : (
                    <span 
                      onClick={() => {
                        if (isRestricted) return;
                        setEditBuffer(ma.name);
                        setEditingMaIdx(idx);
                      }}
                      className={`font-bold text-slate-400 group-hover:text-indigo-400 text-xs ${isRestricted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {ma.name}
                    </span>
                  )}
                </div>
                {!isRestricted && (
                  <button onClick={() => removeMa(idx)} className="text-slate-400 hover:text-red-500 transition-colors ml-2">
                    <i className="fa-solid fa-circle-xmark"></i>
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Team Config */}
        <section className={`bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col ${isRestricted ? 'opacity-80' : ''}`}>
          <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-teal-600 dark:text-teal-400 uppercase tracking-tighter">
            <i className="fa-solid fa-network-wired"></i>
            隊伍配置
          </h3>

          <div className="flex flex-col gap-3 mb-8 p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex gap-2 items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">新增隊伍序號:</span>
              <div className="flex flex-wrap gap-2">
                {getAvailableSlots().map(slot => (
                  <button
                    key={slot}
                    disabled={isRestricted}
                    onClick={() => setSelectedSlot(slot)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all border ${
                      selectedSlot === slot
                      ? 'bg-teal-600 border-teal-500 text-white shadow-lg shadow-teal-600/20'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-400 dark:hover:border-slate-600'
                    } ${isRestricted ? 'opacity-50 cursor-not-allowed shadow-none active:scale-100' : ''}`}
                  >
                    第{['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][slot] || slot}隊
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                disabled={isRestricted}
                placeholder="填入隊伍目的"
                className={`flex-1 p-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-300 border border-slate-300 dark:border-slate-800 rounded-lg outline-none focus:border-teal-500 text-xs ${isRestricted ? 'cursor-not-allowed' : ''}`}
              />
              <button
                onClick={addTeam}
                disabled={!selectedSlot || !newTeamName || isRestricted}
                className={`px-6 py-2 font-black rounded-xl transition-all shadow-lg text-xs ${
                  selectedSlot && newTeamName && !isRestricted
                  ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/10'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                新增
              </button>
            </div>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
            {teams.map((team, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 group hover:border-teal-500/30 transition-all">
                <div className="flex-1">
                  {editingTeamIdx === idx && !isRestricted ? (
                    <input
                      autoFocus
                      className="bg-[#0f172a] text-teal-400 font-bold text-xs outline-none border-b border-teal-500 w-full"
                      value={editBuffer}
                      onChange={(e) => setEditBuffer(e.target.value)}
                      onBlur={() => handleUpdateTeam(idx)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateTeam(idx)}
                    />
                  ) : (
                    <span 
                      onClick={() => {
                        if (isRestricted) return;
                        setEditBuffer(team);
                        setEditingTeamIdx(idx);
                      }}
                      className={`font-bold text-slate-400 group-hover:text-teal-400 text-xs ${isRestricted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {team}
                    </span>
                  )}
                </div>
                {!isRestricted && (
                  <button onClick={() => removeTeam(idx)} className="text-slate-400 hover:text-red-500 transition-colors ml-2">
                    <i className="fa-solid fa-circle-xmark"></i>
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
