import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DateComponent } from './date/date.component';
import { FormsModule } from '@angular/forms';
// import { DateValidationDirective } from './directives/date-validation.directive copy';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DateValidationDirective } from './directives/version4';
// import {MatTooltipModule} from '@angular/material/tooltip';

@NgModule({
  declarations: [
    AppComponent,
    DateComponent,
    DateValidationDirective
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    // MatTooltipModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
