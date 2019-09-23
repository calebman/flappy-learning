import { StoreType, StoreItem, IStore } from './IStore';

/**
 * 带有缓存功能的仓库
 */
export abstract class CacheStore<T extends StoreItem> implements IStore<T> {
  public readonly name: string;
  public readonly type: StoreType;
  /**
   * 缓存对象
   */
  protected caches: T[] = [];
  private lazy: boolean = false;
  private debounceTimeout: any = null;
  public constructor(name: string, type: StoreType, options: any = {}) {
    this.name = name;
    this.type = type;
    Object.assign(this, options);
    this.syncStorageToCache();
  }
  public parse: (data: any) => T = (o) => o;
  public sequence: (obj: T) => any = (o) => o;

  public save(item: T): T {
    if (item.getId() === undefined || item.getId() === null) {
      item.setId(this.caches.length + 1);
    }
    try {
      this.findIndexById(item.getId());
      this.update(item);
    } catch (error) {
      this.caches.push(item);
    }
    this.syncCacheToStorage();
    return item;
  }

  public update(item: T): T {
    const index = this.findIndexById(item.getId());
    const saveItem = this.caches[index];
    saveItem.update(item);
    this.caches.splice(index, 1, saveItem);
    this.syncCacheToStorage();
    return saveItem;
  }

  public remove(item: T): void {
    const index = this.findIndexById(item.getId());
    this.caches.splice(index, 1);
    this.syncCacheToStorage();
  }

  public removeById(id: string | number): void {
    const index = this.findIndexById(id);
    this.caches.splice(index, 1);
    this.syncCacheToStorage();
  }

  public findById(id: string | number): T {
    const index = this.findIndexById(id);
    return this.caches[index];
  }

  public findFirst(): T | null {
    return this.caches.length > 0 ? this.caches[0] : null;
  }

  public findLast(): T | null {
    return this.caches.length > 0 ? this.caches[this.caches.length - 1] : null;
  }

  public findAll(): T[] {
    return this.caches;
  }

  public size(): number {
    return this.caches.length;
  }

  public clear(): void {
    this.caches = [];
    this.syncCacheToStorage();
  }

  /**
   * 读取持久化的数据
   */
  protected abstract loadStorageData(): any[];

  /**
   * 持久化缓存数据
   * @param items 缓存数据列表
   */
  protected abstract saveStorageData(items: any[]): void;

  /**
   * 同步持久化 -> 缓存
   */
  private syncStorageToCache(): void {
    this.caches = this.loadStorageData().map((o) => this.parse(o));
  }

  /**
   * 同步缓存 -> 持久化
   */
  private syncCacheToStorage(): void {
    const action = () => this.saveStorageData(this.caches.map((o) => this.sequence(o)));
    if (this.lazy) {
      if (this.debounceTimeout) { clearTimeout(this.debounceTimeout); }
      this.debounceTimeout = setTimeout(action, 200);
    } else {
      action();
    }
  }

  /**
   * 根据主键查询下标
   * @param id 主键
   */
  private findIndexById(id: string | number | undefined): number {
    if (id === undefined) {
      throw new Error(`CacheStore(${this.name}) can not find with id undefined`);
    }
    const index = this.caches.findIndex((o) => o.getId() === id);
    if (index < 0) {
      throw new Error(`CacheStore(${this.name}) can not found item(${id}), it is not exist`);
    }
    return index;
  }
}
