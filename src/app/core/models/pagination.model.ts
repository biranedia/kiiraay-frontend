// Reponse paginee generique renvoyee par le backend (PageResponse)
export interface PageResponse<T> {
  contenu: T[];
  page: number;
  taille: number;
  totalElements: number;
  totalPages: number;
}
