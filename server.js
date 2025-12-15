const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.static("public"));

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "gis_webapp", // ĐỔI nếu DB bạn tên khác
  password: "scoping01",
  port: 5432,
});



/* ===== LẤY TẤT CẢ NHÀ TRỌ ===== */
app.get("/all", async (req, res) => {
  const sql = `
    SELECT id, ten, gia,
      ST_Y(geom::geometry) AS lat,
      ST_X(geom::geometry) AS lng
    FROM nhatro;
  `;
  const result = await pool.query(sql);
  res.json(result.rows);
});

/* ===== TÌM THEO BÁN KÍNH ===== */
app.get("/search", async (req, res) => {
  const { lat, lng, radius } = req.query;

  const sql = `
    SELECT id, ten, gia,
      ST_Y(geom::geometry) AS lat,
      ST_X(geom::geometry) AS lng
    FROM nhatro
    WHERE ST_DWithin(
      geom,
      ST_MakePoint($1, $2)::geography,
      $3
    );
  `;

  const result = await pool.query(sql, [lng, lat, radius]);
  res.json(result.rows);
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
