import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { TasksPage } from './pages/TasksPage';
import { ProfilePage } from './pages/ProfilePage';
import { TeamDetailPage } from './pages/TeamDetailPage';
import { AnnouncementListPage } from './pages/AnnouncementListPage';
import { AnnouncementDetailPage } from './pages/AnnouncementDetailPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ProjectTeamPage } from './pages/ProjectTeamPage';
import { InviteAcceptPage } from './pages/InviteAcceptPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import type { AppState, Project } from './types';
import { INITIAL_STATE, AppContext } from './constants';
import { UserAPI, TeamAPI, ProjectAPI, TaskAPI, NotifyAPI } from './services/api';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = React.useContext(AppContext);

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
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    const token = localStorage.getItem('student_online_token');
    if (token) {
      try {
        const user = await UserAPI.getInfo();
        // Fetch teams
        const teamsRes = await TeamAPI.list(1, 100);
        let teams = teamsRes.items || [];

        const uniqueProjects = new Map<number, Project>();
        let allTasks: any[] = [];
        let allUsers: any[] = [user]; // Initialize with current user

        // Fetch members for each team to sync admin and member lists
        for (let i = 0; i < teams.length; i++) {
          try {
            const members = await TeamAPI.members(teams[i].teamId || teams[i].id);
            if (Array.isArray(members)) {
              // Add unique users to the allUsers list for global display
              members.forEach((m: any) => {
                const mid = Number(m.userId || m.id);
                // Secondary normalization to guarantee display fields
                const normalizedUser = {
                  ...m,
                  userId: mid,
                  id: mid,
                  name: m.name || m.realname || m.username || (m.user && (m.user.name || m.user.username)) || `用户#${mid}`,
                  avatar: m.avatar || m.avatarUrl || `https://ui-avatars.com/api/?name=${m.username || 'U'}&background=random`
                };
                const existingIdx = allUsers.findIndex(u => Number(u.userId || u.id) === mid);
                if (existingIdx > -1) {
                  allUsers[existingIdx] = { ...allUsers[existingIdx], ...normalizedUser };
                } else {
                  allUsers.push(normalizedUser);
                }

                if (user && normalizedUser.username === user.username &&
                  (Number(user.userId || user.id || 0) > 1000000 || !user.userId)) {
                  console.log(`[App] Healing user ID from ${user.userId} to ${mid} based on team membership`);
                  user.userId = mid;
                  user.id = mid;
                  // Also update normalized version in allUsers if it was already pushed
                  const uIdx = allUsers.findIndex(u => u.username === user.username);
                  if (uIdx > -1) {
                    allUsers[uIdx] = { ...allUsers[uIdx], userId: mid, id: mid };
                  }
                }
              });

              const teamCreatorObj = members.find((m: any) => m.teamRole === 'CREATOR');
              const teamOwnerId = Number(teamCreatorObj?.userId || teamCreatorObj?.memberId || teamCreatorObj?.id || teams[i].creatorId || teams[i].ownerId || 0);
              teams[i] = {
                ...teams[i],
                creatorId: teamOwnerId,
                ownerId: teamOwnerId,
                memberIds: members.map((m: any) => Number(m.userId || m.id)),
                adminIds: members
                  .filter((m: any) => ['CREATOR', 'ADMIN', 'MANAGER'].includes(String(m.teamRole).toUpperCase()))
                  .map((m: any) => Number(m.userId || m.id)),
              };
            }
          } catch (e) {
            console.warn('Failed to fetch members for team', teams[i].teamId || teams[i].id);
          }
        }

        // Fetch projects for all teams the user belongs to
        for (const team of teams) {
          try {
            const projRes = await ProjectAPI.list(team.teamId || team.id, 1, 100);
            if (projRes.items) {
              for (const proj of projRes.items) {
                const pId = proj.projectId || proj.id;
                if (!uniqueProjects.has(pId)) {
                  uniqueProjects.set(pId, proj);

                  // Fetch tasks for each project
                  try {
                    const taskRes = await TaskAPI.list(pId);
                    if (taskRes.items) {
                      allTasks = [...allTasks, ...taskRes.items];
                    }
                  } catch (e) { }

                  // Fetch members for each project
                  try {
                    const memberRes = await ProjectAPI.listMember(pId);
                    if (memberRes.items) {
                      const memberIds = memberRes.items.map((m: any) => Number(m.userId || m.id));
                      uniqueProjects.set(pId, {
                        ...proj,
                        memberIds: memberIds
                      });

                      // Also ensure these users exist in allUsers
                      for (const m of memberRes.items) {
                        const mid = Number(m.userId || m.id);
                        if (!allUsers.find(u => Number(u.userId || u.id) === mid)) {
                          allUsers.push({
                            ...m,
                            userId: mid,
                            id: mid,
                            name: m.name || m.realname || m.username || (m.user && (m.user.name || m.user.username)) || `用户#${mid}`,
                            avatar: m.avatar || m.avatarUrl || `https://ui-avatars.com/api/?name=${m.username || 'U'}&background=random`
                          });
                        }
                      }
                    }
                  } catch (e) { }
                }
              }
            }
          } catch (e) {
            console.warn('Failed to fetch projects for team', team.teamId || team.id);
          }
        }

        const projects = Array.from(uniqueProjects.values());

        // Fetch notifications and use as announcements
        let notifications: any[] = [];
        try {
          const notifyRes = await NotifyAPI.list(1, 20);
          notifications = notifyRes.items || [];
        } catch (e) { }

        // Map notifications to announcements
        const announcements = notifications.map(n => ({
          id: n.notificationId || n.id,
          title: n.title,
          content: n.content,
          isRead: n.isRead,
          date: n.createdAt.split('T')[0],
          time: n.createdAt.split('T')[1]?.substring(0, 5) || ''
        }));

        setState(prev => ({
          ...prev,
          currentUser: user,
          teams: teams,
          projects: projects,
          tasks: allTasks,
          users: allUsers,
          notifications: notifications,
          announcements: announcements,
          availableProjects: projects
        }));
      } catch (err) {
        console.error(err);
        localStorage.removeItem('student_online_token');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-[#f0f6fa]">Loading...</div>;
  }

  return (
    <AppContext.Provider value={{ state, setState, refreshData }}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="*" element={
            !state.currentUser ? (
              <Navigate to="/login" replace />
            ) : (
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/tasks/:projectId" element={<TasksPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/profile/:userId" element={<ProfilePage />} />
                  <Route path="/team/:teamId" element={<TeamDetailPage />} />
                  <Route path="/project-team" element={<ProjectTeamPage />} />
                  <Route path="/project/:projectId" element={<ProjectDetailPage />} />
                  <Route path="/accept-invite/:token" element={<InviteAcceptPage />} />
                  <Route path="/announcements" element={<AnnouncementListPage />} />
                  <Route path="/announcement/:id" element={<AnnouncementDetailPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            )
          } />
        </Routes>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;