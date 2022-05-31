import { Section } from './types/Section';

export class SpatialNavigation {
  private static instance: SpatialNavigation;
  
  private _ready: boolean = false;
  private _idPool: number = 0;
  private _sections: Object = {}
  private _sectionCount: number = 0;
  private _defaultSectionId: string = '';
  private _lastSectionId: string = '';
  private _duringFocusChange: boolean = false;

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

  public clear (): void {
    this._sections = [];
    this._sectionCount = 0;
    this._defaultSectionId = '';
    this._lastSectionId = '';
    this._duringFocusChange = false;
  }

  public reset (sectionId: string): void {
    if (sectionId) {
      this._sections[sectionId].lastFocusedElement = null;
      this._sections[sectionId].previous = null;
    } else {
      for (const id in _sections) {
        const section = _sections[id];
        section.lastFocusedElement = null;
        section.previous = null;
      }
    }
  }

  public set (): void {

  }

  public add (): void {

  }

  public remove (): void {

  }

  public disable (): void {

  }

  public enable (): void {
    
  }

  public pause (): void {

  }

  public resume (): void {

  }

  public focus (): void {

  }

  public move (): void {

  }

  public makeFocusable (): void {

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


  private generateId () {

  }

  private parseSelector (selector) {

  }

  private matchSelector (element, selector) {

  }

  private getCurrentFocusedElement () {

  }

  private extend (out) {

  }

  private exclude (elemList, excludedeElem) {

  }

  private isNavigable (elem, sectionId, verifySectionSelector) {

  }

  private getSectionId (elem) {

  }

  private getSectionNavigableElements (sectionId) {

  }

  private getSectionDefaultElement (sectionId) {

  }

  private getSectionLastFocusedElement (sectionId) {

  }

  private fireEvent (elemn, type, details, cancelable) {

  }

  private focusElement (elem, sectionId, direction) {

  }

  private focusChanged (elem, sectionId) {

  }

  private focusExtendedSelector (selector, direction) {

  }

  private focusSection (sectionId) {

  }

  private fireNavigateFailed (elem, direction) {

  }

  private goToLeaveFor (sectionId, direction) {

  }

  private focusNext (direction, currentFocusedElement, currentSectionId) {

  }

  private onKeyDown () {

  }

  private onKeyUp () {

  }

  private onFocus (evt) {

  }

  private onBlur (evt) {

  }

  // TO REMOVE ???
  private onBodyClick () {

  }










  // #endregion


}