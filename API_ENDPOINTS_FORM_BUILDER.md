# Google Forms Replica - API Endpoints Documentation

## Overview
Complete API endpoints for the Google Forms replica test builder system supporting 10 question types with advanced options.

## Question Types Supported
1. **mcq** - Multiple Choice (single select with radio buttons)
2. **checkbox** - Multiple select checkboxes
3. **dropdown** - Dropdown/Select list
4. **linearScale** - 1-10 rating scale with labels
5. **shortAnswer** - Single line text input
6. **paragraph** - Multi-line text input
7. **date** - Date picker
8. **time** - Time picker
9. **fileUpload** - File upload with type/size restrictions
10. **duration** - Duration input (hours/minutes)

---

## Test Endpoints

### Create Test
**POST** `/api/admin/tests`

```json
{
  "title": "Mathematics Quiz",
  "moduleId": "module-id",
  "description": "Test your math skills",
  "totalMarks": 100,
  "passingMarks": 50,
  "timeLimit": 60
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test created successfully",
  "data": {
    "_id": "test-id",
    "title": "Mathematics Quiz",
    "totalMarks": 100,
    "status": "draft"
  }
}
```

### Get Test with Questions
**GET** `/api/admin/tests/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "test-id",
    "title": "Mathematics Quiz",
    "description": "Test your math skills",
    "totalMarks": 100,
    "passingMarks": 50,
    "timeLimit": 60,
    "status": "draft",
    "questions": [...]
  }
}
```

### List Tests
**GET** `/api/admin/tests?moduleId=&status=draft&limit=10&skip=0`

---

## Question Endpoints

### Add Question to Test
**POST** `/api/admin/tests/:testId/questions`

#### Example 1: Multiple Choice Question
```json
{
  "questionText": "What is 2 + 2?",
  "description": "Basic arithmetic",
  "type": "mcq",
  "marks": 1,
  "isRequired": true,
  "options": [
    { "id": "opt-1", "text": "3", "isCorrect": false },
    { "id": "opt-2", "text": "4", "isCorrect": true },
    { "id": "opt-3", "text": "5", "isCorrect": false }
  ],
  "correctAnswer": "opt-2",
  "shuffleOptions": true,
  "showOtherOption": false
}
```

#### Example 2: Checkbox Question
```json
{
  "questionText": "Select all prime numbers",
  "type": "checkbox",
  "marks": 2,
  "isRequired": true,
  "options": [
    { "id": "opt-1", "text": "2", "isCorrect": true },
    { "id": "opt-2", "text": "4", "isCorrect": false },
    { "id": "opt-3", "text": "7", "isCorrect": true }
  ],
  "correctAnswers": ["opt-1", "opt-3"],
  "shuffleOptions": true
}
```

#### Example 3: Linear Scale Question
```json
{
  "questionText": "How satisfied are you with our service?",
  "type": "linearScale",
  "marks": 1,
  "isRequired": false,
  "scaleMin": 1,
  "scaleMax": 5,
  "scaleMinLabel": "Not Satisfied",
  "scaleMaxLabel": "Very Satisfied"
}
```

#### Example 4: Dropdown Question
```json
{
  "questionText": "Select your department",
  "type": "dropdown",
  "marks": 1,
  "options": [
    { "id": "opt-1", "text": "Engineering", "isCorrect": false },
    { "id": "opt-2", "text": "Sales", "isCorrect": false },
    { "id": "opt-3", "text": "Marketing", "isCorrect": false }
  ]
}
```

#### Example 5: Short Answer Question
```json
{
  "questionText": "What is your name?",
  "type": "shortAnswer",
  "marks": 1,
  "isRequired": true
}
```

#### Example 6: Paragraph Question
```json
{
  "questionText": "Describe your experience with the platform",
  "type": "paragraph",
  "marks": 5,
  "isRequired": false
}
```

#### Example 7: Date Question
```json
{
  "questionText": "When did you start?",
  "type": "date",
  "marks": 1,
  "isRequired": true
}
```

#### Example 8: Time Question
```json
{
  "questionText": "What time do you usually work?",
  "type": "time",
  "marks": 1
}
```

#### Example 9: File Upload Question
```json
{
  "questionText": "Upload your resume",
  "type": "fileUpload",
  "marks": 1,
  "isRequired": true,
  "allowedFileTypes": ["pdf", "doc", "docx"],
  "maxFileSize": 5
}
```

#### Example 10: Duration Question
```json
{
  "questionText": "How long did the task take?",
  "type": "duration",
  "marks": 1,
  "isRequired": false
}
```

**Response (for all questions):**
```json
{
  "success": true,
  "message": "Question added successfully",
  "data": {
    "_id": "question-id",
    "testId": "test-id",
    "questionText": "What is 2 + 2?",
    "type": "mcq",
    "order": 0,
    "marks": 1,
    "isRequired": true,
    "options": [...],
    "correctAnswer": "opt-2"
  }
}
```

### Update Question
**PUT** `/api/admin/tests/:testId/questions/:questionId`

Same payload structure as POST request. All fields are optional.

```json
{
  "questionText": "Updated question text",
  "marks": 2,
  "isRequired": true
}
```

### Delete Question
**DELETE** `/api/admin/tests/:testId/questions/:questionId`

**Response:**
```json
{
  "success": true,
  "message": "Question deleted successfully",
  "data": { "_id": "question-id" }
}
```

---

## Question Model Schema

```javascript
{
  testId: ObjectId,              // Reference to Test
  questionText: String,          // Question text (required)
  description: String,           // Help text/additional context
  type: String,                  // Question type (enum above)
  
  // Options/Answers
  options: [
    {
      id: String,               // Unique option ID
      text: String,             // Option text
      isCorrect: Boolean        // For MCQ/Checkbox
    }
  ],
  correctAnswer: String,        // For MCQ (option id)
  correctAnswers: [String],     // For Checkbox (array of option ids)
  
  // Scoring
  marks: Number,                // Points for this question
  order: Number,                // Display order
  
  // Settings
  isRequired: Boolean,          // Must answer this question
  questionImage: String,        // URL to question image
  shuffleOptions: Boolean,      // Randomize option order
  randomizeOrder: Boolean,      // Another randomization flag
  showOtherOption: Boolean,     // Add "Other" option
  
  // Linear Scale Settings
  scaleMin: Number,            // Default: 1
  scaleMax: Number,            // Default: 5
  scaleMinLabel: String,       // e.g., "Not Satisfied"
  scaleMaxLabel: String,       // e.g., "Very Satisfied"
  
  // File Upload Settings
  allowedFileTypes: [String],  // e.g., ['pdf', 'doc', 'docx']
  maxFileSize: Number,         // Max size in MB
  
  // General
  defaultValue: String,        // Default value for some types
  isMultiSelect: Boolean,      // For dropdown multi-select
  createdAt: Date              // Creation timestamp
}
```

---

## Error Responses

### Validation Error
```json
{
  "success": false,
  "message": "Question text and type are required",
  "error": "ValidationError"
}
```

### Not Found
```json
{
  "success": false,
  "message": "Test not found",
  "error": "NotFoundError"
}
```

### Server Error
```json
{
  "success": false,
  "message": "Failed to add question: [error details]",
  "error": "ServerError"
}
```

---

## Frontend Integration Examples

### Creating MCQ with Google Forms Builder Component
```javascript
import GoogleFormBuilder from './components/admin/GoogleFormBuilder';

function TestPage() {
  const handleSave = async (questions) => {
    for (const q of questions) {
      await fetch(`/api/admin/tests/${testId}/questions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(q)
      });
    }
  };

  return (
    <GoogleFormBuilder
      testId={testId}
      initialQuestions={initialQuestions}
      onSave={handleSave}
    />
  );
}
```

### Question Builder Component Features
- 10 question types with icon selectors
- Collapsible sections for each setting
- Real-time option management (add/remove/reorder)
- Question image upload support
- Linear scale configuration
- File upload restrictions
- Question shuffling and randomization
- Required field toggle
- Drag-and-drop question reordering

---

## Advanced Features

### Shuffle Options
When enabled, options for MCQ/Checkbox questions will be randomized for each respondent.

### Linear Scale
Customizable 1-10 scale with min/max labels for surveys and ratings.

### File Upload Validation
Restrict file types and size at the question level:
```json
{
  "allowedFileTypes": ["pdf", "jpg", "png"],
  "maxFileSize": 5
}
```

### Question Image Support
Each question can have an associated image:
```json
{
  "questionImage": "https://example.com/image.jpg"
}
```

### Required Questions
Mark questions as required to enforce respondent completion:
```json
{
  "isRequired": true
}
```

---

## Testing Checklist

- [ ] Create MCQ questions with multiple options
- [ ] Create checkbox questions with multiple correct answers
- [ ] Create dropdown questions
- [ ] Create linear scale with custom labels
- [ ] Create short answer questions
- [ ] Create paragraph questions
- [ ] Create date picker questions
- [ ] Create time picker questions
- [ ] Create file upload with restrictions
- [ ] Create duration questions
- [ ] Test question shuffling
- [ ] Test question image upload
- [ ] Test question reordering (move up/down)
- [ ] Test required field toggle
- [ ] Test save and reload functionality
- [ ] Test edit existing questions
- [ ] Test delete questions
- [ ] Verify all fields in database

---

## Batch Operations

### Save Multiple Questions at Once
The frontend GoogleFormBuilder component handles batch saving:
1. Deletes all existing questions for the test
2. Adds all new/updated questions in order
3. Maintains question order across updates

This ensures clean state management and prevents orphaned questions.
