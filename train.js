//set up model
//initial Game with agents
//play game x number of times
//learn


//create Model

//STATE:
//CONVOLUTIONAL layer for labyrinth [x][y] : shape, orientation, number -> so wie RGB Pixel
//player: currentIndex: [indexX, indexY],listNumbers: listNumbers
//extraCard: shape,orientation,number
//currentPlayer

import { LabGameSuperAgent } from "./agent.js";
import { LabGame } from "./lab.js";


function train(superAgent, batchSize, gamma, learningRate, cumulativeRewardThreshold,
    maxNumFrames, syncEveryFrames, savePath, logDir) {
    let batchSize, gamma, learningRate, cumulativeRewardThreshold,
        savePath, logDir;

    for (let i = 0; i < agentConfig.replayBufferSize; ++i) {
        superAgent.playTurn();
    }




    //play steps up to Buffersize to fill up Memory

    //once Buffer is filled up learn from memory

    const optimizer = tf.train.adam(learningRate);

    while (true) {
        superAgent.trainOnReplayBatch(batchSize, gamma, optimizer);
        const { cumulativeRewards, done } = superAgent.playTurn();
        if (done) {


            //save Network if Progress

            //stop Training if Threshhold achieved

            // log progress to console

            //update summaryWriter for Tensorboard
            //- numberTurns
            //- who is winner
            //- cumulativeRewards
            //snake Game logs other stuff (averageReward, averageEaten, epsilon, framesperSecond)
        }
    }


}

export function parseArguments() {
    const parser = new argparse.ArgumentParser({
      description: 'Training script for a DQN that plays the labyrinth game'
    });
    parser.addArgument('--gpu', {
      action: 'storeTrue',
      help: 'Whether to use tfjs-node-gpu for training ' +
      '(requires CUDA GPU, drivers, and libraries).'
    });
    parser.addArgument('--height', {
      type: 'int',
      defaultValue: 9,
      help: 'Height of the game board.'
    });
    parser.addArgument('--width', {
      type: 'int',
      defaultValue: 9,
      help: 'Width of the game board.'
    });
    parser.addArgument('--cumulativeRewardThreshold', {
      type: 'float',
      defaultValue: 100,
      help: 'Threshold for cumulative reward (its moving ' +
      'average) over the 100 latest games. Training stops as soon as this ' +
      'threshold is reached (or when --maxNumFrames is reached).'
    });
    parser.addArgument('--maxNumFrames', {
      type: 'float',
      defaultValue: 1e6,
      help: 'Maximum number of frames to run durnig the training. ' +
      'Training ends immediately when this frame count is reached.'
    });
    parser.addArgument('--replayBufferSize', {
      type: 'int',
      defaultValue: 1e4,
      help: 'Length of the replay memory buffer.'
    });
    parser.addArgument('--epsilonInit', {
      type: 'float',
      defaultValue: 0.5,
      help: 'Initial value of epsilon, used for the epsilon-greedy algorithm.'
    });
    parser.addArgument('--epsilonFinal', {
      type: 'float',
      defaultValue: 0.01,
      help: 'Final value of epsilon, used for the epsilon-greedy algorithm.'
    });
    parser.addArgument('--epsilonDecayFrames', {
      type: 'int',
      defaultValue: 1e5,
      help: 'Number of frames of game over which the value of epsilon ' +
      'decays from epsilonInit to epsilonFinal'
    });
    parser.addArgument('--batchSize', {
      type: 'int',
      defaultValue: 64,
      help: 'Batch size for DQN training.'
    });
    parser.addArgument('--gamma', {
      type: 'float',
      defaultValue: 0.99,
      help: 'Reward discount rate.'
    });
    parser.addArgument('--learningRate', {
      type: 'float',
      defaultValue: 1e-3,
      help: 'Learning rate for DQN training.'
    });
    parser.addArgument('--syncEveryFrames', {
      type: 'int',
      defaultValue: 1e3,
      help: 'Frequency at which weights are sync\'ed from the online network ' +
      'to the target network.'
    });
    parser.addArgument('--savePath', {
      type: 'string',
      defaultValue: './models/dqn',
      help: 'File path to which the online DQN will be saved after training.'
    });
    parser.addArgument('--logDir', {
      type: 'string',
      defaultValue: null,
      help: 'Path to the directory for writing TensorBoard logs in.'
    });
    return parser.parseArgs();
  }
  
  async function main() {
    const args = parseArguments();
    if (args.gpu) {
      tf = require('@tensorflow/tfjs-node-gpu');
    } else {
      tf = require('@tensorflow/tfjs-node');
    }
    console.log(`args: ${JSON.stringify(args, null, 2)}`);
  
    let game = new LabGame(0, 4, false);

    let agentConfig = {
        replayBufferSize: 1e4,
        epsilonInit: 0.5,
        epsilonFinal: 0.01,
        epsilonDecayFrames: 1e5,
        learningRate: 1e-3
    }

    let superAgent = new LabGameSuperAgent(game, agentConfig);
  
    await train(
        superAgent, args.batchSize, args.gamma, args.learningRate,
        args.cumulativeRewardThreshold, args.maxNumFrames,
        args.syncEveryFrames, args.savePath, args.logDir);
  }
  
  if (require.main === module) {
    main();
  }