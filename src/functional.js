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
 * log
 *
 * @param d
 * @param {Function} printerFun
 * @returns d
 */
const log = (d, printerFun = identity) => {
  console.log(printerFun(d))
  return d
}

/**
 * disjunctiveUnion
 *
 * @param {Function} keyFun
 * @param {*[]} set1
 * @param {*[]} set2
 * @returns *[]
 */
const disjunctiveUnion = (keyFun, set1, set2) =>
  set1
    .filter(s1 => !set2.find(s2 => keyFun(s2) === keyFun(s1)))
    .concat(set2.filter(s2 => !set1.find(s1 => keyFun(s1) === keyFun(s2))))

/**
 * unnest
 *
 * @param {*[][]} vectorOfVectors
 * @returns {*[]}
 */
const unnest = vectorOfVectors => [].concat.apply([], vectorOfVectors)

module.exports = {
  disjunctiveUnion,
  flatten,
  identity,
  log,
  map,
  unnest
}