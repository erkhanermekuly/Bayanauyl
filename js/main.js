/*
 * Баянауыл — интерактив: навигация, появление блоков, сезоны, галерея
 * Автор: Ермекұлы Ерхан (github.com/erkhanermekuly)
 * © 2026 Ермекұлы Ерхан. Все права защищены — см. файл LICENSE.
 */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;

  /* ---------- Шапка, прогресс прокрутки, параллакс ---------- */
  const nav = $('.nav');
  const burger = $('.burger');
  const menu = $('#nav-menu');
  const progressBar = $('.progress__bar');
  const toTop = $('.to-top');
  const hero = $('.hero');
  const heroMedia = $('.hero__media');

  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    nav.classList.toggle('is-scrolled', y > 24);
    toTop.classList.toggle('is-visible', y > 900);
    progressBar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;

    if (!reduceMotion && hero && y < hero.offsetHeight) {
      heroMedia.style.transform = `translate3d(0, ${(y * 0.2).toFixed(1)}px, 0)`;
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ---------- Мобильное меню ---------- */
  const setMenu = (open) => {
    nav.classList.toggle('nav--open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.classList.toggle('is-locked', open);
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('nav--open')));
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });
  window.matchMedia('(min-width: 1081px)').addEventListener('change', (e) => {
    if (e.matches) setMenu(false);
  });

  /* ---------- Подсветка активного раздела ---------- */
  const navLinks = $$('a[href^="#"]', menu);
  const linkById = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
  if (hasIO) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.classList.remove('is-active'));
        const link = linkById.get(entry.target.id);
        if (link) link.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((section) => spy.observe(section));
  }

  /* ---------- Плавное появление блоков ---------- */
  const revealEls = $$('.reveal');
  if (!reduceMotion && hasIO) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = Number(el.dataset.delay || 0);
        io.unobserve(el);
        el.style.transitionDelay = `${delay}ms`;
        el.classList.remove('reveal--hidden');
        // после появления возвращаем элементу его собственные переходы (hover и т. п.)
        window.setTimeout(() => {
          el.classList.remove('reveal');
          el.style.transitionDelay = '';
        }, 1100 + delay);
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.06 });

    const fold = window.innerHeight * 0.92;
    revealEls.forEach((el) => {
      if (el.getBoundingClientRect().top > fold) {
        el.classList.add('reveal--hidden');
        io.observe(el);
      } else {
        el.classList.remove('reveal');
      }
    });
  } else {
    revealEls.forEach((el) => el.classList.remove('reveal'));
  }

  /* ---------- Счётчики ---------- */
  if (!reduceMotion && hasIO) {
    const fmt = new Intl.NumberFormat('ru-RU');
    const run = (el) => {
      const target = Number(el.dataset.count);
      if (!Number.isFinite(target)) return;
      const duration = 1500;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt.format(Math.round(target * eased));
        if (p < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    };
    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        counterIO.unobserve(entry.target);
        run(entry.target);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach((el) => counterIO.observe(el));
  }

  /* ---------- Сезоны (вкладки) ---------- */
  const seasons = $('.seasons');
  if (seasons) {
    const tabs = $$('[role="tab"]', seasons);
    const panels = $$('[role="tabpanel"]', seasons);
    const backgrounds = $$('.seasons__bg img', seasons);
    seasons.classList.add('js-tabs');

    const select = (tab, focus = false) => {
      tabs.forEach((t) => {
        const active = t === tab;
        t.setAttribute('aria-selected', String(active));
        t.tabIndex = active ? 0 : -1;
      });
      panels.forEach((p) => p.classList.toggle('is-active', p.id === tab.getAttribute('aria-controls')));
      backgrounds.forEach((img) => img.classList.toggle('is-active', img.dataset.season === tab.dataset.season));
      if (focus) tab.focus();
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (e) => {
        const last = tabs.length - 1;
        let next = null;
        if (e.key === 'ArrowRight') next = i === last ? 0 : i + 1;
        else if (e.key === 'ArrowLeft') next = i === 0 ? last : i - 1;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = last;
        if (next === null) return;
        e.preventDefault();
        select(tabs[next], true);
      });
    });
  }

  /* ---------- Галерея: лайтбокс ---------- */
  const items = $$('.gallery__item');
  if (items.length) {
    const icon = (d) => {
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.setAttribute('aria-hidden', 'true');
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d);
      svg.appendChild(path);
      return svg;
    };
    const button = (cls, label, d) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `lightbox__btn ${cls}`;
      b.setAttribute('aria-label', label);
      b.appendChild(icon(d));
      return b;
    };

    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Просмотр фотографии');

    const prevBtn = button('lightbox__nav lightbox__nav--prev', 'Предыдущая фотография', 'M15 5l-7 7 7 7');
    const nextBtn = button('lightbox__nav lightbox__nav--next', 'Следующая фотография', 'M9 5l7 7-7 7');
    const closeBtn = button('lightbox__close', 'Закрыть', 'M6 6l12 12M18 6L6 18');

    const figure = document.createElement('figure');
    figure.className = 'lightbox__figure';
    const img = document.createElement('img');
    img.className = 'lightbox__img';
    const meta = document.createElement('figcaption');
    meta.className = 'lightbox__meta';
    const caption = document.createElement('span');
    caption.className = 'lightbox__caption';
    const credit = document.createElement('span');
    credit.className = 'lightbox__credit';
    const count = document.createElement('span');
    count.className = 'lightbox__count';
    meta.append(caption, credit, count);
    figure.append(img, meta);
    box.append(prevBtn, figure, nextBtn, closeBtn);
    document.body.appendChild(box);

    let current = 0;
    let lastFocus = null;

    const show = (index) => {
      current = (index + items.length) % items.length;
      const item = items[current];
      img.src = item.getAttribute('href');
      img.alt = $('img', item).alt;
      caption.textContent = item.dataset.caption || '';
      credit.textContent = item.dataset.credit || '';
      count.textContent = `${current + 1} / ${items.length}`;
    };
    const open = (index) => {
      lastFocus = document.activeElement;
      show(index);
      box.classList.add('is-open');
      document.body.classList.add('is-locked');
      closeBtn.focus();
    };
    const close = () => {
      box.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      if (lastFocus) lastFocus.focus();
    };

    items.forEach((item, i) => item.addEventListener('click', (e) => {
      e.preventDefault();
      open(i);
    }));
    prevBtn.addEventListener('click', () => show(current - 1));
    nextBtn.addEventListener('click', () => show(current + 1));
    closeBtn.addEventListener('click', close);
    box.addEventListener('click', (e) => {
      if (e.target === box || e.target === figure) close();
    });

    let touchX = null;
    box.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    }, { passive: true });

    document.addEventListener('keydown', (e) => {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') show(current + 1);
      else if (e.key === 'ArrowLeft') show(current - 1);
      else if (e.key === 'Tab') {
        // удерживаем фокус внутри окна просмотра
        const focusables = [prevBtn, nextBtn, closeBtn];
        const idx = focusables.indexOf(document.activeElement);
        e.preventDefault();
        const step = e.shiftKey ? -1 : 1;
        focusables[(idx + step + focusables.length) % focusables.length].focus();
      }
    });
  }

  /* ---------- Esc закрывает мобильное меню ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('nav--open')) {
      setMenu(false);
      burger.focus();
    }
  });
})();
