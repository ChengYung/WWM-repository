import React, { useState, useMemo, useRef } from 'react';
import { Member, MartialCombo, MartialArts, HeartMethod, Player } from '../types';
import { useToast } from './Toast';

const getMappedHeartMethod = (artName: string): string | undefined => {
  if (artName === '無名劍法') return '無名心法';
  if (artName === '積矩九劍') return '劍氣縱橫';
  if (artName === '喈夫刀法' || artName === '嗟夫刀法') return '山河絕韻';
  if (artName === '九重春色') return '花上月令';
  if (artName === '明川藥典') return '君臣藥';
  if (artName === '泥犁三垢') return '忘川絕響';
  if (artName === '醉夢遊春') return '千營一呼';
  if (artName === '斬雪刀法') return '霜天白夜';
  return undefined;
};

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
    titleColor = 'text-purple-400';
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

interface MemberSheetProps {
  projectId: string;
  members: Member[];
  players?: Player[];
  martialArts: MartialArts[];
  heartMethods?: HeartMethod[];
  weaponSets?: string[];
  armorSets?: string[];
  onAddMember: (member: Omit<Member, 'id'>) => Promise<string>;
  onUpdateMember: (member: Member) => Promise<void>;
  onDeleteMember: (memberId: string) => void;
  isRestricted?: boolean;
}

export const MemberSheet: React.FC<MemberSheetProps> = ({
  projectId,
  members,
  players = [],
  martialArts,
  heartMethods = [],
  weaponSets = [],
  armorSets = [],
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  isRestricted = false
}) => {
  const { showToast } = useToast();
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  const getArtColor = (artName: string) => {
    const ma = martialArts.find(m => m.name === artName);
    return ma?.color || '#94a3b8';
  };

  const getHmStyle = (hmName: string) => {
    const hm = heartMethods.find(h => h.name === hmName);
    if (!hm) return { color: '#94a3b8', backgroundColor: '#020617', borderColor: '#1e293b' };
    
    if (hm.rarity === 'gold') {
      return {
        color: '#f59e0b',
        backgroundColor: '#451a03',
        borderColor: 'rgba(245, 158, 11, 0.4)'
      };
    } else if (hm.rarity === 'purple') {
      return {
        color: '#c084fc',
        backgroundColor: '#3b0764',
        borderColor: 'rgba(192, 132, 252, 0.4)'
      };
    } else if (hm.rarity === 'blue') {
      return {
        color: '#60a5fa',
        backgroundColor: '#172554',
        borderColor: 'rgba(96, 165, 250, 0.4)'
      };
    }
    return { color: '#94a3b8', backgroundColor: '#020617', borderColor: '#1e293b' };
  };

  const renderHeartMethodOptions = () => {
    return (
      <>
        <option value="" className="bg-[#020617] text-slate-500">-- 無 --</option>
        {heartMethods.map((hm, i) => {
          let rarityBg = 'bg-[#020617]';
          let rarityColor = '#94a3b8';
          let optionBgStyle = '#020617';
          if (hm.rarity === 'gold') {
            rarityBg = 'bg-[#451a03]';
            rarityColor = '#f59e0b';
            optionBgStyle = '#451a03';
          } else if (hm.rarity === 'purple') {
            rarityBg = 'bg-[#3b0764]';
            rarityColor = '#c084fc';
            optionBgStyle = '#3b0764';
          } else if (hm.rarity === 'blue') {
            rarityBg = 'bg-[#172554]';
            rarityColor = '#60a5fa';
            optionBgStyle = '#172554';
          }
          const typePrefix = hm.type ? `[${hm.type}] ` : '';
          return (
            <option
              key={i}
              value={hm.name}
              style={{ backgroundColor: optionBgStyle, color: rarityColor }}
              className={`${rarityBg} font-bold text-xs`}
            >
              {typePrefix}{hm.name}
            </option>
          );
        })}
      </>
    );
  };

  // Form State
  const [gameName, setGameName] = useState('');
  const [combos, setCombos] = useState<MartialCombo[]>([]);
  const [noSelf, setNoSelf] = useState(false);
  const [hasDc, setHasDc] = useState(false);
  const [canMic, setCanMic] = useState(false);
  
  // Single Combo Builder State
  const [comboName, setComboName] = useState('');
  const [selectedClassArts, setSelectedClassArts] = useState<string[]>([]);
  const [comboPowerStr, setComboPowerStr] = useState('');
  const [selectedClassHms, setSelectedClassHms] = useState<string[]>(['易水歌']);
  const [comboWeaponSet, setComboWeaponSet] = useState('');
  const [comboArmorSet, setComboArmorSet] = useState('');

  // Editing State
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const originalMemberRef = useRef<Member | null>(null);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  
  // Edit Modal Combo Builder State
  const [editingComboName, setEditingComboName] = useState('');
  const [editingComboPowerStr, setEditingComboPowerStr] = useState('');
  const [editingSelectedArts, setEditingSelectedArts] = useState<string[]>([]);
  const [editingSelectedHms, setEditingSelectedHms] = useState<string[]>(['易水歌']);
  const [editingComboWeaponSet, setEditingComboWeaponSet] = useState('');
  const [editingComboArmorSet, setEditingComboArmorSet] = useState('');
  const [editingComboIndex, setEditingComboIndex] = useState<number | null>(null);

  // Dropdown states for multi-select
  const [isAddMaDropdownOpen, setIsAddMaDropdownOpen] = useState(false);
  const [isAddHmDropdownOpen, setIsAddHmDropdownOpen] = useState(false);
  const [isEditMaDropdownOpen, setIsEditMaDropdownOpen] = useState(false);
  const [isEditHmDropdownOpen, setIsEditHmDropdownOpen] = useState(false);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Delete Confirm Dialog State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Handle building & adding a combo to temporary list
  const handleAddComboToTempList = () => {
    if (selectedClassArts.length === 0) {
      showToast('請先選擇武學', 'error');
      return;
    }
    const derivedName = comboName.trim() || `搭配 ${combos.length + 1}`;
    
    // Check duplication in current temp list
    if (combos.some(c => c.name === derivedName)) {
      showToast(`已有名為「${derivedName}」的搭配`, 'error');
      return;
    }

    let powerNum: number | undefined = undefined;
    if (comboPowerStr.trim() !== '') {
      const parsed = parseFloat(comboPowerStr);
      if (isNaN(parsed) || parsed < 0) {
        showToast('請輸入一個有效的戰力指數 (數字，可包含小數)', 'error');
        return;
      }
      powerNum = parsed;
    }

    const newCombo: MartialCombo = {
      name: derivedName,
      arts: selectedClassArts,
      power: powerNum,
      heartMethods: selectedClassHms,
      weaponSet: comboWeaponSet || undefined,
      armorSet: comboArmorSet || undefined
    };

    setCombos([...combos, newCombo]);
    setComboName('');
    setComboPowerStr('');
    setSelectedClassArts([]);
    setSelectedClassHms(['易水歌']);
    setComboWeaponSet('');
    setComboArmorSet('');
    showToast('已新增一組搭配與戰力', 'success');
  };

  const handleRemoveComboFromTempList = (idx: number) => {
    setCombos(combos.filter((_, i) => i !== idx));
  };

  // Submit / Register Member
  const handleSubmitMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRestricted) {
      showToast('此專案目前遭到限制，無法新增成員', 'error');
      return;
    }

    const trimmedName = gameName.trim();
    if (!trimmedName) {
      showToast('請輸入遊戲名稱', 'error');
      return;
    }

    const exists = members.some(m => m.gameName.trim().toLowerCase() === trimmedName.toLowerCase());
    if (exists) {
      showToast(`成員 [${trimmedName}] 已經登入，禁止重複登入到成員名單中！`, 'error');
      return;
    }

    if (combos.length === 0) {
      showToast('請至少新增一組搭配跟戰力指數', 'error');
      return;
    }

    try {
      const newMember: Omit<Member, 'id'> = {
        projectId,
        gameName: trimmedName,
        combos: combos,
        noSelf,
        hasDc,
        canMic,
        createdAt: Date.now()
      };

      await onAddMember(newMember);
      showToast('成員登入成功', 'success');

      // Reset Form state
      setGameName('');
      setCombos([]);
      setNoSelf(false);
      setHasDc(false);
      setCanMic(false);
      setComboName('');
      setComboPowerStr('');
      setSelectedClassArts([]);
      setSelectedClassHms(['易水歌']);
      setComboWeaponSet('');
      setComboArmorSet('');
    } catch (err) {
      console.error(err);
      showToast('成員登入失敗', 'error');
    }
  };

  const handleLoadMemberData = (m: Member) => {
    setGameName(m.gameName);
    setNoSelf(!!m.noSelf);
    setHasDc(!!m.hasDc);
    setCanMic(!!m.canMic);
    setCombos(m.combos || []);
    showToast(`已成功載入百業成員 [${m.gameName}] 的現有資料，您可以在此調整或新增其搭配搭配。`, 'success');
  };

  const handleLoadPlayerData = (p: Player) => {
    setGameName(p.gameId);
    setNoSelf(!!p.noSelf);
    setHasDc(!!p.hasDc);
    setCanMic(!!p.canMic);
    
    setComboName('搭配1');
    setComboPowerStr(p.power || '');
    setSelectedClassArts(p.martialArts || []);
    
    const loadedHms = ['易水歌'];
    (p.martialArts || []).forEach(art => {
      let mapping: string | undefined;
      if (art === '無名劍法') mapping = '無名心法';
      else if (art === '積矩九劍') mapping = '劍氣縱橫';
      else if (art === '喈夫刀法' || art === '嗟夫刀法') mapping = '山河絕韻';
      else if (art === '九重春色') mapping = '花上月令';
      else if (art === '明川藥典') mapping = '君臣藥';
      else if (art === '泥犁三垢') mapping = '忘川絕響';
      else if (art === '醉夢遊春') mapping = '千營一呼';
      else if (art === '斬雪刀法') mapping = '霜天白夜';
      
      if (mapping && !loadedHms.includes(mapping)) {
        loadedHms.push(mapping);
      }
    });
    setSelectedClassHms(loadedHms.slice(0, 4));

    setComboWeaponSet('');
    setComboArmorSet('');
    showToast(`已成功載入已報名名單 [${p.gameId}] 的資料、武學及戰力！`, 'success');
  };

  // Aggregation/Summary calculations
  const stats = useMemo(() => {
    if (members.length === 0) {
      return { totalCount: 0, avgPower: 0, topArt: '無' };
    }
    const totalCount = members.length;
    let totalPower = 0;
    let comboCount = 0;
    const artUsage: Record<string, number> = {};
    
    members.forEach(m => {
      if (m.combos) {
        m.combos.forEach(c => {
          totalPower += (c.power || 0);
          comboCount++;
          c.arts.forEach(art => {
            artUsage[art] = (artUsage[art] || 0) + 1;
          });
        });
      }
    });

    const avgPower = comboCount > 0 ? (totalPower / comboCount) : 0;

    let topArt = '無';
    let maxCount = 0;
    Object.entries(artUsage).forEach(([art, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topArt = art;
      }
    });

    return { totalCount, avgPower, topArt };
  }, [members]);

  const searchMatches = useMemo(() => {
    const query = gameName.trim().toLowerCase();
    if (!query) return { members: [], players: [] };
    
    // Find matching signup players (excluding names already in members, limit to 12)
    const playerMatches = (players || []).filter(p => 
      p.gameId.toLowerCase().includes(query) && 
      !members.some(m => m.gameName.toLowerCase() === p.gameId.toLowerCase())
    ).slice(0, 12);
    
    return {
      members: [], // 登入百業成員不用再匹配已經登入的成員
      players: playerMatches
    };
  }, [members, players, gameName]);

  // Fuzzy Search Filter logic
  const filteredMembers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const activeFormName = gameName.trim().toLowerCase();
    
    if (!query && !activeFormName) return members;
    
    const matched: Member[] = [];
    const unmatched: Member[] = [];
    
    members.forEach(m => {
      let isFormMatch = false;
      if (activeFormName) {
        isFormMatch = m.gameName.toLowerCase().includes(activeFormName);
      }
      
      let isSearchMatch = false;
      if (query) {
        const gameNameMatch = m.gameName.toLowerCase().includes(query);
        const comboMatch = m.combos?.some(c => 
          c.name.toLowerCase().includes(query) || 
          String(c.power).includes(query) ||
          c.arts.some(art => art.toLowerCase().includes(query))
        );
        isSearchMatch = gameNameMatch || comboMatch;
      }
      
      if (isFormMatch || isSearchMatch) {
        matched.push(m);
      } else {
        unmatched.push(m);
      }
    });

    // Sort: Form matches (pin to top), then Search matches
    matched.sort((a, b) => {
      const aForm = activeFormName && a.gameName.toLowerCase().includes(activeFormName) ? 1 : 0;
      const bForm = activeFormName && b.gameName.toLowerCase().includes(activeFormName) ? 1 : 0;
      return bForm - aForm;
    });
    
    return [...matched, ...unmatched];
  }, [members, searchTerm, gameName]);

  // Count matches
  const matchedCount = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return members.length;
    return members.filter(m => {
      const gameNameMatch = m.gameName.toLowerCase().includes(query);
      const comboMatch = m.combos?.some(c => 
        c.name.toLowerCase().includes(query) || 
        String(c.power).includes(query) ||
        c.arts.some(art => art.toLowerCase().includes(query))
      );
      return gameNameMatch || comboMatch;
    }).length;
  }, [members, searchTerm]);



  // Edit fields handlers
  const handleOpenEdit = (m: Member) => {
    const copied: Member = {
      id: m.id,
      projectId: m.projectId,
      gameName: m.gameName,
      createdAt: m.createdAt,
      noSelf: m.noSelf,
      hasDc: m.hasDc,
      canMic: m.canMic,
      combos: m.combos ? m.combos.map(c => ({
        name: c.name,
        arts: [...c.arts],
        power: c.power,
        heartMethods: c.heartMethods ? [...c.heartMethods] : [],
        weaponSet: c.weaponSet,
        armorSet: c.armorSet
      })) : []
    };
    // Manually and safely deep copy the Member object to prevent any converting circular structure to JSON errors
    setEditingMember(copied);
    originalMemberRef.current = JSON.parse(JSON.stringify(copied));

    // Reset editing builders
    setEditingComboName('');
    setEditingComboPowerStr('');
    setEditingComboWeaponSet('');
    setEditingComboArmorSet('');
    setEditingSelectedArts([]);
    setEditingSelectedHms(['易水歌']);
    setEditingComboIndex(null);
  };

  const handleSelectComboForEdit = (idx: number) => {
    if (!editingMember || !editingMember.combos || !editingMember.combos[idx]) return;
    const c = editingMember.combos[idx];
    setEditingComboIndex(idx);
    setEditingComboName(c.name);
    setEditingComboPowerStr(String(c.power || ''));
    setEditingComboWeaponSet(c.weaponSet || '');
    setEditingComboArmorSet(c.armorSet || '');
    setEditingSelectedArts(c.arts || []);
    setEditingSelectedHms(c.heartMethods || []);
    showToast(`已載入「${c.name}」進行修改`, 'info');
  };

  const handleCancelComboEdit = () => {
    setEditingComboIndex(null);
    setEditingComboName('');
    setEditingComboPowerStr('');
    setEditingComboWeaponSet('');
    setEditingComboArmorSet('');
    setEditingSelectedArts([]);
    setEditingSelectedHms(['易水歌']);
  };

  const hasUnsavedChanges = () => {
    if (!editingMember || !originalMemberRef.current) return false;
    
    // 1. Check basic attributes
    if (editingMember.gameName !== originalMemberRef.current.gameName) return true;
    if (!!editingMember.noSelf !== !!originalMemberRef.current.noSelf) return true;
    if (!!editingMember.hasDc !== !!originalMemberRef.current.hasDc) return true;
    if (!!editingMember.canMic !== !!originalMemberRef.current.canMic) return true;
    
    // 2. Check combos length
    const currentCombos = editingMember.combos || [];
    const originalCombos = originalMemberRef.current.combos || [];
    if (currentCombos.length !== originalCombos.length) return true;
    
    // 3. Compare each combo's details
    for (let i = 0; i < currentCombos.length; i++) {
      const c = currentCombos[i];
      const o = originalCombos[i];
      if (c.name !== o.name) return true;
      if (c.power !== o.power) return true;
      if (c.weaponSet !== o.weaponSet) return true;
      if (c.armorSet !== o.armorSet) return true;
      
      // Compare arts arrays
      const cArts = c.arts || [];
      const oArts = o.arts || [];
      if (cArts.length !== oArts.length) return true;
      for (let j = 0; j < cArts.length; j++) {
        if (cArts[j] !== oArts[j]) return true;
      }
      
      // Compare heart methods arrays
      const cHM = c.heartMethods || [];
      const oHM = o.heartMethods || [];
      if (cHM.length !== oHM.length) return true;
      for (let j = 0; j < cHM.length; j++) {
        if (cHM[j] !== oHM[j]) return true;
      }
    }
    
    // 4. Check if the active edit fields (being typed/selected) have anything unsaved
    if (editingComboName.trim() !== '') return true;
    if (editingComboPowerStr.trim() !== '') return true;
    if (editingSelectedArts.length > 0) return true;
    if (editingSelectedHms.length > 0) return true;
    if (editingComboWeaponSet !== '') return true;
    if (editingComboArmorSet !== '') return true;
    
    return false;
  };

  const handleCloseEditModal = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedConfirm(true);
    } else {
      setEditingMember(null);
      originalMemberRef.current = null;
    }
  };

  const handleConfirmDiscardChanges = () => {
    setShowUnsavedConfirm(false);
    setEditingMember(null);
    originalMemberRef.current = null;
  };

  const handleCancelDiscard = () => {
    setShowUnsavedConfirm(false);
  };

  const handleAddComboToEditing = () => {
    if (!editingMember) return;
    if (editingSelectedArts.length === 0) {
      showToast('請選擇武學搭配', 'error');
      return;
    }

    const derivedName = editingComboName.trim() || `搭配 ${(editingMember.combos?.length || 0) + 1}`;
    
    if (editingComboIndex === null && editingMember.combos?.some(c => c.name === derivedName)) {
      showToast(`已有名為「${derivedName}」的搭配`, 'error');
      return;
    } else if (editingComboIndex !== null && editingMember.combos?.some((c, i) => i !== editingComboIndex && c.name === derivedName)) {
      showToast(`已有名為「${derivedName}」的搭配`, 'error');
      return;
    }

    let powerNum: number | undefined = undefined;
    if (editingComboPowerStr.trim() !== '') {
      const parsed = parseFloat(editingComboPowerStr);
      if (isNaN(parsed) || parsed < 0) {
        showToast('請輸入一個有效的戰力指數 (數字，可包含小數)', 'error');
        return;
      }
      powerNum = parsed;
    }

    const newCombo: MartialCombo = {
      name: derivedName,
      arts: editingSelectedArts,
      power: powerNum,
      heartMethods: editingSelectedHms,
      weaponSet: editingComboWeaponSet || undefined,
      armorSet: editingComboArmorSet || undefined
    };

    let updatedCombos = [...(editingMember.combos || [])];
    const isCurrentlyEditing = (editingComboIndex !== null);
    if (isCurrentlyEditing) {
      updatedCombos[editingComboIndex] = newCombo;
    } else {
      updatedCombos.push(newCombo);
    }

    const updatedMember: Member = {
      ...editingMember,
      combos: updatedCombos
    };

    // Auto-save member directly to database, bypass the second orange save click!
    (async () => {
      try {
        if (isRestricted) {
          showToast('專案目前遭到限制，無法修改成員', 'error');
          return;
        }
        if (!updatedMember.gameName.trim()) {
          showToast('遊戲名稱不可為空', 'error');
          return;
        }
        await onUpdateMember(updatedMember);
        showToast(isCurrentlyEditing ? '修改成功並已自動儲存變更' : '新增搭配成功並已自動儲存變更', 'success');
        setEditingMember(null);
        originalMemberRef.current = null;
      } catch (err) {
        console.error(err);
        showToast('自動儲存失敗', 'error');
      }
    })();

    setEditingComboIndex(null);
    setEditingComboName('');
    setEditingComboPowerStr('');
    setEditingSelectedArts([]);
    setEditingSelectedHms(['易水歌']);
    setEditingComboWeaponSet('');
    setEditingComboArmorSet('');
  };

  const handleRemoveComboFromEditing = async (idx: number) => {
    if (!editingMember) return;
    const filteredCombos = (editingMember.combos || []).filter((_, i) => i !== idx);
    if (filteredCombos.length === 0) {
      showToast('請至少保留一組搭配與戰力組合', 'error');
      return;
    }
    if (editingComboIndex === idx) {
      setEditingComboIndex(null);
    } else if (editingComboIndex !== null && editingComboIndex > idx) {
      setEditingComboIndex(editingComboIndex - 1);
    }
    const updatedMember = {
      ...editingMember,
      combos: filteredCombos
    };
    try {
      if (isRestricted) {
        showToast('專案目前遭到限制，無法修改成員', 'error');
        return;
      }
      await onUpdateMember(updatedMember);
      originalMemberRef.current = JSON.parse(JSON.stringify(updatedMember));
      setEditingMember(updatedMember);
      showToast('已刪除該組搭配組合並自動儲存變更', 'success');
    } catch (err) {
      console.error(err);
      showToast('自動儲存失敗', 'error');
    }
  };

  // Delete Action
  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      onDeleteMember(deleteConfirmId);
      showToast('已移除成員', 'success');
      setDeleteConfirmId(null);
    }
  };

  // Get color code for martial arts pill
  const getMartialArtColor = (name: string) => {
    const found = martialArts.find(ma => ma.name === name);
    return found ? found.color : 'slate';
  };

  const formatArtName = (name: string): string => {
    if (!name) return '';
    return name.length > 4 ? name.substring(0, 4) + '...' : name;
  };

  return (
    <div className="space-y-6">
      {/* 2. Compact Registration Panel: Add Member */}
      <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-xl shadow-2xl relative overflow-visible transition-all duration-300">
        <div className="absolute top-0 right-0 p-6 opacity-5 text-7xl text-white pointer-events-none select-none">
          <i className="fa-solid fa-users"></i>
        </div>
        <div 
          className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/60 cursor-pointer select-none"
          onClick={() => setIsFormExpanded(!isFormExpanded)}
        >
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-user-plus text-blue-500 text-base"></i>
            <h2 className="text-sm font-black text-white uppercase tracking-tight">登入百業成員</h2>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-400 hover:text-amber-300 transition-all animate-pulse">
            <span>{isFormExpanded ? '點擊收合' : '點擊展開'}</span>
            <i className={`fa-solid ${isFormExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-amber-400 transition-transform duration-200`} />
          </div>
        </div>

        {isFormExpanded && (
          <form onSubmit={handleSubmitMember} className="space-y-3">
            {/* Member Name and Communication status indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 block mb-1">成員遊戲名稱 *</label>
                <input
                  type="text"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="請輸入成員遊戲角色名稱..."
                  required
                  className="w-full bg-[#020617] border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-605 font-bold outline-none transition-all h-[38px]"
                />
                
                {/* Fuzzy matches banners */}
                {gameName.trim() && searchMatches.players.length > 0 && (
                  <div className="mt-2 p-3.5 rounded-xl border border-slate-800 bg-[#020617]/90 space-y-2 text-left animate-fade-in relative z-20 shadow-xl">
                    <span className="text-[10.5px] font-extrabold text-slate-400 block pb-1 border-b border-slate-800/80 flex items-center gap-1">
                      <i className="fa-solid fa-magnifying-glass text-slate-500"></i>
                      <span>系統已匹配到以下名單 (點選可一鍵帶入資料):</span>
                    </span>
                    <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 py-1">
                      {searchMatches.players.map((p) => (
                        <button
                          key={`p-${p.id}`}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleLoadPlayerData(p);
                          }}
                          className="px-3 py-1.5 bg-blue-950/20 hover:bg-blue-900/30 border border-blue-800/50 hover:border-blue-500 rounded-xl text-[10px] font-black text-blue-400 transition-all flex items-center gap-1.5 cursor-pointer shadow active:scale-95 hover:shadow-blue-950/50"
                          title="點選帶入外部已報名玩家資料"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
                          <span className="max-w-[120px] truncate">{p.gameId}</span>
                          <span className="text-[8px] bg-blue-900/40 px-1.5 py-0.2 rounded text-blue-455 border border-blue-850">報名名單</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 block mb-1">通訊與狀態設定</label>
                <div className="grid grid-cols-3 gap-1.5 bg-[#020617] p-1 rounded-xl border border-slate-800 h-[46px] items-center">
                  <label className="flex items-center justify-start gap-2 px-3.5 py-1.5 bg-[#0f172a] hover:bg-slate-800/30 rounded-lg cursor-pointer transition-all border border-slate-800/60 selection:bg-transparent h-9" title="是否無我">
                    <input
                      type="checkbox"
                      checked={noSelf}
                      onChange={(e) => setNoSelf(e.target.checked)}
                      className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 bg-[#020617] border-slate-700 rounded cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-slate-200 flex items-center gap-1 direct-desc">
                      <i className="fa-solid fa-trophy text-yellow-500 text-xs"></i>
                      <span>是否無我</span>
                    </span>
                  </label>
  

                <label className="flex items-center justify-start gap-2 px-3.5 py-1.5 bg-[#0f172a] hover:bg-slate-800/30 rounded-lg cursor-pointer transition-all border border-slate-800/60 selection:bg-transparent h-9" title="是否有 DC">
                  <input
                    type="checkbox"
                    checked={hasDc}
                    onChange={(e) => setHasDc(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 bg-[#020617] border-slate-700 rounded cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-slate-200 flex items-center gap-1 direct-desc">
                    <i className="fa-brands fa-discord text-indigo-400 text-xs"></i>
                    <span>是否有 DC</span>
                  </span>
                </label>

                <label className="flex items-center justify-start gap-2 px-3.5 py-1.5 bg-[#0f172a] hover:bg-slate-800/30 rounded-lg cursor-pointer transition-all border border-slate-800/60 selection:bg-transparent h-9" title="是否可開 Mic">
                  <input
                    type="checkbox"
                    checked={canMic}
                    onChange={(e) => setCanMic(e.target.checked)}
                    className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 bg-[#020617] border-slate-700 rounded cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-slate-200 flex items-center gap-1 direct-desc">
                    <i className="fa-solid fa-microphone text-green-400 text-xs"></i>
                    <span>是否可開 Mic</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Martial combo and corresponding power */}
          <div className="bg-[#020617] p-3 rounded-xl border border-slate-900 space-y-2.5">
            {/* Selection inputs for basic details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[9.5px] text-slate-400 font-bold block mb-1">搭配名稱</label>
                <input
                  type="text"
                  value={comboName}
                  onChange={(e) => setComboName(e.target.value)}
                  placeholder={`例: 搭配 ${combos.length + 1}`}
                  className="w-full bg-[#0f172a] border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none transition-all h-[38px] font-bold"
                />
              </div>
              <div>
                <label className="text-[9.5px] text-slate-400 font-bold block mb-1">戰力指數 (鵝)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={comboPowerStr}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = val.split('.');
                      if (parts.length > 2) return;
                      setComboPowerStr(val);
                    }}
                    placeholder="例: 3.14"
                    className="w-full bg-[#0f172a] border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-3 pr-8 py-1.5 text-xs text-slate-200 outline-none font-mono transition-all h-[38px] font-bold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-black">鵝</span>
                </div>
              </div>
              <div>
                <label className="text-[9.5px] text-slate-400 font-bold block mb-1">武器裝備</label>
                <select
                  value={comboWeaponSet}
                  onChange={(e) => setComboWeaponSet(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-355 outline-none focus:border-blue-500 transition-all h-[38px] font-bold"
                >
                  <option value="">-- 無 --</option>
                  {weaponSets.map((ws, i) => (
                    <option key={i} value={ws} className="bg-[#020617]">{ws}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9.5px] text-[#94a3b8] font-bold block mb-1">防具裝備</label>
                <select
                  value={comboArmorSet}
                  onChange={(e) => setComboArmorSet(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-355 outline-none focus:border-blue-500 transition-all h-[38px] font-bold"
                >
                  <option value="">-- 無 --</option>
                  {armorSets.map((as, i) => (
                    <option key={i} value={as} className="bg-[#020617]">{as}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selection with lists on the right side for Arts and Heart Methods */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-1">
              <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-800/80 p-3 rounded-xl">
                {/* Martial Arts Selection */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold block">武學裝備 (多選，不重複)</span>
                  <div className="flex flex-col sm:flex-row gap-2 items-center">
                    <div className="relative w-full sm:w-1/2">
                      <button
                        type="button"
                        onClick={() => setIsAddMaDropdownOpen(!isAddMaDropdownOpen)}
                        className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] outline-none transition-all h-[34px] font-bold text-slate-300 flex items-center justify-between text-left hover:border-slate-700 cursor-pointer"
                      >
                        <span className="text-slate-400">● 展開選擇武學</span>
                        <i className={`fa-solid fa-chevron-down text-[8px] text-slate-500 transition-transform ${isAddMaDropdownOpen ? 'rotate-180' : ''}`}></i>
                      </button>
                      {isAddMaDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsAddMaDropdownOpen(false)} />
                          <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-[#090f1d] border border-slate-800 rounded-xl shadow-2xl p-1 z-50 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-800">
                            {martialArts.map((ma, i) => {
                              const isSelected = selectedClassArts.includes(ma.name);
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedClassArts(selectedClassArts.filter(item => item !== ma.name));
                                      const mappedHm = getMappedHeartMethod(ma.name);
                                      if (mappedHm) {
                                        setSelectedClassHms(selectedClassHms.filter(h => h !== mappedHm));
                                      }
                                    } else {
                                      setSelectedClassArts([...selectedClassArts, ma.name]);
                                      
                                      const mapping = getMappedHeartMethod(ma.name);
                                      if (mapping && !selectedClassHms.includes(mapping)) {
                                        if (selectedClassHms.length < 4) {
                                          setSelectedClassHms([...selectedClassHms, mapping]);
                                        }
                                      }
                                    }
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[10px] font-bold transition-all ${
                                    isSelected 
                                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-extrabold' 
                                      : 'text-slate-300 hover:bg-[#0f172a] border border-transparent hover:text-white'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5 truncate">
                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ma.color || '#94a3b8' }}></span>
                                    {ma.name}
                                  </span>
                                  {isSelected ? (
                                    <i className="fa-solid fa-check text-[8px] text-blue-400"></i>
                                  ) : (
                                    <span className="w-2.5 h-2.5 rounded border border-slate-700 shrink-0"></span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 min-h-[34px] bg-[#020617]/50 border border-slate-900 rounded-xl px-2.5 py-1 w-full sm:w-1/2">
                      {selectedClassArts.length === 0 ? (
                        <span className="text-[9px] text-slate-600 italic">尚未選擇武學</span>
                      ) : (
                        selectedClassArts.map((ma, i) => {
                          const maObj = martialArts.find(m => m.name === ma);
                          return (
                            <React.Fragment key={`${ma}-${i}`}>
                              {i > 0 && <span className="text-slate-600 text-[10px] font-black">+</span>}
                              <span
                                onClick={() => {
                                  setSelectedClassArts(selectedClassArts.filter(item => item !== ma));
                                  const mappedHm = getMappedHeartMethod(ma);
                                  if (mappedHm) {
                                    setSelectedClassHms(selectedClassHms.filter(h => h !== mappedHm));
                                  }
                                }}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold bg-[#020617] border-slate-800 text-slate-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 cursor-pointer transition-all truncate"
                                title="點擊刪除"
                              >
                                <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: maObj?.color || '#94a3b8' }}></span>
                                {ma}
                              </span>
                            </React.Fragment>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Heart Methods Selection */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold block">配戴心法 (多選，不重複)</span>
                  <div className="flex flex-col sm:flex-row gap-2 items-center">
                    <div className="relative w-full sm:w-1/2">
                      <button
                        type="button"
                        onClick={() => setIsAddHmDropdownOpen(!isAddHmDropdownOpen)}
                        className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] outline-none transition-all h-[34px] font-bold text-slate-300 flex items-center justify-between text-left hover:border-slate-700 cursor-pointer"
                      >
                        <span className="text-slate-400">● 展開選擇心法</span>
                        <i className={`fa-solid fa-chevron-down text-[8px] text-slate-500 transition-transform ${isAddHmDropdownOpen ? 'rotate-180' : ''}`}></i>
                      </button>
                      {isAddHmDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsAddHmDropdownOpen(false)} />
                          <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-[#090f1d] border border-slate-800 rounded-xl shadow-2xl p-1 z-50 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-800">
                            {heartMethods.map((hm, i) => {
                              const isSelected = selectedClassHms.includes(hm.name);
                              let rarityColor = '#94a3b8';
                              if (hm.rarity === 'gold') rarityColor = '#f59e0b';
                              else if (hm.rarity === 'purple') rarityColor = '#c084fc';
                              else if (hm.rarity === 'blue') rarityColor = '#60a5fa';

                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedClassHms(selectedClassHms.filter(item => item !== hm.name));
                                    } else {
                                      if (selectedClassHms.length >= 4) {
                                        showToast('每個搭配的心法最多只能選擇 4 個', 'warning');
                                        return;
                                      }
                                      setSelectedClassHms([...selectedClassHms, hm.name]);
                                    }
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[10px] font-bold transition-all ${
                                    isSelected
                                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-extrabold'
                                      : 'text-slate-300 hover:bg-[#0f172a] border border-transparent hover:text-white'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5 truncate" style={{ color: rarityColor }}>
                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: rarityColor }}></span>
                                    {hm.type ? `[${hm.type}] ` : ''}{hm.name}
                                  </span>
                                  {isSelected ? (
                                    <i className="fa-solid fa-check text-[8px] text-blue-400"></i>
                                  ) : (
                                    <span className="w-2.5 h-2.5 rounded border border-slate-700 shrink-0"></span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 min-h-[34px] bg-[#020617]/50 border border-slate-900 rounded-xl px-2.5 py-1 w-full sm:w-1/2">
                      {selectedClassHms.length === 0 ? (
                        <span className="text-[9px] text-slate-600 italic">尚未選擇心法</span>
                      ) : (
                        selectedClassHms.map((hmName, i) => {
                          const style = getHmStyle(hmName);
                          return (
                            <span
                              key={`${hmName}-${i}`}
                              onClick={() => setSelectedClassHms(selectedClassHms.filter(item => item !== hmName))}
                              style={style}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 cursor-pointer transition-all truncate"
                              title="點擊刪除"
                            >
                              {hmName}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Button occupying remaining space, stretching height to match heart methods box */}
              <div className="md:col-span-3 h-[64px] flex items-end">
                <button
                  type="button"
                  onClick={handleAddComboToTempList}
                  className="w-full h-[36px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-black tracking-wider transition-all flex items-center justify-center gap-1 border border-indigo-500/10 shadow-lg"
                >
                  <i className="fa-solid fa-plus text-xs"></i> 新增搭配組合與戰力
                </button>
              </div>
            </div>

            {/* List of combinations created temporarily */}
            {combos.length > 0 && (
              <div className="pt-2 border-t border-slate-850 flex flex-wrap gap-1.5">
                {combos.map((c, idx) => (
                  <div key={idx} className="bg-[#0f172a]/80 border border-slate-850 p-1.5 px-2.5 rounded-lg flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-amber-500 font-black uppercase tracking-wider">{c.name}</span>
                        <span className="text-[9px] text-slate-400 font-mono font-bold bg-[#020617] px-1.5 py-0.2 rounded border border-slate-800">
                          {c.power} 鵝
                        </span>
                      </div>
                      <div className="flex gap-1 items-center mt-1 flex-wrap">
                        {c.arts.map((art, artIdx) => (
                          <React.Fragment key={artIdx}>
                            {artIdx > 0 && <span className="text-[9px] text-slate-600 font-black">+</span>}
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold text-white bg-indigo-600/20 border border-indigo-500/30">
                              {art}
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                      {(c.weaponSet || c.armorSet) && (
                        <div className="flex gap-1 items-center mt-1">
                          {c.weaponSet && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20">
                              武: {c.weaponSet}
                            </span>
                          )}
                          {c.armorSet && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black text-sky-400 bg-sky-500/10 border border-sky-500/20">
                              防: {c.armorSet}
                            </span>
                          )}
                        </div>
                      )}
                      {c.heartMethods && c.heartMethods.length > 0 && (
                        <div className="flex gap-1 mt-1.5 items-center">
                          {c.heartMethods.map((hmName, hIdx) => (
                            <HeartMethodTooltip key={hIdx} name={hmName} projectHeartMethods={heartMethods} />
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveComboFromTempList(idx)}
                      className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
                      title="移除此搭配"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-0.5">
            <button
              type="submit"
              disabled={isRestricted}
              className={`px-4 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${
                isRestricted 
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/15'
              }`}
            >
              登入成員資料
            </button>
          </div>
        </form>
        )}
      </div>

      {/* 3. Member List with Fuzzy Query Search */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header with search inputs */}
        <div className="p-4 lg:p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#0a0f1d]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 shrink-0">
            <div className="flex items-center gap-2.5">
              <i className="fa-solid fa-address-book text-emerald-500 text-lg"></i>
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-tight">成員名單</h2>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                  {searchTerm.trim() 
                    ? `搜尋命中 ${matchedCount} 名成員，共計 ${members.length} 名`
                    : `共計 ${members.length} 名成員資料`}
                </p>
              </div>
            </div>

            {/* Micro Stats Cards placed next to title */}
            <div className="flex items-center gap-2.5 border-l border-slate-800/80 sm:pl-4 pl-0 border-none sm:border-solid h-full py-0.5">
              <div className="bg-[#020617]/50 border border-slate-850 px-3.5 py-1.5 rounded-xl min-w-[75px] shadow-inner select-none">
                <span className="text-[8px] text-slate-500 font-black block leading-none mb-1">成員總數</span>
                <div className="flex items-baseline gap-0.5 leading-none">
                  <span className="text-sm lg:text-base font-black text-white">{stats.totalCount}</span>
                  <span className="text-[8px] text-slate-500 font-bold">人</span>
                </div>
              </div>
              <div className="bg-[#020617]/50 border border-slate-850 px-3.5 py-1.5 rounded-xl min-w-[75px] shadow-inner select-none">
                <span className="text-[8px] text-slate-500 font-black block leading-none mb-1">平均戰力</span>
                <div className="flex items-baseline gap-0.5 leading-none">
                  <span className="text-sm lg:text-base font-black text-blue-400">
                    {stats.avgPower.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[8px] text-slate-500 font-bold">鵝</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fuzzy search input */}
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <i className="fa-solid fa-magnifying-glass text-slate-600 text-xs"></i>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="快速搜取：輸入成員名稱、戰力或武學..."
              className="w-full bg-[#020617] border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350 transition-colors"
                title="清除搜尋"
              >
                <i className="fa-solid fa-circle-xmark text-slate-600 text-xs"></i>
              </button>
            )}
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-[#020617]/40 text-[8.5px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="py-1 px-2 w-1/4">成員遊戲名稱</th>
                  <th className="py-1 px-2">登錄武學搭配與戰力</th>
                  <th className="py-1 px-2 text-center w-32">操作管理</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {searchTerm.trim() && matchedCount === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 px-4 bg-[#0a0f1d] text-center text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/80">
                      <i className="fa-solid fa-user-slash mr-1.5 text-slate-600 animate-pulse text-sm"></i> 該成員尚未登入
                    </td>
                  </tr>
                )}
                {filteredMembers.map((member) => {
                  const query = searchTerm.trim().toLowerCase();
                  const formQuery = gameName.trim().toLowerCase();
                  
                  const isFormMatch = formQuery && member.gameName.toLowerCase().includes(formQuery);
                  const isSearchMatch = query && (
                    member.gameName.toLowerCase().includes(query) ||
                    member.combos?.some(c => 
                      c.name.toLowerCase().includes(query) || 
                      String(c.power).includes(query) ||
                      c.arts.some(art => art.toLowerCase().includes(query))
                    )
                  );

                  let rowBgClass = 'hover:bg-slate-800/10 border-l-2 border-l-transparent';
                  if (isFormMatch) {
                    rowBgClass = 'bg-blue-600/10 hover:bg-blue-600/15 border-l-2 border-l-blue-500';
                  } else if (isSearchMatch) {
                    rowBgClass = 'bg-emerald-600/5 hover:bg-emerald-600/10 border-l-2 border-l-emerald-500';
                  }

                  return (
                    <tr 
                      key={member.id} 
                      className={`transition-all duration-200 group/row cursor-pointer ${rowBgClass}`}
                      onClick={() => handleOpenEdit(member)}
                    >
                      <td className="py-2 px-2.5 font-bold text-xs text-slate-100 group-hover/row:text-white transition-colors animate-fade-in">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            {isFormMatch ? (
                              <span className="inline-flex items-center gap-1 text-[8.5px] font-black uppercase text-blue-400 bg-blue-500/10 px-1 rounded animate-pulse">
                                <i className="fa-solid fa-thumbtack text-[7.5px]"></i> 匹配
                              </span>
                            ) : isSearchMatch ? (
                              <span className="inline-flex items-center gap-1 text-[8.5px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1 rounded">
                                <i className="fa-solid fa-star text-[7.5px]"></i> 命中
                              </span>
                            ) : (
                              <span className="w-1 h-1 rounded-full bg-slate-500 opacity-40 font-medium"></span>
                            )}
                            <span className="font-extrabold text-[11px]">{member.gameName}</span>
                          </div>
                          {/* Status badges matching RegistrationList.tsx exactly */}
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {member.noSelf && (
                              <span className="w-4 h-4 rounded-full bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center hover:scale-110 transition-transform" title="無我">
                                <i className="fa-solid fa-trophy text-yellow-500 text-[8px]"></i>
                              </span>
                            )}
                            {member.hasDc && (
                              <span className="w-4 h-4 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center hover:scale-110 transition-transform" title="Discord (DC)">
                                <i className="fa-brands fa-discord text-indigo-400 text-[8px]"></i>
                              </span>
                            )}
                            {member.canMic && (
                              <span className="w-4 h-4 rounded-full bg-green-500/10 border border-green-500/25 flex items-center justify-center hover:scale-110 transition-transform" title="可開麥">
                                <i className="fa-solid fa-microphone text-green-450 text-[8px]"></i>
                              </span>
                            )}
                            {!member.noSelf && !member.hasDc && !member.canMic && (
                              <span className="text-slate-650 font-bold px-1.5 text-[10px]">-</span>
                            )}
                          </div>
                        </div>
                      </td>
                    <td className="py-1 px-2 text-left" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-0.5 w-full">
                        {member.combos && member.combos.length > 0 ? (
                          member.combos.map((combo, comboIndex) => (
                            <div 
                              key={comboIndex} 
                              className="flex items-center justify-between gap-1 p-0.5 py-0.5 px-1.5 bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/45 rounded-md w-full text-[9px] transition-all"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-amber-500 uppercase tracking-wider text-[8px] bg-amber-500/5 px-1 py-0.1 rounded border border-amber-500/10 min-w-[36px] text-center">
                                  {combo.name}
                                </span>
                                <div className="flex gap-0.5 items-center flex-wrap">
                                  {combo.arts && combo.arts.map((art, aIdx) => (
                                    <React.Fragment key={aIdx}>
                                      {aIdx > 0 && <span className="text-[8px] text-slate-705 font-black">+</span>}
                                      <span 
                                        className="px-1 py-0.1 rounded text-[8.5px] font-semibold text-slate-300 bg-slate-950/40 border border-slate-850 flex items-center gap-0.5"
                                        style={{ borderColor: (getMartialArtColor(art) || '#475569') + '30' }}
                                      >
                                        <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: getMartialArtColor(art) || '#94a3b8' }}></span>
                                        {formatArtName(art)}
                                      </span>
                                    </React.Fragment>
                                  ))}
                                </div>
                                <span className="bg-blue-950/40 border border-blue-900/60 text-blue-400 font-mono text-[8px] font-black px-1 py-0.1 rounded whitespace-nowrap shadow shrink-0">
                                  {combo.power || 0} 鵝
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-1.5 ml-auto">
                                {(combo.weaponSet || combo.armorSet) && (
                                  <div className="flex gap-0.5 items-center shrink-0">
                                    {combo.weaponSet && (
                                      <span className="px-1 py-0.1 rounded text-[7.5px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 select-none font-bold" title={`武器: ${combo.weaponSet}`}>
                                        武: {combo.weaponSet}
                                      </span>
                                    )}
                                    {combo.armorSet && (
                                      <span className="px-1 py-0.1 rounded text-[7.5px] font-black text-sky-400 bg-sky-500/10 border border-sky-500/20 select-none font-bold" title={`防具: ${combo.armorSet}`}>
                                        防: {combo.armorSet}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {/* Heart methods icons */}
                                {combo.heartMethods && combo.heartMethods.length > 0 && (
                                  <div className="flex gap-0.5 items-center bg-[#020617] p-0.5 rounded border border-slate-900 scale-90">
                                    {combo.heartMethods.map((hmName, hIdx) => (
                                      <HeartMethodTooltip key={hIdx} name={hmName} projectHeartMethods={heartMethods} />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-[9px] text-slate-650 italic font-semibold">無搭配資料</span>
                        )}
                      </div>
                    </td>
                    <td className="py-1 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(member)}
                          className="px-1.5 py-0.5 bg-[#020617] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded text-[9px] font-black tracking-wider transition-all"
                          title="修改成員資訊"
                        >
                          <i className="fa-solid fa-pen-to-square text-[9px]"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(member.id)}
                          className="px-1.5 py-0.5 bg-red-500/10 hover:bg-red-550 text-red-500 hover:text-white border border-red-500/20 rounded text-[9px] font-black tracking-wider transition-all"
                          title="移除此成員"
                        >
                          <i className="fa-solid fa-trash-can text-[9px]"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>

      {/* 4. Edit Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-slate-800 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-[#0a0f1d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-user-pen text-amber-500 text-base"></i>
                <h3 className="font-black text-sm text-white uppercase tracking-wider">編輯成員資料</h3>
              </div>
              <button
                onClick={handleCloseEditModal}
                className="text-slate-500 hover:text-slate-300 p-1.5 hover:bg-slate-800 rounded-lg transition-all"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="p-6 pb-36 overflow-y-auto space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">成員遊戲名稱 *</label>
                  <input
                    type="text"
                    value={editingMember.gameName}
                    onChange={(e) => setEditingMember({ ...editingMember, gameName: e.target.value })}
                    onBlur={async (e) => {
                      if (!editingMember) return;
                      const newName = e.target.value.trim();
                      if (!newName) {
                        showToast('遊戲名稱不可為空', 'error');
                        return;
                      }
                      const alreadyExists = members.some(m => m.id !== editingMember.id && m.gameName.trim().toLowerCase() === newName.toLowerCase());
                      if (alreadyExists) {
                        showToast(`該名稱 [${newName}] 已經與其他百業成員重複，禁止修改成此名稱！`, 'error');
                        if (originalMemberRef.current) {
                          setEditingMember({ ...editingMember, gameName: originalMemberRef.current.gameName });
                        }
                        return;
                      }
                      try {
                        const updated = { ...editingMember, gameName: newName };
                        await onUpdateMember(updated);
                        originalMemberRef.current = JSON.parse(JSON.stringify(updated));
                        showToast('已自動儲存修改後的名稱', 'success');
                      } catch (err) {
                        console.error(err);
                        showToast('自動儲存失敗', 'error');
                      }
                    }}
                    required
                    className="w-full bg-[#020617] border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2.5 text-xs text-slate-200 font-bold outline-none transition-all h-[46px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">通訊與狀態設定</label>
                  <div className="grid grid-cols-3 gap-2 bg-[#020617] p-1 rounded-xl border border-slate-800 h-[46px] items-center">
                    <label className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#0f172a] hover:bg-slate-800/30 rounded-lg cursor-pointer transition-all border border-slate-800/60 selection:bg-transparent h-9" title="是否無我">
                      <input
                        type="checkbox"
                        checked={!!editingMember.noSelf}
                        onChange={async (e) => {
                          const updated = { ...editingMember, noSelf: e.target.checked };
                          setEditingMember(updated);
                          try {
                            await onUpdateMember(updated);
                            originalMemberRef.current = JSON.parse(JSON.stringify(updated));
                            showToast('已自動儲存設定：是否無我', 'success');
                          } catch (err) {
                            console.error(err);
                            showToast('自動儲存失敗', 'error');
                          }
                        }}
                        className="w-3.5 h-3.5 text-amber-500 focus:ring-amber-500 bg-[#020617] border-slate-700 rounded cursor-pointer"
                      />
                      <i className="fa-solid fa-trophy text-yellow-500 text-xs"></i>
                    </label>

                    <label className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#0f172a] hover:bg-slate-800/30 rounded-lg cursor-pointer transition-all border border-slate-800/60 selection:bg-transparent h-9" title="是否有 DC">
                      <input
                        type="checkbox"
                        checked={!!editingMember.hasDc}
                        onChange={async (e) => {
                          const updated = { ...editingMember, hasDc: e.target.checked };
                          setEditingMember(updated);
                          try {
                            await onUpdateMember(updated);
                            originalMemberRef.current = JSON.parse(JSON.stringify(updated));
                            showToast('已自動儲存設定：是否有 DC', 'success');
                          } catch (err) {
                            console.error(err);
                            showToast('自動儲存失敗', 'error');
                          }
                        }}
                        className="w-3.5 h-3.5 text-amber-500 focus:ring-amber-500 bg-[#020617] border-slate-700 rounded cursor-pointer"
                      />
                      <i className="fa-brands fa-discord text-indigo-400 text-xs"></i>
                    </label>

                    <label className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#0f172a] hover:bg-slate-800/30 rounded-lg cursor-pointer transition-all border border-slate-800/60 selection:bg-transparent h-9" title="是否可開 Mic">
                      <input
                        type="checkbox"
                        checked={!!editingMember.canMic}
                        onChange={async (e) => {
                          const updated = { ...editingMember, canMic: e.target.checked };
                          setEditingMember(updated);
                          try {
                            await onUpdateMember(updated);
                            originalMemberRef.current = JSON.parse(JSON.stringify(updated));
                            showToast('已自動儲存設定：是否可開 Mic', 'success');
                          } catch (err) {
                            console.error(err);
                            showToast('自動儲存失敗', 'error');
                          }
                        }}
                        className="w-3.5 h-3.5 text-amber-500 focus:ring-amber-500 bg-[#020617] border-slate-700 rounded cursor-pointer"
                      />
                      <i className="fa-solid fa-microphone text-green-400 text-xs"></i>
                    </label>
                  </div>
                </div>
              </div>

              {/* Edit martial combo */}
              <div className="bg-[#020617] p-4 rounded-xl border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-200 tracking-wider">武學搭配組合與戰力設定</h4>
                    <span className="text-[9px] text-slate-500 font-bold block">可對成員維護多組武學搭配及戰力</span>
                  </div>
                  <span className="bg-[#0f172a] border border-slate-800 px-2 py-0.5 rounded text-[9px] font-mono text-slate-400 font-black">
                    已設定: {editingMember.combos?.length || 0} 組
                  </span>
                </div>

                {/* Selection inputs inside a single inline row - 4 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1.5">搭配名稱</label>
                    <input
                      type="text"
                      value={editingComboName}
                      onChange={(e) => setEditingComboName(e.target.value)}
                      placeholder={`搭配 ${(editingMember.combos?.length || 0) + 1}`}
                      className="w-full bg-[#0f172a] border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none transition-all h-[38px] font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[9.5px] text-slate-400 font-bold block mb-1.5">戰力指數 (鵝)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editingComboPowerStr}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          const parts = val.split('.');
                          if (parts.length > 2) return;
                          setEditingComboPowerStr(val);
                        }}
                        placeholder="例: 3.14"
                        className="w-full bg-[#0f172a] border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl pl-3 pr-8 py-1.5 text-xs text-slate-200 outline-none font-mono transition-all h-[38px] font-bold"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-black">鵝</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9.5px] text-slate-400 font-bold block mb-1.5">武器裝備</label>
                    <select
                      value={editingComboWeaponSet}
                      onChange={(e) => setEditingComboWeaponSet(e.target.value)}
                      className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-[#94a3b8] outline-none focus:border-amber-500 transition-all h-[38px] font-bold"
                    >
                      <option value="">-- 無 --</option>
                      {weaponSets.map((ws, i) => (
                        <option key={i} value={ws} className="bg-[#020617]">{ws}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9.5px] text-[#94a3b8] font-bold block mb-1.5">防具裝備</label>
                    <select
                      value={editingComboArmorSet}
                      onChange={(e) => setEditingComboArmorSet(e.target.value)}
                      className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-[#94a3b8] outline-none focus:border-amber-500 transition-all h-[38px] font-bold"
                    >
                      <option value="">-- 無 --</option>
                      {armorSets.map((as, i) => (
                        <option key={i} value={as} className="bg-[#020617]">{as}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Selection with lists on the right side for Arts and Heart Methods in Edit modal */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-1">
                  <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-850 p-3 rounded-xl">
                    {/* Martial Arts Selection */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-bold block">武學裝備 (多選，不重複)</span>
                      <div className="flex flex-col sm:flex-row gap-2 items-center">
                        <div className="relative w-full sm:w-1/2">
                          <button
                            type="button"
                            onClick={() => setIsEditMaDropdownOpen(!isEditMaDropdownOpen)}
                            className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] outline-none transition-all h-[34px] font-bold text-slate-300 flex items-center justify-between text-left hover:border-slate-700 cursor-pointer"
                          >
                            <span className="text-slate-400">● 展開選擇武學</span>
                            <i className={`fa-solid fa-chevron-down text-[8px] text-slate-500 transition-transform ${isEditMaDropdownOpen ? 'rotate-180' : ''}`}></i>
                          </button>
                          {isEditMaDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setIsEditMaDropdownOpen(false)} />
                              <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-[#090f1d] border border-slate-800 rounded-xl shadow-2xl p-1 z-50 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-800">
                                {martialArts.map((ma, i) => {
                                  const isSelected = editingSelectedArts.includes(ma.name);
                                  return (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => {
                                        if (isSelected) {
                                          setEditingSelectedArts(editingSelectedArts.filter(item => item !== ma.name));
                                          const mappedHm = getMappedHeartMethod(ma.name);
                                          if (mappedHm) {
                                            setEditingSelectedHms(editingSelectedHms.filter(h => h !== mappedHm));
                                          }
                                        } else {
                                          setEditingSelectedArts([...editingSelectedArts, ma.name]);
                                          
                                          const mapping = getMappedHeartMethod(ma.name);
                                          if (mapping && !editingSelectedHms.includes(mapping)) {
                                            if (editingSelectedHms.length < 4) {
                                              setEditingSelectedHms([...editingSelectedHms, mapping]);
                                            }
                                          }
                                        }
                                      }}
                                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[10px] font-bold transition-all ${
                                        isSelected 
                                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-extrabold' 
                                          : 'text-slate-300 hover:bg-[#0f172a] border border-transparent hover:text-white'
                                      }`}
                                    >
                                      <span className="flex items-center gap-1.5 truncate">
                                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ma.color || '#94a3b8' }}></span>
                                        {ma.name}
                                      </span>
                                      {isSelected ? (
                                        <i className="fa-solid fa-check text-[8px] text-blue-400"></i>
                                      ) : (
                                        <span className="w-2.5 h-2.5 rounded border border-slate-700 shrink-0"></span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 min-h-[34px] bg-[#020617]/50 border border-slate-900 rounded-xl px-2.5 py-1 w-full sm:w-1/2">
                          {editingSelectedArts.length === 0 ? (
                            <span className="text-[9px] text-slate-600 italic">尚未選擇武學</span>
                          ) : (
                            editingSelectedArts.map((ma, i) => {
                              const maObj = martialArts.find(m => m.name === ma);
                              return (
                                <React.Fragment key={`${ma}-${i}`}>
                                  {i > 0 && <span className="text-slate-600 text-[10px] font-black">+</span>}
                                  <span
                                    onClick={() => {
                                      setEditingSelectedArts(editingSelectedArts.filter(item => item !== ma));
                                      const mappedHm = getMappedHeartMethod(ma);
                                      if (mappedHm) {
                                        setEditingSelectedHms(editingSelectedHms.filter(h => h !== mappedHm));
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold bg-[#020617] border-slate-800 text-slate-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 cursor-pointer transition-all truncate"
                                    title="點擊刪除"
                                  >
                                    <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: maObj?.color || '#94a3b8' }}></span>
                                    {ma}
                                  </span>
                                </React.Fragment>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Heart Methods Selection */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-bold block">配戴心法 (多選，不重複)</span>
                      <div className="flex flex-col sm:flex-row gap-2 items-center">
                        <div className="relative w-full sm:w-1/2">
                          <button
                            type="button"
                            onClick={() => setIsEditHmDropdownOpen(!isEditHmDropdownOpen)}
                            className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] outline-none transition-all h-[34px] font-bold text-slate-300 flex items-center justify-between text-left hover:border-slate-700 cursor-pointer"
                          >
                            <span className="text-slate-400">● 展開選擇心法</span>
                            <i className={`fa-solid fa-chevron-down text-[8px] text-slate-500 transition-transform ${isEditHmDropdownOpen ? 'rotate-180' : ''}`}></i>
                          </button>
                          {isEditHmDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setIsEditHmDropdownOpen(false)} />
                              <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-[#090f1d] border border-slate-800 rounded-xl shadow-2xl p-1 z-50 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-800">
                                {heartMethods.map((hm, i) => {
                                  const isSelected = editingSelectedHms.includes(hm.name);
                                  let rarityColor = '#94a3b8';
                                  if (hm.rarity === 'gold') rarityColor = '#f59e0b';
                                  else if (hm.rarity === 'purple') rarityColor = '#c084fc';
                                  else if (hm.rarity === 'blue') rarityColor = '#60a5fa';

                                  return (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => {
                                        if (isSelected) {
                                          setEditingSelectedHms(editingSelectedHms.filter(item => item !== hm.name));
                                        } else {
                                          if (editingSelectedHms.length >= 4) {
                                            showToast('每個搭配的心法最多只能選擇 4 個', 'warning');
                                            return;
                                          }
                                          setEditingSelectedHms([...editingSelectedHms, hm.name]);
                                        }
                                      }}
                                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-[10px] font-bold transition-all ${
                                        isSelected
                                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-extrabold'
                                          : 'text-slate-300 hover:bg-[#0f172a] border border-transparent hover:text-white'
                                      }`}
                                    >
                                      <span className="flex items-center gap-1.5 truncate" style={{ color: rarityColor }}>
                                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: rarityColor }}></span>
                                        {hm.type ? `[${hm.type}] ` : ''}{hm.name}
                                      </span>
                                      {isSelected ? (
                                        <i className="fa-solid fa-check text-[8px] text-blue-400"></i>
                                      ) : (
                                        <span className="w-2.5 h-2.5 rounded border border-slate-700 shrink-0"></span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 min-h-[34px] bg-[#020617]/50 border border-slate-900 rounded-xl px-2.5 py-1 w-full sm:w-1/2">
                          {editingSelectedHms.length === 0 ? (
                            <span className="text-[9px] text-slate-600 italic">尚未選擇心法</span>
                          ) : (
                            editingSelectedHms.map((hmName, i) => {
                              const style = getHmStyle(hmName);
                              return (
                                <span
                                  key={`${hmName}-${i}`}
                                  onClick={() => setEditingSelectedHms(editingSelectedHms.filter(item => item !== hmName))}
                                  style={style}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 cursor-pointer transition-all truncate"
                                  title="點擊刪除"
                                >
                                  {hmName}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add action buttons */}
                  <div className="md:col-span-3 h-full flex flex-col gap-1.5 items-end justify-end">
                    {editingComboIndex !== null && (
                      <button
                        type="button"
                        onClick={handleCancelComboEdit}
                        className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold tracking-wider transition-all border border-slate-705 shrink-0"
                      >
                        取消修改此組
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAddComboToEditing}
                      className={`w-full ${
                        editingComboIndex !== null 
                          ? 'h-[36px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20' 
                          : 'h-[36px] bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                      } rounded-xl text-[11px] font-black tracking-wider transition-all flex items-center justify-center gap-1 border border-amber-500/10 shadow-lg`}
                    >
                      {editingComboIndex !== null ? (
                        <>
                          <i className="fa-solid fa-check text-xs"></i> 確定儲存變更
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-plus text-xs"></i> 新增此組搭配
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Combos list */}
                {editingMember.combos && editingMember.combos.length > 0 && (
                  <div className="pt-3 border-t border-slate-800 space-y-1 w-full">
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">已登錄搭配清單 (點選任一可直接載入修改)：</span>
                    <div className="flex flex-wrap gap-2">
                      {editingMember.combos.map((c, idx) => {
                        const isCurrentlyEditingThis = editingComboIndex === idx;
                        return (
                          <div 
                            key={idx} 
                            onClick={() => handleSelectComboForEdit(idx)}
                            className={`p-2 text-xs rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                              isCurrentlyEditingThis
                                ? 'bg-emerald-950/40 border-2 border-emerald-500 shadow-lg shadow-emerald-500/10'
                                : 'bg-[#0f172a]/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/30'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-amber-500 font-black uppercase tracking-wider">{c.name}</span>
                                {isCurrentlyEditingThis && (
                                  <span className="bg-emerald-500 text-slate-950 px-1 py-0.1 rounded text-[8px] font-extrabold select-none animate-pulse">
                                    修改中
                                  </span>
                                )}
                                <span className="text-[9px] text-slate-450 font-mono font-bold bg-[#020617] px-1.5 py-0.2 rounded">
                                  {c.power} 鵝
                                </span>
                              </div>
                              <div className="flex gap-1.5 items-center mt-1 flex-wrap">
                                {c.arts.map((art, artIdx) => (
                                  <React.Fragment key={artIdx}>
                                    {artIdx > 0 && <span className="text-[10px] text-slate-600 font-black">+</span>}
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold text-white bg-indigo-600/20 border border-indigo-500/30">
                                      {art}
                                    </span>
                                  </React.Fragment>
                                ))}
                              </div>
                              {(c.weaponSet || c.armorSet) && (
                                <div className="flex gap-1 items-center mt-1">
                                  {c.weaponSet && (
                                    <span className="px-1.5 py-0.2 rounded text-[8px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20">
                                      武: {c.weaponSet}
                                    </span>
                                  )}
                                  {c.armorSet && (
                                    <span className="px-1.5 py-0.2 rounded text-[8px] font-black text-sky-400 bg-sky-500/10 border border-sky-500/20">
                                      防: {c.armorSet}
                                    </span>
                                  )}
                                </div>
                              )}
                              {c.heartMethods && c.heartMethods.length > 0 && (
                                <div className="flex gap-1 mt-1.5 items-center">
                                  {c.heartMethods.map((hmName, hIdx) => (
                                    <HeartMethodTooltip key={hIdx} name={hmName} projectHeartMethods={heartMethods} />
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveComboFromEditing(idx);
                              }}
                              className="text-red-500 hover:text-red-400 p-1.5 rounded hover:bg-red-500/10 transition-colors shrink-0"
                              title="移除組合"
                            >
                              <i className="fa-solid fa-trash-can text-xs"></i>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-800 bg-[#0a0f1d] flex items-center justify-end">
              <button
                onClick={handleCloseEditModal}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-black tracking-wider transition-all border border-slate-700 shadow-md"
              >
                關閉視窗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Unsaved Changes Confirm Modal */}
      {showUnsavedConfirm && (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in zoom-in-95 duration-150">
          <div className="bg-[#0f172a] border border-slate-800 w-full max-w-sm rounded-[1.5rem] p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mx-auto">
              <i className="fa-solid fa-triangle-exclamation text-xl"></i>
            </div>
            <div className="space-y-1.5">
              <h4 className="font-black text-sm text-white uppercase tracking-wide">您有尚未儲存的變更</h4>
              <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                您對成員資料做出的修改尚未儲存，若此時關閉，所有變更將不會保留。
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <button
                onClick={handleCancelDiscard}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-black tracking-widest transition-all border border-slate-700"
              >
                繼續編輯
              </button>
              <button
                onClick={handleConfirmDiscardChanges}
                className="py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black tracking-widest transition-all"
              >
                放棄變更
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Custom Deletion Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in zoom-in-95 duration-150">
          <div className="bg-[#0f172a] border border-slate-800 w-full max-w-sm rounded-[1.5rem] p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto">
              <i className="fa-solid fa-circle-exclamation text-xl"></i>
            </div>
            <div className="space-y-1.5">
              <h4 className="font-black text-sm text-white uppercase tracking-wide">確認移除成員嗎？</h4>
              <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                此成員的所有資料與登入武學搭配將被完全刪除，此操作將無法復原。
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-black tracking-widest transition-all border border-slate-700"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black tracking-widest transition-all"
              >
                確定移除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
