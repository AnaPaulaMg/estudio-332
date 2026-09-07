/* =========================================================
   GALERIA — ESTUDIO 332
   ========================================================= */

/*
 * Dados das mídias
 *
 * type:
 *   photo | video
 *
 * base:
 *   URL da imagem
 *
 * src:
 *   URL do vídeo
 *
 * thumbBase:
 *   Imagem de capa do vídeo
 *
 * caption:
 *   Legenda
 */

const MEDIA_ITEMS = [
  {
    type: "photo",
    base: "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnaWzKOnzSvJ5IEbOYJOz-aypkzpxqljDNCyKkoKtidWEDvtGKLmIuCGvWRtDtFFDKlCL8-DdYA2USfSlH59yEpyyqHfpKAwc-3u1fA-p8091_cX4rgys5SHY67kfIXKCloB1MLaw=s680-w680-h510-rw",
  },
  {
    type: "photo",
    base: "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWmOKa_-DLKquiMj4uY9F_1inx066bUZmI7l8hGxgjl4L_GTmmNMXWUeqtwPnajtyPU0-DFr2Jntp_tmpH7zClTTc5j7Nr85p9U7DcexJa4jABRCvmqC2bylA4YRTe5Ju6ZsHQoz=s680-w680-h510-rw",
  },
  {
    type: "photo",
    base: "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnhDuqStbuw7h7qw2qCE8INqzwfdjI3Ismyzm_-0RvbogGchPJRk4ZKJnHhdQSWkkR4o59MA80ocPjyrly9r9OjL40jrjHXKb6E2Gsj4XrWK4oFdcsYdnCetx-2Yr_V_IJIRKs=s680-w680-h510-rw",
  },
  {
    type: "photo",
    base: "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWl6S63qucFgMeaO3i5pIl2EiNwP3JLZPgJdbdepLRCbMq1covlzPp2zivAEdIrDjOEuql0AZVWtRkytAIx3KMPhQXRjL3uEX0sh9wYumyR-prx0QqgwzDnmgh8kHRpHYGWVFLks=s680-w680-h510-rw",
  },

  {
    type: "video",
    src: "videos/11.mp4",
    thumbBase: "img/11_capa.png",
  },
  {
    type: "video",
    src: "videos/15.mp4",
    thumbBase: "img/15_capa.png",
  },
  {
    type: "video",
    src: "videos/27.mp4",
    thumbBase: "img/27_capa.png",
  },
  {
    type: "video",
    src: "videos/37.mp4",
    thumbBase: "img/37_capa.png",
  },
];

/* =========================================================
   ELEMENTOS
   ========================================================= */

const grid = document.querySelector("#media-grid");
const filters = document.querySelector("#gallery-filters");

const lightbox = document.querySelector("#lightbox");
const lightboxStage = document.querySelector("#lightbox-stage");
const lightboxCaption = document.querySelector("#lightbox-caption");

const lightboxClose = document.querySelector("#lightbox-close");
const lightboxPrev = document.querySelector("#lightbox-prev");
const lightboxNext = document.querySelector("#lightbox-next");

let activeFilter = "all";
let currentIndex = -1;
let visibleItems = [];

/* =========================================================
   URLS DAS IMAGENS
   ========================================================= */

function generateImageUrl(base, width, quality) {
  return `${base}?auto=format&fit=crop&w=${width}&q=${quality}`;
}

function generateSrcset(base) {
  return [
    generateImageUrl(base, 400, 30),
    generateImageUrl(base, 800, 60),
    generateImageUrl(base, 1200, 85),
  ].join(", ");
}

function generatePlaceholderUrl(base) {
  return generateImageUrl(base, 200, 10);
}

/* =========================================================
   CONSTRUIR CARDS
   ========================================================= */

function buildCards() {
  if (!grid) return;

  let html = "";

  MEDIA_ITEMS.forEach((item, index) => {
    const cardClass = "media-card" + (item.type === "video" ? " is-video" : "");

    const imageBase = item.type === "video" ? item.thumbBase : item.base;

    const placeholderSrc = generatePlaceholderUrl(imageBase);

    const srcset = generateSrcset(imageBase);

    const badge =
      item.type === "video" ? `<span class="media-badge">vídeo</span>` : "";

    html += `
      <figure
        class="${cardClass}"
        data-type="${item.type}"
        data-index="${index}"
        tabindex="0"
        role="button"
        aria-label="Abrir ${item.caption}"
      >

        ${badge}

        <img
          class="media-image"
          src="${placeholderSrc}"
          data-srcset="${srcset}"
          sizes="(max-width: 520px) 100vw,
                 (max-width: 850px) 50vw,
                 33.3vw"
          alt="${item.caption}"
          loading="lazy"
        />

        <figcaption>
          ${item.caption}
        </figcaption>

      </figure>
    `;
  });

  grid.innerHTML = html;
}

/* =========================================================
   FILTROS
   ========================================================= */

function applyFilter(filter) {
  activeFilter = filter;

  if (!filters || !grid) return;

  filters.querySelectorAll(".filter-btn").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === filter);
  });

  visibleItems = MEDIA_ITEMS.map((_, index) => index).filter((index) => {
    return filter === "all" || MEDIA_ITEMS[index].type === filter;
  });

  grid.querySelectorAll(".media-card").forEach((card) => {
    const isVisible = filter === "all" || card.dataset.type === filter;

    card.classList.toggle("is-hidden", !isVisible);
  });
}

/* =========================================================
   ABRIR LIGHTBOX
   ========================================================= */

function openLightbox(index) {
  const position = visibleItems.indexOf(index);

  if (position === -1) return;

  currentIndex = position;

  renderLightbox();

  /*
   * Remove o hidden primeiro
   */
  lightbox.removeAttribute("hidden");

  /*
   * Força a aplicação das alterações ou usa requestAnimationFrame duplo
   * para garantir o gatilho da transição CSS.
   */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      lightbox.classList.add("is-open");
    });
  });

  /*
   * Bloqueia o scroll da página.
   */
  document.body.style.overflow = "hidden";

  /*
   * Evita que a página pule por causa da scrollbar.
   */
  const scrollBarWidth =
    window.innerWidth - document.documentElement.clientWidth;

  if (scrollBarWidth > 0) {
    document.body.style.paddingRight = `${scrollBarWidth}px`;
  }

  updateNavigation();
}

/* =========================================================
   RENDERIZAR LIGHTBOX
   ========================================================= */

function renderLightbox() {
  if (!lightboxStage) return;

  const itemIndex = visibleItems[currentIndex];

  const item = MEDIA_ITEMS[itemIndex];

  if (!item) return;

  /*
   * Limpa o conteúdo anterior.
   */
  lightboxStage.innerHTML = "";

  /* -------------------------------------------------------
     FOTO
     ------------------------------------------------------- */

  if (item.type === "photo") {
    const img = document.createElement("img");

    img.src = generateImageUrl(item.base, 1800, 90);

    img.alt = item.caption;

    img.loading = "eager";

    lightboxStage.appendChild(img);
  } else if (item.type === "video") {
    /* -------------------------------------------------------
     VÍDEO
     ------------------------------------------------------- */
    const video = document.createElement("video");

    video.src = item.src;

    video.controls = true;

    video.autoplay = true;

    video.playsInline = true;

    video.preload = "metadata";

    lightboxStage.appendChild(video);

    /*
     * Tenta iniciar automaticamente.
     * Alguns navegadores podem bloquear autoplay.
     */
    video.play().catch(() => {});
  }

  /* -------------------------------------------------------
     LEGENDA
     ------------------------------------------------------- */

  if (lightboxCaption) {
    lightboxCaption.textContent = item.caption;
  }
}

/* =========================================================
   ATUALIZAR BOTÕES DE NAVEGAÇÃO
   ========================================================= */

function updateNavigation() {
  if (!lightboxPrev || !lightboxNext) {
    return;
  }

  /*
   * Se existir somente um item,
   * não precisamos dos botões.
   */

  const shouldHide = visibleItems.length <= 1;

  lightboxPrev.hidden = shouldHide;
  lightboxNext.hidden = shouldHide;
}

/* =========================================================
   NAVEGAÇÃO
   ========================================================= */

function navigateLightbox(direction) {
  if (!visibleItems.length) {
    return;
  }

  currentIndex =
    (currentIndex + direction + visibleItems.length) % visibleItems.length;

  renderLightbox();
  updateNavigation();
}

/* =========================================================
   FECHAR LIGHTBOX
   ========================================================= */

function closeLightbox() {
  if (!lightbox) return;

  lightbox.classList.remove("is-open");

  /*
   * Para qualquer vídeo.
   */
  const video = lightboxStage.querySelector("video");

  if (video) {
    video.pause();
    video.removeAttribute("src");
    video.load();
  }

  /*
   * Limpa o conteúdo.
   */
  lightboxStage.innerHTML = "";

  /*
   * Esconde o modal.
   */
  lightbox.hidden = true;

  /*
   * Libera o scroll.
   */
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";

  currentIndex = -1;
}

/* =========================================================
   EVENTOS DOS FILTROS
   ========================================================= */

if (filters) {
  filters.addEventListener("click", (event) => {
    const button = event.target.closest(".filter-btn");

    if (!button) return;

    applyFilter(button.dataset.filter);
  });
}

/* =========================================================
   EVENTO DOS CARDS
   ========================================================= */

if (grid) {
  grid.addEventListener("click", (event) => {
    const card = event.target.closest(".media-card");

    if (!card) return;

    const index = Number(card.dataset.index);

    openLightbox(index);
  });

  /*
   * Permite abrir usando ENTER ou ESPAÇO.
   */

  grid.addEventListener("keydown", (event) => {
    const card = event.target.closest(".media-card");

    if (!card) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      const index = Number(card.dataset.index);

      openLightbox(index);
    }
  });
}

/* =========================================================
   EVENTOS DO LIGHTBOX
   ========================================================= */

if (lightboxClose) {
  lightboxClose.addEventListener("click", closeLightbox);
}

if (lightboxPrev) {
  lightboxPrev.addEventListener("click", () => navigateLightbox(-1));
}

if (lightboxNext) {
  lightboxNext.addEventListener("click", () => navigateLightbox(1));
}

/* =========================================================
   CLICAR FORA DA MÍDIA
   ========================================================= */

if (lightbox) {
  lightbox.addEventListener("click", (event) => {
    /*
     * Só fecha quando o clique
     * acontece no fundo do modal.
     */

    if (event.target === lightbox) {
      closeLightbox();
    }
  });
}

/* =========================================================
   TECLADO
   ========================================================= */

document.addEventListener("keydown", (event) => {
  if (!lightbox || lightbox.hidden) {
    return;
  }

  if (event.key === "Escape") {
    closeLightbox();

    return;
  }

  if (event.key === "ArrowLeft") {
    navigateLightbox(-1);

    return;
  }

  if (event.key === "ArrowRight") {
    navigateLightbox(1);

    return;
  }
});

/* =========================================================
   MENU MOBILE
   ========================================================= */

const menuToggle = document.querySelector(".menu-toggle");

const header = document.querySelector(".site-header");

if (menuToggle && header) {
  menuToggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("nav-open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.querySelectorAll(".desktop-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      header.classList.remove("nav-open");

      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* =========================================================
   LAZY LOAD / SRCSET
   ========================================================= */

function initializeLazyImages() {
  if (!grid) return;

  const images = grid.querySelectorAll(".media-image");

  images.forEach((img) => {
    const srcset = img.dataset.srcset;

    if (!srcset) return;

    const tempImg = new Image();

    tempImg.src = srcset.split(", ")[0];

    tempImg.onload = () => {
      img.srcset = srcset;

      img.classList.add("is-loaded");
    };
  });
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

buildCards();

applyFilter("all");

initializeLazyImages();
