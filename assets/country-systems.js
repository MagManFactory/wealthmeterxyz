(function () {
  "use strict";

  const palette = ["#2563eb", "#0891b2", "#f97316"];
  const selectors = [...document.querySelectorAll("[data-country-select]")];
  const focusSelect = document.querySelector("[data-focus-select]");
  const matrix = document.querySelector("[data-comparison-matrix]");
  const scatter = document.querySelector("[data-scatter]");
  const trend = document.querySelector("[data-trend]");
  const sourceList = document.querySelector("[data-source-list]");
  const profileCards = document.querySelector("[data-profile-cards]");
  const modeInputs = [...document.querySelectorAll("[data-view-mode]")];
  const controls = document.querySelector(".systems-controls");
  const thirdCountryField = document.querySelector("[data-third-country]");
  const viewSummary = document.querySelector("[data-view-summary]");
  const copyButton = document.querySelector("[data-copy-link]");
  const copyStatus = document.querySelector("[data-copy-status]");
  const sharePreview = document.querySelector("[data-share-preview]");
  const shareStatus = document.querySelector("[data-share-status]");
  const downloadCardButton = document.querySelector("[data-download-card]");
  const siteKey = document.documentElement.dataset.atlasSite || "lifemeter";
  const site = siteKey === "wealthmeter"
    ? { name: "WEALTHMETER.XYZ", host: "wealthmeter.xyz", accent: "#facc15", cardEnd: "#104b63" }
    : { name: "LIFEMETER.XYZ", host: "lifemeter.xyz", accent: "#22d3ee", cardEnd: "#075e68" };
  let comparisonSize = 3;
  let atlas;

  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[char]);

  function formatValue(value, indicator) {
    if (value === null || value === undefined) return "Not available";
    if (indicator.format === "currency") {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
    }
    if (indicator.format === "percent") return `${Number(value).toFixed(value >= 99 ? 1 : 1)}%`;
    if (indicator.format === "years") return `${Number(value).toFixed(1)} years`;
    return Number(value).toFixed(2);
  }

  function selectedCountries() {
    const seen = new Set();
    return selectors.slice(0, comparisonSize).map((select) => select.value).filter((code) => {
      if (!code || seen.has(code)) return false;
      seen.add(code);
      return true;
    }).map((code) => atlas.countries.find((country) => country.code === code)).filter(Boolean);
  }

  function extent(values) {
    const finite = values.filter(Number.isFinite);
    if (!finite.length) return [0, 1];
    const min = Math.min(...finite);
    const max = Math.max(...finite);
    return min === max ? [min - 1, max + 1] : [min, max];
  }

  function populateControls() {
    const options = [...atlas.countries]
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((country) => `<option value="${country.code}">${escapeHtml(country.name)}</option>`)
      .join("");
    selectors.forEach((select) => { select.innerHTML = options; });
    const validCodes = new Set(atlas.countries.map((country) => country.code));
    const params = new URLSearchParams(window.location.search);
    const requestedCodes = params.get("countries")?.split(",").filter((code, index, values) => validCodes.has(code) && values.indexOf(code) === index);
    comparisonSize = params.get("view") === "2" || requestedCodes?.length === 2 ? 2 : 3;
    const initialCodes = requestedCodes?.length === comparisonSize ? requestedCodes : ["USA", "JPN", "DEU"].slice(0, comparisonSize);
    initialCodes.forEach((code, index) => { if (selectors[index]) selectors[index].value = code; });
    if (comparisonSize === 2) selectors[2].value = ["DEU", "FRA", "CAN"].find((code) => !initialCodes.includes(code));
    focusSelect.innerHTML = Object.entries(atlas.indicators).map(([key, indicator]) =>
      `<option value="${key}">${escapeHtml(indicator.shortLabel)}</option>`
    ).join("");
    const requestedMetric = new URLSearchParams(window.location.search).get("metric");
    focusSelect.value = requestedMetric && atlas.indicators[requestedMetric] ? requestedMetric : "life_expectancy";
    modeInputs.forEach((input) => { input.checked = Number(input.value) === comparisonSize; });
    applyComparisonMode();
  }

  function applyComparisonMode() {
    const isTwoCountry = comparisonSize === 2;
    thirdCountryField.hidden = isTwoCountry;
    selectors[2].disabled = isTwoCountry;
    controls.dataset.view = String(comparisonSize);
    profileCards.dataset.view = String(comparisonSize);
    viewSummary.textContent = `${comparisonSize === 2 ? "Two" : "Three"}-country view · eight source-backed measures`;
    ensureActiveUnique();
    updateChoiceAvailability();
  }

  function ensureActiveUnique() {
    selectors.forEach((select) => {
      [...select.options].forEach((option) => { option.disabled = false; });
    });
    const used = new Set();
    selectors.slice(0, comparisonSize).forEach((select) => {
      if (used.has(select.value)) {
        const replacement = [...select.options].find((option) => !used.has(option.value));
        if (replacement) select.value = replacement.value;
      }
      used.add(select.value);
    });
  }

  function updateChoiceAvailability() {
    selectors.forEach((select) => {
      [...select.options].forEach((option) => { option.disabled = false; });
    });
    const active = selectors.slice(0, comparisonSize);
    const chosen = new Set(active.map((select) => select.value));
    active.forEach((select) => {
      [...select.options].forEach((option) => {
        option.disabled = option.value !== select.value && chosen.has(option.value);
      });
    });
  }

  function median(values) {
    const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
    if (!sorted.length) return null;
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  }

  function medianComparison(value, midpoint, indicator) {
    if (!Number.isFinite(midpoint)) return "Prototype median unavailable";
    const difference = value - midpoint;
    const sign = difference > 0 ? "+" : "";
    if (indicator.format === "currency") {
      const percentage = midpoint ? (difference / midpoint) * 100 : 0;
      return `${percentage > 0 ? "+" : ""}${percentage.toFixed(1)}% versus comparison-set median`;
    }
    if (indicator.format === "percent") return `${sign}${difference.toFixed(1)} percentage points versus median`;
    if (indicator.format === "years") return `${sign}${difference.toFixed(1)} years versus median`;
    return `${sign}${difference.toFixed(2)} versus comparison-set median`;
  }

  function renderProfiles() {
    const key = focusSelect.value;
    const indicator = atlas.indicators[key];
    const ranked = atlas.countries.map((country) => ({ country, point: country.metrics[key].latest }))
      .filter(({ point }) => Number.isFinite(point?.value))
      .sort((a, b) => b.point.value - a.point.value);
    const midpoint = median(ranked.map(({ point }) => point.value));
    profileCards.innerHTML = selectedCountries().map((country) => {
      const point = country.metrics[key].latest;
      const rank = ranked.findIndex((entry) => entry.country.code === country.code) + 1;
      const available = Object.values(country.metrics).filter((metric) => Number.isFinite(metric.latest?.value)).length;
      if (!point) return `<article class="systems-profile-card"><div class="systems-profile-country">${escapeHtml(country.name)}</div><h3>${escapeHtml(indicator.shortLabel)}</h3><div class="systems-profile-value">—</div><div class="systems-profile-note">No current observation in this snapshot · ${available} of ${Object.keys(atlas.indicators).length} measures available</div></article>`;
      return `<article class="systems-profile-card"><div class="systems-profile-country">${escapeHtml(country.name)}</div><h3>${escapeHtml(indicator.shortLabel)}</h3><div class="systems-profile-value">${escapeHtml(formatValue(point.value, indicator))}</div><div class="systems-profile-rank">Value position ${rank} of ${ranked.length}</div><div class="systems-profile-note">${escapeHtml(medianComparison(point.value, midpoint, indicator))} · ${point.year} data · ${available} of ${Object.keys(atlas.indicators).length} measures available</div></article>`;
    }).join("");
  }

  function shareEntries() {
    const key = focusSelect.value;
    const indicator = atlas.indicators[key];
    const ranked = atlas.countries.map((country) => ({ country, point: country.metrics[key].latest }))
      .filter(({ point }) => Number.isFinite(point?.value))
      .sort((left, right) => right.point.value - left.point.value);
    return selectedCountries().map((country) => {
      const point = country.metrics[key].latest;
      return {
        country,
        point,
        value: point ? formatValue(point.value, indicator) : "Not available",
        position: point ? ranked.findIndex((entry) => entry.country.code === country.code) + 1 : null,
        total: ranked.length,
      };
    });
  }

  function renderSharePreview() {
    const indicator = atlas.indicators[focusSelect.value];
    const entries = shareEntries();
    const values = entries.map((entry) => `<div class="share-preview-country"><strong>${escapeHtml(entry.country.name)}</strong><b>${escapeHtml(entry.value)}</b><span>${entry.position ? `Value position ${entry.position} of ${entry.total}` : "No current observation"}${entry.point ? ` · ${entry.point.year} data` : ""}</span></div>`).join("");
    sharePreview.innerHTML = `<div class="share-preview-top"><span class="share-preview-brand">${site.name}</span><span>${comparisonSize}-country comparison</span></div><div class="share-preview-title">Country Systems Atlas</div><div class="share-preview-metric">${escapeHtml(indicator.shortLabel)}</div><div class="share-preview-values" data-view="${comparisonSize}">${values}</div><div class="share-preview-foot">Positions are within this ${atlas.coverage.countryCount}-country comparison set · World Development Indicators · ${site.host}</div>`;
  }

  function productionShareUrl() {
    const url = new URL(window.location.href);
    if (url.hostname === "127.0.0.1" || url.hostname === "localhost" || url.hostname.endsWith("pages.dev")) {
      url.protocol = "https:";
      url.hostname = site.host;
      url.port = "";
    }
    return url.toString();
  }

  function shareText() {
    const indicator = atlas.indicators[focusSelect.value];
    const values = shareEntries().map((entry) => `${entry.country.name}: ${entry.value}`).join(" · ");
    return `${indicator.shortLabel} across ${comparisonSize} countries — ${values}. Compare the systems behind the result on ${site.name}.`;
  }

  function roundedRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    if (typeof context.roundRect === "function") {
      context.roundRect(x, y, width, height, r);
    } else {
      context.moveTo(x + r, y);
      context.lineTo(x + width - r, y);
      context.quadraticCurveTo(x + width, y, x + width, y + r);
      context.lineTo(x + width, y + height - r);
      context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
      context.lineTo(x + r, y + height);
      context.quadraticCurveTo(x, y + height, x, y + height - r);
      context.lineTo(x, y + r);
      context.quadraticCurveTo(x, y, x + r, y);
      context.closePath();
    }
    context.fill();
    context.stroke();
  }

  function buildShareCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const context = canvas.getContext("2d");
    const indicator = atlas.indicators[focusSelect.value];
    const entries = shareEntries();
    const side = 76;
    const gap = 22;
    const cardWidth = (canvas.width - side * 2 - gap * (entries.length - 1)) / entries.length;
    const background = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    background.addColorStop(0, "#071427");
    background.addColorStop(.58, "#0c1d35");
    background.addColorStop(1, site.cardEnd);
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = site.accent;
    context.fillRect(side, 62, 10, 48);
    context.fillStyle = "#f8fafc";
    context.font = "800 34px Arial, sans-serif";
    context.fillText(site.name, side + 30, 100);
    context.fillStyle = site.accent;
    context.font = "700 21px Arial, sans-serif";
    context.fillText("COUNTRY SYSTEMS ATLAS", side, 174);
    context.fillStyle = "#f8fafc";
    context.font = "800 54px Arial, sans-serif";
    context.fillText(indicator.shortLabel, side, 234);
    entries.forEach((entry, index) => {
      const x = side + index * (cardWidth + gap);
      context.fillStyle = "rgba(255,255,255,.07)";
      context.strokeStyle = "rgba(255,255,255,.18)";
      context.lineWidth = 2;
      roundedRect(context, x, 284, cardWidth, 205, 18);
      context.fillStyle = "#cbd5e1";
      context.font = "700 21px Arial, sans-serif";
      context.fillText(entry.country.name.toUpperCase(), x + 24, 329, cardWidth - 48);
      context.fillStyle = "#f8fafc";
      context.font = `800 ${entries.length === 2 ? 39 : 31}px Arial, sans-serif`;
      context.fillText(entry.value, x + 24, 392, cardWidth - 48);
      context.fillStyle = "#b9c7db";
      context.font = "600 20px Arial, sans-serif";
      const position = entry.position ? `Value position ${entry.position} of ${entry.total}` : "No current observation";
      context.fillText(position, x + 24, 438, cardWidth - 48);
      if (entry.point) context.fillText(`${entry.point.year} data`, x + 24, 469, cardWidth - 48);
    });
    context.fillStyle = "#9fb0c6";
    context.font = "600 18px Arial, sans-serif";
    context.fillText(`Positions within ${atlas.coverage.countryCount}-country set · World Development Indicators`, side, 553);
    context.fillStyle = "#f8fafc";
    context.font = "700 21px Arial, sans-serif";
    context.textAlign = "right";
    context.fillText(site.host, canvas.width - side, 585);
    context.textAlign = "left";
    return canvas;
  }

  function setShareStatus(message) {
    shareStatus.textContent = message;
    if (message) window.setTimeout(() => { if (shareStatus.textContent === message) shareStatus.textContent = ""; }, 3500);
  }

  function track(eventName, parameters = {}) {
    if (typeof window.gtag === "function") window.gtag("event", eventName, { atlas_site: siteKey, ...parameters });
  }

  function syncComparisonUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set("view", String(comparisonSize));
    url.searchParams.set("countries", selectedCountries().map((country) => country.code).join(","));
    url.searchParams.set("metric", focusSelect.value);
    window.history.replaceState({}, "", url);
  }

  function renderMatrix() {
    const selected = selectedCountries();
    const indicatorEntries = Object.entries(atlas.indicators);
    const header = selected.map((country) => `<th scope="col">${escapeHtml(country.name)}</th>`).join("");
    const rows = indicatorEntries.map(([key, indicator]) => {
      const allValues = atlas.countries.map((country) => country.metrics[key].latest?.value).filter(Number.isFinite);
      const [min, max] = extent(allValues);
      const cells = selected.map((country) => {
        const point = country.metrics[key].latest;
        if (!point) return "<td><span class=\"metric-number\">—</span></td>";
        const normalized = ((point.value - min) / (max - min)) * 100;
        return `<td><span class="metric-number">${escapeHtml(formatValue(point.value, indicator))}</span><span class="metric-year">${point.year} data</span><div class="metric-track" aria-hidden="true"><span class="metric-fill" style="width:${Math.max(3, normalized).toFixed(1)}%"></span></div></td>`;
      }).join("");
      return `<tr><th scope="row" class="metric-name"><strong>${escapeHtml(indicator.shortLabel)}</strong><span>${escapeHtml(indicator.domain)}</span></th>${cells}</tr>`;
    }).join("");
    matrix.innerHTML = `<table class="comparison-table"><thead><tr><th scope="col">System measure</th>${header}</tr></thead><tbody>${rows}</tbody></table>`;
  }

  function svgText(x, y, text, className, anchor = "middle") {
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${className}">${escapeHtml(text)}</text>`;
  }

  function renderScatter() {
    const width = 620, height = 360;
    const margin = { top: 28, right: 28, bottom: 54, left: 68 };
    const points = atlas.countries.map((country) => ({
      country,
      x: country.metrics.gdp_ppp.latest?.value,
      y: country.metrics.life_expectancy.latest?.value,
    })).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    const [xMin, xMax] = extent(points.map((point) => point.x));
    const [yMin, yMax] = extent(points.map((point) => point.y));
    const xScale = (value) => margin.left + ((value - xMin) / (xMax - xMin)) * (width - margin.left - margin.right);
    const yScale = (value) => height - margin.bottom - ((value - yMin) / (yMax - yMin)) * (height - margin.top - margin.bottom);
    const selectedCodes = new Set(selectedCountries().map((country) => country.code));
    const grid = [0, .25, .5, .75, 1].map((tick) => {
      const x = margin.left + tick * (width - margin.left - margin.right);
      const y = height - margin.bottom - tick * (height - margin.top - margin.bottom);
      const xValue = xMin + tick * (xMax - xMin);
      const yValue = yMin + tick * (yMax - yMin);
      return `<line x1="${x}" y1="${margin.top}" x2="${x}" y2="${height - margin.bottom}" class="chart-grid"/><line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" class="chart-grid"/>${svgText(x, height - 30, `$${Math.round(xValue / 1000)}k`, "chart-label")}${svgText(55, y + 4, yValue.toFixed(0), "chart-label", "end")}`;
    }).join("");
    const dots = points.map((point) => {
      const selected = selectedCodes.has(point.country.code);
      const index = selectedCountries().findIndex((country) => country.code === point.country.code);
      const color = selected ? palette[index] : "#b9c6d6";
      return `<circle cx="${xScale(point.x)}" cy="${yScale(point.y)}" r="${selected ? 7 : 4}" class="chart-dot${selected ? " selected" : ""}" style="fill:${color}"><title>${escapeHtml(point.country.name)}: ${formatValue(point.x, atlas.indicators.gdp_ppp)}, ${formatValue(point.y, atlas.indicators.life_expectancy)}</title></circle>${selected ? svgText(xScale(point.x) + 10, yScale(point.y) - 10, point.country.name, "chart-dot-label", "start") : ""}`;
    }).join("");
    scatter.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="GDP per person plotted against life expectancy for ${atlas.countries.length} countries">${grid}<line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" class="chart-axis"/><line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" class="chart-axis"/>${dots}${svgText(width / 2, height - 7, "GDP per person, purchasing-power parity", "chart-label")}${svgText(16, height / 2, "Life expectancy (years)", "chart-label")}</svg>`;
  }

  function renderTrend() {
    const key = focusSelect.value;
    const indicator = atlas.indicators[key];
    const selected = selectedCountries();
    const width = 620, height = 340;
    const margin = { top: 30, right: 24, bottom: 48, left: 68 };
    const values = selected.flatMap((country) => country.metrics[key].series.map((point) => point.value));
    const [min, max] = extent(values);
    const years = selected.flatMap((country) => country.metrics[key].series.map((point) => point.year));
    const [yearMin, yearMax] = extent(years);
    if (!values.length) { trend.innerHTML = "<div class=\"empty-note\">No time series is available for this selection.</div>"; return; }
    const x = (year) => margin.left + ((year - yearMin) / (yearMax - yearMin)) * (width - margin.left - margin.right);
    const y = (value) => height - margin.bottom - ((value - min) / (max - min)) * (height - margin.top - margin.bottom);
    const grid = [0, .25, .5, .75, 1].map((tick) => {
      const yy = height - margin.bottom - tick * (height - margin.top - margin.bottom);
      const value = min + tick * (max - min);
      return `<line x1="${margin.left}" y1="${yy}" x2="${width - margin.right}" y2="${yy}" class="chart-grid"/>${svgText(57, yy + 4, indicator.format === "currency" ? `$${Math.round(value / 1000)}k` : value.toFixed(1), "chart-label", "end")}`;
    }).join("");
    const lines = selected.map((country, index) => {
      const series = country.metrics[key].series;
      const path = series.map((point, pointIndex) => `${pointIndex ? "L" : "M"}${x(point.year).toFixed(1)},${y(point.value).toFixed(1)}`).join(" ");
      const dots = series.map((point) => `<circle cx="${x(point.year)}" cy="${y(point.value)}" r="3.5" class="trend-dot" style="fill:${palette[index]}"><title>${country.name}, ${point.year}: ${formatValue(point.value, indicator)}</title></circle>`).join("");
      const last = series[series.length - 1];
      return `<path d="${path}" class="trend-line" style="stroke:${palette[index]}"/>${dots}${last ? svgText(x(last.year) - 4, y(last.value) - 10, country.name, "chart-dot-label", "end") : ""}`;
    }).join("");
    trend.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(indicator.label)} time series for selected countries">${grid}${lines}${svgText(margin.left, height - 20, String(yearMin), "chart-label", "start")}${svgText(width - margin.right, height - 20, String(yearMax), "chart-label", "end")}</svg>`;
    document.querySelector("[data-trend-title]").textContent = indicator.shortLabel;
  }

  function renderSources() {
    sourceList.innerHTML = Object.values(atlas.indicators).map((indicator) => `<div class="source-row"><strong>${escapeHtml(indicator.label)} · ${escapeHtml(indicator.code)}</strong><span>${escapeHtml(indicator.sourceClass)}. World Development Indicators; observation year appears with each value.</span></div>`).join("");
  }

  function render() {
    updateChoiceAvailability();
    renderMatrix();
    renderScatter();
    renderTrend();
    renderProfiles();
    renderSharePreview();
    syncComparisonUrl();
  }

  function shareOnPlatform(platform) {
    const rawUrl = productionShareUrl();
    const rawText = shareText();
    const url = encodeURIComponent(rawUrl);
    const text = encodeURIComponent(rawText);
    const destinations = {
      x: `https://x.com/intent/post?text=${text}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      reddit: `https://www.reddit.com/submit?url=${url}&title=${text}`,
      message: `sms:&body=${text}%20${url}`,
      email: `mailto:?subject=${encodeURIComponent(`${site.name} Country Systems comparison`)}&body=${encodeURIComponent(`${rawText}\n\n${rawUrl}`)}`,
    };
    if (!destinations[platform]) return;
    if (platform === "message" || platform === "email") window.location.href = destinations[platform];
    else window.open(destinations[platform], "_blank", "noopener,noreferrer");
    track("country_systems_share", { method: platform, comparison_size: comparisonSize, metric: focusSelect.value });
  }

  function downloadShareCard() {
    buildShareCanvas().toBlob((blob) => {
      if (!blob) { setShareStatus("Image unavailable"); return; }
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${siteKey}-country-systems-${selectedCountries().map((country) => country.code.toLowerCase()).join("-")}.png`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      setShareStatus("Image downloaded");
      track("country_systems_share", { method: "download", comparison_size: comparisonSize, metric: focusSelect.value });
    }, "image/png");
  }

  async function nativeShare() {
    if (!navigator.share) { setShareStatus("System sharing is unavailable here"); return; }
    const canvas = buildShareCanvas();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    const file = blob ? new File([blob], "country-systems-comparison.png", { type: "image/png" }) : null;
    const payload = { title: `${site.name} Country Systems Atlas`, text: shareText(), url: productionShareUrl() };
    if (file && navigator.canShare?.({ files: [file] })) payload.files = [file];
    try {
      await navigator.share(payload);
      track("country_systems_share", { method: "native", comparison_size: comparisonSize, metric: focusSelect.value });
    } catch (error) {
      if (error?.name !== "AbortError") setShareStatus("Sharing was unavailable");
    }
  }

  fetch("data/country-systems-atlas.json?v=2026-09-16.2")
    .then((response) => { if (!response.ok) throw new Error(`Data request failed: ${response.status}`); return response.json(); })
    .then((data) => {
      atlas = data;
      populateControls();
      renderSources();
      render();
      selectors.forEach((select) => select.addEventListener("change", () => {
        render();
        track("country_systems_country_change", { comparison_size: comparisonSize });
      }));
      modeInputs.forEach((input) => input.addEventListener("change", () => {
        if (!input.checked) return;
        comparisonSize = Number(input.value);
        applyComparisonMode();
        render();
        track("country_systems_mode_change", { comparison_size: comparisonSize });
      }));
      focusSelect.addEventListener("change", () => {
        render();
        track("country_systems_metric_change", { metric: focusSelect.value, comparison_size: comparisonSize });
      });
      copyButton.addEventListener("click", () => {
        if (!navigator.clipboard?.writeText) {
          copyStatus.textContent = "Copy unavailable";
          return;
        }
        navigator.clipboard.writeText(window.location.href).then(() => {
          copyStatus.textContent = "Link copied";
          window.setTimeout(() => { copyStatus.textContent = ""; }, 2500);
        }).catch(() => { copyStatus.textContent = "Copy unavailable"; });
      });
      document.querySelectorAll("[data-share-platform]").forEach((button) => button.addEventListener("click", () => shareOnPlatform(button.dataset.sharePlatform)));
      downloadCardButton.addEventListener("click", downloadShareCard);
      document.querySelectorAll("[data-related-link]").forEach((link) => link.addEventListener("click", () => track("country_systems_related_click", { destination: link.getAttribute("href") })));
      track("country_systems_view", { comparison_size: comparisonSize, metric: focusSelect.value });
      document.querySelector("[data-generated]").textContent = atlas.generated;
    })
    .catch((error) => {
      matrix.innerHTML = `<p class="empty-note">The atlas data could not be loaded. ${escapeHtml(error.message)}</p>`;
    });
})();
