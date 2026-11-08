-- ==============================================================================
-- Migration 002 Rollback: Xóa cột note khỏi enrollment_events
-- ==============================================================================
-- NÊU RÕ VỀ MẤT DỮ LIỆU:
-- 1. Dữ liệu các cột cũ (id, student_id, class_section_id, event_type, source,
--    dataset, occurred_at): HOÀN TOÀN KHÔNG BỊ MẤT. Dữ liệu gốc vẫn giữ nguyên vẹn.
-- 2. Dữ liệu trong chính cột 'note': SẼ BỊ MẤT VĨNH VIỄN!
--    Khi thực hiện DROP COLUMN note, mọi nội dung ghi chú (note) đã được lưu trữ 
--    trong quá trình sử dụng migration 002 sẽ bị xóa khỏi cơ sở dữ liệu.
--    Nếu trên môi trường production đã có dữ liệu ghi chú quan trọng, cần sao lưu (export/backup)
--    cột 'note' trước khi thực hiện rollback này.
-- ==============================================================================

BEGIN;

ALTER TABLE enrollment_events
DROP COLUMN IF EXISTS note;

DELETE FROM schema_migrations
WHERE version = '002';

COMMIT;
