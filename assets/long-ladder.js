(function () {
    const root = document.documentElement;
    const button = document.getElementById('ladder-theme');
    function applyTheme(mode) {
        const dark = mode === 'dark';
        root.dataset.theme = dark ? 'dark' : 'light';
        document.body.classList.toggle('dark-mode', dark);
        button.textContent = dark ? 'Light mode' : 'Dark mode';
        button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
        button.setAttribute('aria-pressed', String(dark));
    }
    applyTheme(root.dataset.theme);
    button.addEventListener('click', function () {
        const mode = root.dataset.theme === 'dark' ? 'light' : 'dark';
        applyTheme(mode);
        try { localStorage.setItem('wealthmeter_theme', mode); } catch (_) {}
    });
    window.addEventListener('storage', function (event) {
        if (event.key === 'wealthmeter_theme') applyTheme(event.newValue);
    });
})();
