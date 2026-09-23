/**
 * Hash router — SPA tĩnh nghiên cứu kiến trúc.
 * Không gọi IdP, không gửi form đăng nhập ra mạng.
 */
(function (global) {
  "use strict";

  function normalizeHash() {
    var h = global.location.hash || "";
    if (h.charAt(0) === "#") h = h.slice(1);
    if (!h) return "/";
    if (h.charAt(0) !== "/") h = "/" + h;
    if (h.length > 1 && h.charAt(h.length - 1) === "/") h = h.slice(0, -1);
    var q = h.indexOf("?");
    return q === -1 ? h : h.slice(0, q);
  }

  function compile(path) {
    var keys = [];
    var source = path.replace(/\/+$/, "") || "/";
    var re = new RegExp(
      "^" +
        source
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          .replace(/:(\w+)/g, function (_, k) {
            keys.push(k);
            return "([^/]+)";
          }) +
        "$"
    );
    return { re: re, keys: keys, path: path };
  }

  function createRouter(opts) {
    var compiled = (opts.routes || []).map(function (r) {
      var c = compile(r.path);
      return { path: r.path, name: r.name, re: c.re, keys: c.keys };
    });

    function match(raw) {
      for (var i = 0; i < compiled.length; i++) {
        var r = compiled[i];
        var m = raw.match(r.re);
        if (m) {
          var params = {};
          for (var k = 0; k < r.keys.length; k++) {
            params[r.keys[k]] = decodeURIComponent(m[k + 1]);
          }
          return { path: r.path, name: r.name, params: params, raw: raw };
        }
      }
      return { path: "/404", name: "not-found", params: {}, raw: raw };
    }

    function resolve() {
      var raw = normalizeHash();
      var found = match(raw);
      if (typeof opts.before === "function") {
        var redirect = opts.before(found);
        if (redirect && redirect !== raw) {
          global.location.hash = "#" + redirect;
          return;
        }
      }
      if (typeof opts.onChange === "function") opts.onChange(found);
    }

    global.addEventListener("hashchange", resolve);

    return {
      start: resolve,
      go: function (p) {
        global.location.hash = "#" + p;
      },
      path: normalizeHash,
    };
  }

  global.IOCRouter = { createRouter: createRouter, normalizeHash: normalizeHash };
})(window);
