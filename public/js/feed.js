(function () {
  if (!API.requireAuth()) return;

  UI.setupNavbar();

  const me = API.getUser();
  const composerAvatar = document.getElementById('composer-avatar');
  API.renderAvatar(composerAvatar, me, 'md');

  const postsEl = document.getElementById('posts');
  const emptyEl = document.getElementById('empty-feed');
  const navTabs = document.querySelectorAll('.nav-tab[data-tab]');

  let currentTab = 'feed';

  const loadPosts = async () => {
    postsEl.innerHTML = '<p class="muted center">Loading…</p>';
    try {
      const posts = currentTab === 'feed' ? await API.feed() : await API.explore();
      postsEl.innerHTML = '';
      if (!posts.length) {
        emptyEl.classList.remove('hidden');
        emptyEl.textContent =
          currentTab === 'feed'
            ? 'No posts yet. Follow people on the Explore tab or create one!'
            : 'No posts yet. Be the first to share something!';
      } else {
        emptyEl.classList.add('hidden');
        posts.forEach((post) => {
          postsEl.appendChild(UI.renderPost(post, { onChange: () => {} }));
        });
      }
    } catch (err) {
      postsEl.innerHTML = `<p class="muted center">${API.escapeHTML(err.message)}</p>`;
    }
  };

  navTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      navTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      loadPosts();
    });
  });

  // Composer
  const text = document.getElementById('composer-text');
  const image = document.getElementById('composer-image');
  const count = document.getElementById('composer-count');
  const postBtn = document.getElementById('post-btn');

  text.addEventListener('input', () => {
    count.textContent = `${text.value.length} / 1000`;
  });

  postBtn.addEventListener('click', async () => {
    const content = text.value.trim();
    if (!content) return;
    postBtn.disabled = true;
    try {
      const post = await API.createPost({ content, image: image.value.trim() });
      text.value = '';
      image.value = '';
      count.textContent = '0 / 1000';
      emptyEl.classList.add('hidden');
      postsEl.prepend(UI.renderPost(post));
    } catch (err) {
      alert(err.message);
    } finally {
      postBtn.disabled = false;
    }
  });

  // Suggestions
  const loadSuggestions = async () => {
    const container = document.getElementById('suggestions');
    try {
      const users = await API.suggestions();
      if (!users.length) {
        container.innerHTML = '<p class="muted small">No suggestions right now.</p>';
        return;
      }
      container.innerHTML = '';
      users.forEach((u) => {
        const wrap = document.createElement('div');
        wrap.className = 'suggestion';
        wrap.innerHTML = `
          <a href="/profile.html?id=${u._id}" class="avatar md" ${
          u.avatar ? `style="background-image:url('${API.escapeHTML(u.avatar)}')"` : ''
        }>${u.avatar ? '' : API.initials(u.username)}</a>
          <div class="info">
            <a href="/profile.html?id=${u._id}" class="name">${API.escapeHTML(u.username)}</a>
            <span class="bio">${API.escapeHTML(u.bio || 'New here')}</span>
          </div>
          <button class="btn-outline follow-suggest">Follow</button>
        `;
        wrap.querySelector('.follow-suggest').addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            await API.follow(u._id);
            wrap.remove();
          } catch (err) {
            alert(err.message);
          }
        });
        container.appendChild(wrap);
      });
    } catch (err) {
      container.innerHTML = `<p class="muted small">${API.escapeHTML(err.message)}</p>`;
    }
  };

  loadPosts();
  loadSuggestions();
})();
