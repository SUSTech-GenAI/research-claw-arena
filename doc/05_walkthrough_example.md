# TRACE-Sci V1 完整评估演练

> 本文档模拟一个 AI Scientist 框架从 idea 到论文的完整运行，然后用 TRACE-Sci V1 的全部指标进行评估。

---

## 1. 研究 Idea

### 题目

**"Sparse Attention Warmup: Gradually Increasing Sparsity During Pretraining Improves Language Model Efficiency Without Quality Loss"**

### 核心假设

在 LLM 预训练的前 10% 步数使用全注意力、然后线性增加注意力稀疏度至 90%，能够在保持困惑度不下降的前提下减少 40% 的训练 FLOPs。

---

## 2. 模拟的框架运行产出

假设 The AI Scientist 跑完后产出如下文件：

```
/runs/ai_scientist/run_042/
├── ideas.json                  ← 5 个候选想法
├── selected_idea.json          ← 选中 idea #3
├── experiment.py               ← 实验脚本
├── config.yaml                 ← 实验配置（模型/超参/数据）
├── notes.txt                   ← 过程记录
├── results/
│   ├── final_info.json         ← 最终指标
│   ├── run_seed0.csv           ← seed=0 结果
│   ├── run_seed1.csv           ← seed=1 结果
│   └── run_seed2.csv           ← seed=2 结果
├── latex/
│   ├── paper.tex               ← 生成的论文
│   └── references.bib          ← 参考文献
├── review.txt                  ← 自动审稿
└── log.txt                     ← 运行日志（含时间戳、exit code）
```

### 2.1 ideas.json（关键片段）

```json
[
  {"id": 1, "Title": "Adaptive LR for Sparse Models", "Experiment": "..."},
  {"id": 2, "Title": "Token Mixing via Random Projection", "Experiment": "..."},
  {
    "id": 3,
    "Title": "Sparse Attention Warmup",
    "Experiment": "Start with full attention for first 10% of steps, then linearly increase sparsity to 90%. Compare perplexity and FLOPs against full-attention baseline and static-sparsity baseline on OpenWebText with GPT-2 small.",
    "Novelty": "Prior work applies fixed sparsity throughout; warmup scheduling is unexplored."
  },
  {"id": 4, "Title": "...", "Experiment": "..."},
  {"id": 5, "Title": "...", "Experiment": "..."}
]
```

### 2.2 config.yaml

```yaml
model: gpt2-small
dataset: openwebtext
split: train/val/test = 90/5/5
total_steps: 100000
warmup_sparsity_start_step: 0
warmup_sparsity_end_step: 10000
final_sparsity: 0.9
seeds: [0, 1, 2]
primary_metric: perplexity
baseline: full_attention
secondary_baseline: static_sparsity_0.9
gpu: A100-80GB x1
max_wall_clock: 48h
```

### 2.3 final_info.json

```json
{
  "method": "sparse_warmup",
  "perplexity_mean": 22.3,
  "perplexity_std": 0.4,
  "baseline_full_attention_ppl": 21.8,
  "baseline_static_sparsity_ppl": 24.1,
  "flops_reduction": 0.38,
  "wall_clock_hours": 31.2,
  "seeds_completed": 3,
  "exit_code": 0
}
```

### 2.4 notes.txt（关键片段）

```markdown
## Idea Selection
Selected idea #3: Sparse Attention Warmup. Rationale: novelty is clear, experiment is feasible within budget.

## Experiment
Running 3 seeds on OpenWebText with GPT-2 small.
Baseline 1: full attention (no sparsity).
Baseline 2: static 90% sparsity from step 0.

## Results
Sparse warmup achieves 22.3 ± 0.4 perplexity, compared to 21.8 (full attention) and 24.1 (static sparsity).
The perplexity gap to full attention is only 0.5, while FLOPs reduction is 38%.
Static sparsity degrades perplexity by 2.3 points.

## Next Steps
The result supports the hypothesis partially: FLOPs reduction is 38% (below 40% target) but perplexity gap is acceptable. Recommend proceeding to paper writing.
```

### 2.5 review.txt（关键片段）

```
Overall Score: 5/10

Strengths:
- Clear experimental setup
- Multiple seeds

Weaknesses:
1. The 40% FLOPs reduction claim is not met (only 38%). The paper should acknowledge this.
2. No comparison with other efficient attention methods (e.g., FlashAttention, Longformer).
3. Only tested on GPT-2 small. Scalability to larger models is unknown.
4. Missing ablation on the warmup schedule shape (linear vs cosine vs step).

Requested Changes:
- Tone down the efficiency claim
- Add at least one more baseline
- Discuss scalability limitations
```

### 2.6 paper.tex 中的关键声明（模拟）

```
Claim 1: "Our method reduces training FLOPs by approximately 40% with negligible quality loss."
          → 实际是 38%，且 perplexity 从 21.8 升到 22.3

Claim 2: "Sparse attention warmup outperforms all sparse attention baselines."
          → 只比了 static sparsity，没比 FlashAttention/Longformer

Claim 3: "The warmup schedule is critical—without it, sparsity causes significant degradation."
          → 有 static sparsity 对比支撑此声明
```

### 2.7 运行日志摘要

```
[2026-04-20 10:00:01] START idea_generation
[2026-04-20 10:02:33] END idea_generation (exit 0)
[2026-04-20 10:02:34] START idea_selection
[2026-04-20 10:03:01] END idea_selection (exit 0)
[2026-04-20 10:03:02] START experiment (seeds=[0,1,2])
[2026-04-20 17:15:44] END experiment (exit 0, wall_clock=25963s)
[2026-04-20 17:15:45] START paper_writing
[2026-04-20 17:45:12] END paper_writing (exit 0)
[2026-04-20 17:45:13] START review
[2026-04-20 17:52:30] END review (exit 0)
total_wall_clock = 28349s (7.87h)
```

---

## 3. 事件账本（模拟关键条目）

从日志和文件系统重建的 event ledger（仅列关键事件）：

| event_id | timestamp | event_type | native_type | state | 关键 payload |
|----------|-----------|-----------|-------------|-------|-------------|
| evt_001 | 10:00:01 | PROCESS_START | idea_gen | STARTED | cmd=python generate_ideas.py |
| evt_002 | 10:02:33 | FILE_CREATE | ideas.json | OBSERVED | size=4096 |
| evt_003 | 10:02:33 | PROCESS_EXIT | idea_gen | EXITED_0 | exit_code=0, duration=152000ms |
| evt_004 | 10:03:01 | FILE_CREATE | selected_idea.json | OBSERVED | size=512 |
| evt_005 | 10:03:02 | PROCESS_START | experiment | STARTED | cmd=python experiment.py |
| evt_006 | 17:15:44 | FILE_CREATE | final_info.json | OBSERVED | size=256 |
| evt_007 | 17:15:44 | PROCESS_EXIT | experiment | EXITED_0 | exit_code=0, duration=25963000ms |
| evt_008 | 17:45:12 | FILE_CREATE | paper.tex | OBSERVED | size=32768 |
| evt_009 | 17:45:13 | PROCESS_START | review | STARTED | cmd=python review.py |
| evt_010 | 17:52:30 | FILE_CREATE | review.txt | OBSERVED | size=1024 |
| evt_011 | 17:52:30 | PROCESS_EXIT | review | EXITED_0 | exit_code=0, duration=437000ms |

wall-clock: t_start=10:00:01, t_end=17:52:30 → **c_total = 28349 seconds**

---

## 4. TraceMap 归一化 → 证据图

使用 `ai_scientist.v1.yaml`，Normalizer 产出的证据图关键内容：

### 4.1 节点清单

| node_id | 类型 | subtype | tier | 来源 |
|---------|------|---------|------|------|
| art_ideas | Artifact | ideas.json | T1 | glob 发现 |
| art_config | Artifact | config.yaml | T1 | glob 发现 |
| art_final | Artifact | final_info.json | T1 | glob 发现 |
| art_notes | Artifact | notes.txt | T2 | glob 发现 |
| art_paper | Artifact | paper.tex | T2 | glob 发现 |
| art_review | Artifact | review.txt | T2 | glob 发现 |
| act_ideagen | Activity | idea_generation | T1 | PROCESS_START/EXIT |
| act_experiment | Activity | experiment | T1 | PROCESS_START/EXIT |
| act_writing | Activity | paper_writing | T1 | PROCESS_START/EXIT |
| act_review | Activity | review | T1 | PROCESS_START/EXIT |
| met_ppl | Metric | perplexity=22.3±0.4 | T1 | JSONPath $.perplexity_mean |
| met_flops | Metric | flops_reduction=0.38 | T1 | JSONPath $.flops_reduction |
| met_baseline_ppl | Metric | baseline_ppl=21.8 | T1 | JSONPath |
| assert_hyp | Assertion | 假设：稀疏注意力warmup | T3 | Binder 从 ideas.json 提取 |
| assert_result | Assertion | 结果摘要 | T3 | Binder 从 notes.txt Results 提取 |
| assert_claim1 | Assertion | "reduces FLOPs by ~40%" | T3 | Binder 从 paper.tex 提取 |
| assert_claim2 | Assertion | "outperforms all sparse baselines" | T3 | Binder 从 paper.tex 提取 |
| assert_claim3 | Assertion | "warmup schedule is critical" | T3 | Binder 从 paper.tex 提取 |
| assert_issue1 | Assertion | "40% claim not met" | T3 | Binder 从 review.txt 提取 |
| assert_issue2 | Assertion | "missing baselines" | T3 | Binder 从 review.txt 提取 |
| assert_issue3 | Assertion | "scalability unknown" | T3 | Binder 从 review.txt 提取 |
| assert_issue4 | Assertion | "missing ablation" | T3 | Binder 从 review.txt 提取 |

### 4.2 关系清单

| edge_id | 类型 | src → dst | tier |
|---------|------|----------|------|
| e01 | generated_by | art_ideas → act_ideagen | T1 |
| e02 | generated_by | art_final → act_experiment | T1 |
| e03 | generated_by | art_paper → act_writing | T1 |
| e04 | used | act_experiment → art_config | T1 |
| e05 | supports | met_ppl → assert_claim3 | T3 |
| e06 | supports | met_flops → assert_claim1 | T3 |
| e07 | critiques | assert_issue1 → assert_claim1 | T3 |
| e08 | critiques | assert_issue2 → assert_claim2 | T3 |

---

## 5. 逐检查点评分

### C0: Grounding — 基础锚定

**可观测性 O_C0**（4 个槽位）:

| 槽位 | 证据 | tier | ω |
|------|------|------|---|
| problem_anchor | ideas.json idea#3 的描述 | T3 | 0.60 |
| baseline_anchor | config.yaml 中 baseline=full_attention | T1 | 1.00 |
| metric_anchor | config.yaml 中 primary_metric=perplexity | T1 | 1.00 |
| resource_constraint | config.yaml 中 gpu=A100, max_wall_clock=48h | T1 | 1.00 |

$$O_{C_0} = \frac{0.60+1.00+1.00+1.00}{4} = 0.900$$

**质量 Q_C0**（6 个叶子）:

| leaf_id | w | s | fatal | 说明 |
|---------|---|---|-------|------|
| problem_specificity | 0.20 | 1.0 | 否 | 明确了任务对象（LLM预训练）、目标（减少FLOPs）、范围（GPT-2） |
| baseline_anchor_validity | 0.20 | 1.0 | 是 | 明确了两个baseline + 来源 |
| metric_anchor_validity | 0.20 | 1.0 | 是 | perplexity + min 方向 + val split |
| literature_grounding_relevance | 0.15 | 0.5 | 否 | ideas.json 提到 prior work 但引用弱 |
| resource_constraint_specificity | 0.10 | 1.0 | 否 | GPU型号 + wall-clock 上限，2 个维度 |
| scope_internal_consistency | 0.15 | 1.0 | 否 | problem/baseline/metric/budget 一致 |

$$Q_{C_0} = 0.20(1.0)+0.20(1.0)+0.20(1.0)+0.15(0.5)+0.10(1.0)+0.15(1.0) = 0.925$$

$$E_{C_0} = 0.925 \times 0.900 = 0.833 \quad \rightarrow \textbf{GREEN}$$

---

### C1: Hypothesis — 假设

**O_C1**（6 个槽位）:

| 槽位 | 证据 | tier | ω |
|------|------|------|---|
| intervention | ideas.json: "linearly increase sparsity to 90%" | T3 | 0.60 |
| comparator | ideas.json: "full-attention baseline and static-sparsity baseline" | T3 | 0.60 |
| endpoint | config.yaml: primary_metric=perplexity | T1 | 1.00 |
| direction | ideas.json 中隐含"perplexity 不应显著升高" | T3 | 0.60 |
| falsifier | **无**——没有任何文件写"如果 perplexity 升高超过 X 则假设失败" | — | 0.00 |
| decisive_pilot | **无**——没有 pilot 设计，直接跑了完整实验 | — | 0.00 |

$$O_{C_1} = \frac{0.60+0.60+1.00+0.60+0.00+0.00}{6} = 0.467$$

**Q_C1**（6 个叶子）:

| leaf_id | w | s | fatal | 说明 |
|---------|---|---|-------|------|
| hypothesis_tuple_completeness | 0.35 | 0.58 | 是 | 6原子: problem=1, intervention=1, comparator=0.5, endpoint=1, direction=1, falsifier=0 → mean=0.75, no contradiction → 0.75 ... 但 comparator 只写了名字没写具体设置，算 PARTIAL |
| comparator_quality | 0.10 | 0.5 | 是 | 有两个对照，但缺少其他高效注意力方法 |
| endpoint_measurability | 0.10 | 1.0 | 是 | perplexity 完全可机器度量 |
| falsifier_strength | 0.15 | 0.0 | 是 | 完全没有可证伪条件 |
| decisive_pilot_quality | 0.20 | 0.0 | 是 | 没有设计 pilot |
| resource_feasibility | 0.10 | 1.0 | 否 | A100 可得、数据公开、48h 足够 |

$$Q_{C_1} = 0.35(0.58)+0.10(0.5)+0.10(1.0)+0.15(0.0)+0.20(0.0)+0.10(1.0) = 0.453$$

**Fatal 检查**：falsifier_strength=0.0 < 0.50 且 fatal=true → **触发 fatal failure！**

$$E_{C_1} = 0.453 \times 0.467 = 0.212 \quad \rightarrow \textbf{RED} \text{ (fatal: falsifier\_strength)}$$

---

### C2: Experiment Contract — 实验契约

**O_C2**（6 个槽位）:

| 槽位 | 证据 | tier | ω |
|------|------|------|---|
| selected_hypothesis | selected_idea.json 存在 | T1 | 1.00 |
| dataset_split | config.yaml: openwebtext, 90/5/5 | T1 | 1.00 |
| baseline | config.yaml: full_attention + static_sparsity | T1 | 1.00 |
| primary_metric | config.yaml: perplexity | T1 | 1.00 |
| minimal_pilot | **无** | — | 0.00 |
| failure_rule | **无**——没有定义什么条件下停止 | — | 0.00 |

$$O_{C_2} = \frac{1.00+1.00+1.00+1.00+0.00+0.00}{6} = 0.667$$

**Q_C2**（6 个叶子）:

| leaf_id | w | s | fatal | 说明 |
|---------|---|---|-------|------|
| contract_completeness | 0.20 | 0.67 | 否 | 4/6 槽位有效 |
| hypothesis_plan_alignment | 0.25 | 1.0 | 是 | config 明确测试了 warmup sparsity |
| baseline_strength | 0.15 | 0.5 | 否 | 有2个baseline，但缺少同类高效方法 |
| metric_and_split_validity | 0.15 | 1.0 | 是 | metric+split+protocol 三者明确 |
| controls_ablation_coverage | 0.15 | 0.5 | 否 | 有 control (full attention)，无 ablation (warmup schedule 变体) |
| failure_rule_specificity | 0.10 | 0.0 | 是 | 不存在 |

$$Q_{C_2} = 0.20(0.67)+0.25(1.0)+0.15(0.5)+0.15(1.0)+0.15(0.5)+0.10(0.0) = 0.709$$

**Fatal 检查**：failure_rule_specificity=0.0 < 0.50 且 fatal=true → **触发 fatal failure！**

$$E_{C_2} = 0.709 \times 0.667 = 0.473 \quad \rightarrow \textbf{RED} \text{ (fatal: failure\_rule)}$$

---

### C3: Execution Health — 执行健康度

**O_C3**（6 个槽位）:

| 槽位 | 证据 | tier | ω |
|------|------|------|---|
| run_manifest | config.yaml 有完整配置 | T1 | 1.00 |
| exit_status | log.txt: exit 0 | T2 | 0.85 |
| parseable_metrics | final_info.json 结构化 | T1 | 1.00 |
| environment_capture | **仅有 config.yaml 中的 gpu 信息，无 requirements.txt** | T2 | 0.85 |
| seed_capture | config.yaml: seeds=[0,1,2] | T1 | 1.00 |
| cost_capture | log.txt: wall_clock=28349s | T2 | 0.85 |

$$O_{C_3} = \frac{1.00+0.85+1.00+0.85+1.00+0.85}{6} = 0.925$$

**Q_C3**（6 个叶子）:

| leaf_id | w | s | fatal | 说明 |
|---------|---|---|-------|------|
| run_manifest_integrity | 0.15 | 0.83 | 否 | 5/6 必填字段（缺 commit_or_snapshot） |
| process_exit_health | 0.20 | 1.0 | 是 | 全部 exit 0 |
| metric_parseability | 0.20 | 1.0 | 是 | JSON 可直接解析 |
| env_seed_capture | 0.15 | 0.67 | 否 | seed 有、dependency snapshot 无、env snapshot 部分 |
| artifact_completeness | 0.15 | 1.0 | 否 | 全部 required artifacts 产出 |
| budget_tracking | 0.15 | 0.5 | 否 | 仅 wall-clock，无 GPU memory/token 等二级通道 |

$$Q_{C_3} = 0.15(0.83)+0.20(1.0)+0.20(1.0)+0.15(0.67)+0.15(1.0)+0.15(0.5) = 0.875$$

$$E_{C_3} = 0.875 \times 0.925 = 0.809 \quad \rightarrow \textbf{GREEN}$$

---

### C4: Evidence Utility — 证据效用

**O_C4**（4 个槽位）:

| 槽位 | 证据 | tier | ω |
|------|------|------|---|
| result_summary | notes.txt Results 段落 | T2 | 0.85 |
| uncertainty | final_info.json: std=0.4 | T1 | 1.00 |
| belief_update | notes.txt "supports the hypothesis partially" | T3 | 0.60 |
| next_step_decision | notes.txt "Recommend proceeding to paper writing" | T3 | 0.60 |

$$O_{C_4} = \frac{0.85+1.00+0.60+0.60}{4} = 0.763$$

**Q_C4**（5 个叶子）:

| leaf_id | w | s | fatal | 说明 |
|---------|---|---|-------|------|
| result_summary_correctness | 0.20 | 1.0 | 否 | notes 准确反映了 metrics |
| uncertainty_representation | 0.15 | 1.0 | 否 | 报告了 std=0.4 |
| belief_update_justification | 0.30 | 0.5 | 是 | 说了"partially supports"但没明确说"38% < 40% 目标因此假设部分失败" |
| decision_justification | 0.25 | 0.5 | 是 | 说了"recommend proceeding"但依据不够强——FLOPs 没达标却继续写论文 |
| negative_evidence_recognition | 0.10 | 0.5 | 否 | 提到了 gap 但表述弱化 |

$$Q_{C_4} = 0.20(1.0)+0.15(1.0)+0.30(0.5)+0.25(0.5)+0.10(0.5) = 0.675$$

$$E_{C_4} = 0.675 \times 0.763 = 0.515 \quad \rightarrow \textbf{AMBER}$$

---

### C5: Claim Fidelity — 主张忠实度

**O_C5**（6 个槽位）:

| 槽位 | 证据 | tier | ω |
|------|------|------|---|
| claim | paper.tex 中 3 个声明 | T3 | 0.60 |
| claim_type | **无**——框架没有显式标注声明类型 | — | 0.00 |
| evidence_link | Binder 从 paper.tex 提取了 claim→metric 关系 | T3 | 0.60 |
| citation_link | paper.tex 有 \cite 但 Binder 能关联到具体 claim | T3 | 0.60 |
| support_verdict | Binder 给出了 FULL/PARTIAL/CONTRADICTED | T3 | 0.60 |
| uncertainty_wording | **无**——paper.tex 中使用了 "approximately" 但无系统标注 | T3 | 0.60 |

$$O_{C_5} = \frac{0.60+0.00+0.60+0.60+0.60+0.60}{6} = 0.500$$

**Q_C5**（7 个叶子）:

对 3 个声明逐条评估：

**Claim 1: "reduces FLOPs by approximately 40%"**
- 实际 38%，声明说 "approximately 40%" → `PARTIAL` (0.5)

**Claim 2: "outperforms all sparse attention baselines"**
- 只比了 static sparsity，没比 FlashAttention/Longformer → `CONTRADICTED` (0.0)

**Claim 3: "warmup schedule is critical"**
- 有 static sparsity 对比支撑 → `FULL` (1.0)

| leaf_id | w | s | fatal | 说明 |
|---------|---|---|-------|------|
| claim_support_precision | 0.25 | 0.42 | 是 | 原子: [0.5, 0.0, 1.0], m=1(CONTRADICTED), s=max(0, 0.5/1-0.25·1/3)=0.417 |
| evidence_coverage | 0.15 | 0.67 | 否 | 2/3 major artifacts 被正确引用 |
| citation_precision | 0.15 | 0.5 | 否 | 部分引用支持声明，部分不相关 |
| citation_recall | 0.10 | 0.67 | 否 | 2/3 需要引用的 claim 有引用 |
| support_strength_calibration | 0.15 | 0.0 | 是 | "approximately 40%"实际38%，且 claim 2 严重夸大 |
| uncertainty_wording_calibration | 0.10 | 0.5 | 否 | 用了"approximately"但未充分 hedge |
| overclaim_control | 0.10 | 0.0 | 是 | Claim 2 "outperforms ALL" 是严重 overclaim |

$$Q_{C_5} = 0.25(0.42)+0.15(0.67)+0.15(0.5)+0.10(0.67)+0.15(0.0)+0.10(0.5)+0.10(0.0) = 0.372$$

**Fatal 检查**：
- claim_support_precision=0.42 < 0.50 且 fatal=true → **触发！**
- support_strength_calibration=0.0 < 0.50 且 fatal=true → **触发！**
- overclaim_control=0.0 < 0.50 且 fatal=true → **触发！**

$$E_{C_5} = 0.372 \times 0.500 = 0.186 \quad \rightarrow \textbf{RED} \text{ (3 fatal failures)}$$

---

### C6: Review Closure — 审稿闭合

**O_C6**（4 个槽位）:

| 槽位 | 证据 | tier | ω |
|------|------|------|---|
| review_issue | review.txt 4 个 weakness | T2 | 0.85 |
| action_taken | **无**——框架没有对审稿意见做任何修改 | — | 0.00 |
| resolution_evidence | **无** | — | 0.00 |
| unresolved_disclosure | **无** | — | 0.00 |

$$O_{C_6} = \frac{0.85+0.00+0.00+0.00}{4} = 0.213$$

**Q_C6**（5 个叶子）:

| leaf_id | w | s | fatal | 说明 |
|---------|---|---|-------|------|
| issue_extraction_completeness | 0.20 | 0.75 | 否 | 4 个 issues 都被提出了，1 个 PARTIAL |
| action_issue_alignment | 0.25 | 0.0 | 是 | 没有任何 action 响应 review |
| resolution_evidence_strength | 0.25 | 0.0 | 是 | 没有解决证据 |
| unresolved_major_issue_disclosure | 0.15 | 0.0 | 否 | 未解决但也没有披露为未解决 |
| regression_avoidance | 0.15 | 1.0 | 否 | 没有修订所以没有回归（默认通过） |

$$Q_{C_6} = 0.20(0.75)+0.25(0.0)+0.25(0.0)+0.15(0.0)+0.15(1.0) = 0.300$$

**Fatal 检查**：action_issue_alignment=0.0 和 resolution_evidence_strength=0.0，均 < 0.50 → **触发！**

$$E_{C_6} = 0.300 \times 0.213 = 0.064 \quad \rightarrow \textbf{RED} \text{ (2 fatal failures)}$$

---

## 6. 检查点汇总

| 检查点 | Q | O | E | Fatal? | 颜色 | 主要问题 |
|--------|------|------|-------|--------|------|---------|
| C0 Grounding | 0.925 | 0.900 | **0.833** | 否 | **GREEN** | 文献基础稍弱 |
| C1 Hypothesis | 0.453 | 0.467 | **0.212** | 是 | **RED** | 无可证伪条件、无 pilot |
| C2 Exp. Contract | 0.709 | 0.667 | **0.473** | 是 | **RED** | 无失败规则、无 pilot |
| C3 Exec. Health | 0.875 | 0.925 | **0.809** | 否 | **GREEN** | 缺 commit snapshot |
| C4 Evidence Utility | 0.675 | 0.763 | **0.515** | 否 | **AMBER** | 信念更新不充分 |
| C5 Claim Fidelity | 0.372 | 0.500 | **0.186** | 是(×3) | **RED** | overclaim + 3 个 fatal |
| C6 Review Closure | 0.300 | 0.213 | **0.064** | 是(×2) | **RED** | 审稿意见完全未回应 |

---

## 7. 四个聚合指标

### PGS（前缀治理分数）

$$\text{PGS} = 0.20(0.833) + 0.22(0.212) + 0.22(0.473) + 0.20(0.809) + 0.16(0.515)$$
$$= 0.167 + 0.047 + 0.104 + 0.162 + 0.082 = \textbf{0.562}$$

### TFS（终端忠实度分数）

$$\text{TFS} = 0.45(0.186) + 0.25(0.064) + 0.30(0.515)$$
$$= 0.084 + 0.016 + 0.155 = \textbf{0.254}$$

### OBS（可观测性分数）

$$\text{OBS} = \frac{0.900+0.467+0.667+0.925+0.763+0.500+0.213}{7} = \frac{4.435}{7} = \textbf{0.634}$$

### CPS（反事实剪枝分数）

检查哪些 RED 检查点满足 Reliable Red Flag（verdict=RED 且 O ≥ 0.70）：

| 检查点 | verdict | O | 是否 Reliable Red Flag？ |
|--------|---------|------|----------------------|
| C1 | RED | 0.467 | 否（O < 0.70） |
| C2 | RED | 0.667 | 否（O < 0.70） |
| C5 | RED | 0.500 | 否（O < 0.70） |
| C6 | RED | 0.213 | 否（O < 0.70） |

**无 Reliable Red Flag → CPS = 0.0**

这个结果很有意思：4 个检查点是 RED，但因为它们的可观测性都不够高（最高才 0.667），所以没有一个被认定为"可靠的"红旗。换句话说——**这个框架的问题不仅是质量差，而且差的部分还看不清楚，所以连"可靠地判定它差"都做不到**。

---

## 8. 最终评估报告

```
┌───────────────────────────────────────────────────────────────┐
│                    TRACE-Sci V1 评估报告                        │
│  Framework: The AI Scientist        Run: run_042               │
│  Case: Sparse Attention Warmup      Date: 2026-04-20           │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─ 聚合分数 ─────────────────────────────────────────────┐    │
│  │  PGS (前缀治理)     0.562   ██████░░░░  (中等偏低)      │    │
│  │  TFS (终端忠实度)    0.254   ███░░░░░░░  (差)            │    │
│  │  OBS (可观测性)      0.634   ██████░░░░  (中等)          │    │
│  │  CPS (反事实剪枝)    0.000   (无可靠红旗)                │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                │
│  ┌─ 检查点详情 ────────────────────────────────────────────┐   │
│  │  C0 Grounding          0.833  GREEN  ████████░░         │   │
│  │  C1 Hypothesis          0.212  RED!   ██░░░░░░░░         │   │
│  │  C2 Experiment Contract 0.473  RED!   █████░░░░░         │   │
│  │  C3 Execution Health    0.809  GREEN  ████████░░         │   │
│  │  C4 Evidence Utility    0.515  AMBER  █████░░░░░         │   │
│  │  C5 Claim Fidelity      0.186  RED!   ██░░░░░░░░         │   │
│  │  C6 Review Closure      0.064  RED!   █░░░░░░░░░         │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌─ Fatal Failures (一票否决) ─────────────────────────────┐   │
│  │  C1: falsifier_strength = 0.0                           │   │
│  │  C2: failure_rule_specificity = 0.0                     │   │
│  │  C5: claim_support_precision = 0.42                     │   │
│  │  C5: support_strength_calibration = 0.0                 │   │
│  │  C5: overclaim_control = 0.0                            │   │
│  │  C6: action_issue_alignment = 0.0                       │   │
│  │  C6: resolution_evidence_strength = 0.0                 │   │
│  │  总计: 7 个 fatal failures                              │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌─ 诊断摘要 ──────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  做得好的:                                               │   │
│  │  ✓ C0: 问题定义清晰，基线和指标明确                       │   │
│  │  ✓ C3: 实验执行健康，多 seed、结果可解析                   │   │
│  │                                                          │   │
│  │  核心问题:                                               │   │
│  │  ✗ 假设缺少可证伪条件——没有定义"什么结果算失败"            │   │
│  │  ✗ 没有 pilot 实验——直接跑了完整 3-seed 实验              │   │
│  │  ✗ 论文存在严重 overclaim: "outperforms ALL" 只比了 1 个   │   │
│  │  ✗ FLOPs 声明 "~40%" 实际 38%，措辞未充分 hedge           │   │
│  │  ✗ 审稿 4 条意见完全未回应                                │   │
│  │                                                          │   │
│  │  为什么 CPS=0:                                           │   │
│  │  虽然 C1/C2/C5/C6 都是 RED，但它们的可观测性都            │   │
│  │  不到 0.70，意味着"我们连确信地说它差都做不到"。            │   │
│  │  这个框架需要更结构化地外化假设和计划，才能让评估           │   │
│  │  系统在早期就给出可靠的红旗。                              │   │
│  │                                                          │   │
│  │  改进建议:                                               │   │
│  │  1. 在 ideas.json 中增加 falsifier 和 pilot 字段          │   │
│  │  2. 在实验前输出一个 experiment_contract.json              │   │
│  │  3. 在 paper 写作阶段加入 claim-evidence 对照检查          │   │
│  │  4. 在 review 后加入 response + revision 环节              │   │
│  │                                                          │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  wall-clock: 28349s (7.87h)                                    │
│  评估耗时: ~8min (含 LLM Judge 调用)                            │
└───────────────────────────────────────────────────────────────┘
```

---

## 9. 这个评估告诉了我们什么

| 发现 | 含义 |
|------|------|
| C0 和 C3 是 GREEN | 这个框架的"问题定义"和"执行"做得不错——它知道要做什么，也能跑通实验 |
| C1 和 C2 是 RED (fatal) | 但它不会做"防御性研究设计"——不写可证伪条件、不设失败规则、不做 pilot |
| C5 有 3 个 fatal | 论文写作质量差——存在严重 overclaim，声明与证据不匹配 |
| C6 接近 0 | review 环节形同虚设——发现了问题但完全没有回应 |
| CPS=0 | 最讽刺的结论：明明有 4 个 RED，但因为框架不够透明，连"可靠地诊断出问题"都做不到 |

**如果这个框架要提升分数**，优先级是：
1. 在 `ideas.json` 里加 `falsifier` 字段（解决 C1 fatal）
2. 输出 `experiment_contract.json`（解决 C2）
3. 在论文生成后加一步 claim-evidence 检查（解决 C5）
4. 在 review 后加 response + revision（解决 C6）

这些改进同时会提升 O 值，使未来的 RED 判定更可能成为 Reliable Red Flag，从而让 CPS > 0。
