const revealItems = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(
  (entries, observerInstance) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observerInstance.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 },
);
revealItems.forEach((item) => observer.observe(item));

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

const schedule = [
  { day: 1, label: "segunda-feira", open: 8, close: 20 },
  { day: 2, label: "terça-feira", open: 8, close: 20 },
  { day: 3, label: "quarta-feira", open: 8, close: 20 },
  { day: 4, label: "quinta-feira", open: 8, close: 20 },
  { day: 5, label: "sexta-feira", open: 8, close: 20 },
  { day: 6, label: "sábado", open: 8, close: 18 },
  { day: 0, label: "domingo", open: null, close: null },
];
const statusLabel = document.querySelector("#open-status");
const statusDetail = document.querySelector("#status-detail");
const statusDot = document.querySelector(".status-dot");

if (statusLabel && statusDetail && statusDot) {
  function updateOpenStatus() {
    const now = new Date();
    const today = schedule.find((item) => item.day === now.getDay());
    const minutes = now.getHours() * 60 + now.getMinutes();
    const isOpen =
      today.open !== null &&
      minutes >= today.open * 60 &&
      minutes < today.close * 60;
    statusLabel.textContent = isOpen
      ? "Estamos abertos agora"
      : "Estamos fechados agora";
    statusDetail.textContent =
      today.open === null
        ? "Voltamos na segunda às 08h"
        : `Hoje: ${today.open}h às ${today.close}h`;
    statusDot.classList.toggle("is-open", isOpen);
    statusDot.classList.toggle("is-closed", !isOpen);
  }
  updateOpenStatus();
  window.setInterval(updateOpenStatus, 60000);
}

// Google Places API Reviews (using Places API New)
// IMPORTANT: For security, you MUST restrict your API key in Google Cloud Console:
// 1. Go to https://console.cloud.google.com/apis/credentials
// 2. Select or create your API key
// 3. Application restrictions → HTTP referrers (web sites)
//    → Add your domains (e.g., example.com, *.example.com)
// 4. API restrictions → Select ONLY "Places API"
// 5. Save
//
// 6. Set your API key via:
//    - Netlify: Site Settings > Build & Deploy > Environment > GOOGLE_PLACES_API_KEY
//    - Vercel: Project Settings > Environment Variables
//    - Local dev: Create .env file and use a dev server that injects:
//        <meta name="google-places-api-key" content="process.env.GOOGLE_PLACES_API_KEY" />
//    - Or manually set the meta tag content (NOT recommended for production)
//
// This script reads the API key from:
//   1. Meta tag: <meta name="google-places-api-key" content="your_key" />
//   2. Fallback to empty string (will show configuration instructions)

// ==========================================
// GOOGLE PLACES API
// ==========================================

const API_KEY = (() => {
  const metaTag = document.querySelector('meta[name="google-places-api-key"]');

  return metaTag?.getAttribute("content") || "";
})();

// Nome usado para encontrar o estabelecimento
const PLACE_QUERY = "Ronald Ribeiro, Juiz de Fora MG";

// ==========================================
// BUSCAR O PLACE ID
// ==========================================

async function findPlace() {
  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,

        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount",
      },

      body: JSON.stringify({
        textQuery: PLACE_QUERY,

        // Opcional: ajuda o Google a priorizar resultados no Brasil
        languageCode: "pt-BR",
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    throw new Error(error.error?.message || `Erro HTTP ${response.status}`);
  }

  const data = await response.json();

  console.log("Resultados encontrados:", data);

  if (!data.places || data.places.length === 0) {
    throw new Error("Nenhum estabelecimento encontrado.");
  }

  // Primeiro resultado
  const place = data.places[0];

  console.log("Estabelecimento encontrado:", place);

  return place;
}

// ==========================================
// BUSCAR AVALIAÇÕES
// ==========================================

async function fetchReviews() {
  const loader = document.getElementById("reviews-loader");

  if (!API_KEY) {
    if (loader) {
      loader.textContent = "API Key do Google não configurada.";
    }

    console.error("Google Places API key not configured");

    return;
  }

  if (loader) {
    loader.textContent = "Encontrando estabelecimento...";
  }

  try {
    // 1. Encontra o estabelecimento
    const place = await findPlace();

    const placeId = place.id;

    console.log("PLACE ID encontrado:", placeId);

    console.log("Nome:", place.displayName?.text);

    console.log("Endereço:", place.formattedAddress);

    console.log("Avaliações:", place.userRatingCount);

    // ==========================================
    // 2. BUSCAR DETALHES + REVIEWS
    // ==========================================

    if (loader) {
      loader.textContent = "Carregando avaliações...";
    }

    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        method: "GET",

        headers: {
          "X-Goog-Api-Key": API_KEY,

          "X-Goog-FieldMask": "displayName,rating,userRatingCount,reviews",
        },
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));

      throw new Error(error.error?.message || `Erro HTTP ${response.status}`);
    }

    const data = await response.json();

    console.log("Detalhes completos do estabelecimento:", data);

    // ==========================================
    // 3. VERIFICAR REVIEWS
    // ==========================================

    if (!data.reviews || data.reviews.length === 0) {
      if (loader) {
        loader.textContent = "Nenhuma avaliação encontrada.";
      }

      console.warn(
        "O estabelecimento possui",
        data.userRatingCount,
        "avaliações, mas a API não retornou reviews.",
      );

      return;
    }

    // ==========================================
    // 4. RENDERIZAR
    // ==========================================

    showReviews(data.reviews, data.rating, data.userRatingCount);
  } catch (error) {
    console.error("Erro ao buscar avaliações:", error);

    if (loader) {
      loader.textContent = "Erro ao carregar avaliações.";
    }
  }
}

// ==========================================
// MOSTRAR REVIEWS
// ==========================================

function showReviews(reviews, rating, total) {
  const loader = document.getElementById("reviews-loader");

  const list = document.getElementById("reviews-list");

  if (!list) {
    console.error("#reviews-list não encontrado.");

    return;
  }

  loader.style.display = "none";

  // Limpa conteúdo anterior
  list.innerHTML = "";

  // ==========================================
  // NOTA GERAL
  // ==========================================

  if (rating !== undefined) {
    const ratingDiv = document.createElement("div");

    ratingDiv.className = "review-stars";

    const fullStars = Math.floor(rating);

    const halfStar = rating % 1 >= 0.5;

    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    ratingDiv.textContent =
      "★".repeat(fullStars) + (halfStar ? "½" : "") + "☆".repeat(emptyStars);

    list.appendChild(ratingDiv);
  }

  // ==========================================
  // REVIEWS
  // ==========================================

  reviews.slice(0, 3).forEach((review) => {
    const reviewDiv = document.createElement("div");

    reviewDiv.className = "review-item";

    // Autor
    const authorName =
      review.authorAttribution?.displayName || "Usuário do Google";

    // Texto
    const reviewText = review.text?.text || "";

    // Data
    const reviewDate = review.relativePublishTimeDescription || "";

    // Estrelas
    const reviewRating = Number(review.rating) || 0;

    const stars = "★".repeat(reviewRating) + "☆".repeat(5 - reviewRating);

    // ==========================================
    // CRIAÇÃO DO HTML
    // ==========================================

    reviewDiv.innerHTML = `
        <div
          class="review-header"
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
          "
        >
          <span
            class="review-author"
            style="font-weight: 500;"
          >
            ${authorName}
          </span>

          <span
            class="review-rating"
            style="color: #e85d3b;"
          >
            ${stars}
          </span>
        </div>

        <p
          class="review-text"
          style="
            margin: 0.5rem 0;
            line-height: 1.4;
          "
        >
          ${reviewText}
        </p>

        ${
          reviewDate
            ? `
              <span
                class="review-date"
                style="
                  font-size: 0.8rem;
                  color: #999;
                "
              >
                ${reviewDate}
              </span>
            `
            : ""
        }
      `;

    list.appendChild(reviewDiv);
  });
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", fetchReviews);
} else {
  fetchReviews();
}
