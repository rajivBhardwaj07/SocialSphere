(function () {
  if (API.getToken()) {
    window.location.href = '/feed.html';
    return;
  }

  const tabs = document.querySelectorAll('.tab');
  const forms = {
    login: document.getElementById('login-form'),
    register: document.getElementById('register-form'),
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      Object.values(forms).forEach((f) => f.classList.remove('active'));
      forms[tab.dataset.tab].classList.add('active');
    });
  });

  const handleSubmit = (form, errEl, fn) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errEl.textContent = '';
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      try {
        const data = Object.fromEntries(new FormData(form).entries());
        const res = await fn(data);
        API.setSession(res.token, res.user);
        window.location.href = '/feed.html';
      } catch (err) {
        errEl.textContent = err.message;
      } finally {
        btn.disabled = false;
      }
    });
  };

  handleSubmit(forms.login, document.getElementById('login-error'), API.login);
  handleSubmit(forms.register, document.getElementById('register-error'), API.register);
})();
