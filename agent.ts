import * as tf from '@tensorflow/tfjs-node'
//import * as tf from '@tensorflow/tfjs'
import {getStateTensors, getRandomActions, REWARDS} from './lab.js'
import { createDeepQNetwork } from './dqn.js';
import { assertPositiveInteger } from './utils.js';
import { ReplayMemory } from './replayMemory.js'



export class LabGameAgent {
    game;
    epsilon;
    epsilonInit;
    epsilonFinal;
    epsilonDecayFrames;
    epsilonIncrement_;
    optimizer;
    frameCount;
    onlineNetwork;
    targetNetwork;
    replayMemory;
    cumulativeReward;
    constructor(game, config, online, target) {

        assertPositiveInteger(config.epsilonDecayFrames, 'Epsilon Decay Frames');

        this.game = game;
    
        this.epsilonInit = config.epsilonInit;
        this.epsilonFinal = config.epsilonFinal;
        this.epsilonDecayFrames = config.epsilonDecayFrames;
        this.epsilonIncrement_ = (this.epsilonFinal - this.epsilonInit) /
            this.epsilonDecayFrames;
    

    
        this.optimizer = tf.train.adam(config.learningRate);
    
        this.frameCount = 0;


        this.onlineNetwork = online;
        this.targetNetwork = target;


        this.replayMemory = new ReplayMemory(config.replayBufferSize);
        this.cumulativeReward = 0;

        this.reset();

    }

    playStep() {
        this.epsilon = this.frameCount >= this.epsilonDecayFrames ?
        this.epsilonFinal :
        this.epsilonInit + this.epsilonIncrement_  * this.frameCount;
        this.frameCount++;

        // The epsilon-greedy algorithm.
        let action1, action2, action3;
        let negativeReward = 0;
        const state = this.game.getState();
        if (Math.random() < this.epsilon) {
            // Pick an action at random.
            [action1, action2, action3 ] = getRandomActions();
        } else {
            // Greedily pick an action based on online DQN output.
            tf.tidy(() => {
                const [labTensor,otherTensor] =
                    getStateTensors(state,this.game.config);
                const predictionTensor = this.onlineNetwork.predict([labTensor,otherTensor]).reshape([-1]);
                action1 = predictionTensor.slice(0, 4).argMax(-1).dataSync()[0]
                action2 = predictionTensor.slice(4, 16).argMax(-1).dataSync()[0]
                action3 = predictionTensor.slice(20, 81).argMax(-1).dataSync()[0]
            });
        }

        const { state: nextState, reward, done } = this.game.step(action1, action2, action3);

        this.replayMemory.append([state, [action1, action2, action3], reward, 0, done, nextState, null]);

        this.cumulativeReward += reward;

        switch (reward) {
            case REWARDS.WIN: 
                negativeReward = REWARDS.LOST;
                break;
            case REWARDS.NUMBER_FOUND:
                negativeReward = REWARDS.OTHER_FOUND_NUMBER;
                break;
        }

        return {
            state: nextState,
            cumulativeReward: this.cumulativeReward,
            done: done,
            negativeReward: negativeReward
        }


    }

    trainOnReplayBatch(batchSize, gamma, optimizer) {
        // Get a batch of examples from the replay buffer.
        const batch = this.replayMemory.sample(batchSize);
        const lossFunction = () => tf.tidy(() => {
            const stateTensors = getStateTensors(
                batch.map(example => example[0]), this.game.config);

            const actionBatch = batch.map(example => tf.oneHot(example[1][0],4)
            .concat(tf.oneHot(example[1][1],16))
            .concat(tf.oneHot(example[1][2],81)).arraySync())
                
            const actionTensor = tf.tensor2d(actionBatch,[16,101]);      
            const qs = this.onlineNetwork.apply(stateTensors, { training: true }).mul(actionTensor).sum(-1);

            const rewardTensor = tf.tensor1d(batch.map(example => example[2] + example [3]));
            const nextStateTensor = getStateTensors(
                batch.map(example => example[5]), this.game.config);
            const nextMaxQTensor =
                this.targetNetwork.predict(nextStateTensor).max(-1);
            const doneMask = tf.scalar(1).sub(
                tf.tensor1d(batch.map(example => example[4])).asType('float32'));
            const targetQs =
                rewardTensor.add(nextMaxQTensor.mul(doneMask).mul(gamma));
            return tf.losses.meanSquaredError(targetQs, qs).asScalar();
        });

        // Calculate the gradients of the loss function with repsect to the weights
        // of the online DQN.
        const grads = tf.variableGrads(lossFunction);
        // Use the gradients to update the online DQN's weights.
        optimizer.applyGradients(grads.grads);
        tf.dispose(grads);
        // TODO(cais): Return the loss value here?
    }

    reset() {
        this.cumulativeReward = 0;
    }

    addNegativeReward(reward) {
        this.cumulativeReward += reward;
        this.replayMemory.addNegativeReward(reward);
    }

    addFinalState(state) {
        this.replayMemory.addFinalState(state);
    }

    setDone() {
        this.replayMemory.setDone();
    }

}

export class LabGameSuperAgent {
    onlineNetwork;
    targetNetwork;
    number;
    agents;
    frameCount;
    game;
    replayBufferSize;
    cumulativeRewards;
    constructor(number, game, config) {
        this.game = game
        this.onlineNetwork =
            createDeepQNetwork(game.config.height, game.config.width, game.config.numActions, game.config.otherStateLength);
        this.targetNetwork =
            createDeepQNetwork(game.config.height,  game.config.width, game.config.numActions, game.config.otherStateLength);
        this.targetNetwork.trainable = false;
        this.number = number;
        this.agents = [];
        for (let i = 0; i < number; i++) {
            this.agents[i] = new LabGameAgent(game, config, this.onlineNetwork, this.targetNetwork)
        }
        this.frameCount = 0;
        this.replayBufferSize = config.replayBufferSize;
        this.cumulativeRewards = Array(number).fill(0)
        this.reset();

    }

    playTurn() {

        let done_;
        let turnResults = [];
        let step = 0;

        for (let i = 0; i < this.number; i++) {
            let { state, cumulativeReward, negativeReward, done} = this.agents[i].playStep();
            done_ = done;
            if (!done) {
                turnResults.push({ state, cumulativeReward, done });
                for (let j = 1 ; j < this.number; j++) {
                    this.agents[(i + j) % this.number].addNegativeReward(negativeReward);
                }
                this.agents[i].addFinalState(state);
            } else {
                for (let j = 1 ; j < this.number-1; j++) {
                    this.agents[(i + j) % this.number].addNegativeReward(negativeReward);
                    this.agents[(i + j) % this.number].addFinalState(state);
                    this.agents[(i+j) % this.number].setDone();
                }
                
                this.agents[i].addFinalState(state);
                this.agents[i].setDone();
                break;
            }
        }


       this.cumulativeRewards = this.agents.map(agent => agent.cumulativeReward)

        const output = {
            cumulativeRewards: this.cumulativeRewards,
            done: done_
        };
        if (done_) {
            this.reset();
        }
        this.frameCount++
        return output;


    }

    trainOnReplayBatch(batchSize, gamma, optimizer) {
        this.agents.forEach((agent) => agent.trainOnReplayBatch(batchSize, gamma, optimizer))
    }

    reset() {
        this.agents.forEach((agent) => agent.reset());

        this.game.reset();
    }

}