const tf_d = require('@tensorflow/tfjs-node')
//import * as tf from '@tensorflow/tfjs'
//const tf_ = require('@tensorflow/tfjs');


function createDeepQNetwork(h, w, numActions, otherStateLength) {
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
    // a rank 3 tensor for input1 respresenting all the lab grid based state (card-shape, 
    //card-orientation, card-number, player position. other player position)
    // a rank 1 tensor with the other State for input 2 that represents the currentPlayers cardTodoList, and the Extra Card
    const input1 = tf_d.input({ shape: [ h, w, 5] });
    const input2 = tf_d.input({ shape: [otherStateLength] })

    // First dense layer uses relu activation.
    const cLayer1 = tf_d.layers.conv2d({
        filters: 64,
        kernelSize: 3,
        strides: 1,
        activation: 'relu',
        inputShape: [h, w, 5]
    }).apply(input1);

    const bLayer1 = tf_d.layers.batchNormalization().apply(cLayer1);

    const cLayer2 = tf_d.layers.conv2d({
        filters: 32,
        kernelSize: 3,
        strides: 1,
        activation: 'relu'
    }).apply(bLayer1);

    /*const bLayer2 = tf_.layers.batchNormalization().apply(cLayer2);

    const cLayer3 = tf_.layers.conv2d({
        filters: 256,
        kernelSize: 3,
        strides: 1,
        activation: 'relu'
    }).apply(bLayer2);*/

    const fLayer = tf_d.layers.flatten().apply(cLayer1);
    const dLayer1 = tf_d.layers.dense({ units: 20, activation: 'softmax' }).apply(fLayer);
    
    const dLayer2 = tf_d.layers.dense({ units: otherStateLength, activation: 'relu' }).apply(input2);

    const concLayer = tf_d.layers.concatenate({ axis: 1, name: 'myConcatenate1' }).apply([dLayer1, dLayer2]);

    const dLayer3 = tf_d.layers.dense({ units: 20, activation: 'softmax' }).apply(concLayer);
    const dLayer4 = tf_d.layers.dense({ units: 10, activation: 'softmax' }).apply(dLayer3);
    const doLayer = tf_d.layers.dropout({rate: 0.25}).apply(dLayer4);
    const output = tf_d.layers.dense({ units: numActions, activation: 'softmax' }).apply(doLayer);


    // Create the model based on the inputs.
    const model = tf_d.model({ inputs: [input1, input2], outputs: output});

    return model;
}

/**
 * Copy the weights from a source deep-Q network to another.
 *
 * @param {tf_.LayersModel} destNetwork The destination network of weight
 *   copying.
 * @param {tf_.LayersModel} srcNetwork The source network for weight copying.
 */
function copyWeights(destNetwork, srcNetwork) {
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
module.exports = { createDeepQNetwork, copyWeights}