const statusToggleService = require('../../services/admin/statusToggleService');

class StatusToggleController {
  /**
   * PATCH /api/admin/modules/:id/toggle-status
   * Toggle module status (active <-> locked)
   */
  async toggleModuleStatus(req, res, next) {
    try {
      const { id } = req.params;
      const result = await statusToggleService.toggleModuleStatus(id);

      res.json({
        success: true,
        message: result.message,
        data: {
          module: result.module,
          test: result.test,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/tests/:id/toggle-status
   * Toggle test status (active <-> locked)
   */
  async toggleTestStatus(req, res, next) {
    try {
      const { id } = req.params;
      const result = await statusToggleService.toggleTestStatus(id);

      res.json({
        success: true,
        message: result.message,
        data: {
          test: result.test,
          module: result.module,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StatusToggleController();
