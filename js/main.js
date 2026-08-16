document.querySelectorAll('[data-typewrite]').forEach(el => {
    const text = el.dataset.typewrite;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.classList.add('typewriter-caret');

    if (reduceMotion) { el.textContent = text; return; }

    let i = 0;
    (function type() {
        el.textContent = text.slice(0, i++);
        if (i <= text.length) requestAnimationFrame(() => setTimeout(type, 45));
    })();
});