/**
 *
 * @param {string|number} value
 * @returns {boolean}
 */
export const isNumeric = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value)
}
