"""
Feature Engineering Module
Calculates technical indicators, momentum, volatility, and target variables
for financial time series machine learning models.
"""

import numpy as np
import pandas as pd

def calculate_rsi(series, period=14):
    """Calculates Relative Strength Index (RSI)."""
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -1 * delta.clip(upper=0)
    
    avg_gain = gain.rolling(window=period, min_periods=period).mean()
    avg_loss = loss.rolling(window=period, min_periods=period).mean()
    
    rs = avg_gain / (avg_loss + 1e-9)
    rsi = 100 - (100 / (1 + rs))
    return rsi

def calculate_atr(df, period=14):
    """Calculates Average True Range (ATR)."""
    high = df['high']
    low = df['low']
    close = df['close']
    prev_close = close.shift(1)
    
    tr1 = high - low
    tr2 = (high - prev_close).abs()
    tr3 = (low - prev_close).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    return tr.rolling(window=period).mean()

def engineer_features(df):
    """
    Computes a comprehensive suite of financial technical indicators.
    Returns DataFrame with features and target variables, with NaNs cleanly dropped.
    """
    df = df.copy().sort_values('timestamp').reset_index(drop=True)
    
    # 1. Price Momentum & Returns
    df['return_1'] = df['close'].pct_change(1)
    df['return_3'] = df['close'].pct_change(3)
    df['return_5'] = df['close'].pct_change(5)
    df['log_return'] = np.log(df['close'] / df['close'].shift(1))
    
    # 2. Moving Averages & Trend
    df['sma_7'] = df['close'].rolling(7).mean()
    df['sma_21'] = df['close'].rolling(21).mean()
    df['ema_14'] = df['close'].ewm(span=14, adjust=False).mean()
    df['ma_ratio'] = df['close'] / (df['sma_21'] + 1e-9)
    
    # 3. MACD
    ema_12 = df['close'].ewm(span=12, adjust=False).mean()
    ema_26 = df['close'].ewm(span=26, adjust=False).mean()
    df['macd'] = ema_12 - ema_26
    df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
    df['macd_hist'] = df['macd'] - df['macd_signal']
    
    # 4. Volatility & Bollinger Bands
    df['bb_middle'] = df['close'].rolling(20).mean()
    rolling_std = df['close'].rolling(20).std()
    df['bb_upper'] = df['bb_middle'] + (2 * rolling_std)
    df['bb_lower'] = df['bb_middle'] - (2 * rolling_std)
    df['bb_width'] = (df['bb_upper'] - df['bb_lower']) / (df['bb_middle'] + 1e-9)
    
    df['volatility_14'] = df['return_1'].rolling(14).std()
    df['atr_14'] = calculate_atr(df, 14)
    
    # 5. Volume & Intraday Spread
    df['vol_ma_14'] = df['volume'].rolling(14).mean()
    df['vol_ratio'] = df['volume'] / (df['vol_ma_14'] + 1e-9)
    df['hl_spread'] = (df['high'] - df['low']) / (df['close'] + 1e-9)
    
    # 6. RSI
    df['rsi_14'] = calculate_rsi(df['close'], 14)
    
    # 7. Target Variables
    df['target_next_close'] = df['close'].shift(-1)
    df['target_next_return'] = (df['target_next_close'] - df['close']) / df['close']
    df['target_direction'] = (df['target_next_return'] > 0).astype(int)
    
    # Clean rows with NaN due to rolling windows and shift(-1)
    df_clean = df.dropna().reset_index(drop=True)
    return df_clean

FEATURE_COLUMNS = [
    'open', 'high', 'low', 'close', 'volume',
    'return_1', 'return_3', 'return_5', 'log_return',
    'sma_7', 'sma_21', 'ema_14', 'ma_ratio',
    'macd', 'macd_signal', 'macd_hist',
    'bb_width', 'volatility_14', 'atr_14',
    'vol_ratio', 'hl_spread', 'rsi_14'
]
