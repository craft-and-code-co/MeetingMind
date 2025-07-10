import React, { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  ClockIcon, 
  DocumentTextIcon,
  InformationCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useStore } from '../store/useStore';
import { pricingConfig } from '../config';

interface CostEstimatorProps {
  selectedModel: string;
}

// Get pricing from config
const MODEL_COSTS = pricingConfig.models;
const WHISPER_COST_PER_MINUTE = pricingConfig.whisperPerMinute;

export const CostEstimator: React.FC<CostEstimatorProps> = ({ selectedModel }) => {
  const { meetings } = useStore();
  const [estimatedCosts, setEstimatedCosts] = useState({
    perMeeting: 0,
    monthly: 0,
    yearly: 0,
    totalSaved: 0
  });

  useEffect(() => {
    const calculateCosts = () => {
      const modelCost = MODEL_COSTS[selectedModel as keyof typeof MODEL_COSTS] || MODEL_COSTS['gpt-4o'];
      const premiumCost = MODEL_COSTS['gpt-4-turbo-preview'];
      
      // Estimate tokens per meeting from config
      const avgMeetingMinutes = pricingConfig.usage.averageMeetingDuration;
      const avgTokensPerMeeting = pricingConfig.usage.averageTokensPerMeeting;
      const avgOutputTokens = pricingConfig.usage.averageOutputTokens;
      
      // Calculate Whisper transcription cost
      const whisperCost = avgMeetingMinutes * WHISPER_COST_PER_MINUTE;
      
      // Calculate GPT processing cost
      const gptCost = (
        (avgTokensPerMeeting * modelCost.input / 1000000) + 
        (avgOutputTokens * modelCost.output / 1000000)
      );
      
      // Total cost per meeting
      const costPerMeeting = whisperCost + gptCost;
      
      // Calculate premium cost for comparison
      const premiumGptCost = (
        (avgTokensPerMeeting * premiumCost.input / 1000000) + 
        (avgOutputTokens * premiumCost.output / 1000000)
      );
      const premiumCostPerMeeting = whisperCost + premiumGptCost;
      
      // Estimate based on user's meeting frequency
      const recentMeetings = meetings.filter(m => {
        const meetingDate = new Date(m.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return meetingDate >= thirtyDaysAgo;
      }).length;
      
      const meetingsPerMonth = Math.max(recentMeetings, 10); // Minimum 10 for estimation
      const meetingsPerYear = meetingsPerMonth * 12;
      
      const monthlyCost = costPerMeeting * meetingsPerMonth;
      const yearlyCost = costPerMeeting * meetingsPerYear;
      
      // Calculate savings vs premium
      const monthlyPremiumCost = premiumCostPerMeeting * meetingsPerMonth;
      const totalSaved = monthlyPremiumCost - monthlyCost;
      
      setEstimatedCosts({
        perMeeting: costPerMeeting,
        monthly: monthlyCost,
        yearly: yearlyCost,
        totalSaved: Math.max(0, totalSaved)
      });
    };

    calculateCosts();
  }, [selectedModel, meetings]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getSavingsPercentage = () => {
    const premiumCost = MODEL_COSTS['gpt-4-turbo-preview'];
    const currentCost = MODEL_COSTS[selectedModel as keyof typeof MODEL_COSTS] || MODEL_COSTS['gpt-4o'];
    
    const avgTokens = 15000;
    const avgOutput = 2000;
    
    const premiumTotal = (avgTokens * premiumCost.input + avgOutput * premiumCost.output) / 1000000;
    const currentTotal = (avgTokens * currentCost.input + avgOutput * currentCost.output) / 1000000;
    
    return Math.round((1 - currentTotal / premiumTotal) * 100);
  };

  return (
    <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <CurrencyDollarIcon className="h-5 w-5 mr-2" />
          Cost Estimation
        </h4>
        <div className="flex items-center text-sm text-gray-500 dark:text-slate-400">
          <InformationCircleIcon className="h-4 w-4 mr-1" />
          Based on typical usage
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Per Meeting</span>
            <ClockIcon className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(estimatedCosts.perMeeting)}
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Based on 1-hour meeting
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Monthly</span>
            <DocumentTextIcon className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(estimatedCosts.monthly)}
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            ~{Math.round(estimatedCosts.monthly / estimatedCosts.perMeeting)} meetings/month
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Yearly</span>
            <ChartBarIcon className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(estimatedCosts.yearly)}
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Projected annual cost
          </p>
        </div>
      </div>

      {estimatedCosts.totalSaved > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-medium text-green-900 dark:text-green-100">
                💰 You're saving {getSavingsPercentage()}% vs Premium
              </h5>
              <p className="text-sm text-green-800 dark:text-green-200">
                {formatCurrency(estimatedCosts.totalSaved)} saved per month compared to GPT-4 Turbo
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {formatCurrency(estimatedCosts.totalSaved * 12)}
              </div>
              <p className="text-xs text-green-700 dark:text-green-300">Annual savings</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <div className="flex items-start">
          <InformationCircleIcon className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">How we calculate costs:</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>Whisper transcription: $0.006 per minute ($0.36 per hour)</li>
              <li>GPT processing: Based on current pricing per 1M tokens</li>
              <li>Estimates ~15,000 input tokens + ~2,000 output tokens per hour</li>
              <li>Total cost = Whisper + GPT processing fees</li>
              <li>Actual costs vary based on meeting length and complexity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};