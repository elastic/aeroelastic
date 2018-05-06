const {
        select,
        selectReduce
      } = require('./state')

const {
        dragging,
        dragVector,
        cursorPosition,
        mouseDowned,
        mouseIsDown,
        pressedKeys
      } = require('./gestures')

const matrix = require('./matrix')


/**
 * Selectors directly from a state object
 */

const primaryUpdate = state => state.primaryUpdate
const scene = state => state.currentScene


/**
 * Pure calculations
 */

/**
 *
 * a * x0 + b * x1 = x
 * a * y0 + b * y1 = y
 *
 * a, b = ?
 *
 * b = (y - a * y0) / y1
 *
 * a * x0 + b * x1 = x
 *
 * a * x0 + (y - a * y0) / y1 * x1 = x
 *
 * a * x0 + y / y1 * x1 - a * y0 / y1 * x1 = x
 *
 * a * x0 - a * y0 / y1 * x1 = x - y / y1 * x1
 *
 * a * (x0 - y0 / y1 * x1) = x - y / y1 * x1
 *
 * a = (x - y / y1 * x1) / (x0 - y0 / y1 * x1)
 * b = (y - a * y0) / y1
 *
 */
// set of shapes under a specific point
const shapesAtPoint = (shapes, x, y) => shapes.map(shape => {
  const {transformMatrix, a, b} = shape
  if(transformMatrix) {
    // We go full tilt with the inverse transform approach because that's general enough to handle any non-pathological
    // composition of transforms. Eg. this is a description of the idea: https://math.stackexchange.com/a/1685315
    // A perhaps cheaper alternative would be to forward project the four vertices and check if the cursor is within
    // the quadrilateral in 2D space.

    const centerPoint = matrix.normalize(matrix.mvMultiply(transformMatrix, matrix.ORIGIN))
    const rightPoint = matrix.normalize(matrix.mvMultiply(transformMatrix, [1, 0, 0, 1]))
    const upPoint = matrix.normalize(matrix.mvMultiply(transformMatrix, [0, 1, 0, 1]))
    const x0 = rightPoint[0] - centerPoint[0]
    const y0 = rightPoint[1] - centerPoint[1]
    const x1 = upPoint[0] - centerPoint[0]
    const y1 = upPoint[1] - centerPoint[1]
    const A = ((x - centerPoint[0]) - (y - centerPoint[1]) / y1 * x1) / (x0 - y0 / y1 * x1)
    const B = ((y - centerPoint[1]) - A * y0) / y1
    const rightSlope = rightPoint[2] - centerPoint[2]
    const upSlope =upPoint[2] - centerPoint[2]
    const z = centerPoint[2] + rightSlope * A + upSlope * B
    const inverseProjection = matrix.invert(transformMatrix)
    const intersection = matrix.normalize(matrix.mvMultiply(inverseProjection, [x, y, z, 1]))
    const [sx, sy] = intersection
    return {z, intersection, inside: Math.abs(sx) <= a && Math.abs(sy) <= b, shape}
  } else {
    return {z: -Infinity, intersection: matrix.NULLVECTOR, inside: false, shape}
  }
})

// Pick top shape out of possibly several shapes (presumably under the same point).
// Since CSS X points to the right, Y to the bottom (not the top!) and Z toward the viewer, it's a left-handed coordinate
// system. Yet another wording is that X and Z point toward the expected directions (right, and towards the viewer,
// respectively), but Y is pointing toward the bottom (South). It's called left-handed because we can position the thumb (X),
// index (Y) and middle finger (Z) on the left hand such that they're all perpendicular to one another, and point to the
// positive direction.
//
// If it were a right handed coordinate system, AND Y still pointed down, then Z should increase away from the
// viewer. But that's not the case. So we maximize the Z value to tell what's on top.
const topShape = shapes => shapes.reduce((prev, {shape, inside, z}) => {
  return inside && (z >= prev.z) ? {z, shape} : prev
}, {z: -Infinity, shape: null})

// returns the shape - closest to the reader in the Z-stack - that the reader hovers over with the mouse
const hoveringAt = (shapes, {x, y}) => {
  const hoveredShapes = shapesAtPoint(shapes, x, y)
  return topShape(hoveredShapes).shape
}

// returns the currently dragged shape, or a falsey value otherwise
const draggingShape = ({draggedShape, shapes}, hoveredShape, down, mouseDowned) => {
  const dragInProgress = down && shapes.reduce((prev, next) => prev || draggedShape && next.key === draggedShape.key, false)
  return dragInProgress && draggedShape  || down && mouseDowned && hoveredShape
}


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
          case 'KeyF': return matrix.translate(0, 0, -2)
          case 'KeyC': return matrix.translate(0, 0, 2)
          case 'KeyX': return matrix.rotateX(Math.PI / 45)
          case 'KeyY': return matrix.rotateY(Math.PI / 45)
          case 'KeyZ': return matrix.rotateZ(Math.PI / 45)
          case 'KeyI': return matrix.scale(1, 1.05, 1)
          case 'KeyJ': return matrix.scale(1 / 1.05, 1, 1)
          case 'KeyK': return matrix.scale(1, 1 / 1.05, 1)
          case 'KeyL': return matrix.scale(1.05, 1, 1)
          case 'KeyP': return matrix.perspective(1000)
          case 'KeyE': return matrix.shear(0.1, 0)
          case 'KeyR': return matrix.shear(-0.1, 0)
          case 'KeyT': return matrix.shear(0, 0.1)
          case 'KeyG': return matrix.shear(0, -0.1)
        }
      })
      .filter(d => d)
    return result
  }
)(pressedKeys)

const selectedShape = selectReduce(
  (prev, focusedShape, mouseDowned) => {
    return mouseDowned ? focusedShape : prev
  },
  null
)(hoveredShape, mouseDowned)

const transformIntent = select(
  (transforms, shape) => {return {transforms, shape}}
)(transformGesture, selectedShape)

const nextShapes = select(
  (shapes, draggedShape, {x0, y0, x1, y1}, mouseDowned, transformIntent) => {
    // this is the per-shape model update at the current PoC level
    return shapes.map(shape => {
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
)(hoveredShape, selectedShape, nextShapes)

module.exports = {
  cursorPosition, mouseIsDown, dragStartAt,
  nextScene, focusedShape,
  primaryUpdate, shapes, focusedShapes, selectedShape
}