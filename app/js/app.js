/**
 * BOOT — shell + đăng nhập demo.
 * Mật khẩu không lưu, không gửi. Không IdP. Không API nguồn.
 */
(function () {
  "use strict";

  var SESSION_KEY = "ioc1.boot.session";
  var root = document.getElementById("app");
  var router = null;
  var DATA = null;
  var HOME = null;
  var pop = null;
  var docBound = false;
  function closePop() {
    if (pop && pop.parentNode) pop.parentNode.removeChild(pop);
    pop = null;
  }

  var FALLBACK = {
    disclaimer: "DỮ LIỆU MẪU — bản nghiên cứu kiến trúc. Không kết nối SSO và không gọi API nguồn.",
    asOf: "2026-09-23T10:21:00+07:00",
    updatedLabel: "Cập nhật hôm nay · 23/09/2026",
    h1: "Đăng nhập hệ thống",
    shellH1: "Khung điều hành",
    org: "VĂN PHÒNG TRUNG ƯƠNG ĐẢNG",
    orgSub: "TRUNG TÂM GIÁM SÁT, ĐIỀU HÀNH THÔNG MINH",
    fields: {
      username: "Tên đăng nhập",
      usernamePh: "Nhập tên đăng nhập",
      password: "Mật khẩu",
      passwordPh: "Nhập mật khẩu",
      showPassword: "Hiện mật khẩu",
      hidePassword: "Ẩn mật khẩu",
      submit: "Đăng nhập",
      ssoDivider: "Hoặc đăng nhập với",
      sso: "Đăng nhập với SSO"
    },
    hint: "Phiên demo trên trình duyệt này. Mật khẩu không được gửi đi.",
    support: {
      help: "Hỗ trợ",
      cskh: "CSKH: 18008000 nhánh 7",
      email: "support_vts@viettel.com.vn",
      faq: "Câu hỏi thường gặp",
      hotline: "Hotline: 0985538080",
      mobile: "Hỗ trợ 18008000 (nhánh 7)"
    },
    topbar: {
      notifications: "Thông báo",
      noNotifications: "Không có thông báo",
      account: "Tài khoản",
      logout: "Đăng xuất"
    },
    nav: [],
    states: {
      loading: "Đang mở phiên demo…",
      empty: "Chưa có phiên. Nhập tên đăng nhập để vào khung.",
      closed: "Màn này chưa mở trong lượt BOOT.",
      errorUser: "Vui lòng nhập tên đăng nhập!",
      errorPass: "Vui lòng nhập mật khẩu!",
      errorSso: "Không kết nối SSO. Phiên demo chỉ lưu trên trình duyệt này."
    }
  };

  function esc(s) {
    var amp = "&" + "amp;";
    var lt = "&" + "lt;";
    var gt = "&" + "gt;";
    var quot = "&" + "quot;";
    return String(s == null ? "" : s)
      .replace(/&/g, amp)
      .replace(/</g, lt)
      .replace(/>/g, gt)
      .replace(/"/g, quot);
  }

  function session() {
    try {
      var o = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (!o || !o.username) return null;
      if (o.password || o.access_token || o.id_token || o.refresh_token) return null;
      return o;
    } catch (e) {
      return null;
    }
  }

  function setSession(profile) {
    var name = String((profile && profile.username) || "").trim();
    var row = {
      username: name,
      displayName: (profile && profile.displayName) || "Phiên demo",
      method: (profile && profile.method) || "local",
      signedInAt: new Date().toISOString()
    };
    if (row.method === "sso-demo") row.oauth2 = "mock";
    localStorage.setItem(SESSION_KEY, JSON.stringify(row));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function icon(id) {
    var p = {
      home: "M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z",
      ses: "M4 19V9m5 10V5m5 14v-7m5 7V8",
      ops: "M8 4h8v4H8zM6 8h12v12H6zM9 12h6M9 16h4",
      hdp: "M6 3v3M18 3v3M4 8h16M5 5h14v15H5z",
      res: "M6 3h9l4 4v14H6zM15 3v5h5",
      party: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 19c.6-2.6 2.8-4 5-4s4.4 1.4 5 4M14 15.2c1.6.2 3.2 1.2 4 3.3",
      mae: "M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z",
      mon: "M3 12h4l2-6 4 12 2-6h6",
      admin: "M12 8a2.4 2.4 0 1 0 0 4.8A2.4 2.4 0 0 0 12 8zm8.2 4.8-.9-1.5.5-1.7-1.6-1.1-1.6.4-1.6-.8-.4-1.6H11l-.4 1.6-1.6.8-1.6-.4-1.6 1.1.5 1.7L5 12.8 3.8 14l1.2 1.2-.5 1.7 1.6 1.1 1.6-.4 1.6.8.4 1.6h2.4l.4-1.6 1.6-.8 1.6.4 1.6-1.1-.5-1.7L20.2 14 19 12.8z"
    };
    var d = p[id] || p.home;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="' + d + '"/></svg>';
  }

  var ICONS = ["home", "ses", "ops", "hdp", "res", "party", "mae", "mon", "admin"];

  function navItems() {
    return (DATA && DATA.nav) || [];
  }

  function itemFor(raw) {
    var hash = raw === "/" ? "#/" : "#" + raw;
    var items = navItems();
    for (var i = 0; i < items.length; i++) {
      if (items[i].hash === hash) return items[i];
      if (items[i].code === "MAE" && (raw === "/nnmt" || raw === "/linked/mae-info")) return items[i];
      if (items[i].code === "ADMIN" && raw.indexOf("/admin/") === 0) return items[i];
    }
    return null;
  }

  function header(activeHash) {
    var s = session();
    var items = navItems();
    var links = items.map(function (n, i) {
      var cur = n.hash === activeHash || (n.code === "ADMIN" && activeHash.indexOf("#/admin/") === 0) || (n.code === "MAE" && (activeHash === "#/nnmt" || activeHash === "#/linked/mae-info"));
      return '<a href="' + esc(n.hash) + '" title="' + esc(n.label) + '"' + (cur ? ' aria-current="page"' : "") + ">" + icon(ICONS[i] || "home") + "</a>";
    }).join("");
    var mobile = items.map(function (n) {
      var cur = n.hash === activeHash;
      return '<a href="' + esc(n.hash) + '"' + (cur ? ' aria-current="page"' : "") + ">" + esc(n.label) + "</a>";
    }).join("");
    var tb = DATA.topbar;
    return (
      '<header class="top">' +
        '<div class="brand">' +
          '<img src="assets/logo_vptwd.png" alt="" width="46" height="32" />' +
          '<div><div class="t1">Văn phòng Trung ương Đảng</div><div class="t2">Trung tâm Giám sát, Điều hành Thông minh</div></div>' +
          '<button type="button" class="ham" id="ham" aria-label="Menu">☰</button>' +
        "</div>" +
        '<nav class="icons" aria-label="Điều hướng">' + links + "</nav>" +
        '<div class="red-end">' +
          '<button type="button" class="theme" data-theme-btn aria-label="Đổi giao diện"></button>' +
          '<button type="button" id="bell" aria-label="' + esc(tb.notifications) + '">🔔</button>' +
          '<button type="button" class="user" id="acc" aria-label="' + esc(tb.account) + '">👤</button>' +
        "</div>" +
      "</header>" +
      '<nav class="mobile-nav" id="mnav" hidden>' + mobile + "</nav>"
    );
  }

  function pageLogin(alertHtml) {
    var f = DATA.fields;
    var sup = DATA.support;
    return (
      '<div class="login-stage">' +
        '<button type="button" class="theme-fab" data-theme-btn aria-label="Đổi giao diện"></button>' +
        '<div class="login-body">' +
          '<img class="seal" src="assets/logo_vptwd.png" alt="Biểu trưng" width="84" height="58" />' +
          '<p class="login-org">' + esc(DATA.org) + "</p>" +
          '<p class="login-sub">' + esc(DATA.orgSub) + "</p>" +
          '<form class="login-card" id="login-form" action="javascript:void(0)" method="post" novalidate>' +
            "<h1>" + esc(DATA.h1) + "</h1>" +
            (alertHtml || "") +
            '<div class="field"><label for="username">' + esc(f.username) + ' <span class="req">*</span></label>' +
              '<input id="username" name="username" autocomplete="username" placeholder="' + esc(f.usernamePh) + '" /></div>' +
            '<div class="field"><label for="password">' + esc(f.password) + ' <span class="req">*</span></label>' +
              '<div class="pw"><input id="password" name="password" type="password" autocomplete="current-password" placeholder="' + esc(f.passwordPh) + '" />' +
              '<button type="button" id="pw-toggle" aria-label="' + esc(f.showPassword) + '">◉</button></div></div>' +
            '<button class="btn-login" type="submit" id="kc-login">' + esc(f.submit) + "</button>" +
            '<div class="divider">' + esc(f.ssoDivider) + "</div>" +
            '<button class="btn-sso" type="button" id="sso-btn">' + esc(f.sso) + "</button>" +
            '<p class="hint">' + esc(DATA.hint) + "</p>" +
          "</form>" +
        "</div>" +
        '<footer class="login-foot">' +
          "<span>" + esc(sup.help) + "</span>" +
          "<span>" + esc(sup.cskh) + "</span>" +
          "<span>" + esc(sup.email) + ' | <a href="#/login">' + esc(sup.faq) + "</a></span>" +
          "<span>" + esc(sup.hotline) + "</span>" +
        "</footer>" +
        '<p class="foot-m">' + esc(sup.mobile) + "</p>" +
      "</div>"
    );
  }

  function extIcon() {
    return '<svg class="ext" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M14 5h5v5M19 5l-8 8M10 6H6v12h12v-4"/></svg>';
  }

  function pageShell() {
    var H = HOME;
    if (!H || !H.cards) {
      return header("#/") + '<main class="shell"><p class="asof">' + esc((H && H.states && H.states.error) || "Không tải được tổng quan mẫu.") + "</p></main>";
    }
    var cards = H.cards.map(function (c) {
      var head =
        '<div class="ov-head"><span class="ov-ic">' + icon(c.id === "docs" ? "ops" : c.id === "hr" ? "party" : c.id === "mon" ? "mon" : c.id === "hdp" ? "hdp" : c.id === "mae" ? "mae" : c.id === "res" ? "res" : c.id === "party" ? "party" : "ses") + "</span><h2>" + esc(c.title) + "</h2>" +
        (c.href && c.kind !== "apps"
          ? '<span class="ov-go">' + extIcon() + "</span>"
          : c.href
            ? '<a class="ov-go" href="' + esc(c.href) + '" aria-label="Mở ' + esc(c.title) + '">' + extIcon() + "</a>"
            : "") +
        "</div>";
      var body = "";
      if (c.kind === "metric") {
        body = '<div class="ov-val ' + esc(c.tone || "") + '">' + (c.tone === "up" ? "▲ " : "") + esc(c.value) + "</div><p>" + esc(c.note) + "</p>";
      } else if (c.kind === "pair") {
        body = '<div class="ov-pair">' + c.pair.map(function (p) {
          return "<div><b>" + esc(p.value) + "</b><span>" + esc(p.label) + "</span></div>";
        }).join("") + "</div>";
      } else if (c.kind === "deltas") {
        body = '<div class="ov-pair">' + c.deltas.map(function (p) {
          return "<div><span>" + esc(p.label) + "</span><b>" + esc(p.value) + '</b><em>▼ ' + esc(p.delta) + "</em></div>";
        }).join("") + "</div>";
      } else if (c.kind === "links") {
        body = '<div class="ov-links">' + c.links.map(function (l) {
          return '<button type="button" class="ov-link" data-pop="' + esc(l.popup) + '"><span class="ov-ic">' + icon(l.id === "land" || l.id === "nnmt" ? "mae" : l.id === "political" || l.id === "party-body" ? "hdp" : "party") + "</span><strong>" + esc(l.label) + '</strong><small>Mở liên kết</small></button>';
        }).join("") + "</div>";
      } else if (c.kind === "apps") {
        body = '<div class="ov-apps">' + c.apps.map(function (a) {
          return '<a class="mon-link" href="' + esc(a.href) + '"><span class="ov-ic">' + icon("mon") + "</span><span>" + esc(a.label) + "</span></a>";
        }).join("") + "</div>";
      }
      var cls = "ov-card" + (c.accent ? " accent" : "");
      if (c.href && c.kind !== "apps") {
        return '<a class="' + cls + '" href="' + esc(c.href) + '">' + head + body + "</a>";
      }
      return '<article class="' + cls + '">' + head + body + "</article>";
    }).join("");
    return (
      header("#/") +
      '<main class="ov">' +
        "<h1>" + esc(H.h1) + "</h1>" +
        '<div class="ov-grid">' + cards + "</div>" +
      "</main>" +
      '<div class="dlg-mask" id="dlg" hidden><div class="dlg" role="dialog" aria-modal="true" aria-labelledby="dlg-title"><h2 id="dlg-title"></h2><p id="dlg-body"></p><button type="button" id="dlg-close">Đóng</button></div></div>'
    );
  }

  function pageClosed(found) {
    var item = itemFor(found.raw);
    var code = item ? item.code : "—";
    var label = item ? item.label : "Không có màn này";
    var hash = item ? item.hash : "#" + found.raw;
    var blurb = item ? item.blurb : DATA.states.closed;
    return (
      header(hash) +
      '<main class="shell">' +
        '<p class="kicker">' + esc(code) + "</p>" +
        "<h1>" + esc(label) + "</h1>" +
        '<p class="asof">' + esc(DATA.updatedLabel) + " · DỮ LIỆU MẪU</p>" +
        '<section class="closed-card">' +
          "<p>" + esc(DATA.states.closed) + "</p>" +
          "<p>" + esc(blurb) + "</p>" +
          '<p class="asof">Hash đích: ' + esc(hash) + "</p>" +
        "</section>" +
      "</main>"
    );
  }

  function methodLabel(s) {
    if (!s) return "";
    if (s.method === "sso-demo") return "SSO demo · " + s.username;
    return "Mật khẩu demo · " + s.username;
  }

  function viaLine() {
    var s = session();
    var base = DATA.shellNote || DATA.hint;
    if (!s) return base;
    return base + " " + methodLabel(s) + ".";
  }

  function b64url(bytes) {
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function makeChallenge() {
    var bytes = new Uint8Array(32);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
    var verifier = b64url(bytes);
    if (!(window.crypto && crypto.subtle && window.TextEncoder)) {
      return Promise.resolve(b64url(bytes));
    }
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)).then(function (buf) {
      return b64url(new Uint8Array(buf));
    });
  }

  function pageSso() {
    var sso = DATA.sso || {};
    var people = sso.identities || [];
    var rows = people.map(function (p, i) {
      var letter = esc((p.displayName || "?").charAt(0));
      return (
        '<button type="button" class="idn" data-idn="' + i + '">' +
          '<span class="av" aria-hidden="true">' + letter + "</span>" +
          "<span><strong>" + esc(p.displayName) + "</strong><small>" + esc(p.unit) + "</small></span>" +
        "</button>"
      );
    }).join("");
    return (
      '<div class="sso-mask" id="sso-mask">' +
        '<div class="sso-panel" role="dialog" aria-modal="true" aria-labelledby="sso-title">' +
          '<p class="kicker">PKCE S256</p>' +
          '<h2 id="sso-title">' + esc(sso.title || "Đăng nhập với SSO") + "</h2>" +
          "<p>" + esc(sso.subtitle || "") + "</p>" +
          '<p class="pkce" id="pkce-line">Đang tạo code_challenge…</p>' +
          '<p class="pkce">' + esc(sso.issuerEmpty || "Issuer lab: trống") + "</p>" +
          '<p class="pick">' + esc(sso.pick || "Chọn danh tính demo") + "</p>" +
          '<div class="idn-list">' + rows + "</div>" +
          '<button type="button" class="btn-sso" id="sso-cancel">' + esc(sso.cancel || "Quay lại") + "</button>" +
        "</div>" +
      "</div>"
    );
  }

  function openSso() {
    root.innerHTML = pageLogin("") + pageSso();
    bindLogin();
    var sso = DATA.sso || {};
    document.getElementById("sso-cancel").addEventListener("click", function () {
      root.innerHTML = pageLogin("");
      bindLogin();
    });
    document.getElementById("sso-mask").addEventListener("click", function (e) {
      if (e.target.id !== "sso-mask") return;
      root.innerHTML = pageLogin("");
      bindLogin();
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-idn]"), function (btn) {
      btn.addEventListener("click", function () {
        var person = (sso.identities || [])[Number(btn.getAttribute("data-idn"))];
        if (!person) return;
        var line = document.getElementById("pkce-line");
        if (line) line.textContent = DATA.states.loading;
        window.setTimeout(function () {
          setSession({
            username: person.username,
            displayName: person.displayName,
            method: "sso-demo"
          });
          router.go("/");
        }, 280);
      });
    });
    makeChallenge().then(function (ch) {
      var line = document.getElementById("pkce-line");
      if (!line || !ch) return;
      line.textContent = "code_challenge · " + ch.slice(0, 22) + "…";
    });
  }

  function themeMode() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function themeIcon(mode) {
    if (mode === "dark") {
      return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path fill="none" stroke="currentColor" stroke-width="1.8" d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z"/></svg>';
  }

  function paintThemeButtons() {
    var mode = themeMode();
    var label = mode === "dark" ? "Chuyển giao diện sáng" : "Chuyển giao diện tối";
    Array.prototype.forEach.call(document.querySelectorAll("[data-theme-btn]"), function (btn) {
      btn.innerHTML = themeIcon(mode);
      btn.setAttribute("aria-label", label);
    });
  }

  function bindTheme() {
    paintThemeButtons();
    Array.prototype.forEach.call(document.querySelectorAll("[data-theme-btn]"), function (btn) {
      btn.addEventListener("click", function () {
        var next = themeMode() === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        try { localStorage.setItem("ioc1.theme", next); } catch (e) {}
        paintThemeButtons();
      });
    });
  }

  function bindLogin() {
    var form = document.getElementById("login-form");
    var notice = function (msg) {
      var user = document.getElementById("username").value;
      root.innerHTML = pageLogin('<div class="alert" role="alert">' + esc(msg) + "</div>");
      bindLogin();
      if (user) document.getElementById("username").value = user;
    };
    document.getElementById("pw-toggle").addEventListener("click", function () {
      var input = document.getElementById("password");
      var btn = document.getElementById("pw-toggle");
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-label", show ? DATA.fields.hidePassword : DATA.fields.showPassword);
    });
    document.getElementById("sso-btn").addEventListener("click", function () {
      openSso();
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var userEl = document.getElementById("username");
      var passEl = document.getElementById("password");
      var user = userEl.value.trim();
      var pass = passEl.value;
      passEl.value = "";
      if (!user) { notice(DATA.states.errorUser); return; }
      if (!pass) { notice(DATA.states.errorPass); return; }
      root.innerHTML = pageLogin('<div class="alert" role="status">' + esc(DATA.states.loading) + "</div>");
      window.setTimeout(function () {
        setSession({ username: user, displayName: "Phiên demo", method: "local" });
        router.go("/");
      }, 280);
    });
    bindTheme();
  }

  function bindShell() {
    var ham = document.getElementById("ham");
    var mnav = document.getElementById("mnav");
    if (ham && mnav) {
      ham.addEventListener("click", function () {
        var open = mnav.hasAttribute("hidden");
        if (open) mnav.removeAttribute("hidden");
        else mnav.setAttribute("hidden", "");
        ham.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
    function openPop(anchor, html) {
      closePop();
      pop = document.createElement("div");
      pop.className = "menu";
      pop.innerHTML = html;
      document.body.appendChild(pop);
      var r = anchor.getBoundingClientRect();
      pop.style.top = (r.bottom + 8) + "px";
      pop.style.left = Math.max(8, r.right - pop.offsetWidth) + "px";
    }
    document.getElementById("bell").addEventListener("click", function (e) {
      e.stopPropagation();
      openPop(e.currentTarget, "<p>" + esc(DATA.topbar.noNotifications) + "</p>");
    });
    document.getElementById("acc").addEventListener("click", function (e) {
      e.stopPropagation();
      var s = session();
      openPop(
        e.currentTarget,
        "<p>" + esc(s ? s.displayName : "") + "</p>" +
        "<p>" + esc(methodLabel(s)) + "</p>" +
        '<button type="button" class="menu-item" id="logout">' + esc(DATA.topbar.logout) + "</button>"
      );
      document.getElementById("logout").addEventListener("click", function () {
        clearSession();
        closePop();
        router.go("/login");
      });
    });
    if (!docBound) {
      docBound = true;
      document.addEventListener("click", onDocClick);
    }
    Array.prototype.forEach.call(document.querySelectorAll("[data-pop]"), function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var id = btn.getAttribute("data-pop");
        var pop = (HOME && HOME.popups && HOME.popups[id]) || { title: "Liên kết", body: "Hệ thống này chưa được cấu hình đúng. Vui lòng liên hệ quản trị viên." };
        document.getElementById("dlg-title").textContent = pop.title;
        document.getElementById("dlg-body").textContent = pop.body;
        document.getElementById("dlg").hidden = false;
      });
    });
    var dlg = document.getElementById("dlg");
    var close = document.getElementById("dlg-close");
    if (dlg && close) {
      close.addEventListener("click", function () { dlg.hidden = true; });
      dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.hidden = true; });
    }
    bindTheme();
  }

  function onDocClick() {
    closePop();
  }

  function render(found) {
    var authed = !!session();
    if (found.name === "login") {
      root.innerHTML = pageLogin("");
      bindLogin();
      return;
    }
    if (!authed) {
      router.go("/login");
      return;
    }
    if (found.name === "shell") root.innerHTML = pageShell();
    else root.innerHTML = pageClosed(found);
    bindShell();
  }

  function start() {
    router = window.IOCRouter.createRouter({
      routes: [
        { path: "/login", name: "login" },
        { path: "/", name: "shell" },
        { path: "/socio-economic", name: "closed" },
        { path: "/operation-management", name: "closed" },
        { path: "/hundred-day-plan", name: "closed" },
        { path: "/monitoring-resolution", name: "closed" },
        { path: "/party-building", name: "closed" },
        { path: "/nnmt", name: "closed" },
        { path: "/linked/mae-info", name: "closed" },
        { path: "/system-monitoring", name: "closed" },
        { path: "/admin/:slug", name: "closed" },
        { path: "/profile/profile-update", name: "closed" },
        { path: "/login-history", name: "closed" },
        { path: "/assessment-config", name: "closed" }
      ],
      before: function (found) {
        var authed = !!session();
        if (!authed && found.name !== "login") return "/login";
        if (authed && found.name === "login") return "/";
        return null;
      },
      onChange: render
    });
    if (!location.hash) location.hash = session() ? "#/" : "#/login";
    router.start();
  }

  function load() {
    var done = function (data) {
      DATA = data || FALLBACK;
      if (!DATA.nav || !DATA.nav.length) DATA.nav = FALLBACK.nav;
      start();
    };
    if (!window.fetch) { done(FALLBACK); return; }
    fetch("data/mock/boot.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        return fetch("data/mock/home.json", { cache: "no-store" })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (home) { return { boot: data, home: home }; });
      })
      .then(function (pack) {
        HOME = pack.home;
        done(pack.boot || FALLBACK);
      })
      .catch(function () { done(FALLBACK); });
  }

  load();
})();
