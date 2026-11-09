/* Photo viewer touch gestures on phones: swipe for the next or previous photo,
   double-tap to zoom in on the spot you tapped (and again to fit). */
(function () {
  const lb = document.getElementById('lb'), frame = document.getElementById('photoFrame');
  if (!lb || !frame) return;
  const narrow = matchMedia('(max-width: 700px)');
  let start = null, lastTap = 0, lastX = 0, lastY = 0;

  const comparing = () => !document.getElementById('photoCompare')?.hidden;
  const zoomed = () => frame.classList.contains('zoomed');

  function step(dir) {
    const b = lb.querySelector(`[data-photo-step="${dir}"]`);
    if (b && !b.disabled) b.click();
  }

  function toggleZoom(x, y) {
    const btn = document.getElementById('zoomPhoto');
    if (!btn || btn.hidden) return;
    const img = document.getElementById('lbimg'), r = img.getBoundingClientRect();
    const fx = r.width ? (x - r.left) / r.width : .5, fy = r.height ? (y - r.top) / r.height : .5;
    btn.click();
    if (zoomed()) requestAnimationFrame(() => {
      frame.scrollLeft = fx * img.offsetWidth - frame.clientWidth / 2;
      frame.scrollTop = fy * img.offsetHeight - frame.clientHeight / 2;
    });
  }

  frame.addEventListener('touchstart', e => {
    if (!narrow.matches || e.touches.length !== 1) { start = null; return; }
    const t = e.touches[0];
    start = { x: t.clientX, y: t.clientY, at: Date.now() };
  }, { passive: true });

  frame.addEventListener('touchmove', e => {
    if (!start || zoomed() || comparing()) return;
    const t = e.touches[0];
    lb.classList.toggle('lv-swiping', Math.abs(t.clientX - start.x) > 40 && Math.abs(t.clientY - start.y) < 60);
  }, { passive: true });

  frame.addEventListener('touchend', e => {
    lb.classList.remove('lv-swiping');
    if (!start) return;
    const t = e.changedTouches[0], dx = t.clientX - start.x, dy = t.clientY - start.y, quick = Date.now() - start.at < 600;
    const s = start; start = null;
    if (!zoomed() && !comparing() && quick && Math.abs(dx) > 50 && Math.abs(dy) < Math.abs(dx) * 0.6) {
      step(dx < 0 ? 1 : -1);
      lastTap = 0;
      return;
    }
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && !comparing()) {
      const now = Date.now();
      if (now - lastTap < 300 && Math.abs(s.x - lastX) < 30 && Math.abs(s.y - lastY) < 30) {
        e.preventDefault();
        toggleZoom(s.x, s.y);
        lastTap = 0;
      } else {
        lastTap = now; lastX = s.x; lastY = s.y;
      }
    }
  });
})();
