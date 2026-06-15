
import React, { useState } from 'react';
import { MartialArts, Player, HeartMethod, Member } from '../types';
import { useToast } from './Toast';

export const getRarityBadge = (rarity?: 'gold' | 'purple' | 'blue' | string) => {
  if (rarity === 'gold' || rarity === '金色') return { label: '金色', bg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' };
  if (rarity === 'purple' || rarity === '紫色') return { label: '紫色', bg: 'bg-purple-500/20 text-purple-400 border border-purple-500/30' };
  return { label: '藍色', bg: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' };
};

interface ConfigSheetProps {
  martialArts: MartialArts[];
  teams: string[];
  players: Player[];
  members?: Member[];
  heartMethods?: HeartMethod[];
  weaponSets?: string[];
  armorSets?: string[];
  onUpdateMartialArts: (newMa: MartialArts[]) => void;
  onUpdateTeams: (newTeams: string[]) => void;
  onUpdateHeartMethods?: (newHm: HeartMethod[]) => void;
  onUpdateWeaponSets?: (newSets: string[]) => void;
  onUpdateArmorSets?: (newSets: string[]) => void;
  onBatchUpdatePlayers: (updates: { id: string; team: string }[]) => void;
  onUpdateMembers?: (updated: Member[]) => void;
  onRestoreDefaults: () => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  isRestricted?: boolean;
}

export const ConfigSheet: React.FC<ConfigSheetProps> = ({ 
  martialArts, 
  teams, 
  players,
  members = [],
  heartMethods = [],
  weaponSets = [],
  armorSets = [],
  onUpdateMartialArts,
  onUpdateTeams,
  onUpdateHeartMethods,
  onUpdateWeaponSets,
  onUpdateArmorSets,
  onBatchUpdatePlayers,
  onUpdateMembers,
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

  // Heart methods states
  const [newHmName, setNewHmName] = useState('');
  const [newHmDesc, setNewHmDesc] = useState('');
  const [newHmRarity, setNewHmRarity] = useState<'gold' | 'purple' | 'blue' | string>('gold');
  const [newHmType, setNewHmType] = useState('通用');
  const [customHmType, setCustomHmType] = useState('');
  const [editingHmIdx, setEditingHmIdx] = useState<number | null>(null);
  const [editHmDescBuffer, setEditHmDescBuffer] = useState('');
  const [editHmRarityBuffer, setEditHmRarityBuffer] = useState<'gold' | 'purple' | 'blue' | string>('gold');
  const [editHmTypeBuffer, setEditHmTypeBuffer] = useState('通用');
  const [editCustomHmType, setEditCustomHmType] = useState('');

  // Equipment sets states
  const [newWeaponSet, setNewWeaponSet] = useState('');
  const [editingWeaponIdx, setEditingWeaponIdx] = useState<number | null>(null);
  const [newArmorSet, setNewArmorSet] = useState('');
  const [editingArmorIdx, setEditingArmorIdx] = useState<number | null>(null);

  const addWeaponSet = () => {
    if (!newWeaponSet || isRestricted) return;
    const name = newWeaponSet.trim();
    if (weaponSets.includes(name)) {
      showToast('套裝名稱已存在！', 'error');
      return;
    }
    if (onUpdateWeaponSets) {
      onUpdateWeaponSets([...weaponSets, name]);
    }
    setNewWeaponSet('');
  };

  const removeWeaponSet = (index: number) => {
    if (isRestricted || !onUpdateWeaponSets) return;
    const nameToRemove = weaponSets[index];
    
    // Find affected members who have this weaponSet in any of their combos
    const affectedMembers = members.filter(m => 
      m.combos?.some(combo => combo.weaponSet === nameToRemove)
    );

    const executeRemove = () => {
      // Clean up the weaponSet from affected members
      if (affectedMembers.length > 0 && onUpdateMembers) {
        const updatedMembers = members.map(m => {
          if (!m.combos) return m;
          const updatedCombos = m.combos.map(combo => {
            if (combo.weaponSet === nameToRemove) {
              const { weaponSet, ...rest } = combo;
              return { ...rest };
            }
            return combo;
          });
          return { ...m, combos: updatedCombos };
        });
        onUpdateMembers(updatedMembers);
      }
      onUpdateWeaponSets(weaponSets.filter((_, i) => i !== index));
      showToast(`已成功移除 [${nameToRemove}] 武器裝備配置，並同步清除所有相關成員之配置！`, 'success');
    };

    // First confirmation: warning
    showConfirm(
      "確認要移除該武器裝備配置？",
      `注意：此刪除動作將同步自所有已登入成員的搭配中移除「${nameToRemove}」武器配置。${affectedMembers.length > 0 ? `目前共有 ${affectedMembers.length} 位成員使用此配置項目。` : ''}確定要繼續嗎？`,
      () => {
        // Second confirmation: double-check
        showConfirm(
          "重複確認刪除（第二階段確認）",
          `您即將永久移除 [${nameToRemove}]。這將移除百業成員的相關配置且此操作無法復原。請再次確認是否真的要刪除？`,
          executeRemove
        );
      }
    );
  };

  const handleUpdateWeaponSet = (index: number) => {
    if (isRestricted || !onUpdateWeaponSets) return;
    const newVal = editBuffer.trim();
    if (!newVal) {
      setEditingWeaponIdx(null);
      return;
    }
    if (weaponSets.includes(newVal) && weaponSets[index] !== newVal) {
      showToast('套裝名稱已存在！', 'error');
      return;
    }
    const updated = [...weaponSets];
    updated[index] = newVal;
    onUpdateWeaponSets(updated);
    setEditingWeaponIdx(null);
  };

  const addArmorSet = () => {
    if (!newArmorSet || isRestricted) return;
    const name = newArmorSet.trim();
    if (armorSets.includes(name)) {
      showToast('套裝名稱已存在！', 'error');
      return;
    }
    if (onUpdateArmorSets) {
      onUpdateArmorSets([...armorSets, name]);
    }
    setNewArmorSet('');
  };

  const removeArmorSet = (index: number) => {
    if (isRestricted || !onUpdateArmorSets) return;
    const nameToRemove = armorSets[index];
    
    // Find affected members who have this armorSet in any of their combos
    const affectedMembers = members.filter(m => 
      m.combos?.some(combo => combo.armorSet === nameToRemove)
    );

    const executeRemove = () => {
      // Clean up the armorSet from affected members
      if (affectedMembers.length > 0 && onUpdateMembers) {
        const updatedMembers = members.map(m => {
          if (!m.combos) return m;
          const updatedCombos = m.combos.map(combo => {
            if (combo.armorSet === nameToRemove) {
              const { armorSet, ...rest } = combo;
              return { ...rest };
            }
            return combo;
          });
          return { ...m, combos: updatedCombos };
        });
        onUpdateMembers(updatedMembers);
      }
      onUpdateArmorSets(armorSets.filter((_, i) => i !== index));
      showToast(`已成功移除 [${nameToRemove}] 防具裝備配置，並同步清除所有相關成員之配置！`, 'success');
    };

    // First confirmation: warning
    showConfirm(
      "確認要移除該防具裝備配置？",
      `注意：此刪除動作將同步自所有已登入成員的搭配中移除「${nameToRemove}」防具配置。${affectedMembers.length > 0 ? `目前共有 ${affectedMembers.length} 位成員使用此配置項目。` : ''}確定要繼續嗎？`,
      () => {
        // Second confirmation: double check
        showConfirm(
          "重複確認刪除（第二階段確認）",
          `您即將永久移除 [${nameToRemove}]。這將移除百業成員的相關配置且此操作無法復原。請再次確認是否真的要刪除？`,
          executeRemove
        );
      }
    );
  };

  const handleUpdateArmorSet = (index: number) => {
    if (isRestricted || !onUpdateArmorSets) return;
    const newVal = editBuffer.trim();
    if (!newVal) {
      setEditingArmorIdx(null);
      return;
    }
    if (armorSets.includes(newVal) && armorSets[index] !== newVal) {
      showToast('套裝名稱已存在！', 'error');
      return;
    }
    const updated = [...armorSets];
    updated[index] = newVal;
    onUpdateArmorSets(updated);
    setEditingArmorIdx(null);
  };

  const addMartialArt = () => {
    if (!newMaName || isRestricted) return;
    onUpdateMartialArts([...martialArts, { name: newMaName, color: newMaColor }]);
    setNewMaName('');
  };

  const removeMa = (index: number) => {
    if (isRestricted) return;
    const maToRemove = martialArts[index];
    const affectedPlayers = players.filter(p => p.martialArts.includes(maToRemove.name));
    
    // Find affected members who have this martial art in any of their combos
    const affectedMembers = members.filter(m => 
      m.combos?.some(combo => combo.arts?.includes(maToRemove.name))
    );

    const executeRemove = () => {
      // 1. Move affected players to backfill team if they use this martial art
      if (affectedPlayers.length > 0) {
        const backfillTeam = teams.find(t => t.includes('候補')) || teams[teams.length - 1];
        onBatchUpdatePlayers(affectedPlayers.map(p => ({ id: p.id, team: backfillTeam })));
      }
      
      // 2. Clean up the martial art from affected members' combos
      if (affectedMembers.length > 0 && onUpdateMembers) {
        const updatedMembers = members.map(m => {
          if (!m.combos) return m;
          const updatedCombos = m.combos.map(combo => {
            if (combo.arts?.includes(maToRemove.name)) {
              return {
                ...combo,
                arts: combo.arts.filter(art => art !== maToRemove.name)
              };
            }
            return combo;
          });
          return { ...m, combos: updatedCombos };
        });
        onUpdateMembers(updatedMembers);
      }

      // 3. Remove the martial art from configured list
      onUpdateMartialArts(martialArts.filter((_, i) => i !== index));
      showToast(`已成功移除 [${maToRemove.name}] 武學配置，並同步清除所有相關成員之搭配！`, 'success');
    };

    // First confirmation: warning of member cleanup
    showConfirm(
      "確認要移除該武學配置？",
      `注意：此刪除動作將同步自所有已登入成員的搭配中移除「${maToRemove.name}」武學。${affectedPlayers.length > 0 ? `目前共有 ${affectedPlayers.length} 位報名人員使用此武學，移除後將移動他們到候補隊伍。` : ''}確定要繼續嗎？`,
      () => {
        // Second confirmation: double-check
        showConfirm(
          "重複確認刪除（第二階段確認）",
          `您即將永久移除 [${maToRemove.name}]。這將移除百業成員的相關配置且此操作無法復原。請再次確認是否真的要刪除？`,
          executeRemove
        );
      }
    );
  };

  const addHeartMethod = () => {
    if (!newHmName || isRestricted) return;
    const finalType = newHmType === 'custom' ? customHmType.trim() : newHmType;
    if (onUpdateHeartMethods) {
      onUpdateHeartMethods([...heartMethods, { 
        name: newHmName.trim(), 
        description: newHmDesc.trim() || `心法類型: ${finalType}`, 
        rarity: newHmRarity as any,
        type: finalType
      }]);
    }
    setNewHmName('');
    setNewHmDesc('');
    setNewHmRarity('gold');
    setNewHmType('通用');
    setCustomHmType('');
  };

  const removeHm = (index: number) => {
    if (isRestricted || !onUpdateHeartMethods) return;
    const hmToRemove = heartMethods[index];

    // Find affected members who have this heart method in any of their combos
    const affectedMembers = members.filter(m => 
      m.combos?.some(combo => combo.heartMethods?.includes(hmToRemove.name))
    );

    const executeRemove = () => {
      // Clean up the heart method from affected members' combos
      if (affectedMembers.length > 0 && onUpdateMembers) {
        const updatedMembers = members.map(m => {
          if (!m.combos) return m;
          const updatedCombos = m.combos.map(combo => {
            if (combo.heartMethods?.includes(hmToRemove.name)) {
              return {
                ...combo,
                heartMethods: combo.heartMethods.filter(h => h !== hmToRemove.name)
              };
            }
            return combo;
          });
          return { ...m, combos: updatedCombos };
        });
        onUpdateMembers(updatedMembers);
      }
      onUpdateHeartMethods(heartMethods.filter((_, i) => i !== index));
      showToast(`已成功移除 [${hmToRemove.name}] 心法配置，並同步清除所有相關成員之配置！`, 'success');
    };

    // First confirmation: warning
    showConfirm(
      "確認要移除該心法配置？",
      `注意：此刪除動作將同步自所有已登入成員的搭配中移除「${hmToRemove.name}」心法。${affectedMembers.length > 0 ? `目前共有 ${affectedMembers.length} 位成員配戴此心法。` : ''}確定要繼續嗎？`,
      () => {
        // Second confirmation: double-check
        showConfirm(
          "重複確認刪除（第二階段確認）",
          `您即將永久移除 [${hmToRemove.name}]。這將移除百業成員的相關配置且此操作無法復原。請再次確認是否真的要刪除？`,
          executeRemove
        );
      }
    );
  };

  const handleUpdateHm = (index: number) => {
    if (isRestricted || !onUpdateHeartMethods) return;
    const newName = editBuffer.trim();
    const newDesc = editHmDescBuffer.trim();
    const finalType = editHmTypeBuffer === 'custom' ? editCustomHmType.trim() : editHmTypeBuffer;
    if (!newName) {
      setEditingHmIdx(null);
      return;
    }
    const newHms = [...heartMethods];
    newHms[index] = { 
      name: newName, 
      description: newDesc || `心法類型: ${finalType}`, 
      rarity: editHmRarityBuffer as any,
      type: finalType
    };
    onUpdateHeartMethods(newHms);
    setEditingHmIdx(null);
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
      showToast(`已成功移除 [${teamToRemove}] 隊伍配置！`, 'success');
    };

    // First confirmation: warn user of side effect of moving people
    showConfirm(
      "確認要移除該隊伍配置？",
      `注意：此刪除動作將同步自所有報名人員的編隊中移除「${teamToRemove}」。${affectedPlayers.length > 0 ? `目前共計 ${affectedPlayers.length} 位人員在此小隊，移除後預設會將他們移動到候補。` : ''}確定要繼續嗎？`,
      () => {
        // Second confirmation: double-check
        showConfirm(
          "重複確認刪除（第二階段確認）",
          `您即將永久移除 [${teamToRemove}]，且此操作無法復原。請再次確認是否真的要刪除此隊伍？`,
          executeRemove
        );
      }
    );
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
      // Clear editing states so UI doesn't remain in editing mode with stale indexes or inputs
      setEditingMaIdx(null);
      setEditingTeamIdx(null);
      setEditingHmIdx(null);
      setEditingWeaponIdx(null);
      setEditingArmorIdx(null);
      setNewMaName('');
      setNewTeamName('');
      setNewWeaponSet('');
      setNewArmorSet('');
      setNewHmName('');
      setNewHmDesc('');
      setNewHmRarity('gold');
      setNewHmType('通用');
      setCustomHmType('');

      if (players.length > 0) {
        // We know '候補' is in default TEAMS
        onBatchUpdatePlayers(players.map(p => ({ id: p.id, team: '候補' })));
      }
      showToast('已成功將所有武學、隊伍、心法、武器、防具及任務說明與攻略還原至系統初始狀態！', 'success');
    };

    showConfirm(
      "還原預設配置",
      "這將會把所有武學、隊伍、心法、武器裝備、防具裝備、任務說明及攻略還原至系統初始狀態。注意：還原後所有報名人員將被移動至「候補」隊伍以確保資料安全且不亂套。",
      execute
    );
  };

  return (
    <div className="space-y-4">
      {/* Restore Defaults */}
      <section className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-black flex items-center gap-3 text-red-500 uppercase tracking-tighter">
              <i className="fa-solid fa-triangle-exclamation"></i>
              配置初始化
            </h3>
            <p className="text-xs text-slate-500 font-bold max-w-xl">
              如果不小心將武學、隊伍、心法或裝備等配置改亂了，可以使用此功能還原至系統預設狀態（包含：常用二十大武學、標準一二三小隊配置、所有預設心法及武器防具套組、任務說明與攻略指引）。
            </p>
          </div>
          <button 
            disabled={isRestricted}
            onClick={handleRestoreDefaultsInternal}
            className={`px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition-all shadow-xl shadow-red-600/20 active:scale-95 whitespace-nowrap ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            還原預設配置
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Martial Arts Config */}
        <section className={`bg-white dark:bg-slate-900 p-4 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 ${isRestricted ? 'opacity-80' : ''}`}>
          <h3 className="text-xl font-black mb-4 flex items-center gap-3 text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
            <i className="fa-solid fa-database"></i>
            武學配置
          </h3>
          
          <div className="grid grid-cols-12 gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
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

          <div className="space-y-1.5 overflow-y-auto max-h-[400px] pr-2">
            {martialArts.map((ma, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 px-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 group hover:border-indigo-500/30 transition-all">
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
        <section className={`bg-white dark:bg-slate-900 p-4 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col ${isRestricted ? 'opacity-80' : ''}`}>
          <h3 className="text-xl font-black mb-4 flex items-center gap-3 text-teal-600 dark:text-teal-400 uppercase tracking-tighter">
            <i className="fa-solid fa-network-wired"></i>
            隊伍配置
          </h3>

          <div className="flex flex-col gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
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

          <div className="space-y-1.5 overflow-y-auto max-h-[400px] pr-2">
            {teams.map((team, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 px-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 group hover:border-teal-500/30 transition-all">
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
                      className={`font-bold text-slate-400 group-hover:text-teal-405 text-xs ${isRestricted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
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

        {/* Heart Methods Config */}
        <section className={`bg-white dark:bg-slate-900 p-4 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col ${isRestricted ? 'opacity-80' : ''}`}>
          <h3 className="text-xl font-black mb-4 flex items-center gap-3 text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">
            <i className="fa-solid fa-heart-pulse"></i>
            心法配置
          </h3>

          <div className="flex flex-col gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="space-y-4">
              {/* Row 1: Name and Rarity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1 uppercase">心法名稱</label>
                  <input
                    type="text"
                    value={newHmName}
                    onChange={(e) => setNewHmName(e.target.value)}
                    disabled={isRestricted}
                    placeholder="例如: 易水歌"
                    className={`w-full p-2.5 bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-300 border border-slate-300 dark:border-slate-800 rounded-lg outline-none focus:border-emerald-500 text-xs ${isRestricted ? 'cursor-not-allowed' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1 uppercase">心法顏色等級</label>
                  <select
                    value={newHmRarity}
                    onChange={(e) => setNewHmRarity(e.target.value)}
                    disabled={isRestricted}
                    className={`w-full p-2.5 bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-300 border border-slate-300 dark:border-slate-800 rounded-lg outline-none focus:border-emerald-500 text-xs ${isRestricted ? 'cursor-not-allowed' : ''}`}
                  >
                    <option value="gold">金色</option>
                    <option value="purple">紫色</option>
                    <option value="blue">藍色</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Heart Method Type (心法類型) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1 uppercase">選擇心法類型</label>
                  <select
                    value={newHmType}
                    onChange={(e) => setNewHmType(e.target.value)}
                    disabled={isRestricted}
                    className={`w-full p-2.5 bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-300 border border-slate-300 dark:border-slate-800 rounded-lg outline-none focus:border-emerald-500 text-xs ${isRestricted ? 'cursor-not-allowed' : ''}`}
                  >
                    {['通用', '鳴金虹', '鳴金影', '裂石威', '牽絲玉', '牽絲霖', '破竹風', '破竹塵', '裂石鈞'].map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                    <option value="custom">自訂 / 手動輸入...</option>
                  </select>
                </div>

                {newHmType === 'custom' && (
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1 uppercase">輸入自訂類型</label>
                    <input
                      type="text"
                      value={customHmType}
                      onChange={(e) => setCustomHmType(e.target.value)}
                      disabled={isRestricted}
                      placeholder="例如: 乾坤、無上"
                      className={`w-full p-2.5 bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-300 border border-slate-300 dark:border-slate-800 rounded-lg outline-none focus:border-emerald-500 text-xs ${isRestricted ? 'cursor-not-allowed' : ''}`}
                    />
                  </div>
                )}
              </div>

              <button
                onClick={addHeartMethod}
                disabled={!newHmName || isRestricted || (newHmType === 'custom' && !customHmType)}
                className={`w-full py-2.5 font-black rounded-xl transition-all shadow-lg text-xs ${
                  newHmName && (!isRestricted && (newHmType !== 'custom' || customHmType))
                  ? 'bg-emerald-600 hover:bg-emerald-505 text-white shadow-emerald-600/10'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                新增心法項目
              </button>
            </div>
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-[300px] pr-2">
            {heartMethods.map((hm, idx) => {
              const badge = getRarityBadge(hm.rarity);
              return (
                <div key={idx} className="p-2 px-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 group hover:border-emerald-501/30 transition-all space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      {editingHmIdx === idx && !isRestricted ? (
                        <div className="space-y-3 p-2 bg-white dark:bg-[#020617] rounded-xl border border-slate-200 dark:border-slate-800">
                          {/* Edit form */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[8px] font-black text-slate-400 mb-0.5">心法名稱</label>
                              <input
                                className="w-full bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-300 text-xs font-bold p-1 border border-slate-300 dark:border-slate-800 rounded outline-none focus:border-emerald-500"
                                value={editBuffer}
                                onChange={(e) => setEditBuffer(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-slate-400 mb-0.5">顏色等級</label>
                              <select
                                className="w-full bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-300 text-xs p-1 border border-slate-300 dark:border-slate-800 rounded outline-none focus:border-emerald-500"
                                value={editHmRarityBuffer}
                                onChange={(e) => setEditHmRarityBuffer(e.target.value)}
                              >
                                <option value="gold">金色</option>
                                <option value="purple">紫色</option>
                                <option value="blue">藍色</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[8px] font-black text-slate-400 mb-0.5">心法類型</label>
                              <select
                                className="w-full bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-300 text-xs p-1 border border-slate-300 dark:border-slate-800 rounded outline-none focus:border-emerald-500"
                                value={editHmTypeBuffer}
                                onChange={(e) => setEditHmTypeBuffer(e.target.value)}
                              >
                                {['通用', '鳴金虹', '鳴金影', '裂石威', '牽絲玉', '牽絲霖', '破竹風', '破竹塵', '裂石鈞'].map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                                <option value="custom">自訂 / 手動輸入...</option>
                              </select>
                            </div>
                            {editHmTypeBuffer === 'custom' && (
                              <div>
                                <label className="block text-[8px] font-black text-slate-400 mb-0.5">自訂值</label>
                                <input
                                  className="w-full bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-300 text-xs p-1 border border-slate-300 dark:border-slate-800 rounded outline-none focus:border-emerald-500"
                                  value={editCustomHmType}
                                  onChange={(e) => setEditCustomHmType(e.target.value)}
                                  placeholder="自訂類型"
                                />
                              </div>
                            )}
                          </div>

                          <div className="flex justify-end gap-2 pr-1">
                            <button
                              type="button"
                              onClick={() => setEditingHmIdx(null)}
                              className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-bold"
                            >
                              取消
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateHm(idx)}
                              className="px-3 py-1 bg-emerald-600 text-white hover:bg-emerald-500 rounded text-[10px] font-bold"
                            >
                              儲存
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          {hm.type && (
                            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              {hm.type}
                            </span>
                          )}
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span 
                            onClick={() => {
                              if (isRestricted) return;
                              setEditBuffer(hm.name);
                              setEditHmDescBuffer(hm.description || "");
                              setEditHmRarityBuffer(hm.rarity || 'gold');
                              const predefinedList = ['通用', '鳴金虹', '鳴金影', '裂石威', '牽絲玉', '牽絲霖', '破竹風', '破竹塵', '裂石鈞'];
                              if (predefinedList.includes(hm.type || '')) {
                                setEditHmTypeBuffer(hm.type || '通用');
                                setEditCustomHmType('');
                              } else {
                                setEditHmTypeBuffer('custom');
                                setEditCustomHmType(hm.type || '');
                              }
                              setEditingHmIdx(idx);
                            }}
                            className={`font-semibold text-slate-705 dark:text-slate-200 group-hover:text-emerald-400 text-xs ${isRestricted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {hm.name}
                          </span>
                        </div>
                      )}
                    </div>
                    {editingHmIdx !== idx && !isRestricted && (
                      <button onClick={() => removeHm(idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <i className="fa-solid fa-circle-xmark text-sm"></i>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Equipment Sets Config */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
          {/* Weapon Sets Config */}
          <section className={`bg-white dark:bg-slate-900 p-4 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col ${isRestricted ? 'opacity-80' : ''}`}>
            <h3 className="text-xl font-black mb-4 flex items-center gap-3 text-amber-600 dark:text-amber-400 uppercase tracking-tighter">
              <i className="fa-solid fa-gavel"></i>
              武器裝備套裝
            </h3>

            <div className="flex flex-col gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newWeaponSet}
                  onChange={(e) => setNewWeaponSet(e.target.value)}
                  disabled={isRestricted}
                  placeholder="新增武器套裝 (如: 玉斗)"
                  className={`flex-1 p-2 bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-300 border border-slate-300 dark:border-slate-800 rounded-lg outline-none focus:border-amber-500 text-xs ${isRestricted ? 'cursor-not-allowed' : ''}`}
                />
                <button
                  onClick={addWeaponSet}
                  disabled={!newWeaponSet || isRestricted}
                  className={`px-6 py-2 font-black rounded-xl transition-all shadow-lg text-xs ${
                    newWeaponSet && !isRestricted
                    ? 'bg-amber-600 hover:bg-amber-505 text-white shadow-amber-600/10'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  }`}
                >
                  新增
                </button>
              </div>
            </div>

            <div className="space-y-1.5 overflow-y-auto max-h-[300px] pr-2">
              {weaponSets.map((ws, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 px-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 group hover:border-amber-500/30 transition-all">
                  <div className="flex-1">
                    {editingWeaponIdx === idx && !isRestricted ? (
                      <input
                        autoFocus
                        className="bg-[#0f172a] text-amber-400 font-bold text-xs outline-none border-b border-amber-500 w-full"
                        value={editBuffer}
                        onChange={(e) => setEditBuffer(e.target.value)}
                        onBlur={() => handleUpdateWeaponSet(idx)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateWeaponSet(idx)}
                      />
                    ) : (
                      <span 
                        onClick={() => {
                          if (isRestricted) return;
                          setEditBuffer(ws);
                          setEditingWeaponIdx(idx);
                        }}
                        className={`font-bold text-slate-600 dark:text-slate-300 group-hover:text-amber-400 text-xs ${isRestricted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {ws}
                      </span>
                    )}
                  </div>
                  {!isRestricted && (
                    <button onClick={() => removeWeaponSet(idx)} className="text-slate-400 hover:text-red-500 transition-colors ml-2">
                      <i className="fa-solid fa-circle-xmark"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Armor Sets Config */}
          <section className={`bg-white dark:bg-slate-900 p-4 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col ${isRestricted ? 'opacity-80' : ''}`}>
            <h3 className="text-xl font-black mb-4 flex items-center gap-3 text-sky-600 dark:text-sky-400 uppercase tracking-tighter">
              <i className="fa-solid fa-shield-halved"></i>
              防具裝備套裝
            </h3>

            <div className="flex flex-col gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newArmorSet}
                  onChange={(e) => setNewArmorSet(e.target.value)}
                  disabled={isRestricted}
                  placeholder="新增防具套裝 (如: 易相)"
                  className={`flex-1 p-2 bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-300 border border-slate-300 dark:border-slate-800 rounded-lg outline-none focus:border-sky-500 text-xs ${isRestricted ? 'cursor-not-allowed' : ''}`}
                />
                <button
                  onClick={addArmorSet}
                  disabled={!newArmorSet || isRestricted}
                  className={`px-6 py-2 font-black rounded-xl transition-all shadow-lg text-xs ${
                    newArmorSet && !isRestricted
                    ? 'bg-sky-600 hover:bg-sky-505 text-white shadow-sky-600/10'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  }`}
                >
                  新增
                </button>
              </div>
            </div>

            <div className="space-y-1.5 overflow-y-auto max-h-[300px] pr-2">
              {armorSets.map((as, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 px-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 group hover:border-sky-500/30 transition-all">
                  <div className="flex-1">
                    {editingArmorIdx === idx && !isRestricted ? (
                      <input
                        autoFocus
                        className="bg-[#0f172a] text-sky-400 font-bold text-xs outline-none border-b border-sky-500 w-full"
                        value={editBuffer}
                        onChange={(e) => setEditBuffer(e.target.value)}
                        onBlur={() => handleUpdateArmorSet(idx)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateArmorSet(idx)}
                      />
                    ) : (
                      <span 
                        onClick={() => {
                          if (isRestricted) return;
                          setEditBuffer(as);
                          setEditingArmorIdx(idx);
                        }}
                        className={`font-bold text-slate-600 dark:text-slate-300 group-hover:text-sky-400 text-xs ${isRestricted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {as}
                      </span>
                    )}
                  </div>
                  {!isRestricted && (
                    <button onClick={() => removeArmorSet(idx)} className="text-slate-400 hover:text-red-500 transition-colors ml-2">
                      <i className="fa-solid fa-circle-xmark"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
