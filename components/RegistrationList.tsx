
import React, { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import { Player, MartialArts, Availability } from '../types';
import { useMartialArtsFilter } from '../hooks/useMartialArtsFilter';

interface PlayerRowProps {
  player: Player;
  isEditing: boolean;
  isNew: boolean;
  isFiltered: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onStartEdit: (player: Player) => void;
  onEdit: (player: Player) => void;
  onDelete: (id: string) => void;
  onUpdateTeam: (id: string, team: string) => void;
  teams: string[];
  martialArts: MartialArts[];
  isRestricted?: boolean;
}

const PlayerRow = memo(({ 
  player, isEditing, isNew, isFiltered, selected, onToggleSelect, onStartEdit, onEdit, onDelete, onUpdateTeam, teams, martialArts, isRestricted 
}: PlayerRowProps) => {
  return (
    <tr 
      id={`player-row-${player.id}`}
      onClick={() => {
        if (!isRestricted && !isEditing) onStartEdit(player);
      }}
      className={`hover:bg-[#020617] border-b border-slate-800/50 transition-all group relative ${
        isEditing ? 'bg-blue-600/10 ring-1 ring-inset ring-blue-500/50' :
        isNew ? 'bg-blue-500/5' : 
        isFiltered ? 'bg-emerald-500/5' : ''
      } ${isRestricted ? 'opacity-70 grayscale-[0.3] cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <td className="p-4 w-12 shrink-0" onClick={(e) => e.stopPropagation()}>
        <div 
          onClick={() => !isRestricted && !isEditing && onToggleSelect(player.id)}
          className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
            selected 
            ? 'bg-blue-600 border-blue-500 text-white' 
            : 'bg-[#020617] border-slate-700 text-transparent'
          } ${isRestricted || isEditing ? 'border-slate-800' : ''}`}
        >
          <i className="fa-solid fa-check text-[10px]"></i>
        </div>
      </td>
      <td className="p-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <input
                autoFocus
                className="bg-[#1e293b] border border-blue-500/50 rounded px-2 py-1 text-sm font-black text-white w-full outline-none"
                value={player.gameId}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onEdit({ ...player, gameId: e.target.value })}
              />
            ) : (
              <span className="text-sm font-black text-white">{player.gameId}</span>
            )}
            {isNew && !isEditing && <span className="px-1.5 py-0.5 bg-blue-600 text-[8px] font-black text-white rounded uppercase animate-pulse">NEW</span>}
            {isFiltered && !isEditing && <i className="fa-solid fa-star text-emerald-500 text-[10px]"></i>}
          </div>
          <div className="flex md:hidden flex-wrap gap-1">
              {player.martialArts.map(ma => {
                const maObj = martialArts.find(m => m.name === ma);
                return (
                  <span 
                    key={ma} 
                    onClick={(e) => {
                      if (isEditing) {
                        e.stopPropagation();
                        onEdit({ ...player, martialArts: player.martialArts.filter(m => m !== ma) });
                      }
                    }}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${isEditing ? 'bg-red-500/20 text-red-400 hover:bg-red-500/40' : 'bg-slate-800 text-slate-400'}`}
                  >
                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: maObj?.color }}></span>
                    {ma}
                    {isEditing && <i className="fa-solid fa-xmark ml-1"></i>}
                  </span>
                );
              })}
              {isEditing && (
                <select 
                  className="bg-slate-800 text-[8px] rounded px-1"
                  onChange={(e) => {
                    if (e.target.value && !player.martialArts.includes(e.target.value)) {
                      onEdit({ ...player, martialArts: [...player.martialArts, e.target.value] });
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="">+ 新增武學</option>
                  {martialArts.filter(m => !player.martialArts.includes(m.name)).map(m => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                </select>
              )}
          </div>
        </div>
      </td>
      <td className="p-4 hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {player.martialArts.map(ma => {
            const maObj = martialArts.find(m => m.name === ma);
            return (
              <span 
                key={ma} 
                onClick={(e) => {
                  if (isEditing) {
                    e.stopPropagation();
                    onEdit({ ...player, martialArts: player.martialArts.filter(m => m !== ma) });
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all ${
                  isEditing 
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white cursor-pointer' 
                  : 'bg-[#020617] border-slate-800 text-slate-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: maObj?.color }}></span>
                {ma}
                {isEditing && <i className="fa-solid fa-circle-xmark ml-1 opacity-50"></i>}
              </span>
            );
          })}
          {isEditing && (
            <select 
              className="bg-slate-800 text-[10px] border border-blue-500/30 rounded-full px-3 py-1 outline-none text-blue-400 font-bold"
              onChange={(e) => {
                if (e.target.value && !player.martialArts.includes(e.target.value)) {
                  onEdit({ ...player, martialArts: [...player.martialArts, e.target.value] });
                }
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">+ 新增武學</option>
              {martialArts.filter(m => !player.martialArts.includes(m.name)).map(m => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
          )}
        </div>
      </td>
      <td className="p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-1 items-center">
            <button
                disabled={isRestricted && !isEditing}
                onClick={() => onEdit({ ...player, satAvailability: player.satAvailability === 'YES' ? 'NO' : 'YES' })}
                className={`w-full sm:w-20 py-1.5 rounded-lg text-[9px] font-black transition-all border ${
                    player.satAvailability === 'YES' 
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20' 
                    : 'bg-slate-800/50 border-slate-700 text-slate-500'
                } ${isRestricted && !isEditing ? 'opacity-50' : ''}`}
            >
                六: {player.satAvailability === 'YES' ? '參加' : '無'}
            </button>
            <button
                disabled={isRestricted && !isEditing}
                onClick={() => onEdit({ ...player, sunAvailability: player.sunAvailability === 'YES' ? 'NO' : 'YES' })}
                className={`w-full sm:w-20 py-1.5 rounded-lg text-[9px] font-black transition-all border ${
                    player.sunAvailability === 'YES' 
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20' 
                    : 'bg-slate-800/50 border-slate-700 text-slate-500'
                } ${isRestricted && !isEditing ? 'opacity-50' : ''}`}
            >
                日: {player.sunAvailability === 'YES' ? '參加' : '無'}
            </button>
        </div>
      </td>
      <td className="p-4" onClick={(e) => e.stopPropagation()}>
        <select
          disabled={isRestricted && !isEditing}
          value={player.team}
          onChange={(e) => onUpdateTeam ? (isEditing ? onEdit({ ...player, team: e.target.value }) : onUpdateTeam(player.id, e.target.value)) : null}
          className={`bg-slate-700 border border-slate-600 rounded-lg text-[10px] font-bold text-white px-3 py-1.5 outline-none w-full md:w-24 cursor-pointer ${isRestricted && !isEditing ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed' : ''}`}
        >
          {teams.map(t => <option key={t} value={t} className="bg-slate-700">{t}</option>)}
        </select>
      </td>
      <td className="p-4 text-[10px] text-slate-500 font-bold hidden lg:table-cell italic">
        {isEditing ? (
          <input
            className="bg-[#1e293b] border border-blue-500/50 rounded px-2 py-1 text-[10px] font-bold text-slate-300 w-full outline-none"
            value={player.notes || ''}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onEdit({ ...player, notes: e.target.value })}
            placeholder="備註..."
          />
        ) : (
          player.notes || '-'
        )}
      </td>
      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center gap-2">
          {!isRestricted && !isEditing && (
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEdit(player);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all hover:scale-110"
                title="編輯資料"
              >
                <i className="fa-solid fa-pen-to-square text-[10px]"></i>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(player.id);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all hover:scale-110"
                title="刪除資料"
              >
                <i className="fa-solid fa-trash-can text-[10px]"></i>
              </button>
            </>
          )}
          {isRestricted && (
            <i className="fa-solid fa-lock text-slate-700 text-xs" title="專案鎖定中"></i>
          )}
        </div>
      </td>
    </tr>
  );
});

interface RegistrationListProps {
  players: Player[];
  lastAddedPlayerId: string | null;
  onUpdatePlayers: (updates: { id: string; team: string }[]) => void;
  onDeletePlayer: (id: string) => void;
  onClearPlayers: () => void;
  onResetTeams: () => void;
  onEditPlayer: (player: Player) => void;
  martialArts: MartialArts[];
  teams: string[];
  availabilityOptions: Availability[];
  isRestricted?: boolean;
}

export const RegistrationList: React.FC<RegistrationListProps> = ({
  players,
  lastAddedPlayerId,
  onUpdatePlayers,
  onDeletePlayer,
  onClearPlayers,
  onResetTeams,
  onEditPlayer,
  martialArts,
  teams,
  availabilityOptions,
  isRestricted
}) => {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [targetTeam, setTargetTeam] = useState(teams[0]);
  const [bulkSource, setBulkSource] = useState(teams[0]);
  const [bulkTarget, setBulkTarget] = useState(teams[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<Player | null>(null);
  
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
    sortedPlayers,
    toggleFilter,
    clearFilter,
    toggleSummary,
    closeSummaryManually,
    getMatchingPlayerIds,
    getDeselectPlayerIds
  } = useMartialArtsFilter(players, teams);

  const stats = useMemo(() => {
    const total = players.length;
    let satCount = 0;
    let sunCount = 0;
    let unassignedCount = 0;
    
    for (const p of players) {
      if (p.satAvailability === 'YES') satCount++;
      if (p.sunAvailability === 'YES') sunCount++;
      if (p.team === '候補') unassignedCount++;
    }
    
    return { total, satCount, sunCount, unassignedCount };
  }, [players]);

  const scrollToPlayer = (id: string) => {
    const element = document.getElementById(`player-row-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2', 'ring-offset-white', 'dark:ring-offset-slate-900');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2', 'ring-offset-white', 'dark:ring-offset-slate-900');
      }, 2000);
    }
  };

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

  const toggleSelect = useCallback((id: string) => {
    const newSet = new Set(selectedPlayerIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedPlayerIds(newSet);
  }, [selectedPlayerIds]);

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
    const playersToUpdate = players.filter(p => p.team === bulkSource);
    if (playersToUpdate.length === 0) return;
    const updates = playersToUpdate.map(p => ({ id: p.id, team: bulkTarget }));
    onUpdatePlayers(updates);
  }, [players, bulkSource, bulkTarget, onUpdatePlayers]);

  const startEdit = useCallback((player: Player) => {
    setEditingId(player.id);
    setEditBuffer({ ...player });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditBuffer(null);
  }, []);

  const saveEdit = useCallback(() => {
    if (editBuffer) {
      onEditPlayer(editBuffer);
      setEditingId(null);
      setEditBuffer(null);
    }
  }, [editBuffer, onEditPlayer]);

  const toggleEditMA = useCallback((name: string) => {
    setEditBuffer(prev => {
      if (!prev) return null;
      const newMAs = prev.martialArts.includes(name) 
        ? prev.martialArts.filter(n => n !== name) 
        : [...prev.martialArts, name];
      return { ...prev, martialArts: newMAs };
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats Summary Panel */}
      <section className="bg-[#0f172a] rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-4 md:p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="p-4 bg-[#020617] rounded-2xl border border-slate-800/50 space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">目前報名</p>
            <p className="text-2xl font-black text-blue-500">{stats.total} <span className="text-[10px] text-slate-600">人</span></p>
          </div>
          <div className="p-4 bg-[#020617] rounded-2xl border border-slate-800/50 space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">週六出席</p>
            <p className="text-2xl font-black text-emerald-500">{stats.satCount} <span className="text-[10px] text-slate-600">人</span></p>
          </div>
          <div className="p-4 bg-[#020617] rounded-2xl border border-slate-800/50 space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">週日出席</p>
            <p className="text-2xl font-black text-emerald-500">{stats.sunCount} <span className="text-[10px] text-slate-600">人</span></p>
          </div>
          <div className="p-4 bg-[#020617] rounded-2xl border border-slate-800/50 space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">待分配</p>
            <p className="text-2xl font-black text-amber-500">{stats.unassignedCount} <span className="text-[10px] text-slate-600">人</span></p>
          </div>
        </div>
      </section>
          
      {/* Management Toolbar */}
      <section className="bg-[#0f172a] p-4 md:p-6 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="space-y-4 flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
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
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : state === 'mark'
                        ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 shadow-lg shadow-blue-500/5'
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

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 w-full xl:w-auto">
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
                    className={`px-3 h-9 w-full text-[10px] font-black rounded-lg transition-all shadow-lg ${
                      selectedPlayerIds.size > 0 && !isRestricted
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20' 
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
                    指派未選 ({stats.unassignedCount})
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

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/50">
            {!isRestricted && (
              <button onClick={onClearPlayers} className="text-[10px] font-black text-red-500/70 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2">
                  <i className="fa-solid fa-trash-can"></i> 清除整張名單
              </button>
            )}
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
      </section>

      <section className="bg-[#0f172a] rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#020617] border-b border-slate-800">
              <tr>
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={players.length > 0 && selectedPlayerIds.size === players.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedPlayerIds(new Set(players.map(p => p.id)));
                      else setSelectedPlayerIds(new Set());
                    }}
                    className="rounded border-slate-700 bg-slate-900"
                  />
                </th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">遊戲名稱</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left hidden md:table-cell">武學</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">出席</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">隊伍</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left hidden lg:table-cell">備註</th>
                <th className="p-4 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sortedPlayers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center text-slate-600 font-bold italic tracking-widest">
                    SYSTEM: NO REGISTRATIONS FOUND
                  </td>
                </tr>
              ) : (
                sortedPlayers.map((player) => {
                  const isEditing = editingId === player.id;
                  const isNew = player.id === lastAddedPlayerId;
                  const isFiltered = maFilter.length > 0 && player.martialArts.some(ma => maFilter.includes(ma));
                  
                  return (
                    <PlayerRow 
                      key={player.id}
                      player={isEditing ? (editBuffer || player) : player}
                      isEditing={isEditing}
                      isNew={isNew}
                      isFiltered={isFiltered}
                      selected={selectedPlayerIds.has(player.id)}
                      onToggleSelect={toggleSelect}
                      onStartEdit={startEdit}
                      onEdit={isEditing ? setEditBuffer : onEditPlayer}
                      onDelete={onDeletePlayer}
                      onUpdateTeam={(id, team) => onUpdatePlayers([{ id, team }])}
                      teams={teams}
                      martialArts={martialArts}
                      isRestricted={isRestricted}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Inline Action Buttons when editing */}
      {editingId && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-4 animate-in slide-in-from-bottom-4 duration-300">
          <button 
            onClick={saveEdit}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-2xl shadow-blue-600/30 flex items-center gap-2"
          >
            <i className="fa-solid fa-cloud-arrow-up"></i>
            儲存修改
          </button>
          <button 
            onClick={cancelEdit}
            className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black rounded-2xl border border-slate-700"
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
};
