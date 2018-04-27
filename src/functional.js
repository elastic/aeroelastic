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
 * Passing the index and the array are avoided
 *
 * @param {Function} fun
 * @returns {function(*): *}
 */
const map = fun => array => array.map(value => fun(value))

module.exports = {
  flatten,
  map
}