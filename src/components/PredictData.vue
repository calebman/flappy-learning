<!-- PredictData component description  -->
<template>
  <el-drawer :visible.sync="visible" size="45%">
    <div slot="title">
      <span v-show="loading">正在执行预测</span>
      <span v-show="!loading">预测完成，共采用{{ sampleSize }}条预测样本，成功预测{{ (sampleSize - predictData.length) }}条，以下是错误的预测结果数据</span>
    </div>
    <el-table :data="predictData" v-loading="loading" max-height="580">
      <el-table-column label="输入值" align="center">
        <el-table-column prop="x1" label="小鸟高度" align="center"></el-table-column>
        <el-table-column prop="x2" label="障碍高度" align="center"></el-table-column>
        <el-table-column prop="x3" label="障碍距离" align="center"></el-table-column>
      </el-table-column>
      <el-table-column label="预测值" align="center">
        <el-table-column prop="y1" label="不变概率" align="center"></el-table-column>
        <el-table-column prop="y2" label="跳跃概率" align="center"></el-table-column>
      </el-table-column>
      <el-table-column label="正确操作" align="center">
         <template slot-scope="scope">
           <span>{{ scope.row.correct === 1 ? '应该跳跃' : '应该保持' }}</span>
         </template>
      </el-table-column>
    </el-table>
  </el-drawer>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import Bird from "@/modules/game/Bird";
import TrainData from '@/modules/game/TrainData';
@Component
export default class BirdDialog extends Vue {
  @Prop(Boolean)
  public value: Boolean = false;
  @Prop(Bird)
  public bird: Bird;
  @Watch("value")
  private valueChange(val: Boolean) {
    this.visible = val;
    if (val) {
      this.loading = true;
      setTimeout(() => {
        this.loadPredictData();
      }, 100);
    }
  }
  @Watch("visible")
  private visibleChange(val: Boolean) {
    this.$emit("input", val);
  }
  public sampleSize: Number = 0;
  public visible: Boolean = false;
  public loading: Boolean = false;
  public predictData: any[] = [];
  public loadPredictData() {
    // 获取跳跃点的数据
    const all: TrainData[] = this.bird
      .getTrainStorage()
      .findAll();
    // 取 <500的样本
    let sample : TrainData[] = [];
    const sampleMaxSize = 2000
    this.sampleSize = sampleMaxSize;
    if (all.length < sampleMaxSize) {
      this.sampleSize = all.length;
      sample = all;
    } else {
      for (var j = 0; j < sampleMaxSize; j++) {
        var index = Math.floor(Math.random() * all.length);
        sample.push(all[index]);
        all.splice(index, 1);
      }
    }
    // 获取预测数据 错误的数据
    this.predictData = sample.map(o => {
      const data = o.data
      const prediction = this.bird.predict([data[0], data[1], data[2]]);
      return {
        x1: data[0],
        x2: data[1],
        x3: data[2],
        y1: prediction[0],
        y2: prediction[1],
        correct: data[3],
        prediction: prediction[1] > prediction[0] ? 1 : 0
      };
    }).filter(o => o.correct !== o.prediction);
    this.loading = false;
  }
}
</script>