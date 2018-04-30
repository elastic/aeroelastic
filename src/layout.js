const {
        select,
        selectReduce
      } = require('./state')

const {
        freeDragZ,
        freeColor,
        pad,
        markerProximityDistance,
        snapEngageDistance,
        snapReleaseDistance,
        enforceAlignment
      } = require('../example/mockConfig')

const {flatten} = require('./functional')

const matrix = require('./matrix')


/**
 * Selectors directly from a state object
 */

const shapeAdditions = state => state.shapeAdditions
const primaryUpdate = state => state.primaryUpdate
const scene = state => state.currentScene


/**
 * Pure calculations
 */

const rectLeft        = (a   ) => [-a,  0,  0,  1]
const rectCenter      = (    ) => [ 0,  0,  0,  1]
const rectRight       = (a   ) => [ a,  0,  0,  1]
const rectTop         = (a, b) => [ 0, -b,  0,  1]
const rectMiddle      = (    ) => [ 0,  0,  0,  1]
const rectBottom      = (a, b) => [ 0,  b,  0,  1]
const rectTopLeft     = (a, b) => [-a, -b,  0,  1]
const rectTopRight    = (a, b) => [ a, -b,  0,  1]
const rectBottomLeft  = (a, b) => [-a,  b,  0,  1]
const rectBottomRight = (a, b) => [ a,  b,  0,  1]

// set of shapes under a specific point
const shapesAtPoint = (shapes, x, y) => shapes.map(shape => {
  const {transformMatrix, a, b} = shape
  if(transformMatrix) {
    // We go full tilt with the inverse transform approach because that's general enough to handle any non-pathological
    // composition of transforms. Eg. this is a description of the idea: https://math.stackexchange.com/a/1685315
    // A perhaps cheaper alternative would be to forward project the four vertices and check if the cursor is within
    // the quadrilateral in 2D space.
    const inverseProjection = matrix.invert(transformMatrix)
    const intersection = matrix.mvMultiply(inverseProjection, [x, y, 0, 1])
    const [sx, sy] = intersection
    return {intersection, inside: Math.abs(sx) <= a + pad && Math.abs(sy) <= b + pad, shape}
  } else {
    return {intersection: matrix.NULLVECTOR, inside: false, shape}
  }
})

// pick top shape out of possibly several shapes (presumably under the same point)
const topShape = shapes => shapes.reduce((prev, {shape, inside, intersection: [x, y, z, w]}) => {
  return inside && (z <= prev.z) ? shape : prev
}, {z: Infinity})

// returns the shape - closest to the reader in the Z-stack - that the reader hovers over with the mouse
const hoveringAt = (shapes, {x, y}) => {
  const hoveredShapes = shapesAtPoint(shapes, x, y)
  return topShape(hoveredShapes)
}

const vectorLength = (x, y) => Math.sqrt(x * x + y * y)
const pointDistance = (x0, y0, x1, y1) => vectorLength(x1 - x0, y1 - y0)

const isHorizontal = line => line.b === 0
const isVertical = line => line.a === 0
const isHorizontalDirection = direction => direction === 'horizontal'
const isLine = shape => shape.type === 'line'
const allLines = shapes => shapes.filter(isLine)

// lower bound of the (actual, eg. snapped) extent for a specific dimension
const low = (shape, direction) => direction === 'horizontal' ? shape.y - shape.b : shape.x - shape.a

// upper bound of the (actual, eg. snapped) extent for a specific dimension
const high = (shape, direction) => direction === 'horizontal' ? shape.y + shape.b : shape.x + shape.a

// midpoint of a shape (in terms of its unconstrained location) for a specific dimension
// currently the center/middle points attach, not yet the corners
const unconstrainedMidPoint = (shape, direction) => direction === 'horizontal' ? shape.unconstrainedY : shape.unconstrainedX

// is the point within the extent?
const withinBounds = (low, high, point) => low <= point && point <= high

// clamp the value to the range determined by the interval bounds [low ... high]
const clamp = (low, high, value) => Math.max(low, Math.min(high, value))

// common values for subsequent calculations
const sectionOvershootDescriptor = (direction, free, fixed) => {
  const freePoint = unconstrainedMidPoint(free, direction)
  const setLo = low(fixed, direction)
  const setHi = high(fixed, direction)
  const loHiConstrained = clamp(setLo, setHi, freePoint)
  // calculate which vertex (section end) is breached by freePoint; NaN if not breached
  const nearerSectionVertex = loHiConstrained === freePoint ? NaN : loHiConstrained
  return {freePoint, setLo, setHi, nearerSectionVertex}
}

// returns zero if the free point is within the section (projected to the specified dimension), or otherwise the overshoot
// relative to the closer section endpoint
const sectionOvershoot = (direction, free, fixed) => {
  const {freePoint, setLo, setHi, nearerSectionVertex} = sectionOvershootDescriptor(direction, free, fixed)
  // negative if undershoot; positive if overshoot; zero if within section
  return withinBounds(setLo, setHi, freePoint) ? 0 : freePoint - nearerSectionVertex
}

// returns the free point if it's within the section (projected to the specified dimension),
// or otherwise the closer section endpoint
const sectionConstrained = (direction, free, fixed) => {
  const {freePoint, setLo, setHi, nearerSectionVertex} = sectionOvershootDescriptor(direction, free, fixed)
  return withinBounds(setLo, setHi, freePoint) ? freePoint : nearerSectionVertex
}

// returns the snap line and the attracted anchor of draggedShape for the closest snap line, if it's close enough to snap
const snapGuideLine = (lines, shape, direction) => {
  const horizontalDirection = isHorizontalDirection(direction)
  const preexistingConstraint = horizontalDirection ? shape.xConstraint : shape.yConstraint
  // let's find the snap line / anchor combo with the shortest snapDistance
  const possibleSnapPoints = horizontalDirection
    ? [{anchor: 'left', vector: rectLeft}, {anchor: 'center', vector: rectCenter}, {anchor: 'right', vector: rectRight}]
    : [{anchor: 'top', vector: rectTop}, {anchor: 'middle', vector: rectMiddle}, {anchor: 'bottom', vector: rectBottom}]
  return possibleSnapPoints.reduce((prev, {anchor, vector}) => {
    const anchorPoint = matrix.mvMultiply(shape.unconstrainedTransformMatrix || shape.transformMatrix, vector(shape.a, shape.b))[horizontalDirection ? 0 : 1] // x : y
    return lines
      .filter(line => {
        return !line.alignment
          || (!horizontalDirection || horizontalConstraint(line) === anchor)
          && (horizontalDirection || verticalConstraint(line) === anchor)
      })
      .reduce((prev, line) => {
        const lineLocation = matrix.mvMultiply(line.unconstrainedTransformMatrix || line.transformMatrix, matrix.ORIGIN)[horizontalDirection ? 0 : 1]
        const perpendicularDelta = lineLocation - anchorPoint
        const perpendicularDistance = Math.abs(perpendicularDelta)
        const parallelDistance = 0 && sectionOvershoot(direction, shape, line) // keeping it simple for now
        // ^ parallel distance from section edge is also important: pulling a shape off a guideline tangentially must remove
        const distance = vectorLength(parallelDistance, perpendicularDistance) // or just Math.max()
//        if(shape.key === 'rect5' && direction === 'horizontal' && anchor === 'center' && line.key === 'line4') console.log(anchor, anchorPoint, lineLocation, distance)
//        if(shape.key === 'rect5' && direction === 'vertical' && anchor === 'middle' && line.key === 'line1') console.log(anchor, anchorPoint, lineLocation, distance)
        const distanceThreshold = preexistingConstraint === line.key ? snapReleaseDistance : snapEngageDistance
        const closerLineFound = distance < prev.distance && distance <= distanceThreshold
        return closerLineFound
          ? {line, anchor, distance, vector: horizontalDirection ? [perpendicularDelta, 0, 0, 1] : [0, perpendicularDelta, 0, 1]}
          : prev
      }, prev)
  }, {line: null, anchor: null, distance: Infinity, vector: null})
}

const cursorPositionAction = action => action && action.actionType === 'cursorPosition' ? action.payload : null
const mouseButtonEventAction = action => action && action.actionType === 'mouseEvent' ? action.payload : null
const shapeEventAction = action => action && action.actionType === 'shapeEvent' ? action.payload : null
const alignEventAction = action => action && action.actionType === 'align' ? action.payload : null

// a key based lookup of snap guide lines
const constraintLookup = shapes => {
  const constraints = {}
  shapes.filter(isLine).forEach(shape => constraints[shape.key] = shape)
  return constraints
}

// returns the currently dragged shape, or a falsey value otherwise
const draggingShape = ({draggedShape, shapes}, hoveredShape, down, mouseDowned) => {
  const dragInProgress = down && shapes.reduce((prev, next) => prev || next.key === draggedShape.key, false)
  return dragInProgress && draggedShape  || down && mouseDowned && hoveredShape
}

// true if the two lines are parallel
const parallel = (line1, line2) => isHorizontal(line1) === isHorizontal(line2)

// shape updates may include newly added shapes, deleted or modified shapes
const updateShapes = (preexistingShapes, shapeUpdates) => {
  // Shell function - this is now a simple OR ie in the PoC it initializes with the given mock states; no more update happens
  // A real function must handle additions, removals and updates, merging the new info into the current shape state.
  return preexistingShapes || shapeUpdates
}

const horizontalAlignmentMap = ({alignRight: 'right', alignLeft: 'left', alignCenter: 'center', alignRemove: null})
const verticalAlignmentMap = ({alignRight: 'top', alignLeft: 'bottom', alignCenter: 'middle', alignRemove: null})
// ^ fixme generalize these misnomers to eg. alignStart / alignMiddle / alignEnd or similar

// mapping alignments to constraints
const horizontalConstraint = constraint => enforceAlignment && horizontalAlignmentMap[constraint.alignment]
const verticalConstraint = constraint => enforceAlignment && verticalAlignmentMap[constraint.alignment]

const shapeConstraintUpdate = (shapes, snapGuideLines, shape) => {
  const {line: verticalSnap, anchor: horizontAnchor, vector: xConstraintVector} = snapGuideLine(snapGuideLines.filter(isVertical), shape, 'horizontal')
  const {line: horizontSnap, anchor: verticalAnchor, vector: yConstraintVector} = snapGuideLine(snapGuideLines.filter(isHorizontal), shape, 'vertical')
  //if(horizontSnap && shape.key === 'rect5') console.log(yConstraintVector)
  //if(verticalSnap && shape.key === 'rect5') console.log(xConstraintVector)
  return {
    xConstraint: verticalSnap && verticalSnap.key,
    yConstraint: horizontSnap && horizontSnap.key,
    xConstraintAnchor: horizontAnchor,
    yConstraintAnchor: verticalAnchor,
    xConstraintVector,
    yConstraintVector
  }
}

const dragUpdate = (shape, constraints, x0, y0, x1, y1, mouseDowned, hoveredEdgeMarker) => {
  const grabStart = mouseDowned
  const preMoveTransformMatrix = grabStart ? shape.transformMatrix : shape.preMoveTransformMatrix
  const unconstrainedTransformMatrix = matrix.multiply(preMoveTransformMatrix, matrix.translate(x1 - x0, y1 - y0, 0, 0))
  return {
    preMoveTransformMatrix,
    transformMatrix: unconstrainedTransformMatrix,
    unconstrainedTransformMatrix
  }
}

const snapUpdate = (constraints, shape) => {
  if(!shape.unconstrainedTransformMatrix) return {}
  const xDiff = shape.xConstraintVector ? shape.xConstraintVector[0] : 0
  const yDiff = shape.yConstraintVector ? shape.yConstraintVector[1] : 0
  let transformMatrix = matrix.multiply(shape.unconstrainedTransformMatrix, matrix.translate(xDiff, yDiff, 0))
  return {
    transformMatrix
  }
}


/**
 * Gestures - derived selectors for transient state
 */

// dispatch the various types of actions
const rawCursorPosition = select(
  cursorPositionAction
)(primaryUpdate)

const mouseButtonEvent = select(
  mouseButtonEventAction
)(primaryUpdate)

const shapeEvent = select(
  shapeEventAction
)(primaryUpdate)

const alignEvent = select(
  d => {return alignEventAction(d)}
)(primaryUpdate)

const cursorPosition = selectReduce(
  (previous, position) => position || previous,
  {x: 0, y: 0}
)(rawCursorPosition)

const mouseIsDown = selectReduce(
  (previous, next) => next
    ? next.event === 'mouseDown'
    : previous,
  false
)(mouseButtonEvent)

/**
 * mouseButtonStateTransitions
 *
 *    View: http://stable.ascii-flow.appspot.com/#567671116534197027
 *    Edit: http://stable.ascii-flow.appspot.com/#567671116534197027/776257435
 *
 *
 *                             mouseIsDown
 *        initial state: 'up' +-----------> 'downed'
 *                        ^ ^                 +  +
 *                        | |  !mouseIsDown   |  |
 *           !mouseIsDown | +-----------------+  | mouseIsDown && movedAlready
 *                        |                      |
 *                        +----+ 'dragging' <----+
 *                                +      ^
 *                                |      |
 *                                +------+
 *                               mouseIsDown
 *
 */
const mouseButtonStateTransitions = (state, mouseIsDown, movedAlready) => {
  switch(state) {
    case 'up': return mouseIsDown ? 'downed' : 'up'
    case 'downed': return mouseIsDown ? (movedAlready ? 'dragging' : 'downed') : 'up'
    case 'dragging': return mouseIsDown ? 'dragging' : 'up'
  }
}

const mouseButtonState = selectReduce(
  ({buttonState, downX, downY}, mouseIsDown, {x, y}) => {
    const movedAlready = x !== downX || y !== downY
    const newButtonState = mouseButtonStateTransitions(buttonState, mouseIsDown, movedAlready)
    return {
      buttonState: newButtonState,
      downX: newButtonState === 'downed' ? x : downX,
      downY: newButtonState === 'downed' ? y : downY
    }
  },
  {buttonState: 'up', downX: null, downY: null}
)(mouseIsDown, cursorPosition)

const mouseDowned = select(
  state => state.buttonState === 'downed'
)(mouseButtonState)

const dragging = select(
  state => state.buttonState === 'dragging'
)(mouseButtonState)

const mouseClickEvent = select(
  event => event && event.event === 'mouseClick'
)(mouseButtonEvent)

const dragVector = select(
  ({buttonState, downX, downY}, {x, y}) => ({down: buttonState !== 'up', x0: downX, y0: downY, x1: x, y1: y})
)(mouseButtonState, cursorPosition)


/**
 * Scenegraph update based on events, gestures...
 */

const selectedShape = selectReduce(
  (prev, next) => next && (next.event === 'showToolbar' && next.shapeType === 'line' ? next.shapeKey : prev) || prev,
  null
)(shapeEvent)

const shapes = select((scene, externalShapeUpdates) => updateShapes(scene.shapes, externalShapeUpdates))(scene, shapeAdditions)
const hoveredShape = select(hoveringAt)(shapes, cursorPosition)
const draggedShape = select(draggingShape)(scene, hoveredShape, mouseIsDown, mouseDowned)
const constraints = select(constraintLookup)(shapes)
const alignUpdate = select(alignEvent => {
  // set alignment type on sticky line, if needed
  if(alignEvent) {
    const {event, shapeKey} = alignEvent
    return {shapeKey, alignment: event !== 'alignRemove' && event}
  }
})(alignEvent)

// the currently dragged shape is considered in-focus; if no dragging is going on, then the hovered shape
const focusedShape = select(
  (draggedShape, hoveredShape) => draggedShape || hoveredShape
)(draggedShape, hoveredShape)

// focusedShapes has updated position etc. information while focusedShape may have stale position
const focusedShapes = select(
  (shapes, focusedShape) => shapes.filter(shape => focusedShape && shape.key === focusedShape.key)
)(shapes, focusedShape)

const shapeEdgeMarkers = select(
  focusedShapes => flatten(focusedShapes
    .map(({key, a, b, transformMatrix, xConstraintAnchor, yConstraintAnchor}) => ([
      {key: key + ' top', transformMatrix: matrix.multiply(transformMatrix, matrix.translate(0, -b, 0)),
        snapped: yConstraintAnchor === 'top', horizontal: true, shapeKey: key},
      {key: key + ' right', transformMatrix: matrix.multiply(transformMatrix, matrix.translate(a, 0, 0)),
        snapped: xConstraintAnchor === 'right', horizontal: false, shapeKey: key},
      {key: key + ' bottom', transformMatrix: matrix.multiply(transformMatrix, matrix.translate(0, b, 0)),
        snapped: yConstraintAnchor === 'bottom', horizontal: true, shapeKey: key},
      {key: key + ' left', transformMatrix: matrix.multiply(transformMatrix, matrix.translate(-a, 0, 0)),
        snapped: xConstraintAnchor === 'left', horizontal: false, shapeKey: key}
    ]))
  ))(focusedShapes)

const shapeCenterMarkers = select(
  focusedShapes => flatten(focusedShapes
    .map(({key, transformMatrix, xConstraintAnchor, yConstraintAnchor}) => ([
      {key: key + ' center', transformMatrix: matrix.multiply(transformMatrix, matrix.translate(0, 0, 0.01)),
        snapped: xConstraintAnchor === 'center', horizontal: false, shapeKey: key},
      {key: key + ' middle', transformMatrix: matrix.multiply(transformMatrix, matrix.translate(0, 0, xConstraintAnchor === 'center' ? 0 : 0.02)),
        snapped: yConstraintAnchor === 'middle', horizontal: true, shapeKey: key}
    ]))
  ))(focusedShapes)

const hoveredEdgeMarker = select((shapeEdgeMarkers, {x, y}) => {
  const closest = shapeEdgeMarkers.reduce(
    (previous, marker) => {
      const [x1, y1] = matrix.mvMultiply(marker.transformMatrix, matrix.ORIGIN)
      const distance = pointDistance(x, y, x1, y1)
      return distance < previous.distance ? {distance, marker} : previous
    },
    {distance: Infinity, marker: null}
  )
  const hoveredMarker = closest.distance < markerProximityDistance ? closest.marker : null
  return hoveredMarker
})(shapeEdgeMarkers, cursorPosition)

const dragStartAt = selectReduce(
  (previous, mouseDowned, {down, x0, y0, x1, y1}, focusedShape) => {
    if(down) {
      const newDragStart = mouseDowned && !previous.down
      return newDragStart
        ? {down, x: x1, y: y1, dragStartShape: focusedShape}
        : previous
    } else {
      return {down: false}
    }
  },
  {down: false}
)(dragging, dragVector, focusedShape)

// affordance for permanent selection of a shape
const newShapeEvent = select(
  (click, shape, {x, y}) =>
    click && {event: 'showToolbar', x, y, shapeKey: shape && shape.key, shapeType: shape && shape.type}
)(mouseClickEvent, focusedShape, cursorPosition)

// returns those snap guidelines that may affect the draggedShape
const snapGuideLines = select(
  (shapes, draggedShape) => {
    // The guidelines may come from explicit guidelines (as in the mock of this PoC) or generated automatically in the future
    // so that dragging a shape dynamically traces other shapes, flashing temporary alignment lines, example snap guides
    // here: https://i.imgur.com/QKrK6.png
    if(draggedShape) {
      const allGuideLines = allLines(shapes)
      return isLine(draggedShape)
        ? allGuideLines.filter(line => !parallel(line, draggedShape))
        : allGuideLines
    } else {
      return [] // snap lines are in practice nonexistent if there's no ongoing dragging
    }
  }
)(shapes, draggedShape)

const nextShapes = select(
  (shapes, draggedShape, {x0, y0, x1, y1}, alignUpdate, constraints, snapGuideLines, mouseDowned, hoveredEdgeMarker) => {

    // this is the per-shape model update at the current PoC level
    return shapes.map(shape => {
      const beingDragged = draggedShape && draggedShape.key === shape.key
      return {
        // update the preexisting shape:
        ...shape,
        // with the effect of dragging:
        ...beingDragged && dragUpdate(shape, constraints, x0, y0, x1, y1, mouseDowned, hoveredEdgeMarker),
        // and the effect of establishing / breaking snap connections:
        ...beingDragged && shapeConstraintUpdate(shapes, snapGuideLines, shape),
        // and following any necessary snapping due to establishing / breaking snap constraints:
        ...snapUpdate(constraints, shape),
        // and updating a possible alignment constraint on a snap line:
        ...alignUpdate && shape.key === alignUpdate.shapeKey && {alignment: alignUpdate.alignment}
      }
    })
  }
)(shapes, draggedShape, dragVector, alignUpdate, constraints, snapGuideLines, mouseDowned, hoveredEdgeMarker)

// free shapes are for showing the unconstrained location of the shape(s) being dragged
const currentFreeShapes = select(
  (shapes, {dragStartShape}) =>
    shapes
      .filter(shape => dragStartShape && shape.key === dragStartShape.key)
      .map(shape => ({...shape, transformMatrix: shape.unconstrainedTransformMatrix, z: freeDragZ, backgroundColor: freeColor}))
)(shapes, dragStartAt)

// this is the core scenegraph update invocation: upon new cursor position etc. emit the new scenegraph
// it's _the_ state representation (at a PoC level...) comprising of transient properties eg. draggedShape, and the
// collection of shapes themselves
const nextScene = select(
  (hoveredShape, draggedShape, shapes) => ({
    hoveredShape,
    draggedShape,
    shapes
  })
)(hoveredShape, draggedShape, nextShapes)

module.exports = {
  cursorPosition, mouseIsDown, dragStartAt, shapeEdgeMarkers, shapeCenterMarkers,
  nextScene, focusedShape, selectedShape, currentFreeShapes, hoveredEdgeMarker,
  shapeAdditions, primaryUpdate, newShapeEvent, shapes, focusedShapes
}