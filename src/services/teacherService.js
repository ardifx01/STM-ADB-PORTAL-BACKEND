const { PrismaClient } = require('@prisma/client');
const { serializeBigInt, Pagination } = require('../utils/helpers');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class TeacherService {
  /**
   * Serialize teacher data to handle BigInt properly
   */
  serializeTeacher(teacher) {
    return {
      ...teacher,
      id: teacher.id.toString(),
      user_id: teacher.user_id?.toString() || null,
      user: teacher.user ? {
        ...teacher.user,
        id: teacher.user.id.toString()
      } : null,
      homeroom_classes: teacher.homeroom_classes ? teacher.homeroom_classes.map(cls => ({
        ...cls,
        id: cls.id.toString(),
        homeroom_teacher_id: cls.homeroom_teacher_id?.toString() || null,
        counselor_id: cls.counselor_id?.toString() || null
      })) : [],
      counselor_classes: teacher.counselor_classes ? teacher.counselor_classes.map(cls => ({
        ...cls,
        id: cls.id.toString(),
        homeroom_teacher_id: cls.homeroom_teacher_id?.toString() || null,
        counselor_id: cls.counselor_id?.toString() || null
      })) : [],
      schedules: teacher.schedules ? teacher.schedules.map(schedule => ({
        ...schedule,
        id: schedule.id.toString(),
        class_id: schedule.class_id?.toString() || null,
        subject_id: schedule.subject_id?.toString() || null,
        teacher_id: schedule.teacher_id?.toString() || null
      })) : []
    };
  }

  /**
   * Get all teachers with pagination and filtering
   */
  async getAllTeachers(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        employment_status = '',
        sort_by = 'full_name',
        sort_order = 'asc'
      } = options;

      const pagination = new Pagination(page, limit);
      const offset = (pagination.page - 1) * pagination.limit;

      // Build where clause
      const whereClause = {};
      
      if (search) {
        whereClause.OR = [
          { full_name: { contains: search } },
          { nip: { contains: search } },
          { nik: { contains: search } },
          { phone_number: { contains: search } },
          { user: { username: { contains: search } } }
        ];
      }

      if (employment_status) {
        whereClause.employment_status = employment_status;
      }

      // Get total count
      const total = await prisma.teacher.count({ where: whereClause });

      // Build order by clause
      const orderBy = {};
      if (sort_by === 'username') {
        orderBy.user = { username: sort_order };
      } else {
        orderBy[sort_by] = sort_order;
      }

      // Get teachers with pagination
      const teachers = await prisma.teacher.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
              is_active: true
            }
          },
          homeroom_classes: {
            select: {
              id: true,
              class_name: true,
              grade_level: true,
              major: true
            }
          },
          counselor_classes: {
            select: {
              id: true,
              class_name: true,
              grade_level: true,
              major: true
            }
          }
        },
        orderBy,
        skip: offset,
        take: pagination.limit
      });

      const serializedTeachers = teachers.map(teacher => this.serializeTeacher(teacher));

      pagination.total = total;
      pagination.pages = Math.ceil(total / pagination.limit);

      return {
        teachers: serializedTeachers,
        pagination: pagination.getMeta().pagination
      };
    } catch (error) {
      logger.error('Error getting teachers:', error);
      throw error;
    }
  }

  /**
   * Get teacher by ID
   */
  async getTeacherById(id) {
    try {
      const teacher = await prisma.teacher.findUnique({
        where: { id: BigInt(id) },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
              is_active: true,
              created_at: true,
              updated_at: true
            }
          },
          homeroom_classes: {
            select: {
              id: true,
              class_name: true,
              grade_level: true,
              major: true
            }
          },
          counselor_classes: {
            select: {
              id: true,
              class_name: true,
              grade_level: true,
              major: true
            }
          },
          schedules: {
            include: {
              class: {
                select: {
                  id: true,
                  class_name: true,
                  grade_level: true,
                  major: true
                }
              },
              subject: {
                select: {
                  id: true,
                  subject_code: true,
                  subject_name: true
                }
              }
            }
          }
        }
      });

      if (!teacher) {
        throw new Error('Teacher not found');
      }

      return this.serializeTeacher(teacher);
    } catch (error) {
      logger.error('Error getting teacher by ID:', error);
      throw error;
    }
  }

  /**
   * Create new teacher
   */
  async createTeacher(teacherData) {
    try {
      const {
        user_id,
        nip,
        nik,
        full_name,
        phone_number,
        employment_status,
        signature_image_path
      } = teacherData;

      // Check if user exists and is not already a teacher
      const existingUser = await prisma.user.findUnique({
        where: { id: BigInt(user_id) },
        include: { teacher: true }
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      if (existingUser.teacher) {
        throw new Error('User already has a teacher profile');
      }

      // Check for duplicate NIP or NIK
      const existingTeacher = await prisma.teacher.findFirst({
        where: {
          OR: [
            { nip: nip },
            { nik: nik }
          ]
        }
      });

      if (existingTeacher) {
        if (existingTeacher.nip === nip) {
          throw new Error('NIP already exists');
        }
        if (existingTeacher.nik === nik) {
          throw new Error('NIK already exists');
        }
      }

      const teacher = await prisma.teacher.create({
        data: {
          user_id: BigInt(user_id),
          nip,
          nik,
          full_name,
          phone_number,
          employment_status,
          signature_image_path
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
              is_active: true
            }
          }
        }
      });

      return this.serializeTeacher(teacher);
    } catch (error) {
      logger.error('Error creating teacher:', error);
      throw error;
    }
  }

  /**
   * Update teacher
   */
  async updateTeacher(id, teacherData) {
    try {
      const existingTeacher = await prisma.teacher.findUnique({
        where: { id: BigInt(id) }
      });

      if (!existingTeacher) {
        throw new Error('Teacher not found');
      }

      // Check for duplicate NIP or NIK if they're being updated
      if (teacherData.nip || teacherData.nik) {
        const duplicateCheck = await prisma.teacher.findFirst({
          where: {
            AND: [
              { id: { not: BigInt(id) } },
              {
                OR: [
                  ...(teacherData.nip ? [{ nip: teacherData.nip }] : []),
                  ...(teacherData.nik ? [{ nik: teacherData.nik }] : [])
                ]
              }
            ]
          }
        });

        if (duplicateCheck) {
          if (duplicateCheck.nip === teacherData.nip) {
            throw new Error('NIP already exists');
          }
          if (duplicateCheck.nik === teacherData.nik) {
            throw new Error('NIK already exists');
          }
        }
      }

      const teacher = await prisma.teacher.update({
        where: { id: BigInt(id) },
        data: {
          ...teacherData,
          user_id: teacherData.user_id ? BigInt(teacherData.user_id) : undefined
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
              is_active: true
            }
          },
          homeroom_classes: {
            select: {
              id: true,
              class_name: true,
              grade_level: true,
              major: true
            }
          },
          counselor_classes: {
            select: {
              id: true,
              class_name: true,
              grade_level: true,
              major: true
            }
          }
        }
      });

      return this.serializeTeacher(teacher);
    } catch (error) {
      logger.error('Error updating teacher:', error);
      throw error;
    }
  }

  /**
   * Delete teacher
   */
  async deleteTeacher(id) {
    try {
      const existingTeacher = await prisma.teacher.findUnique({
        where: { id: BigInt(id) },
        include: {
          homeroom_classes: true,
          counselor_classes: true,
          schedules: true
        }
      });

      if (!existingTeacher) {
        throw new Error('Teacher not found');
      }

      // Check for dependencies
      if (existingTeacher.homeroom_classes.length > 0) {
        throw new Error('Cannot delete teacher who is assigned as homeroom teacher');
      }

      if (existingTeacher.counselor_classes.length > 0) {
        throw new Error('Cannot delete teacher who is assigned as counselor');
      }

      if (existingTeacher.schedules.length > 0) {
        throw new Error('Cannot delete teacher who has teaching schedules');
      }

      await prisma.teacher.delete({
        where: { id: BigInt(id) }
      });

      return { message: 'Teacher deleted successfully' };
    } catch (error) {
      logger.error('Error deleting teacher:', error);
      throw error;
    }
  }

  /**
   * Get teacher statistics
   */
  async getTeacherStats() {
    try {
      const total = await prisma.teacher.count();

      const employmentStats = await prisma.teacher.groupBy({
        by: ['employment_status'],
        _count: {
          employment_status: true
        }
      });

      const activeTeachers = await prisma.teacher.count({
        where: {
          user: {
            is_active: true
          }
        }
      });

      const teachersWithClasses = await prisma.teacher.count({
        where: {
          OR: [
            { homeroom_classes: { some: {} } },
            { counselor_classes: { some: {} } }
          ]
        }
      });

      const teachersWithSchedules = await prisma.teacher.count({
        where: {
          schedules: { some: {} }
        }
      });

      return {
        total,
        active: activeTeachers,
        inactive: total - activeTeachers,
        withClasses: teachersWithClasses,
        withSchedules: teachersWithSchedules,
        employmentDistribution: employmentStats.map(stat => ({
          employment_status: stat.employment_status,
          count: stat._count.employment_status
        }))
      };
    } catch (error) {
      logger.error('Error getting teacher statistics:', error);
      throw error;
    }
  }

  /**
   * Get available users for teacher profile creation
   */
  async getAvailableUsers() {
    try {
      const users = await prisma.user.findMany({
        where: {
          teacher: null,
          student: null,
          role: {
            in: ['teacher', 'admin']
          }
        },
        select: {
          id: true,
          username: true,
          role: true,
          is_active: true
        },
        orderBy: {
          username: 'asc'
        }
      });

      return users.map(user => ({
        ...user,
        id: user.id.toString()
      }));
    } catch (error) {
      logger.error('Error getting available users:', error);
      throw error;
    }
  }

  /**
   * Search teachers by various criteria
   */
  async searchTeachers(query) {
    try {
      const teachers = await prisma.teacher.findMany({
        where: {
          OR: [
            { full_name: { contains: query } },
            { nip: { contains: query } },
            { nik: { contains: query } },
            { user: { username: { contains: query } } }
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
              is_active: true
            }
          },
          homeroom_classes: {
            select: {
              id: true,
              class_name: true,
              grade_level: true,
              major: true
            }
          }
        },
        take: 20
      });

      return teachers.map(teacher => this.serializeTeacher(teacher));
    } catch (error) {
      logger.error('Error searching teachers:', error);
      throw error;
    }
  }
}

module.exports = new TeacherService();
