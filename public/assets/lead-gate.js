/*
 * Lead gate: one shared download form for every blog post.
 *
 * Usage in a post (no other code needed):
 *   <link rel="stylesheet" href="/assets/lead-gate.css">
 *   <div data-lead-gate
 *        data-file="/downloads/SEO-KPI-Scorecard.xlsx"
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

  var ENDPOINT = "https://formsubmit.co/ajax/contact@pouyahayati.com";
  var STORE_KEY = "ph_lead_v1";
  var ROLES = [
    "Business owner / founder",
    "Marketing manager",
    "In-house SEO",
    "Agency or freelancer",
    "Recruiter / hiring manager",
    "Other"
  ];
  var PRIVACY = 'No spam. I\'ll only email you about this download and related guides. See the <a href="/privacy/" target="_blank" rel="noopener">Privacy Policy</a>.';

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
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      role: profile.role,
      resource: resource,
      page: location.href,
      visitor: isReturning ? "returning" : "new",
      _subject: (isReturning ? "Download (returning): " : "New lead: ") + resource,
      _template: "table",
      _captcha: "false"
    };
    return fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(data),
      keepalive: true
    }).catch(function () {});
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
        '<div class="lf-row">' +
          '<label for="' + uid + '-fn"><span>First name</span><input id="' + uid + '-fn" name="first_name" type="text" autocomplete="given-name" required></label>' +
          '<label for="' + uid + '-ln"><span>Last name</span><input id="' + uid + '-ln" name="last_name" type="text" autocomplete="family-name" required></label>' +
        '</div>' +
        '<label for="' + uid + '-em"><span>Work email</span><input id="' + uid + '-em" name="email" type="email" autocomplete="email" required></label>' +
        '<label for="' + uid + '-ro"><span>Your role</span><select id="' + uid + '-ro" name="role" required><option value="" selected disabled>Choose one</option>' + opts + '</select></label>' +
        '<input type="text" name="_honey" class="lf-hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<button class="btn lf-btn" type="submit">' + esc(cfg.button) + ' ↓</button>' +
        '<p class="lf-msg" role="status" aria-live="polite"></p>' +
        '<p class="fine lf-fine">' + (cfg.note ? esc(cfg.note) + " · " : "") + PRIVACY + '</p>' +
      '</form>'
    );
  }

  function readyHTML(cfg, profile, message) {
    return (
      '<div class="lead-form lf-ready">' +
        '<p class="lf-msg" role="status" aria-live="polite">' + message + '</p>' +
        '<button class="btn lf-btn" type="button">' + esc(cfg.button) + ' ↓</button>' +
        '<p class="fine lf-fine">' + (cfg.note ? esc(cfg.note) + " · " : "") +
          'Not ' + esc(profile.first_name) + '? <a href="#" class="lf-reset">Use different details</a></p>' +
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

    function showForm() {
      el.innerHTML = formHTML(cfg, uid);
      var form = el.querySelector("form");
      var msg = el.querySelector(".lf-msg");
      var btn = el.querySelector(".lf-btn");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (form.elements._honey.value) return;
        var ok = true, first = null;
        ["first_name", "last_name", "email", "role"].forEach(function (k) {
          var f = form.elements[k], v = f.value.trim();
          var bad = !v || (k === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
          f.setAttribute("aria-invalid", bad ? "true" : "false");
          if (bad) { ok = false; if (!first) first = f; }
        });
        if (!ok) { msg.textContent = "Please fill in all four fields with a valid email."; first.focus(); return; }
        var profile = {
          first_name: form.elements.first_name.value.trim(),
          last_name: form.elements.last_name.value.trim(),
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
