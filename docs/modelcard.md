# Model Card: Multi-Strategy GP-UCB for Black-Box Optimisation

---

## 1) Overview

This capstone uses a **multi-strategy black-box optimisation** workflow to maximise eight benchmark functions (F1–F8) under a tight budget: **10 initial seed points per function plus 13 weekly queries** (one per function per week), as summarised in the project README. It combines:

- **Gaussian Process (GP) surrogates** with **UCB-style** acquisition over candidate pools (often with biased sampling toward incumbents).
- **Gradient-based refinement** on the acquisition surface where that helps interior optima.
- **Non-GP surrogates and heuristics** when GPs plateau or misrepresent the landscape, including **GradientBoosting**, **NN+GP hybrid** (course modules), **cluster-centre / top-*K* means**, **variance-guided (PCA-inspired) dimension locking**, **K-means** centroids, **polynomial** surrogates, and **manual / corner probes** informed by problem descriptions.

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

## 3) Details: strategy across weekly rounds

### Core pattern (per function; simplified)

```
1. Initialise with 10 seed observations (provided .npy files).
2. For each weekly round (13 total):
   a. Choose surrogate(s) and acquisition / heuristic (GP-UCB, GB, hybrid, cluster, variance-guided, manual, …).
   b. Propose one new x ∈ [0,1]^d per function; evaluate y; append to history.
3. Track best observed y and document rationale (see notebooks and bbo-strategy narrative).
```

Early weeks often follow a **GP-UCB** pattern (random or biased candidates, UCB scoring). Later weeks swap in **other surrogates or geometry-based queries** when plateaus, noise, or boundary structure demand it—see README “Model” and per-round notebooks under `notebooks/<round-folder>/`.

### Representative strategies (non-exhaustive)

| Strategy | Idea | Typical trigger |
|----------|------|-----------------|
| **GP-UCB + biased candidates** | μ + β·σ over a candidate pool | Default and mid-course refinement |
| **GP gradient ascent** | Step on acquisition surface | Interior optima, narrow peaks |
| **GradientBoosting** | Ensemble on (x, y); score many candidates | GP stagnation, rugged F2-style landscapes |
| **NN + GP hybrid** | Neural proposal + GP filter / combo | High-D experiments in course modules |
| **Cluster centre / top-*K*** | Mean of best queries | Stay in empirically strong hull |
| **Variance-guided locking** | Fix low-spread dims; explore the rest | Late rounds, structured dims |
| **Manual / corner probes** | Hand-picked x from domain reading | F1 interpretation, F5 corner at [1,1,1,1], etc. |

### How the approach evolved over rounds (high level)

| Phase | Weeks (approx.) | Emphasis |
|-------|-----------------|----------|
| **Early** | 1–5 | Shared GP-UCB exploration, β often ~2.0 |
| **Mid** | 6–10 | Per-function kernels, bias, β; surrogates beyond GP |
| **Late** | 11–13 | Variance-guided refinement; cautious vs aggressive exploration trade-offs |

### Key hyperparameters

| Parameter | Range | Selection Rationale |
|-----------|-------|---------------------|
| **β (UCB exploration)** | ~0.5–3.0 | README emphasises ~1.5–3.0; very high β late can regress (e.g. F7) |
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

### Results summary (aligned with README performance table)

All eight functions show **improvement vs the README’s stated “initial value” column** by the end of the 13-week trajectory (magnitudes vary; F8 is a small relative gain).

| Function | Dim | Final narrative (README) | Landscape / strategy notes |
|----------|-----|--------------------------|----------------------------|
| F1 | 2D | Large relative gain vs quoted initial; optimum effectively near-zero / flat | Manual probes, re-read of “zero is good”; late GB/GP experiments can regress |
| F2 | 2D | ~+107% vs quoted initial | Long GP-UCB plateau; **GradientBoosting** broke through |
| F3 | 3D | Strong improvement | Interior optimum; GP gradient ascent and related refinement |
| F4 | 4D | Strong improvement | Interior; cluster-centre style late win in notebook narrative |
| F5 | 4D | Very large gain | **Corner** optimum [1,1,1,1]; manual corner probe |
| F6 | 5D | Strong improvement | Variance-guided locking among late strategies |
| F7 | 6D | Very large gain | Interior; GP gradient ascent; late aggressive UCB can regress |
| F8 | 8D | Small marginal gain | Near-linear / boundary-leaning structure; cluster + variance-guided late |

**Summary:** Treat the README table as the authoritative **headline** improvement story; detailed **week labels** and best values live in the round notebooks and in `bbo-strategy` copy.

### Strategy effectiveness (qualitative)

| Strategy | Where it helped (examples) |
|----------|----------------------------|
| GP-UCB | Baseline exploration; many functions mid-course |
| GP gradient ascent | F3, F7-style interior refinement |
| GradientBoosting | F2 plateau breakout |
| Cluster centre / variance-guided | F4, F6, F8 late refinement |
| Manual / corner reasoning | F1, F5 |

### Key observations

- **One size does not fit:** surrogates and heuristics were swapped when the trajectory stalled or the problem structure (corner vs interior, noise) became clear.
- **Late exploration risk:** README notes that aggressive β with few rounds left hurt some runs—budget and timing matter as much as the algorithm family.
- **Transparency:** round-level “what / why” text in notebooks and the static **BBO Strategy History** app document decisions alongside numbers.

---

## 5) Assumptions and limitations

### Assumptions

| Assumption | Description |
|------------|-------------|
| **Smoothness** | Functions are reasonably smooth or locally learnable with stationary GP kernels |
| **Bounded domain** | All inputs constrained to [0, 1]^d |
| **Noise** | Course description allows **noisy** outputs; some functions are treated as near-deterministic in practice |
| **Single objective** | Maximising a single scalar output |
| **Consistent function** | The function definition doesn't change across rounds |

### Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **Random candidate sampling** | UCB optimised only over sampled candidates, not globally | Increase candidate count; use gradient-based optimisation |
| **Kernel mis-specification** | Poor kernel choice causes overconfidence or underfitting | Try multiple kernels; use automatic relevance determination (ARD) |
| **Local trapping** | Biased sampling can over-exploit, missing distant optima | Maintain exploration fraction; try corner strategies |
| **Curse of dimensionality** | GP accuracy and candidate coverage degrade in higher dimensions | Increase candidate count; consider dimensionality reduction |
| **Limited budget** | **13** post-seed queries per function (plus 10 seeds) still restricts exploration | Prioritise late-stage moves; accept regression risk if exploration is mis-timed |

### Failure modes

| Scenario | Observed behaviour | Example |
|----------|-------------------|---------|
| Flat / zero-optimal semantics | GP-UCB may chase spurious “peaks” | F1 (interpretation of optimum) |
| Stuck at local plateau | Same surrogate repeats weak queries | F2 under GP-UCB before GradientBoosting |
| Wrong region exploration | High uncertainty in unhelpful areas | F5 before corner confirmation |
| Narrow optimum | Random candidates miss the peak | F3/F4-style interior (gradient / cluster help) |

---

## 6) Ethical considerations

### Transparency

- **Full logging:** all queries, hyperparameters, and function evaluations are recorded in the accompanying datasheet.
- **Strategy documentation:** decisions about which method to use and why are documented per round.
- **Code availability:** Jupyter notebooks under `notebooks/<round-folder>/`, dependencies in root `requirements.txt`, and a read-only **bbo-strategy** viewer for the written strategy history.

### Honest reporting

- Benchmark success on synthetic functions does not guarantee performance on real-world problems.
- Some functions had long plateaus or regressions on specific weeks despite later recovery (see README and round notebooks).
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
4. **Increase budget if possible:** 13 post-seed evaluations per function is still very limited for thorough optimisation.
5. **Add safety checks:** for high-stakes applications, include constraint satisfaction verification.

---

## 7) Reflections on approach development

### What worked well

- **Adaptive strategy selection:** matching strategy to function characteristics (interior vs boundary optimum) significantly improved results.
- **Per-function β tuning:** adjusting exploration/exploitation balance per function outperformed a fixed global setting.
- **Manual hypothesis testing:** the corner probe for F5 was critical—the GP was confidently searching the wrong region.
- **Multi-method comparison:** alternating surrogates and heuristics matched different landscape types (interior vs corner, smooth vs rugged).

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
