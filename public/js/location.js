// location.js

import { doSearch } from "./search.js";

export function locateUser() {

  if (!navigator.geolocation) {
    alert("Trình duyệt không hỗ trợ GPS");
    return;
  }

  navigator.geolocation.getCurrentPosition(

    pos => {

      doSearch(
        pos.coords.latitude,
        pos.coords.longitude,
        "Vị trí hiện tại"
      );
    },

    err => {

      console.error(err);

      alert("Không lấy được vị trí");
    },

    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 60000
    }
  );
}