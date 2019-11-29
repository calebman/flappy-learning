<p align="center"><img src="https://resources.chenjianhui.site/flappy-learning-logo.png"/></p>
<p align="center"><strong>用机器学习玩转FlappyBird</strong></p>

## 项目简介

基于用户生产游戏数据并根据反向传播算法生成决策模型参与游戏，游戏引擎与AI基于**Vuejs**+**TypeScript**+**Tensorflow.js**实现，**[点此在线预览](https://calebman.github.io/flappy-learning/)**

### 流程设计

![](https://resources.chenjianhui.site/2019-09-06-run-flow.png)

1. 玩家通过玩游戏生成游戏数据，这里将采集游戏在每个时间点的**小鸟高度、障碍物高度、小鸟距下一个障碍物的水平距离**作为输入，以这个时间点**玩家的操作**作为输出
2. 将游戏数据统一存储到浏览器的LocalStorage统一管理
3. AI利用玩家产生的游戏数据基于反向传播算法建立决策模型
4. AI进行游戏测试

### 界面设计

界面左右分成两块内容，左侧为游戏界面，右侧为控制台界面，训练模型列表右侧有一个❓图标，点击可打开教学提示，下面描述一下如何训练一个FlappyBirdAI参与游戏

![](https://resources.chenjianhui.site/flappy-learning-web-page.png)

1. 点击**创建一个新的模型**完成必要信息填写，这里主要是关联神经网络以及训练迭代次数的一些配置
2. 在新的模型行中点击教学（或**按空格**）开始游戏，此时左侧游戏开始，玩家**按J跳跃**，游戏进行过程中左侧模型训练框中的数据量会不断增加，这些数据将持久化在**LocalStorage**中并作为AI的**训练数据**
3. 当玩家认为数据量达到预期时（建议大于3000）可终止游戏，点击训练按钮开始**训练决策函数模型**，此时右侧会弹出训练进度图表
4. 训练完成后游戏将由AI接手自动开始，右侧行会记录AI的最高得分
5. 模型训练完成，玩家可以点击数据预测使用玩家生成的游戏数据样本交与AI进行**预测分析**，预测完成后将给出AI预测结果与玩家输入预期不符的数据列表

### 模型训练效果展示

### 开发计划

- [X] 参照[FlappyLearning](https://github.com/xviniette/FlappyLearning)完成游戏引擎开发
- [X] 完成用户游戏数据采集器与其持久化模块 
- [X] 引入[Tensorflow.js](https://www.tensorflow.org/js)基于游戏数据训练决策模型并使用其参与游戏
- [X] 完成数据预测模块，便于对模型预测结果进行分析
- [ ] 分析AI参与游戏的能力，优化AI使其能够更好的适应游戏