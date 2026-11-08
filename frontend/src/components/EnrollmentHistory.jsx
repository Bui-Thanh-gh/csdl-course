import { useEffect, useState } from "react";
import { api } from "../api.js";
import Notice from "./Notice.jsx";

export default function EnrollmentHistory({ studentId, refresh, disabled }) {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [localRefresh, setLocalRefresh] = useState(0);

  // Reset ve trang 1 khi doi sinh vien
  useEffect(() => {
    setPage(1);
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;

    const controller = new AbortController();
    const options = { signal: controller.signal };

    async function fetchHistory() {
      setLoading(true);
      setError("");
      try {
        const skip = (page - 1) * pageSize;
        // Chi lay nhat ky demo va ap dung phan trang o Backend; tranh tai 100.000 su kien performance
        const path = `/enrollment-events?student_id=${encodeURIComponent(
          studentId,
        )}&dataset=demo&skip=${skip}&limit=${pageSize + 1}`;

        const data = await api(path, options);
        if (controller.signal.aborted) return;

        if (Array.isArray(data)) {
          if (data.length > pageSize) {
            setHasMore(true);
            setEvents(data.slice(0, pageSize));
          } else {
            setHasMore(false);
            setEvents(data);
          }
        } else {
          setEvents([]);
          setHasMore(false);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err.message || "Khong the tai lich su dang ky.");
        setEvents([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchHistory();
    return () => controller.abort();
  }, [studentId, page, pageSize, refresh, localRefresh]);

  function formatDate(isoString) {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return isoString;
    }
  }

  return (
    <section className="panel history-panel">
      <div className="panel-header">
        <div>
          <h2>4. Lịch sử đăng ký & hủy (Bài 3 - Phân trang Server)</h2>
          <p className="muted">
            Sinh viên <strong>{studentId}</strong> · Bộ dữ liệu:{" "}
            <code>dataset = 'demo'</code> (không tải 100.000 bản ghi
            performance)
          </p>
        </div>
        <button
          type="button"
          className="secondary"
          disabled={disabled || loading}
          onClick={() => setLocalRefresh((v) => v + 1)}
        >
          {loading ? "Đang tải..." : "Tải lại nhật ký"}
        </button>
      </div>

      <Notice kind="error">{error}</Notice>
      {loading && <Notice>Đang tải lịch sử từ server...</Notice>}

      {!loading && events.length === 0 && !error && (
        <p className="muted">
          Sinh viên {studentId} chưa có bản ghi nhật ký demo nào.
        </p>
      )}

      {events.length > 0 && (
        <div className="table-scroll">
          <table aria-label="Lịch sử đăng ký của sinh viên">
            <thead>
              <tr>
                <th>ID</th>
                <th>Lớp học phần</th>
                <th>Hành động</th>
                <th>Thời điểm</th>
                <th>Nguồn / Dataset</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id}>
                  <td>
                    <code>#{ev.id}</code>
                  </td>
                  <td>
                    <strong>{ev.class_section_id}</strong>
                  </td>
                  <td>
                    {ev.event_type === "CREATED" ? (
                      <span className="badge badge-created">Đăng ký mới</span>
                    ) : (
                      <span className="badge badge-cancelled">Hủy đăng ký</span>
                    )}
                  </td>
                  <td>{formatDate(ev.occurred_at)}</td>
                  <td>
                    <small>
                      {ev.source || "api"} / {ev.dataset}
                    </small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Thanh phan trang */}
      <div className="pagination-bar">
        <div className="pagination-controls">
          <button
            type="button"
            className="secondary"
            disabled={page <= 1 || loading || disabled}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Trang trước
          </button>
          <span className="page-indicator">Trang {page}</span>
          <button
            type="button"
            className="secondary"
            disabled={!hasMore || loading || disabled}
            onClick={() => setPage((p) => p + 1)}
          >
            Trang sau →
          </button>
        </div>

        <div className="page-size-selector">
          <label htmlFor="history-page-size">Số dòng / trang: </label>
          <select
            id="history-page-size"
            value={pageSize}
            disabled={loading || disabled}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={5}>5 bản ghi</option>
            <option value={10}>10 bản ghi</option>
            <option value={20}>20 bản ghi</option>
          </select>
        </div>
      </div>
    </section>
  );
}
