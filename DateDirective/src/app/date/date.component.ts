import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-date',
  templateUrl: './date.component.html',
  styleUrls: ['./date.component.scss']
})
export class DateComponent implements OnInit {

  @Input() date1:any;
  @Input() date2:any;

  ngOnInit() {
    // setTimeout(() => {
      
    // }, 500);
  }
  
}
