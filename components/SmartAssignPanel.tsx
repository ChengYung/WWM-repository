import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Player, MartialArts } from '../types';
import { useToast } from './Toast';
import { ConfirmModal } from './ConfirmModal';

interface SmartAssignPanelProps {
  players: Player[];
  teams: string[];
  martialArts: MartialArts[];
  isRestricted?: boolean;
  onUpdatePlayers: (updates: { id: string; team: string }[], sessionFilter: string | null) => void;
  // Let the parent specify a default or lock to a session, or sync
  currentSession: string | null;
  onSessionChange?: (session: string) => void;
}

export const SmartAssignPanel: React.FC<SmartAssignPanelProps> = ({
  players,
  teams,
  martialArts,
  isRestricted,
  onUpdatePlayers,
  currentSession,
  onSessionChange
}) => {
  const { showToast } = useToast();
  const [smartMaCounts, setSmartMaCounts] = useState<Record<string, number>>({});
  const [smartActiveMas, setSmartActiveMas] = useState<string[]>([
    "無名劍法", "嗟夫刀法", "青山執筆", "明川藥典"
  ]);

  // Set initial target session to SAT_RK1 or current parent session
  const [smartTargetSession, setSmartTargetSession] = useState<string>('SAT_RK1');

  useEffect(() => {
    if (currentSession) {
      setSmartTargetSession(currentSession);
    }
  }, [currentSession]);

  const [prioritizePower, setPrioritizePower] = useState(true);
  const [prioritizeNoSelf, setPrioritizeNoSelf] = useState(false);
  const [prioritizeDc, setPrioritizeDc] = useState(false);
  const [prioritizeMic, setPrioritizeMic] = useState(false);
  const [prioritizePrevReserve, setPrioritizePrevReserve] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const parsePower = (powerStr?: string): number => {
    if (!powerStr) return 0;
    const match = powerStr.match(/([0-9.]+)/);
    return match ? parseFloat(match[1]) : 0;
  };

  useEffect(() => {
    if (smartTargetSession === 'SAT_RK1' || smartTargetSession === 'SUN_RK1') {
      setPrioritizePrevReserve(false);
    }
  }, [smartTargetSession]);

  useEffect(() => {
    if (martialArts && Object.keys(smartMaCounts).length === 0) {
      const init: Record<string, number> = {};
      martialArts.forEach(ma => {
        init[ma.name] = 0;
      });
      setSmartMaCounts(init);
    }
  }, [martialArts, smartMaCounts]);

  const handleExecuteSmartAssign = useCallback(() => {
    // 3. Filter candidates based on target session if specified
    let candidatesList = [...players];
    if (smartTargetSession !== 'default') {
      const isSat = smartTargetSession.startsWith('SAT_');
      const sessionKey = smartTargetSession.replace('SAT_', '').replace('SUN_', '');
      candidatesList = players.filter(p => {
        const registeredSessions = isSat 
          ? (p.satSessions || (p.satAvailability === 'YES' ? ['RK1', 'NG1', 'NG2', 'NG3', 'NG4'] : []))
          : (p.sunSessions || (p.sunAvailability === 'YES' ? ['RK1', 'NG1', 'NG2', 'NG3', 'NG4'] : []));
        return registeredSessions.includes(sessionKey);
      });
    }

    const firstTeamName = teams.find(t => t.includes('一隊') || t.includes('防守') || t.includes('進攻')) || teams[0] || '第一隊:進攻';

    // Determine all previous sessions in the sequence for tracking backups
    const getPrevSessions = (currentSession: string): string[] => {
      const satSequence = ['SAT_RK1', 'SAT_NG1', 'SAT_NG2', 'SAT_NG3', 'SAT_NG4'];
      const sunSequence = ['SUN_RK1', 'SUN_NG1', 'SUN_NG2', 'SUN_NG3', 'SUN_NG4'];
      if (satSequence.includes(currentSession)) {
        const idx = satSequence.indexOf(currentSession);
        return idx > 0 ? satSequence.slice(0, idx) : [];
      }
      if (sunSequence.includes(currentSession)) {
        const idx = sunSequence.indexOf(currentSession);
        return idx > 0 ? sunSequence.slice(0, idx) : [];
      }
      return [];
    };

    const prevSessions = getPrevSessions(smartTargetSession);

    const isPrevBackup = (p: Player): boolean => {
      if (prevSessions.length === 0) return false;

      let hasPrevRegistration = false;
      for (const prevKey of prevSessions) {
        const isSat = prevKey.startsWith('SAT_');
        const sessionKey = prevKey.replace('SAT_', '').replace('SUN_', '');
        const registeredSessions = isSat 
          ? (p.satSessions || (p.satAvailability === 'YES' ? ['RK1', 'NG1', 'NG2', 'NG3', 'NG4'] : []))
          : (p.sunSessions || (p.sunAvailability === 'YES' ? ['RK1', 'NG1', 'NG2', 'NG3', 'NG4'] : []));

        if (registeredSessions.includes(sessionKey)) {
          hasPrevRegistration = true;
          const isAssigned = (p.assignedSessions || []).includes(prevKey);
          const teamInPrev = p.teamBySession?.[prevKey] || '候補';
          const isActuallyPlaying = isAssigned && teamInPrev !== '候補';
          if (isActuallyPlaying) {
            // If they played as an active member in ANY of their registered previous sessions, they are not a backup
            return false;
          }
        }
      }

      return hasPrevRegistration;
    };

    // 4. Sort candidates (Rule 5 priority at the topmost)
    candidatesList.sort((a, b) => {
      if (prioritizePrevReserve && prevSessions.length > 0) {
        const backupA = isPrevBackup(a) ? 1 : 0;
        const backupB = isPrevBackup(b) ? 1 : 0;
        if (backupA !== backupB) return backupB - backupA;
      }
      if (prioritizeNoSelf) {
        const nsA = a.noSelf ? 1 : 0;
        const nsB = b.noSelf ? 1 : 0;
        if (nsA !== nsB) return nsB - nsA;
      }
      if (prioritizeDc) {
        const dcA = a.hasDc ? 1 : 0;
        const dcB = b.hasDc ? 1 : 0;
        if (dcA !== dcB) return dcB - dcA;
      }
      if (prioritizeMic) {
        const micA = a.canMic ? 1 : 0;
        const micB = b.canMic ? 1 : 0;
        if (micA !== micB) return micB - micA;
      }
      if (prioritizePower) {
        const pA = parsePower(a.power);
        const pB = parsePower(b.power);
        if (pA !== pB) return pB - pA;
      }
      return b.createdAt - a.createdAt;
    });

    const remainingSlots: Record<string, number> = {};
    martialArts.forEach(ma => {
      const count = smartMaCounts[ma.name];
      remainingSlots[ma.name] = (count !== undefined && count !== null) ? count : 0;
    });

    const selectedIds = new Set<string>();

    for (const p of candidatesList) {
      // Only allocate slots for active martial arts
      const matchingMa = p.martialArts.find(maName => smartActiveMas.includes(maName) && remainingSlots[maName] > 0);
      if (matchingMa) {
        selectedIds.add(p.id);
        remainingSlots[matchingMa]--;
      }
    }

    const updates = candidatesList.map(p => ({
      id: p.id,
      team: selectedIds.has(p.id) ? firstTeamName : '候補'
    }));

    onUpdatePlayers(updates, smartTargetSession === 'default' ? null : smartTargetSession);
  }, [players, teams, martialArts, smartMaCounts, smartActiveMas, smartTargetSession, prioritizePower, prioritizeNoSelf, prioritizeDc, prioritizeMic, prioritizePrevReserve, onUpdatePlayers]);

  const handleRunSmartAssign = useCallback(() => {
    if (players.length === 0) return;

    // 1. Validate total selected counts do not exceed 30 (Rule 1)
    const totalCount = smartActiveMas.reduce((sum, maName) => sum + (smartMaCounts[maName] || 0), 0);
    if (totalCount > 30) {
      showToast("武學人數的總和不能超過30人，已超過百業戰人數上限！", "error");
      return;
    }

    // 2. Sequence order validation (Rule 4)
    if (smartTargetSession !== 'default') {
      const satSequence = ['SAT_RK1', 'SAT_NG1', 'SAT_NG2', 'SAT_NG3', 'SAT_NG4'];
      const sunSequence = ['SUN_RK1', 'SUN_NG1', 'SUN_NG2', 'SUN_NG3', 'SUN_NG4'];
      
      let seq: string[] = [];
      if (satSequence.includes(smartTargetSession)) {
        seq = satSequence;
      } else if (sunSequence.includes(smartTargetSession)) {
        seq = sunSequence;
      }
      
      const idx = seq.indexOf(smartTargetSession);
      if (idx > 0) {
        // Must check if the previous session is already configured
        const prevSession = seq[idx - 1];
        const isPrevConfigured = players.some(p => (p.assignedSessions || []).includes(prevSession));
        if (!isPrevConfigured) {
          const displayPrevName = prevSession.startsWith('SAT_') 
            ? `週六 ${prevSession.substring(4)}` 
            : `週日 ${prevSession.substring(4)}`;
          const displayCurrentName = smartTargetSession.startsWith('SAT_') 
            ? `週六 ${smartTargetSession.substring(4)}` 
            : `週日 ${smartTargetSession.substring(4)}`;
          showToast(`一定要先編輯並分配 ${displayPrevName} 之後，才能調整 ${displayCurrentName} 的人員分配！\n請依照 RK1 -> NG1 -> NG2 -> NG3 -> NG4 優先順序進行。`, "error");
          return;
        }
      }
    }

    setConfirmConfig({
      isOpen: true,
      title: '確認執行智能選隊',
      message: '執行此操作後，將會根據篩選條件與各武學配置人數，直接修改並覆蓋當前選定場次的各玩家分配隊伍。確定要執行嗎？',
      onConfirm: () => {
        handleExecuteSmartAssign();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [players, smartActiveMas, smartMaCounts, smartTargetSession, handleExecuteSmartAssign, showToast]);

  const handleSessionSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSmartTargetSession(val);
    if (onSessionChange) {
      onSessionChange(val);
    }
  };

  return (
    <div className="mt-4 p-5 bg-[#020617] rounded-3xl border border-slate-800 space-y-4 animate-in slide-in-from-top-4 duration-300">
      <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
        <i className="fa-solid fa-gears text-purple-500"></i> 智能選隊配置
      </h4>

      {/* Target Session Selector dropdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0f172a] p-4 rounded-xl border border-slate-800">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">分配之目標場次 (將調整該場次的 [分配隊伍] 欄位)</span>
          <select
            value={smartTargetSession}
            onChange={handleSessionSelectChange}
            className="bg-[#020617] border border-[#1e293b] text-xs font-bold rounded-lg px-3 py-2 outline-none text-white focus:border-purple-500 w-full cursor-pointer"
          >
            <optgroup label="週六場次">
              <option value="SAT_RK1">週六 RK1 (聯賽 2030)</option>
              <option value="SAT_NG1">週六 NG1 (配對賽 2130)</option>
              <option value="SAT_NG2">週六 NG2 (配對賽 2155)</option>
              <option value="SAT_NG3">週六 NG3 (配對賽 2230)</option>
              <option value="SAT_NG4">週六 NG4 (配對賽 2255)</option>
            </optgroup>
            <optgroup label="週日場次">
              <option value="SUN_RK1">週日 RK1 (聯賽 2030)</option>
              <option value="SUN_NG1">週日 NG1 (配對賽 2130)</option>
              <option value="SUN_NG2">週日 NG2 (配對賽 2155)</option>
              <option value="SUN_NG3">週日 NG3 (配對賽 2230)</option>
              <option value="SUN_NG4">週日 NG4 (配對賽 2255)</option>
            </optgroup>
          </select>
        </div>
        <div className="flex flex-col justify-end">
          <span className="text-[10px] text-slate-500">
            選擇特定目標場次執行「智能選隊」將會篩選該場次有報名的玩家，並在篩選完成後直接將入選玩家指派出賽該場次。
          </span>
        </div>
      </div>
      
      {/* Martial Arts Configurations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <label className="text-[10px] font-bold text-slate-400">各武學配置人數 (留空或 0 代表不限制)</label>
          
          {/* Dynamic add dropdown */}
          {martialArts.some(ma => !smartActiveMas.includes(ma.name)) && (
            <select
              className="bg-[#0f172a] border border-slate-800 text-[10px] rounded-lg px-2.5 py-1.5 outline-none text-slate-300 font-bold hover:border-slate-700 transition-all cursor-pointer"
              onChange={(e) => {
                const val = e.target.value;
                if (val && !smartActiveMas.includes(val)) {
                  setSmartActiveMas(prev => [...prev, val]);
                  setSmartMaCounts(prev => ({ ...prev, [val]: 0 }));
                }
                e.target.value = '';
              }}
            >
              <option value="">+ 新增篩選武學</option>
              {martialArts.filter(ma => !smartActiveMas.includes(ma.name)).map(ma => (
                <option key={ma.name} value={ma.name}>{ma.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {smartActiveMas.map(maName => {
            const ma = martialArts.find(m => m.name === maName);
            if (!ma) return null;
            return (
              <div key={ma.name} className="flex items-center justify-between gap-2 p-2 bg-[#0f172a] rounded-xl border border-slate-800 hover:border-slate-700 transition-all group">
                <span className="text-[10px] font-bold text-slate-300 truncate flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ma.color }}></span>
                  {ma.name}
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    value={smartMaCounts[ma.name] === undefined ? '' : smartMaCounts[ma.name]}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value) || 0;
                      setSmartMaCounts(prev => ({ ...prev, [ma.name]: val === '' ? 0 : val }));
                    }}
                    className="w-12 p-1 text-center bg-[#020617] border border-[#1e293b] text-[10px] font-black text-white rounded-lg outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={() => {
                      setSmartActiveMas(prev => prev.filter(name => name !== ma.name));
                    }}
                    className="text-slate-500 hover:text-red-400 p-1 text-[10px] transition-colors"
                    title="移除此武學篩選"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
         <label className="flex items-center gap-2 p-2.5 bg-[#0f172a] hover:bg-slate-850 rounded-xl cursor-pointer transition-all border border-[#1e293b]">
           <input
             type="checkbox"
             checked={prioritizePower}
             onChange={(e) => setPrioritizePower(e.target.checked)}
             className="w-3.5 h-3.5 text-purple-600 focus:ring-purple-500 bg-[#020617] border-slate-700 rounded cursor-pointer"
           />
           <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5">
             <i className="fa-solid fa-bolt text-yellow-500"></i> 優先安排戰力指數高
           </span>
         </label>

         <label className="flex items-center gap-2 p-2.5 bg-[#0f172a] hover:bg-slate-850 rounded-xl cursor-pointer transition-all border border-[#1e293b]">
           <input
             type="checkbox"
             checked={prioritizeNoSelf}
             onChange={(e) => setPrioritizeNoSelf(e.target.checked)}
             className="w-3.5 h-3.5 text-purple-600 focus:ring-purple-500 bg-[#020617] border-slate-700 rounded cursor-pointer"
           />
           <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5">
             <i className="fa-solid fa-trophy text-yellow-500"></i> 優先安排無我
           </span>
         </label>

         <label className="flex items-center gap-2 p-2.5 bg-[#0f172a] hover:bg-slate-850 rounded-xl cursor-pointer transition-all border border-[#1e293b]">
           <input
             type="checkbox"
             checked={prioritizeDc}
             onChange={(e) => setPrioritizeDc(e.target.checked)}
             className="w-3.5 h-3.5 text-purple-600 focus:ring-purple-500 bg-[#020617] border-slate-700 rounded cursor-pointer"
           />
           <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5">
             <i className="fa-brands fa-discord text-indigo-400"></i> 優先安排有 DC
           </span>
         </label>

         <label className="flex items-center gap-2 p-2.5 bg-[#0f172a] hover:bg-slate-850 rounded-xl cursor-pointer transition-all border border-[#1e293b]">
           <input
             type="checkbox"
             checked={prioritizeMic}
             onChange={(e) => setPrioritizeMic(e.target.checked)}
             className="w-3.5 h-3.5 text-purple-600 focus:ring-purple-500 bg-[#020617] border-slate-700 rounded cursor-pointer"
           />
           <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5">
             <i className="fa-solid fa-microphone text-green-400"></i> 優先安排可開 Mic
           </span>
         </label>

         <label className={`flex items-center gap-2 p-2.5 bg-[#0f172a] rounded-xl border border-[#1e293b] transition-all ${(smartTargetSession === 'SAT_RK1' || smartTargetSession === 'SUN_RK1') ? 'opacity-40 cursor-not-allowed select-none' : 'hover:bg-slate-850 cursor-pointer'}`} title={(smartTargetSession === 'SAT_RK1' || smartTargetSession === 'SUN_RK1') ? "RK1 場次無上一場次可參考，故不適用此功能" : "適用於 NG 場次，自動將上一場被列為候補(或沒上場)的報名玩家提到最前排優先上場"}>
           <input
             type="checkbox"
             checked={prioritizePrevReserve}
             disabled={smartTargetSession === 'SAT_RK1' || smartTargetSession === 'SUN_RK1'}
             onChange={(e) => setPrioritizePrevReserve(e.target.checked)}
             className="w-3.5 h-3.5 text-purple-600 focus:ring-purple-500 bg-[#020617] border-slate-700 rounded cursor-pointer"
           />
           <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5">
             <i className={`fa-solid fa-redo text-purple-400 ${(smartTargetSession === 'SAT_RK1' || smartTargetSession === 'SUN_RK1') ? '' : 'animate-spin'}`}></i> 上一場候補優先上場 {(smartTargetSession === 'SAT_RK1' || smartTargetSession === 'SUN_RK1') && <span className="text-[8px] text-slate-500 font-medium">(RK1不適用)</span>}
           </span>
         </label>
       </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
        <span className="text-[10px] text-slate-500">
          符合各選取條件的玩家將被指派分配到 <span className="text-purple-400 font-bold">第一隊:進攻</span>，其餘未入選者歸類到 <span className="text-yellow-500 font-bold">候補</span> 隊伍。
        </span>
        <button
          disabled={isRestricted}
          onClick={handleRunSmartAssign}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-[11px] rounded-xl shadow-lg shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-55 cursor-pointer"
        >
          執行
        </button>
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
