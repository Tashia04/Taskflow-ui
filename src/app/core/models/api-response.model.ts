import { User } from './user.model';

export interface ApiResponse<T> {
  message?: string;
  data: T;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
  token_type: string;
}
