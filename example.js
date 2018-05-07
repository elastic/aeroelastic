const {
        createStore,
        select
      } = require('./src/state')

const {
        renderIntoRoot,
        makeShapeFrags,
        makeSubstrateFrag
      } = require('./example/mockDomFragments')

const initialState = require('./example/mockScene')

const store = createStore(initialState)

const {
        dragStartAt,
        nextScene, focusedShape, selectedShapes,
        primaryUpdate
      } = require('./src/layout')


/**
 * Update fragments
 */

const shapeFrags = select(
  ({shapes}, hoveredShape, selectedShapes) => makeShapeFrags(shapes, hoveredShape, selectedShapes)
)(nextScene, focusedShape, selectedShapes)

const scenegraph = select(
  makeSubstrateFrag(store.commit)
)(shapeFrags)

const updateScene = select(
  (nextScene, primaryUpdate, frag) => {

    // perform side effects: rendering, and possibly, asynchronously dispatching arising events
    renderIntoRoot(frag)
    // yield the new state
    return {
      shapeAdditions: nextScene.shapes,
      primaryUpdate,
      currentScene: nextScene
    }
  }
)(nextScene, primaryUpdate, scenegraph)

store.setUpdater(updateScene)

// set the initial scene
store.setCurrentState(updateScene(store.getCurrentState()))