// 2. Drawing Module
const DrawingManager = {
  drawing: false,
  lastX: 0,
  lastY: 0,

  init() {
    const canvas = CanvasManager.drawingCanvas;

    // Touch Events
    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.startDrawing(e);
    });

    canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      this.draw(e);
    });

    canvas.addEventListener("touchend", (e) => {
      e.preventDefault();
      this.stopDrawing(e);
    });

    // Mouse Events
    canvas.addEventListener("mousedown", (e) => {
      this.startDrawing(e);
    });

    canvas.addEventListener("mousemove", (e) => {
      this.draw(e);
    });

    canvas.addEventListener("mouseup", (e) => {
      this.stopDrawing(e);
    });

    canvas.addEventListener("mouseout", (e) => {
      this.stopDrawing(e);
    });
  },

  startDrawing(e) {
    this.drawing = true;
    const pos = CanvasManager.getPos(e);
    this.lastX = pos.x;
    this.lastY = pos.y;

    // If we're recording in a session, find which cell the stroke is in
    if (AppState.sessionActive) {
      const cell = GridConfig.getCellAt(pos.x, pos.y);
      if (cell) {
        const cellOrigin = GridConfig.getCellOrigin(cell.row, cell.col);
        const relPos = {
          x: pos.x - cellOrigin.x,
          y: pos.y - cellOrigin.y,
        };
        StrokeManager.startStroke(e, cell, relPos);
      } else {
        // Touch/click was outside any cell
        StrokeManager.startStroke(e);
      }
    }
  },

  draw(e) {
    if (!this.drawing) return;
    const pos = CanvasManager.getPos(e);
    const ctx = CanvasManager.drawingCtx;

    ctx.beginPath();
    ctx.moveTo(this.lastX, this.lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();

    // Update for next segment
    this.lastX = pos.x;
    this.lastY = pos.y;

    // If we're in a session, add this point to the stroke recording
    if (AppState.sessionActive) {
      StrokeManager.addPoint(e, pos);
    }
  },

  stopDrawing(e) {
    if (this.drawing && AppState.sessionActive) {
      // For mouseout events that don't have a position
      const pos =
        e.clientX !== undefined
          ? CanvasManager.getPos(e)
          : {x: this.lastX, y: this.lastY};

      StrokeManager.endStroke(e, pos);
    }
    this.drawing = false;
  },
};
