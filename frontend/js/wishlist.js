function _rootPath() {
  const path   = window.location.pathname;
  const marker = '/frontend/';
  const idx    = path.indexOf(marker);
  if (idx !== -1) return path.substring(0, idx + marker.length);
  if (path.includes('/pages/')) {
    return path.substring(0, path.indexOf('/pages/') + 1);
  }
  return '/';
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.require()) return;

  document.getElementById('nav-logo').addEventListener('click', () => {
    window.location.href = _rootPath() + 'index.html';
  });
  document.getElementById('btn-explore').addEventListener('click', () => {
    window.location.href = _rootPath() + 'index.html';
  });

  Auth.renderNavUser();

  const grid = document.getElementById('wishlist-grid');
  grid.innerHTML = Utils.skeletonCards(4);

  try {
    const props = await API.getWishlist();
    if (!props.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">♡</div>
          <h3>Nothing saved yet</h3>
          <p>Tap the heart on any property to save it to your wishlist.</p>
          <button class="btn btn-primary" id="btn-explore-empty">Explore properties</button>
        </div>`;
      document.getElementById('btn-explore-empty').addEventListener('click', () => {
        window.location.href = _rootPath() + 'index.html';
      });
      return;
    }
    grid.innerHTML = props.map(p => `
      <div class="prop-card" data-id="${p.id}">
        <div class="prop-card-img">
          ${p.images?.[0]
            ? `<img class="prop-card-img-inner" src="${Utils.esc(p.images[0])}" alt="${Utils.esc(p.title)}" loading="lazy">`
            : `<div class="prop-card-img-placeholder" style="background:#E2D5C3;font-size:52px">🏠</div>`}
          <div class="prop-heart" data-pid="${p.id}">❤️</div>
        </div>
        <div class="prop-card-info">
          <div class="prop-card-row1">
            <div class="prop-card-loc">${Utils.esc(p.city)}, ${Utils.esc(p.state)}</div>
            ${p.avgRating > 0 ? `<div class="prop-card-rating">★ ${Number(p.avgRating).toFixed(2)}</div>` : ''}
          </div>
          <div class="prop-card-type">${Utils.esc(Utils.propertyTypeLabel(p.propertyType))} · ${p.beds} bed${p.beds > 1 ? 's' : ''}</div>
          <div class="prop-card-price"><strong>${Utils.formatCurrency(p.pricePerNight)}</strong> night</div>
        </div>
      </div>`).join('');

    grid.addEventListener('click', (e) => {
      const heart = e.target.closest('.prop-heart');
      if (heart) {
        e.stopPropagation();
        removeWishlist(heart.dataset.pid, heart);
        return;
      }
      const card = e.target.closest('.prop-card');
      if (card) {
        window.location.href = _rootPath() + `pages/property.html?id=${card.dataset.id}`;
      }
    });

  } catch (e) {
    grid.innerHTML = `<p class="text-muted" style="grid-column:1/-1">Failed to load wishlist</p>`;
  }
});

async function removeWishlist(id, el) {
  try {
    await API.toggleWishlist(id);
    el.textContent = '🤍';
    Utils.toast('Removed from wishlist');
    const card = el.closest('.prop-card');
    card.style.transition = 'opacity 0.4s';
    card.style.opacity = '0.4';
    setTimeout(() => card.remove(), 400);
  } catch {}
}
