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

const { hoveringAt } = require('./geometry')

const matrix = require('./matrix')


/**
 * Selectors directly from a state object
 */

const primaryUpdate = state => state.primaryUpdate
const scene = state => state.currentScene


/**
 * Pure calculations
 */

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
  (shapes, draggedShape, {x0, y0, x1, y1}, mouseDowned, transform) => {
    // this is the per-shape model update at the current PoC level
    return shapes.map(shape => {
      return {
        // update the preexisting shape:
        ...shape,
        // apply transforms (holding multiple keys applies multiple transforms simultaneously, so we must reduce)
        ...transform.shape && transform.shape.key === shape.key && {
          transformMatrix: matrix.applyTransforms(transform.transforms, shape.transformMatrix)
        }
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