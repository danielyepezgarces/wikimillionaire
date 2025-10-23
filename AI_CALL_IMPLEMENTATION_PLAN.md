# AI Call Implementation Plan

## Overview
This document outlines the planned implementation of an AI-powered "Phone a Friend" lifeline feature using Together AI, designed to simulate realistic phone call assistance with varying degrees of accuracy and presentation modes.

## Feature Description
The AI Call feature will replace the current basic "Phone a Friend" lifeline with a more sophisticated AI-powered system that simulates calling different experts with varying knowledge levels and confidence.

## Technical Architecture

### 1. AI Service Provider
- **Platform**: Together AI
- **API Integration**: RESTful API calls to Together AI's inference endpoints
- **Model Selection**: Multiple models with different capabilities to simulate varying expertise levels

### 2. Agent Configuration

The system will include 6 distinct AI agents, each with different characteristics:

#### Agent 1: The Expert (95% accuracy)
- **Profile**: University professor with deep knowledge across multiple topics
- **Confidence Level**: Very High
- **Response Style**: Detailed and analytical
- **Model**: High-performance model with strong reasoning capabilities

#### Agent 2: The Enthusiast (85% accuracy)
- **Profile**: Trivia enthusiast with broad general knowledge
- **Confidence Level**: High
- **Response Style**: Enthusiastic and explanatory
- **Model**: Medium-performance model with good general knowledge

#### Agent 3: The Researcher (80% accuracy)
- **Profile**: Someone who quickly looks things up
- **Confidence Level**: Moderate to High
- **Response Style**: Methodical and cautious
- **Model**: Medium-performance model with research capabilities

#### Agent 4: The Generalist (70% accuracy)
- **Profile**: Average person with reasonable general knowledge
- **Confidence Level**: Moderate
- **Response Style**: Casual and conversational
- **Model**: Standard model with balanced capabilities

#### Agent 5: The Guesser (50% accuracy)
- **Profile**: Someone making educated guesses
- **Confidence Level**: Low to Moderate
- **Response Style**: Uncertain and hesitant
- **Model**: Lower-performance model or constrained prompts

#### Agent 6: The Novice (40% accuracy)
- **Profile**: Someone with limited knowledge but willing to help
- **Confidence Level**: Low
- **Response Style**: Very uncertain, often admits lack of knowledge
- **Model**: Basic model with limited context

### 3. Response Modes

#### Text Mode (Default)
- Display AI response as text in a dialog
- Shows agent's confidence level
- Displays reasoning (optional)
- Shows estimated accuracy indicator

#### Text-to-Speech Mode (Browser TTS)
- Uses Web Speech API (SpeechSynthesis)
- Selects appropriate voice based on locale
- Adjustable speech rate and pitch to match agent personality
- Fallback to text mode if TTS unavailable

Example implementation:
```typescript
const speak = (text: string, agentProfile: AgentProfile) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = agentProfile.speechRate; // 0.9 for cautious, 1.2 for enthusiastic
    utterance.pitch = agentProfile.speechPitch;
    utterance.lang = currentLocale;
    speechSynthesis.speak(utterance);
  }
};
```

### 4. API Integration Structure

```typescript
// AI Service Configuration
interface AICallConfig {
  apiKey: string;
  baseUrl: string;
  models: {
    expert: string;
    enthusiast: string;
    researcher: string;
    generalist: string;
    guesser: string;
    novice: string;
  };
}

// Agent Profile
interface AgentProfile {
  id: string;
  name: string;
  accuracy: number;
  confidenceLevel: 'very_high' | 'high' | 'moderate' | 'low';
  responseStyle: string;
  modelId: string;
  speechRate?: number;
  speechPitch?: number;
}

// AI Call Request
interface AICallRequest {
  question: string;
  options: string[];
  correctAnswer?: string; // For accuracy simulation
  agentId: string;
  locale: string;
}

// AI Call Response
interface AICallResponse {
  agentName: string;
  suggestedAnswer: string;
  confidence: number;
  reasoning?: string;
  isCorrect?: boolean;
  responseText: string;
}
```

### 5. Implementation Flow

```
1. User clicks "Phone a Friend" lifeline
2. System randomly selects one of 6 agents (with weighted probability)
3. Show "Calling..." animation with agent profile
4. Send API request to Together AI with:
   - Question context
   - Available options
   - Agent-specific system prompt
   - Difficulty level context
5. Process AI response
6. Format response based on agent profile
7. Present response to user:
   - Text mode: Display in dialog with agent info
   - TTS mode: Play audio + show text
8. Allow user to dismiss and continue game
```

### 6. Security & Rate Limiting

- **API Key Management**: Store in environment variables
- **Rate Limiting**: Maximum 1 call per game session
- **Cost Control**: Implement request timeout and token limits
- **Error Handling**: Graceful fallback to basic random response if API fails
- **User Privacy**: Don't send user identification to AI service

### 7. User Interface Components

#### Agent Selection Dialog
```tsx
<Dialog>
  <DialogContent>
    <div className="flex items-center gap-4">
      <Avatar>
        <AvatarImage src={agent.avatar} />
      </Avatar>
      <div>
        <h3>{agent.name}</h3>
        <p className="text-sm text-muted-foreground">{agent.description}</p>
      </div>
    </div>
    <div className="animate-pulse">Llamando...</div>
  </DialogContent>
</Dialog>
```

#### Response Display
```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center justify-between">
      <span>{agent.name}</span>
      <Badge variant={confidenceBadgeVariant}>{confidenceLevel}</Badge>
    </CardTitle>
  </CardHeader>
  <CardContent>
    <p className="mb-4">{response.responseText}</p>
    <div className="flex items-center justify-between">
      <span className="font-semibold">Respuesta sugerida:</span>
      <span className="text-yellow-400">{response.suggestedAnswer}</span>
    </div>
  </CardContent>
  <CardFooter>
    {ttsAvailable && (
      <Button onClick={playAudio}>
        <Volume2 className="mr-2 h-4 w-4" />
        Escuchar respuesta
      </Button>
    )}
  </CardFooter>
</Card>
```

### 8. Prompt Engineering Strategy

Each agent will have a unique system prompt:

**Expert Agent:**
```
You are a university professor with expertise across multiple fields. 
Analyze this question carefully and provide a confident, well-reasoned answer.
Question: {question}
Options: {options}
Provide your answer with detailed reasoning.
```

**Novice Agent:**
```
You are someone with limited knowledge but trying to help. 
You're not very confident and might be unsure about the answer.
Question: {question}
Options: {options}
Give your best guess but express uncertainty appropriately.
```

### 9. Analytics & Monitoring

Track the following metrics:
- Agent selection distribution
- AI accuracy per agent type
- User acceptance of AI suggestions
- API response times
- Error rates
- User preference for text vs TTS mode

### 10. Internationalization

- Support all existing game locales (ES, EN, FR, DE, PT)
- Agent personalities adapted to cultural context
- TTS voices selected based on locale
- Translated agent names and descriptions

### 11. Cost Estimation

- Together AI pricing: ~$0.001 per 1K tokens
- Average call: ~500 tokens (question + response)
- Estimated cost per call: $0.0005
- With 1000 daily active users: ~$0.50/day
- Monthly estimate: ~$15/month

### 12. Testing Strategy

#### Unit Tests
- Agent selection logic
- Response formatting
- TTS availability detection
- Error handling

#### Integration Tests
- Together AI API integration
- Response parsing
- Multi-language support

#### E2E Tests
- Complete user flow
- TTS playback
- Mobile responsiveness

### 13. Rollout Plan

**Phase 1**: Development & Testing (2-3 weeks)
- Implement API integration
- Create agent profiles
- Build UI components
- Add TTS support

**Phase 2**: Beta Testing (1 week)
- Limited rollout to selected users
- Collect feedback
- Monitor costs and performance

**Phase 3**: Public Release
- Enable for all users
- Monitor usage and adjust agent distribution
- Iterate based on user feedback

### 14. Future Enhancements

- Voice cloning for more realistic agent voices
- Personalized agent selection based on question category
- Agent learning from user feedback
- Multiplayer mode with shared AI assistance
- Video avatars for agents (using AI-generated faces)

## Dependencies

```json
{
  "together-ai": "^1.0.0",  // Together AI SDK
  "@types/web-speech-api": "^0.0.1"  // TypeScript types for TTS
}
```

## Environment Variables

```env
TOGETHER_AI_API_KEY=your_api_key_here
TOGETHER_AI_BASE_URL=https://api.together.xyz
AI_CALL_ENABLED=true
AI_CALL_MAX_TOKENS=500
AI_CALL_TIMEOUT=10000
```

## Conclusion

This implementation will provide a unique and engaging experience for users, making the "Phone a Friend" lifeline more interactive and educational. The varying accuracy levels add an element of strategy, as players must decide whether to trust the AI's suggestion based on the agent's confidence and reasoning.

The use of browser-based TTS ensures zero additional cost for voice while providing a more immersive experience, and the fallback to text mode ensures accessibility for all users.
