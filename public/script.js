(function () {
  'use strict';

  // Footer year
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Header border once scrolled
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Scroll reveal
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // Contact form: validate + submit to Formspree via fetch (falls back to normal POST without JS)
  var form = document.querySelector('.contact-form');
  if (!form) return;

  var status = form.querySelector('.form-status');
  var button = form.querySelector('button[type="submit"]');
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setStatus(msg, type) {
    status.textContent = msg;
    status.className = 'form-status' + (type ? ' is-' + type : '');
  }

  function validate() {
    var firstInvalid = null;
    ['name', 'email', 'message'].forEach(function (id) {
      var field = form.elements[id];
      var value = field.value.trim();
      var ok = id === 'email' ? emailRe.test(value) : value.length > 0;
      field.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok && !firstInvalid) firstInvalid = field;
    });
    return firstInvalid;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var invalid = validate();
    if (invalid) {
      setStatus('Please fill in your name, a valid email, and a message.', 'error');
      invalid.focus();
      return;
    }

    button.disabled = true;
    setStatus('Sending…');

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    })
      .then(function (res) {
        if (res.ok) {
          form.reset();
          form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });
          setStatus('Thanks — your message is on its way. I’ll get back to you soon.', 'success');
          return;
        }
        // Formspree returns { errors: [{ message }] } on validation failures
        return res.json().catch(function () { return {}; }).then(function (data) {
          var detail = data && data.errors ? data.errors.map(function (err) { return err.message; }).join(', ') : '';
          throw new Error(detail);
        });
      })
      .catch(function (err) {
        var detail = err && err.message ? ' (' + err.message + ')' : '';
        setStatus('Something went wrong sending your message' + detail + '. Please email me at contact@pouyahayati.com instead.', 'error');
      })
      .then(function () {
        button.disabled = false;
      });
  });

  form.addEventListener('input', function (e) {
    if (e.target.getAttribute('aria-invalid') === 'true') e.target.removeAttribute('aria-invalid');
  });
})();
