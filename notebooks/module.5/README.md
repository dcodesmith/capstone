# Reflections on the Findings

## Impact of the 60:20:20 split on model accuracy
With a smaller training set (60% instead of 70%), the model may capture slightly fewer patterns from the data, which can reduce accuracy a bit. However, the larger validation and test sets provide a more reliable estimate of generalization. In practice, the accuracy drop is often small, but the trade-off is more robust evaluation.

## Performance under 70:15:15
The model benefits from more training data (70%), which can boost performance slightly. But the downside is that the validation and test sets are smaller, which might make performance estimates less stable and more prone to variance.

## If the validation set is omitted
Without a validation set, you’d only train and test. This risks overfitting, because you’d tune model hyperparameters based on test performance. The test set should only be used once at the end for unbiased evaluation. Skipping validation means you lose a safeguard for tuning and risk reporting overly optimistic results.

## Application to your capstone project
- Use validation sets for hyperparameter tuning and model selection.  
- Use test sets only once for final performance reporting.  
- Experiment with different splits to balance training power and evaluation reliability.  
- For larger datasets, even smaller test proportions (like 10%) may be sufficient, but for smaller datasets, a 20% test split ensures stability.  

Ultimately, this practice helps ensure your project’s model is **robust, reliable, and not overfitted** to quirks in the dataset.

