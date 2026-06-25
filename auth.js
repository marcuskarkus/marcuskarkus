// =============================================================
// Login gate. Drop this on any page right after the supabase-js
// CDN <script> tag, before sync.js/topbar.js:
//     <script src="auth.js" defer></script>
// If there's no Supabase Auth session, blocks the page behind a
// full-screen email/password form. On success it reloads so every
// other script (sync.js, topbar.js, gym.html) starts fresh with a
// valid session already in place. Skips itself entirely when
// embedded in an iframe (e.g. the water tracker inside health.html)
// since the parent page already owns the session, shared via the
// same-origin localStorage.
// =============================================================
(function () {
  'use strict';

  const SUPABASE_URL = 'https://krsgxaoaasxmcbagepfo.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_UAhytH8pwhsla7nsuL1PyA_8yXFL1wo';

  const css = `
.sb-auth-overlay {
  position: fixed; inset: 0; z-index: 999;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  background: #050506;
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
}
.sb-auth-card {
  width: 100%; max-width: 320px;
  display: flex; flex-direction: column; gap: 12px;
}
.sb-auth-title {
  font-size: 15px; font-weight: 700; color: #FAFAFA;
  letter-spacing: 0.02em; margin-bottom: 4px; text-align: center;
}
.sb-auth-input {
  width: 100%; box-sizing: border-box;
  padding: 11px 13px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: #FAFAFA; font-size: 14px; font-family: inherit;
}
.sb-auth-input:focus { outline: none; border-color: rgba(125, 211, 252, 0.4); }
.sb-auth-submit {
  padding: 11px 13px;
  border: 1px solid rgba(125, 211, 252, 0.16);
  background: linear-gradient(180deg, rgba(125, 211, 252, 0.28), rgba(110, 231, 183, 0.28));
  color: #FFFFFF; font-size: 14px; font-weight: 700; font-family: inherit;
  border-radius: 10px; cursor: pointer;
}
.sb-auth-submit:disabled { opacity: 0.6; cursor: default; }
.sb-auth-error {
  font-size: 12.5px; color: #ff8a8a; text-align: center;
}
.sb-signout-btn {
  position: fixed; z-index: 41;
  top: max(10px, env(safe-area-inset-top)); left: 14px;
  padding: 6px 11px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.55);
  font-size: 11px; font-family: inherit;
  cursor: pointer;
}
`;

  function isEmbedded() {
    try { return window.self !== window.top; } catch (e) { return true; }
  }

  function injectStyle() {
    if (document.getElementById('sb-auth-style')) return;
    const style = document.createElement('style');
    style.id = 'sb-auth-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function buildOverlay(supa) {
    const overlay = document.createElement('div');
    overlay.className = 'sb-auth-overlay';
    overlay.innerHTML =
      '<form class="sb-auth-card" id="sbAuthForm">' +
        '<div class="sb-auth-title">Sign in</div>' +
        '<input type="email" id="sbAuthEmail" class="sb-auth-input" placeholder="Email" autocomplete="username" required />' +
        '<input type="password" id="sbAuthPassword" class="sb-auth-input" placeholder="Password" autocomplete="current-password" required />' +
        '<button type="submit" class="sb-auth-submit">Sign in</button>' +
        '<div class="sb-auth-error" id="sbAuthError" hidden></div>' +
      '</form>';
    document.body.appendChild(overlay);

    const form = overlay.querySelector('#sbAuthForm');
    const errEl = overlay.querySelector('#sbAuthError');
    const submitBtn = overlay.querySelector('.sb-auth-submit');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errEl.hidden = true;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in…';
      const email = overlay.querySelector('#sbAuthEmail').value.trim();
      const password = overlay.querySelector('#sbAuthPassword').value;
      const { error } = await supa.auth.signInWithPassword({ email, password });
      if (error) {
        errEl.textContent = error.message || 'Sign-in failed.';
        errEl.hidden = false;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign in';
        return;
      }
      window.location.reload();
    });
  }

  function buildSignOutButton(supa) {
    if (document.getElementById('sbSignOutBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'sbSignOutBtn';
    btn.type = 'button';
    btn.className = 'sb-signout-btn';
    btn.textContent = 'Sign out';
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try { await supa.auth.signOut(); } catch (e) {}
      window.location.reload();
    });
    document.body.appendChild(btn);
  }

  async function boot() {
    if (isEmbedded()) return;
    if (!window.supabase) return;
    injectStyle();
    const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data } = await supa.auth.getSession();
    if (data && data.session) {
      buildSignOutButton(supa);
    } else {
      buildOverlay(supa);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
