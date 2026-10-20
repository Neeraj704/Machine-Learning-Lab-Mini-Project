"""
Model Training & Evaluation Module
Implements chronological train-test splitting, feature normalization,
model training (Linear Regression, Random Forest, LightGBM),
and financial evaluation metrics (RMSE, MAE, R², Directional Accuracy).
"""

import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor
from lightgbm import LGBMRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

def temporal_train_test_split(df, feature_cols, target_col='target_next_close', train_ratio=0.8):
    """
    Performs a strict chronological train/test split to prevent lookahead bias.
    """
    n = len(df)
    train_size = int(n * train_ratio)
    
    train_df = df.iloc[:train_size].copy()
    test_df = df.iloc[train_size:].copy()
    
    scaler = StandardScaler()
    X_train = scaler.fit_transform(train_df[feature_cols])
    X_test = scaler.transform(test_df[feature_cols])
    
    y_train = train_df[target_col].values
    y_test = test_df[target_col].values
    
    return {
        'X_train': X_train,
        'y_train': y_train,
        'X_test': X_test,
        'y_test': y_test,
        'train_df': train_df,
        'test_df': test_df,
        'scaler': scaler
    }

def directional_accuracy(y_actual, y_pred, current_close):
    """
    Calculates the percentage of correct directional predictions (Up vs Down).
    """
    actual_dir = np.sign(y_actual - current_close)
    pred_dir = np.sign(y_pred - current_close)
    correct = (actual_dir == pred_dir)
    return float(np.mean(correct) * 100.0)

def train_and_evaluate_models(split_data):
    """
    Trains Ridge Regression, Random Forest, and LightGBM models,
    and returns models, predictions, and benchmark metrics.
    """
    X_train = split_data['X_train']
    y_train = split_data['y_train']
    X_test = split_data['X_test']
    y_test = split_data['y_test']
    test_close = split_data['test_df']['close'].values
    
    models = {
        'Linear_Regression': Ridge(alpha=1.0),
        'Random_Forest': RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1),
        'LightGBM': LGBMRegressor(n_estimators=100, learning_rate=0.05, max_depth=6, random_state=42, verbose=-1)
    }
    
    results = {}
    
    for name, model in models.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        
        rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
        mae = float(mean_absolute_error(y_test, preds))
        r2 = float(r2_score(y_test, preds))
        dir_acc = directional_accuracy(y_test, preds, test_close)
        
        results[name] = {
            'model': model,
            'predictions': preds,
            'metrics': {
                'RMSE': round(rmse, 2),
                'MAE': round(mae, 2),
                'R2_Score': round(r2, 4),
                'Directional_Accuracy_%': round(dir_acc, 2)
            }
        }
        
    return results
