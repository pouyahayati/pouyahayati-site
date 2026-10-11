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
    ".cc{position:fixed;left:0;right:0;bottom:0;z-index:9999;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 20px;padding:10px var(--gutter,20px);background:rgba(250,250,250,.82);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-top:1px solid var(--line,#E0E0E0);color:var(--ink,#111);font:500 .82rem/1.4 var(--font-body,system-ui,sans-serif)}" +
    ".cc p{margin:0;color:var(--ink-soft,#555)}.cc a{color:var(--ink,#111);text-decoration:underline;text-underline-offset:2px}" +
    ".cc-row{display:flex;gap:8px}" +
    ".cc button{min-height:34px;padding:6px 16px;font:600 .8rem/1 var(--font-body,system-ui,sans-serif);color:var(--ink,#111);background:transparent;border:1.5px solid var(--ink,#111);border-radius:999px;cursor:pointer;transition:background .15s,color .15s}" +
    ".cc button:hover,.cc button:focus-visible{background:var(--ink,#111);color:#FAFAFA}" +
    "@media(max-width:560px){.cc{padding-block:12px}.cc-row{width:100%}.cc button{flex:1}}";
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
      "<p>Analytics cookies stay off unless you accept. " +
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
