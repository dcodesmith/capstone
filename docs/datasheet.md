# Datasheet: BBO Capstone Query History & Function Evaluation

---

## 1) Motivation

This dataset was created to document and evaluate a **black-box optimisation (BBO)** strategy over the capstone's **eight benchmark functions** (F1–F8). It supports:

- **Reproducible reporting** of the optimisation process (queries made, objective values observed).
- **Comparative analysis** across functions with varying characteristics (smooth vs rugged landscapes, 2D to 8D dimensionality).
- **Diagnostics and ablations** (e.g., effect of exploration parameter β, kernel choice, candidate sampling strategies).
- **Peer review**: enabling others to inspect decisions, assumptions, and potential failure modes.
- **Strategy evaluation**: comparing multiple query selection methods (GP-UCB, GP gradient ascent on the acquisition surface, GradientBoosting and other sklearn surrogates, NN+GP hybrid, cluster-centre / top-*K* means, variance-guided dimension locking, manual probes, etc.).

The dataset fills the practical need of turning "what I tried" into a transparent artefact: a structured record of optimisation decisions and outcomes that can inform future work.

---

## 2) Composition

### What the dataset contains

For each benchmark function F1–F8, the dataset includes a chronological history of evaluations across **13 weekly submission rounds** (after an initial seed batch), matching the capstone timeline described in the project README:

- **Inputs (queries):** vectors `x ∈ ℝ^d`, bounded to `[0, 1]^d`.
- **Outputs (evaluations):** scalar objective values `y = f(x)`.
- **Round metadata:** identifiers to reconstruct the 10-round optimisation timeline.
- **Strategy metadata:** which method generated each query.

### Schema (one row per evaluation)

| Column | Type | Description |
|--------|------|-------------|
| `function_id` | string | Function identifier (F1–F8) |
| `round` | int | Week/round of submission (1–13, after initial seed) |
| `x_1 … x_d` | float | Input coordinates (d varies by function) |
| `y` | float | Function evaluation result |
| `method` | string | Query generation method (e.g. GP-UCB, GP gradient ascent, GradientBoosting, NN+GP hybrid, cluster centre, K-means centroid, variance-guided / PCA-inspired locking, polynomial surrogate, manual probe) |
| `beta` | float | Exploration parameter used (if applicable) |
| `kernel` | string | GP kernel type (RBF or Matern) |
| `candidate_count` | int | Number of candidates sampled |
| `bias_fraction` | float | Fraction of candidates near incumbent |
| `timestamp_utc` | datetime | Submission timestamp (optional) |
| `seed` | int | Random seed for reproducibility |

### Dimensionality by function

| Function | Dimensions | Domain | Landscape Characteristics |
|----------|------------|--------|---------------------------|
| F1 | 2D | [0, 1]² | Flat / deceptive |
| F2 | 2D | [0, 1]² | Noisy, many local optima; strong gains with GradientBoosting after long GP-UCB plateau |
| F3 | 3D | [0, 1]³ | Interior optimum |
| F4 | 4D | [0, 1]⁴ | Interior optimum, narrow region |
| F5 | 4D | [0, 1]⁴ | Corner optimum |
| F6 | 5D | [0, 1]⁵ | Mixed (some dims high, some low) |
| F7 | 6D | [0, 1]⁶ | Interior optimum |
| F8 | 8D | [0, 1]⁸ | Mixed (d5 high, d1-d4 low) |

### Size and format

- **Unit of observation:** one function evaluation.
- **Per function:** 10 initial seed points plus **13** weekly queries ≈ **23** stored evaluations per function over the competition (see README).
- **Format in this repository:** NumPy `.npy` under `notebooks/initial_data/function_*/`; round history in newline-oriented **`inputs_*.txt` / `outputs_*.txt`** (and `inputs-m12.txt` / `outputs-m12.txt` for the first handoff) co-located with each Jupyter notebook under `notebooks/<round-folder>/`. A consolidated CSV export (e.g. `queries_all.csv`) is optional and not checked in by default.

### Gaps, missingness, and edge cases

- All rounds have complete submissions (no missing queries).
- Some rounds contain duplicate or near-duplicate coordinates where the GP re-selected similar regions.
- F1 shows near-zero variance in outputs (flat function), which affects GP model fitting.

---

## 3) Collection process

### How queries were generated

Queries were generated algorithmically via a multi-strategy Bayesian optimisation approach:

1. **Start** from provided initial observations (10 seed points per function).
2. **Fit surrogate model** per function (Gaussian Process with RBF or Matern kernel).
3. **Generate candidate set** using mixture sampling:
   - Uniform sampling for global exploration
   - Biased sampling near incumbent best for local intensification
4. **Score candidates** using acquisition function (UCB: μ + β·σ).
5. **Select and evaluate** the best candidate, append to history.
6. **Repeat** for each weekly round (13 post-seed rounds in this capstone), updating models and archives.

### Multi-strategy approach

Methods were mixed over the 13 weeks depending on function behaviour (see README “Model” and notebook narratives). Examples include:

| Method | Description | Used when |
|--------|-------------|-----------|
| **GP-UCB (biased / uniform candidates)** | Surrogate GP + UCB scoring over candidate pools | Default exploration and mid-course refinement |
| **GP gradient ascent** | Optimise acquisition surface along gradients | Interior optima where random candidates underperform |
| **GradientBoosting surrogate** | Tree ensemble on observed data; dense candidate scoring | Rugged / noisy landscapes (e.g. F2 plateau breakout) |
| **NN + GP hybrid** | MLP proposal filtered or combined with GP signal | High-D experiments (course modules); conservative clipping in places |
| **Cluster centre / top-*K* mean** | Query centroid of best observed points | Stay inside empirically strong regions |
| **Variance-guided (PCA-inspired)** | Lock low-spread dimensions; explore high-spread ones | Late budget, structured 5D/8D cases |
| **Manual / corner probes** | Hand-chosen queries from domain reasoning | Boundary or interpretable structure (e.g. F1, F5) |

### Strategy evolution across rounds

| Phase | Rounds (approx.) | Focus | Rationale |
|-------|------------------|-------|-----------|
| Early | 1–5 | Shared or uniform GP-UCB, high β in places | Broad coverage and baselines |
| Mid | 6–10 | Per-function models, kernels, bias, cluster ideas | Respond to plateaus and landscape shape |
| Late | 11–13 | Variance-guided refinement, targeted exploration | Concentrate budget on uncertain dimensions; avoid late blind exploration |

### Key hyperparameters tuned

- **β (exploration):** roughly **0.5–3.0** in practice (README highlights ~1.5–3.0 for UCB-focused phases), tuned per function and week.
- **Kernel type:** RBF for smooth functions (F1, F3, F5), Matern for rougher functions (F2, F4, F6, F7).
- **Candidate count:** 10,000–20,000 depending on dimensionality.
- **Bias fraction:** 0.5–0.8 (fraction of candidates sampled near incumbent).

### Time frame

- **Duration:** **13** weekly submission rounds (one new query per function per week), after initial seed data.
- **Collection period:** set by the Imperial College Business School BBO capstone offering (fill in term dates if publishing externally).

---

## 4) Preprocessing, cleaning, and intended uses

### Preprocessing applied

- **Input validation:** all queries clipped to [0, 1]^d domain bounds.
- **Output standardisation:** per-function standardisation before GP fitting (raw values preserved separately).
- **No deduplication:** repeated/similar queries retained as meaningful signal.
- **Reproducibility:** fixed random seeds for candidate generation where possible.

### Intended uses

- **Reproducing results:** recreate optimisation trajectories and validate findings.
- **Comparing strategies:** evaluate GP-UCB vs LR corners vs GP Gradient Ascent.
- **Debugging:** identify where the optimiser got stuck or over-exploited.
- **Educational:** demonstrate Bayesian optimisation concepts and trade-offs.

### Inappropriate uses

- **Generalising to real-world problems:** results are specific to these synthetic benchmarks.
- **Training unrelated models:** this is optimisation trace data, not general prediction data.
- **Performance guarantees:** benchmark success does not imply readiness for high-stakes applications.

---

## 5) Distribution and maintenance

### Availability

Source artefacts live in this repository under **`notebooks/`**:

```
notebooks/
  ├── initial_data/                 # Per-function seed inputs/outputs (.npy)
  │   └── function_1/ … function_8/
  ├── m12-round-01-gp-ucb/
  │   └── m12-round-01-gp-ucb.ipynb
  ├── m13-round-02-beta-per-function/
  │   ├── m13-round-02-beta-per-function.ipynb
  │   ├── inputs-m12.txt
  │   └── outputs-m12.txt
  ├── …                             # Other round folders with .ipynb + inputs_*.txt / outputs_*.txt
  └── module.5/                     # Separate coursework notebook (wine example)
```

Python dependencies for the notebooks are listed in **`requirements.txt`** at the **repository root**. Run notebooks with the **round folder** as the working directory so paths like `../initial_data` and local `inputs_*.txt` resolve correctly (see root **README.md**).

**Repository URL:** add your public Git remote when publishing.

### Terms of use

- Released under MIT License for academic and educational use.
- Attribution required for citations.
- If benchmark functions have course-specific constraints, those take precedence.

### Maintenance plan

- **Versioning:** increment minor version for new metadata columns; major version for breaking schema changes.
- **Changelog:** `CHANGELOG.md` documents all modifications.
- **Archival:** immutable snapshots at major milestones (e.g., final submission).

---

## 6) Reflections and lessons learned

### What worked well

- **Per-function β tuning:** adjusting exploration/exploitation per function improved results over a fixed global β.
- **Multi-strategy comparison:** GP-UCB, gradient-based acquisition steps, GradientBoosting, cluster / variance-guided ideas, and manual probes each helped on different functions.
- **Manual hypothesis testing:** corner probe for F5 discovered the true optimum when GP-UCB was searching the wrong region.

### What could be improved

- **Earlier corner exploration:** for functions with boundary optima (F5), trying corners earlier would have saved rounds.
- **Gradient-based acquisition optimisation:** our random candidate sampling limited discovery; true gradient ascent on UCB would be more principled.
- **Better kernel selection:** some functions may have benefited from different kernel choices or automatic kernel selection.

### Key insights

- **Different functions need different strategies:** interior optima (F3, F4, F7) responded to GP Gradient Ascent; boundary optima (F5) needed corner probing.
- **Getting stuck is informative:** long plateaus (e.g. F2 under GP-UCB) motivated surrogate changes such as GradientBoosting.
- **Limited budget forces trade-offs:** with only **13** post-seed queries per function, exploration vs exploitation timing matters (README: late aggressive exploration can regress).

