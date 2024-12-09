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




- Q-Learning
- DQN
    - Loss Function

1. Trainingspraxis
- Debugging
- Model im Browserspiel laden
- wie wirken sich die unterschiedlichen Parameter ausprobiert

1. Das eigentliche Spiel im Code

2. Umsetzung von DQN im Code

3. Was ich alles ausprobiert habe

4. Wo ich den Fehler vermute