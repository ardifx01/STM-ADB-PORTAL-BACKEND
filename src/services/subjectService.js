const { PrismaClient } = require('@prisma/client');
const { ApiError } = require('../utils/helpers');

const prisma = new PrismaClient();

class SubjectService {
  /**
   * Get all subjects with pagination and filters
   */
  async getSubjects(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'subject_name',
      sortOrder = 'asc'
    } = options;

    const skip = (page - 1) * limit;
    
    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { subject_name: { contains: search, mode: 'insensitive' } },
        { subject_code: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count
    const total = await prisma.subject.count({ where });
    
    // Get subjects with pagination
    const subjects = await prisma.subject.findMany({
      where,
      include: {
        schedules: {
          select: {
            id: true,
            day_of_week: true,
            start_time: true,
            end_time: true,
            class: {
              select: {
                id: true,
                class_name: true,
                grade_level: true
              }
            }
          }
        },
        exam_schedules: {
          select: {
            id: true,
            exam_date: true,
            start_time: true,
            end_time: true,
            session: true
          },
          orderBy: {
            exam_date: 'desc'
          },
          take: 3
        },
        _count: {
          select: {
            schedules: true,
            exam_schedules: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: parseInt(limit)
    });

    // Convert BigInt to string
    const serializedSubjects = subjects.map(subject => ({
      ...subject,
      id: subject.id.toString(),
      schedules: subject.schedules.map(schedule => ({
        ...schedule,
        id: schedule.id.toString(),
        class: schedule.class ? {
          ...schedule.class,
          id: schedule.class.id.toString()
        } : null
      })),
      exam_schedules: subject.exam_schedules.map(exam => ({
        ...exam,
        id: exam.id.toString()
      }))
    }));

    return {
      subjects: serializedSubjects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get subject by ID
   */
  async getSubjectById(id) {
    const subject = await prisma.subject.findUnique({
      where: { id: BigInt(id) },
      include: {
        schedules: {
          include: {
            class: {
              select: {
                id: true,
                class_name: true,
                grade_level: true,
                major: true
              }
            }
          }
        },
        exam_schedules: {
          select: {
            id: true,
            exam_date: true,
            start_time: true,
            end_time: true,
            session: true
          },
          orderBy: {
            exam_date: 'desc'
          }
        },
        _count: {
          select: {
            schedules: true,
            exam_schedules: true
          }
        }
      }
    });

    if (!subject) {
      throw new ApiError(404, 'Subject not found');
    }

    // Convert BigInt to string
    return {
      ...subject,
      id: subject.id.toString(),
      schedules: subject.schedules.map(schedule => ({
        ...schedule,
        id: schedule.id.toString(),
        class: schedule.class ? {
          ...schedule.class,
          id: schedule.class.id.toString()
        } : null
      })),
      exam_schedules: subject.exam_schedules.map(exam => ({
        ...exam,
        id: exam.id.toString()
      }))
    };
  }

  /**
   * Create new subject
   */
  async createSubject(subjectData) {
    const { subject_name, subject_code } = subjectData;

    // Check if subject code already exists
    const existingSubject = await prisma.subject.findUnique({
      where: { subject_code }
    });

    if (existingSubject) {
      throw new ApiError(400, 'Subject code already exists');
    }

    const subject = await prisma.subject.create({
      data: {
        subject_name,
        subject_code
      }
    });

    return {
      ...subject,
      id: subject.id.toString()
    };
  }

  /**
   * Update subject
   */
  async updateSubject(id, updateData) {
    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id: BigInt(id) }
    });

    if (!existingSubject) {
      throw new ApiError(404, 'Subject not found');
    }

    // If updating code, check for duplicates
    if (updateData.subject_code && updateData.subject_code !== existingSubject.subject_code) {
      const duplicateSubject = await prisma.subject.findUnique({
        where: { subject_code: updateData.subject_code }
      });

      if (duplicateSubject) {
        throw new ApiError(400, 'Subject code already exists');
      }
    }

    const subject = await prisma.subject.update({
      where: { id: BigInt(id) },
      data: updateData
    });

    return {
      ...subject,
      id: subject.id.toString()
    };
  }

  /**
   * Delete subject
   */
  async deleteSubject(id) {
    // Check if subject exists
    const existingSubject = await prisma.subject.findUnique({
      where: { id: BigInt(id) },
      include: {
        _count: {
          select: {
            schedules: true,
            exam_schedules: true
          }
        }
      }
    });

    if (!existingSubject) {
      throw new ApiError(404, 'Subject not found');
    }

    // Check if subject has relationships
    const { schedules, exam_schedules } = existingSubject._count;
    if (schedules > 0 || exam_schedules > 0) {
      throw new ApiError(400, 'Cannot delete subject that has associated schedules or exam schedules');
    }

    await prisma.subject.delete({
      where: { id: BigInt(id) }
    });

    return { message: 'Subject deleted successfully' };
  }

  /**
   * Get subject statistics
   */
  async getSubjectStats() {
    const total = await prisma.subject.count();

    // Get subjects with most schedules
    const subjectsWithMostSchedules = await prisma.subject.findMany({
      include: {
        _count: {
          select: {
            schedules: true,
            exam_schedules: true
          }
        }
      },
      orderBy: {
        schedules: {
          _count: 'desc'
        }
      },
      take: 5
    });

    return {
      total,
      subjectsWithMostSchedules: subjectsWithMostSchedules.map(subject => ({
        id: subject.id.toString(),
        subject_name: subject.subject_name,
        subject_code: subject.subject_code,
        scheduleCount: subject._count.schedules,
        examCount: subject._count.exam_schedules
      }))
    };
  }
}

module.exports = new SubjectService();
