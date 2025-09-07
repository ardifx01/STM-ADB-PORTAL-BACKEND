const { PrismaClient } = require('@prisma/client');
const { serializeBigInt, Pagination } = require('../utils/helpers');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class JournalService {
  /**
   * Serialize journal data to handle BigInt properly
   */
  serializeJournal(journal) {
    if (!journal) return null;
    
    return {
      ...serializeBigInt(journal),
      schedule: journal.schedule ? {
        ...serializeBigInt(journal.schedule),
        class: journal.schedule.class ? serializeBigInt(journal.schedule.class) : null,
        subject: journal.schedule.subject ? serializeBigInt(journal.schedule.subject) : null,
        teacher: journal.schedule.teacher ? serializeBigInt(journal.schedule.teacher) : null,
      } : null
    };
  }

  /**
   * Get all teaching journals with pagination and filtering
   */
  async getAllJournals(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        teacher_id,
        class_id,
        subject_id,
        date_from,
        date_to,
        search,
        sort_by = 'teaching_date',
        sort_order = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      
      // Build where clause
      const where = {};
      
      if (teacher_id) {
        where.schedule = {
          teacher_id: BigInt(teacher_id)
        };
      }
      
      if (class_id || subject_id) {
        where.schedule = {
          ...where.schedule,
          ...(class_id && { class_id: BigInt(class_id) }),
          ...(subject_id && { subject_id: BigInt(subject_id) })
        };
      }
      
      if (date_from || date_to) {
        where.teaching_date = {};
        if (date_from) {
          where.teaching_date.gte = new Date(date_from);
        }
        if (date_to) {
          where.teaching_date.lte = new Date(date_to);
        }
      }
      
      if (search) {
        where.OR = [
          { topic: { contains: search } },
          { notes: { contains: search } },
          { 
            schedule: {
              subject: {
                subject_name: { contains: search }
              }
            }
          },
          {
            schedule: {
              class: {
                class_name: { contains: search }
              }
            }
          }
        ];
      }

      // Get total count
      const total = await prisma.teachingJournal.count({ where });

      // Get journals
      const journals = await prisma.teachingJournal.findMany({
        where,
        include: {
          schedule: {
            include: {
              class: true,
              subject: true,
              teacher: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          [sort_by]: sort_order
        },
        skip,
        take: parseInt(limit)
      });

      const serializedJournals = journals.map(journal => this.serializeJournal(journal));
      
      const pagination = new Pagination(page, limit, total);

      return {
        data: serializedJournals,
        meta: pagination.getMeta()
      };
    } catch (error) {
      logger.error('Error in getAllJournals:', error);
      throw error;
    }
  }

  /**
   * Get journal by ID
   */
  async getJournalById(id) {
    try {
      const journal = await prisma.teachingJournal.findUnique({
        where: { id: BigInt(id) },
        include: {
          schedule: {
            include: {
              class: true,
              subject: true,
              teacher: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!journal) {
        throw new Error('Teaching journal not found');
      }

      return this.serializeJournal(journal);
    } catch (error) {
      logger.error('Error in getJournalById:', error);
      throw error;
    }
  }

  /**
   * Create new teaching journal
   */
  async createJournal(journalData) {
    try {
      const {
        schedule_id,
        teaching_date,
        topic,
        student_attendance_summary,
        notes
      } = journalData;

      // Validate schedule exists
      const schedule = await prisma.schedule.findUnique({
        where: { id: BigInt(schedule_id) }
      });

      if (!schedule) {
        throw new Error('Schedule not found');
      }

      // Check if journal already exists for this schedule and date
      const existingJournal = await prisma.teachingJournal.findFirst({
        where: {
          schedule_id: BigInt(schedule_id),
          teaching_date: new Date(teaching_date)
        }
      });

      if (existingJournal) {
        throw new Error('Teaching journal for this schedule and date already exists');
      }

      const journal = await prisma.teachingJournal.create({
        data: {
          schedule_id: BigInt(schedule_id),
          teaching_date: new Date(teaching_date),
          topic,
          student_attendance_summary,
          notes
        },
        include: {
          schedule: {
            include: {
              class: true,
              subject: true,
              teacher: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      return this.serializeJournal(journal);
    } catch (error) {
      logger.error('Error in createJournal:', error);
      throw error;
    }
  }

  /**
   * Update teaching journal
   */
  async updateJournal(id, updateData) {
    try {
      // Check if journal exists
      const existingJournal = await prisma.teachingJournal.findUnique({
        where: { id: BigInt(id) }
      });

      if (!existingJournal) {
        throw new Error('Teaching journal not found');
      }

      const {
        teaching_date,
        topic,
        student_attendance_summary,
        notes
      } = updateData;

      const updateFields = {};
      
      if (teaching_date !== undefined) {
        updateFields.teaching_date = new Date(teaching_date);
      }
      if (topic !== undefined) {
        updateFields.topic = topic;
      }
      if (student_attendance_summary !== undefined) {
        updateFields.student_attendance_summary = student_attendance_summary;
      }
      if (notes !== undefined) {
        updateFields.notes = notes;
      }

      const journal = await prisma.teachingJournal.update({
        where: { id: BigInt(id) },
        data: updateFields,
        include: {
          schedule: {
            include: {
              class: true,
              subject: true,
              teacher: {
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      return this.serializeJournal(journal);
    } catch (error) {
      logger.error('Error in updateJournal:', error);
      throw error;
    }
  }

  /**
   * Delete teaching journal
   */
  async deleteJournal(id) {
    try {
      // Check if journal exists
      const existingJournal = await prisma.teachingJournal.findUnique({
        where: { id: BigInt(id) }
      });

      if (!existingJournal) {
        throw new Error('Teaching journal not found');
      }

      await prisma.teachingJournal.delete({
        where: { id: BigInt(id) }
      });

      return { success: true };
    } catch (error) {
      logger.error('Error in deleteJournal:', error);
      throw error;
    }
  }

  /**
   * Get journals by teacher
   */
  async getJournalsByTeacher(teacherId, options = {}) {
    try {
      return await this.getAllJournals({
        ...options,
        teacher_id: teacherId
      });
    } catch (error) {
      logger.error('Error in getJournalsByTeacher:', error);
      throw error;
    }
  }

  /**
   * Get journals by class
   */
  async getJournalsByClass(classId, options = {}) {
    try {
      return await this.getAllJournals({
        ...options,
        class_id: classId
      });
    } catch (error) {
      logger.error('Error in getJournalsByClass:', error);
      throw error;
    }
  }

  /**
   * Get journals by subject
   */
  async getJournalsBySubject(subjectId, options = {}) {
    try {
      return await this.getAllJournals({
        ...options,
        subject_id: subjectId
      });
    } catch (error) {
      logger.error('Error in getJournalsBySubject:', error);
      throw error;
    }
  }

  /**
   * Get journal statistics
   */
  async getJournalStats(filters = {}) {
    try {
      const {
        teacher_id,
        class_id,
        subject_id,
        date_from,
        date_to
      } = filters;

      const where = {};
      
      if (teacher_id) {
        where.schedule = {
          teacher_id: BigInt(teacher_id)
        };
      }
      
      if (class_id || subject_id) {
        where.schedule = {
          ...where.schedule,
          ...(class_id && { class_id: BigInt(class_id) }),
          ...(subject_id && { subject_id: BigInt(subject_id) })
        };
      }
      
      if (date_from || date_to) {
        where.teaching_date = {};
        if (date_from) {
          where.teaching_date.gte = new Date(date_from);
        }
        if (date_to) {
          where.teaching_date.lte = new Date(date_to);
        }
      }

      const total = await prisma.teachingJournal.count({ where });
      
      const thisMonth = await prisma.teachingJournal.count({
        where: {
          ...where,
          teaching_date: {
            ...where.teaching_date,
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      });

      const today = await prisma.teachingJournal.count({
        where: {
          ...where,
          teaching_date: {
            ...where.teaching_date,
            gte: new Date(new Date().toDateString())
          }
        }
      });

      return {
        total,
        this_month: thisMonth,
        today
      };
    } catch (error) {
      logger.error('Error in getJournalStats:', error);
      throw error;
    }
  }
}

module.exports = new JournalService();
