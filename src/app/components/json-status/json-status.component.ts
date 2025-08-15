import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-json-status',
  templateUrl: './json-status.component.html',
  styleUrls: ['./json-status.component.scss']
})
export class JsonStatusComponent {
  @Input() isValidJson: boolean = true;
  @Input() jsonSize: string = '0';
  @Input() showTreeView: boolean = false;
  @Input() selectedOutputFormat: 'json' | 'yaml' = 'json';
  
  constructor() { }
}