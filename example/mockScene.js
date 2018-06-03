const {
        pattern1,
        pattern2,
        pattern3,
        elasticLogo,
        bach,
        animviz,
        graph
      } = require('./mockAssets')

const matrix = require('../src/matrix')

const initialShapes = [
  {id: 'rect1', type: 'rectangle', localTransformMatrix: matrix.translate(425, 475, 0), transformMatrix: matrix.translate(425, 290, 5), a: 2, b: 2,
    backgroundColor: 'rgba(0,0,0,0)'},
  {id: 'rect2', type: 'rectangle', localTransformMatrix: matrix.translate(-200, -160, 1), transformMatrix: matrix.translate(750, 460, 6), a: 150, b: 160, backgroundColor: '#fdcdac',
    backgroundImage: pattern2, parent: 'rect1'},
  {id: 'rect3', type: 'rectangle', localTransformMatrix: matrix.translate(300, -175, -2), transformMatrix: matrix.translate(900, 375, 7), a: 100, b: 75, backgroundColor: '#cbd5e8',
  backgroundImage: bach, parent: 'rect1'},
  {id: 'rect4', type: 'rectangle', localTransformMatrix: matrix.translate(150, 150, 3), transformMatrix: matrix.translate(190, 400, 8), a: 90, b: 150,
    backgroundColor: 'rgba(0,0,0,0)', backgroundImage: elasticLogo, parent: 'rect1'}, // #f4cae4
  {id: 'rect5', type: 'rectangle', localTransformMatrix: matrix.translate(1260, 200, 30), transformMatrix: matrix.translate(1060, 200, 90), a: 160, b: 100, backgroundColor: '#e6f5c9',
    backgroundImage: pattern3},
  {id: 'rect6', type: 'rectangle', localTransformMatrix: matrix.translate(1260, 500, 90), transformMatrix: matrix.translate(1060, 200, 90), a: 160, b: 100, backgroundColor: '#b3e2cd',
    backgroundImage: pattern1},
  {id: 'rect7',  localTransformMatrix: matrix.translate(800, 800,    0), transformMatrix: matrix.translate(1060, 200, 90), a: 2, b: 2, backgroundColor: 'rgba(0,0,0,0)'},
  {id: 'rect8',  parent: 'rect7', localTransformMatrix: matrix.translate(   0,    0, -220), transformMatrix: matrix.translate(1060, 200, 90), a: 100, b: 100, backgroundColor: '#b3e2cd', backgroundImage: pattern1},
  {id: 'rect9',  parent: 'rect7', localTransformMatrix: matrix.translate(   0,    0,  -20), transformMatrix: matrix.translate(1060, 200, 90), a: 100, b: 100, backgroundColor: '#cbd5e8', backgroundImage: graph},
  {id: 'rect10', parent: 'rect7', localTransformMatrix: matrix.multiply(matrix.translate(-100,    0, -120), matrix.rotateY(Math.PI / 2)), transformMatrix: matrix.translate(1060, 200, 90), a: 100, b: 100, backgroundColor: '#e6f5c9', backgroundImage: pattern1},
  {id: 'rect11', parent: 'rect7', localTransformMatrix: matrix.multiply(matrix.translate( 100,    0, -120), matrix.rotateY(-Math.PI / 2)), transformMatrix: matrix.translate(1060, 200, 90), a: 100, b: 100, backgroundColor: 'white', backgroundImage: elasticLogo},
  {id: 'rect12', parent: 'rect7', localTransformMatrix: matrix.multiply(matrix.translate(   0, -100, -120), matrix.rotateX(Math.PI / 2)), transformMatrix: matrix.translate(1060, 200, 90), a: 100, b: 100, backgroundColor: 'black', backgroundImage: bach},
  {id: 'rect13', parent: 'rect7', localTransformMatrix: matrix.multiply(matrix.translate(   0, 100, -120), matrix.rotateX(Math.PI / 2)), transformMatrix: matrix.translate(1060, 200, 90), a: 100, b: 100, backgroundColor: 'white', backgroundImage: animviz},
]

const initialState = {
  shapeAdditions: initialShapes,
  primaryUpdate: null,
  currentScene: {shapes: initialShapes}
}

module.exports = initialState