const database = require('../config/database');
const { hashPassword } = require('../utils/auth');
const { Pagination, serializeBigInt } = require('../utils/helpers');
const logger = require('../utils/logger');

class UserService {
  constructor() {
    this.prisma = database.getClient();
  }

  /**
   * Get all users with pagination and filters
   */
  async getUsers(page = 1, limit = 10, filters = {}) {
    try {
      const pagination = new Pagination(page, limit);
      
      // Build where clause
      const where = {};
      
      if (filters.search) {
        where.username = {
          contains: filters.search,
        };
      }
      
      if (filters.role) {
        where.role = filters.role;
      }
      
      if (filters.is_active !== undefined) {
        where.is_active = filters.is_active;
      }

      // Get total count
      const total = await this.prisma.user.count({ where });
      pagination.total = total;

      // Get users with related data
      const users = await this.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          role: true,
          is_active: true,
          last_login: true,
          created_at: true,
          updated_at: true,
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
              status: true,
              current_class: {
                select: {
                  id: true,
                  class_name: true,
                }
              }
            }
          }
        },
        skip: pagination.getOffset(),
        take: pagination.limit,
        orderBy: { created_at: 'desc' }
      });

      return {
        users: serializeBigInt(users),
        meta: pagination.getMeta()
      };
    } catch (error) {
      logger.error('Get users failed', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: BigInt(id) },
        select: {
          id: true,
          username: true,
          role: true,
          is_active: true,
          last_login: true,
          created_at: true,
          updated_at: true,
          teacher: {
            select: {
              id: true,
              full_name: true,
              nip: true,
              nik: true,
              phone_number: true,
              employment_status: true,
              signature_image_path: true,
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
              rfid_uid: true,
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
      logger.error(`Get user by ID failed: ${id}`, error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  async createUser(userData) {
    try {
      // Check if username already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { username: userData.username }
      });

      if (existingUser) {
        throw new Error('Username already exists');
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          username: userData.username,
          password: hashedPassword,
          role: userData.role,
          is_active: userData.is_active ?? true,
        },
        select: {
          id: true,
          username: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true,
        }
      });

      logger.info(`User created: ${userData.username} with role: ${userData.role}`);
      
      return serializeBigInt(user);
    } catch (error) {
      logger.error('Create user failed', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(id, updateData) {
    try {
      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id: BigInt(id) }
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      // Check username uniqueness if username is being updated
      if (updateData.username && updateData.username !== existingUser.username) {
        const userWithUsername = await this.prisma.user.findUnique({
          where: { username: updateData.username }
        });

        if (userWithUsername) {
          throw new Error('Username already exists');
        }
      }

      // Prepare update data
      const dataToUpdate = {
        ...(updateData.username && { username: updateData.username }),
        ...(updateData.role && { role: updateData.role }),
        ...(updateData.is_active !== undefined && { is_active: updateData.is_active }),
      };

      // Update user
      const user = await this.prisma.user.update({
        where: { id: BigInt(id) },
        data: dataToUpdate,
        select: {
          id: true,
          username: true,
          role: true,
          is_active: true,
          last_login: true,
          created_at: true,
          updated_at: true,
        }
      });

      logger.info(`User updated: ${id}`);
      
      return serializeBigInt(user);
    } catch (error) {
      logger.error(`Update user failed: ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id) {
    try {
      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id: BigInt(id) },
        include: {
          teacher: true,
          student: true,
        }
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      // Check if user has related data that would prevent deletion
      if (existingUser.teacher || existingUser.student) {
        throw new Error('Cannot delete user with associated teacher or student profile');
      }

      // Delete user
      await this.prisma.user.delete({
        where: { id: BigInt(id) }
      });

      logger.info(`User deleted: ${id}`);
      
      return { message: 'User deleted successfully' };
    } catch (error) {
      logger.error(`Delete user failed: ${id}`, error);
      throw error;
    }
  }

  /**
   * Toggle user active status
   */
  async toggleUserStatus(id) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { id: BigInt(id) }
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      const user = await this.prisma.user.update({
        where: { id: BigInt(id) },
        data: { is_active: !existingUser.is_active },
        select: {
          id: true,
          username: true,
          role: true,
          is_active: true,
          updated_at: true,
        }
      });

      logger.info(`User status toggled: ${id} - Active: ${user.is_active}`);
      
      return serializeBigInt(user);
    } catch (error) {
      logger.error(`Toggle user status failed: ${id}`, error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    try {
      const [
        totalUsers,
        activeUsers,
        inactiveUsers,
        adminCount,
        teacherCount,
        studentCount,
        staffCount,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { is_active: true } }),
        this.prisma.user.count({ where: { is_active: false } }),
        this.prisma.user.count({ where: { role: 'admin' } }),
        this.prisma.user.count({ where: { role: 'teacher' } }),
        this.prisma.user.count({ where: { role: 'student' } }),
        this.prisma.user.count({ where: { role: 'staff' } }),
      ]);

      return {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        byRole: {
          admin: adminCount,
          teacher: teacherCount,
          student: studentCount,
          staff: staffCount,
        }
      };
    } catch (error) {
      logger.error('Get user stats failed', error);
      throw error;
    }
  }
}

module.exports = new UserService();
