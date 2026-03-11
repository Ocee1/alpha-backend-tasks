from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Briefing(Base):
    __tablename__ = "briefings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    company_name: Mapped[str] = mapped_column(String, nullable=False)
    ticker: Mapped[str] = mapped_column(String, nullable=False)
    sector: Mapped[str | None] = mapped_column(String, nullable=True)
    analyst_name: Mapped[str | None] = mapped_column(String, nullable=True)

    summary: Mapped[str] = mapped_column(Text, nullable=False)
    recommendation: Mapped[str] = mapped_column(Text, nullable=False)

    report_generated: Mapped[bool] = mapped_column(default=False)
    report_path: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    points: Mapped[list["BriefingPoint"]] = relationship(
        back_populates="briefing",
        cascade="all, delete-orphan",
    )

    metrics: Mapped[list["BriefingMetric"]] = relationship(
        back_populates="briefing",
        cascade="all, delete-orphan",
    )


class BriefingPoint(Base):
    __tablename__ = "briefing_points"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    briefing_id: Mapped[int] = mapped_column(
        ForeignKey("briefings.id"),
        index=True,
        nullable=False,
    )

    type: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    briefing: Mapped["Briefing"] = relationship(back_populates="points")


class BriefingMetric(Base):
    __tablename__ = "briefing_metrics"

    __table_args__ = (
        UniqueConstraint("briefing_id", "name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    briefing_id: Mapped[int] = mapped_column(
        ForeignKey("briefings.id"),
        index=True,
        nullable=False,
    )

    name: Mapped[str] = mapped_column(String, nullable=False)
    value: Mapped[str] = mapped_column(String, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    briefing: Mapped["Briefing"] = relationship(back_populates="metrics")

# from sqlalchemy import Column, Integer, String, Text, ForeignKey, UniqueConstraint
# from sqlalchemy.orm import relationship
# from app.db import Base

# class Briefing(Base):
#     __tablename__ = "briefings"

#     id = Column(Integer, primary_key=True, index=True)
#     company_name = Column(String, nullable=False)
#     ticker = Column(String, nullable=False)
#     sector = Column(String)
#     analyst_name = Column(String)
#     summary = Column(Text, nullable=False)
#     recommendation = Column(Text, nullable=False)

#     points = relationship("BriefingPoint", back_populates="briefing")
#     metrics = relationship("BriefingMetric", back_populates="briefing")

# class BriefingPoint(Base):
#     __tablename__ = "briefing_points"

#     id = Column(Integer, primary_key=True)
#     briefing_id = Column(Integer, ForeignKey("briefings.id"), index=True)
#     type = Column(String) 
#     content = Column(Text)

#     briefing = relationship("Briefing", back_populates="points")


# class BriefingMetric(Base):
#     __tablename__ = "briefing_metrics"

#     id = Column(Integer, primary_key=True)
#     briefing_id = Column(Integer, ForeignKey("briefings.id"), index=True)
#     name = Column(String)
#     value = Column(String)

#     briefing = relationship("Briefing", back_populates="metrics")
#     __table_args__ = (
#         UniqueConstraint("briefing_id", "name"),
#     )
