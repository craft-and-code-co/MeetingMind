import React from 'react';
import { meetingTemplates } from '../data/meetingTemplates';
import { CheckIcon } from '@heroicons/react/24/outline';

interface TemplateSelectorProps {
  selectedTemplateId?: string;
  onSelectTemplate: (templateId: string) => void;
  showInSettings?: boolean;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplateId,
  onSelectTemplate,
  showInSettings = false
}) => {
  return (
    <div className={showInSettings ? 'space-y-2' : 'grid grid-cols-2 gap-3'}>
      {meetingTemplates.map(template => (
        <button
          key={template.id}
          onClick={() => onSelectTemplate(template.id)}
          className={`
            ${showInSettings 
              ? 'w-full flex items-center justify-between p-3' 
              : 'flex flex-col items-center p-4'
            }
            rounded-lg border-2 transition-all
            ${selectedTemplateId === template.id
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-slate-800'
            }
          `}
        >
          <div className={showInSettings ? 'flex items-center' : 'text-center'}>
            <span className={`text-2xl ${showInSettings ? 'mr-3' : 'mb-2'}`}>
              {template.icon}
            </span>
            <div className={showInSettings ? 'text-left' : ''}>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {template.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                {template.description}
              </p>
            </div>
          </div>
          {selectedTemplateId === template.id && (
            <CheckIcon className="h-5 w-5 text-indigo-600" />
          )}
        </button>
      ))}
    </div>
  );
};