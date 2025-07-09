import React, { useState } from 'react';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { 
  BellIcon, 
  CalendarIcon, 
  CheckIcon, 
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useStore } from '../store/useStore';
import { Reminder } from '../types';

export const Reminders: React.FC = () => {
  const navigate = useNavigate();
  const { reminders, meetings, updateReminder, deleteReminder } = useStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'upcoming'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const filteredReminders = reminders.filter(reminder => {
    // Status filter
    if (filter === 'pending' && reminder.status !== 'pending') return false;
    if (filter === 'overdue' && (
      reminder.status !== 'pending' || 
      !isBefore(new Date(reminder.dueDate), now)
    )) return false;
    if (filter === 'upcoming' && (
      reminder.status !== 'pending' ||
      isBefore(new Date(reminder.dueDate), now)
    )) return false;

    // Priority filter
    if (priorityFilter !== 'all' && reminder.priority !== priorityFilter) return false;

    return true;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const handleComplete = (reminder: Reminder) => {
    updateReminder(reminder.id, { status: 'sent' });
    if (reminder.actionItemId) {
      const { updateActionItem } = useStore.getState();
      updateActionItem(reminder.actionItemId, { status: 'completed' });
    }
  };

  const handleDismiss = (reminder: Reminder) => {
    updateReminder(reminder.id, { status: 'dismissed' });
  };

  const getMeeting = (meetingId: string) => {
    return meetings.find(m => m.id === meetingId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (reminder: Reminder) => {
    if (reminder.status !== 'pending') {
      return 'bg-gray-100 text-gray-600';
    }
    const dueDate = new Date(reminder.dueDate);
    if (isBefore(dueDate, now)) {
      return 'bg-red-100 text-red-800';
    }
    if (isBefore(dueDate, todayEnd)) {
      return 'bg-orange-100 text-orange-800';
    }
    return 'bg-green-100 text-green-800';
  };

  const stats = {
    total: reminders.length,
    pending: reminders.filter(r => r.status === 'pending').length,
    overdue: reminders.filter(r => 
      r.status === 'pending' && isBefore(new Date(r.dueDate), now)
    ).length,
    dueToday: reminders.filter(r => 
      r.status === 'pending' && 
      isAfter(new Date(r.dueDate), todayStart) && 
      isBefore(new Date(r.dueDate), todayEnd)
    ).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Smart Reminders</h1>
            <nav className="flex space-x-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </button>
              <button 
                onClick={() => navigate('/action-items')}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Action Items
              </button>
              <button 
                onClick={() => navigate('/reminders')}
                className="text-gray-900 bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
              >
                Reminders
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <BellIcon className="h-8 w-8 text-gray-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Total Reminders</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-blue-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Overdue</p>
                <p className="text-2xl font-semibold text-red-600">{stats.overdue}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-orange-400 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Due Today</p>
                <p className="text-2xl font-semibold text-orange-600">{stats.dueToday}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filters
              </h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="all">All Reminders</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                  <option value="upcoming">Upcoming</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Reminders List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Reminders ({filteredReminders.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredReminders.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No reminders found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filter === 'all' 
                    ? 'Reminders will appear here after meetings are processed.'
                    : 'No reminders match your current filters.'}
                </p>
              </div>
            ) : (
              filteredReminders.map((reminder) => {
                const meeting = getMeeting(reminder.meetingId);
                const isOverdue = reminder.status === 'pending' && isBefore(new Date(reminder.dueDate), now);
                
                return (
                  <div
                    key={reminder.id}
                    className={`px-6 py-4 hover:bg-gray-50 ${
                      reminder.status !== 'pending' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start">
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900">
                              {reminder.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {reminder.description}
                            </p>
                            <div className="flex items-center mt-2 space-x-4 text-xs">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${getPriorityColor(reminder.priority)}`}>
                                {reminder.priority} priority
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${getStatusColor(reminder)}`}>
                                {isOverdue ? 'Overdue' : format(new Date(reminder.dueDate), 'MMM d, yyyy')}
                              </span>
                              {meeting && (
                                <button
                                  onClick={() => navigate(`/meeting/${meeting.id}`)}
                                  className="text-indigo-600 hover:text-indigo-500"
                                >
                                  From: {meeting.title}
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="ml-4 flex items-center space-x-2">
                            {reminder.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleComplete(reminder)}
                                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                                  title="Mark as complete"
                                >
                                  <CheckIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDismiss(reminder)}
                                  className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                  title="Dismiss"
                                >
                                  <XMarkIcon className="h-5 w-5" />
                                </button>
                              </>
                            )}
                            {reminder.status === 'sent' && (
                              <span className="text-green-600">
                                <CheckIcon className="h-5 w-5" />
                              </span>
                            )}
                            {reminder.status === 'dismissed' && (
                              <span className="text-gray-400">
                                <XMarkIcon className="h-5 w-5" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
};