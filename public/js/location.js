// location.js

import { doSearch } from "./search.js";

let isLocating = false;

export function locateUser() {
  if (!navigator.geolocation) {
    alert("Trình duyệt của bạn không hỗ trợ định vị GPS.");
    return;
  }

  if (isLocating) return;
  isLocating = true;

  // Cấu hình định vị
  const options = {
    enableHighAccuracy: true, // Bật true để lấy vị trí chính xác hơn
    timeout: 10000,            // Chờ tối đa 10 giây
    maximumAge: 30000          // Chấp nhận cache trong vòng 30 giây
  };

  const onSuccess = (pos) => {
    isLocating = false;
    doSearch(
      pos.coords.latitude,
      pos.coords.longitude,
      "Vị trí hiện tại"
    );
  };

  const onError = (err) => {
    console.warn("Thử định vị chính xác thất bại, thử lại cấu hình nới lỏng...", err);

    // Nếu lần 1 thất bại (ví dụ do Timeout), thử lại lần 2 với cấu hình nhẹ hơn (Dựa trên IP/Wifi)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        isLocating = false;
        doSearch(
          pos.coords.latitude,
          pos.coords.longitude,
          "Vị trí hiện tại"
        );
      },
      (fallbackErr) => {
        isLocating = false;
        console.error("Lỗi định vị:", fallbackErr);

        if (fallbackErr.code === fallbackErr.PERMISSION_DENIED) {
          alert("Bạn đã chặn quyền truy cập vị trí. Vui lòng cho phép ứng dụng truy cập vị trí trên trình duyệt.");
        } else {
          alert("Không thể lấy được vị trí hiện tại. Vui lòng kiểm tra lại kết nối mạng hoặc GPS.");
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 0
      }
    );
  };

  // Gọi lệnh lấy vị trí
  navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
}