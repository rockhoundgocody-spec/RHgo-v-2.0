# ML Training Pipeline — Reference Specification

> **Status:** Reference document only. **Not implemented in this app.**
> Base44 is a React + Deno-functions web app and cannot host the components
> below (Blender render farms, H100 clusters, federated learning servers,
> DVC, MLflow, TFLite/Core ML export, etc.). This file exists so the spec
> isn't lost — implement it in a separate ML repo / infrastructure.

## Target outcomes
- ≥95% top-1 accuracy on a held-out 2026 field test set
- <50 MB mobile model, <1% accuracy drop post-quantization
- <50 ms inference on iPhone 15 / Pixel 9
- Continuous improvement via federated learning + user feedback

## 1. Dataset Curation & Versioning
- ≥650k labeled images, balanced and geographically diverse
- Sources: Mindat, USGS splib07, Kaggle, NASA/ESA planetary, academic
- 40% synthetic (Blender 4.2+ procedural), 30% user-contributed (opt-in, GDPR)
- 1,200+ fine-grained classes including varieties
- DVC + Git LFS, W&B artifact lineage

## 2. Preprocessing & Augmentation
- Albumentations Compose serialized to Hydra YAML
- Geology-specific transforms: dirt/mud overlays, water droplets, lichen,
  weathering, low-light, scale jitter, vegetation occlusion
- Hyperspectral simulation branch (8–12 virtual bandpass filters, 450–2350 nm)

## 3. Model Architecture
- Backbone: SigLIP-so400m/14 or ConvNeXt-V2 huge or EfficientNetV2-L
- Multi-task heads: ArcFace classification, Mohs regression, property
  multi-label, 512-d SupCon embedding, evidential uncertainty
- Hyperspectral aux CNN with FiLM/cross-attention fusion
- Distill teacher (~92M) → student (~18–25M) for mobile

## 4. Loss & Optimization
- Composite: Focal + ArcFace + MSE + Huber + BCE + SupCon + NLL + spectral
- AdamW, cosine annealing + warmup, bf16 mixed precision
- 120 epochs (40 pretrain / 50 geology / 30 fine-tune + QAT)

## 5. Infrastructure & Tracking
- 8× H100 80GB (Lambda/RunPod), DDP/FSDP
- Prefect 3.x flows, MLflow / W&B, Optuna HPO
- 5-fold stratified CV + 20% real-field hold-out

## 6. Quantization, Distillation, Export
- QAT last 8 epochs, INT8 weights/activations
- Knowledge distillation (T=4 soft labels + feature matching)
- ONNX → TFLite (GPU delegate) + Core ML (Neural Engine)

## 7. Continuous Improvement (Federated)
- Flower 1.12+ on-device fine-tune (idle + charging + WiFi)
- DP noise (σ=0.01–0.05, ε=1.0–3.0), SecAgg+
- FedAvg + FedProx, weekly global rounds
- Drift detection on macro-F1 + ECE; auto-retrain triggers

## 8. Ethics & Transparency
- Bias audit per major train (geographic + lighting parity)
- SHAP/LIME explanations surfaced in app ("Why this ID?")
- Quarterly public transparency report (incl. CodeCarbon footprint)

## What this app DOES do today
- Calls hosted vision LLMs (Gemini Flash) via `Core.InvokeLLM` from
  `functions/quickClassifySpecimen` and the multi-angle Scan flow
- Stores specimens, badges, companion state in Base44 entities
- That is sufficient for the current product. The pipeline above is the
  long-term moat — out of scope for the in-app builder.