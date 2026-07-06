import { getHotels } from "./services/hotelApi.js";
import { formatCurrency, getUniqueLocations } from "./utils/formatters.js";

const state = {
  hotels: [],
  query: "",
  location: "all",
  minRating: 0,
  maxPrice: 10000,
  sortBy: "recommended",
  selectedHotel: null,
  dataSource: "sample",
};

const app = document.querySelector("#app");

init();

async function init() {
  renderShell();
  const { hotels, source } = await getHotels();
  state.hotels = hotels;
  state.dataSource = source;
  state.maxPrice = Math.ceil(Math.max(...hotels.map((hotel) => hotel.price)));
  renderControls();
  renderResults();
}

function renderShell() {
  app.innerHTML = `
    <header class="hero">
      <nav class="topbar" aria-label="Primary">
        <a class="brand" href="./" aria-label="StayFinder home">StayFinder</a>
        <span class="pill" id="dataSource">Loading stays</span>
      </nav>
      <section class="heroContent">
        <p class="eyebrow">Hotel discovery for Indian city stays</p>
        <h1>Find the right stay without the booking-site clutter.</h1>
        <p class="heroText">
          Search, compare, and shortlist hotels by city, rating, and budget with a fast, responsive browsing experience.
        </p>
      </section>
    </header>

    <main>
      <section class="controls" aria-label="Hotel filters">
        <div class="searchField">
          <label for="search">Search hotels</label>
          <input id="search" type="search" placeholder="Search by name or city" autocomplete="off" />
        </div>
        <div class="filterGrid" id="filters"></div>
      </section>

      <section class="resultsHeader" aria-live="polite">
        <div>
          <p class="sectionLabel">Available stays</p>
          <h2 id="resultCount">Loading hotels</h2>
        </div>
        <button class="ghostButton" id="resetFilters" type="button">Reset</button>
      </section>

      <section class="hotelGrid" id="hotelGrid" aria-label="Hotel results"></section>
    </main>

    <div class="modalRoot" id="modalRoot"></div>
  `;

  document.querySelector("#search").addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderResults();
  });

  document.querySelector("#resetFilters").addEventListener("click", () => {
    state.query = "";
    state.location = "all";
    state.minRating = 0;
    state.sortBy = "recommended";
    state.maxPrice = Math.ceil(Math.max(...state.hotels.map((hotel) => hotel.price)));
    document.querySelector("#search").value = "";
    renderControls();
    renderResults();
  });
}

function renderControls() {
  const locations = getUniqueLocations(state.hotels);
  document.querySelector("#dataSource").textContent = getSourceLabel();
  document.querySelector("#filters").innerHTML = `
    <label class="control">
      <span>City</span>
      <select id="location">
        <option value="all">All cities</option>
        ${locations
          .map(
            (location) =>
              `<option value="${escapeHtml(location)}" ${
                location === state.location ? "selected" : ""
              }>${escapeHtml(location)}</option>`
          )
          .join("")}
      </select>
    </label>

    <label class="control">
      <span>Minimum rating</span>
      <select id="rating">
        ${[0, 3, 3.5, 4, 4.5]
          .map(
            (rating) =>
              `<option value="${rating}" ${
                rating === state.minRating ? "selected" : ""
              }>${rating === 0 ? "Any rating" : `${rating}+`}</option>`
          )
          .join("")}
      </select>
    </label>

    <label class="control">
      <span>Sort by</span>
      <select id="sortBy">
        <option value="recommended" ${state.sortBy === "recommended" ? "selected" : ""}>Recommended</option>
        <option value="priceLow" ${state.sortBy === "priceLow" ? "selected" : ""}>Lowest price</option>
        <option value="priceHigh" ${state.sortBy === "priceHigh" ? "selected" : ""}>Highest price</option>
        <option value="rating" ${state.sortBy === "rating" ? "selected" : ""}>Top rated</option>
      </select>
    </label>

    <label class="control rangeControl">
      <span>Budget up to <strong>${formatCurrency(state.maxPrice)}</strong></span>
      <input id="maxPrice" type="range" min="1000" max="10000" step="250" value="${state.maxPrice}" />
    </label>
  `;

  document.querySelector("#location").addEventListener("change", (event) => {
    state.location = event.target.value;
    renderResults();
  });

  document.querySelector("#rating").addEventListener("change", (event) => {
    state.minRating = Number(event.target.value);
    renderResults();
  });

  document.querySelector("#sortBy").addEventListener("change", (event) => {
    state.sortBy = event.target.value;
    renderResults();
  });

  document.querySelector("#maxPrice").addEventListener("input", (event) => {
    state.maxPrice = Number(event.target.value);
    renderControls();
    renderResults();
  });
}

function renderResults() {
  const hotels = getVisibleHotels();
  document.querySelector("#resultCount").textContent = `${hotels.length} ${
    hotels.length === 1 ? "hotel" : "hotels"
  } found`;

  const grid = document.querySelector("#hotelGrid");

  if (!hotels.length) {
    grid.innerHTML = `
      <article class="emptyState">
        <h3>No stays match these filters.</h3>
        <p>Try a wider budget, another city, or a lower rating threshold.</p>
      </article>
    `;
    return;
  }

  grid.innerHTML = hotels.map(renderHotelCard).join("");
  grid.querySelectorAll("[data-hotel-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedHotel = state.hotels.find(
        (hotel) => hotel.id === Number(button.dataset.hotelId)
      );
      renderModal();
    });
  });
}

function renderHotelCard(hotel) {
  return `
    <article class="hotelCard">
      <img src="${hotel.thumbnail}" alt="${escapeHtml(hotel.name)}" loading="lazy" />
      <div class="hotelBody">
        <div class="hotelMeta">
          <span>${escapeHtml(hotel.location)}</span>
          <span>${hotel.rating.toFixed(1)} / 5</span>
        </div>
        <h3>${escapeHtml(hotel.name)}</h3>
        <p>${escapeHtml(hotel.description)}</p>
        <div class="cardFooter">
          <div>
            <span class="price">${formatCurrency(hotel.price)}</span>
            <span class="night">per night</span>
          </div>
          <button class="primaryButton" type="button" data-hotel-id="${hotel.id}">
            View details
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderModal() {
  const root = document.querySelector("#modalRoot");
  const hotel = state.selectedHotel;

  if (!hotel) {
    root.innerHTML = "";
    return;
  }

  const photos = [hotel.thumbnail, ...hotel.photos].slice(0, 4);
  root.innerHTML = `
    <div class="modalBackdrop" role="presentation"></div>
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <button class="closeButton" id="closeModal" type="button" aria-label="Close hotel details">x</button>
      <div class="photoStrip">
        ${photos
          .map(
            (photo) =>
              `<img src="${photo}" alt="${escapeHtml(hotel.name)} preview" loading="lazy" />`
          )
          .join("")}
      </div>
      <div class="modalBody">
        <p class="sectionLabel">${escapeHtml(hotel.location)} stay</p>
        <h2 id="modalTitle">${escapeHtml(hotel.name)}</h2>
        <p>${escapeHtml(hotel.description)}</p>
        <div class="detailStats">
          <span>${hotel.rating.toFixed(1)} rating</span>
          <span>${formatCurrency(hotel.price)} per night</span>
          <span>${hotel.photos.length} gallery photos</span>
        </div>
        <button class="primaryButton wideButton" type="button">Shortlist hotel</button>
      </div>
    </section>
  `;

  document.querySelector("#closeModal").addEventListener("click", closeModal);
  document.querySelector(".modalBackdrop").addEventListener("click", closeModal);
  document.addEventListener("keydown", closeOnEscape);
}

function closeModal() {
  state.selectedHotel = null;
  document.removeEventListener("keydown", closeOnEscape);
  renderModal();
}

function closeOnEscape(event) {
  if (event.key === "Escape") {
    closeModal();
  }
}

function getVisibleHotels() {
  const filtered = state.hotels.filter((hotel) => {
    const matchesQuery =
      !state.query ||
      hotel.name.toLowerCase().includes(state.query) ||
      hotel.location.toLowerCase().includes(state.query);
    const matchesLocation = state.location === "all" || hotel.location === state.location;
    const matchesRating = hotel.rating >= state.minRating;
    const matchesPrice = hotel.price <= state.maxPrice;

    return matchesQuery && matchesLocation && matchesRating && matchesPrice;
  });

  return filtered.sort((a, b) => {
    if (state.sortBy === "priceLow") return a.price - b.price;
    if (state.sortBy === "priceHigh") return b.price - a.price;
    if (state.sortBy === "rating") return b.rating - a.rating;
    return b.rating * 1000 - b.price - (a.rating * 1000 - a.price);
  });
}

function getSourceLabel() {
  if (state.dataSource === "api") return "API data";
  if (state.dataSource === "fallback") return "API fallback";
  return "Demo data";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
