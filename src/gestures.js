const {
        select,
        selectReduce
      } = require('./state')


/**
 * Selectors directly from a state object
 *
 *    (we could turn gesture.js into a factory, with this state root - primaryUpdate - being passed...)
 */

const primaryUpdate = state => state.primaryUpdate


/**
 * Gestures - derived selectors for transient state
 */

// dispatch the various types of actions
const rawCursorPosition = select(
  action => action && action.type === 'cursorPosition' ? action.payload : null
)(primaryUpdate)

const mouseButtonEvent = select(
  action => action && action.type === 'mouseEvent' ? action.payload : null
)(primaryUpdate)

const actionUid = select(
  action => {if(action && !action.payload.uid) debugger;  return action && action.payload.uid}
)(primaryUpdate)

const keyboardEvent = select(
  action => action && action.type === 'keyboardEvent' ? action.payload : null,
)(primaryUpdate)

const pressedKeys = selectReduce(
  (lookup, next) => {
    let result
    if(next) {
      if (next.event === 'keyDown') {
        result = {...lookup, [next.code]: true}
      } else {
        const {[next.code]: ignore, ...rest} = lookup
        result = rest
      }
    } else {
      result ={ ...lookup }
    }
    return result
  },
  {}
)(keyboardEvent)

const keyUp = selectReduce(
  (prev, next) => {
    switch(next && next.event) {
      case 'keyDown': return false
      case 'keyUp': return true
      default: return prev
    }
  },
  true
)(keyboardEvent)

const metaHeld = selectReduce(
  (prev, next) => {
    if(!next || !next.code || next.code.slice(0, 4) !== 'Meta') return prev
    switch(next && next.event) {
      case 'keyDown': return true
      case 'keyUp': return false
      default: return prev
    }
  },
  false
)(keyboardEvent)

const cursorPosition = selectReduce(
  (previous, position) => position || previous,
  {x: 0, y: 0}
)(rawCursorPosition)

const mouseButton = selectReduce(
  (prev, next) => {
    if(!next) return prev
    const {event, uid} = next
    return event === 'mouseDown'
      ? {down: true, uid}
      : (event === 'mouseUp'
        ? {down: false, uid}
        : prev)
  },
  {down: false, uid: null}
  )(mouseButtonEvent)

const mouseIsDown = selectReduce(
  (previous, next) => next
    ? next.event === 'mouseDown'
    : previous,
  false
)(mouseButtonEvent)

const gestureEnd = select((keyUp, mouseIsDown) => keyUp && !mouseIsDown)(keyUp, mouseIsDown)

/**
 * mouseButtonStateTransitions
 *
 *    View: http://stable.ascii-flow.appspot.com/#567671116534197027
 *    Edit: http://stable.ascii-flow.appspot.com/#567671116534197027/776257435
 *
 *
 *                             mouseIsDown
 *        initial state: 'up' +-----------> 'downed'
 *                        ^ ^                 +  +
 *                        | |  !mouseIsDown   |  |
 *           !mouseIsDown | +-----------------+  | mouseIsDown && movedAlready
 *                        |                      |
 *                        +----+ 'dragging' <----+
 *                                +      ^
 *                                |      |
 *                                +------+
 *                               mouseIsDown
 *
 */
const mouseButtonStateTransitions = (state, mouseIsDown, movedAlready) => {
  switch(state) {
    case 'up': return mouseIsDown ? 'downed' : 'up'
    case 'downed': return mouseIsDown ? (movedAlready ? 'dragging' : 'downed') : 'up'
    case 'dragging': return mouseIsDown ? 'dragging' : 'up'
  }
}

const mouseButtonState = selectReduce(
  ({buttonState, downX, downY}, mouseIsDown, {x, y}) => {
    const movedAlready = x !== downX || y !== downY
    const newButtonState = mouseButtonStateTransitions(buttonState, mouseIsDown, movedAlready)
    return {
      buttonState: newButtonState,
      downX: newButtonState === 'downed' ? x : downX,
      downY: newButtonState === 'downed' ? y : downY
    }
  },
  {buttonState: 'up', downX: null, downY: null}
)(mouseIsDown, cursorPosition)

const mouseDowned = select(
  state => state.buttonState === 'downed'
)(mouseButtonState)

const dragging = select(
  state => state.buttonState === 'dragging'
)(mouseButtonState)

const dragVector = select(
  ({buttonState, downX, downY}, {x, y}) => ({down: buttonState !== 'up', x0: downX, y0: downY, x1: x, y1: y})
)(mouseButtonState, cursorPosition)

module.exports = {
  dragging,
  dragVector,
  cursorPosition,
  gestureEnd,
  metaHeld,
  mouseButton,
  mouseDowned,
  mouseIsDown,
  pressedKeys
}