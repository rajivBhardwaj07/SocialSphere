(function () {
  if (!API.requireAuth()) return;

  UI.setupNavbar();

  const me = API.getUser();
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id') || me._id;
  const isMe = String(userId) === String(me._id);

  const avatarEl = document.getElementById('profile-avatar');
  const usernameEl = document.getElementById('profile-username');
  const bioEl = document.getElementById('profile-bio');
  const postCountEl = document.getElementById('post-count');
  const followersEl = document.getElementById('followers-count');
  const followingEl = document.getElementById('following-count');
  const followBtn = document.getElementById('follow-btn');
  const editBtn = document.getElementById('edit-btn');
  const editPanel = document.getElementById('edit-panel');
  const postsEl = document.getElementById('posts');
  const noPostsEl = document.getElementById('no-posts');

  let profileUser = null;

  const renderProfile = (user) => {
    profileUser = user;
    document.title = `Connectly — ${user.username}`;
    API.renderAvatar(avatarEl, user, 'xl');
    usernameEl.textContent = user.username;
    bioEl.textContent = user.bio || (isMe ? 'Add a bio to tell others about yourself.' : '');
    postCountEl.textContent = user.postCount || 0;
    followersEl.textContent = user.followers.length;
    followingEl.textContent = user.following.length;

    if (isMe) {
      editBtn.classList.remove('hidden');
    } else {
      followBtn.classList.remove('hidden');
      const isFollowing = user.followers.some((f) => String(f._id) === String(me._id));
      setFollowState(isFollowing);
    }
  };

  const setFollowState = (isFollowing) => {
    followBtn.textContent = isFollowing ? 'Following' : 'Follow';
    followBtn.classList.toggle('btn-primary', !isFollowing);
    followBtn.classList.toggle('btn-ghost', isFollowing);
  };

  followBtn.addEventListener('click', async () => {
    followBtn.disabled = true;
    try {
      const { following, followersCount } = await API.follow(userId);
      setFollowState(following);
      followersEl.textContent = followersCount;
      // Refresh stored "me" so following count stays accurate
      try {
        const fresh = await API.me();
        API.updateStoredUser(fresh);
      } catch (_) {}
    } catch (err) {
      alert(err.message);
    } finally {
      followBtn.disabled = false;
    }
  });

  // Edit panel
  editBtn.addEventListener('click', () => {
    editPanel.classList.remove('hidden');
    document.getElementById('edit-username').value = profileUser.username;
    document.getElementById('edit-avatar').value = profileUser.avatar || '';
    document.getElementById('edit-bio').value = profileUser.bio || '';
  });

  document.getElementById('cancel-edit').addEventListener('click', () => {
    editPanel.classList.add('hidden');
  });

  document.getElementById('save-edit').addEventListener('click', async () => {
    const body = {
      username: document.getElementById('edit-username').value.trim(),
      avatar: document.getElementById('edit-avatar').value.trim(),
      bio: document.getElementById('edit-bio').value.trim(),
    };
    try {
      const updated = await API.updateProfile(body);
      API.updateStoredUser(updated);
      editPanel.classList.add('hidden');
      load(); // reload everything
    } catch (err) {
      alert(err.message);
    }
  });

  const loadPosts = async () => {
    try {
      const posts = await API.fetchUserPosts(userId);
      postsEl.innerHTML = '';
      if (!posts.length) {
        noPostsEl.classList.remove('hidden');
      } else {
        noPostsEl.classList.add('hidden');
        posts.forEach((post) => postsEl.appendChild(UI.renderPost(post)));
      }
    } catch (err) {
      postsEl.innerHTML = `<p class="muted center">${API.escapeHTML(err.message)}</p>`;
    }
  };

  const load = async () => {
    try {
      const user = await API.fetchUser(userId);
      renderProfile(user);
      loadPosts();
    } catch (err) {
      usernameEl.textContent = 'User not found';
      bioEl.textContent = err.message;
    }
  };

  load();
})();
