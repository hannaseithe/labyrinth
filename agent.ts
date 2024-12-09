import * as tf from '@tensorflow/tfjs-node'
//import * as tf from '@tensorflow/tfjs'
import { getStateTensors, getRandomActions, REWARDS } from './lab.js'
import { createDeepQNetwork } from './dqn.js';
import { assertPositiveInteger, clipGradientsByNorm, updateEmaLoss } from './utils.js';
import { ReplayMemory } from './replayMemory.js'


export class LabGameAgent {
    game;
    epsilon;
    epsilonInit;
    epsilonFinal;
    epsilonDecayFrames;
    epsilonDecayFactor;
    epsilonIncrement_;
    optimizer;
    frameCount;
    onlineNetwork;
    targetNetwork;
    replayMemory;
    replayBufferSize;
    cumulativeReward;
    loss;
    constructor(game, config, online, target) {

        assertPositiveInteger(config.epsilonDecayFrames, 'Epsilon Decay Frames');

        this.game = game;

        this.epsilonInit = config.epsilonInit;
        this.epsilonFinal = config.epsilonFinal;
        this.epsilonDecayFrames = config.epsilonDecayFrames;
        this.epsilonDecayFactor = config.epsilonDecayFactor;
        this.epsilonIncrement_ = (this.epsilonFinal - this.epsilonInit) /
            this.epsilonDecayFrames;
            this.epsilon = this.epsilonInit



        this.optimizer = tf.train.adam(config.learningRate);

        this.frameCount = 0;


        this.onlineNetwork = online;
        this.targetNetwork = target;

        this.replayBufferSize = config.replayBufferSize;
        this.replayMemory = new ReplayMemory(config.replayBufferSize);
        this.cumulativeReward = 0;

        this.reset();
        this.loss = 0;

    }

    playStep() {
        if (this.frameCount > this.replayBufferSize && this.epsilon > this.epsilonFinal) {
            /*this.epsilon = this.frameCount - this.replayBufferSize >= this.epsilonDecayFrames ?
            this.epsilonFinal :
            this.epsilonInit + this.epsilonIncrement_ * (this.frameCount - this.replayBufferSize);*/
            this.epsilon = this.epsilon * this.epsilonDecayFactor
        }
        this.frameCount++;

        // The epsilon-greedy algorithm.
        let action1, action2, action3;
        let negativeReward = 0;
        const state = this.game.getState();
        if (Math.random() < this.epsilon) {
            // Pick an action at random.
            [action1, action2, action3] = getRandomActions(this.game);
            while (!this.game.isMoveAllowed(action3, state.currentPlayer) && !(this.game.isShiftAllowed(action2))) {
                [action1, action2, action3] = getRandomActions(this.game);
            }
        } else {
            let numA3 = this.game.config.numActionsMove
            let numA2 = this.game.config.numActionsShiftCard
            // Greedily pick an action based on online DQN output.
            tf.tidy(() => {
                const [labTensor, otherTensor] =
                    getStateTensors(state, this.game.config);
                 //const a = labTensor.dataSync()
                //const b = otherTensor.dataSync()
                const predValue = this.onlineNetwork.predict([labTensor, otherTensor]).argMax(-1).dataSync()[0];
                action1 = Math.floor(predValue / (numA2*numA3))
                action2 = Math.floor((predValue % (numA2*numA3))/numA3)
                action3 = predValue % numA3
            });
            while (!this.game.isMoveAllowed(action3, state.currentPlayer)) {
                [,, action3] = getRandomActions(this.game);
            }
        }

        const { state: nextState, reward, done } = this.game.step(action1, action2, action3);

        let bufferFull = this.replayMemory.append([state, [action1, action2, action3], reward, 0, done, nextState, null]);

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
            negativeReward: negativeReward,
            bufferFull: bufferFull
        }


    }

    

    trainOnReplayBatch(batchSize, gamma, optimizer) {
        // Get a batch of examples from the replay buffer.
        let numA2 = this.game.config.numActionsShiftCard
        let numA3 = this.game.config.numActionsMove
        let numA1 = this.game.config.numActions - numA2 - numA3
        const batch = this.replayMemory.sample(batchSize);
        const lossFunction = () => tf.tidy(() => {
            const stateTensors = getStateTensors(
                batch.map(example => example[0]), this.game.config);


            const actionTensor = tf.tensor1d(
                batch.map(
                    example => 
                        (example[1][0] * (numA2 * numA3))+(example[1][1] * numA3) + example[1][2]), 'int32')

             //   const a1 = actionTensor.dataSync()
            const predictedActions = this.onlineNetwork.apply(stateTensors, { training: true })
            //const a = actionTensor.dataSync()
            //const c = predictedActions.dataSync()
            const qs = predictedActions.mul(tf.oneHot(actionTensor, numA1*numA2*numA3)).sum(-1);
            //const d = qs.dataSync()

            const rewardTensor = tf.tensor1d(batch.map(example => example[2] + example[3]));
            //const e = rewardTensor.dataSync()
 
            const nextStateTensor = getStateTensors(
                batch.map(example => example[5]), this.game.config);

            const nextStateQs =
                this.targetNetwork.predict(nextStateTensor);
            
            //const f = nmq1.dataSync()
            //const g = nmq2.dataSync()
            //const h = nmq3.dataSync()

            const doneMask = tf.scalar(1).sub(
                tf.tensor1d(batch.map(example => example[4])).asType('float32'));
              //  const d1 = doneMask.dataSync()
            //const f1 = nmq1.max(-1).dataSync()
            //const f2 = nmq2.max(-1).dataSync()
            //const f3 = nmq3.max(-1).dataSync()
            //const f4 = tf.concat([nmq1.max(-1),nmq2.max(-1),nmq3.max(-1)]).sum(-1).dataSync()


           // const targetQs =rewardTensor.add(tf.concat([nmq1, nmq2, nmq3], 1).max(-1).mul(doneMask).mul(gamma))



            const targetQs = rewardTensor.add(nextStateQs.max(-1).mul(doneMask).mul(gamma));
            //const i = targetQs.dataSync()

            const losses = tf.losses.meanSquaredError(targetQs, qs).asScalar()
            this.loss = updateEmaLoss(losses.dataSync()[0],this.loss, 0.1)
            return losses;
        });

        // Calculate the gradients of the loss function with repsect to the weights
        // of the online DQN.
        const grads = tf.variableGrads(lossFunction);
        // Use the gradients to update the online DQN's weights.
        const clipNorm = 1.0; // Set the desired clipping threshold
        const clippedGrads = clipGradientsByNorm(
          grads.grads,
          clipNorm
        );

        optimizer.applyGradients(clippedGrads);
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
    buffersFull = false;
    doneCounter = 0;
    constructor(number, game, config) {
        this.game = game
        this.onlineNetwork =
            createDeepQNetwork(game.config.height, game.config.width, 4, game.config.numActionsShiftCard, game.config.numActionsMove, game.config.otherStateLength);
        this.targetNetwork =
            createDeepQNetwork(game.config.height, game.config.width, 4, game.config.numActionsShiftCard, game.config.numActionsMove, game.config.otherStateLength);
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
        let buffersFull = true

        for (let i = 0; i < this.number; i++) {
            let { state, cumulativeReward, negativeReward, done, bufferFull } = this.agents[i].playStep();
            buffersFull = !bufferFull ? false : buffersFull;
            done_ = done;
            if (!done) {
                turnResults.push({ state, cumulativeReward, done });
                for (let j = 1; j < this.number; j++) {
                    this.agents[(i + j) % this.number].addNegativeReward(negativeReward);
                }
                this.agents[i].addFinalState(state);
            } else {
                for (let j = 1; j < this.number - 1; j++) {
                    this.agents[(i + j) % this.number].addNegativeReward(negativeReward);
                    this.agents[(i + j) % this.number].addFinalState(state);
                    this.agents[(i + j) % this.number].setDone();
                }

                this.agents[i].addFinalState(state);
                this.agents[i].setDone();
                if (i < this.number -1) {
                    buffersFull = false
                }
                break;
            }
        }
        this.buffersFull = buffersFull;

        this.cumulativeRewards = this.agents.map(agent => agent.cumulativeReward)
        if (done_) {
            this.doneCounter++
        }

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