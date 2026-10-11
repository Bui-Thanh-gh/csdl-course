from pydantic import BaseModel, Field


class EnrollmentCreate(BaseModel):
    student_id: str = Field(
        min_length=8,
        max_length=8,
        examples=["22000004"],
    )
    class_section_id: str = Field(
        min_length=1,
        max_length=20,
        examples=["WEB-01"],
    )

from pydantic import BaseModel, Field

class SectionCapacityUpdate(BaseModel):
    capacity: int = Field(
        gt=0, 
        examples=[4],
        description="Sức chứa mới của lớp học phần, phải lớn hơn 0"
    )