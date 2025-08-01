import { Request, Response } from 'express';
import { NavigationService } from '../services/navigationService';
import { ApiResponse } from '../types';

const navigationService = new NavigationService();

export class NavigationController {
  async getNavigationItems(req: Request, res: Response): Promise<void> {
    try {
      const navigationItems = await navigationService.getNavigationItems();
      
      const response: ApiResponse<typeof navigationItems> = {
        success: true,
        data: navigationItems
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get navigation items'
      };
      
      res.status(500).json(response);
    }
  }

  async getUpgradeInfo(req: Request, res: Response): Promise<void> {
    try {
      const upgradeInfo = await navigationService.getUpgradeInfo();
      
      const response: ApiResponse<typeof upgradeInfo> = {
        success: true,
        data: upgradeInfo
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get upgrade info'
      };
      
      res.status(500).json(response);
    }
  }
} 