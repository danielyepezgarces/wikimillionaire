# Report Feature Documentation

## Overview

This document describes the implementation of the answer reporting feature in WikiMillionaire, which allows users to report incorrect answers. The feature is currently in a "Coming Soon" phase with the basic structure in place for future Wikidata integration.

## Current Implementation

### Components

1. **Types** (`/types/report.ts`)
   - `ReportReason`: Enum for categorizing report types
   - `ReportStatus`: Tracks report lifecycle
   - `AnswerReport`: Complete report structure
   - `ReportSubmission`: Data required to submit a report

2. **Database** (`/migrations/create_answer_reports_table.sql`)
   - `answer_reports` table stores all submitted reports
   - Includes indexes for efficient querying
   - Supports status tracking and future Wikidata URL storage

3. **API Endpoint** (`/app/api/reports/route.ts`)
   - `POST /api/reports`: Submit new report
   - `GET /api/reports`: Retrieve reports (admin/future use)
   - Validates input and handles errors gracefully

4. **Business Logic** (`/lib/reports.ts`)
   - `saveReport()`: Stores report in database
   - `getReports()`: Retrieves reports with filtering
   - `generateWikidataReportUrl()`: Placeholder for Wikidata integration
   - LocalStorage fallback for offline/database failure scenarios

5. **UI Component** (`/components/report-answer-dialog.tsx`)
   - Dialog for submitting reports
   - Shows "Coming Soon" alert for Wikidata integration
   - Validates user input before submission

6. **Game Integration** (`/app/play/page.tsx`)
   - Report button appears after answer is revealed
   - Integrates with existing game state
   - Shows only when appropriate (after answering)

### User Flow

1. User plays the game and answers a question
2. After seeing the correct answer, a "Report" button appears
3. User clicks the button to open the report dialog
4. User sees a "Coming Soon" notice about Wikidata integration
5. User fills out the report form:
   - Question is pre-filled
   - Selected and correct answers are shown
   - User selects a reason (incorrect_answer, outdated_data, ambiguous_question, other)
   - User optionally adds a description
6. Report is submitted and stored in the database
7. User receives confirmation toast

## Database Schema

```sql
CREATE TABLE answer_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id VARCHAR(255),           -- Wikidata entity ID if available
  question TEXT NOT NULL,             -- Question text
  selected_answer TEXT NOT NULL,      -- User's selected answer
  correct_answer TEXT NOT NULL,       -- Answer marked as correct
  reason ENUM(...) NOT NULL,          -- Report reason
  description TEXT,                   -- Optional details
  username VARCHAR(255) NOT NULL,     -- Reporter username
  user_id VARCHAR(255),               -- Reporter user ID if authenticated
  timestamp DATETIME NOT NULL,        -- When report was submitted
  status ENUM(...) DEFAULT 'pending', -- Report status
  wikidata_url TEXT,                  -- Future: link to Wikidata report
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Future Wikidata Integration

### Phase 1: Current Implementation ✅
- ✅ Basic report submission and storage
- ✅ UI with "Coming Soon" notice
- ✅ Local database storage
- ✅ Report categorization
- ✅ User identification

### Phase 2: Wikidata Report Generation (Future)

#### Integration Points

1. **Wikidata OAuth Authentication**
   - Use existing Wikimedia OAuth for authenticated reports
   - Link reports to user's Wikidata account

2. **Automatic Report Creation**
   - Use Wikidata API to create discussion topics
   - Format: `https://www.wikidata.org/w/index.php?title=Wikidata:Project_chat&action=edit&section=new`
   - Template for reports:
     ```
     == Incorrect answer reported in WikiMillionaire ==
     
     * Question: {{question}}
     * Entity: {{wikidata_entity}}
     * Reported answer: {{correct_answer}}
     * User's answer: {{selected_answer}}
     * Reason: {{reason}}
     * Details: {{description}}
     * Reported by: [[User:{{username}}]]
     
     This report was automatically generated from WikiMillionaire.
     ```

3. **Implementation Steps**
   ```typescript
   async function createWikidataReport(report: AnswerReport): Promise<string> {
     // 1. Authenticate with Wikidata API using OAuth
     const token = await getWikidataEditToken()
     
     // 2. Format report content
     const content = formatReportForWikidata(report)
     
     // 3. Create new discussion topic
     const response = await fetch('https://www.wikidata.org/w/api.php', {
       method: 'POST',
       body: new URLSearchParams({
         action: 'edit',
         title: 'Wikidata:Project_chat',
         section: 'new',
         sectiontitle: `WikiMillionaire Report: ${report.questionId}`,
         text: content,
         token: token,
         format: 'json',
       }),
     })
     
     // 4. Return URL to created report
     return response.data.edit.pageid
   }
   ```

4. **API Endpoints to Add**
   - `POST /api/reports/create-wikidata`: Create report on Wikidata
   - `GET /api/reports/:id/wikidata-status`: Check if report exists on Wikidata

5. **Database Updates**
   - Add `wikidata_report_id` column
   - Add `wikidata_sync_status` column
   - Track synchronization attempts

### Phase 3: Admin Dashboard (Future)

1. **Report Management Interface**
   - View all reports with filtering
   - Update report status
   - View Wikidata links
   - Analytics on report types

2. **Automated Verification**
   - Query Wikidata for current data
   - Flag resolved issues
   - Suggest corrections

### Phase 4: Community Feedback Loop (Future)

1. **Wikidata Integration Status**
   - Show users if their report was synced to Wikidata
   - Link to Wikidata discussion

2. **Resolution Notifications**
   - Email/notification when report is resolved
   - Update game questions when Wikidata is corrected

## API Reference

### Submit Report
```typescript
POST /api/reports
Content-Type: application/json

{
  "questionId": "Q90",          // Optional: Wikidata entity ID
  "question": "string",          // Required: Question text
  "selectedAnswer": "string",    // Required: User's answer
  "correctAnswer": "string",     // Required: System's answer
  "reason": "incorrect_answer",  // Required: Report reason
  "description": "string",       // Optional: Additional details
  "username": "string",          // Required: Reporter username
  "userId": "string"            // Optional: Reporter user ID
}

Response:
{
  "success": true,
  "data": { /* AnswerReport object */ },
  "message": "Report submitted successfully..."
}
```

### Get Reports
```typescript
GET /api/reports?limit=50&status=pending

Response:
{
  "success": true,
  "data": [ /* Array of AnswerReport objects */ ]
}
```

## Testing

Tests are located in `/lib/__tests__/reports.test.ts` and cover:
- Report submission validation
- Database storage
- Report retrieval with filtering
- Error handling
- "Coming Soon" feature indicators

Run tests with:
```bash
npm test -- reports.test.ts
```

## Translations

The feature supports multiple languages (ES, EN, FR, DE, PT) with translations in `/lib/i18n.ts`:
- Report dialog title and description
- "Coming Soon" notice
- Form labels
- Success/error messages
- Report reasons

## Security Considerations

1. **Input Validation**
   - All inputs are validated at API level
   - SQL injection prevention via parameterized queries
   - XSS prevention via React's built-in escaping

2. **Rate Limiting** (Future)
   - Implement rate limiting to prevent spam
   - Track reports per user/IP

3. **Authentication**
   - Reports from authenticated users preferred
   - Anonymous reports allowed but tracked separately

4. **Data Privacy**
   - No sensitive user data stored
   - Reports are moderated before public display on Wikidata

## Monitoring

Key metrics to track:
- Number of reports submitted (by reason)
- Response time for report processing
- Success rate of Wikidata sync (future)
- User engagement with feature

## Maintenance

1. **Database Maintenance**
   - Regular cleanup of old resolved reports
   - Archive reports older than 1 year

2. **Wikidata Sync** (Future)
   - Daily batch processing of pending reports
   - Retry failed syncs
   - Monitor Wikidata API rate limits

## Contributors

This feature was designed to:
1. Help identify errors caused by Wikidata editors or outdated data
2. Provide structured feedback to improve game quality
3. Create a feedback loop between players and the Wikidata community

## References

- [Wikidata API Documentation](https://www.wikidata.org/w/api.php)
- [Wikidata Project Chat](https://www.wikidata.org/wiki/Wikidata:Project_chat)
- [WikiMillionaire Game Documentation](../README.md)
