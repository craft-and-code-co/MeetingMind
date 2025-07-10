import OpenAI from 'openai';
import { ActionItem } from '../types';

export class OpenAIService {
  private client: OpenAI | null = null;
  private defaultModel: string = 'gpt-4o';

  initialize(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // For development - in production, use a backend
    });
  }

  setDefaultModel(model: string) {
    this.defaultModel = model;
  }

  async transcribeAudio(audioFile: File): Promise<string> {
    if (!this.client) throw new Error('OpenAI client not initialized');

    const response = await this.client.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });

    return response.text;
  }

  async transcribeAudioChunk(audioBlob: Blob): Promise<string> {
    if (!this.client) throw new Error('OpenAI client not initialized');

    // Convert blob to File for OpenAI API
    const audioFile = new File([audioBlob], 'chunk.webm', { type: 'audio/webm' });

    try {
      const response = await this.client.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
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
      temperature: 0.3,
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
      temperature: 0.5,
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
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No response from OpenAI');

    const result = JSON.parse(content);
    return result.reminders || [];
  }
}

export const openAIService = new OpenAIService();