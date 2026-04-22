import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import { ProjectView } from './components/ProjectView';
import { ProjectManager } from './components/ProjectManager';
import { AdminDashboard } from './components/AdminDashboard';
import { ProjectService } from './services/ProjectService';
import { ToastProvider } from './components/Toast';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      // Initialize profile in background
      if (u) {
        ProjectService.ensureUserProfile(u.uid, u.email).catch(err => {
          console.warn("Background profile init skipped:", err);
        });
      }
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProjectManager user={user} login={login} logout={logout} />} />
          <Route path="/project/:projectId" element={<ProjectView user={user} login={login} logout={logout} />} />
          <Route path="/admin" element={<AdminDashboard user={user} />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
