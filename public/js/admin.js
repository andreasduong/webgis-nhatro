const motelList = document.getElementById("motelList");
const searchInput = document.getElementById("searchName");

let motels = [];

// Hiển thị danh sách nhà trọ
function renderMotels(data) {

    motelList.innerHTML = "";

    if (data.length === 0) {

        motelList.innerHTML = "<p>Không tìm thấy nhà trọ.</p>";
        return;

    }

    data.forEach(p => {

        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `
            <h3>🏠 ${p.ten}</h3>

            <p>💰 ${Number(p.gia).toLocaleString()} VND</p>

            <p>📐 ${p.dientich} m²</p>

            <p>👥 ${p.so_nguoi_toi_da} người</p>

            <p>📞 ${p.so_dien_thoai || "Chưa có"}</p>

            <p>📍 ${p.dia_chi || "Chưa cập nhật"}</p>

            <div class="card-actions">

                <button
                    class="editBtn"
                    data-id="${p.id}">
                    Sửa
                </button>

                <button
                    class="deleteBtn"
                    data-id="${p.id}">
                    Xóa
                </button>

            </div>
        `;

        motelList.appendChild(card);

    });

}

// Đọc dữ liệu từ server
async function loadMotels() {

    motelList.innerHTML = "<p>Đang tải dữ liệu...</p>";

    try {

        const res = await fetch("/motels");

        motels = await res.json();

        renderMotels(motels);

    }
    catch (err) {

        console.error(err);

        motelList.innerHTML =
            "<p>Không tải được dữ liệu.</p>";

    }

}

// Tìm kiếm theo tên
searchInput.addEventListener("input", () => {

    const keyword = searchInput.value
        .trim()
        .toLowerCase();

    const result = motels.filter(m =>
        m.ten.toLowerCase().includes(keyword)
    );

    renderMotels(result);

});

// Tải dữ liệu lần đầu
loadMotels();