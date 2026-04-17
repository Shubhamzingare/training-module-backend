# Training Module Platform - Implementation Plan

## Phase Overview

### Phase 1: MVP (Core Functionality)
- Basic file upload & content management
- Manual content entry (for now)
- Test management
- Dashboard & test attempt
- Basic performance tracking

### Phase 2: AI Integration
- Claude API integration for auto-generation
- Key points generation
- FAQ generation
- Test generation

### Phase 3: Advanced Features
- Batch management
- Advanced performance dashboard
- Admin analytics
- Notifications

---

## 1. Database Schema

### Users Table
```
- id (UUID)
- email (unique)
- name
- role (admin / team_member)
- department
- created_at
- updated_at
```

### Training Modules Table
```
- id (UUID)
- title
- description
- type (new_deployment / wati_training)
- pod_name (for deployments)
- status (active / inactive)
- source_file_url
- source_file_type (pdf / ppt / doc / figma)
- created_by (admin user id)
- created_at
- updated_at
```

### Module Content Table
```
- id (UUID)
- module_id (FK)
- key_points (JSON array)
- faqs (JSON array)
- raw_content (text)
- generated_by (claude / manual)
- created_at
```

### Tests Table
```
- id (UUID)
- module_id (FK)
- title
- total_marks
- status (draft / published)
- created_by (admin)
- created_at
- updated_at
```

### Questions Table
```
- id (UUID)
- test_id (FK)
- question_text
- type (mcq / descriptive)
- options (JSON - for MCQ)
- correct_answer (for MCQ)
- marks
- order
- created_at
```

### Test Attempts Table
```
- id (UUID)
- test_id (FK)
- user_id (FK)
- answers (JSON - user responses)
- marks_obtained
- status (in_progress / completed)
- attempted_at
- completed_at
```

### Batches Table
```
- id (UUID)
- name
- description
- type (new_hires / existing_team / specific_team)
- created_by (admin)
- created_at
```

### Batch Modules Table
```
- id (UUID)
- batch_id (FK)
- module_id (FK)
- assigned_at
```

### Batch Members Table
```
- id (UUID)
- batch_id (FK)
- user_id (FK)
- assigned_at
```

---

## 2. Backend API Endpoints

### Authentication
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
GET    /api/auth/me
```

### Modules (Admin)
```
POST   /api/admin/modules                 (Create/Upload)
GET    /api/admin/modules                 (List all)
GET    /api/admin/modules/:id             (Get one)
PUT    /api/admin/modules/:id             (Update)
DELETE /api/admin/modules/:id             (Delete)
PATCH  /api/admin/modules/:id/activate    (Activate)
PATCH  /api/admin/modules/:id/deactivate  (Deactivate)
```

### Content Generation (Admin)
```
POST   /api/admin/modules/:id/generate-content
       (Triggers Claude to generate key points, FAQs)
```

### Tests (Admin)
```
POST   /api/admin/tests                   (Create test)
GET    /api/admin/tests                   (List tests)
GET    /api/admin/tests/:id               (Get test details)
PUT    /api/admin/tests/:id               (Update test)
DELETE /api/admin/tests/:id               (Delete test)
PATCH  /api/admin/tests/:id/publish       (Publish test)

POST   /api/admin/tests/:id/questions     (Add question)
PUT    /api/admin/questions/:id           (Update question)
DELETE /api/admin/questions/:id           (Delete question)
```

### Batches (Admin)
```
POST   /api/admin/batches                 (Create batch)
GET    /api/admin/batches                 (List batches)
PUT    /api/admin/batches/:id             (Update batch)
POST   /api/admin/batches/:id/assign-modules
POST   /api/admin/batches/:id/add-members
```

### Modules (User)
```
GET    /api/modules                       (List active modules)
GET    /api/modules/:id                   (Get module details)
GET    /api/modules/:id/content           (Get key points & FAQs)
```

### Tests (User)
```
GET    /api/tests/:id                     (Get test)
POST   /api/tests/:id/attempt             (Start test attempt)
POST   /api/tests/:id/submit              (Submit test)
GET    /api/tests/:id/attempts            (Get user's attempts)
GET    /api/tests/:id/score/:attemptId    (Get attempt score)
```

### Performance (Admin)
```
GET    /api/admin/performance/users       (User-wise scores)
GET    /api/admin/performance/modules     (Module-wise scores)
GET    /api/admin/performance/batches     (Batch-wise scores)
GET    /api/admin/performance/export      (Export as CSV)
```

### Performance (User)
```
GET    /api/performance/my-scores         (User's scores)
GET    /api/performance/my-progress       (User's progress)
```

---

## 3. Frontend Pages & Components

### Admin Pages
1. **Dashboard**
   - Overview stats
   - Quick actions

2. **Modules Management**
   - Upload form
   - Module list
   - Edit/Delete options
   - Activate/Deactivate

3. **Content Review**
   - View auto-generated content
   - Edit key points & FAQs
   - Approve/reject generation

4. **Test Management**
   - Create/Edit tests
   - Add questions
   - Set marks
   - Publish tests

5. **Batch Management**
   - Create batches
   - Assign modules
   - Add members

6. **Performance Dashboard**
   - User-wise scorecard
   - Module-wise analytics
   - Batch-wise comparison
   - Export options

### User Pages
1. **Dashboard**
   - List of available modules
   - Filter by type
   - Search

2. **Module View**
   - Title & description
   - Key points
   - FAQs
   - View/Expand each item

3. **Test Page**
   - Test timer
   - Questions (MCQ or Descriptive)
   - Navigation between questions
   - Submit button

4. **Results Page**
   - Score obtained
   - Pass/Fail status
   - Attempt history

5. **My Performance**
   - List of tests taken
   - Scores
   - Progress chart

---

## 4. Claude Integration (Phase 2)

### Prompt Templates

#### Key Points Extraction
```
Extract 5-7 key points from the following training content.
Format as bullet points.
Keep each point concise (1-2 lines max).

Content:
[FILE_CONTENT]
```

#### FAQ Generation
```
Generate 5-10 frequently asked questions (FAQs) based on the following training content.
Format: Q: [Question]\nA: [Answer]

Content:
[FILE_CONTENT]
```

#### Test Question Generation
```
Create 10 test questions from the following training content.
Mix of MCQ (70%) and descriptive (30%).

For MCQ format:
Q: [Question]
Type: MCQ
Options:
A) [Option 1]
B) [Option 2]
C) [Option 3]
D) [Option 4]
Correct: [A/B/C/D]
Marks: 1

For Descriptive:
Q: [Question]
Type: Descriptive
Marks: 2

Content:
[FILE_CONTENT]
```

### API Integration Flow
```
1. User uploads file
2. Extract text from file
3. Call Claude API with extracted text
4. Parse Claude response
5. Store in database
6. Admin reviews & edits
7. Publish to platform
```

---

## 5. File Upload & Processing

### Supported Formats
- PDF (using pdfparse or pdf2json)
- PPT (using pptx library)
- DOC (using docx library)
- Figma (store link, fetch via Figma API later)

### Backend Library
```
npm install:
- multer (file upload)
- pdfparse (PDF extraction)
- pptx (PPT extraction)
- mammoth (DOC extraction)
- axios (HTTP requests)
- @anthropic-ai/sdk (Claude API)
```

---

## 6. Development Phases

### Phase 1: MVP (Week 1-2)
- [ ] Database setup (MongoDB/PostgreSQL)
- [ ] User authentication
- [ ] Module CRUD (Admin)
- [ ] Manual content entry
- [ ] Test CRUD (Admin)
- [ ] Test attempt (User)
- [ ] Basic dashboard (User)
- [ ] Basic performance view (Admin)

### Phase 2: AI Integration (Week 3)
- [ ] File upload & extraction
- [ ] Claude API integration
- [ ] Key points generation
- [ ] FAQ generation
- [ ] Test generation
- [ ] Admin review interface

### Phase 3: Advanced Features (Week 4+)
- [ ] Batch management
- [ ] Advanced performance dashboard
- [ ] Export functionality
- [ ] Notifications
- [ ] Search & filters

---

## 7. Technology Stack

**Backend:**
- Node.js + Express
- MongoDB (or PostgreSQL)
- Anthropic SDK (Claude API)
- Multer (file uploads)
- JWT (authentication)

**Frontend:**
- React
- Axios
- React Router
- CSS/Tailwind

**Deployment:**
- Vercel (frontend & backend)
- MongoDB Atlas (database)

---

## 8. Security Considerations

- JWT-based authentication
- Role-based access control (RBAC)
- File upload validation (size, type)
- Rate limiting on API calls
- Secure storage of API keys (env variables)
- Input sanitization

---

## 9. Success Metrics

- All core features working
- Auto-generation producing useful content
- Admin can manage modules & tests easily
- Users can complete training & tests
- Performance data accurately tracked

