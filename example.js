const {
        createStore,
        select
      } = require('./src/state')

const {
        renderIntoRoot,
        makeShapeFrags,
        makeRotateFrags,
        makeShapeCornerFrags,
        makeShapeParallelFrags,
        makeShapeMenuOverlayFrags,
        makeMetaCursorFrag,
        makeDragLineFrag,
        makeSubstrateFrag
      } = require('./example/mockDomFragments')

const {
  devColor
} = require('./example/mockConfig')

const initialState = require('./example/mockScene')

const store = createStore(initialState)

const {flatten, map} = require('./src/functional')

const {
        cursorPosition, mouseIsDown, dragStartAt,
        nextScene, focusedShape, selectedShape, currentFreeShapes,
        shapeAdditions, primaryUpdate, newShapeEvent, shapes,
        focusedShapes
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

const metaCursorFrag = select(
  (cursor, mouseDown, dragStartAt) => {
    const thickness = mouseDown ? 8 : 1
    return makeMetaCursorFrag(cursor.x, cursor.y, dragStartAt && dragStartAt.dragStartShape, thickness, devColor)
  }
)(cursorPosition, mouseIsDown, dragStartAt)

const shapeFrags = select(
  ({shapes}, hoveredShape, dragStartAt) =>
    makeShapeFrags(shapes, hoveredShape, dragStartAt)
)(nextScene, focusedShape, dragStartAt, selectedShape)

const selectedShapes = select(
  (shapes, selectedShapeKey) => shapes.filter(shape => shape.key === selectedShapeKey)
)(shapes, selectedShape)

const shapeCornerFrags = select(
  focusedShapes => focusedShapes.map(makeShapeCornerFrags)
)(focusedShapes, dragStartAt)

const shapeEdgeMarkers = select(
  focusedShapes => flatten(focusedShapes
    .map(({width, height, transformMatrix, xConstraintAnchor, yConstraintAnchor}) => ([
      {transformMatrix: matrix.multiply(transformMatrix, matrix.translate(width / 2, 0, 0)),
        snapped: yConstraintAnchor === 'top', horizontal: true},
      {transformMatrix: matrix.multiply(transformMatrix, matrix.translate(width, height / 2, 0)),
        snapped: xConstraintAnchor === 'right', horizontal: false},
      {transformMatrix: matrix.multiply(transformMatrix, matrix.translate(width / 2, height, 0)),
        snapped: yConstraintAnchor === 'bottom', horizontal: true},
      {transformMatrix: matrix.multiply(transformMatrix, matrix.translate(0, height / 2, 0)),
        snapped: xConstraintAnchor === 'left', horizontal: false}
    ]))
  ))(focusedShapes)

const shapeEdgeFrags = select(
  map(makeShapeParallelFrags)
)(shapeEdgeMarkers)

const shapeCenterMarkers = select(
  focusedShapes => flatten(focusedShapes
    .map(({width, height, transformMatrix, xConstraintAnchor, yConstraintAnchor}) => ([
      {transformMatrix: matrix.multiply(transformMatrix, matrix.translate(width / 2, height / 2, 0.01)),
        snapped: xConstraintAnchor === 'center', horizontal: false},
      {transformMatrix: matrix.multiply(transformMatrix, matrix.translate(width / 2, height / 2, xConstraintAnchor === 'center' ? 0 : 0.02)),
        snapped: yConstraintAnchor === 'middle', horizontal: true}
    ]))
  ))(focusedShapes)

const shapeCenterFrags = select(
  map(makeShapeParallelFrags)
)(shapeCenterMarkers)

const shapeRotateFrags = select(
  focusedShapes => {
    const translateToCenter = shape => matrix.multiply(shape.transformMatrix, matrix.translate(shape.width / 2, 0, 0))
    return focusedShapes.map(translateToCenter).map(makeRotateFrags)
  }
)(focusedShapes)

const shapeMenuOverlayFrags = select(
  selectedShapes => makeShapeMenuOverlayFrags(store.commit)(selectedShapes)
)(selectedShapes)

const freeShapeFrags = select(
  shapes => makeShapeFrags(shapes, null, null, false)
)(currentFreeShapes)

const dragLineFrag = select(
  (cursor, dragStartAt) => {
    const origin = dragStartAt.down ? dragStartAt : cursor
    const lineAttribs = positionsToLineAttribs(origin.x, origin.y, cursor.x, cursor.y)
    return makeDragLineFrag(lineAttribs.length, origin.x, origin.y, lineAttribs.angle)
  }
)(cursorPosition, dragStartAt)

const scenegraph = select(
  makeSubstrateFrag(store.commit)
)(shapeFrags, shapeRotateFrags, shapeCornerFrags, shapeEdgeFrags, shapeCenterFrags, shapeMenuOverlayFrags, freeShapeFrags,
  metaCursorFrag, dragLineFrag)

const updateScene = select(
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