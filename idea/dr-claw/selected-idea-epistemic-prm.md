# Selected Research Idea: EPISTEMIC-PRM

## Research Brief: Selection and Analysis of Promising Research Idea

**Original Input:** A better test-time computation method for open-domain scientific discovery tasks

**Execution Date:** 2026-03-28

---

## 1. SELECTION

**Selected: Research Idea 2 — EPISTEMIC-PRM**

### Why EPISTEMIC-PRM is the Best Choice

| Criterion | EPISTEMIC-PRM | Comparison to Alternatives |
|-----------|-------------|---------------------------|
| **Novelty** | High — introduces fundamental epistemic typing into reward modeling, addressing a conceptual gap no existing system handles explicitly | More novel than hierarchical structuring (Idea 3, similar to existing program synthesis); more generalizable than domain-specific delays (Idea 1) or biological scales (Idea 4) |
| **Feasibility** | **Highest** — builds directly on established PRM architectures with clear training data pathway and 9-12 month timeline | Lower technical risk than Ideas 1 (requires lab API integration), 3 (requires DSL engineering), 4 (requires multi-disciplinary annotation at scale) |
| **Impact** | **Broad and foundational** — epistemic verification is a universal bottleneck across all scientific domains, not limited to specific experimental modalities | More general than Ideas 1, 3, 4, which are constrained by experimental setup, domain DSL, or biological scales respectively |
| **Composability** | Enables all other ideas — EPISTEMIC-PRM can be integrated into DELAY-MCTS (to handle uncertain delayed rewards), HIERO-MCTS (to type-check hierarchical programs), and CROSS-SCALE-PRM (to flag novel cross-scale claims) | Other ideas are more siloed; this is the most "platform-like" contribution |

**Critical insight**: The epistemic verification gap is the *meta-problem* underlying scientific reasoning failures. Solving it creates value multiplicatively across applications rather than additively within one domain.

---

## 2. RESEARCH GOAL

> **Develop a Process Reward Model that explicitly represents and reasons about the epistemic status of scientific claims—distinguishing established knowledge from genuinely novel hypotheses requiring empirical validation—thereby eliminating false verification of uncertain claims and enabling productive exploration of the knowledge frontier.**

The research aims to replace the implicit, often incorrect assumption in current PRMs that all claims can be immediately verified against training data, with an explicit representation of *what we don't know* and *what would be required to know it*.

---

## 3. PROBLEM FRAMING

### The Core Problem: The Epistemic Verification Gap

Current AI systems for scientific reasoning face a forced choice when encountering claims not clearly supported or contradicted by training data:

| Current Behavior | Consequence |
|----------------|-------------|
| **Hallucinate verification** — assign high confidence based on pattern matching | False confidence in incorrect or unvalidated hypotheses |
| **Conservative rejection** — assign low reward to all uncertain claims | Systematic suppression of genuine scientific novelty |
| **Stochastic inconsistency** — oscillate based on superficial prompt variations | Unreliable reasoning that cannot be trusted for high-stakes decisions |

This manifests concretely in:
- **Retrospective failures**: Systems "verify" 2012-era CRISPR claims as "known" when trained on post-2012 data, or reject them as "false" when trained on pre-2012 data—neither behavior is epistemically sound
- **Prospective failures**: Systems cannot generate novel, testable hypotheses because they cannot represent the *status* of being genuinely unknown but promising

**The deeper issue**: Current PRMs lack a *theory of epistemic states*. They model confidence in truth values, not the process by which claims transition from unknown→validated.

---

## 4. TECHNICAL APPROACH

EPISTEMIC-PRM extends the standard PRM architecture with an **epistemic status classifier** trained on curated data distinguishing established scientific facts from frontier hypotheses. The model ingests reasoning steps and outputs:

1. **Standard process reward** r ∈ [0,1]
2. **Epistemic label** l ∈ {known-true, known-false, novel-unknown}
3. **Confidence calibration** scores for each

For *novel-unknown* steps, the reward model instead outputs a **validation query specification**—a structured request for experimental evidence that would resolve the uncertainty. During MCTS search, *novel-unknown* nodes trigger **exploration bonuses** rather than standard value estimates, encouraging the search to generate diverse validation pathways.

The system maintains a **knowledge frontier boundary** updated from scientific literature (via retrieval-augmented methods), ensuring the epistemic classifier reflects current scientific consensus.

Training uses a novel **epistemic contrastive loss**: pairs of reasoning steps with identical structure but differing epistemic status (e.g., "CRISPR causes double-strand breaks" [2012: novel-unknown] vs. [2024: known-true]).

---

## 5. EVIDENCE PLAN

### Phase 1: Foundation (Months 1-4)

| Experiment | Data Source | Validation |
|-----------|-------------|------------|
| **Temporal epistemic dataset construction** | Wikipedia revision histories + PubMed timestamps + expert annotation of 5,000 scientific claims across 50 discoveries | Inter-annotator agreement >0.85 on epistemic status labels; temporal consistency checks |
| **Epistemic classifier architecture** | Fine-tune 7B-70B models with epistemic contrastive loss | Held-out temporal prediction: given text from year Y, predict which claims were novel-unknown vs. known at Y |

### Phase 2: Core System (Months 4-8)

| Experiment | Method | Success Indicator |
|-----------|--------|-----------------|
| **Three-way classification validation** | Train and evaluate epistemic status head | Precision/recall: >90% on known-true/known-false; >75% on novel-unknown |
| **Validation query generation** | Generate structured experimental requests for novel-unknown claims | Expert evaluation: >70% of generated queries are adjudged "would resolve uncertainty if executed" |
| **Integration with MCTS** | Replace standard PRM with EPISTEMIC-PRM in hypothesis generation pipeline | Ablation: EPISTEMIC-PRM reduces false verification rate by >50% vs. standard PRM |

### Phase 3: Stress Testing (Months 8-12)

| Experiment | Design | Measurement |
|-----------|--------|-------------|
| **Adversarial blind evaluation** | Generate hypotheses in domains where research team genuinely lacks ground truth; submit to blind expert review | Independent experts rate EPISTEMIC-PRM outputs as having lower "false confidence" |
| **Novelty-validity tradeoff curve** | Systematically vary exploration bonus for novel-unknown nodes; measure expert-rated novelty vs. validity | Pareto frontier dominates baseline |
| **Cross-domain transfer** | Train on biology/chemistry; test on physics/materials science | Epistemic classification accuracy degrades <15% across domains |

---

## 6. SUCCESS CRITERIA

### Primary Metrics (Quantitative)

| Metric | Target | Rationale |
|--------|--------|-----------|
| **False Verification Rate (FVR)** | <5% on held-out historical discoveries | Core problem being solved |
| **Novel Discovery Detection Rate (NDDR)** | >75% recall on genuinely novel claims | Avoiding over-conservatism |
| **Calibration of epistemic confidence** | Expected Calibration Error <0.1 | Confidence scores must actually mean something |
| **Expert-rated epistemic appropriateness** | >4.0/5.0 average on blind review | Human judgment of appropriate uncertainty handling |

### Secondary Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| **Validation query executability** | >60% of generated queries can be mapped to real experimental methods | Bridge to actual empirical science |
| **MCTS exploration efficiency** | 2× improvement in diverse hypothesis generation at fixed search budget | Downstream utility |
| **Cross-temporal consistency** | Correct epistemic status prediction across 10-year time shifts | Robustness to knowledge evolution |

---

## 7. FEASIBILITY ASSESSMENT

| Aspect | Assessment |
|--------|-----------|
| **Technical difficulty** | Moderate |
| **Key requirements** | Curated temporal scientific dataset (can bootstrap from Wikipedia edit histories + expert annotation); standard PRM training infrastructure |
| **Timeline** | 9-12 months |
| **Team composition** | 2 researchers with NLP + epistemology/science studies background |
| **Compute** | Moderate (fine-tuning 7B-70B parameter reward models) |

---

*Generated by Dr. Claw Research Pipeline | 2026-03-28*
