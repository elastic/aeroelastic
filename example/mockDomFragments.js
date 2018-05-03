const {h, render} = require('ultradom')

const {
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

// the substrate is responsible for the PoC event capture, and doubles as the parent DIV of everything else
const makeSubstrateFrag = commit => shapeFrags =>
  h('div', {
      id: 'root',
      onmousemove: event => commit('cursorPosition', {x: event.clientX, y: event.clientY}),
      onmouseup: event => commit('mouseEvent', {event: 'mouseUp', x: event.clientX, y: event.clientY}),
      onmousedown: event => commit('mouseEvent', {event: 'mouseDown', x: event.clientX, y: event.clientY})
    },
    [
      ...shapeFrags
    ]
  )

module.exports = {
  renderIntoRoot,
  makeShapeFrags,
  makeSubstrateFrag
}