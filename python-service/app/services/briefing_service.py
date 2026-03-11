from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

from app.models.briefing import Briefing, BriefingPoint, BriefingMetric
from app.schemas.briefing import BriefingCreateSchema


def create_briefing(db: Session, data: BriefingCreateSchema) -> Briefing:

    briefing = Briefing(
        company_name=data.companyName,
        ticker=data.ticker,
        sector=data.sector,
        analyst_name=data.analystName,
        summary=data.summary,
        recommendation=data.recommendation,
    )

    db.add(briefing)
    db.flush()

    # Insert key points
    for point in data.keyPoints:
        db.add(
            BriefingPoint(
                briefing_id=briefing.id,
                type="key_point",
                content=point,
            )
        )

    # Insert risks
    for risk in data.risks:
        db.add(
            BriefingPoint(
                briefing_id=briefing.id,
                type="risk",
                content=risk,
            )
        )

    # Insert metrics
    if data.metrics:
        for metric in data.metrics:
            db.add(
                BriefingMetric(
                    briefing_id=briefing.id,
                    name=metric.name,
                    value=metric.value,
                )
            )

    db.commit()
    db.refresh(briefing)

    return briefing

def get_all_briefings(db: Session) -> list[Briefing]:

    stmt = (
        select(Briefing)
        .options(
            selectinload(Briefing.points),
            selectinload(Briefing.metrics),
        )
        .order_by(Briefing.created_at.desc())
    )

    result = db.execute(stmt)

    return result.scalars().all()


def get_briefing_by_id(db: Session, briefing_id: int) -> Briefing | None:

    stmt = (
        select(Briefing)
        .where(Briefing.id == briefing_id)
        .options(
            selectinload(Briefing.points),
            selectinload(Briefing.metrics),
        )
    )

    result = db.execute(stmt)

    return result.scalar_one_or_none()