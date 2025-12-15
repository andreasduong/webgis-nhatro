/* ================= ICON ================= */
const blueIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

/* ================= MAP ================= */
const map = L.map("map").setView([21.0285, 105.8542], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

/* ================= STATE ================= */
let centerMarker = null;
let circle = null;
let routeLine = null;

const SEARCH_RADIUS = 3000;
const markers = {}; // id -> marker

const listDiv = document.getElementById("list");
const hintDiv = document.querySelector(".hint");
const searchBox = document.getElementById("searchBox");

/* ================= LOAD ALL NHÀ TRỌ ================= */
async function loadAll() {
  const res = await fetch("/all");
  const data = await res.json();

  data.forEach(p => {
    const m = L.marker([p.lat, p.lng], { icon: blueIcon })
      .bindPopup(
        `<b>${p.ten}</b><br>
         Giá: ${p.gia.toLocaleString()} VND`
      )
      .on("click", () => {
        if (centerMarker) {
          drawRoute(p.lat, p.lng);
        }
      })
      .addTo(map);

    markers[p.id] = m;
  });
}

loadAll();

/* ================= GEOCODING (ENTER) ================= */
searchBox.addEventListener("keydown", async (e) => {
  if (e.key !== "Enter") return;

  const q = searchBox.value.trim();
  if (!q) return;

  // Giới hạn Việt Nam + ưu tiên Hà Nội
  const url =
    "https://nominatim.openstreetmap.org/search" +
    "?format=json" +
    `&q=${encodeURIComponent(q)}` +
    "&countrycodes=vn" +
    "&limit=1" +
    "&viewbox=105.7,21.2,106.0,20.9" +
    "&bounded=1";

  try {
    const res = await fetch(url, {
      headers: {
        "Accept-Language": "vi"
      }
    });

    const data = await res.json();

    if (!data || data.length === 0) {
      alert("Không tìm thấy địa điểm");
      return;
    }

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);

    map.setView([lat, lng], 14);

  } catch (err) {
    alert("Lỗi tìm kiếm địa điểm");
  }
});

/* ================= CLICK MAP ================= */
map.on("click", async (e) => {
  const { lat, lng } = e.latlng;

  if (centerMarker) map.removeLayer(centerMarker);
  if (circle) map.removeLayer(circle);
  if (routeLine) map.removeLayer(routeLine);

  listDiv.innerHTML = "";
  if (hintDiv) hintDiv.style.display = "none";

  centerMarker = L.marker([lat, lng], { icon: redIcon })
    .bindPopup("Vị trí của bạn")
    .addTo(map)
    .openPopup();

  circle = L.circle([lat, lng], {
    radius: SEARCH_RADIUS,
    color: "red",
    fillOpacity: 0.1
  }).addTo(map);

  const res = await fetch(
    `/search?lat=${lat}&lng=${lng}&radius=${SEARCH_RADIUS}`
  );
  const data = await res.json();

  data.forEach(p => {
    const m = markers[p.id];
    if (!m) return;

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <b>${p.ten}</b><br>
      ${p.gia.toLocaleString()} VND
    `;

    card.onclick = () => {
      map.setView([p.lat, p.lng], 15);
      m.openPopup();
      drawRoute(p.lat, p.lng);
    };

    listDiv.appendChild(card);
  });
});

/* ================= ROUTING ================= */
async function drawRoute(destLat, destLng) {
  if (!centerMarker) return;

  const start = centerMarker.getLatLng();

  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${start.lng},${start.lat};${destLng},${destLat}` +
    `?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes || data.routes.length === 0) return;

    const coords = data.routes[0].geometry.coordinates.map(
      c => [c[1], c[0]]
    );

    if (routeLine) map.removeLayer(routeLine);

    routeLine = L.polyline(coords, {
      color: "blue",
      weight: 4
    }).addTo(map);

  } catch (err) {
    console.error("Routing error", err);
  }
}
