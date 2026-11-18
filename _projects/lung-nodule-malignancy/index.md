---
title: Lung Nodule Malignancy Classification from CT
summary: Classifying lung nodules in CT scans as malignant or not, combining radiomics, deep features and radiologist annotations (ROC AUC 0.92).
categories:
  - machine-learning
  - computer-vision
  - health
tech:
  - Python
  - PyTorch
  - DenseNet-121
  - PyRadiomics
  - SimpleITK
  - pydicom
  - pylidc
  - scikit-learn
context: school
course: LIACD (CC3044)
team: 4 people
status: completed
cover: cover.jpg
links:
  github: https://github.com/diogo-xyz/Lung-Cancer-Classification-using-Computerized-Tomography-Data
featured: true
---

Lung cancer is the leading cause of cancer death, and survival depends heavily
on how early it is caught. This proof of concept explores a **clinical
decision-support tool** that flags potentially malignant lung nodules in CT
scans, to help radiologists triage cases. It is meant to complement their
judgement, not replace it.

## Data

We used the public **LIDC-IDRI** dataset: thoracic CT scans in which each
nodule was annotated by up to four radiologists.

- Kept only CT studies (chest X-rays filtered out) and nodules annotated by at
  least two radiologists.
- Averaged the radiologists' malignancy scores (1–5) and turned them into two
  classes: **malignant (> 3)** and **non-malignant**.
- Result: **1,679 nodules** (1,168 non-malignant, 511 malignant), so the
  classes are imbalanced.

## Pipeline

**Preprocessing.** Each scan was resampled to isotropic 1 × 1 × 1 mm voxels,
converted to Hounsfield units and windowed to [-1000, 400] HU. Nodule
bounding boxes come from a 50% radiologist consensus. Each 3D patch is
projected to a 3-channel 2D image (maximum, mean and standard deviation along
the axial axis).

**Four feature sets:**

- **Deep features:** 1,024-dimensional embeddings from an ImageNet-pretrained
  DenseNet-121.
- **Radiomics:** 112 shape, intensity and texture features from PyRadiomics.
- **Radiologist annotations:** 9 semantic features (spiculation, lobulation,
  calcification…), combined across radiologists.
- **All combined:** the fusion of the three sets above.

**Models.** Random Forest feature selection followed by an SVM or a logistic
regression. Evaluation used nested cross-validation with
`StratifiedGroupKFold`, so that nodules from the same patient never appear in
both training and test data, and hyperparameters were tuned for F1.

## Results (ROC AUC, nested CV)

| Feature set | SVM | Logistic Regression |
|---|---|---|
| Deep features (DenseNet-121) | 0.873 | 0.881 |
| Radiomics | 0.902 | 0.891 |
| Radiomics + radiologist annotations | **0.922** | 0.919 |
| All combined | 0.901 | **0.923** |

The final model, **logistic regression on all combined features**, reached
an accuracy of 0.857, an F1 score of 0.859 and a **ROC AUC of 0.923**, with
the fewest missed malignant nodules of all the models.

Hand-crafted radiomics plus radiologist annotations clearly beat deep features
alone. Adding the deep features on top gave only a marginal gain: more
features is not always better.

The repository also includes an analysis of the ethical and legal
considerations of using AI in this clinical setting.
