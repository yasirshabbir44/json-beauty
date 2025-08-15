import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  @Input() copyright: string = '';
  currentYear: number = new Date().getFullYear();
  
  constructor() {}
}