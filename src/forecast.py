"""
Future Forecasting Engine
Generates next-step and multi-horizon price projections for BTC/USDT across all timeframes.
"""

import numpy as np
import pandas as pd

def forecast_next_candle(model, scaler, feature_cols, latest_row):
    """
    Predicts the next future candle price given the most recent feature row.
    """
    X_latest = pd.DataFrame([latest_row[feature_cols]])
    X_scaled = scaler.transform(X_latest)
    pred_price = float(model.predict(X_scaled)[0])
    
    current_price = float(latest_row['close'])
    expected_change = pred_price - current_price
    expected_return_pct = (expected_change / current_price) * 100.0
    direction = "BULLISH 🟢" if expected_return_pct > 0 else "BEARISH 🔴"
    
    return {
        'current_price': round(current_price, 2),
        'predicted_price': round(pred_price, 2),
        'expected_change_$': round(expected_change, 2),
        'expected_return_%': round(expected_return_pct, 3),
        'signal': direction
    }

def multi_step_forecast(model, scaler, feature_cols, latest_features_df, steps=5):
    """
    Simulates recursive autoregressive forecasting for the next N time intervals.
    """
    df_sim = latest_features_df.copy().reset_index(drop=True)
    forecasts = []
    
    for step in range(1, steps + 1):
        latest_row = df_sim.iloc[-1]
        X_vec = pd.DataFrame([latest_row[feature_cols]])
        X_scaled = scaler.transform(X_vec)
        next_pred = float(model.predict(X_scaled)[0])
        curr_price = float(latest_row['close'])
        
        forecasts.append({
            'Step_Ahead': f"+{step}",
            'Simulated_Price': round(next_pred, 2),
            'Delta_from_Current_$': round(next_pred - curr_price, 2),
            'Return_%': round(((next_pred - curr_price) / curr_price) * 100, 3)
        })
        
        # Approximate next row for recursive step
        new_row = latest_row.copy()
        new_row['close'] = next_pred
        new_row['high'] = max(next_pred, curr_price * 1.001)
        new_row['low'] = min(next_pred, curr_price * 0.999)
        new_row['open'] = curr_price
        df_sim = pd.concat([df_sim, pd.DataFrame([new_row])], ignore_index=True)
        
    return pd.DataFrame(forecasts)
