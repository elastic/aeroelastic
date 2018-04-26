/**
 * transpose
 *
 * Turns a row major ordered vector representation of a 4 x 4 matrix into a column major ordered vector representation, or
 * the other way around.
 *
 * Must pass a row major ordered vector if the goal is to obtain a columm major ordered vector.
 *
 * We're using row major order in the _source code_ as this results in the correct visual shape of the matrix, but
 * `transform3d` needs column major order.
 *
 * This is what the matrix is:                  Eg. this is the equivalent matrix of `translate3d(${x}px, ${y}px, ${z}px)`:
 *
 *         a e i m                                                           1 0 0 x
 *         b f j n                                                           0 1 0 y
 *         c g k o                                                           0 0 1 z
 *         d h l p                                                           0 0 0 1
 *
 *  but it's _not_ represented as a 2D array or array of arrays. CSS3 `transform3d` expects it as this vector:
 *
 *      [a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p]
 *
 *  so it's clear that the first _column vector_ corresponds to a, b, c, d but in source code, we must write a, e, i, m in
 *  the first row if we want to visually resemble the above 4x4 matrix, ie. if we don't want that us programmers transpose
 *  matrices in our heads.
 *
 */
const transpose = ([a, e, i, m, b, f, j, n, c, g, k, o, d, h, l, p]) =>
  ([a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p])

const NULL = transpose([
  0, 0, 0, 0,
  0, 0, 0, 0,
  0, 0, 0, 0,
  0, 0, 0, 0
])

const UNIT = transpose([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1
])

// currently these functions expensively transpose; in a future version we can have way more efficient matrix operations
// (eg. pre-transpose)
const translate = (x, y, z) => transpose([
  1, 0, 0, x,
  0, 1, 0, y,
  0, 0, 1, z,
  0, 0, 0, 1
])

/**
 * rotate
 *
 * @param {number} x the x coordinate of the vector around which to rotate
 * @param {number} y the y coordinate of the vector around which to rotate
 * @param {number} z the z coordinate of the vector around which to rotate
 * @param {number} a rotation angle in radians
 * @returns {number[][]} a 4x4 transform matrix in column major order
 */
const rotate = (x, y, z, a) => {
  // it looks like the formula but inefficient; common terms could be precomputed, transpose can be avoided.
  // an optimizing compiler eg. Google Closure Advanced could perform most of the optimizations and JIT also watches out
  // for eg. common expressions

  const sinA = Math.sin(a)
  const coshAi = 1 - Math.cos(a)

  return transpose([

    1 + coshAi * (x * x - 1),      z * sinA + x * y * coshAi,    -y * sinA + x * y * coshAi,      0,
    -z * sinA + x * y * coshAi,    1 + coshAi * (y * y - 1),     x * sinA + y * x * coshAi,       0,
    y * sinA + x * z * coshAi,     -x * sinA + y * z * coshAi,   1 + coshAi * (z * z - 1),        0,
    0,                             0,                            0,                               1

  ])
}

/**
 * rotate_ functions
 *
 * @param {number} a
 * @returns {number[][]}
 *
 * Should be replaced with more efficient direct versions rather than going through the generic `rotate3d` function.
 */
const rotateX = a => rotate(1, 0, 0, a)
const rotateY = a => rotate(0, 1, 0, a)
const rotateZ = a => rotate(0, 0, 1, a)

/**
 * multiply
 *
 * Matrix multiplies two matrices of column major format, returning the result in the same format
 *
 *
 *                               A    E    I    M
 *                               B    F    J    N
 *                               C    G    K    O
 *                               D    H    L    P
 *
 *         a    e    i    m      .    .    .    .
 *         b    f    j    n      .    .    .    .
 *         c    g    k    o      .    .    .    .
 *         d    h    l    p      .    .    .    d * M + h * N + l * O + p * P
 *
 */
const multiply = ([a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p], [A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P]) => ([

  a * A + e * B + i * C + m * D,
  b * A + f * B + j * C + n * D,
  c * A + g * B + k * C + o * D,
  d * A + h * B + l * C + p * D,

  a * E + e * F + i * G + m * H,
  b * E + f * F + j * G + n * H,
  c * E + g * F + k * G + o * H,
  d * E + h * F + l * G + p * H,

  a * I + e * J + i * K + m * L,
  b * I + f * J + j * K + n * L,
  c * I + g * J + k * K + o * L,
  d * I + h * J + l * K + p * L,

  a * M + e * N + i * O + m * P,
  b * M + f * N + j * O + n * P,
  c * M + g * N + k * O + o * P,
  d * M + h * N + l * O + p * P,
])

module.exports = {
  NULL, UNIT, transpose, translate, rotate, rotateX, rotateY, rotateZ, multiply
}