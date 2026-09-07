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

// Estudio 332 - Google Places API Integration (SECURE VERSION)
//
// IMPORTANT: This version uses a secure proxy to avoid exposing your API key.
//
// 1. A serverless function at /api/places-proxy.js handles communication with Google
// 2. Your API key is stored securely in Vercel Environment Variables (never exposed)
// 3. Frontend only communicates with your own domain
//
// To set up:
// 1. Create /api/places-proxy.js with the proxy code (provided separately)
// 2. Add GOOGLE_PLACES_API_KEY to Vercel Project Settings > Environment Variables
// 3. Restrict your API key in Google Cloud Console to your domains
// 4. Deploy!

// ==========================================
// GOOGLE PLACES API (VIA SECURE PROXY)
// ==========================================

// Nome usado para encontrar o estabelecimento
const PLACE_QUERY = "Ronald Ribeiro, Juiz de Fora MG";

// ==========================================
// BUSCAR O PLACE ID (VIA PROXY)
// ==========================================

async function findPlace() {
  const loader = document.getElementById("reviews-loader");
  if (loader) {
    loader.textContent = "Encontrando estabelecimento...";
  }

  try {
    // CHAMA SEU PRÓPRIO PROXY (NUNO GOOGLE DIRETO!)
    const response = await fetch(
      `/api/places-proxy?textQuery=${encodeURIComponent(PLACE_QUERY)}&languageCode=pt-BR`,
    );

    if (!response.ok) {
      throw new Error(`Erro ao buscar estabelecimento: ${response.status}`);
    }

    const data = await response.json();

    console.log("Resultados encontrados via proxy:", data);

    if (!data.places || data.places.length === 0) {
      throw new Error("Nenhum estabelecimento encontrado.");
    }

    // Primeiro resultado
    const place = data.places[0];

    console.log("Estabelecimento encontrado:", place);
    return place;
  } catch (error) {
    console.error("Erro ao buscar estabelecimento:", error);
    if (loader) {
      loader.textContent = "Erro ao buscar estabelecimento.";
    }
    throw error;
  }
}

// ==========================================
// BUSCAR AVALIAÇÕES (VIA PROXY)
// ==========================================

async function fetchReviews() {
  const loader = document.getElementById("reviews-loader");

  if (!loader) {
    console.error("Elemento #reviews-loader não encontrado");
    return;
  }

  try {
    // 1. Encontra o estabelecimento via proxy
    const place = await findPlace();
    const placeId = place.id;

    console.log("PLACE ID encontrado:", placeId);

    if (loader) {
      loader.textContent = "Carregando avaliações...";
    }

    // 2. Busca detalhes + reviews via proxy
    const response = await fetch(
      `/api/places-proxy?placeId=${encodeURIComponent(placeId)}&fields=displayName,rating,userRatingCount,reviews&languageCode=pt-BR`,
    );

    if (!response.ok) {
      throw new Error(`Erro ao buscar detalhes: ${response.status}`);
    }

    const data = await response.json();

    console.log("Detalhes completos do estabelecimento:", data);

    // 3. Verifica reviews
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

    // 4. Renderiza
    showReviews(data.reviews, data.rating, data.userRatingCount);
  } catch (error) {
    console.error("Erro ao buscar avaliações:", error);
    if (loader) {
      loader.textContent = "Erro ao carregar avaliações.";
    }
  }
}

// ==========================================
// MOSTRAR REVIEWS (MANTIDO IGUAL)
// ==========================================

function showReviews(reviews, rating, total) {
  const loader = document.getElementById("reviews-loader");
  const list = document.getElementById("reviews-list");

  if (!list) {
    console.error("#reviews-list não encontrado.");
    return;
  }

  loader.style.display = "none";
  list.innerHTML = "";

  // NOTA GERAL
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

  // REVIEWS
  reviews.slice(0, 3).forEach((review) => {
    const reviewDiv = document.createElement("div");
    reviewDiv.className = "review-item";

    const authorName =
      review.authorAttribution?.displayName || "Usuário do Google";
    const reviewText = review.text?.text || "";
    const reviewDate = review.relativePublishTimeDescription || "";
    const reviewRating = Number(review.rating) || 0;

    const stars = "★".repeat(reviewRating) + "☆".repeat(5 - reviewRating);

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
