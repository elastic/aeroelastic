(() => {

  const metaCursorRadius = 5

  const transactions = {
    cursorPositions: [{x: -metaCursorRadius, y: -metaCursorRadius}]
  }

  const root = document.body

  const render = transactions => {

    const cursor = transactions.cursorPositions[transactions.cursorPositions.length - 1]

    const metaCursor = React.createElement('div', {
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

    const substrate = React.createElement('div', {
        id: 'root',
        onMouseMove: updateMetaCursor,
      },
      [metaCursor]
    )

    ReactDOM.render(substrate, root)
  }

  render(transactions)

})()