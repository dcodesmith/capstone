# BBO Capstone Project

## 1. Project overview

This repository contains my work for the **Black-Box Optimisation (BBO) capstone project**. The goal is to optimise a set of eight unknown functions where I can only observe inputs and noisy outputs, with a strict limit on how many times each function can be queried. Learning how to tune parameters efficiently when the function itself is hidden. The goal is to build practical skills for hyperparameter tuning and real-world ML challenges.

In real-world ML, this is similar to tuning an expensive experiment or system. I can’t see the underlying function, I can only try settings and observe performance (e.g. chemical yield, clinical side-effects, system reliability). Here, the aim is to **make the most of very limited data**, not to build a perfect global optimiser.

This maps directly onto things like **hyperparameter tuning, experiment design, and business A/B testing**, where each evaluation costs time or money and you must balance exploration with exploitation.


## 2. Inputs and outputs

Each hidden function $f_i$ acts as a black box:

- **Input:** a vector $x \in [0,1]^d$, where d depends on the function (from 2D up to 8D).  
  - In code, this is a NumPy array of shape `(d,)`.  
  - In the portal, it is submitted as a hyphen-separated string, e.g.  
    `0.224000-0.847000-0.879000-0.879000`.
- **Output:** a single real number $y = f_i(x)$, representing performance (e.g. yield, reward, or negative loss).

I start with **initial design points** provided as `.npy` files (inputs and outputs per function). Each week, I submit **one new query per function** and receive eight new scalar outputs, which I then append to the existing data and use to update my models.

## 3. Challenge objectives

The objective is to **maximise** each function $f_i(x)$ separately:

- For some functions, larger y is directly better (e.g. yield, probability of success).
- For others, the description frames it as minimising harm or side-effects, but the supplied outputs are already aligned so that “higher is better” for the optimisation task.

Key constraints:

- I can **only** access the true functions through queries (no gradients, closed forms or derivatives).
- I get just **one new evaluation per function per week**, so the data set grows slowly.
- There may be **noise** in the outputs, and I do not know the exact function form (some are multimodal; Function 5 is described as unimodal).

The challenge is to design a strategy that **uses each new data point well**, while clearly documenting how and why the strategy evolves over time.

## 4. Technical approach

I model each function with a **Gaussian Process (GP) regression surrogate** and use **acquisition functions** to choose the next query.

### Rounds 1–3 strategy

- **Round 1**
  - Fit a GP with an RBF + White kernel to the initial data.
  - For each function, sample 10,000–20,000 candidate points uniformly in $[0,1]^d$.
  - Use **UCB (Upper Confidence Bound)** with a shared `beta = 1.5` and pick the candidate with the highest `mean + beta β * std`.

- **Round 2**
  - Append Round-1 queries and outputs to the initial data and refit the GPs.
  - Introduce **per-function beta β** based on performance (higher beta β for weak / flat functions to explore more; lower beta β for strong ones to exploit).
  - Add a simple **“no duplicate points”** rule so the optimiser never re-suggests a previously evaluated input.

- **Round 3**
  - Generalise the code to automatically load and append **all past rounds** from text files.
  - Further refine **per-function beta β** using two rounds of history.
  - For **Function 5**, which is described as **unimodal** and has a very strong known peak, I:
    - Identify the best observed point so far.
    - Generate **biased candidates**: ~70% sampled from a normal distribution around that best point (clipped to [0,1]), 30% uniform.
    - Use a **small beta β (0.5)** so UCB focuses on local refinement near the peak while still keeping some global exploration.

### Exploration vs exploitation

Exploration and exploitation are controlled mainly through:

- The **beta β parameter** in UCB:
  - High beta β (e.g. 2.0–2.5) on functions that are flat or far from the best (strong exploration).
  - Low beta β (e.g. 0.5–1.0) on functions with strong incumbents to refine promising regions.
- The **candidate distribution**:
  - Uniform sampling for general exploration.
  - Biased local sampling (currently only for Function 5) for targeted exploitation on a unimodal function.

I have considered alternatives like **Expected Improvement (EI)** and **kernel SVMs or regressions** to classify high vs low regions, but so far the main engine remains a **GP surrogate + UCB**, with strategy adjustments driven by the observed data from each round.

Tech Stack: Python, Jupyter Notebooks, NumPy, Pandas, Scipy, Scikit-learn, Matplotlib.