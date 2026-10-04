(() => {
  const body = document.body;
  if (!body) return;
  body.classList.add('calculator-experience');

  const send = (name, detail = {}) => {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, {
      tool_path: window.location.pathname,
      ...detail
    });
  };

  const actionPattern = /(calculate|analy[sz]e|show|compare|estimate|run|discover|find)/i;
  document.querySelectorAll('button, input[type="submit"]').forEach((button) => {
    const label = (button.textContent || button.value || '').trim();
    if (!actionPattern.test(label)) return;
    button.addEventListener('click', () => send('tool_result_requested'));
  });

  document.querySelectorAll('details').forEach((detail) => {
    const summary = detail.querySelector(':scope > summary');
    if (!summary || !/(method|assumption|caveat|source|how .* work|fine-tune)/i.test(summary.textContent)) return;
    detail.addEventListener('toggle', () => {
      if (detail.open) send('tool_detail_opened', { detail_label: summary.textContent.trim().slice(0, 80) });
    });
  });

  const resultSelectors = ['#results', '#result', '.results', '.result-panel', '.results-pane', '.result-section'];
  const reveal = (element) => {
    if (!element || element.dataset.uxRevealed === 'true') return;
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return;
    element.dataset.uxRevealed = 'true';
    element.classList.add('ux-result-reveal');
    send('tool_result_viewed');
  };
  const observer = new MutationObserver(() => resultSelectors.forEach((selector) => document.querySelectorAll(selector).forEach(reveal)));
  observer.observe(document.body, { attributes: true, childList: true, subtree: true, attributeFilter: ['style', 'class', 'hidden'] });
  resultSelectors.forEach((selector) => document.querySelectorAll(selector).forEach(reveal));
})();
