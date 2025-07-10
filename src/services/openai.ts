import { ActionItem } from '../types';
import { validateOpenAIApiKey, validateAudioFile, openAIRateLimiter, ValidationError } from '../utils/validation';
import { apiConfig, validationConfig, remindersConfig } from '../config';

// Lazy load OpenAI to reduce initial bundle size
let OpenAI: any = null;

export class OpenAIService {
  private client: any = null;
  private defaultModel: string = apiConfig.openai.defaultModel;

  async initialize(apiKey: string) {
    try {
      // Validate API key format before initializing
      validateOpenAIApiKey(apiKey);
      
      // Lazy load OpenAI SDK
      if (!OpenAI) {
        const module = await import('openai');
        OpenAI = module.default;
      }
      
      this.client = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true, // TODO: Move to backend in production
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`Invalid API key: ${error.message}`);
      }
      throw error;
    }
  }

  setDefaultModel(model: string) {
    this.defaultModel = model;
  }

  async transcribeAudio(audioFile: File): Promise<string> {
    if (!this.client) throw new Error('OpenAI client not initialized');
    
    // Validate file before processing
    try {
      validateAudioFile(audioFile);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`Invalid audio file: ${error.message}`);
      }
      throw error;
    }

    // Check rate limit
    if (!openAIRateLimiter.canMakeRequest('transcription')) {
      throw new Error('Rate limit exceeded. Please wait before making another request.');
    }

    try {
      const response = await this.client.audio.transcriptions.create({
        file: audioFile,
        model: apiConfig.openai.whisperModel,
      });

      return response.text;
    } catch (error) {
      console.error('Audio transcription error:', error);
      throw new Error('Failed to transcribe audio. Please try again.');
    }
  }

  async transcribeAudioChunk(audioBlob: Blob): Promise<string> {
    if (!this.client) throw new Error('OpenAI client not initialized');

    // Convert blob to File for OpenAI API
    const audioFile = new File([audioBlob], apiConfig.openai.audioFileName, { type: 'audio/webm' });

    // Check rate limit for live transcription
    if (!openAIRateLimiter.canMakeRequest('live-transcription')) {
      console.warn('Rate limit exceeded for live transcription');
      return ''; // Return empty string to continue recording
    }

    try {
      // Basic validation for audio chunk
      if (audioFile.size === 0) {
        return '';
      }

      const response = await this.client.audio.transcriptions.create({
        file: audioFile,
        model: apiConfig.openai.whisperModel,
        response_format: 'text',
      });

      return response;
    } catch (error) {
      console.error('Live transcription error:', error);
      return ''; // Return empty string on error to continue recording
    }
  }

  async enhanceNotes(transcript: string, template?: string): Promise<{
    summary: string;
    enhancedNotes: string;
    actionItems: Partial<ActionItem>[];
    highlights: Array<{type: string; text: string; timestamp?: string}>;
  }> {
    if (!this.client) throw new Error('OpenAI client not initialized');

    const prompt = `
You are an AI meeting assistant. Analyze the following meeting transcript and provide:
1. A concise summary (2-3 sentences)
2. Enhanced, well-structured notes in Markdown format with:
   - Clear headers (##) for different topics
   - Bullet points for key items
   - **Bold** for important points
   - Proper formatting for readability
3. A list of action items with clear descriptions
4. Highlights of important moments (decisions, concerns, agreements, key questions)

${template ? `Use this template as a guide: ${template}` : ''}

Transcript:
${transcript}

Respond in JSON format:
{
  "summary": "...",
  "enhancedNotes": "... (in Markdown format)",
  "actionItems": [
    {"description": "...", "dueDate": "YYYY-MM-DD or null"}
  ],
  "highlights": [
    {"type": "decision|concern|agreement|question|commitment", "text": "..."}
  ]
}`;

    const response = await this.client.chat.completions.create({
      model: this.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: apiConfig.openai.temperatures.default,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No response from OpenAI');

    return JSON.parse(content);
  }

  async generateFollowUpEmail(
    meetingNotes: string,
    actionItems: ActionItem[]
  ): Promise<string> {
    if (!this.client) throw new Error('OpenAI client not initialized');

    const prompt = `
Based on these meeting notes and action items, generate a professional follow-up email.

Meeting Notes:
${meetingNotes}

Action Items:
${actionItems.map(item => `- ${item.description}`).join('\n')}

Generate a concise, professional email that:
1. Thanks participants
2. Summarizes key decisions
3. Lists action items with owners
4. Proposes next steps
`;

    const response = await this.client.chat.completions.create({
      model: this.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: apiConfig.openai.temperatures.titleGeneration,
    });

    return response.choices[0].message.content || '';
  }

  async generateMeetingTitle(
    transcript: string,
    style: 'professional' | 'descriptive' | 'creative' | 'emoji' = 'professional'
  ): Promise<string> {
    if (!this.client) throw new Error('OpenAI client not initialized');

    const styleGuides = {
      professional: 'Generate a concise, professional title suitable for a corporate environment',
      descriptive: 'Generate a descriptive title that clearly explains what was discussed',
      creative: 'Generate a creative, memorable title that captures the essence of the meeting',
      emoji: 'Generate a title with 1-2 relevant emojis that make it visually distinctive'
    };

    const prompt = `
Analyze this meeting transcript and generate a meeting title.

Style: ${styleGuides[style]}

Requirements:
- Maximum 60 characters
- Capture the main topic or outcome
- Be specific, not generic
- ${style === 'emoji' ? 'Include 1-2 relevant emojis' : 'No emojis'}

Transcript excerpt:
${transcript.substring(0, 1000)}...

Generate only the title, nothing else.`;

    const response = await this.client.chat.completions.create({
      model: this.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: style === 'creative' ? 0.8 : 0.5,
      max_tokens: 50,
    });

    return response.choices[0].message.content?.trim() || 'Team Meeting';
  }

  async extractReminders(
    transcript: string,
    actionItems: Partial<ActionItem>[]
  ): Promise<Array<{
    title: string;
    description: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high';
    reminderOffset: number; // hours before due date
  }>> {
    if (!this.client) throw new Error('OpenAI client not initialized');

    const prompt = `
Analyze this meeting transcript and action items to identify time-sensitive commitments that need reminders.

Look for:
1. Deadlines mentioned in the meeting
2. Promises or commitments with specific dates
3. Follow-up tasks that need to be done by certain times
4. Important milestones or deliverables
5. Scheduled reviews or check-ins

For each reminder, determine:
- A clear, actionable title
- Brief description
- Due date (in ISO format YYYY-MM-DD)
- Priority (high for critical deadlines, medium for important tasks, low for nice-to-haves)
- When to send reminder (hours before deadline: 24, 48, or 72)

Transcript:
${transcript}

Action Items:
${actionItems.map(item => `- ${item.description} ${item.dueDate ? `(due: ${item.dueDate})` : ''}`).join('\n')}

Today's date: ${new Date().toISOString().split('T')[0]}

Respond in JSON format:
{
  "reminders": [
    {
      "title": "...",
      "description": "...",
      "dueDate": "YYYY-MM-DD",
      "priority": "low|medium|high",
      "reminderOffset": 24|48|72
    }
  ]
}`;

    const response = await this.client.chat.completions.create({
      model: this.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: apiConfig.openai.temperatures.default,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No response from OpenAI');

    const result = JSON.parse(content);
    return result.reminders || [];
  }

  async chatWithAssistant(
    query: string,
    context: {
      meetings: any[];
      notes: any[];
      actionItems: any[];
      reminders: any[];
    }
  ): Promise<string> {
    if (!this.client) throw new Error('OpenAI client not initialized');

    // Check rate limit
    if (!openAIRateLimiter.canMakeRequest('chat')) {
      throw new Error('Rate limit exceeded. Please wait before making another request.');
    }

    // Get more detailed context for better responses
    const recentMeetings = context.meetings.slice(-10).reverse();
    const pendingActionItems = context.actionItems.filter(a => a.status === 'pending');
    const thisWeekActionItems = pendingActionItems.filter(a => {
      const dueDate = a.dueDate ? new Date(a.dueDate) : null;
      if (!dueDate) return false;
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return dueDate <= weekFromNow;
    });

    // Build detailed meeting context
    const meetingDetails = recentMeetings.map(meeting => {
      const note = context.notes.find(n => n.meetingId === meeting.id);
      const meetingActionItems = context.actionItems.filter(a => a.meetingId === meeting.id);
      const meetingReminders = context.reminders.filter(r => r.meetingId === meeting.id);
      
      return {
        title: meeting.title,
        date: meeting.date,
        summary: note?.summary || 'No summary available',
        actionItems: meetingActionItems.map(a => `${a.description} (${a.status})`),
        reminders: meetingReminders.map(r => `${r.title} (${r.status})`)
      };
    });

    // Prepare context summary
    const contextSummary = `
You are MeetingMind's AI assistant. You have access to the user's meeting data to help answer their questions.

Current Date: ${new Date().toLocaleDateString()}
Current Time: ${new Date().toLocaleTimeString()}

MEETING DATA:
Total meetings: ${context.meetings.length}
Total notes: ${context.notes.length}
Total action items: ${context.actionItems.length} (${pendingActionItems.length} pending)
Total reminders: ${context.reminders.length}

RECENT MEETINGS (most recent first):
${meetingDetails.map((m, i) => `
${i + 1}. ${m.title} (${m.date})
   Summary: ${m.summary}
   Action Items: ${m.actionItems.length > 0 ? m.actionItems.join(', ') : 'None'}
   Reminders: ${m.reminders.length > 0 ? m.reminders.join(', ') : 'None'}
`).join('\n')}

PENDING ACTION ITEMS THIS WEEK:
${thisWeekActionItems.length > 0 ? thisWeekActionItems.map(a => 
  `- ${a.description}${a.dueDate ? ` (due ${new Date(a.dueDate).toLocaleDateString()})` : ' (no due date)'}`
).join('\n') : 'No action items due this week'}

ALL PENDING ACTION ITEMS:
${pendingActionItems.length > 0 ? pendingActionItems.slice(0, 10).map(a => 
  `- ${a.description}${a.dueDate ? ` (due ${new Date(a.dueDate).toLocaleDateString()})` : ' (no due date)'}`
).join('\n') : 'No pending action items'}

User Query: ${query}
`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant for MeetingMind. Answer questions about meetings, action items, and notes based on the provided context. Be concise and specific. If asked about a specific meeting, provide details from the notes. For action items, include due dates when available.'
          },
          {
            role: 'user',
            content: contextSummary
          }
        ],
        temperature: apiConfig.openai.temperatures.default,
        max_tokens: 500
      });

      return response.choices[0].message.content || 'I couldn\'t generate a response. Please try again.';
    } catch (error) {
      console.error('Chat error:', error);
      throw new Error('Failed to process your question. Please try again.');
    }
  }
}

export const openAIService = new OpenAIService();