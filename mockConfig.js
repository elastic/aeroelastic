/**
 * Mock config
 */

const metaCursorRadius = 15
const metaCursorZ = 1000
const dragLineZ = metaCursorZ - 1 // just beneath the metaCursor
const toolbarZ = dragLineZ - 1 // toolbar just beneath the cursor scenegraph
const freeDragZ = toolbarZ - 1 // just beneath the cursor + toolbar scenegraph
const toolbarY = -50
const toolbarHeight = 32
const toolbarPad = 8
const paddedToolbarHeight = toolbarHeight + toolbarPad
const dragLineColor = 'rgba(255,0,255,0.5)'
const cornerHotspotSize = 6
const edgeHotspotSize = 12
const devColor = 'magenta'
const pad = 10
const gridPitch = 1
const snapEngageDistance = 18
const snapReleaseDistance = 2 * snapEngageDistance // hysteresis: make it harder to break the bond
const enforceAlignment = true // whether snap lines enforce all elements to anchor left/center/right etc. or only preexisting ones