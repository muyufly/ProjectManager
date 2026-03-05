import { TaskStatus, TaskPriority } from '../types';
import type { Task, Project, Team, User, Notification, Comment } from '../types';

const API_BASE_URL = '/api';

/**
 * Generic request handler that manages headers and error handling
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('student_online_token');

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
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = {};
    }
    throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  console.log("API Result from", endpoint, ":", result);

  // Some APIs use 'code' for status. We'll only throw if it's explicitly an error code 
  // AND there's no data returned (since your mock API seems to return data with code 96).
  if (result.code !== undefined && result.code !== 200 && result.code !== 0 && result.data === undefined) {
    throw new Error(result.message || 'API response error');
  }

  // If the data object exists and contains our expected fields, return it.
  if (result.data !== undefined) {
    return result.data;
  }

  // Alternatively, the root itself might be the expected object
  return result;
}

/**
 * Auth API
 */
export const AuthAPI = {
  login: (data: { identifier: string; password: string }) =>
    request<{ token: string; userId: number; username: string; avatarUrl: string }>('/login', { method: 'POST', body: JSON.stringify(data) }),

  register: (data: { username: string; email: string; password: string; avatarUrl?: string }) =>
    request<{ token: string; userId: number; username: string; avatarUrl: string }>('/register', { method: 'POST', body: JSON.stringify(data) }),

  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    request<void>('/changePassword', { method: 'POST', body: JSON.stringify(data) }),

  sduLogin: () => request<void>('/auth/sduLogin'),

  authCallback: (token: string) => request<string>(`/auth/callback?token=${encodeURIComponent(token)}`),
};

/**
 * User API
 */
export const UserAPI = {
  getInfo: () => request<any>('/user/info'),

  editInfo: (data: Partial<any>) =>
    request<any>('/user/info', { method: 'POST', body: JSON.stringify(data) }),

  getInfoById: (id: string) => request<any>(`/user/info?userId=${id}`),
  search: (keyword: string, page: number = 1, size: number = 10) =>
    request<any>(`/user/search?keyword=${keyword}&page=${page}&size=${size}`),
  changePassword: (data: any) => request<any>('/changePassword', { method: 'POST', body: JSON.stringify(data) }),
};

/**
 * Team API
 */
export const TeamAPI = {
  list: (page: number = 1, size: number = 10) =>
    request<any>(`/team/list?page=${page}&size=${size}`),

  create: (data: { name: string; description?: string }) =>
    request<number>('/team/create', { method: 'POST', body: JSON.stringify(data) }),

  invite: (data: { teamId: number; userId: number; expiration?: number }) =>
    request<string>('/team/invite', { method: 'POST', body: JSON.stringify(data) }),

  acceptInvite: (token: string) =>
    request<string>(`/team/acceptInvite?token=${encodeURIComponent(token)}`),

  removeMember: (data: { teamId: number; memberId: number }) =>
    request<string>('/team/removeMember', { method: 'POST', body: JSON.stringify(data) }),

  addAdmin: (data: { teamId: number; adminId: number }) =>
    request<string>('/team/addAdmin', { method: 'POST', body: JSON.stringify(data) }),

  removeAdmin: (data: { teamId: number; adminId: number }) =>
    request<string>('/team/removeAdmin', { method: 'POST', body: JSON.stringify(data) }),

  disband: (data: { teamId: number }) =>
    request<string>('/team/disband', { method: 'POST', body: JSON.stringify(data) }),

  quit: (data: { teamId: number }) =>
    request<string>('/team/quit', { method: 'POST', body: JSON.stringify(data) }),
};

/**
 * Project API
 */
export const ProjectAPI = {
  create: (data: { name: string; teamId: number; description?: string }) =>
    request<number>('/project/create', { method: 'POST', body: JSON.stringify(data) }),

  edit: (data: { projectId: number; name?: string; description?: string }) =>
    request<string>('/project/edit', { method: 'POST', body: JSON.stringify(data) }),

  list: (teamId: number, page: number = 1, size: number = 10) =>
    request<any>(`/project/list?teamId=${teamId}&page=${page}&size=${size}`),

  listMember: (projectId: number, page: number = 1, size: number = 10) =>
    request<any>(`/project/listMember?projectId=${projectId}&page=${page}&size=${size}`),

  invite: (data: { projectId: number; userId: number; expiration?: number }) =>
    request<string>('/project/invite', { method: 'POST', body: JSON.stringify(data) }),

  removeMember: (data: { projectId: number; memberId: number }) =>
    request<string>('/project/removeMember', { method: 'POST', body: JSON.stringify(data) }),

  createGroup: (data: { projectId: number; code: string; name: string; permissions: string[] }) =>
    request<number>('/project/createGroup', { method: 'POST', body: JSON.stringify(data) }),

  editGroup: (data: { groupId: number; name?: string; permissions?: string[] }) =>
    request<string>('/project/editGroup', { method: 'POST', body: JSON.stringify(data) }),

  deleteGroup: (data: { groupId: number }) =>
    request<string>('/project/deleteGroup', { method: 'POST', body: JSON.stringify(data) }),

  listGroup: (projectId: number, page: number = 1, size: number = 10) =>
    request<any>(`/project/listGroup?projectId=${projectId}&page=${page}&size=${size}`),

  listGroupMember: (groupId: number, page: number = 1, size: number = 10) =>
    request<any>(`/project/listGroupMember?groupId=${groupId}&page=${page}&size=${size}`),

  addGroupMember: (data: { groupId: number; memberId: number }) =>
    request<string>('/project/addGroupMember', { method: 'POST', body: JSON.stringify(data) }),

  removeGroupMember: (data: { groupId: number; memberId: number }) =>
    request<string>('/project/removeGroupMember', { method: 'POST', body: JSON.stringify(data) }),

  editRole: (data: { projectId: number; memberId: number; newRole: number }) =>
    request<string>('/project/editRole', { method: 'POST', body: JSON.stringify(data) }),
};

/**
 * Task API
 */
export const TaskAPI = {
  create: (data: { projectId: number; title: string; description?: string; parentId?: number; priority?: TaskPriority; dueDate?: string }) =>
    request<number>('/task/create', { method: 'POST', body: JSON.stringify(data) }),

  list: (projectId: number, page: number = 1, size: number = 50) =>
    request<any>(`/task/list?projectId=${projectId}&page=${page}&size=${size}`),

  edit: (data: { taskId: number; title?: string; description?: string; priority?: TaskPriority; dueDate?: string }) =>
    request<string>('/task/edit', { method: 'POST', body: JSON.stringify(data) }),

  assign: (data: { taskId: number; assigneeId: number }) =>
    request<string>('/task/assign', { method: 'POST', body: JSON.stringify(data) }),

  claim: (data: { taskId: number }) =>
    request<string>('/task/claim', { method: 'POST', body: JSON.stringify(data) }),

  changeStatus: (data: { taskId: number; status: TaskStatus }) =>
    request<string>('/task/changeStatus', { method: 'POST', body: JSON.stringify(data) }),

  info: (taskId: number) =>
    request<any>(`/task/info?taskId=${taskId}`),

  addAttachments: (data: { taskId: number; attachments: string[] }) =>
    request<string>('/task/addAttachments', { method: 'POST', body: JSON.stringify(data) }),

  editAttachments: (data: { attachId: number; taskId: number; fileUrl: string; fileName: string }) =>
    request<string>('/task/editAttachments', { method: 'POST', body: JSON.stringify(data) }),

  addDependency: (data: { taskId: number; processTaskId: number; type: number }) =>
    request<string>('/task/addDependency', { method: 'POST', body: JSON.stringify(data) }),

  removeDependency: (data: { dependencyId: number }) =>
    request<string>('/task/removeDependency', { method: 'POST', body: JSON.stringify(data) }),

  getDependencies: (taskId: number) =>
    request<any>(`/task/dependencies?taskId=${taskId}`),
};

/**
 * Comment API
 */
export const CommentAPI = {
  create: (data: { taskId: number; content: string }) =>
    request<number>('/comment/create', { method: 'POST', body: JSON.stringify(data) }),

  edit: (data: { commentId: number; content: string }) =>
    request<string>('/comment/edit', { method: 'POST', body: JSON.stringify(data) }),

  delete: (data: { commentId: number }) =>
    request<string>('/comment/delete', { method: 'POST', body: JSON.stringify(data) }),

  list: (taskId: number, page: number = 1, size: number = 10) =>
    request<any>(`/comment/list?taskId=${taskId}&page=${page}&size=${size}`),
};

/**
 * Upload API
 */
export const UploadAPI = {
  getPresignUpload: (data: { fileName: string; size: number; fileType: string; storageType: number; dir?: string }) =>
    request<any>(`/presign/presign-upload`, { method: 'POST', body: JSON.stringify(data) }),
};

/**
 * Notify API
 */
export const NotifyAPI = {
  list: (page: number = 1, size: number = 10) =>
    request<any>(`/notify/list?page=${page}&size=${size}`),

  read: (data: { messageIds: number[] }) =>
    request<string>('/notify/read', { method: 'POST', body: JSON.stringify(data) }),
};