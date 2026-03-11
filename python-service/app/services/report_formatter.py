from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict
import os

from jinja2 import Environment, FileSystemLoader, select_autoescape
from app.schemas.briefing import BriefingResponse

_TEMPLATE_DIR = Path(__file__).resolve().parents[1] / "templates"


class ReportFormatter:
    """Starter formatter utility for future report-generation work."""

    def __init__(self) -> None:
        self._env = Environment(
            loader=FileSystemLoader(str(_TEMPLATE_DIR)),
            autoescape=select_autoescape(enabled_extensions=("html", "xml"), default_for_string=True),
        )

    def render_base(self, title: str, body: str) -> str:
        template = self._env.get_template("base.html")
        return template.render(title=title, body=body, generated_at=self.generated_timestamp())

    def render_briefing(self, briefing: BriefingResponse) -> str:
        template = self._env.get_template("briefing_report.html")
        transformed_briefing = self._transform_briefing(briefing)
        body_html = template.render(briefing=transformed_briefing)

        # Render inside base.html
        return self.render_base(title=f"Briefing: {briefing['company_name']}", body=body_html)
    
    def _transform_briefing(self, briefing: Dict[str, Any]) -> Dict[str, Any]:
        metrics = []
        for metric in briefing.get("metrics", []):
            metrics.append({
                "name": metric["name"].title(),  
                "value": str(metric["value"])
            })

        return {
            "title": f"{briefing['company_name']} ({briefing['ticker']}) Briefing Report",
            "company_info": {
                "name": briefing["company_name"],
                "ticker": briefing["ticker"],
                "sector": briefing.get("sector") or "N/A",
                "analyst_name": briefing.get("analyst_name") or "N/A",
            },
            "summary": briefing["summary"],
            "recommendation": briefing["recommendation"],
            "key_points": [p["content"] for p in briefing["points"] if p["type"] == "key_point"],
            "risks": [p["content"] for p in briefing["points"] if p["type"] == "risk"],
            "metrics": metrics,
            "generated_at": self.generated_timestamp(),
        }
    
    def save_report_to_disk(self, html: str, briefing_id: int) -> str:
        """Save HTML to disk and return file path."""
        reports_dir = Path(__file__).resolve().parents[1] / "reports"
        reports_dir.mkdir(exist_ok=True) 
        file_path = reports_dir / f"briefing_{briefing_id}.html"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(html)
        return str(file_path)
    
    def generated_timestamp(self) -> str:
        dt = datetime.now(timezone.utc)
        day = dt.day
        suffix = "th" if 11 <= day <= 13 else {1: "st", 2: "nd", 3: "rd"}.get(day % 10, "th")
        return dt.strftime(f"{day}{suffix} %B, %Y")
