# Training Module Platform - Project Structure

## Backend Structure (Node.js/Express)

```
training-module-backend/
│
├── src/
│   ├── config/
│   │   ├── database.js           (DB connection)
│   │   ├── env.js                (Environment variables)
│   │   └── constants.js          (App constants)
│   │
│   ├── middleware/
│   │   ├── auth.js               (JWT verification)
│   │   ├── roleCheck.js          (Admin/User role check)
│   │   ├── errorHandler.js       (Error handling)
│   │   ├── requestLogger.js      (Request logging)
│   │   └── fileUpload.js         (File upload validation)
│   │
│   ├── controllers/
│   │   ├── auth/
│   │   │   ├── authController.js
│   │   │   └── authValidator.js
│   │   ├── admin/
│   │   │   ├── moduleController.js
│   │   │   ├── testController.js
│   │   │   ├── batchController.js
│   │   │   ├── performanceController.js
│   │   │   └── validators.js
│   │   └── user/
│   │       ├── moduleController.js
│   │       ├── testController.js
│   │       ├── performanceController.js
│   │       └── validators.js
│   │
│   ├── services/
│   │   ├── auth/
│   │   │   └── authService.js    (Business logic)
│   │   ├── module/
│   │   │   ├── moduleService.js
│   │   │   ├── contentService.js
│   │   │   └── fileService.js    (File processing)
│   │   ├── test/
│   │   │   └── testService.js
│   │   ├── ai/
│   │   │   └── claudeService.js  (Claude integration)
│   │   ├── batch/
│   │   │   └── batchService.js
│   │   └── performance/
│   │       └── performanceService.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Module.js
│   │   ├── ModuleContent.js
│   │   ├── Test.js
│   │   ├── Question.js
│   │   ├── TestAttempt.js
│   │   ├── Batch.js
│   │   └── BatchMember.js
│   │
│   ├── routes/
│   │   ├── auth.js               (Authentication routes)
│   │   ├── admin/
│   │   │   ├── modules.js
│   │   │   ├── tests.js
│   │   │   ├── batches.js
│   │   │   └── performance.js
│   │   └── user/
│   │       ├── modules.js
│   │       ├── tests.js
│   │       └── performance.js
│   │
│   ├── utils/
│   │   ├── logger.js             (Logging utility)
│   │   ├── errorTypes.js         (Custom errors)
│   │   ├── validators.js         (Validation helpers)
│   │   ├── fileProcessors.js     (PDF, PPT, DOC processing)
│   │   └── helpers.js            (General helpers)
│   │
│   ├── uploads/                  (Temporary file storage)
│   │   └── .gitkeep
│   │
│   └── app.js                    (Express app setup)
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── .env.test
│
├── .env.example
├── .env
├── .gitignore
├── .eslintrc.js
├── .prettierrc.js
├── server.js                     (Entry point)
├── package.json
├── package-lock.json
├── IMPLEMENTATION_PLAN.md
└── README.md
```

---

## Frontend Structure (React)

```
training-module-frontend/
│
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.js
│   │   │   ├── Sidebar.js
│   │   │   ├── Navigation.js
│   │   │   ├── LoadingSpinner.js
│   │   │   ├── Modal.js
│   │   │   ├── Toast.js
│   │   │   └── ProtectedRoute.js
│   │   ├── auth/
│   │   │   ├── LoginForm.js
│   │   │   ├── RegisterForm.js
│   │   │   └── LogoutButton.js
│   │   ├── admin/
│   │   │   ├── modules/
│   │   │   │   ├── ModuleList.js
│   │   │   │   ├── ModuleForm.js
│   │   │   │   ├── FileUpload.js
│   │   │   │   ├── ContentReview.js
│   │   │   │   └── ModuleEditor.js
│   │   │   ├── tests/
│   │   │   │   ├── TestList.js
│   │   │   │   ├── TestForm.js
│   │   │   │   ├── QuestionEditor.js
│   │   │   │   └── TestPreview.js
│   │   │   ├── batches/
│   │   │   │   ├── BatchList.js
│   │   │   │   ├── BatchForm.js
│   │   │   │   └── BatchAssign.js
│   │   │   └── performance/
│   │   │       ├── PerformanceDashboard.js
│   │   │       ├── UserScores.js
│   │   │       ├── ModuleAnalytics.js
│   │   │       ├── BatchAnalytics.js
│   │   │       └── ScoreExport.js
│   │   ├── user/
│   │   │   ├── modules/
│   │   │   │   ├── ModuleList.js
│   │   │   │   ├── ModuleView.js
│   │   │   │   └── ModuleFilter.js
│   │   │   ├── tests/
│   │   │   │   ├── TestStart.js
│   │   │   │   ├── TestQuestion.js
│   │   │   │   ├── TestTimer.js
│   │   │   │   ├── TestSubmit.js
│   │   │   │   └── TestResult.js
│   │   │   └── performance/
│   │   │       ├── MyScores.js
│   │   │       └── MyProgress.js
│   │   └── dashboard/
│   │       ├── AdminDashboard.js
│   │       └── UserDashboard.js
│   │
│   ├── pages/
│   │   ├── LoginPage.js
│   │   ├── admin/
│   │   │   ├── AdminDashboard.js
│   │   │   ├── ModulesPage.js
│   │   │   ├── TestsPage.js
│   │   │   ├── BatchesPage.js
│   │   │   └── PerformancePage.js
│   │   └── user/
│   │       ├── UserDashboard.js
│   │       ├── ModulePage.js
│   │       ├── TestPage.js
│   │       └── ScoresPage.js
│   │
│   ├── services/
│   │   ├── api.js                (Axios instance)
│   │   ├── authService.js        (Auth API calls)
│   │   ├── moduleService.js      (Module API calls)
│   │   ├── testService.js        (Test API calls)
│   │   ├── batchService.js       (Batch API calls)
│   │   ├── performanceService.js (Performance API calls)
│   │   └── storageService.js     (LocalStorage management)
│   │
│   ├── context/
│   │   ├── AuthContext.js        (Auth state)
│   │   ├── UserContext.js        (User state)
│   │   └── ToastContext.js       (Toast notifications)
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useUser.js
│   │   ├── useFetch.js           (Data fetching)
│   │   ├── useForm.js            (Form handling)
│   │   └── useToast.js
│   │
│   ├── styles/
│   │   ├── globals.css           (Global styles)
│   │   ├── variables.css         (CSS variables)
│   │   ├── common.css
│   │   ├── admin.css
│   │   ├── user.css
│   │   └── responsive.css
│   │
│   ├── utils/
│   │   ├── helpers.js            (Utility functions)
│   │   ├── validators.js         (Form validators)
│   │   ├── constants.js          (App constants)
│   │   └── formatters.js         (Data formatting)
│   │
│   ├── App.js                    (Main app)
│   ├── App.css
│   ├── index.js                  (Entry point)
│   └── index.css
│
├── public/
│   ├── index.html
│   └── favicon.ico
│
├── .env.example
├── .env
├── .gitignore
├── .eslintrc.json
├── .prettierrc.json
├── package.json
├── README.md
└── vercel.json
```

---

## Key Improvements This Time

### Backend:
✅ **Clear separation of concerns**: Controllers → Services → Models  
✅ **Middleware layer**: Auth, role check, error handling  
✅ **Error handling**: Custom error types, consistent responses  
✅ **Logging**: Request/response logging  
✅ **File processing**: Dedicated file service  
✅ **Claude integration**: Separate AI service  
✅ **Validation**: Input validation at controller level  
✅ **Constants**: Centralized app constants  

### Frontend:
✅ **Component organization**: By feature (admin, user, common)  
✅ **Custom hooks**: Reusable logic  
✅ **Context API**: State management (Auth, Toast)  
✅ **Services layer**: API calls separated from components  
✅ **Protected routes**: Auth middleware  
✅ **Error boundaries**: Graceful error handling  
✅ **Responsive design**: Mobile-first approach  
✅ **Clean CSS**: Organized stylesheets  

---

## What We'll Build

1. **Clean API responses** (success/error format)
2. **Proper authentication** (JWT with refresh tokens)
3. **Role-based access control** (Admin vs User)
4. **File upload validation** (size, type checks)
5. **Error handling** (custom error messages)
6. **Request logging** (for debugging)
7. **Input validation** (server-side)
8. **Environment configuration** (.env setup)
9. **Testing structure** (ready for unit/integration tests)
10. **Documentation** (API docs, README)

