import { Core, core } from './Core';
import { Configuration, defaultConfiguration } from './types/Configuration';
import { Direction, directiontoString, StringDirection } from './types/Direction';
import { Section } from './types/Section';

export class SpatialNavigation {
  private static instance: SpatialNavigation;
  
  private _ready: boolean = false;
  private _idPool: number = 0;
  private _sections:  { [key: string]: Section; } = {};
  private _sectionCount: number = 0;
  private _defaultSectionId: string = '';
  private _lastSectionId: string = '';
  private _duringFocusChange: boolean = false;
  private globalConfiguration: Configuration = defaultConfiguration;
  private _pause: boolean = false;
  private core: Core = core;
  private readonly ID_POOL_PREFIX = 'section-'
  private readonly EVENT_PREFIX = 'sn:';

  private constructor () {}

  public static getInstance (): SpatialNavigation {
    if (!SpatialNavigation.instance) {
      SpatialNavigation.instance = new SpatialNavigation();
    }
    return SpatialNavigation.instance;
  }

  // #region PUBLIC FUNCTIONS

  /**
   * Init listeners
   */
  public init (): void{
    if (!this._ready) {
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);
      window.addEventListener('focus', this.onFocus, true);
      window.addEventListener('blur', this.onBlur, true);
      // document.body.addEventListener('click', onBodyClick);
      this._ready = true;
    }
  }

  /**
   * Remove listeners and reinitialize SpatialNavigation attributes.
   */
  public uninit (): void {
    window.removeEventListener('blur', this.onBlur, true);
    window.removeEventListener('focus', this.onFocus, true);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('keydown', this.onKeyDown);
    // document.body.removeEventListener('click', onBodyClick);
    this.clear();
    this._idPool = 0;
    this._ready = false;
  }

  /**
   * Clear attributes values.
   */
  public clear (): void {
    this._sections = {};
    this._sectionCount = 0;
    this._defaultSectionId = '';
    this._lastSectionId = '';
    this._duringFocusChange = false;
  }

  /**
   * Reset a lastFocusedElement and previous element of a section.
   * @param sectionId - section to reset
   */
  public reset (sectionId: string): void {
    if (sectionId) {
      this._sections[sectionId].lastFocusedElement = undefined;
      this._sections[sectionId].previous = undefined;
    } else {
      for (const id in this._sections) {
        const section = this._sections[id];
        section.lastFocusedElement = undefined;
        section.previous = undefined;
      }
    }
  }

  /**
   * Set the configuration of a section or set the global configuration
   * @param sectionId - section to configure, undefined to set the global configuration.
   * @param config - configuration
   */
  public set (sectionId: string, config: Configuration): boolean | never {
    if (!this._sections[sectionId]) {
      throw new Error('Section "' + sectionId + '" doesn\'t exist!');
    }
    if (sectionId !== undefined) {
      this._sections[sectionId].configuration = config;
    } else {
      this.globalConfiguration = config;
    }
    return true;
  }

  /**
   * Add a section
   * @param sectionId - section id to give
   * @param config - configuration of the section
   * @returns sectionId
   */
  public add (sectionId: string | undefined, config: Configuration): string | never {
    if (!sectionId) {
      sectionId = this.generateId();
    }
    if (this._sections[sectionId]) {
      throw new Error('Section "' + sectionId + '" already exist!');
    }
    
    if (this.set(sectionId, config)) {
      this._sectionCount++;
    }
    return sectionId;
  }

  /**
   * Remove a section
   * @param sectionId id of the section to remove
   * @returns true if section has been removed, false otherwise
   */
  public remove (sectionId: string): boolean {
    if (this._sections[sectionId]) {
      if (delete this._sections[sectionId]) {
        this._sectionCount--;
      } 
      if (this._lastSectionId === sectionId) {
        this._lastSectionId = '';
      }
      return true;
    }
    return false;
  }

  /**
   * Disable navigation on a section
   * @param sectionId - id of the section to disable
   * @returns true if section has been disabled, false otherwise
   */
  public disable (sectionId: string): boolean {
    if (this._sections[sectionId]) {
      this._sections[sectionId].disabled = true;
      return true;
    }
    return false;
  }

  /**
   * Enable navigation on a section
   * @param sectionId - id of the section to enable
   * @returns true if section has been enabled, false otherwise
   */
  public enable (sectionId: string): boolean {
    if (this._sections[sectionId]) {
      this._sections[sectionId].disabled = false;
      return true;
    }
    return false;
  }

  /**
   * Pause navigation
   */
  public pause (): void {
    this._pause = true;
  }

  /**
   * Resume navigation
   */
  public resume (): void {
    this._pause = false;
  }

  /**
   * Focus an element
   * @param element element to focus (section id or selector), (an element or a section)
   * @param silent ?
   * @param direction incoming direction
   * @returns true if element has been focused, false otherwise
   */
  public focus (element: string | undefined, silent: boolean, direction: Direction): boolean {
    let result = false;
    let autoPause = !this._pause && silent;
    if (autoPause) this.pause();

    // TO DO - add focusExtendedSelector and focusElement ???
    if (this.isSection(element)) {
      result = this.focusSection(element);
    } else {
      result = this.focusExtendedSelector(element, direction);
    }

    if (autoPause) this.resume();
    return result;
  }

  /**
   * Move to another element
   */
  public move (direction: Direction, selector: string | undefined): boolean {
    let element: HTMLElement | undefined = undefined;
    if (selector) {
      const elements =  this.core.parseSelector(selector);
      if (elements.length > 0) {
        element = this.core.parseSelector(selector)[0] as HTMLElement;
      }
    } else {
      element = this.getCurrentFocusedElement();
    }

    if (!element) {
      return false;
    }

    const sectionId = this.getSectionId(element);
    if (!sectionId) {
      return false;
    }

    const willmoveProperties = {
      direction: direction,
      sectionId: sectionId,
      cause: 'api'
    };

    if (!this.fireEvent(element, 'willmove', willmoveProperties, undefined)) {
      return false;
    }
    return this.focusNext(direction, element, sectionId);
  }

  /**
   * Make a section focusable (more precisely, all its focusable children are made focusable)
   * @param sectionId id of the section to make focusable, undefined if you want to make all sections focusable
   */
  public makeFocusable (sectionId: string | undefined): void | never {
    if (sectionId) {
      if (this._sections[sectionId]) {
        this.doMakeFocusable(this._sections[sectionId].configuration);
      } else {
        throw new Error('Section "' + sectionId + '" doesn\'t exist!');
      }
    } else {
      // make focusable all sections (init ?)
      for (const id in this._sections) {
        this.doMakeFocusable(this._sections[id].configuration);
      }
    }
  }

  /**
   * Set the default section
   * @param sectionId id of the section to set as default
   */
  public setDefaultSection (sectionId: string): void | never {
    if (this._sections[sectionId] !== undefined) {
      this._defaultSectionId = sectionId;
    } else {
      throw new Error('Section "' + sectionId + '" doesn\'t exist!');
    }
  }

  // #endregion


  // #region PRIVATE FUNCTIONS

  /**
   * Generate a unique id for a section
   * @returns new id section
   */
  private generateId (): string {
    let id: string;
    while(true) {
      id = this.ID_POOL_PREFIX + String(++this._idPool);
      if (!this._sections[id]) {
        break;
      }
    }
    return id;
  }

  private getCurrentFocusedElement (): HTMLElement | undefined{
    const activeElement = document.activeElement;
    if (activeElement && activeElement !== document.body) {
      return activeElement as HTMLElement;
    }
  }

  private extend(out: any) {
    out = out || {};
    for (var i = 1; i < arguments.length; i++) {
      if (!arguments[i]) {
        continue;
      }
      for (var key in arguments[i]) {
        if (arguments[i].hasOwnProperty(key) &&
            arguments[i][key] !== undefined) {
          out[key] = arguments[i][key];
        }
      }
    }
    return out;
  }

  private exclude(elemList: any, excludedElem: any[]) {
    if (!Array.isArray(excludedElem)) {
      excludedElem = [excludedElem];
    }
    for (var i = 0, index; i < excludedElem.length; i++) {
      index = elemList.indexOf(excludedElem[i]);
      if (index >= 0) {
        elemList.splice(index, 1);
      }
    }
    return elemList;
  }

  /**
   * Check if an element is navigable
   * @param elem element to check
   * @param sectionId id of the element's section
   * @param verifySectionSelector if true, check the section selector
   * @returns true if element is navigable, false otherwise
   */
  private isNavigable (elem: HTMLElement, sectionId: string, verifySectionSelector: boolean): boolean {
    if (!elem || !sectionId ||
      !this._sections[sectionId] || this._sections[sectionId].disabled) {
      return false;
    }
    if ((elem.offsetWidth <= 0 && elem.offsetHeight <= 0) ||
        elem.hasAttribute('disabled')) {
      return false;
    }
    if (verifySectionSelector && !this.core.matchSelector(elem, this._sections[sectionId].configuration.selector)) {
      return false;
    }
    if (this._sections[sectionId].configuration.navigableFilter !== null) {
      if (this._sections[sectionId].configuration.navigableFilter!(elem, sectionId) === false) {
        return false;
      }
    } else if (this.globalConfiguration.navigableFilter !== null) {
      if (this.globalConfiguration.navigableFilter(elem, sectionId) === false) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get the element's section id
   * @param element element
   * @returns the element's section id
   */
  private getSectionId (element: HTMLElement): string | undefined {
    for (const id in this._sections) {
      if (!this._sections[id].disabled &&
          this.core.matchSelector(element, this._sections[id].configuration.selector)) {
        return id;
      }
    }
  }

  /**
   * Get navigable elements into a section
   * @param sectionId id of the section
   */
  private getSectionNavigableElements (sectionId: string): never[] {
    return this.core.parseSelector(this._sections[sectionId].configuration.selector).filter(element => {
      return this.isNavigable(element, sectionId, false);
    });
  }

  /**
   * Get the default element of a section
   * @param sectionId id of the section
   * @returns the default element of a section, null if no default element found
   */
  private getSectionDefaultElement (sectionId: string): HTMLElement | null {
    const defaultElement = this._sections[sectionId].configuration.defaultElement;
    if (!defaultElement) {
      return null;
    }
    const elements = this.core.parseSelector(defaultElement);
    // check each element to see if it's navigable and stop when one has been found
    for (const element of elements) {
      if (this.isNavigable(element, sectionId, true)) {
        return element as HTMLElement;
      }
    }
    return null;
  }

  /**
   * Get the last focused element into a section
   * @param sectionId id of the section
   * @returns the last focused element, null if no element found
   */
  private getSectionLastFocusedElement (sectionId: any): HTMLElement | null {
    const lastFocusedElement = this._sections[sectionId].lastFocusedElement;
    if (lastFocusedElement) {
      if (!this.isNavigable(lastFocusedElement, sectionId, true)) {
        return null;
      }
      return lastFocusedElement;
    } else {
      return null;
    }
  }

  /**
   * fire an event
   * @param element element source
   * @param type type of event
   * @param details ?
   * @param cancelable true if cancelable, false otherwise 
   * @returns true if event has been successfully dispatched
   */
  private fireEvent (element: HTMLElement, type: string, details: any, cancelable?: boolean): boolean {
    if (arguments.length < 4) {
      cancelable = true;
    }
    const evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(this.EVENT_PREFIX + type, true, cancelable, details);
    return element.dispatchEvent(evt);
  }

  /**
   * focus and scroll on element
   * @param element element
   */
  private focusNScroll (element: HTMLElement, sectionId: string): void {
    if (this._sections[sectionId].configuration.scrollOptions !== undefined && this._sections[sectionId].configuration.scrollOptions !== '') {
      element.focus({ preventScroll: true });
      element.scrollIntoView(this._sections[sectionId].configuration.scrollOptions);
    } else if (this.globalConfiguration.scrollOptions !== undefined && this.globalConfiguration.scrollOptions !== '') {
      element.focus({ preventScroll: true });
      element.scrollIntoView(this.globalConfiguration.scrollOptions);
    } else {
      element.focus();
    }
  }


  /**
   * 
   * @param elem 
   * @param sectionId 
   */
  private focusChanged (element: HTMLElement, sectionId: string) {
    let id: string | undefined = sectionId;
    if (!id) {
      id = this.getSectionId(element);
    }
    if (id) {
      this._sections[sectionId].lastFocusedElement = element;
      this._lastSectionId = sectionId;
    }
  }

  private silentFocus (element: HTMLElement, sectionId: string) {
    const currentFocusedElement: HTMLElement | undefined = this.getCurrentFocusedElement();
    if (currentFocusedElement) {
      currentFocusedElement.blur();
    }
    this.focusNScroll(element, sectionId);
    this.focusChanged(element, sectionId);
  }


  /**
   * Focus an element
   * @param elem element to focus
   * @param sectionId id of the element's section
   * @param direction source direction
   */
  private focusElement (element: HTMLElement, sectionId: string, direction: Direction) {
    if (!element) {
      return false;
    }
    const currentFocusedElement: HTMLElement | undefined = this.getCurrentFocusedElement();

    if (this._duringFocusChange) {
      this.silentFocus(element, sectionId);
      return true;
    }

    this._duringFocusChange = true;

    if (this._pause) {
      this.silentFocus(element, sectionId);
      this._duringFocusChange = false;
      return true;
    }

    if (currentFocusedElement) {
      const unfocusProperties = {
        nextElement: element,
        nextSectionId: sectionId,
        direction: direction,
        native: false
      };
      if (!this.fireEvent(currentFocusedElement, 'willunfocus', unfocusProperties, undefined)) {
        this._duringFocusChange = false;
        return false;
      }
      currentFocusedElement.blur();
      this.fireEvent(currentFocusedElement, 'unfocused', unfocusProperties, false);
    }

    const focusProperties = {
      previousElement: currentFocusedElement,
      sectionId: sectionId,
      direction: direction,
      native: false
    };
    if (!this.fireEvent(element, 'willfocus', focusProperties)) {
      this._duringFocusChange = false;
      return false;
    }
    this.focusNScroll(element, sectionId);
    this.fireEvent(element, 'focused', focusProperties, false);

    this._duringFocusChange = false;

    this.focusChanged(element, sectionId);
    return true;
  }
  

  private focusExtendedSelector (selector: string, direction: Direction): boolean {
    if (selector.charAt(0) == '@') {
      if (selector.length == 1) {
        return this.focusSection(undefined, direction);
      } else {
        const sectionId = selector.substr(1);
        return this.focusSection(sectionId, direction);
      }
    } else {
      var next = this.core.parseSelector(selector)[0];
      if (next) {
        const nextSectionId = this.getSectionId(next);
        if (nextSectionId) {
          if (this.isNavigable(next, nextSectionId, false)) {
            return this.focusElement(next, nextSectionId, direction);
          }
        } else {
          return false;
        }
      }
    }
    return false;
  }

  private addRange (id: string, range: string []) {
    if (id && range.indexOf(id) < 0 &&
          this._sections[id] && !this._sections[id].disabled) {
        range.push(id);
      }
  }

  /**
   * Focus a section
   * @param sectionId id of the section
   * @param direction direction
   * @returns true if section has been focused
   */
  private focusSection (sectionId: string | undefined, direction: Direction): boolean {
    const range: string [] = [];

    if (sectionId) {
      this.addRange(sectionId, range);
    } else {
      this.addRange(this._defaultSectionId, range);
      this.addRange(this._lastSectionId, range);
      for (const section in this._sections) {
        this.addRange(section, range);
      }
    }

    for (var i = 0; i < range.length; i++) {
      var id = range[i];
      var next;

      if (this._sections[id].configuration.enterTo == 'last-focused') {
        next = this.getSectionLastFocusedElement(id) ||
               this.getSectionDefaultElement(id) ||
               this.getSectionNavigableElements(id)[0];
      } else {
        next = this.getSectionDefaultElement(id) ||
               this.getSectionLastFocusedElement(id) ||
               this.getSectionNavigableElements(id)[0];
      }

      if (next) {
        return this.focusElement(next, id, direction);
      }
    }
    return false;
  }

  /**
   * Fire event when navigate has failed
   * @param element element source
   * @param direction direction source
   * @returns true if event has been successfully raised
   */
  private fireNavigateFailed (element: HTMLElement, direction: Direction) {
    return this.fireEvent(element, 'navigatefailed', {
      direction: direction
    }, false);
  }

  private goToLeaveFor (sectionId: string, direction: Direction) {
    if (this._sections[sectionId].configuration.leaveFor && (this._sections[sectionId].configuration.leaveFor as any)[directiontoString(direction)] !== undefined) {
      const next = (this._sections[sectionId].configuration.leaveFor as any)[directiontoString(direction)];
      if (next === '') {
        return null;
      }
      return this.focusExtendedSelector(next, direction);
    }
    return false;
  }


  /**
   * Focus next element
   * @param direction source direction
   * @param currentFocusedElement current focused element
   * @param currentSectionId current section id
   * @returns true if next has been focused successfully
   */
  private focusNext (direction: Direction, currentFocusedElement: HTMLElement, currentSectionId: string): boolean {
      const extSelector = currentFocusedElement.getAttribute('data-sn-' + direction);
    if (typeof extSelector === 'string') {
      if (extSelector === '' ||
          !focusExtendedSelector(extSelector, direction)) {
        fireNavigatefailed(currentFocusedElement, direction);
        return false;
      }
      return true;
    }

    var sectionNavigableElements = {};
    var allNavigableElements = [];
    for (var id in _sections) {
      sectionNavigableElements[id] = getSectionNavigableElements(id);
      allNavigableElements =
        allNavigableElements.concat(sectionNavigableElements[id]);
    }

    var config = extend({}, GlobalConfig, _sections[currentSectionId]);
    var next;

    if (config.restrict == 'self-only' || config.restrict == 'self-first') {
      var currentSectionNavigableElements =
        sectionNavigableElements[currentSectionId];

      next = navigate(
        currentFocusedElement,
        direction,
        exclude(currentSectionNavigableElements, currentFocusedElement),
        config
      );

      if (!next && config.restrict == 'self-first') {
        next = navigate(
          currentFocusedElement,
          direction,
          exclude(allNavigableElements, currentSectionNavigableElements),
          config
        );
      }
    } else {
      next = navigate(
        currentFocusedElement,
        direction,
        exclude(allNavigableElements, currentFocusedElement),
        config
      );
    }

    if (next) {
      _sections[currentSectionId].previous = {
        target: currentFocusedElement,
        destination: next,
        reverse: REVERSE[direction]
      };

      var nextSectionId = getSectionId(next);

      if (currentSectionId != nextSectionId) {
        var result = gotoLeaveFor(currentSectionId, direction);
        if (result) {
          return true;
        } else if (result === null) {
          fireNavigatefailed(currentFocusedElement, direction);
          return false;
        }

        var enterToElement;
        switch (_sections[nextSectionId].enterTo) {
          case 'last-focused':
            enterToElement = getSectionLastFocusedElement(nextSectionId) ||
                             getSectionDefaultElement(nextSectionId);
            break;
          case 'default-element':
            enterToElement = getSectionDefaultElement(nextSectionId);
            break;
        }
        if (enterToElement) {
          next = enterToElement;
        }
      }

      return focusElement(next, nextSectionId, direction);
    } else if (gotoLeaveFor(currentSectionId, direction)) {
      return true;
    }

    fireNavigatefailed(currentFocusedElement, direction);
    return false;
  }

  private onKeyDown () {

  }

  private onKeyUp () {

  }

  private onFocus (evt) {

  }

  private onBlur (evt) {

  }

  private isSection (sectionId: string | undefined) {
    return sectionId in this._sections;
  }
  // TO REMOVE ???
  private onBodyClick () {

  }



  /**
   * Make focusable elements of a section.
   * @param configuration configuration of the section to male focusable ?
   */
  private doMakeFocusable (configuration: Configuration): void{
    let tabIndexIgnoreList: string;
    if (configuration.tabIndexIgnoreList !== undefined) {
      tabIndexIgnoreList = configuration.tabIndexIgnoreList;
    } else {
      tabIndexIgnoreList = this.globalConfiguration.tabIndexIgnoreList;
    }

    this.parseSelector(configuration.selector).forEach((element: Node) => {
      if (!this.matchSelector(element, tabIndexIgnoreList)) {
        const htmlElement = element as HTMLElement;
        if (!htmlElement.getAttribute('tabindex')) {
          htmlElement.setAttribute('tabindex', '-1'); // set the tabindex with a negative value. https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex
        }
      }
    });
  }






  // #endregion


}