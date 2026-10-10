/*
 * Lead gate: one shared download form for every blog post.
 *
 * Usage in a post (no other code needed):
 *   <link rel="stylesheet" href="/assets/lead-gate.css">
 *   <div data-lead-gate
 *        data-file="/downloads/seo-report-template-q7m2x9.xlsx"
 *        data-resource="SEO KPI Scorecard"
 *        data-button="Get the scorecard"
 *        data-note=".xlsx · works in Google Sheets"></div>
 *   <script src="/assets/lead-gate.js" defer></script>
 *
 * Every submission lands in ONE inbox, tagged with the resource name and page URL.
 * A visitor fills the form once; on any other post they just click download
 * (the download is still logged with their details).
 * To move submissions somewhere else (Sheet, CRM, Cloudflare D1), change ENDPOINT only.
 */
(function () {
  "use strict";

  var ENDPOINT = "https://formsubmit.co/ajax/34b5094d6b7499fca0896f5241bab8aa";
  var STORE_KEY = "ph_lead_v1";
  var ROLES = [
    "Business owner / founder",
    "Marketing manager",
    "In-house SEO",
    "Agency or freelancer",
    "Recruiter / hiring manager",
    "Other"
  ];
  var PRIVACY = 'No spam. <a href="/privacy/" target="_blank" rel="noopener">Privacy</a>';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function load() {
    try { var v = JSON.parse(localStorage.getItem(STORE_KEY) || "null"); return v && v.email ? v : null; }
    catch (e) { return null; }
  }
  function save(p) { try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) {} }
  function forget() { try { localStorage.removeItem(STORE_KEY); } catch (e) {} }

  function send(profile, resource, isReturning) {
    var data = {
      name: profile.name || ((profile.first_name || "") + " " + (profile.last_name || "")).trim(),
      email: profile.email,
      role: profile.role,
      resource: resource,
      page: location.href,
      visitor: isReturning ? "returning" : "new",
      _subject: (isReturning ? "Download (returning): " : "New lead: ") + resource,
      _template: "table",
      _captcha: "false",
      _honey: ""
    };
    return fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(data),
      keepalive: true
    }).catch(function () {});
  }

  // Max 3 new submissions per browser per hour
  function tooMany() {
    try {
      var now = Date.now(), k = "ph_lead_tries";
      var t = JSON.parse(localStorage.getItem(k) || "[]").filter(function (x) { return now - x < 3600000; });
      if (t.length >= 3) return true;
      t.push(now); localStorage.setItem(k, JSON.stringify(t));
    } catch (e) {}
    return false;
  }

  function download(file) {
    var a = document.createElement("a");
    a.href = file;
    a.download = file.split("/").pop();
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function formHTML(cfg, uid) {
    var opts = ROLES.map(function (r) { return "<option>" + esc(r) + "</option>"; }).join("");
    return (
      '<form class="lead-form" novalidate>' +
        '<div class="lf-grid">' +
          '<label for="' + uid + '-nm"><span class="lf-sr">Full name</span><input id="' + uid + '-nm" name="full_name" type="text" placeholder="Full name" autocomplete="name" required></label>' +
          '<label for="' + uid + '-em"><span class="lf-sr">Email</span><input id="' + uid + '-em" name="email" type="email" placeholder="Email" autocomplete="email" required></label>' +
          '<label for="' + uid + '-ro"><span class="lf-sr">Your role</span><select id="' + uid + '-ro" name="role" required><option value="" selected disabled>Your role</option>' + opts + '</select></label>' +
        '</div>' +
        '<input type="text" name="_honey" class="lf-hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<div class="lf-foot"><button class="btn lf-btn" type="submit">' + esc(cfg.button) + ' \u2193</button>' +
        '<p class="fine lf-fine">' + PRIVACY + '</p></div>' +
        '<p class="lf-msg" role="status" aria-live="polite"></p>' +
      '</form>'
    );
  }

  function readyHTML(cfg, profile, message) {
    return (
      '<div class="lead-form lf-ready">' +
        '<p class="lf-msg" role="status" aria-live="polite">' + message + '</p>' +
        '<button class="btn lf-btn" type="button">' + esc(cfg.button) + ' ↓</button>' +
        '<p class="fine lf-fine">Not ' + esc(profile.first_name) + '? <a href="#" class="lf-reset">Change details</a></p>' +
      '</div>'
    );
  }

  function mount(el, n) {
    var cfg = {
      file: el.getAttribute("data-file"),
      resource: el.getAttribute("data-resource") || document.title,
      button: el.getAttribute("data-button") || "Download",
      note: el.getAttribute("data-note") || ""
    };
    var uid = "lg" + n;
    var shownAt = 0;
    var logged = false;

    function showReady(profile, message) {
      el.innerHTML = readyHTML(cfg, profile, message);
      el.querySelector(".lf-btn").addEventListener("click", function () {
        if (!logged) { send(profile, cfg.resource, true); logged = true; }
        download(cfg.file);
      });
      el.querySelector(".lf-reset").addEventListener("click", function (e) {
        e.preventDefault(); forget(); showForm();
      });
    }

    function fakeSuccess() {
      el.innerHTML = '<div class="lead-form lf-ready"><p class="lf-msg" role="status">Thanks! Check your downloads.</p></div>';
    }

    function showForm() {
      el.innerHTML = formHTML(cfg, uid);
      shownAt = Date.now();
      var form = el.querySelector("form");
      var msg = el.querySelector(".lf-msg");
      var btn = el.querySelector(".lf-btn");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        // Bots: hidden field filled, or the form submitted faster than a human can type
        if (form.elements._honey.value || Date.now() - shownAt < 3000) { fakeSuccess(); return; }
        if (tooMany()) { msg.textContent = "Too many attempts. Please try again in an hour."; return; }
        var ok = true, first = null;
        ["full_name", "email", "role"].forEach(function (k) {
          var f = form.elements[k], v = f.value.trim();
          var bad = !v || (k === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
          f.setAttribute("aria-invalid", bad ? "true" : "false");
          if (bad) { ok = false; if (!first) first = f; }
        });
        if (!ok) { msg.textContent = "Please fill in all three fields with a valid email."; first.focus(); return; }
        var profile = {
          name: form.elements.full_name.value.trim(),
          first_name: form.elements.full_name.value.trim().split(/\s+/)[0],
          email: form.elements.email.value.trim(),
          role: form.elements.role.value
        };
        btn.disabled = true; btn.textContent = "Sending…"; msg.textContent = "";
        send(profile, cfg.resource, false).then(function () {
          save(profile); logged = true;
          download(cfg.file);
          showReady(profile, "Done. Your download has started. Didn’t start? Click below.");
        });
      });
    }

    var profile = load();
    if (profile) showReady(profile, "Welcome back, " + esc(profile.first_name) + ". Your file is ready.");
    else showForm();
  }

  function init() {
    var els = document.querySelectorAll("[data-lead-gate]");
    for (var i = 0; i < els.length; i++) mount(els[i], i);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
