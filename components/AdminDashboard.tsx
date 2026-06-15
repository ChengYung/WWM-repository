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
              {[...users]
                .sort((a, b) => {
                  if (!searchTerm.trim()) return 0;
                  const aMatched = a.email?.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0;
                  const bMatched = b.email?.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0;
                  return bMatched - aMatched;
                })
                .map(u => {
                  const isMatched = searchTerm.trim() ? u.email?.toLowerCase().includes(searchTerm.toLowerCase()) : true;
                  const userProjects = projects.filter(p => p.ownerId === u.uid);
                  return (
                    <div key={u.uid} className={`bg-[#0f172a] rounded-3xl border transition-all overflow-hidden shadow-2xl ${isMatched && searchTerm.trim() ? 'border-blue-500/50 shadow-blue-500/5 bg-slate-900/10' : 'border-slate-800'}`}>
                      {/* User Header */}
                      <div className="p-4 md:p-6 bg-slate-900/50 border-b border-slate-800 flex flex-col md:flex-row flex-wrap justify-between items-center gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0 ${isMatched && searchTerm.trim() ? 'bg-blue-500/20 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                            <i className="fa-solid fa-user-gear text-lg md:text-xl"></i>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-black text-slate-200 truncate text-sm md:text-base flex items-center gap-2">
                              {u.email || '未知用戶'}
                              {searchTerm.trim() && isMatched && (
                                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-wider">
                                  符合搜尋
                                </span>
                              )}
                            </h3>
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
                    <div className="p-3 md:p-5">
                      {userProjects.length === 0 ? (
                        <div className="text-center py-6 border-2 border-dashed border-slate-900 rounded-xl">
                          <p className="text-slate-800 font-bold italic text-[10px] md:text-xs uppercase">該用戶尚未建立任何專案</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {userProjects.map(p => {
                            const daysLeft = p.expirationDate ? Math.ceil((p.expirationDate - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
                            return (
                              <div key={p.id} className="p-3 bg-[#020617] rounded-xl border border-slate-800 hover:border-blue-500/20 transition-all group flex flex-col gap-2.5">
                                {/* Main row layout */}
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                  {/* Left side: icon, name, ID, player count */}
                                  <div className="flex items-center gap-2.5 min-w-[240px] lg:max-w-xs xl:max-w-sm shrink-0">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                      <i className="fa-solid fa-folder-open text-xs"></i>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h5 className="font-black text-xs text-slate-200 group-hover:text-white transition-colors truncate">{p.name}</h5>
                                      <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-500">
                                        <span className="font-bold">ID: {p.id}</span>
                                        <span className="h-2 w-px bg-slate-800"></span>
                                        <span className="text-blue-400 font-extrabold flex items-center gap-1">
                                          <i className="fa-solid fa-users text-[8px]"></i> 總人數: {p.playerCount || 0}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Middle side: custom expiration indicator & quick extend buttons */}
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 justify-start lg:justify-center">
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider">效期:</span>
                                      <div className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-tighter ${daysLeft < 7 ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                                        {daysLeft} 天後到期
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 bg-[#0f172a] p-0.5 rounded-lg border border-slate-800">
                                      {[1, 7, 14, 30, 90, 365].map(d => (
                                        <button 
                                          key={d}
                                          onClick={() => handleUpdateExpiration(p.id, d)}
                                          className="px-1.5 py-0.5 text-[8px] font-black bg-slate-900 border border-slate-900 hover:bg-blue-600 hover:border-blue-500 text-slate-500 hover:text-white rounded transition-all whitespace-nowrap"
                                        >
                                          +{d}天
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Right side: system status tag & toggle & delete button */}
                                  <div className="flex items-center gap-2.5 shrink-0 justify-end">
                                    <div className="flex items-center gap-1.5">
                                      {p.isRestricted ? (
                                        <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[8px] font-black uppercase animate-pulse">
                                          已限制使用
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase">
                                          使用中
                                        </span>
                                      )}
                                      <button 
                                        onClick={() => handleToggleRestriction(p.id, p.isRestricted || false)}
                                        className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all ${p.isRestricted ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-red-500/10 text-red-500 border border-red-500/10 hover:bg-red-500 hover:text-white'}`}
                                      >
                                        {p.isRestricted ? '解除限制' : '限制專案'}
                                      </button>
                                    </div>

                                    <button 
                                      onClick={() => setConfirmConfig({ isOpen: true, projectId: p.id, projectName: p.name })}
                                      className="w-6 h-6 flex items-center justify-center rounded-md bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all transform scale-95 hover:scale-100"
                                      title="從資料庫永久刪除"
                                    >
                                      <i className="fa-solid fa-trash-can text-[10px]"></i>
                                    </button>
                                  </div>
                                </div>

                                {/* Bottom area: metadata comments / feedbacks (compact line) */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-2 border-t border-slate-900/60 items-center">
                                  <div className="md:col-span-6 flex items-center gap-2">
                                    <span className="text-[9px] text-slate-500 font-extrabold uppercase shrink-0">限制備註:</span>
                                    <input 
                                      type="text"
                                      className="w-full bg-[#020617] border border-slate-800 rounded px-2 py-0.5 text-[9px] text-[#94a3b8] focus:ring-1 ring-blue-500 outline-none leading-normal h-6"
                                      placeholder="輸入限制事由/備註..."
                                      defaultValue={p.restrictionMessage || ''}
                                      onBlur={(e) => handleUpdateMessage(p.id, e.target.value)}
                                    />
                                  </div>

                                  <div className="md:col-span-6">
                                    {p.ownerMessage ? (
                                      <div className="flex items-center gap-1.5 bg-blue-500/5 border border-blue-500/10 rounded px-2 py-0.5">
                                        <span className="text-[9px] text-blue-400 font-extrabold uppercase shrink-0 flex items-center gap-1">
                                          <i className="fa-solid fa-comment-dots"></i> 用戶回饋:
                                        </span>
                                        <p className="text-[9px] text-slate-400 leading-none italic truncate">"{p.ownerMessage}"</p>
                                      </div>
                                    ) : (
                                      <div className="text-[9px] text-slate-600 italic pl-1">暫無用戶留言回饋</div>
                                    )}
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
