const { PrismaClient } = require('@prisma/client');
const { serializeBigInt, Pagination } = require('../utils/helpers');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class StudentService {
  /**
   * Serialize student data to handle BigInt properly
   */
  serializeStudent(student) {
    return {
      ...student,
      id: student.id.toString(),
      user_id: student.user_id?.toString() || null,
      current_class_id: student.current_class_id?.toString() || null,
      user: student.user ? {
        ...student.user,
        id: student.user.id.toString()
      } : null,
      current_class: student.current_class ? {
        ...student.current_class,
        id: student.current_class.id.toString(),
        homeroom_teacher_id: student.current_class.homeroom_teacher_id?.toString() || null,
        counselor_id: student.current_class.counselor_id?.toString() || null
      } : null,
      attendances: student.attendances ? student.attendances.map(attendance => ({
        ...attendance,
        id: attendance.id.toString(),
        student_id: attendance.student_id?.toString() || null
      })) : [],
      internship_placements: student.internship_placements ? student.internship_placements.map(placement => ({
        ...placement,
        id: placement.id.toString(),
        student_id: placement.student_id?.toString() || null,
        company_id: placement.company_id?.toString() || null,
        supervisor_teacher_id: placement.supervisor_teacher_id?.toString() || null
      })) : []
    };
  }

  /**
   * Get all students with pagination and filtering
   */
  async getAllStudents(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        class_id = '',
        gender = '',
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
          { nis: { contains: search } },
          { nisn: { contains: search } },
          { phone_number: { contains: search } },
          { user: { username: { contains: search } } }
        ];
      }

      if (status) {
        whereClause.status = status;
      }

      if (class_id) {
        whereClause.current_class_id = BigInt(class_id);
      }

      if (gender) {
        whereClause.gender = gender;
      }

      // Get total count
      const total = await prisma.student.count({ where: whereClause });

      // Build order by clause
      const orderBy = {};
      if (sort_by === 'username') {
        orderBy.user = { username: sort_order };
      } else if (sort_by === 'class_name') {
        orderBy.current_class = { class_name: sort_order };
      } else {
        orderBy[sort_by] = sort_order;
      }

      // Get students with pagination
      const students = await prisma.student.findMany({
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
          current_class: {
            select: {
              id: true,
              class_name: true,
              grade_level: true,
              major: true,
              homeroom_teacher: {
                select: {
                  id: true,
                  full_name: true,
                  nip: true
                }
              }
            }
          }
        },
        orderBy,
        skip: offset,
        take: pagination.limit
      });

      const serializedStudents = students.map(student => this.serializeStudent(student));

      pagination.total = total;
      pagination.pages = Math.ceil(total / pagination.limit);

      return {
        students: serializedStudents,
        pagination: pagination.getMeta().pagination
      };
    } catch (error) {
      logger.error('Error getting students:', error);
      throw error;
    }
  }

  /**
   * Get student by ID
   */
  async getStudentById(id) {
    try {
      const student = await prisma.student.findUnique({
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
          current_class: {
            include: {
              homeroom_teacher: {
                select: {
                  id: true,
                  full_name: true,
                  nip: true
                }
              },
              counselor: {
                select: {
                  id: true,
                  full_name: true,
                  nip: true
                }
              }
            }
          },
          attendances: {
            include: {
              student: {
                select: {
                  id: true,
                  full_name: true,
                  nis: true
                }
              }
            },
            orderBy: {
              timestamp: 'desc'
            },
            take: 10
          },
          internship_placements: {
            include: {
              supervisor_teacher: {
                select: {
                  id: true,
                  full_name: true,
                  nip: true
                }
              },
              company: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      if (!student) {
        throw new Error('Student not found');
      }

      return this.serializeStudent(student);
    } catch (error) {
      logger.error('Error getting student by ID:', error);
      throw error;
    }
  }

  /**
   * Create new student
   */
  async createStudent(studentData) {
    try {
      const {
        user_id,
        current_class_id,
        nis,
        nisn,
        full_name,
        gender,
        address,
        phone_number,
        status = 'AKTIF',
        rfid_uid
      } = studentData;

      // Check if user exists and is not already a student
      const existingUser = await prisma.user.findUnique({
        where: { id: BigInt(user_id) },
        include: { student: true, teacher: true }
      });

      if (!existingUser) {
        throw new Error('User not found');
      }

      if (existingUser.student) {
        throw new Error('User already has a student profile');
      }

      if (existingUser.teacher) {
        throw new Error('User already has a teacher profile');
      }

      // Check for duplicate NIS
      if (nis) {
        const existingNIS = await prisma.student.findUnique({
          where: { nis }
        });
        if (existingNIS) {
          throw new Error('NIS already exists');
        }
      }

      // Check for duplicate NISN
      if (nisn) {
        const existingNISN = await prisma.student.findUnique({
          where: { nisn }
        });
        if (existingNISN) {
          throw new Error('NISN already exists');
        }
      }

      // Check for duplicate RFID UID
      if (rfid_uid) {
        const existingRFID = await prisma.student.findUnique({
          where: { rfid_uid }
        });
        if (existingRFID) {
          throw new Error('RFID UID already exists');
        }
      }

      // Check if class exists (if provided)
      if (current_class_id) {
        const existingClass = await prisma.class.findUnique({
          where: { id: BigInt(current_class_id) }
        });
        if (!existingClass) {
          throw new Error('Class not found');
        }
      }

      const student = await prisma.student.create({
        data: {
          user_id: BigInt(user_id),
          current_class_id: current_class_id ? BigInt(current_class_id) : null,
          nis,
          nisn,
          full_name,
          gender,
          address,
          phone_number,
          status,
          rfid_uid
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
          current_class: {
            select: {
              id: true,
              class_name: true,
              grade_level: true,
              major: true
            }
          }
        }
      });

      return this.serializeStudent(student);
    } catch (error) {
      logger.error('Error creating student:', error);
      throw error;
    }
  }

  /**
   * Update student
   */
  async updateStudent(id, studentData) {
    try {
      const existingStudent = await prisma.student.findUnique({
        where: { id: BigInt(id) }
      });

      if (!existingStudent) {
        throw new Error('Student not found');
      }

      // Check for duplicate NIS if being updated
      if (studentData.nis && studentData.nis !== existingStudent.nis) {
        const existingNIS = await prisma.student.findUnique({
          where: { nis: studentData.nis }
        });
        if (existingNIS) {
          throw new Error('NIS already exists');
        }
      }

      // Check for duplicate NISN if being updated
      if (studentData.nisn && studentData.nisn !== existingStudent.nisn) {
        const existingNISN = await prisma.student.findUnique({
          where: { nisn: studentData.nisn }
        });
        if (existingNISN) {
          throw new Error('NISN already exists');
        }
      }

      // Check for duplicate RFID UID if being updated
      if (studentData.rfid_uid && studentData.rfid_uid !== existingStudent.rfid_uid) {
        const existingRFID = await prisma.student.findUnique({
          where: { rfid_uid: studentData.rfid_uid }
        });
        if (existingRFID) {
          throw new Error('RFID UID already exists');
        }
      }

      // Check if class exists (if being updated)
      if (studentData.current_class_id) {
        const existingClass = await prisma.class.findUnique({
          where: { id: BigInt(studentData.current_class_id) }
        });
        if (!existingClass) {
          throw new Error('Class not found');
        }
      }

      const student = await prisma.student.update({
        where: { id: BigInt(id) },
        data: {
          ...studentData,
          current_class_id: studentData.current_class_id ? BigInt(studentData.current_class_id) : undefined
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
          current_class: {
            select: {
              id: true,
              class_name: true,
              grade_level: true,
              major: true,
              homeroom_teacher: {
                select: {
                  id: true,
                  full_name: true,
                  nip: true
                }
              }
            }
          }
        }
      });

      return this.serializeStudent(student);
    } catch (error) {
      logger.error('Error updating student:', error);
      throw error;
    }
  }

  /**
   * Delete student
   */
  async deleteStudent(id) {
    try {
      const existingStudent = await prisma.student.findUnique({
        where: { id: BigInt(id) },
        include: {
          attendances: true,
          internship_placements: true,
          queue_tickets: true,
          exam_assignments: true
        }
      });

      if (!existingStudent) {
        throw new Error('Student not found');
      }

      // Check for dependencies
      if (existingStudent.attendances.length > 0) {
        throw new Error('Cannot delete student with attendance records');
      }

      if (existingStudent.internship_placements.length > 0) {
        throw new Error('Cannot delete student with internship placement records');
      }

      if (existingStudent.queue_tickets.length > 0) {
        throw new Error('Cannot delete student with queue ticket records');
      }

      if (existingStudent.exam_assignments.length > 0) {
        throw new Error('Cannot delete student with exam assignment records');
      }

      await prisma.student.delete({
        where: { id: BigInt(id) }
      });

      return { message: 'Student deleted successfully' };
    } catch (error) {
      logger.error('Error deleting student:', error);
      throw error;
    }
  }

  /**
   * Get student statistics
   */
  async getStudentStats() {
    try {
      const total = await prisma.student.count();

      const statusStats = await prisma.student.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      });

      const genderStats = await prisma.student.groupBy({
        by: ['gender'],
        _count: {
          gender: true
        }
      });

      const classStats = await prisma.student.groupBy({
        by: ['current_class_id'],
        _count: {
          current_class_id: true
        },
        where: {
          current_class_id: {
            not: null
          }
        }
      });

      const studentsWithClass = await prisma.student.count({
        where: {
          current_class_id: {
            not: null
          }
        }
      });

      const studentsWithRFID = await prisma.student.count({
        where: {
          rfid_uid: {
            not: null
          }
        }
      });

      return {
        total,
        withClass: studentsWithClass,
        withoutClass: total - studentsWithClass,
        withRFID: studentsWithRFID,
        withoutRFID: total - studentsWithRFID,
        statusDistribution: statusStats.map(stat => ({
          status: stat.status,
          count: stat._count.status
        })),
        genderDistribution: genderStats.map(stat => ({
          gender: stat.gender,
          count: stat._count.gender
        })),
        classDistribution: classStats.map(stat => ({
          class_id: stat.current_class_id?.toString() || null,
          count: stat._count.current_class_id
        }))
      };
    } catch (error) {
      logger.error('Error getting student statistics:', error);
      throw error;
    }
  }

  /**
   * Get available users for student profile creation
   */
  async getAvailableUsers() {
    try {
      const users = await prisma.user.findMany({
        where: {
          teacher: null,
          student: null,
          role: {
            in: ['student', 'admin']
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
   * Search students by various criteria
   */
  async searchStudents(query) {
    try {
      const students = await prisma.student.findMany({
        where: {
          OR: [
            { full_name: { contains: query } },
            { nis: { contains: query } },
            { nisn: { contains: query } },
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
          current_class: {
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

      return students.map(student => this.serializeStudent(student));
    } catch (error) {
      logger.error('Error searching students:', error);
      throw error;
    }
  }

  /**
   * Get students by class
   */
  async getStudentsByClass(classId) {
    try {
      const students = await prisma.student.findMany({
        where: {
          current_class_id: BigInt(classId)
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
        },
        orderBy: {
          full_name: 'asc'
        }
      });

      return students.map(student => this.serializeStudent(student));
    } catch (error) {
      logger.error('Error getting students by class:', error);
      throw error;
    }
  }

  /**
   * Assign student to class
   */
  async assignToClass(studentId, classId) {
    try {
      const student = await prisma.student.findUnique({
        where: { id: BigInt(studentId) }
      });

      if (!student) {
        throw new Error('Student not found');
      }

      const classExists = await prisma.class.findUnique({
        where: { id: BigInt(classId) }
      });

      if (!classExists) {
        throw new Error('Class not found');
      }

      const updatedStudent = await prisma.student.update({
        where: { id: BigInt(studentId) },
        data: {
          current_class_id: BigInt(classId)
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
          current_class: {
            select: {
              id: true,
              class_name: true,
              grade_level: true,
              major: true
            }
          }
        }
      });

      return this.serializeStudent(updatedStudent);
    } catch (error) {
      logger.error('Error assigning student to class:', error);
      throw error;
    }
  }

  /**
   * Remove student from class
   */
  async removeFromClass(studentId) {
    try {
      const student = await prisma.student.findUnique({
        where: { id: BigInt(studentId) }
      });

      if (!student) {
        throw new Error('Student not found');
      }

      const updatedStudent = await prisma.student.update({
        where: { id: BigInt(studentId) },
        data: {
          current_class_id: null
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

      return this.serializeStudent(updatedStudent);
    } catch (error) {
      logger.error('Error removing student from class:', error);
      throw error;
    }
  }
}

module.exports = new StudentService();
