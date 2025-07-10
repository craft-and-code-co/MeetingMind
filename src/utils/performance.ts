import React, { useEffect } from 'react';

/**
 * Performance monitoring utilities
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private enabled: boolean = process.env.NODE_ENV === 'development';

  /**
   * Start measuring a performance metric
   */
  startMeasure(name: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    });

    if (performance.mark) {
      performance.mark(`${name}-start`);
    }
  }

  /**
   * End measuring a performance metric
   */
  endMeasure(name: string): PerformanceMetric | null {
    if (!this.enabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric ${name} was not started`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    if (performance.mark && performance.measure) {
      performance.mark(`${name}-end`);
      try {
        performance.measure(name, `${name}-start`, `${name}-end`);
      } catch (e) {
        // Marks might not exist
      }
    }

    // Log slow operations
    if (metric.duration > 100) {
      console.warn(`Slow operation detected: ${name} took ${metric.duration.toFixed(2)}ms`, metric.metadata);
    }

    return metric;
  }

  /**
   * Log component render time
   */
  logRender(componentName: string, renderTime: number): void {
    if (!this.enabled) return;

    if (renderTime > 16) { // More than one frame (60fps = 16.67ms per frame)
      console.warn(`Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    if (performance.clearMarks) {
      performance.clearMarks();
    }
    if (performance.clearMeasures) {
      performance.clearMeasures();
    }
  }

  /**
   * Report metrics to analytics service
   */
  reportMetrics(): void {
    if (!this.enabled) return;

    const metrics = this.getMetrics();
    const slowMetrics = metrics.filter(m => m.duration && m.duration > 100);

    if (slowMetrics.length > 0) {
      console.table(slowMetrics.map(m => ({
        name: m.name,
        duration: `${m.duration?.toFixed(2)}ms`,
        ...m.metadata
      })));

      // In production, send to analytics service
      if (process.env.NODE_ENV === 'production') {
        // Example: sendToAnalytics(slowMetrics);
      }
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for measuring component performance
 */
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    performanceMonitor.startMeasure(`mount-${componentName}`);
    
    return () => {
      const metric = performanceMonitor.endMeasure(`mount-${componentName}`);
      if (metric && metric.duration) {
        performanceMonitor.logRender(componentName, metric.duration);
      }
    };
  }, [componentName]);
}

/**
 * HOC for monitoring component performance
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => {
    usePerformanceMonitor(componentName);
    return React.createElement(Component, props);
  };
  
  WrappedComponent.displayName = `withPerformanceMonitoring(${componentName})`;
  
  return React.memo(WrappedComponent);
}