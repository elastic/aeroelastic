const {
        select,
        selectReduce
      } = require('./state')

const matrix = require('./matrix')


/**
 * Selectors directly from a state object
 */

const primaryUpdate = state => state.primaryUpdate
const scene = state => state.currentScene


/**
 * Pure calculations
 */

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
const topShape = shapes => shapes.reduce((prev, {shape, inside, intersection: [x, y, z]}) => {
  return inside && (z <= prev.z) ? {z, shape} : prev
}, {z: Infinity, shape: null})

// returns the shape - closest to the reader in the Z-stack - that the reader hovers over with the mouse
const hoveringAt = (shapes, {x, y}) => {
  const hoveredShapes = shapesAtPoint(shapes, x, y)
  return topShape(hoveredShapes).shape
}

const cursorPositionAction = action => action && action.actionType === 'cursorPosition' ? action.payload : null
const mouseButtonEventAction = action => action && action.actionType === 'mouseEvent' ? action.payload : null
const keyboardAction = action => action && action.actionType === 'keyboardEvent' ? action.payload : null

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

const keyboardEvent = select(
  keyboardAction,
)(primaryUpdate)

const pressedKeys = selectReduce(
  (lookup, next) => {
    let result
    if(next) {
      if (next.event === 'keyDown') {
        result = {...lookup, [next.code]: true}
      } else {
        const {[next.code]: ignore, ...rest} = lookup
        result = rest
      }
    } else {
      result ={ ...lookup }
    }
    return result
  },
  {}
)(keyboardEvent)

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

const transformGesture = select(
  keys => {
    const result = Object.keys(keys)
      .map(keypress => {
        switch(keypress) {
          case 'KeyW': return matrix.translate(0, -2, 0)
          case 'KeyA': return matrix.translate(-2, 0, 0)
          case 'KeyS': return matrix.translate(0, 2, 0)
          case 'KeyD': return matrix.translate(2, 0, 0)
          case 'KeyX': return matrix.rotateX(Math.PI / 45)
          case 'KeyY': return matrix.rotateY(Math.PI / 45)
          case 'KeyZ': return matrix.rotateZ(Math.PI / 45)
          case 'KeyI': return matrix.scale(1, 1.05, 1)
          case 'KeyJ': return matrix.scale(1 / 1.05, 1, 1)
          case 'KeyK': return matrix.scale(1, 1 / 1.05, 1)
          case 'KeyL': return matrix.scale(1.05, 1, 1)

        }
      })
      .filter(d => d)
    return result
  }
)(pressedKeys)

const transformIntent = select(
  (transforms, shape) => {return {transforms, shape}}
)(transformGesture, focusedShape)

const nextShapes = select(
  (shapes, draggedShape, {x0, y0, x1, y1}, mouseDowned, transformIntent) => {
    // this is the per-shape model update at the current PoC level
    return shapes.map(shape => {
      const beingDragged = draggedShape && draggedShape.key === shape.key
      return {
        // update the preexisting shape:
        ...shape,
        ...transformIntent.shape && transformIntent.shape.key === shape.key && {transformMatrix: transformIntent.transforms.reduce((prev, next) => matrix.multiply(prev, next), shape.transformMatrix)}
        // with the effect of dragging:
        //...beingDragged && dragUpdate(shape, x0, y0, x1, y1, mouseDowned)
      }
    })
  }
)(shapes, draggedShape, dragVector, mouseDowned, transformIntent)

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
  cursorPosition, mouseIsDown, dragStartAt,
  nextScene, focusedShape,
  primaryUpdate, shapes, focusedShapes
}