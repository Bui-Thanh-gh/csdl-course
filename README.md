# CourseHub - Hệ Thống Đăng Ký Học Phần

Dự án CourseHub gồm 2 dịch vụ chính: **Backend** (FastAPI) và **Frontend** (React + Vite + Nginx), giao tiếp với cơ sở dữ liệu **PostgreSQL**.

---

## 1. Yêu cầu môi trường
- **Docker & Docker Compose**: Docker Desktop 24+ hoặc Docker Engine có Compose V2.
- **PostgreSQL**: Đang chạy trên máy host tại cổng `5432` với database `coursehub` (đã nạp schema và dữ liệu).
- **Git**: Đã cài đặt để clone/checkout repository.

---

## 2. Quy trình dựng dự án với Docker Compose (Dành cho thành viên nhóm)

### Bước 1: Checkout nhánh dự án
```bash
git checkout week06-docker-ci
```

### Bước 2: Chuẩn bị tệp cấu hình môi trường
Sao chép tệp mẫu môi trường không chứa secret thành tệp cấu hình thật cho container:
```bash
cp backend/.env.docker.example backend/.env.docker
```
Mở tệp `backend/.env.docker` và cập nhật thông tin đăng nhập PostgreSQL trên máy của bạn:
```env
DB_HOST=host.docker.internal
DB_PORT=5432
DB_NAME=coursehub
DB_USER=<ten_dang_nhap_postgres_cua_ban>
DB_PASSWORD=<mat_khau_postgres_cua_ban>
```

> **Lưu ý:** `host.docker.internal` được Docker Compose ánh xạ tới IP máy host thông qua chỉ thị `extra_hosts: ["host.docker.internal:host-gateway"]`, giúp container kết nối tới PostgreSQL đang chạy trên host.

### Bước 3: Khởi động hệ thống
Thực hiện build image và chạy các container ở chế độ nền:
```bash
docker compose up --build -d
```

### Bước 4: Kiểm tra trạng thái và log
Kiểm tra trạng thái container (đảm bảo Backend đạt trạng thái `healthy`):
```bash
docker compose ps
```
Xem log của các container nếu cần:
```bash
docker compose logs backend
docker compose logs frontend
```

### Bước 5: Kiểm tra nghiệm thu ứng dụng
- **Frontend ứng dụng**: Truy cập trình duyệt tại [http://localhost:8080](http://localhost:8080).
- **Backend API Docs (Swagger)**: Truy cập tại [http://localhost:8000/docs](http://localhost:8000/docs).
- **Healthcheck Endpoint**: Truy cập [http://localhost:8000/health](http://localhost:8000/health).
- **API qua Nginx Reverse Proxy**: Truy cập [http://localhost:8080/api/sections](http://localhost:8080/api/sections).

### Bước 6: Dừng và dọn dẹp container khi hoàn thành
```bash
docker compose down
```
*(Lệnh này chỉ dừng và gỡ bỏ container/network của Compose, không ảnh hưởng hay xóa dữ liệu trong database PostgreSQL trên host).*
