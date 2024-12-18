import * as tf from '@tensorflow/tfjs-node'
//import * as tf from '@tensorflow/tfjs'
//const tf_ = require('@tensorflow/tfjs');


export function createDeepQNetwork(h, w, numA1,numA2, numA3, otherStateLength) {
    if (!(Number.isInteger(h) && h > 0)) {
        throw new Error(`Expected height to be a positive integer, but got ${h}`);
    }
    if (!(Number.isInteger(w) && w > 0)) {
        throw new Error(`Expected width to be a positive integer, but got ${w}`);
    }

    // a rank 3 tensor for input1 respresenting all the lab grid based state (card-shape, 
    //card-orientation, card-number, player position. other player position)
    // a rank 1 tensor with the other State for input 2 that represents the currentPlayers cardTodoList, and the Extra Card
    const input1 = tf.input({ shape: [ 7, h, w] });
    const input2 = tf.input({ shape: [6] })

    const cLayer1 = tf.layers.conv2d({
        filters: 16,
        kernelSize: 2,
        strides: 1,
        activation: 'relu',
        inputShape: [7, h, w],
        kernelInitializer: 'heNormal'
    }).apply(input1);

    const bLayer1 = tf.layers.batchNormalization().apply(cLayer1);

    const cLayer2 = tf.layers.conv2d({
        filters: 32,
        kernelSize: 2,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'heNormal'
    }).apply(bLayer1);

    const bLayer2 = tf.layers.batchNormalization().apply(cLayer2);
 
    const cLayer3 = tf.layers.conv2d({
        filters: 64,
        kernelSize: 2,
        strides: 1,
        activation: 'relu',
        kernelInitializer: 'heNormal'
    }).apply(bLayer2);


    const flatten1 = tf.layers.flatten().apply(cLayer2);


    const dLayer1 = tf.layers.dense({ units: 64, activation: 'relu', kernelInitializer: 'heNormal' }).apply(input2);
    const dLayer2 = tf.layers.dense({ units: 64, activation: 'relu', kernelInitializer: 'heNormal' }).apply(dLayer1);

    const dropoutDenseBranch = tf.layers.dropout({ rate: 0.5 }).apply(dLayer2);

    const concatenated = tf.layers.concatenate().apply([flatten1 as tf.SymbolicTensor, dropoutDenseBranch as tf.SymbolicTensor]);

    const dLayer3 = tf.layers.dense({ units: 128, activation: 'relu', kernelInitializer: 'heNormal' }).apply(concatenated);

    const dropoutShared = tf.layers.dropout({ rate: 0.05 }).apply(dLayer3);

    const branch1 = tf.layers.dense({ units: 64, activation: 'relu', kernelInitializer: 'heNormal' }).apply(dropoutShared);
    const output1 = tf.layers.dense({ units: numA1 * numA2 * numA3, activation: 'softmax', name: 'output1', kernelInitializer: tf.initializers.randomUniform({ minval: -0.05, maxval: 0.05 }), }).apply(branch1);
    
    /*const branch2 = tf.layers.dense({ units: 64, activation: 'relu', kernelInitializer: 'heNormal' }).apply(dropoutShared);
    const output2 = tf.layers.dense({ units: numA2, activation: 'softmax', name: 'output2', kernelInitializer: tf.initializers.randomUniform({ minval: -0.05, maxval: 0.05 }), }).apply(branch2);

    const branch3 = tf.layers.dense({ units: 64, activation: 'relu', kernelInitializer: 'heNormal' }).apply(dropoutShared);
    const output3 = tf.layers.dense({ units: numA3, activation: 'softmax', name: 'output3', kernelInitializer: tf.initializers.randomUniform({ minval: -0.05, maxval: 0.05 }), }).apply(branch3);
*/
    const model = tf.model({
        inputs: [input1, input2],
        outputs: [output1 as tf.SymbolicTensor]
    });

    // Modell zusammenfassen
    model.summary();

    return model;
}

/**
 * Copy the weights from a source deep-Q network to another.
 *
 * @param {tf_.LayersModel} destNetwork The destination network of weight
 *   copying.
 * @param {tf_.LayersModel} srcNetwork The source network for weight copying.
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