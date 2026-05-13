// routing.js

import { map } from "./map.js";
import { state } from "./state.js";

export async function drawRoute(destLat, destLng) {
  if (!state.centerMarker) return;

  if (state.routeLine) {
    map.removeLayer(state.routeLine);
    state.routeLine = null;
  }

  const start = state.centerMarker.getLatLng();

  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${start.lng},${start.lat};${destLng},${destLat}` +
    `?overview=full&geometries=geojson`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.routes?.length) return;

  const coords = data.routes[0].geometry.coordinates.map(
    c => [c[1], c[0]]
  );

  state.routeLine = L.polyline(coords, {
    color: "blue",
    weight: 4
  }).addTo(map);
}