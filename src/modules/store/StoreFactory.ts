import { IStore, StoreType, StoreItem } from './IStore';
import { MemmoryStore } from './MemmoryStore';
import { LocalStore } from './LocalStore';
import { SessionStore } from './SessionStore';

/**
 * 仓库工厂
 */
export default class StoreFactory {

  /**
   * 仓库列表
   */
  public static storeCaches: Array<IStore<any>> = [];

  /**
   * 创建一个缓存数据仓库
   * @param name 名字
   */
  public static createMemmoryStore<U extends StoreItem>(name: string): IStore<U> {
    return StoreFactory.loadStore(name, StoreType.Memmory, {});
  }

  /**
   * loadStore 方法的别名
   */
  public static createStore<U extends StoreItem>(name: string, type: StoreType, options: any): IStore<U> {
    return StoreFactory.loadStore(name, type, options);
  }

  /**
   * 加载一个仓库
   * @param name 仓库名称
   * @param type 仓库类型
   */
  public static loadStore<U extends StoreItem>(name: string, type: StoreType, options: any): IStore<U> {
    let store = StoreFactory.storeCaches.find((o) => (o.name === name && o.type === type));
    if (store) {
      return store;
    }
    switch (type) {
      case StoreType.Memmory:
        store = new MemmoryStore<U>(name, options);
        break;
      case StoreType.LocalStorage:
        store = new LocalStore<U>(name, options);
        break;
      case StoreType.SessionStorage:
        store = new SessionStore<U>(name, options);
        break;
      default:
        throw new Error(`Store not support type:${type}, see spports ${JSON.stringify(StoreType)}`);
    }
    StoreFactory.storeCaches.push(store);
    return store;
  }
}
