/**
 * Federated Learning Service
 * Privacy-preserving usage pattern aggregation with opt-in consent
 * 
 * This service implements federated learning where:
 * - Model updates are computed locally
 * - Raw data never leaves the device
 * - Only aggregated model weights are shared (with consent)
 * - Users must explicitly opt-in to participate
 */

import type { FederatedConfig, ModelUpdate, AggregatedModel } from '../types/analytics';

interface TrainingData {
  featureVectors: number[][];
  labels: number[];
}

class FederatedLearningService {
  private config: FederatedConfig;
  private consent: boolean = false;
  private localModelVersion: string = '1.0.0';
  private localUpdates: ModelUpdate[] = [];
  private initialized = false;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): FederatedConfig {
    try {
      const stored = localStorage.getItem('federated_config');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }
    
    // Default configuration
    return {
      enabled: true,
      minSamplesBeforeSync: 10,
      syncIntervalHours: 24,
      modelVersion: '1.0.0',
      aggregationStrategy: 'fedavg'
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Load consent status
    this.consent = localStorage.getItem('federated_consent') === 'true';
    
    // Load existing updates
    await this.loadLocalUpdates();
    
    this.initialized = true;
  }

  private async loadLocalUpdates(): Promise<void> {
    try {
      const stored = localStorage.getItem('federated_updates');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.localUpdates = Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      this.localUpdates = [];
    }
  }

  // Consent management
  async setConsent(enabled: boolean): Promise<void> {
    this.consent = enabled;
    localStorage.setItem('federated_consent', String(enabled));
    
    if (enabled) {
      await this.initialize();
    }
  }

  canParticipate(): boolean {
    return this.consent && this.config.enabled;
  }

  // Model update creation (local computation)
  createModelUpdate(trainingData: TrainingData): ModelUpdate {
    if (!this.canParticipate()) {
      throw new Error('User must opt-in to create model updates');
    }

    // Compute local model weights using simple averaging
    const weights = this.computeLocalModelWeights(trainingData);
    
    const update: ModelUpdate = {
      modelId: this.generateModelId(),
      version: this.localModelVersion,
      weights,
      sampleCount: trainingData.featureVectors.length,
      accuracy: this.computeModelAccuracy(trainingData),
      timestamp: Date.now()
    };

    // Store locally
    this.localUpdates.push(update);
    this.saveLocalUpdates();
    
    return update;
  }

  private computeLocalModelWeights(trainingData: TrainingData): number[] {
    const { featureVectors, labels } = trainingData;
    
    if (featureVectors.length === 0) {
      return [];
    }

    // Simple linear model weights using least squares approximation
    const numFeatures = featureVectors[0].length;
    const weights: number[] = new Array(numFeatures).fill(0);
    
    // Compute mean of features and labels
    const featureMeans = new Array(numFeatures).fill(0);
    let labelSum = 0;
    
    for (let i = 0; i < featureVectors.length; i++) {
      for (let j = 0; j < numFeatures; j++) {
        featureMeans[j] += featureVectors[i][j];
      }
      labelSum += labels[i];
    }
    
    for (let j = 0; j < numFeatures; j++) {
      featureMeans[j] /= featureVectors.length;
    }
    const labelMean = labelSum / labels.length;
    
    // Compute weights (simplified linear regression)
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < featureVectors.length; i++) {
      const featureDiff = featureVectors[i][0] - featureMeans[0];
      const labelDiff = labels[i] - labelMean;
      numerator += featureDiff * labelDiff;
      denominator += featureDiff * featureDiff;
    }
    
    if (denominator !== 0) {
      weights[0] = numerator / denominator;
    }
    
    // Remaining weights based on feature importance
    for (let j = 1; j < numFeatures; j++) {
      weights[j] = (Math.random() - 0.5) * 0.1; // Small random initialization
    }
    
    // Normalize weights
    const norm = Math.sqrt(weights.reduce((sum, w) => sum + w * w, 0));
    if (norm > 0) {
      for (let j = 0; j < numFeatures; j++) {
        weights[j] /= norm;
      }
    }
    
    return weights;
  }

  private computeModelAccuracy(trainingData: TrainingData): number {
    const { featureVectors, labels } = trainingData;
    if (featureVectors.length === 0) return 0;

    const weights = this.computeLocalModelWeights(trainingData);
    if (weights.length === 0) return 0;

    // Compute predictions and accuracy
    let correct = 0;
    for (let i = 0; i < featureVectors.length; i++) {
      let prediction = 0;
      for (let j = 0; j < weights.length; j++) {
        prediction += featureVectors[i][j] * weights[j];
      }
      const predictedLabel = prediction > 0.5 ? 1 : 0;
      if (predictedLabel === labels[i]) {
        correct++;
      }
    }

    return correct / labels.length;
  }

  private generateModelId(): string {
    return `model_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Model aggregation using Federated Averaging (FedAvg)
  aggregateModels(updates: ModelUpdate[]): AggregatedModel {
    if (updates.length === 0) {
      throw new Error('No updates to aggregate');
    }

    // Determine model version (use latest)
    const latestVersion = updates.reduce((latest, update) => {
      return update.version > latest ? update.version : latest;
    }, updates[0].version);

    // Weighted average based on sample count (FedAvg)
    const totalSamples = updates.reduce((sum, update) => sum + update.sampleCount, 0);
    
    const numWeights = updates[0].weights.length;
    const aggregatedWeights: number[] = new Array(numWeights).fill(0);
    
    updates.forEach(update => {
      const weight = update.sampleCount / totalSamples;
      for (let i = 0; i < numWeights; i++) {
        aggregatedWeights[i] += update.weights[i] * weight;
      }
    });

    // Increment version
    this.localModelVersion = this.incrementVersion(latestVersion);

    return {
      version: this.localModelVersion,
      weights: aggregatedWeights,
      totalSamples,
      contributorCount: updates.length,
      timestamp: Date.now()
    };
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.').map(Number);
    if (parts.length >= 3) {
      parts[2] += 1;
    }
    return parts.join('.');
  }

  // Sync operations
  canSync(): boolean {
    if (!this.canParticipate()) return false;
    if (this.localUpdates.length < this.config.minSamplesBeforeSync) return false;
    
    // Check if enough time has passed since last sync
    const lastSync = localStorage.getItem('federated_last_sync');
    if (lastSync) {
      const lastSyncTime = parseInt(lastSync, 10);
      const minInterval = this.config.syncIntervalHours * 60 * 60 * 1000;
      if (Date.now() - lastSyncTime < minInterval) return false;
    }
    
    return true;
  }

  isEligibleForSync(): boolean {
    return this.localUpdates.length >= this.config.minSamplesBeforeSync;
  }

  // Get anonymized model update for sharing
  getAnonymousModelUpdate(): Omit<ModelUpdate, 'modelId'> | null {
    if (!this.canParticipate() || this.localUpdates.length === 0) {
      return null;
    }

    // Get the latest update
    const latestUpdate = this.localUpdates[this.localUpdates.length - 1];
    
    // Return anonymized version (no model ID, no timestamps that could be used for tracking)
    return {
      version: latestUpdate.version,
      weights: latestUpdate.weights,
      sampleCount: latestUpdate.sampleCount,
      accuracy: latestUpdate.accuracy
    };
  }

  // Apply received global model (for future model improvements)
  applyGlobalModel(aggregatedModel: AggregatedModel): void {
    if (!this.canParticipate()) {
      throw new Error('User must opt-in to receive global models');
    }

    // Store global model locally
    localStorage.setItem('federated_global_model', JSON.stringify(aggregatedModel));
    
    // Update local model version
    if (aggregatedModel.version > this.localModelVersion) {
      this.localModelVersion = aggregatedModel.version;
    }
  }

  // Storage
  private saveLocalUpdates(): void {
    try {
      localStorage.setItem('federated_updates', JSON.stringify(this.localUpdates));
    } catch {
      // Handle quota exceeded - remove oldest updates
      if (this.localUpdates.length > 100) {
        this.localUpdates = this.localUpdates.slice(-100);
        this.saveLocalUpdates();
      }
    }
  }

  // Configuration
  getConfig(): FederatedConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<FederatedConfig>): void {
    this.config = { ...this.config, ...config };
    localStorage.setItem('federated_config', JSON.stringify(this.config));
  }

  // Statistics
  getLocalStats(): {
    totalUpdates: number;
    totalSamples: number;
    lastUpdate: number | null;
    canSync: boolean;
  } {
    const lastUpdate = this.localUpdates.length > 0
      ? this.localUpdates[this.localUpdates.length - 1].timestamp
      : null;
    
    return {
      totalUpdates: this.localUpdates.length,
      totalSamples: this.localUpdates.reduce((sum, u) => sum + u.sampleCount, 0),
      lastUpdate,
      canSync: this.canSync()
    };
  }

  // Cleanup
  clearAllData(): void {
    this.localUpdates = [];
    this.localModelVersion = '1.0.0';
    localStorage.removeItem('federated_updates');
    localStorage.removeItem('federated_global_model');
    localStorage.removeItem('federated_last_sync');
  }
}

// Export singleton instance
export const federatedLearning = new FederatedLearningService();
export default federatedLearning;
