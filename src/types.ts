export enum TaskStatus {
  NOT_STARTED = 'NOT_STARTED',
  OPEN_FOR_CLAIM = 'OPEN_FOR_CLAIM',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface User {
  id: number;
  userId?: number;
  username: string;
  email?: string;
  department?: string;
  role: string;
  sduId?: string;
  realname?: string;
  avatarUrl?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  teamRole?: string; // Role specific to a team context (e.g., CREATOR, MEMBER)
  memberId?: number; // Unique ID for team membership, used for management API calls
  // Legacy fields for UI compatibility
  name: string;
  avatar: string;
  jobTitle?: string;
}

export interface Comment {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
}

export interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface Task {
  id: number;
  taskId?: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: number;
  assigneeId?: number;
  dueDate: string;
  completedAt?: string;
  dependencies: number[];
  comments: Comment[];
  attachments?: Attachment[];
}

export interface Project {
  id: number;
  projectId?: number;
  name: string;
  description: string;
  requirements?: string;
  deadline: string;
  teamId: number;
  managerId?: number;
  memberIds: number[];
  status: 'Active' | 'Archived' | 'Pending' | 'Completed' | string;
  creatorId?: number;
  createdAt: string;
}

export interface Team {
  id: number;
  teamId?: number;
  name: string;
  ownerId: number;
  creatorId?: number;
  memberIds: number[];
  adminIds?: number[];
  description?: string;
}

export interface Notification {
  id: number;
  title: string;
  content: string;
  type: 'system' | 'invite' | 'task' | 'mention' | string;
  isRead: boolean;
  createdAt: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
  time?: string;
  isRead?: boolean;
}

export interface WorkLog {
  id: number;
  date: string;
  content: string;
  hours: number;
}

export interface AppState {
  currentUser: User | null;
  teams: Team[];
  projects: Project[];
  tasks: Task[];
  users: User[];
  notifications?: Notification[];
  availableProjects: Project[];
  announcements: Announcement[];
  workLogs: WorkLog[];
}