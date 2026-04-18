const Module = require('../../models/Module');
const Test = require('../../models/Test');

class StatusToggleService {
  /**
   * Toggle module status
   * If module is being activated, lock the associated test
   * If module is being locked/drafted, unlock the test
   */
  async toggleModuleStatus(moduleId) {
    try {
      const module = await Module.findById(moduleId);
      if (!module) {
        throw new Error('Module not found');
      }

      // Get the associated test
      const test = await Test.findOne({ moduleId });

      // New status logic
      let newModuleStatus;
      if (module.status === 'active') {
        newModuleStatus = 'locked';
      } else if (module.status === 'locked' || module.status === 'draft') {
        newModuleStatus = 'active';
      }

      // Update module status
      module.status = newModuleStatus;
      await module.save();

      // If module is now active, lock the test
      if (newModuleStatus === 'active' && test) {
        test.status = 'locked';
        await test.save();
      }

      // If module is now locked/draft, unlock the test (allow it to be active)
      if ((newModuleStatus === 'locked' || newModuleStatus === 'draft') && test) {
        if (test.status === 'locked') {
          test.status = 'draft'; // Don't automatically activate, just unlock
        }
      }

      return {
        module: module,
        test: test,
        message: `Module status changed to ${newModuleStatus}. ${test ? 'Associated test status updated.' : 'No associated test.'}`,
      };
    } catch (error) {
      throw new Error(`Error toggling module status: ${error.message}`);
    }
  }

  /**
   * Toggle test status
   * If test is being activated, lock the associated module
   * If test is being locked/drafted, unlock the module
   */
  async toggleTestStatus(testId) {
    try {
      const test = await Test.findById(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      // Get the associated module
      const module = await Module.findById(test.moduleId);

      // New status logic
      let newTestStatus;
      if (test.status === 'active') {
        newTestStatus = 'locked';
      } else if (test.status === 'locked' || test.status === 'draft') {
        newTestStatus = 'active';
      }

      // Update test status
      test.status = newTestStatus;
      await test.save();

      // If test is now active, lock the module
      if (newTestStatus === 'active' && module) {
        module.status = 'locked';
        await module.save();
      }

      // If test is now locked/draft, unlock the module (allow it to be active)
      if ((newTestStatus === 'locked' || newTestStatus === 'draft') && module) {
        if (module.status === 'locked') {
          module.status = 'draft'; // Don't automatically activate, just unlock
        }
      }

      return {
        test: test,
        module: module,
        message: `Test status changed to ${newTestStatus}. ${module ? 'Associated module status updated.' : 'No associated module.'}`,
      };
    } catch (error) {
      throw new Error(`Error toggling test status: ${error.message}`);
    }
  }

  /**
   * Get active module for a category
   * Returns the active module if one exists
   */
  async getActiveModuleByCategory(categoryId) {
    try {
      const activeModule = await Module.findOne({
        categoryId,
        status: 'active',
      });
      return activeModule;
    } catch (error) {
      throw new Error(`Error fetching active module: ${error.message}`);
    }
  }

  /**
   * Get active test for a module
   * Returns the active test if one exists
   */
  async getActiveTestByModule(moduleId) {
    try {
      const activeTest = await Test.findOne({
        moduleId,
        status: 'active',
      });
      return activeTest;
    } catch (error) {
      throw new Error(`Error fetching active test: ${error.message}`);
    }
  }
}

module.exports = new StatusToggleService();
