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

const matrix = require('./src/matrix')

/**
 * Update fragments
 */

const shapeFrags = select(
  ({shapes}, hoveredShape, selectedShapes) => makeShapeFrags(shapes, hoveredShape, selectedShapes)
)(nextScene, focusedShape, selectedShapes)

const scenegraph = select(
  makeSubstrateFrag(store.commit)
)(shapeFrags)

const rand128 = () => 128 + Math.floor(128 * Math.random())

let count = 10
window.setInterval(() => {
  const newShape = {key: 'newRect_' + count,
    type: 'rectangle', localTransformMatrix: matrix.multiply(
      matrix.translate(2 * rand128() - 256, 2 * rand128() - 256, 4 * rand128() - 768),
      matrix.rotateX(Math.random() * 2 * Math.PI),
      matrix.rotateY(Math.random() * 2 * Math.PI),
      matrix.rotateZ(Math.random() * 2 * Math.PI)
    ),
    transformMatrix: matrix.translate(425, 290, 5), a: rand128(), b: rand128(),
    backgroundColor: `rgba(${rand128()},${rand128()},${rand128()}, 1)`,
    parent: 'rect1'}
  if(count-- > 0)
    store.commit('shapeAddEvent', newShape/*{event: 'add', code, uid: makeUid()}*/)
}, 100)

const updateScene = select(
  (nextScene, primaryUpdate, frag) => {

    // perform side effects: rendering, and possibly, asynchronously dispatching arising events
    renderIntoRoot(frag)
    // yield the new state
    return {
      shapeAdditions: nextScene.shapes,
      //primaryUpdate,
      currentScene: nextScene
    }
  }
)(nextScene, primaryUpdate, scenegraph)

store.setUpdater(updateScene)

// set the initial scene
store.setCurrentState(updateScene(store.getCurrentState()))