const {h, render} = require('ultradom')

const {
        cornerHotspotSize,
        parallelHotspotSize,
        devColor
      } = require('./mockConfig')

const dom = require('../src/dom')

const renderIntoRoot = frag => render(frag, document.body)

/**
 * Pure functions: fragment makers (PoC: React DOM fragments)
 */

// renders a shape excluding its control points
const makeShapeFrags = (shapes, hoveredShape, dragStartAt) => shapes.map(shape => {
  const dragged = shape.key === (dragStartAt && dragStartAt.dragStartShape && dragStartAt.dragStartShape.key)
  return h('div', {
    class: shape.type,
    style: {
      transform: dom.matrixToCSS(shape.transformMatrix),
      width: dom.px(2 * shape.a),
      height: dom.px(2 * shape.b),
      marginLeft: dom.px(-shape.a),
      marginTop: dom.px(-shape.b),
      backgroundColor: shape.backgroundColor,
      backgroundImage: shape.backgroundImage,
      outline: dragged ? `1px solid ${devColor}` : (shape.type === 'line' ? '1px solid rgba(0,0,0,0.2)' : null),
      opacity: shape.key === (hoveredShape && hoveredShape.key) ? 0.8 : 0.7
    }
  })
})

const makeShapeCornerFrags = shape => [
  h('div', {
    class: 'hotspot corner rectangle topLeft',
    style: {
      width: dom.px(cornerHotspotSize),
      height: dom.px(cornerHotspotSize),
      marginLeft: dom.px(- cornerHotspotSize / 2),
      marginTop: dom.px(- cornerHotspotSize / 2),
      transform: dom.matrixToCSS(shape.transformMatrix) + ` translate(${- shape.a + cornerHotspotSize / 2}px, ${- shape.b + cornerHotspotSize / 2}px)`,
      outline: '1px solid darkgrey'
    }
  }),
  h('div', {
    class: 'hotspot corner rectangle topRight',
    style: {
      width: dom.px(cornerHotspotSize),
      height: dom.px(cornerHotspotSize),
      marginLeft: dom.px(- cornerHotspotSize / 2),
      marginTop: dom.px(- cornerHotspotSize / 2),
      transform: dom.matrixToCSS(shape.transformMatrix) + ` translate(${shape.a - cornerHotspotSize / 2}px, ${- shape.b + cornerHotspotSize / 2}px)`,
      outline: '1px solid darkgrey'
    }
  }),
  h('div', {
    class: 'hotspot corner rectangle bottomLeft',
    style: {
      width: dom.px(cornerHotspotSize),
      height: dom.px(cornerHotspotSize),
      marginLeft: dom.px(- cornerHotspotSize / 2),
      marginTop: dom.px(- cornerHotspotSize / 2),
      transform: dom.matrixToCSS(shape.transformMatrix) + ` translate(${- shape.a + cornerHotspotSize / 2}px, ${shape.b - cornerHotspotSize / 2}px)`,
      outline: '1px solid darkgrey'
    }
  }),
  h('div', {
    class: 'hotspot corner rectangle bottomRight',
    style: {
      width: dom.px(cornerHotspotSize),
      height: dom.px(cornerHotspotSize),
      marginLeft: dom.px(- cornerHotspotSize / 2),
      marginTop: dom.px(- cornerHotspotSize / 2),
      transform: dom.matrixToCSS(shape.transformMatrix)
      + ` translate(${shape.a - cornerHotspotSize / 2}px, ${shape.b - cornerHotspotSize / 2}px)`,
      outline: '1px solid darkgrey'
    }
  })
]

const makeShapeParallelFrags = ({transformMatrix, horizontal}, hovered) => h('div', {
  style: {
    marginLeft: dom.px(horizontal ? - parallelHotspotSize / 2 : 0),
    marginTop: dom.px(horizontal ? 0 : - parallelHotspotSize / 2),
    width: dom.px(horizontal ? parallelHotspotSize : 0),
    height: dom.px(horizontal ? 0 : parallelHotspotSize),
    transform: dom.matrixToCSS(transformMatrix),
    outline: hovered ? '2px solid' : '1px solid',
    outlineColor: `rgba(0, 0, 0, ${hovered ? 1 : 0.3})`
  }
})

// the substrate is responsible for the PoC event capture, and doubles as the parent DIV of everything else
const makeSubstrateFrag = commit => (shapeFrags, shapeCornerFrags, shapeEdgeFrags, shapeCenterFrags) =>
  h('div', {
      id: 'root',
      onmousemove: event => commit('cursorPosition', {x: event.clientX, y: event.clientY}),
      onmouseup: event => commit('mouseEvent', {event: 'mouseUp', x: event.clientX, y: event.clientY}),
      onmousedown: event => commit('mouseEvent', {event: 'mouseDown', x: event.clientX, y: event.clientY})
    },
    [
      ...shapeFrags,
      ...shapeCornerFrags,
      ...shapeEdgeFrags,
      ...shapeCenterFrags
    ]
  )

module.exports = {
  renderIntoRoot,
  makeShapeFrags,
  makeShapeCornerFrags,
  makeShapeParallelFrags,
  makeSubstrateFrag
}