const subjectService = require('../services/subjectService');
const { ApiResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

class SubjectController {
  /**
   * Get all subjects
   */
  async getSubjects(req, res) {
    try {
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        is_active: req.query.is_active,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };

      const result = await subjectService.getSubjects(options);

      logger.info('Subjects retrieved successfully', {
        userId: req.user.userId,
        query: options
      });

      return res.status(200).json(
        ApiResponse.success(
          'Subjects retrieved successfully',
          result.subjects,
          { pagination: result.pagination }
        )
      );
    } catch (error) {
      logger.error('Error retrieving subjects', {
        error: error.message,
        userId: req.user.userId,
        query: req.query
      });

      return res.status(error.status || 500).json(
        ApiResponse.error(error.message)
      );
    }
  }

  /**
   * Get subject by ID
   */
  async getSubjectById(req, res) {
    try {
      const { id } = req.params;
      const subject = await subjectService.getSubjectById(id);

      logger.info('Subject retrieved successfully', {
        userId: req.user.userId,
        subjectId: id
      });

      return res.status(200).json(
        ApiResponse.success('Subject retrieved successfully', subject)
      );
    } catch (error) {
      logger.error('Error retrieving subject', {
        error: error.message,
        userId: req.user.userId,
        subjectId: req.params.id
      });

      return res.status(error.status || 500).json(
        ApiResponse.error(error.message)
      );
    }
  }

  /**
   * Create new subject
   */
  async createSubject(req, res) {
    try {
      const subject = await subjectService.createSubject(req.body);

      logger.info('Subject created successfully', {
        userId: req.user.userId,
        subjectId: subject.id,
        subjectCode: subject.code
      });

      return res.status(201).json(
        ApiResponse.success('Subject created successfully', subject)
      );
    } catch (error) {
      logger.error('Error creating subject', {
        error: error.message,
        userId: req.user.userId,
        data: req.body
      });

      return res.status(error.status || 500).json(
        ApiResponse.error(error.message)
      );
    }
  }

  /**
   * Update subject
   */
  async updateSubject(req, res) {
    try {
      const { id } = req.params;
      const subject = await subjectService.updateSubject(id, req.body);

      logger.info('Subject updated successfully', {
        userId: req.user.userId,
        subjectId: id
      });

      return res.status(200).json(
        ApiResponse.success('Subject updated successfully', subject)
      );
    } catch (error) {
      logger.error('Error updating subject', {
        error: error.message,
        userId: req.user.userId,
        subjectId: req.params.id,
        data: req.body
      });

      return res.status(error.status || 500).json(
        ApiResponse.error(error.message)
      );
    }
  }

  /**
   * Delete subject
   */
  async deleteSubject(req, res) {
    try {
      const { id } = req.params;
      const result = await subjectService.deleteSubject(id);

      logger.info('Subject deleted successfully', {
        userId: req.user.userId,
        subjectId: id
      });

      return res.status(200).json(
        ApiResponse.success(result.message)
      );
    } catch (error) {
      logger.error('Error deleting subject', {
        error: error.message,
        userId: req.user.userId,
        subjectId: req.params.id
      });

      return res.status(error.status || 500).json(
        ApiResponse.error(error.message)
      );
    }
  }

  /**
   * Toggle subject status
   */
  async toggleSubjectStatus(req, res) {
    try {
      const { id } = req.params;
      
      // Since Subject schema doesn't have is_active field, we'll return an error
      return res.status(400).json(
        ApiResponse.error('Subject status toggle is not supported - subjects do not have active/inactive status')
      );
    } catch (error) {
      logger.error('Error toggling subject status', {
        error: error.message,
        userId: req.user.userId,
        subjectId: req.params.id
      });

      return res.status(error.status || 500).json(
        ApiResponse.error(error.message)
      );
    }
  }

  /**
   * Get subject statistics
   */
  async getSubjectStats(req, res) {
    try {
      const stats = await subjectService.getSubjectStats();

      logger.info('Subject statistics retrieved successfully', {
        userId: req.user.userId
      });

      return res.status(200).json(
        ApiResponse.success('Subject statistics retrieved successfully', stats)
      );
    } catch (error) {
      logger.error('Error retrieving subject statistics', {
        error: error.message,
        userId: req.user.userId
      });

      return res.status(error.status || 500).json(
        ApiResponse.error(error.message)
      );
    }
  }

  /**
   * Assign teacher to subject
   */
  async assignTeacher(req, res) {
    try {
      // Since Subject schema doesn't have teacher relationships, we'll return an error
      return res.status(400).json(
        ApiResponse.error('Teacher assignment is not supported - subjects do not have direct teacher relationships')
      );
    } catch (error) {
      logger.error('Error assigning teacher to subject', {
        error: error.message,
        userId: req.user.userId,
        subjectId: req.params.id,
        data: req.body
      });

      return res.status(error.status || 500).json(
        ApiResponse.error(error.message)
      );
    }
  }

  /**
   * Remove teacher from subject
   */
  async removeTeacher(req, res) {
    try {
      // Since Subject schema doesn't have teacher relationships, we'll return an error
      return res.status(400).json(
        ApiResponse.error('Teacher removal is not supported - subjects do not have direct teacher relationships')
      );
    } catch (error) {
      logger.error('Error removing teacher from subject', {
        error: error.message,
        userId: req.user.userId,
        subjectId: req.params.id,
        teacherId: req.params.teacherId
      });

      return res.status(error.status || 500).json(
        ApiResponse.error(error.message)
      );
    }
  }
}

module.exports = new SubjectController();
