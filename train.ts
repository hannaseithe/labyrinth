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
const tf = require('@tensorflow/tfjs-node')
//import * as tf from '@tensorflow/tfjs'
const LabGameSuperAgent_t = require("./agent.js").LabGameSuperAgent;
const LabGame_t = require("./lab.js").LabGame;
const fs = require('fs');
const path = require('path');
const argparse = require('argparse');


async function train(superAgent, batchSize, gamma, learningRate, cumulativeRewardThreshold,
    maxNumFrames, syncEveryFrames, savePath, logDir) {


    for (let i = 0; i < superAgent.replayBufferSize; ++i) {
      const { done, cumulativeRewards } = superAgent.playTurn();
      const totalReward = cumulativeRewards.reduce((acc,value) => (acc + value));
        console.log("Turn: "+superAgent.frameCount)
          console.log("Total Reward: " + totalReward)
    }

    const optimizer = tf.train.adam(learningRate);
    let totalRewardBest = -100000;
    console.log('starting training on Replay Batch')
    while (true) {

        superAgent.trainOnReplayBatch(batchSize, gamma, optimizer);
        const { done, cumulativeRewards } = superAgent.playTurn();
        const totalReward = cumulativeRewards.reduce((acc,value) => (acc + value));
        if (done) {
         /* const t = new Date().getTime();
          const framesPerSecond =
              (superAgent.frameCount - frameCountPrev) / (t - tPrev) * 1e3;
          tPrev = t;
          frameCountPrev = superAgent.frameCount;*/
    
          
          
    
          /*console.log(
              `Frame #${agent.frameCount}: ` +
              `cumulativeReward100=${averageReward100.toFixed(1)}; ` +
              `eaten100=${averageEaten100.toFixed(2)} ` +
              `(epsilon=${agent.epsilon.toFixed(3)}) ` +
              `(${framesPerSecond.toFixed(1)} frames/s)`);
          if (summaryWriter != null) {
            summaryWriter.scalar(
                'cumulativeReward100', averageReward100, agent.frameCount);
            summaryWriter.scalar('eaten100', averageEaten100, agent.frameCount);
            summaryWriter.scalar('epsilon', agent.epsilon, agent.frameCount);
            summaryWriter.scalar(
                'framesPerSecond', framesPerSecond, agent.frameCount);
          }*/
          
          if (totalReward > totalRewardBest) {
              totalRewardBest = totalReward;
            if (savePath != null) {
              if (!fs.existsSync(savePath)) {
                fs.mkdir(path.join(__dirname, savePath),
                { recursive: true },
                (err) => {
                    if (err) {
                        return console.error(err);
                    }
                    console.log('Directory created successfully!');
                }); 
                
              }
              await superAgent.onlineNetwork.save(`file://${savePath}`);
              console.log(`Saved DQN to ${savePath}`);
            }
          }
        }
        if (superAgent.frameCount % 100 == 0) {
          console.log("Turn: "+superAgent.frameCount)
          console.log("Total Reward: " + totalReward)
        }
        if (superAgent.frameCount >= maxNumFrames) {
          if (totalReward > totalRewardBest) {
            totalRewardBest = totalReward;
          if (savePath != null) {
            if (!fs.existsSync(savePath)) {
              fs.mkdir(path.join(__dirname, savePath),
                { recursive: true },
                (err) => {
                    if (err) {
                        return console.error(err);
                    }
                    console.log('Directory created successfully!');
                }); 
            }
            await superAgent.onlineNetwork.save(`file://${savePath}`);
            console.log(`Saved DQN to ${savePath}`);
          }
        }
          break;
        }
    }


}

function parseArguments() {
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
      defaultValue: 1e5,
      help: 'Maximum number of frames to run durnig the training. ' +
      'Training ends immediately when this frame count is reached.'
    });
    parser.addArgument('--replayBufferSize', {
      type: 'int',
      defaultValue: 3e2,
      help: 'Length of the replay memory buffer.'
    });
    parser.addArgument('--epsilonInit', {
      type: 'float',
      defaultValue: 0.9,
      help: 'Initial value of epsilon, used for the epsilon-greedy algorithm.'
    });
    parser.addArgument('--epsilonFinal', {
      type: 'float',
      defaultValue: 0.01,
      help: 'Final value of epsilon, used for the epsilon-greedy algorithm.'
    });
    parser.addArgument('--epsilonDecayFrames', {
      type: 'int',
      defaultValue: 3e4,
      help: 'Number of frames of game over which the value of epsilon ' +
      'decays from epsilonInit to epsilonFinal'
    });
    parser.addArgument('--batchSize', {
      type: 'int',
      defaultValue: 16,
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
      defaultValue: '../models/dqn',
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

    console.log(`args: ${JSON.stringify(args, null, 2)}`);
  
    let game = new LabGame_t(0, 4, args.height, args.width, false);

    let agentConfig = {
        replayBufferSize: args.replayBufferSize,
        epsilonInit: args.epsilonInit,
        epsilonFinal: args.epsilonFinal,
        epsilonDecayFrames: args.epsilonDecayFrames,
        learningRate: args.learningRate
    }

    let superAgent = new LabGameSuperAgent_t(4, game, agentConfig);
  
    await train(
        superAgent, args.batchSize, args.gamma, args.learningRate,
        args.cumulativeRewardThreshold, args.maxNumFrames,
        args.syncEveryFrames, args.savePath, args.logDir);
  }
  

    main();
 module.exports = {}