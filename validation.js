/**
 * @typedef {Object} GridConfigType - Represents the configuration of the drawing grid.
 * @property {number} ROW_COUNT - The number of rows in the grid.
 * @property {number} GROUP_COUNT - The number of columns (groups) in the grid.
 * @property {number} CELL_WIDTH - The width of each cell.
 * @property {number} CELL_HEIGHT - The height of each cell.
 * @property {number} SPACING_X - Horizontal spacing between cells.
 * @property {number} SPACING_Y - Vertical spacing between cells.
 * @property {number} START_X - The starting X coordinate of the grid.
 * @property {number} START_Y - The starting Y coordinate of the grid.
 */

/**
 * @typedef {Object} DrawingMetadata - Metadata associated with a single drawing.
 * @property {number} row - The 1-based row index of the cell.
 * @property {number} col - The 1-based column index of the cell.
 * @property {number} [cellWidth] - The width of the cell at the time of drawing.
 * @property {number} [cellHeight] - The height of the cell at the time of drawing.
 * // ... other metadata properties
 */

/**
 * @typedef {Object} DrawingData - Contains the image data and metadata for a drawing.
 * @property {string} imageData - Base64 encoded image data URL.
 * @property {DrawingMetadata} metadata - Metadata for the drawing.
 */

/**
 * @typedef {Object} RoundData - Contains data for a single round of drawing.
 * @property {string} timestamp - ISO timestamp for the round.
 * @property {DrawingData[]} images - Array of drawings made in this round.
 * @property {Object} [strokeData] - Recorded stroke data for the round.
 */

/**
 * @typedef {Map<string, RoundData>} RoundsMap - A map where keys are round timestamps and values are RoundData objects.
 */

/**
 * @typedef {Object} ValidationStats - Statistics gathered during validation.
 * @property {number} totalRounds - The total number of rounds processed.
 * @property {number} totalImages - The total number of images across all valid rounds.
 * @property {number[]} imagesPerRound - An array containing the number of images found in each round.
 * @property {number[]} cellCoverage - An array containing the number of unique cells with content in each round.
 */

/**
 * @typedef {Object} ValidationResult - The result of the session validation.
 * @property {'valid' | 'warning' | 'error'} status - Overall validation status.
 *   - 'valid': No issues found.
 *   - 'warning': Minor issues found (e.g., missing metadata, empty rounds), export can likely proceed.
 *   - 'error': Significant issues found (e.g., inconsistent data), export might be problematic.
 * @property {string[]} issues - An array of human-readable descriptions of any issues found.
 * @property {ValidationStats} stats - Statistics gathered during the validation process.
 */

/**
 * Validates the recorded session data before export.
 * Checks for empty rounds, reasonable image counts per cell, and metadata consistency.
 *
 * @param {RoundsMap} roundsMap - A Map containing the session data, keyed by round timestamp.
 * @param {GridConfigType} gridConfig - The grid configuration object used during the session.
 * @returns {ValidationResult} An object containing the validation status, issues, and statistics.
 */
function validateSession(roundsMap, gridConfig) {
  const validation = {
    status: "valid",
    issues: [],
    stats: {
      totalRounds: roundsMap.size,
      totalImages: 0,
      imagesPerRound: [],
      cellCoverage: [], // Track which cells had content
    },
  };

  const maxPossibleCells = gridConfig.ROW_COUNT * gridConfig.GROUP_COUNT;

  for (const [timestamp, round] of roundsMap) {
    if (!round.images || round.images.length === 0) {
      validation.status = "warning";
      validation.issues.push(`Round ${timestamp} has no images`);
      validation.stats.imagesPerRound.push(0);
      validation.stats.cellCoverage.push(0); // Add 0 for coverage in empty round
      continue;
    }

    // Count unique cells (row,col combinations)
    const uniqueCells = new Set();
    round.images.forEach((drawing) => {
      // Ensure metadata and row/col exist before creating the key
      if (
        drawing.metadata &&
        drawing.metadata.row !== undefined &&
        drawing.metadata.col !== undefined
      ) {
        uniqueCells.add(`${drawing.metadata.row}_${drawing.metadata.col}`);
      } else {
        // This case should ideally not happen if data saving is correct, but good to note
        validation.status = "warning";
        validation.issues.push(
          `Round ${timestamp} has an image missing row/col metadata.`
        );
      }
    });

    validation.stats.imagesPerRound.push(round.images.length);
    validation.stats.totalImages += round.images.length;
    validation.stats.cellCoverage.push(uniqueCells.size);

    // Check if we have a reasonable number of images based on grid size
    if (uniqueCells.size > maxPossibleCells) {
      validation.status = "error"; // More severe than warning
      validation.issues.push(
        `Round ${timestamp} has more unique drawing cells (${uniqueCells.size}) than the grid allows (${maxPossibleCells})`
      );
    } else if (round.images.length > maxPossibleCells) {
      // It's possible to have multiple drawings in the same cell technically,
      // but maybe flag it as a warning if the total image count exceeds cell count.
      validation.status = "warning";
      validation.issues.push(
        `Round ${timestamp} has more images (${round.images.length}) than available cells (${maxPossibleCells}). This might indicate duplicates or unexpected data.`
      );
    }

    // Check for consistent metadata across all images (focus on cell dimensions for now)
    const metadata = round.images.map((d) => d.metadata);
    const allHaveCellDimensions = metadata.every(
      (m) => m && m.cellWidth !== undefined && m.cellHeight !== undefined
    );

    if (!allHaveCellDimensions) {
      validation.status = "warning";
      validation.issues.push(
        `Round ${timestamp} has images missing cell dimension metadata`
      );
    }
  }

  // Final check: if total images is 0 but there were rounds, it's a warning
  if (
    validation.stats.totalRounds > 0 &&
    validation.stats.totalImages === 0 &&
    validation.status === "valid"
  ) {
    validation.status = "warning";
    validation.issues.push(
      "Session contains rounds, but no valid images were found in any round."
    );
  }

  return validation;
}

// If using modules in the future, uncomment:
// export { validateSession };
