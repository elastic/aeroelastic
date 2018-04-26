// converts a transform matrix to a CSS string
const matrixToCSS = transformMatrix => 'matrix3d(' + transformMatrix.join(',') + ')'

module.exports = {
  matrixToCSS
}