const STORAGE_KEY = 'falloutCompanionUsers';
const SESSION_KEY = 'falloutCompanionSession';

function getUsers() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function setUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function setSession(user) {
  if (!user) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email }));
}

function getSessionUser() {
  const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  if (!session) {
    return null;
  }

  return getUsers().find((entry) => entry.email === session.email) || null;
}

function routeIfProtected() {
  const requiresAuth = document.body.dataset.requiresAuth === 'true';
  const user = getSessionUser();

  if (requiresAuth && !user) {
    window.location.href = '/auth.html';
    return null;
  }

  return user;
}

function toggleAuthState(user) {
  const scopedElements = document.querySelectorAll('[data-auth-state] [data-when]');
  scopedElements.forEach((element) => {
    const shouldShow = element.dataset.when === (user ? 'user' : 'guest');
    element.classList.toggle('hidden', !shouldShow);
  });

  const userNameTarget = document.querySelector('[data-user-name]');
  if (userNameTarget && user) {
    userNameTarget.textContent = user.displayName;
  }
}

function renderFeedback(scope, text, isError = false) {
  const node = document.querySelector(`[data-feedback="${scope}"]`);
  if (!node) {
    return;
  }
  node.textContent = text;
  node.classList.toggle('error', isError);
}

function register(formData) {
  const displayName = String(formData.get('displayName') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  const users = getUsers();
  if (users.some((entry) => entry.email === email)) {
    throw new Error('An account with this email already exists.');
  }

  const user = { displayName, email, password };
  users.push(user);
  setUsers(users);
  setSession(user);
  return user;
}

function login(formData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  const user = getUsers().find((entry) => entry.email === email && entry.password === password);
  if (!user) {
    throw new Error('Incorrect email or password.');
  }

  setSession(user);
  return user;
}

function bindAuthForms() {
  document.querySelectorAll('[data-auth-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const mode = form.dataset.authForm;

      try {
        if (mode === 'register') {
          register(formData);
          renderFeedback('register', 'Account created. Redirecting to dashboard...');
        }

        if (mode === 'login') {
          login(formData);
          renderFeedback('login', 'Login successful. Redirecting to dashboard...');
        }

        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 450);
      } catch (error) {
        renderFeedback(mode, error.message, true);
      }
    });
  });
}

function bindLogout() {
  document.querySelectorAll('[data-logout]').forEach((button) => {
    button.addEventListener('click', () => {
      setSession(null);
      window.location.href = '/index.html';
    });
  });
}

function init() {
  const user = routeIfProtected();
  toggleAuthState(user);
  bindAuthForms();
  bindLogout();
}

init();
