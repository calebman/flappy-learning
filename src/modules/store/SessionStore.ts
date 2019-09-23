import { StoreType, StoreItem } from './IStore';
import { CacheStore } from './CacheStore';

/**
 * 基于 SessionStorage 的仓库
 */
export class SessionStore<T extends StoreItem> extends CacheStore<T> {

  constructor(name: string, options: any) {
    super(name, StoreType.LocalStorage, Object.assign({
      lazy: true,
    }, options));
  }

  protected loadStorageData(): any[] {
    const str = sessionStorage.getItem(this.name);
    if (str) {
      const arr = JSON.parse(str);
      return Array.isArray(arr) ? arr : [];
    }
    return [];
  }

  protected saveStorageData(items: any[]): void {
    if (items && items.length > 0) {
      sessionStorage.setItem(this.name, JSON.stringify(items));
    } else {
      sessionStorage.removeItem(this.name);
    }
  }
}
