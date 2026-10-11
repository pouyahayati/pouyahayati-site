/*
 * Cookie consent banner (Google Consent Mode v2). Analytics stays denied until the visitor accepts.
 * The default "denied" state is set by an inline snippet in <head> before GTM loads.
 * Any element with [data-cookie-settings] reopens the banner.
 */
(function () {
  "use strict";
  var KEY = "ph_consent";
  function gtag() { (window.dataLayer = window.dataLayer || []).push(arguments); }
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  var css = document.createElement("style");
  css.textContent =
    ".cc{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:560px;margin-inline:auto;padding:18px 20px;background:#0A0A0A;color:#FAFAFA;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,.35);font:500 .9rem/1.5 var(--font-body,system-ui,sans-serif)}" +
    ".cc p{margin:0 0 14px}.cc a{color:inherit;text-decoration:underline}" +
    ".cc-row{display:flex;gap:10px}" +
    ".cc button{flex:1;min-height:44px;padding:10px 16px;font:700 .9rem/1 var(--font-body,system-ui,sans-serif);color:#FAFAFA;background:transparent;border:2px solid #FAFAFA;border-radius:10px;cursor:pointer}" +
    ".cc button:hover,.cc button:focus-visible{background:#FAFAFA;color:#0A0A0A}" +
    ".cc-link{background:none;border:0;padding:0;color:inherit;font:inherit;text-decoration:underline;cursor:pointer}";
  document.head.appendChild(css);

  function apply(granted) {
    gtag("consent", "update", { analytics_storage: granted ? "granted" : "denied" });
  }

  function show() {
    if (document.querySelector(".cc")) return;
    var box = document.createElement("div");
    box.className = "cc";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Cookie consent");
    box.innerHTML =
      "<p>I use Google Analytics cookies to see which pages are useful. They stay off unless you accept. " +
      '<a href="/privacy/">Privacy policy</a></p>' +
      '<div class="cc-row"><button type="button" data-cc="denied">Reject</button><button type="button" data-cc="granted">Accept</button></div>';
    box.addEventListener("click", function (e) {
      var v = e.target.getAttribute && e.target.getAttribute("data-cc");
      if (!v) return;
      set(v); apply(v === "granted");
      box.remove();
    });
    document.body.appendChild(box);
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-cookie-settings]") : null;
    if (t) { e.preventDefault(); show(); }
  });

  if (!get()) show();
})();
