const API_URL = "http://localhost:3000";

let motels = [];
const $ = (id) => document.getElementById(id);

// 1. Lấy dữ liệu từ Form nhập
function getFormData() {
  return {
    ten: $("ten").value.trim(),
    gia: Number($("gia").value) || 0,
    dientich: Number($("dientich").value) || 0,
    so_nguoi_toi_da: Number($("songuoi").value) || 1,
    so_dien_thoai: $("sdt").value.trim(),
    dia_chi: $("diachi").value.trim(),
    mo_ta: $("mota").value.trim(),
    lat: parseFloat($("lat").value) || 21.028511,
    lng: parseFloat($("lng").value) || 105.804817
  };
}

// 2. Đổ dữ liệu vào Form khi sửa
function setFormData(data = {}) {
  $("motelId").value = data.id || "";
  $("formTitle").innerText = data.id ? "Sửa nhà trọ" : "Thêm nhà trọ";
  
  $("ten").value = data.ten || "";
  $("gia").value = data.gia || "";
  $("dientich").value = data.dientich || "";
  $("songuoi").value = data.so_nguoi_toi_da || data.songuoi || "";
  $("sdt").value = data.so_dien_thoai || data.sdt || "";
  $("diachi").value = data.dia_chi || data.diachi || "";
  $("mota").value = data.mo_ta || data.mota || "";
  $("lat").value = data.lat || "";
  $("lng").value = data.lng || "";
}

// 3. Render danh sách ra thẻ HTML #motelList
function renderMotels(list) {
  const container = $("motelList");
  if (!container) return;

  if (!Array.isArray(list) || list.length === 0) {
    container.innerHTML = "<p>Không tìm thấy nhà trọ nào trong CSDL.</p>";
    return;
  }

  container.innerHTML = list.map(p => `
    <div class="card" style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-radius: 5px;">
      <h3>🏠 ${p.ten || "Chưa đặt tên"}</h3>
      <p>💰 <b>${Number(p.gia || 0).toLocaleString()}</b> VND</p>
      <p>📐 ${p.dientich || 0} m² - 👥 ${p.so_nguoi_toi_da || 1} người</p>
      <p>📞 ${p.so_dien_thoai || "Chưa có"}</p>
      <p>📍 ${p.dia_chi || "Chưa cập nhật"}</p>
      <div class="card-actions">
        <button class="editBtn" data-id="${p.id}">Sửa</button>
        <button class="deleteBtn" data-id="${p.id}">Xóa</button>
      </div>
    </div>
  `).join("");
}

// 4. Tải danh sách nhà trọ từ Server
async function loadMotels() {
  const container = $("motelList");
  if (container) container.innerHTML = "<p>Đang tải dữ liệu...</p>";

  try {
    const res = await fetch(`${API_URL}/motels`);
    if (!res.ok) throw new Error("HTTP Error: " + res.status);
    
    motels = await res.json();
    renderMotels(motels);
  } catch (err) {
    console.error("Lỗi khi tải nhà trọ:", err);
    if (container) {
      container.innerHTML = `<p style="color: red; font-weight: bold;">❌ Không thể kết nối tới Server (http://localhost:3000). Vui lòng chạy command "node server.js"!</p>`;
    }
  }
}

// 5. Thêm / Sửa nhà trọ
async function handleSave() {
  const id = $("motelId").value;
  const isEdit = Boolean(id);
  const method = isEdit ? "PUT" : "POST";
  const url = isEdit ? `${API_URL}/motels/${id}` : `${API_URL}/motels`;

  const payload = getFormData();
  if (!payload.ten) return alert("Vui lòng nhập Tên nhà trọ!");

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert(isEdit ? "Cập nhật thành công!" : "Thêm thành công!");
      setFormData();
      loadMotels();
    } else {
      const err = await res.json();
      alert("Lỗi: " + (err.error || "Không thể lưu"));
    }
  } catch (err) {
    alert("Lỗi kết nối máy chủ!");
  }
}

// 6. Xóa nhà trọ
async function handleDelete(id) {
  if (!confirm("Bạn có chắc chắn muốn xóa nhà trọ này không?")) return;

  try {
    const res = await fetch(`${API_URL}/motels/${id}`, { method: "DELETE" });
    if (res.ok) {
      alert("Xóa nhà trọ thành công!");
      setFormData();
      loadMotels();
    } else {
      alert("Xóa thất bại!");
    }
  } catch (err) {
    alert("Lỗi kết nối máy chủ!");
  }
}

// 7. Bắt sự kiện Click nút Sửa / Xóa trong danh sách
$("motelList")?.addEventListener("click", (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains("deleteBtn")) handleDelete(id);
  if (e.target.classList.contains("editBtn")) {
    const item = motels.find(m => m.id == id);
    if (item) {
      setFormData(item);
      document.querySelector(".form-section")?.scrollIntoView({ behavior: "smooth" });
    }
  }
});

// Event nút bấm Form
$("saveBtn")?.addEventListener("click", handleSave);
$("cancelBtn")?.addEventListener("click", () => setFormData());
$("addBtn")?.addEventListener("click", () => {
  setFormData();
  document.querySelector(".form-section")?.scrollIntoView({ behavior: "smooth" });
});

// Lọc tìm kiếm theo tên
const doSearch = () => {
  const kw = $("searchName") ? $("searchName").value.trim().toLowerCase() : "";
  renderMotels(motels.filter(m => m.ten && m.ten.toLowerCase().includes(kw)));
};

$("searchName")?.addEventListener("input", doSearch);
$("btnSearch")?.addEventListener("click", doSearch);
$("btnReload")?.addEventListener("click", () => {
  if ($("searchName")) $("searchName").value = "";
  loadMotels();
});

// Khởi chạy khi mở trang
loadMotels();