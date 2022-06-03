
/**
 * Configuration interface, allows to configure Spatial Navigation behavior in a global or restricted way.
 */
interface Configuration {
  selector?: string,
  straightOnly?: boolean,
  straightOverlapThreshold?: number,
  rememberSource?: boolean,
  disabled?: boolean,
  defaultElement?: string,
  enterTo?: string, // '', 'last-focused', 'default-element'
  leaveFor?: {
    left: string,
    right: string,
    down: string,
    up: string
  }
  restrict?: string, // 'self-first', 'self-only', 'none'
  tabIndexIgnoreList?: string,
  navigableFilter?: null | Function,
  scrollOptions?: ScrollIntoViewOptions
}

const defaultConfiguration: Configuration = {
  selector: '[data-focusable=true]',
  straightOnly: false,
  straightOverlapThreshold: 0.5,
  rememberSource: false,
  disabled: false,
  defaultElement: '',
  enterTo: '',
  leaveFor: {
    left : '',
    right: '',
    down: '',
    up: ''
  },
  restrict: 'self-first', 
  tabIndexIgnoreList: 'a, input, select, textarea, button, iframe, [contentEditable=true]',
  navigableFilter: null,
  scrollOptions: {
    behavior: undefined,
    block: undefined,
    inline: undefined
  }
};

export { Configuration, defaultConfiguration }