const revealItems = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries, observerInstance) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observerInstance.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });
revealItems.forEach((item) => observer.observe(item));

const menuToggle = document.querySelector('.menu-toggle');
const header = document.querySelector('.site-header');
menuToggle.addEventListener('click', () => {
  const isOpen = header.classList.toggle('nav-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});
document.querySelectorAll('.desktop-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    header.classList.remove('nav-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

const toast = document.querySelector('#toast');
let toastTimer;
const photoInput = document.querySelector('#photo-input');
const galleryGrid = document.querySelector('#gallery-grid');

const schedule = [
  { day: 1, label: 'segunda-feira', open: 8, close: 20 },
  { day: 2, label: 'terça-feira', open: 8, close: 20 },
  { day: 3, label: 'quarta-feira', open: 8, close: 20 },
  { day: 4, label: 'quinta-feira', open: 8, close: 20 },
  { day: 5, label: 'sexta-feira', open: 8, close: 20 },
  { day: 6, label: 'sábado', open: 8, close: 18 },
  { day: 0, label: 'domingo', open: null, close: null }
];
const statusLabel = document.querySelector('#open-status');
const statusDetail = document.querySelector('#status-detail');
const statusDot = document.querySelector('.status-dot');

function updateOpenStatus() {
  const now = new Date();
  const today = schedule.find((item) => item.day === now.getDay());
  const minutes = now.getHours() * 60 + now.getMinutes();
  const isOpen = today.open !== null && minutes >= today.open * 60 && minutes < today.close * 60;
  statusLabel.textContent = isOpen ? 'Estamos abertos agora' : 'Estamos fechados agora';
  statusDetail.textContent = today.open === null ? 'Voltamos na segunda às 08h' : `Hoje: ${today.open}h às ${today.close}h`;
  statusDot.classList.toggle('is-open', isOpen);
  statusDot.classList.toggle('is-closed', !isOpen);
}
updateOpenStatus();
window.setInterval(updateOpenStatus, 60000);

document.querySelector('#add-photo').addEventListener('click', () => photoInput.click());
photoInput.addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (!file) return;

  const imageUrl = URL.createObjectURL(file);
  const item = document.createElement('figure');
  item.className = 'gallery-item gallery-item-new reveal visible';
  item.innerHTML = `<img src="${imageUrl}" alt="${file.name}" /><figcaption>novo · ${file.name}</figcaption>`;
  galleryGrid.appendChild(item);
  toast.textContent = 'Foto adicionada à galeria nesta sessão.';
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 3600);
  photoInput.value = '';
});
