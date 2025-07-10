import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface FeatureTooltipProps {
  targetRef: React.RefObject<HTMLElement | null>;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  onDismiss: () => void;
  delay?: number;
}

export const FeatureTooltip: React.FC<FeatureTooltipProps> = ({
  targetRef,
  title,
  description,
  position = 'bottom',
  onDismiss,
  delay = 1000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (targetRef.current) {
        const rect = targetRef.current.getBoundingClientRect();
        const tooltipWidth = 300;
        const tooltipHeight = 120;
        const offset = 10;

        let top = 0;
        let left = 0;

        switch (position) {
          case 'top':
            top = rect.top - tooltipHeight - offset;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case 'bottom':
            top = rect.bottom + offset;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
          case 'left':
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.left - tooltipWidth - offset;
            break;
          case 'right':
            top = rect.top + rect.height / 2 - tooltipHeight / 2;
            left = rect.right + offset;
            break;
        }

        // Ensure tooltip stays within viewport
        top = Math.max(10, Math.min(top, window.innerHeight - tooltipHeight - 10));
        left = Math.max(10, Math.min(left, window.innerWidth - tooltipWidth - 10));

        setTooltipPosition({ top, left });
        setIsVisible(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [targetRef, position, delay]);

  if (!isVisible) return null;

  const getArrowStyles = () => {
    const baseStyles = 'absolute w-0 h-0 border-solid';
    switch (position) {
      case 'top':
        return `${baseStyles} -bottom-2 left-1/2 transform -translate-x-1/2 border-t-8 border-l-8 border-r-8 border-t-white dark:border-t-slate-800 border-l-transparent border-r-transparent`;
      case 'bottom':
        return `${baseStyles} -top-2 left-1/2 transform -translate-x-1/2 border-b-8 border-l-8 border-r-8 border-b-white dark:border-b-slate-800 border-l-transparent border-r-transparent`;
      case 'left':
        return `${baseStyles} -right-2 top-1/2 transform -translate-y-1/2 border-l-8 border-t-8 border-b-8 border-l-white dark:border-l-slate-800 border-t-transparent border-b-transparent`;
      case 'right':
        return `${baseStyles} -left-2 top-1/2 transform -translate-y-1/2 border-r-8 border-t-8 border-b-8 border-r-white dark:border-r-slate-800 border-t-transparent border-b-transparent`;
    }
  };

  return (
    <div
      className="fixed z-50 w-72 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 animate-fade-in"
      style={{
        top: `${tooltipPosition.top}px`,
        left: `${tooltipPosition.left}px`,
      }}
    >
      {/* Arrow */}
      <div className={getArrowStyles()} />

      {/* Content */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            {title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            {description}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="ml-2 text-gray-400 hover:text-gray-500 dark:text-slate-500 dark:hover:text-slate-400"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};