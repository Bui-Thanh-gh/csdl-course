-- ==============================================================================
-- Migration 002: Thêm cột note VARCHAR(200) cho enrollment_events
-- ==============================================================================
-- Ảnh hưởng dữ liệu cũ:
-- Khi chạy migration này trên cơ sở dữ liệu đã có dữ liệu:
-- Toàn bộ dữ liệu cũ trong bảng enrollment_events hoàn toàn ĐƯỢC GIỮ NGUYÊN.
-- Cột 'note' mới thêm vào sẽ nhận giá trị NULL cho tất cả các bản ghi hiện có.
-- Thao tác ADD COLUMN (với giá trị mặc định là NULL) trong PostgreSQL chạy gần như
-- tức thì (O(1)) do chỉ cập nhật metadata trong catalog bảng, không khóa bảng lâu.
-- ==============================================================================

BEGIN;

ALTER TABLE enrollment_events
ADD COLUMN IF NOT EXISTS note VARCHAR(200);

INSERT INTO schema_migrations (version, description)
VALUES ('002', 'Add note column to enrollment_events');

COMMIT;
