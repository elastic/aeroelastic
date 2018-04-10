(() => {

  /**
   * Mock `require()` bindings
   */

  const reactRenderDOM = ReactDOM.render
  const h = React.createElement
  const xl = crosslink


  /**
   * Mock API values
   */

  const root = document.body

  const initialShapes = [
    {key: 'rect1', shape: 'rectangle', x: 500, y: 200, rotation: 0, width: 250, height: 180, z: 5, backgroundColor: '#b3e2cd'},
    {key: 'rect2', shape: 'rectangle', x: 600, y: 350, rotation: 0, width: 300, height: 220, z: 6, backgroundColor: '#fdcdac'},
    {key: 'rect3', shape: 'rectangle', x: 800, y: 250, rotation: 0, width: 200, height: 150, z: 7, backgroundColor: '#cbd5e8'},
    {key: 'rect4', shape: 'rectangle', x: 300, y: 250, rotation: 0, width: 150, height: 190, z: 8, backgroundColor: '#f4cae4'},
    {key: 'rect5', shape: 'rectangle', x: 700, y: 100, rotation: 0, width: 325, height: 200, z: 9, backgroundColor: '#e6f5c9'},
  ]


  /**
   * Mock config
   */

  const metaCursorRadius = 15
  const metaCursorZ = 1000
  const dragLineZ = metaCursorZ - 1 // just beneath the metaCursor
  const dragLineColor = 'rgba(255,0,255,0.5)'
  const metaCursorSalientColor = 'magenta'
  const hotspotSize = 12


  /**
   * Mock action dispatch
   */

  const primaryActions = xl.cell('Transactions')
  const dispatch = (action, payload) => xl.put(primaryActions, [{action, payload}])


  /**
   * Fragment makers (pure functional components)
   */

  const renderShapeFrags = (shapes, hoveredShape, dragStartAt) => shapes.map(s => h('div', {
    style: {
      transform: `translate3d(${s.x}px, ${s.y}px, ${s.z}px) rotateZ(${s.rotation}deg)`,
    }
  }, [
    h('div', {
      className: s.shape,
      style: {
        width: s.shape === 'line' ? 0 : s.width,
        height: s.shape === 'line' ? s.length : s.height,
        backgroundColor: s.backgroundColor,
        border: s.key === (dragStartAt && dragStartAt.dragStartShape && dragStartAt.dragStartShape.key) ? '2px solid magenta' : null,
        opacity: s.key === (hoveredShape && hoveredShape.key) ? 0.8 : 0.5
      }
    }),
    h('div', {
      className: 'rotateHotspot circle',
      style: { width: hotspotSize * 1.5, height: hotspotSize * 1.5, transform: `translate(${s.width / 2}px, ${- 2 * hotspotSize}px)` }
    }),
    h('div', {
      className: 'cornerHotspot rectangle',
      style: { width: hotspotSize, height: hotspotSize, transform: `translate(${- hotspotSize / 2}px, ${- hotspotSize / 2}px)` }
    }),
    h('div', {
      className: 'cornerHotspot rectangle',
      style: { width: hotspotSize, height: hotspotSize, transform: `translate(${s.width - hotspotSize / 2}px, ${-hotspotSize / 2}px)` }
    }),
    h('div', {
      className: 'cornerHotspot rectangle',
      style: { width: hotspotSize, height: hotspotSize, transform: `translate(${- hotspotSize / 2}px, ${s.height - hotspotSize / 2}px)` }
    }),
    h('div', {
      className: 'cornerHotspot rectangle',
      style: { width: hotspotSize, height: hotspotSize, transform: `translate(${s.width - hotspotSize / 2}px, ${s.height - hotspotSize / 2}px)` }
    }),
  ]))

  const renderMetaCursorFrag = (x, y, shapeDragInProcess, metaCursorThickness, metaCursorColor) => h('div', {
    className: 'circle metaCursor',
    style: {
      width: metaCursorRadius * 2,
      height: metaCursorRadius * 2,
      transform: `translate3d(${x - metaCursorRadius}px, ${y - metaCursorRadius}px, ${metaCursorZ}px)`,
      border: `${metaCursorThickness}px solid ${metaCursorColor}`,
      boxShadow: `0 0 0.5px 0 ${metaCursorColor} inset, 0 0 2px 0 white`,
    }
  })

  const renderDragLineFrag = (dragLineLength, x, y, angle) => h('div', {
    style: {
      transform: `translate3d(${x}px, ${y}px, ${dragLineZ}px) rotateZ(${angle}deg)`,
    }
  }, [
    h('div', {
      className: 'line',
      style: {
        width: Math.max(0, dragLineLength - metaCursorRadius),
        height: 0,
        border: `1px solid ${dragLineColor}`,
        boxShadow: `0 0 1px 0 white inset, 0 0 1px 0 white`,
      }
    }),
    h('div', {
      className: 'circle metaCursor',
      style: {
        width: dragLineLength ? metaCursorRadius : 0,
        height: dragLineLength ? metaCursorRadius : 0,
        transform: `translate3d(${-metaCursorRadius / 2}px, ${-metaCursorRadius / 2}px, ${metaCursorZ}px)`,
        backgroundColor: metaCursorSalientColor,
        boxShadow: `0 0 0.5px 0 ${metaCursorSalientColor} inset, 0 0 2px 0 white`,
      }
    })
  ])

  const renderSubstrateFrag = (shapeFrags, metaCursorFrag, dragLineFrag) => {

    const updateMetaCursor = event => dispatch('cursorPosition', {x: event.clientX, y: event.clientY})
    const mouseUp = event => dispatch('mouseEvent', {event: 'mouseUp', x: event.clientX, y: event.clientY})
    const mouseDown = event => dispatch('mouseEvent', {event: 'mouseDown', x: event.clientX, y: event.clientY})

    return h('div', {
        id: 'root',
        onMouseMove: updateMetaCursor,
        onMouseUp: mouseUp,
        onMouseDown: mouseDown,
      },
      shapeFrags.concat([metaCursorFrag, dragLineFrag])
    )
  }


  /**
   * Pure calculations
   */

  // map x0, y0, x1, y1 to deltas, length and angle
  const positionsToLineAttribsViewer = (x0, y0, x1, y1) => {
    const deltaX = x1 - x0
    const deltaY = y1 - y0
    const length = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2))
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI
    return {length, angle, deltaX, deltaY}
  }

  // set of shapes under a specific point
  const shapesAtPoint = (shapes, x, y) => shapes.filter(s => s.shape === 'rectangle' && s.x <= x && x <= s.x + s.width && s.y <= y && y < s.y + s.height)

  // pick top shape out of possibly several shapes (presumably under the same point)
  const topShape = shapes => shapes.reduce((prev, next) => {
    return prev ? (next.z >= prev.z ? next : prev) : next
  }, null)

  const hoveredAt = (shapes, x, y) => {
    const hoveredShapes = shapesAtPoint(shapes, x, y)
    return topShape(hoveredShapes)
  }


  /**
   * Data streams
   */

  const substrate = xl.cell('Frag Substrate')
  const shapeAdditions = xl.cell('Shape additions')

  const cursorPositions = xl.lift(transactions => {
    const result = transactions.filter(t => t.action === 'cursorPosition').map(t => t.payload)
    return result
  })(primaryActions)
  const mouseEvents = xl.lift(transactions => transactions.filter(t => t.action === 'mouseEvent').map(t => t.payload))(primaryActions)

  initialShapes.forEach(s => xl.put(primaryActions, [{action: 'shape', payload: s}]))

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



  /**
   * Start of interesting things
   */

  const dragGestures = xl.lift(({down, x0, y0}, cursor) => {
    return {down, x0, y0, x1: cursor.x, y1: cursor.y}
  })(dragGestureStartAt, cursorPosition)

  const dragStartCandidate = xl.lift(({down, x0, y0, x1, y1}) => {
    // the cursor must be over the shape at the _start_ of the gesture (x0 === x1 && y0 === y1 good enough) when downing the mouse
    return down && x0 === x1 && y0 === y1
  })(dragGestures)



  const currentShapes = xl.lift(function (primedShapes, cursor, dragStartCandidate, {x0, y0, x1, y1, down}) {
    const previousShapeState = this.value || primedShapes
    const hoveredShape = hoveredAt(previousShapeState, cursor.x, cursor.y, Infinity)
    const dragInProgress = previousShapeState.reduce((prev, next) => prev || next.beingDragged, false)
    return previousShapeState.map(s => {
      const {x, y} = s
      const beingDragged = down && s.beingDragged || !dragInProgress && hoveredShape && s.key === hoveredShape.key && down && dragStartCandidate
      const grabStart = !s.beingDragged && beingDragged
      const grabOffsetX = grabStart ? x - x0 : (s.grabOffsetX || 0)
      const grabOffsetY = grabStart ? y - y0 : (s.grabOffsetY || 0)
      return Object.assign({}, s, {x: beingDragged ? x1 + grabOffsetX: x, y: beingDragged ? y1 + grabOffsetY : y, beingDragged, grabOffsetX, grabOffsetY})
    })
  })(shapeAdditions, cursorPosition, dragStartCandidate, dragGestures)



  const hoveredShape = xl.lift((shapes, cursor) => {
    return hoveredAt(shapes, cursor.x, cursor.y)
  })(currentShapes, cursorPosition)

  const dragStartAt = xl.lift(function(dragStartCandidate, {down, x0, y0, x1, y1}, hoveredShape) {
    const previous = this.value || {down: false}
    // the cursor must be over the shape at the _start_ of the gesture (x0 === x1 && y0 === y1 good enough) when downing the mouse
    const result = down ? (!previous.down && dragStartCandidate && hoveredShape ? {down, x: x1, y: y1, dragStartShape: hoveredShape} : previous) : {down: false}
    return result
  })(dragStartCandidate, dragGestures, hoveredShape)


  /**
   * End of interesting things
   */



  const metaCursorFrag = xl.lift(function(cursor, mouseDown, dragStartAt) {
    const thickness = mouseDown ? 8 : 1
    const frag = renderMetaCursorFrag(cursor.x, cursor.y, dragStartAt && dragStartAt.dragStartShape, thickness, 'magenta')
    return frag
  })(cursorPosition, mouseDown, dragStartAt)

  const shapeFrags = xl.lift((currentShapes, hoveredShape, dragStartAt) => {
    return renderShapeFrags(currentShapes, hoveredShape, dragStartAt)
  })(currentShapes, hoveredShape, dragStartAt)

  const dragLineFrag = xl.lift((cursor, lastMouseDownAt) => {
    const origin = lastMouseDownAt.down ? lastMouseDownAt : cursor
    const lineAttribs = positionsToLineAttribsViewer(origin.x, origin.y, cursor.x, cursor.y)
    const frags = renderDragLineFrag(lineAttribs.length, origin.x, origin.y, lineAttribs.angle)
    return frags
  })(cursorPosition, dragStartAt)

  const scenegraph = xl.lift((substrate, shapeFrags, metaCursorFrag, dragLineFrag) => renderSubstrateFrag(shapeFrags, metaCursorFrag, dragLineFrag))(substrate, shapeFrags, metaCursorFrag, dragLineFrag)


  /**
   *  Render into supplied root
   */

  xl.lift(frag => reactRenderDOM(frag, root))(scenegraph)


  /**
   *  Providing initial state
   */

  xl.put(substrate, null) // doesn't currently take actual input
  xl.put(shapeAdditions, initialShapes)

})()