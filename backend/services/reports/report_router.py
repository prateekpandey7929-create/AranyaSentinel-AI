from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse
import os

from .report_utils import list_generated_reports, get_report_path
from .report_service import create_new_report

router = APIRouter()

@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_report(lang: str = "en"):
    """Generates a new PDF report based on current analysis data."""
    try:
        report_id = create_new_report(lang)
        return {"status": "success", "report_id": report_id, "message": "Report generated successfully."}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list", status_code=status.HTTP_200_OK)
async def get_report_list():
    """Returns a list of all generated reports."""
    return list_generated_reports()

@router.get("/latest", status_code=status.HTTP_200_OK)
async def get_latest_report():
    """Returns metadata for the most recently generated report."""
    reports = list_generated_reports()
    if not reports:
        raise HTTPException(status_code=404, detail="No reports found.")
    return reports[0]

@router.get("/download/{report_id}", response_class=FileResponse)
async def download_report(report_id: str):
    """Downloads a specific PDF report by ID."""
    path = get_report_path(report_id)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Report PDF not found on disk.")
    
    return FileResponse(
        path=path,
        media_type="application/pdf",
        filename=f"{report_id}.pdf"
    )
