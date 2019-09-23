/**
 * 持久化存储类型
 * Memmory 内存
 * LocalStorage 浏览器持久化
 * SessionStorage 浏览器选项页持久化
 * IndexedDB 浏览器数据库
 */
export enum StoreType { Memmory, LocalStorage, SessionStorage, IndexedDB }

/**
 * 持久化单元
 */
export class StoreItem {
  /**
   * 唯一主键
   * 如果没有定义需要依赖存储引擎来生成一个主键
   */
  private id: string | number | undefined;

  /**
   * 获取主键
   */
  public getId(): string | number | undefined {
    return this.id;
  }

  /**
   * 设置主键
   * @param id 主键
   */
  public setId(id: string | number): void {
    this.id = id;
  }

  /**
   * 更新
   * @param data 更新数据
   */
  public update(data: object): void {
    const id = this.getId();
    Object.assign(this, data);
    if (id !== undefined && id !== null) {
      this.setId(id);
    }
  }
}

/**
 * 持久化存储接口
 */
export interface IStore<T extends StoreItem> {

  /**
   * 持久化存储名称 只读
   */
  readonly name: string;

  /**
   * 持久化类型 只读
   */
  readonly type: StoreType;

  /**
   * 对象解析函数 将数据反解析成为对象
   */
  readonly parse: (data: any) => T;

  /**
   * 保存
   * @param item 持久化单元
   */
  save(item: T): T;

  /**
   * 更新
   * @param item 持久化单元
   */
  update(item: T): T;

  /**
   * 删除
   * @param item 持久化单元
   */
  remove(item: T): void;

  /**
   * 根据主键删除
   * @param id 唯一主键
   */
  removeById(id: string | number): void;

  /**
   * 根据主键查询
   * @param id 唯一主键
   */
  findById(id: string | number): T;

  /**
   * 获取第一项
   */
  findFirst(): T | null;

  /**
   * 获取最后一项
   */
  findLast(): T | null;

  /**
   * 获取所有的持久化数据
   */
  findAll(): T[];

  /**
   * 获取数据长度
   */
  size(): number;

  /**
   * 清空
   */
  clear(): void;
}
