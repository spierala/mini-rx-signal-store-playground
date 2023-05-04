import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import {AppComponent, counterReducer} from './app.component';
import {ImmutableStateExtension, ReduxDevtoolsExtension, StoreModule, UndoExtension} from "@mini-rx/signal-store";

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    StoreModule.forRoot({
      reducers: {
        count: counterReducer,
      },
      extensions: [
        new ReduxDevtoolsExtension({
          name: 'Signal Store',
        }),
        new UndoExtension(),
        new ImmutableStateExtension()
      ],
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
