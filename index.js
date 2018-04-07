(() => {

  const h = React.createElement

  const metaCursorRadius = 10
  const metaCursorZ = 1000
  const dragLineZ = metaCursorZ - 1 // just below the metaCursor
  const dragLineColor = 'rgba(255,0,0,0.5)'

  const transactions = {
    shapes: [
      {key: 'aRect', shape: 'rectangle', x: 500, y: 200, rotation: 0, width: 150, height: 100, z: 10, backgroundColor: 'blue'},
      {key: 'bRect', shape: 'rectangle', x: 600, y: 250, rotation: 0, width: 150, height: 100, z: 0, backgroundColor: 'green'},
      {key: 'aLine', shape: 'line', x: 600, y: 150, rotation: 75, length: 500, z: 0},
    ],
    cursorPositions: [{x: -metaCursorRadius, y: -metaCursorRadius}],
    mouseEvents: [{event: 'mouseUp'}]
  }

  const root = document.body

  const render = transactions => {

    const cursor = transactions.cursorPositions[transactions.cursorPositions.length - 1]

    const shapes = {}
    transactions.shapes.forEach(s => shapes[s.key] = shapes[s.key] ? shapes[s.key].concat(s) : [s])
    const currentShapes = Object.values(shapes).map(a => a[a.length - 1])

    const hoveredShapes = currentShapes.filter(s => s.shape === 'rectangle' && s.x <= cursor.x && cursor.x <= s.x + s.width && s.y <= cursor.y && cursor.y < s.y + s.height)
    const hoveringShape = hoveredShapes.length > 0
    const hoveredShape = hoveredShapes.reduce((prev, next) => {
      return prev ? (next.z >= prev.z ? next : prev) : next
    }, null)

    const mouseIsDown = transactions.mouseEvents[transactions.mouseEvents.length - 1].event === 'mouseDown'
    const dragInProcess = mouseIsDown
    const metaCursorSaliency = dragInProcess
    const metaCursorColor = metaCursorSaliency ? 'red' : 'lightgrey'
    const metaCursorThickness = hoveringShape ? 3 : 1
    const metaCursorFill = hoveringShape && mouseIsDown

    const shapeFrags = currentShapes.map(s => {
      return h('div', {
        className: s.shape,
        style: {
          width: s.shape === 'line' ? 0 : s.width,
          height: s.shape === 'line' ? s.length : s.height,
          transform: `translate3d(${s.x}px, ${s.y}px, ${s.z}px) rotateZ(${s.rotation}deg)`,
          backgroundColor: s.backgroundColor,
          opacity: s === hoveredShape ? 1 : 0.8
        }
      })
    })

    const metaCursor = h('div', {
      className: 'circle metaCursor',
      style: {
        width: metaCursorRadius * 2,
        height: metaCursorRadius * 2,
        transform: `translate3d(${cursor.x - metaCursorRadius}px, ${cursor.y - metaCursorRadius}px, ${metaCursorZ}px)`,
        border: `${metaCursorThickness}px solid ${metaCursorColor}`,
        backgroundColor: metaCursorFill ? 'red' : null,
        boxShadow: `0 0 0.5px 0 ${metaCursorColor} inset, 0 0 0.5px 0 ${metaCursorColor}`,
      }
    })

    let dragStartShape = null
    const events = transactions.mouseEvents
    for(let i = events.length - 1; i >= 0; i--) {
      const e = events[i]
      if(e.event === 'mouseUp') {
        break
      }
      if(e.event === 'mouseDown' && e.onShape) {
        dragStartShape = e
        break
      }
    }
    const dragLineOriginX = dragStartShape && dragStartShape.x
    const dragLineOriginY = dragStartShape && dragStartShape.y

    const dragLineX0 = dragLineOriginX
    const dragLineY0 = dragLineOriginY
    const dragLineX1 = cursor.x
    const dragLineY1 = cursor.y
    const dragLineDeltaX = dragLineX1 - dragLineX0
    const dragLineDeltaY = dragLineY1 - dragLineY0
    const dragLineLength = Math.sqrt(Math.pow(dragLineDeltaX, 2) + Math.pow(dragLineDeltaY, 2))
    const dragLineAngle = Math.atan2(dragLineDeltaY, dragLineDeltaX) * 180 / Math.PI - 90

    const dragLines = dragStartShape && dragInProcess ? [h('div', {
      className: 'line',
      style: {
        width: 0,
        height: dragLineLength,
        opacity: dragInProcess ? 1 : 0,
        transform: `translate3d(${dragLineX0}px, ${dragLineY0}px, ${dragLineZ}px) rotateZ(${dragLineAngle}deg)`,
        border: `1px solid ${dragLineColor}`,
        boxShadow: `0 0 1px 0 ${'white'} inset, 0 0 1px 0 ${'white'}`,
      }
    })]
      : []
    const updateMetaCursor = event => {
      transactions.cursorPositions.push({x: event.clientX, y: event.clientY})
      render(transactions)
    }

    const mouseUp = event => {
      transactions.mouseEvents.push({event: 'mouseUp', x: event.clientX, y: event.clientY})
      render(transactions)
    }

    const mouseDown = event => {
      console.log(hoveredShape)
      transactions.mouseEvents.push({event: 'mouseDown', x: event.clientX, y: event.clientY, onShape: hoveredShape})
      render(transactions)
    }

    const substrate = h('div', {
        id: 'root',
        onMouseMove: updateMetaCursor,
        onDrag: updateMetaCursor,
        // onDragStart: e => e.preventDefault(), // prevents little dragged doc cursor icon but user-select: none solves it too
        onMouseUp: mouseUp,
        onMouseDown: mouseDown,
      },
      shapeFrags.concat([metaCursor, ...dragLines])
    )

    ReactDOM.render(substrate, root)
  }

  render(transactions)

})()