# Blog components

## Download form (lead gate)

One shared form for every post. Files: `public/assets/lead-gate.js` and `public/assets/lead-gate.css`.

Add to a new post:

```html
<!-- in <head> -->
<link rel="stylesheet" href="/assets/lead-gate.css">
<script src="/assets/lead-gate.js" defer></script>

<!-- where the form should appear -->
<div data-lead-gate
     data-file="/downloads/YOUR-FILE.xlsx"
     data-resource="Name of the download"
     data-button="Get the checklist"
     data-note=".xlsx · works in Google Sheets"></div>
```

- Fields: first name, last name, work email, role. Edit the role list or the endpoint once in `lead-gate.js`.
- Every submission goes to contact@pouyahayati.com via FormSubmit (endpoint uses the private alias, not the email), tagged with the resource name and page URL.
- A visitor fills the form once. On any other post they see "Welcome back" and a download button; the download is still emailed as "Download (returning): ...".
- To send leads to a Google Sheet, CRM or Cloudflare D1 instead, change `ENDPOINT` in `lead-gate.js` only.
- The file itself is still reachable by direct URL; the form is a soft gate.
