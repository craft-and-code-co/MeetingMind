export interface MeetingTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompts: string[];
  enhancementTemplate: string;
}

export const meetingTemplates: MeetingTemplate[] = [
  {
    id: 'standup',
    name: 'Daily Standup',
    description: 'Quick daily team sync meeting',
    icon: '🚀',
    prompts: [
      'What did you accomplish yesterday?',
      'What are you working on today?',
      'Any blockers or concerns?'
    ],
    enhancementTemplate: `
Focus on extracting:
- Individual updates from each team member
- Tasks completed and in progress
- Blockers that need attention
- Dependencies between team members
Format as brief bullet points organized by person.
    `
  },
  {
    id: 'one-on-one',
    name: 'One-on-One',
    description: 'Manager and direct report meeting',
    icon: '👥',
    prompts: [
      'How are you feeling about your current work?',
      'What challenges are you facing?',
      'What support do you need?',
      'Career goals and development'
    ],
    enhancementTemplate: `
Focus on extracting:
- Key discussion topics
- Action items for both manager and direct report
- Career development points
- Feedback given and received
- Follow-up items for next meeting
Keep tone supportive and growth-oriented.
    `
  },
  {
    id: 'brainstorm',
    name: 'Brainstorming Session',
    description: 'Creative ideation and problem solving',
    icon: '💡',
    prompts: [
      'Problem statement or goal',
      'All ideas (no filtering)',
      'Pros and cons of each idea',
      'Next steps for promising ideas'
    ],
    enhancementTemplate: `
Focus on extracting:
- Main problem or goal
- All ideas generated (organized by theme if applicable)
- Key insights or breakthroughs
- Ideas selected for further exploration
- Action items and owners
Preserve the creative energy and don't dismiss any ideas.
    `
  },
  {
    id: 'project-kickoff',
    name: 'Project Kickoff',
    description: 'Starting a new project or initiative',
    icon: '🎯',
    prompts: [
      'Project goals and objectives',
      'Scope and deliverables',
      'Timeline and milestones',
      'Roles and responsibilities',
      'Success criteria'
    ],
    enhancementTemplate: `
Focus on extracting:
- Clear project objectives and success criteria
- Defined scope and out-of-scope items
- Timeline with key milestones
- Team roles and responsibilities
- Risks and mitigation strategies
- Communication plan
Format as a structured project brief.
    `
  },
  {
    id: 'retrospective',
    name: 'Sprint Retrospective',
    description: 'Team reflection on recent sprint',
    icon: '🔄',
    prompts: [
      'What went well?',
      'What could be improved?',
      'What should we start doing?',
      'What should we stop doing?',
      'Action items for next sprint'
    ],
    enhancementTemplate: `
Focus on extracting:
- Positive outcomes and wins
- Areas for improvement
- Specific action items with owners
- Process changes to implement
- Team sentiment and morale indicators
Group by theme and prioritize actionable improvements.
    `
  },
  {
    id: 'client-meeting',
    name: 'Client Meeting',
    description: 'External client or customer meeting',
    icon: '🤝',
    prompts: [
      'Client needs and requirements',
      'Questions and concerns',
      'Proposed solutions',
      'Next steps and timeline',
      'Follow-up items'
    ],
    enhancementTemplate: `
Focus on extracting:
- Client requirements and pain points
- Commitments made by both parties
- Open questions needing follow-up
- Timeline and deliverables discussed
- Relationship building notes
Maintain professional tone and clarity.
    `
  },
  {
    id: 'interview',
    name: 'Interview',
    description: 'Candidate or informational interview',
    icon: '🎤',
    prompts: [
      'Candidate background and experience',
      'Responses to key questions',
      'Technical/skill assessment',
      'Cultural fit observations',
      'Next steps in process'
    ],
    enhancementTemplate: `
Focus on extracting:
- Candidate qualifications and experience
- Key answers and insights
- Strengths and potential concerns
- Cultural fit indicators
- Recommendation and next steps
Be objective and factual in assessments.
    `
  },
  {
    id: 'planning',
    name: 'Planning Session',
    description: 'Strategic or tactical planning meeting',
    icon: '📋',
    prompts: [
      'Goals and objectives',
      'Current state assessment',
      'Proposed strategies',
      'Resource requirements',
      'Timeline and milestones'
    ],
    enhancementTemplate: `
Focus on extracting:
- Clear goals and success metrics
- Strategic decisions made
- Resource allocations
- Timeline and key milestones
- Risks and dependencies
- Owner assignments
Format as actionable plan with clear next steps.
    `
  },
  {
    id: 'all-hands',
    name: 'All Hands',
    description: 'Company-wide or department meeting',
    icon: '📢',
    prompts: [
      'Company/team updates',
      'Key announcements',
      'Q&A highlights',
      'Recognition and celebrations',
      'Upcoming priorities'
    ],
    enhancementTemplate: `
Focus on extracting:
- Major announcements and updates
- Key metrics and achievements
- Important Q&A exchanges
- Team recognitions
- Upcoming initiatives and changes
- Action items for teams/individuals
Keep tone aligned with company culture.
    `
  },
  {
    id: 'custom',
    name: 'Custom Meeting',
    description: 'Create your own meeting structure',
    icon: '⚙️',
    prompts: [],
    enhancementTemplate: ''
  }
];