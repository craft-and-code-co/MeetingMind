import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useStore } from '../store/useStore';
import { ActionItem } from '../types';

export const ActionItems: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const { actionItems, updateActionItem, meetings } = useStore();

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    
    // Add padding days from previous month
    const startDay = getDay(start);
    const paddingDays = [];
    for (let i = startDay - 1; i >= 0; i--) {
      paddingDays.push(null);
    }
    
    return [...paddingDays, ...days];
  }, [currentDate]);

  // Get action items for selected date
  const selectedDateItems = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return actionItems.filter(item => item.date === dateStr);
  }, [selectedDate, actionItems]);

  // Get action items count by date for calendar
  const itemCountByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    actionItems.forEach(item => {
      const pending = item.status !== 'completed';
      if (pending) {
        counts[item.date] = (counts[item.date] || 0) + 1;
      }
    });
    return counts;
  }, [actionItems]);

  const handlePreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const handleStatusChange = (itemId: string, status: ActionItem['status']) => {
    updateActionItem(itemId, { 
      status,
      completedAt: status === 'completed' ? new Date() : undefined
    });
  };

  const getMeetingTitle = (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    return meeting?.title || 'Unknown Meeting';
  };

  const formatDueDate = (dueDate: string | null | undefined) => {
    if (!dueDate) return null;
    try {
      const date = new Date(dueDate);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return format(date, 'MMM d');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="max-w-none mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {format(currentDate, 'MMMM yyyy')}
                  </h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={handlePreviousMonth}
                      className="p-2 hover:bg-gray-100 rounded-md"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-2 hover:bg-gray-100 rounded-md"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => {
                    if (!day || !(day instanceof Date) || isNaN(day.getTime())) {
                      return <div key={`empty-${index}`} className="h-24" />;
                    }
                    
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const itemCount = itemCountByDate[dateStr] || 0;
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isCurrentDay = isToday(day);
                    
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`
                          h-24 p-2 border rounded-lg text-left transition-colors
                          ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}
                          ${isCurrentDay ? 'ring-2 ring-indigo-400' : ''}
                        `}
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {format(day, 'd')}
                        </div>
                        {itemCount > 0 && (
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {itemCount}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Action Items List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select a date'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedDateItems.length} action item{selectedDateItems.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {selectedDateItems.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      No action items for this date
                    </p>
                  </div>
                ) : (
                  selectedDateItems.map((item) => (
                    <div key={item.id} className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <button
                          onClick={() => handleStatusChange(
                            item.id,
                            item.status === 'completed' ? 'pending' : 'completed'
                          )}
                          className={`mt-0.5 ${
                            item.status === 'completed'
                              ? 'text-green-600'
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                        <div className="flex-1">
                          <p className={`text-sm ${
                            item.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'
                          }`}>
                            {item.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            From: {getMeetingTitle(item.meetingId)}
                          </p>
                          {item.dueDate && formatDueDate(item.dueDate) && (
                            <p className="text-xs text-gray-500">
                              Due: {formatDueDate(item.dueDate)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-medium text-gray-500">Total Actions</h4>
            <p className="mt-2 text-3xl font-bold text-gray-900">{actionItems.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-medium text-gray-500">Pending</h4>
            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {actionItems.filter(item => item.status !== 'completed').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-medium text-gray-500">Completed</h4>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {actionItems.filter(item => item.status === 'completed').length}
            </p>
          </div>
        </div>
    </div>
  );
};