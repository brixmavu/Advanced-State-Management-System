/**
 * Utility functions for general purposes.
 */

/**
 * Creates a deep clone of an object.
 * @param {Object} obj - The object to clone.
 * @returns {Object} A deep clone of the object.
 */
export const deepClone = obj => JSON.parse(JSON.stringify(obj));

/**
 * Generates a unique ID.
 * @returns {string} A unique ID.
 */
export const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

/**
 * Gets the current timestamp.
 * @returns {number} The current timestamp in milliseconds.
 */
export const getTimestamp = () => Date.now();

/**
 * Diff arrays and generate patches.
 * @param {Array} oldArray - The old array.
 * @param {Array} newArray - The new array.
 * @param {string} path - The path to the array.
 * @returns {Array} An array of patches.
 */
export const diffArray = (oldArray, newArray, path) => {
  const patches = [];
  const maxLength = Math.max(oldArray.length, newArray.length);

  for (let i = 0; i < maxLength; i++) {
    if (i >= oldArray.length) {
      // Item added
      patches.push({
        op: 'add',
        path: `${path}/${i}`,
        value: newArray[i],
      });
    } else if (i >= newArray.length) {
      // Item removed
      patches.push({
        op: 'remove',
        path: `${path}/${i}`,
      });
    } else if (Array.isArray(oldArray[i]) && Array.isArray(newArray[i])) {
      // Nested array
      const nestedPatches = diffArray(oldArray[i], newArray[i], `${path}/${i}`);
      patches.push(...nestedPatches);
    } else if (typeof oldArray[i] === 'object' && typeof newArray[i] === 'object') {
      // Object change
      const objectPatches = diffObject(oldArray[i], newArray[i], `${path}/${i}`);
      patches.push(...objectPatches);
    } else if (oldArray[i] !== newArray[i]) {
      // Item changed
      patches.push({
        op: 'replace',
        path: `${path}/${i}`,
        value: newArray[i],
      });
    }
  }

  return patches;
};

/**
 * Diff objects and generate patches.
 * @param {Object} oldObj - The old object.
 * @param {Object} newObj - The new object.
 * @param {string} path - The path to the object.
 * @returns {Array} An array of patches.
 */
const diffObject = (oldObj, newObj, path) => {
  const patches = [];

  Object.keys(oldObj).forEach((key) => {
    if (!(key in newObj)) {
      // Key removed
      patches.push({
        op: 'remove',
        path: `${path}/${key}`,
      });
    } else if (oldObj[key] !== newObj[key]) {
      // Value changed
      patches.push({
        op: 'replace',
        path: `${path}/${key}`,
        value: newObj[key],
      });
    }
  });

  Object.keys(newObj).forEach((key) => {
    if (!(key in oldObj)) {
      // Key added
      patches.push({
        op: 'add',
        path: `${path}/${key}`,
        value: newObj[key],
      });
    }
  });

  return patches;
};