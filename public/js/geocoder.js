// geocoder.js

let localPlaces = [];

export async function loadLocalGeocoder() {
  try {
    const res = await fetch("data/places.geojson");
    const geo = await res.json();
    localPlaces = geo.features;
  } catch (e) {
    console.warn("Không load được geocoder cục bộ", e);
    localPlaces = [];
  }
}

export function localGeocode(q) {
  q = q.toLowerCase().trim();

  for (const f of localPlaces) {
    const name = f.properties.name.toLowerCase();

    if (name.includes(q)) {
      const [lng, lat] = f.geometry.coordinates;

      return {
        lat,
        lng,
        name: f.properties.name
      };
    }
  }

  return null;
}