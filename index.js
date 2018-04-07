(() => {

  const h = React.createElement

  const metaCursorRadius = 10

  const transactions = {
    shapes: [
      {key: 'aRect', shape: 'rectangle', x: 500, y: 200, rotation: 0, width: 150, height: 100},
      {key: 'aLine', shape: 'line', x: 300, y: -50, rotation: 75, length: 500},
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

    const shapeFrags = currentShapes.map(s => {
      return h('div', {
        className: s.shape,
        style: {
          width: s.shape === 'line' ? 0 : s.width,
          height: s.shape === 'line' ? s.length : s.height,
          transform: `translate(${s.x}px, ${s.y}px) rotate(${s.rotation}deg)`
        }
      })
    })

    const hoveredShapes = currentShapes.filter(s => s.shape === 'rectangle' && s.x <= cursor.x && cursor.x <= s.x + s.width && s.y <= cursor.y && cursor.y < s.y + s.height)

    const metaCursorSaliency = transactions.mouseEvents[transactions.mouseEvents.length - 1].event === 'mouseDown'
    const metaCursorColor = metaCursorSaliency ? 'red' : 'lightgrey'
    const metaCursorThickness = hoveredShapes.length ? 3 : 1

    const metaCursor = h('div', {
      className: 'circle metaCursor',
      style: {
        width: metaCursorRadius * 2,
        height: metaCursorRadius * 2,
        transform: `translate(${cursor.x - metaCursorRadius}px, ${cursor.y - metaCursorRadius}px)`,
        border: `${metaCursorThickness}px solid ${metaCursorColor}`,
        boxShadow: `0 0 0.5px 0 ${metaCursorColor} inset, 0 0 0.5px 0 ${metaCursorColor}`,
      }
    })

    const updateMetaCursor = event => {
      transactions.cursorPositions.push({x: event.clientX, y: event.clientY})
      render(transactions)
    }

    const mouseUp = () => {
      transactions.mouseEvents.push({event: 'mouseUp'})
      render(transactions)
    }

    const mouseDown = () => {
      transactions.mouseEvents.push({event: 'mouseDown'})
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
      shapeFrags.concat([metaCursor])
    )

    ReactDOM.render(substrate, root)
  }

  render(transactions)

})()