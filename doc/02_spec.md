# TRACE-Sci 完整指标规格

> 本文档包含所有公式、检查点槽位、信任分层规则、叶子树评分细则，以及一个端到端的数值示例。
>
> **V1 定版依据**：论文正文 + [TRACE_SCI_METRICS_CLARIFICATIONS.md](../spec/TRACE_SCI_METRICS_CLARIFICATIONS.md)

---

## 1. 证据图：SciTrace-IR

### 1.1 节点类型

| 类型 | 含义 | 典型实例 |
|------|------|---------|
| `Activity` | 研究过程中的动作 | "生成假设"、"运行实验 #3"、"撰写 Section 4" |
| `Artifact` | 产出的文件或数据对象 | `config.json`、`results.csv`、`draft_v2.tex` |
| `Assertion` | 声明、假设、主张 | "方法 A 比基线高 3%"、"假设: 增大 batch size 提升泛化" |
| `Metric` | 数值指标 | accuracy=0.87、p-value=0.03、cost=$12.50 |
| `Agent` | 执行者 | LLM agent、人类审稿人、自动化脚本 |

### 1.2 关系类型

| 关系 | 语义 | 示例 |
|------|------|------|
| `generated_by` | 由某活动/代理产生 | `results.csv` generated_by "运行实验 #3" |
| `used` | 被某活动使用 | "运行实验 #3" used `config.json` |
| `derived_from` | 从某制品派生 | `draft_v2.tex` derived_from `draft_v1.tex` |
| `supports` | 支持某断言 | `results.csv` supports "方法 A 优于基线" |
| `critiques` | 批评某断言 | "审稿人 2" critiques "泛化性声明过强" |
| `resolves` | 解决某批评 | "增加 OOD 实验" resolves "审稿人 2 的泛化性质疑" |
| `cites` | 引用某来源 | "方法描述" cites "Smith et al. 2025" |
| `branches_from` | 从某节点分支 | "假设 B 实验" branches_from "假设 A 失败" |

### 1.3 信任分层 (Trust Tiers)

| 等级 | 权重 ω(e) | 证据来源类型 | 判定标准 | 示例 |
|------|----------|------------|---------|------|
| **T1** | 1.00 | 显式结构化制品 | 机器可直接解析的结构化格式；通过 JSONPath/YAMLPath 等确定性路径提取；语义字段与槽位直接对应 | `final_info.json.score`、`config.yaml.seed` |
| **T2** | 0.85 | 确定性半结构化证据 | 来源是半结构化文本/日志；由唯一匹配的确定性规则（正则、标题匹配）提取；不需要模型猜测 | Markdown `## Experiment` 下的固定段落、日志中 `seed=42` |
| **T3** | 0.60 | 证据锚定的 LLM 提取 | 候选片段已由 TraceMap 确定；LLM 只能在这些片段内做分类/抽取；若证据不足必须 ABSTAIN | 从散文段落中提取假设元组 |
| **T4** | 0.00 | 无锚定推断 | 没有候选片段、仅凭模型常识猜测、引用无法回指具体位置 | 🚫 **禁止进入正式图** |

**关系信任等级计算**：

$$\tau(\text{edge}) = \min(\tau(\text{rule}),\ \tau(\text{src}),\ \tau(\text{dst}))$$

**争议仲裁规则**：高可信优先——T1 存在则 T2/T3 不覆盖；T2 与 T3 冲突时保留 T2，T3 标记 `suppressed_by_higher_tier=true`。

### 1.4 图序列化格式

V1 正式格式为 **canonical JSON**（非 JSON-LD/RDF），结构如下：

```json
{
  "meta": { "trace_id": "...", "framework": "...", "case_id": "...", "builder_version": "..." },
  "nodes": [
    { "node_id": "art_001", "node_type": "Artifact", "subtype": "...", "tier": "T2",
      "canonical_id": "...", "payload": {}, "evidence_refs": ["..."] }
  ],
  "edges": [
    { "edge_id": "edge_001", "edge_type": "supports", "src": "art_001", "dst": "assert_007",
      "tier": "T3", "evidence_refs": ["..."] }
  ],
  "provenance": [
    { "record_id": "prov_001", "produced": "assert_007", "producer": "binder_v1",
      "source_evidence_refs": ["..."], "prompt_hash": "..." }
  ]
}
```

排序规则：nodes 按 `node_id`、edges 按 `edge_id`、provenance 按 `record_id`、所有对象键字典序。

---

## 2. 七个检查点及其槽位（V1 冻结版）

### 标记说明

- **类型列**：`OBJ` = 可客观判定；`SEM` = 需要语义判断；`OBJ/SEM` = 视证据形式可两种方式
- **N_k**：该检查点的必需槽位数，用于计算可观测性 $O_{C_k}$

---

### C0: Grounding（基础锚定）— N₀ = 4

> 研究轨迹是否暴露了问题、基线、指标和资源约束？

| 槽位 | 名称 | 含义 | 类型 | 最低满足条件 |
|------|------|------|------|------------|
| C0.1 | 问题锚点 | 研究要解决什么问题 | SEM | 非空文本（≥8 非空白字符）+ evidence_ref |
| C0.2 | 基线锚点 | 已有的对比基线 | OBJ/SEM | `name` 非空 + `source_ref` 存在 |
| C0.3 | 指标锚点 | 用什么指标衡量成功 | OBJ | `metric_name` 非空 + `opt_direction ∈ {min,max,report}` |
| C0.4 | 资源约束 | 计算/时间/成本预算 | OBJ | `budget_type` 与 `value` 都存在 |

---

### C1: Hypothesis（假设）— N₁ = 6

> 是否存在可测试的假设？

| 槽位 | 名称 | 含义 | 类型 | 最低满足条件 |
|------|------|------|------|------------|
| C1.1 | 干预 | 提出的方法/改变 | SEM | 非空文本 + evidence_ref |
| C1.2 | 对照 | 和什么比较 | SEM | 非空文本 + evidence_ref |
| C1.3 | 端点 | 衡量效果的关键终点 | OBJ/SEM | `metric_name` 或 `endpoint_name` 非空 |
| C1.4 | 预期方向 | 预期变化方向 | SEM | 枚举 `{increase,decrease,no_change,uncertain}` |
| C1.5 | 可证伪条件 | 什么结果能推翻假设 | SEM | 非空文本 + evidence_ref |
| C1.6 | 最小决定性试验 | 最低成本验证方案 | SEM | `description` 非空 + 预算字段存在 |

**原子分解**：(problem, intervention, comparator, endpoint, direction, falsifier) 六元组。

---

### C2: Experiment Contract（实验契约）— N₂ = 6

> 实验开始前是否有完整的"契约"？

| 槽位 | 名称 | 含义 | 类型 | 最低满足条件 |
|------|------|------|------|------------|
| C2.1 | 选定假设 | 从 C1 中选择了哪个假设 | SEM | 指向一个已存在的 hypothesis assertion |
| C2.2 | 数据集/划分 | 使用什么数据 | OBJ | `dataset_name` + `split_name` 非空 |
| C2.3 | 基线 | 实验对比基线 | OBJ/SEM | `baseline_name` 非空 |
| C2.4 | 主要指标 | 用什么指标判定 | OBJ | `metric_name` 非空 |
| C2.5 | 最小试点 | 小规模验证 | SEM | `description` 非空 |
| C2.6 | 失败规则 | 什么情况判定失败 | SEM | 非空文本 |

---

### C3: Execution Health（执行健康度）— N₃ = 6

> 实验是否可复现地执行了？

| 槽位 | 名称 | 含义 | 类型 | 最低满足条件 |
|------|------|------|------|------------|
| C3.1 | 运行清单 | 运行配置的完整记录 | OBJ | 至少 4/6 必填字段（command, cwd, config_ref, start_time, end_time, commit_or_snapshot） |
| C3.2 | 退出状态 | 进程是否正常结束 | OBJ | `{EXITED_0, EXITED_NONZERO}` |
| C3.3 | 可解析指标 | 结果能否被机器解析 | OBJ | 至少 1 个数值指标可解析 |
| C3.4 | 环境捕获 | 运行环境记录 | OBJ | 至少 1 个环境信息字段 |
| C3.5 | 种子捕获 | 随机种子记录 | OBJ | 至少 1 个 seed |
| C3.6 | 成本捕获 | 运行成本 | OBJ | 至少 1 个 wall-clock 值 |

---

### C4: Evidence Utility（证据效用）— N₄ = 4

> 实验结果是否被有效解读和利用？

| 槽位 | 名称 | 含义 | 类型 | 最低满足条件 |
|------|------|------|------|------------|
| C4.1 | 结果摘要 | 发生了什么 | SEM | 非空文本 |
| C4.2 | 不确定性表示 | 是否量化了不确定性 | OBJ/SEM | 非空文本或数值不确定性字段 |
| C4.3 | 信念更新 | 结果是否更新了先前认知 | SEM | 非空文本 |
| C4.4 | 下一步决策依据 | 为什么选择下一步行动 | SEM | `{continue,replan,park,kill,merge}` 之一或等价文本 |

---

### C5: Claim Fidelity（主张忠实度）— N₅ = 6 ⬆️ 原 4→6

> 最终声明是否有证据和引用支撑？

| 槽位 | 名称 | 含义 | 类型 | 最低满足条件 |
|------|------|------|------|------------|
| C5.1 | 声明文本 | 主张的内容 | SEM | 非空文本 |
| C5.2 | 声明类型 | 声明的性质分类 | SEM | 枚举 `{empirical,mechanistic,robustness,efficiency,literature}` |
| C5.3 | 证据链接 | claim 是否有 evidence | SEM | 至少一个 evidence_ref |
| C5.4 | 引用链接 | 引用是否正确关联 | OBJ/SEM | 至少一个 citation_ref 或显式 `NA` |
| C5.5 | 支持判定 | 证据支持强度 | SEM | 枚举 `{FULL,PARTIAL,NONE,CONTRADICTED}` |
| C5.6 | 不确定性措辞 | 不确定性表述 | SEM | 至少一个 uncertainty marker 或显式 `none` |

**更正说明**：论文原文列出 4 项，V1 规格扩展至 6 项。新增 `claim_type`（支撑过度主张检测）和 `uncertainty_wording`（支撑措辞校准）。

**原子分解**：
- 声明-支持对 (claim_text, evidence_ref, support_verdict)
- 引用-支持对 (citation, claim_it_supports, relevance)

---

### C6: Review Closure（审稿闭合）— N₆ = 4 ⬆️ 原 3→4

> 批评是否被追踪到解决？

| 槽位 | 名称 | 含义 | 类型 | 最低满足条件 |
|------|------|------|------|------------|
| C6.1 | 审稿问题 | 是否有审稿/批评记录 | OBJ/SEM | 非空文本 |
| C6.2 | 采取的行动 | 是否有修改行动 | SEM | 非空文本 |
| C6.3 | 解决证据 | 批评是否被证实已解决 | SEM | 至少一个 evidence_ref |
| C6.4 | 未解决披露 | 未解决的问题是否被诚实披露 | SEM | 枚举 `{resolved, unresolved_disclosed, unresolved_undisclosed}` |

**更正说明**：论文原文列出 3 项，V1 规格扩展至 4 项。新增 `unresolved_disclosure`，用于区分"未解决但诚实披露"和"未解决且装作已解决"。

**原子分解**：(critique, action_taken, resolution_evidence) 三元组。

---

### 槽位汇总（V1 冻结版）

| 检查点 | N_k | 研究阶段 | 相对论文的变化 |
|--------|-----|---------|-------------|
| C0 Grounding | 4 | 启动 | 不变 |
| C1 Hypothesis | 6 | 假设 | 不变 |
| C2 Experiment Contract | 6 | 规划 | 不变 |
| C3 Execution Health | 6 | 执行 | 不变 |
| C4 Evidence Utility | 4 | 桥接 | 不变 |
| C5 Claim Fidelity | **6** | 终端 | ⬆️ 原 4，新增 claim_type + uncertainty_wording |
| C6 Review Closure | **4** | 终端 | ⬆️ 原 3，新增 unresolved_disclosure |
| **总计** | **36** | — | **原 33→36** |

---

## 3. 完整叶子列表与冻结权重（V1 定版）

### 关键新机制：Fatal Leaf

每个叶子有一个 `fatal` 标记。若任何 `fatal=true` 的叶子得分 < 0.50，该检查点**直接判 RED**，不论 $E_{C_k}$ 数值多高。

### C0 叶子（6 个）

| leaf_id | 类型 | 权重 | fatal | 评分规则 |
|---------|------|------|-------|---------|
| `problem_specificity` | SEM | 0.20 | 否 | 1.0=明确任务/目标/范围；0.5=边界模糊；0.0=仅方向口号 |
| `baseline_anchor_validity` | OBJ/SEM | 0.20 | 是 | 1.0=名称+来源引用；0.5=名称存在来源不明；0.0=缺失 |
| `metric_anchor_validity` | OBJ/SEM | 0.20 | 是 | 1.0=名称+方向+适用条件；0.5=只有名称；0.0=缺失 |
| `literature_grounding_relevance` | SEM | 0.15 | 否 | top-3 参考项逐项标 RELEVANT=1/TANGENTIAL=0.5/IRRELEVANT=0，取均值 |
| `resource_constraint_specificity` | OBJ/SEM | 0.10 | 否 | 1.0=≥2 资源维度有数值；0.5=1 个；0.0=无数值预算 |
| `scope_internal_consistency` | SEM | 0.15 | 否 | 1.0=problem/baseline/metric/budget 一致；0.5=轻微歧义；0.0=明确冲突 |

### C1 叶子（6 个）

| leaf_id | 类型 | 权重 | fatal | 评分规则 |
|---------|------|------|-------|---------|
| `hypothesis_tuple_completeness` | atomic | 0.35 | 是 | 六元组逐项 PRESENT/PARTIAL/MISSING/CONTRADICTORY，用原子聚合公式 |
| `comparator_quality` | SEM | 0.10 | 是 | 1.0=明确且匹配；0.5=存在但偏弱；0.0=无或错位 |
| `endpoint_measurability` | OBJ/SEM | 0.10 | 是 | 1.0=可机器度量+协议明确；0.5=可测性弱；0.0=不可测 |
| `falsifier_strength` | SEM | 0.15 | 是 | 1.0=明确推翻条件；0.5=模糊；0.0=无 |
| `decisive_pilot_quality` | SEM | 0.20 | 是 | 1.0=在预算内能区分关键结果；0.5=信息量不足；0.0=无或不相关 |
| `resource_feasibility` | OBJ/SEM | 0.10 | 否 | 1.0=资源/依赖/预算可行；0.5=部分可行；0.0=明显不可行 |

### C2 叶子（6 个）

| leaf_id | 类型 | 权重 | fatal | 评分规则 |
|---------|------|------|-------|---------|
| `contract_completeness` | OBJ | 0.20 | 否 | s = 有效 contract 槽位数 / 6 |
| `hypothesis_plan_alignment` | SEM | 0.25 | 是 | 1.0=计划明确测试所选假设；0.5=部分对应；0.0=脱节 |
| `baseline_strength` | SEM | 0.15 | 否 | 1.0=强相关非 strawman；0.5=偏弱；0.0=缺失或不当 |
| `metric_and_split_validity` | OBJ/SEM | 0.15 | 是 | 1.0=metric+split+protocol 三者明确；0.5=缺一；0.0=缺二+ |
| `controls_ablation_coverage` | SEM | 0.15 | 否 | 1.0=至少 1 control + 1 ablation；0.5=只有其一；0.0=无 |
| `failure_rule_specificity` | SEM | 0.10 | 是 | 1.0=明确且绑定指标；0.5=模糊；0.0=不存在 |

### C3 叶子（6 个）

| leaf_id | 类型 | 权重 | fatal | 评分规则 |
|---------|------|------|-------|---------|
| `run_manifest_integrity` | OBJ | 0.15 | 否 | s = 6 个必填字段中存在的数量 / 6 |
| `process_exit_health` | OBJ | 0.20 | 是 | 1.0=所有 critical 正常退出；0.5=critical 正常但 non-critical 失败；0.0=任一 critical 非零 |
| `metric_parseability` | OBJ | 0.20 | 是 | 1.0=全部可解析；0.5=至少一半；0.0=不足一半 |
| `env_seed_capture` | OBJ | 0.15 | 否 | s = {env snapshot, dependency snapshot, seed} 存在数 / 3 |
| `artifact_completeness` | OBJ | 0.15 | 否 | s = produced_required / total_required |
| `budget_tracking` | OBJ | 0.15 | 否 | 1.0=wall-clock + 至少一个二级成本通道；0.5=仅 wall-clock；0.0=无 |

### C4 叶子（5 个）

| leaf_id | 类型 | 权重 | fatal | 评分规则 |
|---------|------|------|-------|---------|
| `result_summary_correctness` | SEM | 0.20 | 否 | 1.0=摘要与 metrics 一致；0.5=部分一致；0.0=误述关键结果 |
| `uncertainty_representation` | SEM | 0.15 | 否 | 1.0=明确报告方差/区间/限制；0.5=模糊提及；0.0=完全不提 |
| `belief_update_justification` | SEM | 0.30 | 是 | 1.0=明确说明结果如何改变信念；0.5=有变化没因果；0.0=无更新或无关 |
| `decision_justification` | SEM | 0.25 | 是 | 1.0=继续/修改/停止决策与证据一致；0.5=依据弱；0.0=与证据冲突 |
| `negative_evidence_recognition` | SEM | 0.10 | 否 | 1.0=负结果被清楚承认；0.5=被弱化；0.0=被忽略或反向表述 |

> C4 有 5 个叶子（论文中为 4 个槽位 + V1 新增 `negative_evidence_recognition`）。

### C5 叶子（7 个）

| leaf_id | 类型 | 权重 | fatal | 评分规则 |
|---------|------|------|-------|---------|
| `claim_support_precision` | atomic | 0.25 | 是 | 每个 claim 一个原子项，FULL/PARTIAL/NONE/CONTRADICTED |
| `evidence_coverage` | atomic | 0.15 | 否 | s = 被正确引用的 major artifacts / 全部 major artifacts |
| `citation_precision` | atomic | 0.15 | 否 | s = supporting citations / all linked citations |
| `citation_recall` | atomic | 0.10 | 否 | s = claims with ≥1 supporting citation / claims requiring citation |
| `support_strength_calibration` | SEM | 0.15 | 是 | 1.0=声明强度与证据一致；0.5=轻度夸大/保守；0.0=严重不匹配 |
| `uncertainty_wording_calibration` | SEM | 0.10 | 否 | 1.0=措辞与证据一致；0.5=偏强/偏弱；0.0=严重错配 |
| `overclaim_control` | SEM | 0.10 | 是 | 1.0=无严重 overclaim；0.5=次要 overclaim；0.0=headline unsupported |

### C6 叶子（5 个）

| leaf_id | 类型 | 权重 | fatal | 评分规则 |
|---------|------|------|-------|---------|
| `issue_extraction_completeness` | atomic | 0.20 | 否 | gold major issues 逐项 PRESENT/PARTIAL/MISSING/CONTRADICTORY |
| `action_issue_alignment` | atomic | 0.25 | 是 | 每个 issue-action 对：1.0=明确对应；0.5=间接相关；0.0=不相关 |
| `resolution_evidence_strength` | atomic | 0.25 | 是 | 每个对：1.0=直接证据已解决；0.5=间接证据；0.0=无证据 |
| `unresolved_major_issue_disclosure` | SEM | 0.15 | 否 | 1.0=未解决被明确披露；0.5=披露不完整；0.0=未解决却装作已解决 |
| `regression_avoidance` | SEM | 0.15 | 否 | 1.0=无新回归；0.5=次要回归；0.0=重大回归或自相矛盾 |

### 叶子汇总

| 检查点 | 叶子数 | fatal 叶子数 | 总权重 |
|--------|--------|------------|--------|
| C0 | 6 | 2 | 1.00 |
| C1 | 6 | 5 | 1.00 |
| C2 | 6 | 3 | 1.00 |
| C3 | 6 | 2 | 1.00 |
| C4 | 5 | 2 | 1.00 |
| C5 | 7 | 3 | 1.00 |
| C6 | 5 | 2 | 1.00 |
| **总计** | **41** | **19** | — |

---

## 4. 原子项评分量表与聚合

### 4.1 评分标签（统一四档）

| 标签 | 分值 |
|------|------|
| `PRESENT` / `FULL` / `RESOLVED` / `SUPPORTS` | 1.0 |
| `PARTIAL` / `WEAKLY_SUPPORTS` / `PARTIALLY_RESOLVED` | 0.5 |
| `MISSING` / `NONE` / `UNRESOLVED` / `IRRELEVANT_OR_MISSING` | 0.0 |
| `CONTRADICTORY` / `CONTRADICTED` / `MISREPRESENTED_AS_RESOLVED` | 0.0 + contradiction penalty |

另有 `ABSTAIN`：当证据不足时 judge 必须输出此标签，该项从分母中排除。

### 4.2 原子叶子聚合公式

$$s_{\text{atomic leaf}} = \max\left(0,\ \frac{1}{n}\sum_{i=1}^{n} a_i - 0.25 \cdot \frac{m}{n}\right)$$

- $n$ = 原子总数（排除 ABSTAIN）
- $a_i \in \{1.0, 0.5, 0.0\}$
- $m$ = CONTRADICTORY 个数

先算均值，再按 contradiction rate 扣罚，最后裁剪到 $[0,1]$。

### 4.3 为什么选择这个聚合方式

| 替代方案 | 问题 |
|---------|------|
| 最小值 | 太脆，一项缺失整个叶子崩掉 |
| 乘积 | 对中等长度 tuple 过度惩罚 |
| 最大值 | 掩盖缺失 |
| **均值 + contradiction penalty** | 能区分"结构大体齐全但有一处矛盾"和"压根没写" |

---

## 5. 公式体系

### 5.1 检查点质量分数 Q

$$Q_{C_k} = \sum_{\ell \in \mathcal{L}_k} w_\ell \cdot s_\ell$$

- $\mathcal{L}_k$：检查点 $C_k$ 的叶子评估器集合
- $w_\ell \geq 0$，$\sum_\ell w_\ell = 1$（冻结权重见第 3 节）
- $s_\ell \in [0, 1]$

### 5.2 检查点可观测性分数 O

$$O_{C_k} = \frac{1}{N_k} \sum_{j=1}^{N_k} \max_{e \in \mathcal{E}_{k,j}} \omega(e)$$

- $N_k$：必需槽位数（V1 冻结：{4,6,6,6,4,6,4}，总计 36）
- 槽位只表达"有没有、以多高可信度有"，不参与 Q 的连续打分

**槽位满足的最低要求**（5 条全满足才算被覆盖）：
1. 存在至少一个 slot_binding
2. 通过该槽位的类型校验
3. 带有至少一个 evidence_ref
4. trust_tier ∈ {T1,T2,T3}
5. 若为 T3，abstain=false 且 evidence span 非空

### 5.3 有效检查点分数 E

$$E_{C_k} = Q_{C_k} \times O_{C_k}$$

### 5.4 检查点颜色判定

| 颜色 | 条件 |
|------|------|
| **GREEN** | $E_{C_k} \geq 0.75$ 且无 fatal failure |
| **AMBER** | $0.50 \leq E_{C_k} < 0.75$ 且无 fatal failure |
| **RED** | $E_{C_k} < 0.50$，或任何 `fatal=true` 的叶子 $s_\ell < 0.50$ |

**Reliable Red Flag** = `verdict = RED` 且 $O_{C_k} \geq 0.70$

### 5.5 聚合指标 PGS（前缀治理分数）

$$\text{PGS} = 0.20 \cdot E_{C_0} + 0.22 \cdot E_{C_1} + 0.22 \cdot E_{C_2} + 0.20 \cdot E_{C_3} + 0.16 \cdot E_{C_4}$$

权重选择依据——排序约束：$C_1 \approx C_2 > C_0 \approx C_3 > C_4$（假设和实验契约是最强的坏路径源头）。

### 5.6 聚合指标 TFS（终端忠实度分数）

$$\text{TFS} = 0.45 \cdot E_{C_5} + 0.25 \cdot E_{C_6} + 0.30 \cdot E_{C_4}$$

排序约束：$C_5 > C_4 > C_6$（unsupported claim 最严重）。

> C4 同时出现在 PGS(0.16) 和 TFS(0.30) 中——它是前缀和终端之间的桥梁。

### 5.7 聚合指标 OBS（可观测性分数）

$$\text{OBS} = \frac{1}{7} \sum_{k=0}^{6} O_{C_k}$$

### 5.8 聚合指标 CPS（反事实剪枝分数）

$$\text{CPS} = \frac{c_\text{total} - c_\text{first-red}}{c_\text{total}}$$

**V1 成本通道**：只用 **wall-clock seconds**（被动观察器总能拿到）。

- $c_\text{total} = t_\text{end} - t_\text{start}$（首个 PROCESS_START → 末个 PROCESS_EXIT）
- $c_\text{first-red} = t_\text{first-red} - t_\text{start}$
- **无红旗时**：CPS = 0.0，`had_reliable_red = false`
- **多红旗时**：主榜只取最早一个；`red_flag_sequence.json` 记录全部

辅助成本通道（不进主 CPS）：`api_cost_usd`、`gpu_seconds`、`cpu_seconds`、`peak_memory_mb`。

---

## 6. LLM Judge 规范

### 6.1 模型绑定原则

每个 benchmark release 必须冻结并公开以下 8 个参数：

`judge_primary_model_id`、`judge_secondary_model_id`、`temperature`、`top_p`、`max_new_tokens`、`json_schema_mode`、`random_seed`、`prompt_hash`

V1 推荐默认：temperature=0, top_p=1, max_new_tokens=512, json_schema_mode=true。

### 6.2 Borderline Routing

当 primary judge 给出的叶子分数落在 **[0.40, 0.60]** 时，必须调用 secondary judge；否则不得调用。

### 6.3 Prompt 模板示例：Hypothesis Tuple

```text
[System]
You are TRACE-Sci semantic scorer for checkpoint C1, leaf hypothesis_tuple_completeness.
Use only the provided evidence snippets.
Do not infer beyond the evidence.
If the evidence is insufficient, output ABSTAIN for the missing atom.
Return valid JSON only.

[User]
Checkpoint: C1
Leaf: hypothesis_tuple_completeness
Atoms to score: 1.problem 2.intervention 3.comparator 4.endpoint 5.direction 6.falsifier
Allowed labels: PRESENT, PARTIAL, MISSING, CONTRADICTORY, ABSTAIN

Evidence snippets:
<snippet_1 with file path and line range>
<snippet_2 with file path and line range>

Return JSON:
{ "leaf_id": "...", "atoms": [{"atom":"problem","label":"...","evidence_refs":["path#Lx-Ly"],"rationale":"..."}], "abstain": false }
```

### 6.4 Prompt 模板示例：Claim-Support Pair

```text
[System]
You are TRACE-Sci semantic scorer for checkpoint C5, leaf claim_support_precision.
Use only the provided claim and evidence snippets. Do not use outside knowledge.
Return valid JSON only.

[User]
Claim: <claim text>
Evidence: <artifact snippet with file path and line range>
Allowed verdicts: FULL, PARTIAL, NONE, CONTRADICTED, ABSTAIN

Return JSON:
{ "leaf_id": "claim_support_precision", "verdict": "...", "evidence_refs": ["..."], "rationale": "...", "abstain": false }
```

---

## 7. 端到端数值示例（Walkthrough）

### 7.1 假设场景

一个框架运行了以下流程：
- 生成了研究想法和假设（记录在 `idea.json` 中）
- 写了实验计划（记录在 `plan.md` 中）
- 运行了实验（产出 `results.csv`，但没记录 random seed，也没记录成本）
- 写了论文（`paper.tex`），但有一个 claim 找不到对应证据，且缺失 `claim_type` 和 `uncertainty_wording`
- 没有审稿环节

### 7.2 计算 C3 (Execution Health)

**O_{C3}**（6 个槽位）：

| 槽位 | 证据？ | 最优来源 | tier | ω(e) |
|------|-------|---------|------|------|
| C3.1 运行清单 | 有，`config.yaml` | T1 | T1 | 1.00 |
| C3.2 退出状态 | 有，日志 "exit 0" | T2 | T2 | 0.85 |
| C3.3 可解析指标 | 有，`results.csv` | T1 | T1 | 1.00 |
| C3.4 环境捕获 | 有，`requirements.txt` | T2 | T2 | 0.85 |
| C3.5 种子捕获 | **无** | — | — | 0.00 |
| C3.6 成本捕获 | **无** | — | — | 0.00 |

$$O_{C_3} = \frac{1}{6}(1.00 + 0.85 + 1.00 + 0.85 + 0.00 + 0.00) = 0.617$$

**Q_{C3}**（使用 V1 冻结叶子权重）：

| leaf_id | 权重 | 得分 | fatal | 说明 |
|---------|------|------|-------|------|
| `run_manifest_integrity` | 0.15 | 0.67 | 否 | 4/6 字段存在 |
| `process_exit_health` | 0.20 | 1.00 | 是 | 全部正常退出 |
| `metric_parseability` | 0.20 | 1.00 | 是 | CSV 可直接读取 |
| `env_seed_capture` | 0.15 | 0.33 | 否 | 仅 dependency snapshot 有，env snapshot 和 seed 缺失 |
| `artifact_completeness` | 0.15 | 0.80 | 否 | 4/5 required artifacts 产出 |
| `budget_tracking` | 0.15 | 0.00 | 否 | 无任何成本记录 |

$$Q_{C_3} = 0.15(0.67) + 0.20(1.00) + 0.20(1.00) + 0.15(0.33) + 0.15(0.80) + 0.15(0.00) = 0.670$$

无 fatal failure（两个 fatal 叶子得分均 ≥ 0.50）。

$$E_{C_3} = 0.670 \times 0.617 = 0.413 \quad → \text{AMBER}$$

### 7.3 所有检查点汇总

| 检查点 | Q | O | E = Q×O | Fatal? | 颜色 |
|--------|------|------|---------|--------|------|
| C0 | 0.90 | 0.94 | 0.846 | 否 | GREEN |
| C1 | 0.75 | 0.80 | 0.600 | 否 | AMBER |
| C2 | 0.70 | 0.72 | 0.504 | 否 | AMBER |
| C3 | 0.67 | 0.62 | 0.413 | 否 | RED |
| C4 | 0.60 | 0.55 | 0.330 | 否 | RED |
| C5 | 0.45 | 0.42 | 0.189 | 是(overclaim) | RED |
| C6 | 0.00 | 0.00 | 0.000 | — | RED |

### 7.4 聚合指标

$$\text{PGS} = 0.20(0.846) + 0.22(0.600) + 0.22(0.504) + 0.20(0.413) + 0.16(0.330) = 0.547$$

$$\text{TFS} = 0.45(0.189) + 0.25(0.000) + 0.30(0.330) = 0.184$$

$$\text{OBS} = \frac{1}{7}(0.94 + 0.80 + 0.72 + 0.62 + 0.55 + 0.42 + 0.00) = 0.579$$

**CPS**：C3 是 RED 但 O=0.62 < 0.70，不是可靠红旗。C4 是 RED 但 O=0.55 < 0.70。C5 是 RED 但 O=0.42 < 0.70。→ **无可靠红旗**，CPS = 0.0。

### 7.5 最终得分卡

```
┌──────────────────────────────────────────────────┐
│           TRACE-Sci V1 评估报告                    │
├──────────────────────────────────────────────────┤
│  PGS (前缀治理)      0.547 / 1.000   █████░░░░░ │
│  TFS (终端忠实度)     0.184 / 1.000   ██░░░░░░░░ │
│  OBS (可观测性)       0.579 / 1.000   ██████░░░░ │
│  CPS (反事实剪枝)     0.000 (无可靠红旗)           │
├──────────────────────────────────────────────────┤
│  检查点 RED: C3, C4, C5, C6                      │
│  Fatal Failures: C5.overclaim_control             │
│  主要问题:                                        │
│  • C6 完全缺失 (无审稿环节)                        │
│  • C5 存在 overclaim (fatal)                      │
│  • C3 缺失种子和成本记录                            │
│  • 全部 RED 检查点可观测性均 <0.70，无可靠红旗      │
└──────────────────────────────────────────────────┘
```
