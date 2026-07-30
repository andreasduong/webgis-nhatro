import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import pg from "pg";
const { Pool } = pg;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT)
});

// Select query chuẩn kèm tọa độ lat/lng từ PostGIS
const SELECT_QUERY = `
  SELECT 
    id, ten, gia, dientich, 
    so_dien_thoai, so_nguoi_toi_da, dia_chi, mo_ta,
    ST_Y(geom::geometry) AS lat, 
    ST_X(geom::geometry) AS lng
  FROM nhatro
`;

/* ========================= RESTful CRUD API ========================= */

// 1. GET ALL MOTELS
app.get("/motels", async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_QUERY} ORDER BY id DESC;`);
    res.json(result.rows);
  } catch (err) {
    console.error("Lỗi GET /motels:", err);
    res.status(500).json({ error: "Lỗi lấy danh sách nhà trọ" });
  }
});

/* -------------------------------------------------------------------------- */
/*  👉 ROUTE TƯƠNG THÍCH NGƯỢC (Giúp trang index.html / main.js chạy lại)   */
/* -------------------------------------------------------------------------- */
app.get("/all", async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_QUERY} ORDER BY id DESC;`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Lỗi lấy danh sách nhà trọ" });
  }
});

app.get("/nhatro", async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_QUERY} ORDER BY id DESC;`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Lỗi lấy danh sách nhà trọ" });
  }
});

app.get("/api/motels", async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_QUERY} ORDER BY id DESC;`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Lỗi lấy danh sách nhà trọ" });
  }
});
/* -------------------------------------------------------------------------- */

// 2. GET BY ID
app.get("/motels/:id", async (req, res) => {
  try {
    const result = await pool.query(`${SELECT_QUERY} WHERE id = $1;`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "Không tìm thấy" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Lỗi lấy chi tiết nhà trọ" });
  }
});

// 3. CREATE MOTEL (POST)
app.post("/motels", async (req, res) => {
  try {
    const b = req.body;
    const ten = b.ten || "Chưa đặt tên";
    const gia = Number(b.gia) || 0;
    const dientich = Number(b.dientich) || 0;
    const sdt = b.so_dien_thoai || b.sdt || "";
    const songuoi = Number(b.so_nguoi_toi_da || b.songuoi) || 1;
    const diachi = b.dia_chi || b.diachi || "";
    const mota = b.mo_ta || b.mota || "";
    const lat = parseFloat(b.lat) || 21.028511;
    const lng = parseFloat(b.lng) || 105.804817;

    const sql = `
      INSERT INTO nhatro (ten, gia, dientich, so_dien_thoai, so_nguoi_toi_da, dia_chi, mo_ta, geom)
      VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($8, $9), 4326))
      RETURNING id;
    `;
    const result = await pool.query(sql, [ten, gia, dientich, sdt, songuoi, diachi, mota, lng, lat]);
    res.status(201).json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    console.error("Lỗi POST /motels:", err);
    res.status(500).json({ error: "Lỗi thêm nhà trọ vào PostgreSQL" });
  }
});

// 4. UPDATE MOTEL (PUT)
app.put("/motels/:id", async (req, res) => {
  try {
    const b = req.body;
    const ten = b.ten || "";
    const gia = Number(b.gia) || 0;
    const dientich = Number(b.dientich) || 0;
    const sdt = b.so_dien_thoai || b.sdt || "";
    const songuoi = Number(b.so_nguoi_toi_da || b.songuoi) || 1;
    const diachi = b.dia_chi || b.diachi || "";
    const mota = b.mo_ta || b.mota || "";
    const lat = parseFloat(b.lat) || 21.028511;
    const lng = parseFloat(b.lng) || 105.804817;

    const sql = `
      UPDATE nhatro SET
        ten = $1, gia = $2, dientich = $3, so_dien_thoai = $4,
        so_nguoi_toi_da = $5, dia_chi = $6, mo_ta = $7,
        geom = ST_SetSRID(ST_MakePoint($8, $9), 4326)
      WHERE id = $10;
    `;
    await pool.query(sql, [ten, gia, dientich, sdt, songuoi, diachi, mota, lng, lat, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Lỗi PUT /motels:", err);
    res.status(500).json({ error: "Lỗi cập nhật nhà trọ" });
  }
});

// 5. DELETE MOTEL
app.delete("/motels/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM nhatro WHERE id = $1;", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Lỗi DELETE /motels:", err);
    res.status(500).json({ error: "Lỗi xóa nhà trọ" });
  }
});

/* ========================= WEBGIS SEARCH & OSM ========================= */

// Spatial Search (Tìm quanh vị trí + Lọc)
app.get("/search", async (req, res) => {
  try {
    const { lat, lng, radius, maxPrice = 999999999, minArea = 0, minPeople = 0 } = req.query;
    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      return res.status(400).json({ error: "Thiếu tham số tọa độ GIS" });
    }

    const sql = `
      ${SELECT_QUERY}
      WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
        AND gia <= $4 AND dientich >= $5 AND so_nguoi_toi_da >= $6
      ORDER BY gia ASC;
    `;
    const result = await pool.query(sql, [
      parseFloat(lng), parseFloat(lat), parseFloat(radius),
      parseFloat(maxPrice), parseFloat(minArea), parseFloat(minPeople)
    ]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Lỗi tìm kiếm không gian" });
  }
});

// OSM Proxy APIs
app.get("/geocode", async (req, res) => {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=vn&limit=1&q=${encodeURIComponent(req.query.q)}`, { headers: { "User-Agent": "WebGIS Motel" } });
    res.json(await r.json());
  } catch (err) { res.status(500).json({ error: "Lỗi geocode" }); }
});

app.get("/reverse-geocode", async (req, res) => {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${req.query.lat}&lon=${req.query.lng}`, { headers: { "User-Agent": "WebGIS Motel" } });
    res.json(await r.json());
  } catch (err) { res.status(500).json({ error: "Lỗi reverse geocode" }); }
});

app.get("/route", async (req, res) => {
  try {
    const { startLat, startLng, endLat, endLng } = req.query;
    const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`);
    res.json(await r.json());
  } catch (err) { res.status(500).json({ error: "Lỗi routing" }); }
});

// Catch-all 404 Handler trả về JSON (chống lỗi SyntaxError: Unexpected token '<')
app.use((req, res) => {
  res.status(404).json({ error: `Không tìm thấy đường dẫn ${req.originalUrl}` });
});

app.listen(3000, () => console.log("🚀 Server GIS running at http://localhost:3000"));