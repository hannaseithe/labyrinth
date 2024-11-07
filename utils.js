 import * as tf from '@tensorflow/tfjs';

 export function getRandomInteger(min, max) {
   return Math.floor((max - min) * Math.random()) + min;
 }
 
 export function getRandomIntegers(min, max, numIntegers) {
   const output = [];
   for (let i = 0; i < numIntegers; ++i) {
     output.push(Math.floor((max - min) * Math.random()) + min);
   }
   return output;
 }