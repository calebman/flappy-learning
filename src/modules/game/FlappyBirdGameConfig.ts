/**
 * FlappyBird游戏配置
 */
export default class FlappyBirdGameConfig {
  public width: number = 500;
  public height: number = 512;
  public spawnInterval: number = 90;
  public backgroundSpeed: number = 0.5;
  public fps: number = 60;
  public birdImgUrl: string = './img/bird.png';
  public backgroundImgUrl: string = './img/background.png';
  public pipetopImgUrl: string = './img/pipetop.png';
  public pipebottomImgUrl: string = './img/pipebottom.png';
}
