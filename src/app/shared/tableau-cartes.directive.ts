import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core';

// Sur telephone, styles.scss affiche chaque ligne d'un tableau ".tableau" comme une carte
// (libelle : valeur). Cette directive recopie le titre de chaque colonne (<th>) dans
// l'attribut data-label de chaque cellule (<td>), et le maintient a jour quand les lignes
// changent (pagination, filtres...). Aucun libelle a dupliquer dans les templates.
@Directive({
  selector: 'table.tableau',
  standalone: true
})
export class TableauCartesDirective implements AfterViewInit, OnDestroy {
  private readonly tableau = inject(ElementRef<HTMLTableElement>).nativeElement as HTMLTableElement;
  private observateur?: MutationObserver;

  ngAfterViewInit(): void {
    this.etiqueter();
    this.observateur = new MutationObserver(() => this.etiqueter());
    this.observateur.observe(this.tableau, { childList: true, subtree: true });
  }

  private etiqueter(): void {
    const titres = Array.from(this.tableau.querySelectorAll('thead th')).map((th) => th.textContent?.trim() ?? '');
    this.tableau.querySelectorAll('tbody tr').forEach((ligne) => {
      Array.from(ligne.children).forEach((cellule, index) => {
        const titre = titres[index] ?? '';
        if (cellule.getAttribute('data-label') !== titre) {
          cellule.setAttribute('data-label', titre);
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.observateur?.disconnect();
  }
}
