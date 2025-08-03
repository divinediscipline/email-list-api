import { Router } from 'express';
import { EmailController } from '../controllers/emailController';
import { validateEmailFilters, validateEmailId } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const emailController = new EmailController();

// All email routes require authentication
router.use(authenticateToken);

// Email CRUD operations
router.get('/', validateEmailFilters, emailController.getEmails.bind(emailController));
router.get('/counts', emailController.getEmailCounts.bind(emailController));

// Email labels - these must come before /:id routes to avoid conflicts
router.get('/labels', emailController.getEmailLabels.bind(emailController));
router.post('/labels', emailController.createEmailLabel.bind(emailController));
router.delete('/labels/:id', emailController.deleteEmailLabel.bind(emailController));

// Email by ID - this must come after specific routes
router.get('/:id', validateEmailId, emailController.getEmailById.bind(emailController));
router.delete('/:id', validateEmailId, emailController.deleteEmail.bind(emailController));

// Email actions
router.patch('/:id/read', validateEmailId, emailController.markAsRead.bind(emailController));
router.patch('/:id/star', validateEmailId, emailController.toggleStar.bind(emailController));
router.patch('/:id/important', validateEmailId, emailController.toggleImportant.bind(emailController));
router.patch('/:id/move', validateEmailId, emailController.moveToFolder.bind(emailController));
router.patch('/:id/labels/add', validateEmailId, emailController.addLabel.bind(emailController));
router.patch('/:id/labels/remove', validateEmailId, emailController.removeLabel.bind(emailController));

export default router; 