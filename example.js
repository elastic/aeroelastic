const {
        createStore,
        select
      } = require('./src/state')

const {
        renderIntoRoot,
        makeShapeFrags,
        makeShapeCornerFrags,
        makeShapeParallelFrags,
        makeSubstrateFrag
      } = require('./example/mockDomFragments')

const initialState = require('./example/mockScene')

const store = createStore(initialState)

const {map} = require('./src/functional')

const {
        dragStartAt,
        nextScene, focusedShape,
        primaryUpdate,
        focusedShapes, shapeEdgeMarkers, shapeCenterMarkers, hoveredEdgeMarker
      } = require('./src/layout')


/**
 * Update fragments
 */

const shapeFrags = select(
  ({shapes}, hoveredShape, dragStartAt) => makeShapeFrags(shapes, hoveredShape, dragStartAt)
)(nextScene, focusedShape, dragStartAt)

const shapeCornerFrags = select(
  map(makeShapeCornerFrags)
)(focusedShapes, dragStartAt)

const shapeEdgeFrags = select(
  (markers, hoveredMarker) => markers.map(marker => makeShapeParallelFrags(marker, hoveredMarker && hoveredMarker.key === marker.key))
)(shapeEdgeMarkers, hoveredEdgeMarker)

const shapeCenterFrags = select(
  map(makeShapeParallelFrags)
)(shapeCenterMarkers)

const scenegraph = select(
  makeSubstrateFrag(store.commit)
)(shapeFrags, shapeCornerFrags, shapeEdgeFrags, shapeCenterFrags)

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