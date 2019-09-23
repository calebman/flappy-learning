import { StoreItem } from '../store/IStore';

/**
 * 训练数据
 */
export default class TrainData extends StoreItem {

  public static parse(obj: any): TrainData {
    const trainData = new TrainData(obj.data);
    trainData.update(obj);
    return trainData;
  }
  public data: number[] = [];
  public constructor(data: number[] = []) {
    super();
    this.data = data;
  }
}
