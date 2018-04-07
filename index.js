(() => {

  const transactions = {
    cursorPositions: []
  }

  const cursor = {
    x: 200,
    y: 200
  }

  const root = document.body

  const render = () => {

    const metaCursor = React.createElement('div', {
      className: 'circle',
      style: {
        width: 100,
        height: 100,
        transform: `translate(${cursor.x}px, ${cursor.y}px)`
      }
    })

    const substrate = React.createElement('div', {
        id: 'root',
        onMouseMove: event => {
          cursor.x = event.clientX
          cursor.y = event.clientY
          console.log('clicked')
          render()
        }
      },
      [metaCursor]
    )

    ReactDOM.render(substrate, root)
  }

  render()

})()