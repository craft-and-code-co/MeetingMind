import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ClockIcon, MicrophoneIcon, DocumentTextIcon, CheckCircleIcon, CalendarDaysIcon, ChartBarIcon } from '@heroicons/react/24/outline';
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
  const { meetings, actionItems, notes } = useStore();

  const stats = useMemo<AnalyticsStats>(() => {
    const completedMeetings = meetings.filter(m => m.endTime);
    const totalRecordingTime = completedMeetings.reduce((total, meeting) => {
      if (meeting.startTime && meeting.endTime) {
        const startTime = meeting.startTime instanceof Date ? meeting.startTime : new Date(meeting.startTime);
        const endTime = meeting.endTime instanceof Date ? meeting.endTime : new Date(meeting.endTime);
        
        // Check if dates are valid
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          return total;
        }
        
        return total + (endTime.getTime() - startTime.getTime());
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

    // Calculate meetings by day of week (last 30 days only)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentMeetings = meetings.filter(meeting => {
      const meetingDate = new Date(meeting.date);
      return meetingDate >= thirtyDaysAgo;
    });

    const meetingsByDay: { [key: string]: number } = {};
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    daysOfWeek.forEach(day => {
      meetingsByDay[day] = 0;
    });

    recentMeetings.forEach(meeting => {
      const dayOfWeek = format(new Date(meeting.date), 'EEEE');
      meetingsByDay[dayOfWeek]++;
    });

    // Only calculate most productive day if there are recent meetings
    const mostProductiveDay = recentMeetings.length > 0 
      ? Object.keys(meetingsByDay).reduce((a, b) => 
          meetingsByDay[a] > meetingsByDay[b] ? a : b
        )
      : 'No recent meetings';

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
    <div className="max-w-none mx-auto px-6 py-6">
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
            <div className="flex items-end justify-between h-48 relative">
              {/* Y-axis lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[4, 3, 2, 1, 0].map((val) => (
                  <div key={val} className="flex items-center">
                    <span className="text-xs text-gray-400 w-4 text-right mr-2">{val * 2}</span>
                    <div className="flex-1 border-t border-gray-100"></div>
                  </div>
                ))}
              </div>
              
              {/* Bars */}
              <div className="relative z-10 flex items-end justify-between h-full w-full pl-8">
                {weeklyData.map((day, index) => {
                  const maxHeight = 160; // pixels
                  const maxMeetings = 8; // scale max
                  const barHeight = Math.max((day.meetings / maxMeetings) * maxHeight, 4);
                  
                  return (
                    <div key={index} className="flex flex-col items-center flex-1 mx-1">
                      <div className="relative group cursor-pointer">
                        {/* Tooltip */}
                        {day.meetings > 0 && (
                          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-slate-700 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {day.meetings} meeting{day.meetings !== 1 ? 's' : ''}
                          </div>
                        )}
                        
                        {/* Bar */}
                        <div 
                          className="bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 rounded-t-sm w-full transition-all duration-300"
                          style={{ 
                            height: `${barHeight}px`,
                            minHeight: '4px',
                            width: '40px'
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 mt-2 font-medium">{day.day}</span>
                    </div>
                  );
                })}
              </div>
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
                <span className="text-sm text-gray-500">Most Productive Day (Last 30 Days)</span>
                <span className="text-sm font-medium text-gray-900">{stats.mostProductiveDay}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Average Notes per Meeting</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.averageNotesPerMeeting % 1 === 0 
                    ? stats.averageNotesPerMeeting.toFixed(0) 
                    : stats.averageNotesPerMeeting.toFixed(1)}
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
    </div>
  );
};