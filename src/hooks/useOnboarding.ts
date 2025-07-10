import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

export interface OnboardingState {
  hasCompletedOnboarding: boolean;
  hasSeenRecordingTooltip: boolean;
  hasSeenFolderTooltip: boolean;
  hasSeenExportTooltip: boolean;
  hasRecordedFirstMeeting: boolean;
}

const ONBOARDING_KEY = 'meetingmind_onboarding';

export const useOnboarding = () => {
  const { meetings } = useStore();
  
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(() => {
    const saved = localStorage.getItem(ONBOARDING_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      hasCompletedOnboarding: false,
      hasSeenRecordingTooltip: false,
      hasSeenFolderTooltip: false,
      hasSeenExportTooltip: false,
      hasRecordedFirstMeeting: false,
    };
  });

  // Check if user has recorded their first meeting
  useEffect(() => {
    if (meetings.length > 0 && !onboardingState.hasRecordedFirstMeeting) {
      updateOnboardingState({ hasRecordedFirstMeeting: true });
    }
  }, [meetings.length, onboardingState.hasRecordedFirstMeeting]);

  const updateOnboardingState = (updates: Partial<OnboardingState>) => {
    setOnboardingState(prev => {
      const newState = { ...prev, ...updates };
      localStorage.setItem(ONBOARDING_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  const completeOnboarding = () => {
    updateOnboardingState({ hasCompletedOnboarding: true });
  };

  const markTooltipSeen = (tooltip: keyof OnboardingState) => {
    updateOnboardingState({ [tooltip]: true });
  };

  const resetOnboarding = () => {
    const resetState: OnboardingState = {
      hasCompletedOnboarding: false,
      hasSeenRecordingTooltip: false,
      hasSeenFolderTooltip: false,
      hasSeenExportTooltip: false,
      hasRecordedFirstMeeting: false,
    };
    setOnboardingState(resetState);
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(resetState));
  };

  const shouldShowOnboarding = !onboardingState.hasCompletedOnboarding;

  const shouldShowTooltip = (tooltip: keyof OnboardingState): boolean => {
    // Don't show tooltips if onboarding hasn't been completed
    if (!onboardingState.hasCompletedOnboarding) return false;
    
    // Check specific tooltip
    switch (tooltip) {
      case 'hasSeenRecordingTooltip':
        return !onboardingState.hasSeenRecordingTooltip;
      case 'hasSeenFolderTooltip':
        return onboardingState.hasRecordedFirstMeeting && !onboardingState.hasSeenFolderTooltip;
      case 'hasSeenExportTooltip':
        return onboardingState.hasRecordedFirstMeeting && !onboardingState.hasSeenExportTooltip;
      default:
        return false;
    }
  };

  return {
    onboardingState,
    shouldShowOnboarding,
    shouldShowTooltip,
    completeOnboarding,
    markTooltipSeen,
    resetOnboarding,
  };
};