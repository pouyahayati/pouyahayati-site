/*
 * Booking widget: a small weekday calendar that opens the Cal.com booking page on the picked day.
 * Config on the element: data-cal-link (username/event), data-notice-days (business days), data-weeks.
 * Real availability, time slots and time zones are handled by Cal.com.
 */
(function () {
  "use strict";
  var box = document.querySelector(".booking");
  if (!box) return;

  var link = box.getAttribute("data-cal-link");
  var notice = parseInt(box.getAttribute("data-notice-days") || "2", 10);
  var weeks = parseInt(box.getAttribute("data-weeks") || "3", 10);
  var grid = box.querySelector(".booking-days");
  var monthEl = box.querySelector(".booking-month");
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function isWeekday(d) { var w = d.getDay(); return w !== 0 && w !== 6; }

  var today = new Date(); today.setHours(0, 0, 0, 0);

  // first bookable day: N business days after today
  var first = new Date(today), count = 0;
  while (count < notice) { first.setDate(first.getDate() + 1); if (isWeekday(first)) count++; }

  // grid starts on the Monday of the first bookable week (no wasted past row)
  var start = new Date(first);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

  DAYS.forEach(function (d) {
    var h = document.createElement("span");
    h.className = "booking-dow"; h.textContent = d; h.setAttribute("aria-hidden", "true");
    grid.appendChild(h);
  });

  var months = {};
  for (var i = 0; i < weeks * 7; i++) {
    var d = new Date(start); d.setDate(start.getDate() + i);
    if (!isWeekday(d)) continue;
    var open = d >= first;
    var el = document.createElement(open ? "a" : "span");
    el.className = "booking-day" + (open ? " is-open" : "") + (d.getTime() === first.getTime() ? " is-first" : "");
    el.textContent = d.getDate();
    el.setAttribute("role", "listitem");
    if (open) {
      months[MONTHS[d.getMonth()] + " " + d.getFullYear()] = true;
      el.href = "https://cal.com/" + link + "?date=" + iso(d) + "&month=" + iso(d).slice(0, 7);
      el.target = "_blank"; el.rel = "noopener";
      el.setAttribute("aria-label", "Book a call on " + d.toDateString());
    } else {
      el.setAttribute("aria-hidden", "true");
    }
    grid.appendChild(el);
  }
  monthEl.textContent = Object.keys(months).join(" / ");
})();
