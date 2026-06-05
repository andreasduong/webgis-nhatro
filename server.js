const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* =========================
   DATABASE
========================= */

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "gis_webapp",
  password: "scoping01",
  port: 5432
});

/* =========================
   GET ALL MOTELS
========================= */

app.get("/all", async (req, res) => {

  try {

    const sql = `
      SELECT

        id,
        ten,
        gia,
        dientich,
        so_dien_thoai,
        so_nguoi_toi_da,
        dia_chi,
        mo_ta,

        ST_Y(geom::geometry) AS lat,
        ST_X(geom::geometry) AS lng

      FROM nhatro;
    `;

    const result =
      await pool.query(sql);

    res.json(result.rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Lỗi lấy dữ liệu nhà trọ"
    });

  }

});

/* =========================
   SEARCH NEARBY + FILTER
========================= */

app.get("/search", async (req, res) => {

  try {

    console.log(
      "SEARCH PARAMS:",
      req.query
    );

    const lat =
      parseFloat(req.query.lat);

    const lng =
      parseFloat(req.query.lng);

    const radius =
      parseFloat(req.query.radius);

    const maxPrice =
      parseFloat(
        req.query.maxPrice || 999999999
      );

    const minArea =
      parseFloat(
        req.query.minArea || 0
      );

    const minPeople =
      parseFloat(
        req.query.minPeople || 0
      );

    if (
      isNaN(lat) ||
      isNaN(lng) ||
      isNaN(radius)
    ) {

      return res.status(400).json({
        error:
          "Thiếu hoặc sai tham số lat, lng hoặc radius"
      });

    }

    const sql = `
      SELECT

        id,
        ten,
        gia,
        dientich,
        so_dien_thoai,
        so_nguoi_toi_da,
        dia_chi,
        mo_ta,

        ST_Y(geom::geometry) AS lat,
        ST_X(geom::geometry) AS lng

      FROM nhatro

      WHERE

      ST_DWithin(
        geom::geography,

        ST_SetSRID(
          ST_MakePoint($1, $2),
          4326
        )::geography,

        $3
      )

      AND gia <= $4

      AND dientich >= $5

      AND so_nguoi_toi_da >= $6

      ORDER BY gia ASC;
    `;

    const values = [
      lng,
      lat,
      radius,
      maxPrice,
      minArea,
      minPeople
    ];

    const result =
      await pool.query(
        sql,
        values
      );

    res.json(
      result.rows
    );

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error:
        "Lỗi tìm kiếm nhà trọ"
    });

  }

});

/* =========================
   ADD MOTEL
========================= */

app.post("/add", async (req, res) => {

  try {

    const {
      ten,
      gia,
      dientich,
      so_dien_thoai,
      so_nguoi_toi_da,
      dia_chi,
      mo_ta,
      lat,
      lng
    } = req.body;

    const sql = `
      INSERT INTO nhatro (

        ten,
        gia,
        dientich,
        so_dien_thoai,
        so_nguoi_toi_da,
        dia_chi,
        mo_ta,
        geom

      )

      VALUES (

        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,

        ST_SetSRID(
          ST_MakePoint($8, $9),
          4326
        )

      );
    `;

    await pool.query(
      sql,
      [
        ten,
        gia,
        dientich,
        so_dien_thoai,
        so_nguoi_toi_da,
        dia_chi,
        mo_ta,
        parseFloat(lng),
        parseFloat(lat)
      ]
    );

    res.json({
      ok: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error:
        "Lỗi thêm nhà trọ"
    });

  }

});

/* =========================
   DELETE MOTEL
========================= */

app.delete(
  "/delete/:id",
  async (req, res) => {

    try {

      await pool.query(
        "DELETE FROM nhatro WHERE id = $1",
        [req.params.id]
      );

      res.json({
        ok: true
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error:
          "Lỗi xóa nhà trọ"
      });

    }

  }
);

/* =========================
   START SERVER
========================= */

app.listen(
  3000,
  () => {

    console.log(
      "Server running at http://localhost:3000"
    );

  }
);