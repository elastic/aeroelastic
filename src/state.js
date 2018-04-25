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

const reduce = (fun, previousValue, logFun) => (...inputs) => {
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
    value = fun(prevValue, ...argumentValues)
    if(logFun) logFun(value, argumentValues)
    return value
  }
}

const map = (fun, logFun) => (...inputs) => {
  // last-value memoizing version of this single line function:
  // fun => (...inputs) => state => fun(...inputs.map(input => input(state)))
  let argumentValues = []
  let value
  return state => {
    if(shallowEqual(argumentValues, argumentValues = inputs.map(input => input(state)))) {
      return value
    }
    value = fun(...argumentValues)
    if(logFun) logFun(value, argumentValues)
    return value
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