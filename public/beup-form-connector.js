/* BEUP – connecteur de formulaires
 * Copie les demandes de vos formulaires de contact vers BEUP (prospects).
 * Votre formulaire n'est pas modifié : il continue de fonctionner exactement comme avant.
 *
 * - Pour exclure un formulaire : ajoutez l'attribut data-beup="ignore" sur sa balise <form>.
 * - Les formulaires contenant un mot de passe ou des données de paiement sont toujours ignorés.
 * - Une demande n'est transmise que si le formulaire contient un nom et un email ou un téléphone.
 */
(function () {
  'use strict';
  var script = document.currentScript;
  var endpoint = script && script.getAttribute('data-beup-endpoint');
  if (!endpoint || window.__beupFormConnector) { return; }
  window.__beupFormConnector = true;

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var FORM_BLOCK = /passw|pwd|mot.?de.?passe|cvv|cvc|iban|secret|card.?number|numero.?de.?carte|(^|[^a-z])(card|carte|otp)([^a-z]|$)/i;
  var SKIP_FIELD = /captcha|csrf|nonce|honeypot|_gotcha|g-recaptcha|(^|[^a-z])token([^a-z]|$)/i;
  var lastSignature = '';
  var lastTime = 0;

  function norm(value) {
    var s = String(value || '').toLowerCase();
    try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) { /* navigateur ancien */ }
    return s;
  }

  function labelOf(el) {
    var text = '';
    try {
      if (el.labels && el.labels.length) {
        text = el.labels[0].textContent;
      } else if (el.id && el.form) {
        var l = el.form.querySelector('label[for="' + String(el.id).replace(/"/g, '\\"') + '"]');
        if (l) { text = l.textContent; }
      }
    } catch (e) { /* ignore */ }
    return String(text || el.getAttribute('aria-label') || el.placeholder || '').replace(/\s+/g, ' ').trim();
  }

  function has(item, re) { return re.test(norm(item.key + ' ' + item.label)); }

  // Retourne la liste des champs remplis, ou null si le formulaire ne doit jamais être lu.
  function collect(form) {
    var items = [];
    var byKey = {};
    var els = form.elements;
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var tag = String(el.tagName || '').toUpperCase();
      var type = String(el.type || '').toLowerCase();
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') { continue; }
      if (type === 'password') { return null; }
      if (el.disabled) { continue; }
      if (['hidden', 'submit', 'button', 'reset', 'image', 'file'].indexOf(type) !== -1) { continue; }
      var key = String(el.name || el.id || '');
      var auto = String(el.getAttribute('autocomplete') || '').toLowerCase();
      if (/^cc-/.test(auto) || FORM_BLOCK.test(key + ' ' + auto)) { return null; }
      if (!key || SKIP_FIELD.test(key)) { continue; }
      var value = '';
      if (type === 'checkbox' || type === 'radio') {
        if (!el.checked) { continue; }
        value = el.value && el.value !== 'on' ? el.value : 'Oui';
      } else if (tag === 'SELECT' && el.multiple) {
        value = Array.prototype.filter.call(el.options, function (o) { return o.selected; })
          .map(function (o) { return o.text; }).join(', ');
      } else {
        value = el.value;
      }
      value = String(value == null ? '' : value).trim().slice(0, 4000);
      if (!value) { continue; }
      if (byKey[key]) { byKey[key].value += ', ' + value; continue; }
      var item = { key: key, label: labelOf(el), type: type, auto: auto, tag: tag, value: value };
      byKey[key] = item;
      items.push(item);
    }
    return items;
  }

  function build(items) {
    var name = [], email = '', phone = '', company = '', message = '';
    var used = {};
    var i, it, v;
    for (i = 0; i < items.length; i++) {
      it = items[i]; v = it.value;
      if (!email && (it.type === 'email' || it.auto === 'email' || has(it, /mail|courriel/)) && EMAIL_RE.test(v)) {
        email = v; used[i] = true; continue;
      }
      if (!phone && (it.type === 'tel' || it.auto === 'tel' || has(it, /(^|[^a-z])(tel|telephone|phone|mobile|portable|gsm)([^a-z]|$)/)) && v.replace(/\D/g, '').length >= 6) {
        phone = v; used[i] = true; continue;
      }
      if (!company && has(it, /(entreprise|societe|company|organisation|organization)/)) {
        company = v; used[i] = true; continue;
      }
      if (name.length < 2 && !EMAIL_RE.test(v) &&
          (/^(name|given-name|family-name|additional-name)$/.test(it.auto) ||
           has(it, /(^|[^a-z])(nom|prenom|name|fullname)([^a-z]|$)|first.?name|last.?name/))) {
        name.push(v); used[i] = true; continue;
      }
      if (!message && (it.tag === 'TEXTAREA' || has(it, /(message|demande|besoin|commentaire|comment|remarque|projet)/))) {
        message = v; used[i] = true; continue;
      }
    }
    // Tout ce qui n'a pas été reconnu (sujet, date souhaitée, budget…) est conservé dans le message.
    var extra = [];
    for (i = 0; i < items.length; i++) {
      if (!used[i]) { extra.push((items[i].label || items[i].key) + ' : ' + items[i].value); }
    }
    if (extra.length) { message = (message ? message + '\n\n' : '') + extra.join('\n'); }

    var fields = {};
    for (i = 0; i < items.length; i++) { fields[items[i].label || items[i].key] = items[i].value; }
    try { fields['Page du formulaire'] = location.origin + location.pathname; } catch (e) { /* ignore */ }

    var payload = { fields: fields };
    if (name.length) { payload.name = name.join(' '); }
    if (email) { payload.email = email; }
    if (phone) { payload.phone = phone; }
    if (company) { payload.company_name = company; }
    if (message) { payload.message = message.slice(0, 4000); }
    return payload;
  }

  function uuid() {
    try { if (window.crypto && window.crypto.randomUUID) { return window.crypto.randomUUID(); } } catch (e) { /* ignore */ }
    return 'c-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  }

  // Requête « simple » (text/plain) : pas de pré-vérification CORS, et elle survit au changement de page.
  function send(payload) {
    var body = JSON.stringify(payload);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(endpoint, new Blob([body], { type: 'text/plain;charset=utf-8' }))) { return; }
    } catch (e) { /* on essaie fetch */ }
    try {
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body, keepalive: true, credentials: 'omit' })
        .catch(function () { /* silencieux : ne jamais gêner le formulaire */ });
    } catch (e) { /* ignore */ }
  }

  function onSubmit(event) {
    try {
      var form = event.target;
      if (!form || String(form.tagName || '').toUpperCase() !== 'FORM') { return; }
      if (form.getAttribute('data-beup') === 'ignore') { return; }
      if (form.closest && form.closest('[data-beup="ignore"]')) { return; }
      var items = collect(form);
      if (!items || !items.length) { return; }
      var payload = build(items);
      if (!payload.name || (!payload.email && !payload.phone)) { return; }
      var signature = JSON.stringify([payload.name, payload.email, payload.phone, payload.message]);
      var now = Date.now();
      if (signature === lastSignature && now - lastTime < 10000) { return; }
      lastSignature = signature;
      lastTime = now;
      payload.submission_id = uuid();
      send(payload);
    } catch (e) { /* ne jamais bloquer l'envoi du formulaire */ }
  }

  // Phase de capture : on lit les valeurs avant que le site ne vide ou ne remplace le formulaire.
  document.addEventListener('submit', onSubmit, true);
})();
