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

  // Growth charts: an area + line from the start to the end figure, on a zero baseline
  var SVG = 'http://www.w3.org/2000/svg';
  var chartId = 0;
  document.querySelectorAll('.chart[data-to]').forEach(function (fig) {
    var to = Number(fig.dataset.to);
    var hasFrom = fig.dataset.from !== undefined;
    // no reported start figure: begin near the baseline, unlabeled
    var from = hasFrom ? Number(fig.dataset.from) : to * 0.12;
    var months = Number(fig.dataset.months);
    var max = to * 1.08;
    var steps = 32;
    var pts = [];
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      // eased ramp: slow start, steady climb, gentle plateau
      var e = 0.35 * t + 0.65 * (t * t * (3 - 2 * t));
      pts.push([t * 100, 100 - ((from + (to - from) * e) / max) * 100]);
    }
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2); }).join(' ');
    var gid = 'chart-fill-' + (++chartId);

    var plot = document.createElement('div');
    plot.className = 'chart-plot';
    var svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML =
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#FF6B35" stop-opacity=".22"/><stop offset="1" stop-color="#FF6B35" stop-opacity="0"/>' +
      '</linearGradient></defs>' +
      '<path d="' + line + ' L100 100 L0 100 Z" fill="url(#' + gid + ')"/>' +
      '<line class="chart-base" x1="0" y1="100" x2="100" y2="100" vector-effect="non-scaling-stroke"/>' +
      '<path class="chart-line" d="' + line + '" vector-effect="non-scaling-stroke"/>';
    plot.appendChild(svg);

    // dots and the start label are HTML so they stay round and crisp at any width
    [[pts[0], 'is-start'], [pts[steps], 'is-end']].forEach(function (d) {
      var dot = document.createElement('span');
      dot.className = 'chart-dot ' + d[1];
      dot.style.left = d[0][0] + '%';
      dot.style.top = d[0][1] + '%';
      plot.appendChild(dot);
    });
    if (hasFrom) {
      var start = document.createElement('span');
      start.className = 'chart-start';
      start.style.top = pts[0][1] + '%';
      start.textContent = fig.dataset.fromLabel;
      plot.appendChild(start);
    }

    var axis = document.createElement('div');
    axis.className = 'chart-axis';
    axis.setAttribute('aria-hidden', 'true');
    axis.innerHTML = '<span>Start</span><span>Month ' + months + '</span>';

    fig.appendChild(plot);
    fig.appendChild(axis);
  });

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
