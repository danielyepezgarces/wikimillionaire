# Visual Guide: Report Feature

## Feature Location

The report feature is accessible during gameplay in the WikiMillionaire game.

## User Flow

### 1. During Gameplay
When a user answers a question (correctly or incorrectly), the system reveals the correct answer. At this point, a **"Report" button** appears below the answer options.

```
┌─────────────────────────────────────────────┐
│  Question: What is the capital of France?  │
│                                             │
│  [✓] A. Paris     (Correct - Green)        │
│  [✗] B. London    (Selected - Red)         │
│  [ ] C. Berlin    (Gray)                   │
│  [ ] D. Madrid    (Gray)                   │
│                                             │
│         [🚩 Report] Button appears here     │
└─────────────────────────────────────────────┘
```

### 2. Opening Report Dialog
When the user clicks the "Report" button, a modal dialog opens with:

```
┌──────────────────────────────────────────────────┐
│  🚩 Report Incorrect Answer                      │
│  Help us improve the game by reporting answers   │
│                                                   │
│  ⚠️ Coming Soon                                  │
│  Direct Wikidata integration is under            │
│  development. For now, your report will be       │
│  saved for future review.                        │
│                                                   │
│  Question:                                       │
│  ┌────────────────────────────────────────┐      │
│  │ What is the capital of France?         │      │
│  └────────────────────────────────────────┘      │
│                                                   │
│  Your selected answer:                           │
│  ┌────────────────────────────────────────┐      │
│  │ London                                  │      │
│  └────────────────────────────────────────┘      │
│                                                   │
│  Answer marked as correct:                       │
│  ┌────────────────────────────────────────┐      │
│  │ Paris                                   │      │
│  └────────────────────────────────────────┘      │
│                                                   │
│  Reason for report:                              │
│  [Dropdown ▼] Incorrect answer                   │
│    - Incorrect answer                            │
│    - Outdated data                               │
│    - Ambiguous question                          │
│    - Other                                       │
│                                                   │
│  Description (optional):                         │
│  ┌────────────────────────────────────────┐      │
│  │ Explain why you think this answer is   │      │
│  │ incorrect...                            │      │
│  │                                         │      │
│  └────────────────────────────────────────┘      │
│                                                   │
│       [Cancel]  [Submit Report]                  │
└──────────────────────────────────────────────────┘
```

### 3. After Submission
Upon successful submission, the user sees a toast notification:

```
┌──────────────────────────────────┐
│  ✓ Report submitted!             │
│  Thank you for helping us        │
│  improve the game. Your report   │
│  will be reviewed.               │
└──────────────────────────────────┘
```

## Color Scheme

The report feature integrates with the existing game theme:

- **Button**: Yellow border and text (`border-yellow-500 text-yellow-500`)
- **Dialog**: Matches game's purple theme
- **Alert**: Informational style with "Coming Soon" badge
- **Form elements**: Standard form styling with proper contrast

## Responsive Design

The dialog is responsive and works on:
- ✅ Desktop (max-width: 525px centered)
- ✅ Tablet (adapts to screen size)
- ✅ Mobile (full-width on small screens)

## States

### Button States
1. **Hidden**: Before answer is revealed
2. **Visible**: After answer is revealed
3. **Hover**: Yellow background on hover (`hover:bg-yellow-500/10`)

### Dialog States
1. **Open**: Modal visible with backdrop
2. **Closed**: Hidden
3. **Submitting**: Submit button shows loading state

### Form States
1. **Empty**: All optional fields empty
2. **Filled**: User has entered information
3. **Submitting**: Form disabled, showing loading indicator
4. **Success**: Toast shown, dialog closes
5. **Error**: Error toast shown, form re-enabled

## Accessibility

- ✅ Keyboard navigation supported
- ✅ Focus management in dialog
- ✅ ARIA labels on form fields
- ✅ Screen reader friendly
- ✅ High contrast mode compatible

## Internationalization

All text is translated and appears in the user's selected language:
- Spanish: "Reportar Respuesta Incorrecta"
- English: "Report Incorrect Answer"
- French: "Signaler une Réponse Incorrecte"
- German: "Falsche Antwort Melden"
- Portuguese: "Reportar Resposta Incorreta"

## Integration Points

### In Game
```typescript
// After answer is selected and revealed:
{selectedAnswer && correctAnswer && (
  <div className="flex justify-center">
    <Button onClick={() => setShowReportDialog(true)}>
      <Flag className="mr-2 h-4 w-4" />
      {t.report.button}
    </Button>
  </div>
)}
```

### Dialog Component
```typescript
<ReportAnswerDialog
  isOpen={showReportDialog}
  onClose={() => setShowReportDialog(false)}
  question={currentQuestion.question}
  questionId={currentQuestion.id}
  selectedAnswer={selectedAnswer}
  correctAnswer={correctAnswer}
  username={username}
  userId={user?.id}
  translations={t}
/>
```

## Data Flow

```
User clicks Report
    ↓
Dialog opens with pre-filled data
    ↓
User selects reason + adds description
    ↓
User clicks Submit
    ↓
POST /api/reports
    ↓
Database: answer_reports table
    ↓
Success toast shown
    ↓
Dialog closes
    ↓
Game continues
```

## Future Enhancements (Coming Soon Phase)

When Wikidata integration is implemented:
1. "Coming Soon" alert will be replaced with integration status
2. Wikidata URL will be generated and stored
3. Users will see link to their report on Wikidata
4. Reports will be automatically synced to Wikidata Project Chat

## Example Report in Database

```json
{
  "id": 1,
  "question_id": "Q90",
  "question": "What is the capital of France?",
  "selected_answer": "London",
  "correct_answer": "Paris",
  "reason": "incorrect_answer",
  "description": "Paris is clearly the capital, not London",
  "username": "john_doe",
  "user_id": "user_123",
  "timestamp": "2025-10-22T04:30:00Z",
  "status": "pending",
  "wikidata_url": null
}
```

## Error Handling

If submission fails:
```
┌──────────────────────────────────┐
│  ✗ Error                         │
│  Could not submit the report.    │
│  Please try again.               │
└──────────────────────────────────┘
```

The report is automatically saved to localStorage as backup.

## Testing the Feature

1. Start a game
2. Answer any question (right or wrong)
3. Wait for answer reveal
4. Click "Report" button
5. Fill out the form
6. Submit
7. Verify toast appears
8. Check database for new report

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
