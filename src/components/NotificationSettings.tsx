import React, { useState, useEffect } from 'react';
import { BellIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { notificationService } from '../services/notifications';
import { useStore } from '../store/useStore';

export const NotificationSettings: React.FC = () => {
  const { settings, setSettings } = useStore();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(notificationService.isSupported());
    setPermission(notificationService.getPermission());
  }, []);

  const handleRequestPermission = async () => {
    const newPermission = await notificationService.requestPermission();
    setPermission(newPermission);
  };

  const handleTestNotification = async () => {
    await notificationService.show({
      title: 'Test Notification',
      body: 'This is a test notification from MeetingMind',
      tag: 'test'
    });
  };

  const handleToggleNotifications = (type: string, enabled: boolean) => {
    setSettings({
      ...settings,
      [`${type}Notifications`]: enabled
    });
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { text: 'Granted', color: 'text-green-600', icon: CheckIcon };
      case 'denied':
        return { text: 'Denied', color: 'text-red-600', icon: XMarkIcon };
      default:
        return { text: 'Not requested', color: 'text-gray-600', icon: BellIcon };
    }
  };

  const status = getPermissionStatus();
  const StatusIcon = status.icon;

  if (!isSupported) {
    return (
      <div className="px-6 py-4">
        <p className="text-sm text-gray-500">
          Notifications are not supported in this browser.
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Permission Status</h3>
          <div className="flex items-center mt-1">
            <StatusIcon className={`h-4 w-4 mr-2 ${status.color}`} />
            <span className={`text-sm ${status.color}`}>{status.text}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          {permission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Enable Notifications
            </button>
          )}
          {permission === 'granted' && (
            <button
              onClick={handleTestNotification}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600">
              Test Notification
            </button>
          )}
        </div>
      </div>

      {permission === 'granted' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Meeting Notifications</h4>
              <p className="text-sm text-gray-500 dark:text-slate-400">Get notified when meetings start and end</p>
            </div>
            <input
              type="checkbox"
              checked={settings.meetingNotifications !== false}
              onChange={(e) => handleToggleNotifications('meeting', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-slate-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Transcription Notifications</h4>
              <p className="text-sm text-gray-500 dark:text-slate-400">Get notified when transcription is ready</p>
            </div>
            <input
              type="checkbox"
              checked={settings.transcriptionNotifications !== false}
              onChange={(e) => handleToggleNotifications('transcription', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-slate-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Action Item Notifications</h4>
              <p className="text-sm text-gray-500 dark:text-slate-400">Get notified about due action items</p>
            </div>
            <input
              type="checkbox"
              checked={settings.actionItemNotifications !== false}
              onChange={(e) => handleToggleNotifications('actionItem', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-slate-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Reminder Notifications</h4>
              <p className="text-sm text-gray-500 dark:text-slate-400">Get notified about reminders</p>
            </div>
            <input
              type="checkbox"
              checked={settings.reminderNotifications !== false}
              onChange={(e) => handleToggleNotifications('reminder', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-slate-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Meeting Detection</h4>
              <p className="text-sm text-gray-500 dark:text-slate-400">Get notified when meetings are detected</p>
            </div>
            <input
              type="checkbox"
              checked={settings.meetingDetectionNotifications !== false}
              onChange={(e) => handleToggleNotifications('meetingDetection', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-slate-600 rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
};