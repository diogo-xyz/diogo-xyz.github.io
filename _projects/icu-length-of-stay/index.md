---
title: ICU Length of Stay Prediction (MIMIC-III)
summary: Predicting how long a patient will stay in the ICU from their first 24 hours, on 330M+ clinical records processed with BigQuery.
categories:
  - machine-learning
  - data
  - health
tech:
  - Python
  - Google BigQuery
  - SQL
  - pandas
  - scikit-learn
  - XGBoost
  - tslearn
  - SHAP
  - joblib
context: school
course: CDLE (CC3047)
team: 3 people
status: completed
cover: cover.jpg
links:
  github: https://github.com/diogo-xyz/ICU-Length-of-Stay-Prediction-MIMIC-III
featured: true
---

An accurate estimate of how long a patient will stay in intensive care helps
hospitals plan beds, staff and discharges. This project builds an end-to-end
pipeline that predicts the **ICU length of stay (LOS)** using only data from
the **first 24 hours** after admission, on the MIMIC-III clinical database.

## Large-scale data processing

The raw data is too big for a laptop: `CHARTEVENTS` alone has about
**330 million rows** and `LABEVENTS` about 27 million. All the heavy lifting
was done in **Google BigQuery**:

- Frequency queries to choose clinically relevant and well-populated vital
  signs and lab tests.
- A single aggregation query that builds **one row per ICU stay**: mean, min,
  max, standard deviation and range of each signal over the first 24 hours.
  It processed **12.74 GB in 3.72 seconds**.
- A second table with the raw heart-rate time series, for time-series analysis.

The final dataset has **61,522 ICU stays** from **46,467 patients**, with 93
features.

## Analysis and modelling

- **Feature engineering:** vital-sign variability, a partial SOFA score,
  admission-time features and missing-value indicators, followed by imputation
  with `IterativeImputer`.
- **Clustering:** K-Means found 5 clinical profiles with different LOS and
  mortality. Clustering the heart-rate series with **Dynamic Time Warping**
  found 2 patterns that are significantly associated with those profiles
  (χ² = 248.59, p < 0.001).
- **Prediction:** regression (LOS in days) and classification (4 LOS classes),
  comparing linear baselines, Random Forest and XGBoost. Train/test splits were
  grouped by patient, to avoid leakage between stays of the same person.
- **Interpretability:** SHAP analysis of the best models.
- **Profiling:** runtime and memory measured for every stage; parallelised
  with `joblib`.

## Results

| Task | Best model | Metrics |
|---|---|---|
| Regression (LOS in days) | XGBoost | MAE = 3.18 days, R² = 0.34 |
| Classification (4 classes) | XGBoost | F1 = 0.49, ROC AUC = 0.76, quadratic κ = 0.53 |

With only 24 hours of data, the model has real discriminative value,
especially for the extremes: very short and very long stays. SHAP shows that
the amount of monitoring in the first day (number of lab and chart events) and
the patient's age are the strongest predictors. Inference takes under 60 ms
per patient, fast enough for real-time decision support.

MIMIC-III requires credentialed access through PhysioNet, so the data is not
included in the repository.
