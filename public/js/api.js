export async function getAllMotels() {

  const res =
    await fetch("/all");

  return await res.json();

}

export async function searchNearby(
  lat,
  lng,
  radius,
  maxPrice,
  minArea,
  minPeople
) {

  const params =
    new URLSearchParams({
      lat,
      lng,
      radius,
      maxPrice,
      minArea,
      minPeople
    });

  const res =
    await fetch(
      `/search?${params.toString()}`
    );

  return await res.json();
}