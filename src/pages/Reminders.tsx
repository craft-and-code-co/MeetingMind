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
  FunnelIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { useStore } from '../store/useStore';
import { ReminderEditModal } from '../components/ReminderEditModal';
import { Reminder } from '../types';

export const Reminders: React.FC = () => {
  const navigate = useNavigate();
  const { reminders, meetings, updateReminder } = useStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'upcoming'>('pending');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const filteredReminders = reminders.filter(reminder => {
    // Hide completed reminders unless explicitly shown
    if (!showCompleted && reminder.status !== 'pending') return false;
    
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

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
  };

  const handleSaveEdit = (reminderId: string, updates: Partial<Reminder>) => {
    updateReminder(reminderId, updates);
    setEditingReminder(null);
  };

  const getMeeting = (meetingId: string) => {
    return meetings.find(m => m.id === meetingId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-slate-700 dark:text-slate-200';
    }
  };

  const getStatusColor = (reminder: Reminder) => {
    if (reminder.status !== 'pending') {
      return 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400';
    }
    const dueDate = new Date(reminder.dueDate);
    if (isBefore(dueDate, now)) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
    if (isBefore(dueDate, todayEnd)) {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    }
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
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
    completed: reminders.filter(r => r.status === 'sent').length,
  };

  return (
    <div className="max-w-none mx-auto px-6 py-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <BellIcon className="h-8 w-8 text-gray-400 dark:text-slate-500 mr-3" />
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">Total Reminders</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-blue-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">Pending</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">Overdue</p>
              <p className="text-2xl font-semibold text-red-600">{stats.overdue}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-orange-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400">Due Today</p>
              <p className="text-2xl font-semibold text-orange-600">{stats.dueToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
              >
                {showCompleted ? (
                  <>
                    <EyeSlashIcon className="h-4 w-4 mr-1" />
                    Hide Completed
                  </>
                ) : (
                  <>
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Show Completed ({stats.completed})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white"
              >
                <option value="all">All Reminders</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:text-white"
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
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Reminders ({filteredReminders.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-slate-700">
          {filteredReminders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <BellIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No reminders found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
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
                  className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-700 ${
                    reminder.status !== 'pending' ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {reminder.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
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
                                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
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
                                onClick={() => handleEdit(reminder)}
                                className="p-1 text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-600 rounded"
                                title="Edit reminder"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleComplete(reminder)}
                                className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                                title="Mark as complete"
                              >
                                <CheckIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDismiss(reminder)}
                                className="p-1 text-gray-400 hover:bg-gray-100 dark:text-slate-500 dark:hover:bg-slate-600 rounded"
                                title="Dismiss"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          {reminder.status === 'sent' && (
                            <span className="text-green-600 flex items-center">
                              <CheckIcon className="h-5 w-5 mr-1" />
                              Completed
                            </span>
                          )}
                          {reminder.status === 'dismissed' && (
                            <span className="text-gray-400 dark:text-slate-500 flex items-center">
                              <XMarkIcon className="h-5 w-5 mr-1" />
                              Dismissed
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

      {/* Edit Modal */}
      <ReminderEditModal
        reminder={editingReminder}
        isOpen={!!editingReminder}
        onClose={() => setEditingReminder(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
};