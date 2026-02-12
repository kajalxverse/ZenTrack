"""
ZenTrack - Stress Detection Module
ML-based stress classification using HRV features and anxiety assessment
Implements Random Forest and SVM models as per project requirements
"""

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
import joblib
import os
from datetime import datetime

class StressDetector:
    """
    Stress Detection Engine using Machine Learning
    Classifies stress into Low, Moderate, or High based on:
    - HRV features (RMSSD, SDNN, Mean HR, LF/HF ratio)
    - Anxiety assessment scores
    """
    
    def __init__(self, model_type='random_forest'):
        """
        Initialize stress detector with specified ML model
        
        Args:
            model_type (str): 'random_forest' or 'svm'
        """
        self.model_type = model_type
        self.scaler = StandardScaler()
        self.model = None
        self.is_trained = False
        
        # Try to load pre-trained model
        self._load_model()
        
        # If no model exists, create and train with sample data
        if not self.is_trained:
            self._initialize_model()
    
    def _initialize_model(self):
        """Initialize ML model based on type"""
        if self.model_type == 'random_forest':
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
        elif self.model_type == 'svm':
            self.model = SVC(
                kernel='rbf',
                C=1.0,
                gamma='scale',
                probability=True,
                random_state=42
            )
        else:
            raise ValueError("Model type must be 'random_forest' or 'svm'")
        
        # Train with sample data for demonstration
        self._train_with_sample_data()
    
    def _train_with_sample_data(self):
        """
        Train model with sample HRV and HAM-A compliant assessment data
        Calibrated for Hamilton Anxiety Rating Scale (0-56 range)
        """
        # Sample training data (features: mean_hr, sdnn, rmssd, lf_hf_ratio, anxiety_score)
        # Labels: 0=Low, 1=Moderate, 2=High stress
        
        # X: [mean_hr, sdnn, rmssd, lf_hf_ratio, anxiety_score]
        X_train = np.array([
            # Low stress samples (Anxiety Score: 0-17)
            [65, 85, 80, 1.1, 5],
            [68, 88, 82, 1.2, 10],
            [72, 80, 75, 1.3, 14],
            [66, 92, 85, 1.0, 8],
            [70, 84, 78, 1.2, 16],
            
            # Moderate stress samples (Anxiety Score: 18-24)
            [78, 55, 50, 2.8, 19],
            [82, 50, 45, 3.2, 22],
            [76, 58, 52, 2.5, 18],
            [80, 52, 48, 3.0, 23],
            [79, 54, 49, 2.9, 21],
            
            # High stress samples (Anxiety Score: 25-56)
            [92, 30, 25, 5.2, 28],
            [95, 25, 20, 5.8, 35],
            [88, 35, 30, 4.5, 26],
            [98, 22, 18, 6.2, 42],
            [91, 32, 27, 4.8, 31]
        ])
        
        y_train = np.array([
            0, 0, 0, 0, 0,  # Low
            1, 1, 1, 1, 1,  # Moderate
            2, 2, 2, 2, 2   # High
        ])
        
        # Normalize features
        X_train_scaled = self.scaler.fit_transform(X_train)
        
        # Train model
        self.model.fit(X_train_scaled, y_train)
        self.is_trained = True
        
        # Save model
        self._save_model()
        
        print("✅ Stress detection model trained successfully with HAM-A calibration")
    
    def extract_hrv_features(self, rr_intervals):
        """
        Extract HRV features from RR intervals
        
        Args:
            rr_intervals (list): RR intervals in milliseconds
            
        Returns:
            dict: Extracted HRV features
        """
        if not rr_intervals or len(rr_intervals) < 10:
            raise ValueError("Insufficient RR interval data")
        
        rr_array = np.array(rr_intervals)
        
        # Time-domain features
        mean_rr = np.mean(rr_array)
        mean_hr = 60000 / mean_rr  # Convert to BPM
        sdnn = np.std(rr_array)  # Standard deviation of NN intervals
        
        # RMSSD: Root mean square of successive differences
        diff_rr = np.diff(rr_array)
        rmssd = np.sqrt(np.mean(diff_rr ** 2))
        
        # Simplified LF/HF ratio (normally requires FFT)
        # For demonstration, using variance-based approximation
        lf_hf_ratio = sdnn / (rmssd + 1)  # Avoid division by zero
        
        return {
            'mean_hr': round(mean_hr, 2),
            'sdnn': round(sdnn, 2),
            'rmssd': round(rmssd, 2),
            'lf_hf_ratio': round(lf_hf_ratio, 2)
        }
    
    def calculate_anxiety_score(self, answers):
        """
        Calculate anxiety score from assessment answers
        
        Args:
            answers (list): List of answer values (0-3 scale)
            
        Returns:
            int: Total anxiety score
        """
        return sum(answers)
    
    def predict_stress_level(self, hrv_features=None, anxiety_score=None, rr_intervals=None):
        """
        Predict stress level using ML model
        
        Args:
            hrv_features (dict): Pre-extracted HRV features
            anxiety_score (int): Anxiety assessment score
            rr_intervals (list): Raw RR intervals (if features not provided)
            
        Returns:
            dict: Prediction results with stress level and confidence
        """
        if not self.is_trained:
            raise Exception("Model not trained")
        
        # Extract features if RR intervals provided
        if rr_intervals and not hrv_features:
            hrv_features = self.extract_hrv_features(rr_intervals)
        
        # If only anxiety score provided, use default HRV values
        if anxiety_score is not None and not hrv_features:
            # Map anxiety score to estimated HRV features based on HAM-A
            if anxiety_score < 18:
                hrv_features = {'mean_hr': 68, 'sdnn': 85, 'rmssd': 80, 'lf_hf_ratio': 1.2}
            elif anxiety_score < 25:
                hrv_features = {'mean_hr': 78, 'sdnn': 55, 'rmssd': 50, 'lf_hf_ratio': 2.8}
            else:
                hrv_features = {'mean_hr': 92, 'sdnn': 30, 'rmssd': 25, 'lf_hf_ratio': 5.2}
        
        if not hrv_features:
            raise ValueError("Either hrv_features, rr_intervals, or anxiety_score must be provided")
        
        # Default anxiety score if not provided
        if anxiety_score is None:
            anxiety_score = 10
        
        # Prepare feature vector
        features = np.array([[
            hrv_features['mean_hr'],
            hrv_features['sdnn'],
            hrv_features['rmssd'],
            hrv_features['lf_hf_ratio'],
            anxiety_score
        ]])
        
        # Scale features
        features_scaled = self.scaler.transform(features)
        
        # Predict
        prediction = self.model.predict(features_scaled)[0]
        probabilities = self.model.predict_proba(features_scaled)[0]
        
        # Map prediction to stress level
        stress_levels = ['Low', 'Moderate', 'High']
        stress_level = stress_levels[prediction]
        confidence = float(probabilities[prediction])
        
        return {
            'stress_level': stress_level,
            'confidence': round(confidence * 100, 2),
            'probabilities': {
                'low': round(probabilities[0] * 100, 2),
                'moderate': round(probabilities[1] * 100, 2),
                'high': round(probabilities[2] * 100, 2)
            },
            'hrv_features': hrv_features,
            'anxiety_score': anxiety_score,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def recommend_therapy(self, stress_level):
        """
        Recommend therapy based on stress level
        
        Args:
            stress_level (str): 'Low', 'Moderate', or 'High'
            
        Returns:
            dict: Therapy recommendations
        """
        recommendations = {
            'Low': {
                'primary': 'music',
                'message': 'Your stress level is low. Enjoy some calming music to maintain your peace.',
                'therapies': ['Music Therapy', 'Light Meditation']
            },
            'Moderate': {
                'primary': 'yoga',
                'message': 'Your stress level is moderate. Try yoga or breathing exercises to relax.',
                'therapies': ['Yoga Therapy', 'Breathing Exercises', 'Music Therapy']
            },
            'High': {
                'primary': 'chatbot',
                'message': 'Your stress level is high. Let\'s talk with our AI assistant for support.',
                'therapies': ['AI Chatbot Support', 'Guided Meditation', 'Breathing Exercises']
            }
        }
        
        return recommendations.get(stress_level, recommendations['Moderate'])
    
    def _save_model(self):
        """Save trained model and scaler"""
        try:
            model_dir = os.path.dirname(os.path.abspath(__file__))
            joblib.dump(self.model, os.path.join(model_dir, f'stress_model_{self.model_type}.pkl'))
            joblib.dump(self.scaler, os.path.join(model_dir, 'stress_scaler.pkl'))
        except Exception as e:
            print(f"Warning: Could not save model: {e}")
    
    def _load_model(self):
        """Load pre-trained model and scaler"""
        try:
            model_dir = os.path.dirname(os.path.abspath(__file__))
            model_path = os.path.join(model_dir, f'stress_model_{self.model_type}.pkl')
            scaler_path = os.path.join(model_dir, 'stress_scaler.pkl')
            
            if os.path.exists(model_path) and os.path.exists(scaler_path):
                self.model = joblib.load(model_path)
                self.scaler = joblib.load(scaler_path)
                self.is_trained = True
                print(f"✅ Loaded pre-trained {self.model_type} model")
        except Exception as e:
            print(f"Note: Could not load model: {e}")
