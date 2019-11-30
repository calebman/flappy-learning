import Pipe from './Pipe';
import Bird from './Bird';
import FlappyBirdGameConfig from './FlappyBirdGameConfig';
import { StoreType, IStore } from '../store/IStore';
import StoreFactory from '../store/StoreFactory';
import TrainData from './TrainData';
const BIRD_STORE_SUFFIX = 'flappy-bird-game-engine-birds';
/**
 * FlappyBird游戏引擎
 */
export class FlappyBirdGameEngine {
  public bird: Bird;
  public birdStore: IStore<Bird> = StoreFactory.createStore(BIRD_STORE_SUFFIX, StoreType.LocalStorage, {
    parse: Bird.parse,
    sequence: Bird.sequence,
    lazy: false,
  });
  public options: FlappyBirdGameConfig = new FlappyBirdGameConfig();
  private readonly birdImg: any;
  private readonly backgroundImg: any;
  private readonly pipetopImg: any;
  private readonly pipebottomImg: any;
  private readonly domId: string;
  private width: number = 0;
  private height: number = 0;
  private canvas: any;
  private ctx: any;
  private pipes: Pipe[] = [];
  private interval: number = 0;
  private backgroundx: number = 0;
  private running: boolean = false;
  private initialized: boolean = false;

  /**
   * 构造FlappyBird游戏
   * @param domId dom元素ID 用于游戏的渲染
   * @param bird 游戏中的小鸟对象
   * @param options 配置信息
   */
  public constructor(domId: string = 'flappyBird',
                     bird: Bird = new Bird({}),
                     options: FlappyBirdGameConfig = new FlappyBirdGameConfig()) {
    this.bird = bird;
    this.options = options;
    Object.assign(this.options);
    this.domId = domId;
    document.onkeydown = (e) => {
      const keyNum = window.event ? e.keyCode : e.which;
      if (this.bird.alive && keyNum === 74) {
        this.bird.flap();
      }
    };
    this.canvas = document.querySelector(`#${this.domId}`);
    if (this.canvas) {
      this.loadImages();
      this.ctx = this.canvas.getContext('2d');
      this.width = this.canvas.width;
      this.height = this.canvas.height;
    } else {
      // tslint:disable-next-line:no-console
      console.error(`Load canvas error with dom id ${this.domId}`);
    }
  }

  public setBird(bird: Bird): void {
    this.bird = bird;
  }

  public start(useAI: boolean = false): void {
    const id = setInterval(() => {
      if (this.initialized) {
        this.init();
        this.running = true;
        this.update();
        this.display();
        this.bird.useAI = useAI;
        clearInterval(id);
      }
    }, 100);
  }

  public stop() {
    this.running = false;
    this.birdStore.save(this.bird);
  }

  public init(): void {
    this.interval = 0;
    this.bird.score = 0;
    this.pipes = [];
    this.bird.init();
  }

  public update() {
    const running = this.running;
    const pipes = this.pipes;
    const bird = this.bird;
    const spawnInterval = this.options.spawnInterval;
    const backgroundSpeed = this.options.backgroundSpeed;
    const height = this.options.height;
    const width = this.options.width;
    const fps = this.options.fps;

    if (running === false) {
      return;
    }
    this.backgroundx += backgroundSpeed;

    if (bird.alive) {
      if (pipes.length > 0) {
        const trainData = this.generatorTrainData();
        if (bird.judge(trainData)) {
          bird.flap();
        }
        trainData.push(bird.isdump ? 1 : 0);
        // 持久化
        bird.saveTrainData(trainData);
      }
      bird.update();
      if (bird.isDead(height, pipes)) {
        bird.alive = false;
        this.stop();
      }
    }

    for (let i = 0; i < pipes.length; i++) {
      pipes[i].update();
      if (pipes[i].isOut()) {
        pipes.splice(i, 1);
        i--;
      }
    }

    if (this.interval === 0) {
      const deltaBord = 50;
      const pipeHoll = 120;
      const hollPosition = Math.round(Math.random() * (height - deltaBord * 2 - pipeHoll)) + deltaBord;
      pipes.push(new Pipe({ x: width, y: 0, height: hollPosition }));
      pipes.push(new Pipe({ x: width, y: hollPosition + pipeHoll, height }));
    }

    this.interval++;
    if (this.interval === spawnInterval) {
      this.interval = 0;
    }

    if (bird.useAI) {
      bird.aiMaxScore = Math.max(++bird.score, bird.aiMaxScore);
    } else {
      bird.maxScore = Math.max(++bird.score, bird.maxScore);
    }

    bird.isdump = false;
    setTimeout(() => this.update(), 1000 / fps);
  }

  public display(): void {
    const width = this.options.width;
    const height = this.options.height;
    const fps = this.options.fps;
    const backgroundImg = this.backgroundImg;
    const pipetopImg = this.pipetopImg;
    const pipebottomImg = this.pipebottomImg;
    const birdImg = this.birdImg;
    const backgroundx = this.backgroundx;
    const pipes = this.pipes;
    const bird = this.bird;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < Math.ceil(width / backgroundImg.width) + 1; i++) {
      ctx.drawImage(backgroundImg, i * backgroundImg.width - Math.floor(backgroundx % backgroundImg.width), 0);
    }

    for (let i = 0; i < pipes.length; i++) {
      if (i % 2 === 0) {
        ctx.drawImage(pipetopImg, pipes[i].x, pipes[i].y + pipes[i].height - pipetopImg.height,
          pipes[i].width, pipetopImg.height);
      } else {
        ctx.drawImage(pipebottomImg, pipes[i].x, pipes[i].y, pipes[i].width, pipetopImg.height);
      }
    }

    ctx.fillStyle = '#FFC600';
    ctx.strokeStyle = '#CE9E00';
    if (bird.alive) {
      ctx.save();
      ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
      ctx.rotate(Math.PI / 2 * bird.gravity / 20);
      ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
      ctx.restore();
    }

    ctx.fillStyle = 'white';
    ctx.font = '20px Oswald, sans-serif';
    ctx.fillText('Score : ' + bird.score, 10, 25);
    ctx.fillText('Max Score : ' + (bird.useAI ? bird.aiMaxScore : bird.maxScore), 10, 50);
    ctx.fillText('FPS : ' + fps, 10, 75);

    if (this.running === false) {
      return;
    }
    requestAnimationFrame(() => this.display());
  }

  public findAllBirds(): Bird[] {
    return this.birdStore.findAll();
  }

  public removeBird(bird: Bird): void {
    bird.getTrainStorage().clear();
    this.birdStore.remove(bird);
  }

  /**
   * 加载必要的图片资源
   */
  private loadImages() {
    const imgUrls: any = {
      birdImg: this.options.birdImgUrl,
      backgroundImg: this.options.backgroundImgUrl,
      pipetopImg: this.options.pipetopImgUrl,
      pipebottomImg: this.options.pipebottomImgUrl,
    };
    const images: any = {};
    let nb = 0;
    let loaded = 0;
    // tslint:disable-next-line:forin
    for (const key in imgUrls) {
      nb++;
      const image = new Image();
      image.src = imgUrls[key];
      image.onload = () => {
        loaded++;
        if (loaded === nb) {
          Object.assign(this, images);
          this.initialized = true;
          this.display();
        }
      };
      images[key] = image;
    }
  }

  /**
   * 解析处理训练数据 获得一个长度为三的数组分别代表
   * 鸟的高度
   * 下一个障碍物的高度
   */
  private generatorTrainData(): number[] {
    const pipes = this.pipes;
    const x = this.bird.x;
    const y = this.bird.y;
    let nextHoll = pipes[0];
    for (let i = 0; i < pipes.length; i += 2) {
      if (pipes[i].x + pipes[i].width > x) {
        nextHoll = pipes[i];
        break;
      }
    }

    return [y / this.height, nextHoll.height / this.height, x / (nextHoll.x + nextHoll.width) ];
  }
}




