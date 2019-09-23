<template>
  <div id="app">
    <el-alert title="教学模式下，按J跳跃，教学模式将录入游戏数据，作为AI的训练数据" type="info" center show-icon></el-alert>
    <el-container style="margin-top: 8px;">
      <el-aside width="540px">
        <canvas id="flappy" width="500" height="512"></canvas>
        <br />
        <el-radio-group v-model="speedLevel" @change="handleSpeedChange">
          <el-radio-button label="低速"></el-radio-button>
          <el-radio-button label="中速"></el-radio-button>
          <el-radio-button label="快速"></el-radio-button>
        </el-radio-group>
      </el-aside>
      <el-container>
        <div style="width: 100%">
          <span style="margin-right: 8px;">训练模型列表</span>
          <el-button icon="el-icon-add" @click="createBird">创建一个新的模型</el-button>
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
                  <el-input-number size="small" v-model="scope.row.threshold" :step="0.00125"></el-input-number>
                </template>
              </el-table-column>
            </el-table-column>
            <el-table-column label="操作" align="center">
              <template slot-scope="scope">
                <el-button size="mini" type="success" @click="teachBird(scope.row)">教学</el-button>
                <el-button
                  size="mini"
                  type="primary"
                  :loading="scope.row.trainLoading"
                  :disabled="scope.row.trainDataCnt < 1"
                  @click="trainBird( scope.row)"
                >训练</el-button>
                <el-button
                  size="mini"
                  type="primary"
                  :disabled="scope.row.trainCnt < 1"
                  @click="testBird(scope.row)"
                >测试</el-button>
                <el-button size="mini" type="danger" @click="removeBird(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-container>
    </el-container>
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
  public game: FlappyBirdGameEngine = null;
  public birds: Bird[] = [];
  public speedLevel: string = "低速";
  public start() {
    this.game.start();
  }
  handleSpeedChange(speedLevel: string) {
    this.game.options.fps = {
      低速: 60,
      中速: 800,
      快速: 8000
    }[speedLevel];
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
</style>
