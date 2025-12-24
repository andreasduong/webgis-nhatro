const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "gis_webapp",
  password: "scoping01",
  port: 5432
});

/* ALL */
app.get("/all", async (req, res) => {
  const sql = `
    SELECT id, ten, gia,
      ST_Y(geom::geometry) AS lat,
      ST_X(geom::geometry) AS lng
    FROM nhatro;
  `;
  const r = await pool.query(sql);
  res.json(r.rows);
});

/* SEARCH */
app.get("/search", async (req, res) => {
  const { lat, lng, radius } = req.query;
  const sql = `
    SELECT id, ten, gia,
      ST_Y(geom::geometry) AS lat,
      ST_X(geom::geometry) AS lng
    FROM nhatro
    WHERE ST_DWithin(
      geom,
      ST_MakePoint($1,$2)::geography,
      $3
    );
  `;
  const r = await pool.query(sql, [lng, lat, radius]);
  res.json(r.rows);
});

/* ADD */
app.post("/add", async (req, res) => {
  const { ten, gia, lat, lng } = req.body;
  const sql = `
    INSERT INTO nhatro (ten, gia, geom)
    VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3,$4),4326)::geography);
  `;
  await pool.query(sql, [ten, gia, lng, lat]);
  res.json({ ok: true });
});

/* DELETE */
app.delete("/delete/:id", async (req, res) => {
  await pool.query("DELETE FROM nhatro WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
