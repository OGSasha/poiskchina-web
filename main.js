/* POISKCHINA — navigation, contextual inquiry and accessible interactions */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');

  function onScroll() {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    if (!nav || !toggle) return;
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Открыть меню');
  }

  if (nav && toggle && links) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    });
    links.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });
  }

  /* Reveal is progressive enhancement: content remains visible without JS. */
  var revealEls = document.querySelectorAll('.reveal');
  if (!reducedMotion && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* Accessible anchor scrolling. */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (event) {
      var id = anchor.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      if (id === '#inquiry-form') {
        window.setTimeout(function () {
          var firstInput = target.querySelector('input[name="name"]');
          if (firstInput) firstInput.focus({ preventScroll: true });
        }, reducedMotion ? 0 : 650);
      }
    });
  });

  /* Contextual CTA preselects the relevant request type. */
  var serviceSelect = document.getElementById('serviceSelect');
  document.querySelectorAll('[data-service]').forEach(function (cta) {
    cta.addEventListener('click', function () {
      if (!serviceSelect) return;
      var value = cta.getAttribute('data-service');
      var exists = Array.prototype.some.call(serviceSelect.options, function (option) {
        return option.value === value || option.text === value;
      });
      if (exists) serviceSelect.value = value;
      else if (value) serviceSelect.value = 'Другая задача';
    });
  });

  /* Static-site inquiry: prepare a real email or WhatsApp message; never fake success. */
  var form = document.getElementById('inquiry-form');
  var whatsappButton = document.getElementById('whatsappSubmit');
  var formStatus = document.getElementById('formStatus');

  function formIsValid() {
    if (!form) return false;
    if (!form.checkValidity()) {
      form.reportValidity();
      return false;
    }
    return true;
  }

  function buildMessage() {
    var data = new FormData(form);
    var lines = [
      'Здравствуйте! Хочу получить расчёт проекта POISKCHINA.',
      '',
      'Имя: ' + (data.get('name') || '—'),
      'Контакт для ответа: ' + (data.get('contact') || '—'),
      'Тип задачи: ' + (data.get('service') || '—'),
      'О заказе: ' + (data.get('message') || 'Не указано'),
      '',
      'Прошу связаться со мной для уточнения объёма работ, сроков и сметы.'
    ];
    return lines.join('\n');
  }

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!formIsValid()) return;
      var subject = 'Запрос на расчёт проекта — POISKCHINA';
      var href = 'mailto:info@poiskchina.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(buildMessage());
      if (formStatus) formStatus.textContent = 'Запрос подготовлен. Откроется почтовое приложение — проверьте текст и подтвердите отправку.';
      window.location.href = href;
    });
  }

  if (whatsappButton && form) {
    whatsappButton.addEventListener('click', function () {
      if (!formIsValid()) return;
      var href = 'https://wa.me/79819588868?text=' + encodeURIComponent(buildMessage());
      if (formStatus) formStatus.textContent = 'Запрос подготовлен. В новой вкладке откроется WhatsApp — подтвердите отправку сообщения.';
      var popup = window.open(href, '_blank', 'noopener,noreferrer');
      if (popup) popup.opener = null;
    });
  }

  /* WeChat has no supplied ID: copy the published China director phone instead. */
  var toast = document.getElementById('copyToast');
  var toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove('show'); }, 3500);
  }

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  }

  document.querySelectorAll('[data-copy]').forEach(function (button) {
    button.addEventListener('click', function () {
      var text = button.getAttribute('data-copy') || '';
      var label = button.getAttribute('data-copy-label') || 'Скопировано';
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () {
          showToast(label);
        }).catch(function () {
          showToast(fallbackCopy(text) ? label : 'Скопируйте номер: ' + text);
        });
      } else {
        showToast(fallbackCopy(text) ? label : 'Скопируйте номер: ' + text);
      }
    });
  });

  /* Privacy policy dialog with keyboard-native <dialog> behaviour. */
  var privacyDialog = document.getElementById('privacyDialog');
  var privacyClose = document.getElementById('privacyClose');
  document.querySelectorAll('[data-open-privacy]').forEach(function (button) {
    button.addEventListener('click', function () {
      if (!privacyDialog) return;
      if (typeof privacyDialog.showModal === 'function') privacyDialog.showModal();
      else privacyDialog.setAttribute('open', '');
    });
  });
  if (privacyDialog) {
    if (privacyClose) privacyClose.addEventListener('click', function () { privacyDialog.close(); });
    privacyDialog.addEventListener('click', function (event) {
      if (event.target === privacyDialog) privacyDialog.close();
    });
  }

  /* Avoid covering the form with the mobile sticky CTA. */
  var mobileCta = document.querySelector('.mobile-cta');
  var contactSection = document.getElementById('contact');
  if (mobileCta && contactSection && 'IntersectionObserver' in window) {
    var contactObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        mobileCta.classList.toggle('is-hidden', entry.isIntersecting);
      });
    }, { threshold: 0.04 });
    contactObserver.observe(contactSection);
  }
})();
