-- ==============================================================================
-- Bài 2: Kiểm thử rollback nhiều bảng (Transaction rollback test)
-- ==============================================================================
-- Mục tiêu: Cố ý làm INSERT enrollment_events thất bại sau khi INSERT enrollments
-- để xác nhận cơ chế transaction rollback: bảng enrollments không bị tăng số lượng.
-- ==============================================================================

-- Bắt đầu Transaction
BEGIN;

-- 1. Kiểm tra số lượng enrollments và bản ghi trước khi test
SELECT COUNT(*) AS total_enrollments_before FROM enrollments;
SELECT COUNT(*) AS section_enrollments_before FROM enrollments WHERE class_section_id = 'RACE-01';

-- 2. Thao tác 1: INSERT vào bảng enrollments (thao tác này hoàn toàn hợp lệ)
INSERT INTO enrollments (student_id, class_section_id)
VALUES ('22000001', 'RACE-01');

-- Xem thử trong transaction: dữ liệu đã được chèn tạm thời
SELECT student_id, class_section_id, registered_at
FROM enrollments
WHERE student_id = '22000001' AND class_section_id = 'RACE-01';

-- 3. Thao tác 2: Cố ý làm INSERT vào enrollment_events thất bại
-- Giá trị event_type = 'INVALID_TYPE' vi phạm ràng buộc CHECK (event_type IN ('CREATED', 'CANCELLED'))
-- Lệnh dưới đây sẽ phát sinh lỗi:
-- ERROR: new row for relation "enrollment_events" violates check constraint "ck_enrollment_events_type"
INSERT INTO enrollment_events
    (student_id, class_section_id, event_type, source, dataset)
VALUES
    ('22000001', 'RACE-01', 'INVALID_TYPE', 'manual_test', 'demo');

-- Khi một câu lệnh trong khối transaction gặp lỗi, transaction chuyển sang trạng thái ABORTED.
-- Mọi lệnh tiếp theo (kể cả COMMIT) sẽ bị từ chối hoặc tự động rollback.
ROLLBACK;

-- 4. Xác nhận sau rollback:
-- Kiểm tra lại bảng enrollments: bản ghi vừa chèn ở bước 2 KHÔNG tồn tại, số lượng không thay đổi!
SELECT COUNT(*) AS total_enrollments_after FROM enrollments;
SELECT COUNT(*) AS section_enrollments_after FROM enrollments WHERE class_section_id = 'RACE-01';

SELECT *
FROM enrollments
WHERE student_id = '22000001' AND class_section_id = 'RACE-01';
-- Kết quả trả về 0 rows => Rollback thành công, tính toàn vẹn dữ liệu được đảm bảo!
