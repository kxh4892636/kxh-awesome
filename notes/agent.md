# Agent

## 核心能力

- 独立思考: 能够根据给定的任务和上下文, 独立地进行任务规划和问题拆解;
- 自主执行: 能够根据独立思考的结果, 自主地执行任务, 并根据执行结果进行反馈和调整;
- 持续迭代: 能够根据反馈和调整, 持续地优化任务执行过程, 并最终完成任务;

## 决策流程

### 决策流程

- 感知(Perception): 外部世界的感知;
- 规划(Planning): 信息存储, 记忆, 知识库, 规划;
- 行动(Action): 根据规划, 执行任务;

## 记忆

- 感觉记忆: 多模态数据输入处理;
- 短期记忆: 上下文, 会话状态;
- 长期记忆: 持久存储;

## Agent 框架设计

### 框架架构


- 感知模块;
- 定义模块: Agent 信息;
- 记忆模块;
- 规划模块;
- 行动模块;

![alt text](images/agent-arch.png)

### 主流观点

- OpenAI: Agent = LLM + Memory + planning + Tool;
- 人大: Agent = Profile(定义 Agent) + Memory + planning + Action;
- 复旦大学: Agent = Perception + Brain + Action;


## Perception

- 多模态 LLM;

## Memory

### 短期记忆

- 内存;

### 长期记忆

#### 向量数据库

- 使用 embedding 模型, 将数据转换为向量, 可处理多模态数据
- 根据向量相似度进行检索, 可进行语义匹配;


#### RAG

##### RAG

- Retrieval-Augmented Generation = Retrieval + Generation;

##### 核心步骤

1. 文档切片;
2. 使用 embedding 模型, 将切片转换为向量;
3. 存储向量至向量数据库;
4. 用户查询检索, 提供给大模型;
5. 根据检索结果, 大模型生成响应;

##### 切片

- 固定 token;
- 固定分隔符;
- 基于语义分块;
- 智能体分块;

##### Rerank

- 提高检索切片数量;
- 对检索数量进行 rerank, 选择最相关的切片;

### 上下文工程

#### 上下文工程

- Prompt Engineering 的超集;
- LLM 上下文的管理系统;
  - system Prompt;
  - 对话历史(短期记忆);
  - 长期记忆;
  - 外部数据(RAG);
  - tool 定义;

#### 关键任务

- RAG 高级分块策略;
- 上下文压缩;

#### 关键策略

- 持久化上下文;
- 检索上下文: 子任务, 使用 RAG 动态选择上下文;
- 优化上下文: 上下文压缩, 防止上下文溢出和 lost in the middle;
- 分割上下文
  - 复制任务拆分为多个子智能体,  每个 subAgent 具有独立上下文;
  - 沙盒环境;

## 规划

### ReAct

- ReAct = Reasoning + Acting;
- 循环执行, 直到任务完成;

### Planning and Execution

1. 制定计划;
2. 执行计划, 并根据执行结果, 调整计划(部分人工参与);

### Reflection

1. 制定计划;
2. 执行计划, 并根据执行结果, 评估合理性, 并修正计划(完全无人工参与);

## 行动

### Function Calling

- 大模型 Function Calling 机制;

### MCP

- Model Context Protocol, 模型上下文协议;
- 提供标准化接口, 实现大模型与外部数据的交互;

## 安全模块

- LLM 大模型对齐: 符合人类价值观和伦理规范;
- 数据/权限安全;

## Agent 工作模式

### 单 Agent

- 一个 Agent 负责完成所有任务;

### 多 Agent

- 多 Agent 协作完成任务;

### 混合 Agent

- Agent 和人类协作, 完成任务;
