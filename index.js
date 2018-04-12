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
    {key: 'line1', shape: 'line', x0: 200, y0: 150, x1: 1600, y1: 150, z: 5, rotation: 0, color: 'grey'},
    {key: 'line2', shape: 'line', x0: 200, y0: 550, x1: 1600, y1: 550, z: 5, rotation: 0, color: 'grey'},
    {key: 'line3', shape: 'line', x0: 80, y0: 100, x1: 80, y1: 1000, z: 5, rotation: 0, color: 'grey'},
    {key: 'line4', shape: 'line', x0: 700, y0: 100, x1: 700, y1: 1000, z: 5, rotation: 0, color: 'grey'},
    {key: 'rect1', shape: 'rectangle', x: 300, y: 200, rotation: 0, width: 250, height: 180, z: 5, backgroundColor: '#b3e2cd', backgroundImage: 'url("data:image/png;base64,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")'},
    {key: 'rect2', shape: 'rectangle', x: 600, y: 350, rotation: 0, width: 300, height: 220, z: 6, backgroundColor: '#fdcdac', backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAklJREFUeNqEVtlqVEEQ7a7bk0UFF4y+KBiXV8Fn/9rv8MEvSAgoKEIiuMTMnem2KpwKZyo1Y8PhzvRSe53uOsZ4VUoZwKRYK2rZHL4uYa4n+xutV59Y0+EVFgb+V9o8SJAL31fch3E2/iiuyKDrb8MGFsqCefi+FYx7rnhIClzGpeKz4qefqRqu17CsBDdHsF6g4EDxBt85KOBwnSrO7b9QTHsiVCiUHfteKhaKZYiA75thzAvFPZMvSVLZi0oKzZgjxV0IGQTP0SCD7cwztnaQpZxc9s72PYICDhF7w+GeYdChUD4kJJo9WyNEeyQkFkYJnvs45HgP+h2TWZOeqVv66ZbiBq09KeM4eqj/8R8FLmctlAvZocDL9yqEIttbEF437FKSUGwLj+EbNV/dETZBDi9cyUgoY5Bn3GR26DsKoAePprDXvP5i8y2pqonqXkJp2toZ5h5TWLjX9sBhJyjjyWjleAspZgRZyQDjrSdWorS+grdfucFbsGQbSfawNkHYD8ho2D9Tt0skMwn134NHzAqubEFzy5D0iWU16ug5dOwiNKiEyuuBlmpo5JtoNMTRFt+C0Owe+KT4TYoip3FIe1BUIw9a4p/q973iHdxuiPUHuqB6YAZJSFISg2463pj1GGU34/sAc3PCVyUpFgmKN66LlvAPu+yYyAsuCH949F3hEpTiCbjfGukO5s5wxdbkOpAgbApFsuF1w4vjo+IvEv8LiV8SfdTkxRIfGJJcXtdnveMH3XgdVSXJWyuWaEneYreu8H8CDACRPfht+odEKwAAAABJRU5ErkJggg==")'},
    {key: 'rect3', shape: 'rectangle', x: 800, y: 250, rotation: 0, width: 200, height: 150, z: 7, backgroundColor: '#cbd5e8'},
    {key: 'rect4', shape: 'rectangle', x: 100, y: 250, rotation: 0, width: 250, height: 150, z: 8, backgroundColor: '#f4cae4'},
    {key: 'rect5', shape: 'rectangle', x: 900, y: 100, rotation: 0, width: 325, height: 200, z: 9, backgroundColor: '#e6f5c9', backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGElEQVQYlWNgYGCQwoKxgqGgcJA5h3yFAAs8BRWVSwooAAAAAElFTkSuQmCC")'},
  ]


  /**
   * Mock config
   */

  const metaCursorRadius = 15
  const metaCursorZ = 1000
  const dragLineZ = metaCursorZ - 1 // just beneath the metaCursor
  const freeDragZ = dragLineZ - 1 // just beneath the cursor scenegraph
  const dragLineColor = 'rgba(255,0,255,0.5)'
  const hotspotSize = 12
  const devColor = 'magenta'
  const pad = 10
  const gridPitch = 1
  const snapDistance = 15


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
          width: s.width,
          height: s.height,
          backgroundColor: s.backgroundColor,
          backgroundImage: s.backgroundImage,
          border: dragged ? `1px solid ${devColor}` : (s.shape === 'line' ? '1px solid rgba(0,0,0,0.2)' : null),
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
        className: 'cornerHotspot rectangle center',
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
        backgroundColor: devColor,
        boxShadow: `0 0 0.5px 0 ${devColor} inset, 0 0 2px 0 white`,
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

  const vectorLength = (x, y) =>  Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))

  const distance = (a, b) => vectorLength(b.x - a.x, b.y - a.y)

  // map x0, y0, x1, y1 to deltas, length and angle
  const positionsToLineAttribsViewer = (x0, y0, x1, y1) => {
    const deltaX = x1 - x0
    const deltaY = y1 - y0
    const length = vectorLength(deltaX, deltaY)
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI
    return {length, angle, deltaX, deltaY}
  }

  // set of shapes under a specific point
  const shapesAtPoint = (shapes, x, y) => shapes.filter(s => /*s.shape === 'rectangle' && */s.x - pad <= x && x <= s.x + s.width + pad && s.y - pad <= y && y < s.y + s.height + pad)

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
  const isHorizontal = line => line.y0 === line.y1
  const isVertical = line => line.x0 === line.x1

  const nextRectangle = (down, dragInProgress, hoveredShape, dragStartCandidate, x0, y0, x1, y1, constraints, s) => {
    const {x, y} = s
    const beingDragged = down && s.beingDragged || !dragInProgress && hoveredShape && s.key === hoveredShape.key && down && dragStartCandidate
    const grabStart = !s.beingDragged && beingDragged
    const grabOffsetX = grabStart ? x - x0 : (s.grabOffsetX || 0)
    const grabOffsetY = grabStart ? y - y0 : (s.grabOffsetY || 0)
    const xConstraint = constraints[s.xConstraint] && constraints[s.xConstraint].x0
    const yConstraint = constraints[s.yConstraint] && constraints[s.yConstraint].y0
    const unconstrainedX = beingDragged ? x1 + grabOffsetX : x
    const unconstrainedY = beingDragged ? y1 + grabOffsetY : y
    const newX = isNaN(xConstraint) ? unconstrainedX : xConstraint
    const newY = isNaN(yConstraint) ? unconstrainedY : yConstraint
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
  }

  const nextLine = (down, dragInProgress, hoveredShape, dragStartCandidate, x0, y0, x1, y1, constraints, s) => {
    const x = s.x0
    const y = s.y0
    const beingDragged = down && s.beingDragged || !dragInProgress && hoveredShape && s.key === hoveredShape.key && down && dragStartCandidate
    const grabStart = !s.beingDragged && beingDragged
    const grabOffsetX = grabStart ? x - x0 : (s.grabOffsetX || 0)
    const grabOffsetY = grabStart ? y - y0 : (s.grabOffsetY || 0)
    const newX = beingDragged ? x1 + grabOffsetX : x
    const newY = beingDragged ? y1 + grabOffsetY : y
    const snappedNewX = snapToGrid(newX)
    const snappedNewY = snapToGrid(newY)
    const deltaX = s.x1 - s.x0
    const deltaY = s.y1 - s.y0
    const length = vectorLength(deltaX, deltaY)
    const result = Object.assign({}, s, {
      x: snappedNewX,
      y: snappedNewY,
      x0: snappedNewX,
      y0: snappedNewY,
      x1: snappedNewX + deltaX,
      y1: snappedNewY + deltaY,
      rotation: Math.atan2(deltaY, deltaX) * 180 / Math.PI,
      unconstrainedX: newX,
      unconstrainedY: newY,
      width: snapToGridUp(length),
      height: 0,
      length,
      beingDragged,
      grabOffsetX,
      grabOffsetY
    })
    return result
  }

  // todo think of alternatives for increasing object type variety
  const nextShapeFunction = {rectangle: nextRectangle, line: nextLine}

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
    const previousState = this.value || {shapes: primedShapes, dropHappened: false, down: false}
    const releaseHappened = previousState.down && !down // ie. just released
    const droppedShape = releaseHappened && previousState.draggedShape
    const previousShapeState = previousState.shapes
    if(releaseHappened && droppedShape && droppedShape.shape === 'rectangle') {
      const lines = previousShapeState.filter(s => s.shape === 'line')
      let closestSnappableHorizontalLine = null
      let closestSnappableHorizontalLineDistance = Infinity
      let closestSnappableVerticalLine = null
      let closestSnappableVerticalLineDistance = Infinity
      for(let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const distFromHorizontal = Math.abs(droppedShape.y - line.y0)
        const distFromVertical = Math.abs(droppedShape.x - line.x0)
        if(distFromHorizontal < closestSnappableHorizontalLineDistance && distFromHorizontal <= snapDistance && isHorizontal(line)) {
          closestSnappableHorizontalLine = line
          closestSnappableHorizontalLineDistance = distFromHorizontal
        }
        if(distFromVertical < closestSnappableVerticalLineDistance && distFromVertical <= snapDistance && isVertical(line)) {
          closestSnappableVerticalLine = line
          closestSnappableVerticalLineDistance = distFromHorizontal
        }
      }
      if(closestSnappableHorizontalLine) {
        previousShapeState.find(s => s.key === droppedShape.key).yConstraint = closestSnappableHorizontalLine.key
      }
      if(closestSnappableVerticalLine) {
        previousShapeState.find(s => s.key === droppedShape.key).xConstraint = closestSnappableVerticalLine.key
      }
    }
    const hoveredShape = hoveredAt(previousShapeState, cursor.x, cursor.y, Infinity)
    const dragInProgress = down && previousShapeState.reduce((prev, next) => prev || next.beingDragged, false)
    const constraints = {}
    previousShapeState.filter(s => s.shape === 'line').forEach(s => constraints[s.key] = s)
    const result = {
      hoveredShape,
      down,
      draggedShape: dragInProgress &&
      hoveredShape,
      shapes: previousShapeState.map(s => nextShapeFunction[s.shape](down, dragInProgress, hoveredShape, dragStartCandidate, x0, y0, x1, y1, constraints, s))
    }
    return result
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