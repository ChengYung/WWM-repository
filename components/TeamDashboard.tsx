
import React, { useMemo, useState, useEffect, useRef, useCallback, memo } from 'react';
import { Player, TeamConfig, MartialArts } from '../types';
import { useMartialArtsFilter } from '../hooks/useMartialArtsFilter';

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
  sessionFilter: 'SAT' | 'SUN' | null;
  getMaGroupPriority: (maKey: string) => number;
  isRestricted?: boolean;
}

const TeamCard = memo(({
  teamName, config, teamData, editingMissionTeam, setEditingMissionTeam, onUpdateDescription, onMovePlayer, selectedPlayerIds, toggleSelect, onDragStart, onDrop, maFilter, sessionFilter, getMaGroupPriority, isRestricted
}: TeamCardProps) => {
  const activePlayers = Object.values(teamData.active).flat();
  const inactivePlayers = Object.values(teamData.inactive).flat();

  return (
    <div
      onDragOver={(e) => !isRestricted && e.preventDefault()}
      onDrop={(e) => !isRestricted && onDrop(e, teamName)}
      className={`flex flex-col h-full bg-[#0f172a] rounded-2xl shadow-xl border border-slate-800 overflow-hidden hover:border-blue-500/30 transition-all group ${isRestricted ? 'opacity-80 grayscale-[0.2]' : ''}`}
    >
      <div className="bg-[#020617] p-4 border-b border-slate-800 flex justify-between items-center">
        <span className="font-black text-xs tracking-widest text-slate-300">{teamName}</span>
        <div className="text-[10px] font-black text-blue-500/50 uppercase tracking-tighter">
          {activePlayers.length + inactivePlayers.length}人
        </div>
      </div>

      <div className="flex-1 p-4 bg-[#020617]/30 min-h-[160px] space-y-4">
        {/* ... player groups ... */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">人數</span>
          <span className="text-[10px] font-black text-blue-500">
            {activePlayers.length + inactivePlayers.length}人
            {sessionFilter && (
              <span className="ml-1 text-slate-500">(實到: {activePlayers.length})</span>
            )}
          </span>
        </div>
        
        <div className="space-y-4">
          {(Object.entries(teamData.active) as [string, Player[]][])
            .sort(([aKey], [bKey]) => getMaGroupPriority(aKey) - getMaGroupPriority(bKey))
            .map(([maKey, members]) => (
            <div key={maKey} className="space-y-1.5">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-l-2 border-slate-800 pl-2">
                {maKey}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {members.map(p => {
                  const isFiltered = maFilter.length > 0 && p.martialArts.some(ma => maFilter.includes(ma));
                  return (
                    <div
                      key={p.id}
                      id={`team-player-${p.id}`}
                      draggable={!isRestricted}
                      onDragStart={(e) => !isRestricted && onDragStart(e, p.id)}
                      onClick={(e) => !isRestricted && toggleSelect(p.id, e)}
                      className={`px-2 py-1 border rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1 ${
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
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800/50 space-y-4 opacity-50">
                  <div className="text-[9px] font-black text-red-600 dark:text-red-500/50 uppercase tracking-widest text-center">
                    無法參加人員
                  </div>
                  {(Object.entries(teamData.inactive) as [string, Player[]][])
                    .sort(([aKey], [bKey]) => getMaGroupPriority(aKey) - getMaGroupPriority(bKey))
                    .map(([maKey, members]) => (
                    <div key={maKey} className="space-y-1.5">
                  <div className="text-[9px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-widest border-l-2 border-slate-200 dark:border-slate-900 pl-2">
                    {maKey}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {members.map(p => (
                      <div
                        key={p.id}
                        id={`team-player-${p.id}`}
                        draggable={!isRestricted}
                        onDragStart={(e) => !isRestricted && onDragStart(e, p.id)}
                        onClick={(e) => !isRestricted && toggleSelect(p.id, e)}
                        className={`px-2 py-1 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-600 grayscale ${isRestricted ? 'cursor-not-allowed' : 'cursor-move'}`}
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

      <div className="bg-[#020617] p-4 border-t border-slate-800 space-y-3">
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
  onUpdatePlayers: (updates: { id: string; team: string }[]) => void;
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
  const [bulkSource, setBulkSource] = useState(teams.includes('候補') ? '候補' : teams[teams.length - 1]);
  const [bulkTarget, setBulkTarget] = useState(teams[0]);
  const [targetTeam, setTargetTeam] = useState(teams[0]);
  const [sessionFilter, setSessionFilter] = useState<'SAT' | 'SUN' | null>(null);
  
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

  const groupedPlayers = useMemo(() => {
    const groups: Record<string, { active: Record<string, Player[]>, inactive: Record<string, Player[]> }> = {};
    
    // Initialize groups
    teams.forEach(t => {
      groups[t] = { active: {}, inactive: {} };
    });

    // Single pass through players
    players.forEach(p => {
      if (!groups[p.team]) return;

      const maKey = [...p.martialArts].sort().join(' + ') || '未設定武學';
      
      let isAvailable = true;
      if (sessionFilter === 'SAT') isAvailable = p.satAvailability === 'YES';
      if (sessionFilter === 'SUN') isAvailable = p.sunAvailability === 'YES';

      const targetGroup = isAvailable ? groups[p.team].active : groups[p.team].inactive;
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
      ids.forEach(id => onMovePlayer(id, teamName));
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

  const unassignedCount = useMemo(() => {
    return players.filter(p => p.team === '候補').length;
  }, [players]);

  const handleBulkAssign = useCallback(() => {
    if (selectedPlayerIds.size === 0) return;
    const updates = Array.from(selectedPlayerIds).map(id => ({ id, team: targetTeam }));
    onUpdatePlayers(updates);
    setSelectedPlayerIds(new Set());
  }, [selectedPlayerIds, targetTeam, onUpdatePlayers]);

  const handleAssignUnassigned = useCallback(() => {
    const unassignedPlayers = players.filter(p => p.team === '候補');
    if (unassignedPlayers.length === 0) return;
    const updates = unassignedPlayers.map(p => ({ id: p.id, team: targetTeam }));
    onUpdatePlayers(updates);
  }, [players, targetTeam, onUpdatePlayers]);

  const handleBulkTeamMove = useCallback(() => {
    const playersToMove = players.filter(p => p.team === bulkSource);
    playersToMove.forEach(p => onMovePlayer(p.id, bulkTarget));
  }, [players, bulkSource, bulkTarget, onMovePlayer]);

  const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);

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

  const handleClearFilter = useCallback(() => {
    clearFilter();
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
    <div className="space-y-6">
      <div className="bg-[#0f172a] border border-slate-800 p-4 md:p-6 rounded-3xl shadow-2xl flex flex-col gap-6">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-xl font-black flex items-center gap-3 text-white">
              <i className="fa-solid fa-microchip text-blue-500"></i>
              隊伍分配
            </h2>
            <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full text-blue-400 text-[10px] font-black tracking-widest uppercase">
              TOTAL: {players.length} 人
            </div>
          </div>

          {/* Management Controls */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 w-full xl:w-auto">
            {/* Session Filter */}
            <div className="flex items-center gap-2 bg-[#020617] p-1.5 rounded-2xl border border-slate-800 shadow-inner">
              <button
                onClick={() => setSessionFilter(null)}
                className={`flex-1 px-3 py-2 rounded-xl text-[9px] font-black transition-all ${!sessionFilter ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                全部
              </button>
              <button
                onClick={() => setSessionFilter('SAT')}
                className={`flex-1 px-3 py-2 rounded-xl text-[9px] font-black transition-all ${sessionFilter === 'SAT' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                週六
              </button>
              <button
                onClick={() => setSessionFilter('SUN')}
                className={`flex-1 px-3 py-2 rounded-xl text-[9px] font-black transition-all ${sessionFilter === 'SUN' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                週日
              </button>
            </div>

            {/* Quick Assign */}
            <div className="flex flex-col sm:flex-row items-end gap-4 bg-[#020617] p-4 rounded-2xl border border-slate-800">
              <div className="flex flex-col gap-1.5 w-full sm:w-24">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter leading-none">分組工具</span>
                <select
                  value={targetTeam}
                  onChange={(e) => setTargetTeam(e.target.value)}
                  className="bg-slate-700 border border-slate-600 text-xs font-bold rounded-lg px-2 h-9 outline-none text-white w-full"
                >
                  {teams.map(t => <option key={t} value={t} className="bg-slate-700">{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                <div className="relative group">
                  <button
                    onClick={handleBulkAssign}
                    disabled={selectedPlayerIds.size === 0 || isRestricted}
                    className={`px-3 h-9 w-full text-[10px] font-black rounded-lg transition-all ${
                      selectedPlayerIds.size > 0 && !isRestricted
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                      : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    指派篩選 ({selectedPlayerIds.size})
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#0f172a] border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 w-max invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50 pointer-events-none shadow-2xl">
                    指派篩選: <span className="text-blue-400 mx-1">[已勾選人員]</span>指派到<span className="text-blue-400 mx-1">[{targetTeam}]</span>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#0f172a]"></div>
                  </div>
                </div>

                <div className="relative group">
                  <button
                    onClick={handleAssignUnassigned}
                    disabled={isRestricted}
                    className={`px-3 h-9 w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black rounded-lg transition-all shadow-lg ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    指派未選 ({unassignedCount})
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#0f172a] border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 w-max invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50 pointer-events-none shadow-2xl">
                    指派未選: <span className="text-emerald-400 mx-1">[候補人員]</span>指派到<span className="text-blue-400 mx-1">[{targetTeam}]</span>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#0f172a]"></div>
                  </div>
                </div>
                <div className="relative group">
                  <button
                    onClick={onResetTeams}
                    disabled={isRestricted}
                    className={`px-3 h-9 w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black rounded-lg transition-all border border-slate-700 ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    重製隊伍
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#0f172a] border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 w-max invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50 pointer-events-none shadow-2xl">
                    重製隊伍: 全部人員移動到<span className="text-amber-400 mx-1">[候補]</span>, 等待重新分配
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#0f172a]"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bulk Team Move */}
            <div className="flex flex-col sm:flex-row items-end gap-4 bg-[#020617] p-4 rounded-2xl border border-slate-800">
              <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter leading-none">整隊遷移</span>
                <div className="flex items-center gap-2">
                  <select
                    disabled={isRestricted}
                    value={bulkSource}
                    onChange={(e) => setBulkSource(e.target.value)}
                    className={`bg-slate-700 border border-slate-600 text-[10px] font-black rounded-lg px-2 h-9 outline-none text-white w-20 ${isRestricted ? 'bg-slate-900 text-slate-600' : ''}`}
                  >
                    {teams.map(t => <option key={t} value={t} className="bg-slate-700 text-slate-100">{t}</option>)}
                  </select>
                  <i className="fa-solid fa-arrow-right text-slate-600 text-[10px]"></i>
                  <select
                    disabled={isRestricted}
                    value={bulkTarget}
                    onChange={(e) => setBulkTarget(e.target.value)}
                    className={`bg-slate-700 border border-slate-600 text-[10px] font-black rounded-lg px-2 h-9 outline-none text-white w-20 ${isRestricted ? 'bg-slate-900 text-slate-600' : ''}`}
                  >
                    {teams.map(t => <option key={t} value={t} className="bg-slate-700 text-slate-100">{t}</option>)}
                  </select>
                  <div className="relative group">
                    <button
                      onClick={handleBulkTeamMove}
                      disabled={isRestricted}
                      className={`px-3 h-9 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black rounded-lg transition-all shadow-lg min-w-[70px] ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      轉移整隊
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#0f172a] border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 w-max invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50 pointer-events-none shadow-2xl">
                      轉移整隊: <span className="text-amber-400 mx-1">[{bulkSource}]</span>全部移動到<span className="text-blue-400 mx-1">[{bulkTarget}]</span>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#0f172a]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Martial Arts Filter Section */}
        <div className="flex flex-col gap-4 w-full border-t border-slate-800 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <i className="fa-solid fa-filter text-blue-500"></i>
                武學篩選標記
              </h3>
              {maFilter.length > 0 && (
                <div className="flex items-center gap-2">
                  <button 
                    ref={filterBtnRef}
                    onClick={toggleSummary}
                    className="text-[9px] font-black text-blue-400 hover:text-white flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 transition-all"
                  >
                    <i className="fa-solid fa-list-check"></i>
                    人員清單 ({filteredPlayers.length})
                  </button>
                  <button 
                    onClick={handleClearFilter}
                    className="text-[9px] font-black text-red-500 hover:text-white flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 transition-all"
                  >
                    <i className="fa-solid fa-trash-can"></i>
                    清除篩選
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {martialArts.map(ma => {
              const state = maStates[ma.name] || 'none';
              return (
                <div key={ma.name} className="relative group">
                  <button
                    onClick={() => handleFilterToggle(ma.name)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all flex items-center gap-2 ${
                      state === 'select'
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                      : state === 'mark'
                      ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 shadow-lg'
                      : 'bg-[#020617] border-slate-800 text-slate-500 hover:border-slate-600'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ma.color }}></span>
                    {ma.name}
                    {state === 'mark' && <i className="fa-solid fa-eye text-[8px] opacity-70"></i>}
                    {state === 'select' && <i className="fa-solid fa-check-double text-[8px]"></i>}
                  </button>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#0f172a] border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 w-max invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50 pointer-events-none shadow-2xl">
                    武學篩選標記: 點選1次<span className="text-amber-400 mx-1">[標記]</span>,點選2次<span className="text-blue-400 mx-1">[選取]</span>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#0f172a]"></div>
                  </div>
                </div>
              );
            })}
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
                {filteredPlayers.length === 0 ? (
                  <div className="p-4 text-center text-[10px] text-slate-500 dark:text-slate-600 font-bold italic">無相符人員</div>
                ) : (
                  filteredPlayers.map(p => (
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
            />
          );
        })}
      </div>
    </div>
  );
};
