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

  /* GET MOTEL BY ID */
  app.get("/motels/:id", async (req, res) => {
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
        FROM nhatro
        WHERE id = $1
      `;

      const result =
        await pool.query(
          sql,
          [req.params.id]
        );

      if (!result.rows.length) {
        return res
          .status(404)
          .json({
            error: "Không tìm thấy nhà trọ"
          });
      }

      res.json(result.rows[0]);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Lỗi lấy chi tiết nhà trọ"
      });

    }
  });

  /* UPDATE MOTEL */
  app.put("/motels/:id", async (req, res) => {

    try {

      const {
        ten,
        gia,
        dientich,
        so_dien_thoai,
        so_nguoi_toi_da,
        dia_chi,
        mo_ta
      } = req.body;

      const sql = `
        UPDATE nhatro
        SET
          ten = $1,
          gia = $2,
          dientich = $3,
          so_dien_thoai = $4,
          so_nguoi_toi_da = $5,
          dia_chi = $6,
          mo_ta = $7
        WHERE id = $8
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
          req.params.id
        ]
      );

      res.json({
        ok: true
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Lỗi cập nhật nhà trọ"
      });

    }

  });

  /* COUNT MOTELS */
  app.get("/stats/count", async (req, res) => {

    try {

      const result =
        await pool.query(
          "SELECT COUNT(*) AS total FROM nhatro"
        );

      res.json(result.rows[0]);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Lỗi thống kê"
      });

    }

  });

  app.get("/stats/avg-price", async (req, res) => {
    try {

      const sql = `
        SELECT ROUND(AVG(gia)) AS avg_price
        FROM nhatro
      `;

      const result =
        await pool.query(sql);

      res.json(result.rows[0]);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Lỗi thống kê giá"
      });

    }
  });

  app.get("/stats/avg-price", async (req, res) => {
    try {

      const sql = `
        SELECT ROUND(AVG(gia)) AS avg_price
        FROM nhatro
      `;

      const result =
        await pool.query(sql);

      res.json(result.rows[0]);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Lỗi thống kê giá"
      });

    }
  });


  /* GET ALL MOTELS (REST API) */
  app.get("/motels", async (req, res) => {
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
        FROM nhatro
        ORDER BY id;
      `;

      const result = await pool.query(sql);

      res.json(result.rows);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Lỗi lấy danh sách nhà trọ"
      });

    }
  });

  /* CREATE MOTEL (REST API) */
  app.post("/motels", async (req, res) => {

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
        INSERT INTO nhatro
        (
          ten,
          gia,
          dientich,
          so_dien_thoai,
          so_nguoi_toi_da,
          dia_chi,
          mo_ta,
          geom
        )
        VALUES
        (
          $1,$2,$3,$4,$5,$6,$7,
          ST_SetSRID(
            ST_MakePoint($8,$9),
            4326
          )
        )
        RETURNING id;
      `;

      const result = await pool.query(sql,[
        ten,
        gia,
        dientich,
        so_dien_thoai,
        so_nguoi_toi_da,
        dia_chi,
        mo_ta,
        parseFloat(lng),
        parseFloat(lat)
      ]);

      res.json({
        ok:true,
        id:result.rows[0].id
      });

    } catch(err){

      console.error(err);

      res.status(500).json({
        error:"Lỗi thêm nhà trọ"
      });

    }

  });


  /* DELETE MOTEL (REST API) */
  app.delete("/motels/:id", async (req,res)=>{

    try{

      await pool.query(
        "DELETE FROM nhatro WHERE id=$1",
        [req.params.id]
      );

      res.json({
        ok:true
      });

    }catch(err){

      console.error(err);

      res.status(500).json({
        error:"Lỗi xóa nhà trọ"
      });

    }

  });

  /* FILTER BY PRICE */
  app.get("/filter/price", async (req, res) => {

    try {

      const max = parseFloat(req.query.max);

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
        WHERE gia <= $1
        ORDER BY gia;
      `;

      const result =
        await pool.query(sql,[max]);

      res.json(result.rows);

    } catch(err){

      console.error(err);

      res.status(500).json({
        error:"Lỗi lọc theo giá"
      });

    }

  });


  /* FILTER BY AREA */
  app.get("/filter/area", async (req,res)=>{

    try{

      const min =
        parseFloat(req.query.min);

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
        WHERE dientich >= $1
        ORDER BY dientich;
      `;

      const result =
        await pool.query(sql,[min]);

      res.json(result.rows);

    }catch(err){

      console.error(err);

      res.status(500).json({
        error:"Lỗi lọc diện tích"
      });

    }

  });

  /* FILTER BY CAPACITY */
  app.get("/filter/capacity", async (req,res)=>{

    try{

      const min =
        parseInt(req.query.min);

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
        WHERE so_nguoi_toi_da >= $1
        ORDER BY so_nguoi_toi_da;
      `;

      const result =
        await pool.query(sql,[min]);

      res.json(result.rows);

    }catch(err){

      console.error(err);

      res.status(500).json({
        error:"Lỗi lọc số người"
      });

    }

  });

  /* GEOCODE */
  app.get("/geocode", async (req, res) => {

    try {

      const q = req.query.q;

      if (!q) {
        return res.status(400).json({
          error: "Thiếu từ khóa"
        });
      }

      const url =
        "https://nominatim.openstreetmap.org/search" +
        "?format=json" +
        "&countrycodes=vn" +
        "&limit=1" +
        "&q=" +
        encodeURIComponent(q);

      const response = await fetch(url, {
        headers: {
          "User-Agent": "WebGIS Motel Project"
        }
      });

      const data = await response.json();

      res.json(data);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Lỗi geocode"
      });

    }

  });

  /* REVERSE GEOCODE */
  app.get("/reverse-geocode", async (req, res) => {

    try {

      const lat = req.query.lat;
      const lng = req.query.lng;

      const url =
        "https://nominatim.openstreetmap.org/reverse" +
        "?format=json" +
        "&lat=" + lat +
        "&lon=" + lng;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "WebGIS Motel Project"
        }
      });

      const data = await response.json();

      res.json(data);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Lỗi reverse geocode"
      });

    }

  });

  /* ROUTING */
  app.get("/route", async (req, res) => {

    try {

      const {

        startLat,
        startLng,
        endLat,
        endLng

      } = req.query;

      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${startLng},${startLat};${endLng},${endLat}` +
        `?overview=full&geometries=geojson`;

      const response = await fetch(url);

      const data =
        await response.json();

      res.json(data);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Lỗi routing"
      });

    }

  });

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