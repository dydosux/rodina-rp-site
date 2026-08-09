const nav=document.querySelector('.nav');
const menu=document.querySelector('.menu');
const progress=document.querySelector('.progress span');

menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open))});
document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}));

const updateScroll=()=>{const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=`${max?scrollY/max*100:0}%`;nav.classList.toggle('compact',scrollY>45)};
addEventListener('scroll',updateScroll,{passive:true});updateScroll();

const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');revealObserver.unobserve(entry.target)}}),{threshold:.12,rootMargin:'0px 0px -35px'});
document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));

const counterObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;const el=entry.target;const target=Number(el.dataset.count);const suffix=target===100?'%':'';const start=performance.now();const tick=now=>{const p=Math.min((now-start)/1100,1);el.textContent=Math.round(target*(1-Math.pow(1-p,3)))+suffix;if(p<1)requestAnimationFrame(tick)};requestAnimationFrame(tick);counterObserver.unobserve(el)}),{threshold:.7});
document.querySelectorAll('[data-count]').forEach(el=>counterObserver.observe(el));

const factions={
  mvd:{image:'assets/gallery/patrol.jpg',tag:'ГОСУДАРСТВЕННАЯ СЛУЖБА',title:'Защищай город,<br>который стал домом.',text:'Патрулируй улицы, реагируй на вызовы и поддерживай порядок там, где каждое решение видно всему городу.'},
  fsb:{image:'assets/gallery/security.jpg',tag:'БЕЗОПАСНОСТЬ И ПОРЯДОК',title:'Работай там,<br>где ошибкам нет места.',text:'Сложные операции, защита государственных интересов и командная работа для тех, кто умеет действовать точно.'},
  civil:{image:'assets/gallery/cafe.jpg',tag:'СВОБОДНАЯ ИСТОРИЯ',title:'Построй жизнь<br>по собственным правилам.',text:'Найди работу, развивай связи, создавай бизнес и преврати обычный день в историю, которую запомнит весь город.'}
};
const factionVisual=document.querySelector('.faction-visual');const factionImage=document.querySelector('#factionImage');
document.querySelectorAll('.faction-tab').forEach(tab=>tab.addEventListener('click',()=>{const data=factions[tab.dataset.faction];document.querySelectorAll('.faction-tab').forEach(t=>{t.classList.toggle('active',t===tab);t.setAttribute('aria-selected',String(t===tab))});factionVisual.classList.add('loading');const preload=new Image();preload.onload=()=>{factionImage.src=data.image;document.querySelector('#factionTag').textContent=data.tag;document.querySelector('#factionTitle').innerHTML=data.title;document.querySelector('#factionText').textContent=data.text;requestAnimationFrame(()=>factionVisual.classList.remove('loading'))};preload.src=data.image}));

const lightbox=document.querySelector('.lightbox');const lightboxImage=lightbox.querySelector('img');const lightboxCaption=lightbox.querySelector('p');
document.querySelectorAll('.gallery-item').forEach(item=>item.addEventListener('click',()=>{lightboxImage.src=item.dataset.full;lightboxCaption.textContent=item.querySelector('span').textContent.trim();lightbox.showModal();document.body.classList.add('locked')}));
const closeLightbox=()=>{lightbox.close();document.body.classList.remove('locked')};lightbox.querySelector('button').addEventListener('click',closeLightbox);lightbox.addEventListener('click',event=>{if(event.target===lightbox)closeLightbox()});

if(matchMedia('(pointer:fine)').matches){document.querySelectorAll('.tilt').forEach(card=>{card.addEventListener('mousemove',e=>{const r=card.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;card.style.transform=`perspective(900px) rotateY(${x*3}deg) rotateX(${-y*3}deg)`});card.addEventListener('mouseleave',()=>card.style.transform='')})}

if(location.hash){setTimeout(()=>document.querySelector(location.hash)?.scrollIntoView(),900)}
