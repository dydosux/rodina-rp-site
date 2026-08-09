const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const pad = value => String(value).padStart(2, '0');
const reduceMotion = () => document.body.classList.contains('motion-off') || matchMedia('(prefers-reduced-motion: reduce)').matches;

// Header, navigation and high-refresh scroll state.
const header = $('.site-header');
const menuToggle = $('#menuToggle');
const scrollMeter = $('#scrollMeter');
const compass = $('.page-compass');
const compassNumber = $('#compassNumber');
const compassTitle = $('#compassTitle');
const jumpCard = $('#jumpCard');
let scrollFrame = 0;

const closeMenu = () => {
  header.classList.remove('menu-open');
  document.body.classList.remove('menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Открыть меню');
};

menuToggle.addEventListener('click', () => {
  const open = !header.classList.contains('menu-open');
  header.classList.toggle('menu-open', open);
  document.body.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
});

const updateScroll = () => {
  const maximum = document.documentElement.scrollHeight - innerHeight;
  scrollMeter.style.transform = `scaleX(${maximum > 0 ? Math.min(scrollY / maximum, 1) : 0})`;
  header.classList.toggle('compact', scrollY > 42);
  compass.classList.toggle('visible', scrollY > Math.min(innerHeight * .7, 650));
  scrollFrame = 0;
};

addEventListener('scroll', () => {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
}, { passive: true });
addEventListener('resize', updateScroll, { passive: true });
updateScroll();

const navLinks = $$('.main-nav a');
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const hash = `#${entry.target.id}`;
    navLinks.forEach(link => {
      const active = link.hash === hash;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    compassNumber.textContent = entry.target.dataset.section;
    compassTitle.textContent = entry.target.dataset.title;
  });
}, { rootMargin: '-34% 0px -56%', threshold: 0 });

$$('[data-section]').forEach(section => sectionObserver.observe(section));

const surfaceObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  entry.target.classList.toggle('in-view', entry.isIntersecting);
}), { rootMargin: '30% 0px 30%', threshold: 0 });

$$('.surface').forEach(section => surfaceObserver.observe(section));

const jumpTo = (target, link) => {
  const sectionNumber = target.dataset.section || (target.id === 'home' ? '00' : '--');
  const sectionTitle = target.dataset.title || (target.id === 'home' ? 'ГЛАВНАЯ' : link.textContent.trim());
  const delay = reduceMotion() ? 0 : 90;

  if (!reduceMotion()) {
    $('b', jumpCard).textContent = sectionNumber;
    $('strong', jumpCard).textContent = sectionTitle;
    jumpCard.classList.remove('play');
    void jumpCard.offsetWidth;
    jumpCard.classList.add('play');
  }

  setTimeout(() => {
    target.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
    const heading = $('h1, h2', target);
    if (heading && !reduceMotion()) {
      heading.classList.remove('heading-clack');
      requestAnimationFrame(() => heading.classList.add('heading-clack'));
    }
    try { history.pushState(null, '', `#${target.id}`); } catch { location.hash = target.id; }
  }, delay);
};

$$('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
  const target = document.getElementById(link.hash.slice(1));
  if (!target) return;
  event.preventDefault();
  closeMenu();
  jumpTo(target, link);
}));

jumpCard.addEventListener('animationend', event => {
  if (event.target === jumpCard) jumpCard.classList.remove('play');
});

// Reveal content and animate counters only when needed.
const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  entry.target.classList.add('visible');
  revealObserver.unobserve(entry.target);
}), { threshold: .1, rootMargin: '0px 0px -28px' });

$$('.reveal').forEach(element => revealObserver.observe(element));

const counterObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  const element = entry.target;
  const target = Number(element.dataset.count);
  const suffix = element.dataset.suffix || '';
  if (reduceMotion()) {
    element.textContent = target + suffix;
  } else {
    const started = performance.now();
    const draw = now => {
      const phase = Math.min((now - started) / 1050, 1);
      element.textContent = Math.round(target * (1 - Math.pow(1 - phase, 3))) + suffix;
      if (phase < 1) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }
  counterObserver.unobserve(element);
}), { threshold: .65 });

$$('[data-count]').forEach(element => counterObserver.observe(element));

// Motion preference switch.
const motionToggle = $('#motionToggle');
let effectsOff = false;
try { effectsOff = localStorage.getItem('rodina-effects') === 'off'; } catch {}

const applyMotionPreference = () => {
  document.body.classList.toggle('motion-off', effectsOff);
  motionToggle.setAttribute('aria-pressed', String(!effectsOff));
  motionToggle.title = effectsOff ? 'Включить анимации' : 'Отключить анимации';
  syncHeroTimer();
};

motionToggle.addEventListener('click', () => {
  effectsOff = !effectsOff;
  try { localStorage.setItem('rodina-effects', effectsOff ? 'off' : 'on'); } catch {}
  applyMotionPreference();
});

// Hero story carousel.
const heroStories = [
  {
    image: 'assets/hero.png',
    title: 'Твоя история.',
    accent: 'Твоя Родина.',
    lead: 'Серьёзный ролевой проект, где решения создают последствия, а игроки — историю целого города.'
  },
  {
    image: 'assets/gallery/skyline.jpg',
    title: 'Знакомый город.',
    accent: 'Новые правила.',
    lead: 'Авторская Москва объединяет узнаваемые улицы, живые организации и ситуации, которые создают сами игроки.'
  },
  {
    image: 'assets/gallery/patrol.jpg',
    title: 'Сделай выбор.',
    accent: 'Оставь след.',
    lead: 'Поступай на службу, развивай своё дело или выбирай независимый путь — город запомнит каждое действие.'
  }
];

const hero = $('.hero');
const heroMedia = $('#heroMedia');
const heroTitleMain = $('#heroTitleMain');
const heroTitleAccent = $('#heroTitleAccent');
const heroLead = $('#heroLead');
const heroTabs = $$('.hero-dots button');
const heroPause = $('#heroPause');
let heroIndex = 0;
let heroLocked = false;
let heroPaused = false;
let heroTimer = 0;

function syncHeroTimer() {
  clearInterval(heroTimer);
  heroTimer = 0;
  if (!heroPaused && !effectsOff && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    heroTimer = setInterval(() => showHero(heroIndex + 1), 8500);
  }
}

const showHero = nextIndex => {
  const normalized = (nextIndex + heroStories.length) % heroStories.length;
  if (normalized === heroIndex || heroLocked) return;
  heroLocked = true;
  hero.classList.add('switching');
  const story = heroStories[normalized];
  const preloader = new Image();
  preloader.src = story.image;

  setTimeout(() => {
    heroMedia.style.backgroundImage = `url('${story.image}')`;
    heroTitleMain.textContent = story.title;
    heroTitleAccent.textContent = story.accent;
    heroLead.textContent = story.lead;
    heroIndex = normalized;
    heroTabs.forEach((tab, index) => {
      const active = index === heroIndex;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      hero.classList.remove('switching');
      setTimeout(() => { heroLocked = false; }, reduceMotion() ? 0 : 330);
    }));
  }, reduceMotion() ? 0 : 250);
  syncHeroTimer();
};

$('#heroPrev').addEventListener('click', () => showHero(heroIndex - 1));
$('#heroNext').addEventListener('click', () => showHero(heroIndex + 1));
heroTabs.forEach(tab => tab.addEventListener('click', () => showHero(Number(tab.dataset.hero))));
heroPause.addEventListener('click', () => {
  heroPaused = !heroPaused;
  heroPause.setAttribute('aria-pressed', String(heroPaused));
  $('span', heroPause).textContent = heroPaused ? 'Продолжить' : 'Пауза';
  $('b', heroPause).textContent = heroPaused ? '▶' : 'Ⅱ';
  syncHeroTimer();
});
hero.addEventListener('mouseenter', () => clearInterval(heroTimer));
hero.addEventListener('mouseleave', syncHeroTimer);

// Role switcher.
const roles = {
  mvd: {
    image: 'assets/gallery/patrol.jpg',
    alt: 'Патруль МВД',
    tag: 'ГОСУДАРСТВЕННАЯ СЛУЖБА',
    title: 'Защищай город,<br>который стал домом.',
    text: 'Патрулируй улицы, реагируй на вызовы и поддерживай порядок там, где каждое решение видно всему городу.'
  },
  fsb: {
    image: 'assets/gallery/security.jpg',
    alt: 'Сотрудники ФСБ',
    tag: 'БЕЗОПАСНОСТЬ И ПОРЯДОК',
    title: 'Работай там,<br>где ошибкам нет места.',
    text: 'Сложные операции, защита государственных интересов и командная работа для тех, кто умеет действовать точно.'
  },
  civil: {
    image: 'assets/gallery/cafe.jpg',
    alt: 'Повседневная жизнь горожан',
    tag: 'СВОБОДНАЯ ИСТОРИЯ',
    title: 'Построй жизнь<br>по собственным правилам.',
    text: 'Найди работу, развивай связи, создавай бизнес и преврати обычный день в историю, которую запомнит весь город.'
  }
};

const roleStage = $('#roleStage');
const roleImage = $('#roleImage');
let roleLocked = false;

$$('.role-tabs button').forEach(tab => tab.addEventListener('click', () => {
  if (tab.classList.contains('active') || roleLocked) return;
  roleLocked = true;
  const data = roles[tab.dataset.role];
  $$('.role-tabs button').forEach(item => {
    const active = item === tab;
    item.classList.toggle('active', active);
    item.setAttribute('aria-selected', String(active));
  });
  roleStage.classList.add('loading');
  const preloader = new Image();
  preloader.onload = preloader.onerror = () => {
    roleImage.src = data.image;
    roleImage.alt = data.alt;
    $('#roleTag').textContent = data.tag;
    $('#roleTitle').innerHTML = data.title;
    $('#roleText').textContent = data.text;
    requestAnimationFrame(() => {
      roleStage.classList.remove('loading');
      setTimeout(() => { roleLocked = false; }, reduceMotion() ? 0 : 260);
    });
  };
  preloader.src = data.image;
}));

// Gallery, thumbnails, swipe and full-screen viewer.
const galleryItems = [
  { image: 'assets/gallery/skyline.jpg', category: 'ГОРОД', title: 'Панорама центра', alt: 'Панорама центра игровой Москвы' },
  { image: 'assets/gallery/security.jpg', category: 'СЛУЖБА', title: 'Силовые структуры', alt: 'Сотрудники силовых структур' },
  { image: 'assets/gallery/cafe.jpg', category: 'ЖИЗНЬ', title: 'Повседневная жизнь', alt: 'Городское кафе' },
  { image: 'assets/gallery/city.jpg', category: 'ГОРОД', title: 'Деловой квартал', alt: 'Деловой квартал Москвы' },
  { image: 'assets/gallery/office.jpg', category: 'ИНТЕРЬЕР', title: 'Рабочие пространства', alt: 'Городской офис' },
  { image: 'assets/gallery/district.jpg', category: 'АРХИТЕКТУРА', title: 'Новые районы', alt: 'Современный городской район' },
  { image: 'assets/gallery/patrol.jpg', category: 'СЛУЖБА', title: 'Городской патруль', alt: 'Автомобили городского патруля' },
  { image: 'assets/gallery/map.jpg', category: 'КАРТА', title: 'Мир в разработке', alt: 'Черновая карта проекта' }
];

const galleryTrack = $('#galleryTrack');
const galleryThumbs = $('#galleryThumbs');
let galleryIndex = 0;
let galleryPrevious = 0;
let galleryTouchStart = 0;

galleryItems.forEach((item, index) => {
  const slide = document.createElement('button');
  slide.type = 'button';
  slide.className = `gallery-slide${index === 0 ? ' active' : ''}`;
  slide.setAttribute('aria-label', `Открыть изображение: ${item.title}`);
  slide.innerHTML = `<img src="${item.image}" alt="${item.alt}" width="1600" height="900" ${index ? 'loading="lazy"' : ''}>`;
  slide.addEventListener('click', () => openLightbox(index));
  galleryTrack.append(slide);

  const thumb = document.createElement('button');
  thumb.type = 'button';
  thumb.className = `gallery-thumb${index === 0 ? ' active' : ''}`;
  thumb.setAttribute('aria-label', `Показать кадр ${index + 1}: ${item.title}`);
  thumb.innerHTML = `<img src="${item.image}" alt="" width="160" height="90" loading="lazy">`;
  thumb.addEventListener('click', () => showGallery(index));
  galleryThumbs.append(thumb);
});

const showGallery = nextIndex => {
  const normalized = (nextIndex + galleryItems.length) % galleryItems.length;
  if (normalized === galleryIndex) return;
  galleryPrevious = galleryIndex;
  galleryIndex = normalized;
  $$('.gallery-slide').forEach((slide, index) => {
    slide.classList.toggle('previous', index === galleryPrevious);
    slide.classList.toggle('active', index === galleryIndex);
  });
  $$('.gallery-thumb').forEach((thumb, index) => {
    const active = index === galleryIndex;
    thumb.classList.toggle('active', active);
    thumb.setAttribute('aria-current', active ? 'true' : 'false');
  });
  const item = galleryItems[galleryIndex];
  $('#galleryIndex').textContent = `${pad(galleryIndex + 1)} / ${pad(galleryItems.length)}`;
  $('#galleryCurrent').textContent = pad(galleryIndex + 1);
  $('#galleryCategory').textContent = item.category;
  $('#galleryTitle').textContent = item.title;
  $('#galleryLine').style.width = `${(galleryIndex + 1) / galleryItems.length * 100}%`;
  const currentThumb = $$('.gallery-thumb')[galleryIndex];
  currentThumb.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
};

$('#galleryPrev').addEventListener('click', () => showGallery(galleryIndex - 1));
$('#galleryNext').addEventListener('click', () => showGallery(galleryIndex + 1));
$('#galleryOpen').addEventListener('click', () => openLightbox(galleryIndex));
$('#galleryView').addEventListener('touchstart', event => { galleryTouchStart = event.changedTouches[0].clientX; }, { passive: true });
$('#galleryView').addEventListener('touchend', event => {
  const distance = event.changedTouches[0].clientX - galleryTouchStart;
  if (Math.abs(distance) > 45) showGallery(galleryIndex + (distance < 0 ? 1 : -1));
}, { passive: true });

const lightbox = $('#lightbox');
const renderLightbox = () => {
  const item = galleryItems[galleryIndex];
  $('#lightboxImage').src = item.image;
  $('#lightboxImage').alt = item.alt;
  $('#lightboxNumber').textContent = `${pad(galleryIndex + 1)} / ${pad(galleryItems.length)}`;
  $('#lightboxTitle').textContent = item.title;
};

function openLightbox(index) {
  if (index !== galleryIndex) showGallery(index);
  renderLightbox();
  lightbox.showModal();
  document.body.classList.add('modal-open');
}

const closeLightbox = () => {
  if (lightbox.open) lightbox.close();
  document.body.classList.remove('modal-open');
};

$('#lightboxClose').addEventListener('click', closeLightbox);
$('#lightboxPrev').addEventListener('click', () => { showGallery(galleryIndex - 1); renderLightbox(); });
$('#lightboxNext').addEventListener('click', () => { showGallery(galleryIndex + 1); renderLightbox(); });
lightbox.addEventListener('cancel', event => { event.preventDefault(); closeLightbox(); });
lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });

// Development timeline.
const devEntries = [
  { image: 'assets/gallery/map.jpg', alt: 'Черновая карта проекта', badge: 'WORK IN PROGRESS', date: '24 ИЮЛЯ 2026', number: '001', category: 'КАРТА', title: 'Первый взгляд<br>на карту', text: 'Чистый лист без обозначений — основа будущего города. К открытию здесь появятся дополнительные локации и связные игровые маршруты.' },
  { image: 'assets/gallery/security.jpg', alt: 'Сотрудники ФСБ', badge: 'ФРАКЦИИ', date: '25 ИЮЛЯ 2026', number: '002', category: 'ФСБ', title: 'Структура<br>ФСБ', text: 'Элитная государственная служба, отвечающая за безопасность, порядок и сложные операции внутри игрового мира.' },
  { image: 'assets/gallery/patrol.jpg', alt: 'Патруль МВД', badge: 'ФРАКЦИИ', date: '27 ИЮЛЯ 2026', number: '003', category: 'МВД', title: 'Первые кадры<br>МВД', text: 'Патрульная служба, транспорт и инфраструктура для ежедневной работы сотрудников на городских улицах.' },
  { image: 'assets/gallery/office.jpg', alt: 'Рабочее пространство', badge: 'СООБЩЕСТВО', date: '27 ИЮЛЯ 2026', number: '004', category: 'КОДЕКС', title: 'Кодекс<br>сообщества', text: 'Основные принципы честной игры, уважительного общения и поддержания сильной ролевой атмосферы.' }
];

const devFeature = $('#devFeature');
let devIndex = 0;
let devLocked = false;

const showDev = nextIndex => {
  const normalized = (nextIndex + devEntries.length) % devEntries.length;
  if (normalized === devIndex || devLocked) return;
  devLocked = true;
  devFeature.classList.add('switching');
  const entry = devEntries[normalized];
  const preloader = new Image();
  preloader.src = entry.image;
  setTimeout(() => {
    $('#devImage').src = entry.image;
    $('#devImage').alt = entry.alt;
    $('#devBadge').textContent = entry.badge;
    $('#devDate').textContent = entry.date;
    $('#devNumber').textContent = entry.number;
    $('#devCategory').textContent = entry.category;
    $('#devTitle').innerHTML = entry.title;
    $('#devText').textContent = entry.text;
    devIndex = normalized;
    $$('.dev-timeline button').forEach((tab, index) => {
      const active = index === devIndex;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    requestAnimationFrame(() => {
      devFeature.classList.remove('switching');
      setTimeout(() => { devLocked = false; }, reduceMotion() ? 0 : 260);
    });
  }, reduceMotion() ? 0 : 220);
};

$$('.dev-timeline button').forEach(tab => tab.addEventListener('click', () => showDev(Number(tab.dataset.dev))));

// One open community principle at a time.
$$('.accordions details').forEach(details => details.addEventListener('toggle', () => {
  if (!details.open) return;
  $$('.accordions details').forEach(other => { if (other !== details) other.open = false; });
}));

// Clipboard action and visible confirmation.
const toast = $('#toast');
let toastTimer = 0;
const showToast = text => {
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
};

const copyText = async text => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.append(helper);
    helper.select();
    document.execCommand('copy');
    helper.remove();
  }
};

$('#copyServer').addEventListener('click', async event => {
  await copyText(event.currentTarget.dataset.copy);
  showToast('ID сервера скопирован');
});

// Keyboard behavior stays scoped to the visible component.
addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeMenu();
    if (lightbox.open) closeLightbox();
  }
  if (lightbox.open) {
    if (event.key === 'ArrowLeft') { showGallery(galleryIndex - 1); renderLightbox(); }
    if (event.key === 'ArrowRight') { showGallery(galleryIndex + 1); renderLightbox(); }
    return;
  }
  const galleryRect = $('#city').getBoundingClientRect();
  if (galleryRect.top < innerHeight * .75 && galleryRect.bottom > innerHeight * .25) {
    if (event.key === 'ArrowLeft') showGallery(galleryIndex - 1);
    if (event.key === 'ArrowRight') showGallery(galleryIndex + 1);
  }
});

// Pointer effects write at most once per display frame.
if (matchMedia('(pointer:fine)').matches) {
  const cursorLight = $('#cursorLight');
  let pointerFrame = 0;
  let pointerX = -400;
  let pointerY = -400;

  addEventListener('pointermove', event => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    document.body.classList.add('pointer-active');
    document.body.classList.toggle('pointer-hero', Boolean(event.target.closest?.('.hero')));
    if (!pointerFrame) {
      pointerFrame = requestAnimationFrame(() => {
        cursorLight.style.transform = `translate3d(${pointerX}px,${pointerY}px,0)`;
        pointerFrame = 0;
      });
    }
  }, { passive: true });

  addEventListener('blur', () => document.body.classList.remove('pointer-active'));

  $$('.tilt-card').forEach(card => {
    let frame = 0;
    let x = 0;
    let y = 0;
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      x = (event.clientX - rect.left) / rect.width - .5;
      y = (event.clientY - rect.top) / rect.height - .5;
      if (!frame) {
        frame = requestAnimationFrame(() => {
          card.style.transform = `perspective(1000px) rotateY(${x * 2.8}deg) rotateX(${-y * 2.8}deg)`;
          frame = 0;
        });
      }
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      card.style.transform = '';
    });
  });

  $$('.magnetic').forEach(button => {
    let frame = 0;
    let x = 0;
    let y = 0;
    button.addEventListener('pointermove', event => {
      const rect = button.getBoundingClientRect();
      x = (event.clientX - rect.left - rect.width / 2) * .07;
      y = (event.clientY - rect.top - rect.height / 2) * .1;
      if (!frame) {
        frame = requestAnimationFrame(() => {
          button.style.transform = `translate3d(${x}px,${y}px,0)`;
          frame = 0;
        });
      }
    }, { passive: true });
    button.addEventListener('pointerleave', () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      button.style.transform = '';
    });
  });
}

applyMotionPreference();
syncHeroTimer();

if (location.hash) {
  const target = document.getElementById(location.hash.slice(1));
  if (target) setTimeout(() => target.scrollIntoView({ block: 'start' }), 650);
}
