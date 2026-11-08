-- ==============================================================================
-- Bài 3: Chỉ mục thứ hai theo nghiệp vụ (Business Composite Index)
-- ==============================================================================
-- 1. Bài toán nghiệp vụ:
-- Hệ thống cần tra cứu và thống kê các sự kiện đăng ký theo từng lớp học phần (class_section_id),
-- loại sự kiện (event_type) trong một khoảng thời gian cụ thể (occurred_at).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- BƯỚC 1: TRUY VẤN KHI CHƯA CÓ CHỈ MỤC MỚI (Sequential Scan)
-- ------------------------------------------------------------------------------
-- Trước khi tạo index, PostgreSQL phải quét tuần tự toàn bộ bảng (Seq Scan)
-- và loại bỏ hàng chục nghìn dòng không thỏa điều kiện lọc.
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, student_id, class_section_id, event_type, occurred_at
FROM enrollment_events
WHERE dataset = 'performance'
  AND class_section_id = 'WEB-01'
  AND event_type = 'CREATED'
  AND occurred_at >= TIMESTAMP '2025-07-01 00:00:00'
ORDER BY occurred_at DESC
LIMIT 50;

-- Thống kê tổng hợp số lượng sự kiện:
EXPLAIN (ANALYZE, BUFFERS)
SELECT class_section_id, event_type, COUNT(*) AS event_count
FROM enrollment_events
WHERE dataset = 'performance'
  AND class_section_id = 'WEB-01'
  AND event_type = 'CREATED'
  AND occurred_at >= TIMESTAMP '2025-07-01 00:00:00'
GROUP BY class_section_id, event_type;


-- ------------------------------------------------------------------------------
-- BƯỚC 2: THIẾT KẾ VÀ TẠO CHỈ MỤC PHÙ HỢP
-- ------------------------------------------------------------------------------
-- Thứ tự cột trong index: (dataset, class_section_id, event_type, occurred_at DESC)
-- Giải thích thứ tự:
-- 1. dataset, class_section_id, event_type: Các cột lọc đẳng thức (=) đặt ở đầu (Equality first).
--    - class_section_id có độ chọn lọc (cardinality) cao hơn event_type nên đặt trước, 
--      giúp các truy vấn chỉ lọc theo (dataset, class_section_id) vẫn tận dụng được index (leftmost prefix).
-- 2. occurred_at DESC: Cột lọc khoảng (>=) và sắp xếp (ORDER BY ... DESC) đặt ở cuối.
--    - Sắp xếp DESC giúp Index Scan đọc đúng thứ tự và dừng ngay khi đạt LIMIT 50 mà không cần Sort bộ nhớ.
CREATE INDEX idx_enrollment_events_section_type_time
ON enrollment_events (dataset, class_section_id, event_type, occurred_at DESC);

ANALYZE enrollment_events;


-- ------------------------------------------------------------------------------
-- BƯỚC 3: ĐO LẠI SAU KHI CÓ CHỈ MỤC (Index Scan / Bitmap Index Scan)
-- ------------------------------------------------------------------------------
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, student_id, class_section_id, event_type, occurred_at
FROM enrollment_events
WHERE dataset = 'performance'
  AND class_section_id = 'WEB-01'
  AND event_type = 'CREATED'
  AND occurred_at >= TIMESTAMP '2025-07-01 00:00:00'
ORDER BY occurred_at DESC
LIMIT 50;

EXPLAIN (ANALYZE, BUFFERS)
SELECT class_section_id, event_type, COUNT(*) AS event_count
FROM enrollment_events
WHERE dataset = 'performance'
  AND class_section_id = 'WEB-01'
  AND event_type = 'CREATED'
  AND occurred_at >= TIMESTAMP '2025-07-01 00:00:00'
GROUP BY class_section_id, event_type;


-- ------------------------------------------------------------------------------
-- BƯỚC 4: ROLLBACK / CLEANUP INDEX (KHI CẦN THIẾT)
-- ------------------------------------------------------------------------------
-- DROP INDEX IF EXISTS idx_enrollment_events_section_type_time;
