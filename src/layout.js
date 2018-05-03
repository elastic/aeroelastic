const {
        select,
        selectReduce
      } = require('./state')

const {
        markerProximityDistance
      } = require('../example/mockConfig')

const {flatten} = require('./functional')

const matrix = require('./matrix')


/**
 * Selectors directly from a state object
 */

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
    return {intersection, inside: Math.abs(sx) <= a && Math.abs(sy) <= b, shape}
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

const cursorPositionAction = action => action && action.actionType === 'cursorPosition' ? action.payload : null
const mouseButtonEventAction = action => action && action.actionType === 'mouseEvent' ? action.payload : null

// returns the currently dragged shape, or a falsey value otherwise
const draggingShape = ({draggedShape, shapes}, hoveredShape, down, mouseDowned) => {
  const dragInProgress = down && shapes.reduce((prev, next) => prev || (draggedShape && next.key === draggedShape.key), false)
  return dragInProgress && draggedShape  || down && mouseDowned && hoveredShape
}

const dragUpdate = (shape, x0, y0, x1, y1, mouseDowned) => {
  const grabStart = mouseDowned
  const preMoveTransformMatrix = grabStart ? shape.transformMatrix : shape.preMoveTransformMatrix
  const transformMatrix = matrix.multiply(preMoveTransformMatrix, matrix.translate(x1 - x0, y1 - y0, 0, 0))
  return {
    preMoveTransformMatrix,
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

const dragVector = select(
  ({buttonState, downX, downY}, {x, y}) => ({down: buttonState !== 'up', x0: downX, y0: downY, x1: x, y1: y})
)(mouseButtonState, cursorPosition)


/**
 * Scenegraph update based on events, gestures...
 */

const shapes = select(scene => scene.shapes)(scene)
const hoveredShape = select(hoveringAt)(shapes, cursorPosition)
const draggedShape = select(draggingShape)(scene, hoveredShape, mouseIsDown, mouseDowned)

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
    .map(({key, a, b, transformMatrix}) => ([
      {key: key + ' top', transformMatrix: matrix.multiply(transformMatrix, matrix.translate(0, -b, 0)),
        horizontal: true, shapeKey: key},
      {key: key + ' right', transformMatrix: matrix.multiply(transformMatrix, matrix.translate(a, 0, 0)),
        horizontal: false, shapeKey: key},
      {key: key + ' bottom', transformMatrix: matrix.multiply(transformMatrix, matrix.translate(0, b, 0)),
        horizontal: true, shapeKey: key},
      {key: key + ' left', transformMatrix: matrix.multiply(transformMatrix, matrix.translate(-a, 0, 0)),
        horizontal: false, shapeKey: key}
    ]))
  ))(focusedShapes)

const shapeCenterMarkers = select(
  focusedShapes => flatten(focusedShapes
    .map(({key, transformMatrix}) => ([
      {key: key + ' center', transformMatrix: matrix.multiply(transformMatrix, matrix.translate(0, 0, 0.01)),
        horizontal: false, shapeKey: key},
      {key: key + ' middle', transformMatrix: matrix.multiply(transformMatrix, matrix.translate(0, 0, 0.02)),
        horizontal: true, shapeKey: key}
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

const nextShapes = select(
  (shapes, draggedShape, {x0, y0, x1, y1}, mouseDowned) => {

    // this is the per-shape model update at the current PoC level
    return shapes.map(shape => {
      const beingDragged = draggedShape && draggedShape.key === shape.key
      return {
        // update the preexisting shape:
        ...shape,
        // with the effect of dragging:
        ...beingDragged && dragUpdate(shape, x0, y0, x1, y1, mouseDowned)
      }
    })
  }
)(shapes, draggedShape, dragVector, mouseDowned)

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
  nextScene, focusedShape, hoveredEdgeMarker,
  primaryUpdate, shapes, focusedShapes
}