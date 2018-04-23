const mockAssets = require('./mockAssets')

const initialShapes = [
  {key: 'line1', type: 'line', x: 200, y: 150, width: 1400, height: 0, z: 5, rotation: 0, color: 'grey'},
  {key: 'line2', type: 'line', x: 200, y: 650, width: 1400, height: 0, z: 5, rotation: 0, color: 'grey'},
  {key: 'line3', type: 'line', x: 80,  y: 100, width: 0, height: 900, z: 5, rotation: 0, color: 'grey'},
  {key: 'line4', type: 'line', x: 700, y: 100, width: 0, height: 900, z: 5, rotation: 0, color: 'grey'},
  {key: 'rect1', type: 'rectangle', x: 300, y: 200, rotation: 0, width: 250, height: 180, z: 5, backgroundColor: '#b3e2cd', backgroundImage: mockAssets.pattern1},
  {key: 'rect2', type: 'rectangle', x: 600, y: 350, rotation: 0, width: 300, height: 220, z: 6, backgroundColor: '#fdcdac', backgroundImage: mockAssets.pattern2},
  {key: 'rect3', type: 'rectangle', x: 800, y: 250, rotation: 0, width: 200, height: 150, z: 7, backgroundColor: '#cbd5e8'},
  {key: 'rect4', type: 'rectangle', x: 100, y: 250, rotation: 0, width: 250, height: 150, z: 8, backgroundColor: '#f4cae4'},
  {key: 'rect5', type: 'rectangle', x: 900, y: 100, rotation: 0, width: 325, height: 200, z: 9, backgroundColor: '#e6f5c9', backgroundImage: mockAssets.pattern3},
]

const initialState = {
  shapeAdditions: initialShapes,
  primaryActions: null,
  currentScene: {shapes: initialShapes}
}

// in this PoC it's a singleton; todo turn it into a factory
let currentState = initialState
const getCurrentState = () => currentState
const setCurrentState = newState => currentState = newState

/**
 * PoC action dispatch
 */

const commit = (actionType, payload) => {
  currentState = updateScene({...currentState, primaryActions: {actionType, payload}})
  //console.log(currentState.currentScene.shapes[4])
}

const dispatch = (actionType, payload) => setTimeout(() => commit(actionType, payload))

let renderScene

const shallowEqual = (a, b) => {
  if(a === b) return true
  if(a.length !== b.length) return false
  for(let i = 0; i < a.length; i++) {
    if(a[i] !== b[i]) return false
  }
  return true
}

const reduce = (fun, previousValue) => (...inputs) => {
  // last-value memoizing version of this single line function:
  // const reduce = (fun, previousValue) => (...inputs) => state => previousValue = fun(previousValue, ...inputs.map(input => input(state)))
  let argumentValues = []
  let value = previousValue
  let prevValue = previousValue
  return state => {
    if(shallowEqual(argumentValues, argumentValues = inputs.map(input => input(state))) && value === prevValue) {
      return value
    }
    prevValue = value
    return value = fun(prevValue, ...argumentValues)
  }
}

const map = fun => (...inputs) => {
  // last-value memoizing version of this single line function:
  // const map = fun => (...inputs) => state => fun(...inputs.map(input => input(state)))
  let argumentValues = []
  let value
  return state => {
    if(shallowEqual(argumentValues, argumentValues = inputs.map(input => input(state)))) {
      return value
    }
    return value = fun(...argumentValues)
  }
}

module.exports = {
  getCurrentState,
  setCurrentState,
  commit,
  dispatch,
  map,
  reduce
}