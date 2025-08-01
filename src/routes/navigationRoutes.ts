import { Router } from 'express';
import { NavigationController } from '../controllers/navigationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const navigationController = new NavigationController();

// All navigation routes require authentication
router.use(authenticateToken);

router.get('/items', navigationController.getNavigationItems.bind(navigationController));
router.get('/upgrade-info', navigationController.getUpgradeInfo.bind(navigationController));

export default router; 