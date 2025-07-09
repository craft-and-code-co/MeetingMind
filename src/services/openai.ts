import OpenAI from 'openai';
import { ActionItem } from '../types';

export class OpenAIService {
  private client: OpenAI | null = null;

  initialize(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // For development - in production, use a backend
    });
  }

  async transcribeAudio(audioFile: File): Promise<string> {
    if (!this.client) throw new Error('OpenAI client not initialized');

    const response = await this.client.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });

    return response.text;
  }

  async enhanceNotes(transcript: string, template?: string): Promise<{
    summary: string;
    enhancedNotes: string;
    actionItems: Partial<ActionItem>[];
  }> {
    if (!this.client) throw new Error('OpenAI client not initialized');

    const prompt = `
You are an AI meeting assistant. Analyze the following meeting transcript and provide:
1. A concise summary (2-3 sentences)
2. Enhanced, well-structured notes with key points
3. A list of action items with clear descriptions

${template ? `Use this template as a guide: ${template}` : ''}

Transcript:
${transcript}

Respond in JSON format:
{
  "summary": "...",
  "enhancedNotes": "...",
  "actionItems": [
    {"description": "...", "dueDate": "YYYY-MM-DD or null"}
  ]
}`;

    const response = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
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
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
    });

    return response.choices[0].message.content || '';
  }
}

export const openAIService = new OpenAIService();