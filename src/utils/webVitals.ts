import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';
import { performanceConfig } from '../config';

/**
 * Report web vitals to analytics service
 */
function sendToAnalytics(metric: Metric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}`, metric);

    // Warn about poor performance
    const thresholds = performanceConfig.webVitals;
    
    if (thresholds[metric.name] && metric.value > thresholds[metric.name]) {
      console.warn(`[Web Vitals] Poor ${metric.name} performance detected:`, metric.value);
    }
  }

  // In production, send to analytics service
  if (process.env.NODE_ENV === 'production') {
    // Example implementation:
    // fetch('/api/analytics/vitals', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     metric: metric.name,
    //     value: metric.value,
    //     timestamp: Date.now(),
    //   }),
    // });
  }
}

/**
 * Initialize web vitals monitoring
 */
export function reportWebVitals() {
  getCLS(sendToAnalytics);  // Cumulative Layout Shift
  getFID(sendToAnalytics);  // First Input Delay
  getFCP(sendToAnalytics);  // First Contentful Paint
  getLCP(sendToAnalytics);  // Largest Contentful Paint
  getTTFB(sendToAnalytics); // Time to First Byte
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics() {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (!navigation) return null;

  return {
    // Network timings
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    request: navigation.responseStart - navigation.requestStart,
    response: navigation.responseEnd - navigation.responseStart,
    
    // Processing timings
    processing: navigation.domComplete - navigation.domInteractive,
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    load: navigation.loadEventEnd - navigation.loadEventStart,
    
    // Key metrics
    ttfb: navigation.responseStart - navigation.fetchStart,
    domInteractive: navigation.domInteractive - navigation.fetchStart,
    domComplete: navigation.domComplete - navigation.fetchStart,
    loadComplete: navigation.loadEventEnd - navigation.fetchStart,
  };
}