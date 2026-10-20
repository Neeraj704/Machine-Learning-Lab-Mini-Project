"""
Data Loader & Acquisition Module
Fetches historical OHLCV data for BTC/USDT across multiple timeframes using CCXT.
Supports standard Binance timeframes and resampled timeframes (10m, 4d, 30d).
"""

import os
import time
import pandas as pd
import ccxt

DEFAULT_TIMEFRAMES = [
    '1m', '3m', '5m', '10m', '15m', '30m',
    '1h', '2h', '4h', '12h', '24h', '4d', '30d'
]

def get_exchange():
    """Initializes and returns the Binance exchange instance via CCXT."""
    return ccxt.binance({
        'enableRateLimit': True,
        'options': {'defaultType': 'spot'}
    })

def fetch_ohlcv_paginated(exchange, symbol='BTC/USDT', timeframe='1h', target_candles=1500):
    """
    Fetches historical OHLCV data with pagination to get up to target_candles.
    """
    limit_per_req = 1000
    all_ohlcv = []
    
    # Estimate time window to fetch backwards from now
    try:
        # Initial fetch
        candles = exchange.fetch_ohlcv(symbol, timeframe=timeframe, limit=min(target_candles, limit_per_req))
        all_ohlcv.extend(candles)
        
        # If we need more and exchange supports pagination
        if target_candles > limit_per_req and len(candles) > 0:
            earliest_ts = candles[0][0]
            # Fetch previous chunk
            timeframe_ms = exchange.parse_timeframe(timeframe) * 1000
            since = earliest_ts - (timeframe_ms * (target_candles - len(candles)))
            
            more_candles = exchange.fetch_ohlcv(symbol, timeframe=timeframe, since=since, limit=min(target_candles - len(candles), limit_per_req))
            if more_candles:
                all_ohlcv = more_candles + [c for c in all_ohlcv if c[0] > more_candles[-1][0]]
    except Exception as e:
        print(f"Warning during pagination for {timeframe}: {e}")
        if not all_ohlcv:
            # Fallback to single limit fetch
            all_ohlcv = exchange.fetch_ohlcv(symbol, timeframe=timeframe, limit=500)

    # Convert to DataFrame
    df = pd.DataFrame(all_ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
    df = df.drop_duplicates(subset=['timestamp']).sort_values('timestamp').reset_index(drop=True)
    return df

def resample_ohlcv(df, rule):
    """
    Resamples an OHLCV DataFrame using standard financial aggregation rules.
    """
    resampled = df.set_index('timestamp').resample(rule).agg({
        'open': 'first',
        'high': 'max',
        'low': 'min',
        'close': 'last',
        'volume': 'sum'
    }).dropna().reset_index()
    return resampled

def fetch_all_timeframes(output_dir='data/raw', target_candles=1200):
    """
    Fetches all required timeframes, performs resampling for custom intervals,
    and saves raw datasets to CSV.
    """
    os.makedirs(output_dir, exist_ok=True)
    exchange = get_exchange()
    saved_files = {}

    # 1. Fetch direct Binance standard intervals
    direct_tfs = {
        '1m': '1m',
        '3m': '3m',
        '5m': '5m',
        '15m': '15m',
        '30m': '30m',
        '1h': '1h',
        '2h': '2h',
        '4h': '4h',
        '12h': '12h',
        '24h': '1d'
    }

    base_dfs = {}
    for label, tf in direct_tfs.items():
        print(f"Fetching BTC/USDT [{label}] ...")
        df = fetch_ohlcv_paginated(exchange, symbol='BTC/USDT', timeframe=tf, target_candles=target_candles)
        base_dfs[label] = df
        path = os.path.join(output_dir, f"BTC_USDT_{label}.csv")
        df.to_csv(path, index=False)
        saved_files[label] = path
        time.sleep(0.1)

    # 2. Resample custom timeframes requested: 10m from 5m, 4d and 30d from 24h
    if '5m' in base_dfs and not base_dfs['5m'].empty:
        print("Resampling 10m from 5m base data...")
        df_10m = resample_ohlcv(base_dfs['5m'], '10min')
        path_10m = os.path.join(output_dir, "BTC_USDT_10m.csv")
        df_10m.to_csv(path_10m, index=False)
        saved_files['10m'] = path_10m

    if '24h' in base_dfs and not base_dfs['24h'].empty:
        print("Resampling 4d and 30d from 24h (1d) base data...")
        df_4d = resample_ohlcv(base_dfs['24h'], '4D')
        path_4d = os.path.join(output_dir, "BTC_USDT_4d.csv")
        df_4d.to_csv(path_4d, index=False)
        saved_files['4d'] = path_4d

        df_30d = resample_ohlcv(base_dfs['24h'], '30D')
        path_30d = os.path.join(output_dir, "BTC_USDT_30d.csv")
        df_30d.to_csv(path_30d, index=False)
        saved_files['30d'] = path_30d

    print("Data acquisition complete. Saved files for timeframes:", list(saved_files.keys()))
    return saved_files

def load_timeframe_data(tf, data_dir='data/raw'):
    """Loads CSV for a specific timeframe."""
    path = os.path.join(data_dir, f"BTC_USDT_{tf}.csv")
    if not os.path.exists(path):
        raise FileNotFoundError(f"File not found: {path}")
    df = pd.read_csv(path)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    return df
