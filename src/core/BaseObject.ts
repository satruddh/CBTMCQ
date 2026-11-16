/**
 * Core interface mandated by CBTMCQ Constitution Article XI (Rule TS-005).
 * Every entity, DTO, value object, and collection must implement this contract.
 */
export interface IBaseObject<T> {
  toString(): string;
  equals(other: T): boolean;
  isEmpty(): boolean;
  isNull(): boolean;
}

/**
 * Base abstract class providing foundational structure for all domain objects.
 * Strict rules:
 * - Zero 'any' types.
 * - Zero 'undefined' values.
 * - Primitives default to minimum values (0, "", false).
 * - Non-primitives instantiated via class constructors.
 */
export abstract class BaseObject<T> implements IBaseObject<T> {
  protected _isNullObject: boolean = false;

  public abstract toString(): string;
  public abstract equals(other: T): boolean;
  public abstract isEmpty(): boolean;

  public isNull(): boolean {
    return this._isNullObject;
  }

  public setNull(isNull: boolean): void {
    this._isNullObject = isNull;
  }
}

/**
 * Typed List collection class replacing raw array literal '[]' instantiation.
 */
export class List<T extends IBaseObject<T>> extends BaseObject<List<T>> {
  private _items: Array<T>;

  constructor(initialItems?: Array<T>) {
    super();
    // Instantiated using class constructor, never literal '[]'
    this._items = initialItems ? initialItems : new Array<T>();
  }

  public static empty<T extends IBaseObject<T>>(): List<T> {
    const emptyList: List<T> = new List<T>();
    return emptyList;
  }

  public add(item: T): void {
    this._items.push(item);
  }

  public get(index: number): T | null {
    if (index >= 0 && index < this._items.length) {
      const item: T | undefined = this._items[index];
      return item !== undefined ? item : null;
    }
    return null;
  }

  public size(): number {
    return this._items.length;
  }

  public override isEmpty(): boolean {
    return this._items.length === 0;
  }

  public override equals(other: List<T>): boolean {
    if (this.size() !== other.size()) {
      return false;
    }
    for (let i: number = 0; i < this._items.length; i++) {
      const thisItem: T | null = this.get(i);
      const otherItem: T | null = other.get(i);
      if (thisItem === null || otherItem === null) {
        if (thisItem !== otherItem) return false;
      } else if (!thisItem.equals(otherItem)) {
        return false;
      }
    }
    return true;
  }

  public override toString(): string {
    const elements: Array<string> = new Array<string>();
    for (let i: number = 0; i < this._items.length; i++) {
      const item: T | null = this.get(i);
      if (item !== null) {
        elements.push(item.toString());
      }
    }
    return "List[" + elements.join(", ") + "]";
  }

  public toArray(): Array<T> {
    return this._items;
  }
}
