import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Email {
  id: string;
  userId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  hasAttachments: boolean;
  attachments: Attachment[];
  labels: string[];
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  id: string;
  emailId: string;
  filename: string;
  size: number;
  type: string;
  url: string;
}

export interface EmailLabel {
  id: string;
  userId: string;
  name: string;
  color: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  timestamp: Date;
}

export interface Message {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'system' | 'user';
  isRead: boolean;
  timestamp: Date;
}

export interface NavigationItem {
  id: string;
  name: string;
  icon: string;
  path?: string;
  children?: NavigationItem[];
  isExpanded?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  unreadMessages: number;
  unreadNotifications: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface EmailFilters {
  view?: 'inbox' | 'starred' | 'important' | 'unread' | 'sent' | 'drafts' | 'trash';
  labels?: string[];
  isRead?: boolean;
  isStarred?: boolean;
  isImportant?: boolean;
  hasAttachments?: boolean;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
} 