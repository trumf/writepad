// 1. Canvas Management Module
const CanvasManager = {
  // These will be initialized in init()
  guideCanvas: null,
  drawingCanvas: null,
  guideCtx: null,
  drawingCtx: null,

  init() {
    // Get canvas elements from DOM cache
    this.guideCanvas = DOM.guideCanvas;
    this.drawingCanvas = DOM.drawingCanvas;

    this.guideCtx = this.guideCanvas.getContext("2d");
    this.drawingCtx = this.drawingCanvas.getContext("2d");
    this.resizeCanvases();
    window.addEventListener("resize", () => this.handleResize());
  },

  resizeCanvases() {
    this.guideCanvas.width = window.innerWidth;
    this.guideCanvas.height = window.innerHeight;
    this.drawingCanvas.width = window.innerWidth;
    this.drawingCanvas.height = window.innerHeight;
  },

  // Make handleResize async to use await for createImageBitmap
  async handleResize() {
    // 1. Store old dimensions
    const oldWidth = this.drawingCanvas.width;
    const oldHeight = this.drawingCanvas.height;

    // 2. Capture old content before resize
    let oldContentBitmap = null;
    let drawingContent = null; // For ImageData fallback
    try {
      // Prefer ImageBitmap for performance
      oldContentBitmap = await createImageBitmap(
        this.drawingCanvas,
        0,
        0,
        oldWidth,
        oldHeight
      );
    } catch (error) {
      console.warn(
        "Could not create ImageBitmap for resize, falling back to ImageData",
        error
      );
      try {
        // Fallback: capture ImageData
        drawingContent = this.drawingCtx.getImageData(
          0,
          0,
          oldWidth,
          oldHeight
        );
      } catch (imageDataError) {
        console.error(
          "Could not capture ImageData during resize.",
          imageDataError
        );
      }
    }

    // 3. Resize the canvases (this clears the context)
    this.resizeCanvases();
    const newWidth = this.drawingCanvas.width;
    const newHeight = this.drawingCanvas.height;

    // 4. Restore scaled content to the center of the new canvas
    this.drawingCtx.clearRect(0, 0, newWidth, newHeight); // Ensure clean slate

    if (oldContentBitmap) {
      // Calculate scale factor to fit inside new bounds, maintaining aspect ratio
      const scale = Math.min(1, newWidth / oldWidth, newHeight / oldHeight); // Don't scale up
      const scaledWidth = oldWidth * scale;
      const scaledHeight = oldHeight * scale;
      // Center the scaled image
      const drawX = (newWidth - scaledWidth) / 2;
      const drawY = (newHeight - scaledHeight) / 2;

      this.drawingCtx.drawImage(
        oldContentBitmap,
        drawX,
        drawY,
        scaledWidth,
        scaledHeight
      );
      oldContentBitmap.close(); // Release memory
      console.log("Resized: Restored drawing from ImageBitmap");
    } else if (drawingContent) {
      // Fallback using ImageData
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = oldWidth;
      tempCanvas.height = oldHeight;
      const tempCtx = tempCanvas.getContext("2d");
      if (tempCtx) {
        tempCtx.putImageData(drawingContent, 0, 0);

        const scale = Math.min(1, newWidth / oldWidth, newHeight / oldHeight); // Don't scale up
        const scaledWidth = oldWidth * scale;
        const scaledHeight = oldHeight * scale;
        const drawX = (newWidth - scaledWidth) / 2;
        const drawY = (newHeight - scaledHeight) / 2;

        this.drawingCtx.drawImage(
          tempCanvas,
          drawX,
          drawY,
          scaledWidth,
          scaledHeight
        );
        console.log("Resized: Restored drawing from ImageData fallback");
      } else {
        console.error(
          "Failed to get context for temporary canvas during resize fallback."
        );
      }
    } else {
      console.log("Resized: Could not restore previous drawing content.");
    }

    // 5. Update grid configuration (ensure GridConfig is accessible)
    if (typeof GridConfig !== "undefined" && GridConfig.update) {
      GridConfig.update();
    } else {
      console.error("GridConfig not accessible in CanvasManager.handleResize");
    }

    // 6. Redraw guides (use DOM cache)
    if (DOM && DOM.imageSelector) {
      DOM.imageSelector.dispatchEvent(new Event("change"));
    } else {
      console.error(
        "DOM.imageSelector not available for guide redraw during resize."
      );
    }

    // 7. Warn about potential misalignment during active sessions
    if (typeof AppState !== "undefined" && AppState.sessionActive) {
      console.warn(
        "Canvas resized during active session. Existing strokes were scaled as an image; alignment with guides might be imperfect."
      );
    }
  },

  getPos(e) {
    const rect = this.drawingCanvas.getBoundingClientRect();
    if (e.touches) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  },
};
