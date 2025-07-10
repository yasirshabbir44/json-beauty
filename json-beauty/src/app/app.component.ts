import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'JSON Beauty';
  currentYear: number = new Date().getFullYear();

  ngOnInit(): void {
    // Any initialization logic can go here
  }
}
