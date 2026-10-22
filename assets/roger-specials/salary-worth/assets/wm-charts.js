/* Minimal dependency-free SVG charts for WealthMeter feature prototypes. */
const WM = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const el = (t, a = {}, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const nice = (max) => { if (max <= 0) return 1; const e = Math.pow(10, Math.floor(Math.log10(max))); const f = max / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e; };
  function frame(host, W, H) {
    host.innerHTML = ""; host.classList.add("chart");
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img" }, host);
    const tip = document.createElement("div"); tip.className = "tip"; host.appendChild(tip);
    return { svg, tip };
  }
  function showTip(host, tip, html, x, y) {
    tip.innerHTML = html; tip.style.opacity = 1;
    const r = host.getBoundingClientRect(); const w = tip.offsetWidth;
    let left = x + 14; if (left + w > r.width) left = x - w - 14; if (left < 0) left = 4;
    tip.style.left = left + "px"; tip.style.top = Math.max(0, y - 10) + "px";
  }
  /* series: [{name,color,vals,dash}] ; opts: {stacked, fmt, yMax, xLabelEvery, height, marks:[{i,label}]} */
  function line(host, xs, series, opts = {}) {
    const W = 900, H = opts.height || 380, m = { l: 54, r: 16, t: 14, b: 30 };
    const { svg, tip } = frame(host, W, H);
    const iw = W - m.l - m.r, ih = H - m.t - m.b, n = xs.length;
    const vis = series.filter(s => !s.hidden);
    let cum = xs.map(() => 0);
    const stacks = vis.map(s => { const lo = cum.slice(); const hi = cum.map((c, i) => opts.stacked ? c + (s.vals[i] || 0) : (s.vals[i])); if (opts.stacked) cum = hi; return { s, lo, hi }; });
    let ymax = opts.yMax || nice(Math.max(...stacks.flatMap(k => k.hi.filter(v => v != null))) * 1.05);
    const ymin = Math.min(0, ...stacks.flatMap(k => k.lo.concat(k.hi).filter(v => v != null && Number.isFinite(v))));
    const X = i => m.l + (n === 1 ? iw / 2 : i * iw / (n - 1)), Y = v => m.t + ih - ((v - ymin) / (ymax - ymin || 1)) * ih;
    for (let k = 0; k <= 4; k++) { const v = ymin + (ymax - ymin) * k / 4; el("line", { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), class: "gridl" }, svg); el("text", { x: m.l - 8, y: Y(v) + 4, "text-anchor": "end" }, svg).textContent = (opts.fmt || String)(v); }
    const every = opts.xLabelEvery || Math.ceil(n / 8);
    xs.forEach((x, i) => { if (i % every === 0 || i === n - 1) { if (i !== n - 1 && n - 1 - i < every * .6) return; el("text", { x: X(i), y: H - 8, "text-anchor": "middle" }, svg).textContent = opts.xfmt ? opts.xfmt(x) : x; } });
    (opts.bands || []).forEach(b => { const a = xs.indexOf(b.from), z = xs.indexOf(b.to); if (a < 0 || z < 0) return; el("rect", { x: X(a), y: m.t, width: X(z) - X(a), height: ih, fill: "rgba(240,162,74,.08)" }, svg); el("text", { x: X(a) + 4, y: m.t + 12, fill: "#f0a24a" }, svg).textContent = b.label; });
    stacks.forEach(({ s, lo, hi }) => {
      if (opts.stacked) {
        let d = ""; hi.forEach((v, i) => d += (i ? "L" : "M") + X(i) + "," + Y(v)); for (let i = n - 1; i >= 0; i--) d += "L" + X(i) + "," + Y(lo[i]);
        el("path", { d: d + "Z", fill: s.color, "fill-opacity": .82, stroke: "none" }, svg);
      } else {
        let d = "", pen = false; hi.forEach((v, i) => { if (v == null) { pen = false; return; } d += (pen ? "L" : "M") + X(i) + "," + Y(v); pen = true; });
        el("path", { d, fill: "none", stroke: s.color, "stroke-width": s.width || 2.4, "stroke-dasharray": s.dash || "" }, svg);
      }
    });
    (opts.marks || []).forEach(mk => { el("line", { x1: X(mk.i), x2: X(mk.i), y1: m.t, y2: m.t + ih, stroke: "#f0a24a", "stroke-dasharray": "3 4" }, svg); el("text", { x: X(mk.i) + 4, y: m.t + 24, fill: "#f0a24a" }, svg).textContent = mk.label; });
    const cross = el("line", { y1: m.t, y2: m.t + ih, stroke: "#fff", "stroke-opacity": .35, visibility: "hidden" }, svg);
    const hit = el("rect", { x: m.l, y: m.t, width: iw, height: ih, fill: "transparent" }, svg);
    const move = (ev) => {
      const r = svg.getBoundingClientRect(); const px = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
      const sx = px * W / r.width; const i = Math.max(0, Math.min(n - 1, Math.round((sx - m.l) / iw * (n - 1))));
      cross.setAttribute("x1", X(i)); cross.setAttribute("x2", X(i)); cross.setAttribute("visibility", "visible");
      const rows = vis.slice().reverse().map(s => `<div><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${s.color};margin-right:6px"></i>${s.name}: <b>${s.vals[i] == null ? "n/a" : (opts.tfmt || opts.fmt || String)(s.vals[i])}</b></div>`).join("");
      const tot = opts.stacked && opts.showTotal ? `<div style="margin-top:4px;color:#c3b29f">Total: <b>${(opts.tfmt || opts.fmt)(cum[i])}</b></div>` : "";
      showTip(host, tip, `<b>${opts.xfmt ? opts.xfmt(xs[i]) : xs[i]}</b>${rows}${tot}`, X(i) * r.width / W, 10);
    };
    hit.addEventListener("mousemove", move); hit.addEventListener("touchmove", move, { passive: true });
    hit.addEventListener("mouseleave", () => { tip.style.opacity = 0; cross.setAttribute("visibility", "hidden"); });
  }
  /* horizontal bars: items [{label, value, color, sub}] */
  function hbars(host, items, opts = {}) {
    const rowH = opts.rowH || 34, W = 900, m = { l: opts.labelW || 170, r: 70, t: 6, b: 6 }, H = m.t + m.b + items.length * rowH;
    const { svg, tip } = frame(host, W, H);
    const max = opts.max || Math.max(...items.map(d => Math.abs(d.value || 0))) * 1.05 || 1;
    const iw = W - m.l - m.r;
    items.forEach((d, k) => {
      const y = m.t + k * rowH;
      el("text", { x: m.l - 10, y: y + rowH / 2 + 4, "text-anchor": "end", style: "font-size:13px;fill:#f4ece2" }, svg).textContent = d.label;
      el("rect", { x: m.l, y: y + 6, width: iw, height: rowH - 12, rx: 6, fill: "#352820" }, svg);
      const w = Math.max(0, (d.value || 0) / max * iw);
      const b = el("rect", { x: m.l, y: y + 6, width: w, height: rowH - 12, rx: 6, fill: d.color || "#5aa2ff" }, svg);
      (d.marks || []).forEach(mk => el("line", { x1: m.l + mk.v / max * iw, x2: m.l + mk.v / max * iw, y1: y + 2, y2: y + rowH - 2, stroke: mk.color || "#fff", "stroke-width": 3 }, svg));
      el("text", { x: m.l + Math.min(w, iw) + 8, y: y + rowH / 2 + 4, style: "font:700 12px 'Roboto Mono';fill:#f4ece2" }, svg).textContent = d.value == null ? "n/a" : (opts.fmt || String)(d.value);
      if (d.tip) { b.addEventListener("mousemove", ev => { const r = host.getBoundingClientRect(); showTip(host, tip, d.tip, ev.clientX - r.left, ev.clientY - r.top); }); b.addEventListener("mouseleave", () => tip.style.opacity = 0); }
    });
  }
  /* donut: items [{label,value,color}] */
  function donut(host, items, opts = {}) {
    const S = 260, R = 118, r0 = 74; const { svg, tip } = frame(host, S, S);
    const tot = items.reduce((a, d) => a + (d.value || 0), 0) || 1; let a0 = -Math.PI / 2;
    items.forEach(d => {
      const a1 = a0 + (d.value || 0) / tot * Math.PI * 2; if (a1 - a0 < 1e-6) { return; }
      const big = a1 - a0 > Math.PI ? 1 : 0, c = S / 2, p = (r, a) => `${c + r * Math.cos(a)},${c + r * Math.sin(a)}`;
      const path = el("path", { d: `M${p(R, a0)}A${R},${R} 0 ${big} 1 ${p(R, a1 - 1e-4)}L${p(r0, a1 - 1e-4)}A${r0},${r0} 0 ${big} 0 ${p(r0, a0)}Z`, fill: d.color, stroke: "#1d1510", "stroke-width": 2 }, svg);
      path.addEventListener("mousemove", ev => { const r = host.getBoundingClientRect(); showTip(host, tip, `<b>${d.label}</b><br>${(d.value / tot * 100).toFixed(1)}%`, ev.clientX - r.left, ev.clientY - r.top); });
      path.addEventListener("mouseleave", () => tip.style.opacity = 0); a0 = a1;
    });
    if (opts.center) { el("text", { x: S / 2, y: S / 2 - 4, "text-anchor": "middle", style: "font:700 20px 'Roboto Mono';fill:#fff" }, svg).textContent = opts.center; }
    if (opts.sub) { el("text", { x: S / 2, y: S / 2 + 18, "text-anchor": "middle", style: "font:12px Inter;fill:#c3b29f" }, svg).textContent = opts.sub; }
  }
  function legend(host, series, onToggle) {
    host.innerHTML = ""; host.className = "legend";
    series.forEach((s, k) => { const b = document.createElement("button"); b.innerHTML = `<i style="background:${s.color}"></i>${s.name}`; if (s.hidden) b.classList.add("off");
      if (onToggle) b.onclick = () => { s.hidden = !s.hidden; b.classList.toggle("off"); onToggle(); }; host.appendChild(b); });
  }
  function navSpy() {
    const links = [...document.querySelectorAll(".topnav a.l")];
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(l => l.classList.toggle("on", l.getAttribute("href") === "#" + e.target.id)); }), { rootMargin: "-40% 0px -55% 0px" });
    document.querySelectorAll("main section[id]").forEach(s => io.observe(s));
  }
  function sources(host, list) {
    host.innerHTML = list.map(s => `<li><b>${s.publisher}</b>. ${s.table}. Release: ${s.release || "see file"}. Retrieved ${s.retrieved}. <a href="${s.url}" target="_blank" rel="noopener">${s.url}</a>${s.underlying_data ? ". Underlying data: " + s.underlying_data : ""}.</li>`).join("");
  }
  return { line, hbars, donut, legend, navSpy, sources };
})();
