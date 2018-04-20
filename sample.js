const reactRenderDOM = ReactDOM.render
const h = React.createElement

const width = 250
const height = 180

const shapeIsAtPoint = (shape, x, y) => shape.x <= x && x <= shape.x + width && shape.y <= y && y < shape.y + height
const dragInProgress = (shape, hoveredShape, down) => down && shape.beingDragged && !!hoveredShape

const each = eachFun => (...inputs) => state => {eachFun(...inputs.map(input => input(state)))}
const map = mapFun => (...inputs) => state => mapFun(...inputs.map(input => input(state)))
const reduce = (reducerFun, previousValue) => (...inputs) => state => previousValue = reducerFun(previousValue, ...inputs.map(input => input(state)))

const getState = state => state

const cursorPositions = map(
  actions => actions.filter(action => action.actionType === 'cursorPosition').map(action => action.payload)
)(getState)

const mouseEvents = map(
  actions => actions.filter(action => action.actionType === 'mouseEvent').map(action => action.payload)
)(getState)

const cursorPosition = reduce(
  (previous, positionList) => positionList.length ? positionList[0] : previous,
  {x: 0, y: 0}
)(cursorPositions)

const mouseIsDown = reduce(
  (previous, eventList) => eventList.length ? eventList[0].event === 'mouseDown' : previous,
  false
)(mouseEvents)

const dragGestureStartAt = reduce(
  (previous, down, {x, y}) =>
    down
      ? (previous.down ? previous : {down, x0: x, y0: y})
      : {down: false},
  {down: false}
)(mouseIsDown, cursorPosition)

const dragGestures = map(
  ({down, x0, y0}, cursor) => ({down, x0, y0, x1: cursor.x, y1: cursor.y})
)(dragGestureStartAt, cursorPosition)

const isDragStartCandidate = map(
  ({down, x0, y0, x1, y1}) => down && x0 === x1 && y0 === y1
)(dragGestures)

const currentShape = reduce(
  (previous, cursor, isDragStartCandidate, {x0, y0, x1, y1, down}) => {
    const shapeIsHovered = shapeIsAtPoint(previous, cursor.x, cursor.y)
    const dragIsInProgress = dragInProgress(previous, shapeIsHovered, down)
    const beingDragged = down && previous.beingDragged || !dragIsInProgress && shapeIsHovered && previous.key === shapeIsHovered.key && down && isDragStartCandidate
    const grabStart = !previous.beingDragged && beingDragged
    const grabOffsetX = grabStart ? previous.x - x0 : (previous.grabOffsetX || 0)
    const grabOffsetY = grabStart ? previous.y - y0 : (previous.grabOffsetY || 0)
    const x = beingDragged ? x1 + grabOffsetX : previous.x
    const y = beingDragged ? y1 + grabOffsetY : previous.y
    return {x, y, beingDragged, grabOffsetX, grabOffsetY}},
  {x: 300, y: 200}
)(cursorPosition, isDragStartCandidate, dragGestures)

const scenegraph = map(
  shape => h('div', {id: 'root',
      onMouseMove: e => dispatch('cursorPosition', {x: e.clientX, y: e.clientY}),
      onMouseUp: e => dispatch('mouseEvent', {event: 'mouseUp', x: e.clientX, y: e.clientY}),
      onMouseDown: e => dispatch('mouseEvent', {event: 'mouseDown', x: e.clientX, y: e.clientY})
    },
    h('div', {style: {transform: `translate(${shape.x}px, ${shape.y}px)`}}))
)(currentShape)

const render = each(
  function(frag) {reactRenderDOM(frag, document.body)}
)(scenegraph)

const dispatch = (actionType, payload) => render([{actionType, payload}])

render([])