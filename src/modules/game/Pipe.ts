/**
 * 障碍物
 */
export default class Pipe {
  public x: number = 0;
  public y: number = 0;
  public width: number = 50;
  public height: number = 40;
  public speed: number = 3;

  public constructor(options: any) {
    Object.assign(this, options);
  }

  /**
   * 更新位置
   */
  public update(): void {
    this.x -= this.speed;
  }

  /**
   * 是否溢出地图
   */
  public isOut(): boolean {
    return this.x + this.width < 0;
  }
}
