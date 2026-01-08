// test.js
import { diffArray } from '../src/utils/utils.js';

const testCases = [
  {
    name: 'Simple array change',
    oldArray: [1, 2, 3],
    newArray: [1, 2, 4],
    expectedPatches: [
      { op: 'replace', path: '/2', value: 4 },
    ],
  },
  {
    name: 'Array addition',
    oldArray: [1, 2, 3],
    newArray: [1, 2, 3, 4],
    expectedPatches: [
      { op: 'add', path: '/3', value: 4 },
    ],
  },
  {
    name: 'Array removal',
    oldArray: [1, 2, 3],
    newArray: [1, 2],
    expectedPatches: [
      { op: 'remove', path: '/2' },
    ],
  },
  {
    name: 'Nested array change',
    oldArray: [1, [2, 3]],
    newArray: [1, [2, 4]],
    expectedPatches: [
      { op: 'replace', path: '/1/1', value: 4 },
    ],
  },
  {
    name: 'Object change',
    oldArray: [{ a: 1 }, { b: 2 }],
    newArray: [{ a: 1 }, { b: 3 }],
    expectedPatches: [
      { op: 'replace', path: '/1/b', value: 3 },
    ],
  },
  {
    name: 'Array reordering',
    oldArray: [1, 2, 3],
    newArray: [3, 2, 1],
    expectedPatches: [
      { op: 'replace', path: '/0', value: 3 },
      { op: 'replace', path: '/2', value: 1 },
    ],
  },
];

testCases.forEach((testCase) => {
  const patches = diffArray(testCase.oldArray, testCase.newArray, '');
  console.log(`Test case: ${testCase.name}`);
  console.log('Expected patches:', testCase.expectedPatches);
  console.log('Actual patches:', patches);
  console.log('');
});
