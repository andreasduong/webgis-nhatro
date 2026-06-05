export const listDiv =
  document.getElementById("list");

export const hintDiv =
  document.querySelector(".hint");

export const searchBox =
  document.getElementById("searchBox");

export const locateBtn =
  document.getElementById("locateBtn");

export const filterBtn =
  document.getElementById("filterBtn");

/* FILTERS */

export const maxPrice =
  document.getElementById("maxPrice");

export const minArea =
  document.getElementById("minArea");

export const minPeople =
  document.getElementById("minPeople");

/* UTILITIES */

export function clearList() {
  listDiv.innerHTML = "";
}

export function createCard(p, onClick) {

  const card =
    document.createElement("div");

  card.className = "card";

  card.innerHTML = `
    <b>${p.ten}</b><br>

    💰 ${p.gia.toLocaleString()} VND<br>

    📐 ${p.dientich || "?"} m²<br>

    👥 ${p.so_nguoi_toi_da || "?"} người
  `;

  card.onclick = onClick;

  return card;
}