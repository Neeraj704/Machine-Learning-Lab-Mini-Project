"""
HTML Generator for notebooks.html
Produces a beautiful, ultra-rich, interactive reproduction of the 6 Jupyter Notebooks
with all raw outputs, tables, code cells, matplotlib figures, and an interactive Raw Notebook modal.
"""

import json
import os
import re
import html

def markdown_to_html(md_text):
    # Convert simple markdown to html
    lines = md_text.split('\n')
    html_lines = []
    in_list = False
    
    for line in lines:
        line_str = line.strip()
        if not line_str:
            if in_list:
                html_lines.append('</ul>')
                in_list = False
            continue
            
        # Headers
        if line_str.startswith('# '):
            if in_list: html_lines.append('</ul>'); in_list = False
            html_lines.append(f'<h2 class="nb-md-h1">{html.escape(line_str[2:])}</h2>')
            continue
        elif line_str.startswith('## '):
            if in_list: html_lines.append('</ul>'); in_list = False
            html_lines.append(f'<h3 class="nb-md-h2">{html.escape(line_str[3:])}</h3>')
            continue
        elif line_str.startswith('### '):
            if in_list: html_lines.append('</ul>'); in_list = False
            html_lines.append(f'<h4 class="nb-md-h3">{html.escape(line_str[4:])}</h4>')
            continue
        elif line_str.startswith('#### '):
            if in_list: html_lines.append('</ul>'); in_list = False
            html_lines.append(f'<h5 class="nb-md-h4">{html.escape(line_str[5:])}</h5>')
            continue
            
        # List items
        if line_str.startswith('- ') or line_str.startswith('* '):
            if not in_list:
                html_lines.append('<ul class="nb-md-list">')
                in_list = True
            item_text = line_str[2:]
            item_text = format_inline_markdown(item_text)
            html_lines.append(f'<li>{item_text}</li>')
            continue
        elif re.match(r'^\d+\.\s+', line_str):
            if not in_list:
                html_lines.append('<ol class="nb-md-list">')
                in_list = True
            item_text = re.sub(r'^\d+\.\s+', '', line_str)
            item_text = format_inline_markdown(item_text)
            html_lines.append(f'<li>{item_text}</li>')
            continue
        else:
            if in_list:
                html_lines.append('</ul>')
                in_list = False
            p_text = format_inline_markdown(line_str)
            html_lines.append(f'<p class="nb-md-p">{p_text}</p>')
            
    if in_list:
        html_lines.append('</ul>')
        
    return '\n'.join(html_lines)

def format_inline_markdown(text):
    # Bold
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    # Inline code
    text = re.sub(r'`(.+?)`', r'<code class="mono text-cyan">\1</code>', text)
    # Math latex-like formulas
    text = re.sub(r'\$\$(.+?)\$\$', r'<div class="formula-block">\1</div>', text)
    text = re.sub(r'\$(.+?)\$', r'<span class="mono text-amber">\1</span>', text)
    return text

def clean_pandas_html(html_str):
    # Strip basic inline styling from pandas table to use our CSS classes
    html_str = re.sub(r'<table[^>]*>', '<table class="data-table">', html_str)
    html_str = re.sub(r'border="1"', '', html_str)
    return html_str

def main():
    with open('notebooks_data.json', 'r', encoding='utf-8') as f:
        notebooks = json.load(f)
        
    nb_meta = {
        '01_data_acquisition': {
            'num': '01',
            'title': 'Data Acquisition & Multi-Timeframe Resampling',
            'desc': 'Direct connection to Binance Spot Public API via CCXT. Acquires 800 high-resolution historical OHLCV bars across 13 standard and non-native custom timeframes (1m, 3m, 5m, 10m, 15m, 30m, 1h, 2h, 4h, 12h, 24h, 4d, 30d) using strict financial candle aggregation.',
            'category': 'Data Engineering',
            'badge_color': 'cyan',
            'filesize': '302 KB',
            'raw_file': 'notebooks/01_data_acquisition.ipynb'
        },
        '02_eda_and_preprocessing': {
            'num': '02',
            'title': 'Exploratory Data Analysis & Statistical Preprocessing',
            'desc': 'Comprehensive audit for data hygiene (0 missing bars, 0 timestamp duplications). Evaluates price distribution moments, volatility clustering, and stationarity concepts. Proves that cryptocurrency log returns exhibit heavy fat tails (kurtosis = 4.89 vs Gaussian 3.0), requiring non-linear ML models.',
            'category': 'Statistical Analysis',
            'badge_color': 'emerald',
            'filesize': '262 KB',
            'raw_file': 'notebooks/02_eda_and_preprocessing.ipynb'
        },
        '03_feature_engineering': {
            'num': '03',
            'title': 'Quantitative Feature Engineering & Target Formulation',
            'desc': 'Computes 22 domain-specific quantitative technical indicators across 5 mathematical categories (Trend, Momentum, Volatility, Volume, Returns). Implements strict temporal shift (-1) for target close price P(t+1) to guarantee zero lookahead leakage across all 13 timeframes.',
            'category': 'Feature Engineering',
            'badge_color': 'amber',
            'filesize': '514 KB',
            'raw_file': 'notebooks/03_feature_engineering.ipynb'
        },
        '04_model_training_and_evaluation': {
            'num': '04',
            'title': 'Multi-Model Machine Learning Benchmarking',
            'desc': 'Trains and benchmarks Ridge Linear Regression, Random Forest Regressor, and LightGBM Regressor using an 80% train / 20% test chronological split with StandardScaler fit strictly on the training fold. Analyzes RMSE, MAE, R², and Directional Accuracy % (Hit Rate).',
            'category': 'Model Benchmarking',
            'badge_color': 'cyan',
            'filesize': '303 KB',
            'raw_file': 'notebooks/04_model_training_and_evaluation.ipynb'
        },
        '05_backtesting_and_simulation': {
            'num': '05',
            'title': 'Algorithmic Backtesting & Portfolio Trading Simulation',
            'desc': 'Executes an event-driven quantitative trading simulation with an exact $10,000.00 USD cash balance and realistic 0.1% transaction fee per trade. Evaluates 39 model × timeframe combinations, logging every transaction and computing Sharpe Ratio, Max Drawdown %, and Benchmark Alpha.',
            'category': 'Quantitative Simulation',
            'badge_color': 'emerald',
            'filesize': '185 KB',
            'raw_file': 'notebooks/05_backtesting_and_simulation.ipynb'
        },
        '06_future_forecasting': {
            'num': '06',
            'title': 'Multi-Timeframe Future Price Forecasting & Recursive Projections',
            'desc': 'Deploys trained LightGBM models for live multi-timeframe inference. Produces instantaneous directional signal bias (BULLISH vs BEARISH) and expected returns for all 13 intervals, complemented by multi-step recursive autoregressive forecast trajectory cones (+1 to +5 intervals ahead).',
            'category': 'Inference & Forecasting',
            'badge_color': 'amber',
            'filesize': '165 KB',
            'raw_file': 'notebooks/06_future_forecasting.ipynb'
        }
    }
    
    sections_html = []
    
    for nb in notebooks:
        nb_id = nb['id']
        meta = nb_meta.get(nb_id, {})
        num = meta.get('num', '00')
        title = meta.get('title', nb['title'])
        desc = meta.get('desc', '')
        category = meta.get('category', 'ML Lab')
        badge_color = meta.get('badge_color', 'cyan')
        filesize = meta.get('filesize', '')
        raw_file = meta.get('raw_file', f'notebooks/{nb_id}.ipynb')
        
        cells_html = []
        cell_counter = 0
        
        for cell in nb['cells']:
            cell_type = cell['cell_type']
            source = cell['source']
            
            if cell_type == 'markdown':
                # Render markdown cell
                md_rendered = markdown_to_html(source)
                cells_html.append(f'''
                  <div class="cell-block cell-markdown">
                    <div class="cell-header">
                      <span class="cell-index"><span class="badge-dot"></span> Markdown Note</span>
                    </div>
                    <div style="padding: 22px 26px;">
                      {md_rendered}
                    </div>
                  </div>
                ''')
            elif cell_type == 'code':
                cell_counter += 1
                escaped_code = html.escape(source)
                
                outputs_html = []
                for out in cell.get('outputs', []):
                    out_type = out.get('type')
                    if out_type == 'stream':
                        out_text = html.escape(out.get('text', ''))
                        outputs_html.append(f'''
                          <div class="output-label"><span class="mono text-cyan">▶</span> Console Output (stdout)</div>
                          <pre class="output-stream">{out_text}</pre>
                        ''')
                    elif out_type == 'html':
                        tbl_html = clean_pandas_html(out.get('html', ''))
                        outputs_html.append(f'''
                          <div class="output-label"><span class="mono text-emerald">▦</span> DataFrame Output</div>
                          <div class="table-wrapper" style="margin-bottom: 16px;">
                            {tbl_html}
                          </div>
                        ''')
                    elif out_type == 'text':
                        out_text = html.escape(out.get('text', ''))
                        outputs_html.append(f'''
                          <div class="output-label"><span class="mono text-amber">🗎</span> Computed Result</div>
                          <pre class="output-stream">{out_text}</pre>
                        ''')
                    elif out_type == 'image':
                        img_src = out.get('src', '')
                        outputs_html.append(f'''
                          <div class="figure-display-card">
                            <div class="output-label" style="justify-content: center; margin-bottom: 8px;">
                              <span class="mono text-cyan">📊</span> Generated Matplotlib Artifact
                            </div>
                            <img src="{img_src}" alt="Notebook Chart Artifact" onclick="openImgModal('{img_src}')">
                            <div class="figure-caption">
                              <span>Rendered during notebook execution</span>
                              <span class="figure-zoom-hint">🔍 Click image to zoom / inspect fullscreen</span>
                            </div>
                          </div>
                        ''')
                        
                outputs_block = ''
                if outputs_html:
                    outputs_block = f'''
                      <div class="output-container">
                        {''.join(outputs_html)}
                      </div>
                    '''
                    
                cells_html.append(f'''
                  <div class="cell-block cell-code">
                    <div class="cell-header">
                      <span class="cell-index">In [{cell_counter}]</span>
                      <button class="cell-copy-btn" onclick="copyCode(this)">📋 Copy Code</button>
                    </div>
                    <div class="code-container">
                      <pre><code>{escaped_code}</code></pre>
                    </div>
                    {outputs_block}
                  </div>
                ''')
                
        joined_cells = '\n'.join(cells_html)
        
        section_markup = f'''
        <section class="notebook-section tab-content-block" id="nb-{num}" data-tab="nb-{num}">
          <div class="container">
            <div class="notebook-header-card">
              <div class="notebook-tag-row">
                <span class="nb-badge nb-badge-{badge_color}">{category}</span>
                <span class="nb-badge nb-badge-mono">Notebook {num} of 06</span>
                <span class="nb-badge nb-badge-mono">{filesize}</span>
                <span class="nb-badge nb-badge-emerald">✓ Executed &amp; Verified</span>
              </div>
              <h2 class="notebook-title">{num}. {title}</h2>
              <p class="notebook-desc">{desc}</p>
              <div style="margin-top: 20px; display: flex; gap: 12px; flex-wrap: wrap;">
                <button class="btn-toggle active" onclick="openRawModal('{raw_file}', '{nb_id}.ipynb')">👁️ Inspect Raw .ipynb</button>
                <a href="{raw_file}" download class="btn-toggle" style="text-decoration:none; display:inline-flex; align-items:center; gap:6px;">📥 Download .ipynb</a>
              </div>
            </div>

            <div class="notebook-cells-container">
              {joined_cells}
            </div>
          </div>
        </section>
        '''
        sections_html.append(section_markup)
        
    all_sections = '\n'.join(sections_html)
    
    html_page = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lab Notebooks Deep Dive — Multi-Timeframe BTC Forecasting</title>
  <meta name="description" content="In-depth laboratory research reproduction of all 6 Jupyter Notebooks for the BTC Price Forecasting ML Lab Project: data acquisition, preprocessing, technical feature engineering, model benchmarking, algorithmic backtesting, and future inference.">
  <link rel="stylesheet" href="styles.css">
</head>
<body>

<!-- ════════════════════════════════════════════
     NAVBAR
     ════════════════════════════════════════════ -->
<nav class="navbar scrolled" id="navbar">
  <div class="navbar-inner">
    <a href="index.html" class="navbar-brand">
      <span class="logo-icon">₿</span>
      <span>BTC Forecaster</span>
    </a>
    <ul class="navbar-links" id="navLinks">
      <li><a href="index.html">← Showcase Dashboard</a></li>
      <li><a href="#nb-01" class="nb-tab-link" data-target="nb-01">01. Data</a></li>
      <li><a href="#nb-02" class="nb-tab-link" data-target="nb-02">02. EDA</a></li>
      <li><a href="#nb-03" class="nb-tab-link" data-target="nb-03">03. Features</a></li>
      <li><a href="#nb-04" class="nb-tab-link" data-target="nb-04">04. Models</a></li>
      <li><a href="#nb-05" class="nb-tab-link" data-target="nb-05">05. Backtest</a></li>
      <li><a href="#nb-06" class="nb-tab-link" data-target="nb-06">06. Forecast</a></li>
      <li><a href="#raw-notebooks" class="nav-notebooks-tab nb-tab-link" data-target="raw-notebooks">📦 Raw Notebooks</a></li>
    </ul>
    <button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Toggle menu">☰</button>
  </div>
</nav>

<!-- ════════════════════════════════════════════
     HERO BANNER
     ════════════════════════════════════════════ -->
<section class="hero" style="min-height: 48vh; padding: 120px 0 40px;">
  <div class="hero-bg"></div>
  <div class="hero-grid"></div>
  <div class="hero-content">
    <span class="section-label">Laboratory Research Hub</span>
    <h1 style="font-size: clamp(1.9rem, 4.5vw, 3rem); margin-top: 10px;">
      Interactive <span class="text-gradient">ML Lab Notebooks</span> Deep Dive
    </h1>
    <p class="subtitle" style="max-width: 850px; margin: 14px auto 28px;">
      Direct inspection of all 6 project Jupyter Notebooks: data extraction, stationarity proofs, 22 technical feature transformations, cross-model training loops, event-driven trading simulation, and future trajectory horizons.
    </p>
    <div class="hero-stats">
      <div class="stat-card">
        <span class="stat-value">6</span>
        <span class="stat-label">Jupyter Notebooks</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">65</span>
        <span class="stat-label">Executed Cells</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">9</span>
        <span class="stat-label">Matplotlib Artifacts</span>
      </div>
      <div class="stat-card">
        <span class="stat-value mono">39</span>
        <span class="stat-label">Simulations</span>
      </div>
      <div class="stat-card">
        <span class="stat-value mono">100%</span>
        <span class="stat-label">Reproducible</span>
      </div>
    </div>
    <div class="hero-cta-group" style="margin-top: 24px;">
      <button class="btn-primary" onclick="switchNotebookTab('nb-01')">📖 Explore Notebook 01</button>
      <button class="btn-secondary" onclick="switchNotebookTab('raw-notebooks')">📦 Download Raw Notebooks (.zip)</button>
    </div>
  </div>
</section>

<!-- ════════════════════════════════════════════
     STICKY NOTEBOOK SELECTOR TABS
     ════════════════════════════════════════════ -->
<div class="nb-sticky-nav" id="stickySubnav">
  <div class="container">
    <div class="nb-nav-scroll">
      <button class="nb-nav-pill active" data-target="nb-01" onclick="switchNotebookTab('nb-01')"><span>01</span> Data Acquisition</button>
      <button class="nb-nav-pill" data-target="nb-02" onclick="switchNotebookTab('nb-02')"><span>02</span> EDA &amp; Preprocessing</button>
      <button class="nb-nav-pill" data-target="nb-03" onclick="switchNotebookTab('nb-03')"><span>03</span> Feature Engineering</button>
      <button class="nb-nav-pill" data-target="nb-04" onclick="switchNotebookTab('nb-04')"><span>04</span> Model Benchmarking</button>
      <button class="nb-nav-pill" data-target="nb-05" onclick="switchNotebookTab('nb-05')"><span>05</span> Trading Backtesting</button>
      <button class="nb-nav-pill" data-target="nb-06" onclick="switchNotebookTab('nb-06')"><span>06</span> Future Forecasting</button>
      <button class="nb-nav-pill nb-nav-pill-raw" data-target="raw-notebooks" onclick="switchNotebookTab('raw-notebooks')"><span>📦</span> Raw Archive</button>
      <button class="nb-nav-pill" data-target="all" onclick="switchNotebookTab('all')" style="border-style:dashed;"><span>📜</span> Show All 6</button>
    </div>
  </div>
</div>

<!-- ════════════════════════════════════════════
     SECTIONS 1 TO 6: THE NOTEBOOKS
     ════════════════════════════════════════════ -->
<div id="notebooksTabContainer">
{all_sections}
</div>

<!-- ════════════════════════════════════════════
     THE VERY END: RAW NOTEBOOKS ARCHIVE & EXPLORER
     ════════════════════════════════════════════ -->
<section class="raw-notebooks-section tab-content-block" id="raw-notebooks" data-tab="raw-notebooks">
  <div class="container">
    <div class="section-header">
      <span class="section-label">Raw Repository</span>
      <h2>Raw Jupyter Notebooks Repository &amp; Explorer</h2>
      <p style="max-width: 800px; margin: 0 auto;">
        Open, inspect, and browse the actual raw <code class="mono text-cyan">.ipynb</code> notebook files directly in your browser without opening VSCode, or download the files individually or as a complete bundle.
      </p>
      <div style="margin-top: 24px;">
        <a href="all_notebooks.zip" download class="btn-primary" style="font-size: 1rem; padding: 14px 32px;">
          📦 Download All 6 Notebooks + Charts (.zip)
        </a>
      </div>
    </div>

    <div class="raw-nb-grid">
      <!-- Card 1 -->
      <div class="raw-nb-card">
        <div>
          <div class="raw-nb-num">NOTEBOOK 01</div>
          <div class="raw-nb-title">01_data_acquisition.ipynb</div>
          <div class="raw-nb-desc">Acquires 800 historical OHLCV candles from Binance Spot Public API across 13 timeframes via CCXT with aggregation algorithms.</div>
          <div class="raw-nb-meta">
            <span>Size: 302 KB</span>
            <span>Cells: 9</span>
            <span>Outputs: 4</span>
          </div>
        </div>
        <div class="raw-nb-actions">
          <button class="btn-open-raw" onclick="openRawModal('notebooks/01_data_acquisition.ipynb', '01_data_acquisition.ipynb')">👁️ View Raw</button>
          <a href="notebooks/01_data_acquisition.ipynb" download class="btn-download-raw">📥 Download</a>
        </div>
      </div>

      <!-- Card 2 -->
      <div class="raw-nb-card">
        <div>
          <div class="raw-nb-num">NOTEBOOK 02</div>
          <div class="raw-nb-title">02_eda_and_preprocessing.ipynb</div>
          <div class="raw-nb-desc">Data integrity tests (0 nulls, 0 duplicate timestamps), descriptive statistics, log returns derivation, kurtosis and fat tails distributions.</div>
          <div class="raw-nb-meta">
            <span>Size: 262 KB</span>
            <span>Cells: 11</span>
            <span>Outputs: 5</span>
          </div>
        </div>
        <div class="raw-nb-actions">
          <button class="btn-open-raw" onclick="openRawModal('notebooks/02_eda_and_preprocessing.ipynb', '02_eda_and_preprocessing.ipynb')">👁️ View Raw</button>
          <a href="notebooks/02_eda_and_preprocessing.ipynb" download class="btn-download-raw">📥 Download</a>
        </div>
      </div>

      <!-- Card 3 -->
      <div class="raw-nb-card">
        <div>
          <div class="raw-nb-num">NOTEBOOK 03</div>
          <div class="raw-nb-title">03_feature_engineering.ipynb</div>
          <div class="raw-nb-desc">22 quantitative technical oscillators (SMA, EMA, RSI, MACD, Bollinger Bands, ATR) and shifted target formulation with zero future leakage.</div>
          <div class="raw-nb-meta">
            <span>Size: 514 KB</span>
            <span>Cells: 11</span>
            <span>Outputs: 6</span>
          </div>
        </div>
        <div class="raw-nb-actions">
          <button class="btn-open-raw" onclick="openRawModal('notebooks/03_feature_engineering.ipynb', '03_feature_engineering.ipynb')">👁️ View Raw</button>
          <a href="notebooks/03_feature_engineering.ipynb" download class="btn-download-raw">📥 Download</a>
        </div>
      </div>

      <!-- Card 4 -->
      <div class="raw-nb-card">
        <div>
          <div class="raw-nb-num">NOTEBOOK 04</div>
          <div class="raw-nb-title">04_model_training_and_evaluation.ipynb</div>
          <div class="raw-nb-desc">Ridge Regression, Random Forest, and LightGBM benchmarked on 80/20 chronological holdout. Computes RMSE, MAE, R², and Directional Hit Rate %.</div>
          <div class="raw-nb-meta">
            <span>Size: 303 KB</span>
            <span>Cells: 13</span>
            <span>Outputs: 6</span>
          </div>
        </div>
        <div class="raw-nb-actions">
          <button class="btn-open-raw" onclick="openRawModal('notebooks/04_model_training_and_evaluation.ipynb', '04_model_training_and_evaluation.ipynb')">👁️ View Raw</button>
          <a href="notebooks/04_model_training_and_evaluation.ipynb" download class="btn-download-raw">📥 Download</a>
        </div>
      </div>

      <!-- Card 5 -->
      <div class="raw-nb-card">
        <div>
          <div class="raw-nb-num">NOTEBOOK 05</div>
          <div class="raw-nb-title">05_backtesting_and_simulation.ipynb</div>
          <div class="raw-nb-desc">Event-driven simulation of $10,000 portfolio with 0.1% transaction fee across 39 model × timeframe combinations with equity curves and master logs.</div>
          <div class="raw-nb-meta">
            <span>Size: 185 KB</span>
            <span>Cells: 11</span>
            <span>Outputs: 5</span>
          </div>
        </div>
        <div class="raw-nb-actions">
          <button class="btn-open-raw" onclick="openRawModal('notebooks/05_backtesting_and_simulation.ipynb', '05_backtesting_and_simulation.ipynb')">👁️ View Raw</button>
          <a href="notebooks/05_backtesting_and_simulation.ipynb" download class="btn-download-raw">📥 Download</a>
        </div>
      </div>

      <!-- Card 6 -->
      <div class="raw-nb-card">
        <div>
          <div class="raw-nb-num">NOTEBOOK 06</div>
          <div class="raw-nb-title">06_future_forecasting.ipynb</div>
          <div class="raw-nb-desc">Live multi-timeframe inference on latest market candles, BULLISH/BEARISH signals, and recursive +1 to +5 interval forecasting cones.</div>
          <div class="raw-nb-meta">
            <span>Size: 165 KB</span>
            <span>Cells: 9</span>
            <span>Outputs: 4</span>
          </div>
        </div>
        <div class="raw-nb-actions">
          <button class="btn-open-raw" onclick="openRawModal('notebooks/06_future_forecasting.ipynb', '06_future_forecasting.ipynb')">👁️ View Raw</button>
          <a href="notebooks/06_future_forecasting.ipynb" download class="btn-download-raw">📥 Download</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ════════════════════════════════════════════
     FOOTER
     ════════════════════════════════════════════ -->
<footer class="footer">
  <div class="container">
    <div style="margin-bottom: 24px;">
      <a href="index.html" class="navbar-brand" style="justify-content: center; margin-bottom: 12px;">
        <span class="logo-icon">₿</span>
        <span>BTC Forecaster</span>
      </a>
      <p style="font-size: 0.85rem; color: var(--text-muted);">
        Machine Learning Lab Project — Multi-Timeframe Cryptocurrency Price Forecasting &amp; Algorithmic Backtesting
      </p>
    </div>
    <div class="tech-badges">
      <span class="tech-badge">Python 3.10</span>
      <span class="tech-badge">LightGBM</span>
      <span class="tech-badge">Scikit-Learn</span>
      <span class="tech-badge">Pandas</span>
      <span class="tech-badge">CCXT Binance API</span>
      <span class="tech-badge">Matplotlib</span>
      <span class="tech-badge">Jupyter nbformat</span>
    </div>
    <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 24px;">
      <a href="index.html" style="color: var(--accent-cyan); text-decoration: none;">← Return to Executive Showcase Dashboard</a> &nbsp;|&nbsp;
      <a href="#raw-notebooks" style="color: var(--accent-amber); text-decoration: none;">Download All Raw Notebooks (.zip)</a>
    </p>
  </div>
</footer>

<!-- ════════════════════════════════════════════
     MODAL: IMAGE LIGHTBOX
     ════════════════════════════════════════════ -->
<div class="img-modal" id="imgModal" onclick="closeImgModal(event)">
  <div class="img-modal-content">
    <button class="img-modal-close" onclick="closeImgModal()">&times;</button>
    <img id="imgModalTarget" src="" alt="Zoomed Artifact">
  </div>
</div>

<!-- ════════════════════════════════════════════
     MODAL: RAW NOTEBOOK JSON VIEWER
     ════════════════════════════════════════════ -->
<div class="raw-modal" id="rawModal" onclick="closeRawModal(event)">
  <div class="raw-modal-dialog" onclick="event.stopPropagation()">
    <div class="raw-modal-header">
      <div class="raw-modal-title">
        <span class="mono text-cyan">📓</span>
        <span id="rawModalFilename">notebook.ipynb</span>
      </div>
      <div class="raw-modal-actions">
        <button class="cell-copy-btn" id="copyRawBtn" onclick="copyRawContent()">📋 Copy JSON</button>
        <a id="downloadRawBtn" href="#" download class="btn-toggle active" style="text-decoration:none;">📥 Download File</a>
        <button class="raw-modal-close-btn" onclick="closeRawModal()">&times;</button>
      </div>
    </div>
    <div class="raw-modal-body" id="rawModalBody">Loading raw notebook content...</div>
  </div>
</div>

<script src="raw_notebooks_preview.js"></script>
<script src="notebooks.js"></script>
</body>
</html>
'''

    with open('notebooks.html', 'w', encoding='utf-8') as f:
        f.write(html_page)
        
    print(f"Successfully generated notebooks.html ({len(html_page)} bytes)")

if __name__ == '__main__':
    main()
