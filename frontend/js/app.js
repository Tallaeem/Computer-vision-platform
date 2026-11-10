
// ========================================
// COMPUTER VISION STUDIO
// Main JavaScript File
// ========================================

const API_URL = "http://127.0.0.1:8000";

// ========================================
// 1. GLOBAL VARIABLES
// ========================================

let cameraStream = null;
let currentImage = null;
let processedImageURL = null;

let selectedFilter = "gaussian";
let selectedTransform = "rotation";


// ========================================
// 2. DOM ELEMENTS
// ========================================

const video = document.getElementById("cameraVideo");
const cameraPlaceholder = document.getElementById("cameraPlaceholder");

const startCameraBtn = document.getElementById("startCameraBtn");
const captureBtn = document.getElementById("captureBtn");

const imageUpload = document.getElementById("imageUpload");

const originalImage = document.getElementById("originalImage");
const processedImage = document.getElementById("processedImage");


// ========================================
// 3. DISPLAY IMAGE
// ========================================

function displayOriginalImage(file) {

    if (currentImage && currentImage !== file) {
        // The previous image is no longer needed.
    }

    currentImage = file;

    const imageURL = URL.createObjectURL(file);

    originalImage.src = imageURL;
    originalImage.style.display = "block";

    // Clear previous result
    processedImage.removeAttribute("src");
    processedImage.style.display = "none";

    if (processedImageURL) {
        URL.revokeObjectURL(processedImageURL);
        processedImageURL = null;
    }
}


// ========================================
// 4. START WEBCAM
// ========================================

startCameraBtn.addEventListener("click", async function () {

    try {

        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        video.srcObject = cameraStream;

        video.style.display = "block";
        cameraPlaceholder.style.display = "none";

    }

    catch (error) {

        console.error("Camera Error:", error);

        alert("Unable to access camera. Please allow camera permission.");

    }

});


// ========================================
// 5. CAPTURE IMAGE
// ========================================

captureBtn.addEventListener("click", function () {

    if (!cameraStream) {

        alert("Please start the camera first.");

        return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    context.drawImage(video, 0, 0);

    canvas.toBlob(function (blob) {

        if (!blob) {
            alert("Could not capture image.");
            return;
        }

        const file = new File(
            [blob],
            "captured_image.png",
            { type: "image/png" }
        );
        alert("Image captured successfully!");
        displayOriginalImage(file);

    }, "image/png");

});


// ========================================
// 6. UPLOAD IMAGE
// ========================================

imageUpload.addEventListener("change", function (event) {

    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {

        alert("Please select a valid image.");

        return;
    }

    displayOriginalImage(file);

});

function showResult(containerId, imageBlob, title) {
    const container = document.getElementById(containerId);
    // Remove previous result URL
    if (container.dataset.imageUrl) {
        URL.revokeObjectURL(container.dataset.imageUrl);
    }
    // Create URL for processed image
    const imageURL = URL.createObjectURL(imageBlob);
    container.dataset.imageUrl = imageURL;
    // Display result using innerHTML
    container.innerHTML = `
        <div class="result-box">
            <h3>${title}</h3>
            <div class="result-image">
                <img src="${imageURL}" alt="Processed Image">
            </div>
            <button class="download-result">
                Download Result
            </button>
        </div>
    `;

    // Download button functionality
    const downloadButton = container.querySelector(".download-result");
    downloadButton.addEventListener("click", function() {
        const link = document.createElement("a");
        link.href = imageURL;
        link.download = "processed_image.png";
        link.click();
    });
}
// ========================================
// 7. SELECT FILTER
// ========================================

const filterCards = document.querySelectorAll("[data-filter]");

filterCards.forEach(function (card) {

    card.addEventListener("click", function () {

        filterCards.forEach(function (item) {
            item.classList.remove("selected");
        });

        card.classList.add("selected");

        selectedFilter = card.dataset.filter;

        console.log("Selected Filter:", selectedFilter);

    });

});


// ========================================
// 8. APPLY FILTER
// ========================================

async function applySelectedFilter() {

    if (!currentImage) {
        alert("Please upload or capture an image first.");
        return;
    }

    if (!selectedFilter) {
        alert("Please select a filter first.");
        return;
    }

    const kernelSize = document.getElementById("kernelSize").value;

    // Create FormData to send image
    const formData = new FormData();
    formData.append("image", currentImage);

    // Send filter name and kernel size
    const params = new URLSearchParams({
        filter_name: selectedFilter,
        kernel_size: kernelSize
    });

    try {

        const response = await fetch(
            `${API_URL}/filters/apply?${params}`,
            {
                method: "POST",
                body: formData
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Filter could not be applied.");
        }

        // Receive processed image
        const imageBlob = await response.blob();
        showResult(
            "filterResult",
            imageBlob,
            "Filtered Image - " + selectedFilter
        );
        // Display processed image
        if (processedImageURL) {
            URL.revokeObjectURL(processedImageURL);
        }
        processedImageURL = URL.createObjectURL(imageBlob);
        alert("Filter applied successfully!");
    } catch (error) {
        console.error("Filter error:", error);
        alert(error.message);
    }
}


// Apply filter when button is clicked
document.getElementById("applyFilterBtn").addEventListener(
    "click",
    applySelectedFilter
);


// ========================================
// 9. DISPLAY PROCESSED IMAGE
// ========================================
async function displayProcessedResult(response) {

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {

        const data = await response.json();

        if (data.image_base64) {

            processedImageURL =
                `data:image/png;base64,${data.image_base64}`;

        } else if (data.image_url) {

            processedImageURL = data.image_url;

        } else {

            throw new Error(
                data.detail || data.message ||
                "Backend did not return a processed image."
            );

        }

    } else {

        const blob = await response.blob();

        if (!blob.type.startsWith("image/")) {
            throw new Error("Backend did not return an image.");
        }

        if (processedImageURL &&
            processedImageURL.startsWith("blob:")) {

            URL.revokeObjectURL(processedImageURL);

        }

        processedImageURL = URL.createObjectURL(blob);

    }
}


// ========================================
// 10. SELECT TRANSFORMATION
// ========================================

const transformCards =
    document.querySelectorAll("[data-transform]");

transformCards.forEach(function (card) {

    card.addEventListener("click", function () {

        transformCards.forEach(function (item) {
            item.classList.remove("selected");
        });

        card.classList.add("selected");

        selectedTransform = card.dataset.transform;

        console.log("Selected Transformation:", selectedTransform);

    });

});


// ========================================
// 11. APPLY TRANSFORMATION
// ========================================

document.getElementById("applyTransformBtn")
    .addEventListener("click", async function () {

        if (!currentImage) {

            alert("Please capture or upload an image first.");

            return;
        }

        const angle =
            document.getElementById("rotationAngle").value || 0;

        const tx =
            document.getElementById("translateX").value || 0;

        const ty =
            document.getElementById("translateY").value || 0;

        const formData = new FormData();

        formData.append("image", currentImage);

        const params = new URLSearchParams();

        params.append("operation", selectedTransform);
        params.append("angle", angle);
        params.append("tx", tx);
        params.append("ty", ty);

        let endpoint;

        if (selectedTransform === "perspective") {

            endpoint = "/warping/perspective";

            // Ask user for four source points.
            const points = [];

            for (let i = 1; i <= 4; i++) {

                const x = prompt(`Enter X coordinate of point ${i}:`);

                if (x === null) return;

                const y = prompt(`Enter Y coordinate of point ${i}:`);

                if (y === null) return;

                points.push([Number(x), Number(y)]);

            }

            params.append("points", JSON.stringify(points));

        } else {

            endpoint = "/warping/affine";

        }

        try {

            const response = await fetch(
                `${API_URL}${endpoint}?${params.toString()}`,
                {
                    method: "POST",
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error("Transformation failed.");
            }

            // await displayProcessedResult(response);
            const imageBlob = await response.blob();
            showResult(
                "depthResult",
                imageBlob,
                "Depth Estimation Result"
            );
        }

        catch (error) {

            console.error(error);

            alert("Error applying transformation.");

        }

    });


// ========================================
// 12. DEPTH ESTIMATION
// ========================================

document.getElementById("depthBtn")
    .addEventListener("click", async function () {

        const leftFile =
            document.getElementById("leftImage").files[0];

        const rightFile =
            document.getElementById("rightImage").files[0];

        if (!leftFile || !rightFile) {

            alert("Please upload both left and right images.");

            return;
        }

        const formData = new FormData();

        formData.append("left_image", leftFile);
        formData.append("right_image", rightFile);

        const params = new URLSearchParams();

        params.append("algorithm", "StereoSGBM");

        try {

            const response = await fetch(
                `${API_URL}/depth/estimate?${params.toString()}`,
                {
                    method: "POST",
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error("Depth estimation failed.");
            }

            // await displayProcessedResult(response);
            const imageBlob = await response.blob();
            showResult(
                "warpingResult",
                imageBlob,
                "Image Transformation Result"
            );
        }

        catch (error) {

            console.error(error);

            alert("Error generating depth map.");

        }

    });


// ========================================
// 13. DOWNLOAD PROCESSED IMAGE
// ========================================

document.getElementById("downloadBtn")
    .addEventListener("click", function () {

        if (!processedImageURL) {

            alert("No processed image available.");

            return;
        }

        const link = document.createElement("a");

        link.href = processedImageURL;
        link.download = "processed_image.png";

        document.body.appendChild(link);

        link.click();

        link.remove();

    });


// ========================================
// 14. CLEANUP CAMERA
// ========================================

window.addEventListener("beforeunload", function () {

    if (cameraStream) {

        cameraStream.getTracks().forEach(function (track) {
            track.stop();
        });

    }

});
