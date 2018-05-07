const {
        select,
        selectReduce
      } = require('./state')

const {
        actionUid,
        dragging,
        dragVector,
        cursorPosition,
        mouseButton,
        mouseDowned,
        mouseIsDown,
        pressedKeys
      } = require('./gestures')

const { topShapeAt } = require('./geometry')

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
const hoveredShape = select(topShapeAt)(shapes, cursorPosition)
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
          case 'KeyR': return matrix.shear(0.1, 0)
          case 'KeyT': return matrix.shear(-0.1, 0)
          case 'KeyU': return matrix.shear(0, 0.1)
          case 'KeyH': return matrix.shear(0, -0.1)
        }
      })
      .filter(d => d)
    return result
  }
)(pressedKeys)

const selectedShapes = selectReduce(
  (prev, focusedShape, {down, uid}) => {
    if(uid === prev.uid || !down || !focusedShape) return prev
    const shapes = prev.shapes
    const found = shapes.find(key => focusedShape && key === focusedShape.key)
    return {
      shapes: found
        ? shapes.filter(key => key !== focusedShape.key) // remove from selection
        : shapes.concat([focusedShape.key]), // add to selection
      uid
    }
  },
  {shapes: [], uid: null},
  d => d.shapes
)(hoveredShape, mouseButton)

const transformIntent = select(
  (transforms, shapes) => {return {transforms, shapes}}
)(transformGesture, selectedShapes)

const nextShapes = select(
  (shapes, draggedShape, {x0, y0, x1, y1}, mouseDowned, transform) => {
    // this is the per-shape model update at the current PoC level
    return shapes.map(shape => {
      return {
        // update the preexisting shape:
        ...shape,
        // apply transforms (holding multiple keys applies multiple transforms simultaneously, so we must reduce)
        ...transform.shapes.find(key => key === shape.key) && {
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
  (hoveredShape, draggedShapes, shapes) => ({
    hoveredShape,
    draggedShapes,
    shapes
  })
)(hoveredShape, selectedShapes, nextShapes)

module.exports = {
  cursorPosition, mouseIsDown, dragStartAt,
  nextScene, focusedShape,
  primaryUpdate, shapes, focusedShapes, selectedShapes
}

/**
 * General inputs to behaviors:
 *
 * 1. Mode: the mode the user is in. For example, clicking on a shape in 'edit' mode does something different (eg. highlight
 *    activation hotspots or show the object in a configuration tab) than in 'presentation' mode (eg. jump to a link, or just
 *    nothing). This is just an example and it can be a lot more granular, eg. a 2D vs 3D mode; perspective vs isometric;
 *    shape being translated vs resized vs whatever. Multiple modes can apply simultaneously. Modes themselves may have
 *    structure: simple, binary or multistate modes at a flat level; ring-like; tree etc. or some mix. Modes are generally
 *    not a good thing, so we should use it sparingly (see Bret Victor's reference to NOMODES as one of his examples in
 *    Inventing on Principle)
 *
 * 2. Focus: there's some notion of what the behaviors act on, for example, a shape we hover over or select; multiple
 *    shapes we select or lasso; or members of a group (direct descendants, or all descendants, or only all leafs). The
 *    focus can be implied, eg. act on whatever's currently in view. It can also arise hierarchical: eg. move shapes within
 *    a specific 'project' (normal way of working things, like editing one specific text file), or highlighting multiple
 *    shapes with a lasso within a previously focused group. There can be effects (color highlighting, autozooming etc.) that
 *    show what is currently in focus, as the user's mental model and the computer's notion of focus must go hand in hand.
 *
 * 3. Gesture: a primitive action that's raw input. Eg. moving the mouse a bit, clicking, holding down a modifier key or
 *    hitting a key. This is how the user acts on the scene. Can be for direct manipulation (eg. drag or resize) or it can
 *    be very modal (eg. a key acting in a specific mode, or a key or other gesture that triggers a new mode or cancels a
 *    preexisting mode). Gestures may be compose simultaneously (eg. clicking while holding down a modifier key) and/or
 *    temporally (eg. grab, drag, release). Ie. composition and finite state machine. But these could (should?) be modeled
 *    via submerging into specific modes. For example, grabbing an object and starting to move the mouse may induce the
 *    'drag' mode (within whatever mode we're already in). Combining modes, foci and gestures give us the typical design
 *    software toolbars, menus, palettes. For example, clicking (gesture) on the pencil icon (focus, as we're above it) will
 *    put us in the freehand drawing mode.
 *
 * 4. External variables: can be time, or a sequence of things triggered by time (eg. animation, alerting, data fetch...)
 *    or random data (for simulation) or a new piece of data from the server (in the case of collaborative editing)
 *
 * 5. Memory: undo/redo, repeat action, keyboard macros and time travel require that successive states or actions be recorded
 *    so they're recoverable later. Sometimes the challenge is in determining what the right level is. For example, should
 *    `undo` undo the last letter typed, or a larger transaction (eg. filling a field), or something in between, eg. regroup
 *    the actions and delete the lastly entered word sentence. Also, in macro recording, is actual mouse movement used, or
 *    something arising from it, eg. the selection on an object?
 *
 * Action: actions are granular, discrete pieces of progress along some user intent. Actions are not primary, except
 *         gestures. They arise from the above primary inputs. They can be hierarchical in that a series of actions (eg.
 *         selecting multiple shapes and hitting `Group`) leads to the higher level action of "group all these elements".
 *
 * All these are input to how we deduce _user intent_, therefore _action_. There can be a whirl of these things leading to
 * higher levels, eg. click (gesture) over an icon (focus) puts us in a new mode, which then alters what specific gestures,
 * modes and foci are possible; it can be an arbitrary graph. Let's try to characterize this graph...
 *
 */
