export type UserRole = 'admin' | 'manager' | 'developer';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}
