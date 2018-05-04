const {
        pattern1,
        pattern2,
        pattern3,
        elasticLogo,
        bach
      } = require('./mockAssets')

const matrix = require('../src/matrix')

const initialShapes = [
  {key: 'rect1', type: 'rectangle', transformMatrix: matrix.translate(425, 290, 5), a: 125, b: 90,
    backgroundColor: '#b3e2cd', backgroundImage: pattern1},
  {key: 'rect2', type: 'rectangle', transformMatrix: matrix.translate(750, 460, 6), a: 150, b: 110, backgroundColor: '#fdcdac',
    backgroundImage: pattern2},
  {key: 'rect3', type: 'rectangle', transformMatrix: matrix.translate(900, 375, 7), a: 100, b: 75, backgroundColor: '#cbd5e8',
  backgroundImage: bach},
  {key: 'rect4', type: 'rectangle', transformMatrix: matrix.translate(190, 400, 8), a: 90, b: 150,
    backgroundColor: 'rgba(0,0,0,0)', backgroundImage: elasticLogo}, // #f4cae4
  {key: 'rect5', type: 'rectangle', transformMatrix: matrix.translate(1060, 200, 90), a: 160, b: 100, backgroundColor: '#e6f5c9',
    backgroundImage: pattern3},
]

const initialState = {
  shapeAdditions: initialShapes,
  primaryUpdate: null,
  currentScene: {shapes: initialShapes}
}

module.exports = initialState