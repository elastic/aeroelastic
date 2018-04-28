const {
        select,
        selectReduce
      } = require('./state')

const {
        freeDragZ,
        freeColor,
        pad,
        markerProximityDistance,
        snapEngageDistance,
        snapReleaseDistance,
        enforceAlignment
      } = require('../example/mockConfig')

const {flatten} = require('./functional')

const matrix = require('./matrix')


/**
 * Selectors directly from a state object
 */

const shapeAdditions = state => state.shapeAdditions
const primaryUpdate = state => state.primaryUpdate
const scene = state => state.currentScene


/**
 * Pure calculations
 */

const rectCenter =      (      ) => [ 0,  0,  0,  0]
const rectLeft =        ({a   }) => [-a,  0,  0,  0]
const rectRight =       ({a   }) => [ a,  0,  0,  0]
const rectTop =         ({   b}) => [ 0, -b,  0,  0]
const rectBottom =      ({   b}) => [ 0,  b,  0,  0]
const rectTopLeft =     ({a, b}) => [-a, -b,  0,  0]
const rectTopRight =    ({a, b}) => [ a, -b,  0,  0]
const rectBottomLeft =  ({a, b}) => [-a,  b,  0,  0]
const rectBottomRight = ({a, b}) => [ a,  b,  0,  0]

// set of shapes under a specific point
const shapesAtPoint = (shapes, x, y) => shapes.filter(shape => {
  return withinBounds(shape.x - shape.a - pad, shape.x + shape.a + pad, x)
    && withinBounds(shape.y - shape.b - pad, shape.y + shape.b + pad, y)
})

// pick top shape out of possibly several shapes (presumably under the same point)
const topShape = shapes => shapes.reduce((prev, next) => {
  return prev.z > next.z ? prev : next
}, {z: -Infinity})

// returns the shape - closest to the reader in the Z-stack - that the reader hovers over with the mouse
const hoveringAt = (shapes, {x, y}) => {
  const hoveredShapes = shapesAtPoint(shapes, x, y)
  return topShape(hoveredShapes)
}

const vectorLength = (x, y) => Math.sqrt(x * x + y * y)
const pointDistance = (x0, y0, x1, y1) => vectorLength(x1 - x0, y1 - y0)

const isHorizontal = line => line.b === 0
const isVertical = line => line.a === 0
const isHorizontalDirection = direction => direction === 'horizontal'
const isLine = shape => shape.type === 'line'
const allLines = shapes => shapes.filter(isLine)

const anchorOriginMap = {
  top: 'unconstrainedY',
  middle: 'unconstrainedY',
  bottom: 'unconstrainedY',
  left: 'unconstrainedX',
  center: 'unconstrainedX',
  right: 'unconstrainedX'
}

const anchorOrigin = (shape, anchor) => shape[anchorOriginMap[anchor]]

// fixme do it more nicely and more efficiently
const anchorOffsetMap = shape => ({
  top: -shape.b,
  middle: 0,
  bottom: shape.b,
  left: -shape.a,
  center: 0,
  right: shape.a
})

const anchorOffset = (shape, anchor) => anchorOffsetMap(shape)[anchor]
const anchorValue = (shape, anchor) => anchorOrigin(shape, anchor) + anchorOffset(shape, anchor)

// lower bound of the (actual, eg. snapped) extent for a specific dimension
const low = (shape, direction) => direction === 'horizontal' ? shape.y - shape.b : shape.x - shape.a

// upper bound of the (actual, eg. snapped) extent for a specific dimension
const high = (shape, direction) => direction === 'horizontal' ? shape.y + shape.b : shape.x + shape.a

// midpoint of a shape (in terms of its unconstrained location) for a specific dimension
// currently the center/middle points attach, not yet the corners
const unconstrainedMidPoint = (shape, direction) => direction === 'horizontal' ? shape.unconstrainedY : shape.unconstrainedX

// is the point within the extent?
const withinBounds = (low, high, point) => low <= point && point <= high

// clamp the value to the range determined by the interval bounds [low ... high]
const clamp = (low, high, value) => Math.max(low, Math.min(high, value))

// common values for subsequent calculations
const sectionOvershootDescriptor = (direction, free, fixed) => {
  const freePoint = unconstrainedMidPoint(free, direction)
  const setLo = low(fixed, direction)
  const setHi = high(fixed, direction)
  const loHiConstrained = clamp(setLo, setHi, freePoint)
  // calculate which vertex (section end) is breached by freePoint; NaN if not breached
  const nearerSectionVertex = loHiConstrained === freePoint ? NaN : loHiConstrained
  return {freePoint, setLo, setHi, nearerSectionVertex}
}

// returns zero if the free point is within the section (projected to the specified dimension), or otherwise the overshoot
// relative to the closer section endpoint
const sectionOvershoot = (direction, free, fixed) => {
  const {freePoint, setLo, setHi, nearerSectionVertex} = sectionOvershootDescriptor(direction, free, fixed)
  // negative if undershoot; positive if overshoot; zero if within section
  return withinBounds(setLo, setHi, freePoint) ? 0 : freePoint - nearerSectionVertex
}

// returns the free point if it's within the section (projected to the specified dimension),
// or otherwise the closer section endpoint
const sectionConstrained = (direction, free, fixed) => {
  const {freePoint, setLo, setHi, nearerSectionVertex} = sectionOvershootDescriptor(direction, free, fixed)
  return withinBounds(setLo, setHi, freePoint) ? freePoint : nearerSectionVertex
}

// returns the snap line and the attracted anchor of draggedShape for the closest snap line, if it's close enough to snap
const snapGuideLine = (lines, shape, direction) => {
  const horizontalDirection = isHorizontalDirection(direction)
  const possibleSnapPoints = horizontalDirection ? ['left', 'center', 'right'] : ['top', 'middle', 'bottom']
  const preexistingConstraint = horizontalDirection ? shape.xConstraint : shape.yConstraint
  // let's find the snap line / anchor combo with the shortest snapDistance
  return possibleSnapPoints.reduce((prev, anchor) => {
    const anchorPoint = anchorValue(shape, anchor)
    return lines
      .filter(line => {
        return !line.alignment
          || (!horizontalDirection || horizontalConstraint(line) === anchor)
          && (horizontalDirection || verticalConstraint(line) === anchor)
      })
      .reduce((prev, line) => {
        const perpendicularDistance = Math.abs(anchorPoint - (horizontalDirection ? line.x : line.y))
        const parallelDistance = sectionOvershoot(direction, shape, line)
        // ^ parallel distance from section edge is also important: pulling a shape off a guideline tangentially must remove
        // the snapping
        const distance = vectorLength(parallelDistance, perpendicularDistance) // or just Math.max()
        // distanceThreshold depends on whether we're engaging the snap or prying it apart - mainstream tools often have
        // such a snap hysteresis
        const distanceThreshold = preexistingConstraint === line.key ? snapReleaseDistance : snapEngageDistance
        const closerLineFound = distance < prev.distance && distance <= distanceThreshold
        return closerLineFound ? {line, anchor, distance} : prev
      }, prev)
  }, {line: null, anchor: null, distance: Infinity})
}

const cursorPositionAction = action => action && action.actionType === 'cursorPosition' ? action.payload : null
const mouseButtonEventAction = action => action && action.actionType === 'mouseEvent' ? action.payload : null
const shapeEventAction = action => action && action.actionType === 'shapeEvent' ? action.payload : null
const alignEventAction = action => action && action.actionType === 'align' ? action.payload : null

// a key based lookup of snap guide lines
const constraintLookup = shapes => {
  const constraints = {}
  shapes.filter(isLine).forEach(shape => constraints[shape.key] = shape)
  return constraints
}

// returns the currently dragged shape, or a falsey value otherwise
const draggingShape = ({draggedShape, shapes}, hoveredShape, down, mouseDowned) => {
  const dragInProgress = down && shapes.reduce((prev, next) => prev || next.key === draggedShape.key, false)
  return dragInProgress && draggedShape  || down && mouseDowned && hoveredShape
}

// true if the two lines are parallel
const parallel = (line1, line2) => isHorizontal(line1) === isHorizontal(line2)

// shape updates may include newly added shapes, deleted or modified shapes
const updateShapes = (preexistingShapes, shapeUpdates) => {
  // Shell function - this is now a simple OR ie in the PoC it initializes with the given mock states; no more update happens
  // A real function must handle additions, removals and updates, merging the new info into the current shape state.
  return preexistingShapes || shapeUpdates
}

const horizontalAlignmentMap = ({alignRight: 'right', alignLeft: 'left', alignCenter: 'center', alignRemove: null})
const verticalAlignmentMap = ({alignRight: 'top', alignLeft: 'bottom', alignCenter: 'middle', alignRemove: null})
// ^ fixme generalize these misnomers to eg. alignStart / alignMiddle / alignEnd or similar

// mapping alignments to constraints
const horizontalConstraint = constraint => enforceAlignment && horizontalAlignmentMap[constraint.alignment]
const verticalConstraint = constraint => enforceAlignment && verticalAlignmentMap[constraint.alignment]

// The horizontal dimension (x) is mainly constrained by, naturally, the xConstraint (vertical snap line), but if there's no
// xConstraint is present,then it still needs to observe whether a yConstraint (horizontal snap section) end vertex is
// breached - you can horizontally pull a rectangle off a horizontal line, and the snap needs to break/establish in this
// direction too. In other words, since the constraints are sections, not infinite lines, a constraining section applies to
// both dimensions.
const nextConstraintX = (xConstraint, yConstraint, previousShape) => {
  return xConstraint
    ? xConstraint.x - anchorOffset(previousShape, horizontalConstraint(xConstraint) || previousShape.xConstraintAnchor)
    : (yConstraint && (sectionConstrained('vertical', previousShape, yConstraint) - anchorOffset(previousShape, 'center')))
}

const nextConstraintY = (xConstraint, yConstraint, previousShape) => {
  return yConstraint
    ? yConstraint.y - anchorOffset(previousShape, verticalConstraint(yConstraint) || previousShape.yConstraintAnchor)
    : (xConstraint && (sectionConstrained('horizontal', previousShape, xConstraint) - anchorOffset(previousShape, 'middle')))
}

const shapeConstraintUpdate = (shapes, snapGuideLines, shape) => {
  const {line: verticalSnap, anchor: horizontAnchor} = snapGuideLine(snapGuideLines.filter(isVertical), shape, 'horizontal')
  const {line: horizontSnap, anchor: verticalAnchor} = snapGuideLine(snapGuideLines.filter(isHorizontal), shape, 'vertical')
  return {
    xConstraint: verticalSnap && verticalSnap.key,
    yConstraint: horizontSnap && horizontSnap.key,
    xConstraintAnchor: horizontAnchor,
    yConstraintAnchor: verticalAnchor
  }
}

const dragUpdate = (shape, constraints, x0, y0, x1, y1, mouseDowned, hoveredEdgeMarker) => {
  if(hoveredEdgeMarker) {
    const grabStart = mouseDowned
    const grabOffsetX = grabStart ? shape.x - x0 : (shape.grabOffsetX || 0)
    const grabOffsetY = grabStart ? shape.y - y0 : (shape.grabOffsetY || 0)
    const x = x0 + grabOffsetX
    const y = y0 + grabOffsetY

    return {
      x,
      y,
      unconstrainedX: x,
      unconstrainedY: y,
      grabOffsetX,
      grabOffsetY,
      scaleX: hoveredEdgeMarker.horizontal ? shape.scaleX : 0.5,
      scaleY: hoveredEdgeMarker.horizontal ? 0.5 : shape.scaleY
    }

  } else {
    const grabStart = mouseDowned
    const grabOffsetX = grabStart ? shape.x - x0 : (shape.grabOffsetX || 0)
    const grabOffsetY = grabStart ? shape.y - y0 : (shape.grabOffsetY || 0)
    const x = x1 + grabOffsetX
    const y = y1 + grabOffsetY
    return {
      x,
      y,
      unconstrainedX: x,
      unconstrainedY: y,
      grabOffsetX,
      grabOffsetY,
    }
  }
}

const snapUpdate = (constraints, shape) => {
  const xConstraintPrevious = constraints[shape.xConstraint]
  const yConstraintPrevious = constraints[shape.yConstraint]
  const x = nextConstraintX(xConstraintPrevious, yConstraintPrevious, shape)
  const y = nextConstraintY(xConstraintPrevious, yConstraintPrevious, shape)
  return {
    ...!isNaN(x) && {x},
    ...!isNaN(y) && {y}
  }
}


/**
 * Gestures - derived selectors for transient state
 */

// dispatch the various types of actions
const rawCursorPosition = select(
  cursorPositionAction
)(primaryUpdate)

const mouseButtonEvent = select(
  mouseButtonEventAction
)(primaryUpdate)

const shapeEvent = select(
  shapeEventAction
)(primaryUpdate)

const alignEvent = select(
  d => {return alignEventAction(d)}
)(primaryUpdate)

const cursorPosition = selectReduce(
  (previous, position) => position || previous,
  {x: 0, y: 0}
)(rawCursorPosition)

const mouseIsDown = selectReduce(
  (previous, next) => next
    ? next.event === 'mouseDown'
    : previous,
  false
)(mouseButtonEvent)

/**
 * mouseButtonStateTransitions
 *
 *    View: http://stable.ascii-flow.appspot.com/#567671116534197027
 *    Edit: http://stable.ascii-flow.appspot.com/#567671116534197027/776257435
 *
 *
 *                             mouseIsDown
 *        initial state: 'up' +-----------> 'downed'
 *                        ^ ^                 +  +
 *                        | |  !mouseIsDown   |  |
 *           !mouseIsDown | +-----------------+  | mouseIsDown && movedAlready
 *                        |                      |
 *                        +----+ 'dragging' <----+
 *                                +      ^
 *                                |      |
 *                                +------+
 *                               mouseIsDown
 *
 */
const mouseButtonStateTransitions = (state, mouseIsDown, movedAlready) => {
  switch(state) {
    case 'up': return mouseIsDown ? 'downed' : 'up'
    case 'downed': return mouseIsDown ? (movedAlready ? 'dragging' : 'downed') : 'up'
    case 'dragging': return mouseIsDown ? 'dragging' : 'up'
  }
}

const mouseButtonState = selectReduce(
  ({buttonState, downX, downY}, mouseIsDown, {x, y}) => {
    const movedAlready = x !== downX || y !== downY
    const newButtonState = mouseButtonStateTransitions(buttonState, mouseIsDown, movedAlready)
    return {
      buttonState: newButtonState,
      downX: newButtonState === 'downed' ? x : downX,
      downY: newButtonState === 'downed' ? y : downY
    }
  },
  {buttonState: 'up', downX: null, downY: null}
)(mouseIsDown, cursorPosition)

const mouseDowned = select(
  state => state.buttonState === 'downed'
)(mouseButtonState)

const dragging = select(
  state => state.buttonState === 'dragging'
)(mouseButtonState)

const mouseClickEvent = select(
  event => event && event.event === 'mouseClick'
)(mouseButtonEvent)

const dragVector = select(
  ({buttonState, downX, downY}, {x, y}) => ({down: buttonState !== 'up', x0: downX, y0: downY, x1: x, y1: y})
)(mouseButtonState, cursorPosition)


/**
 * Scenegraph update based on events, gestures...
 */

const selectedShape = selectReduce(
  (prev, next) => next && (next.event === 'showToolbar' && next.shapeType === 'line' ? next.shapeKey : prev) || prev,
  null
)(shapeEvent)

const shapes = select((scene, externalShapeUpdates) => updateShapes(scene.shapes, externalShapeUpdates))(scene, shapeAdditions)
const hoveredShape = select(hoveringAt)(shapes, cursorPosition)
const draggedShape = select(draggingShape)(scene, hoveredShape, mouseIsDown, mouseDowned)
const constraints = select(constraintLookup)(shapes)
const alignUpdate = select(alignEvent => {
  // set alignment type on sticky line, if needed
  if(alignEvent) {
    const {event, shapeKey} = alignEvent
    return {shapeKey, alignment: event !== 'alignRemove' && event}
  }
})(alignEvent)

// the currently dragged shape is considered in-focus; if no dragging is going on, then the hovered shape
const focusedShape = select(
  (draggedShape, hoveredShape) => draggedShape || hoveredShape
)(draggedShape, hoveredShape)

// focusedShapes has updated position etc. information while focusedShape may have stale position
const focusedShapes = select(
  (shapes, focusedShape) => shapes.filter(shape => focusedShape && shape.key === focusedShape.key)
)(shapes, focusedShape)

const shapeEdgeMarkers = select(
  focusedShapes => flatten(focusedShapes
    .map(({key, a, b, transformMatrix, xConstraintAnchor, yConstraintAnchor}) => ([
      {key: key + ' top', transformMatrix: matrix.multiply(transformMatrix, matrix.translate(0, -b, 0)),
        snapped: yConstraintAnchor === 'top', horizontal: true, shapeKey: key},
      {key: key + ' right', transformMatrix: matrix.multiply(transformMatrix, matrix.translate(a, 0, 0)),
        snapped: xConstraintAnchor === 'right', horizontal: false, shapeKey: key},
      {key: key + ' bottom', transformMatrix: matrix.multiply(transformMatrix, matrix.translate(0, b, 0)),
        snapped: yConstraintAnchor === 'bottom', horizontal: true, shapeKey: key},
      {key: key + ' left', transformMatrix: matrix.multiply(transformMatrix, matrix.translate(-a, 0, 0)),
        snapped: xConstraintAnchor === 'left', horizontal: false, shapeKey: key}
    ]))
  ))(focusedShapes)

const shapeCenterMarkers = select(
  focusedShapes => flatten(focusedShapes
    .map(({key, transformMatrix, xConstraintAnchor, yConstraintAnchor}) => ([
      {key: key + ' center', transformMatrix: matrix.multiply(transformMatrix, matrix.translate(0, 0, 0.01)),
        snapped: xConstraintAnchor === 'center', horizontal: false, shapeKey: key},
      {key: key + ' middle', transformMatrix: matrix.multiply(transformMatrix, matrix.translate(0, 0, xConstraintAnchor === 'center' ? 0 : 0.02)),
        snapped: yConstraintAnchor === 'middle', horizontal: true, shapeKey: key}
    ]))
  ))(focusedShapes)

const hoveredEdgeMarker = select((shapeEdgeMarkers, {x, y}) => {
  const closest = shapeEdgeMarkers.reduce(
    (previous, marker) => {
      const [x1, y1] = matrix.mvMultiply(marker.transformMatrix, matrix.ORIGIN)
      const distance = pointDistance(x, y, x1, y1)
      return distance < previous.distance ? {distance, marker} : previous
    },
    {distance: Infinity, marker: null}
  )
  const hoveredMarker = closest.distance < markerProximityDistance ? closest.marker : null
  return hoveredMarker
})(shapeEdgeMarkers, cursorPosition)

const dragStartAt = selectReduce(
  (previous, mouseDowned, {down, x0, y0, x1, y1}, focusedShape) => {
    if(down) {
      const newDragStart = mouseDowned && !previous.down
      return newDragStart
        ? {down, x: x1, y: y1, dragStartShape: focusedShape}
        : previous
    } else {
      return {down: false}
    }
  },
  {down: false}
)(dragging, dragVector, focusedShape)

// affordance for permanent selection of a shape
const newShapeEvent = select(
  (click, shape, {x, y}) =>
    click && {event: 'showToolbar', x, y, shapeKey: shape && shape.key, shapeType: shape && shape.type}
)(mouseClickEvent, focusedShape, cursorPosition)

// returns those snap guidelines that may affect the draggedShape
const snapGuideLines = select(
  (shapes, draggedShape) => {
    // The guidelines may come from explicit guidelines (as in the mock of this PoC) or generated automatically in the future
    // so that dragging a shape dynamically traces other shapes, flashing temporary alignment lines, example snap guides
    // here: https://i.imgur.com/QKrK6.png
    if(draggedShape) {
      const allGuideLines = allLines(shapes)
      return isLine(draggedShape)
        ? allGuideLines.filter(line => !parallel(line, draggedShape))
        : allGuideLines
    } else {
      return [] // snap lines are in practice nonexistent if there's no ongoing dragging
    }
  }
)(shapes, draggedShape)

const nextShapes = select(
  (shapes, draggedShape, {x0, y0, x1, y1}, alignUpdate, constraints, snapGuideLines, mouseDowned, hoveredEdgeMarker) => {

    // this is the per-shape model update at the current PoC level
    return shapes.map(shape => {
      const beingDragged = draggedShape && draggedShape.key === shape.key
      return {
        // update the preexisting shape:
        ...shape,
        // with the effect of dragging:
        ...beingDragged && dragUpdate(shape, constraints, x0, y0, x1, y1, mouseDowned, hoveredEdgeMarker),
        // and the effect of establishing / breaking snap connections:
        ...beingDragged && shapeConstraintUpdate(shapes, snapGuideLines, shape),
        // and following any necessary snapping due to establishing / breaking snap constraints:
        ...snapUpdate(constraints, shape),
        // and updating a possible alignment constraint on a snap line:
        ...alignUpdate && shape.key === alignUpdate.shapeKey && {alignment: alignUpdate.alignment}
      }
    })
  }
)(shapes, draggedShape, dragVector, alignUpdate, constraints, snapGuideLines, mouseDowned, hoveredEdgeMarker)

// currently the determination of transform data is done in this post-processing step; in future versions, the operations
// themselves (drag etc.) will directly maintain the transform data

const transformShape = shape => {
  const {x, y, z, rotation, scaleY} = shape
  const translationMatrix = matrix.translate(x, y, z)
  // minor optimization for the common case of no rotation:
  const transformMatrix = rotation
    ? matrix.multiply(translationMatrix, matrix.rotateZ(rotation))
    : scaleY ? matrix.multiply(translationMatrix, matrix.scale(1, scaleY, 1)) : translationMatrix
  return {
    ...shape,
    transformMatrix: transformMatrix,
    transform3d: 'matrix3d(' + transformMatrix.join(',') + ')'
  }
}

const transformShapes = shapes => shapes.map(transformShape)

const transformedShapes = select(
  transformShapes
)(nextShapes)

// free shapes are for showing the unconstrained location of the shape(s) being dragged
const currentFreeShapes = select(
  (shapes, {dragStartShape}) =>
    shapes
      .filter(shape => dragStartShape && shape.key === dragStartShape.key)
      .map(shape => ({...shape, x: shape.unconstrainedX, y: shape.unconstrainedY, z: freeDragZ, backgroundColor: freeColor}))
      .map(transformShape)
)(shapes, dragStartAt)

// this is the core scenegraph update invocation: upon new cursor position etc. emit the new scenegraph
// it's _the_ state representation (at a PoC level...) comprising of transient properties eg. draggedShape, and the
// collection of shapes themselves
const nextScene = select(
  (hoveredShape, draggedShape, shapes) => ({
    hoveredShape,
    draggedShape,
    shapes
  })
)(hoveredShape, draggedShape, transformedShapes)

module.exports = {
  cursorPosition, mouseIsDown, dragStartAt, shapeEdgeMarkers, shapeCenterMarkers,
  nextScene, focusedShape, selectedShape, currentFreeShapes, hoveredEdgeMarker,
  shapeAdditions, primaryUpdate, newShapeEvent, shapes, focusedShapes
}