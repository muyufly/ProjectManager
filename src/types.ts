export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: 'Admin' | 'Manager' | 'Member';
  department?: string;
  jobTitle?: string;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeId?: string;
  dueDate: string;
  completedAt?: string;
  dependencies: string[];
  comments: Comment[];
  attachments?: Attachment[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  requirements?: string;
  deadline: string;
  teamId: string;
  managerId: string;
  memberIds: string[];
  status: 'Active' | 'Archived' | 'Pending' | 'Completed';
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'invite' | 'task' | 'mention';
  isRead: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface WorkLog {
  id: string;
  date: string;
  content: string;
  hours: number;
}

export interface AppState {
  currentUser: User;
  teams: Team[];
  projects: Project[];
  tasks: Task[];
  users: User[];
  notifications?: Notification[];
  availableProjects: Project[];
  announcements: Announcement[];
  workLogs: WorkLog[];
}