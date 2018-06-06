/**
 * flatten
 *
 * Flattens an array of arrays into an array
 *
 * @param {*[][]} arrays
 * @returns *[]
 */
const flatten = arrays => [].concat(...arrays)

/**
 * identity
 *
 * @param d
 * @returns d
 */
const identity = d => d

/**
 * map
 *
 * Maps a function over an array
 *
 * Passing the index and the array are avoided
 *
 * @param {Function} fun
 * @returns {function(*): *}
 */
const map = fun => array => array.map(value => fun(value))

/**
 *
 * @param d
 * @param printerFun
 * @returns d
 */
const log = (d, printerFun = identity) => {
  console.log(printerFun(d))
  return d
}

module.exports = {
  flatten,
  identity,
  log,
  map
}