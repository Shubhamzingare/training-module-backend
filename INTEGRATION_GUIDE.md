# Integration Services Guide

## Overview

This document explains the newly implemented services for file upload handling, text extraction, and Claude AI integration for auto-generating training content.

## Services Implemented

### 1. File Service (`src/services/file/fileService.js`)

Handles file upload validation, storage, and management.

**Key Methods:**
- `uploadFile(file)` - Upload and validate file, save to `/src/uploads/`
- `deleteFile(filePath)` - Delete uploaded file
- `getFileInfo(filePath)` - Get file metadata
- `sanitizeFilename(filename)` - Make filenames safe for storage

**Supported File Types:**
- PDF
- PPT/PPTX (PowerPoint)
- DOC/DOCX (Word documents)

**Constraints:**
- Max file size: 10MB (configured in `.env`)
- Files stored with timestamp prefix: `{timestamp}-{sanitized-name}.{ext}`

### 2. Text Extractor Service (`src/services/file/textExtractor.js`)

Extracts text content from uploaded files.

**Key Methods:**
- `extractTextFromPDF(filePath)` - Extract from PDF
- `extractTextFromDocx(filePath)` - Extract from Word documents
- `extractTextFromPptx(filePath)` - Extract from PowerPoint (basic support)
- `extractText(filePath, fileType)` - Universal extraction method
- `cleanText(rawText)` - Clean and format extracted text

**Libraries Used:**
- `pdf-parse` - PDF extraction
- `mammoth` - Word document extraction
- PPTX: Placeholder implementation (see note below)

**Note on PPTX Support:**
Currently, PPTX extraction returns placeholder text. For production use, consider:
- Using `office-parser` library
- Converting via LibreOffice
- Using `pptxparse` library

### 3. Claude AI Service (`src/services/ai/claudeService.js`)

Generates training content using Claude AI API.

**Configuration:**
- API Key: `CLAUDE_API_KEY` env variable
- Model: `claude-3-5-sonnet-20241022`
- Temperature: 0.7 (for consistency)
- Max retries: 3 with exponential backoff
- Timeout: 30 seconds

**Key Methods:**

#### Generate Key Points
```javascript
const keyPoints = await ClaudeService.generateKeyPoints(content);
// Returns: Array of 5-7 key learning points (strings)
```

#### Generate FAQs
```javascript
const faqs = await ClaudeService.generateFAQs(content);
// Returns: Array of {question, answer} objects
```

#### Generate Test Questions
```javascript
const questions = await ClaudeService.generateTestQuestions(content);
// Returns: Array of question objects with structure:
// {
//   questionText: string,
//   type: 'mcq' | 'descriptive',
//   options: [{text: string, isCorrect: boolean}] (for MCQ only),
//   marks: number
// }
```

**Error Handling:**
- Automatic retry on rate limit (429), server error (500), or service unavailable (503)
- Exponential backoff: 1s, 2s, 4s
- Fallback responses if generation fails
- Comprehensive error logging

### 4. Module Content Generator (`src/services/module/contentGeneratorService.js`)

Orchestrates the complete content generation workflow.

**Key Methods:**
- `generateAndSaveContent(moduleId, filePath, fileType)` - Full pipeline
- `generateModuleContent(moduleId, rawText)` - Generate all content types
- `saveModuleContent(moduleId, rawText, generatedContent)` - Save to database
- `createTestWithQuestions(moduleId, questions)` - Auto-create test
- `updateModuleContent(moduleId, {keyPoints, faqs})` - Manual updates

**Workflow:**
1. Extract text from uploaded file
2. Generate key points using Claude
3. Generate FAQs using Claude
4. Generate test questions using Claude
5. Save ModuleContent to database
6. Auto-create Test with generated questions

### 5. Module Service (`src/services/module/moduleService.js`)

Manages module CRUD operations and content orchestration.

**Key Methods:**
- `createModuleWithFile(moduleData, file, userId)` - Create module with upload
- `generateModuleContent(moduleId)` - Trigger content generation
- `updateModuleStatus(moduleId, status)` - Update status (draft/active/inactive)
- `getModuleWithContent(moduleId)` - Get module + content
- `deleteModule(moduleId)` - Delete module, content, and file
- `listModules(query)` - List with pagination and filtering
- `getModuleStats()` - Get statistics by status/type

### 6. File Upload Middleware (`src/middleware/fileUpload.js`)

Express middleware for file upload handling.

**Configuration:**
- Max file size: 10MB (from env)
- Memory storage (not disk-based)
- File field name: `file`
- Validates MIME types and extensions

**Error Handling:**
- Oversized file: 413 Payload Too Large
- Invalid type: 400 Bad Request
- No file: 400 Bad Request
- Upload errors: 500 Internal Server Error

## API Endpoints

### Admin Module Management

All endpoints require authentication and admin role.

#### Create Module with File Upload
```
POST /api/admin/modules
Content-Type: multipart/form-data

Fields:
- file: (required, binary) The training material file
- title: (required, string) Module title
- description: (optional, string) Module description
- type: (required, string) 'new_deployment' or 'wati_training'
- podName: (optional, string) Pod name for new_deployment type

Response:
{
  "success": true,
  "message": "Module created successfully. Content generation started.",
  "data": {
    "module": {
      "id": "...",
      "title": "...",
      "type": "...",
      "status": "draft",
      "sourceFileUrl": "/uploads/...",
      "sourceFileType": "pdf",
      "createdAt": "..."
    },
    "file": {
      "filename": "...",
      "path": "/uploads/...",
      "size": 1234567
    },
    "contentGenerationStatus": "in_progress"
  }
}
```

#### Trigger Content Generation
```
POST /api/admin/modules/{moduleId}/generate-content

Response:
{
  "success": true,
  "message": "Content generation completed",
  "data": {
    "moduleContent": {
      "id": "...",
      "moduleId": "...",
      "keyPoints": [...],
      "faqs": [...],
      "generatedBy": "claude"
    },
    "testCreated": true,
    "questionsCount": 10
  }
}
```

#### Get Module with Content
```
GET /api/admin/modules/{moduleId}

Response:
{
  "success": true,
  "data": {
    "module": { ... },
    "content": {
      "keyPoints": [...],
      "faqs": [...],
      "rawContent": "..."
    }
  }
}
```

#### List Modules
```
GET /api/admin/modules?page=1&limit=10&status=draft&type=new_deployment

Query Parameters:
- page: (optional, default: 1) Page number
- limit: (optional, default: 10) Items per page
- status: (optional) Filter by status
- type: (optional) Filter by type
- createdBy: (optional) Filter by creator ID

Response:
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "pages": 5
  }
}
```

#### Update Module
```
PUT /api/admin/modules/{moduleId}

Body:
{
  "title": "...",
  "description": "...",
  "type": "...",
  "podName": "...",
  "status": "active"
}
```

#### Update Module Content (Manual)
```
PUT /api/admin/modules/{moduleId}/content

Body:
{
  "keyPoints": ["point 1", "point 2", ...],
  "faqs": [
    {"question": "Q1?", "answer": "A1."},
    {"question": "Q2?", "answer": "A2."}
  ]
}
```

#### Delete Module
```
DELETE /api/admin/modules/{moduleId}

Response:
{
  "success": true,
  "message": "Module deleted successfully"
}
```

#### Get Module Statistics
```
GET /api/admin/modules/stats

Response:
{
  "success": true,
  "data": {
    "byStatus": [
      {"_id": "draft", "count": 5},
      {"_id": "active", "count": 3}
    ],
    "byType": [
      {"_id": "new_deployment", "count": 6},
      {"_id": "wati_training", "count": 2}
    ],
    "total": 8
  }
}
```

## Environment Variables

Add to `.env` file:

```env
# Claude API
CLAUDE_API_KEY=sk-ant-your-api-key-here
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# File Upload
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR=./src/uploads

# Allowed File Types
ALLOWED_FILE_TYPES=pdf,ppt,pptx,doc,docx

# Database
DB_URI=mongodb://localhost:27017/training-module

# Server
NODE_ENV=development
PORT=5000
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
```

## Testing the Integration

### 1. Start MongoDB
```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas connection string in .env
```

### 2. Start Server
```bash
npm run dev
```

### 3. Create Module with File Upload
```bash
curl -X POST http://localhost:5000/api/admin/modules \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -F "file=@training-material.pdf" \
  -F "title=New Feature Training" \
  -F "description=Learn about our new feature" \
  -F "type=new_deployment" \
  -F "podName=Growth Pod"
```

### 4. Check Generation Status
```bash
curl -X GET http://localhost:5000/api/admin/modules/{moduleId} \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

## Error Handling

All errors follow standard format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400
  }
}
```

Common Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `413` - Payload Too Large (file size exceeded)
- `500` - Server Error

## Logging

All services use the logger utility with color-coded output:
- `[INFO]` - Blue - General information
- `[SUCCESS]` - Green - Successful operations
- `[WARN]` - Yellow - Warnings
- `[ERROR]` - Red - Errors
- `[DEBUG]` - Gray - Debug info (dev only)

Example log output:
```
[INFO] Creating module with file upload...
[SUCCESS] File uploaded successfully: 1713456789-training.pdf
[INFO] Extracting text from file (pdf)
[SUCCESS] PDF text extracted successfully (5234 characters)
[INFO] Generating key points...
[SUCCESS] Claude API call successful
[SUCCESS] Generated 6 key points
```

## Database Models

### Module
- `title` - Module title
- `description` - Description
- `type` - 'new_deployment' or 'wati_training'
- `podName` - Pod name (for new_deployment)
- `sourceFileUrl` - Path to uploaded file
- `sourceFileType` - File extension (pdf, docx, etc.)
- `status` - 'draft', 'active', or 'inactive'
- `createdBy` - User ID of creator
- `createdAt`, `updatedAt` - Timestamps

### ModuleContent
- `moduleId` - Reference to Module
- `keyPoints` - Array of key learning points
- `faqs` - Array of {question, answer} objects
- `rawContent` - Original extracted text
- `generatedBy` - 'claude' or 'manual'
- `createdAt`, `updatedAt` - Timestamps

### Test
- `title` - Test title
- `moduleId` - Reference to Module
- `description` - Description
- `totalMarks` - Total marks
- `status` - 'draft', 'published', or 'archived'
- `createdBy` - User ID of creator

### Question
- `testId` - Reference to Test
- `questionText` - Question text
- `type` - 'mcq' or 'descriptive'
- `options` - MCQ options with isCorrect flag
- `correctAnswer` - Correct answer
- `marks` - Question marks
- `order` - Question order in test

## Production Considerations

1. **API Key Security**
   - Store `CLAUDE_API_KEY` in secure environment variables
   - Rotate keys regularly
   - Monitor API usage

2. **File Storage**
   - Consider cloud storage (AWS S3, GCS) for production
   - Implement file size quotas
   - Clean up old files periodically

3. **Rate Limiting**
   - Implement request rate limiting
   - Monitor Claude API rate limits
   - Queue content generation for large batches

4. **Monitoring**
   - Log all API calls for debugging
   - Monitor extraction success rates
   - Track Claude API errors and costs

5. **PPTX Support**
   - Implement proper PPTX extraction for production
   - Consider OCR for image-heavy presentations

6. **Content Review**
   - Require manual review before publishing
   - Allow editing of auto-generated content
   - Track content quality metrics

## Troubleshooting

### Claude API Errors
- Check CLAUDE_API_KEY is valid
- Verify API quota/rate limits
- Check network connectivity

### File Upload Errors
- Verify file is supported type
- Check file size is under 10MB
- Ensure /src/uploads directory is writable

### Text Extraction Issues
- Verify file is not corrupted
- Check file format matches extension
- Check for scanned PDFs (may need OCR)

### Database Connection
- Verify MongoDB is running
- Check DB_URI connection string
- Ensure user has proper permissions

## Next Steps

1. Implement full PPTX support
2. Add OCR for scanned documents
3. Implement content review workflow
4. Add cloud storage integration
5. Create user-facing content viewing endpoints
6. Add content version history
7. Implement batch processing for multiple files
8. Add analytics for content effectiveness
