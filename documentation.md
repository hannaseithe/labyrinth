1. Theorie
   1. Reinforcement Learning

RL ist Teil des Machine Learning, "addresses the problem of the automatic learning of optimal decisions over time." (Lapan:1) und "Machine learning (ML) is a field of study in artificial intelligence concerned with the development and study of statistical algorithms that can learn from data and generalize to unseen data, and thus perform tasks without explicit instructions." (Wikipedia)

3 challenges:
- no iid data (= independent and identically distributed), if there is no thorough exploration (and select data from the experience randomly) we cannot learn everything there is
- exploration / exploitation balance: If we exploit too much we miss out on relevant data (s.a.) but if we explore too much can also be detrimental to the learning process (already learned stuff might be even forgotten)
- delayed reward, a positive action might be only rewarded at a later point in time

2 major entities: Agent adn Enivronment
3 communication channels between them: 
- Reward (E -> A)
- Action (A -> E)
- Observation (E -> A)

Reward
"purpose of reward is to give an agent feedback about its success" (Lapan: 6)
- the reward encourages (positively reinforces) good behaviour and discourages (negatively reinforces) bad beahviour

Markov Decision Process (MDP)
1. Markov Process:
   - Also known as **Markov Chain**.
   - An environment can only be observed. The Observations are called **states**, and the system can switch
    between states according to some laws of dynamics.
    - **Statepace** is the finite set of all possible states
    - Observations form a sequence/chain, which is called **history**.
    - **Markov Property** implies that only the current state is necessary to model the next state.
    - A **transition matrix** describes the probabilities of transitioning from one state to the other. Its of the size nxn, where n is the number of possible states 
    - **episodes** are observed sequences of states
    - Markov Property imples **stationarity**, meaning the underlying dynamics do not change over time
2. Markov Reward Process
   - now each transition is assigned a specific reward (stored in a nxn reward matrix)
   - if the reward depends only on the target state reawrds can be stored in n-vector
   - -the **discount factor** gamma represents the foresightedness of the agent as the rewards are summed over time, while depending on gamma rewards on the part slowly fade (0 < gamma < 1). If gamma equals 0, older rewards are immediately forgotten, if gamme equals 1 rewards never fade
   - **return** is the discounted sum of rewards of an episode over time:
   - **G(t) = r(t)+gamma * (r(t-1) + gamma * r(t-2) * (...))**
   - **value of the state** is the mathematical expactation of return for any state:
   - **V(s)=E[G|S(t) = s]**
   - "for every state, s, the value, V(s), is the average
(or expected) return we get by following the Markov reward process" (Lapan: 18)
   - if gamma equals zero the value of a state is simply the expected reward of the next state transition (sum the products of rewards with their specific transition probabilities)
   - if gamma equals 1 than the value is infinite for all states, but if we are dealing with finite episodes only, gamma can be 1
3. Markov Decision Process
   - **action space** is the finite set of all possible actions
   - the action space extends the transition matrix with an action dimension (nxnxa matrix, a being the size of the action space) so that the probabilities depend on current state, target state and performed action
   - the action space also extends the reward matrix to an nxnxa matrix
4. Policy
   - "policy is defined as the probability distribution over actions for every
possible state:" (Lapan : 23)
   - **pi(a | s) = P [ A(t) = a | S(t) = s ]**

RL Methods
- **model-free** vs. **model-based**:
  - "The term "model-free" means that the method doesn't build a model of the
environment or reward; it just directly connects observations to actions (or values
that are related to actions). In other words, the agent takes current observations and
does some computations on them, and the result is the action that it should take." (Lapan: 84)
  - "In contrast, model-based methods try to predict what the next observation and/or
reward will be. Based on this prediction, the agent tries to choose the best possible
action to take, very often making such predictions multiple times to look more and
more steps into the future." (Lapan:84)
    - "usually pure model-based
methods are used in deterministic environments, such as **board games** with strict
rules." (Lapan: 84)
- **policy-based** vs. **value-based**
  - "policy-based methods directly approximate the
policy of the agent, that is, what actions the agent should carry out at every step. The
policy is usually represented by a probability distribution over the available actions" (Lapan: 84)
  - "the method could be value-based. In this case, instead of the probability
of actions, the agent calculates the value of every possible action and chooses the
action with the best value." (Lapan: 84)

The Bellmann Equation
- **V_0 = max_a(r_a + gamma * V_a)**
- => this behavior gives an optimal outcome for determinstic case
- for stochastic case we calculate the value of an action: V_0(a) = E_s~S[ r_s,a + gamma + V_s ] = Sum_s_of_S(p_a,0->s * (r_s,a + gamma + V_s) )
- => general Bellman optimality equaltion:
- **V_0 = max_a(E_s~S[ r_s,a + gamma + V_s ]) = max_a(Sum_s_of_S(p_a,0->s * (r_s,a + gamma + V_s) ))**
- "These values not only give us the best reward that we can obtain, but they basically
give us the optimal policy to obtain that reward" (Lapan: 112)

Value of the action (or Q-Value)
- the Q-value "equals the
total reward we can get by executing action a in state s" (Lapan: 112)
- **V(s) = max_a(Q(s,a))**
- and recursively: **Q(a,s) = r_s,a + gamma + max_a'(Q(s',a'))**
- **value iteration algorithm** allows us to numerically calculate the values of states and values of actions (q-values):
- for value of state:
1. Initialize the values of all states, V_i, to some initial value (usually zero)
2. For every state, s, in the MDP, perform the Bellman update:
    **V_𝑠 ← max_𝑎( Σ (𝑝_𝑎,𝑠→𝑠′ * (𝑟_𝑠,𝑎 + 𝛾 * 𝑉_𝑠′ ) ) )**
𝑠𝑠′
1. Repeat step 2 for some large number of steps or until changes become too
small
- for value of action: 
1. Initialize Q_s,a to zero
2. For every state, s, and action, a, in this state, perform this update:
   **Q_𝑠,a ← Σ (𝑝_𝑎,𝑠→𝑠′ * (𝑟_𝑠,𝑎 + 𝛾 * 𝑉_𝑠′ ) )**
- limitations:
  - "our state space should be discrete and small enough to perform multiple
iterations over all states" (Lapan : 117)

Tabular Q-Learning
- solves the large state space problem of the value iteration algorithm:
1. Start with an empty table, mapping states to values of actions.
2. By interacting with the environment, obtain the tuple s, a, r, s' (state,
action, reward, and the new state). In this step, you need to decide which
action to take, and there is no single proper way to make this decision. 
3. Update the Q(s, a) value using the Bellman approximation:
Q(s,a) ← r + 𝛾 max_a'(Q(s',a'))
4. Repeat from step 2.

- Q-values are not updated by completely overwriting old ones, but rather updated with approximations, so that the learning does not become unstable:
- **Q(s,a) ← (1-𝛼) Q(s,a) + 𝛼 (r + 𝛾 max_a'(Q(s',a')))**
- Alpha is a learning rate between 0 and 1
  

  Deep Q-Learning
- For very large states even the Tabular Q-Learning alogrithm is not sufficient 
- As a solution to this problem, we can use a nonlinear representation that maps both
the state and action onto a value, in this case a NN:
- First version of alogrithm:
1. Initialize Q(s, a) with some initial approximation.
2. By interacting with the environment, obtain the tuple (s, a, r, s').
3. Calculate loss: **L = (Q(s,a)-r)^2** if the episode has ended, or
**L = (Q(s,a) - ( r + 𝛾 max_a'(Q(s',a'))))^2** otherwise.
4. Update Q(s, a) using the stochastic gradient descent (SGD) algorithm, by
minimizing the loss with respect to the model parameters.
5. Repeat from step 2 until converged.
- How to interact with the environment? In the beginning of the learning it is better to select random actions and explore, but once we started learning from interactions, we should gradually chose actions more and more from learned Q-policies, to make more and more efficient choices
- this done with the **"𝜀-greedy method"**: "which just means switching between random and Q policy
using the probability hyperparameter 𝜀" (Lapan: 136)
- 𝜀 lies between 0 and 1. It describes the probability to chose random actions
- for **SGD optimization** (Stochastic gradient descent) data needs to be *independent and identically distributed* (i.i.d.)
- the first version of the algorithm obviously does not fulfill this condition (sequences are per definition dependent and the data set produced by suboptimal policies is differently distributed from the data of the optimal policy that we want to learn)
- "we usually need to use a large buffer of our past
experience and sample training data from it, instead of using our latest experience.
This technique is called **replay buffer**." (Lapan: 136)
- another problem is that updating our network for Q(s,a) will also likely update the value for Q(s',a'), since the states are only one step apart. This would would lead to unstable learning results
- therefore we use a **target network** to obtain Q(s',a') which is a copy of the NN we are training, but which gets only synced with the trained network in large time intervalls





   
Implementierung RL

See also: https://old.reddit.com/r/reinforcementlearning/comments/1hgy9g3/training_agent_with_dqn_for_board_game/

- "the basic pattern will stay the same – on
every step, the agent will take some observations from the environment, do its
calculations, and select the action to take. The result of this action will be a reward
and a new observation." (Lapan: 28)
- a **tensor* is a multi-dimensional array
  

1. Trainingspraxis
Grundsätzlich sollten fürs Training all tfjs importe auf "tfjs-node" gesetzt werden, weil das etwas schneller ist. Fürs training in der Kommandozeile in den Folder /dist gehen und dann der Call "node train"
Die Parameter fürs Training werden all in train.ts gesetzt
- Debugging
Debugging funktioniert in Visual Studio Code über den Befehl "Show and Run Commands > Debug: Javascript Debug Terminal"
- Model im Browserspiel laden
- wie wirken sich die unterschiedlichen Parameter aus?

1. Programmierung
Für die Entwicklung muss ein typescript Compiler gestartet werden: Im Hauptfolder "tsc -watch"
Um das Spiel selber im Browser nutzen zu können, muss im Folder /dist "http-server" gestartet werden und fürs bundling auch "webpack --watch" aus dem Hauptfolder. Leider muss man bei Chrome auch jedesmal einen vollständigen Reload machen, sprich CTRL + Click auf Reload Button.

1. Umsetzung von DQN im Code
zu DQN gehören folgende Module:
dqn.ts : Erstellen der eigentlichen NN Modelle und Funktion zum kopieren der Gewichte

agent.ts : Enthält zwei Klassen 1. Superagent und 2. Agent mit jeweils zwei Methoden .playStep() (oder Turn) und .trainFromReplayMemory(). Der SuperAgent erzeugt und steuert die steuert, und wird wiederum selber von train.ts erzeugt und gesteuert
.playTurn() ruft alle registrierten agent.playStep() nacheinander auf, welche wiederum die Ergebnisse (state, reward, done, nextstate, action) im ReplayMemory abspeichern. Sprich jeder Agent hat sein eigenes ReplayMemory. Nach einem Epsilon-Greedy Algorithmus werden entweder random actions erzeugt oder aus dem nonlineNetwork erzeugt, die dann im eigentlichen Spiel ausgeführt werden, welches als Rückgabewerte die obigen Ergebnisse liefert.
superAgent.trainFromReplayMemory() ruft nacheinander agent.trainfromReplayMemory() auf. Diese Methode sampled danach eine zufällig ausgewählte Batch aus dem RewardMemory, um dann einen Trainingsschritt mit diesem Batch für das OnlineNetwork auszuführen. Hierzu wird der mean quadratic Error der Loss Function optimiert. Die Loss Function ist das Herzstück des DQN und wird nach der weiter oben im Theorieteil beschriebenen Formal upgedatet.
Ich habe auch eine Gradientennormierung eingebaut. 

replayMemory.ts : Hier wird der ReplayBuffer verwaltet. Er hat eine Maximale Länge und wenn der Buffer voll ist, wird bei weiterem Zufügen von Elementen die ältesten Elemente gelöscht, damit die maximale Länge nicht überschritten wird. Ich habe auch eine kleine Optimierung eingebaut, so dass vorzugsweise playSteps ausgewählt werden mit einem hohen Reward

machPlayer.ts : ist eine abgespackte Form von agent.ts, die nicht trainieren kann, aber basierend auf dem trainierten Modell vom eigentlichen Spiel aus gesteuert als Agent basierend auf dem traiierten NN Spielzüge durchführen kann.

utils.ts : enthält einige hilfreiche Funktionen

lab.ts : ist das eigentliche Spiel, sprich es wird sowohl für das Browserspiel als auch für die Trainingsemulation genutzt. Es enthält auch explizite Methoden und Funktionen, die nur für den DQN Algorithmus relevant sind

index.ts: enthält die Steuerung des Browserspiels

drawLab.ts : enthält die Logik zur Canvas Visualisierung des Browserspiels

train.ts: enthält die Steuerung des DQN Algorithmus. Zum einen werden hier die Hyperparameter für das Training festgelegt, zum anderen werden hier das Spiel und der Superagent erzeugt. Der Trainingsalgorithmus führt zunächst soviele agent.playTurn() aus bis alle ReplyMemories der Agents gefühlt sind, dann beginnt er mit dem Training hier wird in einer Loop inkrmentell Epsilon immer mehr verkleinert, ein .playTurn() und dann ein .trainfromReplayMemory(). Periodisch werden die Gewichte vom OnlineNetwork zum TargetNetwork kopiert und auch das OnlineNetwork abgespeichert. 

1. Was ich alles an Optimierungen ausprobiert habe

Anfänglich hatte ich einen Fehler in meiner LossFunction. Ich liess drei verschiedene Outputs (für die drei verschiedenen Aktionen) ausgeben. Das funktioniert jedoch nicht mit dem DQN. Die ausgewählte Aktion (singular) wird als max Q_s,a bestimmt. 


2. Wo ich den Fehler vermute

The loss decreases within the first 500 Iterations about 25% and then gets stuck at that point. Compared to random play the policy is actually worse.

I am assuming that the greatest obstacle to learning is the size of my action space: Every turn demands a sequence of three different kinds of actions ( 1) turn the extra Card 2) use the xtra Card to shift a movable row or column 3) move your player ), which results (depending on the size of the board) in a big actions space: e.g. 800 actions for a small board of 5x5 cards (4 x 8 x 25).

Another obstacle that I suspect is the fact that I am training the agent from multiple replayBuffers - meaning I let agents (with each their own Buffer) play against each other and then train only one NN from it. But I have also let it train with one agent only, and achieved similar results (maybe a little quicker convergence to that point where it gets stuck)

Books: Maxim Lapan: Deep Reinforcement Learning Hands-On; 2nd Edition