import { useEffect, useState } from "react";
import { api } from "../api.js";
import Notice from "./Notice.jsx";

export default function ServerSectionSearch({ courses }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(2);
  const [rows, setRows] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Debounce o tim kiem
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset trang ve 1 khi doi bo loc
  function handleCourseChange(e) {
    setCourseCode(e.target.value);
    setPage(1);
  }

  function handleAvailableChange(e) {
    setAvailableOnly(e.target.checked);
    setPage(1);
  }

  function handleLimitChange(e) {
    setLimit(Number(e.target.value));
    setPage(1);
  }

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };

    async function loadServerSections() {
      setLoading(true);
      setError("");
      try {
        const skip = (page - 1) * limit;
        const params = new URLSearchParams();
        if (debouncedQuery) params.append("q", debouncedQuery);
        if (courseCode) params.append("course_code", courseCode);
        if (availableOnly) params.append("available_only", "true");
        params.append("skip", String(skip));
        // Lay them 1 ban ghi de xac dinh con trang tiep theo hay khong
        params.append("limit", String(limit + 1));

        const data = await api(`/sections?${params.toString()}`, options);
        if (controller.signal.aborted) return;

        if (Array.isArray(data)) {
          if (data.length > limit) {
            setHasMore(true);
            setRows(data.slice(0, limit));
          } else {
            setHasMore(false);
            setRows(data);
          }
        } else {
          setRows([]);
          setHasMore(false);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err.message || "Loi khi tai danh sach lop.");
        setRows([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadServerSections();
    return () => controller.abort();
  }, [debouncedQuery, courseCode, availableOnly, page, limit]);

  const skip = (page - 1) * limit;

  return (
    <section className="panel server-search-panel">
      <div className="panel-header">
        <div>
          <h2>5. Tra cứu lớp phía Server (Bài 4 - Server Pagination & Search)</h2>
          <p className="muted">
            Phân trang và tìm kiếm thực hiện trực tiếp bằng SQL trên CSDL:{" "}
            <code>ORDER BY class_id LIMIT {limit} OFFSET {skip}</code> (không lọc mảng tại trình duyệt).
          </p>
        </div>
      </div>

      <div className="filters">
        <label htmlFor="server-search-q">Từ khóa phía Server</label>
        <input
          id="server-search-q"
          value={query}
          placeholder="Mã lớp hoặc mã học phần (vd: web, py)"
          onChange={(e) => setQuery(e.target.value)}
        />

        <label htmlFor="server-course-select">Mã học phần</label>
        <select
          id="server-course-select"
          value={courseCode}
          onChange={handleCourseChange}
        >
          <option value="">-- Tất cả học phần --</option>
          {courses.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} - {c.name}
            </option>
          ))}
        </select>

        <label className="check">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={handleAvailableChange}
          />
          Chỉ hiện lớp còn chỗ
        </label>
      </div>

      <Notice kind="error">{error}</Notice>
      {loading && <Notice>Đang truy vấn PostgreSQL qua API...</Notice>}

      {!loading && rows.length === 0 && !error && (
        <p className="muted">Không có lớp học phần nào phù hợp với điều kiện tìm kiếm.</p>
      )}

      {rows.length > 0 && (
        <div className="table-scroll">
          <table aria-label="Danh sách lớp phân trang phía server">
            <thead>
              <tr>
                <th>Mã lớp</th>
                <th>Mã học phần</th>
                <th>Sức chứa</th>
                <th>Đã đăng ký</th>
                <th>Còn lại</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.class_id}>
                  <td>
                    <strong>{r.class_id}</strong>
                  </td>
                  <td>
                    <span>{r.course_code}</span>
                  </td>
                  <td>{r.capacity}</td>
                  <td>{r.enrolled}</td>
                  <td>
                    <span className={r.remaining > 0 ? "badge" : "badge full"}>
                      {r.remaining}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Thanh dieu khien phan trang */}
      <div className="pagination-bar">
        <div className="pagination-controls">
          <button
            type="button"
            className="secondary"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Trang trước
          </button>
          <span className="page-indicator">Trang {page}</span>
          <button
            type="button"
            className="secondary"
            disabled={!hasMore || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Trang sau →
          </button>
        </div>

        <div className="page-size-selector">
          <label htmlFor="server-limit-select">Kích thước trang: </label>
          <select
            id="server-limit-select"
            value={limit}
            disabled={loading}
            onChange={handleLimitChange}
          >
            <option value={2}>2 lớp / trang</option>
            <option value={5}>5 lớp / trang</option>
            <option value={10}>10 lớp / trang</option>
          </select>
        </div>
      </div>
    </section>
  );
}
