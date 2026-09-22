// Correspond a sn.kiiraay.backend.notification.dto.NotificationResponse
export interface NotificationAlerte {
  type: string;
  niveau: 'ALERTE' | 'INFO';
  message: string;
}
