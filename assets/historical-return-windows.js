(function () {
  'use strict';

  const DATA_URL = 'data/historical-returns-1928-2025.json';
  const pageUrl = 'https://wealthmeter.xyz/historical-return-windows.html';
  const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  const moneyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  let data;
  let mapView = 'real';
  let currentResult;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const money = (value) => moneyFormat.format(Math.round(value));
  const percent = (value, digits = 1) => `${(value * 100).toFixed(digits)}%`;
  const signedPercent = (value) => `${value >= 0 ? '+' : ''}${percent(value)}`;

  function quantile(sortedValues, position) {
    const index = (sortedValues.length - 1) * position;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * (index - lower);
  }

  function annualized(series, startIndex, years, inflationAdjusted) {
    let growth = 1;
    for (let offset = 0; offset < years; offset += 1) {
      const index = startIndex + offset;
      growth *= inflationAdjusted
        ? (1 + series[index]) / (1 + data.inflation[index])
        : 1 + series[index];
    }
    return Math.pow(growth, 1 / years) - 1;
  }

  function windowsFor(series, years, inflationAdjusted) {
    const count = data.years.length - years + 1;
    return Array.from({ length: count }, (_, index) => ({
      start: data.years[index],
      end: data.years[index + years - 1],
      annualized: annualized(series, index, years, inflationAdjusted)
    }));
  }

  function sendEvent(name, parameters) {
    if (typeof window.gtag === 'function') window.gtag('event', name, parameters || {});
  }

  function setupTheme() {
    const root = document.documentElement;
    const button = $('[data-theme-toggle]');
    const icon = $('[data-theme-icon]');
    const label = $('[data-theme-label]');
    function renderTheme() {
      const dark = root.dataset.theme === 'dark';
      document.body.classList.toggle('dark-mode', dark);
      icon.textContent = dark ? '☀' : '☾';
      label.textContent = dark ? 'Light mode' : 'Dark mode';
      button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      if (data) {
        renderWindowMap();
        renderRangeChart();
        if (currentResult) renderPathChart(currentResult);
      }
    }
    button.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('wealthmeter-theme', root.dataset.theme); } catch (_) {}
      renderTheme();
      sendEvent('historical_returns_theme', { theme: root.dataset.theme });
    });
    renderTheme();
  }

  function renderHorizonCards() {
    const container = $('[data-horizon-cards]');
    const horizons = [1, 5, 10, 20, 30];
    container.innerHTML = horizons.map((years) => {
      const nominal = windowsFor(data.stocks, years, false);
      const real = windowsFor(data.stocks, years, true);
      const nominalLosses = nominal.filter((item) => item.annualized < 0).length;
      const realLosses = real.filter((item) => item.annualized < 0).length;
      const sortedReal = real.slice().sort((a, b) => a.annualized - b.annualized);
      return `<article class="horizon-card${years === 20 ? ' highlight' : ''}">
        <div class="horizon-years"><strong>${years}</strong><small>${years === 1 ? 'year' : 'years'} · ${real.length} windows</small></div>
        <div class="metric"><small>Nominal losses</small><strong>${percent(nominalLosses / nominal.length)}</strong></div>
        <div class="metric real"><small>Real losses</small><strong>${percent(realLosses / real.length)}</strong></div>
        <div class="range-copy">Real annualized range: <b>${signedPercent(sortedReal[0].annualized)}</b> from ${sortedReal[0].start} to <b>${signedPercent(sortedReal.at(-1).annualized)}</b> from ${sortedReal.at(-1).start}.</div>
      </article>`;
    }).join('');
  }

  function canvasPalette() {
    const style = getComputedStyle(document.documentElement);
    return {
      surface: style.getPropertyValue('--surface-2').trim(),
      ink: style.getPropertyValue('--ink').trim(),
      muted: style.getPropertyValue('--muted').trim(),
      line: style.getPropertyValue('--line').trim(),
      loss: style.getPropertyValue('--loss').trim(),
      cyan: style.getPropertyValue('--cyan').trim(),
      accent: style.getPropertyValue('--accent').trim()
    };
  }

  function hexToRgb(color) {
    const match = color.match(/^#([0-9a-f]{6})$/i);
    if (!match) return [128, 128, 128];
    const value = parseInt(match[1], 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }

  function blend(color, alpha, background) {
    const foregroundRgb = hexToRgb(color);
    const backgroundRgb = hexToRgb(background);
    const mixed = foregroundRgb.map((channel, index) => Math.round(channel * alpha + backgroundRgb[index] * (1 - alpha)));
    return `rgb(${mixed.join(',')})`;
  }

  function renderWindowMap() {
    const canvas = $('[data-window-map]');
    if (!canvas || !data) return;
    const context = canvas.getContext('2d');
    const palette = canvasPalette();
    const width = canvas.width;
    const height = canvas.height;
    const left = 86;
    const right = 24;
    const top = 30;
    const bottom = 64;
    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;
    const cellWidth = chartWidth / data.years.length;
    const cellHeight = chartHeight / 30;
    const series = data.stocks;

    context.clearRect(0, 0, width, height);
    context.fillStyle = palette.surface;
    context.fillRect(0, 0, width, height);
    context.font = '600 16px Inter, sans-serif';
    context.textBaseline = 'middle';

    for (let years = 1; years <= 30; years += 1) {
      const values = windowsFor(series, years, mapView === 'real');
      values.forEach((windowValue, index) => {
        const magnitude = clamp(Math.abs(windowValue.annualized) / 0.12, .12, 1);
        const color = windowValue.annualized < 0 ? palette.loss : palette.cyan;
        context.fillStyle = blend(color, magnitude, palette.surface);
        context.fillRect(left + index * cellWidth, top + (years - 1) * cellHeight, Math.ceil(cellWidth + .2), Math.ceil(cellHeight + .2));
      });
    }

    context.strokeStyle = palette.line;
    context.lineWidth = 1;
    [1, 5, 10, 20, 30].forEach((years) => {
      const y = top + (years - .5) * cellHeight;
      context.fillStyle = palette.muted;
      context.textAlign = 'right';
      context.fillText(String(years), left - 12, y);
    });
    [1928, 1950, 1975, 2000, 2025].forEach((year) => {
      const x = left + (year - data.years[0] + .5) * cellWidth;
      context.fillStyle = palette.muted;
      context.textAlign = 'center';
      context.fillText(String(year), x, height - 30);
    });
    context.save();
    context.translate(24, top + chartHeight / 2);
    context.rotate(-Math.PI / 2);
    context.fillStyle = palette.muted;
    context.textAlign = 'center';
    context.fillText('Holding period (years)', 0, 0);
    context.restore();

    const period = Number($('[data-period]').value);
    const start = Number($('[data-start]').value);
    const maxStart = data.years.at(-1) - period + 1;
    if (start <= maxStart) {
      const x = left + (start - data.years[0]) * cellWidth;
      const y = top + (period - 1) * cellHeight;
      context.strokeStyle = palette.ink;
      context.lineWidth = 3;
      context.strokeRect(x, y, Math.ceil(cellWidth), Math.ceil(cellHeight));
    }
  }

  function updateMapReadout() {
    const periodInput = $('[data-period]');
    const startInput = $('[data-start]');
    const years = Number(periodInput.value);
    const maximumStart = data.years.at(-1) - years + 1;
    startInput.max = String(maximumStart);
    if (Number(startInput.value) > maximumStart) startInput.value = String(maximumStart);
    const start = Number(startInput.value);
    const index = start - data.years[0];
    const value = annualized(data.stocks, index, years, mapView === 'real');
    $('[data-period-output]').textContent = `${years} ${years === 1 ? 'year' : 'years'}`;
    $('[data-start-output]').textContent = String(start);
    $('[data-map-readout]').textContent = `${start}–${start + years - 1}: ${signedPercent(value)} annualized, ${mapView === 'real' ? 'after inflation' : 'before inflation'}.`;
    renderWindowMap();
  }

  function svgElement(tag, attributes, content) {
    const serialized = Object.entries(attributes || {}).map(([key, value]) => `${key}="${value}"`).join(' ');
    return `<${tag}${serialized ? ` ${serialized}` : ''}>${content || ''}</${tag}>`;
  }

  function renderRangeChart() {
    const container = $('[data-range-chart]');
    if (!container || !data) return;
    const width = 1000;
    const height = 500;
    const left = 82;
    const right = 28;
    const top = 30;
    const bottom = 64;
    const minY = -.4;
    const maxY = .6;
    const x = (years) => left + ((years - 1) / 29) * (width - left - right);
    const y = (value) => top + ((maxY - value) / (maxY - minY)) * (height - top - bottom);
    const rows = [];
    for (let years = 1; years <= 30; years += 1) {
      const sorted = windowsFor(data.stocks, years, true).map((item) => item.annualized).sort((a, b) => a - b);
      rows.push({ years, low: sorted[0], median: quantile(sorted, .5), high: sorted.at(-1) });
    }
    const upper = rows.map((row) => `${x(row.years).toFixed(1)},${y(row.high).toFixed(1)}`).join(' ');
    const lower = rows.slice().reverse().map((row) => `${x(row.years).toFixed(1)},${y(row.low).toFixed(1)}`).join(' ');
    const median = rows.map((row) => `${x(row.years).toFixed(1)},${y(row.median).toFixed(1)}`).join(' ');
    let grid = '';
    [-.4, -.2, 0, .2, .4, .6].forEach((tick) => {
      grid += `<line x1="${left}" x2="${width - right}" y1="${y(tick)}" y2="${y(tick)}" class="grid-line${tick === 0 ? ' zero' : ''}"/><text x="${left - 12}" y="${y(tick) + 5}" text-anchor="end">${Math.round(tick * 100)}%</text>`;
    });
    [1, 5, 10, 20, 30].forEach((tick) => { grid += `<text x="${x(tick)}" y="${height - 26}" text-anchor="middle">${tick}</text>`; });
    container.innerHTML = svgElement('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': 'Range of annualized real stock returns for every holding period from one to thirty years' }, `${grid}<polygon points="${upper} ${lower}" class="range-band"/><polyline points="${median}" class="median-line"/><text x="${width / 2}" y="${height - 5}" text-anchor="middle" class="axis-title">Holding period in years</text>`);
  }

  function renderComparison() {
    const horizons = [1, 10, 20, 30];
    $('[data-comparison-cards]').innerHTML = horizons.map((years) => {
      const stock = windowsFor(data.stocks, years, false);
      const bond = windowsFor(data.bonds, years, false);
      const bill = windowsFor(data.bills, years, false);
      const beatsBond = stock.filter((item, index) => item.annualized > bond[index].annualized).length / stock.length;
      const beatsBill = stock.filter((item, index) => item.annualized > bill[index].annualized).length / stock.length;
      return `<article class="comparison-card"><h3>${years}-year</h3>
        <div class="compare-row"><div><span>Stocks beat bonds</span><b>${percent(beatsBond)}</b></div><div class="mini-track"><i style="width:${beatsBond * 100}%"></i></div></div>
        <div class="compare-row"><div><span>Stocks beat bills</span><b>${percent(beatsBill)}</b></div><div class="mini-track"><i style="width:${beatsBill * 100}%"></i></div></div>
        <p class="chart-note">${stock.length} overlapping windows</p></article>`;
    }).join('');

    $('[data-worst-windows]').innerHTML = [10, 20, 30].map((years) => {
      const worst = windowsFor(data.stocks, years, true).sort((a, b) => a.annualized - b.annualized)[0];
      return `<article class="worst-card"><span>Most difficult ${years}-year real stock window</span><strong>${signedPercent(worst.annualized)} a year</strong><span>${worst.start}–${worst.end}</span></article>`;
    }).join('');
  }

  function readCalculator() {
    const form = $('[data-calculator]');
    const values = Object.fromEntries(new FormData(form).entries());
    return {
      age: Number(values.age),
      targetAge: Number(values.targetAge),
      balance: Number(values.balance),
      monthly: Number(values.monthly),
      stocks: Number(values.stocks),
      bonds: Number(values.bonds)
    };
  }

  function validateCalculator(input) {
    if (!Number.isInteger(input.age) || input.age < 16 || input.age > 80) return 'Enter a whole current age between 16 and 80.';
    if (!Number.isInteger(input.targetAge) || input.targetAge < 17 || input.targetAge > 95) return 'Enter a whole target age between 17 and 95.';
    const years = input.targetAge - input.age;
    if (years < 1 || years > 50) return 'The horizon must be between 1 and 50 years.';
    if (!Number.isFinite(input.balance) || input.balance < 0 || input.balance > 100000000) return 'Enter a starting balance between 0 and 100,000,000.';
    if (!Number.isFinite(input.monthly) || input.monthly < 0 || input.monthly > 1000000) return 'Enter a monthly contribution between 0 and 1,000,000.';
    if (input.balance + input.monthly <= 0) return 'Enter a starting balance or contribution above zero.';
    if ([input.stocks,input.bonds].some(value=>!Number.isFinite(value)||value<0||value>100)) return 'Each asset weight must be a finite percentage between 0 and 100.';
    if (input.stocks + input.bonds > 100) return 'Stocks and bonds cannot exceed 100% together.';
    return '';
  }

  function simulate(input) {
    const years = input.targetAge - input.age;
    const count = data.years.length - years + 1;
    const stockWeight = input.stocks / 100;
    const bondWeight = input.bonds / 100;
    const billWeight = 1 - stockWeight - bondWeight;
    const annualRealContribution = input.monthly * 12;
    const windows = [];

    for (let startIndex = 0; startIndex < count; startIndex += 1) {
      let nominalBalance = input.balance;
      let cumulativeInflation = 1;
      const nominalPath = [nominalBalance];
      const realPath = [nominalBalance];
      for (let offset = 0; offset < years; offset += 1) {
        const index = startIndex + offset;
        const portfolioReturn = stockWeight * data.stocks[index] + bondWeight * data.bonds[index] + billWeight * data.bills[index];
        const indexedContribution = annualRealContribution * cumulativeInflation;
        nominalBalance = nominalBalance * (1 + portfolioReturn) + indexedContribution * (1 + portfolioReturn / 2);
        cumulativeInflation *= 1 + data.inflation[index];
        nominalPath.push(nominalBalance);
        realPath.push(nominalBalance / cumulativeInflation);
      }
      windows.push({
        start: data.years[startIndex],
        end: data.years[startIndex + years - 1],
        nominalPath,
        realPath,
        nominalEnd: nominalBalance,
        realEnd: nominalBalance / cumulativeInflation
      });
    }
    return { input, years, windows, realContributed: input.balance + annualRealContribution * years };
  }

  function renderPathChart(result) {
    const container = $('[data-path-chart]');
    const width = 1000;
    const height = 480;
    const left = 86;
    const right = 28;
    const top = 26;
    const bottom = 62;
    const sorted = result.windows.slice().sort((a, b) => a.realEnd - b.realEnd);
    const worst = sorted[0];
    const median = sorted[Math.floor((sorted.length - 1) / 2)];
    const maximum = Math.max(...result.windows.flatMap((windowValue) => windowValue.realPath));
    const chartMaximum = Math.ceil(maximum / 100000) * 100000 || 100000;
    const x = (year) => left + (year / result.years) * (width - left - right);
    const y = (value) => top + (1 - value / chartMaximum) * (height - top - bottom);
    const points = (path) => path.map((value, index) => `${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(' ');
    let grid = '';
    for (let tick = 0; tick <= 4; tick += 1) {
      const value = chartMaximum * tick / 4;
      grid += `<line x1="${left}" x2="${width - right}" y1="${y(value)}" y2="${y(value)}" class="grid-line"/><text x="${left - 12}" y="${y(value) + 5}" text-anchor="end">${value >= 1000000 ? `$${(value / 1000000).toFixed(1)}M` : `$${Math.round(value / 1000)}K`}</text>`;
    }
    [0, Math.round(result.years / 2), result.years].forEach((tick) => { grid += `<text x="${x(tick)}" y="${height - 28}" text-anchor="middle">${tick}</text>`; });
    const others = result.windows.filter((item) => item !== worst && item !== median).map((item) => `<polyline points="${points(item.realPath)}" class="path-other"/>`).join('');
    container.innerHTML = svgElement('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': `Inflation-adjusted balance paths across ${result.windows.length} historical ${result.years}-year windows` }, `${grid}${others}<polyline points="${points(median.realPath)}" class="path-median"/><polyline points="${points(worst.realPath)}" class="path-worst"/><text x="${width / 2}" y="${height - 5}" text-anchor="middle" class="axis-title">Years from the start</text>`);
  }

  function updateQuery(result) {
    const url = new URL(window.location.href);
    url.searchParams.set('years', String(result.years));
    url.searchParams.set('stocks', String(result.input.stocks));
    url.searchParams.set('bonds', String(result.input.bonds));
    history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function renderCalculator() {
    const input = readCalculator();
    const stocks = clamp(input.stocks || 0, 0, 100);
    const bonds = clamp(input.bonds || 0, 0, 100 - stocks);
    const bills = 100 - stocks - bonds;
    input.stocks = stocks;
    input.bonds = bonds;
    const error = validateCalculator(input);
    const form = $('[data-calculator]');
    form.elements.stocks.value = String(stocks);
    form.elements.bonds.max = String(100 - stocks);
    form.elements.bonds.value = String(bonds);
    $('[data-stocks-output]').textContent = `${stocks}%`;
    $('[data-bonds-output]').textContent = `${bonds}%`;
    $('[data-stocks-label]').textContent = `${stocks}%`;
    $('[data-bonds-label]').textContent = `${bonds}%`;
    $('[data-bills-label]').textContent = `${bills}%`;
    const allocationSpans = $$('.allocation-summary span');
    allocationSpans[0].style.width = `${stocks}%`;
    allocationSpans[1].style.width = `${bonds}%`;
    allocationSpans[2].style.width = `${bills}%`;
    $('[data-error]').textContent = error;
    if (error) return;

    const result = simulate(input);
    const sorted = result.windows.map((windowValue) => windowValue.realEnd).sort((a, b) => a - b);
    const values = [
      ['Worst window', sorted[0], false],
      ['10th percentile', quantile(sorted, .1), false],
      ['Median', quantile(sorted, .5), true],
      ['90th percentile', quantile(sorted, .9), false],
      ['Best window', sorted.at(-1), false]
    ];
    $('[data-result-title]').textContent = `${result.windows.length} historical ${result.years}-year windows, ${data.years[0]}–${data.years.at(-1)}`;
    $('[data-result-cards]').innerHTML = values.map(([label, value, featured]) => `<article class="result-card${featured ? ' featured' : ''}"><span>${label}</span><strong>${money(value)}</strong><small>In start-window purchasing power</small></article>`).join('');
    currentResult = { ...result, sorted, p10: quantile(sorted, .1), median: quantile(sorted, .5), p90: quantile(sorted, .9) };
    renderPathChart(currentResult);
    updateQuery(currentResult);
  }

  function restoreQuery() {
    const params = new URLSearchParams(window.location.search);
    const years = Number(params.get('years'));
    const stocks = Number(params.get('stocks'));
    const bonds = Number(params.get('bonds'));
    const form = $('[data-calculator]');
    if (params.has('years') && Number.isInteger(years) && years >= 1 && years <= 50) form.elements.targetAge.value = String(Number(form.elements.age.value) + years);
    if (params.has('stocks') && Number.isFinite(stocks) && stocks >= 0 && stocks <= 100) form.elements.stocks.value = String(Math.round(stocks));
    if (params.has('bonds') && Number.isFinite(bonds) && bonds >= 0 && bonds <= 100) form.elements.bonds.value = String(Math.round(bonds));
  }

  function resultShareUrl() {
    const url = new URL(pageUrl);
    if (currentResult) {
      url.searchParams.set('years', String(currentResult.years));
      url.searchParams.set('stocks', String(currentResult.input.stocks));
      url.searchParams.set('bonds', String(currentResult.input.bonds));
    }
    return url.toString();
  }

  function shareText() {
    if (!currentResult) return 'Explore every historical U.S. stock-market window from 1928 through 2025.';
    return `Across ${currentResult.windows.length} historical ${currentResult.years}-year windows, this allocation produced a real 10th–90th percentile range of ${money(currentResult.p10)} to ${money(currentResult.p90)}.`;
  }

  function openShare(platform) {
    const url = resultShareUrl();
    const text = shareText();
    const targets = {
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent('When Time Beat Risk: Every Historical Market Window')}`,
      email: `mailto:?subject=${encodeURIComponent('Historical return windows')}&body=${encodeURIComponent(`${text}\n\n${url}`)}`
    };
    if (targets[platform]) window.open(targets[platform], '_blank', 'noopener,noreferrer');
    sendEvent('historical_returns_share', { method: platform, horizon_bucket: currentResult ? `${currentResult.years}_years` : 'unknown' });
  }

  async function copyResultLink() {
    const value = resultShareUrl();
    try {
      await navigator.clipboard.writeText(value);
    } catch (_) {
      const input = document.createElement('textarea');
      input.value = value;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    $('[data-share-status]').textContent = 'Result link copied.';
    sendEvent('historical_returns_share', { method: 'copy', horizon_bucket: `${currentResult.years}_years` });
  }

  function downloadShareCard() {
    if (!currentResult) return;
    const canvas = $('[data-share-canvas]');
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#071629');
    gradient.addColorStop(1, '#0d4053');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#f0a24a';
    context.fillRect(64, 66, 12, 76);
    context.fillStyle = '#f8fafc';
    context.font = '800 42px Inter, sans-serif';
    context.fillText('WEALTHMETER.XYZ', 100, 120);
    context.fillStyle = '#8fdcf0';
    context.font = '700 22px Inter, sans-serif';
    context.fillText('HISTORICAL RETURN WINDOWS · 1928–2025', 66, 208);
    context.fillStyle = '#f8fafc';
    context.font = '400 72px Georgia, serif';
    context.fillText(`${currentResult.years}-year historical replay`, 66, 294);
    context.font = '700 26px Inter, sans-serif';
    context.fillStyle = '#a9b7c9';
    context.fillText(`${currentResult.input.stocks}% stocks · ${currentResult.input.bonds}% bonds · ${100 - currentResult.input.stocks - currentResult.input.bonds}% bills`, 68, 350);
    context.fillStyle = '#f0a24a';
    context.font = '400 56px Georgia, serif';
    context.fillText(`${money(currentResult.p10)} – ${money(currentResult.p90)}`, 68, 445);
    context.fillStyle = '#f8fafc';
    context.font = '700 22px Inter, sans-serif';
    context.fillText('Real 10th–90th percentile ending balance', 70, 486);
    context.fillStyle = '#a9b7c9';
    context.font = '500 18px Inter, sans-serif';
    context.fillText('Historical U.S. evidence, not a forecast · Damodaran / NYU Stern', 68, 565);
    context.textAlign = 'right';
    context.fillStyle = '#f8fafc';
    context.font = '800 20px Inter, sans-serif';
    context.fillText('wealthmeter.xyz/historical-return-windows.html', 1134, 565);
    context.textAlign = 'left';
    const link = document.createElement('a');
    link.download = `wealthmeter-historical-${currentResult.years}-year-window.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    $('[data-share-status]').textContent = 'Result card downloaded.';
    sendEvent('historical_returns_share', { method: 'download', horizon_bucket: `${currentResult.years}_years` });
  }

  function setupControls() {
    $$('[data-map-view]').forEach((button) => button.addEventListener('click', () => {
      mapView = button.dataset.mapView;
      $$('[data-map-view]').forEach((candidate) => candidate.setAttribute('aria-pressed', candidate === button ? 'true' : 'false'));
      updateMapReadout();
      sendEvent('historical_returns_map_view', { return_basis: mapView });
    }));
    $('[data-period]').addEventListener('input', updateMapReadout);
    $('[data-start]').addEventListener('input', updateMapReadout);
    $('[data-calculator]').addEventListener('input', renderCalculator);
    $('[data-calculator]').addEventListener('change', renderCalculator);
    $$('[data-preset]').forEach((button) => button.addEventListener('click', () => {
      const [stocks, bonds] = button.dataset.preset.split(',');
      const form = $('[data-calculator]');
      form.elements.stocks.value = stocks;
      form.elements.bonds.value = bonds;
      renderCalculator();
    }));
    $$('[data-share]').forEach((button) => button.addEventListener('click', () => {
      if (button.dataset.share === 'copy') copyResultLink();
      else if (button.dataset.share === 'download') downloadShareCard();
      else openShare(button.dataset.share);
    }));
  }

  function renderFailure() {
    $('[data-horizon-cards]').innerHTML = '<p class="legal-note">The historical dataset could not be loaded. Reload the page or return later.</p>';
    $('[data-error]').textContent = 'Calculator data could not be loaded.';
  }

  async function init() {
    setupTheme();
    try {
      const response = await fetch(DATA_URL, { credentials: 'same-origin' });
      if (!response.ok) throw new Error(`Data request failed with ${response.status}`);
      data = await response.json();
      if (!Array.isArray(data.years) || data.years.length !== 98 || data.years.at(-1) !== 2025) throw new Error('Unexpected historical dataset');
      restoreQuery();
      renderHorizonCards();
      renderComparison();
      renderRangeChart();
      setupControls();
      updateMapReadout();
      renderCalculator();
      sendEvent('historical_returns_view', { latest_data_year: data.years.at(-1) });
    } catch (error) {
      console.error(error);
      renderFailure();
    }
  }

  init();
}());
