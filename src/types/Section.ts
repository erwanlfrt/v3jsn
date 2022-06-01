import { Configuration } from "./Configuration";
import { Direction } from "./Direction";

export interface Section {
  id: string,
  configuration: Configuration,
  disabled: boolean,
  lastFocusedElement?: HTMLElement,
  previous?: {
    destination: HTMLElement,
    reverse: Direction,
    target: HTMLElement
  }
}