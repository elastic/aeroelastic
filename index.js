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
    {key: 'rect1', shape: 'rectangle', x: 300, y: 200, rotation: 0, width: 250, height: 180, z: 5, backgroundColor: '#b3e2cd'},
    {key: 'rect2', shape: 'rectangle', x: 600, y: 350, rotation: 0, width: 300, height: 220, z: 6, backgroundColor: '#fdcdac'},
    {key: 'rect3', shape: 'rectangle', x: 800, y: 250, rotation: 0, width: 200, height: 150, z: 7, backgroundColor: '#cbd5e8'},
    {key: 'rect4', shape: 'rectangle', x: 100, y: 250, rotation: 0, width: 250, height: 150, z: 8, backgroundColor: '#f4cae4'},
    {key: 'rect5', shape: 'rectangle', x: 900, y: 100, rotation: 0, width: 325, height: 200, z: 9, backgroundColor: '#e6f5c9'},
  ]


  /**
   * Mock config
   */

  const metaCursorRadius = 15
  const metaCursorZ = 1000
  const dragLineZ = metaCursorZ - 1 // just beneath the metaCursor
  const freeDragZ = dragLineZ - 1 // just beneath the cursor scenegraph
  const dragLineColor = 'rgba(255,0,255,0.5)'
  const metaCursorSalientColor = 'magenta'
  const hotspotSize = 12
  const devColor = 'magenta'
  const gridPitch = 50


  /**
   * Mock action dispatch
   */

  const primaryActions = xl.cell('Transactions')
  const dispatch = (action, payload) => xl.put(primaryActions, [{action, payload}])


  /**
   * Fragment makers (pure functional components)
   */

  const renderShapeFrags = (shapes, hoveredShape, dragStartAt) => shapes.map(s => {
    const dragged = s.key === (dragStartAt && dragStartAt.dragStartShape && dragStartAt.dragStartShape.key)
    return h('div', {
      className: dragged ? 'draggable' : null,
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
          border: dragged ? `2px solid ${devColor}` : null,
          opacity: s.key === (hoveredShape && hoveredShape.key) ? 0.8 : 0.5
        }
      }),
      h('div', {
        className: 'rotateHotspot circle',
        style: { width: hotspotSize * 1.5, height: hotspotSize * 1.5, transform: `translate(${s.width / 2 + hotspotSize}px, ${- 2 * hotspotSize}px)` }
      }),
      h('div', {
        className: 'cornerHotspot rectangle topLeft',
        style: { width: hotspotSize, height: hotspotSize, transform: `translate(${- hotspotSize / 2}px, ${- hotspotSize / 2}px)` }
      }),
      h('div', {
        className: 'cornerHotspot rectangle topRight',
        style: { width: hotspotSize, height: hotspotSize, transform: `translate(${s.width - hotspotSize / 2}px, ${-hotspotSize / 2}px)` }
      }),
      h('div', {
        className: 'cornerHotspot rectangle bottomLeft',
        style: { width: hotspotSize, height: hotspotSize, transform: `translate(${- hotspotSize / 2}px, ${s.height - hotspotSize / 2}px)` }
      }),
      h('div', {
        className: 'cornerHotspot rectangle bottomRight',
        style: { width: hotspotSize, height: hotspotSize, transform: `translate(${s.width - hotspotSize / 2}px, ${s.height - hotspotSize / 2}px)` }
      }),
      h('div', {
        className: 'cornerHotspot rectangle top',
        style: { width: hotspotSize, height: hotspotSize, transform: `translate(${s.width / 2 - hotspotSize / 2}px, ${-hotspotSize / 2}px)` }
      }),
      h('div', {
        className: 'cornerHotspot rectangle right',
        style: { width: hotspotSize, height: hotspotSize, transform: `translate(${s.width - hotspotSize / 2}px, ${s.height / 2 - hotspotSize / 2}px)` }
      }),
      h('div', {
        className: 'cornerHotspot rectangle bottom',
        style: { width: hotspotSize, height: hotspotSize, transform: `translate(${s.width / 2 - hotspotSize / 2}px, ${s.height - hotspotSize / 2}px)` }
      }),
      h('div', {
        className: 'cornerHotspot rectangle left',
        style: { width: hotspotSize, height: hotspotSize, transform: `translate(${-hotspotSize / 2}px, ${s.height / 2 - hotspotSize / 2}px)` }
      }),
      h('div', {
        className: 'cornerHotspot rectangle',
        style: { width: hotspotSize, height: hotspotSize, transform: `translate(${s.width / 2 - hotspotSize / 2}px, ${s.height / 2 - hotspotSize / 2}px)` }
      }),
    ])
  })

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

  const renderSubstrateFrag = (shapeFrags, freeShapeFrags, metaCursorFrag, dragLineFrag) => {

    const updateMetaCursor = event => dispatch('cursorPosition', {x: event.clientX, y: event.clientY})
    const mouseUp = event => dispatch('mouseEvent', {event: 'mouseUp', x: event.clientX, y: event.clientY})
    const mouseDown = event => dispatch('mouseEvent', {event: 'mouseDown', x: event.clientX, y: event.clientY})

    return h('div', {
        id: 'root',
        onMouseMove: updateMetaCursor,
        onMouseUp: mouseUp,
        onMouseDown: mouseDown,
      },
      shapeFrags.concat(freeShapeFrags).concat([metaCursorFrag, dragLineFrag])
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

  const snapToGrid = x => gridPitch * Math.round(x / gridPitch)
  const snapToGridUp = x => gridPitch * Math.ceil(x / gridPitch)


  /**
   * Input cells
   */

  const substrate = xl.cell('Frag Substrate')
  const shapeAdditions = xl.cell('Shape additions')


  /**
   * Reducer cells
   */

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
   * Gestures
   */

  const dragGestures = xl.lift(({down, x0, y0}, cursor) => {
    return {down, x0, y0, x1: cursor.x, y1: cursor.y}
  })(dragGestureStartAt, cursorPosition)

  const dragStartCandidate = xl.lift(({down, x0, y0, x1, y1}) => {
    // the cursor must be over the shape at the _start_ of the gesture (x0 === x1 && y0 === y1 good enough) when downing the mouse
    return down && x0 === x1 && y0 === y1
  })(dragGestures)


  /**
   * Positions
   */

  const currentShapes = xl.lift(function (primedShapes, cursor, dragStartCandidate, {x0, y0, x1, y1, down}) {
    const previousState = this.value || {shapes: primedShapes}
    const previousShapeState = previousState.shapes
    const hoveredShape = hoveredAt(previousShapeState, cursor.x, cursor.y, Infinity)
    const dragInProgress = down && previousShapeState.reduce((prev, next) => prev || next.beingDragged, false)
    return {
      hoveredShape,
      draggedShape: dragInProgress && hoveredShape,
      shapes: previousShapeState.map(s => {
        const {x, y} = s
        const beingDragged = down && s.beingDragged || !dragInProgress && hoveredShape && s.key === hoveredShape.key && down && dragStartCandidate
        const grabStart = !s.beingDragged && beingDragged
        const grabOffsetX = grabStart ? x - x0 : (s.grabOffsetX || 0)
        const grabOffsetY = grabStart ? y - y0 : (s.grabOffsetY || 0)
        const newX = beingDragged ? x1 + grabOffsetX : x
        const newY = beingDragged ? y1 + grabOffsetY : y
        return Object.assign({}, s, {
          x: snapToGrid(newX),
          y: snapToGrid(newY),
          unconstrainedX: newX,
          unconstrainedY: newY,
          width: snapToGridUp(s.width),
          height: snapToGridUp(s.height),
          beingDragged,
          grabOffsetX,
          grabOffsetY
        })
      })
    }
  })(shapeAdditions, cursorPosition, dragStartCandidate, dragGestures)

  const hoveredShape = xl.lift(({hoveredShape}) => hoveredShape)(currentShapes)

  const dragStartAt = xl.lift(function(dragStartCandidate, {down, x0, y0, x1, y1}, hoveredShape) {
    const previous = this.value || {down: false}
    // the cursor must be over the shape at the _start_ of the gesture (x0 === x1 && y0 === y1 good enough) when downing the mouse
    return down ? (!previous.down && dragStartCandidate && hoveredShape ? {down, x: x1, y: y1, dragStartShape: hoveredShape} : previous) : {down: false}
  })(dragStartCandidate, dragGestures, hoveredShape)

  const currentFreeShapes = xl.lift(({shapes}, {dragStartShape}) =>
    shapes.filter(s => dragStartShape && s.key === dragStartShape.key).map(s => Object.assign({}, s, {x: s.unconstrainedX, y: s.unconstrainedY, z: freeDragZ, backgroundColor: 'rgba(0,0,0,0.03)'}))
  )(currentShapes, dragStartAt)


  /**
   * Update fragments
   */

  const metaCursorFrag = xl.lift(function(cursor, mouseDown, dragStartAt) {
    const thickness = mouseDown ? 8 : 1
    return renderMetaCursorFrag(cursor.x, cursor.y, dragStartAt && dragStartAt.dragStartShape, thickness, 'magenta')
  })(cursorPosition, mouseDown, dragStartAt)

  const shapeFrags = xl.lift(({shapes}, hoveredShape, dragStartAt) => {
    return renderShapeFrags(shapes, hoveredShape, dragStartAt)
  })(currentShapes, hoveredShape, dragStartAt)

  const freeShapeFrags = xl.lift(shapes => {
    return renderShapeFrags(shapes, null, null)
  })(currentFreeShapes)

  const dragLineFrag = xl.lift((cursor, dragStartAt) => {
    const origin = dragStartAt.down ? dragStartAt : cursor
    const lineAttribs = positionsToLineAttribsViewer(origin.x, origin.y, cursor.x, cursor.y)
    return renderDragLineFrag(lineAttribs.length, origin.x, origin.y, lineAttribs.angle)
  })(cursorPosition, dragStartAt)

  const scenegraph = xl.lift(renderSubstrateFrag)(shapeFrags, freeShapeFrags, metaCursorFrag, dragLineFrag)


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