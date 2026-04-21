# TRACE-Sci 附录：框架审计与 Benchmark 对比

> **V1 定版**：已同步 [TRACE_SCI_METRICS_CLARIFICATIONS.md](../spec/TRACE_SCI_METRICS_CLARIFICATIONS.md) 的更正（36 槽位、41 叶子、canonical JSON）。

---

## 1. 五个 AI Scientist 框架审计对照表

> 来源：论文 Section 3 的 repository-level audit，结合公开仓库信息扩展。

### 1.1 基本信息

| 维度 | AutoResearchClaw | ARIS | The AI Scientist | DeepScientist | Dr. Claw |
|------|-----------------|------|-----------------|---------------|----------|
| 来源 | AIMING Lab | wanshuiyin | Sakana AI | ResearAI | OpenLAIR |
| 控制风格 | 显式多阶段管线 | 工作流+技能栈 | 大致线性链 | 技能驱动工作空间 | 工作空间/控制平面 |
| 分支能力 | 有，带 gating | 有，多轮循环 | 弱 | 事件驱动 | 依赖内部 pack |
| 开源状态 | GitHub 公开 | GitHub 公开 | GitHub 公开 | GitHub 公开 | GitHub 公开 |

### 1.2 产物表面 (Artifact Surface)

| 产物类型 | AutoResearchClaw | ARIS | The AI Scientist | DeepScientist | Dr. Claw |
|---------|-----------------|------|-----------------|---------------|----------|
| 研究想法/假设 | ✅ 阶段输出 | ✅ Idea reports | ✅ `ideas.json` | ✅ Brief/Plan | ✅ Research brief |
| 实验计划 | ✅ 阶段输出 | ✅ Experiment plans | 🟡 弱外化 | ✅ Plan/Status | ✅ Task DAG |
| 实验代码 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 实验结果 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 论文草稿 | ✅ | ✅ Paper plans | ✅ Writeup | ✅ Summary | 视 pack 而定 |
| 审稿记录 | ✅ 验证报告 | ✅ Review artifacts | ✅ Review files | 🟡 事件日志 | 视 pack 而定 |
| 分支决策记录 | ✅ Gating 日志 | 🟡 隐式 | 🔴 无 | ✅ 事件日志 | 🟡 依赖 pack |
| 成本记录 | 🟡 | 🟡 | 🔴 | 🟡 | 🟡 |
| 环境/种子记录 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |

### 1.3 固定阶段对齐的脆弱性分析

如果强制将五个框架映射到 `Idea → Plan → Experiment → Paper → Review` 五阶段模型：

| 框架 | 会丢失什么 | 会被错误归类什么 |
|------|----------|---------------|
| **AutoResearchClaw** | 分支探索和 gating 决策的语义——线性模型无法表示"在 3 个方向中选了 1 个" | Gate 输出可能被错误归为 "Plan" |
| **ARIS** | 多轮迭代——idea/experiment/review 可以反复循环，不是单次线性 | 第二轮 review 可能被归为第一轮的延续 |
| **The AI Scientist** | 损失较小（本身接近线性），但中间规划的弱外化会被掩盖 | 可能高估其 "Plan" 阶段的质量 |
| **DeepScientist** | 事件驱动的状态迁移——活动不按阶段组织，而是按事件触发 | 散落在多个文件中的状态可能被遗漏 |
| **Dr. Claw** | 工作空间层和科学家核心层的抽象层级区分 | 控制平面的协调活动没有对应的"阶段" |

**结论**：固定阶段对齐在 5 个框架中至少 4 个会引入显著信息损失。这正是论文主张用证据图替代阶段名的核心依据。

### 1.4 各框架对 TRACE-Sci 检查点的预期覆盖（V1 更新版，36 槽位）

基于公开仓库信息推测各框架可能达到的可观测性水平（粗略估计）。V1 扩展了 C5（+2 槽位）和 C6（+1 槽位），部分框架的预期 O 值相应调整：

| 检查点 | N_k | AutoResearchClaw | ARIS | The AI Scientist | DeepScientist | Dr. Claw |
|--------|-----|-----------------|------|-----------------|---------------|----------|
| C0 Grounding | 4 | 高 | 高 | 中 | 高 | 高 |
| C1 Hypothesis | 6 | 高 | 高 | 中 | 中-高 | 中 |
| C2 Exp. Contract | 6 | 高 | 中-高 | 低 | 中 | 中 |
| C3 Exec. Health | 6 | 中 | 中 | 中 | 中 | 中 |
| C4 Evidence Utility | 4 | 中-高 | 中 | 低-中 | 中 | 中 |
| C5 Claim Fidelity | **6** | 中 | 中 | 低-中 ⬇️ | 中 | 视 pack |
| C6 Review Closure | **4** | 高 | 高 | 中 | 低-中 | 视 pack |
| **预期 OBS 范围** | — | **0.63-0.78** | **0.53-0.73** | **0.30-0.50** ⬇️ | **0.43-0.63** | **0.43-0.68** |

> ⚠️ 以上为基于仓库文档的粗略推测，非实际评估结果。
>
> C5 和 C6 扩展后，The AI Scientist 的预期 OBS 下降——因为 `claim_type`、`uncertainty_wording`、`unresolved_disclosure` 这三个新槽位在该框架中可能没有对应的显式输出。

### 1.5 Fatal Leaf 预期触发分析

基于各框架的产物特征，以下 fatal leaf 最可能在实际评估中触发 RED：

| fatal leaf | 最可能触发的框架 | 原因 |
|-----------|----------------|------|
| `hypothesis_tuple_completeness` | The AI Scientist | ideas.json 有想法但可能缺少可证伪条件 |
| `belief_update_justification` | 通用风险 | 很多框架跑完实验后直接写论文，不明确更新信念 |
| `overclaim_control` | 通用风险 | LLM 生成的论文常有过度主张 |
| `failure_rule_specificity` | ARIS, DeepScientist | 技能驱动框架可能不显式声明失败规则 |
| `action_issue_alignment` | The AI Scientist | review 环节相对简单，action-issue 对齐可能弱 |

---

## 2. 现有 Benchmark 对比矩阵

### 2.1 科学 Agent Benchmark 全景

| Benchmark | 评估什么 | 前缀评估 | 只读 | 溯源 | 客观评分 | 语义分解 | 轨迹支持 |
|-----------|---------|---------|------|------|---------|---------|---------|
| **ScienceAgentBench** | 数据驱动科学任务 | 🔴 | ✅ | 🔴 | ✅ 强 | 🔴 | 🔴 |
| **MLE-bench** | ML 工程任务 | 🔴 | ✅ | 🔴 | ✅ 强 | 🔴 | 🔴 |
| **PaperBench** | 论文复现 | 🔴 | 🟡 | 🔴 | 🟡 | ✅ 千级叶子 | 🔴 |
| **HeurekaBench** | 开放科学问答 | 🔴 | ✅ | 🔴 | 🟡 | ✅ 原子事实 | 🔴 |
| **AstaBench** | 科学研究全流程 | 🟡 | 🟡 | 🔴 | ✅ | ✅ 多维度 | 🟡 |
| **CSR-Bench** | 代码仓库部署 | 🔴 | ✅ | 🔴 | ✅ 强 | 🔴 | 🔴 |
| **ScienceBoard** | 多模态科学工作流 | 🔴 | 🟡 | 🔴 | ✅ | 🟡 | 🟡 |
| **OpenScholar** | 文献综合 | 🔴 | ✅ | 🟡 | 🟡 | ✅ | 🔴 |
| **ResearchGym** | 长程研究循环 | 🟡 | 🟡 | 🔴 | 🟡 | 🟡 | ✅ |
| **InnovatorBench** | 创新性 AI 研究 | 🟡 | 🟡 | 🔴 | 🟡 | 🟡 | ✅ |
| **MLAgentBench** | ML 实验 | 🔴 | 🔴 框架特定 | 🔴 | ✅ | 🔴 | 🔴 |
| **TRACE-Sci V1** | **AI Scientist 轨迹** | **✅** | **✅** | **✅** | **✅** | **✅ 41叶/原子** | **✅** |

### 2.2 通用 Agent Benchmark 参照

| Benchmark | 领域 | 与 TRACE-Sci 的关系 |
|-----------|------|-------------------|
| **AgentBench** | LLM 通用 agent 能力 | 多环境测试的思路可借鉴，但无科学轨迹概念 |
| **AgentBoard** | 多轮 agent 分析 | 多轮交互评估的分析方法值得参考 |
| **SWE-bench** | 软件工程 issue 修复 | 客观验证（测试通过率）的成功案例 |
| **WebArena** | Web 交互 | 真实环境中的 agent 评估范式 |
| **OSWorld** | 计算机操作 | 多模态 agent 的开放任务评估 |
| **GAIA** | 通用 AI 助手 | 多步推理 + 工具使用的综合测试 |
| **TheAgentCompany** | 企业任务 | 有意义的现实世界任务评估 |
| **BrowseComp** | 深度搜索 | 浏览型 agent 的针对性测试 |

### 2.3 四种评估范式对比

| 维度 | 终端结果评分 | 框架特定插桩 | 整体 LLM 评判 | TRACE-Sci |
|------|-----------|------------|-------------|-----------|
| **代表** | MLE-bench, OpenScholar | MLAgentBench | G-Eval, MT-Bench | TRACE-Sci V1 |
| **评估时机** | 运行结束后 | 运行过程中 | 运行结束后 | 运行过程中+结束后 |
| **是否修改被评系统** | 否 | 是 | 否 | 否 |
| **故障定位能力** | 无（只知道结果好坏） | 有（但改变了系统） | 弱 | 有（7 检查点/36 槽位/41 叶子） |
| **跨框架可比性** | 高（统一终端指标） | 低（每框架不同） | 中 | 中-高（证据图归一化） |
| **评估成本** | 低（一次终端检查） | 高（需要适配） | 中（LLM API） | 高（adapter + graph + dual judge） |
| **对新框架的友好度** | 高 | 低（需开发插桩） | 高 | 中（需写 TraceMap，支持 passive-fallback） |
| **可观测性度量** | 无 | 隐式 | 无 | 显式（OBS + T1-T4 信任分层） |
| **反事实分析** | 无 | 无 | 无 | 有（CPS, wall-clock based） |
| **质量保障机制** | 无 | 无 | 无 | fatal leaf + borderline routing |

---

## 3. TRACE-Sci 借鉴的已有 Benchmark 设计元素

论文并非凭空设计，而是从多个现有 benchmark 中提取了成功的设计模式：

| 设计模式 | 来源 benchmark | 在 TRACE-Sci 中如何使用 |
|---------|---------------|----------------------|
| 客观执行验证 | ScienceAgentBench, MLE-bench, SWE-bench | 客观叶子：文件存在、exit code、数值容差 |
| 细粒度语义分解 | PaperBench (千级叶子) | 叶子树结构 |
| 原子事实评估 | HeurekaBench | 原子项：假设元组、claim-support 对 |
| 多维度评分 | AstaBench (内容/引用/证据) | Q/O 分离，PGS/TFS/OBS/CPS 四维度 |
| 长程轨迹评估 | ResearchGym, InnovatorBench | 检查点序列，前缀评估 |
| 溯源模型 | W3C PROV, OpenTelemetry, OpenLineage | SciTrace-IR 证据图的节点/关系设计 |
| 评估器审计 | Prometheus, AlpacaEval 的偏见分析 | P6 原则：报告 F1/幻觉率/Judge 校准 |

---

## 4. 论文中 Table 1 & Table 2 的扩展解读

### Table 1: 评估范式对比（论文第 3-4 页）

论文的核心论点通过 Table 1 展开：

```
现有三种范式各有所长:
  ① 终端评分 → 擅长衡量最终质量，但看不到过程
  ② 框架插桩 → 能看到过程，但改变了被评对象
  ③ LLM 评判 → 灵活但不可靠

TRACE-Sci 的定位:
  → 能看到过程（检查点）
  → 不改变被评对象（只读）
  → LLM 只用于有锚定的原子评判（受控）
  → 代价是需要 adapter 开发和 judge 审计
```

### Table 2: 五框架审计（论文第 5 页）

这张表的目的不是排名框架，而是证明**一个设计论点**：

> 如果这 5 个框架的内部结构如此不同，那么任何假设它们有相同阶段结构的 benchmark 从一开始就是错误的。

表中三个关键列的逻辑：
1. **Native control structure** → 框架彼此不同
2. **Public artifact surface** → 产物形式也不同
3. **Why fixed stage alignment is brittle** → 所以固定阶段对齐行不通

这直接导向了论文的核心设计选择：**用证据图替代阶段名**。

---

## 5. 文档导航

| 文档 | 内容 |
|------|------|
| [01_overview.md](./01_overview.md) | 总架构图、指标流动图、V1 关键数字速查 |
| [02_spec.md](./02_spec.md) | V1 冻结版：36 槽位、41 叶子、完整公式、数值示例 |
| [03_gaps.md](./03_gaps.md) | G1-G20 闭环审计 + 仍开放的问题 + 实现路线图 |
| [04_appendix.md](./04_appendix.md) | 本文档：五框架审计扩展、benchmark 对比矩阵、fatal leaf 分析 |
| [CLARIFICATIONS](../spec/TRACE_SCI_METRICS_CLARIFICATIONS.md) | V1 规格补充的完整原文 |
