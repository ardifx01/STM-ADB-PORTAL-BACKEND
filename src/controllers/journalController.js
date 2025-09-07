const journalService = require('../services/journalService');
const { ApiResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

class JournalController {
  /**
   * Get all teaching journals
   */
  async getAllJournals(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        teacher_id: req.query.teacher_id,
        class_id: req.query.class_id,
        subject_id: req.query.subject_id,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        search: req.query.search,
        sort_by: req.query.sort_by || 'teaching_date',
        sort_order: req.query.sort_order || 'desc'
      };

      const result = await journalService.getAllJournals(options);

      res.status(200).json(
        new ApiResponse(
          true,
          'Teaching journals retrieved successfully',
          result.data,
          result.meta
        )
      );
    } catch (error) {
      logger.error('Error in getAllJournals controller:', error);
      res.status(500).json(
        new ApiResponse(false, 'Failed to retrieve teaching journals')
      );
    }
  }

  /**
   * Get journal by ID
   */
  async getJournalById(req, res) {
    try {
      const { id } = req.params;
      const journal = await journalService.getJournalById(id);

      res.status(200).json(
        new ApiResponse(
          true,
          'Teaching journal retrieved successfully',
          journal
        )
      );
    } catch (error) {
      logger.error('Error in getJournalById controller:', error);
      if (error.message === 'Teaching journal not found') {
        res.status(404).json(
          new ApiResponse(false, error.message)
        );
      } else {
        res.status(500).json(
          new ApiResponse(false, 'Failed to retrieve teaching journal')
        );
      }
    }
  }

  /**
   * Create new teaching journal
   */
  async createJournal(req, res) {
    try {
      const journalData = req.body;
      const journal = await journalService.createJournal(journalData);

      res.status(201).json(
        new ApiResponse(
          true,
          'Teaching journal created successfully',
          journal
        )
      );
    } catch (error) {
      logger.error('Error in createJournal controller:', error);
      if (error.message.includes('already exists') || error.message.includes('not found')) {
        res.status(400).json(
          new ApiResponse(false, error.message)
        );
      } else {
        res.status(500).json(
          new ApiResponse(false, 'Failed to create teaching journal')
        );
      }
    }
  }

  /**
   * Update teaching journal
   */
  async updateJournal(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const journal = await journalService.updateJournal(id, updateData);

      res.status(200).json(
        new ApiResponse(
          true,
          'Teaching journal updated successfully',
          journal
        )
      );
    } catch (error) {
      logger.error('Error in updateJournal controller:', error);
      if (error.message === 'Teaching journal not found') {
        res.status(404).json(
          new ApiResponse(false, error.message)
        );
      } else {
        res.status(500).json(
          new ApiResponse(false, 'Failed to update teaching journal')
        );
      }
    }
  }

  /**
   * Delete teaching journal
   */
  async deleteJournal(req, res) {
    try {
      const { id } = req.params;
      await journalService.deleteJournal(id);

      res.status(200).json(
        new ApiResponse(
          true,
          'Teaching journal deleted successfully'
        )
      );
    } catch (error) {
      logger.error('Error in deleteJournal controller:', error);
      if (error.message === 'Teaching journal not found') {
        res.status(404).json(
          new ApiResponse(false, error.message)
        );
      } else {
        res.status(500).json(
          new ApiResponse(false, 'Failed to delete teaching journal')
        );
      }
    }
  }

  /**
   * Get journals by teacher
   */
  async getJournalsByTeacher(req, res) {
    try {
      const { teacherId } = req.params;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        search: req.query.search,
        sort_by: req.query.sort_by || 'teaching_date',
        sort_order: req.query.sort_order || 'desc'
      };

      const result = await journalService.getJournalsByTeacher(teacherId, options);

      res.status(200).json(
        new ApiResponse(
          true,
          'Teacher journals retrieved successfully',
          result.data,
          result.meta
        )
      );
    } catch (error) {
      logger.error('Error in getJournalsByTeacher controller:', error);
      res.status(500).json(
        new ApiResponse(false, 'Failed to retrieve teacher journals')
      );
    }
  }

  /**
   * Get journals by class
   */
  async getJournalsByClass(req, res) {
    try {
      const { classId } = req.params;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        search: req.query.search,
        sort_by: req.query.sort_by || 'teaching_date',
        sort_order: req.query.sort_order || 'desc'
      };

      const result = await journalService.getJournalsByClass(classId, options);

      res.status(200).json(
        new ApiResponse(
          true,
          'Class journals retrieved successfully',
          result.data,
          result.meta
        )
      );
    } catch (error) {
      logger.error('Error in getJournalsByClass controller:', error);
      res.status(500).json(
        new ApiResponse(false, 'Failed to retrieve class journals')
      );
    }
  }

  /**
   * Get journals by subject
   */
  async getJournalsBySubject(req, res) {
    try {
      const { subjectId } = req.params;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        search: req.query.search,
        sort_by: req.query.sort_by || 'teaching_date',
        sort_order: req.query.sort_order || 'desc'
      };

      const result = await journalService.getJournalsBySubject(subjectId, options);

      res.status(200).json(
        new ApiResponse(
          true,
          'Subject journals retrieved successfully',
          result.data,
          result.meta
        )
      );
    } catch (error) {
      logger.error('Error in getJournalsBySubject controller:', error);
      res.status(500).json(
        new ApiResponse(false, 'Failed to retrieve subject journals')
      );
    }
  }

  /**
   * Get my journals (for current logged in teacher)
   */
  async getMyJournals(req, res) {
    try {
      const { user } = req;
      
      // Get teacher ID from user
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const teacher = await prisma.teacher.findUnique({
        where: { user_id: BigInt(user.id) }
      });

      if (!teacher) {
        return res.status(404).json(
          new ApiResponse(false, 'Teacher profile not found')
        );
      }

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        date_from: req.query.date_from,
        date_to: req.query.date_to,
        search: req.query.search,
        sort_by: req.query.sort_by || 'teaching_date',
        sort_order: req.query.sort_order || 'desc'
      };

      const result = await journalService.getJournalsByTeacher(teacher.id.toString(), options);

      res.status(200).json(
        new ApiResponse(
          true,
          'My journals retrieved successfully',
          result.data,
          result.meta
        )
      );
    } catch (error) {
      logger.error('Error in getMyJournals controller:', error);
      res.status(500).json(
        new ApiResponse(false, 'Failed to retrieve my journals')
      );
    }
  }

  /**
   * Get journal statistics
   */
  async getJournalStats(req, res) {
    try {
      const filters = {
        teacher_id: req.query.teacher_id,
        class_id: req.query.class_id,
        subject_id: req.query.subject_id,
        date_from: req.query.date_from,
        date_to: req.query.date_to
      };

      const stats = await journalService.getJournalStats(filters);

      res.status(200).json(
        new ApiResponse(
          true,
          'Journal statistics retrieved successfully',
          stats
        )
      );
    } catch (error) {
      logger.error('Error in getJournalStats controller:', error);
      res.status(500).json(
        new ApiResponse(false, 'Failed to retrieve journal statistics')
      );
    }
  }
}

module.exports = new JournalController();
