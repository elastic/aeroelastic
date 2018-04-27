// converts a transform matrix to a CSS string
const matrixToCSS = transformMatrix => 'matrix3d(' + transformMatrix.join(',') + ')'

// converts to string, and adds `px` if non-zero
const px = value => value === 0 ? '0' : value + 'px'

module.exports = {
  matrixToCSS,
  px
}