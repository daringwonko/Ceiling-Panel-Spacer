"""
Layout Prediction Model using Neural Networks.

Predicts optimal panel configurations given ceiling dimensions and constraints.
"""

import numpy as np
from dataclasses import dataclass
from typing import Dict, Any, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

# Try to import TensorFlow
try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    logger.warning("TensorFlow not available. ML features will use fallback.")


@dataclass
class LayoutPrediction:
    """Prediction result for panel layout."""
    panels_x: int
    panels_y: int
    panel_width_mm: float
    panel_height_mm: float
    confidence: float
    method: str  # 'ml' or 'fallback'


class LayoutPredictor:
    """
    Neural network model for predicting optimal panel layouts.

    Input features:
    - ceiling_length_mm
    - ceiling_width_mm
    - perimeter_gap_mm
    - panel_gap_mm
    - max_panel_size_mm (constraint)

    Output:
    - panels_x (number of columns)
    - panels_y (number of rows)
    - panel_width_mm
    - panel_height_mm
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model = None
        self.model_path = model_path
        self.is_trained = False
        self._scaler_params = None

        if TF_AVAILABLE and model_path:
            self._load_model(model_path)

    def _build_model(self) -> 'keras.Model':
        """Build the neural network architecture."""
        if not TF_AVAILABLE:
            raise RuntimeError("TensorFlow is required to build ML models")

        model = keras.Sequential([
            layers.Input(shape=(5,)),  # 5 input features
            layers.Dense(64, activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.2),
            layers.Dense(128, activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.2),
            layers.Dense(64, activation='relu'),
            layers.Dense(4)  # 4 outputs: panels_x, panels_y, width, height
        ])

        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )

        return model

    def _load_model(self, path: str):
        """Load a pre-trained model."""
        try:
            self.model = keras.models.load_model(path)
            self.is_trained = True
            logger.info(f"Loaded model from {path}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")

    def _normalize_input(self, x: np.ndarray) -> np.ndarray:
        """Normalize input features."""
        # Simple min-max normalization
        # In production, use sklearn StandardScaler
        if self._scaler_params:
            return (x - self._scaler_params['mean']) / self._scaler_params['std']
        return x / 10000  # Simple scaling by max expected value

    def _denormalize_output(self, y: np.ndarray) -> np.ndarray:
        """Denormalize output predictions."""
        # Ensure positive values
        return np.maximum(y, 1)

    def predict(
        self,
        ceiling_length_mm: float,
        ceiling_width_mm: float,
        perimeter_gap_mm: float = 200,
        panel_gap_mm: float = 50,
        max_panel_size_mm: float = 2400
    ) -> LayoutPrediction:
        """
        Predict optimal layout for given parameters.

        Returns:
            LayoutPrediction with predicted configuration
        """
        if TF_AVAILABLE and self.model and self.is_trained:
            try:
                # Prepare input
                x = np.array([[
                    ceiling_length_mm,
                    ceiling_width_mm,
                    perimeter_gap_mm,
                    panel_gap_mm,
                    max_panel_size_mm
                ]])
                x_norm = self._normalize_input(x)

                # Predict
                y = self.model.predict(x_norm, verbose=0)
                y = self._denormalize_output(y[0])

                return LayoutPrediction(
                    panels_x=max(1, int(round(y[0]))),
                    panels_y=max(1, int(round(y[1]))),
                    panel_width_mm=max(100, y[2]),
                    panel_height_mm=max(100, y[3]),
                    confidence=0.85,
                    method='ml'
                )

            except Exception as e:
                logger.error(f"ML prediction failed: {e}")

        # Fallback to heuristic calculation
        return self._fallback_predict(
            ceiling_length_mm,
            ceiling_width_mm,
            perimeter_gap_mm,
            panel_gap_mm,
            max_panel_size_mm
        )

    def _fallback_predict(
        self,
        ceiling_length_mm: float,
        ceiling_width_mm: float,
        perimeter_gap_mm: float,
        panel_gap_mm: float,
        max_panel_size_mm: float
    ) -> LayoutPrediction:
        """Fallback heuristic prediction when ML is unavailable."""
        available_length = ceiling_length_mm - 2 * perimeter_gap_mm
        available_width = ceiling_width_mm - 2 * perimeter_gap_mm

        # Target panel size around 600-1200mm for practical handling
        target_size = min(max_panel_size_mm, 1200)

        # Calculate number of panels
        panels_x = max(1, int(np.ceil(available_width / target_size)))
        panels_y = max(1, int(np.ceil(available_length / target_size)))

        # Calculate actual panel sizes
        panel_width = (available_width - (panels_x - 1) * panel_gap_mm) / panels_x
        panel_height = (available_length - (panels_y - 1) * panel_gap_mm) / panels_y

        return LayoutPrediction(
            panels_x=panels_x,
            panels_y=panels_y,
            panel_width_mm=panel_width,
            panel_height_mm=panel_height,
            confidence=0.7,
            method='fallback'
        )

    def train(
        self,
        X: np.ndarray,
        y: np.ndarray,
        epochs: int = 100,
        validation_split: float = 0.2
    ) -> Dict[str, Any]:
        """
        Train the model on layout data.

        Args:
            X: Input features array (n_samples, 5)
            y: Target values array (n_samples, 4)
            epochs: Number of training epochs
            validation_split: Fraction for validation

        Returns:
            Training history dictionary
        """
        if not TF_AVAILABLE:
            raise RuntimeError("TensorFlow is required for training")

        if self.model is None:
            self.model = self._build_model()

        # Calculate normalization parameters
        self._scaler_params = {
            'mean': X.mean(axis=0),
            'std': X.std(axis=0) + 1e-8
        }

        X_norm = self._normalize_input(X)

        history = self.model.fit(
            X_norm, y,
            epochs=epochs,
            validation_split=validation_split,
            callbacks=[
                keras.callbacks.EarlyStopping(
                    patience=10,
                    restore_best_weights=True
                )
            ],
            verbose=1
        )

        self.is_trained = True
        return history.history

    def save(self, path: str):
        """Save the trained model."""
        if self.model:
            self.model.save(path)
            logger.info(f"Model saved to {path}")
