import { Injectable, inject } from '@angular/core';
import { firstValueFrom, forkJoin } from 'rxjs';
import { StatistiquesService } from './statistiques.service';

// Rapport statistique PDF par niveau territorial (cahier des charges : "rapports PDF selon
// niveau territorial"). Genere dans le navigateur a partir des statistiques de l'API : ce
// sont des agregats, sans aucune donnee personnelle. Les listes nominatives restent exportees
// cote serveur (Excel/CSV), avec controle des droits et journalisation.
// jsPDF est charge a la demande pour ne pas alourdir le tableau de bord.
@Injectable({ providedIn: 'root' })
export class RapportPdfService {
  private readonly statistiquesService = inject(StatistiquesService);

  async genererRapportTerritorial(auteur: string): Promise<void> {
    const [{ jsPDF }, { default: autoTable }, donnees] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
      firstValueFrom(forkJoin({
        departement: this.statistiquesService.vueDepartementale(),
        arrondissements: this.statistiquesService.vueParArrondissements(),
        communes: this.statistiquesService.vueParCommunes(),
        localites: this.statistiquesService.vueParLocalites()
      }))
    ]);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const maintenant = new Date();
    const dateTexte = maintenant.toLocaleDateString('fr-FR') + ' ' + maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const couleurEntete: [number, number, number] = [22, 35, 63];

    // En-tete
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('KIIRAAY - Rapport statistique territorial', 14, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Genere le ${dateTexte} par ${auteur}`, 14, 24);
    doc.setTextColor(0);

    // Synthese departementale
    const d = donnees.departement;
    autoTable(doc, {
      startY: 30,
      head: [['Synthese departementale', 'Valeur']],
      body: [
        ['Arrondissements', String(d.nombreArrondissements)],
        ['Communes / villes', String(d.nombreCommunesVilles)],
        ['Localites', String(d.nombreLocalites)],
        ['Cellules (hors archivees)', String(d.nombreCellules)],
        ['Comites', `${d.nombreComites} (${d.comitesComplets} complets, ${d.comitesIncomplets} incomplets)`],
        ['Taux de remplissage moyen des comites', `${d.tauxRemplissageMoyen} %`],
        ['Membres (hors archives)', String(d.nombreMembres)],
        ['Mouvements actifs', `${d.mouvementsActifs} / ${d.nombreMouvements}`]
      ],
      headStyles: { fillColor: couleurEntete },
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 100 } }
    });

    const repartition = (titre: string, valeurs: Record<string, number>) => {
      const lignes = Object.entries(valeurs).map(([statut, nombre]) => [statut, String(nombre)]);
      autoTable(doc, {
        startY: this.suite(doc),
        head: [[titre, 'Nombre']],
        body: lignes.length ? lignes : [['Aucune donnee', '-']],
        headStyles: { fillColor: couleurEntete },
        styles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 100 } }
      });
    };
    repartition('Cellules par statut', d.cellulesParStatut);
    repartition('Membres par statut', d.membresParStatut);

    // Un tableau par niveau territorial
    const tableauNiveau = (titre: string, lignes: (string | number)[][]) => {
      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(titre, 14, 18);
      autoTable(doc, {
        startY: 24,
        head: [['Nom', 'Cellules', 'Comites', 'Complets', 'Remplissage', 'Membres']],
        body: lignes.length ? lignes.map((l) => l.map(String)) : [['Aucune donnee', '', '', '', '', '']],
        headStyles: { fillColor: couleurEntete },
        styles: { fontSize: 8 }
      });
    };
    tableauNiveau('Par arrondissement', donnees.arrondissements.map((a) =>
      [a.nom, a.nombreCellules, a.nombreComites, a.comitesComplets, `${a.tauxRemplissageMoyen} %`, a.nombreMembres]));
    tableauNiveau('Par commune / ville', donnees.communes.map((c) =>
      [c.nom, c.nombreCellules, c.nombreComites, c.comitesComplets, `${c.tauxRemplissageMoyen} %`, c.nombreMembres]));
    tableauNiveau('Par localite', donnees.localites.map((l) =>
      [l.nom, l.nombreCellules, l.nombreComites, l.comitesComplets, `${l.tauxRemplissageMoyen} %`, l.nombreMembres]));

    // Pied de page numerote
    const total = doc.getNumberOfPages();
    for (let page = 1; page <= total; page++) {
      doc.setPage(page);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`KIIRAAY - Document interne - Page ${page} / ${total}`, 14, 290);
    }

    doc.save(`rapport-kiiraay-${maintenant.toISOString().slice(0, 10)}.pdf`);
  }

  // Position verticale juste apres le dernier tableau dessine
  private suite(doc: unknown): number {
    const fin = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 30;
    return fin + 8;
  }
}
