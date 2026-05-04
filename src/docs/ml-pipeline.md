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

---

## v1.5 In-App Scaffolding (shipped May 2026)

The app now exposes the integration contract for the external ML repo.
Nothing in the app trains or quantizes — those live in the ML repo. The
app only *consumes* the published artifact and *feeds back* corrections.

### Entities
- **`MLModel`** — model registry. Fields: `version`, `format`
  (`onnx`|`tflite`|`coreml`), `cdn_url`, `size_mb`, `checksum`,
  `input_shape`, `labels_url`, `min_app_version`, `released_at`,
  `is_active`, `notes`. Exactly one row should be `is_active: true`.
- **`TrainingCandidate`** — user corrections queue. Fields:
  `image_url`, `image_hash`, `predicted_label`, `predicted_confidence`,
  `user_label`, `user_notes`, `lat`, `lng`, `model_version`,
  `specimen_id`, `status` (`pending`|`accepted`|`rejected`|`trained`).

### Backend functions
- **`getLatestModel`** — returns the active `MLModel` row (or the most
  recent), or `null`. Frontend caches and falls back to Gemini when null.
- **`submitCorrection`** — writes a `TrainingCandidate` row. Called from
  the Scan/Specimen flow when a user fixes a misidentification.

### External ML repo contract
1. Train + quantize per spec below; upload `.onnx` / `.tflite` /
   `.mlmodel` to CDN; publish a labels JSON.
2. POST a new `MLModel` row with `is_active: true` and flip the previous
   active row to `is_active: false`.
3. Periodically poll `TrainingCandidate` where `status = "pending"`,
   pull into the next training round, then mark `status = "trained"`.

### UI surface
- Hub shows a `ModelStatusCard` reading from `getLatestModel`. When
  empty it cleanly displays "Cloud · Gemini Flash". When populated it
  shows version + size + on-device badge.

---

## Quantization Pipeline Spec (external repo)
Target: <18 MB, <0.6% accuracy drop, <25 ms on iPhone 15 / Pixel 9, WebGPU-ready.

### Training-time (QAT + distillation)
- TorchAO or TF Model Optimization Toolkit
- QAT last 12 epochs (per-channel weights, per-tensor activations)
- Distill 92M teacher → 22M student (feature + logit, T=4)
- 30% unstructured magnitude pruning + 8-bit in same pass
- Calibration: 2,000 real field + synthetic specimens

### Post-training refinement
- ONNX Runtime quantizer, INT8, percentile 99.9%
- Dynamic-range fallback for unsupported ops
- Mixed precision: softmax / layer-norm in FP16

### WebGPU / ONNX
- Graph capture + constant folding pre-quantization
- ONNX Runtime Web 1.18+ with WebGPU EP
- 4-bit linear weights via GPTQ/AWQ → 12–15 MB

### Validation gate
- 2026 field set (50 specimens × 3 conditions) pre/post
- Accept if top-1 ≥ 94.5% and ECE < 0.05

### Export commands (CI)
```bash
python -m torch.onnx.export model.onnx --dynamic_axes ...
onnxruntime-quant --input model.onnx --output model.int8.onnx --quant_type int8
tflite_convert --quantize_int8 --mean_value 127.5 --std_dev 127.5
coremltools.convert(..., compute_precision=coremltools.precision.INT8)
```

Result: 18–22 MB, 0.4–0.7% drop, 22–28 ms inference, WebGPU-ready.