import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, LoginRequest, LoginResponse, RegisterRequest, UserProfile, JwtPayload } from '../types';
import databaseService from './databaseService';

export class UserService {
  async register(userData: RegisterRequest): Promise<Omit<User, 'password'>> {
    try {
      const existingUser = await databaseService.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('User already exists');
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const newUser = await databaseService.createUser({
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role || 'user',
        avatar: undefined
      });

      const { password, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const user = await databaseService.getUserByEmail(credentials.email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isValidPassword = await bcrypt.compare(credentials.password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
      const payload = { userId: user.id, email: user.email, role: user.role };
      const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });

      const { password, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      console.error('Error logging in user:', error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<Omit<User, 'password'> | null> {
    try {
      const user = await databaseService.getUserById(id);
      if (!user) return null;

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error getting user by id:', error);
      throw error;
    }
  }

  async getUserProfile(id: string): Promise<UserProfile | null> {
    try {
      const user = await databaseService.getUserById(id);
      if (!user) return null;

      // Get unread counts from database
      const notifications = await databaseService.getNotifications(id);
      const messages = await databaseService.getMessages(id);
      
      const unreadNotifications = notifications.filter(n => !n.isRead).length;
      const unreadMessages = messages.filter(m => !m.isRead).length;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        unreadMessages,
        unreadNotifications
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'password'>>): Promise<Omit<User, 'password'> | null> {
    try {
      const updatedUser = await databaseService.updateUser(id, updates);
      if (!updatedUser) return null;

      const { password, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = await databaseService.getUserById(id);
      if (!user) return false;

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) return false;

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await databaseService.updateUser(id, { password: hashedNewPassword });

      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  verifyToken(token: string): JwtPayload {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    return jwt.verify(token, jwtSecret) as JwtPayload;
  }
} 