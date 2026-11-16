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
  3. GitHub Actions Backend job fail: `RuntimeError: Thieu bien moi truong: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD` khi chạy pytest do runner không có file `backend/.env`.
- Bằng chứng đã xem:
  1. Kiểm tra cấu trúc thư mục `.github/workflows/` theo quy chuẩn GitHub Actions.
  2. Kiểm tra `docker compose logs backend` và file cấu hình `backend/.env.docker` với `DB_HOST=host.docker.internal` kèm `extra_hosts` trong `compose.yaml`.
  3. Log chi tiết tại step `Test backend contract` trên GitHub Actions chỉ ra `backend/app/database.py` thiếu các biến môi trường khi import `main:app`.
- Nếu dùng AI: gợi ý nào đã dùng và đã xác minh thế nào?:
  - Dùng AI phân tích log lỗi CI và cấu hình: (1) Nginx reverse proxy; (2) Multi-stage Dockerfile cho Frontend; (3) Bổ sung bước chuẩn bị biến môi trường mẫu (`cp backend/.env.docker.example backend/.env`) cho job `backend` trong `ci.yml` để pytest contract chạy độc lập không phụ thuộc secret thật.
  - Xác minh: Kiểm tra tab Network trong DevTools thấy các request đi qua Nginx 8080 tới Backend không lỗi CORS; và CI runner có đầy đủ biến môi trường để import app và chạy contract test thành công.

## Pull Request / CI
- PR: Nhánh week06-docker-ci mở Pull Request vào main
- Reviewer: Thành viên nhóm review diff (Dockerfile, compose.yaml, CI workflow, tests)
- CI run: pass - Cả 3 job (backend, frontend, docker) đều xanh khi chạy trên GitHub Actions runner

## Báo cáo kết quả bài tập tự thực hành (Bài 1 - 4)

### Bài 1. Assertion OpenAPI Contract và kiểm thử CI đỏ/xanh
- **Thực hiện**: Bổ sung assertion kiểm tra method `get` cho endpoint `/sections` trong `test_enrollment_methods_are_registered` (`backend/tests/test_openapi_contract.py`).
- **Thử nghiệm lỗi (CI đỏ)**: Tạm thời sửa thành `assert "post" in paths["/sections"]`. Lệnh `pytest backend/tests -q` báo lỗi `AssertionError: assert 'post' in {'get': ...}` (FAILED 1, PASSED 1). Trên CI, step `Test backend contract` sẽ dừng pipeline ngay lập tức.
- **Khôi phục (CI xanh)**: Khôi phục lại `assert "get" in paths["/sections"]`, kiểm thử local chạy thành công: `2 passed in 1.08s`.

### Bài 2. Lỗi cấu hình có kiểm soát và khắc phục không xóa database
- **Kịch bản**: Sai biến môi trường kết nối database `DB_HOST=127.0.0.1` trong `backend/.env.docker`.
- **Triệu chứng & Bằng chứng**:
  - `docker compose ps`: container `backend` ở trạng thái `unhealthy`.
  - `docker compose logs backend`: ghi nhận `sqlalchemy.exc.OperationalError: (psycopg.OperationalError) connection failed: Connection refused`. Do `127.0.0.1` trong container trỏ về chính nó chứ không phải máy host.
  - Container `frontend` (phụ thuộc `service_healthy`) bị hoãn khởi động, hoặc trả về `502 Bad Gateway` khi gọi qua Nginx.
- **Cách khắc phục**: Giữ nguyên toàn bộ database PostgreSQL trên host (không xóa, không migrate lại dữ liệu). Sửa lại `DB_HOST=host.docker.internal` trong `backend/.env.docker` và đảm bảo `extra_hosts` có trong `compose.yaml`. Chạy `docker compose up -d`, container backend kết nối thành công và chuyển sang `healthy`.

### Bài 3. Cấu hình Docker Compose tối thiểu và tài liệu dựng lại cho nhóm
- **Thực hiện**:
  - Tệp `compose.yaml` tối thiểu ghép nối 2 dịch vụ `backend` và `frontend` với cổng public tương ứng `8000` và `8080`, reverse proxy qua Nginx tại `/api`.
  - Soạn thảo tài liệu `README.md` chi tiết tại thư mục gốc hướng dẫn thành viên khác checkout nhánh `week06-docker-ci`, sao chép cấu hình môi trường từ `backend/.env.docker.example` và chạy `docker compose up --build -d` để dựng lại toàn bộ ứng dụng chỉ với một lệnh duy nhất.

### Bài 4. Mở rộng CI với step Lint kiểm tra chất lượng mã nguồn
- **Thực hiện**:
  - Thêm `flake8` vào `backend/requirements-dev.txt`.
  - Thêm step `Lint backend code with Flake8` vào job `backend` trong `.github/workflows/ci.yml` sử dụng bộ lọc `--select=E9,F63,F7,F82`.
- **Lỗi bắt được**:
  - `E9` (SyntaxError, IndentationError, TokenError): Phát hiện ngay lỗi cú pháp, thụt dòng sai trước khi chạy code.
  - `F821` (Undefined name / NameError): Bắt các lỗi biến/hàm chưa được khai báo ở các nhánh code chưa được unit test phủ tới (uncovered branch).
  - `F63`: Bắt lỗi cú pháp toán tử assertion hoặc so sánh logic sai.
  - `F7`: Bắt lỗi import sai cấu trúc gói.
  - Giúp phát hiện lỗi tĩnh tức thì trong vài giây trước khi chạy test và build image Docker.

