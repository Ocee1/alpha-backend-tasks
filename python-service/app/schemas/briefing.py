
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict
from typing import List, Optional
from datetime import datetime
from typing import Generic, TypeVar, Optional
from pydantic.generics import GenericModel

T = TypeVar("T")  # Generic type for data field

class ResponseSchema(GenericModel, Generic[T]):
    status: str
    message: str
    data: Optional[T] = None

class MetricSchema(BaseModel):
    name: str 
    value: str 


class BriefingCreateSchema(BaseModel):
    companyName: str
    ticker: str
    sector: Optional[str] = None
    analystName: Optional[str] = None

    summary: str
    recommendation: str

    keyPoints: List[str]
    risks: List[str]

    metrics: Optional[List[MetricSchema]] = None


    # Normalize ticker to uppercase
    @field_validator("ticker")
    @classmethod
    def normalize_ticker(cls, value: str):
        return value.upper()


    # Ensure minimum key points
    @field_validator("keyPoints")
    @classmethod
    def validate_keypoints(cls, value: List[str]):
        if len(value) < 2:
            raise ValueError("At least 2 key points are required")
        return value


    # Ensure minimum risks
    @field_validator("risks")
    @classmethod
    def validate_risks(cls, value: List[str]):
        if len(value) < 1:
            raise ValueError("At least 1 risk is required")
        return value


    @model_validator(mode="after")
    def validate_unique_metric_names(self):
        if self.metrics:
            names = [metric.name for metric in self.metrics]
            if len(names) != len(set(names)):
                raise ValueError("Metric names must be unique within the same briefing")
        return self
    

class BriefingPointResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    content: str


class BriefingMetricResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    value: str

class BriefingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_name: str
    ticker: str
    sector: Optional[str]
    analyst_name: Optional[str]
    summary: str
    recommendation: str

    report_generated: bool
    report_path: Optional[str]

    # timestamps
    created_at: datetime
    updated_at: datetime

    points: List[BriefingPointResponse]
    metrics: List[BriefingMetricResponse]
