const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = [...document.querySelectorAll('.main-nav a')];
const glow = document.querySelector('.cursor-glow');
const progress = document.querySelector('.page-progress span');
const backToTop = document.querySelector('.back-to-top');

menuToggle?.addEventListener('click', () => {
  const isOpen = header.classList.toggle('menu-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.forEach(link => link.addEventListener('click', () => {
  header.classList.remove('menu-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
}));

if (glow) {
  window.addEventListener('pointermove', (event) => {
    glow.style.left = `${event.clientX}px`;
    glow.style.top = `${event.clientY}px`;
  }, { passive: true });
}

const updateScrollFeatures = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const percent = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
  if (progress) progress.style.width = `${percent}%`;
  backToTop?.classList.toggle('visible', scrollTop > 520);
};
window.addEventListener('scroll', updateScrollFeatures, { passive: true });
window.addEventListener('load', updateScrollFeatures);

backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

const sections = [...document.querySelectorAll('main section[id]')];
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const id = entry.target.getAttribute('id');
    navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
  });
}, { rootMargin: '-45% 0px -48% 0px', threshold: 0 });
sections.forEach(section => navObserver.observe(section));

const form = document.querySelector('#avaliacaoForm');
const status = document.querySelector('#avaliacaoStatus');
const listaAvaliacoes = document.querySelector('#avaliacoesLista');
const notaInput = document.querySelector('#notaInput');
const starButtons = [...document.querySelectorAll('.star-rating button')];
const baixarAvaliacoes = document.querySelector('#baixarAvaliacoes');

function getAvaliacoes() {
  try {
    return JSON.parse(localStorage.getItem('avaliacoes-secretaria') || '[]');
  } catch {
    return [];
  }
}

function setRating(value) {
  if (!notaInput) return;
  notaInput.value = `${value} - ${value === 5 ? 'Excelente' : value === 4 ? 'Muito bom' : value === 3 ? 'Bom' : value === 2 ? 'Regular' : 'Precisa melhorar'}`;
  starButtons.forEach(btn => btn.classList.toggle('active', Number(btn.dataset.rating) <= Number(value)));
}

starButtons.forEach(btn => {
  btn.addEventListener('click', () => setRating(btn.dataset.rating));
});

function renderAvaliacoes() {
  if (!listaAvaliacoes) return;
  const avaliacoes = getAvaliacoes().slice(-3).reverse();
  if (!avaliacoes.length) {
    listaAvaliacoes.innerHTML = '<div class="avaliacao-item"><strong>Nenhuma avaliação registrada ainda.</strong><small>As próximas avaliações aparecerão aqui.</small></div>';
    return;
  }
  listaAvaliacoes.innerHTML = avaliacoes.map(item => `
    <div class="avaliacao-item">
      <strong>${escapeHtml(item.nome || 'Sem nome')} ${item.setor ? `• ${escapeHtml(item.setor)}` : ''}</strong>
      <small>${escapeHtml(item.nota || '')} • ${escapeHtml(item.data || '')}</small>
      ${item.comentario ? `<p>${escapeHtml(item.comentario)}</p>` : ''}
    </div>
  `).join('');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!notaInput?.value) {
    status.textContent = 'Escolha uma nota tocando nas estrelas.';
    return;
  }
  const data = Object.fromEntries(new FormData(form).entries());
  const avaliacoes = getAvaliacoes();
  avaliacoes.push({ ...data, data: new Date().toLocaleString('pt-BR') });
  localStorage.setItem('avaliacoes-secretaria', JSON.stringify(avaliacoes));
  form.reset();
  starButtons.forEach(btn => btn.classList.remove('active'));
  status.textContent = 'Avaliação salva neste navegador.';
  renderAvaliacoes();
  setTimeout(() => status.textContent = '', 4500);
});

baixarAvaliacoes?.addEventListener('click', () => {
  const avaliacoes = getAvaliacoes();
  const linhas = [
    ['Nome', 'Setor', 'Nota', 'Comentário', 'Data'],
    ...avaliacoes.map(item => [item.nome || '', item.setor || '', item.nota || '', item.comentario || '', item.data || ''])
  ];
  const csv = linhas.map(linha => linha.map(campo => `"${String(campo).replaceAll('"', '""')}"`).join(';')).join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'avaliacoes-secretaria-academica.csv';
  link.click();
  URL.revokeObjectURL(url);
});

renderAvaliacoes();
