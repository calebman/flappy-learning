import { StoreType, StoreItem } from './IStore';
import { CacheStore } from './CacheStore';

/**
 * 基于内存的仓库
 */
export class MemmoryStore<T extends StoreItem> extends CacheStore<T> {
  constructor(name: string, options: any) {
    super(name, StoreType.Memmory, options);
  }

  protected loadStorageData(): any[] {
    return this.caches;
  }

  protected saveStorageData(items: any[]): void {
    // do nonthing
  }
}
