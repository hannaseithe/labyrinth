import * as tf from '@tensorflow/tfjs'
import { getStateTensors } from './lab.js';

export class LabGamePlayer {
    game;
    onlineNetwork;
    constructor(game, online) {
        this.game = game;
        this.onlineNetwork = online;
    }

    playStep() {


        // The epsilon-greedy algorithm.
        let action1, action2, action3;
        const state = this.game.getState();
      

            tf.tidy(() => {
                const [labTensor, otherTensor] =
                    getStateTensors(state, this.game.config);
                // const a = labTensor.dataSync()
                //const b = otherTensor.dataSync()
                const predictionTensor = this.onlineNetwork.predict([labTensor, otherTensor]);
                action1 = predictionTensor[0].argMax(-1).dataSync()[0]
                action2 = predictionTensor[1].argMax(-1).dataSync()[0]
                action3 = predictionTensor[2].argMax(-1).dataSync()[0]
            });
        

        this.game.stepAsync(action1, action2, action3);


    }
}