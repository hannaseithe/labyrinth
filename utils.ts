 //import * as tf from '@tensorflow/tfjs';


function getRandomInteger(min, max) {
   return Math.floor((max - min) * Math.random()) + min;
 }
 
function getRandomIntegers(min, max, numIntegers) {
   const output = [];
   for (let i = 0; i < numIntegers; ++i) {
     output.push(Math.floor((max - min) * Math.random()) + min);
   }
   return output;
 }

function assertPositiveInteger(x, name) {
  if (!Number.isInteger(x)) {
    throw new Error(
        `Expected ${name} to be an integer, but received ${x}`);
  }
  if (!(x > 0)) {
    throw new Error(
        `Expected ${name} to be a positive number, but received ${x}`);
  }
}
module.exports = {
  getRandomInteger, getRandomIntegers, assertPositiveInteger
}