// Application Configuration
// This file centralizes all configuration values that were previously hardcoded throughout the application

export const config = {
  api: {
    openai: {
      defaultModel: 'gpt-4o',
      whisperModel: 'whisper-1',
      audioFileName: 'chunk.webm',
      temperatures: {
        default: 0.3,
        creative: 0.8,
        standard: 0.5,
        titleGeneration: 0.5
      },
      maxTokens: {
        title: 50
      }
    }
  },

  validation: {
    apiKey: {
      prefix: 'sk-',
      minLength: 20,
      maxLength: 200
    },
    fileSizes: {
      maxAudioSize: 25 * 1024 * 1024, // 25MB
      maxTextLength: 10000
    },
    inputLengths: {
      maxMeetingTitle: 200,
      maxFolderName: 50,
      maxGeneratedTitle: 60,
      transcriptExcerpt: 1000
    },
    reservedNames: ['undefined', 'null', 'system', 'admin'],
    allowedAudioTypes: [
      'audio/mp3',
      'audio/mpeg',
      'audio/wav',
      'audio/webm',
      'audio/m4a',
      'audio/mp4'
    ]
  },

  rateLimiting: {
    openai: {
      maxRequests: 20,
      windowMs: 60000 // 1 minute
    },
    default: {
      maxRequests: 10,
      windowMs: 60000
    }
  },

  intervals: {
    meetingDetection: {
      browser: 5000, // 5 seconds
      native: 10000 // 10 seconds
    },
    recording: {
      dataCollection: 1000, // 1 second
      timerUpdate: 1000
    },
    ui: {
      pulsingAnimation: 1000,
      notificationTimeout: 3000,
      successMessageTimeout: 3000
    },
    development: {
      reactDevServerRetry: 1000
    }
  },

  audio: {
    constraints: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100
    }
  },

  window: {
    dimensions: {
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600
    },
    backgroundColor: '#f9fafb'
  },

  pricing: {
    models: {
      'gpt-4o-mini': {
        input: 0.15,
        output: 0.60
      },
      'gpt-4o': {
        input: 2.50,
        output: 10.00
      },
      'gpt-4-turbo-preview': {
        input: 10.00,
        output: 30.00
      }
    },
    whisperPerMinute: 0.006,
    usage: {
      averageMeetingDuration: 60, // minutes
      averageTokensPerMeeting: 15000,
      averageOutputTokens: 2000,
      minimumMeetingsForEstimation: 10
    }
  },

  performance: {
    webVitals: {
      CLS: 0.25,
      FID: 300,
      FCP: 3000,
      LCP: 4000,
      TTFB: 800
    }
  },

  defaults: {
    audioQuality: 'medium',
    autoStartRecording: false,
    meetingTemplate: 'custom',
    showMenuBar: true,
    menuBarAlwaysVisible: false,
    openAIModel: 'gpt-4o'
  },

  urls: {
    documentation: 'https://meetingmind.app/docs',
    support: 'https://meetingmind.app/support'
  },

  meetingDetection: {
    platforms: {
      zoom: { confidence: 0.9 },
      teams: { confidence: 0.7 },
      chrome: { confidence: 0.7 },
      safari: { confidence: 0.7 },
      slack: { confidence: 0.7 },
      discord: { confidence: 0.7 }
    },
    processBasedConfidence: 0.95
  },

  reminders: {
    allowedOffsets: [24, 48, 72] // hours
  },

  files: {
    icons: {
      tray: 'favicon.ico',
      app: 'logo.png',
      notification: '/logo.png'
    }
  }
};

// Export individual config sections for convenience
export const apiConfig = config.api;
export const validationConfig = config.validation;
export const rateLimitConfig = config.rateLimiting;
export const intervalsConfig = config.intervals;
export const audioConfig = config.audio;
export const windowConfig = config.window;
export const pricingConfig = config.pricing;
export const performanceConfig = config.performance;
export const defaultsConfig = config.defaults;
export const urlsConfig = config.urls;
export const meetingDetectionConfig = config.meetingDetection;
export const remindersConfig = config.reminders;
export const filesConfig = config.files;