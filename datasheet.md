# Datasheet: BBO Capstone Query History & Function Evaluation

---

## 1) Motivation

This dataset was created to document and evaluate a **black-box optimisation (BBO)** strategy over the capstone's **eight benchmark functions** (F1–F8). It supports:

- **Reproducible reporting** of the optimisation process (queries made, objective values observed).
- **Comparative analysis** across functions with varying characteristics (smooth vs rugged landscapes, 2D to 8D dimensionality).
- **Diagnostics and ablations** (e.g., effect of exploration parameter β, kernel choice, candidate sampling strategies).
- **Peer review**: enabling others to inspect decisions, assumptions, and potential failure modes.
- **Strategy evaluation**: comparing multiple query selection methods (GP-UCB, Linear Regression corners, GP Gradient Ascent).

The dataset fills the practical need of turning "what I tried" into a transparent artefact: a structured record of optimisation decisions and outcomes that can inform future work.

---

## 2) Composition

### What the dataset contains

For each benchmark function F1–F8, the dataset includes a chronological history of evaluations across 10 weekly rounds:

- **Inputs (queries):** vectors `x ∈ ℝ^d`, bounded to `[0, 1]^d`.
- **Outputs (evaluations):** scalar objective values `y = f(x)`.
- **Round metadata:** identifiers to reconstruct the 10-round optimisation timeline.
- **Strategy metadata:** which method generated each query.

### Schema (one row per evaluation)

| Column | Type | Description |
|--------|------|-------------|
| `function_id` | string | Function identifier (F1–F8) |
| `round` | int | Week/round of submission (1–10) |
| `x_1 … x_d` | float | Input coordinates (d varies by function) |
| `y` | float | Function evaluation result |
| `method` | string | Query generation method (GP-UCB, LR-corner, GP-gradient, manual) |
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
| F2 | 2D | [0, 1]² | Unknown (stuck at initial) |
| F3 | 3D | [0, 1]³ | Interior optimum |
| F4 | 4D | [0, 1]⁴ | Interior optimum, narrow region |
| F5 | 4D | [0, 1]⁴ | Corner optimum at [1,1,1,1] |
| F6 | 5D | [0, 1]⁵ | Mixed (some dims high, some low) |
| F7 | 6D | [0, 1]⁶ | Interior optimum |
| F8 | 8D | [0, 1]⁸ | Mixed (d5 high, d1-d4 low) |

### Size and format

- **Unit of observation:** one function evaluation.
- **Total size:** 10 rounds × 8 functions = up to 80 evaluations (plus 10 initial seed points per function).
- **Format:** CSV files (one per function) + summary CSV with all functions.

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
6. **Repeat** for 10 rounds, updating the surrogate with all observed data.

### Multi-strategy approach

Three complementary methods were used depending on function characteristics:

| Method | Description | Used When |
|--------|-------------|-----------|
| **GP-UCB with biased sampling** | Random candidates scored by UCB acquisition | Default for all functions |
| **Linear Regression corners** | Push dimensions to extremes based on coefficient signs | Stuck functions, suspected boundary optima |
| **GP Gradient Ascent** | Follow gradient of UCB acquisition function | Confirmed interior optima |

### Strategy evolution across rounds

| Phase | Rounds | Focus | Rationale |
|-------|--------|-------|-----------|
| Exploration | 1–4 | High β, broad coverage | Build initial GP models with diverse observations |
| Analysis | 5–9 | Compare methods, per-function tuning | Identify which strategy suits each function |
| Exploitation | 10 | Low β, GP Gradient Ascent | Refine best known regions |

### Key hyperparameters tuned

- **β (exploration):** ranged from 0.5 (exploit) to 2.5 (explore), tuned per function per round.
- **Kernel type:** RBF for smooth functions (F1, F3, F5), Matern for rougher functions (F2, F4, F6, F7).
- **Candidate count:** 10,000–20,000 depending on dimensionality.
- **Bias fraction:** 0.5–0.8 (fraction of candidates sampled near incumbent).

### Time frame

- **Duration:** 10 weeks (one submission per week per function).
- **Collection period:** [Insert start date] to [Insert end date].

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

The dataset is available in the public GitHub repository:

```
/data
  ├── queries_all.csv              # All queries across functions and rounds
  ├── queries_by_function/
  │   ├── F1_queries.csv
  │   ├── F2_queries.csv
  │   └── ...
  ├── initial_data/                # Seed observations provided at start
  └── README.md
```

**Repository:** [Insert GitHub URL]

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
- **Multi-strategy comparison:** running GP-UCB, LR corners, and GP Gradient Ascent in parallel revealed function-specific patterns.
- **Manual hypothesis testing:** the [1,1,1,1] corner probe for F5 discovered the true optimum when GP-UCB was searching the wrong region.

### What could be improved

- **Earlier corner exploration:** for functions with boundary optima (F5), trying corners earlier would have saved rounds.
- **Gradient-based acquisition optimisation:** our random candidate sampling limited discovery; true gradient ascent on UCB would be more principled.
- **Better kernel selection:** some functions may have benefited from different kernel choices or automatic kernel selection.

### Key insights

- **Different functions need different strategies:** interior optima (F3, F4, F7) responded to GP Gradient Ascent; boundary optima (F5) needed corner probing.
- **Getting stuck is informative:** F2 remaining at initial best for 9 weeks suggests either a very flat landscape or optimum in unexplored region.
- **Limited budget forces trade-offs:** with only 10 queries per function, the exploration-exploitation balance is critical.

