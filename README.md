# Bayesian Black-Box Optimisation Capstone Project

This repository contains my work for the **Black-Box Optimisation (BBO) capstone project**.

## Non-technical explanation

This project tackled the challenge of finding optimal settings for eight unknown systems — imagine trying to find the perfect recipe without knowing what ingredients do, only tasting the final result. Each week, I could test one combination of settings per system and observe the outcome.

My approach evolved from broad experimentation early on to targeted refinement later. The key breakthrough was recognising which settings were already optimised versus which still needed adjustment — similar to knowing your oven temperature is correct but your seasoning needs work.

Over 13 weeks, all eight systems improved from their starting points. The most successful strategy combined data-driven pattern recognition with disciplined focus on uncertain variables.

-------

The goal is to optimise a set of eight unknown functions where I can only observe inputs and noisy outputs, with a strict limit on how many times each function can be queried. Learning how to tune parameters efficiently when the function itself is hidden. The goal is to build practical skills for hyperparameter tuning and real-world ML challenges.

In real-world ML, this is similar to tuning an expensive experiment or system. I can’t see the underlying function, I can only try settings and observe performance (e.g. chemical yield, clinical side-effects, system reliability). Here, the aim is to **make the most of very limited data**, not to build a perfect global optimiser.

This maps directly onto things like **hyperparameter tuning, experiment design, and business A/B testing**, where each evaluation costs time or money and you must balance exploration with exploitation.

------------

## Data

The project used eight black-box functions (F1-F8) with varying dimensionality (2D to 8D), provided through the Imperial College Business School BBO Capstone Project portal. Each function accepts input vectors with values between 0 and 1, returning a scalar output to maximise.

Data accumulated over 13 weeks:
- Initial dataset: 10 pre-sampled points per function
- Weekly queries: 1 new query per function per week
- Final dataset: 23 observations per function (10 initial + 13 weekly)

All data was provided through the course platform with no external sources required.

### Running the notebooks

1. **Python environment** (from the repository root):

   ```bash
   pip install -r requirements.txt
   ```

2. **Working directory:** open a notebook from its round folder under `notebooks/` (e.g. `notebooks/m14-round-04-gp-nn-hybrid/`) and run with that folder as the kernel’s **current working directory**. The notebooks use `Path("..") / "initial_data"` for seed `.npy` files and load `inputs_*.txt` / `outputs_*.txt` from the same folder.

3. **Editor:** in VS Code, “Run in dedicated Jupyter kernel” / open the `.ipynb` from the file tree so cwd matches the notebook directory; if cells fail to find `initial_data`, check that the kernel was not started with cwd set only to `notebooks/`.

------------

## Model

I employed multiple surrogate models, selected per-function based on observed behaviour:

**Gaussian Process with UCB Acquisition (GP-UCB)**: The primary model for early exploration. GP fits a probabilistic surrogate to observed data, and Upper Confidence Bound balances predicted value against uncertainty. The β parameter controls exploration-exploitation trade-off.

**GradientBoostingRegressor**: Used when GP-UCB stagnated. Tree-based models capture non-linear patterns without smoothness assumptions, proving effective for functions with sharp ridges or discontinuities.

**Cluster Centre Method**: Computing the mean of top-K results for conservative refinement. Effective for functions with interior optima where staying within proven regions outperformed optimistic extrapolation.

**Variance-Guided Strategy (PCA-Inspired)**: The most impactful late-stage approach. By analysing per-dimension spread among top results, dimensions were classified as "solved" (low variance — lock at best value) or "uncertain" (high variance — continue exploring). This focused limited query budget on dimensions that actually influenced results.

Model selection rationale: No single surrogate works universally. GP-UCB provides theoretical guarantees but assumes smoothness; GradientBoosting handles non-linearity but lacks uncertainty quantification; cluster centres are robust but conservative. Combining approaches based on function characteristics and competitive position yielded the best results.

------------

## Hyerparameter Optimisation

**GP-UCB β Parameter**:
- Range tested: 1.5 to 3.0
- Selection approach: Position-dependent. Conservative β (1.5-2.0) for functions showing improvement to exploit known regions; elevated β (2.5-3.0) for stagnant functions to encourage exploration.
- Key learning: Aggressive exploration (β=2.5+) with limited remaining queries proved high-risk, causing significant regression in Week 12.

**GradientBoosting Parameters**:
- learning_rate: 0.05-0.1 (lower for noisy functions)
- n_estimators: 100-150
- max_depth: 2-3 (shallow to prevent overfitting on limited data)
- Selection: Manual tuning based on function characteristics; deeper trees for complex functions, shallower for suspected smooth functions.

**Variance-Guided Thresholds**:
- Low variance threshold: 0.08 (dimensions below this spread considered "solved")
- High variance threshold: 0.15 (dimensions above this spread actively explored)
- Perturbation scale: 0.03 (conservative for final weeks)
- Selection: Empirically determined through analysis of top-5 result spreads across functions.

**Cluster Analysis Parameters**:
- top_k: 5 (number of best results to include in cluster centre calculation)
- Corner detection threshold: 0.05 (dimensions within this distance of 0 or 1 considered at boundary)
- Selection: top_k=5 balanced signal (enough points for reliable mean) against noise (excluding mediocre results).

------------

## Results

**Final Performance Summary**:

| Function | Dimensions | Initial Value | Final Best | Improvement | Winning strategy (best week) |
|----------|------------|---------------|------------|-------------|-----------------------------|
| F1 | 2D | 9.14e-88 | 2.68e-09 | +79 orders of magnitude | Manual center probe (W6) |
| F2 | 2D | 0.337 | 0.697 | +107% | GradientBoosting (continued) (W12) |
| F3 | 3D | -0.150 | -0.0046 | +97% | GP Gradient Ascent (W10) |
| F4 | 4D | -0.256 | 0.562 | +320% | Cluster centre (W12) |
| F5 | 4D | 179.7 | 8662.5 | +4,720% | Manual probe [1,1,1,1] (W9) |
| F6 | 5D | -1.288 | -0.2289 | +82% | Variance-guided (lock d2/d4) (W12) |
| F7 | 6D | 0.017 | 2.066 | +12,053% | GP Gradient Ascent (W10) |
| F8 | 8D | 9.943 | 9.968 | +0.25% | Variance-guided (lock d1/d4/d5) (W13) |

*Winning strategy* = method label for the week that produced the **final best** value above (aligned with the strategy history in `bbo-strategy` / round notebooks). F8’s best in the table matches **W13**; other functions match the all-time-best week recorded there.

**Key Findings**:

1. **Function structure matters**: F5 exhibited a corner optimum at [1,1,1,1]; F3 and F7 had tight interior optima; F8 showed partial structure with some dimensions tightly constrained and others varying widely.

2. **Surrogate model selection is critical**: GradientBoosting broke F2's 10-week stagnation when GP-UCB couldn't. Different functions required different models.

3. **Variance analysis reveals dimension importance**: The PCA-inspired approach of locking low-variance dimensions while exploring high-variance ones delivered three new bests in the final week.

4. **Exploration timing matters**: Aggressive exploration early builds understanding; aggressive exploration late risks regression. Week 12's β=2.5 experiment for F7 caused significant regression.

**Strategy Evolution**:
- Weeks 1-5: Uniform GP-UCB (β=2.0) across all functions
- Weeks 6-10: Function-specific model selection; cluster analysis to identify high-value regions
- Weeks 11-13: Variance-guided refinement for improving functions; targeted exploration for stagnant functions

**Lessons Learned**:
- Simple methods (cluster centres) often outperform sophisticated ones with limited data
- Position-dependent strategy (exploit when improving, explore when stagnant) optimises outcomes
- Systematic model comparison beats intuition-driven selection

------------

## License

This repository is licensed under the [MIT License](LICENSE).

**Educational use:** This work was produced for the **Black-Box Optimisation capstone** at **Imperial College Business School**. See [NOTICE](NOTICE) for attribution and how that relates to course-provided materials (brief, portal, benchmarks), which may carry **separate** institutional terms.