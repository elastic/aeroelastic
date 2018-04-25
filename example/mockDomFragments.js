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
        edgeHotspotSize,
        devColor
      } = require('./mockConfig')

const {
        horizontalCenterIcon,
        horizontalLeftIcon,
        horizontalRightIcon,
        cancelIcon
      } = require('./mockAssets')

const rootRender = frag => render(frag, document.body)

/**
 * Pure functions: fragment makers (PoC: React DOM fragments)
 */

// renders a shape excluding its control points
const renderShapeFrags = (shapes, hoveredShape, dragStartAt) => shapes.map(shape => {
  const dragged = shape.key === (dragStartAt && dragStartAt.dragStartShape && dragStartAt.dragStartShape.key)

  return h('div', {
    class: dragged ? 'draggable' : null,
    style: {
      transform: shape.transform3d,
    }
  }, h('div', {
    class: shape.type,
    style: {
      width: shape.width + 'px',
      height: shape.height + 'px',
      backgroundColor: shape.backgroundColor,
      backgroundImage: shape.backgroundImage,
      outline: dragged ? `1px solid ${devColor}` : (shape.type === 'line' ? '1px solid rgba(0,0,0,0.2)' : null),
      opacity: shape.key === (hoveredShape && hoveredShape.key) ? 0.8 : 0.5
    }
  }))
})

const renderShapeMenuOverlayFrags = commit => shapes => shapes.map(shape => {
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
        opacity: 0.27,
        outline: 'none',
        width: toolbarHeight + 'px',
        height: toolbarHeight + 'px',
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
        opacity: 0.27,
        outline: 'none',
        width: toolbarHeight + 'px',
        height: toolbarHeight + 'px',
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
        opacity: 0.27,
        outline: 'none',
        width: toolbarHeight + 'px',
        height: toolbarHeight + 'px',
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
        opacity: 0.27,
        outline: 'none',
        width: toolbarHeight + 'px',
        height: toolbarHeight + 'px',
        transform: shape.transform3d + ` translate3d(${shape.width + 2 * cornerHotspotSize + 3 * paddedToolbarHeight}px, 
                                  ${toolbarY}px, ${toolbarZ}px) 
                      ${rotation}`,
        backgroundImage: cancelIcon,
        backgroundSize: `${toolbarHeight}px ${toolbarHeight}px`,
        backgroundRepeat: 'no-repeat' }
    })
  ])
})

const renderShapeTransformOverlayFrags = (shapes, dragStartAt) => shapes.map(shape => {
  const dragged = shape.key === (dragStartAt && dragStartAt.dragStartShape && dragStartAt.dragStartShape.key)

  return h('div', {
    class: dragged ? 'draggable' : null,
  }, [
    h('div', {
      class: 'rotateHotspot circle',
      style: {
        width: (cornerHotspotSize * 3) + 'px',
        height: (cornerHotspotSize * 3) + 'px',
        transform:  shape.transform3d + ` translate(${shape.width / 2 + 2 * cornerHotspotSize}px, ${- 4 * cornerHotspotSize}px) `
      }
    }),
    h('div', {
      class: 'hotspot corner rectangle topLeft',
      style: {
        width: cornerHotspotSize + 'px',
        height: cornerHotspotSize + 'px',
        transform: shape.transform3d
      }
    }),
    h('div', {
      class: 'hotspot corner rectangle topRight',
      style: {
        width: cornerHotspotSize + 'px',
        height: cornerHotspotSize + 'px',
        transform: shape.transform3d + ` translate(${shape.width - cornerHotspotSize}px, 0)`
      }
    }),
    h('div', {
      class: 'hotspot corner rectangle bottomLeft',
      style: {
        width: cornerHotspotSize + 'px',
        height: cornerHotspotSize + 'px',
        transform: shape.transform3d + ` translate(0, ${shape.height - cornerHotspotSize}px)`
      }
    }),
    h('div', {
      class: 'hotspot corner rectangle bottomRight',
      style: {
        width: cornerHotspotSize + 'px',
        height: cornerHotspotSize + 'px',
        transform: shape.transform3d
                   + ` translate(${shape.width - cornerHotspotSize}px, ${shape.height - cornerHotspotSize}px)`
      }
    }),
    h('div', {
      class: `hotspot rectangle side top ${shape.yConstraintAnchor === 'top' ? 'snapped' : ''}`,
      style: {
        width: edgeHotspotSize + 'px',
        height: '0',
        transform: shape.transform3d + ` translate(${shape.width / 2 - edgeHotspotSize / 2}px, 0)`
      }
    }),
    h('div', {
      class: `hotspot rectangle side right ${shape.xConstraintAnchor === 'right' ? 'snapped' : ''}`,
      style: {
        width: '0',
        height: edgeHotspotSize + 'px',
        transform: shape.transform3d + ` translate(${shape.width}px, ${shape.height / 2 - edgeHotspotSize / 2}px)`
      }
    }),
    h('div', {
      class: `hotspot rectangle side bottom ${shape.yConstraintAnchor === 'bottom' ? 'snapped' : ''}`,
      style: {
        width: edgeHotspotSize + 'px',
        height: '0',
        transform: shape.transform3d + ` translate(${shape.width / 2 - edgeHotspotSize / 2}px, ${shape.height}px)`
      }
    }),
    h('div', {
      class: `hotspot rectangle side left ${shape.xConstraintAnchor === 'left' ? 'snapped' : ''}`,
      style: {
        width: '0',
        height: edgeHotspotSize + 'px',
        transform: shape.transform3d + ` translate(0, ${shape.height / 2 - edgeHotspotSize / 2}px)`
      }
    }),
    h('div', {
      class: `hotspot rectangle center vertical ${shape.xConstraintAnchor === 'center' ? 'snapped' : ''}`,
      style: {
        width: '0',
        height: edgeHotspotSize + 'px',
        transform: shape.transform3d
                   + ` translate3d(${shape.width / 2}px, ${shape.height / 2 - edgeHotspotSize / 2}px, 0.01px)`
      }
    }),
    h('div', {
      class: `hotspot rectangle center horizontal ${shape.yConstraintAnchor === 'middle' ? 'snapped' : ''}`,
      style: {
        width: edgeHotspotSize + 'px',
        height: '0',
        transform: shape.transform3d + ` translate3d(${shape.width / 2 - edgeHotspotSize / 2}px, ${shape.height / 2}px,
                                ${shape.xConstraintAnchor === 'center' ? 0 : 0.02}px)`
      }
    }),
  ])
})

// magenta debug cursor
const renderMetaCursorFrag = (x, y, shapeDragInProcess, metaCursorThickness, metaCursorColor) => h('div', {
  class: 'circle metaCursor',
  style: {
    width: (metaCursorRadius * 2) + 'px',
    height: (metaCursorRadius * 2) + 'px',
    transform: `translate3d(${x - metaCursorRadius}px, ${y - metaCursorRadius}px, ${metaCursorZ}px)`,
    border: `${metaCursorThickness}px solid ${metaCursorColor}`,
    boxShadow: `0 0 0.5px 0 ${metaCursorColor} inset, 0 0 2px 0 white`,
  }
})

// magenta debug drag disks and drag line
const renderDragLineFrag = (dragLineLength, x, y, angle) => h('div', {
  style: {
    transform: `translate3d(${x}px, ${y}px, ${dragLineZ}px) rotateZ(${angle}deg)`,
  }
}, [
  h('div', {
    class: 'line',
    style: {
      width: Math.max(0, dragLineLength - metaCursorRadius) + 'px',
      height: '0',
      border: `1px solid ${dragLineColor}`,
      boxShadow: `0 0 1px 0 white inset, 0 0 1px 0 white`,
    }
  }),
  h('div', {
    class: 'circle metaCursor',
    style: {
      width: (dragLineLength ? metaCursorRadius : 0) + 'px',
      height: (dragLineLength ? metaCursorRadius : 0) + 'px',
      transform: `translate3d(${-metaCursorRadius / 2}px, ${-metaCursorRadius / 2}px, ${metaCursorZ}px)`,
      backgroundColor: devColor,
      boxShadow: `0 0 0.5px 0 ${devColor} inset, 0 0 2px 0 white`,
    }
  })
])

// the substrate is responsible for the PoC event capture, and doubles as the parent DIV of everything else
const renderSubstrateFrag = commit => (shapeFrags, shapeTransformOverlayFrags, shapeMenuOverlayFrags, freeShapeFrags, metaCursorFrag, dragLineFrag) =>
  h('div', {
      id: 'root',
      onmousemove: event => commit('cursorPosition', {x: event.clientX, y: event.clientY}),
      onmouseup: event => commit('mouseEvent', {event: 'mouseUp', x: event.clientX, y: event.clientY}),
      onmousedown: event => commit('mouseEvent', {event: 'mouseDown', x: event.clientX, y: event.clientY}),
      onclick: event => commit('mouseEvent', {event: 'mouseClick', x: event.clientX, y: event.clientY}),
    },
    [
      ...shapeFrags,
      ...shapeTransformOverlayFrags,
      ...shapeMenuOverlayFrags,
      freeShapeFrags,
      metaCursorFrag, dragLineFrag
    ]
  )

module.exports = {
  rootRender,
  renderShapeFrags,
  renderShapeTransformOverlayFrags,
  renderShapeMenuOverlayFrags,
  renderMetaCursorFrag,
  renderDragLineFrag,
  renderSubstrateFrag
}