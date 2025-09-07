const database = require('../config/database');
const { 
  hashPassword, 
  comparePassword, 
  generateAccessToken, 
  generateRefreshToken,
  createTokenPayload,
  verifyRefreshToken 
} = require('../utils/auth');
const { serializeBigInt } = require('../utils/helpers');
const logger = require('../utils/logger');

class AuthService {
  constructor() {
    this.prisma = database.getClient();
  }

  /**
   * Login user
   */
  async login(username, password) {
    try {
      // Find user with related data
      const user = await this.prisma.user.findUnique({
        where: { username, is_active: true },
        include: {
          teacher: {
            select: {
              id: true,
              full_name: true,
              nip: true,
              employment_status: true,
            }
          },
          student: {
            select: {
              id: true,
              full_name: true,
              nis: true,
              current_class: {
                select: {
                  id: true,
                  class_name: true,
                  grade_level: true,
                }
              }
            }
          }
        }
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { last_login: new Date() }
      });

      // Create token payload
      const tokenPayload = createTokenPayload(user);
      
      // Generate tokens
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      logger.info(`User ${username} logged in successfully`);

      return {
        user: serializeBigInt(userWithoutPassword),
        tokens: {
          accessToken,
          refreshToken,
        }
      };
    } catch (error) {
      logger.error(`Login failed for username: ${username}`, error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      
      // Get user
      const user = await this.prisma.user.findUnique({
        where: { 
          id: BigInt(decoded.userId),
          is_active: true 
        },
        select: {
          id: true,
          username: true,
          role: true,
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      const tokenPayload = createTokenPayload(user);
      const newAccessToken = generateAccessToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      logger.error('Token refresh failed', error);
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: BigInt(userId) }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password
      await this.prisma.user.update({
        where: { id: BigInt(userId) },
        data: { password: hashedNewPassword }
      });

      logger.info(`Password changed for user ID: ${userId}`);
      
      return { message: 'Password changed successfully' };
    } catch (error) {
      logger.error(`Password change failed for user ID: ${userId}`, error);
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(userId) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: BigInt(userId) },
        select: {
          id: true,
          username: true,
          role: true,
          is_active: true,
          last_login: true,
          created_at: true,
          teacher: {
            select: {
              id: true,
              full_name: true,
              nip: true,
              nik: true,
              phone_number: true,
              employment_status: true,
            }
          },
          student: {
            select: {
              id: true,
              full_name: true,
              nis: true,
              nisn: true,
              gender: true,
              address: true,
              phone_number: true,
              status: true,
              current_class: {
                select: {
                  id: true,
                  class_name: true,
                  grade_level: true,
                  major: true,
                }
              }
            }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return serializeBigInt(user);
    } catch (error) {
      logger.error(`Get profile failed for user ID: ${userId}`, error);
      throw error;
    }
  }
}

module.exports = new AuthService();
