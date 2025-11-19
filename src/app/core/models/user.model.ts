export enum UserRole {
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  VIEWER = 'viewer',
  TRAINEE = 'trainee'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  defaultProvider?: string;
  notifications: {
    email: boolean;
    push: boolean;
    resourceAlerts: boolean;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token?: string;
}
