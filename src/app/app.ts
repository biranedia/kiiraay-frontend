import { Component } from '@angular/core';
import { ConfirmationHoteComponent } from './shared/confirmation/confirmation-hote.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmationHoteComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
