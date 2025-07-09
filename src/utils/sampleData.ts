import { Meeting, ActionItem } from '../types';
import { format, subDays } from 'date-fns';

export const generateSampleData = () => {
  const today = new Date();
  
  // Sample meetings
  const meetings: Meeting[] = [
    {
      id: '1',
      title: 'Product Roadmap Review',
      date: format(today, 'yyyy-MM-dd'),
      startTime: new Date(today.setHours(9, 0, 0, 0)),
      endTime: new Date(today.setHours(10, 0, 0, 0)),
      participants: ['John Doe', 'Jane Smith'],
      platform: 'zoom',
      isRecording: false,
    },
    {
      id: '2',
      title: 'Engineering Standup',
      date: format(subDays(today, 1), 'yyyy-MM-dd'),
      startTime: new Date(subDays(today, 1).setHours(10, 30, 0, 0)),
      endTime: new Date(subDays(today, 1).setHours(11, 0, 0, 0)),
      participants: ['Dev Team'],
      platform: 'teams',
      isRecording: false,
    }
  ];

  // Sample action items
  const actionItems: ActionItem[] = [
    {
      id: '1',
      meetingId: '1',
      date: format(today, 'yyyy-MM-dd'),
      description: 'Review Q4 product priorities and send updated roadmap to stakeholders',
      status: 'pending',
      dueDate: format(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      createdAt: new Date(),
    },
    {
      id: '2',
      meetingId: '1',
      date: format(today, 'yyyy-MM-dd'),
      description: 'Schedule follow-up meeting with design team',
      status: 'pending',
      createdAt: new Date(),
    },
    {
      id: '3',
      meetingId: '2',
      date: format(subDays(today, 1), 'yyyy-MM-dd'),
      description: 'Fix critical bug in authentication flow',
      status: 'completed',
      createdAt: subDays(today, 1),
      completedAt: new Date(),
    },
    {
      id: '4',
      meetingId: '2',
      date: format(subDays(today, 1), 'yyyy-MM-dd'),
      description: 'Update API documentation for v2 endpoints',
      status: 'in_progress',
      dueDate: format(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      createdAt: subDays(today, 1),
    }
  ];

  return { meetings, actionItems };
};