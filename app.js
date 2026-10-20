/* ============================================================
   BTC Price Forecasting — Project Showcase Application Logic
   Charts (Chart.js), tables, sorting, filtering, pagination,
   scroll animations, accordion, and navbar active state.
   ============================================================ */

(function () {
  'use strict';

  const D = window.PROJECT_DATA;
  if (!D) { console.error('web_data.js not loaded'); return; }

  /* ── Chart.js Global Defaults ── */
  Chart.defaults.color = '#9ca3af';
  Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(26,31,46,0.95)';
  Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.08)';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.titleFont = { family: "'Inter', sans-serif", size: 13, weight: '600' };
  Chart.defaults.plugins.tooltip.bodyFont = { family: "'JetBrains Mono', monospace", size: 12 };
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.pointStyle = 'circle';
  Chart.defaults.plugins.legend.labels.padding = 16;
  Chart.defaults.elements.point.radius = 0;
  Chart.defaults.elements.point.hoverRadius = 5;
  Chart.defaults.elements.line.tension = 0.3;

  /* ════════════════════════════════════════════
     1. NAVBAR — Scroll State & Active Section
     ════════════════════════════════════════════ */
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('#navLinks a');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // Active section highlighting
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  sections.forEach(s => sectionObserver.observe(s));

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navLinksContainer = document.getElementById('navLinks');
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      const visible = navLinksContainer.style.display === 'flex';
      navLinksContainer.style.display = visible ? 'none' : 'flex';
      navLinksContainer.style.flexDirection = 'column';
      navLinksContainer.style.position = 'absolute';
      navLinksContainer.style.top = '64px';
      navLinksContainer.style.right = '16px';
      navLinksContainer.style.background = 'rgba(10,14,23,0.97)';
      navLinksContainer.style.backdropFilter = 'blur(20px)';
      navLinksContainer.style.padding = '12px';
      navLinksContainer.style.borderRadius = '12px';
      navLinksContainer.style.border = '1px solid rgba(255,255,255,0.06)';
    });
  }

  /* ════════════════════════════════════════════
     2. SCROLL ANIMATIONS — Fade In on Scroll
     ════════════════════════════════════════════ */
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

  /* ════════════════════════════════════════════
     3. HERO — Total Trades Count
     ════════════════════════════════════════════ */
  const totalTradesHero = document.getElementById('totalTradesHero');
  if (totalTradesHero) {
    totalTradesHero.textContent = D.trade_logs.length;
  }

  /* ════════════════════════════════════════════
     4. FEATURE IMPORTANCE CHART
     ════════════════════════════════════════════ */
  const fiCtx = document.getElementById('featureImportanceChart');
  let fiChartInstance = null;
  const rawOHLCV = new Set(['close', 'low', 'high', 'open', 'volume']);

  function renderFeatureImportance(mode = 'tech') {
    if (!fiCtx || !D.feature_importances) return;
    
    let items = [...D.feature_importances];
    if (mode === 'tech') {
      items = items.filter(f => !rawOHLCV.has(f.feature));
      // Normalize to 100% relative technical contribution
      const rfSum = items.reduce((s, f) => s + f.rf, 0) || 1;
      const lgbSum = items.reduce((s, f) => s + f.lgb, 0) || 1;
      items = items.map(f => ({
        feature: f.feature,
        rf: f.rf / rfSum,
        lgb: f.lgb / lgbSum
      }));
    }
    
    items.sort((a, b) => (b.rf + b.lgb) / 2 - (a.rf + a.lgb) / 2);

    if (fiChartInstance) {
      fiChartInstance.destroy();
    }

    fiChartInstance = new Chart(fiCtx, {
      type: 'bar',
      data: {
        labels: items.map(f => f.feature),
        datasets: [
          {
            label: 'Random Forest Regressor',
            data: items.map(f => f.rf),
            backgroundColor: 'rgba(0, 212, 255, 0.8)',
            borderColor: '#00d4ff',
            borderWidth: 1.5,
            borderRadius: 4,
          },
          {
            label: 'LightGBM Regressor',
            data: items.map(f => f.lgb),
            backgroundColor: 'rgba(245, 158, 11, 0.8)',
            borderColor: '#f59e0b',
            borderWidth: 1.5,
            borderRadius: 4,
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { size: 12, weight: '600' }, color: '#e2e8f0' }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${(ctx.parsed.x * 100).toFixed(2)}%`
            }
          }
        },
        scales: {
          x: {
            ticks: {
              callback: v => (v * 100).toFixed(0) + '%',
              color: '#94a3b8'
            },
            grid: { color: 'rgba(255,255,255,0.04)' }
          },
          y: {
            ticks: {
              font: { family: "'JetBrains Mono', monospace", size: 12 },
              color: '#f8fafc'
            },
            grid: { display: false }
          }
        }
      }
    });
  }

  // Hook up toggle buttons
  const fiToggleGroup = document.getElementById('fiToggleGroup');
  if (fiToggleGroup) {
    fiToggleGroup.querySelectorAll('.btn-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        fiToggleGroup.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderFeatureImportance(btn.dataset.fiMode);
      });
    });
  }
  renderFeatureImportance('tech');

  /* ════════════════════════════════════════════
     5. ACTUAL VS PREDICTED CHART — 1h (ZOOMED & SHARP)
     ════════════════════════════════════════════ */
  const avpCtx = document.getElementById('actualVsPredChart');
  let avpChartInstance = null;

  function renderActualVsPred(range = 'all') {
    if (!avpCtx || !D.actual_vs_pred_1h) return;
    const fullData = D.actual_vs_pred_1h;
    let dataSlice = fullData;

    if (range === '48h') {
      dataSlice = fullData.slice(-48);
    } else if (range === 'vol') {
      // High volatility dip slice
      dataSlice = fullData.slice(40, 95);
    }

    const labels = dataSlice.map(d => {
      const dt = new Date(d.timestamp);
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
             dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    });

    // Dynamic tight Y-axis zoom
    const allPrices = dataSlice.flatMap(d => [d.actual, d.linear, d.rf, d.lgb].filter(v => typeof v === 'number'));
    const minP = Math.min(...allPrices);
    const maxP = Math.max(...allPrices);
    const pad = Math.max((maxP - minP) * 0.08, 150);
    const yMin = Math.floor((minP - pad) / 50) * 50;
    const yMax = Math.ceil((maxP + pad) / 50) * 50;

    if (avpChartInstance) {
      avpChartInstance.destroy();
    }

    avpChartInstance = new Chart(avpCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Actual Market Price',
            data: dataSlice.map(d => d.actual),
            borderColor: '#ffffff',
            borderWidth: 2.8,
            backgroundColor: 'rgba(255,255,255,0.06)',
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#ffffff',
            tension: 0.2
          },
          {
            label: 'LightGBM Regressor (Best)',
            data: dataSlice.map(d => d.lgb),
            borderColor: '#f59e0b',
            borderWidth: 2.2,
            borderDash: [6, 3],
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: '#f59e0b',
            tension: 0.2
          },
          {
            label: 'Random Forest Regressor',
            data: dataSlice.map(d => d.rf),
            borderColor: '#10b981',
            borderWidth: 2.0,
            borderDash: [4, 4],
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: '#10b981',
            tension: 0.2
          },
          {
            label: 'Ridge Linear Regression',
            data: dataSlice.map(d => d.linear),
            borderColor: '#00d4ff',
            borderWidth: 1.8,
            borderDash: [3, 3],
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: '#00d4ff',
            tension: 0.2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { size: 12, weight: '600' }, color: '#e2e8f0', padding: 18 }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            }
          }
        },
        scales: {
          x: {
            ticks: { maxTicksLimit: 14, maxRotation: 30, font: { size: 10 }, color: '#94a3b8' },
            grid: { color: 'rgba(255,255,255,0.03)' }
          },
          y: {
            min: yMin,
            max: yMax,
            ticks: {
              callback: v => '$' + v.toLocaleString(),
              color: '#f8fafc',
              font: { family: "'JetBrains Mono', monospace", size: 11 }
            },
            grid: { color: 'rgba(255,255,255,0.04)' }
          }
        }
      }
    });
  }

  // Hook up zoom buttons
  const avpRangeGroup = document.getElementById('avpRangeGroup');
  if (avpRangeGroup) {
    avpRangeGroup.querySelectorAll('.btn-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        avpRangeGroup.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderActualVsPred(btn.dataset.range);
      });
    });
  }
  renderActualVsPred('all');

  /* ════════════════════════════════════════════
     6. BACKTEST KPI CARDS
     ════════════════════════════════════════════ */
  const kpiContainer = document.getElementById('backtestKPIs');
  if (kpiContainer && D.backtest_summary) {
    const bs = D.backtest_summary;
    const activeTrades = bs.filter(b => b.Total_Trades > 0);
    const best = activeTrades.reduce((a, b) => a['Total_Return_%'] > b['Total_Return_%'] ? a : b, activeTrades[0]);
    const worst = activeTrades.reduce((a, b) => a['Total_Return_%'] < b['Total_Return_%'] ? a : b, activeTrades[0]);
    const totalTrades = bs.reduce((s, b) => s + b.Total_Trades, 0);
    const totalWins = bs.reduce((s, b) => s + b.Win_Trades, 0);

    kpiContainer.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-label">Best Performer</div>
        <div class="kpi-value kpi-positive">+$${best.Net_Profit_$.toLocaleString()}</div>
        <div class="kpi-sub">${best.Timeframe} × ${best.Model.replace('_', ' ')} (${best['Total_Return_%']}%)</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Worst Performer</div>
        <div class="kpi-value kpi-negative">-$${Math.abs(worst.Net_Profit_$).toLocaleString()}</div>
        <div class="kpi-sub">${worst.Timeframe} × ${worst.Model.replace('_', ' ')} (${worst['Total_Return_%']}%)</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total Trades Across All</div>
        <div class="kpi-value kpi-neutral">${totalTrades}</div>
        <div class="kpi-sub">${totalWins} wins, ${totalTrades - totalWins} losses</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Overall Win Rate</div>
        <div class="kpi-value kpi-neutral">${totalTrades > 0 ? ((totalWins / totalTrades) * 100).toFixed(1) : 0}%</div>
        <div class="kpi-sub">Across all model × timeframe combos</div>
      </div>
    `;
  }

  /* ════════════════════════════════════════════
     7. BACKTEST PERFORMANCE CHART (PNL / RETURN / BALANCE)
     ════════════════════════════════════════════ */
  const bpCtx = document.getElementById('backtestPerformanceChart');
  let bpChartInstance = null;

  function renderBacktestPerformance(mode = 'pnl') {
    if (!bpCtx || !D.backtest_summary) return;
    const bs = D.backtest_summary;

    // Filter to timeframes with active trading or profit variation
    const displayTFs = [...new Set(bs.map(b => b.Timeframe))].filter(tf => {
      const rows = bs.filter(b => b.Timeframe === tf);
      return rows.some(r => r.Total_Trades > 0) || rows.some(r => r.Final_Balance !== 10000);
    });

    const models = ['Linear_Regression', 'Random_Forest', 'LightGBM'];
    const modelBaseColors = {
      'Linear_Regression': { base: '#00d4ff', label: 'Ridge Regression' },
      'Random_Forest': { base: '#10b981', label: 'Random Forest' },
      'LightGBM': { base: '#f59e0b', label: 'LightGBM' }
    };

    if (bpChartInstance) {
      bpChartInstance.destroy();
    }

    const datasets = models.map(model => {
      const data = displayTFs.map(tf => {
        const row = bs.find(b => b.Timeframe === tf && b.Model === model);
        if (!row) return 0;
        if (mode === 'pnl') return row.Net_Profit_$;
        if (mode === 'return') return row['Total_Return_%'];
        return row.Final_Balance;
      });

      // Dynamic bar colors based on positive/negative in PnL/Return mode
      const bgColors = data.map(v => {
        if (mode === 'balance') return modelBaseColors[model].base + 'cc';
        return v >= 0 ? 'rgba(16, 185, 129, 0.85)' : 'rgba(244, 63, 94, 0.85)';
      });

      const borderColors = data.map(v => {
        if (mode === 'balance') return modelBaseColors[model].base;
        return v >= 0 ? '#10b981' : '#f43f5e';
      });

      return {
        label: modelBaseColors[model].label,
        data,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 1.5,
        borderRadius: 4,
      };
    });

    bpChartInstance = new Chart(bpCtx, {
      type: 'bar',
      data: {
        labels: displayTFs,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { size: 11, weight: '600' }, color: '#e2e8f0' }
          },
          tooltip: {
            callbacks: {
              label: ctx => {
                const tf = displayTFs[ctx.dataIndex];
                const model = models[ctx.datasetIndex];
                const row = bs.find(b => b.Timeframe === tf && b.Model === model);
                if (!row) return '';
                const pnlPrefix = row.Net_Profit_$ >= 0 ? '+$' : '-$';
                return [
                  ` ${modelBaseColors[model].label} [${tf}]`,
                  ` Net PnL: ${pnlPrefix}${Math.abs(row.Net_Profit_$).toLocaleString()}`,
                  ` Return: ${row['Total_Return_%'] >= 0 ? '+' : ''}${row['Total_Return_%']}%`,
                  ` Trades: ${row.Total_Trades}  |  Win Rate: ${row['Win_Rate_%']}%`,
                  ` Sharpe: ${row.Sharpe_Ratio}  |  Max DD: ${row['Max_Drawdown_%']}%`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { font: { family: "'JetBrains Mono', monospace", size: 11 }, color: '#94a3b8' },
            grid: { display: false }
          },
          y: {
            ticks: {
              callback: v => {
                if (mode === 'pnl') return (v >= 0 ? '+$' : '-$') + Math.abs(v).toLocaleString();
                if (mode === 'return') return (v >= 0 ? '+' : '') + v + '%';
                return '$' + v.toLocaleString();
              },
              color: '#f8fafc',
              font: { family: "'JetBrains Mono', monospace", size: 10 }
            },
            grid: {
              color: ctx => ctx.tick.value === 0 || (mode === 'balance' && ctx.tick.value === 10000) ?
                     'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.03)',
              lineWidth: ctx => ctx.tick.value === 0 || (mode === 'balance' && ctx.tick.value === 10000) ? 1.5 : 1
            },
            ...(mode === 'balance' ? { min: 9200, max: 12500 } : {})
          }
        }
      }
    });
  }

  // Hook up toggle buttons
  const bpToggleGroup = document.getElementById('bpToggleGroup');
  if (bpToggleGroup) {
    bpToggleGroup.querySelectorAll('.btn-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        bpToggleGroup.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderBacktestPerformance(btn.dataset.bpMode);
      });
    });
  }
  renderBacktestPerformance('pnl');

  /* ════════════════════════════════════════════
     8. STRATEGY VS BUY & HOLD CHART
     ════════════════════════════════════════════ */
  const svbCtx = document.getElementById('strategyVsBuyHoldChart');
  if (svbCtx && D.backtest_summary) {
    const bs = D.backtest_summary;
    const active = bs.filter(b => b.Total_Trades > 0);
    const tfBest = {};
    active.forEach(row => {
      if (!tfBest[row.Timeframe] || row['Total_Return_%'] > tfBest[row.Timeframe]['Total_Return_%']) {
        tfBest[row.Timeframe] = row;
      }
    });
    const sortedTFs = Object.keys(tfBest).sort((a, b) => tfBest[b]['Total_Return_%'] - tfBest[a]['Total_Return_%']);

    new Chart(svbCtx, {
      type: 'bar',
      data: {
        labels: sortedTFs.map(tf => `${tf} (${tfBest[tf].Model.replace('Linear_Regression', 'Ridge').replace('Random_Forest', 'RF')})`),
        datasets: [
          {
            label: 'ML Strategy Return %',
            data: sortedTFs.map(tf => tfBest[tf]['Total_Return_%']),
            backgroundColor: sortedTFs.map(tf => tfBest[tf]['Total_Return_%'] >= 0 ? 'rgba(16,185,129,0.85)' : 'rgba(244,63,94,0.85)'),
            borderColor: sortedTFs.map(tf => tfBest[tf]['Total_Return_%'] >= 0 ? '#10b981' : '#f43f5e'),
            borderWidth: 1.5,
            borderRadius: 4,
            barThickness: 16
          },
          {
            label: 'Bitcoin Buy & Hold Return %',
            data: sortedTFs.map(tf => tfBest[tf]['Buy_Hold_Return_%']),
            backgroundColor: 'rgba(168,85,247,0.7)',
            borderColor: '#a855f7',
            borderWidth: 1.5,
            borderRadius: 4,
            barThickness: 16
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { size: 11, weight: '600' }, color: '#e2e8f0' }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.x >= 0 ? '+' : ''}${ctx.parsed.x}%`
            }
          }
        },
        scales: {
          x: {
            ticks: {
              callback: v => (v >= 0 ? '+' : '') + v + '%',
              color: '#94a3b8'
            },
            grid: {
              color: ctx => ctx.tick.value === 0 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.03)',
              lineWidth: ctx => ctx.tick.value === 0 ? 1.5 : 1
            }
          },
          y: {
            ticks: { font: { family: "'JetBrains Mono', monospace", size: 10 }, color: '#f8fafc' },
            grid: { display: false }
          }
        }
      }
    });
  }

  /* ════════════════════════════════════════════
     9. WIN RATE HEATMAP
     ════════════════════════════════════════════ */
  const heatmapContainer = document.getElementById('winRateHeatmap');
  if (heatmapContainer && D.backtest_summary) {
    const bs = D.backtest_summary;
    const timeframes = [...new Set(bs.map(b => b.Timeframe))];
    const models = ['Linear_Regression', 'Random_Forest', 'LightGBM'];
    const modelLabels = {
      'Linear_Regression': 'Ridge Linear Regression',
      'Random_Forest': 'Random Forest Regressor',
      'LightGBM': 'LightGBM Regressor'
    };

    let html = `<div class="heatmap-grid" style="grid-template-columns: 80px repeat(${models.length}, 1fr);">`;
    // Header row
    html += '<div class="heatmap-cell heatmap-header">TF</div>';
    models.forEach(m => {
      html += `<div class="heatmap-cell heatmap-header">${modelLabels[m]}</div>`;
    });

    timeframes.forEach(tf => {
      html += `<div class="heatmap-cell heatmap-header" style="font-family:'JetBrains Mono',monospace;">${tf}</div>`;
      models.forEach(m => {
        const row = bs.find(b => b.Timeframe === tf && b.Model === m);
        const wr = row ? row['Win_Rate_%'] : 0;
        const trades = row ? row.Total_Trades : 0;
        const pnl = row ? row.Net_Profit_$ : 0;

        let cls = 'wr-none';
        if (trades === 0) cls = 'wr-none';
        else if (wr >= 100) cls = 'wr-100';
        else if (wr >= 66) cls = 'wr-66';
        else if (wr >= 50) cls = 'wr-50';
        else if (wr >= 25) cls = 'wr-25';
        else cls = 'wr-0';

        const wrText = trades === 0 ? '—' : wr.toFixed(0) + '%';
        const subText = trades === 0 ? 'Cash Hold' : `${trades} trade${trades > 1 ? 's' : ''}`;
        const pnlText = trades === 0 ? '' : ` (${pnl >= 0 ? '+' : ''}$${pnl.toFixed(0)})`;

        html += `
          <div class="heatmap-cell ${cls}" title="${tf} × ${modelLabels[m]}: ${wr}% win rate, ${trades} trades${pnlText}">
            <div class="wr-pct">${wrText}</div>
            <div class="wr-count">${subText}${pnlText}</div>
          </div>
        `;
      });
    });
    html += '</div>';
    heatmapContainer.innerHTML = html;
  }

  /* ════════════════════════════════════════════
     10. BACKTEST SUMMARY TABLE
     ════════════════════════════════════════════ */
  const btBody = document.getElementById('backtestTableBody');
  if (btBody && D.backtest_summary) {
    const fmt = (n, prefix = '', suffix = '') => {
      const str = typeof n === 'number' ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n;
      return prefix + str + suffix;
    };

    D.backtest_summary.forEach(row => {
      const pnlClass = row.Net_Profit_$ > 0 ? 'cell-positive' : row.Net_Profit_$ < 0 ? 'cell-negative' : '';
      const retClass = row['Total_Return_%'] > 0 ? 'cell-positive' : row['Total_Return_%'] < 0 ? 'cell-negative' : '';

      btBody.innerHTML += `<tr>
        <td class="mono-cell">${row.Timeframe}</td>
        <td>${row.Model.replace('_', ' ')}</td>
        <td class="mono-cell">${fmt(row.Final_Balance, '$')}</td>
        <td class="mono-cell ${pnlClass}">${row.Net_Profit_$ >= 0 ? '+' : ''}${fmt(row.Net_Profit_$, '$')}</td>
        <td class="mono-cell ${retClass}">${row['Total_Return_%'] >= 0 ? '+' : ''}${row['Total_Return_%']}%</td>
        <td class="mono-cell">${row['Buy_Hold_Return_%'] >= 0 ? '+' : ''}${row['Buy_Hold_Return_%']}%</td>
        <td class="mono-cell">${row.Total_Trades}</td>
        <td class="mono-cell">${row['Win_Rate_%']}%</td>
        <td class="mono-cell">${row['Max_Drawdown_%']}%</td>
        <td class="mono-cell">${row.Sharpe_Ratio}</td>
      </tr>`;
    });
  }

  /* ════════════════════════════════════════════
     11. EQUITY CURVE CHART (DYNAMIC ZOOMED & HIGH CONTRAST)
     ════════════════════════════════════════════ */
  const ecCtx = document.getElementById('equityCurveChart');
  if (ecCtx && D.equity_curve_1h) {
    const ec = D.equity_curve_1h;
    const labels = ec.map(d => {
      const dt = new Date(d.timestamp);
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
             dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    });

    // Dynamic tight Y-axis zoom for equity
    const allEq = ec.flatMap(d => [d.strategy_equity, d.benchmark_equity]);
    const minEq = Math.min(...allEq);
    const maxEq = Math.max(...allEq);
    const pad = Math.max((maxEq - minEq) * 0.12, 35);
    const yMin = Math.floor((minEq - pad) / 20) * 20;
    const yMax = Math.ceil((maxEq + pad) / 20) * 20;

    new Chart(ecCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'ML Strategy Equity ($10,000 Init)',
            data: ec.map(d => d.strategy_equity),
            borderColor: '#00d4ff',
            backgroundColor: 'rgba(0, 212, 255, 0.12)',
            borderWidth: 2.8,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#00d4ff',
            yAxisID: 'y',
            tension: 0.2
          },
          {
            label: 'Bitcoin Buy & Hold Benchmark ($)',
            data: ec.map(d => d.benchmark_equity),
            borderColor: '#a855f7',
            borderWidth: 2.0,
            borderDash: [6, 3],
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: '#a855f7',
            yAxisID: 'y',
            tension: 0.2
          },
          {
            label: 'BTC Spot Price (USDT)',
            data: ec.map(d => d.btc_price),
            borderColor: 'rgba(245, 158, 11, 0.45)',
            borderWidth: 1.2,
            borderDash: [2, 2],
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 4,
            yAxisID: 'y1',
            tension: 0.2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { size: 12, weight: '600' }, color: '#e2e8f0', padding: 16 }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            }
          }
        },
        scales: {
          x: {
            ticks: { maxTicksLimit: 12, maxRotation: 30, font: { size: 10 }, color: '#94a3b8' },
            grid: { color: 'rgba(255,255,255,0.02)' }
          },
          y: {
            position: 'left',
            min: yMin,
            max: yMax,
            title: { display: true, text: 'Portfolio Equity ($)', color: '#00d4ff', font: { weight: '600' } },
            ticks: {
              callback: v => '$' + v.toLocaleString(),
              color: '#f8fafc',
              font: { family: "'JetBrains Mono', monospace", size: 11 }
            },
            grid: {
              color: ctx => ctx.tick.value === 10000 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.03)',
              lineWidth: ctx => ctx.tick.value === 10000 ? 1.5 : 1
            }
          },
          y1: {
            position: 'right',
            title: { display: true, text: 'BTC Price ($)', color: 'rgba(245, 158, 11, 0.7)' },
            ticks: {
              callback: v => '$' + v.toLocaleString(),
              color: 'rgba(245, 158, 11, 0.7)',
              font: { family: "'JetBrains Mono', monospace", size: 10 }
            },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  /* ════════════════════════════════════════════
     12. TRADE LOG EXPLORER
     ════════════════════════════════════════════ */
  if (D.trade_logs) {
    // Trade KPIs
    const tradeKPIs = document.getElementById('tradeKPIs');
    if (tradeKPIs) {
      const trades = D.trade_logs;
      const wins = trades.filter(t => t['Trade_Return_%'] > 0);
      const losses = trades.filter(t => t['Trade_Return_%'] <= 0);
      const avgPnl = trades.reduce((s, t) => s + t['Trade_PnL_$'], 0) / trades.length;
      const bestTrade = trades.reduce((a, b) => a['Trade_PnL_$'] > b['Trade_PnL_$'] ? a : b);
      const worstTrade = trades.reduce((a, b) => a['Trade_PnL_$'] < b['Trade_PnL_$'] ? a : b);

      tradeKPIs.innerHTML = `
        <div class="kpi-card">
          <div class="kpi-label">Total Trades</div>
          <div class="kpi-value kpi-neutral">${trades.length}</div>
          <div class="kpi-sub">${wins.length} winning, ${losses.length} losing</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Average PnL per Trade</div>
          <div class="kpi-value ${avgPnl >= 0 ? 'kpi-positive' : 'kpi-negative'}">${avgPnl >= 0 ? '+' : ''}$${avgPnl.toFixed(2)}</div>
          <div class="kpi-sub">Across all models &amp; timeframes</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Best Single Trade</div>
          <div class="kpi-value kpi-positive">+$${bestTrade['Trade_PnL_$'].toLocaleString()}</div>
          <div class="kpi-sub">${bestTrade.Timeframe} ${bestTrade.Model.replace('_', ' ')} (+${bestTrade['Trade_Return_%']}%)</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Worst Single Trade</div>
          <div class="kpi-value kpi-negative">-$${Math.abs(worstTrade['Trade_PnL_$']).toLocaleString()}</div>
          <div class="kpi-sub">${worstTrade.Timeframe} ${worstTrade.Model.replace('_', ' ')} (${worstTrade['Trade_Return_%']}%)</div>
        </div>
      `;
    }

    // Populate filter dropdowns
    const tfFilter = document.getElementById('tradeFilterTF');
    const modelFilter = document.getElementById('tradeFilterModel');
    const uniqueTFs = [...new Set(D.trade_logs.map(t => t.Timeframe))];
    const uniqueModels = [...new Set(D.trade_logs.map(t => t.Model))];

    uniqueTFs.forEach(tf => {
      const opt = document.createElement('option');
      opt.value = tf;
      opt.textContent = tf;
      tfFilter.appendChild(opt);
    });

    uniqueModels.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m.replace('_', ' ');
      modelFilter.appendChild(opt);
    });

    // Trade table state
    let tradeState = {
      data: [...D.trade_logs],
      sortKey: null,
      sortAsc: true,
      page: 1,
      perPage: 20,
    };

    function getFilteredTrades() {
      let data = [...D.trade_logs];
      const tf = tfFilter.value;
      const model = modelFilter.value;
      if (tf !== 'all') data = data.filter(t => t.Timeframe === tf);
      if (model !== 'all') data = data.filter(t => t.Model === model);

      if (tradeState.sortKey) {
        data.sort((a, b) => {
          let va = a[tradeState.sortKey];
          let vb = b[tradeState.sortKey];
          if (typeof va === 'string') return tradeState.sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
          return tradeState.sortAsc ? va - vb : vb - va;
        });
      }
      return data;
    }

    function renderTradeTable() {
      const data = getFilteredTrades();
      const totalPages = Math.ceil(data.length / tradeState.perPage);
      if (tradeState.page > totalPages) tradeState.page = Math.max(1, totalPages);

      const start = (tradeState.page - 1) * tradeState.perPage;
      const pageData = data.slice(start, start + tradeState.perPage);

      const tbody = document.getElementById('tradeTableBody');
      tbody.innerHTML = '';

      pageData.forEach(t => {
        const pnlClass = t['Trade_PnL_$'] > 0 ? 'cell-positive' : t['Trade_PnL_$'] < 0 ? 'cell-negative' : '';
        tbody.innerHTML += `<tr>
          <td class="mono-cell">${t.Trade_ID}</td>
          <td class="mono-cell">${t.Timeframe}</td>
          <td>${t.Model.replace('_', ' ')}</td>
          <td class="mono-cell">${t.Entry_Time}</td>
          <td class="mono-cell">${t.Exit_Time}</td>
          <td class="mono-cell">$${t.Entry_Price.toLocaleString()}</td>
          <td class="mono-cell">$${t.Exit_Price.toLocaleString()}</td>
          <td class="mono-cell ${pnlClass}">${t['Trade_PnL_$'] >= 0 ? '+' : ''}$${t['Trade_PnL_$'].toFixed(2)}</td>
          <td class="mono-cell ${pnlClass}">${t['Trade_Return_%'] >= 0 ? '+' : ''}${t['Trade_Return_%']}%</td>
          <td class="mono-cell">$${t.Capital_After_Trade.toLocaleString()}</td>
        </tr>`;
      });

      // Info
      document.getElementById('tradeTableInfo').textContent =
        `Showing ${start + 1}–${Math.min(start + tradeState.perPage, data.length)} of ${data.length} trades`;

      // Pagination
      const pag = document.getElementById('tradePagination');
      pag.innerHTML = `
        <button onclick="tradePageNav(-1)" ${tradeState.page <= 1 ? 'disabled' : ''}>← Prev</button>
        <span class="page-info">${tradeState.page} / ${totalPages}</span>
        <button onclick="tradePageNav(1)" ${tradeState.page >= totalPages ? 'disabled' : ''}>Next →</button>
      `;
    }

    // Global nav function
    window.tradePageNav = function (dir) {
      tradeState.page += dir;
      renderTradeTable();
    };

    // Sort on header click
    document.querySelectorAll('#tradeTable thead th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        if (tradeState.sortKey === key) {
          tradeState.sortAsc = !tradeState.sortAsc;
        } else {
          tradeState.sortKey = key;
          tradeState.sortAsc = true;
        }
        tradeState.page = 1;
        renderTradeTable();
      });
    });

    // Filter change
    tfFilter.addEventListener('change', () => { tradeState.page = 1; renderTradeTable(); });
    modelFilter.addEventListener('change', () => { tradeState.page = 1; renderTradeTable(); });

    renderTradeTable();
  }

  /* ════════════════════════════════════════════
     13. FORECAST SIGNAL BOARD
     ════════════════════════════════════════════ */
  const forecastGrid = document.getElementById('forecastGrid');
  if (forecastGrid && D.forecasts) {
    D.forecasts.forEach(fc => {
      const isBullish = fc.Signal.includes('BULLISH');
      const signalClass = isBullish ? 'bullish' : 'bearish';
      const badgeClass = isBullish ? 'bullish-badge' : 'bearish-badge';
      const dotClass = isBullish ? 'green' : 'red';
      const signalText = isBullish ? 'BULLISH' : 'BEARISH';
      const retClass = fc['Expected_Return_%'] >= 0 ? 'cell-positive' : 'cell-negative';

      forecastGrid.innerHTML += `
        <div class="forecast-card ${signalClass}">
          <div class="fc-tf">
            ${fc.Timeframe}
            <span class="fc-signal ${badgeClass}"><span class="live-dot ${dotClass}"></span>${signalText}</span>
          </div>
          <div class="fc-row">
            <span class="fc-label">Current Price</span>
            <span class="fc-value">$${fc['Current_Price_$'].toLocaleString()}</span>
          </div>
          <div class="fc-row">
            <span class="fc-label">Predicted Price</span>
            <span class="fc-value">$${fc['Predicted_Price_$'].toLocaleString()}</span>
          </div>
          <div class="fc-row">
            <span class="fc-label">Expected Change</span>
            <span class="fc-value ${retClass}">${fc['Expected_Change_$'] >= 0 ? '+' : ''}$${fc['Expected_Change_$'].toFixed(2)}</span>
          </div>
          <div class="fc-row">
            <span class="fc-label">Expected Return</span>
            <span class="fc-value ${retClass}">${fc['Expected_Return_%'] >= 0 ? '+' : ''}${fc['Expected_Return_%']}%</span>
          </div>
        </div>
      `;
    });
  }

  /* ════════════════════════════════════════════
     14. MULTI-STEP PROJECTION CHART
     ════════════════════════════════════════════ */
  const msCtx = document.getElementById('multiStepChart');
  const msSelector = document.getElementById('projectionTFSelector');
  let multiStepChart = null;

  if (msCtx && msSelector && D.multi_step_projections) {
    const allTFs = Object.keys(D.multi_step_projections);

    // Create TF buttons
    allTFs.forEach((tf, i) => {
      const btn = document.createElement('button');
      btn.className = 'tf-btn' + (i === 0 ? ' active' : '');
      btn.textContent = tf;
      btn.addEventListener('click', () => {
        msSelector.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderMultiStepChart(tf);
      });
      msSelector.appendChild(btn);
    });

    function renderMultiStepChart(tf) {
      const data = D.multi_step_projections[tf];
      if (!data) return;

      // Get current price from forecasts
      const fcRow = D.forecasts.find(f => f.Timeframe === tf);
      const currentPrice = fcRow ? fcRow['Current_Price_$'] : data[0].Simulated_Price;

      const labels = ['Current', ...data.map(d => d.Step_Ahead)];
      const prices = [currentPrice, ...data.map(d => d.Simulated_Price)];

      const minP = Math.min(...prices);
      const maxP = Math.max(...prices);
      const pad = Math.max((maxP - minP) * 0.18, 25);
      const yMin = Math.floor((minP - pad) / 10) * 10;
      const yMax = Math.ceil((maxP + pad) / 10) * 10;

      if (multiStepChart) multiStepChart.destroy();

      multiStepChart = new Chart(msCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: `${tf} Projected Price Path`,
            data: prices,
            borderColor: '#00d4ff',
            backgroundColor: 'rgba(0,212,255,0.1)',
            borderWidth: 2.8,
            fill: true,
            pointRadius: 6,
            pointHoverRadius: 9,
            pointBackgroundColor: prices.map((p, i) => {
              if (i === 0) return '#ffffff';
              return p >= currentPrice ? '#10b981' : '#f43f5e';
            }),
            pointBorderColor: '#0a0e17',
            pointBorderWidth: 2,
            tension: 0.25
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { font: { size: 12, weight: '600' }, color: '#e2e8f0' }
            },
            tooltip: {
              callbacks: {
                label: ctx => {
                  const idx = ctx.dataIndex;
                  if (idx === 0) return ` Current Close: $${ctx.parsed.y.toLocaleString()}`;
                  const step = data[idx - 1];
                  return [
                    ` Step ${step.Step_Ahead}: $${ctx.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    ` Expected Change: ${step.Delta_from_Current_$ >= 0 ? '+' : ''}$${step.Delta_from_Current_$.toFixed(2)}`,
                    ` Projected Return: ${step['Return_%'] >= 0 ? '+' : ''}${step['Return_%'].toFixed(2)}%`
                  ];
                }
              }
            }
          },
          scales: {
            y: {
              min: yMin,
              max: yMax,
              ticks: {
                callback: v => '$' + v.toLocaleString(),
                color: '#f8fafc',
                font: { family: "'JetBrains Mono', monospace", size: 11 }
              },
              grid: { color: 'rgba(255,255,255,0.04)' }
            },
            x: {
              ticks: { font: { family: "'JetBrains Mono', monospace", size: 11 }, color: '#94a3b8' },
              grid: { color: 'rgba(255,255,255,0.03)' }
            }
          }
        }
      });
    }

    renderMultiStepChart(allTFs[0]);
  }

  /* ════════════════════════════════════════════
     15. ACCORDION TOGGLE
     ════════════════════════════════════════════ */
  window.toggleAccordion = function (btn) {
    const item = btn.parentElement;
    item.classList.toggle('open');
  };

})();
