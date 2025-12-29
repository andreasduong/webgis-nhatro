document.addEventListener("DOMContentLoaded", () => {

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

  const SEARCH_RADIUS = 2000;
  const markers = {};

  const listDiv = document.getElementById("list");
  const hintDiv = document.querySelector(".hint");
  const searchBox = document.getElementById("searchBox");
  const locateBtn = document.getElementById("locateBtn");

  /* ================= LOAD ALL NHÀ TRỌ ================= */
  async function loadAll() {
    const res = await fetch("/all");
    const data = await res.json();

    data.forEach(p => {
      const m = L.marker([p.lat, p.lng], { icon: blueIcon })
        .bindPopup(`<b>${p.ten}</b><br>Giá: ${p.gia.toLocaleString()} VND`)
        .on("click", () => {
          if (centerMarker) drawRoute(p.lat, p.lng);
        })
        .addTo(map);

      markers[p.id] = m;
    });
  }
  loadAll();

  /* ================= LOCAL GEOCODER (GEOJSON) ================= */
  let localPlaces = [];

  async function loadLocalGeocoder() {
    try {
      const res = await fetch("places.geojson");
      const geo = await res.json();
      localPlaces = geo.features;
    } catch (e) {
      console.warn("Không load được geocoder cục bộ", e);
      localPlaces = [];
    }
  }
  loadLocalGeocoder();

  function localGeocode(q) {
    q = q.toLowerCase().trim();
    for (const f of localPlaces) {
      const name = f.properties.name.toLowerCase();
      if (name.includes(q)) {
        const [lng, lat] = f.geometry.coordinates;
        return { lat, lng, name: f.properties.name };
      }
    }
    return null;
  }

  /* ================= CORE SEARCH ================= */
  async function doSearch(lat, lng, label) {

    if (centerMarker) map.removeLayer(centerMarker);
    if (circle) map.removeLayer(circle);
    if (routeLine) {
      map.removeLayer(routeLine);
      routeLine = null;
    }

    listDiv.innerHTML = "";
    hintDiv.style.display = "none";

    centerMarker = L.marker([lat, lng], { icon: redIcon })
      .addTo(map)
      .bindPopup(label)
      .openPopup();

    circle = L.circle([lat, lng], {
      radius: SEARCH_RADIUS,
      color: "red",
      fillOpacity: 0.1
    }).addTo(map);

    map.setView([lat, lng], 14);

    const res = await fetch(`/search?lat=${lat}&lng=${lng}&radius=${SEARCH_RADIUS}`);
    const data = await res.json();

    data.forEach(p => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `<b>${p.ten}</b><br>${p.gia.toLocaleString()} VND`;

      card.onclick = () => {
        map.setView([p.lat, p.lng], 15);
        markers[p.id].openPopup();
        drawRoute(p.lat, p.lng);
      };

      listDiv.appendChild(card);
    });
  }

  /* ================= SEARCH BOX (LOCAL → NOMINATIM) ================= */
  searchBox.addEventListener("keydown", async (e) => {
    if (e.key !== "Enter") return;

    const q = searchBox.value.trim();
    if (!q) return;

    // 1️⃣ geocoder cục bộ
    const local = localGeocode(q);
    if (local) {
      doSearch(local.lat, local.lng, `Địa điểm (cục bộ): ${local.name}`);
      return;
    }

    // 2️⃣ fallback Nominatim
    try {
      const url =
        "https://nominatim.openstreetmap.org/search" +
        "?format=json&q=" + encodeURIComponent(q) +
        "&countrycodes=vn&limit=1";

      const res = await fetch(url);
      const data = await res.json();

      if (!data.length) {
        alert("Không tìm thấy địa điểm");
        return;
      }

      doSearch(+data[0].lat, +data[0].lon, "Địa điểm (Nominatim)");
    } catch {
      alert("Lỗi mạng khi tìm địa điểm");
    }
  });

  /* ================= GEOLOCATION (GPS → IP → CLICK) ================= */
  function locateUser() {
    if (!navigator.geolocation) {
      locateByIP();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        doSearch(pos.coords.latitude, pos.coords.longitude, "Vị trí hiện tại (GPS)");
      },
      () => locateByIP(),
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  function locateByIP() {
    fetch("https://ipapi.co/json/")
      .then(res => res.json())
      .then(loc => {
        if (!loc.latitude || !loc.longitude) throw new Error();
        doSearch(loc.latitude, loc.longitude, "Vị trí ước lượng (IP)");
      })
      .catch(() => {
        alert("Không xác định được vị trí tự động.\nVui lòng click bản đồ.");
      });
  }

  if (locateBtn) {
    locateBtn.onclick = () => locateUser();
  }

  /* ================= CLICK MAP ================= */
  map.on("click", e => {
    doSearch(e.latlng.lat, e.latlng.lng, "Vị trí đã chọn");
  });

  /* ================= ROUTING ================= */
  async function drawRoute(destLat, destLng) {
    if (!centerMarker) return;

    if (routeLine) {
      map.removeLayer(routeLine);
      routeLine = null;
    }

    const start = centerMarker.getLatLng();

    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${start.lng},${start.lat};${destLng},${destLat}` +
      `?overview=full&geometries=geojson`;

    const res = await fetch(url);
    const data = await res.json();
    if (!data.routes || !data.routes.length) return;

    const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);

    routeLine = L.polyline(coords, {
      color: "blue",
      weight: 4
    }).addTo(map);
  }

});
