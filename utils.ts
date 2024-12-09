 import * as tf from '@tensorflow/tfjs-node';


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

export function assertPositiveInteger(x, name) {
  if (!Number.isInteger(x)) {
    throw new Error(
        `Expected ${name} to be an integer, but received ${x}`);
  }
  if (!(x > 0)) {
    throw new Error(
        `Expected ${name} to be a positive number, but received ${x}`);
  }

    // You can change this for more or less smoothing
  

}

export function updateEmaLoss(loss, ema, smoothingFactor) {
  // If this is the first loss, initialize EMA with the first loss
  if (ema === 0) {
      ema = loss;
  } else {
      ema = smoothingFactor * loss + (1 - smoothingFactor) * ema;
  }

  return ema;
}

export function clipGradientsByNorm(namedGrads:tf.NamedTensorMap, clipNorm) {
  // Calculate the global norm of all gradients
  const globalNorm = tf.tidy(() =>
    tf.sqrt(
      Object.values(namedGrads)
        .map(g => g.square().sum())
        .reduce((acc, curr) => acc.add(curr), tf.scalar(0))
    )
  );

  // If globalNorm > clipNorm, scale all gradients
  if (globalNorm.dataSync()[0] > clipNorm) {
    const scale = clipNorm / globalNorm.dataSync()[0];
    //console.log(`Clipped grads with scale ${scale}`)

    // Scale each gradient in the NamedTensorMap
    const clippedGrads = {};
    for (const [name, grad] of Object.entries(namedGrads)) {
      clippedGrads[name] = grad.mul(scale);
    }

    globalNorm.dispose(); // Dispose the global norm tensor
    return clippedGrads; // Return a NamedTensorMap
  }

  globalNorm.dispose(); // Dispose the global norm tensor
  return namedGrads; // Return the gradients as-is if no clipping is needed
}