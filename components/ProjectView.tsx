import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { ProjectService } from '../services/ProjectService';
import { Player, Project, TeamConfig, MartialArts, Technique, Availability } from '../types';
import { 
  AVAILABILITY_OPTIONS, 
  INITIAL_MARTIAL_ARTS, 
  TEAMS, 
  INITIAL_TEAM_DESCRIPTIONS, 
  INITIAL_TECHNIQUES 
} from '../constants';

// Components
import { TabButton } from './TabButton';
import { RegistrationSheet } from './RegistrationSheet';
import { RegistrationList } from './RegistrationList';
import { TeamDashboard } from './TeamDashboard';
import { TechniqueSheet } from './TechniqueSheet';
import { ConfigSheet } from './ConfigSheet';
import { ConfirmModal } from './ConfirmModal';
import { useToast } from './Toast';
import { UserProfile } from '../types';

interface ProjectViewProps {
  user: User | null;
  login: () => void;
  logout: () => void;
}

export const ProjectView: React.FC<ProjectViewProps> = ({ user, login, logout }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const { showToast } = useToast();
  
  // Project State
  const [project, setProject] = useState<Project | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastAddedPlayerId, setLastAddedPlayerId] = useState<string | null>(null);

  // Derived state or fallback to defaults if project not loaded
  const martialArts = project?.martialArts || INITIAL_MARTIAL_ARTS;
  const teams = project?.teams || TEAMS;
  const teamDescriptions = project?.teamDescriptions || INITIAL_TEAM_DESCRIPTIONS;
  const techniques = project?.techniques || INITIAL_TECHNIQUES;

  // Confirmation Modal
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm });
  };

  // Load Project and sync Players
  useEffect(() => {
    if (!projectId) return;

    setLoading(true);
    // 1. Fetch Project Config
    ProjectService.getProject(projectId).then(proj => {
      if (!proj) {
        navigate('/');
        return;
      }
      setProject(proj);
    });

    // 2. Subscribe to Players
    const unsubscribePlayers = ProjectService.subscribeToPlayers(projectId, (pList) => {
      setPlayers(pList);
      setLoading(false);
    });

    return () => {
      unsubscribePlayers();
    };
  }, [projectId, navigate, user]);

  const isOwner = user && project && project.ownerId === user.uid;
  const isAdmin = user?.email === 'secert811116@gmail.com';
  
  // Expiration logic
  const now = Date.now();
  const daysLeft = project?.expirationDate ? Math.ceil((project.expirationDate - now) / (1000 * 60 * 60 * 24)) : 0;
  const isExpired = project?.expirationDate ? (now > project.expirationDate) : false;
  
  // Final Restriction Status: Either administratively restricted OR expired
  const isRestricted = (project?.isRestricted === true) || isExpired;

  const handleUpdateProjectConfig = useCallback(async (updates: Partial<Project>) => {
    if (!projectId) return;
    if (!isAdmin && isRestricted) {
      showToast('此專案目前遭到限制，無法修改設定', 'error');
      return;
    }
    try {
      await ProjectService.updateProject(projectId, updates);
      setProject(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error("Failed to update project config", error);
    }
  }, [projectId, isAdmin, isRestricted]);

  const handleAddPlayer = useCallback(async (newPlayer: Omit<Player, 'id' | 'createdAt' | 'projectId'>) => {
    if (!projectId) return;
    if (!isAdmin && isRestricted) {
      showToast('專案已過期或被限制，無法報名', 'error');
      return;
    }
    const player: Omit<Player, 'id'> = {
      ...newPlayer,
      projectId,
      createdAt: Date.now()
    };
    try {
      const newId = await ProjectService.addPlayer(projectId, player);
      setLastAddedPlayerId(newId);
      setActiveTab(1); // Switch to Registration List
    } catch (error) {
      console.error("Failed to add player", error);
    }
  }, [projectId, isAdmin, isRestricted]);

  const handleUpdatePlayers = useCallback(async (updates: { id: string; team: string }[]) => {
    if (!projectId) return;
    if (!isAdmin && isRestricted) {
      showToast('專案已過期或被限制，無法修改資料', 'error');
      return;
    }
    try {
      await ProjectService.updatePlayers(projectId, updates);
    } catch (error) {
      console.error("Failed to update players", error);
    }
  }, [projectId, isAdmin, isRestricted]);

  const handleDeletePlayer = useCallback((id: string) => {
    if (!projectId) return;
    if (!isAdmin && isRestricted) {
      showToast('專案已過期或被限制，無法刪除資料', 'error');
      return;
    }
    showConfirm(
      '確認移除',
      '確定要移除此報名資料嗎？此操作無法復原。',
      () => {
        ProjectService.deletePlayer(projectId, id);
      }
    );
  }, [projectId, isAdmin, isRestricted]);

  const handleClearPlayers = useCallback(() => {
    if (!projectId || players.length === 0) return;
    if (!isAdmin && isRestricted) {
      showToast('專案已過期或被限制，無法執行此操作', 'error');
      return;
    }
    showConfirm(
      '清除整張名單',
      '確定要清除所有報名資料嗎？這將移除目前名單上的所有人。此操作無法復原。',
      () => {
        ProjectService.clearAllPlayers(projectId, players.map(p => p.id));
      }
    );
  }, [projectId, players, isAdmin, isRestricted]);

  const handleResetTeams = useCallback(() => {
    if (!projectId) return;
    if (!isAdmin && isRestricted) {
      showToast('專案已過期或被限制，無法執行此操作', 'error');
      return;
    }
    showConfirm(
      '重製隊伍',
      '確定要將所有人員重製回「候補」嗎？',
      () => {
        const updates = players.map(p => ({ id: p.id, team: '候補' }));
        ProjectService.updatePlayers(projectId, updates);
      }
    );
  }, [projectId, players, isAdmin, isRestricted]);

  const handleEditPlayer = useCallback(async (updatedPlayer: Player) => {
    if (!projectId) return;
    if (!isAdmin && isRestricted) {
      showToast('專案已過期或被限制，無法修改資料', 'error');
      return;
    }
    try {
      await ProjectService.updatePlayer(projectId, updatedPlayer);
    } catch (error) {
      console.error("Failed to edit player", error);
    }
  }, [projectId, isAdmin, isRestricted]);

  const handleMovePlayer = useCallback(async (playerId: string, targetTeam: string) => {
    if (!projectId) return;
    try {
      await ProjectService.updatePlayers(projectId, [{ id: playerId, team: targetTeam }]);
    } catch (error) {
      console.error("Failed to move player", error);
    }
  }, [projectId]);

  const handleSendOwnerMessage = useCallback(async (message: string) => {
    if (!projectId) return;
    const isUpdate = !!project?.ownerMessage;
    try {
      await ProjectService.updateProject(projectId, { ownerMessage: message });
      showToast(isUpdate ? '已更新通報內容' : '已成功通報管理員', 'success');
    } catch (error) {
      console.error("Failed to send message", error);
      showToast('傳送失敗，請重試', 'error');
    }
  }, [projectId, project?.ownerMessage, showToast]);

  const handleUpdateTeamDescription = useCallback((teamName: string, config: TeamConfig) => {
    const newDescriptions = { ...teamDescriptions, [teamName]: config };
    handleUpdateProjectConfig({ teamDescriptions: newDescriptions });
  }, [teamDescriptions, handleUpdateProjectConfig]);

  const handleUpdateTeams = useCallback((newTeams: string[]) => {
    handleUpdateProjectConfig({ teams: newTeams });
    // Note: In real app, we might also want to batch update players whose team was deleted, 
    // but for now we keep it simple as per original logic.
  }, [handleUpdateProjectConfig]);

  const handleRestoreDefaults = useCallback(() => {
    handleUpdateProjectConfig({
      martialArts: INITIAL_MARTIAL_ARTS,
      teams: TEAMS,
      teamDescriptions: INITIAL_TEAM_DESCRIPTIONS,
      techniques: INITIAL_TECHNIQUES
    });
  }, [handleUpdateProjectConfig]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isRestricted) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0f172a] p-8 md:p-12 rounded-[2.5rem] border border-slate-800 shadow-2xl text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-red-500/10 rounded-[2rem] flex items-center justify-center text-red-500 mx-auto animate-pulse">
            <i className="fa-solid fa-ban text-4xl"></i>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">此專案已被限制</h1>
            <p className="text-slate-400 text-sm font-bold leading-relaxed">
              {project?.restrictionMessage || '很抱歉，此報名專案已被管理員限制。這可能是因為逾期或其他行政原因導致暫停服務。'}
            </p>
          </div>

          {isOwner && (
            <div className="pt-6 border-t border-slate-800 space-y-4">
              <div className="text-left">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-2">回報給管理員 (訊息會在同步更新給管理員, 請勿繼續更新留言內容)</label>
                <textarea 
                  className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-300 focus:ring-1 ring-blue-500 outline-none resize-none h-24 leading-relaxed"
                  placeholder="請輸入您想告知管理員的訊息..."
                  defaultValue={project?.ownerMessage || ''}
                  id="owner-message-input"
                />
              </div>
              <button 
                onClick={() => {
                  const val = (document.getElementById('owner-message-input') as HTMLTextAreaElement).value;
                  handleSendOwnerMessage(val);
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs transition-all tracking-widest shadow-lg shadow-blue-500/20"
              >
                {project?.ownerMessage ? '更新留言內容' : '傳送留言'}
              </button>
            </div>
          )}

          <div className="pt-6 border-t border-slate-800">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">請聯繫專案擁有者或系統管理員</p>
            <button 
              onClick={() => navigate('/')} 
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-xs transition-all tracking-widest"
            >
              返回門戶
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Navigation Tabs
  return (
    <div className="min-h-screen pb-12 flex flex-col bg-[#020617] text-slate-100">
      {/* Expiration Banner if needed */}
      {isExpired && (
        <div className="bg-red-600 text-white text-[10px] font-black uppercase py-1 text-center tracking-[0.3em] animate-pulse">
          此專案已逾期，請聯繫管理員展延
        </div>
      )}
      {/* Header */}
      <header className="bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800 py-6 shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                <i className="fa-solid fa-chevron-left"></i>
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
                <i className="fa-solid fa-shield-halved text-2xl"></i>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-wider text-slate-100 uppercase">{project?.name || '報名系統'}</h1>
                <div className="flex gap-2 items-center">
                  {project?.expirationDate && (
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${daysLeft < 7 ? 'border-red-500 text-red-500 animate-pulse' : 'border-slate-700 text-slate-500'}`}>
                      {daysLeft} 天後到期
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
             {/* Mode Indicator */}
             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg">
                <div className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                   {user ? '成員模式' : '訪客模式'}
                </span>
             </div>

             <button 
                onClick={() => {
                   const shareUrl = window.location.href;
                   navigator.clipboard.writeText(shareUrl);
                   showToast('報名連結已複製', 'success');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-700 text-slate-100"
             >
                <i className="fa-solid fa-share-nodes mr-2"></i> 複製連結
             </button>
             {user ? (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={logout} 
                    className="px-3 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-[10px] uppercase font-black transition-all border border-red-500/20"
                  >
                    登出
                  </button>
                </div>
             ) : (
                <button 
                  onClick={login} 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] uppercase font-black transition-all shadow-lg shadow-blue-500/20"
                >
                  登入管理
                </button>
             )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-[#0f172a] border-b border-slate-800 sticky top-[84px] z-40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-nowrap overflow-x-auto no-scrollbar scroll-smooth">
          <TabButton active={activeTab === 0} onClick={() => setActiveTab(0)} icon="fa-solid fa-file-signature" label="報名登記" />
          <TabButton active={activeTab === 1} onClick={() => setActiveTab(1)} icon="fa-solid fa-users" label="報名名單" />
          <TabButton active={activeTab === 2} onClick={() => setActiveTab(2)} icon="fa-solid fa-chart-column" label="隊伍統計" />
          <TabButton active={activeTab === 3} onClick={() => setActiveTab(3)} icon="fa-solid fa-scroll" label="操作技巧" />
          {(isOwner || isAdmin) && (
            <TabButton active={activeTab === 5} onClick={() => setActiveTab(5)} icon="fa-solid fa-gears" label="配置設定" />
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {activeTab === 0 && (
            <RegistrationSheet 
              onAddPlayer={handleAddPlayer}
              martialArts={martialArts}
              teams={teams}
              players={players}
              availabilityOptions={AVAILABILITY_OPTIONS}
              isRestricted={isRestricted && !isAdmin}
            />
          )}
          {activeTab === 1 && (
            <RegistrationList 
              players={players}
              lastAddedPlayerId={lastAddedPlayerId}
              onUpdatePlayers={handleUpdatePlayers}
              onDeletePlayer={handleDeletePlayer}
              onClearPlayers={handleClearPlayers}
              onResetTeams={handleResetTeams}
              onEditPlayer={handleEditPlayer}
              martialArts={martialArts}
              teams={teams}
              availabilityOptions={AVAILABILITY_OPTIONS}
              isRestricted={isRestricted && !isAdmin}
            />
          )}
          {activeTab === 2 && (
            <TeamDashboard 
              players={players} 
              onMovePlayer={handleMovePlayer}
              onUpdatePlayers={handleUpdatePlayers}
              onResetTeams={handleResetTeams}
              onUpdateDescription={handleUpdateTeamDescription}
              teams={teams}
              teamDescriptions={teamDescriptions}
              martialArts={martialArts}
              isRestricted={isRestricted && !isAdmin}
            />
          )}
          {activeTab === 3 && (
            <TechniqueSheet 
              techniques={techniques}
              onSave={(t) => handleUpdateProjectConfig({ techniques: t })}
              isReadOnly={!isOwner && !isAdmin}
              isRestricted={isRestricted && !isAdmin}
            />
          )}
          {activeTab === 5 && (isOwner || isAdmin) && (
            <ConfigSheet 
              martialArts={martialArts}
              teams={teams}
              players={players}
              onUpdateMartialArts={(ma) => handleUpdateProjectConfig({ martialArts: ma })}
              onUpdateTeams={handleUpdateTeams}
              onBatchUpdatePlayers={handleUpdatePlayers}
              onRestoreDefaults={handleRestoreDefaults}
              showConfirm={showConfirm}
              isRestricted={isRestricted && !isAdmin}
            />
          )}
        </div>
      </main>

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={() => {
          confirmConfig.onConfirm();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
