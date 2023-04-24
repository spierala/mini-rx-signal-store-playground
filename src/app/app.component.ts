import {Component, computed, effect, signal} from '@angular/core';
import {BehaviorSubject, map, tap} from "rxjs";
import {toSignal} from "@angular/core/rxjs-interop";

@Component({
  selector: 'app-root',
  template: `
    <p>Signal: {{doubleCounter()}}</p>
    <p>Observable: {{doubleCounter$ | async}}</p>
    <button (click)="inc()">Inc</button>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  // BehaviorSubject
  counterBehaviorSubject = new BehaviorSubject(1);
  doubleCounter$ = this.counterBehaviorSubject.pipe(
    map(v => v * 2),
    tap(() => console.log('RxJS piped'))
  )

  // Signal
  counterSignal = toSignal(this.counterBehaviorSubject, {requireSync: true});
  doubleCounter = computed(() => {
    const result = this.counterSignal() * 2
    console.log('Signal computed')
    return result;
  });

  inc() {
    console.log('BEFORE');

    // this.counterSignal.update(v => v + 1);
    this.counterBehaviorSubject.next(this.counterBehaviorSubject.value + 1);

    console.log('AFTER');
  }

  // Logging:
  // BEFORE
  // RxJS piped
  // AFTER
  // Signal computed
}
