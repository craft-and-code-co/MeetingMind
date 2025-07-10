import React from 'react';
import { 
  MicrophoneIcon, 
  DocumentTextIcon, 
  CheckCircleIcon, 
  BellIcon 
} from '@heroicons/react/24/outline';
import { StatCard } from '../../../components/Card';

interface QuickStatsProps {
  totalMeetings: number;
  totalNotes: number;
  pendingActionItems: number;
  pendingReminders: number;
}

export const QuickStats: React.FC<QuickStatsProps> = React.memo(({
  totalMeetings,
  totalNotes,
  pendingActionItems,
  pendingReminders
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        icon={<MicrophoneIcon className="h-8 w-8" />}
        iconColor="text-indigo-600"
        label="Total Meetings"
        value={totalMeetings}
      />
      
      <StatCard
        icon={<DocumentTextIcon className="h-8 w-8" />}
        iconColor="text-blue-600"
        label="Total Notes"
        value={totalNotes}
      />
      
      <StatCard
        icon={<CheckCircleIcon className="h-8 w-8" />}
        iconColor="text-green-600"
        label="Pending Actions"
        value={pendingActionItems}
      />
      
      <StatCard
        icon={<BellIcon className="h-8 w-8" />}
        iconColor="text-purple-600"
        label="Active Reminders"
        value={pendingReminders}
      />
    </div>
  );
});