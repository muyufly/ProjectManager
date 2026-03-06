import React, { createContext } from 'react';
import type { AppState } from './types';

export const INITIAL_STATE: AppState = {
  currentUser: null,
  users: [],
  projects: [],
  availableProjects: [],
  teams: [],
  tasks: [],
  announcements: [],
  workLogs: [],
  notifications: [],
};

export interface AppContextType {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  refreshData: () => Promise<void>;
}

export const AppContext = createContext<AppContextType>({
  state: INITIAL_STATE,
  setState: () => { },
  refreshData: async () => { },
});
