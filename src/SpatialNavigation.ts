import { Configuration, defaultConfiguration } from './types/Configuration';
import { Direction } from './types/Direction';
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
  public set (sectionId: string | undefined, config: Configuration): boolean | never {
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
   * @returns true if section has been removed, false if not
   */
  public remove (sectionId: string): boolean {
    if (this._sections[sectionId]) {
      if (delete this._sections[sectionId]) {
        this._sectionCount--;
      } 
      if (this._lastSectionId === sectionId) {
        this._lastSectionId = undefined;
      }
      return true;
    }
    return false;
  }

  /**
   * Disable navigation on a section
   * @param sectionId - id of the section to disable
   * @returns true if section has been disabled, false if not
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
   * @returns true if section has been enabled, false if not
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
   * @returns true if element has been focused, false if not
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
    let element: HTMLElement;
    if (selector) {
      const elements =  this.parseSelector(selector);
      if (elements.length > 0) {
        element = this.parseSelector(selector)[0] as HTMLElement;
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

  public setDefaultSection (): void {

  }




  // #endregion






  // #region PRIVATE FUNCTIONS
  
  private getRect (element) {

  }

  private partition (rects, targetRect, straightOverlapThreshold) {

  }

  private generateDistanceFunction (targetRect) {

  }  

  private prioritize () {

  }

  private navigate (target, direction, candidates, config) {

  }


  private generateId (): string {
    return ''
  }

  private parseSelector (selector): NodeList {
    return document.querySelectorAll('');
  }

  private matchSelector (element, selector): boolean {
    return false;
  }

  private getCurrentFocusedElement (): HTMLElement{
    const activeElement = document.activeElement;
    if (activeElement && activeElement !== document.body) {
      return activeElement as HTMLElement;
    }
  }

  private extend (out) {

  }

  private exclude (elemList, excludedeElem) {

  }

  private isNavigable (elem, sectionId, verifySectionSelector) {

  }

  private getSectionId (element: HTMLElement): string {
    return '';
  }

  private getSectionNavigableElements (sectionId) {

  }

  private getSectionDefaultElement (sectionId) {

  }

  private getSectionLastFocusedElement (sectionId) {

  }

  private fireEvent (elemn, type, details, cancelable): boolean {
    return false;
  }

  private focusElement (elem, sectionId, direction) {

  }

  private focusChanged (elem, sectionId) {

  }

  private focusExtendedSelector (selector: string | undefined, direction: Direction): boolean {
    return false;
  }

  private focusSection (sectionId: string | undefined): boolean{
    return false;
  }

  private fireNavigateFailed (elem, direction) {

  }

  private goToLeaveFor (sectionId, direction) {

  }

  private focusNext (direction, currentFocusedElement, currentSectionId): boolean {
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