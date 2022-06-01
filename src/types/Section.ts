import { Configuration } from "./Configuration";

export interface Section {
  id: string,
  lastFocusedElement: string,
  previous: string,
  configuration: Configuration,
  disabled: boolean
}