import React, { useState, useEffect, memo } from 'react';
import { User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { ProjectService } from '../services/ProjectService';
import { Project, UserProfile } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { useToast } from './Toast';

const USAGE_LIMIT = 50;

const ProjectCard = memo(({ project, onClick, onDelete, isDeletionBlocked }: { 
  project: Project, 
  onClick: () => void, 
  onDelete: (e: React.MouseEvent) => void,
  isDeletionBlocked: boolean
}) => {
  const daysLeft = project.expirationDate ? Math.ceil((project.expirationDate - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
  const isExpired = daysLeft <= 0;
  const expiryDate = project.expirationDate ? new Date(project.expirationDate) : null;
  
  return (
    <div 
      onClick={onClick}
      className={`bg-[#0f172a] p-6 rounded-3xl border ${project.isRestricted ? 'border-red-500/50 hover:border-red-500 bg-red-500/5 shadow-red-500/5' : 'border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/50'} transition-all cursor-pointer group shadow-lg flex flex-col relative overflow-hidden`}
    >
      {project.isRestricted && (
        <div className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-black px-3 py-1 uppercase tracking-widest rounded-bl-xl z-10 animate-pulse">
          系統限制中
        </div>
      )}
      
      <div className="flex justify-between items-start mb-6">
        <div className={`h-12 w-12 ${project.isRestricted ? 'bg-red-500/20 text-red-500 shadow-[inset_0_0_15px_rgba(239,68,68,0.2)]' : 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white'} rounded-2xl flex items-center justify-center transition-all shadow-inner`}>
          <i className={`fa-solid ${project.isRestricted ? 'fa-lock' : 'fa-folder-tree'} text-xl`}></i>
        </div>
        <div className="flex gap-2">
           {!isDeletionBlocked && !project.isRestricted && (
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 onDelete(e);
               }}
               className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-lg"
             >
               <i className="fa-solid fa-trash-can text-sm"></i>
             </button>
           )}
        </div>
      </div>
      
      <div className="space-y-1 mb-6">
        <h4 className="font-black text-xl text-slate-100 group-hover:text-blue-400 transition-colors truncate">{project.name}</h4>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">建立於 {new Date(project.createdAt).toLocaleTimeString()}</span>
          <span className="w-1 h-1 rounded-full bg-slate-800"></span>
          <span className="text-[10px] text-blue-500/70 font-black uppercase tracking-widest">{project.playerCount || 0} 人次已報名</span>
        </div>
      </div>
      
      <div className="mt-auto pt-6 border-t border-slate-800/50 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest leading-none">使用期限</span>
          <div className="flex flex-col">
            <span className={`text-[10px] font-black uppercase tracking-tight ${isExpired || daysLeft < 7 ? 'text-red-500' : 'text-slate-400'}`}>
              {isExpired ? '已逾期' : `${daysLeft} 天後到期`}
            </span>
            {expiryDate && (
              <span className="text-[8px] text-slate-700 font-bold tabular-nums">
                {expiryDate.toLocaleString()} 截止
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-blue-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
             <span className="text-[10px] font-black uppercase tracking-widest">管理專案</span>
             <i className="fa-solid fa-arrow-right-long animate-bounce-x"></i>
        </div>
      </div>
    </div>
  );
});

interface ProjectManagerProps {
  user: User | null;
  login: () => void;
  logout: () => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ user, login, logout }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const isAdmin = user?.email === 'secert811116@gmail.com';

  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setProfile(null);
      return;
    }

    setLoading(true);
    const unsubProjects = ProjectService.subscribeToProjects(user.uid, (res) => {
      setProjects(res);
      setLoading(false);
    });

    const unsubProfile = ProjectService.subscribeToUserProfile(user.uid, setProfile);

    return () => {
      unsubProjects();
      unsubProfile();
    };
  }, [user]);

  // ENHANCED LOGIC: Determine if ANY project in the current list is restricted OR expired
  const isAnyProjectRestricted = projects.some(p => {
    const isAdminRestricted = p.isRestricted === true;
    const isExpired = p.expirationDate ? (Date.now() > p.expirationDate) : false;
    return isAdminRestricted || isExpired;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newProjectName.trim()) return;

    if (!isAdmin && isAnyProjectRestricted) {
      showToast('您的帳號目前有專案遭到限制，無法建立新專案', 'error');
      return;
    }

    const limitCount = profile?.maxProjects || 1;
    if (projects.length >= limitCount) {
      showToast(`已達建立上限 (${limitCount}個)，請聯繫管理員`, 'error');
      return;
    }

    setLoading(true);
    try {
      const p = await ProjectService.createProject(newProjectName, user.uid, user.email || '');
      setNewProjectName('');
      navigate(`/project/${p.id}`);
    } catch (error) {
      console.error("Failed to create project", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (projectId: string) => {
    if (!isAdmin && isAnyProjectRestricted) {
      showToast('您的帳號目前有專案遭到限制，無法執行刪除操作', 'error');
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: '刪除專案',
      message: '確定要刪除此專案嗎？這將會連同內部的所有報名資料一併刪除，此操作無法復原。',
      onConfirm: async () => {
        try {
          await ProjectService.deleteProject(projectId);
          showToast('專案已刪除', 'success');
        } catch (error) {
          showToast('刪除失敗', 'error');
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans">
      <header className="bg-[#0f172a] border-b border-slate-800 p-6 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-shield-halved text-2xl text-white"></i>
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">百業戰報名系統</h1>
          </div>
          {user ? (
            <div className="flex items-center gap-4">
              {isAdmin && (
                <button 
                  onClick={() => navigate('/admin')}
                  className="px-4 py-2 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-inner"
                >
                  開發者後台
                </button>
              )}
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] text-slate-500 font-black uppercase leading-none mb-1">已登入用戶</span>
                <span className="text-xs text-slate-300 font-bold">{user.email}</span>
              </div>
              <button 
                onClick={logout} 
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-500 hover:text-red-500 transition-colors"
                title="登出系統"
              >
                <i className="fa-solid fa-power-off text-sm"></i>
              </button>
            </div>
          ) : (
            <button onClick={login} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs transition-all shadow-xl shadow-blue-500/20">
              登入管理系統
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-12 space-y-16">
        {user && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-xl">
              <div>
                <h3 className="font-black text-xs text-slate-500 uppercase tracking-widest mb-1">建立新專案</h3>
                <p className="text-[10px] text-slate-600">輸入百業名稱或期數開始。</p>
              </div>
              <form onSubmit={handleCreate} className="flex gap-2">
                <input 
                  type="text" 
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="例如: 第四期燕雲百業" 
                  className="bg-[#020617] border border-slate-800 rounded-lg px-4 py-2 text-xs focus:ring-1 ring-blue-500 outline-none w-64 text-white"
                />
                <button 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-lg font-black text-xs transition-all disabled:opacity-50"
                >
                  {loading ? '建立中...' : '建立'}
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.length === 0 ? (
                <div className="col-span-2 text-center py-20 border-2 border-dashed border-slate-900 rounded-3xl">
                   <p className="text-slate-700 font-bold italic text-sm">尚未建立任何專案</p>
                </div>
              ) : (
                projects.map(p => (
                  <ProjectCard 
                    key={p.id} 
                    project={p} 
                    onClick={() => navigate(`/project/${p.id}`)} 
                    onDelete={() => handleDelete(p.id)}
                    isDeletionBlocked={!isAdmin && isAnyProjectRestricted}
                  />
                ))
              )}
            </div>
          </section>
        )}

        {!user && (
          <section className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center py-16 bg-[#0f172a]/50 rounded-[3rem] border border-slate-900 border-dashed backdrop-blur-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black tracking-widest border border-blue-500/20">訪客功能全開放</span>
             </div>
             <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center text-blue-500 mx-auto mb-8 shadow-inner">
               <i className="fa-solid fa-user-secret text-3xl"></i>
             </div>
             <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">目前處於：訪客協作模式</h3>
             <p className="text-slate-500 font-bold text-sm mb-12 max-w-md mx-auto leading-relaxed">
               您可以自由編輯已加入的報名名單、分組與統計資料。<br/>
               <span className="text-blue-500/70">請注意：建立新專案功能僅限 Google 登入帳號。</span>
             </p>
               
               <div className="flex flex-col items-center gap-6">
                 <button 
                   onClick={login} 
                   className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm shadow-2xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                 >
                    <i className="fa-brands fa-google text-lg"></i>
                    使用 GOOGLE 帳號登入
                 </button>
                 
                 <div className="flex items-center gap-4 w-full max-w-xs">
                    <div className="h-px bg-slate-900 flex-1"></div>
                    <span className="text-[10px] text-slate-700 font-black uppercase tracking-widest">或</span>
                    <div className="h-px bg-slate-900 flex-1"></div>
                 </div>

                 <div className="w-full max-w-md flex gap-2 p-2 bg-[#020617] rounded-2xl border border-slate-800 shadow-inner">
                    <input 
                      id="visitor-project-id"
                      type="text" 
                      placeholder="輸入專案 ID 快速進入..."
                      className="flex-1 bg-transparent border-none px-4 py-2 text-xs text-white outline-none font-bold"
                    />
                    <button 
                      onClick={() => {
                        const id = (document.getElementById('visitor-project-id') as HTMLInputElement).value;
                        if (id) navigate(`/project/${id}`);
                      }}
                      className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition-all"
                    >
                      進入專案
                    </button>
                 </div>
               </div>
            </div>
          </section>
        )}
      </main>

      <footer className="p-12 text-center text-[10px] text-slate-700 font-black uppercase tracking-[0.3em]">
        燕雲百業戰報名系統 &copy; 2026 PRO PLAN EARLY ACCESS
      </footer>

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
