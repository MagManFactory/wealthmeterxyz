(() => {
  'use strict';

  const METRIC_ORDER = [
    'top1_wealth', 'top10_wealth', 'top1_income', 'top10_income', 'bottom50_income',
    'gdp_per_capita_ppp', 'consumption_per_capita', 'population', 'life_expectancy', 'age65_share'
  ];
  const DEFAULT_COUNTRIES = ['USA', 'JPN', 'DEU'];
  const els = {
    coverage: document.querySelector('[data-coverage]'),
    controls: document.querySelector('[data-controls]'),
    result: document.querySelector('[data-result]'),
    sharePreview: document.querySelector('[data-share-preview]'),
    shareStatus: document.querySelector('[data-share-status]'),
    shareCanvas: document.querySelector('[data-share-canvas]'),
    recordSearch: document.querySelector('[data-record-search]'),
    recordStatus: document.querySelector('[data-record-status]'),
    recordGrid: document.querySelector('[data-record-grid]'),
    showMore: document.querySelector('[data-show-more]'),
    providerList: document.querySelector('[data-provider-list]')
  };

  const state = {
    mode: 'surprise',
    countries: DEFAULT_COUNTRIES.slice(),
    view: 3,
    metric: 'top1_wealth',
    insightId: null,
    browseLimit: 12,
    data: null,
    manifest: null,
    latestByCountry: new Map(),
    countriesList: []
  };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[character]);
  }

  function track(eventName, params = {}) {
    if (typeof window.gtag === 'function') window.gtag('event', eventName, params);
  }

  function parseUrlState() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (['explore', 'compare', 'surprise'].includes(mode)) state.mode = mode;
    const countries = (params.get('countries') || '').split(',').filter(Boolean).slice(0, 3);
    if (countries.length) state.countries = countries;
    const view = Number(params.get('view'));
    if ([2, 3].includes(view)) state.view = view;
    if (params.get('metric')) state.metric = params.get('metric');
    if (params.get('result')) state.insightId = params.get('result');
  }

  function currentUrl() {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('mode', state.mode);
    if (state.mode === 'explore') url.searchParams.set('countries', state.countries[0]);
    if (state.mode === 'compare') {
      url.searchParams.set('countries', state.countries.slice(0, state.view).join(','));
      url.searchParams.set('metric', state.metric);
      url.searchParams.set('view', String(state.view));
    }
    if (state.mode === 'surprise' && state.insightId) url.searchParams.set('result', state.insightId);
    return url.toString();
  }

  function syncUrl() {
    window.history.replaceState({}, '', currentUrl());
  }

  function provider(sourceId) {
    return state.manifest.providers[sourceId] || { name: sourceId, url: '#' };
  }

  function metricDefinition(metricKey) {
    return state.manifest.metrics[metricKey] || {
      label: metricKey.replaceAll('_', ' '), shortLabel: metricKey.replaceAll('_', ' '), unit: 'number',
      definition: 'Definition unavailable for this archived record.', caveat: '', sourceId: 'world-bank'
    };
  }

  function formatValue(record, metricKey = record.metric) {
    if (record.displayValue) return record.displayValue;
    const metric = metricDefinition(metricKey);
    if (record.value === null || record.value === undefined) return 'Unavailable';
    if (metric.unit === 'percent') return `${record.value.toFixed(1)}%`;
    if (metric.unit === 'currency') return `$${Math.round(record.value).toLocaleString('en-US')}`;
    if (metric.unit === 'count') return Math.round(record.value).toLocaleString('en-US');
    if (metric.unit === 'years') return `${record.value.toFixed(1)} years`;
    return String(record.value);
  }

  function buildIndexes() {
    const observed = state.data.records.filter((record) => record.kind === 'observation' && record.status === 'current' && record.countryCode);
    for (const record of observed) {
      if (!state.latestByCountry.has(record.countryCode)) state.latestByCountry.set(record.countryCode, new Map());
      const bucket = state.latestByCountry.get(record.countryCode);
      const existing = bucket.get(record.metric);
      if (!existing || Number(record.year || 0) > Number(existing.year || 0)) bucket.set(record.metric, record);
    }
    state.countriesList = Array.from(state.latestByCountry.entries()).map(([code, metrics]) => {
      const first = Array.from(metrics.values()).find((record) => record.country);
      return { code, name: first ? first.country : code };
    }).filter((country) => METRIC_ORDER.some((metric) => state.latestByCountry.get(country.code).has(metric)))
      .sort((a, b) => a.name.localeCompare(b.name));
    state.countries = state.countries.map((code) => state.latestByCountry.has(code) ? code : 'USA');
  }

  function countryName(code) {
    return state.countriesList.find((country) => country.code === code)?.name || code;
  }

  function countryOptions(selected) {
    return state.countriesList.map((country) => `<option value="${country.code}"${country.code === selected ? ' selected' : ''}>${escapeHtml(country.name)}</option>`).join('');
  }

  function metricOptions(selected) {
    return METRIC_ORDER.filter((key) => state.manifest.metrics[key]).map((key) => {
      const metric = metricDefinition(key);
      return `<option value="${key}"${key === selected ? ' selected' : ''}>${escapeHtml(metric.label)}</option>`;
    }).join('');
  }

  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll('[data-mode]').forEach((button) => button.setAttribute('aria-selected', String(button.dataset.mode === mode)));
    renderControls();
    renderResult();
    syncUrl();
    track('data_lab_mode_change', { mode });
  }

  function renderControls() {
    if (state.mode === 'explore') {
      els.controls.innerHTML = `<div class="lab-control"><label for="lab-country">Country</label><select id="lab-country" data-country-index="0">${countryOptions(state.countries[0])}</select></div>`;
    } else if (state.mode === 'compare') {
      const selected = state.countries.slice(0, state.view);
      els.controls.innerHTML = `
        <div class="lab-control"><label for="lab-metric">Measure</label><select id="lab-metric" data-metric-select>${metricOptions(state.metric)}</select></div>
        <div class="lab-control"><label>Comparison size</label><div class="lab-view-toggle"><button type="button" data-view="2" class="${state.view === 2 ? 'is-active' : ''}">2 countries</button><button type="button" data-view="3" class="${state.view === 3 ? 'is-active' : ''}">3 countries</button></div></div>
        ${selected.map((code, index) => `<div class="lab-control"><label for="lab-country-${index}">Country ${index + 1}</label><select id="lab-country-${index}" data-country-index="${index}">${countryOptions(code)}</select></div>`).join('')}`;
    } else {
      els.controls.innerHTML = `<div class="surprise-control"><p>Reveal a screened comparison from the current collection. Historical pandemic observations do not enter this draw.</p><button type="button" data-new-surprise>Show me another</button></div>`;
    }
  }

  function metricCard(record) {
    const metric = metricDefinition(record.metric);
    const source = provider(metric.sourceId || record.sourceId);
    return `<article class="metric-card">
      <div class="metric-name">${escapeHtml(metric.label)}</div>
      <div class="metric-value">${escapeHtml(formatValue(record))}</div>
      <div class="metric-year">${escapeHtml(record.year)} data</div>
      <details><summary>What this means</summary><p>${escapeHtml(metric.definition)}</p>${metric.caveat ? `<p>${escapeHtml(metric.caveat)}</p>` : ''}<a class="source-link" href="${escapeHtml(source.url)}" target="_blank" rel="noopener">Source: ${escapeHtml(source.name)} ↗</a></details>
    </article>`;
  }

  function renderExplore() {
    const code = state.countries[0];
    const metrics = state.latestByCountry.get(code) || new Map();
    const records = METRIC_ORDER.map((key) => metrics.get(key)).filter(Boolean);
    els.result.innerHTML = `<div class="country-heading"><div><div class="result-eyebrow">Country profile</div><h2>${escapeHtml(countryName(code))}</h2></div><p>Latest available observation for each measure. Years are shown because the providers update on different schedules.</p></div><div class="metric-card-grid">${records.map(metricCard).join('')}</div>`;
  }

  function comparisonRecords() {
    return state.countries.slice(0, state.view).map((code) => ({ code, record: state.latestByCountry.get(code)?.get(state.metric) || null }));
  }

  function renderCompare() {
    const metric = metricDefinition(state.metric);
    const rows = comparisonRecords();
    const numeric = rows.map((row) => row.record?.value).filter((value) => Number.isFinite(value));
    const max = Math.max(...numeric, 1);
    const source = provider(metric.sourceId);
    const bars = rows.map(({ code, record }) => {
      const width = record && Number.isFinite(record.value) ? Math.max(2, (record.value / max) * 100) : 0;
      return `<div class="comparison-row"><div class="comparison-country">${escapeHtml(countryName(code))}</div><div class="comparison-bar-track" aria-hidden="true"><div class="comparison-bar" style="width:${width.toFixed(1)}%"></div></div><div class="comparison-value">${record ? escapeHtml(formatValue(record)) : 'Unavailable'}<small>${record?.year ? `${record.year} data` : 'No comparable observation'}</small></div></div>`;
    }).join('');
    els.result.innerHTML = `<div class="comparison-heading"><div><div class="result-eyebrow">Country comparison</div><h2>${escapeHtml(metric.label)}</h2></div><p>Bar lengths compare values only within this measure. They are not a composite rank.</p></div><div class="comparison-chart">${bars}</div><div class="comparison-note"><div><h3>What this measures</h3><p>${escapeHtml(metric.definition)}</p></div><div><h3>Source and limit</h3><p>${escapeHtml(metric.caveat || 'Observation years are shown beside each value.')}</p><a class="source-link" href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.name)} ↗</a></div></div>`;
  }

  function surprisePool() {
    const approvedPrefixes = ['INS-WID-WEALTHVINC-', 'INS-WID-TOP1OF10WEALTH-', 'INS-WID-T10VSB50-', 'INS-WB-GDPTREND-', 'INS-WB-LIFEGDP-', 'INS-CROSS-AGINGGDP-'];
    return state.data.records.filter((record) => record.kind === 'derived' && record.status === 'current' && approvedPrefixes.some((prefix) => record.id.startsWith(prefix)));
  }

  function selectNewSurprise() {
    const pool = surprisePool();
    if (!pool.length) return;
    const currentIndex = pool.findIndex((record) => record.id === state.insightId);
    const jump = 1 + Math.floor(Math.random() * Math.max(1, pool.length - 1));
    state.insightId = pool[(Math.max(0, currentIndex) + jump) % pool.length].id;
    renderResult();
    syncUrl();
    track('data_lab_insight_reveal', { result_id: state.insightId });
  }

  function currentSurprise() {
    const pool = surprisePool();
    let record = pool.find((item) => item.id === state.insightId);
    if (!record) {
      record = pool[Math.floor(Math.random() * pool.length)];
      state.insightId = record?.id || null;
    }
    return record;
  }

  function renderSurprise() {
    const record = currentSurprise();
    if (!record) {
      els.result.innerHTML = '<div class="lab-empty">No screened insight is available.</div>';
      return;
    }
    const source = provider(record.sourceId);
    els.result.innerHTML = `<div class="surprise-result"><div class="result-eyebrow">Data surprise</div><h2>${escapeHtml(record.statement)}</h2><p>${record.year ? `${escapeHtml(record.year)} data · ` : ''}<a class="source-link" href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.name)} ↗</a></p></div>`;
  }

  function shareModel() {
    if (state.mode === 'compare') {
      const metric = metricDefinition(state.metric);
      return { kicker: 'COUNTRY COMPARISON', title: metric.label, values: comparisonRecords().map(({ code, record }) => ({ name: countryName(code), value: record ? formatValue(record) : 'Unavailable', year: record?.year || '' })), source: provider(metric.sourceId).name };
    }
    if (state.mode === 'surprise') {
      const record = currentSurprise();
      return { kicker: 'DATA SURPRISE', title: record?.statement || 'Global wealth data', values: [], source: record ? provider(record.sourceId).name : 'WealthMeter Data Lab' };
    }
    const code = state.countries[0];
    const metrics = state.latestByCountry.get(code) || new Map();
    const keys = ['top1_wealth', 'top1_income', 'gdp_per_capita_ppp'];
    return { kicker: 'COUNTRY PROFILE', title: countryName(code), values: keys.map((key) => metrics.get(key)).filter(Boolean).map((record) => ({ name: metricDefinition(record.metric).shortLabel, value: formatValue(record), year: record.year })), source: 'WID + World Development Indicators' };
  }

  function renderSharePreview() {
    const model = shareModel();
    els.sharePreview.innerHTML = `<article class="share-card"><div class="share-card-brand"><i></i>WEALTHMETER.XYZ</div><div class="share-card-kicker">${escapeHtml(model.kicker)}</div><h3>${escapeHtml(model.title)}</h3>${model.values.length ? `<div class="share-values">${model.values.map((item) => `<div class="share-value"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.value)}</span><small>${escapeHtml(item.year)} data</small></div>`).join('')}</div>` : ''}<div class="share-card-footer"><span>${escapeHtml(model.source)}</span><strong>wealthmeter.xyz/data-lab.html</strong></div></article>`;
    drawShareCanvas(model);
  }

  function wrapCanvasText(ctx, text, maxWidth, maxLines) {
    const words = text.split(/\s+/);
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
      else line = test;
      if (lines.length === maxLines - 1) break;
    }
    if (line && lines.length < maxLines) lines.push(line);
    if (words.join(' ').length > lines.join(' ').length) lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.,;:]?$/, '')}…`;
    return lines;
  }

  function drawShareCanvas(model) {
    const canvas = els.shareCanvas;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#071326'); gradient.addColorStop(.72, '#0b1830'); gradient.addColorStop(1, '#064e63');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1200, 630);
    ctx.fillStyle = '#ffd31a'; ctx.fillRect(58, 48, 10, 58);
    ctx.fillStyle = '#f8fafc'; ctx.font = '900 31px Arial'; ctx.fillText('WEALTHMETER.XYZ', 90, 89);
    ctx.fillStyle = '#38bdf8'; ctx.font = '700 18px Arial'; ctx.fillText(model.kicker, 60, 167);
    ctx.fillStyle = '#f8fafc'; ctx.font = model.title.length > 90 ? '800 43px Arial' : '800 57px Arial';
    const titleLines = wrapCanvasText(ctx, model.title, 1080, model.values.length ? 2 : 5);
    titleLines.forEach((line, index) => ctx.fillText(line, 60, 230 + index * 62));
    if (model.values.length) {
      const top = titleLines.length > 1 ? 350 : 300;
      const gap = 18; const width = (1080 - gap * (model.values.length - 1)) / model.values.length;
      model.values.forEach((item, index) => {
        const x = 60 + index * (width + gap);
        ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(x, top, width, 145, 18); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#cbd5e1'; ctx.font = '700 17px Arial'; ctx.fillText(item.name.toUpperCase(), x + 20, top + 36);
        ctx.fillStyle = '#f8fafc'; ctx.font = '800 28px Arial'; ctx.fillText(item.value, x + 20, top + 82);
        ctx.fillStyle = '#9fb1c8'; ctx.font = '600 16px Arial'; ctx.fillText(`${item.year} data`, x + 20, top + 116);
      });
    }
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.moveTo(60, 550); ctx.lineTo(1140, 550); ctx.stroke();
    ctx.fillStyle = '#a9bad1'; ctx.font = '600 17px Arial'; ctx.fillText(model.source, 60, 590);
    ctx.fillStyle = '#f8fafc'; ctx.font = '800 18px Arial'; ctx.textAlign = 'right'; ctx.fillText('wealthmeter.xyz/data-lab.html', 1140, 590); ctx.textAlign = 'left';
  }

  function renderResult() {
    if (state.mode === 'compare') renderCompare();
    else if (state.mode === 'surprise') renderSurprise();
    else renderExplore();
    renderSharePreview();
  }

  function renderProviders() {
    els.providerList.innerHTML = Object.values(state.manifest.providers).map((item) => `<div class="provider-row"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.attribution)}</span><br><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Source ↗</a>${item.methodologyUrl ? `<a href="${escapeHtml(item.methodologyUrl)}" target="_blank" rel="noopener">Methodology ↗</a>` : ''}${item.termsUrl ? `<a href="${escapeHtml(item.termsUrl)}" target="_blank" rel="noopener">Terms ↗</a>` : ''}</div>`).join('');
  }

  function renderRecordBrowser() {
    const query = (els.recordSearch.value || '').trim().toLowerCase();
    const status = els.recordStatus.value;
    const matches = state.data.records.filter((record) => record.status === status)
      .filter((record) => !query || `${record.country || ''} ${record.dimension} ${record.statement} ${record.sourceLabel}`.toLowerCase().includes(query))
      .sort((a, b) => Number(b.kind === 'derived') - Number(a.kind === 'derived') || String(b.year || '').localeCompare(String(a.year || '')) || a.id.localeCompare(b.id));
    const visible = matches.slice(0, state.browseLimit);
    els.recordGrid.innerHTML = visible.length ? visible.map((record) => {
      const source = provider(record.sourceId);
      return `<article class="record-card"><div class="record-meta"><span>${escapeHtml(record.kind)}</span><span>${escapeHtml(record.year || 'Year varies')}</span></div><p>${escapeHtml(record.statement)}</p><div class="record-source"><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.name)} ↗</a><br>${escapeHtml(record.id)}</div></article>`;
    }).join('') : '<div class="lab-empty">No records match this search.</div>';
    els.showMore.hidden = visible.length >= matches.length;
  }

  function shareText() {
    const model = shareModel();
    return `${model.title} — explore the source-backed comparison on WealthMeter.`;
  }

  function openShare(platform) {
    const url = currentUrl(); const text = shareText();
    const encodedUrl = encodeURIComponent(url); const encodedText = encodeURIComponent(text);
    const destinations = {
      x: `https://x.com/intent/post?text=${encodedText}&url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`,
      email: `mailto:?subject=${encodedText}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
      message: `sms:?&body=${encodeURIComponent(`${text} ${url}`)}`
    };
    track('data_lab_share', { platform, mode: state.mode, metric: state.metric });
    if (platform === 'message' && navigator.share) {
      navigator.share({ title: shareModel().title, text, url }).catch(() => {});
      return;
    }
    window.open(destinations[platform], platform === 'email' || platform === 'message' ? '_self' : '_blank', 'noopener');
  }

  function downloadCard() {
    els.shareCanvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `wealthmeter-data-lab-${state.mode}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      els.shareStatus.textContent = 'Result card downloaded.';
      track('data_lab_card_download', { mode: state.mode, metric: state.metric });
    }, 'image/png');
  }

  function bindEvents() {
    document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
    els.controls.addEventListener('change', (event) => {
      const countryIndex = event.target.dataset.countryIndex;
      if (countryIndex !== undefined) state.countries[Number(countryIndex)] = event.target.value;
      if (event.target.matches('[data-metric-select]')) state.metric = event.target.value;
      renderResult(); syncUrl(); track('data_lab_filter_change', { mode: state.mode, metric: state.metric });
    });
    els.controls.addEventListener('click', (event) => {
      const viewButton = event.target.closest('[data-view]');
      if (viewButton) {
        state.view = Number(viewButton.dataset.view);
        while (state.countries.length < state.view) state.countries.push(DEFAULT_COUNTRIES[state.countries.length]);
        renderControls(); renderResult(); syncUrl();
      }
      if (event.target.closest('[data-new-surprise]')) selectNewSurprise();
    });
    els.recordSearch.addEventListener('input', () => { state.browseLimit = 12; renderRecordBrowser(); });
    els.recordStatus.addEventListener('change', () => { state.browseLimit = 12; renderRecordBrowser(); });
    els.showMore.addEventListener('click', () => { state.browseLimit += 12; renderRecordBrowser(); });
    document.querySelectorAll('[data-share-platform]').forEach((button) => button.addEventListener('click', () => openShare(button.dataset.sharePlatform)));
    document.querySelector('[data-download-card]').addEventListener('click', downloadCard);
    document.querySelector('[data-copy-link]').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(currentUrl()); els.shareStatus.textContent = 'Result link copied.'; }
      catch { els.shareStatus.textContent = 'Copy was blocked. Use the address bar to copy this result.'; }
      track('data_lab_copy_link', { mode: state.mode, metric: state.metric });
    });
  }

  async function initialize() {
    parseUrlState();
    try {
      const [dataResponse, manifestResponse] = await Promise.all([fetch('data/data-lab.json'), fetch('data/data-lab-sources.json')]);
      if (!dataResponse.ok || !manifestResponse.ok) throw new Error('Data files unavailable');
      [state.data, state.manifest] = await Promise.all([dataResponse.json(), manifestResponse.json()]);
      buildIndexes();
      if (!state.manifest.metrics[state.metric]) state.metric = 'top1_wealth';
      els.coverage.textContent = `${state.data.coverage.coreCountries}-country comparison set · ${state.data.coverage.currentRecords.toLocaleString('en-US')} active records and insights · 4 documented providers`;
      renderProviders(); renderControls(); renderResult(); renderRecordBrowser(); bindEvents(); syncUrl();
      document.querySelectorAll('[data-mode]').forEach((button) => button.setAttribute('aria-selected', String(button.dataset.mode === state.mode)));
      track('data_lab_view', { mode: state.mode, metric: state.metric });
    } catch (error) {
      els.result.innerHTML = '<div class="lab-empty">The Data Lab could not load its data snapshot. Please try again.</div>';
      els.coverage.textContent = 'Data snapshot temporarily unavailable';
      console.error(error);
    }
  }

  initialize();
})();
