import { map, redIcon } from "./map.js";

import {
  state,
  SEARCH_RADIUS
} from "./state.js";

import {
  searchNearby
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

export function renderResults(data) {

  listDiv.innerHTML = "";

  data.forEach(p => {

    const card =
      createCard(
        p,
        () => {

          map.setView(
            [p.lat, p.lng],
            15
          );

          state
            .markers[p.id]
            .openPopup();

          drawRoute(
            p.lat,
            p.lng
          );

        }
      );

    listDiv.appendChild(card);

  });

}

export async function doSearch(
  lat,
  lng,
  label
) {

  state.lastLat = lat;
  state.lastLng = lng;

  if (state.centerMarker) {
    map.removeLayer(
      state.centerMarker
    );
  }

  if (state.circle) {
    map.removeLayer(
      state.circle
    );
  }

  if (state.routeLine) {

    map.removeLayer(
      state.routeLine
    );

    state.routeLine = null;

  }

  hintDiv.style.display =
    "none";

  listDiv.innerHTML = "";

  state.centerMarker =
    L.marker(
      [lat, lng],
      {
        icon: redIcon
      }
    )
      .addTo(map)
      .bindPopup(label)
      .openPopup();

  state.circle =
    L.circle(
      [lat, lng],
      {
        radius: SEARCH_RADIUS,
        color: "red",
        fillOpacity: 0.1
      }
    )
      .addTo(map);

  map.setView(
    [lat, lng],
    14
  );

  const data =
    await searchNearby(
      lat,
      lng,
      SEARCH_RADIUS,
      maxPrice.value,
      minArea.value,
      minPeople.value
    );

  renderResults(data);

}