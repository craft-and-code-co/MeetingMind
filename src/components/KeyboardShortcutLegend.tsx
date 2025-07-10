import React, { useState } from 'react';
import { QuestionMarkCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ShortcutItem {
  keys: string[];
  description: string;
}

export const KeyboardShortcutLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts: ShortcutItem[] = [
    { keys: ['⌘', 'R'], description: 'Start/Stop Recording' },
    { keys: ['⌘', 'N'], description: 'New Meeting' },
    { keys: ['⌘', 'E'], description: 'Export Current Meeting' },
    { keys: ['⌘', ','], description: 'Open Settings' },
    { keys: ['⌘', 'K'], description: 'Quick Search' },
    { keys: ['⌘', 'L'], description: 'Toggle Live Transcript' },
    { keys: ['⌘', 'D'], description: 'Toggle Dark Mode' },
    { keys: ['⌘', '/'], description: 'Open AI Assistant' },
    { keys: ['Esc'], description: 'Close Modal/Dialog' },
  ];

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-white dark:bg-slate-800 rounded-full shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-slate-700"
        aria-label="Keyboard shortcuts"
      >
        <QuestionMarkCircleIcon className="w-6 h-6 text-gray-600 dark:text-slate-300" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
            onClick={() => setIsOpen(false)}
          >
            {/* Background overlay */}
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" />

            {/* Modal content */}
            <div 
              className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-xl rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Keyboard Shortcuts
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-500 dark:text-slate-500 dark:hover:text-slate-400"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Shortcuts list */}
              <div className="space-y-3">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    <span className="text-sm text-gray-600 dark:text-slate-300">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center space-x-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          {keyIndex > 0 && (
                            <span className="text-gray-400 dark:text-slate-500">+</span>
                          )}
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600">
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500 dark:text-slate-500">
                  Press <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600">?</kbd> anytime to view shortcuts
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};