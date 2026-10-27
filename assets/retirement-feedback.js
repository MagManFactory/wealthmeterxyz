(() => {
  'use strict';
  const form = document.getElementById('retirement-feedback-form');
  if (!form) return;
  const panel = document.getElementById('retirement-feedback');
  const message = document.getElementById('retirement-feedback-message');
  const trap = document.getElementById('retirement-feedback-website');
  const button = form.querySelector('button[type="submit"]');
  const status = document.getElementById('retirement-feedback-status');
  const count = document.getElementById('retirement-feedback-count');
  let started = null;
  let pending = false;
  const frame = document.querySelector('.roger-special-frame');
  addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame?.contentWindow || event.data?.type !== 'meter-feedback-open') return;
    panel.open = true;
    panel.scrollIntoView({ block: 'start', behavior: 'auto' });
    message.focus({ preventScroll: true });
  });
  function update() {
    const length = message.value.trim().length;
    count.textContent = `${message.value.length.toLocaleString()} / 2,000 characters`;
    button.disabled = pending || started === null || Date.now() - started < 3000 || length < 5 || length > 2000;
  }
  panel.addEventListener('toggle', () => {
    if (panel.open && started === null) {
      started = Date.now();
      setTimeout(update, 3050);
    }
    update();
  });
  message.addEventListener('input', update);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;
    update();
    if (button.disabled) return;
    pending = true;
    message.disabled = true;
    button.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'Sending your message…';
    update();
    try {
      const result = await fetch('https://lifemeter.xyz/api/retirement-feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify({ message: message.value.trim(), website: trap.value, fill_ms: Date.now() - started }),
        signal: AbortSignal.timeout(30000),
      });
      const data = await result.json();
      if (!result.ok || data.ok !== true) throw new Error('not_confirmed');
      status.textContent = data.delivery_confirmed
        ? 'Your message reached Michelle’s operations inbox. Thank you.'
        : 'Your message was accepted for delivery to Michelle. Thank you.';
      message.value = '';
    } catch (_) {
      status.setAttribute('role', 'alert');
      status.setAttribute('aria-live', 'assertive');
      status.textContent = 'We could not confirm delivery. Your message is kept here. Please try again later.';
    } finally {
      pending = false;
      message.disabled = false;
      button.textContent = 'Send';
      form.removeAttribute('aria-busy');
      update();
    }
  });
  update();
})();
