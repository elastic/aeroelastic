const {
        createStore,
        map
      } = require('./src/state')

const {
        renderIntoRoot,
        makeShapeFrags,
        makeRotateFrags,
        makeShapeCornerFrags,
        makeShapeEdgeFrags,
        makeShapeMenuOverlayFrags,
        makeMetaCursorFrag,
        makeDragLineFrag,
        makeSubstrateFrag
      } = require('./example/mockDomFragments')

const {devColor} = require('./example/mockConfig')

const initialState = require('./example/mockScene')

const store = createStore(initialState)

const {
        cursorPosition, mouseIsDown, dragStartAt,
        nextScene, focusedShape, selectedShape, currentFreeShapes,
        shapeAdditions, primaryUpdate, newShapeEvent, shapes
      } = require('./src/layout')

const matrix = require('./src/matrix')


/**
 * Update fragments
 */

// map x0, y0, x1, y1 to deltas, length and angle
const vectorLength = (x, y) =>  Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))

const positionsToLineAttribs = (x0, y0, x1, y1) => {
  const deltaX = x1 - x0
  const deltaY = y1 - y0
  const length = vectorLength(deltaX, deltaY)
  const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI
  return {length, angle, deltaX, deltaY}
}

const metaCursorFrag = map(
  (cursor, mouseDown, dragStartAt) => {
    const thickness = mouseDown ? 8 : 1
    return makeMetaCursorFrag(cursor.x, cursor.y, dragStartAt && dragStartAt.dragStartShape, thickness, devColor)
  }
)(cursorPosition, mouseIsDown, dragStartAt)

const shapeFrags = map(
  ({shapes}, hoveredShape, dragStartAt) =>
    makeShapeFrags(shapes, hoveredShape, dragStartAt)
)(nextScene, focusedShape, dragStartAt, selectedShape)

// focusedShapes has updated position etc. information while focusedShape may have stale position
const focusedShapes = map(
  (shapes, focusedShape) => shapes.filter(shape => focusedShape && shape.key === focusedShape.key)
)(shapes, focusedShape)

const selectedShapes = map(
  (shapes, selectedShapeKey) => shapes.filter(shape => shape.key === selectedShapeKey)
)(shapes, selectedShape)

const shapeCornerFrags = map(
  focusedShapes => focusedShapes.map(makeShapeCornerFrags)
)(focusedShapes, dragStartAt)

const shapeEdgeFrags = map(
  focusedShapes => focusedShapes.map(makeShapeEdgeFrags)
)(focusedShapes, dragStartAt)

const shapeRotateFrags = map(
  focusedShapes => {
    const translateToCenter = shape => matrix.multiply(shape.transformMatrix3d, matrix.translate(shape.width / 2, 0, 0))
    return focusedShapes.map(translateToCenter).map(makeRotateFrags)
  }
)(focusedShapes)

const shapeMenuOverlayFrags = map(
  selectedShapes => makeShapeMenuOverlayFrags(store.commit)(selectedShapes)
)(selectedShapes)

const freeShapeFrags = map(
  shapes => makeShapeFrags(shapes, null, null, false)
)(currentFreeShapes)

const dragLineFrag = map(
  (cursor, dragStartAt) => {
    const origin = dragStartAt.down ? dragStartAt : cursor
    const lineAttribs = positionsToLineAttribs(origin.x, origin.y, cursor.x, cursor.y)
    return makeDragLineFrag(lineAttribs.length, origin.x, origin.y, lineAttribs.angle)
  }
)(cursorPosition, dragStartAt)

const scenegraph = map(
  makeSubstrateFrag(store.commit)
)(shapeFrags, shapeRotateFrags, shapeCornerFrags, shapeEdgeFrags, shapeMenuOverlayFrags, freeShapeFrags, metaCursorFrag,
  dragLineFrag)

const updateScene = map(
  (nextScene, shapeAdditions, primaryUpdate, frag, newShapeEvent) => {

    // perform side effects: rendering, and possibly, asynchronously dispatching arising events
    renderIntoRoot(frag)
    if(newShapeEvent) {
      store.dispatch('shapeEvent', newShapeEvent) // async!
    }

    // yield the new state
    return {
      shapeAdditions,
      primaryUpdate,
      currentScene: nextScene
    }
  }
)(nextScene, shapeAdditions, primaryUpdate, scenegraph, newShapeEvent)

store.setUpdater(updateScene)

// set the initial scene
store.setCurrentState(updateScene(store.getCurrentState()))