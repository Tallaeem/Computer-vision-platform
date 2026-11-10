import cv2
import numpy as np


def apply_filter(img, filter_name, kernel_size=3):
    """
    Apply the selected image filter.

    Parameters:
        img: OpenCV image (NumPy array)
        filter_name: Name of the filter
        kernel_size: Size of the filter kernel

    Returns:
        Processed OpenCV image
    """

    # Kernel size must be a positive odd number
    if kernel_size < 1:
        raise ValueError("Kernel size must be greater than 0.")

    if kernel_size % 2 == 0:
        raise ValueError("Kernel size must be an odd number.")

    # 1. Grayscale
    if filter_name == "grayscale":
        result = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 2. Gaussian Blur
    elif filter_name == "gaussian":
        result = cv2.GaussianBlur(
            img,
            (kernel_size, kernel_size),
            0
        )

    # 3. Average Blur
    elif filter_name == "average":
        result = cv2.blur(
            img,
            (kernel_size, kernel_size)
        )

    # 4. Median Blur
    elif filter_name == "median":
        result = cv2.medianBlur(
            img,
            kernel_size
        )

    # 5. Bilateral Filter
    elif filter_name == "bilateral":
        result = cv2.bilateralFilter(
            img,
            kernel_size,
            75,
            75
        )

    # 6. Canny Edge Detection
    elif filter_name == "canny":
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        result = cv2.Canny(
            gray,
            100,
            200
        )

    # 7. Sharpening
    elif filter_name == "sharpen":
        sharpening_kernel = np.array([
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0]
        ])

        result = cv2.filter2D(
            img,
            -1,
            sharpening_kernel
        )

    else:
        raise ValueError("Unknown filter selected.")

    return result