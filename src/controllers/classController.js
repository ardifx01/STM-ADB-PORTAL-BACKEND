const classService = require('../services/classService');
const { ApiResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

class ClassController {
  /**
   * Get all classes
   */
  async getClasses(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search,
        grade_level: req.query.grade_level ? parseInt(req.query.grade_level) : undefined,
        major: req.query.major,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };

      const result = await classService.getClasses(options);

      logger.info('Classes retrieved successfully', {
        userId: req.user.userId,
        query: options
      });

      return res.status(200).json(
        ApiResponse.success(
          'Classes retrieved successfully',
          result.classes,
          { pagination: result.pagination }
        )
      );
    } catch (error) {
      logger.error('Error retrieving classes', {
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
   * Get class by ID
   */
  async getClassById(req, res) {
    try {
      const { id } = req.params;
      const classItem = await classService.getClassById(id);

      logger.info('Class retrieved successfully', {
        userId: req.user.userId,
        classId: id
      });

      return res.status(200).json(
        ApiResponse.success('Class retrieved successfully', classItem)
      );
    } catch (error) {
      logger.error('Error retrieving class', {
        error: error.message,
        userId: req.user.userId,
        classId: req.params.id
      });

      return res.status(error.status || 500).json(
        ApiResponse.error(error.message)
      );
    }
  }

  /**
   * Create new class
   */
  async createClass(req, res) {
    try {
      const classItem = await classService.createClass(req.body);

      logger.info('Class created successfully', {
        userId: req.user.userId,
        classId: classItem.id,
        className: classItem.class_name
      });

      return res.status(201).json(
        ApiResponse.success('Class created successfully', classItem)
      );
    } catch (error) {
      logger.error('Error creating class', {
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
   * Update class
   */
  async updateClass(req, res) {
    try {
      const { id } = req.params;
      const classItem = await classService.updateClass(id, req.body);

      logger.info('Class updated successfully', {
        userId: req.user.userId,
        classId: id
      });

      return res.status(200).json(
        ApiResponse.success('Class updated successfully', classItem)
      );
    } catch (error) {
      logger.error('Error updating class', {
        error: error.message,
        userId: req.user.userId,
        classId: req.params.id,
        data: req.body
      });

      return res.status(error.status || 500).json(
        ApiResponse.error(error.message)
      );
    }
  }

  /**
   * Delete class
   */
  async deleteClass(req, res) {
    try {
      const { id } = req.params;
      const result = await classService.deleteClass(id);

      logger.info('Class deleted successfully', {
        userId: req.user.userId,
        classId: id
      });

      return res.status(200).json(
        ApiResponse.success(result.message)
      );
    } catch (error) {
      logger.error('Error deleting class', {
        error: error.message,
        userId: req.user.userId,
        classId: req.params.id
      });

      return res.status(error.status || 500).json(
        ApiResponse.error(error.message)
      );
    }
  }

  /**
   * Get class statistics
   */
  async getClassStats(req, res) {
    try {
      const stats = await classService.getClassStats();

      logger.info('Class statistics retrieved successfully', {
        userId: req.user.userId
      });

      return res.status(200).json(
        ApiResponse.success('Class statistics retrieved successfully', stats)
      );
    } catch (error) {
      logger.error('Error retrieving class statistics', {
        error: error.message,
        userId: req.user.userId
      });

      return res.status(error.status || 500).json(
        ApiResponse.error(error.message)
      );
    }
  }

  /**
   * Get available teachers
   */
  async getAvailableTeachers(req, res) {
    try {
      const teachers = await classService.getAvailableTeachers();

      logger.info('Available teachers retrieved successfully', {
        userId: req.user.userId
      });

      return res.status(200).json(
        ApiResponse.success('Available teachers retrieved successfully', teachers)
      );
    } catch (error) {
      logger.error('Error retrieving available teachers', {
        error: error.message,
        userId: req.user.userId
      });

      return res.status(error.status || 500).json(
        ApiResponse.error(error.message)
      );
    }
  }

  /**
   * Assign student to class
   */
  async assignStudent(req, res) {
    try {
      const { id } = req.params;
      const { student_id } = req.body;

      const result = await classService.assignStudent(id, student_id);

      logger.info('Student assigned to class successfully', {
        userId: req.user.userId,
        classId: id,
        studentId: student_id
      });

      return res.status(200).json(
        ApiResponse.success('Student assigned to class successfully', result)
      );
    } catch (error) {
      logger.error('Error assigning student to class', {
        error: error.message,
        userId: req.user.userId,
        classId: req.params.id,
        data: req.body
      });

      return res.status(error.status || 500).json(
        ApiResponse.error(error.message)
      );
    }
  }

  /**
   * Remove student from class
   */
  async removeStudent(req, res) {
    try {
      const { id, studentId } = req.params;
      const result = await classService.removeStudent(id, studentId);

      logger.info('Student removed from class successfully', {
        userId: req.user.userId,
        classId: id,
        studentId
      });

      return res.status(200).json(
        ApiResponse.success(result.message)
      );
    } catch (error) {
      logger.error('Error removing student from class', {
        error: error.message,
        userId: req.user.userId,
        classId: req.params.id,
        studentId: req.params.studentId
      });

      return res.status(error.status || 500).json(
        ApiResponse.error(error.message)
      );
    }
  }
}

module.exports = new ClassController();
