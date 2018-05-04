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
      opacity: shape.key === (hoveredShape && hoveredShape.key) ? 1 : 0.5
    }
  })
})

// the substrate is responsible for the PoC event capture, and doubles as the parent DIV of everything else
// the stupid queue is added only to let reliable event repetition (via a timer); without this, if the keys
// are released in the order they were pressed, the repetition stops
const makeSubstrateFrag = commit => {
  let timer
  let downQueue = []
  return shapeFrags => {
    return h('div', {
        id: 'root',
        tabindex: '0', // needed for the div to register keyboard events
        onmousemove: event => commit('cursorPosition', {x: event.clientX, y: event.clientY}),
        onmouseup: event => commit('mouseEvent', {event: 'mouseUp', x: event.clientX, y: event.clientY}),
        onmousedown: event => commit('mouseEvent', {event: 'mouseDown', x: event.clientX, y: event.clientY}),
        onkeydown: ({code}) => {
          window.clearInterval(timer)
          timer = window.setInterval(() => {commit('keyboardEvent', {event: 'keyDown', code: downQueue[downQueue.length - 1]})}, 1000 / 60 * 2)
          if(downQueue[downQueue.length - 1] !== code) downQueue.push(code)
          return commit('keyboardEvent', {event: 'keyDown', code})
        },
        onkeyup: ({code}) => {
          window.clearInterval(timer)
          timer = window.setInterval(() => {commit('keyboardEvent', {event: 'keyDown', code: downQueue[downQueue.length - 1]})}, 1000 / 60 * 2)
          downQueue.splice(downQueue.indexOf(code), 1)
          return commit('keyboardEvent', {event: 'keyUp', code})
        },
        oncreate: element => element.focus() // this is needed to capture keyboard events without clicking on it first
      },
      shapeFrags,
      'Keys:',
      h('li', {}, 'W, A, S, D: translate along X / Y'),
      h('li', {}, 'F, C: translate along Z'),
      h('li', {}, 'X, Y, Z: rotate around X, Y or Z respectively'),
      h('li', {}, 'I, J, K, L: scale (increase/decrease) along X / Y'),
      h('li', {}, 'P: toggle perspective viewing'),
      h('li', {}, 'E, R, T, G: shear along x / Y')
    )
  }
}

module.exports = {
  renderIntoRoot,
  makeShapeFrags,
  makeSubstrateFrag
}