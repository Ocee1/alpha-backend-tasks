from typing import Any, Optional, TypeVar, Generic
from pydantic import BaseModel

T = TypeVar("T")  # Generic type for data

class StandardResponse(BaseModel, Generic[T]):
    status: str
    message: str
    data: Optional[T] = None