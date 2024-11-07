
import * as tf from '@tensorflow/tfjs';

export function createDeepQNetwork(h, w, numActions) {
    if (!(Number.isInteger(h) && h > 0)) {
        throw new Error(`Expected height to be a positive integer, but got ${h}`);
    }
    if (!(Number.isInteger(w) && w > 0)) {
        throw new Error(`Expected width to be a positive integer, but got ${w}`);
    }
    if (!(Number.isInteger(numActions) && numActions > 1)) {
        throw new Error(
            `Expected numActions to be a integer greater than 1, ` +
            `but got ${numActions}`);
    }


    // Define input, which has a size of 5 (not including batch dimension).
    const input1 = tf.input({ shape: [9, 9, 5] });
    const input2 = tf.input({ shape: [6] })

    // First dense layer uses relu activation.
    const cLayer1 = tf.layers.conv2d({
        filters: 128,
        kernelSize: 3,
        strides: 1,
        activation: 'relu',
        inputShape: [9, 9, 5]
    }).apply(input1);

    const bLayer1 = tf.layers.batchNormalization().apply(cLayer1);

    const cLayer2 = tf.layers.conv2d({
        filters: 256,
        kernelSize: 3,
        strides: 1,
        activation: 'relu'
    }).apply(bLayer1);

    const bLayer2 = tf.layers.batchNormalization().apply(cLayer2);

    const cLayer3 = tf.layers.conv2d({
        filters: 256,
        kernelSize: 3,
        strides: 1,
        activation: 'relu'
    }).apply(bLayer2);

    const fLayer = tf.layers.flatten().apply(cLayer3);
    const dLayer1 = tf.layers.dense({ units: 74, activation: 'softmax' }).apply(fLayer);
    
    const dLayer2 = tf.layers.dense({ units: 6, activation: 'relu' }).apply(input2);

    const concLayer = tf.layers.concatenate({ axis: 1, name: 'myConcatenate1' }).apply([dLayer1, dLayer2]);

    const dLayer3 = tf.layers.dense({ units: 40, activation: 'softmax' }).apply(concLayer);
    const dLayer4 = tf.layers.dense({ units: 20, activation: 'softmax' }).apply(dLayer3);
    const doLayer = tf.layers.dropout({rate: 0.25}).apply(dLayer4);
    const output = tf.layers.dense({ units: 4 + 16 + 81, activation: 'softmax' }).apply(doLayer);


    // Create the model based on the inputs.
    const model = tf.model({ inputs: [input1, input2], outputs: output });

    return model;
}

/**
 * Copy the weights from a source deep-Q network to another.
 *
 * @param {tf.LayersModel} destNetwork The destination network of weight
 *   copying.
 * @param {tf.LayersModel} srcNetwork The source network for weight copying.
 */
export function copyWeights(destNetwork, srcNetwork) {
    // https://github.com/tensorflow/tfjs/issues/1807:
    // Weight orders are inconsistent when the trainable attribute doesn't
    // match between two `LayersModel`s. The following is a workaround.
    // TODO(cais): Remove the workaround once the underlying issue is fixed.
    let originalDestNetworkTrainable;
    if (destNetwork.trainable !== srcNetwork.trainable) {
        originalDestNetworkTrainable = destNetwork.trainable;
        destNetwork.trainable = srcNetwork.trainable;
    }

    destNetwork.setWeights(srcNetwork.getWeights());

    // Weight orders are inconsistent when the trainable attribute doesn't
    // match between two `LayersModel`s. The following is a workaround.
    // TODO(cais): Remove the workaround once the underlying issue is fixed.
    // `originalDestNetworkTrainable` is null if and only if the `trainable`
    // properties of the two LayersModel instances are the same to begin
    // with, in which case nothing needs to be done below.
    if (originalDestNetworkTrainable != null) {
        destNetwork.trainable = originalDestNetworkTrainable;
    }
}
