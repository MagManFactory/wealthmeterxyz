(function () {
  "use strict";

  const palette = ["#2563eb", "#0891b2", "#f97316", "#7c3aed"];
  const selectors = [...document.querySelectorAll("[data-country-select]")];
  const focusSelect = document.querySelector("[data-focus-select]");
  const matrix = document.querySelector("[data-comparison-matrix]");
  const scatter = document.querySelector("[data-scatter]");
  const trend = document.querySelector("[data-trend]");
  const sourceList = document.querySelector("[data-source-list]");
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
    return selectors.map((select) => select.value).filter((code) => {
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
    const options = atlas.countries.map((country) => `<option value="${country.code}">${escapeHtml(country.name)}</option>`).join("");
    selectors.forEach((select) => { select.innerHTML = options; });
    ["USA", "JPN", "DEU", "BRA"].forEach((code, index) => { if (selectors[index]) selectors[index].value = code; });
    focusSelect.innerHTML = Object.entries(atlas.indicators).map(([key, indicator]) =>
      `<option value="${key}">${escapeHtml(indicator.shortLabel)}</option>`
    ).join("");
    focusSelect.value = "life_expectancy";
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
        return `<td><span class="metric-number">${escapeHtml(formatValue(point.value, indicator))}</span><span class="metric-year">Observation year ${point.year}</span><div class="metric-track" aria-hidden="true"><span class="metric-fill" style="width:${Math.max(3, normalized).toFixed(1)}%"></span></div></td>`;
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
    scatter.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="GDP per person plotted against life expectancy for thirty countries">${grid}<line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" class="chart-axis"/><line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" class="chart-axis"/>${dots}${svgText(width / 2, height - 7, "GDP per person, purchasing-power parity", "chart-label")}${svgText(16, height / 2, "Life expectancy (years)", "chart-label")}</svg>`;
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

  function render() { renderMatrix(); renderScatter(); renderTrend(); }

  fetch("data/country-systems-phase1.json")
    .then((response) => { if (!response.ok) throw new Error(`Data request failed: ${response.status}`); return response.json(); })
    .then((data) => {
      atlas = data;
      populateControls();
      renderSources();
      render();
      selectors.forEach((select) => select.addEventListener("change", render));
      focusSelect.addEventListener("change", renderTrend);
      document.querySelector("[data-generated]").textContent = atlas.generated;
    })
    .catch((error) => {
      matrix.innerHTML = `<p class="empty-note">The prototype data could not be loaded. ${escapeHtml(error.message)}</p>`;
    });
})();
