(() => {

  let currentId = 0
  const getId = () => currentId++
  const getTime = () => performance.now()
  const h = React.createElement

  const metaCursorRadius = 10
  const metaCursorZ = 1000
  const dragLineZ = metaCursorZ - 1 // just below the metaCursor
  const dragLineColor = 'rgba(255,0,255,0.5)'
  const metaCursorSalientColor = 'magenta'

  const transactions = {
    shapes: [
      {key: 'aRect', id: getId(), time: getTime(), shape: 'rectangle', x: 500, y: 200, rotation: 0, width: 150, height: 100, z: 10, backgroundColor: 'blue'},
      {key: 'bRect', id: getId(), time: getTime(), shape: 'rectangle', x: 600, y: 250, rotation: 0, width: 150, height: 100, z: 0, backgroundColor: 'green'},
      {key: 'aLine', id: getId(), time: getTime(), shape: 'line', x: 600, y: 150, rotation: 75, length: 500, z: 0},
    ],
    cursorPositions: [{id: getId(), time: getTime(), x: -metaCursorRadius, y: -metaCursorRadius}],
    mouseEvents: [{id: getId(), time: getTime(), event: 'mouseUp'}]
  }

  const root = document.body

  const shapeSnapshotViewer = (shapes, positions, events) => shapes

  const currentDragStartEventViewer = events => {
    let dragStartEvent = null
    for(let i = 0; i < events.length; i++) {
      const e = events[i]
      if(e.event === 'mouseUp') {
        dragStartEvent = null
      }
      if(e.event === 'mouseDown' && e.onShape) {
        dragStartEvent = e
      }
    }
    return dragStartEvent
  }

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

  const renderMetaCursorFrag = (cursor, shapeDragInProcess, metaCursorThickness, metaCursorColor) => h('div', {
    className: 'circle metaCursor',
    style: {
      width: metaCursorRadius * 2,
      height: metaCursorRadius * 2,
      transform: `translate3d(${cursor.x - metaCursorRadius}px, ${cursor.y - metaCursorRadius}px, ${metaCursorZ}px)`,
      border: `${metaCursorThickness}px solid ${metaCursorColor}`,
      backgroundColor: shapeDragInProcess ? metaCursorSalientColor : null,
      boxShadow: `0 0 0.5px 0 ${metaCursorColor} inset, 0 0 2px 0 white`,
    }
  })

  const renderDragLineFrags = (shapeDragInProcess, dragLineLength, dragLineX0, dragLineY0, dragLineAngle) => shapeDragInProcess ? [h('div', {
      className: 'line',
      style: {
        width: 0,
        height: dragLineLength,
        opacity: shapeDragInProcess ? 1 : 0,
        transform: `translate3d(${dragLineX0}px, ${dragLineY0}px, ${dragLineZ}px) rotateZ(${dragLineAngle}deg)`,
        border: `1px solid ${dragLineColor}`,
        boxShadow: `0 0 1px 0 white inset, 0 0 1px 0 white`,
      }
    })]
    : []

  const renderSubstrateFrag = (transactions, shapeFrags, metaCursorFrag, dragLineFrags, hoveredShape) => {

    const updateMetaCursor = event => {
      transactions.cursorPositions.push({id: getId(), time: getTime(), x: event.clientX, y: event.clientY})
      render(transactions)
    }

    const mouseUp = event => {
      transactions.mouseEvents.push({id: getId(), time: getTime(), event: 'mouseUp', x: event.clientX, y: event.clientY})
      render(transactions)
    }

    const mouseDown = event => {
      transactions.mouseEvents.push({id: getId(), time: getTime(), event: 'mouseDown', x: event.clientX, y: event.clientY, onShape: hoveredShape})
      render(transactions)
    }

    return h('div', {
        id: 'root',
        onMouseMove: updateMetaCursor,
        onMouseUp: mouseUp,
        onMouseDown: mouseDown,
      },
      shapeFrags.concat([metaCursorFrag, ...dragLineFrags])
    )
  }

  const render = transactions => {

    const cursor = transactions.cursorPositions[transactions.cursorPositions.length - 1]

    const everCurrentShapes = shapeSnapshotViewer(transactions.shapes, transactions.cursorPositions, transactions.mouseEvents)

    const dragStartEvent = currentDragStartEventViewer(transactions.mouseEvents)

    const dragLineOriginX = dragStartEvent && dragStartEvent.x
    const dragLineOriginY = dragStartEvent && dragStartEvent.y

    const dragLineX0 = dragLineOriginX
    const dragLineY0 = dragLineOriginY
    const dragLineX1 = cursor.x
    const dragLineY1 = cursor.y
    const dragLineDeltaX = dragLineX1 - dragLineX0
    const dragLineDeltaY = dragLineY1 - dragLineY0
    const dragLineFullLength = Math.sqrt(Math.pow(dragLineDeltaX, 2) + Math.pow(dragLineDeltaY, 2))
    const dragLineLength = Math.max(0, dragLineFullLength - metaCursorRadius)
    const dragLineAngle = Math.atan2(dragLineDeltaY, dragLineDeltaX) * 180 / Math.PI - 90
    const dragStartShape = dragStartEvent && dragStartEvent.onShape

    const shapes = {}
    everCurrentShapes.forEach(s => shapes[s.key] = shapes[s.key] ? shapes[s.key].concat(s) : [s])
    const currentPreDragShapes = Object.values(shapes).map(a => a[a.length - 1])
    const currentShapes = currentPreDragShapes.map(s => {
      return s === dragStartShape ? Object.assign({}, s, {x: s.x + dragLineDeltaX, y: s.y + dragLineDeltaY}) : s
    })

    const hoveredShapes = currentShapes.filter(s => s.shape === 'rectangle' && s.x <= cursor.x && cursor.x <= s.x + s.width && s.y <= cursor.y && cursor.y < s.y + s.height)
    const hoveringShape = hoveredShapes.length > 0
    const hoveredShape = hoveredShapes.reduce((prev, next) => {
      return prev ? (next.z >= prev.z ? next : prev) : next
    }, null)

    const mouseIsDown = transactions.mouseEvents[transactions.mouseEvents.length - 1].event === 'mouseDown'

    const dragInProcess = mouseIsDown
    const shapeDragInProcess = dragStartEvent && dragInProcess
    const metaCursorSaliency = shapeDragInProcess
    const metaCursorColor = metaCursorSaliency ? metaCursorSalientColor : 'lightgrey'
    const metaCursorThickness = hoveringShape ? 3 : 1

    // rendering
    const shapeFrags = renderShapeFrags(currentShapes, dragStartShape, hoveredShape)
    const metaCursorFrag = renderMetaCursorFrag(cursor, shapeDragInProcess, metaCursorThickness, metaCursorColor)
    const dragLineFrags = renderDragLineFrags(shapeDragInProcess, dragLineLength, dragLineX0, dragLineY0, dragLineAngle)
    const substrateFrag = renderSubstrateFrag(transactions, shapeFrags, metaCursorFrag, dragLineFrags, hoveredShape)
    ReactDOM.render(substrateFrag, root)
  }

  render(transactions)

})()