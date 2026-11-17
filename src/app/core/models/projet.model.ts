import { User } from './user.model';

export type ProjectStatus = 'a_faire' | 'en_cours' | 'termine';

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: ProjectStatus;
  owner_id?: number;
  owner?: User;
  users?: User[];
  tasks_count?: number;
  created_at?: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  status?: ProjectStatus;
  user_ids?: number[];
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  user_ids?: number[];
}
