/* =========================
   ICON MARKER
========================= */
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

/* =========================
   KHỞI TẠO MAP
========================= */
const map = L.map("map").setView([21.0285, 105.8542], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

/* =========================
   BIẾN TOÀN CỤC
========================= */
let centerMarker = null;
let circle = null;
let routeLine = null;

let allMarkers = [];
let filteredMarkers = [];

const SEARCH_RADIUS = 3000; // mét

/* =========================
   LOAD TẤT CẢ NHÀ TRỌ (MÀU XANH)
========================= */
async function loadAll() {
  const res = await fetch("/all");
  const data = await res.json();

  data.forEach(p => {
    const m = L.marker([p.lat, p.lng], { icon: blueIcon })
      .bindPopup(
        `<b>${p.ten}</b><br>
         Giá: ${p.gia.toLocaleString()} VND`
      )
      .addTo(map);

    allMarkers.push(m);
  });
}

loadAll();

/* =========================
   CLICK MAP → CHỌN ĐỊA CHỈ (MÀU ĐỎ)
========================= */
map.on("click", async (e) => {
  const { lat, lng } = e.latlng;

  // dọn lớp cũ
  if (centerMarker) map.removeLayer(centerMarker);
  if (circle) map.removeLayer(circle);
  if (routeLine) map.removeLayer(routeLine);

  filteredMarkers.forEach(m => map.removeLayer(m));
  filteredMarkers = [];

  // marker điểm bắt đầu (ĐỎ)
  centerMarker = L.marker([lat, lng], { icon: redIcon })
    .bindPopup("Địa chỉ đã chọn")
    .addTo(map)
    .openPopup();

  // vòng bán kính
  circle = L.circle([lat, lng], {
    radius: SEARCH_RADIUS,
    color: "red",
    fillOpacity: 0.1
  }).addTo(map);

  // gọi backend lọc theo bán kính
  const res = await fetch(
    `/search?lat=${lat}&lng=${lng}&radius=${SEARCH_RADIUS}`
  );
  const data = await res.json();

  // vẽ phòng trọ (LUÔN XANH)
  data.forEach(p => {
    const m = L.marker([p.lat, p.lng], { icon: blueIcon })
      .bindPopup(
        `<b>${p.ten}</b><br>
         Giá: ${p.gia.toLocaleString()} VND<br>
         <i>Click để dẫn đường</i>`
      )
      .on("click", () => {
        drawRoute(p.lat, p.lng);
      })
      .addTo(map);

    filteredMarkers.push(m);
  });
});

/* =========================
   ROUTING – OSRM
========================= */
async function drawRoute(destLat, destLng) {
  if (!centerMarker) return;

  const start = centerMarker.getLatLng();

  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${start.lng},${start.lat};${destLng},${destLat}` +
    `?overview=full&geometries=geojson`;

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
}
