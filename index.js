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

  const metaCursorRadius = 10
  const metaCursorZ = 1000
  const dragLineZ = metaCursorZ - 1 // just below the metaCursor
  const dragLineColor = 'rgba(255,0,255,0.5)'
  const metaCursorSalientColor = 'magenta'

  const dispatch = (action, payload) => {

    window.setTimeout(() => {
      //db[action].push(payload)
      xl.put(transactions, [{action, payload}])
    }, 0)


    //ender(db, Infinity)
  }

  /**
   * Fragment makers (pure)
   */

  const renderShapeFrags = (shapes, dragStartShape, hoveredShape) => shapes.map(s => {
    return h('div', {
      className: s.shape,
      style: {
        width: s.shape === 'line' ? 0 : s.width,
        height: s.shape === 'line' ? s.length : s.height,
        transform: `translate3d(${s.x}px, ${s.y}px, ${s.z}px) rotateZ(${s.rotation}deg)`,
        backgroundColor: s.backgroundColor,
        border: s === dragStartShape ? '2px solid magenta' : null,
        opacity: s === hoveredShape ? 1 : 0.8
      }
    })
  })

  const renderShapeFrags2 = (shapes, hoveredShape) => shapes.map(s => {
    const frag =  h('div', {
      className: s.shape,
      style: {
        width: s.shape === 'line' ? 0 : s.width,
        height: s.shape === 'line' ? s.length : s.height,
        transform: `translate3d(${s.x}px, ${s.y}px, ${s.z}px) rotateZ(${s.rotation}deg)`,
        backgroundColor: s.backgroundColor,
        border: s === false /*dragStartShape*/ ? '2px solid magenta' : null,
        opacity: s.key === (hoveredShape && hoveredShape.key) ? 1 : 0.5
      }
    })
    return frag
  })

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

  const renderDragLineFrags = (shapeDragInProcess, dragLineLength, dragLineX0, dragLineY0, angle) => shapeDragInProcess ? [h('div', {
      className: 'line',
      style: {
        width: Math.max(0, dragLineLength - metaCursorRadius),
        height: 0,
        opacity: shapeDragInProcess ? 1 : 0,
        transform: `translate3d(${dragLineX0}px, ${dragLineY0}px, ${dragLineZ}px) rotateZ(${angle}deg)`,
        border: `1px solid ${dragLineColor}`,
        boxShadow: `0 0 1px 0 white inset, 0 0 1px 0 white`,
      }
    })]
    : []

  const renderSubstrateFrag = (transactions, shapeFrags, metaCursorFrag, dragLineFrags) => {

    const updateMetaCursor = event => dispatch('cursorPosition', {id: getId(), time: getTime(), x: event.clientX, y: event.clientY})
    const mouseUp = event => dispatch('mouseEvent', {id: getId(), time: getTime(), event: 'mouseUp', x: event.clientX, y: event.clientY})
    const mouseDown = event => dispatch('mouseEvent', {id: getId(), time: getTime(), event: 'mouseDown', x: event.clientX, y: event.clientY})

    return h('div', {
        id: 'root',
        onMouseMove: updateMetaCursor,
        onMouseUp: mouseUp,
        onMouseDown: mouseDown,
      },
      shapeFrags.concat([metaCursorFrag, ...dragLineFrags])
    )
  }

  const renderSubstrateFrag2 = (shapeFrags, metaCursorFrag, dragLineFrags/*transactions, shapeFrags, metaCursorFrag, dragLineFrags*/) => {

    const updateMetaCursor = event => {
      const x = event.clientX
      const y = event.clientY
      dispatch('cursorPosition', {id: getId(), time: getTime(), x, y})

    }
    const mouseUp = event => dispatch('mouseEvent', {id: getId(), time: getTime(), event: 'mouseUp', x: event.clientX, y: event.clientY})
    const mouseDown = event => dispatch('mouseEvent', {id: getId(), time: getTime(), event: 'mouseDown', x: event.clientX, y: event.clientY})


    return h('div', {
        id: 'root',
        onMouseMove: updateMetaCursor,
        onMouseUp: mouseUp,
        onMouseDown: mouseDown,
      },
      //shapeFrags
     shapeFrags.concat([metaCursorFrag, ...dragLineFrags])
    )
  }

  /**
   * Database
   */

  const db = {

    // tables
    shapes: [
      {key: 'aRect', id: getId(), time: getTime(), shape: 'rectangle', x: 500, y: 200, rotation: 0, width: 150, height: 100, z: 10, backgroundColor: 'blue'},
      {key: 'bRect', id: getId(), time: getTime(), shape: 'rectangle', x: 600, y: 250, rotation: 0, width: 150, height: 100, z: 0, backgroundColor: 'green'},
    ],
    cursorPosition: [{id: getId(), time: getTime(), x: -metaCursorRadius, y: -metaCursorRadius}],
    mouseEvents: [{id: getId(), time: getTime(), event: 'mouseUp'}],
  }

  //const originalShapes = xl.lift(transactions => transactions.filter(t => t.action === 'shape').map(t => t.payload))(transactions)
  const cursorPositions = xl.lift(transactions => {
    const result = transactions.filter(t => t.action === 'cursorPosition').map(t => t.payload)
    return result
  })(transactions)
  const mouseEvents = xl.lift(transactions => transactions.filter(t => t.action === 'mouseEvent').map(t => t.payload))(transactions)


  /**
   * Pure functions
   */

  const dragStartAtOld = (events, tid) => {
    let dragStartEvent = null
    for(let i = 0; i < events.length; i++) {
      const e = events[i]
      if(e.id > tid) break
      if(e.event === 'mouseUp') {
        dragStartEvent = null
      }
      if(e.event === 'mouseDown' && e.onShape) {
        dragStartEvent = e
      }
    }
    return dragStartEvent
  }

  const cursorPositionAt = (positions, tid) => {
    let result
    for(let i = positions.length - 1; i >= 0; i--) {
      const p = positions[i]
      result = p
      if(p.id < tid)
        break
    }
    return result
  }

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

  const shapesAt = (shapes, tid) => {
    const shapesMap = {}
    shapes.forEach(s => shapesMap[s.key] = shapesMap[s.key] && s.id <= tid ? shapesMap[s.key].concat(s) : [s])
    return Object.values(shapesMap).map(a => a[a.length - 1])
  }

  const hoveredAt = (shapes, x, y, tid) => {
    const hoveredShapes = shapesAtPoint(shapes, x, y, tid - 1)
    return topShape(hoveredShapes)
  }

  const mouseDownAt = (transactions, tid) => {
    const events = transactions.mouseEvents
    for(let i = events.length - 1; i >= 0; i--) {
      const e = events[i]
      if(e.id > tid) continue
      if(e.event === 'mouseDown') return e
      if(e.event === 'mouseUp') return false
    }
    return false
  }

  /**
   * What is it?
   */

  const render = (transactions, tid) => {

    const cursor = cursorPositionAt(transactions.cursorPositions, tid)
    const shapes = shapesAt(transactions.shapes, tid - 1)
    const hoveredShape = hoveredAt(shapes, cursor.x, cursor.y, tid)

    const dragStartEvent = true /*dragStartAt(db.mouseEvents, tid)*/

    const dragStartShape = null /*dragStartEvent && dragStartEvent.onShape*/
    const currentShapes = transactions.shapes/*currentPreDragShapes*/.map(s => {
      return s === /*dragStartShape*/ false ? Object.assign({}, s, {x: s.x + lineAttribs.deltaX, y: s.y + lineAttribs.deltaY}) : s
    })

    const mouseDownEvent = mouseDownAt(transactions, tid)


    const dragLineOriginX = mouseDownEvent && mouseDownEvent.x
    const dragLineOriginY = mouseDownEvent && mouseDownEvent.y
    const lineAttribs = positionsToLineAttribsViewer(dragLineOriginX, dragLineOriginY, cursor.x, cursor.y)

    const dragInProcess = mouseDownEvent
    const shapeDragInProcess = dragStartEvent && dragInProcess
    const metaCursorSaliency = false /*shapeDragInProcess*/
    const metaCursorColor = metaCursorSaliency ? metaCursorSalientColor : 'lightgrey'
    const metaCursorThickness = hoveredShape ? 3 : 1

    // rendering
    const shapeFrags = renderShapeFrags(currentShapes, dragStartShape, hoveredShape)
    const metaCursorFrag = renderMetaCursorFrag(cursor.x, cursor.y, shapeDragInProcess, metaCursorThickness, metaCursorColor)
    const dragLineFrags = renderDragLineFrags(shapeDragInProcess, lineAttribs.length, dragLineOriginX, dragLineOriginY, lineAttribs.angle)
    const substrateFrag = renderSubstrateFrag(transactions, shapeFrags, metaCursorFrag, dragLineFrags)
    ReactDOM.render(substrateFrag, root)
  }

  //render(db, Infinity)

  db.shapes.forEach(s => xl.put(transactions, [{action: 'shape', payload: s}]))

  const substrate = xl.cell('Frag Substrate')
  const shapePrimer = xl.cell('Shape primer')

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

  const dragGestures = xl.lift(({down, x0, y0}, cursor) => {
    const result = {down, x0, y0, x1: cursor.x, y1: cursor.y}
    return result
  })(dragGestureStartAt, cursorPosition)

  const currentShapes = xl.lift(d => d)(shapePrimer)

  const hoveredShape = xl.lift((shapes, cursor) => {
    return hoveredAt(shapes, cursor.x, cursor.y, Infinity)
  })(currentShapes, cursorPosition)

  const dragStartAt = xl.lift(function({down, x0, y0, x1, y1}, hoveredShape) {
    const previous = this.value || {down: false}
    // the cursor must be over the shape at the _start_ of the gesture (x0 === x1 && y0 === y1 good enough) when downing the mouse
    const result = down ? (!previous.down && hoveredShape && x0 === x1 && y0 === y1 ? {down, x: x1, y: y1, draggedShape: hoveredShape} : previous) : {down: false}
    return result
  })(dragGestures, hoveredShape)

  const metaCursorFrag = xl.lift(function(cursor, mouseDown) {
    const thickness = mouseDown ? 3 : 1
    const frag = renderMetaCursorFrag(cursor.x, cursor.y, false, thickness, 'red')
    return frag
  })(cursorPosition, mouseDown)

  const shapeFrags = xl.lift((currentShapes, hoveredShape) => {
    return renderShapeFrags2(currentShapes, hoveredShape)
  })(currentShapes, hoveredShape)

  const dragLineFrags = xl.lift((cursor, lastMouseDownAt) => {
    const shapeDragInProcess = true
    const origin = lastMouseDownAt.down ? lastMouseDownAt : cursor
    const lineAttribs = positionsToLineAttribsViewer(origin.x, origin.y, cursor.x, cursor.y)
    const frags = renderDragLineFrags(shapeDragInProcess, lineAttribs.length, origin.x, origin.y, lineAttribs.angle)
    return frags
  })(cursorPosition, dragStartAt)

  const scenegraph = xl.lift((substrate, shapeFrags, metaCursorFrag, dragLineFrags) => renderSubstrateFrag2(shapeFrags, metaCursorFrag, dragLineFrags))(substrate, shapeFrags, metaCursorFrag, dragLineFrags)



  // final render
  const finalRender = xl.lift(frag => ReactDOM.render(frag, root))(scenegraph)

  xl.put(substrate, null)
  xl.put(shapePrimer, db.shapes)


/*
  let currentTid = 0
  if(0)
    window.setTimeout(() => {
      window.setInterval(() => render(db, currentTid++), 16)
    }, 5000)
*/

})()