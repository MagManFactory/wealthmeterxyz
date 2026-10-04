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

  const hasShareControls = document.querySelector('[data-share-platform], [data-share], .social-grid, .share-actions, .systems-share-actions, [onclick*="share"]');
  const footer = document.querySelector('.site-footer');
  if (!hasShareControls && footer) {
    const icons = {
      x: '<path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.22-6.82-5.96 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.84L7.08 4.13H5.12l11.96 15.64Z"/>',
      linkedin: '<path d="M5.34 7.43A2.06 2.06 0 1 1 5.34 3.3a2.06 2.06 0 0 1 0 4.13ZM3.55 9h3.57v11.45H3.55V9Zm5.8 0h3.42v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.26 2.37 4.26 5.46v6.28H16.9v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9Z"/>',
      whatsapp: '<path d="M12.04 2a9.9 9.9 0 0 0-8.59 14.86L2.05 22l5.25-1.38A9.9 9.9 0 1 0 12.04 2Zm4.16 14.19c-.17.48-.97.91-1.35.97-.35.05-.8.07-1.3-.08-2.6-.84-4.44-3.23-4.74-3.61-.1-.14-.79-1.05-.79-2 0-.96.5-1.43.68-1.63.18-.19.39-.24.52-.24.5 0 .55.02.81.64l.62 1.48c.05.1.08.22.02.35-.14.3-.28.4-.59.76-.1.1-.2.21-.09.4.5.86 1.16 1.52 2.59 2.25.19.1.3.08.42-.05l.61-.75c.13-.19.26-.16.44-.1l1.7.86c.05.08.05.47-.12.95Z"/>',
      telegram: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75l-2.23-1.5c-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.87 1.18-5.26 3.47-.5.34-.95.5-1.34.49-.44-.01-1.28-.24-1.9-.45-.77-.25-1.38-.39-1.32-.82.03-.22.33-.45.89-.69 3.48-1.51 5.8-2.51 6.96-2.99 3.31-1.37 3.99-1.61 4.44-1.61.24 0 .72.06.66.8Z"/>',
      reddit: '<path d="M20.5 9a2.5 2.5 0 0 0-2.44.48 11.4 11.4 0 0 0-6.26-1.93l1.1-5.17 3.6.75a1.4 1.4 0 1 0 .16-1.43L12.53.82a.36.36 0 0 0-.43.27l-1.3 6.1a11.6 11.6 0 0 0-6.39 1.93A2.5 2.5 0 0 0 .72 12c0 .9.48 1.68 1.2 2.12 0 3.1 3.58 5.62 8 5.62s8-2.52 8-5.62A2.5 2.5 0 0 0 20.5 9ZM7.5 11a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm5.81 5.23c-1.03 1.03-2.98 1.11-3.31 1.11-.33 0-2.28-.08-3.31-1.11a.25.25 0 0 1 .35-.35c.8.8 2.37.93 2.96.93s2.16-.13 2.96-.93a.25.25 0 0 1 .35.35ZM15 14a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"/>',
      message: '<path d="M12 2a10 10 0 0 0-8.56 15.17L2.55 20.2a1 1 0 0 0 1.25 1.25l3.03-.89A10 10 0 1 0 12 2Zm0 2a8 8 0 1 1-4.13 14.85 1 1 0 0 0-.77-.1l-2.13.62.63-2.12a1 1 0 0 0-.1-.78A8 8 0 0 1 12 4Z"/>',
      email: '<path d="M20 4H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2V6c0-1.1-.9-2-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z"/>',
      copy: '<path d="M8 7a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-1v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3h1V7Zm3 1h3a3 3 0 0 1 3 3v3h1V7h-7v1Zm3 3H7v7h7v-7Z"/>'
    };
    const labels = { x: 'Share on X', linkedin: 'Share on LinkedIn', whatsapp: 'Share on WhatsApp', telegram: 'Share on Telegram', reddit: 'Share on Reddit', message: 'Share by message', email: 'Share by email', copy: 'Copy link' };
    const rail = document.createElement('section');
    rail.className = 'ux-share-rail';
    rail.setAttribute('aria-label', 'Share this tool');
    rail.innerHTML = Object.keys(icons).map((key) => `<button class="ux-share-${key}" type="button" data-ux-share="${key}" aria-label="${labels[key]}" title="${labels[key]}"><svg viewBox="0 0 24 24" aria-hidden="true">${icons[key]}</svg></button>`).join('') + '<span class="ux-share-status" role="status" aria-live="polite"></span>';
    footer.before(rail);
    const status = rail.querySelector('.ux-share-status');
    rail.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-ux-share]');
      if (!button) return;
      const channel = button.dataset.uxShare;
      const url = window.location.href;
      const title = document.querySelector('meta[property="og:title"]')?.content || document.title;
      const text = `${title} — ${window.location.hostname}`;
      const encodedUrl = encodeURIComponent(url);
      const encodedText = encodeURIComponent(text);
      const targets = {
        x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
        telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
        reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`,
        email: `mailto:?subject=${encodedText}&body=${encodedText}%0A%0A${encodedUrl}`
      };
      try {
        if (channel === 'message' && navigator.share) await navigator.share({ title, text, url });
        else if (channel === 'copy' || (channel === 'message' && !navigator.share)) {
          await navigator.clipboard.writeText(url);
          status.textContent = 'Link copied';
          window.setTimeout(() => { status.textContent = ''; }, 2200);
        } else window.open(targets[channel], '_blank', 'noopener,noreferrer');
        send('tool_shared', { share_channel: channel });
      } catch (error) {
        if (error?.name !== 'AbortError') status.textContent = 'Sharing is unavailable in this browser';
      }
    });
  }

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
