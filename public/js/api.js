// api.js

export async function getAllMotels() {
  const res = await fetch("/all");
  return await res.json();
}

export async function searchNearby(lat, lng, radius) {
  const res = await fetch(
    `/search?lat=${lat}&lng=${lng}&radius=${radius}`
  );

  return await res.json();
}