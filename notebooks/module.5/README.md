# Reflections on the Findings

# 📄 Convergence Issue: Scaling vs. Max Iteration

The **ConvergenceWarning** means the **L-BFGS** optimizer failed to find a solution because it hit the iteration limit (`max_iter`). This is a sign of an **inefficient** optimization process.

| Parameter Change | Implication |
| :--- | :--- |
| **`max_iter` 1000** | **Insufficient:** The algorithm is taking extremely small steps, hitting the limit before reaching the minimum of the loss function. |
| **`max_iter` 3000** | **Sub-optimal:** While it resolves the warning, this 3x increase is a **symptom fix, not a cure**. It signifies that the problem is poorly conditioned, leading to increased **training time** and computational cost without addressing the root cause. |

---

## ✅ Better Solution: Feature Scaling

The root issue is often **unscaled features**. The L-BFGS algorithm struggles when features are on vastly different scales (e.g., age 1–100 vs. income 10,000–100,000), which creates an elongated, difficult-to-navigate loss function surface.

**Scaling** (using `StandardScaler` or `MinMaxScaler`) is the best solution because it:
1.  **Transforms** features to a similar range.
2.  **Makes the loss function smoother** (more spherical).
3.  Allows the optimizer to take much larger, more **efficient steps**, often achieving convergence quickly and eliminating the need for a high `max_iter` value like 3,000.

When scaling, `max_iter` is set to 100 which achieves the most efficient training process possible for that specific model and dataset configuration, without sacrificing the model's performance. The model's predictive performance (accuracy, etc.) is the same as it would be at 3000 iterations, but you reached it 30 times faster.


The findings below are with scaling applied, but I refactored the code to branch to take in a `scale` boolean to leave room for comparison.

## Impact of the 60:20:20 split on model accuracy
- With scaling, the model converges quickly (at max_iter=100).
- Using 60% training data means the model learns from slightly fewer examples, which can reduce performance a bit compared to 70%.
- The larger validation (20%) and test (20%) sets give a more reliable and stable estimate of generalization.
In practice, we may see slightly lower validation accuracy, but your test set results are less noisy, which is valuable for honest evaluation.

## Performance under 70:15:15
- With 70% training data, the model has more examples to learn from, which often leads to slightly better validation performance.
- However, because validation (15%) and test (15%) are smaller, performance estimates can be a bit less stable (higher variance).
- Training benefits, but evaluation robustness decreases.

## If the validation set is omitted
- Without a validation set, you’d only train and test.
- This means you would likely tune hyperparameters (like C, regularization, or scaling) directly on the test set, which risks overfitting to the test data.
- The test set should be treated as a final exam: used once, at the very end, for unbiased reporting.
Skipping validation leads to the risk of reporting over-optimistic accuracy and poor generalization on unseen real-world data.

## Application to your capstone project
- Use validation sets for hyperparameter tuning and model selection.
- Use test sets only once for final performance reporting.
- Experiment with different splits to balance training power and evaluation reliability.
- For larger datasets, even smaller test proportions (like 10%) may be sufficient, but for smaller datasets, a 20% test split ensures stability.
Ultimately, this practice helps ensure your project’s model is **robust, reliable, and not overfitted** to quirks in the dataset.