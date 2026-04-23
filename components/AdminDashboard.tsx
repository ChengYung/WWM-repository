import React, { useState, useEffect } from 'react';
import { ProjectService } from '../services/ProjectService';
import { UserProfile, Project } from '../types';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import { ConfirmModal } from './ConfirmModal';

export const AdminDashboard: React.FC<{ user: any }> = ({ user }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, projectId: string, projectName: string}>({
    isOpen: false,
    projectId: '',
    projectName: ''
  });

  const isAdmin = user?.email === 'secert811116@gmail.com';

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [uData, pData] = await Promise.all([
          ProjectService.getAllUsers(),
          ProjectService.getAllProjects()
        ]);
        
        // Auto-filter: Only keep users that have projects
        const usersWithProjects = uData.filter(u => 
          pData.some(p => p.ownerId === u.uid)
        );
        
        setUsers(usersWithProjects);
        setProjects(pData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin, navigate]);

  const handleUpdateLimit = async (uid: string, limit: number) => {
    try {
      await ProjectService.updateUserLimit(uid, limit);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, maxProjects: limit } : u));
      showToast('額度已更新', 'success');
    } catch (err) {
      showToast('更新失敗', 'error');
    }
  };

  const handleUpdateExpiration = async (projectId: string, days: number) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const now = Date.now();
    // If project is already active, add to current expiration. If expired, add to now.
    const baseTime = (project.expirationDate && project.expirationDate > now) 
      ? project.expirationDate 
      : now;
      
    const newDate = baseTime + days * 24 * 60 * 60 * 1000;
    
    try {
      await ProjectService.updateProjectMetadata(projectId, { expirationDate: newDate });
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, expirationDate: newDate } : p));
      showToast(`效期已展延 ${days} 天`, 'success');
    } catch (err) {
      showToast('更新失敗', 'error');
    }
  };

  const handleToggleRestriction = async (projectId: string, current: boolean) => {
    const isUnrestricting = current; // if currently restricted (!current=false), it's unrestricting
    try {
      // If we are lifting restriction (current=true becoming false), we also clear ownerMessage
      const updates: any = { isRestricted: !current };
      if (isUnrestricting) {
        updates.ownerMessage = "";
      }
      
      await ProjectService.updateProjectMetadata(projectId, updates);
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, isRestricted: !current, ownerMessage: isUnrestricting ? "" : p.ownerMessage } : p));
      showToast(!current ? '已鎖定專案' : '已解除所有限制', 'success');
    } catch (err) {
      showToast('更新失敗', 'error');
    }
  };

  const handleUpdateMessage = async (projectId: string, message: string) => {
    try {
      await ProjectService.updateProjectMetadata(projectId, { restrictionMessage: message });
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, restrictionMessage: message } : p));
      showToast('備註已儲存', 'success');
    } catch (err) {
      console.error(err);
      showToast('儲存失敗', 'error');
    }
  };

  const handleAdminDeleteProject = async (projectId: string) => {
    try {
      await ProjectService.deleteProject(projectId);
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) return null;
        return p;
      }).filter((p): p is Project => p !== null));
      showToast('專案已永久刪除', 'success');
    } catch (err) {
      showToast('刪除失敗', 'error');
    } finally {
      setConfirmConfig({ isOpen: false, projectId: '', projectName: '' });
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-center bg-[#0f172a] p-6 md:p-8 rounded-3xl border border-slate-800 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-blue-500 uppercase">開發者後台</h1>
            <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">用戶與專案關聯管理</p>
          </div>
          <button onClick={() => navigate('/')} className="w-full md:w-auto px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
            返回門戶
          </button>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
              <div className="flex items-center gap-4 text-slate-400 font-black uppercase tracking-widest text-[10px] md:text-xs">
                <i className="fa-solid fa-users-viewfinder"></i>
                全系統概況: {users.length} 位活躍用戶 / {projects.length} 個專案
              </div>

              <div className="relative w-full md:w-80">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                <input 
                  type="text"
                  placeholder="搜尋用戶 Email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:ring-1 ring-blue-500 outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {users.filter(u => u.email?.toLowerCase().includes(searchTerm.toLowerCase())).map(u => {
                const userProjects = projects.filter(p => p.ownerId === u.uid);
                return (
                  <div key={u.uid} className="bg-[#0f172a] rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
                    {/* User Header */}
                    <div className="p-4 md:p-6 bg-slate-900/50 border-b border-slate-800 flex flex-col md:flex-row flex-wrap justify-between items-center gap-4">
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                          <i className="fa-solid fa-user-gear text-lg md:text-xl"></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-black text-slate-200 truncate text-sm md:text-base">{u.email || '未知用戶'}</h3>
                          <p className="text-[10px] text-slate-600 font-black uppercase tracking-tight truncate">UID: {u.uid}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shrink-0 ${u.plan === 'pro' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-500'}`}>
                          {u.plan}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 uppercase font-black mb-1">註冊時間</p>
                          <p className="text-[10px] text-slate-400 font-bold">{new Date(u.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="w-24 md:w-32">
                          <p className="text-[10px] text-slate-500 uppercase font-black mb-1">建立上限</p>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number"
                              className="w-full bg-[#020617] border border-slate-800 rounded-lg px-2 py-1 text-xs text-blue-500 font-black"
                              defaultValue={u.maxProjects || 1}
                              onBlur={(e) => handleUpdateLimit(u.uid, parseInt(e.target.value))}
                            />
                            <span className="text-[10px] text-slate-600 font-bold">/{userProjects.length}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Associated Projects */}
                    <div className="p-4 md:p-6">
                      {userProjects.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-slate-900 rounded-2xl">
                          <p className="text-slate-800 font-bold italic text-[10px] md:text-xs uppercase">該用戶尚未建立任何專案</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                          {userProjects.map(p => {
                            const daysLeft = p.expirationDate ? Math.ceil((p.expirationDate - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
                            return (
                              <div key={p.id} className="p-4 bg-[#020617] rounded-2xl border border-slate-800 space-y-4 hover:border-blue-500/30 transition-all group">
                                <div className="flex justify-between items-start">
                                  <div className="min-w-0 flex-1 pr-2">
                                    <h5 className="font-black text-sm text-slate-300 group-hover:text-white transition-colors truncate">{p.name}</h5>
                                    <p className="text-[9px] text-slate-600 font-bold uppercase mt-0.5 truncate">ID: {p.id}</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1 shrink-0">
                                    <button 
                                      onClick={() => setConfirmConfig({ isOpen: true, projectId: p.id, projectName: p.name })}
                                      className="w-6 h-6 flex items-center justify-center rounded-md bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all mb-1"
                                      title="從資料庫永久刪除"
                                    >
                                      <i className="fa-solid fa-trash-can text-[10px]"></i>
                                    </button>
                                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${daysLeft < 7 ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                                      {daysLeft} 天後到期
                                    </div>
                                    {p.isRestricted && (
                                      <div className="px-2 py-0.5 rounded bg-red-600 text-white text-[8px] font-black uppercase animate-pulse">
                                        已限制使用
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-[10px]">
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-600 font-black uppercase">總人數</span>
                                    <span className="text-blue-500 font-black">{p.playerCount || 0}</span>
                                  </div>
                                  <button 
                                    onClick={() => handleToggleRestriction(p.id, p.isRestricted || false)}
                                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${p.isRestricted ? 'bg-blue-600 text-white' : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white'}`}
                                  >
                                    {p.isRestricted ? '解除限制' : '限制專案'}
                                  </button>
                                </div>

                                <div className="space-y-2">
                                  <span className="text-[9px] text-slate-600 font-extrabold uppercase tracking-widest">限制事由 / 留言紀錄</span>
                                  <textarea 
                                    className="w-full bg-[#020617] border border-slate-800 rounded-xl px-3 py-2 text-[10px] text-slate-300 focus:ring-1 ring-blue-500 outline-none resize-none h-16 leading-relaxed"
                                    placeholder="輸入備註內容... (例如：超過測試期、違反使用規範...)"
                                    defaultValue={p.restrictionMessage || ''}
                                    onBlur={(e) => handleUpdateMessage(p.id, e.target.value)}
                                  />
                                </div>

                                {p.ownerMessage && (
                                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 space-y-1">
                                    <span className="text-[9px] text-blue-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                                      <i className="fa-solid fa-comment-dots"></i> 用戶回饋
                                    </span>
                                    <p className="text-[10px] text-slate-300 leading-relaxed italic">"{p.ownerMessage}"</p>
                                  </div>
                                )}

                                <div className="pt-3 border-t border-slate-900">
                                  <p className="text-[9px] text-slate-600 font-black uppercase mb-2 tracking-widest text-center">展延效期</p>
                                  <div className="grid grid-cols-3 gap-1.5">
                                    {[1, 7, 14, 30, 90, 365].map(d => (
                                      <button 
                                        key={d}
                                        onClick={() => handleUpdateExpiration(p.id, d)}
                                        className="py-1 text-[9px] font-black bg-slate-900 border border-slate-800 hover:bg-blue-600 hover:border-blue-500 text-slate-500 hover:text-white rounded-lg transition-all"
                                      >
                                        +{d}天
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        title="強行刪除專案"
        message={`您確定要從系統中永久刪除專案「${confirmConfig.projectName}」嗎？此操作將會清除所有報名人員且無法復原。`}
        onConfirm={() => handleAdminDeleteProject(confirmConfig.projectId)}
        onCancel={() => setConfirmConfig({ isOpen: false, projectId: '', projectName: '' })}
      />
    </div>
  );
};
