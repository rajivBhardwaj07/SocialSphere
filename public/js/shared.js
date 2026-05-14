// Shared UI: navbar setup (search, logout, my-profile link) + post rendering
const UI = (() => {
  const me = () => API.getUser();

  const setupNavbar = () => {
    const myLink = document.getElementById('my-profile-link');
    if (myLink) {
      const user = me();
      if (user) {
        myLink.href = `/profile.html?id=${user._id}`;
        API.setNavAvatar(myLink, user);
      }
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        API.clearSession();
        window.location.href = '/index.html';
      });
    }

    setupSearch();
  };

  const setupSearch = () => {
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    if (!input || !results) return;

    let timer;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      const q = input.value.trim();
      if (!q) {
        results.classList.remove('visible');
        results.innerHTML = '';
        return;
      }
      timer = setTimeout(async () => {
        try {
          const users = await API.search(q);
          if (!users.length) {
            results.innerHTML = '<div class="search-result muted">No users found</div>';
          } else {
            results.innerHTML = users
              .map((u) => `
                <a class="search-result" href="/profile.html?id=${u._id}">
                  <div class="avatar sm" ${u.avatar ? `style="background-image:url('${API.escapeHTML(u.avatar)}')"` : ''}>
                    ${u.avatar ? '' : API.initials(u.username)}
                  </div>
                  <div>
                    <div style="font-weight:600">${API.escapeHTML(u.username)}</div>
                    <div class="muted small">${API.escapeHTML(u.bio || '')}</div>
                  </div>
                </a>
              `)
              .join('');
          }
          results.classList.add('visible');
        } catch (err) {
          console.error(err);
        }
      }, 250);
    });

    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !results.contains(e.target)) {
        results.classList.remove('visible');
      }
    });
  };

  // Render a single post element
  const renderPost = (post, { onChange } = {}) => {
    const currentUser = me();
    const isMine = post.author && String(post.author._id) === String(currentUser._id);
    const isLiked = post.likes.some((id) => String(id) === String(currentUser._id));

    const el = document.createElement('article');
    el.className = 'post';
    el.dataset.id = post._id;

    el.innerHTML = `
      <div class="post-head">
        <a href="/profile.html?id=${post.author._id}" class="avatar md" ${
      post.author.avatar ? `style="background-image:url('${API.escapeHTML(post.author.avatar)}')"` : ''
    }>${post.author.avatar ? '' : API.initials(post.author.username)}</a>
        <div class="post-author">
          <a href="/profile.html?id=${post.author._id}" class="name">${API.escapeHTML(post.author.username)}</a>
          <span class="time">${API.timeAgo(post.createdAt)}</span>
        </div>
        ${isMine ? '<button class="post-delete" title="Delete">&times;</button>' : ''}
      </div>
      <p class="post-content">${API.escapeHTML(post.content)}</p>
      ${post.image ? `<img class="post-image" src="${API.escapeHTML(post.image)}" alt="" onerror="this.remove()" />` : ''}
      <div class="post-actions">
        <button class="action-btn like-btn ${isLiked ? 'liked' : ''}">
          <span class="icon">${isLiked ? '♥' : '♡'}</span>
          <span class="count">${post.likes.length}</span>
        </button>
        <button class="action-btn comment-toggle">
          <span class="icon">💬</span>
          <span class="count">${post.comments.length}</span>
        </button>
      </div>
      <div class="comments">
        ${(post.comments || []).map(renderCommentHTML).join('')}
        <form class="comment-form">
          <input placeholder="Write a comment..." maxlength="500" required />
          <button type="submit">Send</button>
        </form>
      </div>
    `;

    // Like
    const likeBtn = el.querySelector('.like-btn');
    likeBtn.addEventListener('click', async () => {
      try {
        const { liked, likesCount } = await API.likePost(post._id);
        likeBtn.classList.toggle('liked', liked);
        likeBtn.querySelector('.icon').textContent = liked ? '♥' : '♡';
        likeBtn.querySelector('.count').textContent = likesCount;
      } catch (err) {
        alert(err.message);
      }
    });

    // Toggle comments
    const commentsEl = el.querySelector('.comments');
    el.querySelector('.comment-toggle').addEventListener('click', () => {
      commentsEl.classList.toggle('visible');
    });

    // Comment submit
    const commentForm = el.querySelector('.comment-form');
    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = commentForm.querySelector('input');
      const text = input.value.trim();
      if (!text) return;
      try {
        const comment = await API.addComment(post._id, text);
        const node = document.createElement('div');
        node.innerHTML = renderCommentHTML(comment);
        commentForm.parentNode.insertBefore(node.firstElementChild, commentForm);
        input.value = '';
        const countEl = el.querySelector('.comment-toggle .count');
        countEl.textContent = parseInt(countEl.textContent, 10) + 1;
        attachCommentDeleteHandlers(el);
      } catch (err) {
        alert(err.message);
      }
    });

    // Delete post
    if (isMine) {
      el.querySelector('.post-delete').addEventListener('click', async () => {
        if (!confirm('Delete this post?')) return;
        try {
          await API.deletePost(post._id);
          el.remove();
          if (onChange) onChange();
        } catch (err) {
          alert(err.message);
        }
      });
    }

    attachCommentDeleteHandlers(el);
    return el;
  };

  const renderCommentHTML = (comment) => {
    const currentUser = me();
    const isMine = comment.author && String(comment.author._id) === String(currentUser._id);
    return `
      <div class="comment" data-id="${comment._id}">
        <a href="/profile.html?id=${comment.author._id}" class="avatar sm" ${
      comment.author.avatar
        ? `style="background-image:url('${API.escapeHTML(comment.author.avatar)}')"`
        : ''
    }>${comment.author.avatar ? '' : API.initials(comment.author.username)}</a>
        <div class="comment-body">
          <a href="/profile.html?id=${comment.author._id}" class="name">${API.escapeHTML(comment.author.username)}</a>
          <span class="text">${API.escapeHTML(comment.text)}</span>
          <span class="comment-time">${API.timeAgo(comment.createdAt)}</span>
        </div>
        ${isMine ? '<button class="comment-delete" title="Delete">&times;</button>' : ''}
      </div>
    `;
  };

  const attachCommentDeleteHandlers = (postEl) => {
    postEl.querySelectorAll('.comment-delete').forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', async () => {
        const node = btn.closest('.comment');
        if (!confirm('Delete this comment?')) return;
        try {
          await API.deleteComment(node.dataset.id);
          node.remove();
          const countEl = postEl.querySelector('.comment-toggle .count');
          countEl.textContent = Math.max(0, parseInt(countEl.textContent, 10) - 1);
        } catch (err) {
          alert(err.message);
        }
      });
    });
  };

  return { setupNavbar, renderPost };
})();
