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
 * map
 *
 * Maps a function over an array
 *
 * @param {Function} fun
 * @returns {function(*): *}
 */
const map = fun => array => array.map(fun)

module.exports = {
  flatten,
  map
}