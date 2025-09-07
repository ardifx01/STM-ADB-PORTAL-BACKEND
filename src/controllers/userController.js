const userService = require('../services/userService');
const { ApiResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middlewares/errorHandler');

class UserController {
  /**
   * @desc    Get all users
   * @route   GET /api/users
   * @access  Private (Admin only)
   */
  getUsers = asyncHandler(async (req, res) => {
    const { page, limit, search, role, is_active } = req.query;
    
    const filters = {
      ...(search && { search }),
      ...(role && { role }),
      ...(is_active !== undefined && { is_active: is_active === 'true' }),
    };

    const result = await userService.getUsers(page, limit, filters);

    res.status(200).json(
      ApiResponse.success(
        'Users retrieved successfully',
        result.users,
        result.meta
      )
    );
  });

  /**
   * @desc    Get user by ID
   * @route   GET /api/users/:id
   * @access  Private (Admin only)
   */
  getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await userService.getUserById(id);

    res.status(200).json(
      ApiResponse.success('User retrieved successfully', user)
    );
  });

  /**
   * @desc    Create new user
   * @route   POST /api/users
   * @access  Private (Admin only)
   */
  createUser = asyncHandler(async (req, res) => {
    const userData = req.body;

    const user = await userService.createUser(userData);

    res.status(201).json(
      ApiResponse.success('User created successfully', user)
    );
  });

  /**
   * @desc    Update user
   * @route   PUT /api/users/:id
   * @access  Private (Admin only)
   */
  updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const user = await userService.updateUser(id, updateData);

    res.status(200).json(
      ApiResponse.success('User updated successfully', user)
    );
  });

  /**
   * @desc    Delete user
   * @route   DELETE /api/users/:id
   * @access  Private (Admin only)
   */
  deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await userService.deleteUser(id);

    res.status(200).json(
      ApiResponse.success('User deleted successfully', result)
    );
  });

  /**
   * @desc    Toggle user active status
   * @route   PATCH /api/users/:id/toggle-status
   * @access  Private (Admin only)
   */
  toggleUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await userService.toggleUserStatus(id);

    res.status(200).json(
      ApiResponse.success(
        `User ${user.is_active ? 'activated' : 'deactivated'} successfully`,
        user
      )
    );
  });

  /**
   * @desc    Get user statistics
   * @route   GET /api/users/stats
   * @access  Private (Admin only)
   */
  getUserStats = asyncHandler(async (req, res) => {
    const stats = await userService.getUserStats();

    res.status(200).json(
      ApiResponse.success('User statistics retrieved successfully', stats)
    );
  });
}

module.exports = new UserController();
