from datetime import date, time
from typing import Optional
from pydantic import BaseModel, Field
class ComplaintRequest(BaseModel):
  
    complainant_type: str
    department: str
    year_of_study: Optional[float] = None
    campus_zone: str
    building: str
    floor: str
    room_lab_no: str
    facility_type: str
    class_section: str
    issue_category: str
    issue_subcategory: str

    severity: str
    affected_users: float = Field(default=0, ge=0)
    issue_duration_hours: float = Field(default=0, ge=0)
    previous_similar_complaints: float = Field(default=0, ge=0)
    complaints_last_7_days: float = Field(default=0, ge=0)
    complaints_last_30_days: float = Field(default=0, ge=0)
    recurrence_count: float = Field(default=0, ge=0)

    equipment_age_years: float = Field(default=0, ge=0)
    infrastructure_age_years: float = Field(default=0, ge=0)

    connectivity_impact: str
    safety_risk: str
    academic_impact: str
    operational_impact: str

    estimated_repair_cost: float = Field(default=0, ge=0)
    weather_condition: str
    submission_channel: str

    complaint_date: date
    complaint_time: time


class SimpleComplaintRequest(BaseModel):
    
    building: str
    floor: str
    room_lab_no: str
    facility_type: str
    issue_category: str
    issue_subcategory: str
    severity: str
    affected_users: float = Field(default=0, ge=0)
    issue_duration_hours: float = Field(default=0, ge=0)
    description: Optional[str] = None


class ClusterComplaintRequest(BaseModel):
    
    affected_users: float = Field(default=0, ge=0)
    issue_duration_hours: float = Field(default=0, ge=0)
    previous_similar_complaints: float = Field(default=0, ge=0)
    complaints_last_7_days: float = Field(default=0, ge=0)
    complaints_last_30_days: float = Field(default=0, ge=0)
    recurrence_count: float = Field(default=0, ge=0)
    equipment_age_years: float = Field(default=0, ge=0)
    infrastructure_age_years: float = Field(default=0, ge=0)
    estimated_repair_cost: float = Field(default=0, ge=0)


class MaintenanceIntelligenceRequest(BaseModel):
    
    predicted_priority: str
    previous_similar_complaints: float = Field(default=0, ge=0)
    complaints_last_7_days: float = Field(default=0, ge=0)
    complaints_last_30_days: float = Field(default=0, ge=0)
    recurrence_count: float = Field(default=0, ge=0)
    affected_users: float = Field(default=0, ge=0)

    cluster: Optional[int] = None
    cluster_name: Optional[str] = None
    cluster_description: Optional[str] = None
