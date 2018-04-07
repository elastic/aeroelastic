(() => {

  const h = React.createElement

  const metaCursorRadius = 10

  const transactions = {
    cursorPositions: [{x: -metaCursorRadius, y: -metaCursorRadius}],
    mouseEvents: [
      {event: 'mouseUp'}
    ]
  }

  const root = document.body

  const render = transactions => {

    const cursor = transactions.cursorPositions[transactions.cursorPositions.length - 1]

    const aRect = h('div', {
      className: 'rectangle',
      style: {
        width: 150,
        height: 100,
        transform: `translate(500px, 200px)`
      }
    })

    const aLine = h('div', {
      className: 'line',
      style: {
        width: 0,
        height: 500,
        transform: `translate(300px, -50px) rotate(75deg)`
      }
    })

    const metaCursor = h('div', {
      className: 'circle metaCursor',
      style: {
        width: metaCursorRadius * 2,
        height: metaCursorRadius * 2,
        transform: `translate(${cursor.x - metaCursorRadius}px, ${cursor.y - metaCursorRadius}px)`
      }
    })

    const updateMetaCursor = event => {
      transactions.cursorPositions.push({x: event.clientX, y: event.clientY})
      render(transactions)
    }

    const mouseUp = () => {
      transactions.mouseEvents.push({evt: 'mouseUp'})
      render(transactions)
    }

    const mouseDown = () => {
      transactions.mouseEvents.push({evt: 'mouseDown'})
      render(transactions)
    }

    const substrate = h('div', {
        id: 'root',
        onMouseMove: updateMetaCursor,
        onDrag: updateMetaCursor,
        onMouseUp: mouseUp,
        onMouseDown: mouseDown,
      },
      [
        metaCursor,
        aRect,
        aLine
      ]
    )

    ReactDOM.render(substrate, root)
  }

  render(transactions)

})()