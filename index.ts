import { LabGame } from './lab.js';

let game;


function initGame() {

  game = new LabGame(1,1,4,4,true);

}

(async function() {
    try {
      //qNet = await tf.loadLayersModel(LOCAL_MODEL_URL);
      //loadHostedModelButton.textContent = `Loaded model from ${LOCAL_MODEL_URL}`;
      initGame();
    } catch (err) {
      console.log('Loading local model failed.');
    }
  
  })();