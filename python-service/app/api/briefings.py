from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session, selectinload
from typing import List
from fastapi.responses import HTMLResponse

from app.db.session import get_db
from app.models.briefing import Briefing
from app.schemas.briefing import BriefingCreateSchema, BriefingResponse
from app.services.report_formatter import ReportFormatter
from app.utils.response import standard_response
from app.schemas.response import StandardResponse
from app.services.briefing_service import (
    get_all_briefings,
    get_briefing_by_id,
    create_briefing
)

router = APIRouter(
    prefix="/briefings",
    tags=["Briefings"]
)

formatter = ReportFormatter()

@router.post("/", response_model=BriefingResponse, status_code=status.HTTP_201_CREATED)
@standard_response("Briefing created successfully")
def create_new_briefing(briefing_in: BriefingCreateSchema, db: Session = Depends(get_db)):
    briefing = create_briefing(db, briefing_in)
    return briefing

@router.get("/{id}", response_model=BriefingResponse)
@standard_response("Briefing retrieved successfully")
def read_briefing(id: int, db: Session = Depends(get_db)):
    briefing = get_briefing_by_id(db, id)
    if not briefing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Briefing with ID {id} not found."
        )
    return briefing

@router.get("/", response_model=List[BriefingResponse])
@standard_response("Operation successful")
def read_briefings(db: Session = Depends(get_db)):
    briefings = get_all_briefings(db)
    return briefings

@router.get("/briefings/{id}/html", )
def get_briefing_html(id: int, db: Session = Depends(get_db)):
    briefing = db.get(Briefing, id)
    # print(vars(briefing))
    if not briefing:
        raise HTTPException(status_code=404, detail="Report not found")

    if not briefing.report_path:
        raise HTTPException(status_code=401, detail="Report not generated. Kind generate and try again")
    

    with open(briefing.report_path, "r", encoding="utf-8") as f:
        html_content = f.read()
    

    return HTMLResponse(content=html_content)


@router.post("/briefings/{id}/generate", response_model=StandardResponse[dict])
@standard_response("Report generated successfully")
def generate_briefing_report(id: int, db: Session = Depends(get_db)):
    briefing = db.get(Briefing, id)
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")

    # Transform DB model to view model
    view_model = {
        "company_name": briefing.company_name,
        "ticker": briefing.ticker,
        "sector": briefing.sector,
        "analyst_name": briefing.analyst_name,
        "summary": briefing.summary,
        "recommendation": briefing.recommendation,
        "points": [{"id": p.id, "type": p.type, "content": p.content} for p in briefing.points],
        "metrics": [{"id": m.id, "name": m.name, "value": m.value} for m in briefing.metrics],
    }

    html = formatter.render_briefing(view_model)

    # Save HTML to disk
    path = formatter.save_report_to_disk(html, briefing.id)
    briefing.report_path = path
    briefing.report_generated = True

    db.add(briefing)
    db.commit()
    db.refresh(briefing)

    return