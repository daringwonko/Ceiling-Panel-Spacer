/**
 * Analytics Dashboard Component
 * Displays computed statistics locally - no data transmission
 */

import React, { useState, useEffect, useCallback } from 'react';
import analytics from '../services/analytics';
import type { AggregatedAnalytics, ConsentStatus } from '../types/analytics';

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ isOpen, onClose }) => {
  const [analyticsData, setAnalyticsData] = useState<AggregatedAnalytics | null>(null);
  const [consentStatus, setConsentStatus] = useState<ConsentStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'performance' | 'errors' | 'consent'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await analytics.initialize();
    setAnalyticsData(analytics.getAnalyticsData());
    setConsentStatus(analytics.getConsentStatus());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  const handleConsentChange = async (category: keyof Omit<ConsentStatus, 'timestamp' | 'version'>, enabled: boolean) => {
    await analytics.setConsent({
      ...consentStatus!,
      [category]: enabled
    });
    setConsentStatus(analytics.getConsentStatus());
    setAnalyticsData(analytics.getAnalyticsData());
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      analytics.clearAllData();
      loadData();
    }
  };

  if (!isOpen) return null;

  const getPerformanceColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBg = (score: number): string => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Privacy-First Analytics</h2>
              <p className="text-sm text-gray-500">All data computed locally on your device</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'features', label: 'Feature Usage' },
            { id: 'performance', label: 'Performance' },
            { id: 'errors', label: 'Errors' },
            { id: 'consent', label: 'Consent' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && analyticsData && (
                <div className="space-y-6">
                  {/* Privacy Notice */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <div>
                        <h3 className="font-medium text-green-900">Privacy-First Design</h3>
                        <p className="text-sm text-green-700 mt-1">
                          All analytics data is computed locally on your device. No personal information is collected or transmitted.
                          Data is stored only in your browser and can be cleared at any time.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">{analyticsData.sessionStats.totalSessions}</div>
                      <div className="text-sm text-gray-500">Sessions</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">{analyticsData.interactionStats.totalInteractions}</div>
                      <div className="text-sm text-gray-500">Interactions</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className={`text-2xl font-bold ${getPerformanceColor(analyticsData.performanceStats.performanceScore)}`}>
                        {analyticsData.performanceStats.performanceScore}
                      </div>
                      <div className="text-sm text-gray-500">Performance Score</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900">{analyticsData.errorStats.platformStabilityScore}</div>
                      <div className="text-sm text-gray-500">Stability Score</div>
                    </div>
                  </div>

                  {/* Feature Usage Preview */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Top Features</h3>
                    <div className="space-y-2">
                      {analyticsData.featureUsage.slice(0, 5).map((feature, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">{feature.featureName}</div>
                            <div className="text-sm text-gray-500">{feature.featureCategory}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-900">{feature.usageCount} uses</div>
                            <div className={`text-sm ${
                              feature.trend === 'increasing' ? 'text-green-600' :
                              feature.trend === 'decreasing' ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              {feature.trend}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Feature Usage Tab */}
              {activeTab === 'features' && analyticsData && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Feature Usage Analytics</h3>
                    <button
                      onClick={handleClearData}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Clear All Data
                    </button>
                  </div>
                  
                  {analyticsData.featureUsage.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No feature usage data yet. Start using features to see analytics.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analyticsData.featureUsage.map((feature, idx) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">{feature.featureName}</h4>
                              <span className="text-sm text-gray-500">{feature.featureCategory}</span>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                feature.trend === 'increasing' ? 'bg-green-100 text-green-800' :
                                feature.trend === 'decreasing' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {feature.trend}
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-gray-500">Usage Count</div>
                              <div className="font-medium">{feature.usageCount}</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Total Duration</div>
                              <div className="font-medium">{Math.round(feature.totalDuration / 1000)}s</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Avg Duration</div>
                              <div className="font-medium">{Math.round(feature.averageDuration)}ms</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Unique Sessions</div>
                              <div className="font-medium">{feature.uniqueSessions}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Performance Tab */}
              {activeTab === 'performance' && analyticsData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className={`rounded-lg p-4 ${getPerformanceBg(analyticsData.performanceStats.performanceScore)}`}>
                      <div className="text-sm text-gray-600 mb-1">Performance Score</div>
                      <div className={`text-3xl font-bold ${getPerformanceColor(analyticsData.performanceStats.performanceScore)}`}>
                        {analyticsData.performanceStats.performanceScore}
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Average FPS</div>
                      <div className="text-3xl font-bold text-blue-600">
                        {analyticsData.performanceStats.averageFps}
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Avg Render Time</div>
                      <div className="text-3xl font-bold text-purple-600">
                        {analyticsData.performanceStats.averageRenderTime}ms
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Performance Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Average FPS</span>
                        <span className="font-medium">{analyticsData.performanceStats.averageFps}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Average Render Time</span>
                        <span className="font-medium">{analyticsData.performanceStats.averageRenderTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Average Load Time</span>
                        <span className="font-medium">{analyticsData.performanceStats.averageLoadTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Data Points Collected</span>
                        <span className="font-medium">{analyticsData.performanceStats.memoryUsageTrend.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Memory Usage Chart Placeholder */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Memory Usage Trend</h4>
                    <div className="h-32 flex items-end gap-1">
                      {analyticsData.performanceStats.memoryUsageTrend.slice(-50).map((value, idx) => {
                        const maxValue = Math.max(...analyticsData.performanceStats.memoryUsageTrend, 1);
                        const height = (value / maxValue) * 100;
                        return (
                          <div
                            key={idx}
                            className="flex-1 bg-blue-500 rounded-t"
                            style={{ height: `${height}%` }}
                            title={`${(value / 1024 / 1024).toFixed(2)} MB`}
                          />
                        );
                      })}
                    </div>
                    <div className="text-xs text-gray-500 mt-2 text-center">
                      Last {Math.min(50, analyticsData.performanceStats.memoryUsageTrend.length)} data points
                    </div>
                  </div>
                </div>
              )}

              {/* Errors Tab */}
              {activeTab === 'errors' && analyticsData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="text-sm text-red-600 mb-1">Total Errors</div>
                      <div className="text-2xl font-bold text-red-700">{analyticsData.errorStats.totalErrors}</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="text-sm text-yellow-600 mb-1">Recovered</div>
                      <div className="text-2xl font-bold text-yellow-700">{analyticsData.errorStats.recoveredErrors}</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="text-sm text-orange-600 mb-1">Unrecovered</div>
                      <div className="text-2xl font-bold text-orange-700">{analyticsData.errorStats.unrecoveredErrors}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm text-green-600 mb-1">Stability Score</div>
                      <div className="text-2xl font-bold text-green-700">{analyticsData.errorStats.platformStabilityScore}</div>
                    </div>
                  </div>

                  {analyticsData.errorStats.totalErrors > 0 && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Errors by Category</h4>
                        <div className="flex gap-2 flex-wrap">
                          {Object.entries(analyticsData.errorStats.errorsByCategory).map(([category, count]) => (
                            <span
                              key={category}
                              className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                            >
                              {category}: <strong>{count}</strong>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Top Errors</h4>
                        <div className="space-y-2">
                          {analyticsData.errorStats.topErrors.map((error, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="font-medium text-gray-900">{error.type}</span>
                              <span className="text-gray-500">{error.count} occurrences</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {analyticsData.errorStats.totalErrors === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">No Errors Recorded</h3>
                      <p className="text-gray-500">Platform is running smoothly with no reported errors.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Consent Tab */}
              {activeTab === 'consent' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Your Privacy Choices</h3>
                    <p className="text-sm text-blue-700">
                      You have full control over what analytics data is collected. Changes take effect immediately.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { key: 'analytics', label: 'Analytics', description: 'Collect anonymous usage statistics' },
                      { key: 'performance', label: 'Performance', description: 'Track FPS, memory, and render times' },
                      { key: 'errors', label: 'Error Monitoring', description: 'Report errors to help improve stability' },
                      { key: 'federatedLearning', label: 'Federated Learning', description: 'Contribute to improving features (requires opt-in)' }
                    ].map(item => {
                      const status = consentStatus?.[item.key as keyof ConsentStatus] ?? false;
                      return (
                        <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{item.label}</h4>
                            <p className="text-sm text-gray-500">{item.description}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={status}
                              onChange={(e) => handleConsentChange(item.key as any, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t pt-4">
                    <button
                      onClick={handleClearData}
                      className="w-full py-2 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Clear All Analytics Data
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
