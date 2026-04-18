# Google Forms Replica - Backend Implementation

## Database Schema Updates

### Question Model Changes

File: `/src/models/Question.js`

#### Original Fields (Kept)
```javascript
{
  testId: ObjectId (required),
  questionText: String (required),
  type: String (enum: ['mcq', 'checkbox', 'dropdown', 'linearScale', 'shortAnswer', 'paragraph', 'date', 'time', 'fileUpload', 'duration', 'descriptive']),
  options: Array,
  correctAnswer: String,
  marks: Number,
  order: Number,
  createdAt: Date
}
```

#### New Fields Added
```javascript
{
  // Question metadata
  description: String,              // Help text for the question
  
  // Visual options
  questionImage: String,            // URL to question image
  
  // Question settings
  isRequired: Boolean,              // Must answer this question
  shuffleOptions: Boolean,          // Randomize option order
  randomizeOrder: Boolean,          // Additional randomization flag
  showOtherOption: Boolean,         // Show "Other" option for selections
  
  // Linear scale specific fields
  scaleMin: Number,                 // Minimum scale value (default: 1)
  scaleMax: Number,                 // Maximum scale value (default: 5)
  scaleMinLabel: String,            // Label for minimum value
  scaleMaxLabel: String,            // Label for maximum value
  
  // Multi-select support for checkboxes
  correctAnswers: [String],         // Array of correct option IDs for checkbox
  
  // File upload specific fields
  allowedFileTypes: [String],       // e.g., ['pdf', 'doc', 'docx']
  maxFileSize: Number,              // Maximum file size in MB
  
  // Multi-select for dropdowns
  isMultiSelect: Boolean,           // Allow multiple selections in dropdown
  
  // Default values
  defaultValue: String              // Default value for input types
}
```

### Index Additions
```javascript
questionSchema.index({ testId: 1, order: 1 });
```

---

## API Controller Updates

### File: `/src/controllers/admin/testController.js`

#### Updated addQuestion Method

**Method Signature:**
```javascript
async addQuestion(req, res, next)
```

**Request Body (All fields shown, many optional):**
```javascript
{
  // Required
  questionText: String,
  type: String,
  
  // Optional but recommended
  description: String,              // Help text
  marks: Number,                    // Default: 1
  isRequired: Boolean,              // Default: false
  order: Number,                    // Auto-assigned if not provided
  
  // For MCQ/Checkbox/Dropdown
  options: [
    {
      id: String,                   // Unique option ID
      text: String,                 // Option text
      isCorrect: Boolean            // Mark correct option(s)
    }
  ],
  correctAnswer: String,            // For MCQ (option id)
  correctAnswers: [String],         // For Checkbox (array of ids)
  shuffleOptions: Boolean,
  showOtherOption: Boolean,
  
  // For Linear Scale
  scaleMin: Number,                 // Default: 1
  scaleMax: Number,                 // Default: 5
  scaleMinLabel: String,            // e.g., "Disagree"
  scaleMaxLabel: String,            // e.g., "Agree"
  
  // For File Upload
  allowedFileTypes: [String],       // ['pdf', 'doc', 'docx']
  maxFileSize: Number,              // Size in MB
  
  // Visual
  questionImage: String,            // Image URL
  
  // Other
  defaultValue: String,
  isMultiSelect: Boolean
}
```

**Response:**
```javascript
{
  success: true,
  message: "Question added successfully",
  data: {
    _id: ObjectId,
    testId: ObjectId,
    questionText: String,
    type: String,
    // ... all other fields
  }
}
```

**Error Handling:**
```javascript
// ValidationError
{
  "success": false,
  "message": "Question text and type are required",
  "error": "ValidationError"
}

// ServerError
{
  "success": false,
  "message": "Failed to add question: [error details]",
  "error": "ServerError"
}
```

#### Updated updateQuestion Method

Same payload structure as addQuestion. All fields are optional - only provided fields are updated.

```javascript
async updateQuestion(req, res, next)
```

**Allowed Update Fields:**
- questionText
- description
- type
- options
- correctAnswer
- correctAnswers
- marks
- order
- isRequired
- questionImage
- shuffleOptions
- showOtherOption
- scaleMin
- scaleMax
- scaleMinLabel
- scaleMaxLabel
- allowedFileTypes
- maxFileSize
- defaultValue
- isMultiSelect

---

## Service Layer Updates

### File: `/src/services/test/testService.js`

#### Updated addQuestion Method

**Changes:**
1. Accepts all new question type fields
2. Auto-generates order if not provided
3. Sets default values for optional fields
4. Returns complete question object with all fields

**Implementation:**
```javascript
async addQuestion(testId, questionData) {
  const {
    questionText,
    description,
    type,
    options,
    correctAnswer,
    correctAnswers,
    marks,
    order,
    isRequired,
    questionImage,
    shuffleOptions,
    showOtherOption,
    scaleMin,
    scaleMax,
    scaleMinLabel,
    scaleMaxLabel,
    allowedFileTypes,
    maxFileSize,
  } = questionData;

  // Validation
  if (!questionText || !type) {
    throw new ValidationError('Question text and type are required');
  }

  // Auto-order calculation
  let questionOrder = order;
  if (questionOrder === undefined) {
    const lastQuestion = await Question.findOne({ testId }).sort('-order');
    questionOrder = (lastQuestion?.order || 0) + 1;
  }

  // Create and save question
  const question = new Question({
    testId,
    questionText,
    description: description || '',
    type,
    options,
    correctAnswer,
    correctAnswers,
    marks: marks || 1,
    order: questionOrder,
    isRequired: isRequired || false,
    questionImage: questionImage || null,
    shuffleOptions: shuffleOptions || false,
    showOtherOption: showOtherOption || false,
    scaleMin: scaleMin || 1,
    scaleMax: scaleMax || 5,
    scaleMinLabel: scaleMinLabel || '',
    scaleMaxLabel: scaleMaxLabel || '',
    allowedFileTypes: allowedFileTypes || [],
    maxFileSize: maxFileSize || 10,
  });

  await question.save();
  return question;
}
```

#### Updated updateQuestion Method

**Changes:**
1. Now accepts all new question fields
2. Updates only provided fields
3. Maintains existing values for unspecified fields

**Allowed Update Fields:**
All 18+ new fields are now accepted in updates.

---

## Question Type Specifications

### Type: 'mcq' (Multiple Choice)
- **Options:** Required, minimum 2
- **Correct Answer:** Required (single option ID)
- **Features:** 
  - shuffleOptions supported
  - showOtherOption supported
  - Radio button interface

### Type: 'checkbox'
- **Options:** Required, minimum 2
- **Correct Answers:** Required (array of option IDs)
- **Features:**
  - shuffleOptions supported
  - showOtherOption supported
  - Multiple correct answers

### Type: 'dropdown'
- **Options:** Required, minimum 2
- **Correct Answer:** Not required
- **Features:**
  - showOtherOption supported
  - isMultiSelect supported
  - Space-efficient

### Type: 'linearScale'
- **Options:** Not used
- **Scale Range:** scaleMin (1-10), scaleMax (1-10)
- **Features:**
  - Optional: scaleMinLabel, scaleMaxLabel
  - No correct answer needed

### Type: 'shortAnswer'
- **Options:** Not used
- **Correct Answer:** Not required
- **Features:**
  - Single line text
  - Can set as required
  - No validation in form

### Type: 'paragraph'
- **Options:** Not used
- **Correct Answer:** Not required
- **Features:**
  - Multi-line text
  - Can set as required
  - For detailed responses

### Type: 'date'
- **Options:** Not used
- **Correct Answer:** Not required
- **Features:**
  - Calendar picker
  - YYYY-MM-DD format
  - Can set as required

### Type: 'time'
- **Options:** Not used
- **Correct Answer:** Not required
- **Features:**
  - Time picker
  - HH:MM format
  - Can set as required

### Type: 'fileUpload'
- **Options:** Not used
- **File Restrictions:**
  - allowedFileTypes: Array of file extensions
  - maxFileSize: Maximum size in MB
- **Features:**
  - Can set as required
  - Type and size validation

### Type: 'duration'
- **Options:** Not used
- **Correct Answer:** Not required
- **Features:**
  - Hours and minutes input
  - HH:MM format
  - Can set as required

---

## Validation Rules

### All Questions
```javascript
{
  questionText: 'required, non-empty',
  type: 'required, must be valid enum value',
  marks: 'optional, default 1, must be positive integer',
  order: 'optional, auto-assigned if not provided',
  isRequired: 'optional, default false, boolean'
}
```

### MCQ Specific
```javascript
{
  options: 'required, minimum 2 options',
  correctAnswer: 'required, must match option id',
  shuffleOptions: 'optional, boolean',
  showOtherOption: 'optional, boolean'
}
```

### Checkbox Specific
```javascript
{
  options: 'required, minimum 2 options',
  correctAnswers: 'required, array of option ids',
  shuffleOptions: 'optional, boolean',
  showOtherOption: 'optional, boolean'
}
```

### File Upload Specific
```javascript
{
  allowedFileTypes: 'optional, array of extensions',
  maxFileSize: 'optional, default 10, positive integer (MB)'
}
```

### Linear Scale Specific
```javascript
{
  scaleMin: 'optional, default 1, 1-10',
  scaleMax: 'optional, default 5, 1-10',
  scaleMinLabel: 'optional, string',
  scaleMaxLabel: 'optional, string'
}
```

---

## Batch Operations

### Recommended Flow for Saving Multiple Questions

1. **Delete existing questions:**
```javascript
// For each existing question
DELETE /api/admin/tests/:testId/questions/:questionId
```

2. **Add new questions:**
```javascript
// For each new question
POST /api/admin/tests/:testId/questions
Body: {question data}
```

**Reason:** Ensures clean state and prevents orphaned questions

---

## Testing Data

### Example MCQ
```javascript
{
  questionText: "What is 2 + 2?",
  description: "Basic arithmetic",
  type: "mcq",
  marks: 1,
  isRequired: true,
  options: [
    { id: "1", text: "3", isCorrect: false },
    { id: "2", text: "4", isCorrect: true },
    { id: "3", text: "5", isCorrect: false }
  ],
  correctAnswer: "2",
  shuffleOptions: true
}
```

### Example Linear Scale
```javascript
{
  questionText: "How satisfied are you?",
  type: "linearScale",
  marks: 1,
  isRequired: false,
  scaleMin: 1,
  scaleMax: 5,
  scaleMinLabel: "Not Satisfied",
  scaleMaxLabel: "Very Satisfied"
}
```

### Example File Upload
```javascript
{
  questionText: "Upload your resume",
  type: "fileUpload",
  marks: 1,
  isRequired: true,
  allowedFileTypes: ["pdf", "doc", "docx"],
  maxFileSize: 5
}
```

---

## Migration from Old Schema

If migrating from old Question schema:

```javascript
// Old questions automatically work
// New fields default to sensible values
// No data loss on upgrade
```

---

## Performance Considerations

1. **Indexing:** Questions are indexed by testId and order for fast sorting
2. **Query Optimization:** Use population selectively for related data
3. **Batch Operations:** Recommended for multiple question changes
4. **Pagination:** Implement for tests with 100+ questions

---

## Security Considerations

1. **Authorization:** Ensure only admins can create/modify questions
2. **Input Validation:** All inputs validated on server side
3. **File Type Validation:** Validate file types server-side during upload
4. **File Size Limits:** Enforce maxFileSize on server
5. **Question Isolation:** Questions belong to specific test, prevent cross-test access

---

## Error Codes

| Error | Status | Message |
|-------|--------|---------|
| ValidationError | 400 | Question text and type are required |
| ValidationError | 400 | Invalid question type |
| NotFoundError | 404 | Test not found |
| NotFoundError | 404 | Question not found |
| ServerError | 500 | Failed to add question |
| ServerError | 500 | Failed to update question |
| ServerError | 500 | Failed to delete question |

---

## Logging

All operations are logged:
```javascript
logger.success(`Question added: ${question._id}`);
logger.success(`Question updated: ${questionId}`);
logger.success(`Question deleted: ${questionId}`);
```

---

## Next Steps for Phase 2

1. Implement question display/rendering component
2. Implement question response collection
3. Implement answer validation and scoring
4. Add question banking and templating
5. Add advanced analytics and reporting
