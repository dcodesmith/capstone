# Model Card: Multi-Strategy GP-UCB for Black-Box Optimisation

---

## 1) Overview

MS-GP-UCB is a Bayesian optimisation approach designed to maximise performance on eight black-box benchmark functions (F1–F8) within a limited evaluation budget of 10 queries per function. It combines:

- **Gaussian Process (GP) surrogate models** to estimate the objective landscape and uncertainty.
- **Upper Confidence Bound (UCB) acquisition function** to balance exploration and exploitation.
- **Multiple query generation strategies** selected adaptively based on observed function characteristics:
  - Biased candidate sampling (default)
  - Linear Regression corner strategies (for boundary optima)
  - Gradient Ascent on UCB (for interior optima)

The key insight is that different black-box functions respond to fundamentally different optimisation philosophies, and a single fixed strategy underperforms compared to adaptive selection.

---

## 2) Intended use

### Suitable for

- Expensive-to-evaluate continuous objectives on bounded domains [0, 1]^d.
- Low-to-moderate dimensional problems (2D to 8D tested).
- Sequential optimisation with fixed evaluation budgets.
- Problems where the optimum location (interior vs boundary) is unknown a priori.

### Not suitable / should be avoided for

- **Very high-dimensional problems (>10D):** GP surrogates and random candidate sampling degrade.
- **Discrete or combinatorial spaces:** requires continuous domain or appropriate encoding.
- **Non-stationary objectives:** assumes function doesn't change over time.
- **Safety-critical applications:** no constraint handling or safety guarantees.
- **Real-time optimisation:** GP fitting adds computational overhead.

---

## 3) Details: strategy across the ten rounds

### Core loop (per function)

```
1. Initialise with 10 seed observations
2. For round = 1 to 10:
   a. Fit GP surrogate on all observed (x, y)
   b. Generate M candidate points:
      - (1 - bias_fraction) × M sampled uniformly (exploration)
      - bias_fraction × M sampled near incumbent best (exploitation)
   c. Compute UCB scores: a(x) = μ(x) + β·σ(x)
   d. Select best candidate (or use alternative strategy)
   e. Evaluate black-box function, append observation
3. Return best observed point
```

### The three strategies

| Strategy | Method | When Used |
|----------|--------|-----------|
| **GP-UCB with biased sampling** | Score random candidates by UCB, select best | Default for all functions |
| **Linear Regression corners** | Fit linear model, push dimensions to 0 or 1 based on coefficient signs | When stuck for multiple rounds; suspected boundary optimum |
| **GP Gradient Ascent** | Follow gradient of UCB acquisition function from incumbent | Confirmed interior optimum; final exploitation phase |

### Strategy selection logic

```
If function stuck for 3+ rounds:
    → Try LR corner (explore unexplored boundary region)
Else if correlation analysis shows all dimensions point to extremes:
    → Try LR corner (likely boundary optimum)
Else if optimum confirmed as interior:
    → Use GP Gradient Ascent (refine precisely)
Else:
    → Use GP-UCB with biased sampling (balanced approach)
```

### How the approach evolved over rounds

| Phase | Rounds | Strategy | Key Decisions |
|-------|--------|----------|---------------|
| **Exploration** | 1–4 | High β (1.5–2.5), uniform sampling dominant | Build diverse observations; identify promising regions |
| **Analysis** | 5–7 | Per-function β tuning, compare methods | Tune β per function; test LR corners on stuck functions |
| **Exploitation** | 8–10 | Low β (0.5–1.0), GP Gradient Ascent | Refine best regions; final push on promising functions |

### Key hyperparameters

| Parameter | Range | Selection Rationale |
|-----------|-------|---------------------|
| **β (UCB exploration)** | 0.5–2.5 | Higher for stuck/underperforming functions; lower for exploitation |
| **Kernel type** | RBF, Matern | RBF for smooth functions; Matern for rougher landscapes |
| **Candidate count (M)** | 10,000–20,000 | Higher for higher-dimensional functions |
| **Bias fraction** | 0.5–0.8 | Higher in exploitation phase |
| **Bias scale** | 0.1 | Standard deviation for local sampling |
| **n_restarts (GP)** | 5 | For kernel hyperparameter optimisation |

---

## 4) Performance

### Metrics used

| Metric | Description |
|--------|-------------|
| **Improved over initial** | Did we beat the best of the 10 seed observations? |
| **Rounds to best** | Which round achieved the final best value? |
| **Optimum type** | Corner (boundary) vs interior optimum |
| **Effective strategy** | Which method worked for this function |

### Results summary

| Function | Dim | Improved? | Rounds to Best | Optimum Type | Effective Strategy |
|----------|-----|-----------|----------------|--------------|-------------------|
| F1 | 2D | No | — | Flat / deceptive | None effective |
| F2 | 2D | No | — | Unknown | Stuck at initial |
| F3 | 3D | Yes | 5 | Interior | GP Gradient Ascent |
| F4 | 4D | Yes | 5 | Interior | GP Gradient Ascent |
| F5 | 4D | Yes | 9 | Corner | Manual probe / LR |
| F6 | 5D | Yes | 3 | Mixed | GP-UCB |
| F7 | 6D | Yes | 9 | Interior | GP Gradient Ascent |
| F8 | 8D | Yes | 1 | Mixed | GP-UCB |

**Summary:** Improved on **6 out of 8 functions** over initial seed observations.

### Strategy effectiveness analysis

| Strategy | Functions Where Effective | Functions Where Ineffective |
|----------|---------------------------|----------------------------|
| GP-UCB (biased sampling) | F6, F8 | F1, F2 (stuck) |
| LR corners | F5 (corner optimum) | F3, F4, F7 (interior optima) |
| GP Gradient Ascent | F3, F4, F7 | — |
| Manual probing | F5 (critical discovery) | — |

### Key observations

- **Interior vs boundary:** Functions with interior optima (F3, F4, F7) responded well to GP Gradient Ascent. The corner optimum (F5) required explicit boundary exploration.
- **Stuck functions:** F1 and F2 did not improve despite various strategies, suggesting either very flat landscapes or optima in unexplored regions.
- **Early success:** F8 found its best value in round 1, suggesting the initial GP model captured the landscape well.
- **Late discovery:** F5 and F7 found their best values in round 9, demonstrating the value of continued exploration.

---

## 5) Assumptions and limitations

### Assumptions

| Assumption | Description |
|------------|-------------|
| **Smoothness** | Functions are reasonably smooth or locally learnable with stationary GP kernels |
| **Bounded domain** | All inputs constrained to [0, 1]^d |
| **Deterministic** | Function evaluations are noise-free (or very low noise) |
| **Single objective** | Maximising a single scalar output |
| **Consistent function** | The function definition doesn't change across rounds |

### Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **Random candidate sampling** | UCB optimised only over sampled candidates, not globally | Increase candidate count; use gradient-based optimisation |
| **Kernel mis-specification** | Poor kernel choice causes overconfidence or underfitting | Try multiple kernels; use automatic relevance determination (ARD) |
| **Local trapping** | Biased sampling can over-exploit, missing distant optima | Maintain exploration fraction; try corner strategies |
| **Curse of dimensionality** | GP accuracy and candidate coverage degrade in higher dimensions | Increase candidate count; consider dimensionality reduction |
| **Limited budget** | 10 queries per function restricts thorough exploration | Prioritise based on early signals; accept some functions may not improve |

### Failure modes

| Scenario | Observed Behaviour | Example |
|----------|-------------------|---------|
| Flat function | GP provides no useful gradient signal | F1 |
| Stuck at local optimum | Exploitation reinforces suboptimal region | F2 early rounds |
| Wrong region exploration | GP uncertainty highest in wrong area | F5 before corner probe |
| Narrow optimum | Exploitation misses precise location | F4 round 2 regression |

---

## 6) Ethical considerations

### Transparency

- **Full logging:** all queries, hyperparameters, and function evaluations are recorded in the accompanying datasheet.
- **Strategy documentation:** decisions about which method to use and why are documented per round.
- **Code availability:** complete implementation available in the GitHub repository.

### Honest reporting

- Benchmark success on synthetic functions does not guarantee performance on real-world problems.
- Two functions (F1, F2) showed no improvement despite multiple strategy attempts.
- Results depend on random seeds and may vary across runs.

### Bias and fairness considerations

- **Selection bias:** query selection influenced by which strategy was chosen; different methods favour different regions.
- **Hindsight bias:** strategy evolved based on observed results; early decisions may appear suboptimal in retrospect.
- **Confirmation bias:** once a region showed promise, subsequent queries concentrated there, potentially missing better regions.

### Real-world adaptation guidance

Before applying this approach to real problems:

1. **Validate smoothness assumption:** real objectives may be discontinuous or highly multimodal.
2. **Add noise handling:** real evaluations often have measurement noise.
3. **Consider constraints:** real problems may have feasibility constraints.
4. **Increase budget if possible:** 10 evaluations is very limited for thorough optimisation.
5. **Add safety checks:** for high-stakes applications, include constraint satisfaction verification.

---

## 7) Reflections on approach development

### What worked well

- **Adaptive strategy selection:** matching strategy to function characteristics (interior vs boundary optimum) significantly improved results.
- **Per-function β tuning:** adjusting exploration/exploitation balance per function outperformed a fixed global setting.
- **Manual hypothesis testing:** the corner probe for F5 was critical—the GP was confidently searching the wrong region.
- **Multi-method comparison:** running all three methods in parallel revealed which approach suited each function.

### What could be improved

- **Earlier boundary exploration:** for functions like F5, probing corners in early rounds would have saved iterations.
- **True acquisition optimisation:** replacing random candidate sampling with gradient-based UCB optimisation would be more principled.
- **Automatic strategy selection:** currently manual; could be automated based on correlation patterns and improvement trajectory.
- **Kernel selection:** automatic kernel comparison or Bayesian model averaging could improve GP accuracy.

### Key lessons learned

1. **No single strategy dominates:** GP-UCB works for some functions; LR corners for others; gradient ascent for yet others.
2. **Exploration is undervalued early:** the temptation to exploit early can trap the optimiser in suboptimal regions.
3. **Manual intervention has value:** algorithmic methods can miss obvious hypotheses (like "what if all dimensions should be maxed?").
4. **Getting stuck is diagnostic:** a function stuck for multiple rounds signals the need for a different approach, not more of the same.
