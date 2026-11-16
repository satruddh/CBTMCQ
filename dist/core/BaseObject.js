"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.List = exports.BaseObject = void 0;
/**
 * Base abstract class providing foundational structure for all domain objects.
 * Strict rules:
 * - Zero 'any' types.
 * - Zero 'undefined' values.
 * - Primitives default to minimum values (0, "", false).
 * - Non-primitives instantiated via class constructors.
 */
class BaseObject {
    _isNullObject = false;
    isNull() {
        return this._isNullObject;
    }
    setNull(isNull) {
        this._isNullObject = isNull;
    }
}
exports.BaseObject = BaseObject;
/**
 * Typed List collection class replacing raw array literal '[]' instantiation.
 */
class List extends BaseObject {
    _items;
    constructor(initialItems) {
        super();
        // Instantiated using class constructor, never literal '[]'
        this._items = initialItems ? initialItems : new Array();
    }
    static empty() {
        const emptyList = new List();
        return emptyList;
    }
    add(item) {
        this._items.push(item);
    }
    get(index) {
        if (index >= 0 && index < this._items.length) {
            const item = this._items[index];
            return item !== undefined ? item : null;
        }
        return null;
    }
    size() {
        return this._items.length;
    }
    isEmpty() {
        return this._items.length === 0;
    }
    equals(other) {
        if (this.size() !== other.size()) {
            return false;
        }
        for (let i = 0; i < this._items.length; i++) {
            const thisItem = this.get(i);
            const otherItem = other.get(i);
            if (thisItem === null || otherItem === null) {
                if (thisItem !== otherItem)
                    return false;
            }
            else if (!thisItem.equals(otherItem)) {
                return false;
            }
        }
        return true;
    }
    toString() {
        const elements = new Array();
        for (let i = 0; i < this._items.length; i++) {
            const item = this.get(i);
            if (item !== null) {
                elements.push(item.toString());
            }
        }
        return "List[" + elements.join(", ") + "]";
    }
    toArray() {
        return this._items;
    }
}
exports.List = List;
