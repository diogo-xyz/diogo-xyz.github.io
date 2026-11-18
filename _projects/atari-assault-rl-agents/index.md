---
title: Reinforcement Learning Agents for Atari Assault
summary: PPO vs QR-DQN agents learning to play Atari Assault, with reward shaping and vision-based enemy detection. The best agent scored 3,153 points.
#start: "2025-10"                  # TODO: confirm
#end: "2025-12"                    # TODO: confirm
categories: [machine-learning, reinforcement-learning]
tech: [Python, Stable-Baselines3, sb3-contrib, PyTorch, Gymnasium, ALE, OpenCV, TensorBoard]
context: school                   # school | personal | hackathon | professional
course: ISIA (CC3042)               # TODO: replace with the course name
team: 3 people
# role: What I did in the team    # optional
status: completed                 # completed | in-progress | archived
cover: cover.jpg                # uncomment once cover.png is in this folder
links:
  github: https://github.com/diogo-xyz/Reinforcement-Learning-Agents
# event:                          # optional: id from timeline.yml or ctfs.yml
featured: true                    # true -> listed first
---

Training deep reinforcement learning agents to play **Assault**, an Atari 2600
shooter where the agent must destroy enemy ships, dodge projectiles and manage
a weapon that **overheats** if it fires non-stop. The project compares two
learning paradigms, experiments with reward shaping and tests how robust the
agents are to visual noise.

## Approach

- **Two algorithms:** **PPO** (on-policy) and **QR-DQN** (off-policy,
  distributional, learning the full distribution of returns).
- **Custom Gymnasium wrappers:**
  - grayscale observations with optional Gaussian noise;
  - reward shaping with penalties for firing (−0.5) and dying (−25);
  - an extra penalty proportional to the number of enemies on screen. The
    enemies are detected with **computer vision**: OpenCV connected components
    with geometric filters that exclude explosions, the mothership and bullets.
- **Fair evaluation:** agents train with shaped rewards, but are always
  evaluated on the **original game reward**, so every configuration is
  comparable.
- **Diagnostics:** KL divergence, explained variance, entropy and clip
  fraction for PPO; quantile loss, exploration rate and episode length for
  QR-DQN. Recorded gameplay videos were used to spot emergent behaviour such
  as corner camping or shot spamming.

## Results

| Setting | Algorithm | Evaluation score |
|---|---|---|
| Original game | PPO | ~550–700 |
| Original game | QR-DQN | peaks of 1,000–1,400 |
| Shot and death penalties | QR-DQN | **peak of 3,153**, averages near 2,000 |
| + enemy-count penalty | QR-DQN | peaks of ~2,500–3,000, more stable after tuning |
| Visual noise | QR-DQN | strong degradation unless trained with noise |

**QR-DQN clearly outperformed PPO** in this game and beat the 2,000-point
goal. Reward shaping taught the agent to manage overheating and to prioritise
survival. Hyperparameters such as the target-network update interval and the
exploration schedule were key to stable training.

The noise test showed that agents trained in perfect conditions are fragile.
Robustness has to be trained for, not assumed.

## Gameplay

The QR-DQN agent trained with shot and death penalties, playing on the original game.

<video controls muted loop playsinline preload="metadata" style="width:100%; image-rendering: pixelated;" src="/projects/atari-assault-rl-agents/qrdqn-gameplay.mp4"></video>