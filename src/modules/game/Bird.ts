import Pipe from './Pipe';
import Queue from './Queue';
import { StoreType, StoreItem, IStore } from '../store/IStore';
import TrainData from './TrainData';
import StoreFactory from '../store/StoreFactory';
import * as tf from '@tensorflow/tfjs';
import * as tfvis from '@tensorflow/tfjs-vis';
const BIRD_TRAIN_STORE_SUFFIX = 'bird-train-data';
const BIRD_MODEL_STORE_SUFFIX = 'bird-model';
const inputSize = 3;


export default class Bird extends StoreItem {

  public static parse(obj: any): Bird {
    return new Bird({
      id: obj.id,
      maxScore: obj.maxScore || 0,
      aiMaxScore: obj.aiMaxScore || 0,
      createAt: obj.createAt || new Date().getTime(),
      trainCnt: obj.trainCnt || 0,
      trainDataCnt: obj.trainDataCnt || 0,
      modelOptions: obj.modelOptions,
      epochs: obj.epochs,
    });
  }

  public static sequence(bird: Bird): any {
    return {
      id: bird.getId(),
      maxScore: bird.maxScore,
      aiMaxScore: bird.aiMaxScore,
      createAt: bird.createAt,
      trainCnt: bird.trainCnt,
      trainDataCnt: bird.trainDataCnt,
      modelOptions: bird.modelOptions,
      epochs: bird.epochs,
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
  public formatTrainData: any = null;
  public useAI: boolean = false;
  public createAt: number = new Date().getTime();
  public trainCnt: number = 0;
  public trainDataCnt: number = 0;
  private model: any;
  private trainStorage: IStore<TrainData> | undefined;
  private readonly modelOptions: any[] = [{ useBias: true, units: 4 }];
  private readonly epochs: number = 10;
  private modelLoading: boolean = false;
  private trainLoading: boolean = false;
  private trainDataQueue: Queue<TrainData> = new Queue();
  private throwTrainDataCount: number = 260;


  public constructor(options: any = {}) {
    super();
    this.init();
    Object.assign(this, options);
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
        this.trainDataQueue = new Queue();
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
      this.trainDataQueue.push(new TrainData(trainData));
      if (this.trainDataQueue.size() > this.throwTrainDataCount) {
        const data = this.trainDataQueue.pop();
        if (data) {
          this.getTrainStorage().save(data);
          this.trainDataCnt++;
        }
      }
    }
  }

  /**
   * 预测函数
   * @param data 输入信息
   */
  public predict(data: number[]): any {
    const input = tf.tensor2d(data.slice(0, inputSize), [1, inputSize]);
    return this.model.predict(input).dataSync();
  }

  /**
   * 自动决策函数
   * @param data 输入信息
   */
  public judge(data: number[]): boolean {
    if (this.alive && this.useAI && this.model) {
      const prediction = this.predict(data);
      // 跳跃的可能性与保持不变的可能性比较
      // tslint:disable-next-line:no-console
      return prediction[0] > prediction[1];
    }
    return false;
  }

  /**
   * 训练一个新的模型
   */
  public async train() {
    this.trainLoading = true;
    const model = this.createModel();
    tfvis.visor().open();
    tfvis.show.modelSummary({ name: 'Modal Summary' }, model);
    const { inputs, labels } = this.generatorTrainData();
    // const focalLoss = (logits, labels, gamma) => {
    //   const softmax = tf.reshape(tf.nn.softmax(logits), [-1]);
    //   const labels = tf.range(0, logits.shape[0]) * logits.shape[1] + labels;
    //   const prob = tf.gather(softmax, labels);
    //   const weight = tf.pow(tf.subtract(1., prob), gamma);
    //   const loss = -tf.reduce_mean(tf.multiply(weight, tf.log(prob)));
    //   return loss;
    // };
    model.compile({
      optimizer: tf.train.adam(),
      loss: tf.losses.meanSquaredError,
      metrics: ['mse'],
    });

    const epochs = this.epochs;

    const result = await model.fit(inputs, labels, {
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
    if (tfvis.visor().isOpen()) {
      tfvis.visor().close();
    }
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
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 2, inputShape: [inputSize], useBias: true }));
    this.modelOptions.forEach((o) => model.add(tf.layers.dense(o)));
    model.add(tf.layers.dense({ units: 2, useBias: true }));
    return model;
  }

  /**
   * 构造训练数据
   */
  private generatorTrainData(useCache: boolean = false): any {
    this.getTrainStorage();
    if (this.formatTrainData !== null && useCache) {
      return this.formatTrainData;
    }
    const data = this.getTrainStorage().findAll().map((o) => o.data);
    if (data.length < 1) {
      throw new Error('训练数据不足');
    }
    // 预处理归一化数据
    return tf.tidy(() => {
      const upsampling = (source: any[]) => {
        // 上采样方案
        const result = source.filter((o) => o[3] === 0);
        const dumpData = source.filter((o) => o[3] === 1);
        const normalData = source.filter((o) => o[3] === 0);
        normalData.forEach((item, index) => {
          result.push(dumpData[index % dumpData.length]);
        });
        return result;
      };
      // 下采样
      const downsampling = (source: any[]) => {
        // 上采样方案
        const result = source.filter((o) => o[3] === 1);
        const dumpData = source.filter((o) => o[3] === 1);
        const normalData = source.filter((o) => o[3] === 0);
        for (let i = 0; i < dumpData.length; i++) {
          result.push(normalData[i]);
        }
        return result;
      };
      const trainData: any[] = upsampling(data);
      // Step 1. Shuffle the data
      tf.util.shuffle(trainData);
      // Step 2. Convert data to Tensor
      const inputs = trainData.map((d) => d.slice(0, inputSize));
      // labels [跳跃的可能性, 保持不变的可能性]
      const labels = trainData.map((d) => d[3] === 1 ? [1, 0] : [0, 1]);
      const inputTensor = tf.tensor2d(inputs, [inputs.length, inputSize]);
      const labelTensor = tf.tensor2d(labels, [labels.length, 2]);
      return {
        inputs: inputTensor,
        labels: labelTensor,
      };
    });
  }
}
