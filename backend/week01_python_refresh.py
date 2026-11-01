print("CourseHub - Buoi 1")


students = [
    {"id": "22000001", "name": "Nguyen Minh Anh", "major": "KHDL"},
    {"id": "22000002", "name": "Tran Duc Long", "major": "KHDL"},
    {"id": "22000003", "name": "Nguyen Van A", "major": "KHDL"},
]
courses = [
    {
        "code": "INT2204",
        "name": "Co so du lieu Web va he thong thong tin",
        "capacity": 4,
        "enrolled": 2,
    },
    {
        "code": "INT2205",
        "name": "Khai pha du lieu",
        "capacity": 2,
        "enrolled": 2,
    },
]
enrollments = [
    {"student_id": "22000001", "course_code": "INT2204"}
]

for course in courses:
    remaining = course["capacity"] - course["enrolled"]

print(course["code"], "- con", remaining, "cho")

def find_course(course_code):
    for course in courses:
        if course["code"] == course_code:
            return course
    return None 

#print(find_course("INT2204"))


def can_enroll(student_id, course_code):
    course = find_course(course_code)

    if course is None:
        return False, "Hoc phan khong ton tai"
    if course["enrolled"] >= course["capacity"]:
        return False, "Lop da du so luong"
    duplicated = any(
        item["student_id"] == student_id and item["course_code"] == course_code
        for item in enrollments
    )
    if duplicated:
        return False, "Sinh vien da dang ky hoc phan nay"
    
    return True, "Co the dang ky"

#print(can_enroll("22000002", "INT2204"))

def search_courses(keyword):
    normalized = keyword.strip().lower()
    results = []
    for course in courses:
        code = course["code"].lower()
        name = course["name"].lower()
        if normalized in code or normalized in name:
            results.append(course)
    return results

#print(search_courses("web"))
"""
try:
    limit = int(input("Nhap so luong hoc phan muon hien thi: "))
    print(courses[:limit])
except ValueError:
    print("So luong phai la so nguyen")

"""

"""
1. Hoàn thiện hàm đăng ký học phần
Viết hàm enroll_student(student_id, course_code) trên dữ liệu Python hiện có. Hàm cần kiểm tra
sinh viên tồn tại, học phần tồn tại, lớp còn chỗ và sinh viên chưa đăng ký trùng. Nếu đăng ký
thành công, thêm bản ghi mới vào enrollments và cập nhật enrolled của học phần.

"""

def enroll_student(student_id, course_code):
    if student_id not in [student["id"] for student in students]:
        return "Ma sinh vien khong ton tai"

    if can_enroll(student_id, course_code)[0] is True:
        enrollments.append({"student_id": student_id, "course_code": course_code})
        course = find_course(course_code)
        course["enrolled"] += 1
        return "Dang ky hoc phan thanh cong"
    
    return can_enroll(student_id, course_code)[1]

"""
2. Kiểm tra chương trình
Tạo tối thiểu 05 tình huống chạy thử: đăng ký thành công, đăng ký trùng, lớp đầy, mã học phần
không tồn tại và mã sinh viên không tồn tại. Ghi lại kết quả quan sát được.

"""

print(enroll_student("22000002", "INT2204")) #Dang ky hoc phan thanh cong
#Kết quả trả về: "Dang ky hoc phan thanh cong"
print(enroll_student("22000001", "INT2204")) #Dang ky trung
#Kết quả trả về: "Sinh vien da dang ky hoc phan nay"
print(enroll_student("22000003", "INT2205")) #Lop day
#Kết quả trả về: "Lop da du so luong"
print(enroll_student("22000002", "INT2206")) #Ma hoc phan khong ton tai
#Kết quả trả về: "Hoc phan khong ton tai"
print(enroll_student("24000004", "INT2204")) #Ma sinh vien khong ton tai
#Kết quả trả về: "Ma sinh vien khong ton tai"

"""
3. Lưu thay đổi bằng Git/GitHub
Sau khi hoàn thiện bài tập, thực hiện git status và git diff; sau đó tạo ít nhất một commit có nội
dung mô tả rõ thay đổi và push commit lên GitHub. Mở trang repository trên GitHub để kiểm tra
commit mới đã xuất hiện.

"""


def search_courses(keyword):
    normalized_keyword = " ".join(keyword.split()).casefold()
    if not normalized_keyword:
        return []

    results = []
    for course in courses:
        normalized_code = " ".join(course["code"].split()).casefold()
        normalized_name = " ".join(course["name"].split()).casefold()
        if normalized_keyword in normalized_code or normalized_keyword in normalized_name:
            results.append(course)

    return results


print("Tim theo ma:", search_courses("int2204"))
print("Tim theo ten:", search_courses("  CO   SO DU LIEU  "))
assert search_courses("INT2204") == [courses[0]]
assert search_courses("khai pha") == [courses[1]]
assert search_courses("   ") == []
 
