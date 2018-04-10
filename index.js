(() => {

  /**
   * Crosslink seeds
   */

  const xl = crosslink

  const transactions = xl.cell("Transactions")

  /**
   * Constants and utilities
   */

  let currentId = 0
  const getId = () => currentId++
  const getTime = () => performance.now()
  const h = React.createElement
  const root = document.body

  const metaCursorRadius = 15
  const metaCursorZ = 1000
  const dragLineZ = metaCursorZ - 1 // just below the metaCursor
  const dragLineColor = 'rgba(255,0,255,0.5)'
  const metaCursorSalientColor = 'magenta'

  const dispatch = (action, payload) => {
    window.setTimeout(() => {
      xl.put(transactions, [{action, payload}])
    }, 0)
  }

  /**
   * Fragment makers (pure)
   */

  const renderShapeFrags = (shapes, hoveredShape, dragStartAt) => shapes.map(s => h('div', {
    className: s.shape,
    style: {
      width: s.shape === 'line' ? 0 : s.width,
      height: s.shape === 'line' ? s.length : s.height,
      transform: `translate3d(${s.x}px, ${s.y}px, ${s.z}px) rotateZ(${s.rotation}deg)`,
      backgroundColor: s.backgroundColor,
      border: s.key === (dragStartAt && dragStartAt.dragStartShape && dragStartAt.dragStartShape.key) ? '2px solid magenta' : null,
      opacity: s.key === (hoveredShape && hoveredShape.key) ? 1 : 0.5
    }
  }))

  const renderMetaCursorFrag = (x, y, shapeDragInProcess, metaCursorThickness, metaCursorColor) => h('div', {
    className: 'circle metaCursor',
    style: {
      width: metaCursorRadius * 2,
      height: metaCursorRadius * 2,
      transform: `translate3d(${x - metaCursorRadius}px, ${y - metaCursorRadius}px, ${metaCursorZ}px)`,
      border: `${metaCursorThickness}px solid ${metaCursorColor}`,
      backgroundColor: shapeDragInProcess ? metaCursorSalientColor : null,
      boxShadow: `0 0 0.5px 0 ${metaCursorColor} inset, 0 0 2px 0 white`,
    }
  })

  const renderDragLineFrag = (dragLineLength, dragLineX0, dragLineY0, angle) => h('div', {
    className: 'line',
    style: {
      width: Math.max(0, dragLineLength - metaCursorRadius),
      height: 0,
      transform: `translate3d(${dragLineX0}px, ${dragLineY0}px, ${dragLineZ}px) rotateZ(${angle}deg)`,
      border: `1px solid ${dragLineColor}`,
      boxShadow: `0 0 1px 0 white inset, 0 0 1px 0 white`,
    }
  })

  const renderSubstrateFrag = (shapeFrags, metaCursorFrag, dragLineFrag) => {

    const updateMetaCursor = event => dispatch('cursorPosition', {id: getId(), time: getTime(), x: event.clientX, y: event.clientY})
    const mouseUp = event => dispatch('mouseEvent', {id: getId(), time: getTime(), event: 'mouseUp', x: event.clientX, y: event.clientY})
    const mouseDown = event => dispatch('mouseEvent', {id: getId(), time: getTime(), event: 'mouseDown', x: event.clientX, y: event.clientY})

    return h('div', {
        id: 'root',
        onMouseMove: updateMetaCursor,
        onMouseUp: mouseUp,
        onMouseDown: mouseDown,
      },
      shapeFrags.concat([metaCursorFrag, dragLineFrag])
    )
  }

  /**
   * Pure functions
   */

  // map x0, y0, x1, y1 to deltas, length and angle
  const positionsToLineAttribsViewer = (x0, y0, x1, y1) => {

    const deltaX = x1 - x0
    const deltaY = y1 - y0
    const length = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2))
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI

    return {length, angle, deltaX, deltaY}
  }

  // set of shapes under a specific point
  const shapesAtPoint = (shapes, x, y, tid) => shapes.filter(s => s.shape === 'rectangle' && s.x <= x && x <= s.x + s.width && s.y <= y && y < s.y + s.height && s.id <= tid)

  // pick top shape out of possibly several shapes (presumably under the same point)
  const topShape = shapes => shapes.reduce((prev, next) => {
    return prev ? (next.z >= prev.z ? next : prev) : next
  }, null)

  const hoveredAt = (shapes, x, y, tid) => {
    const hoveredShapes = shapesAtPoint(shapes, x, y, tid - 1)
    return topShape(hoveredShapes)
  }


  /**
   * Priming
   */

  const cursorPositions = xl.lift(transactions => {
    const result = transactions.filter(t => t.action === 'cursorPosition').map(t => t.payload)
    return result
  })(transactions)
  const mouseEvents = xl.lift(transactions => transactions.filter(t => t.action === 'mouseEvent').map(t => t.payload))(transactions)

  const initialShapes = [
    {key: 'aRect', id: getId(), time: getTime(), shape: 'rectangle', x: 500, y: 200, rotation: 0, width: 250, height: 180, z: 5, backgroundColor: '#b3e2cd'},
    {key: 'bRect', id: getId(), time: getTime(), shape: 'rectangle', x: 600, y: 350, rotation: 0, width: 300, height: 220, z: 6, backgroundColor: '#fdcdac'},
    {key: 'cRect', id: getId(), time: getTime(), shape: 'rectangle', x: 800, y: 250, rotation: 0, width: 200, height: 150, z: 7, backgroundColor: '#cbd5e8'},
    {key: 'dRect', id: getId(), time: getTime(), shape: 'rectangle', x: 300, y: 250, rotation: 0, width: 150, height: 190, z: 8, backgroundColor: '#f4cae4'},
    {key: 'eRect', id: getId(), time: getTime(), shape: 'rectangle', x: 700, y: 100, rotation: 0, width: 325, height: 200, z: 9, backgroundColor: '#e6f5c9'},
  ]

  initialShapes.forEach(s => xl.put(transactions, [{action: 'shape', payload: s}]))

  const substrate = xl.cell('Frag Substrate')
  const primedShapes = xl.cell('Shape primer')

  const cursorPosition = xl.lift(function(positionList) {
    const result = positionList.length ? positionList[positionList.length - 1] : this && this.value || {x: 0, y: 0}
    return result
  })(cursorPositions)

  const mouseDown = xl.lift(function(eventList) {
    const previous = this && this.value || false
    for(let i = eventList.length - 1; i >= 0; i < eventList) {
      const type = eventList[i].event
      if(type === 'mouseUp') return false
      if(type === 'mouseDown') return true
    }
    return previous
  })(mouseEvents)

  const dragGestureStartAt = xl.lift(function(down, {x, y}) {
    const previous = this.value || {down: false}
    const result = down ? (!previous.down ? {down, x0: x, y0: y} : previous) : {down: false}
    return result
  })(mouseDown, cursorPosition)



  /**
   * Start of interesting things
   */

  const dragGestures = xl.lift(({down, x0, y0}, cursor) => {
    return {down, x0, y0, x1: cursor.x, y1: cursor.y}
  })(dragGestureStartAt, cursorPosition)

  const dragStartCandidate = xl.lift(({down, x0, y0, x1, y1}) => {
    // the cursor must be over the shape at the _start_ of the gesture (x0 === x1 && y0 === y1 good enough) when downing the mouse
    return down && x0 === x1 && y0 === y1
  })(dragGestures)



  const currentShapes = xl.lift(function (primedShapes, cursor, dragStartCandidate, {x0, y0, x1, y1, down}) {
    const previousShapeState = this.value || primedShapes
    const hoveredShape = hoveredAt(previousShapeState, cursor.x, cursor.y, Infinity)
    const dragInProgress = previousShapeState.reduce((prev, next) => prev || next.beingDragged, false)
    return previousShapeState.map(s => {
      const {x, y} = s
      const beingDragged = down && s.beingDragged || !dragInProgress && hoveredShape && s.key === hoveredShape.key && down && dragStartCandidate
      const grabStart = !s.beingDragged && beingDragged
      const grabOffsetX = grabStart ? x - x0 : (s.grabOffsetX || 0)
      const grabOffsetY = grabStart ? y - y0 : (s.grabOffsetY || 0)
      return Object.assign({}, s, {x: beingDragged ? x1 + grabOffsetX: x, y: beingDragged ? y1 + grabOffsetY : y, beingDragged, grabOffsetX, grabOffsetY})
    })
  })(primedShapes, cursorPosition, dragStartCandidate, dragGestures)



  const hoveredShape = xl.lift((shapes, cursor) => {
    return hoveredAt(shapes, cursor.x, cursor.y, Infinity)
  })(currentShapes, cursorPosition)

  const dragStartAt = xl.lift(function(dragStartCandidate, {down, x0, y0, x1, y1}, hoveredShape) {
    const previous = this.value || {down: false}
    // the cursor must be over the shape at the _start_ of the gesture (x0 === x1 && y0 === y1 good enough) when downing the mouse
    const result = down ? (!previous.down && dragStartCandidate && hoveredShape ? {down, x: x1, y: y1, dragStartShape: hoveredShape} : previous) : {down: false}
    return result
  })(dragStartCandidate, dragGestures, hoveredShape)


  /**
   * End of interesting things
   */



  const metaCursorFrag = xl.lift(function(cursor, mouseDown, dragStartAt) {
    const thickness = mouseDown ? 5 : 1
    const frag = renderMetaCursorFrag(cursor.x, cursor.y, dragStartAt && dragStartAt.dragStartShape, thickness, 'magenta')
    return frag
  })(cursorPosition, mouseDown, dragStartAt)

  const shapeFrags = xl.lift((currentShapes, hoveredShape, dragStartAt) => {
    return renderShapeFrags(currentShapes, hoveredShape, dragStartAt)
  })(currentShapes, hoveredShape, dragStartAt)

  const dragLineFrag = xl.lift((cursor, lastMouseDownAt) => {
    const origin = lastMouseDownAt.down ? lastMouseDownAt : cursor
    const lineAttribs = positionsToLineAttribsViewer(origin.x, origin.y, cursor.x, cursor.y)
    const frags = renderDragLineFrag(lineAttribs.length, origin.x, origin.y, lineAttribs.angle)
    return frags
  })(cursorPosition, dragStartAt)

  const scenegraph = xl.lift((substrate, shapeFrags, metaCursorFrag, dragLineFrag) => renderSubstrateFrag(shapeFrags, metaCursorFrag, dragLineFrag))(substrate, shapeFrags, metaCursorFrag, dragLineFrag)

  /**
   *  Final render
   */

  xl.lift(frag => ReactDOM.render(frag, root))(scenegraph)

  /**
   *  Setting initial state
   */

  xl.put(substrate, null)
  xl.put(primedShapes, initialShapes)

})()