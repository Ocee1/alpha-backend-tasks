from functools import wraps
from fastapi import HTTPException
from app.schemas.response import StandardResponse

def standard_response(default_message: str = "Success"):
    """
    Decorator for FastAPI routes to wrap return values in StandardResponse
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                # Handle async and sync endpoints
                result = await func(*args, **kwargs) if callable(getattr(func, "__await__", None)) else func(*args, **kwargs)
                
                # If result is already a dict with keys status, message, data
                if isinstance(result, dict) and {'status','message','data'}.issubset(result.keys()):
                    return result

                return StandardResponse(status="success", message=default_message, data=result)
            except HTTPException as e:
                return StandardResponse(status="error", message=e.detail, data=None)
            except Exception as e:
                return StandardResponse(status="error", message="an error occurred. please try again", data=None)
        return wrapper
    return decorator