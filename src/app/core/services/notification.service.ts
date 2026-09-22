import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationAlerte } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);

  obtenirNotifications(): Observable<NotificationAlerte[]> {
    return this.http.get<NotificationAlerte[]>(`${environment.apiUrl}/notifications`);
  }
}
