export enum Direction {
  LEFT = 37,
  UP = 38,
  RIGHT = 39,
  DOWN = 40
}

export enum StringDirection {
  LEFT = 'left',
  UP = 'up',
  RIGHT = 'right',
  DOWN = 'down'
}

export enum Reverse {
  LEFT = Direction.RIGHT,
  RIGHT = Direction.LEFT,
  UP =  Direction.DOWN,
  DOWN = Direction.UP
}

export function directiontoString (direction: Direction): string {
  if (direction === Direction.LEFT) {
    return 'left';
  } else if (direction === Direction.RIGHT) {
    return 'right';
  } else if (direction === Direction.UP) {
    return 'up';
  } else {
    return 'down';
  }
}