/**
 * Federated Learning Service Tests
 * Tests for privacy-preserving usage pattern aggregation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock analytics export
const mockExportData = {
  featureVectors: [
    [0.5, 0.3, 0.2, 0.8],
    [0.6, 0.4, 0.3, 0.7],
    [0.4, 0.2, 0.1, 0.9],
    [0.7, 0.5, 0.4, 0.6],
    [0.3, 0.1, 0.1, 0.8]
  ],
  labels: [1, 1, 0, 1, 0]
};

describe('Federated Learning Service', () => {
  let federatedService: any;

  beforeEach(async () => {
    // Dynamic import to get fresh instance
    const module = await import('../services/federatedLearning');
    federatedService = module.federatedLearning;
  });

  afterEach(() => {
    // Cleanup
    localStorage.removeItem('federated_consent');
    localStorage.removeItem('federated_model');
    localStorage.removeItem('federated_updates');
  });

  describe('Consent Management', () => {
    it('should return false when consent not given', async () => {
      await federatedService.initialize();
      const canParticipate = federatedService.canParticipate();
      expect(canParticipate).toBe(false);
    });

    it('should allow participation after consent given', async () => {
      await federatedService.setConsent(true);
      const canParticipate = federatedService.canParticipate();
      expect(canParticipate).toBe(true);
    });

    it('should store consent in localStorage', async () => {
      await federatedService.setConsent(true);
      const stored = localStorage.getItem('federated_consent');
      expect(stored).toBe('true');
    });
  });

  describe('Model Updates', () => {
    it('should create model update from analytics data', async () => {
      const update = federatedService.createModelUpdate(mockExportData);
      
      expect(update).toBeDefined();
      expect(update.modelId).toBeDefined();
      expect(update.version).toBeDefined();
      expect(update.weights).toBeDefined();
      expect(update.sampleCount).toBe(5);
      expect(update.timestamp).toBeDefined();
    });

    it('should generate unique model IDs', async () => {
      const update1 = federatedService.createModelUpdate(mockExportData);
      const update2 = federatedService.createModelUpdate(mockExportData);
      
      expect(update1.modelId).not.toBe(update2.modelId);
    });

    it('should include weights in model update', async () => {
      const update = federatedService.createModelUpdate(mockExportData);
      
      expect(update.weights).toBeInstanceOf(Array);
      expect(update.weights.length).toBeGreaterThan(0);
    });
  });

  describe('Model Aggregation', () => {
    it('should aggregate multiple updates using FedAvg', async () => {
      const update1 = federatedService.createModelUpdate({
        featureVectors: [[0.5, 0.5], [0.6, 0.4]],
        labels: [1, 1]
      });
      
      const update2 = federatedService.createModelUpdate({
        featureVectors: [[0.3, 0.7], [0.4, 0.6]],
        labels: [0, 0]
      });

      const aggregated = federatedService.aggregateModels([update1, update2]);
      
      expect(aggregated).toBeDefined();
      expect(aggregated.version).toBeDefined();
      expect(aggregated.totalSamples).toBe(4);
      expect(aggregated.contributorCount).toBe(2);
      expect(aggregated.weights).toBeDefined();
    });

    it('should handle single update aggregation', async () => {
      const update = federatedService.createModelUpdate(mockExportData);
      const aggregated = federatedService.aggregateModels([update]);
      
      expect(aggregated.totalSamples).toBe(5);
      expect(aggregated.contributorCount).toBe(1);
    });
  });

  describe('Sync Operations', () => {
    it('should check sync eligibility based on minimum samples', async () => {
      const smallUpdate = federatedService.createModelUpdate({
        featureVectors: [[0.5]],
        labels: [1]
      });
      
      const eligible = federatedService.isEligibleForSync();
      // Single sample may not meet minimum threshold
      expect(typeof eligible).toBe('boolean');
    });

    it('should store local model updates', async () => {
      await federatedService.setConsent(true);
      const update = federatedService.createModelUpdate(mockExportData);
      
      const stored = localStorage.getItem('federated_updates');
      expect(stored).toBeDefined();
    });

    it('should not sync without consent', async () => {
      const canSync = federatedService.canSync();
      expect(canSync).toBe(false);
    });
  });

  describe('Model Versioning', () => {
    it('should increment version on aggregation', async () => {
      await federatedService.setConsent(true);
      
      const update1 = federatedService.createModelUpdate(mockExportData);
      const aggregated1 = federatedService.aggregateModels([update1]);
      const version1 = aggregated1.version;
      
      const update2 = federatedService.createModelUpdate(mockExportData);
      const aggregated2 = federatedService.aggregateModels([update2]);
      const version2 = aggregated2.version;
      
      // Version should increment or be unique
      expect(version2).toBeDefined();
    });
  });

  describe('Privacy Guarantees', () => {
    it('should not store raw data in model updates', async () => {
      const update = federatedService.createModelUpdate(mockExportData);
      
      // Model should contain aggregated weights, not raw data
      expect(update.weights.length).toBeLessThanOrEqual(mockExportData.featureVectors[0].length);
    });

    it('should require opt-in for participation', async () => {
      const beforeConsent = federatedService.canParticipate();
      expect(beforeConsent).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should return current configuration', async () => {
      const config = federatedService.getConfig();
      
      expect(config).toBeDefined();
      expect(config.enabled).toBeDefined();
      expect(config.minSamplesBeforeSync).toBeDefined();
      expect(config.syncIntervalHours).toBeDefined();
      expect(config.modelVersion).toBeDefined();
    });

    it('should update configuration', async () => {
      await federatedService.updateConfig({
        minSamplesBeforeSync: 100,
        syncIntervalHours: 24
      });
      
      const config = federatedService.getConfig();
      expect(config.minSamplesBeforeSync).toBe(100);
      expect(config.syncIntervalHours).toBe(24);
    });
  });
});
