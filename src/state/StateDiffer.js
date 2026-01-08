import { deepClone } from '../utils/utils.js';

// Utility for calculating state differences
class StateDiffer {
  static diff(oldState, newState) {
    const patches = [];
    
    function generatePatches(oldObj, newObj, path = '') {
      // Handle primitive values or different types
      if (typeof oldObj !== 'object' || typeof newObj !== 'object' || 
          oldObj === null || newObj === null || 
          Array.isArray(oldObj) !== Array.isArray(newObj)) {
        if (oldObj !== newObj) {
          patches.push({
            op: 'replace',
            path,
            value: newObj
          });
        }
        return;
      }
      
      // Handle arrays
      if (Array.isArray(oldObj)) {
        // Simple approach: if arrays are different, replace the whole array
        // A more sophisticated approach would use array diffing algorithms
        if (JSON.stringify(oldObj) !== JSON.stringify(newObj)) {
          patches.push({
            op: 'replace',
            path,
            value: newObj
          });
        }
        return;
      }
      
      // Handle objects
      const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
      
      for (const key of allKeys) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (!(key in oldObj)) {
          // Key was added
          patches.push({
            op: 'add',
            path: currentPath,
            value: newObj[key]
          });
        } else if (!(key in newObj)) {
          // Key was removed
          patches.push({
            op: 'remove',
            path: currentPath
          });
        } else if (oldObj[key] !== newObj[key]) {
          // Key was changed
          if (typeof oldObj[key] === 'object' && oldObj[key] !== null &&
              typeof newObj[key] === 'object' && newObj[key] !== null) {
            // Recursively diff nested objects
            generatePatches(oldObj[key], newObj[key], currentPath);
          } else {
            patches.push({
              op: 'replace',
              path: currentPath,
              value: newObj[key]
            });
          }
        }
      }
    }
    
    generatePatches(oldState, newState);
    return patches;
  }
  
  static applyPatches(state, patches) {
    const result = deepClone(state);
    
    for (const patch of patches) {
      const pathParts = patch.path.split('.');
      let current = result;
      
      // Navigate to the parent of the target property
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!(part in current)) {
          current[part] = {};
        }
        current = current[part];
      }
      
      const lastPart = pathParts[pathParts.length - 1];
      
      switch (patch.op) {
        case 'add':
        case 'replace':
          current[lastPart] = patch.value;
          break;
        case 'remove':
          delete current[lastPart];
          break;
        default:
          console.warn(`Unknown operation: ${patch.op}`);
      }
    }
    
    return result;
  }
}

export default StateDiffer;