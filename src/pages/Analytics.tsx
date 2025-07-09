import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { ArrowLeftIcon, ClockIcon, MicrophoneIcon, DocumentTextIcon, CheckCircleIcon, CalendarDaysIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useStore } from '../store/useStore';

interface AnalyticsStats {
  totalMeetings: number;
  totalRecordingTime: number;
  averageMeetingDuration: number;
  meetingsThisWeek: number;
  completedActionItems: number;
  pendingActionItems: number;
  totalNotes: number;
  averageNotesPerMeeting: number;
  mostProductiveDay: string;
  meetingsByDay: { [key: string]: number };
}

export const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { meetings, actionItems, notes } = useStore();

  const stats = useMemo<AnalyticsStats>(() => {
    const completedMeetings = meetings.filter(m => m.endTime);
    const totalRecordingTime = completedMeetings.reduce((total, meeting) => {
      if (meeting.startTime && meeting.endTime) {
        return total + (meeting.endTime.getTime() - meeting.startTime.getTime());
      }
      return total;
    }, 0);

    const averageMeetingDuration = completedMeetings.length > 0 
      ? totalRecordingTime / completedMeetings.length 
      : 0;

    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    const meetingsThisWeek = meetings.filter(m => {
      const meetingDate = new Date(m.date);
      return meetingDate >= weekStart && meetingDate <= weekEnd;
    }).length;

    const completedActionItems = actionItems.filter(item => item.status === 'completed').length;
    const pendingActionItems = actionItems.filter(item => item.status === 'pending').length;

    const averageNotesPerMeeting = meetings.length > 0 ? notes.length / meetings.length : 0;

    // Calculate meetings by day of week
    const meetingsByDay: { [key: string]: number } = {};
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    daysOfWeek.forEach(day => {
      meetingsByDay[day] = 0;
    });

    meetings.forEach(meeting => {
      const dayOfWeek = format(new Date(meeting.date), 'EEEE');
      meetingsByDay[dayOfWeek]++;
    });

    const mostProductiveDay = Object.keys(meetingsByDay).reduce((a, b) => 
      meetingsByDay[a] > meetingsByDay[b] ? a : b
    );

    return {
      totalMeetings: meetings.length,
      totalRecordingTime,
      averageMeetingDuration,
      meetingsThisWeek,
      completedActionItems,
      pendingActionItems,
      totalNotes: notes.length,
      averageNotesPerMeeting,
      mostProductiveDay,
      meetingsByDay
    };
  }, [meetings, actionItems, notes]);

  const formatDuration = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getWeeklyMeetingData = () => {
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    return daysInWeek.map(day => {
      const dayMeetings = meetings.filter(m => 
        isSameDay(new Date(m.date), day)
      ).length;
      
      return {
        day: format(day, 'EEE'),
        meetings: dayMeetings
      };
    });
  };

  const weeklyData = getWeeklyMeetingData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MicrophoneIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Meetings</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMeetings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Recording Time</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(stats.totalRecordingTime)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Notes</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.totalNotes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Completed Actions</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.completedActionItems}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Overview */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <CalendarDaysIcon className="h-5 w-5 mr-2" />
              This Week's Meetings
            </h2>
          </div>
          <div className="p-6">
            <div className="flex items-end justify-between h-40">
              {weeklyData.map((day, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="bg-indigo-600 rounded-t-sm mb-2 w-12 transition-all duration-300"
                    style={{ 
                      height: `${Math.max(day.meetings * 20, 4)}px`,
                      minHeight: '4px'
                    }}
                  />
                  <span className="text-sm font-medium text-gray-900">{day.meetings}</span>
                  <span className="text-xs text-gray-500">{day.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Meeting Performance */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Meeting Performance
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Average Meeting Duration</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDuration(stats.averageMeetingDuration)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Meetings This Week</span>
                <span className="text-sm font-medium text-gray-900">{stats.meetingsThisWeek}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Most Productive Day</span>
                <span className="text-sm font-medium text-gray-900">{stats.mostProductiveDay}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Average Notes per Meeting</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.averageNotesPerMeeting.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Items Progress */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Action Items Progress
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Completed</span>
                <span className="text-sm font-medium text-green-600">{stats.completedActionItems}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Pending</span>
                <span className="text-sm font-medium text-yellow-600">{stats.pendingActionItems}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Completion Rate</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.completedActionItems + stats.pendingActionItems > 0 
                    ? Math.round((stats.completedActionItems / (stats.completedActionItems + stats.pendingActionItems)) * 100)
                    : 0}%
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${stats.completedActionItems + stats.pendingActionItems > 0 
                        ? (stats.completedActionItems / (stats.completedActionItems + stats.pendingActionItems)) * 100
                        : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};