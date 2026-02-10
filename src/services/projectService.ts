import { TaskStatus } from '../types';
import type { Project, Task } from '../types';

export const getProjectProgress = (tasks: Task[], projectId: string): number => {
  const projectTasks = tasks.filter(t => t.projectId === projectId);
  if (projectTasks.length === 0) return 0;
  
  const completed = projectTasks.filter(t => t.status === TaskStatus.DONE).length;
  return Math.round((completed / projectTasks.length) * 100);
};

export const getTaskCountByStatus = (tasks: Task[], projectId: string) => {
  const projectTasks = tasks.filter(t => t.projectId === projectId);
  return {
    todo: projectTasks.filter(t => t.status === TaskStatus.TODO).length,
    inProgress: projectTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
    review: projectTasks.filter(t => t.status === TaskStatus.REVIEW).length,
    done: projectTasks.filter(t => t.status === TaskStatus.DONE).length,
  };
};