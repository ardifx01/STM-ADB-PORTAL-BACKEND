const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class ScheduleService {
  /**
   * Serialize schedule object
   */
  serializeSchedule(schedule) {
    return {
      ...schedule,
      id: schedule.id.toString(),
      class_id: schedule.class_id?.toString() || null,
      subject_id: schedule.subject_id?.toString() || null,
      teacher_id: schedule.teacher_id?.toString() || null,
      start_time: schedule.start_time ? schedule.start_time.toISOString().split('T')[1].split('.')[0] : null,
      end_time: schedule.end_time ? schedule.end_time.toISOString().split('T')[1].split('.')[0] : null,
      class: schedule.class ? {
        ...schedule.class,
        id: schedule.class.id.toString(),
        homeroom_teacher_id: schedule.class.homeroom_teacher_id?.toString() || null,
        counselor_id: schedule.class.counselor_id?.toString() || null,
      } : null,
      subject: schedule.subject ? {
        ...schedule.subject,
        id: schedule.subject.id.toString(),
      } : null,
      teacher: schedule.teacher ? {
        ...schedule.teacher,
        id: schedule.teacher.id.toString(),
        user_id: schedule.teacher.user_id?.toString() || null,
        current_class_id: schedule.teacher.current_class_id?.toString() || null,
      } : null,
    };
  }

  /**
   * Get all schedules with pagination and filtering
   */
  async getAllSchedules(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        class_id = '',
        teacher_id = '',
        subject_id = '',
        day_of_week = '',
        room = '',
        sort_by = 'day_of_week',
        sort_order = 'asc'
      } = options;

      // Ensure page and limit are integers
      const currentPage = parseInt(page) || 1;
      const currentLimit = parseInt(limit) || 10;
      const skip = (currentPage - 1) * currentLimit;

      // Build where clause
      const whereClause = {};

      if (class_id) {
        whereClause.class_id = BigInt(class_id);
      }

      if (teacher_id) {
        whereClause.teacher_id = BigInt(teacher_id);
      }

      if (subject_id) {
        whereClause.subject_id = BigInt(subject_id);
      }

      if (day_of_week) {
        whereClause.day_of_week = day_of_week;
      }

      if (room) {
        whereClause.room = { contains: room };
      }

      // Simple query first to test
      const [schedules, total] = await Promise.all([
        prisma.schedule.findMany({
          where: whereClause,
          skip,
          take: currentLimit,
          orderBy: { day_of_week: 'asc' },
        }),
        prisma.schedule.count({ where: whereClause }),
      ]);

      const serializedSchedules = schedules.map(schedule => this.serializeSchedule(schedule));

      return {
        schedules: serializedSchedules,
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
      logger.error('Error in getAllSchedules:', error);
      throw new Error('Failed to retrieve schedules');
    }
  }

  /**
   * Get schedule by ID
   */
  async getScheduleById(id) {
    try {
      const schedule = await prisma.schedule.findUnique({
        where: { id: BigInt(id) },
        include: {
          class: {
            include: {
              homeroom_teacher: {
                select: {
                  id: true,
                  full_name: true,
                  nip: true,
                }
              },
              students: {
                select: {
                  id: true,
                  full_name: true,
                  nis: true,
                  status: true,
                }
              },
              _count: {
                select: {
                  students: true,
                }
              }
            }
          },
          subject: true,
          teacher: {
            include: {
              user: {
                select: {
                  username: true,
                  is_active: true,
                  created_at: true,
                  updated_at: true,
                }
              }
            }
          }
        }
      });

      if (!schedule) {
        throw new Error('Schedule not found');
      }

      return this.serializeSchedule(schedule);
    } catch (error) {
      logger.error('Error in getScheduleById:', error);
      throw new Error('Failed to retrieve schedule');
    }
  }

  /**
   * Create new schedule
   */
  async createSchedule(scheduleData) {
    try {
      // Convert time strings to DateTime objects for today's date (only time matters for @db.Time())
      const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD
      const startDateTime = new Date(`${today}T${scheduleData.start_time}`);
      const endDateTime = new Date(`${today}T${scheduleData.end_time}`);

      // Check for scheduling conflicts
      await this.checkScheduleConflicts({
        ...scheduleData,
        start_time: startDateTime,
        end_time: endDateTime
      });

      const schedule = await prisma.schedule.create({
        data: {
          class_id: BigInt(scheduleData.class_id),
          subject_id: BigInt(scheduleData.subject_id),
          teacher_id: BigInt(scheduleData.teacher_id),
          day_of_week: scheduleData.day_of_week,
          start_time: startDateTime,
          end_time: endDateTime,
          room: scheduleData.room || null,
        },
        include: {
          class: {
            select: {
              id: true,
              class_name: true,
              grade_level: true,
              major: true,
            }
          },
          subject: {
            select: {
              id: true,
              subject_name: true,
              subject_code: true,
            }
          },
          teacher: {
            select: {
              id: true,
              full_name: true,
              nip: true,
              user: {
                select: {
                  username: true,
                }
              }
            }
          }
        }
      });

      logger.info('Schedule created successfully', {
        scheduleId: schedule.id.toString(),
        class: schedule.class.class_name,
        subject: schedule.subject.name,
        teacher: schedule.teacher.full_name
      });

      return this.serializeSchedule(schedule);
    } catch (error) {
      logger.error('Error in createSchedule:', error);
      throw error;
    }
  }

  /**
   * Update schedule
   */
  async updateSchedule(id, updateData) {
    try {
      // Check if schedule exists
      const existingSchedule = await prisma.schedule.findUnique({
        where: { id: BigInt(id) }
      });

      if (!existingSchedule) {
        throw new Error('Schedule not found');
      }

      // Prepare update data with BigInt conversion
      const processedData = {};
      
      if (updateData.class_id) processedData.class_id = BigInt(updateData.class_id);
      if (updateData.subject_id) processedData.subject_id = BigInt(updateData.subject_id);
      if (updateData.teacher_id) processedData.teacher_id = BigInt(updateData.teacher_id);
      if (updateData.day_of_week) processedData.day_of_week = updateData.day_of_week;
      if (updateData.start_time) {
        // Convert time string to Date for @db.Time() compatibility
        processedData.start_time = new Date(`1970-01-01T${updateData.start_time}.000Z`);
      }
      if (updateData.end_time) {
        // Convert time string to Date for @db.Time() compatibility
        processedData.end_time = new Date(`1970-01-01T${updateData.end_time}.000Z`);
      }
      if (updateData.room !== undefined) processedData.room = updateData.room;

      // Check for conflicts with the updated data
      const conflictCheckData = {
        ...existingSchedule,
        ...processedData
      };
      await this.checkScheduleConflicts(conflictCheckData, id);

      const updatedSchedule = await prisma.schedule.update({
        where: { id: BigInt(id) },
        data: processedData,
        include: {
          class: {
            select: {
              id: true,
              class_name: true,
              grade_level: true,
              major: true,
            }
          },
          subject: {
            select: {
              id: true,
              subject_name: true,
              subject_code: true,
            }
          },
          teacher: {
            select: {
              id: true,
              full_name: true,
              nip: true,
              user: {
                select: {
                  username: true,
                }
              }
            }
          }
        }
      });

      logger.info('Schedule updated successfully', {
        scheduleId: updatedSchedule.id.toString()
      });

      return this.serializeSchedule(updatedSchedule);
    } catch (error) {
      logger.error('Error in updateSchedule:', error);
      throw error;
    }
  }

  /**
   * Delete schedule
   */
  async deleteSchedule(id) {
    try {
      const existingSchedule = await prisma.schedule.findUnique({
        where: { id: BigInt(id) }
      });

      if (!existingSchedule) {
        throw new Error('Schedule not found');
      }

      await prisma.schedule.delete({
        where: { id: BigInt(id) }
      });

      logger.info('Schedule deleted successfully', {
        scheduleId: id
      });

      return true;
    } catch (error) {
      logger.error('Error in deleteSchedule:', error);
      throw new Error('Failed to delete schedule');
    }
  }

  /**
   * Get schedules by class
   */
  async getSchedulesByClass(classId) {
    try {
      const schedules = await prisma.schedule.findMany({
        where: { class_id: BigInt(classId) },
        include: {
          subject: {
            select: {
              id: true,
              subject_name: true,
              subject_code: true,
            }
          },
          teacher: {
            select: {
              id: true,
              full_name: true,
              nip: true,
            }
          }
        },
        orderBy: [
          { day_of_week: 'asc' },
          { start_time: 'asc' }
        ]
      });

      return schedules.map(schedule => this.serializeSchedule(schedule));
    } catch (error) {
      logger.error('Error in getSchedulesByClass:', error);
      throw new Error('Failed to retrieve class schedules');
    }
  }

  /**
   * Get schedules by teacher
   */
  async getSchedulesByTeacher(teacherId) {
    try {
      const schedules = await prisma.schedule.findMany({
        where: { teacher_id: BigInt(teacherId) },
        include: {
          class: {
            select: {
              id: true,
              class_name: true,
              grade_level: true,
              major: true,
            }
          },
          subject: {
            select: {
              id: true,
              subject_name: true,
              subject_code: true,
            }
          }
        },
        orderBy: [
          { day_of_week: 'asc' },
          { start_time: 'asc' }
        ]
      });

      return schedules.map(schedule => this.serializeSchedule(schedule));
    } catch (error) {
      logger.error('Error in getSchedulesByTeacher:', error);
      throw new Error('Failed to retrieve teacher schedules');
    }
  }

  /**
   * Get weekly schedule
   */
  async getWeeklySchedule(filters = {}) {
    try {
      const { class_id, teacher_id } = filters;
      
      const whereClause = {};
      if (class_id) whereClause.class_id = BigInt(class_id);
      if (teacher_id) whereClause.teacher_id = BigInt(teacher_id);

      const schedules = await prisma.schedule.findMany({
        where: whereClause,
        include: {
          class: {
            select: {
              id: true,
              class_name: true,
              grade_level: true,
              major: true,
            }
          },
          subject: {
            select: {
              id: true,
              subject_name: true,
              subject_code: true,
            }
          },
          teacher: {
            select: {
              id: true,
              full_name: true,
              nip: true,
            }
          }
        },
        orderBy: [
          { day_of_week: 'asc' },
          { start_time: 'asc' }
        ]
      });

      // Group schedules by day
      const weeklySchedule = {
        SENIN: [],
        SELASA: [],
        RABU: [],
        KAMIS: [],
        JUMAT: [],
        SABTU: [],
        MINGGU: []
      };

      schedules.forEach(schedule => {
        const serializedSchedule = this.serializeSchedule(schedule);
        weeklySchedule[schedule.day_of_week].push(serializedSchedule);
      });

      return weeklySchedule;
    } catch (error) {
      logger.error('Error in getWeeklySchedule:', error);
      throw new Error('Failed to retrieve weekly schedule');
    }
  }

  /**
   * Check for schedule conflicts
   */
  async checkScheduleConflicts(scheduleData, excludeId = null) {
    try {
      const { class_id, teacher_id, day_of_week, start_time, end_time, room } = scheduleData;
      
      const whereClause = {
        day_of_week,
        OR: [
          {
            AND: [
              { start_time: { lte: start_time } },
              { end_time: { gt: start_time } }
            ]
          },
          {
            AND: [
              { start_time: { lt: end_time } },
              { end_time: { gte: end_time } }
            ]
          },
          {
            AND: [
              { start_time: { gte: start_time } },
              { end_time: { lte: end_time } }
            ]
          }
        ]
      };

      if (excludeId) {
        whereClause.id = { not: BigInt(excludeId) };
      }

      // Check teacher conflicts
      const teacherConflicts = await prisma.schedule.findMany({
        where: {
          ...whereClause,
          teacher_id: BigInt(teacher_id)
        },
        include: {
          class: { select: { class_name: true } },
          subject: { select: { subject_name: true } }
        }
      });

      if (teacherConflicts.length > 0) {
        throw new Error(`Teacher conflict detected. Teacher already has schedule at this time for ${teacherConflicts[0].class.class_name} - ${teacherConflicts[0].subject.subject_name}`);
      }

      // Check class conflicts  
      const classConflicts = await prisma.schedule.findMany({
        where: {
          ...whereClause,
          class_id: BigInt(class_id)
        },
        include: {
          teacher: { select: { full_name: true } },
          subject: { select: { subject_name: true } }
        }
      });

      if (classConflicts.length > 0) {
        throw new Error(`Class conflict detected. Class already has schedule at this time with ${classConflicts[0].teacher.full_name} for ${classConflicts[0].subject.name}`);
      }

      // Check room conflicts if room is specified
      if (room) {
        const roomConflicts = await prisma.schedule.findMany({
          where: {
            ...whereClause,
            room: room
          },
          include: {
            class: { select: { class_name: true } },
            teacher: { select: { full_name: true } },
            subject: { select: { subject_name: true } }
          }
        });

        if (roomConflicts.length > 0) {
          throw new Error(`Room conflict detected. Room ${room} is already booked at this time for ${roomConflicts[0].class.class_name}`);
        }
      }

      return true;
    } catch (error) {
      logger.error('Error in checkScheduleConflicts:', error);
      throw error;
    }
  }

  /**
   * Get schedule statistics
   */
  async getScheduleStatistics() {
    try {
      const [
        totalSchedules,
        schedulesByDay,
        schedulesByClass,
        schedulesByTeacher,
        schedulesBySubject,
        roomUsage
      ] = await Promise.all([
        // Total schedules
        prisma.schedule.count(),
        
        // Schedules by day
        prisma.schedule.groupBy({
          by: ['day_of_week'],
          _count: { id: true },
          orderBy: { day_of_week: 'asc' }
        }),

        // Schedules by class
        prisma.schedule.groupBy({
          by: ['class_id'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10
        }),

        // Schedules by teacher
        prisma.schedule.groupBy({
          by: ['teacher_id'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10
        }),

        // Schedules by subject
        prisma.schedule.groupBy({
          by: ['subject_id'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10
        }),

        // Room usage
        prisma.schedule.groupBy({
          by: ['room'],
          _count: { id: true },
          where: { room: { not: null } },
          orderBy: { _count: { id: 'desc' } },
          take: 10
        })
      ]);

      // Get additional details for top classes, teachers, and subjects
      const classIds = schedulesByClass.map(item => item.class_id);
      const teacherIds = schedulesByTeacher.map(item => item.teacher_id);
      const subjectIds = schedulesBySubject.map(item => item.subject_id);

      const [classDetails, teacherDetails, subjectDetails] = await Promise.all([
        prisma.class.findMany({
          where: { id: { in: classIds } },
          select: { id: true, class_name: true, grade_level: true, major: true }
        }),
        prisma.teacher.findMany({
          where: { id: { in: teacherIds } },
          select: { id: true, full_name: true, nip: true }
        }),
        prisma.subject.findMany({
          where: { id: { in: subjectIds } },
          select: { id: true, subject_name: true, subject_code: true }
        })
      ]);

      return {
        total: totalSchedules,
        byDay: schedulesByDay.map(item => ({
          day: item.day_of_week,
          count: item._count.id
        })),
        byClass: schedulesByClass.map(item => {
          const classInfo = classDetails.find(c => c.id === item.class_id);
          return {
            class_id: item.class_id.toString(),
            class_name: classInfo?.class_name || 'Unknown',
            grade_level: classInfo?.grade_level || null,
            major: classInfo?.major || null,
            count: item._count.id
          };
        }),
        byTeacher: schedulesByTeacher.map(item => {
          const teacherInfo = teacherDetails.find(t => t.id === item.teacher_id);
          return {
            teacher_id: item.teacher_id.toString(),
            full_name: teacherInfo?.full_name || 'Unknown',
            nip: teacherInfo?.nip || null,
            count: item._count.id
          };
        }),
        bySubject: schedulesBySubject.map(item => {
          const subjectInfo = subjectDetails.find(s => s.id === item.subject_id);
          return {
            subject_id: item.subject_id.toString(),
            name: subjectInfo?.name || 'Unknown',
            code: subjectInfo?.code || null,
            count: item._count.id
          };
        }),
        roomUsage: roomUsage.map(item => ({
          room: item.room,
          count: item._count.id
        }))
      };
    } catch (error) {
      logger.error('Error in getScheduleStatistics:', error);
      throw new Error('Failed to retrieve schedule statistics');
    }
  }
}

module.exports = new ScheduleService();
