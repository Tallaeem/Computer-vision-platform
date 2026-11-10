import cv2
import numpy as np

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import Response

from processing.filter_operations import apply_filter

router = APIRouter()


@router.post("/filters/apply")
async def filter_image(
    image: UploadFile = File(...),
    filter_name: str = "gaussian",
    kernel_size: int = 3
):
    try:
        # Read uploaded image
        contents = await image.read()

        # Convert image bytes into NumPy array
        image_array = np.frombuffer(contents, np.uint8)

        # Decode image using OpenCV
        img = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(
                status_code=400,
                detail="Invalid image uploaded."
            )

        # Apply selected filter
        result = apply_filter(
            img,
            filter_name,
            kernel_size
        )

        # Convert processed image into PNG format
        success, encoded_image = cv2.imencode(".png", result)

        if not success:
            raise HTTPException(
                status_code=500,
                detail="Could not encode processed image."
            )

        # Return processed image to JavaScript
        return Response(
            content=encoded_image.tobytes(),
            media_type="image/png"
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )