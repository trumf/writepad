// 2. Drawing Module
const DrawingManager = {
  drawing: false,
  lastX: 0,
  lastY: 0,

  init() {
    const canvas = DOM.drawingCanvas;

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
      // Always get the position from the event using getPos,
      // which handles both touch and mouse events correctly.
      const pos = CanvasManager.getPos(e);

      // If getPos somehow returns unusable coords (e.g., from mouseout-window),
      // endStroke should ideally handle it or we might need an explicit check here.
      // For now, assume getPos provides the best available position.
      StrokeManager.endStroke(e, pos);
    }
    this.drawing = false;
  },
};

// StrokeManager - moved from writepad.html
const StrokeManager = {
  currentStroke: [],
  currentStrokeCell: null, // Track which cell the current stroke belongs to
  strokes: [],
  isRecording: false,
  startTime: null,

  startStroke(e, cell, relPos) {
    if (!this.isRecording) {
      console.log("Stroke not recorded - recording not active");
      return;
    }

    if (!this.startTime) {
      this.startTime = Date.now();
    }

    // Store the cell this stroke belongs to
    this.currentStrokeCell = cell;

    // If we have cell and relPos, use relative positioning
    if (cell && relPos) {
      this.currentStroke = [
        {
          x: relPos.x,
          y: relPos.y,
          timestamp: Date.now() - this.startTime,
          pressure: e.pressure || (e.touches ? e.touches[0].force : 1.0),
          type: "start",
        },
      ];
      console.log(
        "Started new stroke in cell",
        cell,
        "at relative pos",
        relPos
      );
    } else {
      // Fall back to global coordinates for strokes outside cells
      const pos = CanvasManager.getPos(e);
      this.currentStroke = [
        {
          x: pos.x,
          y: pos.y,
          timestamp: Date.now() - this.startTime,
          pressure: e.pressure || (e.touches ? e.touches[0].force : 1.0),
          type: "start",
        },
      ];
      console.log("Started new stroke outside any cell at global pos", pos);
    }
  },

  addPoint(e, globalPos) {
    if (!this.isRecording || this.currentStroke.length === 0) return;

    // If stroke is associated with a cell, store relative position
    if (this.currentStrokeCell) {
      const cellOrigin = GridConfig.getCellOrigin(
        this.currentStrokeCell.row,
        this.currentStrokeCell.col
      );
      const relPos = {
        x: globalPos.x - cellOrigin.x,
        y: globalPos.y - cellOrigin.y,
      };

      this.currentStroke.push({
        x: relPos.x,
        y: relPos.y,
        timestamp: Date.now() - this.startTime,
        pressure: e.pressure || (e.touches ? e.touches[0].force : 1.0),
        type: "move",
      });
      console.log(
        "Added point to stroke in cell",
        this.currentStrokeCell,
        "at relative pos",
        relPos
      );
    } else {
      // Use global coords for strokes outside cells
      this.currentStroke.push({
        x: globalPos.x,
        y: globalPos.y,
        timestamp: Date.now() - this.startTime,
        pressure: e.pressure || (e.touches ? e.touches[0].force : 1.0),
        type: "move",
      });
      console.log(
        "Added point to stroke outside any cell at global pos",
        globalPos
      );
    }
  },

  endStroke(e, globalPos) {
    if (!this.isRecording || this.currentStroke.length === 0) return;

    // If stroke is associated with a cell, store relative position
    if (this.currentStrokeCell) {
      const cellOrigin = GridConfig.getCellOrigin(
        this.currentStrokeCell.row,
        this.currentStrokeCell.col
      );
      const relPos = {
        x: globalPos.x - cellOrigin.x,
        y: globalPos.y - cellOrigin.y,
      };

      this.currentStroke.push({
        x: relPos.x,
        y: relPos.y,
        timestamp: Date.now() - this.startTime,
        pressure: e.pressure || (e.touches ? e.touches[0].force : 1.0),
        type: "end",
      });

      // Store the stroke with its cell info
      this.strokes.push({
        cell: {...this.currentStrokeCell},
        points: [...this.currentStroke],
      });
      console.log(
        "Ended stroke in cell",
        this.currentStrokeCell,
        "at relative pos",
        relPos
      );
    } else {
      // Use global coords for strokes outside cells
      this.currentStroke.push({
        x: globalPos.x,
        y: globalPos.y,
        timestamp: Date.now() - this.startTime,
        pressure: e.pressure || (e.touches ? e.touches[0].force : 1.0),
        type: "end",
      });

      // Store the stroke with null cell
      this.strokes.push({
        cell: null,
        points: [...this.currentStroke],
      });
      console.log("Ended stroke outside any cell at global pos", globalPos);
    }

    // Reset current stroke state
    this.currentStroke = [];
    this.currentStrokeCell = null;
    console.log("Total strokes recorded:", this.strokes.length);
  },

  startRecording() {
    this.isRecording = true;
    this.startTime = Date.now();
    this.strokes = [];
    this.currentStroke = [];
    this.currentStrokeCell = null;
    console.log("Started recording strokes");
  },

  stopRecording() {
    this.isRecording = false;
    console.log("Stopped recording strokes");
    return {
      startTime: this.startTime,
      endTime: Date.now(),
      strokes: this.strokes,
    };
  },

  getStrokeData() {
    console.log("Getting stroke data, total strokes:", this.strokes.length);
    const strokeData = {
      startTime: this.startTime,
      endTime: Date.now(),
      strokes: [...this.strokes], // Make a copy of the strokes array with cell info
      metadata: {
        totalStrokes: this.strokes.length,
        totalPoints: this.strokes.reduce(
          (sum, stroke) => sum + stroke.points.length,
          0
        ),
        strokesInCells: this.strokes.filter((s) => s.cell !== null).length,
      },
    };
    console.log("Stroke data:", strokeData);
    return strokeData;
  },
};
