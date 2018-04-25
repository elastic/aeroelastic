const {
        pattern1,
        pattern2,
        pattern3,
        elasticLogo,
        bach
      } = require('./mockAssets')

const initialShapes = [
  {key: 'line1', type: 'line', x: 200, y: 150, width: 1400, height: 0, z: 5, rotation: 0, color: 'grey'},
  {key: 'line2', type: 'line', x: 200, y: 650, width: 1400, height: 0, z: 5, rotation: 0, color: 'grey'},
  {key: 'line3', type: 'line', x: 80,  y: 100, width: 0, height: 900, z: 5, rotation: 0, color: 'grey'},
  {key: 'line4', type: 'line', x: 700, y: 100, width: 0, height: 900, z: 5, rotation: 0, color: 'grey'},
  {key: 'rect1', type: 'rectangle', x: 300, y: 200, rotation: 0 * Math.PI * Math.random(), width: 250, height: 180, z: 5,
    backgroundColor: '#b3e2cd', backgroundImage: pattern1},
  {key: 'rect2', type: 'rectangle', x: 600, y: 350, rotation: 0, width: 300, height: 220, z: 6, backgroundColor: '#fdcdac',
    backgroundImage: pattern2},
  {key: 'rect3', type: 'rectangle', x: 800, y: 250, rotation: 0, width: 200, height: 150, z: 7, backgroundColor: '#cbd5e8',
  backgroundImage: bach},
  {key: 'rect4', type: 'rectangle', x: 100, y: 250, rotation: 0, width: 180, height: 300, z: 8, backgroundColor: 'rgba(0,0,0,0)',
    backgroundImage: elasticLogo}, // #f4cae4
  {key: 'rect5', type: 'rectangle', x: 900, y: 100, rotation: 0, width: 325, height: 200, z: 9, backgroundColor: '#e6f5c9',
    backgroundImage: pattern3},
]

const initialState = {
  shapeAdditions: initialShapes,
  primaryUpdate: null,
  currentScene: {shapes: initialShapes}
}

module.exports = initialState