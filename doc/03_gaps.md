# TRACE-Sci 实现差距分析

> 本文档系统梳理论文与 V1 规格补充文档之间的闭环状态。
>
> **状态更新**：G1-G20 全部 20 项已由 [TRACE_SCI_METRICS_CLARIFICATIONS.md](../spec/TRACE_SCI_METRICS_CLARIFICATIONS.md) 正式回复。本文档同步更新为闭环审计版。

---

## 1. G1-G20 闭环状态总览

### 图例

- ✅ 已闭环（Clarifications 给出可实现的规格）
- ⚠️ 已回应但引入新设计决策（需关注）
- 🔴 仍然开放

---

### 1.1 P0 级（原阻塞性缺失）— 全部闭环

| ID | 缺失项 | 闭环状态 | Clarifications 给出了什么 | 关键变化 |
|----|-------|---------|-------------------------|---------|
| G1 | 事件账本 schema | ✅ | 16 字段 JSONL schema、8 个 event_type、canonical JSON 规则、大小上限 | 新增 `branch_id`/`round_id` 支持多分支 |
| G2 | TraceMap 配置语言 | ✅ | YAML DSL、9 顶层键、6 种 parser kind、passive-fallback 接口、AI Scientist 完整示例 | — |
| G3 | 叶子列表 + 权重 | ✅ | 7 个检查点共 41 个叶子的完整列表、冻结权重、评分细则 | 引入 `fatal` 叶子机制 |
| G4 | 红色检查点阈值 | ✅ | GREEN ≥0.75、AMBER [0.50,0.75)、RED <0.50 或 fatal leaf <0.50 | 比原建议的 0.30 宽松 |
| G5 | 原子项评分量表 | ✅ | 四档 {1.0, 0.5, 0.0, 0.0+penalty} + ABSTAIN | 引入 contradiction penalty |
| G6 | 成本度量方法 | ✅ | 主榜只用 wall-clock seconds | 否决了 token/GPU/美元 |

### 1.2 P1 级（原质量性缺失）— 全部闭环

| ID | 缺失项 | 闭环状态 | Clarifications 给出了什么 | 关键变化 |
|----|-------|---------|-------------------------|---------|
| G7 | 槽位二值/连续 | ✅ | 槽位只用于 O（tier-weighted presence），不参与 Q | 补充了槽位满足的 5 条最低要求 |
| G8 | 原子聚合函数 | ✅ | max(0, mean(a_i) - 0.25·m/n) | — |
| G9 | 无红旗 CPS | ✅ | CPS=0.0 + had_reliable_red=false | — |
| G10 | N_k 正式声明 + Trust tier 判定 | ✅ | N_k 冻结为 {4,6,6,6,4,6,4}=36；trust tier 判定决策树；关系 tier 公式 τ(edge)=min(τ(rule),τ(src),τ(dst)) | **槽位总数从 33→36** |
| G11 | 归一化器审计 | ✅ | 双标注+仲裁产生 gold graph、Node/Relation F1、Hallucination Rate、Abstention Rate 公式 | — |
| G12 | 权重选择依据 | ✅ | PGS: C1≈C2>C0≈C3>C4；TFS: C5>C4>C6；0.02 粒度设计 | — |
| G13 | Judge 模型 + prompt | ✅ | 8 个必冻结参数 + 2 个完整 prompt 模板 + borderline routing [0.40,0.60] | 引入 secondary judge 机制 |

### 1.3 P2 级（原增强性缺失）— 全部闭环

| ID | 缺失项 | 闭环状态 | Clarifications 给出了什么 |
|----|-------|---------|-------------------------|
| G14 | TraceMap 示例 | ✅ | AI Scientist 完整可执行 YAML（建议再补 2 个） |
| G15 | 多红旗处理 | ✅ | 主榜取最早，辅助 `red_flag_sequence.json` |
| G16 | OOD protocol | ✅ | ID(36)/OOD-Venue(12)/OOD-Domain(8) + 7 项必报指标 |
| G17 | Case bundle 规范 | ✅ | 完整目录结构 + manifest.json + agent/evaluator 可见性隔离 |
| G18 | 诊断片段 | ✅ | 4 类×300=1200 条 + snippet schema + 用途限定 |
| G19 | 图序列化 | ✅ | canonical JSON（非 JSON-LD）+ 排序规则 |
| G20 | 跨域/跨框架 protocol | ✅ | 准入规则 + 5 项必报 transfer 指标 |

---

## 2. Clarifications 引入的新机制（论文中未有）

以下 5 个机制是 Clarifications 新增的，不在论文原文中，在论文修订时需要补充说明：

| 新机制 | 描述 | 影响范围 |
|-------|------|---------|
| **Fatal Leaf** | 19 个叶子标记为 fatal；任何 fatal leaf 得分 <0.50 → 该检查点直接判 RED | 改变颜色判定逻辑 |
| **Contradiction Penalty** | 原子聚合公式中扣减 0.25·m/n | 影响所有 atomic leaf 的评分 |
| **Borderline Routing** | primary judge 打分在 [0.40,0.60] 时必须调用 secondary judge | 增加评估成本但提高可靠性 |
| **Negative Evidence Recognition** | C4 新增第 5 个叶子，检测负结果是否被承认 | C4 从 4 个叶子扩展到 5 个 |
| **关系 Tier 公式** | τ(edge)=min(τ(rule),τ(src),τ(dst))，关系不继承节点 tier | 影响证据图的可观测性计算 |

---

## 3. 两处更正

| 更正 | 旧值 | 新值 | 原因 |
|------|------|------|------|
| 槽位总数 | 33（C5=4, C6=3） | **36**（C5=6, C6=4） | C5 新增 `claim_type`/`uncertainty_wording`；C6 新增 `unresolved_disclosure` |
| 图序列化 | 未定/建议 JSON-LD | **canonical JSON** | 工程简单性 + 可哈希冻结 + 可审计优先于语义网互操作性 |

---

## 4. 仍然开放的问题

### 4.1 非线性轨迹的多实例聚合 🔴

**问题描述**：当一个框架探索了多个分支（如 3 个假设，各自走完 C1→C2→C3→C4），同一个检查点存在多个实例。目前规格未定义如何从多个实例得到单一检查点分数。

**已有的部分基础**：
- Ledger schema 中有 `branch_id` 和 `round_id` 字段，说明有多分支/多轮的概念
- 但没有聚合规则（取最好？取最终选用的分支？平均？）

**影响**：
- 不影响在线性框架（The AI Scientist）上的实验
- 影响在分支框架（AutoResearchClaw, ARIS）上的实验

**建议**：引入 trajectory instance 概念——每条从 C0 到 C6 的完整路径算一个实例，报告最终采用分支的分数作为主分，全分支的 min/mean/max 作为附录。

### 4.2 E=Q×O 乘法惩罚的可解释性 🟡

**状态**：Clarifications 未直接讨论。

**建议**：在评估报告中同时展示独立的 Q 和 O 值，让用户自行判断乘法惩罚是否过重。当前 walkthrough 示例已采用此做法。

### 4.3 C4 的双重角色 🟡

**状态**：权重选择依据（G12）间接解释了 C4 在 PGS(0.16) 和 TFS(0.30) 中的不同权重，但没有讨论是否拆分。

**当前设计的合理性**：C4 是"从证据到叙事"的桥接，天然同时属于前缀（实验后的即时解读）和终端（论文中的证据利用）。不拆分是合理的简化，但需要在文档中明确说明。

---

## 5. 实现路线图（更新版）

原路线图中 Phase 1 和 Phase 2 的大部分阻塞项已被 Clarifications 解除：

```
Phase 1: 基础设施（1-2 个月）  ← 原估 2-3 个月，因规格已齐可加速
├── ✅ 事件账本 schema 已定义 → 实现被动观察器
├── ✅ TraceMap DSL 已定义 → 实现 YAML parser + compiler
├── ✅ 图序列化已定义 → 实现 SciTrace-IR builder
├── ✅ AI Scientist TraceMap 已给出 → 直接编写 adapter
└── 🔴 需要额外为 AutoResearchClaw / DeepScientist 编写 TraceMap

Phase 2: 评分框架（1-2 个月）  ← 原估 2-3 个月
├── ✅ 41 个叶子 + 权重已冻结 → 实现评分器
├── ✅ 原子聚合公式已定义 → 实现 atomic scorer
├── ✅ 颜色阈值已定义 → 实现 checkpoint verdict
├── ✅ Prompt 模板已给出 → 集成 LLM Judge
├── ✅ Borderline routing 已定义 → 实现 dual-judge 逻辑
└── 🔴 需要定义多分支轨迹的聚合规则

Phase 3: 校准和审计（2-3 个月）  ← 不变
├── ✅ Gold graph 构建流程已定义 → 组织标注
├── ✅ F1/幻觉率/弃权率公式已定义 → 实现审计
├── 进行 Judge 校准实验
├── 权重敏感性分析
└── 为至少 3 个框架完成 TraceMap + normalization audit

Phase 4: 公开发布（1-2 个月）  ← 不变
├── ✅ Case bundle 规范已定义 → 收集 20-50 个 cases
├── ✅ Diagnostic snippets 规范已定义 → 生成 1200 条
├── ✅ OOD protocol 已定义 → 执行泛化测试
└── 运行完整评估 + 撰写 benchmark paper
```

---

## 6. 文档导航

| 文档 | 内容 |
|------|------|
| [01_overview.md](./01_overview.md) | 总架构图、指标流动图、四个聚合指标定义 |
| [02_spec.md](./02_spec.md) | V1 冻结版：36 槽位、41 叶子、完整公式、数值示例 |
| [03_gaps.md](./03_gaps.md) | 本文档：闭环审计 + 仍开放的问题 |
| [04_appendix.md](./04_appendix.md) | 五框架审计、benchmark 对比矩阵 |
| [CLARIFICATIONS](../spec/TRACE_SCI_METRICS_CLARIFICATIONS.md) | V1 规格补充的完整原文 |
