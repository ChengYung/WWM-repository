
import React, { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import * as XLSX from 'xlsx';
import { Player, MartialArts, Availability } from '../types';
import { useMartialArtsFilter } from '../hooks/useMartialArtsFilter';
import { SESSION_LABELS } from '../constants';
import { useToast } from './Toast';
import { ConfirmModal } from './ConfirmModal';

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
      <td className="p-4" onClick={(e) => e.stopPropagation()}>
        {isEditing ? (
          <input
            className="bg-[#1e293b] border border-blue-500/50 rounded px-2 py-1 text-sm font-black text-white w-20 text-center outline-none mx-auto block"
            value={player.power || ''}
            onChange={(e) => onEdit({ ...player, power: e.target.value })}
            placeholder="e.g. 3.0"
          />
        ) : (
          <span className="text-sm font-bold text-slate-350 flex justify-center">{player.power || '-'}</span>
        )}
      </td>
      <td className="p-4" onClick={(e) => e.stopPropagation()}>
        {isEditing ? (
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() => onEdit({ ...player, noSelf: !player.noSelf })}
              className={`w-6 h-6 rounded flex items-center justify-center text-[10px] transition-all border ${
                player.noSelf ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 font-bold' : 'bg-slate-800 border-slate-700 text-slate-600'
              }`}
              title="無我"
            >
              <i className="fa-solid fa-trophy text-[9px]"></i>
            </button>
            <button
              onClick={() => onEdit({ ...player, hasDc: !player.hasDc })}
              className={`w-6 h-6 rounded flex items-center justify-center text-[10px] transition-all border ${
                player.hasDc ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 font-bold' : 'bg-slate-800 border-slate-700 text-slate-600'
              }`}
              title="DC"
            >
              <i className="fa-brands fa-discord text-[9px]"></i>
            </button>
            <button
              onClick={() => onEdit({ ...player, canMic: !player.canMic })}
              className={`w-6 h-6 rounded flex items-center justify-center text-[10px] transition-all border ${
                player.canMic ? 'bg-green-500/20 border-green-500 text-green-400 font-bold' : 'bg-slate-800 border-slate-700 text-slate-600'
              }`}
              title="開Mic"
            >
              <i className="fa-solid fa-microphone text-[9px]"></i>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            {player.noSelf && (
              <span className="w-6 h-6 rounded-full bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center hover:scale-110 transition-transform active:scale-95" title="無我">
                <i className="fa-solid fa-trophy text-yellow-500 text-[10.5px]"></i>
              </span>
            )}
            {player.hasDc && (
              <span className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center hover:scale-110 transition-transform active:scale-95" title="Discord (DC)">
                <i className="fa-brands fa-discord text-indigo-450 text-[10.5px]"></i>
              </span>
            )}
            {player.canMic && (
              <span className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/25 flex items-center justify-center hover:scale-110 transition-transform active:scale-95" title="可開麥">
                <i className="fa-solid fa-microphone text-green-450 text-[10.5px]"></i>
              </span>
            )}
            {!player.noSelf && !player.hasDc && !player.canMic && <span className="text-slate-600 font-bold">-</span>}
          </div>
        )}
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
        <div className="flex flex-col gap-2 justify-center items-start">
          {/* Saturday Sessions Wrap */}
          {(() => {
            const activeSatS = player.satSessions || (player.satAvailability === 'YES' ? ['RK1', 'NG1', 'NG2', 'NG3', 'NG4'] : []);
            return (
              <div className="flex items-center gap-1.5 bg-indigo-950/15 border border-indigo-500/10 p-1 rounded-lg w-full">
                <button
                  type="button"
                  disabled={isRestricted}
                  onClick={() => {
                    const allSat = ['RK1', 'NG1', 'NG2', 'NG3', 'NG4'];
                    const isAllSatSelected = activeSatS.length === 5;
                    const nextSat = isAllSatSelected ? [] : allSat;
                    let assigned = player.assignedSessions || [];
                    const teamBySession = { ...player.teamBySession };
                    if (isAllSatSelected) {
                      assigned = assigned.filter(item => !item.startsWith('SAT_'));
                      allSat.forEach(s => {
                        delete teamBySession[`SAT_${s}`];
                      });
                    }
                    onEdit({
                      ...player,
                      satSessions: nextSat,
                      satAvailability: nextSat.length > 0 ? 'YES' : 'NO',
                      assignedSessions: assigned,
                      teamBySession
                    });
                  }}
                  title="點選勾選/取消全部週六場次"
                  className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white px-1.5 py-0.5 rounded leading-none shrink-0 border border-indigo-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  六
                </button>
                <div className="flex flex-wrap gap-1">
                  {['RK1', 'NG1', 'NG2', 'NG3', 'NG4'].map(s => {
                    const isSelected = activeSatS.includes(s);
                    return (
                      <button
                        key={`row-sat-${s}`}
                        type="button"
                        disabled={isRestricted}
                        onClick={() => {
                          const nextSat = isSelected 
                            ? activeSatS.filter(item => item !== s) 
                            : [...activeSatS, s];
                          
                          let assigned = player.assignedSessions || [];
                          const teamBySession = { ...player.teamBySession };
                          if (isSelected) {
                            const key = `SAT_${s}`;
                            assigned = assigned.filter(item => item !== key);
                            delete teamBySession[key];
                          }

                          onEdit({
                            ...player,
                            satSessions: nextSat,
                            satAvailability: nextSat.length > 0 ? 'YES' : 'NO',
                            assignedSessions: assigned,
                            teamBySession
                          });
                        }}
                        title={SESSION_LABELS[s]}
                        className={`text-[8px] font-black px-1.5 py-0.5 rounded transition-all select-none border ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 shadow-sm shadow-indigo-500/20 scale-105 hover:bg-indigo-500'
                            : 'bg-[#020617] border-slate-800 hover:border-slate-700'
                        } ${
                          s === 'RK1'
                            ? (isSelected ? 'text-yellow-300' : 'text-amber-500/50')
                            : (isSelected ? 'text-cyan-200' : 'text-cyan-600/50')
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Sunday Sessions Wrap */}
          {(() => {
            const activeSunS = player.sunSessions || (player.sunAvailability === 'YES' ? ['RK1', 'NG1', 'NG2', 'NG3', 'NG4'] : []);
            return (
              <div className="flex items-center gap-1.5 bg-teal-950/15 border border-teal-500/10 p-1 rounded-lg w-full">
                <button
                  type="button"
                  disabled={isRestricted}
                  onClick={() => {
                    const allSun = ['RK1', 'NG1', 'NG2', 'NG3', 'NG4'];
                    const isAllSunSelected = activeSunS.length === 5;
                    const nextSun = isAllSunSelected ? [] : allSun;
                    let assigned = player.assignedSessions || [];
                    const teamBySession = { ...player.teamBySession };
                    if (isAllSunSelected) {
                      assigned = assigned.filter(item => !item.startsWith('SUN_'));
                      allSun.forEach(s => {
                        delete teamBySession[`SUN_${s}`];
                      });
                    }
                    onEdit({
                      ...player,
                      sunSessions: nextSun,
                      sunAvailability: nextSun.length > 0 ? 'YES' : 'NO',
                      assignedSessions: assigned,
                      teamBySession
                    });
                  }}
                  title="點選勾選/取消全部週日場次"
                  className="text-[9px] font-black text-teal-400 bg-teal-500/10 hover:bg-teal-500 hover:text-white px-1.5 py-0.5 rounded leading-none shrink-0 border border-teal-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  日
                </button>
                <div className="flex flex-wrap gap-1">
                  {['RK1', 'NG1', 'NG2', 'NG3', 'NG4'].map(s => {
                    const isSelected = activeSunS.includes(s);
                    return (
                      <button
                        key={`row-sun-${s}`}
                        type="button"
                        disabled={isRestricted}
                        onClick={() => {
                          const nextSun = isSelected 
                            ? activeSunS.filter(item => item !== s) 
                            : [...activeSunS, s];
                          
                          let assigned = player.assignedSessions || [];
                          const teamBySession = { ...player.teamBySession };
                          if (isSelected) {
                            const key = `SUN_${s}`;
                            assigned = assigned.filter(item => item !== key);
                            delete teamBySession[key];
                          }

                          onEdit({
                            ...player,
                            sunSessions: nextSun,
                            sunAvailability: nextSun.length > 0 ? 'YES' : 'NO',
                            assignedSessions: assigned,
                            teamBySession
                          });
                        }}
                        title={SESSION_LABELS[s]}
                        className={`text-[8px] font-black px-1.5 py-0.5 rounded transition-all select-none border ${
                          isSelected
                            ? 'bg-teal-600 border-teal-500 shadow-sm shadow-teal-500/20 scale-105 hover:bg-teal-500'
                            : 'bg-[#020617] border-slate-800 hover:border-slate-700'
                        } ${
                          s === 'RK1'
                            ? (isSelected ? 'text-yellow-350' : 'text-amber-500/50')
                            : (isSelected ? 'text-cyan-200' : 'text-cyan-600/50')
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </td>
      <td className="p-4" onClick={(e) => e.stopPropagation()} title="非管理人員請勿操作">
        <div className="flex flex-wrap gap-1.5 items-center justify-start min-h-[30px]">
          {/* Assigned Sessions */}
          {(player.assignedSessions || []).map(as => {
            const isSat = as.startsWith('SAT_');
            const name = as.replace('SAT_', '').replace('SUN_', '');
            return (
              <span
                key={as}
                onClick={() => {
                  if (isRestricted) return;
                  const currentAssigned = player.assignedSessions || [];
                  const newAssigned = currentAssigned.filter(item => item !== as);
                  const newTeamBySession = { ...player.teamBySession };
                  delete newTeamBySession[as];
                  onEdit({
                    ...player,
                    assignedSessions: newAssigned,
                    teamBySession: newTeamBySession
                  });
                }}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                  isSat 
                  ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 hover:bg-red-500 hover:text-white hover:border-red-500 cursor-pointer' 
                  : 'bg-amber-500/15 border border-amber-500/35 text-amber-400 hover:bg-red-500 hover:text-white hover:border-red-500 cursor-pointer'
                }`}
                title="點擊可移除分配"
              >
                {isSat ? '六' : '日'}: <span className={name === 'RK1' ? 'text-yellow-300 font-extrabold ml-0.5' : 'text-cyan-200 font-bold ml-0.5'}>{name}</span>
                <i className="fa-solid fa-xmark text-[8px] ml-0.5 opacity-60"></i>
              </span>
            );
          })}
          
          {/* Select dropdown to assign new sessions */}
          {(() => {
            const satS = player.satSessions || (player.satAvailability === 'YES' ? ['RK1', 'NG1', 'NG2', 'NG3', 'NG4'] : []);
            const sunS = player.sunSessions || (player.sunAvailability === 'YES' ? ['RK1', 'NG1', 'NG2', 'NG3', 'NG4'] : []);
            const available: string[] = [];
            satS.forEach(s => available.push(`SAT_${s}`));
            sunS.forEach(s => available.push(`SUN_${s}`));
            const assigned = player.assignedSessions || [];
            const unassigned = available.filter(s => !assigned.includes(s));
            
            if (unassigned.length > 0) {
              return (
                <select
                  disabled={isRestricted}
                  value=""
                  onChange={(e) => {
                    if (isRestricted || !e.target.value) return;
                    const val = e.target.value;
                    const newAssigned = [...assigned, val];
                    const newTeamBySession = { ...player.teamBySession };
                    if (!newTeamBySession[val]) {
                      newTeamBySession[val] = '第一隊:進攻';
                    }
                    onEdit({
                      ...player,
                      assignedSessions: newAssigned,
                      teamBySession: newTeamBySession
                    });
                  }}
                  className="bg-[#1e293b] text-[10px] border border-blue-500/30 rounded px-2 py-0.5 outline-none text-blue-400 font-bold cursor-pointer"
                >
                  <option value="">+ 指派</option>
                  {unassigned.map(s => {
                    const isSat = s.startsWith('SAT_');
                    const name = s.replace('SAT_', '').replace('SUN_', '');
                    return (
                      <option key={s} value={s}>
                        {isSat ? '週六' : '週日'} {name}
                      </option>
                    );
                  })}
                </select>
              );
            }
            return null;
          })()}

          {(!player.assignedSessions || player.assignedSessions.length === 0) && (
            <span className="text-slate-500 text-[10px] font-bold">未指派</span>
          )}
        </div>
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
  onUpdatePlayers: (updates: { id: string; team: string }[], sessionFilter?: string | null) => void;
  onDeletePlayer: (id: string) => void;
  onClearPlayers: () => void;
  onResetTeams: () => void;
  onEditPlayer: (player: Player) => void;
  martialArts: MartialArts[];
  teams: string[];
  availabilityOptions: Availability[];
  isRestricted?: boolean;
  projectName?: string;
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
  isRestricted,
  projectName
}) => {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [targetTeam, setTargetTeam] = useState(teams[0]);
  const [bulkSource, setBulkSource] = useState(teams[0]);
  const [bulkTarget, setBulkTarget] = useState(teams[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<Player | null>(null);

  const [filterNoSelf, setFilterNoSelf] = useState(false);
  const [filterDc, setFilterDc] = useState(false);
  const [filterMic, setFilterMic] = useState(false);

  const [powerSort, setPowerSort] = useState<'none' | 'desc' | 'asc'>('none');

  const { showToast } = useToast();
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [showSmartAssign, setShowSmartAssign] = useState(false);
  const [smartMaCounts, setSmartMaCounts] = useState<Record<string, number>>({});
  const [smartActiveMas, setSmartActiveMas] = useState<string[]>([
    "無名劍法", "嗟夫刀法", "青山執筆", "明川藥典"
  ]);
  const [smartTargetSession, setSmartTargetSession] = useState<string>('SAT_RK1');
  const [prioritizePower, setPrioritizePower] = useState(true);
  const [prioritizeNoSelf, setPrioritizeNoSelf] = useState(false);
  const [prioritizeDc, setPrioritizeDc] = useState(false);
  const [prioritizeMic, setPrioritizeMic] = useState(false);
  const [prioritizePrevReserve, setPrioritizePrevReserve] = useState(false);
  
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

  useEffect(() => {
    if (martialArts && martialArts.length > 0) {
      // Check if we should initialize active MAs from actual list
      const actualNames = martialArts.map(m => m.name);
      setSmartActiveMas(prev => {
        const isHardcodedDefault = prev.length === 4 && 
          prev.includes("無名劍法") && 
          prev.includes("嗟夫刀法") && 
          prev.includes("青山執筆") && 
          prev.includes("明川藥典");
        if (isHardcodedDefault) {
          const hasMismatch = prev.some(name => !actualNames.includes(name));
          if (hasMismatch) {
            return actualNames.slice(0, 4);
          }
        }
        return prev;
      });
    }
  }, [martialArts]);

  useEffect(() => {
    if (martialArts && Object.keys(smartMaCounts).length === 0) {
      const init: Record<string, number> = {};
      martialArts.forEach(ma => {
        init[ma.name] = 0;
      });
      setSmartMaCounts(init);
    }
  }, [martialArts, smartMaCounts]);

  const parsePower = (powerStr?: string): number => {
    if (!powerStr) return 0;
    const match = powerStr.match(/([0-9.]+)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const displayedPlayers = useMemo(() => {
    let list = sortedPlayers;
    if (filterNoSelf) {
      list = list.filter(p => p.noSelf === true);
    }
    if (filterDc) {
      list = list.filter(p => p.hasDc === true);
    }
    if (filterMic) {
      list = list.filter(p => p.canMic === true);
    }
    
    if (powerSort !== 'none') {
      list = [...list].sort((a, b) => {
        const pa = parsePower(a.power);
        const pb = parsePower(b.power);
        return powerSort === 'desc' ? pb - pa : pa - pb;
      });
    }
    return list;
  }, [sortedPlayers, filterNoSelf, filterDc, filterMic, powerSort]);

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

    // Determine previous session key for prioritizing previous backup/reserves
    const getPrevSessionKey = (currentSession: string): string | null => {
      const satSequence = ['SAT_RK1', 'SAT_NG1', 'SAT_NG2', 'SAT_NG3', 'SAT_NG4'];
      const sunSequence = ['SUN_RK1', 'SUN_NG1', 'SUN_NG2', 'SUN_NG3', 'SUN_NG4'];
      if (satSequence.includes(currentSession)) {
        const idx = satSequence.indexOf(currentSession);
        return idx > 0 ? satSequence[idx - 1] : null;
      }
      if (sunSequence.includes(currentSession)) {
        const idx = sunSequence.indexOf(currentSession);
        return idx > 0 ? sunSequence[idx - 1] : null;
      }
      return null;
    };

    const prevSessionKey = getPrevSessionKey(smartTargetSession);

    const isPrevBackup = (p: Player): boolean => {
      if (!prevSessionKey) return false;
      
      const isSat = prevSessionKey.startsWith('SAT_');
      const sessionKey = prevSessionKey.replace('SAT_', '').replace('SUN_', '');
      const registeredSessions = isSat 
        ? (p.satSessions || (p.satAvailability === 'YES' ? ['RK1', 'NG1', 'NG2', 'NG3', 'NG4'] : []))
        : (p.sunSessions || (p.sunAvailability === 'YES' ? ['RK1', 'NG1', 'NG2', 'NG3', 'NG4'] : []));
      
      if (!registeredSessions.includes(sessionKey)) return false;
      
      const isAssigned = (p.assignedSessions || []).includes(prevSessionKey);
      const teamInPrev = p.teamBySession?.[prevSessionKey] || '候補';
      
      return !isAssigned || teamInPrev === '候補';
    };

    // 4. Sort candidates (Rule 5 priority at the topmost)
    candidatesList.sort((a, b) => {
      if (prioritizePrevReserve && prevSessionKey) {
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
    setShowSmartAssign(false);
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

  const handleExportExcel = useCallback(() => {
    // 1. Summary sheet data
    const summaryData = players.map(p => {
      const satSSelected = p.satSessions || (p.satAvailability === 'YES' ? ['RK1', 'NG1', 'NG2', 'NG3', 'NG4'] : []);
      const sunSSelected = p.sunSessions || (p.sunAvailability === 'YES' ? ['RK1', 'NG1', 'NG2', 'NG3', 'NG4'] : []);
      
      const assignedFriendly = (p.assignedSessions || []).map(as => {
        const isSat = as.startsWith('SAT_');
        const sessionName = as.replace('SAT_', '').replace('SUN_', '');
        const teamName = p.teamBySession?.[as] || p.team || '未指派';
        return `${isSat ? '六' : '日'}:${sessionName}(${teamName})`;
      }).join('、') || '未指派';

      return {
        '遊戲名稱': p.gameId,
        '戰力指數': p.power || '',
        '代表武學': p.martialArts.join('、'),
        '週六報名場次': satSSelected.join('、') || '無',
        '週日報名場次': sunSSelected.join('、') || '無',
        '分配參加場次': assignedFriendly,
        '是否無我': p.noSelf ? '是' : '否',
        '是否有 DC': p.hasDc ? '是' : '否',
        '是否可開麥': p.canMic ? '是' : '否',
        '備註說明': p.notes || ''
      };
    });

    const workbook = XLSX.utils.book_new();

    // Append standard/summary worksheet
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, '報名總表');

    // 2. Separate sheets for each assigned session
    // Gather all assigned sessions across all players
    const assignedSessionsSet = new Set<string>();
    players.forEach(p => {
      (p.assignedSessions || []).forEach(as => {
        assignedSessionsSet.add(as);
      });
    });

    // Sort assigned sessions
    const sessionOrder = [
      'SAT_RK1', 'SAT_NG1', 'SAT_NG2', 'SAT_NG3', 'SAT_NG4',
      'SUN_RK1', 'SUN_NG1', 'SUN_NG2', 'SUN_NG3', 'SUN_NG4'
    ];
    const sortedSessions = Array.from(assignedSessionsSet).sort((a, b) => {
      const idxA = sessionOrder.indexOf(a);
      const idxB = sessionOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    // Create sheets
    sortedSessions.forEach(sessionKey => {
      const sessionPlayers = players.filter(p => (p.assignedSessions || []).includes(sessionKey));
      const sheetData = sessionPlayers.map(p => {
        const teamName = p.teamBySession?.[sessionKey] || p.team || '未指派';
        return {
          '遊戲名稱': p.gameId,
          '戰力指數': p.power || '',
          '代表武學': p.martialArts.join('、'),
          '分配隊伍': teamName,
          '是否無我': p.noSelf ? '是' : '否',
          '是否有 DC': p.hasDc ? '是' : '否',
          '是否可開麥': p.canMic ? '是' : '否',
          '備註說明': p.notes || ''
        };
      });

      const isSat = sessionKey.startsWith('SAT_');
      const sessionName = sessionKey.replace('SAT_', '').replace('SUN_', '');
      const rawSheetName = `${isSat ? '六' : '日'}-${sessionName}`;
      const safeSheetName = rawSheetName.replace(/[:\/\\?*\[\]]/g, '-').substring(0, 31);

      const sessionWorksheet = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbook, sessionWorksheet, safeSheetName);
    });

    XLSX.writeFile(workbook, `${projectName || '武林'}報名表.xlsx`);
  }, [players, projectName]);

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
            {/* Smart Allocation Trigger */}
            <div className="flex flex-col sm:flex-row items-end gap-4 bg-[#020617] p-4 rounded-2xl border border-slate-800">
              <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-tighter leading-none">配置隊伍</span>
                <button
                  onClick={() => setShowSmartAssign(!showSmartAssign)}
                  className={`px-4 h-9 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black rounded-lg transition-all shadow-lg flex items-center justify-center gap-1.5 ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <i className="fa-solid fa-brain"></i>
                  智能選隊
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Smart Assignment configs Drawer */}
        {showSmartAssign && (
          <div className="mt-4 p-5 bg-[#020617] rounded-3xl border border-slate-800 space-y-4 animate-in slide-in-from-top-4 duration-300">
            <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fa-solid fa-gears text-purple-500"></i> 智能選隊配置
            </h4>

            {/* Target Session Selector dropdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0f172a] p-4 rounded-xl border border-slate-800">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">分配之目標場次 (預設更新 [分配隊伍] 欄位)</span>
                <select
                  value={smartTargetSession}
                  onChange={(e) => setSmartTargetSession(e.target.value)}
                  className="bg-[#020617] border border-[#1e293b] text-xs font-bold rounded-lg px-3 py-2 outline-none text-white focus:border-purple-500 w-full"
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

               <label className="flex items-center gap-2 p-2.5 bg-[#0f172a] hover:bg-slate-850 rounded-xl cursor-pointer transition-all border border-[#1e293b]" title="適用於 NG 場次，自動將上一場被列為候補(或沒上場)的報名玩家提到最前排優先上場">
                 <input
                   type="checkbox"
                   checked={prioritizePrevReserve}
                   onChange={(e) => setPrioritizePrevReserve(e.target.checked)}
                   className="w-3.5 h-3.5 text-purple-600 focus:ring-purple-500 bg-[#020617] border-slate-700 rounded cursor-pointer"
                 />
                 <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5">
                   <i className="fa-solid fa-redo text-purple-400 animate-spin-slow"></i> 上一場候補優先上場
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
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-[11px] rounded-xl shadow-lg shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-55"
              >
                執行
              </button>
            </div>
          </div>
        )}

      <div className="flex justify-between items-center pt-4 border-t border-slate-800/50">
          <button 
            onClick={handleExportExcel}
            className="text-[10px] font-black text-emerald-400 hover:text-emerald-350 uppercase tracking-widest transition-colors flex items-center gap-2"
          >
            <i className="fa-solid fa-file-excel"></i> Export Excel (.xlsx)
          </button>
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
                <th 
                  onClick={() => {
                    setPowerSort(prev => prev === 'none' ? 'desc' : prev === 'desc' ? 'asc' : 'none');
                  }}
                  className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center cursor-pointer hover:text-blue-400 transition-colors selection:bg-transparent"
                >
                  <span className="flex items-center justify-center gap-1.5 mx-auto w-max">
                    戰力指數
                    {powerSort === 'none' && <i className="fa-solid fa-sort opacity-50 text-[9px]"></i>}
                    {powerSort === 'desc' && <i className="fa-solid fa-sort-down text-blue-500 text-[10px]"></i>}
                    {powerSort === 'asc' && <i className="fa-solid fa-sort-up text-blue-500 text-[10px]"></i>}
                  </span>
                </th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">狀態限制</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left hidden md:table-cell">武學</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">報名場次</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">分配參加場次</th>
                <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left hidden lg:table-cell">備註</th>
                <th className="p-4 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {displayedPlayers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-16 text-center text-slate-600 font-bold italic tracking-widest">
                    SYSTEM: NO REGISTRATIONS FOUND
                  </td>
                </tr>
              ) : (
                displayedPlayers.map((player) => {
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
