from fastapi import APIRouter, UploadFile, File
from processing.filter_operations import apply_filter

router = APIRouter()

@router.post("/filter/apply")
async def filter_image(
    image: UploadFile = File(...),
    filter_name: str = "gaussian"
):
    contents = await image.read()

    result = apply_filter(contents, filter_name)

    return {"message": "Filter applied successfully"}