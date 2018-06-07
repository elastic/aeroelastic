/**
 * PoC action dispatch
 */

const makeUid = () => 1e11 + Math.floor((1e12 - 1e11) * Math.random());

const shallowEqual = (a, b) => {
  return false
  if(a === b) return true
  if(a.length !== b.length) return false
  for(let i = 0; i < a.length; i++) {
    if(a[i] !== b[i]) return false
  }
  return true
}

const selectReduce = (fun, previousValue, mapFun = d => d, logFun) => (...inputs) => {
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
    return mapFun(value)
  }
}

const select = (fun, logFun) => (...inputs) => {
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

const createStore = (initialState, onChangeCallback = () => {}) => {
  let currentState = initialState
  let updater = state => state // default: no side effect
  const getCurrentState = () => currentState
  const setCurrentState = newState => currentState = newState
  const setUpdater = updaterFunction => updater = updaterFunction

  const commit = (type, payload, callback = () => {}) => {
    currentState = updater({...currentState, primaryUpdate: {type, payload: {...payload, uid: makeUid()}}})
    callback(currentState)
    onChangeCallback({ type, state: currentState })
  }

  const dispatch = (type, payload) => setTimeout(() => commit(type, payload))

  return {getCurrentState, setCurrentState, setUpdater, commit, dispatch}
}

module.exports = {
  createStore,
  select,
  selectReduce
}