const {
        pattern1,
        pattern2,
        pattern3,
        elasticLogo,
        bach
      } = require('./mockAssets')

const initialShapes = [
  {key: 'line1', type: 'line', x: 900, y: 150, a: 700, b: 0, z: 5, rotation: 0, color: 'grey'},
  {key: 'line2', type: 'line', x: 900, y: 650, a: 700, b: 0, z: 5, rotation: 0, color: 'grey'},
  {key: 'line3', type: 'line', x: 80,  y: 550, a: 0, b: 450, z: 5, rotation: 0, color: 'grey'},
  {key: 'line4', type: 'line', x: 700, y: 550, a: 0, b: 450, z: 5, rotation: 0, color: 'grey'},
  {key: 'rect1', type: 'rectangle', x: 425, y: 290, rotation: 0 * Math.PI * Math.random(), a: 125, b: 90, z: 5,
    backgroundColor: '#b3e2cd', backgroundImage: pattern1},
  {key: 'rect2', type: 'rectangle', x: 750, y: 460, rotation: 0, a: 150, b: 110, z: 6, backgroundColor: '#fdcdac',
    backgroundImage: pattern2},
  {key: 'rect3', type: 'rectangle', x: 900, y: 375, rotation: 0, a: 100, b: 75, z: 7, backgroundColor: '#cbd5e8',
  backgroundImage: bach},
  {key: 'rect4', type: 'rectangle', x: 190, y: 400, rotation: 0, a: 90, b: 150, z: 8,
    backgroundColor: 'rgba(0,0,0,0)', backgroundImage: elasticLogo}, // #f4cae4
  {key: 'rect5', type: 'rectangle', x: 1060, y: 200, rotation: 0, a: 160, b: 100, z: 9, backgroundColor: '#e6f5c9',
    backgroundImage: pattern3},
]

const initialState = {
  shapeAdditions: initialShapes,
  primaryUpdate: null,
  currentScene: {shapes: initialShapes}
}

module.exports = initialState