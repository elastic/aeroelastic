// converts a transform matrix to a CSS string
const matrixToCSS = transformMatrix => 'matrix3d(' + transformMatrix.join(',') + ')'
const px = value => value === 0 ? '0' : value + 'px'

module.exports = {
  matrixToCSS,
  px
}