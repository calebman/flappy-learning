export default class Queue<T> {

  private elements: T[];

  public constructor(capacity?: number) {
      this.elements = new Array<T>();
  }

  public push(o: T) {
    this.elements.push(o);
  }

  public pop(): T | undefined {
      if (this.elements.length > 0) {
          const o = this.elements[0];
          this.elements.splice(0, 1);
          return o;
      }
  }

  public size(): number {
      return this.elements.length;
  }

  public empty(): boolean {
      return this.size() === 0;
  }

  public clear() {
      delete this.elements;
      this.elements = new Array<T>();
  }
}
