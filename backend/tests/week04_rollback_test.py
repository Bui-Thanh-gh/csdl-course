from __future__ import annotations

import requests

BASE_URL = "http://127.0.0.1:8000"
SECTION_ID = "WEB-02"
STUDENT_ID = "22000003"


def main() -> None:
    # 1. Kiem tra backend dang chay
    health = requests.get(f"{BASE_URL}/health", timeout=5)
    health.raise_for_status()

    # 2. Dam bao trang thai sach truoc khi test
    requests.delete(
        f"{BASE_URL}/enrollments/{STUDENT_ID}/{SECTION_ID}",
        timeout=10,
    )

    # 3. Lay danh sach dang ky cua sinh vien truoc khi goi demo
    student_enrollments_before = requests.get(
        f"{BASE_URL}/students/{STUDENT_ID}/enrollments",
        timeout=5,
    ).json()
    count_before = len(student_enrollments_before)

    print("--- [BAI 2: KIEM THU ROLLBACK NHIEU BANG] ---")
    print(f"So lop sinh vien {STUDENT_ID} da dang ky truoc test: {count_before}")

    # 4. Goi endpoint demo voi fail_event_type = True
    # Thao tac 1: INSERT vao enrollments thanh cong
    # Thao tac 2: INSERT vao enrollment_events bi loi check constraint
    print("Goi POST /demo/rollback-test?fail_event_type=true...")
    response = requests.post(
        f"{BASE_URL}/demo/rollback-test?fail_event_type=true",
        json={
            "student_id": STUDENT_ID,
            "class_section_id": SECTION_ID,
        },
        timeout=10,
    )

    print(f"Ket qua tra ve: Status code = {response.status_code}")
    print(f"Response body: {response.json()}")

    # Mong doi loi 409 do vi pham constraint va trigger rollback
    assert response.status_code == 409, f"Ky vong status 409 nhung nhan {response.status_code}"

    # 5. Kiem tra lai so luong enrollments sau khi rollback
    student_enrollments_after = requests.get(
        f"{BASE_URL}/students/{STUDENT_ID}/enrollments",
        timeout=5,
    ).json()
    count_after = len(student_enrollments_after)
    print(f"So lop sinh vien {STUDENT_ID} da dang ky sau rollback: {count_after}")

    # Xac nhan rollback: enrollments khong duoc tang
    assert count_after == count_before, (
        f"Loi: enrollments da bi tang tu {count_before} len {count_after}! Transaction khong rollback."
    )

    # Kiem tra sinh vien khong ton tai trong danh sach dang ky cua lop do
    enrolled_section_ids = [e["class_section_id"] for e in student_enrollments_after]
    assert SECTION_ID not in enrolled_section_ids, (
        f"Loi: Tim thay {SECTION_ID} trong danh sach dang ky cua {STUDENT_ID}!"
    )

    print("=> XAC NHAN: Transaction rollback thanh cong! enrollments khong bi tang.")


if __name__ == "__main__":
    main()
