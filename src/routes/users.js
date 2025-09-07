const express = require('express');
const Joi = require('joi');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation');
const { userSchemas, commonValidations } = require('../validators');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Apply admin authorization to all routes (only admins can manage users)
router.use(authorize('admin'));

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin only)
 */
router.get('/stats', userController.getUserStats);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filters
 * @access  Private (Admin only)
 */
router.get('/', validateQuery(userSchemas.list), userController.getUsers);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin only)
 */
router.post('/', validateBody(userSchemas.create), userController.createUser);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get('/:id', validateParams(Joi.object({ id: commonValidations.id })), userController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  validateParams(Joi.object({ id: commonValidations.id })),
  validateBody(userSchemas.update),
  userController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Admin only)
 */
router.delete('/:id', validateParams(Joi.object({ id: commonValidations.id })), userController.deleteUser);

/**
 * @route   PATCH /api/users/:id/toggle-status
 * @desc    Toggle user active status
 * @access  Private (Admin only)
 */
router.patch(
  '/:id/toggle-status',
  validateParams(Joi.object({ id: commonValidations.id })),
  userController.toggleUserStatus
);

module.exports = router;
