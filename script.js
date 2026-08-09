const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const pad = value => String(value).padStart(2, '0');

// Navigation, scroll progress and active section.
const nav = $('.nav');
const menu = $('.menu');
const progress = $('.progress span');

menu.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
});

$$('nav a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
}));

let scrollFrame = 0;
const updateScroll = () => {
  const maximum = document.documentElement.scrollHeight - innerHeight;
  const phase = maximum ? Math.min(scrollY / maximum, 1) : 0;
  progress.style.transform = `scaleX(${phase})`;
  nav.classList.toggle('compact', scrollY > 45);
  scrollFrame = 0;
};

const requestScrollUpdate = () => {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(updateScroll);
};

addEventListener('scroll', requestScrollUpdate, { passive: true });
updateScroll();

const sectionLinks = $$('.nav nav a, .section-dock a');
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    sectionLinks.forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
  });
}, { rootMargin: '-35% 0px -55%', threshold: 0 });

$$('main section[id]').forEach(section => sectionObserver.observe(section));

// Animate the symbol field only around visible content.
const textureObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  entry.target.classList.toggle('texture-active', entry.isIntersecting);
}), { rootMargin: '30% 0px 30%', threshold: 0 });

$$('main > section:not(.hero), footer').forEach(section => textureObserver.observe(section));

// Reveal and click-clack heading motion.
const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  entry.target.classList.add('visible');
  if (entry.target.classList.contains('display')) entry.target.classList.add('clack-hit');
  revealObserver.unobserve(entry.target);
}), { threshold: .12, rootMargin: '0px 0px -35px' });

$$('.reveal').forEach(element => revealObserver.observe(element));

const counterObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  const element = entry.target;
  const target = Number(element.dataset.count);
  const suffix = target === 100 ? '%' : '';
  const started = performance.now();
  const tick = now => {
    const phase = Math.min((now - started) / 1100, 1);
    element.textContent = Math.round(target * (1 - Math.pow(1 - phase, 3))) + suffix;
    if (phase < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  counterObserver.unobserve(element);
}), { threshold: .7 });

$$('[data-count]').forEach(element => counterObserver.observe(element));

// Hero story carousel with click-clack title transition.
const heroStories = [
  {
    image: 'assets/hero.png',
    lineOne: 'Твоя история.',
    lineTwo: 'Твоя Родина.',
    description: 'Серьёзный ролевой проект, где у каждого решения есть последствия, а у каждого игрока — собственный путь.'
  },
  {
    image: 'assets/gallery/skyline.jpg',
    lineOne: 'Знакомый город.',
    lineTwo: 'Новые правила.',
    description: 'Авторская Москва объединяет узнаваемые улицы, живые организации и ситуации, которые создают сами игроки.'
  },
  {
    image: 'assets/gallery/patrol.jpg',
    lineOne: 'Сделай выбор.',
    lineTwo: 'Оставь след.',
    description: 'Поступай на службу, развивай своё дело или выбирай независимый путь — город запомнит каждое действие.'
  }
];

const hero = $('.hero');
const heroArt = $('#heroArt');
const heroLineOne = $('#heroLineOne');
const heroLineTwo = $('#heroLineTwo');
const heroDescription = $('#heroDescription');
const heroPageButtons = $$('.hero-pages button');
let heroIndex = 0;
let heroLocked = false;
let heroTimer;

const restartHeroTimer = () => {
  clearInterval(heroTimer);
  heroTimer = setInterval(() => changeHero(heroIndex + 1), 8500);
};

const changeHero = nextIndex => {
  if (heroLocked) return;
  const normalized = (nextIndex + heroStories.length) % heroStories.length;
  if (normalized === heroIndex) return;
  heroLocked = true;
  hero.classList.add('switching');
  const story = heroStories[normalized];
  const preloader = new Image();
  preloader.src = story.image;
  setTimeout(() => {
    heroArt.style.backgroundImage = `url('${story.image}')`;
    heroLineOne.textContent = story.lineOne;
    heroLineTwo.textContent = story.lineTwo;
    heroDescription.textContent = story.description;
    heroIndex = normalized;
    heroPageButtons.forEach((button, index) => {
      const active = index === heroIndex;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      hero.classList.remove('switching');
      setTimeout(() => { heroLocked = false; }, 330);
    }));
  }, 260);
  restartHeroTimer();
};

$('#heroPrev').addEventListener('click', () => changeHero(heroIndex - 1));
$('#heroNext').addEventListener('click', () => changeHero(heroIndex + 1));
heroPageButtons.forEach(button => button.addEventListener('click', () => changeHero(Number(button.dataset.hero))));
hero.addEventListener('mouseenter', () => clearInterval(heroTimer));
hero.addEventListener('mouseleave', restartHeroTimer);
restartHeroTimer();

// Faction switcher.
const factions = {
  mvd: {
    image: 'assets/gallery/patrol.jpg',
    tag: 'ГОСУДАРСТВЕННАЯ СЛУЖБА',
    title: 'Защищай город,<br>который стал домом.',
    text: 'Патрулируй улицы, реагируй на вызовы и поддерживай порядок там, где каждое решение видно всему городу.'
  },
  fsb: {
    image: 'assets/gallery/security.jpg',
    tag: 'БЕЗОПАСНОСТЬ И ПОРЯДОК',
    title: 'Работай там,<br>где ошибкам нет места.',
    text: 'Сложные операции, защита государственных интересов и командная работа для тех, кто умеет действовать точно.'
  },
  civil: {
    image: 'assets/gallery/cafe.jpg',
    tag: 'СВОБОДНАЯ ИСТОРИЯ',
    title: 'Построй жизнь<br>по собственным правилам.',
    text: 'Найди работу, развивай связи, создавай бизнес и преврати обычный день в историю, которую запомнит весь город.'
  }
};

const factionVisual = $('.faction-visual');
const factionImage = $('#factionImage');

$$('.faction-tab').forEach(tab => tab.addEventListener('click', () => {
  const data = factions[tab.dataset.faction];
  $$('.faction-tab').forEach(item => {
    const active = item === tab;
    item.classList.toggle('active', active);
    item.setAttribute('aria-selected', String(active));
  });
  factionVisual.classList.add('loading');
  const preloader = new Image();
  preloader.onload = () => {
    factionImage.src = data.image;
    $('#factionTag').textContent = data.tag;
    $('#factionTitle').innerHTML = data.title;
    $('#factionText').textContent = data.text;
    requestAnimationFrame(() => factionVisual.classList.remove('loading'));
  };
  preloader.src = data.image;
}));

// City gallery carousel: arrows, thumbnails, keyboard and swipe.
const galleryItems = [
  ['assets/gallery/skyline.jpg', 'ГОРОД', 'Панорама центра'],
  ['assets/gallery/security.jpg', 'СЛУЖБА', 'Силовые структуры'],
  ['assets/gallery/cafe.jpg', 'ЖИЗНЬ', 'Повседневная жизнь'],
  ['assets/gallery/city.jpg', 'ГОРОД', 'Деловой квартал'],
  ['assets/gallery/office.jpg', 'ИНТЕРЬЕР', 'Рабочие пространства'],
  ['assets/gallery/district.jpg', 'АРХИТЕКТУРА', 'Новые районы'],
  ['assets/gallery/patrol.jpg', 'СЛУЖБА', 'Городской патруль'],
  ['assets/gallery/map.jpg', 'КАРТА', 'Мир в разработке']
].map(([image, category, title]) => ({ image, category, title }));

const gallerySlides = $('#gallerySlides');
const galleryThumbs = $('#galleryThumbs');
let galleryIndex = 0;
let galleryPrevious = 0;
let galleryTouchX = 0;

galleryItems.forEach((item, index) => {
  const slide = document.createElement('button');
  slide.className = `gallery-slide${index === 0 ? ' active' : ''}`;
  slide.setAttribute('aria-label', `Открыть: ${item.title}`);
  slide.innerHTML = `<img src="${item.image}" alt="${item.title}">`;
  slide.addEventListener('click', () => openLightbox(item));
  gallerySlides.append(slide);

  const thumb = document.createElement('button');
  thumb.className = `gallery-thumb${index === 0 ? ' active' : ''}`;
  thumb.setAttribute('aria-label', `Показать кадр ${index + 1}: ${item.title}`);
  thumb.innerHTML = `<img src="${item.image}" alt="">`;
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
  $$('.gallery-thumb').forEach((thumb, index) => thumb.classList.toggle('active', index === galleryIndex));
  const item = galleryItems[galleryIndex];
  $('#galleryNumber').textContent = `${pad(galleryIndex + 1)} / ${pad(galleryItems.length)}`;
  $('#galleryCurrent').textContent = pad(galleryIndex + 1);
  $('#galleryCategory').textContent = item.category;
  $('#galleryTitle').textContent = item.title;
  $('#galleryProgress').style.width = `${(galleryIndex + 1) / galleryItems.length * 100}%`;
  $$('.gallery-thumb')[galleryIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
};

$('#galleryPrev').addEventListener('click', () => showGallery(galleryIndex - 1));
$('#galleryNext').addEventListener('click', () => showGallery(galleryIndex + 1));
$('#galleryExpand').addEventListener('click', () => openLightbox(galleryItems[galleryIndex]));
$('.gallery-viewport').addEventListener('touchstart', event => { galleryTouchX = event.changedTouches[0].clientX; }, { passive: true });
$('.gallery-viewport').addEventListener('touchend', event => {
  const distance = event.changedTouches[0].clientX - galleryTouchX;
  if (Math.abs(distance) > 45) showGallery(galleryIndex + (distance < 0 ? 1 : -1));
}, { passive: true });

// Dev log pagination.
const devEntries = [
  { image: 'assets/gallery/map.jpg', badge: 'WORK IN PROGRESS', date: '24 ИЮЛЯ 2026', number: '001', title: 'Первый взгляд<br>на карту', text: 'Чистый лист без обозначений — основа будущего города. К открытию здесь появятся дополнительные локации и связные игровые маршруты.' },
  { image: 'assets/gallery/security.jpg', badge: 'ФРАКЦИИ', date: '25 ИЮЛЯ 2026', number: '002', title: 'Структура<br>ФСБ', text: 'Элитная государственная служба, отвечающая за безопасность, порядок и сложные операции внутри игрового мира.' },
  { image: 'assets/gallery/patrol.jpg', badge: 'ФРАКЦИИ', date: '27 ИЮЛЯ 2026', number: '003', title: 'Первые кадры<br>МВД', text: 'Патрульная служба, транспорт и инфраструктура для ежедневной работы сотрудников на городских улицах.' },
  { image: 'assets/gallery/office.jpg', badge: 'СООБЩЕСТВО', date: '27 ИЮЛЯ 2026', number: '004', title: 'Кодекс<br>сообщества', text: 'Опубликованы основные принципы честной игры, уважительного общения и поддержания сильной ролевой атмосферы.' }
];

const featuredLog = $('.featured-log');
let devIndex = 0;
let devLocked = false;

const showDev = nextIndex => {
  if (devLocked) return;
  const normalized = (nextIndex + devEntries.length) % devEntries.length;
  if (normalized === devIndex) return;
  devLocked = true;
  featuredLog.classList.add('switching');
  const entry = devEntries[normalized];
  const preloader = new Image();
  preloader.src = entry.image;
  setTimeout(() => {
    $('#devImage').src = entry.image;
    $('#devBadge').textContent = entry.badge;
    $('#devDate').textContent = entry.date;
    $('#devNumber').textContent = entry.number;
    $('#devTitle').innerHTML = entry.title;
    $('#devText').textContent = entry.text;
    $('#devCurrent').textContent = pad(normalized + 1);
    devIndex = normalized;
    $$('.log-row').forEach(row => row.classList.toggle('active', Number(row.dataset.dev) === devIndex));
    requestAnimationFrame(() => {
      featuredLog.classList.remove('switching');
      setTimeout(() => { devLocked = false; }, 280);
    });
  }, 230);
};

$('#devPrev').addEventListener('click', () => showDev(devIndex - 1));
$('#devNext').addEventListener('click', () => showDev(devIndex + 1));
$$('.log-row').forEach(row => row.addEventListener('click', () => showDev(Number(row.dataset.dev))));

// Lightbox shared by gallery controls.
const lightbox = $('.lightbox');
const lightboxImage = $('img', lightbox);
const lightboxCaption = $('p', lightbox);

function openLightbox(item) {
  lightboxImage.src = item.image;
  lightboxImage.alt = item.title;
  lightboxCaption.textContent = `${item.category} · ${item.title}`;
  lightbox.showModal();
  document.body.classList.add('locked');
}

const closeLightbox = () => {
  lightbox.close();
  document.body.classList.remove('locked');
};

$('button', lightbox).addEventListener('click', closeLightbox);
lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });

addEventListener('keydown', event => {
  if (event.key === 'Escape' && lightbox.open) closeLightbox();
  const galleryVisible = $('#gallery').getBoundingClientRect();
  if (!lightbox.open && galleryVisible.top < innerHeight * .8 && galleryVisible.bottom > innerHeight * .2) {
    if (event.key === 'ArrowLeft') showGallery(galleryIndex - 1);
    if (event.key === 'ArrowRight') showGallery(galleryIndex + 1);
  }
});

// Click-clack transitions for internal navigation.
const jumpFlash = $('.jump-flash');
const jumpMap = {
  project: ['01', 'ПРОЕКТ'],
  factions: ['02', 'ФРАКЦИИ'],
  gallery: ['03', 'ГОРОД'],
  devblog: ['04', 'DEV LOG'],
  rules: ['05', 'КОДЕКС'],
  top: ['00', 'НАВЕРХ']
};

$$('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
  const id = link.hash.slice(1);
  const target = id ? document.getElementById(id) : null;
  if (!target) return;
  event.preventDefault();
  nav.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');

  const [number, label] = jumpMap[id] || ['--', link.dataset.jumpLabel || 'ПЕРЕХОД'];
  $('span', jumpFlash).textContent = number;
  $('strong', jumpFlash).textContent = label;
  jumpFlash.classList.remove('play');
  void jumpFlash.offsetWidth;
  jumpFlash.classList.add('play');

  setTimeout(() => {
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    const heading = $('.display, h2', target);
    if (heading) {
      heading.classList.remove('clack-hit');
      requestAnimationFrame(() => heading.classList.add('clack-hit'));
    }
    history.pushState(null, '', `#${id}`);
  }, 90);
}));

jumpFlash.addEventListener('animationend', () => jumpFlash.classList.remove('play'));

// High-refresh pointer effects: every write is batched into requestAnimationFrame.
if (matchMedia('(pointer:fine)').matches) {
  const aura = $('.cursor-aura');
  let pointerFrame = 0;
  let pointerX = -300;
  let pointerY = -300;

  addEventListener('pointermove', event => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    document.body.classList.add('pointer-ready');
    document.body.classList.toggle('over-hero', Boolean(event.target.closest?.('.hero')));
    if (pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      aura.style.transform = `translate3d(${pointerX}px,${pointerY}px,0)`;
      pointerFrame = 0;
    });
  }, { passive: true });

  addEventListener('blur', () => document.body.classList.remove('pointer-ready'));

  $$('.tilt').forEach(card => {
    let cardFrame = 0;
    let tiltX = 0;
    let tiltY = 0;
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      tiltX = (event.clientX - rect.left) / rect.width - .5;
      tiltY = (event.clientY - rect.top) / rect.height - .5;
      if (cardFrame) return;
      cardFrame = requestAnimationFrame(() => {
        card.style.transform = `perspective(900px) rotateY(${tiltX * 3}deg) rotateX(${-tiltY * 3}deg)`;
        cardFrame = 0;
      });
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      if (cardFrame) cancelAnimationFrame(cardFrame);
      cardFrame = 0;
      card.style.transform = '';
    });
  });

  $$('.magnetic').forEach(button => {
    let buttonFrame = 0;
    let moveX = 0;
    let moveY = 0;
    button.addEventListener('pointermove', event => {
      const rect = button.getBoundingClientRect();
      moveX = (event.clientX - rect.left - rect.width / 2) * .08;
      moveY = (event.clientY - rect.top - rect.height / 2) * .12;
      if (buttonFrame) return;
      buttonFrame = requestAnimationFrame(() => {
        button.style.transform = `translate3d(${moveX}px,${moveY}px,0)`;
        buttonFrame = 0;
      });
    }, { passive: true });
    button.addEventListener('pointerleave', () => {
      if (buttonFrame) cancelAnimationFrame(buttonFrame);
      buttonFrame = 0;
      button.style.transform = '';
    });
  });
}

if (location.hash) setTimeout(() => $(location.hash)?.scrollIntoView(), 900);
