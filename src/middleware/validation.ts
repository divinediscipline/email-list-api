import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
    return;
  }
  next();
};

export const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

export const validateRegister = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  handleValidationErrors
];

export const validateEmailFilters = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('folder').optional().isIn(['inbox', 'starred', 'sent', 'important', 'drafts', 'trash']).withMessage('Invalid folder'),
  query('isRead').optional().isBoolean().withMessage('isRead must be a boolean'),
  query('isStarred').optional().isBoolean().withMessage('isStarred must be a boolean'),
  query('isImportant').optional().isBoolean().withMessage('isImportant must be a boolean'),
  query('hasAttachments').optional().isBoolean().withMessage('hasAttachments must be a boolean'),
  query('search').optional().isString().withMessage('Search must be a string'),
  handleValidationErrors
];

export const validateEmailId = [
  param('id').isUUID().withMessage('Invalid email ID'),
  handleValidationErrors
];

export const validateUserId = [
  param('id').isUUID().withMessage('Invalid user ID'),
  handleValidationErrors
]; 