export interface Rectangle {
  x: number,
  y: number,
  left: number,
  top: number,
  right: number,
  bottom: number,
  width: number,
  height: number
}

export interface ElementRectangle extends Rectangle {
  element: HTMLElement

  center: Rectangle
}

export class ElementRectangleImpl implements ElementRectangle {
  x: number;
  y: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
  element: HTMLElement;
  center: Rectangle;
  width: number;
  height: number;
  
  constructor (rectangle: ElementRectangle) {
    this.x = rectangle.x;
    this.y = rectangle.y;
    this.left = rectangle.left;
    this.right = rectangle.right;
    this.bottom = rectangle.bottom;
    this.top = rectangle.top;
    this.element = rectangle.element;
    this.width = rectangle.width;
    this.height = rectangle.height;
    this.center = rectangle.center;
  }

  public nearPlumbLineIsBetter (targetRect: ElementRectangle): number {
    let distance: number;
    if (this.center.x < targetRect.center.x) {
      distance = targetRect.center.x - this.right;
    } else {
      distance = this.left - targetRect.center.x;
    }
    return distance < 0 ? 0 : distance;
  }

  public nearHorizonIsBetter (targetRect: ElementRectangle): number {
    let distance: number;
    if (this.center.y < targetRect.center.y) {
      distance = targetRect.center.y - this.bottom;
    } else {
      distance = this.top - targetRect.center.y;
    }
    return distance < 0 ? 0 : distance;
  }

  public nearTargetLeftIsBetter (targetRect: ElementRectangle): number {
    let distance: number;
    if (this.center.x < targetRect.center.x) {
      distance = targetRect.left - this.right;
    } else {
      distance = this.left - targetRect.left;
    }
    return distance < 0 ? 0 : distance;
  }

  public nearTargetTopIsBetter (targetRect: ElementRectangle): number {
    let distance: number;
    if (this.center.y < targetRect.center.y) {
      distance = targetRect.top - this.bottom;
    } else {
      distance = this.top - targetRect.top;
    }
    return distance < 0 ? 0 : distance;
  }

  public topIsBetter (): number {
    return this.top;
  }

  public bottomIsBetter (): number {
    return -1 * this.bottom;
  }

  public leftIsBetter (): number {
    return this.left;
  }

  public rightIsBetter (): number {
    return -1 * this.right;
  }
}