const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

const MODULE_TYPES = {
  NEW_DEPLOYMENT: 'new_deployment',
  WATI_TRAINING: 'wati_training',
};

const PODS = [
  'Growth x Techpix Demo',
  'Experience Pod',
  'Mobile Pod',
  'Beetu Pod',
  'CRM Pod',
  'Growth Pod',
  'Platform & Link Pod',
  'Insights Pod',
  'Design Pod',
  'Dayzero Pod',
];

const MODULE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft',
};

const TEST_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
};

const QUESTION_TYPES = {
  MCQ: 'mcq',
  DESCRIPTIVE: 'descriptive',
};

const ATTEMPT_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SUBMITTED: 'submitted',
};

const BATCH_TYPES = {
  NEW_HIRES: 'new_hires',
  EXISTING_TEAM: 'existing_team',
  SPECIFIC_TEAM: 'specific_team',
};

module.exports = {
  ROLES,
  MODULE_TYPES,
  PODS,
  MODULE_STATUS,
  TEST_STATUS,
  QUESTION_TYPES,
  ATTEMPT_STATUS,
  BATCH_TYPES,
};
