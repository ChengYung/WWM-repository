
import React, { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import * as XLSX from 'xlsx';
import { Player, MartialArts, Availability, Member, HeartMethod } from '../types';
import { useMartialArtsFilter } from '../hooks/useMartialArtsFilter';
import { SESSION_LABELS } from '../constants';
import { useToast } from './Toast';
import { ConfirmModal } from './ConfirmModal';
import { SmartAssignPanel } from './SmartAssignPanel';

const HeartMethodTooltip: React.FC<{ name: string; projectHeartMethods?: HeartMethod[] }> = ({ name, projectHeartMethods = [] }) => {
  const method = projectHeartMethods.find(m => m.name === name) || { name, description: '暫無詳細描述' };
  const initial = name.slice(0, 2);
  const rarity = (method as HeartMethod).rarity || 'blue';

  let rarityClasses = 'border-blue-500/40 bg-[#1e3a8a]/40 hover:bg-blue-500/30 hover:border-blue-400 text-blue-400';
  let titleColor = 'text-blue-400';
  
  if (rarity === 'gold') {
    rarityClasses = 'border-amber-500/40 bg-[#78350f]/40 hover:bg-amber-500/30 hover:border-amber-400 text-amber-400';
    titleColor = 'text-amber-400';
  } else if (rarity === 'purple') {
    rarityClasses = 'border-purple-500/40 bg-[#581c87]/40 hover:bg-purple-500/30 hover:border-purple-400 text-purple-400';
    titleColor = 'text-purple-405';
  }

  return (
    <div className="relative group/tooltip inline-block" onClick={(e) => e.stopPropagation()}>
      <div className={`w-8 h-8 rounded-full border ${rarityClasses} flex items-center justify-center font-black text-[10px] cursor-pointer shadow-lg transition-all transform hover:scale-110`}>
        {initial}
      </div>
      {/* Tooltip box */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-3 shadow-2xl opacity-0 scale-95 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 group-hover/tooltip:pointer-events-auto transition-all z-50">
        <div className={`font-bold text-xs ${titleColor} pb-1 border-b border-slate-800/80 mb-1`}>{method.name}</div>
        <p className="text-[10px] text-slate-400 leading-normal font-semibold whitespace-pre-line">{method.description}</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-950"></div>
      </div>
    </div>
  );
};

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
  members: Member[];
  heartMethods: HeartMethod[];
}

const PlayerRow = memo(({ 
  player, isEditing, isNew, isFiltered, selected, onToggleSelect, onStartEdit, onEdit, onDelete, onUpdateTeam, teams, martialArts, isRestricted, members, heartMethods 
}: PlayerRowProps) => {
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const matchedMember = useMemo(() => {
    return members?.find(m => m.gameName.trim().toLowerCase() === player.gameId.trim().toLowerCase());
  }, [members, player.gameId]);

  const displayNoSelf = matchedMember ? (matchedMember.noSelf || false) : (player.noSelf || false);
  const displayHasDc = matchedMember ? (matchedMember.hasDc || false) : (player.hasDc || false);
  const displayCanMic = matchedMember ? (matchedMember.canMic || false) : (player.canMic || false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAssignDropdown(false);
      }
    };
    if (showAssignDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAssignDropdown]);

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
      <td className="p-3 w-12 shrink-0" onClick={(e) => e.stopPropagation()}>
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
      <td className="p-3">
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
              <span className="text-sm font-extrabold text-slate-100 group-hover:text-white transition-colors">{player.gameId}</span>
            )}
            {isNew && !isEditing && <span className="px-1.5 py-0.5 bg-blue-600 text-[8px] font-black text-white rounded uppercase animate-pulse">NEW</span>}
            {isFiltered && !isEditing && <i className="fa-solid fa-star text-emerald-500 text-[10px]"></i>}
          </div>
          
          <div className="flex items-center gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
            {isEditing ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEdit({ ...player, noSelf: !player.noSelf })}
                  className={`w-5 h-5 rounded flex items-center justify-center text-[10px] transition-all border ${
                    player.noSelf ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 font-bold' : 'bg-slate-800 border-slate-700 text-slate-650'
                  }`}
                  title="無我"
                >
                  <i className="fa-solid fa-trophy text-[8px]"></i>
                </button>
                <button
                  type="button"
                  onClick={() => onEdit({ ...player, hasDc: !player.hasDc })}
                  className={`w-5 h-5 rounded flex items-center justify-center text-[10px] transition-all border ${
                    player.hasDc ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 font-bold' : 'bg-slate-800 border-slate-700 text-slate-650'
                  }`}
                  title="DC"
                >
                  <i className="fa-brands fa-discord text-[8px]"></i>
                </button>
                <button
                  type="button"
                  onClick={() => onEdit({ ...player, canMic: !player.canMic })}
                  className={`w-5 h-5 rounded flex items-center justify-center text-[10px] transition-all border ${
                    player.canMic ? 'bg-green-500/20 border-green-500 text-green-400 font-bold' : 'bg-slate-800 border-slate-700 text-slate-650'
                  }`}
                  title="開Mic"
                >
                  <i className="fa-solid fa-microphone text-[8px]"></i>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {displayNoSelf && (
                  <span className="w-5 h-5 rounded-full bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center hover:scale-110 transition-transform" title="無我">
                    <i className="fa-solid fa-trophy text-yellow-500 text-[9px]"></i>
                  </span>
                )}
                {displayHasDc && (
                  <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center hover:scale-110 transition-transform" title="Discord (DC)">
                    <i className="fa-brands fa-discord text-indigo-400 text-[9px]"></i>
                  </span>
                )}
                {displayCanMic && (
                  <span className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/25 flex items-center justify-center hover:scale-110 transition-transform" title="可開麥">
                    <i className="fa-solid fa-microphone text-green-450 text-[9px]"></i>
                  </span>
                )}
                {!displayNoSelf && !displayHasDc && !displayCanMic && (
                  <span className="text-slate-600 font-bold px-1 text-[10px]">-</span>
                )}
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="p-3 text-left" onClick={(e) => e.stopPropagation()}>
        {isEditing ? (
          <div className="flex flex-col gap-2 p-1.5 bg-slate-950/40 rounded-xl border border-slate-800 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400">戰力指數:</span>
              <input
                className="bg-[#1e293b] border border-blue-500/50 rounded px-2 py-0.5 text-xs font-black text-white w-20 text-center outline-none bg-slate-900"
                value={player.power || ''}
                onChange={(e) => onEdit({ ...player, power: e.target.value })}
                placeholder="e.g. 3.0"
              />
              <span className="text-[10.5px] text-slate-500 font-bold">鵝</span>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 block">登錄武學:</span>
              <div className="flex flex-wrap gap-1">
                {player.martialArts.map((ma, i) => {
                  const maObj = martialArts.find(m => m.name === ma);
                  return (
                    <span 
                      key={`${ma}-${i}`} 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit({ ...player, martialArts: player.martialArts.filter(m => m !== ma) });
                      }}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[9px] font-bold bg-[#020617] border-slate-800 text-slate-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 cursor-pointer transition-all truncate"
                      title="點擊刪除"
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: maObj?.color }}></span>
                      {ma}
                      <i className="fa-solid fa-circle-xmark ml-1 text-[8px] opacity-60"></i>
                    </span>
                  );
                })}
              </div>
              <select 
                className="bg-[#020617] text-[10px] border border-slate-800 rounded px-1.5 py-0.5 outline-none font-bold w-full text-slate-300"
                onChange={(e) => {
                  if (e.target.value && !player.martialArts.includes(e.target.value)) {
                    onEdit({ ...player, martialArts: [...player.martialArts, e.target.value] });
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                value=""
              >
                <option value="" className="text-slate-500">+ 新增武學</option>
                {martialArts.filter(m => !player.martialArts.includes(m.name)).map(m => (
                  <option key={m.name} value={m.name} style={{ color: m.color || '#94a3b8' }} className="font-bold bg-[#020617]">
                    ● {m.name}
                  </option>
                ))}
              </select>
            </div>

            {(() => {
              const matchedMember = members?.find(m => m.gameName.trim().toLowerCase() === player.gameId.trim().toLowerCase());
              if (matchedMember && matchedMember.combos && matchedMember.combos.length > 0) {
                return (
                  <div className="mt-2 pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] font-black text-slate-400 block mb-1">
                      選擇要登錄/修改的成員搭配:
                    </span>
                    <div className="flex flex-col gap-1">
                      {matchedMember.combos.map((combo, idx) => {
                        const isCurrentlySelected = 
                          player.power === String(combo.power) &&
                          player.martialArts.length === combo.arts.length &&
                          player.martialArts.every(art => combo.arts.includes(art));
                          
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit({
                                ...player,
                                power: String(combo.power),
                                martialArts: [...combo.arts]
                              });
                            }}
                            className={`w-full text-left p-1.5 rounded-lg border text-[9px] font-black tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                              isCurrentlySelected
                                ? 'bg-blue-500/10 border-blue-550 text-blue-400'
                                : 'bg-[#020617] border-slate-800 hover:border-slate-700 text-slate-450 hover:text-slate-300'
                            }`}
                          >
                            <span className="truncate max-w-[180px]">{combo.name}: {combo.arts.join(' + ')}</span>
                            <span className="bg-blue-950/20 border border-blue-900/30 px-1 py-0.2 rounded font-mono text-[8px] text-blue-400 shrink-0">
                              {combo.power} 鵝
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 w-full max-w-md items-start text-left justify-start">
            {(() => {
              const matchedMember = members?.find(m => m.gameName.trim().toLowerCase() === player.gameId.trim().toLowerCase());
              const sortedCombos = matchedMember?.combos || [];
              const getMartialArtColor = (name: string) => {
                return martialArts.find(m => m.name === name)?.color || '#94a3b8';
              };
              
              const formatArtName = (name: string): string => {
                if (!name) return '';
                return name.length > 5 ? name.substring(0, 5) + '..' : name;
              };

              // If registered member has combos, stack them vertically
              if (sortedCombos && sortedCombos.length > 0) {
                return (
                  <div className="flex flex-col gap-2 w-full">
                    {sortedCombos.map((combo, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-2 text-[9px] py-0.5 text-left justify-start w-full select-none">
                        <span className="font-extrabold text-[#f59e0b] bg-[#f59e0b]/5 border border-[#f59e0b]/20 px-1.5 py-0.5 rounded text-[8px] min-w-[24px] text-center shrink-0">
                          {combo.name || `搭配${idx + 1}`}
                        </span>
                        <div className="flex flex-wrap items-center gap-1 font-bold text-slate-200">
                          {combo.arts && combo.arts.filter(Boolean).map((art, aIdx) => (
                            <React.Fragment key={aIdx}>
                              {aIdx > 0 && <span className="text-[8px] text-slate-650 font-black shrink-0">+</span>}
                              <span 
                                className="px-1.5 py-0.5 rounded text-[8.5px] font-semibold text-slate-200 bg-slate-950/20 border border-slate-800/60 flex items-center gap-1 shrink-0"
                              >
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getMartialArtColor(art) || '#94a3b8' }}></span>
                                {formatArtName(art)}
                              </span>
                            </React.Fragment>
                          ))}
                          {(!combo.arts || combo.arts.filter(Boolean).length === 0) && (
                            <span className="text-[9px] text-slate-600 italic font-semibold shrink-0">無登錄武學</span>
                          )}
                        </div>
                        
                        <span className="bg-blue-950/30 border border-blue-900/40 text-blue-400 font-mono text-[8.5px] font-extrabold px-1.5 py-0.5 rounded shadow whitespace-nowrap shrink-0">
                          {combo.power || 0} 鵝
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }

              // Otherwise, not using a matching saved combo: show all of player's actual martial arts grouped 2 per line
              const artPairs: string[][] = [];
              const artsToUse = player.martialArts || [];
              for (let i = 0; i < artsToUse.length; i += 2) {
                artPairs.push(artsToUse.slice(i, i + 2));
              }

              if (artPairs.length === 0) {
                return (
                  <div className="flex items-center gap-2 text-[9px] py-0.5 whitespace-nowrap text-left justify-start w-full select-none">
                    <span className="text-[9px] text-slate-600 italic font-semibold shrink-0">無登錄武學</span>
                    {player.power && (
                      <span className="bg-blue-950/30 border border-blue-900/40 text-blue-400 font-mono text-[8.5px] font-extrabold px-2 py-0.5 rounded shadow whitespace-nowrap shrink-0">
                        {player.power} 鵝
                      </span>
                    )}
                  </div>
                );
              }

              return (
                <div className="space-y-1 w-full">
                  {artPairs.map((pair, pIdx) => (
                    <div key={pIdx} className="flex items-center gap-2 text-[9px] py-0.5 whitespace-nowrap text-left justify-start w-full select-none">
                      <div className="flex items-center gap-1 font-bold text-slate-200">
                        {pair[0] && (
                          <span 
                            className="px-1.5 py-0.5 rounded text-[8.5px] font-semibold text-slate-200 bg-slate-950/20 border border-slate-800/60 flex items-center gap-1 shrink-0"
                          >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getMartialArtColor(pair[0]) || '#94a3b8' }}></span>
                            {formatArtName(pair[0])}
                          </span>
                        )}
                        {pair[1] && <span className="text-[8px] text-slate-650 font-black shrink-0">+</span>}
                        {pair[1] && (
                          <span 
                            className="px-1.5 py-0.5 rounded text-[8.5px] font-semibold text-slate-200 bg-[#020617]/50 border border-slate-800/60 flex items-center gap-1 shrink-0"
                          >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getMartialArtColor(pair[1]) || '#94a3b8' }}></span>
                            {formatArtName(pair[1])}
                          </span>
                        )}
                      </div>
                      {pIdx === 0 && (
                        <span className="bg-blue-950/30 border border-blue-900/40 text-blue-400 font-mono text-[8.5px] font-extrabold px-2 py-0.5 rounded shadow whitespace-nowrap shrink-0">
                          {player.power || '-'} 鵝
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </td>
      <td className="p-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-1.5 justify-center items-start">
          {/* Saturday Sessions Wrap */}
          {(() => {
            const activeSatS = player.satSessions || (player.satAvailability === 'YES' ? ['RK1', 'NG1', 'NG2', 'NG3', 'NG4'] : []);
            return (
              <div className="flex items-center gap-1 bg-indigo-950/15 border border-indigo-500/10 p-0.5 px-1 rounded-lg w-full">
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
                  className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white px-1 py-0.5 rounded leading-none shrink-0 border border-indigo-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  六
                </button>
                <div className="flex flex-nowrap gap-0.5">
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
                        className={`text-[8px] font-black px-1 py-0.5 rounded transition-all select-none border ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 shadow-sm shadow-indigo-500/20 scale-105 hover:bg-indigo-500'
                            : 'bg-[#020617] border-slate-800 hover:border-slate-700'
                        } ${
                          s === 'RK1'
                            ? 'text-yellow-400 font-extrabold'
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
              <div className="flex items-center gap-1 bg-teal-950/15 border border-teal-500/10 p-0.5 px-1 rounded-lg w-full">
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
                  className="text-[8px] font-black text-teal-400 bg-teal-500/10 hover:bg-teal-500 hover:text-white px-1 py-0.5 rounded leading-none shrink-0 border border-teal-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  日
                </button>
                <div className="flex flex-nowrap gap-0.5">
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
                        className={`text-[8px] font-black px-1 py-0.5 rounded transition-all select-none border ${
                          isSelected
                            ? 'bg-teal-600 border-teal-500 shadow-sm shadow-teal-500/20 scale-105 hover:bg-teal-500'
                            : 'bg-[#020617] border-slate-800 hover:border-slate-700'
                        } ${
                          s === 'RK1'
                            ? 'text-yellow-400 font-extrabold'
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
      <td className="p-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-1.5 justify-center items-start min-h-[36px]">
          {/* Saturday Assigned Row */}
          {(() => {
            const satAssigned = ['RK1', 'NG1', 'NG2', 'NG3', 'NG4']
              .map(s => `SAT_${s}`)
              .filter(as => (player.assignedSessions || []).includes(as));
            
            if (satAssigned.length === 0) return null;
            return (
              <div className="flex flex-nowrap items-center gap-1">
                {satAssigned.map(as => {
                  const name = as.replace('SAT_', '');
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
                      className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-black transition-all bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 hover:bg-red-500 hover:text-white hover:border-red-500 cursor-pointer"
                      title="點擊可移除分配"
                    >
                      六: <span className={name === 'RK1' ? 'text-yellow-300 font-extrabold' : 'text-cyan-200 font-bold'}>{name}</span>
                      <i className="fa-solid fa-xmark text-[7px] ml-0.5 opacity-60"></i>
                    </span>
                  );
                })}
              </div>
            );
          })()}

          {/* Sunday Assigned Row */}
          {(() => {
            const sunAssigned = ['RK1', 'NG1', 'NG2', 'NG3', 'NG4']
              .map(s => `SUN_${s}`)
              .filter(as => (player.assignedSessions || []).includes(as));
            
            if (sunAssigned.length === 0) return null;
            return (
              <div className="flex flex-nowrap items-center gap-1">
                {sunAssigned.map(as => {
                  const name = as.replace('SUN_', '');
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
                      className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-black transition-all bg-amber-500/15 border border-amber-500/35 text-amber-400 hover:bg-red-500 hover:text-white hover:border-red-500 cursor-pointer"
                      title="點擊可移除分配"
                    >
                      日: <span className={name === 'RK1' ? 'text-yellow-300 font-extrabold' : 'text-cyan-200 font-bold'}>{name}</span>
                      <i className="fa-solid fa-xmark text-[7px] ml-0.5 opacity-60"></i>
                    </span>
                  );
                })}
              </div>
            );
          })()}
          
          {/* Multi-select dropdown to assign sessions */}
          {(() => {
            const satS = player.satSessions || (player.satAvailability === 'YES' ? ['RK1', 'NG1', 'NG2', 'NG3', 'NG4'] : []);
            const sunS = player.sunSessions || (player.sunAvailability === 'YES' ? ['RK1', 'NG1', 'NG2', 'NG3', 'NG4'] : []);
            const available: string[] = [];
            satS.forEach(s => available.push(`SAT_${s}`));
            sunS.forEach(s => available.push(`SUN_${s}`));
            const assigned = player.assignedSessions || [];
            
            if (available.length > 0) {
              return (
                <div className="flex items-center gap-1.5" ref={dropdownRef}>
                  <div className="relative inline-block">
                    <button
                      type="button"
                      disabled={isRestricted}
                      onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                      className="bg-[#1e293b] hover:bg-slate-800 text-[10px] border border-blue-500/30 rounded px-2 py-0.5 outline-none text-blue-400 font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                    >
                      <i className="fa-solid fa-plus text-[8px]"></i>
                      指派
                    </button>
                    {showAssignDropdown && (
                      <div className="absolute left-0 mt-1.5 w-44 bg-[#0a0f1d] border border-slate-800 rounded-xl shadow-2xl p-2 z-30 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="px-1.5 py-1 border-b border-slate-800/60 mb-1">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">選擇指派場次</span>
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-0.5">
                          {available.map(s => {
                            const isSat = s.startsWith('SAT_');
                            const name = s.replace('SAT_', '').replace('SUN_', '');
                            const isSelected = assigned.includes(s);
                            return (
                              <label
                                key={s}
                                className={`flex items-center gap-2 p-1.5 hover:bg-slate-800/40 rounded-lg cursor-pointer transition-all select-none text-[10px] font-bold ${
                                  isSelected ? 'text-blue-400 bg-blue-500/5' : 'text-slate-400'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isRestricted) return;
                                    let newAssigned = [...assigned];
                                    const newTeamBySession = { ...player.teamBySession };
                                    if (isSelected) {
                                      newAssigned = newAssigned.filter(item => item !== s);
                                      delete newTeamBySession[s];
                                    } else {
                                      newAssigned.push(s);
                                      if (!newTeamBySession[s]) {
                                        newTeamBySession[s] = '第一隊:進攻';
                                      }
                                    }
                                    onEdit({
                                      ...player,
                                      assignedSessions: newAssigned,
                                      teamBySession: newTeamBySession
                                    });
                                  }}
                                  className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 bg-[#020617] border-slate-700 rounded cursor-pointer"
                                />
                                <span>
                                  {isSat ? '六' : '日'}: {name}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {assigned.length > 0 && (
                    <button
                      type="button"
                      disabled={isRestricted}
                      onClick={() => {
                        if (isRestricted) return;
                        onEdit({
                          ...player,
                          assignedSessions: [],
                          teamBySession: {}
                        });
                      }}
                      className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-550 text-[10px] border border-red-500/20 rounded px-2 py-0.5 font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                      title="一鍵清除此人員的所有分配場次"
                    >
                      <i className="fa-solid fa-eraser text-[8px]"></i>
                      清除
                    </button>
                  )}
                </div>
              );
            }
            return null;
          })()}

          {(!player.assignedSessions || player.assignedSessions.length === 0) && (
            <span className="text-slate-500 text-[10px] font-bold">未指派</span>
          )}
        </div>
      </td>
      <td className="p-3 text-[10px] text-slate-500 font-bold hidden lg:table-cell italic">
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
      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
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
  onUpdateMember?: (member: Member) => Promise<void>;
  martialArts: MartialArts[];
  teams: string[];
  availabilityOptions: Availability[];
  isRestricted?: boolean;
  projectName?: string;
  members?: Member[];
  heartMethods?: HeartMethod[];
}

export const RegistrationList: React.FC<RegistrationListProps> = ({
  players,
  lastAddedPlayerId,
  onUpdatePlayers,
  onDeletePlayer,
  onClearPlayers,
  onResetTeams,
  onEditPlayer,
  onUpdateMember,
  martialArts,
  teams,
  availabilityOptions,
  isRestricted,
  projectName,
  members = [],
  heartMethods = []
}) => {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [activeMas, setActiveMas] = useState<string[]>(["無名劍法", "嗟夫刀法", "青山執筆", "明川藥典"]);
  const [targetTeam, setTargetTeam] = useState(teams[0]);
  const [bulkSource, setBulkSource] = useState(teams[0]);
  const [bulkTarget, setBulkTarget] = useState(teams[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<Player | null>(null);

  const [filterNoSelf, setFilterNoSelf] = useState(false);
  const [filterDc, setFilterDc] = useState(false);
  const [filterMic, setFilterMic] = useState(false);

  const [statusStates, setStatusStates] = useState<Record<string, 'none' | 'mark' | 'select'>>({
    noSelf: 'none',
    hasDc: 'none',
    canMic: 'none'
  });

  const { showToast } = useToast();
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [showSmartAssign, setShowSmartAssign] = useState(false);
  const [smartTargetSession, setSmartTargetSession] = useState<string>('SAT_RK1');
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);

  const playersWithComboArts = useMemo(() => {
    return players.map(p => {
      const matchedMember = members.find(m => m.gameName.trim().toLowerCase() === p.gameId.trim().toLowerCase());
      const comboArtsSet = new Set<string>(p.martialArts || []);
      if (matchedMember?.combos) {
        matchedMember.combos.forEach(combo => {
          if (combo.arts) {
            combo.arts.forEach(art => {
              if (art) comboArtsSet.add(art);
            });
          }
        });
      }
      return {
        ...p,
        martialArts: Array.from(comboArtsSet)
      };
    });
  }, [players, members]);

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
  } = useMartialArtsFilter(playersWithComboArts, teams);

  const parsePower = (powerStr?: string): number => {
    if (!powerStr) return 0;
    const match = powerStr.match(/([0-9.]+)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const displayedPlayers = useMemo(() => {
    const list = [...sortedPlayers];
    
    const isMatching = (p: Player) => {
      const matchedMember = members.find(m => m.gameName.trim().toLowerCase() === p.gameId.trim().toLowerCase());
      const displayNoSelf = matchedMember ? (matchedMember.noSelf || false) : (p.noSelf || false);
      const displayHasDc = matchedMember ? (matchedMember.hasDc || false) : (p.hasDc || false);
      const displayCanMic = matchedMember ? (matchedMember.canMic || false) : (p.canMic || false);

      const matchesMa = maFilter.length > 0 && p.martialArts.some(ma => maFilter.includes(ma));
      const matchesNoSelf = filterNoSelf && displayNoSelf === true;
      const matchesDc = filterDc && displayHasDc === true;
      const matchesMic = filterMic && displayCanMic === true;
      
      const hasActiveFilter = maFilter.length > 0 || filterNoSelf || filterDc || filterMic;
      if (!hasActiveFilter) return false;
      
      return matchesMa || matchesNoSelf || matchesDc || matchesMic;
    };
    
    return list.sort((a, b) => {
      const aMatch = isMatching(a);
      const bMatch = isMatching(b);
      
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0; // retain sortedPlayers order
    });
  }, [sortedPlayers, maFilter, filterNoSelf, filterDc, filterMic, members]);

  const displayedFilteredPlayers = useMemo(() => {
    let list = filteredPlayers;
    if (maFilter.length === 0 && (filterNoSelf || filterDc || filterMic)) {
      list = playersWithComboArts;
    }
    if (filterNoSelf) {
      list = list.filter(p => {
        const matchedMember = members.find(m => m.gameName.trim().toLowerCase() === p.gameId.trim().toLowerCase());
        return matchedMember ? matchedMember.noSelf === true : p.noSelf === true;
      });
    }
    if (filterDc) {
      list = list.filter(p => {
        const matchedMember = members.find(m => m.gameName.trim().toLowerCase() === p.gameId.trim().toLowerCase());
        return matchedMember ? matchedMember.hasDc === true : p.hasDc === true;
      });
    }
    if (filterMic) {
      list = list.filter(p => {
        const matchedMember = members.find(m => m.gameName.trim().toLowerCase() === p.gameId.trim().toLowerCase());
        return matchedMember ? matchedMember.canMic === true : p.canMic === true;
      });
    }
    return list;
  }, [filteredPlayers, playersWithComboArts, maFilter, filterNoSelf, filterDc, filterMic, members]);

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

  const getMaCount = useCallback((maName: string) => {
    return playersWithComboArts.filter(p => p.martialArts.includes(maName)).length;
  }, [playersWithComboArts]);

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

    const getMatchingIds = () => {
      return playersWithComboArts
        .filter(p => {
          const matchedMember = members.find(m => m.gameName.trim().toLowerCase() === p.gameId.trim().toLowerCase());
          const displayNoSelf = matchedMember ? (matchedMember.noSelf || false) : (p.noSelf || false);
          const displayHasDc = matchedMember ? (matchedMember.hasDc || false) : (p.hasDc || false);
          const displayCanMic = matchedMember ? (matchedMember.canMic || false) : (p.canMic || false);

          if (statusKey === 'noSelf') return displayNoSelf === true;
          if (statusKey === 'hasDc') return displayHasDc === true;
          if (statusKey === 'canMic') return displayCanMic === true;
          return false;
        })
        .map(p => p.id);
    };

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
      
      const matchingIds = getMatchingIds();
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
      
      const matchingIds = getMatchingIds();
      const newSelected = new Set(selectedPlayerIds);
      matchingIds.forEach(id => newSelected.delete(id));
      setSelectedPlayerIds(newSelected);
    }
  }, [statusStates, playersWithComboArts, selectedPlayerIds, members]);

  const handleClearFilter = useCallback(() => {
    clearFilter();
    setFilterNoSelf(false);
    setFilterDc(false);
    setFilterMic(false);
    setStatusStates({ noSelf: 'none', hasDc: 'none', canMic: 'none' });
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
    const matchedMember = members.find(m => m.gameName.trim().toLowerCase() === player.gameId.trim().toLowerCase());
    if (matchedMember) {
      setEditBuffer({
        ...player,
        noSelf: matchedMember.noSelf || false,
        hasDc: matchedMember.hasDc || false,
        canMic: matchedMember.canMic || false,
        martialArts: player.martialArts.length > 0 ? player.martialArts : (matchedMember.combos?.[0]?.arts || []),
        power: player.power || String(matchedMember.combos?.[0]?.power || '')
      });
    } else {
      setEditBuffer({ ...player });
    }
  }, [members]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditBuffer(null);
  }, []);

  const saveEdit = useCallback(async () => {
    if (editBuffer) {
      onEditPlayer(editBuffer);

      const matchedMember = members.find(m => m.gameName.trim().toLowerCase() === editBuffer.gameId.trim().toLowerCase());
      if (matchedMember && onUpdateMember) {
        const oldPlayer = players.find(p => p.id === editBuffer.id);
        const oldArts = oldPlayer?.martialArts || [];
        
        let updatedCombos = matchedMember.combos ? matchedMember.combos.map(c => ({...c})) : [];
        const newPowerVal = parseFloat(editBuffer.power || '0') || 0;

        const oldMatchingComboIdx = updatedCombos.findIndex(combo => {
          const comboArts = combo.arts || [];
          if (comboArts.length !== oldArts.length) return false;
          return comboArts.every(art => oldArts.includes(art));
        });

        if (oldMatchingComboIdx !== -1) {
          updatedCombos[oldMatchingComboIdx] = {
            ...updatedCombos[oldMatchingComboIdx],
            arts: editBuffer.martialArts as any,
            power: newPowerVal
          };
        } else if (updatedCombos.length > 0) {
          updatedCombos[0] = {
            ...updatedCombos[0],
            arts: editBuffer.martialArts as any,
            power: newPowerVal
          };
        } else {
          updatedCombos.push({
            name: '預設搭配',
            arts: editBuffer.martialArts as any,
            power: newPowerVal
          });
        }

        const updatedMember: Member = {
          ...matchedMember,
          noSelf: editBuffer.noSelf,
          hasDc: editBuffer.hasDc,
          canMic: editBuffer.canMic,
          combos: updatedCombos
        };

        try {
          await onUpdateMember(updatedMember);
          showToast(`已同步更新 [${editBuffer.gameId}] 於百業成員的資料與搭配`, 'success');
        } catch (err) {
          console.error("Failed to sync member:", err);
          showToast('百業成員同步失敗', 'error');
        }
      }

      setEditingId(null);
      setEditBuffer(null);
    }
  }, [editBuffer, onEditPlayer, members, players, onUpdateMember, showToast]);

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
    <div className="space-y-4">
      {/* Stats Summary Panel */}
      <section className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-3 md:p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 bg-[#020617] rounded-xl border border-slate-800/40 space-y-0.5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">目前報名</p>
            <p className="text-xl font-black text-blue-500">{stats.total} <span className="text-[10px] text-slate-600">人</span></p>
          </div>
          <div className="p-3 bg-[#020617] rounded-xl border border-slate-800/40 space-y-0.5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">週六出席</p>
            <p className="text-xl font-black text-emerald-500">{stats.satCount} <span className="text-[10px] text-slate-600">人</span></p>
          </div>
          <div className="p-3 bg-[#020617] rounded-xl border border-slate-800/40 space-y-0.5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">週日出席</p>
            <p className="text-xl font-black text-emerald-500">{stats.sunCount} <span className="text-[10px] text-slate-600">人</span></p>
          </div>
          <div className="p-3 bg-[#020617] rounded-xl border border-slate-800/40 space-y-0.5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">待分配</p>
            <p className="text-xl font-black text-amber-500">{stats.unassignedCount} <span className="text-[10px] text-slate-600">人</span></p>
          </div>
        </div>
      </section>
          
      {/* Management Toolbar */}
      <section className="bg-[#0f172a] p-3 rounded-2xl border border-slate-800">
        {/* Collapsible Header */}
        <div 
          onClick={() => setIsToolbarExpanded(!isToolbarExpanded)}
          className="flex items-center justify-between cursor-pointer select-none pb-0.5 hover:text-slate-350 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <i className="fa-solid fa-wand-magic-sparkles text-blue-500 text-sm animate-pulse"></i>
            <h3 className="text-xs font-black text-slate-200 tracking-wider">
              篩選、標記與配置面板
            </h3>
            {!isToolbarExpanded && (
              <div className="flex flex-wrap items-center gap-1.5 ml-2">
                {maFilter.length > 0 ? (
                  <span className="text-[9px] font-black text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                    已選 {maFilter.length} 武學
                  </span>
                ) : (
                  <span className="text-[9.5px] font-bold text-slate-500 bg-[#020617] px-1.5 py-0.5 rounded border border-slate-800/60">
                    無武學篩選
                  </span>
                )}
                {(statusStates.noSelf !== 'none' || statusStates.hasDc !== 'none' || statusStates.canMic !== 'none') && (
                  <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    已啟用狀態篩選
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-350 transition-colors">
            <span>{isToolbarExpanded ? '點擊收合' : '點擊展開篩選'}</span>
            <i className={`fa-solid ${isToolbarExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-slate-400 transition-transform duration-200`}></i>
          </div>
        </div>

        {isToolbarExpanded && (
          <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-slate-800/40 animate-fade-in">
          
          {/* Martial Arts Filter Section */}
          <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <i className="fa-solid fa-filter text-blue-500"></i>
                    武學人數與標記
                  </h3>
                  {(maFilter.length > 0 || statusStates.noSelf !== 'none' || statusStates.hasDc !== 'none' || statusStates.canMic !== 'none') && (
                    <div className="flex items-center gap-1.5">
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
                    className="bg-[#020617] border border-slate-800 text-[9px] rounded-md px-2 py-1 outline-none text-slate-355 font-bold hover:border-slate-700 transition-all cursor-pointer text-slate-300"
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#020617] p-2.5 px-3.5 rounded-xl border border-slate-800/80 mt-1 w-full">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-[9px] font-black text-purple-400 uppercase tracking-tighter shrink-0 animate-pulse">配置功能</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowSmartAssign(!showSmartAssign)}
                  className={`px-3 h-8 bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-bold rounded-lg transition-all shadow flex items-center justify-center gap-1 cursor-pointer ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <i className="fa-solid fa-brain"></i>
                  輔助選隊
                </button>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-3 h-8 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-bold rounded-lg transition-all shadow flex items-center justify-center gap-1 cursor-pointer"
                >
                  <i className="fa-solid fa-file-excel"></i>
                  輸出EXCEL (XLSX)
                </button>
              </div>
            </div>
          </div>

        {/* Smart Assignment configs Drawer */}
        {showSmartAssign && (
          <SmartAssignPanel 
            players={players}
            teams={teams}
            martialArts={martialArts}
            isRestricted={isRestricted}
            onUpdatePlayers={(updates, s) => onUpdatePlayers(updates, s)}
            currentSession={smartTargetSession}
            onSessionChange={(s) => setSmartTargetSession(s)}
          />
        )}

        <div className="flex justify-end items-center pt-4 border-t border-slate-800/50">
            {!isRestricted && (
              <button onClick={onClearPlayers} className="text-[10px] font-black text-red-500/70 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer">
                  <i className="fa-solid fa-trash-can"></i> 清除整張名單
              </button>
            )}
        </div>
        </div>
        )}

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
                      {p.martialArts.map((ma, i) => {
                        const maObj = martialArts.find(m => m.name === ma);
                        return (
                          <span key={`${ma}-${i}`} className="inline-flex items-center gap-0.5 px-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[8px] font-bold text-slate-500">
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

      <section className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#020617] border-b border-slate-800">
              <tr>
                <th className="p-3 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={playersWithComboArts.length > 0 && selectedPlayerIds.size === playersWithComboArts.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedPlayerIds(new Set(playersWithComboArts.map(p => p.id)));
                      else setSelectedPlayerIds(new Set());
                    }}
                    className="rounded border-slate-700 bg-slate-900"
                  />
                </th>
                <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left w-1/4">成員遊戲名稱</th>
                <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">
                  登錄武學搭配與戰力
                </th>
                <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">報名場次</th>
                <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">分配參加場次</th>
                <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left hidden lg:table-cell">備註</th>
                <th className="p-3 text-center"></th>
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
                displayedPlayers.map((p) => {
                  const originalPlayer = players.find(orig => orig.id === p.id) || p;
                  const isEditing = editingId === p.id;
                  const isNew = p.id === lastAddedPlayerId;
                  
                  const matchedMember = members.find(m => m.gameName.trim().toLowerCase() === p.gameId.trim().toLowerCase());
                  const displayNoSelf = matchedMember ? matchedMember.noSelf : p.noSelf;
                  const displayHasDc = matchedMember ? matchedMember.hasDc : p.hasDc;
                  const displayCanMic = matchedMember ? matchedMember.canMic : p.canMic;

                  const isFiltered = (maFilter.length > 0 && p.martialArts.some(ma => maFilter.includes(ma))) ||
                                     (filterNoSelf && displayNoSelf === true) ||
                                     (filterDc && displayHasDc === true) ||
                                     (filterMic && displayCanMic === true);
                  
                  return (
                    <PlayerRow 
                      key={p.id}
                      player={isEditing ? (editBuffer || p) : p}
                      isEditing={isEditing}
                      isNew={isNew}
                      isFiltered={isFiltered}
                      selected={selectedPlayerIds.has(p.id)}
                      onToggleSelect={toggleSelect}
                      onStartEdit={startEdit}
                      onEdit={isEditing ? setEditBuffer : onEditPlayer}
                      onDelete={onDeletePlayer}
                      onUpdateTeam={(id, team) => onUpdatePlayers([{ id, team }])}
                      teams={teams}
                      martialArts={martialArts}
                      isRestricted={isRestricted}
                      members={members}
                      heartMethods={heartMethods}
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
