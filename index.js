(() => {

  const scenegraph = React.createElement('div', {
    className: 'circle',
    onClick: () => console.log('clicked'),
    style: {
      width: 100,
      height: 100
    }
  })
  const root = document.getElementById('root')
  ReactDOM.render(scenegraph, root)

})()