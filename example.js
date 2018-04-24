const {
        createStore,
        map
      } = require('./src/state')

const {
        rootRender,
        renderShapeFrags,
        renderMetaCursorFrag,
        renderDragLineFrag,
        renderSubstrateFrag
      } = require('./example/mockDomFragments')

const {devColor} = require('./example/mockConfig')

const initialState = require('./example/mockScene')

const store = createStore(initialState)

const {
        cursorPosition, mouseIsDown, dragStartAt,
        nextScene, focusedShape, selectedShape, currentFreeShapes,
        shapeAdditions, primaryUpdate, newShapeEvent
      } = require('./src/layout')


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
    return renderMetaCursorFrag(cursor.x, cursor.y, dragStartAt && dragStartAt.dragStartShape, thickness, devColor)
  }
)(cursorPosition, mouseIsDown, dragStartAt)

const shapeFrags = map(
  ({shapes}, hoveredShape, dragStartAt, selectedShapeKey) =>
    renderShapeFrags(store.commit)(shapes, hoveredShape, dragStartAt, selectedShapeKey)
)(nextScene, focusedShape, dragStartAt, selectedShape)

const freeShapeFrags = map(
  shapes => renderShapeFrags(store.commit)(shapes, null, null, false)
)(currentFreeShapes)

const dragLineFrag = map(
  (cursor, dragStartAt) => {
    const origin = dragStartAt.down ? dragStartAt : cursor
    const lineAttribs = positionsToLineAttribs(origin.x, origin.y, cursor.x, cursor.y)
    return renderDragLineFrag(lineAttribs.length, origin.x, origin.y, lineAttribs.angle)
  }
)(cursorPosition, dragStartAt)

const scenegraph = map(
  renderSubstrateFrag(store.commit)
)(shapeFrags, freeShapeFrags, metaCursorFrag, dragLineFrag)

const updateScene = map(
  (nextScene, shapeAdditions, primaryUpdate, frag, newShapeEvent) => {

    // perform side effects: rendering, and possibly, asynchronously dispatching arising events
    rootRender(frag)
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