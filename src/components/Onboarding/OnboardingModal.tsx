import React, { useState } from 'react';
import { 
  XMarkIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { 
  MicrophoneIcon, 
  DocumentTextIcon, 
  FolderIcon,
  SparklesIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/solid';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps: OnboardingStep[] = [
    {
      title: 'Welcome to MeetingMind! 🎉',
      description: 'Your AI-powered meeting assistant that helps you capture, transcribe, and enhance your meeting notes. Let\'s get you started!',
      icon: <RocketLaunchIcon className="w-16 h-16 text-indigo-600" />
    },
    {
      title: 'Record Your Meetings',
      description: 'Click the record button to capture audio from any meeting. MeetingMind will automatically transcribe your conversation in real-time.',
      icon: <MicrophoneIcon className="w-16 h-16 text-red-500" />,
      action: {
        label: 'Try Recording',
        onClick: () => {
          // This will be handled by parent component
          onClose();
        }
      }
    },
    {
      title: 'AI-Enhanced Notes',
      description: 'Our AI automatically enhances your transcripts with summaries, key points, and action items. No more manual note-taking!',
      icon: <SparklesIcon className="w-16 h-16 text-purple-500" />
    },
    {
      title: 'Organize with Folders',
      description: 'Keep your meetings organized with custom folders. Create folders for different projects, teams, or clients.',
      icon: <FolderIcon className="w-16 h-16 text-blue-500" />
    },
    {
      title: 'Export & Share',
      description: 'Export your meeting notes as PDF or Markdown. Share insights with your team or keep them for future reference.',
      icon: <DocumentTextIcon className="w-16 h-16 text-green-500" />
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps([...completedSteps, currentStep]);
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setCompletedSteps([...completedSteps, currentStep]);
    onComplete();
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          aria-hidden="true"
          onClick={handleSkip}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
            <button
              onClick={handleSkip}
              className="ml-4 text-gray-400 hover:text-gray-500 dark:text-slate-500 dark:hover:text-slate-400"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="text-center py-8">
            <div className="flex justify-center mb-6">
              {currentStepData.icon}
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {currentStepData.title}
            </h3>
            
            <p className="text-lg text-gray-600 dark:text-slate-300 max-w-md mx-auto mb-8">
              {currentStepData.description}
            </p>

            {currentStepData.action && (
              <button
                onClick={currentStepData.action.onClick}
                className="mb-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {currentStepData.action.label}
              </button>
            )}
          </div>

          {/* Step indicators */}
          <div className="flex justify-center space-x-2 mb-8">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep 
                    ? 'w-8 bg-indigo-600' 
                    : index < currentStep || completedSteps.includes(index)
                    ? 'bg-indigo-400'
                    : 'bg-gray-300 dark:bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={currentStep === 0 ? handleSkip : handlePrevious}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
            >
              {currentStep === 0 ? (
                'Skip Tour'
              ) : (
                <>
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Previous
                </>
              )}
            </button>

            <button
              onClick={handleNext}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Get Started
                  <CheckIcon className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};