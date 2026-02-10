import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { TasksPage } from './pages/TasksPage';
import { ProfilePage } from './pages/ProfilePage';
import { TeamDetailPage } from './pages/TeamDetailPage';
import { AnnouncementListPage } from './pages/AnnouncementListPage';
import { AnnouncementDetailPage } from './pages/AnnouncementDetailPage';
import type { AppState } from './types';
import { INITIAL_STATE, AppContext } from './constants';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state] = useState<AppState>(INITIAL_STATE); // just for accessing user in nav
  
  return (
    <div className="min-h-screen bg-[#f0f6fa] flex flex-col font-sans">
      <Navbar currentUser={state.currentUser} />
      <main className="flex-1 p-8 overflow-hidden max-w-[1600px] w-full mx-auto">
          {children}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);

  useEffect(() => {
    console.log("App initialized");
  }, []);

  return (
    <AppContext.Provider value={{ state, setState }}>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            {/* Allow optional projectId param for filtering */}
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/:projectId" element={<TasksPage />} />
            
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/team/:teamId" element={<TeamDetailPage />} />
            <Route path="/announcements" element={<AnnouncementListPage />} />
            <Route path="/announcement/:id" element={<AnnouncementDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;