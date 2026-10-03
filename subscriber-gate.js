(() => {
  "use strict";

  const host = window.location.hostname.toLowerCase();
  const site = document.body.classList.contains("wealthmeter") ? "wealthmeter" : "lifemeter";
  const isPreview = ![site + ".xyz", "www." + site + ".xyz"].includes(host);
  const label = site === "wealthmeter" ? "WealthMeter" : "LifeMeter";
  const cookieName = site === "wealthmeter" ? "wm_subscriber_access" : "lm_subscriber_access";
  const endpoint = "https://lifemeter.xyz/api/subscriber-access";
  const pageResource = document.body?.dataset.subscriberGateResource || "";
  const privacyUrl = site === "wealthmeter" ? "privacy.html" : "privacy.html";
  let pendingResource = "";
  let pendingDestination = false;

  function cookieValue() {
    const entry = document.cookie.split("; ").find((item) => item.startsWith(`${cookieName}=`));
    return entry ? decodeURIComponent(entry.slice(cookieName.length + 1)) : "";
  }

  function storeToken(token) {
    if (!token) return;
    document.cookie = `${cookieName}=${encodeURIComponent(token)}; Max-Age=15552000; Path=/; SameSite=Lax; Secure`;
  }

  function clearToken() {
    document.cookie = `${cookieName}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
  }

  async function request(action, resource, extra = {}) {
    const response = await fetch(endpoint, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, site, resource: ["fire-timeline", "lev-preparedness", "medical-black-swan", "life-expectancy-hides", "live-better-for-less"].includes(resource) ? "newsletter" : resource, company: "", ...extra }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || "not_verified");
    return data;
  }

  function unlock() {
    document.body.classList.remove("subscriber-gate-open");
    document.querySelectorAll("[data-subscriber-protected]").forEach((node) => { node.removeAttribute("data-subscriber-protected"); node.inert = false; });
    document.querySelector(".phoenix-access-wrap")?.classList.add("access-unlocked");
    document.querySelector(".subscriber-gate-backdrop")?.remove();
  }

  function dialogCopy(resource) {
    const copies = {
      "life-expectancy-hides": ["Unlock the full life-expectancy feature", "Join LifeMeter to explore the interactive age explorer, survival patterns and population comparisons."],
      "live-better-for-less": ["Unlock Live Better for Less", "Join WealthMeter to compare lower-cost countries against the quality standards you choose."],
      "fire-timeline": ["Unlock the FIRE Timeline Planner", "Estimate your retirement timeline, compare savings scenarios and explore the cost of the life you want."],
      "lev-preparedness": ["Unlock LEV Preparedness", "Explore your preparedness across health, resources and access. Compare scenarios and identify areas to examine more closely."],
      "medical-black-swan": ["Unlock the Black Swan Stress-Test", "Explore how a major health shock could affect your resources and the choices available to you."]
    };
    if (copies[resource]) return copies[resource];
    if (resource === "biomarker-essentials") {
      return ["Unlock the free Biomarker Essentials Guide", "Join LifeMeter for evidence briefs, longform analysis, and new report releases. Your guide opens immediately."];
    }
    if (resource === "portfolio-alpha") {
      return ["Unlock the Portfolio Alpha Simulator", "Join WealthMeter for new wealth research, diagnostic tools, and report releases. The simulator opens immediately."];
    }
    return ["Unlock Wearable Synthesis", "Join LifeMeter for evidence briefs, longform analysis, and new report releases. The tool opens immediately."];
  }

  function showGate(resource, allowClose = false, wantsDestination = false) {
    pendingResource = resource;
    pendingDestination = wantsDestination;
    document.querySelector(".subscriber-gate-backdrop")?.remove();
    const [title, copy] = dialogCopy(resource);
    const backdrop = document.createElement("div");
    backdrop.className = "subscriber-gate-backdrop";
    backdrop.innerHTML = `
      <section class="subscriber-gate-dialog" aria-labelledby="subscriber-gate-title">
        ${allowClose ? '<button class="subscriber-gate-close" type="button" aria-label="Close">&times;</button>' : ""}
        <p class="subscriber-gate-eyebrow">Free subscriber access</p>
        <h2 id="subscriber-gate-title">${title}</h2>
        <p class="subscriber-gate-copy">${copy}</p>
        <div class="subscriber-gate-mode" role="group" aria-label="Subscriber status">
          <button type="button" data-gate-mode="new" aria-pressed="true">New subscriber</button>
          <button type="button" data-gate-mode="returning" aria-pressed="false">Already subscribed</button>
        </div>
        <form class="subscriber-gate-form" data-gate-form>
          <input type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-10000px;width:1px;height:1px">
          <label class="subscriber-gate-field" data-gate-name>First name<input name="firstName" autocomplete="given-name" required></label>
          <label class="subscriber-gate-field" data-gate-name>Last name<input name="lastName" autocomplete="family-name" required></label>
          <label class="subscriber-gate-field subscriber-gate-field-email">Email address<input name="email" type="email" autocomplete="email" inputmode="email" required></label>
          <label class="subscriber-gate-consent" data-gate-consent><input type="checkbox" name="commercialUpdates" value="yes">Optional: send me ${label} report offers and relevant commercial recommendations.</label>
          <button class="subscriber-gate-submit" type="submit">Continue to ${resource === "biomarker-essentials" ? "the guide" : ["life-expectancy-hides", "live-better-for-less"].includes(resource) ? "the feature" : "the tool"}</button>
          <p class="subscriber-gate-status" role="status" aria-live="polite"></p>
        </form>
        ${isPreview ? '<p class="subscriber-gate-note">Development preview: no subscription is created here.</p><button type="button" class="subscriber-gate-preview">' + (['life-expectancy-hides', 'live-better-for-less'].includes(resource) ? 'Preview the full feature' : 'Preview the unlocked tool') + '</button>' : ""}
        <p class="subscriber-gate-note">You will receive ${label} news and updates. Unsubscribe at any time. We do not sell subscriber information. <a href="${privacyUrl}">Privacy policy</a>.</p>
      </section>`;
    (document.querySelector(".phoenix-access-wrap") || document.body).append(backdrop);
    document.body.classList.add("subscriber-gate-open");
    backdrop.querySelector("input[name='firstName']")?.focus();
  }

  async function submitGate(form) {
    if (!form.reportValidity() || form.dataset.sending === "1") return;
    const status = form.querySelector(".subscriber-gate-status");
    const button = form.querySelector("button[type='submit']");
    const mode = form.dataset.mode || "new";
    const email = form.elements.email.value.trim();
    form.dataset.sending = "1";
    button.disabled = true;
    status.textContent = "";
    try {
      if (isPreview) {
        status.textContent = "Preview only. No details were sent and no subscription was created. Use Preview the unlocked tool to review the interface.";
        form.dataset.sending = "0";
        button.disabled = false;
        return;
      }
      if (mode === "new") {
        const signupResponse = await fetch("https://lifemeter.xyz/api/newsletter", {
          method: "POST",
          mode: "cors",
          credentials: "omit",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            site,
            source: `subscriber-gate-${pendingResource}`,
            page: window.location.pathname,
            newsletter: "yes",
            commercialUpdates: form.elements.commercialUpdates?.checked === true ? "yes" : "no",
                commercialConsentVersion: form.elements.commercialUpdates?.checked === true ? "2026-10-01.1" : "",
            company: form.elements.company.value,
            firstName: form.elements.firstName.value.trim(),
            lastName: form.elements.lastName.value.trim(),
            email,
          }),
        });
        if (!signupResponse.ok) throw new Error("signup_failed");
      }
      const data = await request("claim", pendingResource, { email });
      storeToken(data.token);
      unlock();
      if (pendingDestination && data.destination) window.location.assign(data.destination);
    } catch (_error) {
      status.textContent = mode === "returning"
        ? "We could not verify an active subscription for that email. You can switch to New subscriber to join."
        : "Access is temporarily unavailable. Please try again.";
      form.dataset.sending = "0";
      button.disabled = false;
    }
  }

  document.addEventListener("click", async (event) => {
    if (isPreview && event.target.closest(".subscriber-gate-preview")) { unlock(); return; }
    const modeButton = event.target.closest("[data-gate-mode]");
    if (modeButton) {
      const dialog = modeButton.closest(".subscriber-gate-dialog");
      const form = dialog.querySelector("[data-gate-form]");
      const mode = modeButton.dataset.gateMode;
      form.dataset.mode = mode;
      dialog.querySelectorAll("[data-gate-mode]").forEach((button) => button.setAttribute("aria-pressed", String(button === modeButton)));
      dialog.querySelectorAll("[data-gate-name]").forEach((field) => {
        field.hidden = mode === "returning";
        field.querySelector("input").required = mode !== "returning";
      });
      dialog.querySelector("[data-gate-consent]").hidden = mode === "returning";
      form.querySelector("input[name='email']")?.focus();
      return;
    }
    if (event.target.closest(".subscriber-gate-close")) {
      unlock();
      return;
    }
    const gatedLink = event.target.closest("[data-subscriber-resource]");
    if (!gatedLink) return;
    event.preventDefault();
    const resource = gatedLink.dataset.subscriberResource;
    try {
      const data = await request("validate", resource, { token: cookieValue() });
      if (data.destination) window.location.assign(data.destination);
    } catch (_error) {
      clearToken();
      showGate(resource, true, true);
    }
  });

  document.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-gate-form]");
    if (!form) return;
    event.preventDefault();
    submitGate(form);
  });

  async function initializePageGate() {
    if (!pageResource) return;
    const main = document.querySelector(".legacy-content") || document.querySelector("main");
    if (main) { main.setAttribute("data-subscriber-protected", ""); main.inert = true; }
    document.body.classList.add("subscriber-gate-open");
    if (isPreview || !cookieValue()) { showGate(pageResource); return; }
    try {
      await request("validate", pageResource, { token: cookieValue() });
      unlock();
    } catch (_error) {
      clearToken();
      showGate(pageResource, false, false);
    }
  }

  initializePageGate();
})();
