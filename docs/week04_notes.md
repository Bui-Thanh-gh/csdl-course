# CourseHub - Buoi 4

- Migration 001: enrollment_events.
- Demo class: RACE-01, capacity = 1.
- POST /enrollments: lock class_sections bang FOR UPDATE.
- Concurrency test: 1 request 201, 1 request 409.
- Performance data: 100000 rows, dataset=performance.
- Index: idx_enrollment_events_dataset_student_time.
- Ghi lai scan type va Execution Time truoc/sau o day.

Limit  (cost=2913.43..2913.55 rows=50 width=39) (actual time=8.337..8.345 rows=50.00 loops=1)
  Buffers: shared hit=1137
  ->  Sort  (cost=2913.43..2915.41 rows=795 width=39) (actual time=8.335..8.340 rows=50.00 loops=1)
        Sort Key: occurred_at DESC
        Sort Method: top-N heapsort  Memory: 31kB
        Buffers: shared hit=1137
        ->  Seq Scan on enrollment_events  (cost=0.00..2887.02 rows=795 width=39) (actual time=0.046..8.133 rows=820.00 loops=1)
              Filter: ((occurred_at >= '2025-12-20 00:00:00'::timestamp without time zone) AND ((dataset)::text = 'performance'::text) AND ((student_id)::text = '22000001'::text))
              Rows Removed by Filter: 99181
              Buffers: shared hit=1137
Planning:
  Buffers: shared hit=22
Planning Time: 1.327 ms
Execution Time: 8.372 ms
# Sau khi tạo index
Limit  (cost=0.42..67.82 rows=50 width=39) (actual time=0.096..0.144 rows=50.00 loops=1)
  Buffers: shared hit=50 read=3
  ->  Index Scan using idx_enrollment_events_dataset_student_time on enrollment_events  (cost=0.42..1107.20 rows=821 width=39) (actual time=0.094..0.139 rows=50.00 loops=1)
        Index Cond: (((dataset)::text = 'performance'::text) AND ((student_id)::text = '22000001'::text) AND (occurred_at >= '2025-12-20 00:00:00'::timestamp without time zone))
        Index Searches: 1
        Buffers: shared hit=50 read=3
Planning:
  Buffers: shared hit=39 read=1
Planning Time: 2.377 ms
Execution Time: 0.174 ms