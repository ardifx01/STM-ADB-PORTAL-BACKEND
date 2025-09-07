const { PrismaClient } = require('@prisma/client');
const { serializeBigInt } = require('../utils/helpers');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class ClassService {
  /**
   * Serialize class data to handle BigInt properly
   */
  serializeClass(classItem) {
    return {
      ...classItem,
      id: classItem.id.toString(),
      homeroom_teacher_id: classItem.homeroom_teacher_id?.toString() || null,
      counselor_id: classItem.counselor_id?.toString() || null,
      homeroom_teacher: classItem.homeroom_teacher ? {
        ...classItem.homeroom_teacher,
        id: classItem.homeroom_teacher.id.toString(),
        user_id: classItem.homeroom_teacher.user_id?.toString() || null,
      } : null,
      counselor: classItem.counselor ? {
        ...classItem.counselor,
        id: classItem.counselor.id.toString(),
        user_id: classItem.counselor.user_id?.toString() || null,
      } : null,
      students: classItem.students?.map(student => ({
        ...student,
        id: student.id.toString(),
        user_id: student.user_id?.toString() || null,
        current_class_id: student.current_class_id?.toString() || null,
      })) || [],
      schedules: classItem.schedules?.map(schedule => ({
        ...schedule,
        id: schedule.id.toString(),
        class_id: schedule.class_id?.toString() || null,
        subject_id: schedule.subject_id?.toString() || null,
        teacher_id: schedule.teacher_id?.toString() || null,
      })) || [],
    };
  }

  /**
   * Get all classes with pagination and filters
   */
  async getClasses(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        grade_level,
        major,
        homeroom_teacher_id,
        has_homeroom_teacher,
        search,
      } = filters;

      // Ensure page and limit are integers
      const currentPage = parseInt(page) || 1;
      const currentLimit = parseInt(limit) || 10;
      const skip = (currentPage - 1) * currentLimit;
      
      // Build where clause
      const where = {};

      if (grade_level) where.grade_level = grade_level;
      if (major) where.major = { contains: major };
      if (homeroom_teacher_id) where.homeroom_teacher_id = BigInt(homeroom_teacher_id);
      if (has_homeroom_teacher !== undefined) {
        where.homeroom_teacher_id = has_homeroom_teacher ? { not: null } : null;
      }
      if (search) {
        where.class_name = { contains: search };
      }

      const [classes, total] = await Promise.all([
        prisma.class.findMany({
          where,
          include: {
            homeroom_teacher: {
              include: {
                user: {
                  select: {
                    username: true,
                  },
                },
              },
            },
            counselor: {
              include: {
                user: {
                  select: {
                    username: true,
                  },
                },
              },
            },
            students: {
              include: {
                user: {
                  select: {
                    username: true,
                  },
                },
              },
            },
            schedules: true,
            _count: {
              select: {
                students: true,
                schedules: true,
              },
            },
          },
          skip,
          take: currentLimit,
          orderBy: [
            { grade_level: 'asc' },
            { class_name: 'asc' },
          ],
        }),
        prisma.class.count({ where }),
      ]);

      return {
        classes: classes.map(cls => ({
          ...cls,
          id: cls.id.toString(),
          homeroom_teacher_id: cls.homeroom_teacher_id?.toString() || null,
          counselor_id: cls.counselor_id?.toString() || null,
          created_at: cls.created_at?.toISOString() || null,
          updated_at: cls.updated_at?.toISOString() || null,
          homeroom_teacher: cls.homeroom_teacher ? {
            ...cls.homeroom_teacher,
            id: cls.homeroom_teacher.id.toString(),
            user_id: cls.homeroom_teacher.user_id.toString(),
            current_class_id: cls.homeroom_teacher.current_class_id?.toString() || null,
          } : null,
          counselor: cls.counselor ? {
            ...cls.counselor,
            id: cls.counselor.id.toString(),
            user_id: cls.counselor.user_id.toString(),
          } : null,
          students: cls.students?.map(student => ({
            ...student,
            id: student.id.toString(),
            user_id: student.user_id.toString(),
            current_class_id: student.current_class_id?.toString() || null,
          })) || [],
        })),
        pagination: {
          page: currentPage,
          limit: currentLimit,
          total,
          totalPages: Math.ceil(total / currentLimit),
          hasNext: currentPage < Math.ceil(total / currentLimit),
          hasPrev: currentPage > 1,
        },
      };
    } catch (error) {
      logger.error('Error getting classes:', error);
      throw error;
    }
  }

  /**
   * Get class by ID
   */
  async getClassById(id) {
    try {
      const classItem = await prisma.class.findUnique({
        where: { id: BigInt(id) },
        include: {
          homeroom_teacher: {
            include: {
              user: {
                select: {
                  username: true,
                },
              },
            },
          },
          counselor: {
            include: {
              user: {
                select: {
                  username: true,
                },
              },
            },
          },
          students: {
            include: {
              user: {
                select: {
                  username: true,
                },
              },
            },
          },
          schedules: {
            include: {
              subject: true,
              teacher: {
                include: {
                  user: {
                    select: {
                      username: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              students: true,
              schedules: true,
            },
          },
        },
      });

      if (!classItem) {
        throw new Error('Class not found');
      }

      return this.serializeClass(classItem);
    } catch (error) {
      logger.error('Error getting class by ID:', error);
      throw error;
    }
  }

  /**
   * Create new class
   */
  async createClass(classData) {
    try {
      const { class_name, grade_level, major, homeroom_teacher_id, counselor_id } = classData;

      // Check if class name already exists
      const existingClass = await prisma.class.findFirst({
        where: { 
          class_name,
          grade_level: parseInt(grade_level)
        }
      });

      if (existingClass) {
        throw new Error('Class with this name and grade level already exists');
      }

      // Validate homeroom teacher if provided
      if (homeroom_teacher_id) {
        const teacher = await prisma.teacher.findUnique({
          where: { id: BigInt(homeroom_teacher_id) }
        });
        if (!teacher) {
          throw new Error('Homeroom teacher not found');
        }
      }

      // Validate counselor if provided
      if (counselor_id) {
        const counselor = await prisma.teacher.findUnique({
          where: { id: BigInt(counselor_id) }
        });
        if (!counselor) {
          throw new Error('Counselor not found');
        }
      }

      const classItem = await prisma.class.create({
        data: {
          class_name,
          grade_level: parseInt(grade_level),
          major: major || null,
          homeroom_teacher_id: homeroom_teacher_id ? BigInt(homeroom_teacher_id) : null,
          counselor_id: counselor_id ? BigInt(counselor_id) : null
        }
      });

      return this.serializeClass(classItem);
    } catch (error) {
      logger.error('Error creating class:', error);
      throw error;
    }
  }

  /**
   * Update class
   */
  async updateClass(id, updateData) {
    try {
      // Check if class exists
      const existingClass = await prisma.class.findUnique({
        where: { id: BigInt(id) }
      });

      if (!existingClass) {
        throw new Error('Class not found');
      }

      // Check for duplicate class name if updating
      if (updateData.class_name || updateData.grade_level) {
        const className = updateData.class_name || existingClass.class_name;
        const gradeLevel = updateData.grade_level ? parseInt(updateData.grade_level) : existingClass.grade_level;
        
        const duplicateClass = await prisma.class.findFirst({
          where: { 
            class_name: className,
            grade_level: gradeLevel,
            NOT: { id: BigInt(id) }
          }
        });

        if (duplicateClass) {
          throw new Error('Class with this name and grade level already exists');
        }
      }

      // Validate homeroom teacher if provided
      if (updateData.homeroom_teacher_id) {
        const teacher = await prisma.teacher.findUnique({
          where: { id: BigInt(updateData.homeroom_teacher_id) }
        });
        if (!teacher) {
          throw new Error('Homeroom teacher not found');
        }
      }

      // Validate counselor if provided
      if (updateData.counselor_id) {
        const counselor = await prisma.teacher.findUnique({
          where: { id: BigInt(updateData.counselor_id) }
        });
        if (!counselor) {
          throw new Error('Counselor not found');
        }
      }

      // Prepare update data
      const updatePayload = { ...updateData };
      if (updatePayload.grade_level) {
        updatePayload.grade_level = parseInt(updatePayload.grade_level);
      }
      if (updatePayload.homeroom_teacher_id) {
        updatePayload.homeroom_teacher_id = BigInt(updatePayload.homeroom_teacher_id);
      }
      if (updatePayload.counselor_id) {
        updatePayload.counselor_id = BigInt(updatePayload.counselor_id);
      }

      const classItem = await prisma.class.update({
        where: { id: BigInt(id) },
        data: updatePayload
      });

      return this.serializeClass(classItem);
    } catch (error) {
      logger.error('Error updating class:', error);
      throw error;
    }
  }

  /**
   * Delete class
   */
  async deleteClass(id) {
    try {
      // Check if class exists
      const existingClass = await prisma.class.findUnique({
        where: { id: BigInt(id) },
        include: {
          students: true,
          schedules: true,
        },
      });

      if (!existingClass) {
        throw new Error('Class not found');
      }

      // Check if class has students or schedules
      if (existingClass.students.length > 0) {
        throw new Error('Cannot delete class with enrolled students');
      }

      if (existingClass.schedules.length > 0) {
        throw new Error('Cannot delete class with existing schedules');
      }

      await prisma.class.delete({
        where: { id: BigInt(id) }
      });

      return { message: 'Class deleted successfully' };
    } catch (error) {
      logger.error('Error deleting class:', error);
      throw error;
    }
  }

  /**
   * Get class statistics
   */
  async getClassStats() {
    try {
      const stats = await prisma.class.aggregate({
        _count: true,
        _avg: {
          grade_level: true,
        },
      });

      const gradeDistribution = await prisma.class.groupBy({
        by: ['grade_level'],
        _count: {
          grade_level: true,
        },
        orderBy: {
          grade_level: 'asc',
        },
      });

      const majorDistribution = await prisma.class.groupBy({
        by: ['major'],
        _count: {
          major: true,
        },
        where: {
          major: {
            not: null,
          },
        },
      });

      return {
        total: stats._count,
        averageGradeLevel: stats._avg.grade_level,
        gradeDistribution,
        majorDistribution,
      };
    } catch (error) {
      logger.error('Error getting class stats:', error);
      throw error;
    }
  }

  /**
   * Get available teachers for homeroom assignment
   */
  async getAvailableTeachers() {
    try {
      const assignedTeachers = await prisma.class.findMany({
        where: {
          OR: [
            { homeroom_teacher_id: { not: null } },
            { counselor_id: { not: null } },
          ],
        },
        select: {
          homeroom_teacher_id: true,
          counselor_id: true,
        },
      });

      const assignedIds = new Set();
      assignedTeachers.forEach(cls => {
        if (cls.homeroom_teacher_id) assignedIds.add(cls.homeroom_teacher_id.toString());
        if (cls.counselor_id) assignedIds.add(cls.counselor_id.toString());
      });

      const availableTeachers = await prisma.teacher.findMany({
        where: {
          id: {
            notIn: Array.from(assignedIds).map(id => BigInt(id)),
          },
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      });

      return availableTeachers.map(teacher => ({
        ...teacher,
        id: teacher.id.toString(),
        user_id: teacher.user_id?.toString() || null,
      }));
    } catch (error) {
      logger.error('Error getting available teachers:', error);
      throw error;
    }
  }

  /**
   * Assign student to class
   */
  async assignStudent(classId, studentId) {
    try {
      // Check if class exists
      const classItem = await prisma.class.findUnique({
        where: { id: BigInt(classId) },
        include: {
          students: true,
        },
      });

      if (!classItem) {
        throw new Error('Class not found');
      }

      // Check if student exists
      const student = await prisma.student.findUnique({
        where: { id: BigInt(studentId) }
      });

      if (!student) {
        throw new Error('Student not found');
      }

      // Check if student is already in this class
      if (student.current_class_id && student.current_class_id.toString() === classId) {
        throw new Error('Student is already assigned to this class');
      }

      // Update student's current class
      await prisma.student.update({
        where: { id: BigInt(studentId) },
        data: { current_class_id: BigInt(classId) }
      });

      return { message: 'Student assigned to class successfully' };
    } catch (error) {
      logger.error('Error assigning student to class:', error);
      throw error;
    }
  }

  /**
   * Remove student from class
   */
  async removeStudent(classId, studentId) {
    try {
      // Check if class exists
      const classItem = await prisma.class.findUnique({
        where: { id: BigInt(classId) }
      });

      if (!classItem) {
        throw new Error('Class not found');
      }

      // Check if student exists and is in this class
      const student = await prisma.student.findUnique({
        where: { id: BigInt(studentId) }
      });

      if (!student) {
        throw new Error('Student not found');
      }

      if (!student.current_class_id || student.current_class_id.toString() !== classId) {
        throw new Error('Student is not assigned to this class');
      }

      // Remove student from class
      await prisma.student.update({
        where: { id: BigInt(studentId) },
        data: { current_class_id: null }
      });

      return { message: 'Student removed from class successfully' };
    } catch (error) {
      logger.error('Error removing student from class:', error);
      throw error;
    }
  }
}

module.exports = new ClassService();
