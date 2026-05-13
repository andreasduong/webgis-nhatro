// ui.js

export const listDiv = document.getElementById("list");
export const hintDiv = document.querySelector(".hint");
export const searchBox = document.getElementById("searchBox");
export const locateBtn = document.getElementById("locateBtn");

export function clearList() {
  listDiv.innerHTML = "";
}

export function createCard(p, onClick) {
  const card = document.createElement("div");

  card.className = "card";

  card.innerHTML = `
    <b>${p.ten}</b><br>
    ${p.gia.toLocaleString()} VND
  `;

  card.onclick = onClick;

  return card;
}