const scheduleService = require('../services/scheduleService');
const { ApiResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

class ScheduleController {
  /**
   * Get all schedules
   */
  async getSchedules(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        class_id: req.query.class_id,
        teacher_id: req.query.teacher_id,
        subject_id: req.query.subject_id,
        day_of_week: req.query.day_of_week,
        room: req.query.room,
        sort_by: req.query.sort_by || 'day_of_week',
        sort_order: req.query.sort_order || 'asc'
      };

      const result = await scheduleService.getAllSchedules(options);

      logger.info('Schedules retrieved successfully', {
        userId: req.user.userId,
        query: options
      });

      return res.status(200).json(
        ApiResponse.success(
          'Schedules retrieved successfully',
          result.schedules,
          { pagination: result.pagination }
        )
      );
    } catch (error) {
      logger.error('Error in getSchedules:', error);
      return res.status(500).json(
        ApiResponse.error('Failed to retrieve schedules')
      );
    }
  }

  /**
   * Get schedule by ID
   */
  async getScheduleById(req, res) {
    try {
      const { id } = req.params;
      const schedule = await scheduleService.getScheduleById(id);

      logger.info('Schedule retrieved successfully', {
        userId: req.user.userId,
        scheduleId: id
      });

      return res.status(200).json(
        ApiResponse.success('Schedule retrieved successfully', schedule)
      );
    } catch (error) {
      logger.error('Error in getScheduleById:', error);
      
      if (error.message === 'Schedule not found') {
        return res.status(404).json(
          ApiResponse.error('Schedule not found')
        );
      }

      return res.status(500).json(
        ApiResponse.error('Failed to retrieve schedule')
      );
    }
  }

  /**
   * Create new schedule
   */
  async createSchedule(req, res) {
    try {
      const scheduleData = req.body;
      const schedule = await scheduleService.createSchedule(scheduleData);

      logger.info('Schedule created successfully', {
        userId: req.user.userId,
        scheduleId: schedule.id
      });

      return res.status(201).json(
        ApiResponse.success('Schedule created successfully', schedule)
      );
    } catch (error) {
      logger.error('Error in createSchedule:', error);

      if (error.message.includes('conflict')) {
        return res.status(409).json(
          ApiResponse.error(error.message)
        );
      }

      if (error.message.includes('not found')) {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }

      return res.status(500).json(
        ApiResponse.error('Failed to create schedule')
      );
    }
  }

  /**
   * Update schedule
   */
  async updateSchedule(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const schedule = await scheduleService.updateSchedule(id, updateData);

      logger.info('Schedule updated successfully', {
        userId: req.user.userId,
        scheduleId: id
      });

      return res.status(200).json(
        ApiResponse.success('Schedule updated successfully', schedule)
      );
    } catch (error) {
      logger.error('Error in updateSchedule:', error);

      if (error.message === 'Schedule not found') {
        return res.status(404).json(
          ApiResponse.error('Schedule not found')
        );
      }

      if (error.message.includes('conflict')) {
        return res.status(409).json(
          ApiResponse.error(error.message)
        );
      }

      return res.status(500).json(
        ApiResponse.error('Failed to update schedule')
      );
    }
  }

  /**
   * Delete schedule
   */
  async deleteSchedule(req, res) {
    try {
      const { id } = req.params;
      await scheduleService.deleteSchedule(id);

      logger.info('Schedule deleted successfully', {
        userId: req.user.userId,
        scheduleId: id
      });

      return res.status(200).json(
        ApiResponse.success('Schedule deleted successfully')
      );
    } catch (error) {
      logger.error('Error in deleteSchedule:', error);

      if (error.message === 'Schedule not found') {
        return res.status(404).json(
          ApiResponse.error('Schedule not found')
        );
      }

      return res.status(500).json(
        ApiResponse.error('Failed to delete schedule')
      );
    }
  }

  /**
   * Get schedules by class
   */
  async getSchedulesByClass(req, res) {
    try {
      const { classId } = req.params;
      const schedules = await scheduleService.getSchedulesByClass(classId);

      logger.info('Class schedules retrieved successfully', {
        userId: req.user.userId,
        classId
      });

      return res.status(200).json(
        ApiResponse.success('Class schedules retrieved successfully', schedules)
      );
    } catch (error) {
      logger.error('Error in getSchedulesByClass:', error);
      return res.status(500).json(
        ApiResponse.error('Failed to retrieve class schedules')
      );
    }
  }

  /**
   * Get schedules by teacher
   */
  async getSchedulesByTeacher(req, res) {
    try {
      const { teacherId } = req.params;
      const schedules = await scheduleService.getSchedulesByTeacher(teacherId);

      logger.info('Teacher schedules retrieved successfully', {
        userId: req.user.userId,
        teacherId
      });

      return res.status(200).json(
        ApiResponse.success('Teacher schedules retrieved successfully', schedules)
      );
    } catch (error) {
      logger.error('Error in getSchedulesByTeacher:', error);
      return res.status(500).json(
        ApiResponse.error('Failed to retrieve teacher schedules')
      );
    }
  }

  /**
   * Get weekly schedule
   */
  async getWeeklySchedule(req, res) {
    try {
      const filters = {
        class_id: req.query.class_id,
        teacher_id: req.query.teacher_id
      };

      const weeklySchedule = await scheduleService.getWeeklySchedule(filters);

      logger.info('Weekly schedule retrieved successfully', {
        userId: req.user.userId,
        filters
      });

      return res.status(200).json(
        ApiResponse.success('Weekly schedule retrieved successfully', weeklySchedule)
      );
    } catch (error) {
      logger.error('Error in getWeeklySchedule:', error);
      return res.status(500).json(
        ApiResponse.error('Failed to retrieve weekly schedule')
      );
    }
  }

  /**
   * Get schedule statistics
   */
  async getScheduleStatistics(req, res) {
    try {
      const statistics = await scheduleService.getScheduleStatistics();

      logger.info('Schedule statistics retrieved successfully', {
        userId: req.user.userId
      });

      return res.status(200).json(
        ApiResponse.success('Schedule statistics retrieved successfully', statistics)
      );
    } catch (error) {
      logger.error('Error in getScheduleStatistics:', error);
      return res.status(500).json(
        ApiResponse.error('Failed to retrieve schedule statistics')
      );
    }
  }

  /**
   * Check schedule conflicts
   */
  async checkScheduleConflicts(req, res) {
    try {
      const scheduleData = req.body;
      const excludeId = req.query.exclude_id;
      
      await scheduleService.checkScheduleConflicts(scheduleData, excludeId);

      logger.info('Schedule conflict check completed', {
        userId: req.user.userId,
        scheduleData
      });

      return res.status(200).json(
        ApiResponse.success('No schedule conflicts found')
      );
    } catch (error) {
      logger.error('Error in checkScheduleConflicts:', error);

      if (error.message.includes('conflict')) {
        return res.status(409).json(
          ApiResponse.error(error.message)
        );
      }

      return res.status(500).json(
        ApiResponse.error('Failed to check schedule conflicts')
      );
    }
  }
}

module.exports = new ScheduleController();
