/**
 * Configuration interface, allows to configure Spatial Navigation behavior in a global or restricted way.
 */
interface Configuration {
  selector: string,
  straightOnly: boolean,
  straightOverlapThreshold: number,
  rememberSource: boolean,
  disabled: boolean,
  defaultElement: string,
  enterTo: string, // '', 'last-focused', 'default-element'
  leaveFor: {
    left: string,
    right: string,
    down: string,
    up: string
  }
  restrict: string, // 'self-first', 'self-only', 'none'
  tabIndexIgnoreList: string,
  navigableFilter: any,
  scrollOptions?: { // scrollIntoViewOptions https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
    behavior: string,
    block: string,
    inline: string
  }
}

const defaultConfiguration: Configuration = {
  selector: '',
  straightOnly: false,
  straightOverlapThreshold: 0.5,
  rememberSource: false,
  disabled: false,
  defaultElement: '',
  enterTo: '',
  leaveFor: {
    left: '',
    right: '',
    down: '',
    up: ''
  },
  restrict: 'self-first', 
  tabIndexIgnoreList: 'a, input, select, textarea, button, iframe, [contentEditable=true]',
  navigableFilter: null,
  scrollOptions: {
    behavior: '',
    block: '',
    inline: ''
  }
};

export { Configuration, defaultConfiguration }