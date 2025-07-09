import React, { useEffect, useState } from 'react';
import { format, formatDistanceToNow, isAfter } from 'date-fns';
import { BellIcon, XMarkIcon, CheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useStore } from '../store/useStore';
import { Reminder } from '../types';

export const RemindersWidget: React.FC = () => {
  const { reminders, updateReminder, getPendingReminders } = useStore();
  const [showWidget, setShowWidget] = useState(false);
  const [expandedReminder, setExpandedReminder] = useState<string | null>(null);
  
  const pendingReminders = getPendingReminders();
  const upcomingReminders = reminders.filter(
    r => r.status === 'pending' && isAfter(new Date(r.reminderDate), new Date())
  ).sort((a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime());

  useEffect(() => {
    // Show widget if there are pending reminders
    if (pendingReminders.length > 0) {
      setShowWidget(true);
    }
  }, [pendingReminders.length]);

  const handleDismiss = (reminder: Reminder) => {
    updateReminder(reminder.id, { status: 'dismissed' });
  };

  const handleComplete = (reminder: Reminder) => {
    updateReminder(reminder.id, { status: 'sent' });
    // Also update the associated action item if it exists
    if (reminder.actionItemId) {
      const { updateActionItem } = useStore.getState();
      updateActionItem(reminder.actionItemId, { status: 'completed' });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (!showWidget || (pendingReminders.length === 0 && upcomingReminders.length === 0)) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 w-96 max-h-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <BellIcon className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">
            Reminders ({pendingReminders.length + upcomingReminders.length})
          </h3>
        </div>
        <button
          onClick={() => setShowWidget(false)}
          className="text-gray-400 hover:text-gray-500"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto max-h-80">
        {/* Pending Reminders */}
        {pendingReminders.length > 0 && (
          <div className="p-4">
            <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">
              Due Now
            </h4>
            <div className="space-y-2">
              {pendingReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="bg-red-50 border border-red-200 rounded-md p-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-gray-900">
                        {reminder.title}
                      </h5>
                      {expandedReminder === reminder.id && (
                        <p className="text-xs text-gray-600 mt-1">
                          {reminder.description}
                        </p>
                      )}
                      <p className="text-xs text-red-600 mt-1">
                        Due: {format(new Date(reminder.dueDate), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={() => handleComplete(reminder)}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                        title="Mark as complete"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDismiss(reminder)}
                        className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                        title="Dismiss"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedReminder(
                      expandedReminder === reminder.id ? null : reminder.id
                    )}
                    className="text-xs text-red-600 hover:text-red-700 mt-1"
                  >
                    {expandedReminder === reminder.id ? 'Show less' : 'Show more'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Reminders */}
        {upcomingReminders.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Upcoming
            </h4>
            <div className="space-y-2">
              {upcomingReminders.slice(0, 5).map((reminder) => (
                <div
                  key={reminder.id}
                  className={`rounded-md p-2 ${getPriorityColor(reminder.priority)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="text-sm font-medium">
                        {reminder.title}
                      </h5>
                      <p className="text-xs opacity-75 mt-0.5 flex items-center">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(reminder.reminderDate), { addSuffix: true })}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium`}>
                      {reminder.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};