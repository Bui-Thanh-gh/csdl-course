import test from "node:test";
import assert from "node:assert/strict";
import { api } from "../src/api.js";

// Luu fetch goc de khoi phuc sau test
const originalFetch = globalThis.fetch;

test("api() tra ve JSON khi GET thanh cong (200 OK)", async () => {
  globalThis.fetch = async (url, options) => {
    assert.match(url, /\/sections$/);
    assert.equal(options.method, "GET");
    return {
      status: 200,
      ok: true,
      text: async () => JSON.stringify([{ class_id: "WEB-01" }]),
    };
  };

  const data = await api("/sections");
  assert.deepEqual(data, [{ class_id: "WEB-01" }]);
});

test("api() xu ly dung HTTP 204 No Content (DELETE thanh cong tra null)", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(options.method, "DELETE");
    return {
      status: 204,
      ok: true,
    };
  };

  const data = await api("/enrollments/22000004/WEB-01", { method: "DELETE" });
  assert.equal(data, null);
});

test("api() gui dung JSON body va header cho POST", async () => {
  const payload = { student_id: "22000004", class_section_id: "WEB-01" };
  globalThis.fetch = async (url, options) => {
    assert.equal(options.method, "POST");
    assert.equal(options.headers["Content-Type"], "application/json");
    assert.equal(options.body, JSON.stringify(payload));
    return {
      status: 201,
      ok: true,
      text: async () => JSON.stringify({ message: "Dang ky thanh cong" }),
    };
  };

  const res = await api("/enrollments", { method: "POST", body: payload });
  assert.equal(res.message, "Dang ky thanh cong");
});

test("api() nem loi voi status 404 khi khong tim thay tai nguyen", async () => {
  globalThis.fetch = async () => ({
    status: 404,
    ok: false,
    text: async () => JSON.stringify({ detail: "Khong tim thay sinh vien" }),
  });

  await assert.rejects(
    async () => api("/students/99999999/enrollments"),
    (err) => {
      assert.equal(err.status, 404);
      assert.match(err.message, /404/);
      assert.match(err.message, /Khong tim thay sinh vien/);
      return true;
    },
  );
});

test("api() nem loi voi status 409 khi bi xung dot du lieu", async () => {
  globalThis.fetch = async () => ({
    status: 409,
    ok: false,
    text: async () => JSON.stringify({ detail: "Lop hoc phan da het cho" }),
  });

  await assert.rejects(
    async () =>
      api("/enrollments", {
        method: "POST",
        body: { student_id: "22000004", class_section_id: "RACE-01" },
      }),
    (err) => {
      assert.equal(err.status, 409);
      assert.match(err.message, /409/);
      assert.match(err.message, /Lop hoc phan da het cho/);
      return true;
    },
  );
});

test("api() ghep danh sach detail khi gap loi 422 validation", async () => {
  globalThis.fetch = async () => ({
    status: 422,
    ok: false,
    text: async () =>
      JSON.stringify({
        detail: [
          { msg: "Field required" },
          { msg: "Value must be a valid integer" },
        ],
      }),
  });

  await assert.rejects(
    async () => api("/test-validation"),
    (err) => {
      assert.equal(err.status, 422);
      assert.match(err.message, /Field required; Value must be a valid integer/);
      return true;
    },
  );
});

test("api() nem loi ket noi khi fetch gap su co network", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };

  await assert.rejects(
    async () => api("/sections"),
    (err) => {
      assert.match(err.message, /Không nhận được phản hồi API/);
      return true;
    },
  );
});

test("api() nem lai AbortError khi request bi huy bo boi signal", async () => {
  globalThis.fetch = async () => {
    const err = new Error("The operation was aborted");
    err.name = "AbortError";
    throw err;
  };

  await assert.rejects(
    async () => api("/sections"),
    (err) => {
      assert.equal(err.name, "AbortError");
      return true;
    },
  );
});

// Khoi phuc fetch goc sau khi hoan thanh toan bo test
test.after(() => {
  globalThis.fetch = originalFetch;
});
