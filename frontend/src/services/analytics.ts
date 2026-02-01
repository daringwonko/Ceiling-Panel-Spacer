/**
 * Privacy-First Analytics Service
 * Client-side analytics with local computation - no data transmission
 */

import type {
  AnalyticsEventType,
  BaseAnalyticsEvent,
  FeatureUsageEvent,
  SessionEvent,
  InteractionEvent,
  NavigationEvent,
  PerformanceMetrics,
  ErrorEvent,
  AggregatedAnalytics,
  FeatureUsageSummary,
  SessionSummary,
  InteractionSummary,
  PerformanceSummary,
  ErrorSummary,
  AnalyticsConfig,
  ConsentStatus,
  DeviceInfo
} from '../types/analytics';

// Generate anonymous session ID
function generateAnonymousId(): string {
  const stored = localStorage.getItem('analytics_anonymous_id');
  if (stored) return stored;
  
  const newId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  localStorage.setItem('analytics_anonymous_id', newId);
  return newId;
}

// Get device info (minimal, no PII)
function getDeviceInfo(): DeviceInfo {
  return {
    platform: navigator.platform,
    userAgent: navigator.userAgent.substring(0, 100), // Truncate for privacy
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timestamp: Date.now()
  };
}

class PrivacyFirstAnalyticsService {
  private config: AnalyticsConfig;
  private consentStatus: ConsentStatus | null = null;
  private sessionId: string;
  private anonymousId: string;
  private events: BaseAnalyticsEvent[] = [];
  private performanceHistory: PerformanceMetrics[] = [];
  private errorFrequency: Map<string, number> = new Map();
  private initialized = false;

  constructor() {
    this.config = this.loadConfig();
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.anonymousId = generateAnonymousId();
  }

  private loadConfig(): AnalyticsConfig {
    try {
      const stored = localStorage.getItem('analytics_config');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }
    
    // Default configuration
    return {
      enabled: true,
      optInRequired: true,
      storageType: 'localStorage',
      retentionDays: 30,
      sampleRate: 1.0,
      trackPerformance: true,
      trackErrors: true,
      trackInteractions: true
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Load consent status
    await this.loadConsentStatus();
    
    // Load existing events from storage
    await this.loadEventsFromStorage();
    
    // Set up performance monitoring
    if (this.config.trackPerformance && this.hasConsent('performance')) {
      this.startPerformanceMonitoring();
    }
    
    // Set up error tracking
    if (this.config.trackErrors && this.hasConsent('errors')) {
      this.startErrorMonitoring();
    }
    
    // Record session start
    if (this.hasConsent('analytics')) {
      this.recordSessionStart();
    }
    
    this.initialized = true;
  }

  private async loadConsentStatus(): Promise<void> {
    try {
      const stored = localStorage.getItem('analytics_consent');
      if (stored) {
        this.consentStatus = JSON.parse(stored);
      }
    } catch {
      this.consentStatus = null;
    }
  }

  private async loadEventsFromStorage(): Promise<void> {
    if (!this.hasConsent('analytics')) return;
    
    try {
      const stored = localStorage.getItem('analytics_events');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.events = Array.isArray(parsed) ? parsed : [];
        
        // Clean old events
        const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;
        const cutoff = Date.now() - retentionMs;
        this.events = this.events.filter(e => e.timestamp > cutoff);
      }
    } catch {
      this.events = [];
    }
  }

  private hasConsent(category: keyof Omit<ConsentStatus, 'timestamp' | 'version'>): boolean {
    if (!this.config.enabled) return false;
    if (!this.config.optInRequired) return true;
    return this.consentStatus?.[category] ?? false;
  }

  // Consent management
  async setConsent(status: Partial<ConsentStatus>): Promise<void> {
    this.consentStatus = {
      analytics: status.analytics ?? false,
      federatedLearning: status.federatedLearning ?? false,
      performance: status.performance ?? false,
      errors: status.errors ?? false,
      timestamp: Date.now(),
      version: '1.0'
    };
    
    localStorage.setItem('analytics_consent', JSON.stringify(this.consentStatus));
    
    // Reinitialize based on new consent
    await this.initialize();
  }

  getConsentStatus(): ConsentStatus | null {
    return this.consentStatus;
  }

  // Event recording methods
  recordFeatureUsage(
    featureName: string,
    featureCategory: string,
    duration?: number,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.hasConsent('analytics')) return;
    
    const event: FeatureUsageEvent = {
      eventType: 'feature_usage',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      deviceInfo: getDeviceInfo(),
      anonymousId: this.anonymousId,
      featureName,
      featureCategory,
      duration,
      metadata
    };
    
    this.events.push(event);
    this.saveEvents();
  }

  recordInteraction(
    interactionType: InteractionEvent['interactionType'],
    targetElement?: string,
    targetCategory?: string,
    coordinates?: { x: number; y: number },
    duration?: number
  ): void {
    if (!this.hasConsent('analytics') || !this.config.trackInteractions) return;
    
    const event: InteractionEvent = {
      eventType: 'interaction',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      deviceInfo: getDeviceInfo(),
      anonymousId: this.anonymousId,
      interactionType,
      targetElement,
      targetCategory,
      coordinates,
      duration
    };
    
    this.events.push(event);
    this.saveEvents();
  }

  recordNavigation(
    fromView: string,
    toView: string,
    navigationMethod: NavigationEvent['navigationMethod']
  ): void {
    if (!this.hasConsent('analytics')) return;
    
    const event: NavigationEvent = {
      eventType: 'navigation',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      deviceInfo: getDeviceInfo(),
      anonymousId: this.anonymousId,
      fromView,
      toView,
      navigationMethod
    };
    
    this.events.push(event);
    this.saveEvents();
  }

  private recordSessionStart(): void {
    const event: SessionEvent = {
      eventType: 'session_start',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      deviceInfo: getDeviceInfo(),
      anonymousId: this.anonymousId
    };
    
    this.events.push(event);
    this.saveEvents();
  }

  recordSessionEnd(): void {
    if (!this.hasConsent('analytics')) return;
    
    const sessionStartEvents = this.events.filter(
      e => e.eventType === 'session_start' && (e as SessionEvent).sessionId === this.sessionId
    );
    
    const sessionDuration = sessionStartEvents.length > 0
      ? Date.now() - sessionStartEvents[0].timestamp
      : 0;
    
    const event: SessionEvent = {
      eventType: 'session_end',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      deviceInfo: getDeviceInfo(),
      anonymousId: this.anonymousId,
      sessionDuration,
      eventsCount: this.events.filter(e => (e as SessionEvent).sessionId === this.sessionId).length
    };
    
    this.events.push(event);
    this.saveEvents();
  }

  // Performance monitoring
  recordPerformanceMetrics(metrics: PerformanceMetrics): void {
    if (!this.hasConsent('performance')) return;
    
    this.performanceHistory.push({
      ...metrics,
      timestamp: Date.now()
    });
    
    // Keep only last 1000 entries
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory = this.performanceHistory.slice(-1000);
    }
    
    this.savePerformanceData();
  }

  private startPerformanceMonitoring(): void {
    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 60;
    
    const measureFPS = (): void => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
        
        // Estimate memory usage (if available)
        const memoryUsed = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0;
        
        this.recordPerformanceMetrics({
          fps,
          memoryUsage: memoryUsed,
          interactionLatency: 0, // Measured per interaction
          renderTime: 0, // Measured via rAF
          loadTime: performance.timing?.loadEventEnd ?? 0,
          timestamp: Date.now()
        });
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  // Error monitoring (anonymized, no PII)
  recordError(
    errorType: string,
    errorCategory: ErrorEvent['errorCategory'],
    errorMessage: string,
    stackTrace?: string,
    componentStack?: string,
    isRecovered = true
  ): void {
    if (!this.hasConsent('errors')) return;
    
    // Hash error message to avoid storing exact error details
    const hashedMessage = this.hashString(errorMessage.substring(0, 200));
    
    // Track frequency (anonymized)
    const frequencyKey = `${errorType}_${errorCategory}`;
    const currentCount = this.errorFrequency.get(frequencyKey) ?? 0;
    this.errorFrequency.set(frequencyKey, currentCount + 1);
    
    const event: ErrorEvent = {
      eventType: 'error',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      deviceInfo: getDeviceInfo(),
      anonymousId: this.anonymousId,
      errorType,
      errorCategory,
      errorMessage: hashedMessage, // Store hashed version only
      stackTrace: stackTrace ? this.hashString(stackTrace.substring(0, 500)) : undefined,
      componentStack: componentStack ? this.hashString(componentStack.substring(0, 500)) : undefined,
      isRecovered,
      frequencyCount: currentCount + 1
    };
    
    this.events.push(event);
    this.saveEvents();
    this.saveErrorFrequency();
  }

  private startErrorMonitoring(): void {
    const originalOnerror = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      this.recordError(
        error?.name ?? 'UnknownError',
        'runtime',
        message ?? 'Unknown error',
        error?.stack,
        undefined,
        false
      );
      
      if (originalOnerror) {
        return originalOnerror(message, source, lineno, colno, error);
      }
      return false;
    };
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError(
        'UnhandledPromiseRejection',
        'runtime',
        event.reason?.message ?? 'Promise rejection',
        event.reason?.stack,
        undefined,
        false
      );
    });
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }

  // Local computation and aggregation
  computeAggregatedAnalytics(): AggregatedAnalytics {
    const analyticsEvents = this.events.filter(e => this.hasConsentForEvent(e));
    
    return {
      featureUsage: this.computeFeatureUsage(analyticsEvents),
      sessionStats: this.computeSessionStats(analyticsEvents),
      interactionStats: this.computeInteractionStats(analyticsEvents),
      performanceStats: this.computePerformanceStats(),
      errorStats: this.computeErrorStats(),
      lastUpdated: Date.now()
    };
  }

  private hasConsentForEvent(event: BaseAnalyticsEvent): boolean {
    switch (event.eventType) {
      case 'performance':
        return this.hasConsent('performance');
      case 'error':
        return this.hasConsent('errors');
      case 'interaction':
        return this.hasConsent('analytics') && this.config.trackInteractions;
      default:
        return this.hasConsent('analytics');
    }
  }

  private computeFeatureUsage(events: BaseAnalyticsEvent[]): FeatureUsageSummary[] {
    const featureEvents = events.filter(e => e.eventType === 'feature_usage') as FeatureUsageEvent[];
    const featureMap = new Map<string, FeatureUsageEvent[]>();
    
    featureEvents.forEach(event => {
      const key = `${event.featureCategory}_${event.featureName}`;
      if (!featureMap.has(key)) {
        featureMap.set(key, []);
      }
      featureMap.get(key)!.push(event);
    });
    
    const summaries: FeatureUsageSummary[] = [];
    const sessionSet = new Set<string>();
    
    featureMap.forEach((eventsList, key) => {
      const [category, name] = key.split('_');
      eventsList.forEach(e => sessionSet.add(e.anonymousId));
      
      const totalDuration = eventsList.reduce((sum, e) => sum + (e.duration ?? 0), 0);
      
      // Calculate trend
      const recentCount = eventsList.filter(e => e.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000).length;
      const olderCount = eventsList.length - recentCount;
      let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      if (recentCount > olderCount * 1.5) trend = 'increasing';
      else if (recentCount < olderCount * 0.5) trend = 'decreasing';
      
      summaries.push({
        featureName: name,
        featureCategory: category,
        usageCount: eventsList.length,
        totalDuration,
        averageDuration: eventsList.length > 0 ? totalDuration / eventsList.length : 0,
        uniqueSessions: sessionSet.size,
        trend
      });
    });
    
    return summaries.sort((a, b) => b.usageCount - a.usageCount);
  }

  private computeSessionStats(events: BaseAnalyticsEvent[]): SessionSummary {
    const sessionEvents = events.filter(e => e.eventType === 'session_start' || e.eventType === 'session_end') as SessionEvent[];
    
    // Group by session
    const sessions = new Map<string, { start: SessionEvent; end?: SessionEvent; events: number }>();
    
    sessionEvents.forEach(event => {
      if (!sessions.has(event.sessionId)) {
        sessions.set(event.sessionId, { start: event as SessionEvent, end: undefined, events: 0 });
      }
      
      if (event.eventType === 'session_end') {
        const session = sessions.get(event.sessionId)!;
        session.end = event as SessionEvent;
      }
    });
    
    // Count all events per session
    events.forEach(event => {
      const session = sessions.get(event.sessionId);
      if (session) session.events++;
    });
    
    const completedSessions = Array.from(sessions.values()).filter(s => s.end);
    const durations = completedSessions.map(s => (s.end?.sessionDuration ?? 0));
    
    // Calculate peak activity hours
    const hourCounts = new Array(24).fill(0);
    sessionEvents.forEach(e => {
      const hour = new Date(e.timestamp).getHours();
      hourCounts[hour]++;
    });
    const peakHours = hourCounts
      .map((count, hour) => ({ count, hour }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(h => h.hour);
    
    return {
      totalSessions: sessions.size,
      averageSessionDuration: durations.length > 0 
        ? durations.reduce((a, b) => a + b, 0) / durations.length 
        : 0,
      totalEvents: sessionEvents.length,
      averageEventsPerSession: sessions.size > 0 
        ? sessionEvents.length / sessions.size 
        : 0,
      peakActivityHours: peakHours
    };
  }

  private computeInteractionStats(events: BaseAnalyticsEvent[]): InteractionSummary {
    const interactionEvents = events.filter(e => e.eventType === 'interaction') as InteractionEvent[];
    
    const typeCounts = new Map<string, number>();
    let totalLatency = 0;
    let latencyCount = 0;
    
    interactionEvents.forEach(event => {
      const count = typeCounts.get(event.interactionType) ?? 0;
      typeCounts.set(event.interactionType, count + 1);
      
      if (event.duration) {
        totalLatency += event.duration;
        latencyCount++;
      }
    });
    
    const mostUsed = Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    const interactionsByType: Record<string, number> = {};
    typeCounts.forEach((count, type) => {
      interactionsByType[type] = count;
    });
    
    return {
      totalInteractions: interactionEvents.length,
      interactionsByType,
      averageInteractionLatency: latencyCount > 0 ? totalLatency / latencyCount : 0,
      mostUsedInteractions: mostUsed
    };
  }

  private computePerformanceStats(): PerformanceSummary {
    if (this.performanceHistory.length === 0) {
      return {
        averageFps: 60,
        memoryUsageTrend: [],
        averageRenderTime: 0,
        averageLoadTime: 0,
        performanceScore: 100
      };
    }
    
    const avgFps = this.performanceHistory.reduce((sum, m) => sum + m.fps, 0) / this.performanceHistory.length;
    const memoryTrend = this.performanceHistory.slice(-100).map(m => m.memoryUsage);
    const avgRenderTime = this.performanceHistory.reduce((sum, m) => sum + m.renderTime, 0) / this.performanceHistory.length;
    const avgLoadTime = this.performanceHistory.reduce((sum, m) => sum + m.loadTime, 0) / this.performanceHistory.length;
    
    // Calculate performance score (0-100)
    const fpsScore = Math.min(avgFps / 60, 1) * 50;
    const renderScore = Math.max(0, (100 - avgRenderTime) / 100) * 25;
    const loadScore = Math.max(0, (5000 - avgLoadTime) / 5000) * 25;
    const performanceScore = Math.round(fpsScore + renderScore + loadScore);
    
    return {
      averageFps: Math.round(avgFps),
      memoryUsageTrend: memoryTrend,
      averageRenderTime: Math.round(avgRenderTime),
      averageLoadTime: Math.round(avgLoadTime),
      performanceScore
    };
  }

  private computeErrorStats(): ErrorSummary {
    const errorEvents = this.events.filter(e => e.eventType === 'error') as ErrorEvent[];
    
    const categoryCounts = new Map<string, number>();
    const typeCounts = new Map<string, number>();
    let recovered = 0;
    let unrecovered = 0;
    
    errorEvents.forEach(event => {
      const catCount = categoryCounts.get(event.errorCategory) ?? 0;
      categoryCounts.set(event.errorCategory, catCount + 1);
      
      const typeCount = typeCounts.get(event.errorType) ?? 0;
      typeCounts.set(event.errorType, typeCount + 1);
      
      if (event.isRecovered) recovered++;
      else unrecovered++;
    });
    
    const topErrors = Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    const errorsByCategory: Record<string, number> = {};
    categoryCounts.forEach((count, cat) => {
      errorsByCategory[cat] = count;
    });
    
    const errorsByType: Record<string, number> = {};
    typeCounts.forEach((count, type) => {
      errorsByType[type] = count;
    });
    
    // Calculate stability score
    const totalErrors = errorEvents.length;
    const stabilityScore = totalErrors > 0 
      ? Math.max(0, 100 - (unrecovered / totalErrors) * 100 - Math.min(totalErrors * 2, 50))
      : 100;
    
    return {
      totalErrors,
      errorsByCategory,
      errorsByType,
      recoveredErrors: recovered,
      unrecoveredErrors: unrecovered,
      topErrors,
      platformStabilityScore: Math.round(stabilityScore)
    };
  }

  // Storage methods
  private saveEvents(): void {
    try {
      localStorage.setItem('analytics_events', JSON.stringify(this.events));
    } catch {
      // Handle quota exceeded - remove oldest events
      if (this.events.length > 100) {
        this.events = this.events.slice(-100);
        this.saveEvents();
      }
    }
  }

  private savePerformanceData(): void {
    try {
      localStorage.setItem('analytics_performance', JSON.stringify(this.performanceHistory));
    } catch {
      // Ignore errors
    }
  }

  private saveErrorFrequency(): void {
    try {
      const errorObj: Record<string, number> = {};
      this.errorFrequency.forEach((count, key) => {
        errorObj[key] = count;
      });
      localStorage.setItem('analytics_error_frequency', JSON.stringify(errorObj));
    } catch {
      // Ignore errors
    }
  }

  // Public API for dashboard
  getAnalyticsData(): AggregatedAnalytics {
    return this.computeAggregatedAnalytics();
  }

  getPerformanceHistory(): PerformanceMetrics[] {
    return [...this.performanceHistory];
  }

  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
    localStorage.setItem('analytics_config', JSON.stringify(this.config));
  }

  // Cleanup
  clearAllData(): void {
    this.events = [];
    this.performanceHistory = [];
    this.errorFrequency.clear();
    localStorage.removeItem('analytics_events');
    localStorage.removeItem('analytics_performance');
    localStorage.removeItem('analytics_error_frequency');
    localStorage.removeItem('analytics_anonymous_id');
  }

  // Export for federated learning (anonymized)
  exportAnonymousModelData(): { featureVectors: number[][]; labels: number[] } {
    // Aggregate feature usage into anonymized vectors
    const aggregated = this.computeAggregatedAnalytics();
    
    // Convert to feature vectors for federated learning
    const featureVectors: number[][] = [];
    const labels: number[] = [];
    
    // Create anonymized feature vectors
    aggregated.featureUsage.forEach(usage => {
      featureVectors.push([
        usage.usageCount / Math.max(1, aggregated.sessionStats.totalSessions),
        usage.totalDuration / Math.max(1, usage.uniqueSessions),
        usage.averageDuration / 1000, // Normalize to seconds
        usage.uniqueSessions / Math.max(1, aggregated.sessionStats.totalSessions)
      ]);
      labels.push(usage.usageCount > 0 ? 1 : 0);
    });
    
    return { featureVectors, labels };
  }
}

// Export singleton instance
export const analytics = new PrivacyFirstAnalyticsService();
export default analytics;
