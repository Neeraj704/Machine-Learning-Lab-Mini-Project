"""
Backtesting & Trading Simulation Module
Simulates algorithmic trading with a realistic $10,000 starting cash balance,
incorporating transaction fees (0.1%), tracking every individual trade taken,
calculating portfolio equity curves, and computing key risk-adjusted metrics
(Total Return, Win Rate, Sharpe Ratio, Max Drawdown).
"""

import numpy as np
import pandas as pd

class Backtester:
    def __init__(self, initial_capital=10000.0, fee_pct=0.001, min_edge_pct=0.001):
        """
        initial_capital: Starting USD cash ($10,000)
        fee_pct: Exchange fee per trade (0.1% = 0.001)
        min_edge_pct: Minimum predicted return required to enter a trade to overcome fees
        """
        self.initial_capital = float(initial_capital)
        self.fee_pct = float(fee_pct)
        self.min_edge_pct = float(min_edge_pct)
        
    def run(self, test_df, predictions, model_name="Model", timeframe="1h"):
        """
        Executes backtest over test dataset using model predictions.
        Returns:
            - summary: dict of performance statistics
            - trade_log: DataFrame of all individual trades taken
            - equity_curve: DataFrame of balance over time
        """
        df = test_df.copy().reset_index(drop=True)
        df['pred_next_close'] = predictions
        
        capital = self.initial_capital
        btc_held = 0.0
        in_position = False
        
        trade_id = 1
        trades = []
        equity_history = []
        
        entry_time = None
        entry_price = 0.0
        
        for i in range(len(df) - 1):
            curr_time = df.loc[i, 'timestamp']
            curr_price = df.loc[i, 'close']
            pred_price = df.loc[i, 'pred_next_close']
            pred_return = (pred_price - curr_price) / curr_price
            
            # Record current total equity
            total_equity = capital + (btc_held * curr_price)
            equity_history.append({
                'timestamp': curr_time,
                'equity': total_equity,
                'price': curr_price
            })
            
            # Trading logic
            # BUY SIGNAL: Predict price will rise by more than minimum edge
            if not in_position and pred_return > (self.fee_pct + self.min_edge_pct):
                fee = capital * self.fee_pct
                investable = capital - fee
                btc_held = investable / curr_price
                capital = 0.0
                in_position = True
                entry_time = curr_time
                entry_price = curr_price
                
            # SELL SIGNAL: Predict price will fall or flat
            elif in_position and pred_return < 0:
                gross_proceeds = btc_held * curr_price
                exit_fee = gross_proceeds * self.fee_pct
                net_proceeds = gross_proceeds - exit_fee
                
                trade_pnl = net_proceeds - (self.initial_capital if trade_id == 1 else trades[-1]['Capital_After_Trade'])
                trade_return = ((curr_price - entry_price) / entry_price) - (2 * self.fee_pct)
                
                capital = net_proceeds
                btc_held = 0.0
                in_position = False
                
                trades.append({
                    'Trade_ID': trade_id,
                    'Timeframe': timeframe,
                    'Model': model_name,
                    'Entry_Time': entry_time,
                    'Exit_Time': curr_time,
                    'Entry_Price': round(entry_price, 2),
                    'Exit_Price': round(curr_price, 2),
                    'Position_BTC': round(net_proceeds / curr_price, 6),
                    'Trade_PnL_$': round(trade_pnl, 2),
                    'Trade_Return_%': round(trade_return * 100, 2),
                    'Capital_After_Trade': round(capital, 2)
                })
                trade_id += 1

        # Liquidate any open position at the final candle
        if in_position:
            final_time = df.iloc[-1]['timestamp']
            final_price = df.iloc[-1]['close']
            gross = btc_held * final_price
            capital = gross * (1 - self.fee_pct)
            trade_pnl = capital - (self.initial_capital if len(trades) == 0 else trades[-1]['Capital_After_Trade'])
            trade_return = ((final_price - entry_price) / entry_price) - (2 * self.fee_pct)
            trades.append({
                'Trade_ID': trade_id,
                'Timeframe': timeframe,
                'Model': model_name,
                'Entry_Time': entry_time,
                'Exit_Time': final_time,
                'Entry_Price': round(entry_price, 2),
                'Exit_Price': round(final_price, 2),
                'Position_BTC': round(capital / final_price, 6),
                'Trade_PnL_$': round(trade_pnl, 2),
                'Trade_Return_%': round(trade_return * 100, 2),
                'Capital_After_Trade': round(capital, 2)
            })

        # Final equity record
        equity_history.append({
            'timestamp': df.iloc[-1]['timestamp'],
            'equity': capital,
            'price': df.iloc[-1]['close']
        })
        
        equity_df = pd.DataFrame(equity_history)
        trades_df = pd.DataFrame(trades)
        
        # Calculate performance statistics
        final_capital = capital
        total_pnl = final_capital - self.initial_capital
        total_return_pct = (total_pnl / self.initial_capital) * 100.0
        
        # Benchmark Buy & Hold return
        start_price = df.iloc[0]['close']
        end_price = df.iloc[-1]['close']
        buy_hold_return_pct = ((end_price - start_price) / start_price) * 100.0
        
        # Win rate
        if len(trades_df) > 0:
            win_trades = (trades_df['Trade_Return_%'] > 0).sum()
            loss_trades = (trades_df['Trade_Return_%'] <= 0).sum()
            win_rate = (win_trades / len(trades_df)) * 100.0
        else:
            win_trades, loss_trades, win_rate = 0, 0, 0.0

        # Maximum Drawdown calculation
        equity_series = equity_df['equity']
        rolling_max = equity_series.cummax()
        drawdowns = (equity_series - rolling_max) / rolling_max
        max_drawdown_pct = abs(float(drawdowns.min())) * 100.0
        
        # Sharpe ratio approximation
        returns = equity_series.pct_change().dropna()
        if len(returns) > 1 and returns.std() > 0:
            sharpe = float((returns.mean() / returns.std()) * np.sqrt(252))
        else:
            sharpe = 0.0

        summary = {
            'Timeframe': timeframe,
            'Model': model_name,
            'Initial_Balance': round(self.initial_capital, 2),
            'Final_Balance': round(final_capital, 2),
            'Net_Profit_$': round(total_pnl, 2),
            'Total_Return_%': round(total_return_pct, 2),
            'Buy_Hold_Return_%': round(buy_hold_return_pct, 2),
            'Total_Trades': len(trades_df),
            'Win_Trades': int(win_trades),
            'Loss_Trades': int(loss_trades),
            'Win_Rate_%': round(win_rate, 2),
            'Max_Drawdown_%': round(max_drawdown_pct, 2),
            'Sharpe_Ratio': round(sharpe, 2)
        }
        
        return summary, trades_df, equity_df
