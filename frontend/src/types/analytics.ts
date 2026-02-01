/**
 * Privacy-First Analytics Types
 * Defines TypeScript interfaces for client-side analytics data
 */

// Core analytics event types
export type AnalyticsEventType = 
  | 'feature_usage'
  | 'session_start'
  | 'session_end'
  | 'interaction'
  | 'navigation'
  | 'performance'
  | 'error';

// Base analytics event
export interface BaseAnalyticsEvent {
  eventType: AnalyticsEventType;
  timestamp: number;
  sessionId: string;
  deviceInfo: DeviceInfo;
  anonymousId: string;
}

// Device information (minimal, no PII)
export interface DeviceInfo {
  platform: string;
  userAgent: string;
  language: string;
  screenResolution?: string;
  timestamp: number;
}

// Feature usage event
export interface FeatureUsageEvent extends BaseAnalyticsEvent {
  eventType: 'feature_usage';
  featureName: string;
  featureCategory: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

// Session events
export interface SessionEvent extends BaseAnalyticsEvent {
  eventType: 'session_start' | 'session_end';
  sessionDuration?: number;
  eventsCount?: number;
}

// Interaction event
export interface InteractionEvent extends BaseAnalyticsEvent {
  eventType: 'interaction';
  interactionType: 'click' | 'drag' | 'zoom' | 'rotate' | 'select' | 'edit' | 'keyboard';
  targetElement?: string;
  targetCategory?: string;
  coordinates?: { x: number; y: number };
  duration?: number;
}

// Navigation event
export interface NavigationEvent extends BaseAnalyticsEvent {
  eventType: 'navigation';
  fromView: string;
  toView: string;
  navigationMethod: 'menu' | 'toolbar' | 'shortcut' | 'breadcrumb';
}

// Performance metrics
export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  interactionLatency: number;
  renderTime: number;
  loadTime: number;
  timestamp: number;
}

// Error event (anonymized, no PII)
export interface ErrorEvent extends BaseAnalyticsEvent {
  eventType: 'error';
  errorType: string;
  errorCategory: 'runtime' | 'render' | 'network' | 'validation' | 'memory';
  errorMessage: string;
  stackTrace?: string;
  componentStack?: string;
  isRecovered: boolean;
  frequencyCount: number;
}

// Aggregated analytics data (computed locally)
export interface AggregatedAnalytics {
  featureUsage: FeatureUsageSummary[];
  sessionStats: SessionSummary;
  interactionStats: InteractionSummary;
  performanceStats: PerformanceSummary;
  errorStats: ErrorSummary;
  lastUpdated: number;
}

// Feature usage summary
export interface FeatureUsageSummary {
  featureName: string;
  featureCategory: string;
  usageCount: number;
  totalDuration: number;
  averageDuration: number;
  uniqueSessions: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

// Session summary
export interface SessionSummary {
  totalSessions: number;
  averageSessionDuration: number;
  totalEvents: number;
  averageEventsPerSession: number;
  peakActivityHours: number[];
}

// Interaction summary
export interface InteractionSummary {
  totalInteractions: number;
  interactionsByType: Record<string, number>;
  averageInteractionLatency: number;
  mostUsedInteractions: { type: string; count: number }[];
}

// Performance summary
export interface PerformanceSummary {
  averageFps: number;
  memoryUsageTrend: number[];
  averageRenderTime: number;
  averageLoadTime: number;
  performanceScore: number;
}

// Error summary (anonymized)
export interface ErrorSummary {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsByType: Record<string, number>;
  recoveredErrors: number;
  unrecoveredErrors: number;
  topErrors: { type: string; count: number }[];
  platformStabilityScore: number;
}

// Analytics configuration
export interface AnalyticsConfig {
  enabled: boolean;
  optInRequired: boolean;
  storageType: 'localStorage' | 'indexedDB';
  retentionDays: number;
  sampleRate: number;
  trackPerformance: boolean;
  trackErrors: boolean;
  trackInteractions: boolean;
}

// Federated learning types
export interface FederatedConfig {
  enabled: boolean;
  minSamplesBeforeSync: number;
  syncIntervalHours: number;
  modelVersion: string;
  aggregationStrategy: 'fedavg' | 'weighted_avg';
}

export interface ModelUpdate {
  modelId: string;
  version: string;
  weights: number[];
  sampleCount: number;
  accuracy?: number;
  timestamp: number;
}

export interface AggregatedModel {
  version: string;
  weights: number[];
  totalSamples: number;
  contributorCount: number;
  timestamp: number;
}

// Consent management
export interface ConsentStatus {
  analytics: boolean;
  federatedLearning: boolean;
  performance: boolean;
  errors: boolean;
  timestamp: number;
  version: string;
}
