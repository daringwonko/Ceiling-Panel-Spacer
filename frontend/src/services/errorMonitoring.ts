/**
 * Error Monitoring Service
 * Privacy-safe error tracking without PII
 */

import analytics from './analytics';
import type { ErrorEvent } from '../types/analytics';

type ErrorCategory = ErrorEvent['errorCategory'];

interface ErrorMonitoringConfig {
  enabled: boolean;
  captureUnhandledExceptions: boolean;
  captureUnhandledRejections: boolean;
  maxErrorsPerSession: number;
  errorSamplingRate: number;
}

class ErrorMonitoringService {
  private config: ErrorMonitoringConfig;
  private errorCount = 0;
  private initialized = false;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): ErrorMonitoringConfig {
    try {
      const stored = localStorage.getItem('error_monitoring_config');
      if (stored) return JSON.parse(stored);
    } catch {}
    
    return {
      enabled: true,
      captureUnhandledExceptions: true,
      captureUnhandledRejections: true,
      maxErrorsPerSession: 100,
      errorSamplingRate: 1.0
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    if (this.config.enabled && this.config.captureUnhandledExceptions) {
      this.setupGlobalErrorHandler();
    }
    if (this.config.enabled && this.config.captureUnhandledRejections) {
      this.setupUnhandledRejectionHandler();
    }
    
    this.initialized = true;
  }

  private setupGlobalErrorHandler(): void {
    window.onerror = (message, source, lineno, colno, error) => {
      const category = this.categorizeError(error, message);
      const errorEvent = this.createErrorEvent(
        error?.name ?? 'UnhandledError',
        category,
        message ?? 'Unknown error',
        error?.stack,
        false
      );
      this.handleError(errorEvent);
      return false;
    };
  }

  private setupUnhandledRejectionHandler(): void {
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      this.createErrorEvent(
        reason?.name ?? 'UnhandledPromiseRejection',
        'runtime',
        reason?.message ?? 'Promise rejection',
        reason?.stack,
        false
      );
    });
  }

  private categorizeError(error: Error | undefined, message: string): ErrorCategory {
    const msg = (error?.message ?? message).toLowerCase();
    if (msg.includes('memory')) return 'memory';
    if (msg.includes('network')) return 'network';
    if (msg.includes('validation')) return 'validation';
    if (msg.includes('render')) return 'render';
    return 'runtime';
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private createErrorEvent(
    errorType: string,
    errorCategory: ErrorCategory,
    errorMessage: string,
    stackTrace?: string,
    isRecovered = true
  ): ErrorEvent {
    return {
      eventType: 'error',
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      deviceInfo: {
        platform: navigator.platform,
        userAgent: navigator.userAgent.substring(0, 100),
        language: navigator.language,
        timestamp: Date.now()
      },
      anonymousId: this.getAnonymousId(),
      errorType,
      errorCategory,
      errorMessage: this.hashString(errorMessage.substring(0, 200)),
      stackTrace: stackTrace ? this.hashString(stackTrace.substring(0, 500)) : undefined,
      isRecovered,
      frequencyCount: 1
    };
  }

  private getSessionId(): string {
    let id = localStorage.getItem('analytics_session_id');
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('analytics_session_id', id);
    }
    return id;
  }

  private getAnonymousId(): string {
    let id = localStorage.getItem('analytics_anonymous_id');
    if (!id) {
      id = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('analytics_anonymous_id', id);
    }
    return id;
  }

  private handleError(errorEvent: ErrorEvent): void {
    if (this.errorCount >= this.config.maxErrorsPerSession) return;
    this.errorCount++;
    analytics.recordError(
      errorEvent.errorType,
      errorEvent.errorCategory,
      errorEvent.errorMessage,
      errorEvent.stackTrace,
      undefined,
      errorEvent.isRecovered
    );
  }

  reportError(
    errorType: string,
    errorCategory: ErrorCategory,
    errorMessage: string,
    stackTrace?: string,
    isRecovered = true
  ): void {
    const event = this.createErrorEvent(errorType, errorCategory, errorMessage, stackTrace, isRecovered);
    this.handleError(event);
  }

  getConfig(): ErrorMonitoringConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<ErrorMonitoringConfig>): void {
    this.config = { ...this.config, ...config };
    localStorage.setItem('error_monitoring_config', JSON.stringify(this.config));
  }

  resetErrorCount(): void {
    this.errorCount = 0;
  }
}

export const errorMonitoring = new ErrorMonitoringService();
export default errorMonitoring;
