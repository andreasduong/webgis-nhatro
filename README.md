# WebGIS – Tìm nhà trọ theo bán kính

## Mô tả
Ứng dụng WebGIS hiển thị phòng trọ trên bản đồ, cho phép
tìm phòng trọ trong bán kính và dẫn đường từ vị trí người dùng.

## Công nghệ
- Leaflet + OpenStreetMap
- Node.js (Express)
- PostgreSQL + PostGIS
- OSRM (routing)

## Cách chạy
npm install
node server.js

Mở: http://localhost:3000

## Cách sử dụng
1. Click bản đồ để chọn vị trí (pin đỏ)
2. Phòng trọ trong bán kính hiển thị (pin xanh)
3. Click phòng trọ để xem đường đi
