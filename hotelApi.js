import { sampleHotels } from "../data/sampleHotels.js";

const API_URL = window.STAYFINDER_API_URL || "src/data/hotels.json";

export async function getHotels() {
  if (!API_URL) {
    return { hotels: normalizeHotels(sampleHotels), source: "sample" };
  }

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Hotel API returned ${response.status}`);
    }

    const payload = await response.json();
    const hotels = Array.isArray(payload) ? payload : payload.data;

    if (!Array.isArray(hotels)) {
      throw new Error("Hotel API response does not include a data array");
    }

    return { hotels: normalizeHotels(hotels), source: "api" };
  } catch (error) {
    console.warn(error);
    return { hotels: normalizeHotels(sampleHotels), source: "fallback" };
  }
}

function normalizeHotels(hotels) {
  return hotels.map((hotel) => ({
    id: hotel.id,
    name: hotel.name || "Untitled hotel",
    price: Number.parseFloat(hotel.price) || 0,
    thumbnail: hotel.thumbnail || "",
    rating: Number.parseFloat(hotel.rating) || 0,
    location: hotel.location || "Unknown",
    description: hotel.description || "No description available.",
    photos: Array.isArray(hotel.photos) ? hotel.photos.filter(Boolean) : [],
  }));
}
