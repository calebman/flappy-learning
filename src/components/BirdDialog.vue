<!-- BirdDialog component description  -->
<template>
  <el-dialog title="模型配置" :visible="visible" :before-close="() => (visible = false)">
    <el-steps :active="step" align-center>
      <el-step title="神经网络模型配置" description="配置机器学习模型的隐藏层数目与其神经元数量" icon="el-icon-setting"></el-step>
      <el-step title="训练迭代次数配置" description="配置机器学习的迭代次数，次数越多训练所消耗的时间越长" icon="el-icon-refresh"></el-step>
    </el-steps>
    <div class="bird-dialog-content">
      <div v-show="step === 1">
        <el-drawer title="编辑节点" :visible.sync="drawerVisible" :before-close="() => (drawerVisible = false)">
          <el-form :model="unitForm">
            <el-form-item label="活动名称" label-width="80px">
              <el-input v-model="unitForm.name" autocomplete="off"></el-input>
            </el-form-item>
            <el-form-item label="活动区域" label-width="80px">
              <el-select v-model="unitForm.region" placeholder="请选择活动区域">
                <el-option label="区域一" value="shanghai"></el-option>
                <el-option label="区域二" value="beijing"></el-option>
              </el-select>
            </el-form-item>
          </el-form>
        </el-drawer>
      </div>
      <div v-show="step === 2">
        <span>请设置迭代次数：</span>
        <el-input-number v-model="epochs" size="small" :min="10" :max="100" :step="5"></el-input-number>
      </div>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取 消</el-button>
      <el-button type="primary" v-show="step > 1" :disabled="step <= 1" @click="prev">上一步</el-button>
      <el-button
        type="primary"
        v-show="step < maxStep"
        :disabled="step >= maxStep"
        @click="next"
      >下一步</el-button>
      <el-button type="success" v-show="step === maxStep" @click="complete">完成</el-button>
    </span>
  </el-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import Bird from "@/modules/game/Bird";
@Component
export default class BirdDialog extends Vue {
  @Prop(Boolean)
  public value: Boolean = false;
  @Watch("value")
  private valueChange(val: Boolean) {
    if (val) {
      this.step = 1;
    }
    this.visible = val;
  }
  @Watch("visible")
  private visibleChange(val: Boolean) {
    this.$emit("input", val);
  }
  public visible: Boolean = false;
  public step: number = 1;
  public maxStep: number = 2;
  public epochs: number = 50;
  public drawerVisible: Boolean = true;
  public unitForm: any = {};
  public prev() {
    this.step--;
  }
  public next() {
    this.step++;
  }
  public complete() {
    this.visible = false;
    this.$emit(
      "on-bird-create",
      new Bird({
        epochs: this.epochs,
        modelOptions: [{ useBias: true, units: 4 }]
      })
    );
  }
}
</script>

<style lang="scss">
.bird-dialog-content {
  text-align: center;
  padding: 8px;
  border: dotted;
  min-height: 150px;
  margin-top: 16px;
  line-height: 150px;
  border-color: #c8d6d6;
}
</style>
