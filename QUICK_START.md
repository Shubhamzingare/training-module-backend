# Quick Start Guide

## 30-Second Setup

1. **Copy environment config:**
   ```bash
   cp .env.example .env
   ```

2. **Add your Claude API key to .env:**
   ```bash
   CLAUDE_API_KEY=sk-ant-your-actual-key-here
   ```

3. **Start MongoDB:**
   ```bash
   mongod  # or configure MongoDB Atlas in .env
   ```

4. **Start server:**
   ```bash
   npm run dev
   ```

5. **Test it works:**
   ```bash
   curl http://localhost:5000/api/health
   ```

## Create a Training Module

### Via cURL (requires valid JWT token):

```bash
curl -X POST http://localhost:5000/api/admin/modules \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@training-document.pdf" \
  -F "title=New Feature Training" \
  -F "description=Complete guide to new feature" \
  -F "type=new_deployment" \
  -F "podName=Growth Pod"
```

### Response:
```json
{
  "success": true,
  "message": "Module created successfully. Content generation started.",
  "data": {
    "module": {
      "id": "507f1f77bcf86cd799439011",
      "title": "New Feature Training",
      "status": "draft",
      "contentGenerationStatus": "in_progress"
    }
  }
}
```

## Check Generated Content

```bash
curl -X GET http://localhost:5000/api/admin/modules/{moduleId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Supported File Types
- PDF (.pdf)
- Word Documents (.doc, .docx)
- PowerPoint (.ppt, .pptx)
- Max size: 10MB

## What Gets Generated Automatically

When you upload a file:

1. **Key Points** (5-7 main learning points)
2. **FAQs** (8-10 Q&A pairs)
3. **Test Questions** (10 questions: 70% MCQ, 30% descriptive)
4. **Test** (Auto-created with questions)

All generated with Claude AI.

## Environment Variables

**Required:**
- `CLAUDE_API_KEY` - Your Anthropic Claude API key
- `DB_URI` - MongoDB connection string

**Optional (with defaults):**
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (default: development)
- `JWT_SECRET` - JWT signing key
- `CORS_ORIGIN` - CORS origin (default: http://localhost:3000)

## Project Files

**Core Services:**
- `src/services/file/fileService.js` - File upload & validation
- `src/services/file/textExtractor.js` - Text extraction from files
- `src/services/ai/claudeService.js` - Claude AI integration
- `src/services/module/contentGeneratorService.js` - Orchestration
- `src/services/module/moduleService.js` - Module management

**API:**
- `src/controllers/admin/fileController.js` - Request handlers
- `src/routes/admin/modules.js` - Route definitions

**Middleware:**
- `src/middleware/fileUpload.js` - File upload handling

**Config:**
- `src/config/database.js` - MongoDB connection
- `src/config/env.js` - Environment variables

## Testing

Run the integration test suite:
```bash
node scripts/testIntegration.js
```

Expected output:
```
[INFO] ===== Integration Tests =====
[INFO] Running 8 tests...
[SUCCESS] PASSED: File Service - Filename Sanitization
[SUCCESS] PASSED: Text Extractor - Text Cleaning
[SUCCESS] PASSED: Claude Service - Initialization
...
[SUCCESS] Test Summary: Passed: 8/8
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/admin/modules` | Create module with file |
| GET | `/api/admin/modules` | List modules |
| GET | `/api/admin/modules/stats` | Get statistics |
| GET | `/api/admin/modules/{id}` | Get module + content |
| PUT | `/api/admin/modules/{id}` | Update module |
| DELETE | `/api/admin/modules/{id}` | Delete module |
| POST | `/api/admin/modules/{id}/generate-content` | Re-generate content |
| PUT | `/api/admin/modules/{id}/content` | Update content manually |

## Example Workflow

1. **Admin uploads training material:**
   ```bash
   POST /api/admin/modules (with PDF file)
   ```

2. **System automatically:**
   - Saves the file
   - Extracts text
   - Generates key points, FAQs, questions
   - Creates a test
   - Stores everything in DB

3. **Admin reviews content:**
   ```bash
   GET /api/admin/modules/{moduleId}
   ```

4. **Admin can edit if needed:**
   ```bash
   PUT /api/admin/modules/{moduleId}/content
   ```

5. **Admin publishes:**
   ```bash
   PUT /api/admin/modules/{moduleId}
   # Set status to "active"
   ```

## Troubleshooting

**"CLAUDE_API_KEY not configured"**
- Add valid key to .env: `CLAUDE_API_KEY=sk-ant-...`

**"MongoDB connection failed"**
- Ensure MongoDB is running: `mongod`
- Or configure MongoDB Atlas: `DB_URI=mongodb+srv://...`

**"File type not allowed"**
- Only PDF, PPT, PPTX, DOC, DOCX supported
- File must be under 10MB

**Content generation seems slow**
- Content generation happens asynchronously
- Check back after 10-30 seconds
- Use GET endpoint to check status

## Database Setup

**MongoDB Local:**
```bash
# Install MongoDB
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify connection
mongo mongodb://localhost:27017/training-module
```

**MongoDB Atlas (Cloud):**
1. Create account at mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Add to .env: `DB_URI=mongodb+srv://user:pass@cluster.mongodb.net/training-module`

## What's Next?

1. Review `/INTEGRATION_GUIDE.md` for detailed documentation
2. Check `/IMPLEMENTATION_SUMMARY.md` for technical details
3. Run `node scripts/testIntegration.js` to verify setup
4. Test API endpoints with real files
5. Integrate with frontend application

## Support

For detailed information, see:
- **API Documentation:** `INTEGRATION_GUIDE.md`
- **Technical Details:** `IMPLEMENTATION_SUMMARY.md`
- **Service Code:** `src/services/` directory
- **Test Suite:** `scripts/testIntegration.js`

---

**Ready to go!** Start the server and begin uploading training materials.
