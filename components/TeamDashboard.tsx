
import React, { useMemo, useState, useEffect, useRef, useCallback, memo } from 'react';
import { Player, TeamConfig, MartialArts } from '../types';
import { useMartialArtsFilter } from '../hooks/useMartialArtsFilter';
import { SESSION_LABELS } from '../constants';
import { useToast } from './Toast';
import { toPng } from 'html-to-image';
import { SmartAssignPanel } from './SmartAssignPanel';
import { ConfirmModal } from './ConfirmModal';

interface TeamCardProps {
  teamName: string;
  config: TeamConfig;
  teamData: { active: Record<string, Player[]>, inactive: Record<string, Player[]> };
  editingMissionTeam: string | null;
  setEditingMissionTeam: (name: string | null) => void;
  onUpdateDescription: (teamName: string, config: TeamConfig) => void;
  onMovePlayer: (playerId: string, targetTeam: string) => void;
  selectedPlayerIds: Set<string>;
  toggleSelect: (playerId: string, e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent, playerId: string) => void;
  onDrop: (e: React.DragEvent, teamName: string) => void;
  maFilter: string[];
  sessionFilter: string | null;
  getMaGroupPriority: (maKey: string) => number;
  isRestricted?: boolean;
  filterNoSelf?: boolean;
  filterDc?: boolean;
  filterMic?: boolean;
}

const TeamCard = memo(({
  teamName, config, teamData, editingMissionTeam, setEditingMissionTeam, onUpdateDescription, onMovePlayer, selectedPlayerIds, toggleSelect, onDragStart, onDrop, maFilter, sessionFilter, getMaGroupPriority, isRestricted, filterNoSelf, filterDc, filterMic
}: TeamCardProps) => {
  const activePlayers = Object.values(teamData.active).flat();
  const inactivePlayers = Object.values(teamData.inactive).flat();

  return (
    <div
      onDragOver={(e) => !isRestricted && e.preventDefault()}
      onDrop={(e) => !isRestricted && onDrop(e, teamName)}
      className={`flex flex-col h-full bg-[#0f172a] rounded-2xl shadow-xl border border-slate-800 overflow-hidden hover:border-blue-500/30 transition-all group ${isRestricted ? 'opacity-80 grayscale-[0.2]' : ''}`}
    >
      <div className="bg-[#020617] p-3 border-b border-slate-800 flex justify-between items-center">
        <span className="font-black text-xs tracking-widest text-slate-300">{teamName}</span>
        <div className="text-[10px] font-black text-blue-500/50 uppercase tracking-tighter">
          {activePlayers.length + inactivePlayers.length}人
        </div>
      </div>

      <div className="flex-1 p-3 bg-[#020617]/30 min-h-[140px] space-y-3">
        {/* ... player groups ... */}
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">人數</span>
          <span className="text-[10px] font-black text-blue-500">
            {activePlayers.length + inactivePlayers.length}人
            {sessionFilter && (
              <span className="ml-1 text-slate-500">(實到: {activePlayers.length})</span>
            )}
          </span>
        </div>
        
        <div className="space-y-3">
          {(Object.entries(teamData.active) as [string, Player[]][])
            .sort(([aKey], [bKey]) => getMaGroupPriority(aKey) - getMaGroupPriority(bKey))
            .map(([maKey, members]) => (
            <div key={maKey} className="space-y-1">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-l-2 border-slate-800 pl-2">
                {maKey}
              </div>
              <div className="flex flex-wrap gap-1">
                {members.map(p => {
                  const isFiltered = (maFilter.length > 0 && p.martialArts.some(ma => maFilter.includes(ma))) ||
                                     (filterNoSelf && p.noSelf) ||
                                     (filterDc && p.hasDc) ||
                                     (filterMic && p.canMic);
                  return (
                    <div
                      key={p.id}
                      id={`team-player-${p.id}`}
                      draggable={!isRestricted}
                      onDragStart={(e) => !isRestricted && onDragStart(e, p.id)}
                      onClick={(e) => !isRestricted && toggleSelect(p.id, e)}
                      className={`px-2 py-0.5 border rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1 ${
                        isRestricted 
                        ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                        : selectedPlayerIds.has(p.id)
                        ? 'bg-blue-600 border-blue-400 text-white ring-2 ring-blue-500/50 scale-[1.05] z-10 cursor-move'
                        : isFiltered 
                        ? 'bg-green-600/20 border-green-500 text-green-400 cursor-move' 
                        : 'bg-[#020617] border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-blue-500/50 cursor-move'
                      }`}
                    >
                      {(isFiltered || selectedPlayerIds.has(p.id)) && <i className={`fa-solid ${selectedPlayerIds.has(p.id) ? 'fa-check-circle' : 'fa-star'} text-[8px]`}></i>}
                      {p.gameId}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

              {Object.entries(teamData.inactive).length > 0 && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800/50 space-y-3 opacity-50">
                  <div className="text-[9px] font-black text-red-600 dark:text-red-500/50 uppercase tracking-widest text-center">
                    無法參加人員
                  </div>
                  {(Object.entries(teamData.inactive) as [string, Player[]][])
                    .sort(([aKey], [bKey]) => getMaGroupPriority(aKey) - getMaGroupPriority(bKey))
                    .map(([maKey, members]) => (
                    <div key={maKey} className="space-y-1">
                  <div className="text-[9px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-widest border-l-2 border-slate-200 dark:border-slate-900 pl-2">
                    {maKey}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {members.map(p => (
                      <div
                        key={p.id}
                        id={`team-player-${p.id}`}
                        draggable={!isRestricted}
                        onDragStart={(e) => !isRestricted && onDragStart(e, p.id)}
                        onClick={(e) => !isRestricted && toggleSelect(p.id, e)}
                        className={`px-2 py-0.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-600 grayscale ${isRestricted ? 'cursor-not-allowed' : 'cursor-move'}`}
                      >
                        {p.gameId}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#020617] p-3 border-t border-slate-800 space-y-2">
        {editingMissionTeam === teamName && !isRestricted ? (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <textarea
              autoFocus
              value={config.mission}
              onChange={(e) => onUpdateDescription(teamName, { ...config, mission: e.target.value })}
              onBlur={() => setEditingMissionTeam(null)}
              className="w-full bg-[#0f172a] text-[10px] text-slate-300 p-2 border border-blue-500/50 rounded h-24 outline-none shadow-[0_0_10px_rgba(59,130,246,0.1)]"
              placeholder="輸入主要任務內容..."
            />
            <div className="text-[8px] text-blue-500 font-bold mt-1 text-right uppercase tracking-widest">
              點擊外部以儲存
            </div>
          </div>
        ) : (
          <div 
            onClick={() => !isRestricted && setEditingMissionTeam(teamName)}
            className={`p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl hover:border-blue-500/40 hover:bg-blue-500/10 transition-all cursor-pointer group/mission ${isRestricted ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-black text-blue-600 dark:text-blue-400 uppercase text-[9px] tracking-widest">主要任務</span>
              {!isRestricted && <i className="fa-solid fa-pen text-[8px] text-blue-600/0 dark:text-blue-500/0 group-hover/mission:text-blue-600 dark:group-hover/mission:text-blue-500/50 transition-all"></i>}
            </div>
            <pre className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 font-sans leading-relaxed text-[10px]">
              {config.mission || '點擊設定任務內容...'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
});

interface TeamDashboardProps {
  players: Player[];
  onMovePlayer: (playerId: string, targetTeam: string) => void;
  onUpdatePlayers: (updates: { id: string; team: string }[], sessionFilter?: string | null) => void;
  onResetTeams: () => void;
  onUpdateDescription: (teamName: string, config: TeamConfig) => void;
  teams: string[];
  teamDescriptions: Record<string, TeamConfig>;
  martialArts: MartialArts[];
  isRestricted?: boolean;
}

export const TeamDashboard: React.FC<TeamDashboardProps> = ({ 
  players, 
  onMovePlayer, 
  onUpdatePlayers,
  onResetTeams,
  onUpdateDescription,
  teams,
  teamDescriptions,
  martialArts,
  isRestricted
}) => {
  const [editingMissionTeam, setEditingMissionTeam] = useState<string | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [sessionFilter, setSessionFilter] = useState<string | null>('SAT_RK1');
  const [activeMas, setActiveMas] = useState<string[]>(["無名劍法", "嗟夫刀法", "青山執筆", "明川藥典"]);

  const [filterNoSelf, setFilterNoSelf] = useState(false);
  const [filterDc, setFilterDc] = useState(false);
  const [filterMic, setFilterMic] = useState(false);

  const [statusStates, setStatusStates] = useState<Record<string, 'none' | 'mark' | 'select'>>({
    noSelf: 'none',
    hasDc: 'none',
    canMic: 'none'
  });

  const [showSmartAssign, setShowSmartAssign] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  
  const {
    maFilter,
    setMaFilter,
    maStates,
    setMaStates,
    showSummary,
    setShowSummary,
    popupPos,
    filterBtnRef,
    handleMouseDown,
    filteredPlayers,
    toggleFilter,
    clearFilter,
    toggleSummary,
    closeSummaryManually,
    getMatchingPlayerIds,
    getDeselectPlayerIds
  } = useMartialArtsFilter(players, teams);

  const handleExportPNG = async () => {
    if (!exportRef.current) return;
    
    showToast("正在整理編制名單並產生PNG圖檔...", "info");
    
    try {
      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        style: {
          opacity: '1',
          visibility: 'visible',
        }
      });
      
      const link = document.createElement('a');
      const sessionLabel = sessionFilter ? SESSION_LABELS[sessionFilter.replace('SAT_', '').replace('SUN_', '')] || sessionFilter : '預設場次';
      const cleanSessionName = sessionFilter ? (sessionFilter.startsWith('SAT_') ? '週六' : '週日') + '_' + sessionFilter.replace('SAT_', '').replace('SUN_', '') : '全部';
      link.download = `隊伍編制_${cleanSessionName}_${sessionLabel}.png`;
      link.href = dataUrl;
      link.click();
      showToast("隊伍PNG圖片下載成功！", "success");
    } catch (error) {
      console.error('Export PNG failed:', error);
      showToast("產生PNG圖片時發生錯誤，請重試", "error");
    }
  };

  const handleResetCurrentSessionTeams = useCallback(() => {
    if (players.length === 0) return;
    
    const sessionLabel = sessionFilter 
      ? (sessionFilter.startsWith('SAT_') ? '週六 ' : '週日 ') + sessionFilter.replace('SAT_', '').replace('SUN_', '') 
      : '當前場次';
      
    setConfirmConfig({
      isOpen: true,
      title: '確認重製當前場次隊伍',
      message: `此操作將會重置「${sessionLabel}」的所有人員分配，將他們全部移動至【候補】隊伍。您確定要執行此操作嗎？`,
      onConfirm: () => {
        const updates = players.map(p => ({ id: p.id, team: '候補' }));
        onUpdatePlayers(updates, sessionFilter);
        showToast(`已重製 ${sessionLabel} 的所有人員分配至候補`, "success");
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, [players, sessionFilter, onUpdatePlayers, showToast]);

  const displayedFilteredPlayers = useMemo(() => {
    let list = filteredPlayers;
    if (maFilter.length === 0 && (filterNoSelf || filterDc || filterMic)) {
      list = players;
    }
    if (filterNoSelf) {
      list = list.filter(p => p.noSelf === true);
    }
    if (filterDc) {
      list = list.filter(p => p.hasDc === true);
    }
    if (filterMic) {
      list = list.filter(p => p.canMic === true);
    }
    return list;
  }, [filteredPlayers, players, maFilter, filterNoSelf, filterDc, filterMic]);

  const groupedPlayers = useMemo(() => {
    const groups: Record<string, { active: Record<string, Player[]>, inactive: Record<string, Player[]> }> = {};
    
    // Initialize groups
    teams.forEach(t => {
      groups[t] = { active: {}, inactive: {} };
    });

    // Single pass through players
    players.forEach(p => {
      let currentTeam = p.team || '候補';
      let isAvailable = true;

      if (sessionFilter) {
        const isSat = sessionFilter.startsWith('SAT_');
        const sessionKey = sessionFilter.replace('SAT_', '').replace('SUN_', '');
        
        const registeredSessions = isSat 
          ? (p.satSessions || (p.satAvailability === 'YES' ? ['RK1', 'NG1', 'NG2', 'NG3', 'NG4'] : []))
          : (p.sunSessions || (p.sunAvailability === 'YES' ? ['RK1', 'NG1', 'NG2', 'NG3', 'NG4'] : []));
        
        isAvailable = registeredSessions.includes(sessionKey);

        const assigned = p.assignedSessions || [];
        const isAssignedToThisSession = assigned.includes(sessionFilter);

        if (isAssignedToThisSession) {
          currentTeam = p.teamBySession?.[sessionFilter] || '第一隊:進攻';
        } else {
          currentTeam = '候補';
        }
      }

      if (!groups[currentTeam]) return;

      const maKey = [...p.martialArts].sort().join(' + ') || '未設定武學';
      const targetGroup = isAvailable ? groups[currentTeam].active : groups[currentTeam].inactive;
      if (!targetGroup[maKey]) targetGroup[maKey] = [];
      targetGroup[maKey].push(p);
    });

    return groups;
  }, [players, teams, sessionFilter]);

  const scrollToPlayer = (id: string) => {
    const element = document.getElementById(`team-player-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-4', 'ring-blue-500', 'ring-offset-4', 'ring-offset-white', 'dark:ring-offset-slate-900', 'scale-110', 'z-50');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-blue-500', 'ring-offset-4', 'ring-offset-white', 'dark:ring-offset-slate-900', 'scale-110', 'z-50');
      }, 2000);
    }
  };

  const handleDragStart = (e: React.DragEvent, playerId: string) => {
    let idsToMove = [playerId];
    if (selectedPlayerIds.has(playerId)) {
      idsToMove = Array.from(selectedPlayerIds);
    }
    e.dataTransfer.setData('playerIds', JSON.stringify(idsToMove));
  };

  const handleDrop = (e: React.DragEvent, teamName: string) => {
    e.preventDefault();
    const playerIdsStr = e.dataTransfer.getData('playerIds');
    if (playerIdsStr) {
      const ids = JSON.parse(playerIdsStr) as string[];
      ids.forEach(id => onMovePlayer(id, teamName, sessionFilter));
      setSelectedPlayerIds(new Set());
    }
  };

  const toggleSelect = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedPlayerIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedPlayerIds(newSet);
  }, [selectedPlayerIds]);

  const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);

  const getMaCount = useCallback((maName: string) => {
    return players.filter(p => p.martialArts.includes(maName)).length;
  }, [players]);

  const handleFilterToggle = useCallback((maName: string) => {
    const currentState = maStates[maName] || 'none';

    if (currentState === 'none') {
      // 1st click: Mark
      toggleFilter(maName);
      setMaStates(prev => ({ ...prev, [maName]: 'mark' }));
    } else if (currentState === 'mark') {
      // 2nd click: Select
      setMaStates(prev => ({ ...prev, [maName]: 'select' }));
      const matchingIds = getMatchingPlayerIds(maName);
      const newSelected = new Set(selectedPlayerIds);
      matchingIds.forEach(id => newSelected.add(id));
      setSelectedPlayerIds(newSelected);
    } else {
      // 3rd click: Cancel both
      toggleFilter(maName);
      setMaStates(prev => ({ ...prev, [maName]: 'none' }));
      const playersToDeselect = getDeselectPlayerIds(maName, maFilter);
      const newSelected = new Set(selectedPlayerIds);
      playersToDeselect.forEach(id => newSelected.delete(id));
      setSelectedPlayerIds(newSelected);
    }
  }, [maFilter, maStates, toggleFilter, setMaStates, getMatchingPlayerIds, selectedPlayerIds, getDeselectPlayerIds]);

  const handleMaBlockClick = useCallback((maName: string) => {
    handleFilterToggle(maName);
  }, [handleFilterToggle]);

  const handleStatusToggle = useCallback((statusKey: 'noSelf' | 'hasDc' | 'canMic') => {
    const currentState = statusStates[statusKey] || 'none';
    const newStates = { ...statusStates };

    if (currentState === 'none') {
      // 1st click: Mark as filter
      newStates[statusKey] = 'mark';
      setStatusStates(newStates);
      if (statusKey === 'noSelf') setFilterNoSelf(true);
      if (statusKey === 'hasDc') setFilterDc(true);
      if (statusKey === 'canMic') setFilterMic(true);
    } else if (currentState === 'mark') {
      // 2nd click: Select matching players
      newStates[statusKey] = 'select';
      setStatusStates(newStates);
      
      const matchingIds = players
        .filter(p => {
          if (statusKey === 'noSelf') return p.noSelf === true;
          if (statusKey === 'hasDc') return p.hasDc === true;
          if (statusKey === 'canMic') return p.canMic === true;
          return false;
        })
        .map(p => p.id);
        
      const newSelected = new Set(selectedPlayerIds);
      matchingIds.forEach(id => newSelected.add(id));
      setSelectedPlayerIds(newSelected);
    } else {
      // 3rd click: Clear both mark and select
      newStates[statusKey] = 'none';
      setStatusStates(newStates);
      
      if (statusKey === 'noSelf') setFilterNoSelf(false);
      if (statusKey === 'hasDc') setFilterDc(false);
      if (statusKey === 'canMic') setFilterMic(false);
      
      const matchingIds = players
        .filter(p => {
          if (statusKey === 'noSelf') return p.noSelf === true;
          if (statusKey === 'hasDc') return p.hasDc === true;
          if (statusKey === 'canMic') return p.canMic === true;
          return false;
        })
        .map(p => p.id);
        
      const newSelected = new Set(selectedPlayerIds);
      matchingIds.forEach(id => newSelected.delete(id));
      setSelectedPlayerIds(newSelected);
    }
  }, [statusStates, players, selectedPlayerIds]);

  const handleClearFilter = useCallback(() => {
    clearFilter();
    setFilterNoSelf(false);
    setFilterDc(false);
    setFilterMic(false);
    setStatusStates({ noSelf: 'none', hasDc: 'none', canMic: 'none' });
    setSelectedPlayerIds(new Set());
  }, [clearFilter]);

  const maPriority = useMemo(() => {
    return {
      '嗟夫刀法': 1,
      '明川藥典': 2,
      '無名劍法': 3
    };
  }, []);

  const getMaGroupPriority = useCallback((maKey: string) => {
    if (maKey === '未設定武學') return 999;
    
    // Check if any of the martial arts in the key are in the priority list
    const arts = maKey.split(' + ');
    let minPriority = Infinity;
    
    arts.forEach(art => {
      const priority = maPriority[art as keyof typeof maPriority];
      if (priority !== undefined && priority < minPriority) {
        minPriority = priority;
      }
    });
    
    return minPriority === Infinity ? 100 : minPriority;
  }, [maPriority]);

  return (
    <div className="space-y-4">
      <div className="bg-[#0f172a] border border-slate-800 p-3 rounded-2xl shadow-2xl flex flex-col gap-3">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-black flex items-center gap-2 text-white">
              <i className="fa-solid fa-microchip text-blue-500"></i>
              隊伍分配
            </h2>
            <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-400 text-[9px] font-black tracking-widest uppercase">
              TOTAL: {players.length} 人
            </div>
          </div>

          {/* Session Filter */}
          <div className="flex flex-nowrap items-center gap-2 bg-[#020617] p-1 px-2.5 rounded-lg border border-slate-800/80 shadow-inner w-full xl:w-auto overflow-x-auto no-scrollbar">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider shrink-0">選擇場次:</span>
            <div className="flex flex-nowrap items-center gap-2">
              {/* Saturday Row Wrap */}
              <div className="flex items-center gap-1.5 bg-indigo-950/20 border border-indigo-500/10 p-0.5 px-1.5 rounded-lg shrink-0">
                <span className="text-[9px] font-black text-indigo-400 shrink-0">週六場:</span>
                <div className="flex items-center gap-1">
                  {['RK1', 'NG1', 'NG2', 'NG3', 'NG4'].map(sessionKey => {
                    const filterVal = `SAT_${sessionKey}`;
                    const label = SESSION_LABELS[sessionKey] || '';
                    const isSelected = sessionFilter === filterVal;
                    return (
                      <div key={sessionKey} className="relative group">
                        <button
                          type="button"
                          onClick={() => setSessionFilter(filterVal)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black transition-all border ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                              : 'bg-[#0f172a] border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                          } ${
                            sessionKey === 'RK1'
                              ? (isSelected ? 'text-yellow-300' : 'text-amber-550/80 hover:text-amber-400')
                              : (isSelected ? 'text-cyan-200' : 'text-cyan-500/80 hover:text-cyan-400')
                          }`}
                        >
                          {sessionKey}
                        </button>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 bg-[#1e293b] border border-slate-700 rounded-md text-[9px] font-black text-slate-300 w-max invisible group-hover:visible group-hover:opacity-100 opacity-0 transition-all z-50 pointer-events-none shadow-xl">
                          {label}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1e293b]"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sunday Row Wrap */}
              <div className="flex items-center gap-1.5 bg-teal-950/20 border border-teal-500/10 p-0.5 px-1.5 rounded-lg shrink-0">
                <span className="text-[9px] font-black text-teal-400 shrink-0">週日場:</span>
                <div className="flex items-center gap-1">
                  {['RK1', 'NG1', 'NG2', 'NG3', 'NG4'].map(sessionKey => {
                    const filterVal = `SUN_${sessionKey}`;
                    const label = SESSION_LABELS[sessionKey] || '';
                    const isSelected = sessionFilter === filterVal;
                    return (
                      <div key={sessionKey} className="relative group">
                        <button
                          type="button"
                          onClick={() => setSessionFilter(filterVal)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black transition-all border ${
                            isSelected
                              ? 'bg-teal-600 border-teal-500 text-white shadow'
                              : 'bg-[#0f172a] border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                          } ${
                            sessionKey === 'RK1'
                              ? (isSelected ? 'text-yellow-300' : 'text-amber-500/80 hover:text-amber-400')
                              : (isSelected ? 'text-cyan-200' : 'text-cyan-500/80 hover:text-cyan-400')
                          }`}
                        >
                          {sessionKey}
                        </button>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 bg-[#1e293b] border border-slate-700 rounded-md text-[9px] font-black text-slate-300 w-max invisible group-hover:visible group-hover:opacity-100 opacity-0 transition-all z-50 pointer-events-none shadow-xl">
                          {label}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1e293b]"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Martial Arts Filter Section */}
        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <i className="fa-solid fa-filter text-blue-500"></i>
                  武學人數與標記
                </span>
                {(maFilter.length > 0 || statusStates.noSelf !== 'none' || statusStates.hasDc !== 'none' || statusStates.canMic !== 'none') && (
                  <div className="flex items-center gap-1.5">
                    {maFilter.length > 0 && (
                      <button 
                        ref={filterBtnRef}
                        onClick={toggleSummary}
                        className="text-[9px] font-bold text-blue-400 hover:text-white flex items-center gap-1.5 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20 transition-all"
                      >
                        <i className="fa-solid fa-list-check"></i>
                        人員清單 ({filteredPlayers.length})
                      </button>
                    )}
                    <button 
                      onClick={handleClearFilter}
                      className="text-[9px] font-bold text-red-500 hover:text-white flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20 transition-all cursor-pointer"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                      清除標記 ({maFilter.length + (statusStates.noSelf !== 'none' ? 1 : 0) + (statusStates.hasDc !== 'none' ? 1 : 0) + (statusStates.canMic !== 'none' ? 1 : 0)})
                    </button>
                  </div>
                )}
              </div>

              {/* Dropdown to add more displayed martial arts */}
              {martialArts.some(ma => !activeMas.includes(ma.name)) && (
                <select
                  className="bg-[#020617] border border-slate-800 text-[9px] rounded-md px-2 py-1 outline-none font-bold hover:border-slate-700 transition-all cursor-pointer text-slate-355 text-slate-300"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !activeMas.includes(val)) {
                      setActiveMas(prev => [...prev, val]);
                    }
                    e.target.value = '';
                  }}
                >
                  <option value="">+ 新增顯示武學</option>
                  {martialArts.filter(ma => !activeMas.includes(ma.name)).map(ma => (
                    <option key={ma.name} value={ma.name}>{ma.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {activeMas.map(maName => {
              const ma = martialArts.find(m => m.name === maName);
              if (!ma) return null;
              const isSelected = maFilter.includes(maName);
              const state = maStates[maName] || 'none';
              return (
                <div
                  key={maName}
                  onClick={() => handleMaBlockClick(maName)}
                  className={`cursor-pointer flex items-center justify-between gap-1.5 p-2 rounded-lg border transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500 text-white shadow shadow-blue-500/10'
                      : 'bg-[#020617] border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: ma.color }}></span>
                    <span className="text-[11px] font-bold truncate">
                      {ma.name}
                      {state === 'mark' && <span className="ml-1 text-[8px] text-amber-500 font-bold">(標)</span>}
                      {state === 'select' && <span className="ml-1 text-[8px] text-blue-400 font-bold">(選)</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                      isSelected ? 'bg-blue-500 text-white' : 'bg-[#0f172a] text-slate-400'
                    }`}>
                      {getMaCount(maName)}人
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMas(prev => prev.filter(name => name !== maName));
                        if (maFilter.includes(maName)) {
                          setMaFilter(p => p.filter(n => n !== maName));
                        }
                      }}
                      className="text-slate-500 hover:text-red-400 p-0.5 text-xs transition-colors cursor-pointer"
                      title="隱藏此武學"
                    >
                      <i className="fa-solid fa-xmark text-[10px]"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Filter Section */}
        <div className="flex flex-col gap-2 w-full border-t border-slate-800/60 pt-3">
          <div className="flex items-center gap-4">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-user-gear text-blue-500"></i>
              狀態人數與標記
            </h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {[
              { key: 'noSelf', label: '無我', iconClass: 'fa-solid fa-trophy text-yellow-500' },
              { key: 'hasDc', label: '有 DC', iconClass: 'fa-brands fa-discord text-indigo-400' },
              { key: 'canMic', label: '可開 Mic', iconClass: 'fa-solid fa-microphone text-green-400' }
            ].map(statusItem => {
              const statusKey = statusItem.key as 'noSelf' | 'hasDc' | 'canMic';
              const count = players.filter(p => {
                if (statusKey === 'noSelf') return p.noSelf === true;
                if (statusKey === 'hasDc') return p.hasDc === true;
                if (statusKey === 'canMic') return p.canMic === true;
                return false;
              }).length;
              const state = statusStates[statusKey] || 'none';
              const isSelected = state !== 'none';
              return (
                <div
                  key={statusKey}
                  onClick={() => handleStatusToggle(statusKey)}
                  className={`cursor-pointer flex items-center justify-between gap-1.5 p-2 rounded-lg border transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500 text-white shadow shadow-blue-500/10'
                      : 'bg-[#020617] border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <i className={`text-[10px] shrink-0 ${statusItem.iconClass}`}></i>
                    <span className="text-[11px] font-bold truncate">
                      {statusItem.label}
                      {state === 'mark' && <span className="ml-1 text-[8px] text-amber-500 font-bold">(標)</span>}
                      {state === 'select' && <span className="ml-1 text-[8px] text-blue-400 font-bold">(選)</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                      isSelected ? 'bg-blue-500 text-white' : 'bg-[#0f172a] text-slate-400'
                    }`}>
                      {count}人
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Configuration Action Buttons Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#020617] p-2.5 px-3.5 rounded-xl border border-slate-800/80 mt-1">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-[9px] font-black text-purple-400 uppercase tracking-tighter shrink-0">配置功能</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowSmartAssign(!showSmartAssign)}
                className="px-3 h-8 bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-bold rounded-lg transition-all shadow flex items-center justify-center gap-1 cursor-pointer"
              >
                <i className="fa-solid fa-brain"></i>
                輔助選隊
              </button>
              <button
                type="button"
                onClick={handleExportPNG}
                className="px-3 h-8 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-bold rounded-lg transition-all shadow flex items-center justify-center gap-1 cursor-pointer"
              >
                <i className="fa-solid fa-file-image"></i>
                匯出隊伍 (PNG)
              </button>
              <button
                type="button"
                onClick={handleResetCurrentSessionTeams}
                disabled={isRestricted}
                className="px-3 h-8 bg-red-600 hover:bg-red-500 text-white text-[9px] font-bold rounded-lg transition-all shadow disabled:opacity-50 cursor-pointer"
              >
                重製隊伍
              </button>
            </div>
          </div>
        </div>
        </div>

          {/* Draggable Summary Popup */}
          {showSummary && maFilter.length > 0 && (
            <div 
              style={{ 
                position: 'fixed',
                left: popupPos.x,
                top: popupPos.y,
                zIndex: 9999
              }}
              className="draggable-popup w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
              <div 
                onMouseDown={handleMouseDown}
                className="bg-slate-50 dark:bg-slate-950 p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center cursor-move select-none"
              >
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-grip-vertical text-slate-400 dark:text-slate-600 text-[10px]"></i>
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400 tracking-widest uppercase">篩選清單</span>
                </div>
                <button 
                  onClick={closeSummaryManually} 
                  className="text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                {displayedFilteredPlayers.length === 0 ? (
                  <div className="p-4 text-center text-[10px] text-slate-500 dark:text-slate-600 font-bold italic">無相符人員</div>
                ) : (
                  displayedFilteredPlayers.map(p => (
                    <button
                      key={p.id}
                      onClick={() => scrollToPlayer(p.id)}
                      className="w-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group text-left space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-800 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate max-w-[120px]">
                          {p.gameId}
                        </span>
                        <span className="text-[9px] font-bold bg-white dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-500 group-hover:border-blue-500/30 group-hover:text-blue-500">
                          {p.team}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {p.martialArts.map(ma => {
                          const maObj = martialArts.find(m => m.name === ma);
                          return (
                            <span key={ma} className="inline-flex items-center gap-0.5 px-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[8px] font-bold text-slate-500">
                              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: maObj?.color }}></span>
                              {ma}
                            </span>
                          );
                        })}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
 
      <div className="grid grid-cols-1 xl:grid-cols-5 lg:grid-cols-3 md:grid-cols-2 gap-5">
        {teams.map(teamName => {
          const config = teamDescriptions[teamName] || { name: teamName, role: '', mission: '', details: '' };
          const teamData = (groupedPlayers[teamName] as any) || { active: {}, inactive: {} };

          return (
            <TeamCard 
              key={teamName}
              teamName={teamName}
              config={config}
              teamData={teamData}
              editingMissionTeam={editingMissionTeam}
              setEditingMissionTeam={setEditingMissionTeam}
              onUpdateDescription={onUpdateDescription}
              onMovePlayer={onMovePlayer}
              selectedPlayerIds={selectedPlayerIds}
              toggleSelect={toggleSelect}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              maFilter={maFilter}
              sessionFilter={sessionFilter}
              getMaGroupPriority={getMaGroupPriority}
              filterNoSelf={filterNoSelf}
              filterDc={filterDc}
              filterMic={filterMic}
            />
          );
        })}
      </div>

      {/* Hidden export template for PNG */}
      <div className="absolute -left-[9999px] top-0 opacity-0 pointer-events-none">
        <div 
          ref={exportRef} 
          className="w-[800px] p-8 bg-[#020617] text-white flex flex-col gap-6"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          {/* Header */}
          <div className="border-b border-slate-800 pb-4 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-black tracking-wide text-white flex items-center gap-2">
                ⚔️ WWM 百業戰隊伍編制
              </h1>
              <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-bold">
                系統自動整理輸出 ‧ {new Date().toLocaleString('zh-TW')}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-black bg-blue-500/15 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-full uppercase tracking-widest">
                {sessionFilter ? (sessionFilter.startsWith('SAT_') ? '週六 ' : '週日 ') + sessionFilter.replace('SAT_', '').replace('SUN_', '') : '預設場次'}
              </span>
              <div className="text-[10px] text-slate-400 font-bold mt-1.5">
                {sessionFilter ? SESSION_LABELS[sessionFilter.replace('SAT_', '').replace('SUN_', '')] : ''}
              </div>
            </div>
          </div>

          {/* Grid of nonempty teams */}
          <div className="grid grid-cols-2 gap-4">
            {teams
              .filter(teamName => {
                const teamData = groupedPlayers[teamName] || { active: {}, inactive: {} };
                const activePlayersCount = Object.values(teamData.active).flat().length;
                const inactivePlayersCount = Object.values(teamData.inactive).flat().length;
                return activePlayersCount + inactivePlayersCount > 0;
              })
              .map(teamName => {
                const teamData = groupedPlayers[teamName];
                const activePlayers = Object.values(teamData.active).flat() as Player[];
                const inactivePlayers = Object.values(teamData.inactive).flat() as Player[];
                const config = teamDescriptions[teamName] || { name: teamName, role: '', mission: '', details: '' };

                return (
                  <div key={teamName} className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-lg">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="font-black text-sm tracking-widest text-[#60a5fa]">{teamName}</span>
                      <span className="text-[11px] font-black bg-slate-900 border border-slate-800 rounded-full py-0.5 px-2 text-slate-400">
                        {activePlayers.length + inactivePlayers.length} 人
                      </span>
                    </div>

                    {/* Mission */}
                    {config.mission && (
                      <div className="p-2.5 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-1">主要任務</span>
                        <p className="text-[9px] text-slate-300 font-medium leading-relaxed font-sans min-h-[16px] whitespace-pre-wrap">
                          {config.mission}
                        </p>
                      </div>
                    )}

                    {/* Active List */}
                    <div className="space-y-3">
                      {(Object.entries(teamData.active) as [string, Player[]][])
                        .sort(([aKey], [bKey]) => getMaGroupPriority(aKey) - getMaGroupPriority(bKey))
                        .map(([maKey, members]) => (
                          <div key={maKey} className="space-y-1">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-slate-700 pl-2">
                              {maKey} ({members.length}人)
                            </div>
                            <div className="text-[11px] font-bold text-slate-200 pl-2.5 leading-relaxed">
                              {members.map(p => p.gameId).join('、')}
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Inactive List */}
                    {inactivePlayers.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/60 mt-1 opacity-50">
                        <div className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1 pl-1">
                          無法參加人員
                        </div>
                        <div className="text-[11px] font-bold text-slate-400 pl-1.5 leading-relaxed">
                          {inactivePlayers.map(p => p.gameId).join('、')}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-[9px] text-slate-500 font-bold tracking-wider">
            <span>WWM 百業戰 ‧ 戰力指派圖</span>
            <span>由系統安全產出，無涉及個人隱私敏感資訊</span>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
