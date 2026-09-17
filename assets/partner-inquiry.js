(() => {
  const form = document.querySelector('.partner-inquiry-form');
  if (!form) return;
  const type = form.elements.requestKind;
  const status = form.querySelector('.form-status');
  const button = form.querySelector('button[type="submit"]');
  let startedAt = Date.now();
  let submissionId = crypto.randomUUID();

  const selectType = (value) => {
    if ([...type.options].some((option) => option.value === value)) type.value = value;
  };
  selectType(new URLSearchParams(location.search).get('type'));
  document.querySelectorAll('[data-inquiry-type]').forEach((link) => {
    link.addEventListener('click', () => selectType(link.dataset.inquiryType));
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.classList.remove('error');
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    const payload = {
      ...values,
      site: form.dataset.site,
      startedAt,
      submissionId,
    };
    button.disabled = true;
    status.textContent = 'Recording your inquiry…';
    try {
      const response = await fetch(form.dataset.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'request_failed');
      form.reset();
      startedAt = Date.now();
      submissionId = crypto.randomUUID();
      status.textContent = `Received for owner review. Reference: ${result.reference}`;
    } catch (_error) {
      status.classList.add('error');
      status.textContent = 'The inquiry could not be recorded. Please check the fields and try again.';
    } finally {
      button.disabled = false;
    }
  });
})();
