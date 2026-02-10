import { TaskStatus, TaskPriority } from '../types';
import type { Task, Project, Team, User, Notification } from '../types';

const API_BASE_URL = '/api';

/**
 * Generic request handler that manages headers and error handling
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('nexus_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  // Handle FormData separately (browser automatically sets Content-Type with boundary)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Auth API
 * /login, /register, /changePassword
 */
export const AuthAPI = {
  login: (data: { username: string; password: string }) => 
    request<{ token: string; user: User }>('/login', { method: 'POST', body: JSON.stringify(data) }),
    
  register: (data: any) => 
    request<{ token: string; user: User }>('/register', { method: 'POST', body: JSON.stringify(data) }),
    
  changePassword: (data: { oldPass: string; newPass: string }) => 
    request<void>('/changePassword', { method: 'POST', body: JSON.stringify(data) }),
};

/**
 * User API
 * /user/getInfo, /user/editInfo, /user/search, /user/calender
 */
export const UserAPI = {
  getInfo: () => request<User>('/user/getInfo'),
  
  editInfo: (data: Partial<User>) => 
    request<User>('/user/editInfo', { method: 'PUT', body: JSON.stringify(data) }),
    
  search: (keyword: string) => 
    request<User[]>(`/user/search?keyword=${encodeURIComponent(keyword)}`),
    
  // Using 'calender' as specified in requirements (typo preservation)
  getCalendar: () => request<any>('/user/calender'), 
};

/**
 * Team API
 * /team/*
 */
export const TeamAPI = {
  list: () => request<Team[]>('/team/list'),
  
  create: (data: { name: string; description?: string }) => 
    request<Team>('/team/create', { method: 'POST', body: JSON.stringify(data) }),
    
  invite: (data: { teamId: string; email: string }) => 
    request<void>('/team/invite', { method: 'POST', body: JSON.stringify(data) }),
    
  acceptInvite: (data: { token: string; inviteId: string }) => 
    request<void>('/team/acceptInvite', { method: 'POST', body: JSON.stringify(data) }),
    
  removeMember: (data: { teamId: string; userId: string }) => 
    request<void>('/team/removeMember', { method: 'POST', body: JSON.stringify(data) }),
    
  addAdmin: (data: { teamId: string; userId: string }) => 
    request<void>('/team/addAdmin', { method: 'POST', body: JSON.stringify(data) }),
    
  removeAdmin: (data: { teamId: string; userId: string }) => 
    request<void>('/team/removeAdmin', { method: 'POST', body: JSON.stringify(data) }),
    
  disband: (teamId: string) => 
    request<void>('/team/disband', { method: 'POST', body: JSON.stringify({ teamId }) }),
    
  quit: (teamId: string) => 
    request<void>('/team/quit', { method: 'POST', body: JSON.stringify({ teamId }) }),
};

/**
 * Project API
 * /project/*
 */
export const ProjectAPI = {
  create: (data: { name: string; teamId: string; description?: string }) => 
    request<Project>('/project/create', { method: 'POST', body: JSON.stringify(data) }),
    
  edit: (projectId: string, data: Partial<Project>) => 
    request<Project>('/project/edit', { method: 'PUT', body: JSON.stringify({ projectId, ...data }) }),
    
  list: () => request<Project[]>('/project/list'),
  
  invite: (data: { projectId: string; userIds: string[] }) => 
    request<void>('/project/invite', { method: 'POST', body: JSON.stringify(data) }),
    
  listGroup: (projectId: string) => 
    request<any[]>(`/project/listGroup?projectId=${projectId}`),
    
  removeMember: (data: { projectId: string; userId: string }) => 
    request<void>('/project/removeMember', { method: 'POST', body: JSON.stringify(data) }),
    
  createGroup: (data: { projectId: string; name: string }) => 
    request<any>('/project/createGroup', { method: 'POST', body: JSON.stringify(data) }),
    
  editRole: (data: { projectId: string; userId: string; role: string }) => 
    request<void>('/project/editRole', { method: 'PUT', body: JSON.stringify(data) }),
    
  editGroup: (data: { groupId: string; name: string }) => 
    request<void>('/project/editGroup', { method: 'PUT', body: JSON.stringify(data) }),
    
  // Using 'calender' as specified in requirements
  getCalendar: (projectId: string) => 
    request<any>(`/project/calender?projectId=${projectId}`), 
};

/**
 * Task API
 * /task/*
 */
export const TaskAPI = {
  create: (data: Partial<Task>) => 
    request<Task>('/task/create', { method: 'POST', body: JSON.stringify(data) }),
    
  list: (projectId: string) => 
    request<Task[]>(`/task/list?projectId=${projectId}`),
    
  edit: (taskId: string, data: Partial<Task>) => 
    request<Task>('/task/edit', { method: 'PUT', body: JSON.stringify({ taskId, ...data }) }),
    
  assign: (data: { taskId: string; userId: string }) => 
    request<void>('/task/assign', { method: 'POST', body: JSON.stringify(data) }),
    
  claim: (taskId: string) => 
    request<void>('/task/claim', { method: 'POST', body: JSON.stringify({ taskId }) }),
    
  changeStatus: (taskId: string, status: TaskStatus) => 
    request<void>('/task/changeStatus', { method: 'PUT', body: JSON.stringify({ taskId, status }) }),
    
  comment: (taskId: string, content: string, mentionedUserIds: string[] = []) => 
    request<void>('/task/comment', { method: 'POST', body: JSON.stringify({ taskId, content, mentionedUserIds }) }),
    
  info: (taskId: string) => 
    request<Task>(`/task/info?taskId=${taskId}`),
    
  addAttachments: (taskId: string, attachments: any[]) => 
    request<void>('/task/addAttachments', { method: 'POST', body: JSON.stringify({ taskId, attachments }) }),
    
  editAttachments: (taskId: string, attachments: any[]) => 
    request<void>('/task/editAttachments', { method: 'PUT', body: JSON.stringify({ taskId, attachments }) }),
};

/**
 * Upload API
 * /getUploadLink, /upload
 */
export const UploadAPI = {
  getUploadLink: (fileName: string) => 
    request<{ uploadUrl: string; fileKey: string }>(`/getUploadLink?fileName=${encodeURIComponent(fileName)}`),
    
  upload: (formData: FormData) => 
    request<{ url: string }>('/upload', { method: 'POST', body: formData }),
};

/**
 * Notify API
 * /notify/list, /notify/read
 */
export const NotifyAPI = {
  list: () => request<Notification[]>('/notify/list'),
  
  read: (ids: string[]) => 
    request<void>('/notify/read', { method: 'POST', body: JSON.stringify({ ids }) }),
};