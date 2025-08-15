import { Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

/**
 * Directive for debouncing input events
 * This directive adds debouncing to input, textarea, and select elements
 * to improve performance by reducing the number of event handler calls
 * 
 * Usage:
 * <input [appDebounceInput]="500" (debounceInput)="handleInput($event)">
 */
@Directive({
  selector: '[appDebounceInput]'
})
export class DebounceInputDirective implements OnInit, OnDestroy {
  @Input('appDebounceInput') debounceTime: number = 300;
  @Output() debounceInput = new EventEmitter<Event>();
  
  private destroy$ = new Subject<void>();
  private inputEvent$ = new Subject<Event>();
  
  constructor(private elementRef: ElementRef) { }
  
  ngOnInit(): void {
    // Get the native element
    const element = this.elementRef.nativeElement;
    
    // Listen for input events
    fromEvent<Event>(element, 'input')
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(event => {
        this.inputEvent$.next(event);
      });
    
    // Set up debouncing
    this.inputEvent$
      .pipe(
        debounceTime(this.debounceTime),
        distinctUntilChanged((prev, curr) => {
          // For input elements, compare values
          if (prev instanceof InputEvent && curr instanceof InputEvent) {
            const prevValue = (prev.target as HTMLInputElement).value;
            const currValue = (curr.target as HTMLInputElement).value;
            return prevValue === currValue;
          }
          return false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(event => {
        this.debounceInput.emit(event);
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}