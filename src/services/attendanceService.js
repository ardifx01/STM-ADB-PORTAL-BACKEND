const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class AttendanceService {
  /**
   * Record teacher attendance (check-in/check-out)
   */
  async recordTeacherAttendance(teacherId, attendanceData) {
    try {
      const { status, location_coordinates, photo_path } = attendanceData;

      // Check if teacher exists
      const teacher = await prisma.teacher.findUnique({
        where: { id: BigInt(teacherId) },
        include: { user: { select: { username: true } } }
      });

      if (!teacher) {
        throw new Error('Teacher not found');
      }

      // Check for duplicate attendance on the same day for same status
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingAttendance = await prisma.teacherAttendance.findFirst({
        where: {
          teacher_id: BigInt(teacherId),
          status: status,
          timestamp: {
            gte: today,
            lt: tomorrow
          }
        }
      });

      if (existingAttendance) {
        throw new Error(`Teacher already recorded ${status.toLowerCase()} attendance today`);
      }

      // Create attendance record
      const attendance = await prisma.teacherAttendance.create({
        data: {
          teacher_id: BigInt(teacherId),
          timestamp: new Date(),
          status: status,
          location_coordinates: location_coordinates || null,
          photo_path: photo_path || null
        },
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  username: true
                }
              }
            }
          }
        }
      });

      return this.serializeTeacherAttendance(attendance);
    } catch (error) {
      logger.error('Error in recordTeacherAttendance:', error);
      throw error;
    }
  }

  /**
   * Record student attendance for a specific schedule
   */
  async recordStudentAttendance(studentId, scheduleId, attendanceData) {
    try {
      const { status, location_coordinates } = attendanceData;

      // Check if student exists
      const student = await prisma.student.findUnique({
        where: { id: BigInt(studentId) },
        include: { 
          user: { select: { username: true } },
          current_class: { select: { class_name: true } }
        }
      });

      if (!student) {
        throw new Error('Student not found');
      }

      // Check if schedule exists and is valid for today
      const schedule = await prisma.schedule.findUnique({
        where: { id: BigInt(scheduleId) },
        include: {
          class: true,
          subject: true,
          teacher: true
        }
      });

      if (!schedule) {
        throw new Error('Schedule not found');
      }

      // Verify student belongs to the scheduled class
      if (student.class_id !== schedule.class_id) {
        throw new Error('Student does not belong to this class');
      }

      // Check for duplicate attendance for this schedule today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingAttendance = await prisma.studentAttendance.findFirst({
        where: {
          student_id: BigInt(studentId),
          status: status,
          timestamp: {
            gte: today,
            lt: tomorrow
          }
        }
      });

      if (existingAttendance) {
        throw new Error(`Student already recorded ${status.toLowerCase()} attendance today`);
      }

      // Create attendance record
      const attendance = await prisma.studentAttendance.create({
        data: {
          student_id: BigInt(studentId),
          timestamp: new Date(),
          status: status,
          location_coordinates: location_coordinates || null
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  username: true
                }
              },
              current_class: {
                select: {
                  class_name: true
                }
              }
            }
          }
        }
      });

      return this.serializeStudentAttendance(attendance);
    } catch (error) {
      logger.error('Error in recordStudentAttendance:', error);
      throw error;
    }
  }

  /**
   * Get teacher attendance records with filters
   */
  async getTeacherAttendance(filters = {}) {
    try {
      const {
        teacher_id,
        status,
        date_from,
        date_to,
        page = 1,
        limit = 10
      } = filters;

      const where = {};

      if (teacher_id) {
        where.teacher_id = BigInt(teacher_id);
      }

      if (status) {
        where.status = status;
      }

      if (date_from || date_to) {
        where.timestamp = {};
        if (date_from) {
          where.timestamp.gte = new Date(date_from);
        }
        if (date_to) {
          const endDate = new Date(date_to);
          endDate.setHours(23, 59, 59, 999);
          where.timestamp.lte = endDate;
        }
      }

      const skip = (page - 1) * limit;

      const [attendances, total] = await Promise.all([
        prisma.teacherAttendance.findMany({
          where,
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    username: true
                  }
                }
              }
            }
          },
          orderBy: {
            timestamp: 'desc'
          },
          skip,
          take: parseInt(limit)
        }),
        prisma.teacherAttendance.count({ where })
      ]);

      const serializedAttendances = attendances.map(attendance => 
        this.serializeTeacherAttendance(attendance)
      );

      const totalPages = Math.ceil(total / limit);

      return {
        data: serializedAttendances,
        meta: {
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      };
    } catch (error) {
      logger.error('Error in getTeacherAttendance:', error);
      throw error;
    }
  }

  /**
   * Get student attendance records with filters
   */
  async getStudentAttendance(filters = {}) {
    try {
      const {
        student_id,
        class_id,
        status,
        date_from,
        date_to,
        page = 1,
        limit = 10
      } = filters;

      const where = {};

      if (student_id) {
        where.student_id = BigInt(student_id);
      }

      if (class_id) {
        where.student = {
          class_id: BigInt(class_id)
        };
      }

      if (status) {
        where.status = status;
      }

      if (date_from || date_to) {
        where.timestamp = {};
        if (date_from) {
          where.timestamp.gte = new Date(date_from);
        }
        if (date_to) {
          const endDate = new Date(date_to);
          endDate.setHours(23, 59, 59, 999);
          where.timestamp.lte = endDate;
        }
      }

      const skip = (page - 1) * limit;

      const [attendances, total] = await Promise.all([
        prisma.studentAttendance.findMany({
          where,
          include: {
            student: {
              include: {
                user: {
                  select: {
                    username: true
                  }
                },
                current_class: {
                  select: {
                    class_name: true
                  }
                }
              }
            }
          },
          orderBy: {
            timestamp: 'desc'
          },
          skip,
          take: parseInt(limit)
        }),
        prisma.studentAttendance.count({ where })
      ]);

      const serializedAttendances = attendances.map(attendance => 
        this.serializeStudentAttendance(attendance)
      );

      const totalPages = Math.ceil(total / limit);

      return {
        data: serializedAttendances,
        meta: {
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      };
    } catch (error) {
      logger.error('Error in getStudentAttendance:', error);
      throw error;
    }
  }

  /**
   * Get attendance summary for a specific date
   */
  async getAttendanceSummary(date, type = 'all') {
    try {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const where = {
        timestamp: {
          gte: targetDate,
          lt: nextDate
        }
      };

      let summary = {};

      if (type === 'teacher' || type === 'all') {
        const teacherStats = await prisma.teacherAttendance.groupBy({
          by: ['status'],
          where,
          _count: {
            id: true
          }
        });

        summary.teachers = {
          masuk: teacherStats.find(s => s.status === 'Masuk')?._count.id || 0,
          pulang: teacherStats.find(s => s.status === 'Pulang')?._count.id || 0
        };
      }

      if (type === 'student' || type === 'all') {
        const studentStats = await prisma.studentAttendance.groupBy({
          by: ['status'],
          where,
          _count: {
            id: true
          }
        });

        summary.students = {
          masuk: studentStats.find(s => s.status === 'Masuk')?._count.id || 0,
          pulang: studentStats.find(s => s.status === 'Pulang')?._count.id || 0
        };
      }

      return summary;
    } catch (error) {
      logger.error('Error in getAttendanceSummary:', error);
      throw error;
    }
  }

  /**
   * Get attendance report for a specific period
   */
  async getAttendanceReport(filters = {}) {
    try {
      const {
        type = 'student', // 'teacher' or 'student'
        class_id,
        teacher_id,
        student_id,
        date_from,
        date_to,
        group_by = 'day' // 'day', 'week', 'month'
      } = filters;

      const where = {};

      if (date_from || date_to) {
        where.timestamp = {};
        if (date_from) {
          where.timestamp.gte = new Date(date_from);
        }
        if (date_to) {
          const endDate = new Date(date_to);
          endDate.setHours(23, 59, 59, 999);
          where.timestamp.lte = endDate;
        }
      }

      let report = {};

      if (type === 'teacher') {
        if (teacher_id) {
          where.teacher_id = BigInt(teacher_id);
        }

        const attendances = await prisma.teacherAttendance.findMany({
          where,
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    username: true
                  }
                }
              }
            }
          },
          orderBy: {
            timestamp: 'asc'
          }
        });

        report = this.groupAttendanceData(attendances, group_by, 'teacher');
      } else {
        if (class_id) {
          where.student = {
            class_id: BigInt(class_id)
          };
        }
        if (student_id) {
          where.student_id = BigInt(student_id);
        }

        const attendances = await prisma.studentAttendance.findMany({
          where,
          include: {
            student: {
              include: {
                user: {
                  select: {
                    username: true
                  }
                },
                current_class: {
                  select: {
                    class_name: true
                  }
                }
              }
            }
          },
          orderBy: {
            timestamp: 'asc'
          }
        });

        report = this.groupAttendanceData(attendances, group_by, 'student');
      }

      return report;
    } catch (error) {
      logger.error('Error in getAttendanceReport:', error);
      throw error;
    }
  }

  /**
   * Get today's attendance status for a user
   */
  async getTodayAttendanceStatus(userId, userType) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let attendance = null;

      if (userType === 'teacher') {
        const teacher = await prisma.teacher.findFirst({
          where: { user_id: BigInt(userId) }
        });

        if (teacher) {
          attendance = await prisma.teacherAttendance.findMany({
            where: {
              teacher_id: teacher.id,
              timestamp: {
                gte: today,
                lt: tomorrow
              }
            },
            orderBy: {
              timestamp: 'desc'
            }
          });
        }
      } else if (userType === 'student') {
        const student = await prisma.student.findFirst({
          where: { user_id: BigInt(userId) }
        });

        if (student) {
          attendance = await prisma.studentAttendance.findMany({
            where: {
              student_id: student.id,
              timestamp: {
                gte: today,
                lt: tomorrow
              }
            },
            orderBy: {
              timestamp: 'desc'
            }
          });
        }
      }

      const status = {
        hasCheckedIn: false,
        hasCheckedOut: false,
        checkInTime: null,
        checkOutTime: null
      };

      if (attendance && attendance.length > 0) {
        attendance.forEach(record => {
          if (record.status === 'Masuk') {
            status.hasCheckedIn = true;
            status.checkInTime = record.timestamp;
          } else if (record.status === 'Pulang') {
            status.hasCheckedOut = true;
            status.checkOutTime = record.timestamp;
          }
        });
      }

      return status;
    } catch (error) {
      logger.error('Error in getTodayAttendanceStatus:', error);
      throw error;
    }
  }

  /**
   * Group attendance data by specified period
   */
  groupAttendanceData(attendances, groupBy, type) {
    const grouped = {};

    attendances.forEach(attendance => {
      let key;
      const date = new Date(attendance.timestamp);

      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay());
          key = startOfWeek.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = {
          date: key,
          masuk: 0,
          pulang: 0,
          records: []
        };
      }

      if (attendance.status === 'Masuk') {
        grouped[key].masuk++;
      } else if (attendance.status === 'Pulang') {
        grouped[key].pulang++;
      }

      grouped[key].records.push(
        type === 'teacher' 
          ? this.serializeTeacherAttendance(attendance)
          : this.serializeStudentAttendance(attendance)
      );
    });

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Serialize teacher attendance object
   */
  serializeTeacherAttendance(attendance) {
    return {
      id: attendance.id.toString(),
      teacher_id: attendance.teacher_id.toString(),
      timestamp: attendance.timestamp,
      status: attendance.status,
      location_coordinates: attendance.location_coordinates,
      photo_path: attendance.photo_path,
      teacher: attendance.teacher ? {
        id: attendance.teacher.id.toString(),
        nip: attendance.teacher.nip,
        full_name: attendance.teacher.full_name,
        user: attendance.teacher.user ? {
          username: attendance.teacher.user.username
        } : null
      } : null
    };
  }

  /**
   * Serialize student attendance object
   */
  serializeStudentAttendance(attendance) {
    return {
      id: attendance.id.toString(),
      student_id: attendance.student_id.toString(),
      timestamp: attendance.timestamp,
      status: attendance.status,
      location_coordinates: attendance.location_coordinates,
      student: attendance.student ? {
        id: attendance.student.id.toString(),
        nis: attendance.student.nis,
        full_name: attendance.student.full_name,
        class: attendance.student.class ? {
          class_name: attendance.student.class.class_name
        } : null,
        user: attendance.student.user ? {
          username: attendance.student.user.username
        } : null
      } : null
    };
  }
}

module.exports = new AttendanceService();
