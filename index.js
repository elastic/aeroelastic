(() => {

  const metaCursor = React.createElement('div', {
    className: 'circle',
    style: {
      width: 100,
      height: 100
    }
  })

  const substrate = React.createElement('div', {
    id: 'root',
    onClick: () => console.log('clicked')
  },
    [metaCursor]
  )

  const root = document.body

  ReactDOM.render(substrate, root)

})()