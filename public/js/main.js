import { locateUser } from "./location.js";
import { initMap, map, blueIcon } from "./map.js";
import { state } from "./state.js";
import { getAllMotels } from "./api.js";
import { loadLocalGeocoder, localGeocode } from "./geocoder.js";
import { doSearch } from "./search.js";
import {
  searchBox,
  locateBtn,
  filterBtn
} from "./ui.js";
import { drawRoute } from "./routing.js";

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    /* Nút GPS */

    if (locateBtn) {

      locateBtn.onclick = () => {
        locateUser();
      };

    }

    /* Khởi tạo */

    initMap();

    await loadLocalGeocoder();

    /* Nút áp dụng bộ lọc */

    if (filterBtn) {

      filterBtn.addEventListener(
        "click",
        () => {

          if (
            state.lastLat === null ||
            state.lastLng === null
          ) {

            alert(
              "Hãy tìm kiếm hoặc chọn vị trí trước"
            );

            return;
          }

          doSearch(
            state.lastLat,
            state.lastLng,
            "Kết quả đã lọc"
          );

        }
      );

    }

    /* Load tất cả marker */

    const data =
      await getAllMotels();

    data.forEach((p) => {

      const marker =
        L.marker(
          [p.lat, p.lng],
          {
            icon: blueIcon
          }
        )
          .bindPopup(`
            <div style="min-width:220px; font-family:sans-serif; line-height:1.4;">

              <h3 style="margin:0 0 8px 0; color:#1a73e8;">
                ${p.ten}
              </h3>

              <p style="margin:4px 0;">
                💰 <b>Giá:</b>
                ${
                  p.gia
                    ? p.gia.toLocaleString()
                    : "Chưa cập nhật"
                }
                VND
              </p>

              <p style="margin:4px 0;">
                📐 <b>Diện tích:</b>
                ${p.dientich || "Chưa cập nhật"}
                m²
              </p>

              <p style="margin:4px 0;">
                👥 <b>Tối đa:</b>
                ${p.so_nguoi_toi_da || "?"}
                người
              </p>

              <p style="margin:4px 0;">
                📞 <b>SĐT:</b>
                ${p.so_dien_thoai || "Chưa có"}
              </p>

              <p style="margin:4px 0;">
                📍 <b>Địa chỉ:</b>
                ${p.dia_chi || "Chưa cập nhật"}
              </p>

            </div>
          `)

          .on("click", () => {

            map.setView(
              [p.lat, p.lng],
              16
            );

            if (
              state.centerMarker
            ) {

              drawRoute(
                p.lat,
                p.lng
              );

            }

          })

          .addTo(map);

      state.markers[p.id] =
        marker;

    });

    /* Enter trong ô tìm kiếm */

    searchBox.addEventListener(
      "keydown",
      async (e) => {

        if (
          e.key !== "Enter"
        ) return;

        const q =
          searchBox.value.trim();

        if (!q) return;

        const local =
          localGeocode(q);

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

          const res =
            await fetch(url);

          const result =
            await res.json();

          if (
            !result.length
          ) {

            alert(
              "Không tìm thấy địa điểm"
            );

            return;
          }

          doSearch(
            +result[0].lat,
            +result[0].lon,
            "Địa điểm"
          );

        } catch (err) {

          console.error(err);

          alert(
            "Lỗi mạng khi tìm kiếm"
          );

        }

      }
    );

    /* Click bản đồ */

    map.on(
      "click",
      (e) => {

        doSearch(
          e.latlng.lat,
          e.latlng.lng,
          "Vị trí đã chọn"
        );

      }
    );

  }
);