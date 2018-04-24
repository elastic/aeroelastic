/**
 * PoC action dispatch
 */

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
  // (fun, previousValue) => (...inputs) => state => previousValue = fun(previousValue, ...inputs.map(input => input(state)))
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
  // fun => (...inputs) => state => fun(...inputs.map(input => input(state)))
  let argumentValues = []
  let value
  return state => {
    if(shallowEqual(argumentValues, argumentValues = inputs.map(input => input(state)))) {
      return value
    }
    return value = fun(...argumentValues)
  }
}

const createStore = initialState => {
  let currentState = initialState
  let updateScene = state => state // default: no side effect
  const getCurrentState = () => currentState
  const setCurrentState = newState => currentState = newState
  const setUpdater = updaterFunction => updateScene = updaterFunction

  const commit = (actionType, payload) => {
    currentState = updateScene({...currentState, primaryUpdate: {actionType, payload}})
  }

  const dispatch = (actionType, payload) => setTimeout(() => commit(actionType, payload))

  return {getCurrentState, setCurrentState, setUpdater, commit, dispatch}
}

module.exports = {
  createStore,
  map,
  reduce
}