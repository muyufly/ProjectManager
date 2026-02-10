import React, { createContext } from 'react';
import { TaskPriority, TaskStatus } from './types';
import type { AppState, User, Project, Team, Task, Announcement, WorkLog } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Xiangmu', avatar: 'https://ui-avatars.com/api/?name=Xiangmu&background=random', role: 'Member', department: '视觉设计', jobTitle: '正式成员' },
  { id: 'u2', name: '成员1', avatar: 'https://ui-avatars.com/api/?name=M1&background=random', role: 'Member', department: '开发部', jobTitle: '前端工程师' },
  { id: 'u3', name: '成员2', avatar: 'https://ui-avatars.com/api/?name=M2&background=random', role: 'Member', department: '测试部', jobTitle: '测试工程师' },
  { id: 'u4', name: '成员3', avatar: 'https://ui-avatars.com/api/?name=M3&background=random', role: 'Manager', department: '产品部', jobTitle: '产品经理' },
];

const MY_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: '项目协作管理平台组',
    description: '一个以团队-项目-任务为核心结构的在线协作平台。',
    requirements: '团队需要一个中心化平台来清晰定义项目结构、分配责任、追踪进度。',
    deadline: '2月28日',
    teamId: 't1',
    managerId: 'u4',
    memberIds: ['u1', 'u2', 'u3', 'u4'],
    status: 'Active',
    createdAt: '2026-01-13',
  },
  {
    id: 'p2',
    name: '学生活动整合平台组',
    description: '整合各类学生活动信息的平台。',
    requirements: '移动端友好界面，方便学生快速浏览报名。',
    deadline: '12月15日',
    teamId: 't2',
    managerId: 'u4',
    memberIds: ['u1'],
    status: 'Archived',
    createdAt: '2025-10-15',
  },
];

const AVAILABLE_PROJECTS: Project[] = [
  {
    id: 'ap1',
    name: '校园二手交易平台',
    description: '为学生提供便捷的二手物品交易渠道，减少资源浪费。',
    requirements: '实名认证机制，商品分类浏览，即时聊天功能。',
    deadline: '3月15日',
    teamId: 't3',
    managerId: 'u2',
    memberIds: [],
    status: 'Pending',
    createdAt: '2026-02-01',
  },
  {
    id: 'ap2',
    name: '图书馆座位预约系统',
    description: '解决考研期间图书馆占座问题，提高座位利用率。',
    requirements: '对接门禁系统，实时座位状态显示，违规记录。',
    deadline: '4月10日',
    teamId: 't4',
    managerId: 'u3',
    memberIds: [],
    status: 'Pending',
    createdAt: '2026-02-05',
  },
  {
    id: 'ap3',
    name: '社团活动管理小程序',
    description: '社团招新、活动发布、成员管理的综合平台。',
    requirements: '活动海报生成，报名表单自定义，扫码签到。',
    deadline: '3月20日',
    teamId: 't5',
    managerId: 'u4',
    memberIds: [],
    status: 'Pending',
    createdAt: '2026-01-20',
  }
];

const TEAMS: Team[] = [
  {
    id: 't1',
    name: '项目协作管理平台组',
    ownerId: 'u4',
    memberIds: ['u1', 'u2', 'u3', 'u4'],
  },
  {
    id: 't2',
    name: '学生活动整合平台组',
    ownerId: 'u4',
    memberIds: ['u1'],
  },
  // Placeholder teams for available projects
  { id: 't3', name: '校园二手交易平台组', ownerId: 'u2', memberIds: ['u2'] },
  { id: 't4', name: '图书馆座位预约系统组', ownerId: 'u3', memberIds: ['u3'] },
  { id: 't5', name: '社团活动管理小程序组', ownerId: 'u4', memberIds: ['u4'] },
];

const TASKS: Task[] = [
  {
    id: 'task1',
    title: '完成前端界面设计',
    description: '设计首页、项目列表页、任务详情页的高保真原型。',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    projectId: 'p1',
    assigneeId: 'u1',
    dueDate: '2026-02-15',
    dependencies: [],
    comments: [],
  },
  {
    id: 'task2',
    title: '后端API接口定义',
    description: '根据需求文档定义用户、项目、任务模块的API接口规范。',
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
    projectId: 'p1',
    assigneeId: 'u2',
    dueDate: '2026-01-20',
    completedAt: '2026-01-19',
    dependencies: [],
    comments: [],
  },
  {
    id: 'task3',
    title: '数据库设计',
    description: '设计MySQL数据库表结构，包括ER图。',
    status: TaskStatus.REVIEW,
    priority: TaskPriority.MEDIUM,
    projectId: 'p1',
    assigneeId: 'u3',
    dueDate: '2026-01-25',
    completedAt: '2026-01-24',
    dependencies: ['task2'],
    comments: [],
  },
  {
    id: 'task4',
    title: '用户登录注册功能实现',
    description: '实现基于JWT的用户认证流程。',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    projectId: 'p1',
    assigneeId: 'u2',
    dueDate: '2026-02-10',
    dependencies: ['task2', 'task3'],
    comments: [],
  }
];

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a1',
    title: '项目启动会议通知',
    content: '请大家于本周五下午2点参加项目启动会议，地点：会议室A。会议将讨论项目整体规划和分工。',
    date: '2026-01-14',
  },
  {
    id: 'a2',
    title: '春节放假安排',
    content: '根据学校安排，春节放假时间为...',
    date: '2026-01-25',
  }
];

const WORK_LOGS: WorkLog[] = [
  {
    id: 'w1',
    date: '2026-01-15',
    content: '完成了项目需求分析文档的初稿。',
    hours: 4,
  },
  {
    id: 'w2',
    date: '2026-01-16',
    content: '调研了竞品的功能特点。',
    hours: 3,
  }
];

export const INITIAL_STATE: AppState = {
  currentUser: MOCK_USERS[0],
  users: MOCK_USERS,
  projects: MY_PROJECTS,
  availableProjects: AVAILABLE_PROJECTS,
  teams: TEAMS,
  tasks: TASKS,
  announcements: ANNOUNCEMENTS,
  workLogs: WORK_LOGS,
  notifications: [],
};

export interface AppContextType {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export const AppContext = createContext<AppContextType>({
  state: INITIAL_STATE,
  setState: () => {},
});
