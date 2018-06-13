const {
        select,
        selectReduce
      } = require('./state')

const {
        dragging,
        dragVector,
        cursorPosition,
        gestureEnd,
        metaHeld,
        mouseButton,
        mouseDowned,
        mouseIsDown,
        pressedKeys,
      } = require('./gestures')

const { shapesAt } = require('./geometry')

const matrix = require('./matrix')

const config = require('./config')

const {identity, disjunctiveUnion, unnest} = require('./functional')

/**
 * Selectors directly from a state object
 */

const primaryUpdate = state => state.primaryUpdate
const scene = state => state.currentScene


/**
 * Pure calculations
 */

// returns the currently dragged shape, or a falsey value otherwise
const draggingShape = ({draggedShape, shapes}, hoveredShape, down, mouseDowned) => {
  const dragInProgress = down && shapes.reduce((prev, next) => prev || draggedShape && next.id === draggedShape.id, false)
  const result = dragInProgress && draggedShape || down && mouseDowned && hoveredShape
  //console.log(result)
  return result
}


/**
 * Scenegraph update based on events, gestures...
 */

const shapes = select(scene => scene.shapes)(scene)

const hoveredShapes = select(
  (shapes, cursorPosition) => shapesAt(shapes, cursorPosition),
)(shapes, cursorPosition)

const hoveredShape = selectReduce(
  (prev, hoveredShapes) => {
    if(hoveredShapes.length) {
      const depthIndex = (prev.depthIndex + 1) % hoveredShapes.length
      //console.log(depthIndex, hoveredShapes.map(s => s.id))
      return {
        shape: hoveredShapes[prev.depthIndex],
        depthIndex
      }
    } else {
      return {
        shape: null,
        depthIndex: 0
      }
    }
  },
  {
    shape: null,
    depthIndex: 0
  },
  tuple => tuple.shape
)(hoveredShapes)

const draggedShape = select(draggingShape)(scene, hoveredShape, mouseIsDown, mouseDowned)

// the currently dragged shape is considered in-focus; if no dragging is going on, then the hovered shape
const focusedShape = select(
  (draggedShape, hoveredShape) => draggedShape || hoveredShape
)(draggedShape, hoveredShape)

// focusedShapes has updated position etc. information while focusedShape may have stale position
const focusedShapes = select(
  (shapes, focusedShape) => shapes.filter(shape => focusedShape && shape.id === focusedShape.id)
)(shapes, focusedShape)

const dragStartAt = selectReduce(
  (previous, mouseDowned, {down, x0, y0, x1, y1}, focusedShape) => {
    if(down) {
      const newDragStart = mouseDowned && !previous.down
      console.log(newDragStart ? focusedShape : previous.dragStartShape)
      return newDragStart
        ? {down, x: x1, y: y1, dragStartShape: focusedShape}
        : previous
    } else {
      return {down: false}
    }
  },
  {down: false}
)(dragging, dragVector, focusedShape)

const keyTransformGesture = select(
  keys => {
    const result = Object.keys(keys)
      .map(keypress => {
        switch(keypress) {
          case 'KeyW': return matrix.translate(0, -5, 0)
          case 'KeyA': return matrix.translate(-5, 0, 0)
          case 'KeyS': return matrix.translate(0, 5, 0)
          case 'KeyD': return matrix.translate(5, 0, 0)
          case 'KeyF': return matrix.translate(0, 0, -20)
          case 'KeyC': return matrix.translate(0, 0, 20)
          case 'KeyX': return matrix.rotateX(Math.PI / 45)
          case 'KeyY': return matrix.rotateY(Math.PI / 45 / 1.3)
          case 'KeyZ': return matrix.rotateZ(Math.PI / 45 / 1.6)
          case 'KeyI': return matrix.scale(1, 1.05, 1)
          case 'KeyJ': return matrix.scale(1 / 1.05, 1, 1)
          case 'KeyK': return matrix.scale(1, 1 / 1.05, 1)
          case 'KeyL': return matrix.scale(1.05, 1, 1)
          case 'KeyP': return matrix.perspective(2000)
          case 'KeyR': return matrix.shear(0.1, 0)
          case 'KeyT': return matrix.shear(-0.1, 0)
          case 'KeyU': return matrix.shear(0, 0.1)
          case 'KeyH': return matrix.shear(0, -0.1)
        }
      })
      .filter(identity)
    return result
  }
)(pressedKeys)

const mouseTransformGesture = selectReduce(
  (prev, dragging, {x0, y0, x1, y1}) => {
    if(dragging) {
      const deltaX = x1 - x0
      const deltaY = y1 - y0
      const transform = matrix.translate(deltaX - prev.deltaX, deltaY - prev.deltaY, 0)
      return {
        deltaX,
        deltaY,
        transform
      }
    } else {
      // reset - extract the common object literal?
      return {
        deltaX: 0,
        deltaY: 0,
        transform: null
      }
    }
  },
  {
    deltaX: 0,
    deltaY: 0,
    transform: null
  },
  tuple => [tuple.transform].filter(identity)
)(dragging, dragVector)

const transformGesture = select(
  (keyTransformGesture, mouseTransformGesture) => keyTransformGesture.concat(mouseTransformGesture)
)(keyTransformGesture, mouseTransformGesture)

const shapeAddGesture = select(
  keys => Object.keys(keys).indexOf('KeyN') !== -1
)(pressedKeys)

const rand128 = () => 128 + Math.floor(128 * Math.random())

const shapeAddEvent = select(
  action => action && action.type === 'shapeAddEvent' ? action.payload : null,
)(primaryUpdate)

const restateShapesEvent = select(
  action => action && action.type === 'restateShapesEvent' ? action.payload : null,
)(primaryUpdate)

// todo remove this test function
const enteringShapes = select(
  (source1, source2) => {

      const fromSource1 = source1 && {
        id: 'newRect' + Math.random(),
        type: 'rectangle', localTransformMatrix: matrix.multiply(
          matrix.translate(2 * rand128() - 256, 2 * rand128() - 256, 4 * rand128() - 768),
          matrix.rotateX(Math.random() * 2 * Math.PI),
          matrix.rotateY(Math.random() * 2 * Math.PI),
          matrix.rotateZ(Math.random() * 2 * Math.PI)
        ),
        transformMatrix: matrix.translate(425, 290, 5), a: rand128(), b: rand128(),
        backgroundColor: `rgb(${rand128()},${rand128()},${rand128()})`,
        parent: 'rect1'
      }
      const fromSource2 = source2
      return [fromSource1, fromSource2].filter(identity)

  })(shapeAddGesture, shapeAddEvent)

const initialSelectedShapeState = {
  shapes: [],
  uid: null,
  depthIndex: 0,
  down: false,
  metaHeld: false,
  metaChanged: false
}

const singleSelect = (prev, hoveredShapes, metaHeld, down, uid) => {
  // cycle from top ie. from zero after the cursor position changed ie. !sameLocation
  const metaChanged = metaHeld !== prev.metaHeld
  const depthIndex = config.depthSelect && !metaChanged && metaHeld ? (prev.depthIndex + (down && !prev.down ? 1 : 0)) % hoveredShapes.length : 0
  if(!down) {
    // take action on mouse down only
    return {...prev, down, uid, metaHeld, metaChanged}
  }
  return hoveredShapes.length
    ? {
      shapes: [hoveredShapes[depthIndex]],
      uid,
      depthIndex,
      down,
      metaHeld,
      metaChanged: depthIndex === prev.depthIndex ? metaChanged : false
    }
    : {...initialSelectedShapeState, uid, down, metaHeld, metaChanged}
}

const multiSelect = (prev, hoveredShapes, metaHeld, down, uid) => {
  if(!down) return {...prev, uid}
  return {
    shapes: hoveredShapes.length
      ?  disjunctiveUnion(shape => shape.id, prev.shapes, hoveredShapes)
      : [],
    uid
  }
}

const selectedShapes = selectReduce(
  (prev, hoveredShapes, {down, uid}, metaHeld) => {
    if(uid === prev.uid) return prev
    const selectFunction = config.singleSelect ? singleSelect : multiSelect
    return selectFunction(prev, hoveredShapes, metaHeld, down, uid)
  },
  initialSelectedShapeState,
  d => d.shapes
)(hoveredShapes, mouseButton, metaHeld)

const selectedShapeIds = select(
  shapes => shapes.map(shape => shape.id)
)(selectedShapes)

const rotationManipulation = ({transform, shape, directShape}) => {
  if(!shape ||!directShape) return {transforms: [], shapes: []}
  const oldLoc = directShape.transformMatrix
  const newLoc = matrix.multiply(oldLoc, transform)
  const center = shape.transformMatrix
  console.log('center', center[12], center[13], 'oldLoc', oldLoc[12], oldLoc[13], 'newLoc', newLoc[12], newLoc[13])
  const oldLAngle = Math.atan2(center[13] - oldLoc[13], center[12] - oldLoc[12])
  const newLAngle = Math.atan2(center[13] - newLoc[13], center[12] - newLoc[12])
  const angle = newLAngle - oldLAngle
  const result = matrix.rotateZ(-angle)
  //console.log(shape.id, directShape.id)
  return {transforms: [result], shapes: [shape.id]}
}

const directShapeManipulation = (transforms, directShapes) => {
  const shapes = directShapes.map(shape => shape.type !== 'annotation' && shape.id).filter(identity)
  return {transforms, shapes}
}

const annotationManipulation = (directTransforms, directShapes, allShapes) => {
  const shapeIds = directShapes.map(shape => shape.type === 'annotation' && shape.subtype === 'rotationHandle' && shape.parent)
  const shapes = shapeIds.map(id => id && allShapes.find(shape => shape.id === id))
  const tuples = unnest(shapes.map((shape, i) => directTransforms.map(transform => ({transform, shape, directShape: directShapes[i]}))))
  return tuples.map(rotationManipulation)
}

const transformIntents = select(
  (transforms, directShapes, shapes) => ([
    directShapeManipulation(transforms, directShapes),
    ...annotationManipulation(transforms, directShapes, shapes)
  ])
)(transformGesture, selectedShapes, shapes)

const fromScreen = currentTransform => transform => {
  const isTranslate = transform[12] !== 0 || transform[13] !== 0
  if(isTranslate) {
    const composite = matrix.compositeComponent(currentTransform)
    const inverse = matrix.invert(composite)
    const result = matrix.translateComponent(matrix.multiply(inverse, transform))
    return result
  } else {
    return transform
  }
}

const shapeApplyLocalTransforms = transformIntents => shape => {
  const nestedMappedIntents = transformIntents.map(transformIntent => transformIntent.transforms.length && transformIntent.shapes.find(id => id === shape.id) && transformIntent.transforms.map(fromScreen(shape.localTransformMatrix))).filter(identity)
  const mappedIntents = unnest(nestedMappedIntents)
  const localTransformMatrix = mappedIntents.length && matrix.applyTransforms(
    mappedIntents,
    shape.localTransformMatrix
  )
  const result = {
    // update the preexisting shape:
    ...shape,
    // apply transforms (holding multiple keys applies multiple transforms simultaneously, so we must reduce)
    ...mappedIntents.length && {
      localTransformMatrix
    }
  }
  return result
}

const applyLocalTransforms = (shapes, transformIntents) => {
  return shapes.map(shapeApplyLocalTransforms(transformIntents))
}

const getUpstreamTransforms = (shapes, shape) => shape.parent
  ? getUpstreamTransforms(shapes, shapes.find(s => s.id === shape.parent)).concat([shape.localTransformMatrix])
  : [shape.localTransformMatrix]

const getUpstreams = (shapes, shape) => shape.parent
  ? getUpstreams(shapes, shapes.find(s => s.id === shape.parent)).concat([shape])
  : [shape]

const shapeCascadeTransforms = shapes => shape => {
  const upstreams = getUpstreams(shapes, shape)
  const upstreamTransforms = upstreams.map(shape => shape.localTransformMatrix)
  const cascadedTransforms = matrix.reduceTransforms(upstreamTransforms)
  return {
    ...shape,
    transformMatrix: cascadedTransforms
  }
}

const cascadeTransforms = shapes => shapes.map(shapeCascadeTransforms(shapes))

const nextShapes = select(
  (preexistingShapes, enteringShapes, restated) => {
    if(restated && restated.newShapes) {
      return restated.newShapes
    }
    // this is the per-shape model update at the current PoC level
    return preexistingShapes.concat(enteringShapes)
  }
)(shapes, enteringShapes, restateShapesEvent)

// todo move to geometry.js
const getExtremum = (transformMatrix, d, dim, k, l, mult1, mult2) => {
  const u = k * mult1 * (dim ? d.b : d.a)
  const v = l * mult2 * (dim ? d.a : d.b)
  const unitVector = dim ? [v, u, 0, 1] : [u, v, 0, 1]
  const projection = matrix.normalize(matrix.mvMultiply(transformMatrix, unitVector))
  return [projection[dim ? 1 : 0], projection[dim ? 0 : 1]]
}

// todo move to geometry.js
const getCorners = (transformMatrix, d, dim, k, l) => ([
  getExtremum(transformMatrix, d, dim, k, l, 1, 1),
  getExtremum(transformMatrix, d, dim, k, l, 1, -1),
  getExtremum(transformMatrix, d, dim, k, l, -1, 1),
  getExtremum(transformMatrix, d, dim, k, l, -1, -1)
])

const alignmentGuides = (shapes, guidedShapes) => {
  ///console.log('guidedShapes:', guidedShapes.map(s => s.id))
  const result = {}
  let counter = 0
  // todo replace for loops with [].map calls; DRY it up, break out parts; several of which to move to geometry.js
  // todo switch to informative variable names
  for(let i = 0; i < guidedShapes.length; i++) {
    const d = guidedShapes[i]
    if(d.type === 'annotation') continue
    const dTransformMatrix = d.transformMatrix
    for(let j = 0; j < shapes.length; j++) {
      const s = shapes[j]
      if(d.id === s.id) continue
      if(s.type === 'annotation') continue
      const sTransformMatrix = s.transformMatrix
      for(let k = -1; k < 2; k++) {
        for(let l = -1; l < 2; l++) {
          if(k && !l || !k && l) continue // don't worry about midpoints of the edges, only the center
          for(let dim = 0; dim < 2; dim++) {

            // four corners of the dragged shape
            const ddArray = getCorners(dTransformMatrix, d, dim, k, l)

            // four corners of the stationery shape
            const ssArray = getCorners(sTransformMatrix, s, dim, l, k)

            const dd = (k || 1) * Math.max(...ddArray.map(v => (k || 1) * v[0]))
            const ss = (l || 1) * Math.max(...ssArray.map(v => (l || 1) * v[0]))
            const key = k + '|' + dim
            const signedDistance = dd - ss
            const distance = Math.abs(signedDistance)
            const currentClosest = result[key]
            if(Math.round(distance) <= config.guideDistance && (!currentClosest || currentClosest && distance < currentClosest.distance)) {
              const orthogonalValues = ddArray.concat(ssArray).map(v => v[1])
              const lowPoint = Math.min(...orthogonalValues)
              const highPoint = Math.max(...orthogonalValues)
              const midPoint = (lowPoint + highPoint) / 2
              const radius  = midPoint - lowPoint
              result[key] = {
                id: counter++,
                transformMatrix: matrix.translate(dim ? midPoint : ss, dim ? ss : midPoint, 100),
                a: dim ? radius : 0.5,
                b: dim ? 0.5 : radius,
                distance,
                signedDistance,
                dimension: dim ? 'vertical' : 'horizontal',
                anchor: k ? 'upper' : 'lower',
                constrained: d.id,
                constrainer: s.id
              }
            }
          }
        }
      }
    }
  }
  return Object.values(result)
}

// initial simplification
const draggedShapes = select(
  (shapes, selectedShapeIds, mouseIsDown) => mouseIsDown ? shapes.filter(shape => selectedShapeIds.indexOf(shape.id) !== -1) : []
)(nextShapes, selectedShapeIds, mouseIsDown)

const isHorizontal = constraint => constraint.dimension === 'horizontal'
const isVertical = constraint => constraint.dimension === 'vertical'

const closestConstraint = (prev = {distance: Infinity}, next) =>
  next.distance < prev.distance ? {constraint: next, distance: next.distance} : prev

const directionalConstraint = (constraints, filterFun) => {
  const directionalConstraints = constraints.filter(filterFun)
  const closest = directionalConstraints.reduce(closestConstraint, undefined)
  return closest && closest.constraint
}

const alignmentGuideAnnotations = select(
  (shapes, guidedShapes) => {
    return guidedShapes.length
      ? alignmentGuides(shapes, guidedShapes).map(shape => ({
        ...shape,
        id: 'snapLine_' + shape.id,
        type: 'annotation',
        subtype: 'alignmentGuide',
        interactive: false,
        localTransformMatrix: shape.transformMatrix,
        backgroundColor: 'magenta'
      }))
      : []
  }
)(nextShapes, hoveredShapes)

const rotationAnnotations = select(
  (shapes, selectedShapes) => {
    const shapesToAnnotate = selectedShapes
    ///console.log('shapesToAnnotate =',shapesToAnnotate.map(s => s.id))
    //if(shapesToAnnotate.length && shapesToAnnotate[0].id === 'rotationHandle_0') debugger
    return shapesToAnnotate.map((shape, i) => {
      const foundShape = shapes.find(s => shape.id === s.id)
      if(!foundShape || foundShape.type === 'annotation') {
        // preserve any interactive annotation when handling
        return foundShape.interactive && selectedShapes.find(shape => shape.id === foundShape.id)
      }
      const {id, b} = foundShape
      const centerTop = matrix.translate(0, -b, 0)
      const pixelOffset = matrix.translate(0, -config.rotateAnnotationOffset, 0)
      const transform = matrix.multiply(centerTop, pixelOffset)
      return {
        id: 'rotationHandle_' + i,
        type: 'annotation',
        subtype: 'rotationHandle',
        interactive: true,
        parent: id,
        localTransformMatrix: transform,
        backgroundColor: 'rgb(0,0,255,0.3)',
        a: 8,
        b: 8
      }
    }).filter(identity)}
)(nextShapes, selectedShapes)

// not all annotations can interact
const interactiveAnnotations = rotationAnnotations // there will be more!

const interactedAnnotations = select(
  (interactiveAnnotations, draggedShape) => {
    return draggedShape && interactiveAnnotations.filter(shape => shape.id === draggedShape.id)}
)(interactiveAnnotations, draggedShape)

const annotatedShapes = select(
  (shapes, alignmentGuideAnnotations, rotationAnnotations) => {
    const annotations = alignmentGuideAnnotations.concat(rotationAnnotations)
    // remove preexisting annotations
    const contentShapes = shapes.filter(shape => shape.type !== 'annotation')
    const constraints = annotations.filter(annotation => annotation.subtype === 'alignmentGuide')
    const horizontalConstraint = directionalConstraint(constraints, isHorizontal)
    const verticalConstraint = directionalConstraint(constraints, isVertical)
    const snappedShapes = contentShapes.map(shape => {
      const snapOffsetX = config.snapConstraint && horizontalConstraint && horizontalConstraint.constrained === shape.id
        ? -horizontalConstraint.signedDistance
        : 0
      const snapOffsetY = config.snapConstraint && verticalConstraint && verticalConstraint.constrained === shape.id
        ? -verticalConstraint.signedDistance
        : 0
      if(snapOffsetX || snapOffsetY) {
        const snapOffset = matrix.translate(snapOffsetX, snapOffsetY, 0)
        return {...shape, constrainedLocalTransformMatrix: matrix.multiply(shape.localTransformMatrix, snapOffset)}
      } else {
        return shape
      }
    })
    return snappedShapes
      .concat(annotations) // add current annotations
  }
)(nextShapes, alignmentGuideAnnotations, rotationAnnotations)

const reprojectedShapes = select(
  (shapes, draggedShape, {x0, y0, x1, y1}, mouseDowned, transformIntents) => {
    // per-shape model update of projections
    return cascadeTransforms(applyLocalTransforms(shapes, transformIntents))
  }
)(annotatedShapes, draggedShape, dragVector, mouseDowned, transformIntents)

// this is the core scenegraph update invocation: upon new cursor position etc. emit the new scenegraph
// it's _the_ state representation (at a PoC level...) comprising of transient properties eg. draggedShape, and the
// collection of shapes themselves
const nextScene = select(
  (hoveredShape, selectedShapes, shapes, gestureEnd) => {
    return {
      hoveredShape,
      selectedShapes,
      shapes,
      gestureEnd
    }
  }
)(hoveredShape, selectedShapeIds, reprojectedShapes, gestureEnd)

module.exports = {
  cursorPosition, mouseIsDown, /*dragStartAt, */dragVector,
  nextScene, focusedShape,
  primaryUpdate, shapes, focusedShapes, selectedShapes: selectedShapeIds
}

/**
 * General inputs to behaviors:
 *
 * 1. Mode: the mode the user is in. For example, clicking on a shape in 'edit' mode does something different (eg. highlight
 *    activation hotspots or show the object in a configuration tab) than in 'presentation' mode (eg. jump to a link, or just
 *    nothing). This is just an example and it can be a lot more granular, eg. a 2D vs 3D mode; perspective vs isometric;
 *    shape being translated vs resized vs whatever. Multiple modes can apply simultaneously. Modes themselves may have
 *    structure: simple, binary or multistate modes at a flat level; ring-like; tree etc. or some mix. Modes are generally
 *    not a good thing, so we should use it sparingly (see Bret Victor's reference to NOMODES as one of his examples in
 *    Inventing on Principle)
 *
 * 2. Focus: there's some notion of what the behaviors act on, for example, a shape we hover over or select; multiple
 *    shapes we select or lasso; or members of a group (direct descendants, or all descendants, or only all leafs). The
 *    focus can be implied, eg. act on whatever's currently in view. It can also arise hierarchical: eg. move shapes within
 *    a specific 'project' (normal way of working things, like editing one specific text file), or highlighting multiple
 *    shapes with a lasso within a previously focused group. There can be effects (color highlighting, autozooming etc.) that
 *    show what is currently in focus, as the user's mental model and the computer's notion of focus must go hand in hand.
 *
 * 3. Gesture: a primitive action that's raw input. Eg. moving the mouse a bit, clicking, holding down a modifier key or
 *    hitting a key. This is how the user acts on the scene. Can be for direct manipulation (eg. drag or resize) or it can
 *    be very modal (eg. a key acting in a specific mode, or a key or other gesture that triggers a new mode or cancels a
 *    preexisting mode). Gestures may be compose simultaneously (eg. clicking while holding down a modifier key) and/or
 *    temporally (eg. grab, drag, release). Ie. composition and finite state machine. But these could (should?) be modeled
 *    via submerging into specific modes. For example, grabbing an object and starting to move the mouse may induce the
 *    'drag' mode (within whatever mode we're already in). Combining modes, foci and gestures give us the typical design
 *    software toolbars, menus, palettes. For example, clicking (gesture) on the pencil icon (focus, as we're above it) will
 *    put us in the freehand drawing mode.
 *
 * 4. External variables: can be time, or a sequence of things triggered by time (eg. animation, alerting, data fetch...)
 *    or random data (for simulation) or a new piece of data from the server (in the case of collaborative editing)
 *
 * 5. Memory: undo/redo, repeat action, keyboard macros and time travel require that successive states or actions be recorded
 *    so they're recoverable later. Sometimes the challenge is in determining what the right level is. For example, should
 *    `undo` undo the last letter typed, or a larger transaction (eg. filling a field), or something in between, eg. regroup
 *    the actions and delete the lastly entered word sentence. Also, in macro recording, is actual mouse movement used, or
 *    something arising from it, eg. the selection on an object?
 *
 * Action: actions are granular, discrete pieces of progress along some user intent. Actions are not primary, except
 *         gestures. They arise from the above primary inputs. They can be hierarchical in that a series of actions (eg.
 *         selecting multiple shapes and hitting `Group`) leads to the higher level action of "group all these elements".
 *
 * All these are input to how we deduce _user intent_, therefore _action_. There can be a whirl of these things leading to
 * higher levels, eg. click (gesture) over an icon (focus) puts us in a new mode, which then alters what specific gestures,
 * modes and foci are possible; it can be an arbitrary graph. Let's try to characterize this graph...
 *
 */

/**
 * Selections
 *
 * On first sight, selection is simple. The user clicks on an Element, and thus the Element becomes selected; any previous
 * selection is cleared. If the user clicks anywhere else on the Canvas, the selection goes away.
 *
 * There are however wrinkles so large, they dwarf the original shape of the cloth:
 *
 * 1. Selecting occluded items
 *   a. by sequentially meta+clicking at a location
 *   b. via some other means, eg. some modal or non-modal popup box listing the elements underneath one another
 * 2. Selecting multiple items
 *   a. by option-clicking
 *   b. by rectangle selection or lasso selection, with requirement for point / line / area / volume touching an element
 *   c. by rectangle selection or lasso selection, with requirement for point / line / area / volume fully including an element
 *   d. select all elements of a group
 * 3. How to combine occluded item selection with multiple item selection?
 *   a. separate the notion of vertical cycling and selection (naive, otoh known by user, implementations conflate them)
 *   b. resort to the dialog or form selection (multiple ticks)
 *   c. volume aware selection
 * 4. Group related select
 *   a. select a group by its leaf node and drag the whole group with it
 *   b. select an element of a group and only move that (within the group)
 *   c. hierarchy aware select: eg. select all leaf nodes of a group at any level
 * 5. Composite selections (generalization of selecting multiple items)
 *   a. additive selections: eg. multiple rectangular brushes
 *   b. subtractive selection: eg. selecting all but a few elements of a group
 * 6. Annotation selection. Modeling controls eg. resize and rotate hotspots as annotations is useful because the
 *    display and interaction often goes hand in hand. In other words, a passive legend is but a special case of
 *    an active affordance: it just isn't interactive (noop). Also, annotations are useful to model as shapes
 *    because:
 *      a. they're part of the scenegraph
 *      b. hierarchical relations can be exploited, eg. a leaf shape or a group may have annotation that's locally
 *         positionable (eg. resize or rotate hotspots)
 *      c. the transform/projection math, and often, other facilities (eg. drag) can be shared (DRY)
 *    The complications are:
 *      a. clicking on and dragging a rotate handle shouldn't do the full selection, ie. it shouldn't get
 *         a 'selected' border, and the rotate handle shouldn't get a rotate handle of its own, recursively :-)
 *      b. clicking on a rotation handle, which is outside the element, should preserve the selected state of
 *         the element
 *      c. tbc
 */