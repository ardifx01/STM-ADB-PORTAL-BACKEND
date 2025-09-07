const authService = require('../services/authService');
const { ApiResponse } = require('../utils/helpers');
const { asyncHandler } = require('../middlewares/errorHandler');

class AuthController {
  /**
   * @desc    Login user
   * @route   POST /api/auth/login
   * @access  Public
   */
  login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const result = await authService.login(username, password);

    res.status(200).json(
      ApiResponse.success('Login successful', result)
    );
  });

  /**
   * @desc    Refresh access token
   * @route   POST /api/auth/refresh
   * @access  Public
   */
  refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshToken(refreshToken);

    res.status(200).json(
      ApiResponse.success('Token refreshed successfully', tokens)
    );
  });

  /**
   * @desc    Change password
   * @route   PUT /api/auth/change-password
   * @access  Private
   */
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const result = await authService.changePassword(userId, currentPassword, newPassword);

    res.status(200).json(
      ApiResponse.success('Password changed successfully', result)
    );
  });

  /**
   * @desc    Get current user profile
   * @route   GET /api/auth/profile
   * @access  Private
   */
  getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const profile = await authService.getProfile(userId);

    res.status(200).json(
      ApiResponse.success('Profile retrieved successfully', profile)
    );
  });

  /**
   * @desc    Logout user (client-side only)
   * @route   POST /api/auth/logout
   * @access  Private
   */
  logout = asyncHandler(async (req, res) => {
    // Since we're using stateless JWT, logout is handled on client-side
    // by removing the tokens from storage
    res.status(200).json(
      ApiResponse.success('Logout successful')
    );
  });
}

module.exports = new AuthController();
