(() => {

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
    transactions[action].push(payload)
    render(transactions)
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

  const renderSubstrateFrag = (transactions, shapeFrags, metaCursorFrag, dragLineFrags, hoveredShape) => {

    const updateMetaCursor = event => dispatch('cursorPositions', {id: getId(), time: getTime(), x: event.clientX, y: event.clientY})
    const mouseUp = event => dispatch('mouseEvents', {id: getId(), time: getTime(), event: 'mouseUp', x: event.clientX, y: event.clientY})
    const mouseDown = event => dispatch('mouseEvents', {id: getId(), time: getTime(), event: 'mouseDown', x: event.clientX, y: event.clientY, onShape: hoveredShape})

    return h('div', {
        id: 'root',
        onMouseMove: updateMetaCursor,
        onMouseUp: mouseUp,
        onMouseDown: mouseDown,
      },
      shapeFrags.concat([metaCursorFrag, ...dragLineFrags])
    )
  }

  /**
   * Database
   */

  const transactions = {
    shapes: [
      {key: 'aRect', id: getId(), time: getTime(), shape: 'rectangle', x: 500, y: 200, rotation: 0, width: 150, height: 100, z: 10, backgroundColor: 'blue'},
      {key: 'bRect', id: getId(), time: getTime(), shape: 'rectangle', x: 600, y: 250, rotation: 0, width: 150, height: 100, z: 0, backgroundColor: 'green'},
    ],
    cursorPositions: [{id: getId(), time: getTime(), x: -metaCursorRadius, y: -metaCursorRadius}],
    mouseEvents: [{id: getId(), time: getTime(), event: 'mouseUp'}]
  }

  /**
   * Pure functions
   */

  const dragStartEventViewer = (events, tid) => {
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

  const positionsToLineAttribsViewer = (dragLineX0, dragLineY0, dragLineX1, dragLineY1) => {

    const deltaX = dragLineX1 - dragLineX0
    const deltaY = dragLineY1 - dragLineY0
    const length = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2))
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI

    return {length, angle, deltaX, deltaY}
  }

  const hoveredShapesAtPoint = (currentShapes, x, y) => currentShapes.filter(s => s.shape === 'rectangle' && s.x <= x && x <= s.x + s.width && s.y <= y && y < s.y + s.height)

  const topShape = shapes => shapes.reduce((prev, next) => {
    return prev ? (next.z >= prev.z ? next : prev) : next
  }, null)


  /**
   * What is it?
   */

  const render = transactions => {

    const cursor = transactions.cursorPositions[transactions.cursorPositions.length - 1]

    const dragStartEvent = dragStartEventViewer(transactions.mouseEvents, Infinity)

    const dragLineOriginX = dragStartEvent && dragStartEvent.x
    const dragLineOriginY = dragStartEvent && dragStartEvent.y
    const lineAttribs = positionsToLineAttribsViewer(dragLineOriginX, dragLineOriginY, cursor.x, cursor.y)

    const dragStartShape = dragStartEvent && dragStartEvent.onShape
    const shapes = {}
    transactions.shapes.forEach(s => shapes[s.key] = shapes[s.key] ? shapes[s.key].concat(s) : [s])
    const currentPreDragShapes = Object.values(shapes).map(a => a[a.length - 1])
    const currentShapes = currentPreDragShapes.map(s => {
      return s === dragStartShape ? Object.assign({}, s, {x: s.x + lineAttribs.deltaX, y: s.y + lineAttribs.deltaY}) : s
    })

    const hoveredShapes = hoveredShapesAtPoint(currentShapes, cursor.x, cursor.y)
    const hoveringShape = hoveredShapes.length > 0
    const hoveredShape = topShape(hoveredShapes)
    const mouseIsDown = transactions.mouseEvents[transactions.mouseEvents.length - 1].event === 'mouseDown'

    const dragInProcess = mouseIsDown
    const shapeDragInProcess = dragStartEvent && dragInProcess
    const metaCursorSaliency = shapeDragInProcess
    const metaCursorColor = metaCursorSaliency ? metaCursorSalientColor : 'lightgrey'
    const metaCursorThickness = hoveringShape ? 3 : 1

    // rendering
    const shapeFrags = renderShapeFrags(currentShapes, dragStartShape, hoveredShape)
    const metaCursorFrag = renderMetaCursorFrag(cursor.x, cursor.y, shapeDragInProcess, metaCursorThickness, metaCursorColor)
    const dragLineFrags = renderDragLineFrags(shapeDragInProcess, lineAttribs.length, dragLineOriginX, dragLineOriginY, lineAttribs.angle)
    const substrateFrag = renderSubstrateFrag(transactions, shapeFrags, metaCursorFrag, dragLineFrags, hoveredShape)
    ReactDOM.render(substrateFrag, root)
  }

  render(transactions)

})()