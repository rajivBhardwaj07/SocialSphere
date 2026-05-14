const API = (() => {
  const TOKEN_KEY = 'connectly_token';
  const USER_KEY = 'connectly_user';

  const getToken = () => localStorage.getItem(TOKEN_KEY);
  const getUser = () => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  };
  const setSession = (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  };
  const updateStoredUser = (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  };
  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const request = async (path, opts = {}) => {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`/api${path}`, { ...opts, headers });
    let data = null;
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) {
      const msg = (data && data.message) || `Request failed (${res.status})`;
      if (res.status === 401) clearSession();
      throw new Error(msg);
    }
    return data;
  };

  const requireAuth = () => {
    if (!getToken()) {
      window.location.href = '/index.html';
      return false;
    }
    return true;
  };

  // ---- Helpers ----
  const initials = (name = '?') => name.trim().charAt(0).toUpperCase() || '?';

  const renderAvatar = (el, user, size = 'md') => {
    if (!el) return;
    el.className = `avatar ${size}`;
    if (user && user.avatar) {
      el.style.backgroundImage = `url("${user.avatar}")`;
      el.textContent = '';
    } else {
      el.style.backgroundImage = '';
      el.textContent = initials(user && user.username);
    }
  };

  const setNavAvatar = (el, user) => {
    if (!el || !user) return;
    if (user.avatar) {
      el.style.backgroundImage = `url("${user.avatar}")`;
      el.textContent = '';
    } else {
      el.textContent = initials(user.username);
    }
  };

  const timeAgo = (iso) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return new Date(iso).toLocaleDateString();
  };

  const escapeHTML = (str = '') =>
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  return {
    // session
    getToken, getUser, setSession, updateStoredUser, clearSession, requireAuth,
    // requests
    register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request('/auth/me'),
    feed: () => request('/posts/feed'),
    explore: () => request('/posts/explore'),
    createPost: (body) => request('/posts', { method: 'POST', body: JSON.stringify(body) }),
    deletePost: (id) => request(`/posts/${id}`, { method: 'DELETE' }),
    likePost: (id) => request(`/posts/${id}/like`, { method: 'POST' }),
    addComment: (postId, text) =>
      request(`/comments/${postId}`, { method: 'POST', body: JSON.stringify({ text }) }),
    deleteComment: (id) => request(`/comments/${id}`, { method: 'DELETE' }),
    fetchUser: (id) => request(`/users/${id}`),
    fetchUserPosts: (id) => request(`/users/${id}/posts`),
    follow: (id) => request(`/users/${id}/follow`, { method: 'POST' }),
    updateProfile: (body) =>
      request('/users/profile', { method: 'PUT', body: JSON.stringify(body) }),
    search: (q) => request(`/users/search?q=${encodeURIComponent(q)}`),
    suggestions: () => request('/users/suggestions'),
    // helpers
    initials, renderAvatar, setNavAvatar, timeAgo, escapeHTML,
  };
})();
