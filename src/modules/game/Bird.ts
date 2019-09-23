import Pipe from './Pipe';
import { StoreType, StoreItem, IStore } from '../store/IStore';
import TrainData from './TrainData';
import StoreFactory from '../store/StoreFactory';
import * as tf from '@tensorflow/tfjs';
import * as tfvis from '@tensorflow/tfjs-vis';
const BIRD_TRAIN_STORE_SUFFIX = 'bird-train-data';
const BIRD_MODEL_STORE_SUFFIX = 'bird-model';


export default class Bird extends StoreItem {

  public static parse(obj: any): Bird {
    return new Bird({
      id: obj.id,
      maxScore: obj.maxScore || 0,
      aiMaxScore: obj.aiMaxScore || 0,
      threshold: obj.threshold || 0.0375,
      createAt: obj.createAt || new Date().getTime(),
      trainCnt: obj.trainCnt || 0,
      trainDataCnt: obj.trainDataCnt || 0,
      modelOptions: obj.modelOptions,
    });
  }

  public static sequence(bird: Bird): any {
    return {
      id: bird.getId(),
      maxScore: bird.maxScore,
      aiMaxScore: bird.aiMaxScore,
      threshold: bird.threshold,
      createAt: bird.createAt,
      trainCnt: bird.trainCnt,
      trainDataCnt: bird.trainDataCnt,
      modelOptions: bird.modelOptions,
    };
  }

  public x: number = 80;
  public y: number = 250;
  public width: number = 40;
  public height: number = 30;
  public alive: boolean = true;
  public gravity: number = 0;
  public velocity: number = 0.3;
  public jump: number = -6;
  public isdump: boolean = false;
  public score: number = 0;
  public maxScore: number = 0;
  public aiMaxScore: number = 0;
  public threshold: number = 0.0375;
  public formatTrainData: any = null;
  public useAI: boolean = false;
  public createAt: number = new Date().getTime();
  public trainCnt: number = 0;
  public trainDataCnt: number = 0;
  private model: any;
  private trainStorage: IStore<TrainData> | undefined;
  private readonly modelOptions: any[];
  private modelLoading: boolean = false;
  private trainLoading: boolean = false;


  public constructor(options: any = {}) {
    super();
    this.init();
    Object.assign(this, options);
    this.modelOptions = Array.isArray(options.modelOptions) ? options.modelOptions : [];
    if (options.id) {
      this.setId(options.id);
      this.getModel();
    }
  }

  /**
   * 初始化
   */
  public init(): void {
    this.x = 80;
    this.y = 250;
    this.width = 40;
    this.height = 30;
    this.alive = true;
    this.gravity = 0;
    this.velocity = 0.3;
    this.jump = -6;
    this.isdump = false;
  }

  /**
   * 跳跃
   */
  public flap(): void {
    this.isdump = true;
    this.gravity = this.jump;
  }

  /**
   * 更新位置
   */
  public update(): void {
    this.gravity += this.velocity;
    this.y += this.gravity;
    this.isdump = false;
  }

  /**
   * 是否死亡
   * @param height 高度
   * @param pipes 管道信息
   */
  public isDead(height: number, pipes: Pipe[]): boolean {
    let dead = false;
    if (this.y >= height || this.y + this.height <= 0) {
      dead = true;
    }
    for (const i in pipes) {
      if (!(
        this.x > pipes[i].x + pipes[i].width ||
        this.x + this.width < pipes[i].x ||
        this.y > pipes[i].y + pipes[i].height ||
        this.y + this.height < pipes[i].y
      )) {
        dead = true;
      }
    }
    return dead;
  }

  /**
   * 持久化训练数据
   * @param trainData 训练数据
   */
  public saveTrainData(trainData: number[]): void {
    if (!this.useAI) {
      this.getTrainStorage().save(new TrainData(trainData));
      this.trainDataCnt++;
    }
  }

  /**
   * 自动决策函数
   * @param x1 输入信息1
   * @param x2 输入信息2
   */
  public judge(x1: number, x2: number): boolean {
    if (this.alive && this.useAI && this.model) {
      const { inputMax, inputMin, labelMin, labelMax } = this.generatorTrainData();
      const input = tf.tensor2d([x1, x2], [1, 2])
        .sub(inputMin)
        .div(inputMax.sub(inputMin));
      const prediction = this.model.predict(input)
        .mul(labelMax.sub(labelMin))
        .add(labelMin)
        .dataSync();
      return prediction[0] > this.threshold;
    }
    return false;
  }

  /**
   * 训练一个新的模型
   */
  public async train() {
    this.trainLoading = true;
    const model = this.createModel();
    tfvis.show.modelSummary({ name: 'Modal Summary' }, model);
    const { inputs, labels } = this.generatorTrainData(false);
    model.compile({
      optimizer: tf.train.adam(),
      loss: tf.losses.meanSquaredError,
      metrics: ['mse'],
    });

    const batchSize = 32;
    const epochs = 50;

    const result = await model.fit(inputs, labels, {
      batchSize,
      epochs,
      shuffle: true,
      callbacks: tfvis.show.fitCallbacks(
        { name: 'Training Performance' },
        ['loss'],
        { height: 200, callbacks: ['onEpochEnd'] },
      ),
    });
    tf.io.removeModel(`indexeddb://${BIRD_MODEL_STORE_SUFFIX}-${this.getId()}`);
    await model.save(`indexeddb://${BIRD_MODEL_STORE_SUFFIX}-${this.getId()}`);
    this.trainCnt++;
    tfvis.visor().close();
    this.trainLoading = false;
    this.model = model;
    return result;
  }

  public getTrainStorage(): IStore<TrainData> {
    if (this.trainStorage) {
      return this.trainStorage;
    }
    if (this.getId()) {
      this.trainStorage = StoreFactory.createStore(`${BIRD_TRAIN_STORE_SUFFIX}-${this.getId()}`,
        StoreType.LocalStorage, {
        parse: TrainData.parse,
      });
      this.trainDataCnt = this.trainStorage.size();
      return this.trainStorage;
    } else {
      // tslint:disable-next-line:no-console
      console.warn(`load train storage failed, bird id is invalid`);
      return StoreFactory.createMemmoryStore<TrainData>(BIRD_TRAIN_STORE_SUFFIX);
    }
  }

  /**
   * 加载训练模型
   */
  private async getModel() {
    if (this.model) {
      return this.model;
    }
    this.modelLoading = true;
    let model: any = null;
    if (this.getId()) {
      try {
        model = await tf.loadLayersModel(`indexeddb://${BIRD_MODEL_STORE_SUFFIX}-${this.getId()}`);
      } catch (err) {
        // tslint:disable-next-line:no-console
        console.warn(`load bird model failed with id = ${this.getId()}`, err);
      }
    }
    if (model == null) {
     model = this.createModel();
    }
    this.model = model;
    this.modelLoading = false;
    return model;
  }

  /**
   * 创建一个新的模型
   */
  private createModel() {
   const  model = tf.sequential();
   model.add(tf.layers.dense({ units: 2, inputShape: [2], useBias: true }));
   this.modelOptions.forEach((o) =>  model.add(tf.layers.dense(o)));
   model.add(tf.layers.dense({ units: 1, useBias: true }));
   return model;
  }

  /**
   * 构造训练数据
   */
  private generatorTrainData(useCache: boolean = true): any {
    this.getTrainStorage();
    if (this.formatTrainData !== null && useCache) {
      return this.formatTrainData;
    }
    const data = this.getTrainStorage().findAll().map((o) => o.data);
    if (data.length < 1) {
      throw new Error('训练数据不足');
    }
    return tf.tidy(() => {
      // Step 1. Shuffle the data
      tf.util.shuffle(data);

      // Step 2. Convert data to Tensor
      const inputs = data.map((d) => [d[0], d[1]]);
      const labels = data.map((d) => d[2]);

      const inputTensor = tf.tensor2d(inputs, [inputs.length, 2]);
      const labelTensor = tf.tensor2d(labels, [labels.length, 1]);

      // Step 3. Normalize the data to the range 0 - 1 using min-max scaling
      const inputMax = inputTensor.max();
      const inputMin = inputTensor.min();
      const labelMax = labelTensor.max();
      const labelMin = labelTensor.min();

      const normalizedInputs = inputTensor.sub(inputMin).div(inputMax.sub(inputMin));
      const normalizedLabels = labelTensor.sub(labelMin).div(labelMax.sub(labelMin));

      return {
        inputs: normalizedInputs,
        labels: normalizedLabels,
        // Return the min/max bounds so we can use them later.
        inputMax,
        inputMin,
        labelMax,
        labelMin,
      };
    });
  }
}
