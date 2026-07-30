import { map, redIcon } from "./map.js";

import {
  state,
  SEARCH_RADIUS
} from "./state.js";

import {
  searchNearby,
  getAllMotels // <-- 1. Import thêm hàm getAllMotels
} from "./api.js";

import {
  drawRoute
} from "./routing.js";

import {
  listDiv,
  hintDiv,
  createCard,
  maxPrice,
  minArea,
  minPeople
} from "./ui.js";

const searchName = document.getElementById("searchName");

export function renderResults(data) {
  listDiv.innerHTML = "";

  const keyword = searchName ? searchName.value.trim().toLowerCase() : "";

  // Lọc dữ liệu theo từ khóa
  const filtered = data.filter(p =>
    p.ten ? p.ten.toLowerCase().includes(keyword) : true
  );

  if (filtered.length === 0) {
    listDiv.innerHTML = "<p>Không tìm thấy nhà trọ.</p>";
    return;
  }

  filtered.forEach(p => {
    const card = createCard(p, () => {
      map.setView([p.lat, p.lng], 15);
      
      if (state.markers && state.markers[p.id]) {
        state.markers[p.id].openPopup();
      }

      drawRoute(p.lat, p.lng);
    });

    listDiv.appendChild(card);
  });
}

export async function doSearch(lat, lng, label) {
  state.lastLat = lat;
  state.lastLng = lng;

  // Dọn dẹp ô tìm kiếm tên khi click chọn vị trí mới
  if (searchName) searchName.value = "";

  if (state.centerMarker) {
    map.removeLayer(state.centerMarker);
  }

  if (state.circle) {
    map.removeLayer(state.circle);
  }

  if (state.routeLine) {
    map.removeLayer(state.routeLine);
    state.routeLine = null;
  }

  hintDiv.style.display = "none";
  listDiv.innerHTML = "";

  state.centerMarker = L.marker([lat, lng], { icon: redIcon })
    .addTo(map)
    .bindPopup(label)
    .openPopup();

  state.circle = L.circle([lat, lng], {
    radius: SEARCH_RADIUS,
    color: "red",
    fillOpacity: 0.1
  }).addTo(map);

  map.setView([lat, lng], 14);

  const data = await searchNearby(
    lat,
    lng,
    SEARCH_RADIUS,
    maxPrice.value,
    minArea.value,
    minPeople.value
  );

  state.lastResults = data;
  renderResults(data);
}

// 2. Cập nhật sự kiện gõ ô tìm kiếm
if (searchName) {
  let timeout = null;

  searchName.addEventListener("input", async () => {
    const keyword = searchName.value.trim();

    // Nếu người dùng nhập từ khóa -> Xóa bán kính khoanh tròn cũ trên bản đồ
    if (keyword.length > 0) {
      if (state.centerMarker) {
        map.removeLayer(state.centerMarker);
        state.centerMarker = null;
      }
      if (state.circle) {
        map.removeLayer(state.circle);
        state.circle = null;
      }

      // Tải TOÀN BỘ nhà trọ từ CSDL về để tìm kiếm
      const allMotels = await getAllMotels();
      state.lastResults = allMotels;
      renderResults(allMotels);
    } else {
      // Nếu xóa rỗng ô tìm kiếm
      if (state.lastResults) {
        renderResults(state.lastResults);
      }
    }
  });
}