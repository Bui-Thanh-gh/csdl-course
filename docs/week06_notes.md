# Buổi 6 - Docker, Testing, CI

## Môi trường
- OS: Windows 11 (build 26300.0)
- Docker version: Docker 29.2.1, build a5c7197
- Python / Node version: Python 3.13.14 / Node v26.13.0 (npm 11.20.0)

## Kết quả local
- pytest backend/tests -q: 2 passed (test_required_paths_are_registered, test_enrollment_methods_are_registered)
- npm test: 8 passed, 0 failed (tests/api.test.mjs)
- npm run build: Thành công, tạo thư mục dist/ (built in ~1.34s)
- docker compose up --build: Cả 2 service backend và frontend khởi động thành công; backend đạt trạng thái healthy; frontend mở tại http://127.0.0.1:8080 phục vụ qua Nginx reverse proxy

## Một luồng tích hợp đã kiểm tra
- Request: POST http://127.0.0.1:8080/api/enrollments (Payload: `{"student_id": 22000004, "class_section_id": 1}`)
- HTTP status: 201 Created (và DELETE http://127.0.0.1:8080/api/enrollments/22000004/1 trả về 204 No Content khi hủy)
- SQL xác nhận:
  - `SELECT * FROM enrollments WHERE student_id = 22000004 AND class_section_id = 1;` (ghi nhận 1 bản ghi đăng ký hợp lệ)
  - `SELECT * FROM enrollment_events WHERE student_id = 22000004 AND class_section_id = 1 ORDER BY created_at DESC LIMIT 1;` (event_type = 'CREATED')
  - `SELECT * FROM v_section_summary WHERE class_section_id = 1;` (current_enrolled cập nhật tăng đúng 1 suất)

## Debug / AI
- Lỗi gặp phải:
  1. File workflow CI đặt nhầm tại `.github/ci.yml` thay vì `.github/workflows/ci.yml`.
  2. Kết nối PostgreSQL từ container Backend: `127.0.0.1` trong container chỉ chính container Backend, không kết nối được PostgreSQL đang chạy trên host.
- Bằng chứng đã xem:
  1. Kiểm tra cấu trúc thư mục `.github/workflows/` theo quy chuẩn GitHub Actions.
  2. Kiểm tra `docker compose logs backend` và file cấu hình `backend/.env.docker` với `DB_HOST=host.docker.internal` kèm `extra_hosts` trong `compose.yaml`.
- Nếu dùng AI: gợi ý nào đã dùng và đã xác minh thế nào?:
  - Dùng AI gợi ý cấu hình Nginx reverse proxy (`location /api/ { proxy_pass http://backend:8000/; }`) và cấu hình multi-stage Dockerfile cho Frontend React.
  - Xác minh: Kiểm tra tab Network trong DevTools thấy trình duyệt gọi `http://127.0.0.1:8080/api/...` và Backend nhận request thông qua log `docker compose logs backend`, không gặp lỗi CORS.

## Pull Request / CI
- PR: Nhánh week06-docker-ci mở Pull Request vào main
- Reviewer: Thành viên nhóm review diff (Dockerfile, compose.yaml, CI workflow, tests)
- CI run: pass - Cả 3 job (backend, frontend, docker) đều xanh khi chạy trên GitHub Actions runner
