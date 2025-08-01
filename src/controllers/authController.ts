import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { LoginRequest, RegisterRequest, ApiResponse, AuthenticatedRequest } from '../types';

const userService = new UserService();

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const userData: RegisterRequest = req.body;
      const user = await userService.register(userData);
      
      const response: ApiResponse<typeof user> = {
        success: true,
        data: user,
        message: 'User registered successfully'
      };
      
      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
      
      res.status(400).json(response);
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const credentials: LoginRequest = req.body;
      const result = await userService.login(credentials);
      
      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
        message: 'Login successful'
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
      
      res.status(401).json(response);
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success response
    const response: ApiResponse<null> = {
      success: true,
      message: 'Logout successful'
    };
    
    res.status(200).json(response);
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user?.userId;
      if (!userId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'User not authenticated'
        };
        res.status(401).json(response);
        return;
      }

      const profile = await userService.getUserProfile(userId);
      if (!profile) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'User not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<typeof profile> = {
        success: true,
        data: profile
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get profile'
      };
      
      res.status(500).json(response);
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user?.userId;
      if (!userId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'User not authenticated'
        };
        res.status(401).json(response);
        return;
      }

      const updates = req.body;
      const user = await userService.updateUser(userId, updates);
      
      if (!user) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'User not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<typeof user> = {
        success: true,
        data: user,
        message: 'Profile updated successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile'
      };
      
      res.status(500).json(response);
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user?.userId;
      if (!userId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'User not authenticated'
        };
        res.status(401).json(response);
        return;
      }

      const { currentPassword, newPassword } = req.body;
      const success = await userService.changePassword(userId, currentPassword, newPassword);
      
      if (!success) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Current password is incorrect'
        };
        res.status(400).json(response);
        return;
      }

      const response: ApiResponse<null> = {
        success: true,
        message: 'Password changed successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to change password'
      };
      
      res.status(500).json(response);
    }
  }
} 