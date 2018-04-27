const {h, render} = require('ultradom')

const {
        metaCursorRadius,
        metaCursorZ ,
        dragLineZ,
        toolbarZ,
        toolbarY,
        toolbarHeight,
        paddedToolbarHeight,
        dragLineColor,
        cornerHotspotSize,
        parallelHotspotSize,
        devColor,
        menuIconOpacity
      } = require('./mockConfig')

const {
        horizontalCenterIcon,
        horizontalLeftIcon,
        horizontalRightIcon,
        cancelIcon
      } = require('./mockAssets')

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
      transform: shape.transform3d,
      width: dom.px(shape.width),
      height: dom.px(shape.height),
      backgroundColor: shape.backgroundColor,
      backgroundImage: shape.backgroundImage,
      outline: dragged ? `1px solid ${devColor}` : (shape.type === 'line' ? '1px solid rgba(0,0,0,0.2)' : null),
      opacity: shape.key === (hoveredShape && hoveredShape.key) ? 1 : 0.8
    }
  })
})

const makeShapeMenuOverlayFrags = commit => shapes => shapes.map(shape => {
  const rotation = shape.type === 'line' && shape.height === 0 ? 'rotate(-90deg)' : ''
  const alignLeft = () => commit('align', {event: 'alignLeft', shapeKey: shape.key})
  const alignCenter = () => commit('align', {event: 'alignCenter', shapeKey: shape.key})
  const alignRight = () => commit('align', {event: 'alignRight', shapeKey: shape.key})
  const alignRemove = () => commit('align', {event: 'alignRemove', shapeKey: shape.key})

  return h('div', {
    class: null,
  }, [
    h('div', {
      class: 'hotspot rectangle center',
      onclick: alignRight,
      style: {
        opacity: menuIconOpacity,
        outline: 'none',
        width: dom.px(toolbarHeight),
        height: dom.px(toolbarHeight),
        transform: shape.transform3d
        + ` translate3d(${shape.width + 2 * cornerHotspotSize}px, ${toolbarY}px, ${toolbarZ}px) ${rotation}`,
        backgroundImage: horizontalRightIcon,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat'
      }
    }),
    h('div', {
      class: 'hotspot rectangle center',
      onclick: alignCenter,
      style: {
        opacity: menuIconOpacity,
        outline: 'none',
        width: dom.px(toolbarHeight),
        height: dom.px(toolbarHeight),
        transform: shape.transform3d + ` translate3d(${shape.width + 2 * cornerHotspotSize + paddedToolbarHeight}px, 
                                  ${toolbarY}px, ${toolbarZ}px) 
                      ${rotation}`,
        backgroundImage: horizontalCenterIcon,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat' }
    }),
    h('div', {
      class: 'hotspot rectangle center',
      onclick: alignLeft,
      style: {
        opacity: menuIconOpacity,
        outline: 'none',
        width: dom.px(toolbarHeight),
        height: dom.px(toolbarHeight),
        transform: shape.transform3d + ` translate3d(${shape.width + 2 * cornerHotspotSize + 2 * paddedToolbarHeight}px, 
                                  ${toolbarY}px, ${toolbarZ}px) 
                      ${rotation}`,
        backgroundImage: horizontalLeftIcon,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat' }
    }),
    h('div', {
      class: 'hotspot rectangle center',
      onclick: alignRemove,
      style: {
        opacity: menuIconOpacity,
        outline: 'none',
        width: dom.px(toolbarHeight),
        height: dom.px(toolbarHeight),
        transform: shape.transform3d + ` translate3d(${shape.width + 2 * cornerHotspotSize + 3 * paddedToolbarHeight}px, 
                                  ${toolbarY}px, ${toolbarZ}px) 
                      ${rotation}`,
        backgroundImage: cancelIcon,
        backgroundSize: `${toolbarHeight}px ${toolbarHeight}px`,
        backgroundRepeat: 'no-repeat' }
    })
  ])
})

const makeRotateFrags = transformMatrix => h('div', {
  class: 'rotateHotspot circle',
  style: {
    width: dom.px(cornerHotspotSize * 3),
    height: dom.px(cornerHotspotSize * 3),
    left: dom.px(2 * cornerHotspotSize),
    top: dom.px(- 4 * cornerHotspotSize),
    transform: dom.matrixToCSS(transformMatrix)
  }
})

const makeShapeCornerFrags = shape => [
  h('div', {
    class: 'hotspot corner rectangle topLeft',
    style: {
      width: dom.px(cornerHotspotSize),
      height: dom.px(cornerHotspotSize),
      transform: shape.transform3d,
      outline: '1px solid darkgrey'
    }
  }),
  h('div', {
    class: 'hotspot corner rectangle topRight',
    style: {
      width: dom.px(cornerHotspotSize),
      height: dom.px(cornerHotspotSize),
      transform: shape.transform3d + ` translate(${shape.width - cornerHotspotSize}px, 0)`,
      outline: '1px solid darkgrey'
    }
  }),
  h('div', {
    class: 'hotspot corner rectangle bottomLeft',
    style: {
      width: dom.px(cornerHotspotSize),
      height: dom.px(cornerHotspotSize),
      transform: shape.transform3d + ` translate(0, ${shape.height - cornerHotspotSize}px)`,
      outline: '1px solid darkgrey'
    }
  }),
  h('div', {
    class: 'hotspot corner rectangle bottomRight',
    style: {
      width: dom.px(cornerHotspotSize),
      height: dom.px(cornerHotspotSize),
      transform: shape.transform3d
      + ` translate(${shape.width - cornerHotspotSize}px, ${shape.height - cornerHotspotSize}px)`,
      outline: '1px solid darkgrey'
    }
  })
]

const makeShapeParallelFrags = ({transformMatrix, snapped, horizontal}, hovered) => h('div', {
  style: {
    left: dom.px(horizontal ? - parallelHotspotSize / 2 : 0),
    top: dom.px(horizontal ? 0 : - parallelHotspotSize / 2),
    width: dom.px(horizontal ? parallelHotspotSize : 0),
    height: dom.px(horizontal ? 0 : parallelHotspotSize),
    transform: dom.matrixToCSS(transformMatrix),
    outline: hovered ? '2px solid' : '1px solid',
    outlineColor: snapped
      ? devColor
      : `rgba(0, 0, 0, ${hovered ? 1 : 0.3})`
  }
})

// magenta debug cursor
const makeMetaCursorFrag = (x, y, shapeDragInProcess, metaCursorThickness, metaCursorColor) => h('div', {
  class: 'circle metaCursor',
  style: {
    width: dom.px(metaCursorRadius * 2),
    height: dom.px(metaCursorRadius * 2),
    transform: `translate3d(${x - metaCursorRadius}px, ${y - metaCursorRadius}px, ${metaCursorZ}px)`,
    border: `${metaCursorThickness}px solid ${metaCursorColor}`,
    boxShadow: `0 0 0.5px 0 ${metaCursorColor} inset, 0 0 2px 0 white`,
  }
})

// magenta debug drag disks and drag line
const makeDragLineFrag = (dragLineLength, x, y, angle) => h('div', {
  style: {
    transform: `translate3d(${x}px, ${y}px, ${dragLineZ}px) rotateZ(${angle}deg)`,
  }
}, [
  h('div', {
    class: 'line',
    style: {
      width: dom.px(Math.max(0, dragLineLength - metaCursorRadius)),
      height: '0',
      border: `1px solid ${dragLineColor}`,
      boxShadow: `0 0 1px 0 white inset, 0 0 1px 0 white`,
    }
  }),
  h('div', {
    class: 'circle metaCursor',
    style: {
      width: dom.px(dragLineLength ? metaCursorRadius : 0),
      height: dom.px(dragLineLength ? metaCursorRadius : 0),
      transform: `translate3d(${-metaCursorRadius / 2}px, ${-metaCursorRadius / 2}px, ${metaCursorZ}px)`,
      backgroundColor: devColor,
      boxShadow: `0 0 0.5px 0 ${devColor} inset, 0 0 2px 0 white`,
    }
  })
])

// the substrate is responsible for the PoC event capture, and doubles as the parent DIV of everything else
const makeSubstrateFrag = commit => (shapeFrags, shapeRotateFrags, shapeCornerFrags, shapeEdgeFrags, shapeCenterFrags,
                                     shapeMenuOverlayFrags, freeShapeFrags, metaCursorFrag, dragLineFrag) =>
  h('div', {
      id: 'root',
      onmousemove: event => commit('cursorPosition', {x: event.clientX, y: event.clientY}),
      onmouseup: event => commit('mouseEvent', {event: 'mouseUp', x: event.clientX, y: event.clientY}),
      onmousedown: event => commit('mouseEvent', {event: 'mouseDown', x: event.clientX, y: event.clientY}),
      onclick: event => commit('mouseEvent', {event: 'mouseClick', x: event.clientX, y: event.clientY}),
    },
    [
      ...shapeFrags,
      ...shapeRotateFrags,
      ...shapeCornerFrags,
      ...shapeEdgeFrags,
      ...shapeCenterFrags,
      ...shapeMenuOverlayFrags,
      freeShapeFrags,
      metaCursorFrag,
      dragLineFrag
    ]
  )

module.exports = {
  renderIntoRoot,
  makeShapeFrags,
  makeRotateFrags,
  makeShapeCornerFrags,
  makeShapeParallelFrags,
  makeShapeMenuOverlayFrags,
  makeMetaCursorFrag,
  makeDragLineFrag,
  makeSubstrateFrag
}