import React from 'react';
import { 
  CurrencyDollarIcon, 
  BoltIcon, 
  SparklesIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { CostEstimator } from './CostEstimator';

interface ModelInfo {
  id: 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo-preview';
  name: string;
  tier: 'Budget' | 'Standard' | 'Premium';
  costPer1M: number;
  costPerMeeting: string;
  monthlyCost: string;
  quality: 'Good' | 'Excellent' | 'Outstanding';
  speed: 'Fast' | 'Very Fast' | 'Moderate';
  bestFor: string[];
  description: string;
  icon: React.ReactNode;
  recommended?: boolean;
}

const models: ModelInfo[] = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    tier: 'Budget',
    costPer1M: 0.375, // $0.15 input + $0.60 output / 3 (assuming 3:1 input:output ratio)
    costPerMeeting: '$0.40-0.45',
    monthlyCost: '$12-40',
    quality: 'Good',
    speed: 'Very Fast',
    bestFor: [
      'Basic meeting notes',
      'Simple action items',
      'High-volume usage',
      'Cost-sensitive users'
    ],
    description: 'Perfect for everyday meetings and users who prioritize cost efficiency.',
    icon: <CurrencyDollarIcon className="h-6 w-6" />
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    tier: 'Standard',
    costPer1M: 5.00, // $2.50 input + $10 output / 3 (assuming 3:1 input:output ratio)
    costPerMeeting: '$0.45-0.75',
    monthlyCost: '$35-150',
    quality: 'Excellent',
    speed: 'Fast',
    bestFor: [
      'Most meeting types',
      'Detailed summaries',
      'Complex action items',
      'Professional use'
    ],
    description: 'The sweet spot for most users - excellent quality at reasonable cost.',
    icon: <BoltIcon className="h-6 w-6" />,
    recommended: true
  },
  {
    id: 'gpt-4-turbo-preview',
    name: 'GPT-4 Turbo',
    tier: 'Premium',
    costPer1M: 40.00,
    costPerMeeting: '$0.85-2.35',
    monthlyCost: '$180-650',
    quality: 'Outstanding',
    speed: 'Moderate',
    bestFor: [
      'Critical meetings',
      'Complex analysis',
      'Detailed insights',
      'Executive meetings'
    ],
    description: 'Maximum quality for your most important meetings and complex discussions.',
    icon: <SparklesIcon className="h-6 w-6" />
  }
];

interface ModelComparisonProps {
  selectedModel: string;
  onSelectModel: (model: 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo-preview') => void;
}

export const ModelComparison: React.FC<ModelComparisonProps> = ({
  selectedModel,
  onSelectModel
}) => {
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'Good': return 'text-green-600';
      case 'Excellent': return 'text-blue-600';
      case 'Outstanding': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case 'Very Fast': return 'text-green-600';
      case 'Fast': return 'text-blue-600';
      case 'Moderate': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Budget': return 'bg-green-100 text-green-800';
      case 'Standard': return 'bg-blue-100 text-blue-800';
      case 'Premium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Choose Your OpenAI Model
        </h3>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Select the model that best fits your needs and budget. You can change this anytime.
        </p>
      </div>

      {/* Cost Comparison Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Cost Estimation</p>
            <p>
              Costs are estimated for typical 1-hour meetings (~15,000 tokens). 
              Actual costs vary based on meeting length and complexity.
            </p>
          </div>
        </div>
      </div>

      {/* Model Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {models.map((model) => (
          <div
            key={model.id}
            className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
              selectedModel === model.id
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
            }`}
            onClick={() => onSelectModel(model.id as 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo-preview')}
          >
            {model.recommended && (
              <div className="absolute -top-2 left-4">
                <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                  Recommended
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="text-indigo-600">
                  {model.icon}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{model.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${getTierColor(model.tier)}`}>
                    {model.tier}
                  </span>
                </div>
              </div>
              {selectedModel === model.id && (
                <CheckCircleIcon className="h-5 w-5 text-indigo-600" />
              )}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-slate-400">Per meeting:</span>
                <span className="font-medium">{model.costPerMeeting}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-slate-400">Monthly (avg):</span>
                <span className="font-medium">{model.monthlyCost}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-slate-400">Quality:</span>
                <span className={`font-medium ${getQualityColor(model.quality)}`}>
                  {model.quality}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-slate-400">Speed:</span>
                <span className={`font-medium ${getSpeedColor(model.speed)}`}>
                  {model.speed}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
              {model.description}
            </p>

            <div>
              <h5 className="text-xs font-medium text-gray-700 dark:text-slate-300 mb-2">Best for:</h5>
              <ul className="text-xs text-gray-600 dark:text-slate-400 space-y-1">
                {model.bestFor.map((item, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-1 h-1 bg-gray-400 dark:bg-slate-600 rounded-full mr-2"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Savings Comparison */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">💰 Potential Savings</h4>
        <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
          <p>
            <strong>Budget vs Premium:</strong> Save up to 98% on processing costs
          </p>
          <p>
            <strong>Standard vs Premium:</strong> Save up to 69% while maintaining excellent quality
          </p>
          <p className="text-xs text-green-700 dark:text-green-300 mt-2">
            * Savings calculated based on typical usage patterns
          </p>
        </div>
      </div>

      {/* Cost Estimator */}
      <CostEstimator selectedModel={selectedModel} />
    </div>
  );
};