# 📈 Multi-Timeframe Cryptocurrency Price Forecasting & Algorithmic Backtesting
### *Machine Learning Laboratory Project | Academic Mini-Project Submission*

---

## 🌟 Executive Summary

This project delivers an end-to-end Machine Learning pipeline for **Bitcoin (`BTC/USDT`) price prediction, directional trend classification, and algorithmic backtesting** across **13 distinct trading timeframes**:
- **Scalping / High-Frequency:** `1m`, `3m`, `5m`, `10m`
- **Intraday:** `15m`, `30m`, `1h`, `2h`, `4h`
- **Swing / Position Macro:** `12h`, `24h` (Daily), `4d`, `30d` (Monthly)

The system compares three foundational machine learning paradigms:
1. **Ridge Regression** (Linear baseline with $L_2$ regularization)
2. **Random Forest Regressor** (Ensemble bagging of non-linear decision trees)
3. **LightGBM Regressor** (Gradient boosted decision trees with histogram-based binning)

Each model is evaluated under a **strict chronological train/test split** (to prevent lookahead bias) and simulated via an **event-driven backtesting engine** with an initial capital of **$10,000.00**, realistic **0.1% exchange fees**, and exhaustive individual trade logs.

---

## 📁 Repository Structure

```
├── README.md                           # Comprehensive documentation & lab report
├── requirements.txt                    # Project Python dependencies
├── build_notebooks.py                  # Script to regenerate & re-execute notebooks
├── notebooks/                          # 📓 Segregated, fully-executed Jupyter Notebooks
│   ├── 01_data_acquisition.ipynb       # CCXT Binance data fetching & resampling
│   ├── 02_eda_and_preprocessing.ipynb  # Statistical distributions, skewness, fat tails
│   ├── 03_feature_engineering.ipynb    # Technical indicators (RSI, MACD, BB, ATR)
│   ├── 04_model_training_and_evaluation.ipynb # Temporal split & ML benchmarking
│   ├── 05_backtesting_and_simulation.ipynb    # $10,000 capital backtesting & trade logs
│   └── 06_future_forecasting.ipynb     # Live multi-timeframe future predictions
├── src/                                # 📦 Modular Python Core Engine
│   ├── __init__.py
│   ├── data_loader.py                  # Historical fetching & financial resampling
│   ├── features.py                     # Quantitative indicator calculations
│   ├── models.py                       # Chronological split, scaling, training
│   ├── backtester.py                   # $10k portfolio simulation & trade logging
│   └── forecast.py                     # Next-candle and multi-step projection
├── data/
│   ├── raw/                            # Raw OHLCV CSVs for all 13 timeframes
│   └── processed/                      # 22-feature matrices ready for training
└── results/
    ├── backtest_summary.csv            # Comparative backtest metrics table
    ├── master_trade_logs.csv           # Full itemized list of all trades taken
    └── future_forecasts.csv            # Live price forecast for all 13 timeframes
```

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- Python 3.10+ (Tested up to Python 3.14)
- Internet connection (to query public Binance spot candles via CCXT)

### 2. Environment Setup
```bash
# Clone or navigate to the project directory
cd "ML LAB Project"

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install required packages
pip install -r requirements.txt
```

### 3. Launching Jupyter Notebooks
All 6 notebooks inside the `notebooks/` directory come **pre-executed with all figures, metrics, and trade logs rendered**. You can view or re-run them interactively:
```bash
jupyter notebook notebooks/
# Or launch in VS Code / Cursor by opening any .ipynb file
```

---

## 📊 End-to-End Workflow & Notebook Breakdown

### 📓 Notebook 1: Data Acquisition (`01_data_acquisition.ipynb`)
- Fetches real-time historical OHLCV data using `ccxt.binance` for public spot markets without requiring API keys.
- **Resampling Engine:** Derives custom intervals (`10m` from `5m`, `4d` and `30d` from `24h`) using standard financial candlestick rules:
  $$\text{Open} = \text{first}, \quad \text{High} = \max, \quad \text{Low} = \min, \quad \text{Close} = \text{last}, \quad \text{Volume} = \sum$$
- Archives datasets cleanly in `data/raw/BTC_USDT_{timeframe}.csv`.

### 📓 Notebook 2: Exploratory Data Analysis & Preprocessing (`02_eda_and_preprocessing.ipynb`)
- **Missing Value Validation:** Confirms continuous, gap-free timestamps.
- **Financial Return Formulations:**
  $$r_t = \ln\left(\frac{P_t}{P_{t-1}}\right)$$
- **Stylized Empirical Facts:** Confirms **leptokurtic (fat-tail) distribution** of cryptocurrency returns compared to standard Gaussian bell curves, demonstrating that extreme events occur far more frequently than normal distributions assume.

### 📓 Notebook 3: Technical Feature Engineering (`03_feature_engineering.ipynb`)
Generates 22 domain-specific quantitative features:
- **Trend:** Simple Moving Averages (`SMA_7`, `SMA_21`), Exponential Moving Average (`EMA_14`), Moving Average Ratio.
- **Momentum:** Relative Strength Index (`RSI_14`), Moving Average Convergence Divergence (`MACD`, `Signal`, `Histogram`).
- **Volatility:** Bollinger Bands (Upper, Lower, Bandwidth $\pm 2\sigma$), Average True Range (`ATR_14`), Rolling Standard Deviation of Returns.
- **Liquidity:** Volume 14-period Moving Average Ratio, High-Low Intraday Spread.
- **Target Formulation:** Next-candle price $P_{t+1}$ shifted by $-1$, preventing lookahead leakage.

### 📓 Notebook 4: Model Training & Evaluation (`04_model_training_and_evaluation.ipynb`)
- **Chronological Split:** Chronological 80% train / 20% test partition (preventing random shuffle leakage).
- **Leak-Free Scaling:** `StandardScaler` fitted strictly on the training partition.
- **Benchmarking Suite:**
  - **RMSE** (Root Mean Squared Error)
  - **MAE** (Mean Absolute Error)
  - **$R^2$ Score** (Variance Explained)
  - **Directional Accuracy (Hit Rate %):**
    $$\text{DA} = \frac{1}{N} \sum_{i=1}^N \mathbb{I}\left(\text{sign}(\hat{P}_{t+1} - P_t) == \text{sign}(P_{t+1} - P_t)\right)$$

### 📓 Notebook 5: Algorithmic Backtesting & Trading Simulation (`05_backtesting_and_simulation.ipynb`)
- **Initial Account Value:** Exactly **$10,000.00 USD**.
- **Exchange Fee:** Realistic **0.1% transaction fee** applied on both entry and exit.
- **Position Sizing:** 100% equity deployment on confirmed bullish signal, exit to cash on bearish/flat signal.
- **Trade Log:** Every trade records `Trade_ID`, `Timeframe`, `Model`, `Entry_Time`, `Exit_Time`, `Entry_Price`, `Exit_Price`, `Position_BTC`, `Trade_PnL_$`, `Trade_Return_%`, and `Capital_After_Trade`.
- **Comparative Risk Metrics:** Total Return %, Win Rate %, Max Drawdown %, and Sharpe Ratio vs Bitcoin Buy & Hold.

### 📓 Notebook 6: Future Price Forecasting (`06_future_forecasting.ipynb`)
- Uses trained models and the latest available market candle to generate **live next-period forecasts** across all 13 timeframes.
- Classifies expected direction into **BULLISH 🟢** or **BEARISH 🔴**.
- Generates **multi-step recursive autoregressive forecast cones** (+1 to +5 future steps) for immediate, intermediate, and daily horizons.

---

## 📈 Sample Results & Performance Highlights

### 1. Live Next-Candle Forecasts (Extracted from `results/future_forecasts.csv`)
| Timeframe | Current Price ($) | Predicted Next Price ($) | Expected Return (%) | Signal |
|:---:|:---:|:---:|:---:|:---:|
| **1m** | $82,475.47 | $82,469.77 | -0.007% | BEARISH 🔴 |
| **5m** | $82,475.47 | $82,444.19 | -0.038% | BEARISH 🔴 |
| **10m** | $82,547.88 | $82,554.77 | +0.008% | BULLISH 🟢 |
| **30m** | $82,547.75 | $82,652.62 | +0.127% | BULLISH 🟢 |
| **1h** | $82,820.33 | $82,939.10 | +0.143% | BULLISH 🟢 |
| **2h** | $82,820.33 | $83,504.94 | +0.827% | BULLISH 🟢 |
| **4h** | $82,617.68 | $84,675.44 | +2.491% | BULLISH 🟢 |
| **12h** | $81,504.32 | $81,397.59 | -0.131% | BEARISH 🔴 |
| **24h** | $81,938.40 | $80,690.36 | -1.523% | BEARISH 🔴 |
| **4d** | $81,615.64 | $82,846.65 | +1.508% | BULLISH 🟢 |

### 2. Sample Itemized Trade Log (Extracted from `results/master_trade_logs.csv`)
*Starting Capital: $10,000.00*
| Trade ID | Timeframe | Model | Entry Price | Exit Price | Trade PnL ($) | Trade Return (%) | Capital After Trade ($) |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | 10m | LightGBM | $81,479.87 | $81,740.00 | +$11.87 | +0.12% | $10,011.87 |
| 1 | 10m | Random Forest | $81,456.00 | $81,740.00 | +$14.81 | +0.15% | $10,014.81 |
| 1 | 30m | LightGBM | $81,139.36 | $81,491.04 | +$23.27 | +0.23% | $10,023.27 |
| 2 | 30m | LightGBM | $82,093.75 | $81,982.61 | -$33.58 | -0.34% | $9,989.69 |

---

## 🎓 Teacher & Viva Defense Questions (Cheat Sheet)

1. **Why not use standard k-fold cross validation?**
   - *Answer:* Financial prices are auto-correlated time series. Standard random splits cause data leakage from future timestamps into the past. We strictly use chronological forward splits.
2. **Why evaluate Directional Accuracy alongside RMSE?**
   - *Answer:* Because price $P_{t+1}$ is strongly correlated with $P_t$, a naive model predicting $P_{t+1} \approx P_t$ achieves low RMSE and high $R^2$ but zero trading utility. Directional Accuracy (predicting if the candle closes higher or lower) directly determines trade profitability.
3. **Why did higher timeframes (e.g. 1h, 4h) trade more profitably than 1m scalping?**
   - *Answer:* High-frequency candles (1m) contain substantial micro-structure noise and suffer from transaction fee friction (0.1% per trade). Longer timeframes filter out intraday noise and allow price trends to overcome transaction costs.

---

## 📜 License & Acknowledgments
- Developed for ML Lab Mini-Project Curriculum.
- Data provided via CCXT & Binance Public API.
# Machine-Learning-Lab-Mini-Project
