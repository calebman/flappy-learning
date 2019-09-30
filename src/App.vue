<template>
  <div id="app">
    <el-alert title="教学模式下，按J跳跃，教学模式将录入游戏数据，作为AI的训练数据" type="info" center show-icon></el-alert>
    <el-container style="margin-top: 8px;">
      <el-aside width="540px">
        <canvas id="flappy" width="500" height="512" data-v-step="3"></canvas>
        <br />
        <el-radio-group v-model="speedLevel" @change="handleSpeedChange" data-v-step="4">
          <el-radio-button label="低速"></el-radio-button>
          <el-radio-button label="中速"></el-radio-button>
          <el-radio-button label="快速"></el-radio-button>
        </el-radio-group>
      </el-aside>
      <el-container>
        <div style="width: 100%">
          <span style="margin-right: 8px;">训练模型列表</span>
          <el-tooltip content="查看新手引导" placement="top">
            <i class="el-icon-question flappy-bird-help" @click="help"></i>
          </el-tooltip>
          <el-button icon="el-icon-add" style="margin-left: 8px;" data-v-step="1" @click="createBird">创建一个新的模型</el-button>
          <el-divider></el-divider>
          <el-table :data="birds" style="width: 100%">
            <el-table-column prop="createAt" label="创建日期" align="center" width="180px">
              <template slot-scope="scope">
                <i class="el-icon-time"></i>
                <span
                  style="margin-left: 10px"
                >{{ $dayjs(scope.row.createAt).format('YYYY-MM-DD HH:mm:ss') }}</span>
              </template>
            </el-table-column>
            <el-table-column label="最高得分" align="center">
              <el-table-column prop="aiMaxScore" label="电脑" align="center" width="120"></el-table-column>
              <el-table-column prop="maxScore" label="玩家" align="center" width="120"></el-table-column>
            </el-table-column>
            <el-table-column label="模型训练" align="center">
              <el-table-column prop="trainCnt" label="次数" align="center" width="90px"></el-table-column>
              <el-table-column prop="trainDataCnt" label="数据量" align="center" width="120px"></el-table-column>
              <el-table-column prop="threshold" label="阈值" align="center" width="150px">
                <template slot-scope="scope">
                  <el-input-number
                    size="small"
                    v-model="scope.row.threshold"
                    :step="0.00125"
                    data-v-step="6"
                  ></el-input-number>
                </template>
              </el-table-column>
            </el-table-column>
            <el-table-column label="操作" align="center">
              <template slot-scope="scope">
                <el-button
                  size="mini"
                  type="success"
                  data-v-step="2"
                  @click="teachBird(scope.row)"
                >教学</el-button>
                <el-button
                  size="mini"
                  type="primary"
                  :loading="scope.row.trainLoading"
                  :disabled="scope.row.trainDataCnt < 1"
                  data-v-step="5"
                  @click="trainBird( scope.row)"
                >训练</el-button>
                <el-button
                  size="mini"
                  type="primary"
                  :disabled="scope.row.trainCnt < 1"
                  data-v-step="7"
                  @click="testBird(scope.row)"
                >测试</el-button>
                <el-button size="mini" type="danger" data-v-step="8" @click="removeBird(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-container>
    </el-container>
    <v-tour name="myTour" :steps="steps" :callbacks="tourCallbacks"></v-tour>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { FlappyBirdGameEngine } from "./modules/game/FlappyBirdGame";
import Bird from "./modules/game/Bird";
@Component({
  components: {}
})
export default class App extends Vue {
  public game: any = null;
  public birds: Bird[] = [];
  public speedLevel: string = "低速";
  public tourCallbacks: any = {
    onStop: (flag: any) => {
      localStorage.setItem("guide", "true");
    }
  };
  public steps: any[] = [
    {
      target: '[data-v-step="1"]',
      content: `首先，<strong>点击此处创建一个新的机器模型</strong>!`
    },
    {
      target: '[data-v-step="2"]',
      content: `<strong>开始一局游戏教学<br>将生产一些游戏数据提供给机器学习</strong>`
    },
    {
      target: '[data-v-step="3"]',
      content:
        "按J使小鸟跳跃避免撞击障碍物!<br>建议至少产生3,000条的数据提供给机器学习"
    },
    {
      target: '[data-v-step="4"]',
      content: "点此调整游戏运行的速度"
    },
        {
      target: '[data-v-step="5"]',
      content:
        "点此基于当前的数据进行模型训练<br>训练完成后将自动使用该模型测试游戏"
    },
    {
      target: '[data-v-step="6"]',
      content:
        "根据机器的表现微调阈值使模型适应游戏<br>当小鸟撞于上部障碍物则调大阈值，反之调小"
    },
    {
      target: '[data-v-step="7"]',
      content: "点此使训练完成的机器开始一轮新的游戏"
    },
    {
      target: '[data-v-step="8"]',
      content: "点此从本地存储中删除此模型"
    }
  ];
  public help() {
    this.$tours["myTour"].start();
  }
  public start() {
    this.game.start();
  }
  handleSpeedChange(speedLevel: string) {
    switch (speedLevel) {
      case "中速":
        return 8000;
      case "快速":
        return 800;
      default:
        return 60;
    }
    this.game.display();
  }
  public createBird() {
    this.game.birdStore.save(new Bird());
  }
  public teachBird(bird: Bird) {
    this.game.setBird(bird);
    this.game.start(false);
  }
  public async trainBird(bird: Bird) {
    await bird.train();
    this.game.setBird(bird);
    this.game.start(true);
  }
  public testBird(bird: Bird) {
    this.game.setBird(bird);
    this.game.start(true);
  }
  public removeBird(bird: Bird) {
    this.game.removeBird(bird);
  }
  public mounted() {
    this.game = new FlappyBirdGameEngine("flappy");
    this.birds = this.game.findAllBirds();
    if (this.birds.length < 1) {
      this.createBird();
    }
    if (!localStorage.getItem("guide")) {
      this.help();
    }
  }
}
</script>

<style lang="scss">
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin-top: 8px;
}
.flappy-bird-help {
  cursor: pointer;
}
</style>
