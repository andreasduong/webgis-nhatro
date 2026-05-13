// main.js
import { locateUser } from "./location.js";

import {
  initMap,
  map,
  blueIcon
} from "./map.js";

import { state } from "./state.js";

import { getAllMotels } from "./api.js";

import {
  loadLocalGeocoder,
  localGeocode
} from "./geocoder.js";

import { doSearch } from "./search.js";

import {
  searchBox,
  locateBtn
} from "./ui.js";

import { drawRoute } from "./routing.js";

document.addEventListener("DOMContentLoaded", async () => {
  if (locateBtn) {

  locateBtn.onclick = () => {
    locateUser();
  };

}
    initMap();

  await loadLocalGeocoder();

  const data = await getAllMotels();

  data.forEach(p => {

    const m = L.marker([p.lat, p.lng], {
      icon: blueIcon
    })
      .bindPopup(`
        <b>${p.ten}</b><br>
        Giá: ${p.gia.toLocaleString()} VND
      `)
      .on("click", () => {
        if (state.centerMarker) {
          drawRoute(p.lat, p.lng);
        }
      })
      .addTo(map);

    state.markers[p.id] = m;


  });

  searchBox.addEventListener("keydown", async e => {

    if (e.key !== "Enter") return;

    const q = searchBox.value.trim();

    if (!q) return;

    const local = localGeocode(q);

    if (local) {
      doSearch(
        local.lat,
        local.lng,
        `Địa điểm: ${local.name}`
      );

      return;
    }

    try {

      const url =
        "https://nominatim.openstreetmap.org/search" +
        "?format=json&q=" +
        encodeURIComponent(q) +
        "&countrycodes=vn&limit=1";

      const res = await fetch(url);

      const result = await res.json();

      if (!result.length) {
        alert("Không tìm thấy địa điểm");
        return;
      }

      doSearch(
        +result[0].lat,
        +result[0].lon,
        "Địa điểm"
      );

    } catch {
      alert("Lỗi mạng");
    }
  });

  map.on("click", e => {
    doSearch(
      e.latlng.lat,
      e.latlng.lng,
      "Vị trí đã chọn"
    );
  });

});