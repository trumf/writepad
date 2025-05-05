// 1. Canvas Management Module
const CanvasManager = {
  // These will be initialized in init()
  guideCanvas: null,
  drawingCanvas: null,
  guideCtx: null,
  drawingCtx: null,

  init() {
    // Get canvas elements
    this.guideCanvas = document.getElementById("guideCanvas");
    this.drawingCanvas = document.getElementById("drawingCanvas");

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

  handleResize() {
    const drawingContent = this.drawingCtx.getImageData(
      0,
      0,
      this.drawingCanvas.width,
      this.drawingCanvas.height
    );
    this.resizeCanvases();
    this.drawingCtx.putImageData(drawingContent, 0, 0);

    // Update grid configuration on resize
    GridConfig.update();

    // Find image selector and dispatch change event
    const imageSelector = document.getElementById("imageSelector");
    imageSelector.dispatchEvent(new Event("change")); // Redraw guides
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
