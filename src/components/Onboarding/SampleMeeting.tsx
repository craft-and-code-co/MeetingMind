import React from 'react';
import { PlayIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

interface SampleMeetingProps {
  onStart: () => void;
}

export const SampleMeeting: React.FC<SampleMeetingProps> = ({ onStart }) => {
  const sampleTranscript = `"Welcome everyone to today's product planning meeting. Let's start by reviewing our Q1 goals. Sarah, could you give us an update on the mobile app development?"

"Sure! We've completed the user authentication flow and are now working on the dashboard. We're about 60% done with the MVP features."

"Great progress! What about the timeline - are we still on track for the March launch?"

"We might need an extra week for testing, but overall yes, we should be ready by end of March."`;

  const sampleEnhancedNotes = {
    summary: 'Product planning meeting discussing Q1 goals and mobile app development progress.',
    keyPoints: [
      'User authentication flow completed',
      'Dashboard development in progress (60% complete)',
      'MVP on track for March launch with possible 1-week delay for testing'
    ],
    actionItems: [
      'Complete dashboard development',
      'Schedule testing phase for mid-March',
      'Prepare launch materials for end of March'
    ]
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Try a Sample Meeting
        </h2>
        <p className="text-gray-600 dark:text-slate-300">
          Experience how MeetingMind transforms your meetings into actionable insights
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Original Transcript */}
        <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <DocumentTextIcon className="w-5 h-5 mr-2 text-gray-500" />
            Raw Transcript
          </h3>
          <div className="text-sm text-gray-600 dark:text-slate-400 space-y-2 italic">
            {sampleTranscript.split('\n\n').map((paragraph, index) => (
              <p key={index} className="leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Enhanced Notes */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <CheckCircleIcon className="w-5 h-5 mr-2 text-indigo-600" />
            AI-Enhanced Notes
          </h3>
          
          <div className="space-y-4">
            {/* Summary */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Summary
              </h4>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                {sampleEnhancedNotes.summary}
              </p>
            </div>

            {/* Key Points */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Key Points
              </h4>
              <ul className="text-sm text-gray-600 dark:text-slate-400 space-y-1">
                {sampleEnhancedNotes.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-indigo-600 mr-2">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Items */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Action Items
              </h4>
              <ul className="text-sm text-gray-600 dark:text-slate-400 space-y-1">
                {sampleEnhancedNotes.actionItems.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-8">
        <button
          onClick={onStart}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlayIcon className="w-5 h-5 mr-2" />
          Try It Yourself
        </button>
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-500">
          Record your first meeting and see the magic happen!
        </p>
      </div>
    </div>
  );
};