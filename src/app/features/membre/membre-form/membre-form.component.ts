import { Component, OnDestroy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Comite } from '../../../core/models/comite.model';
import { ComiteService } from '../../comite/services/comite.service';
import { MembreService } from '../services/membre.service';

@Component({
  selector: 'app-membre-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './membre-form.component.html',
  styleUrl: './membre-form.component.scss'
})
export class MembreFormComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly comiteService = inject(ComiteService);
  private readonly membreService = inject(MembreService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly idParam = this.route.snapshot.paramMap.get('id');
  readonly membreId = this.idParam ? Number(this.idParam) : null;
  readonly modeEdition = this.membreId !== null;

  readonly comites = signal<Comite[]>([]);
  readonly enCours = signal(false);
  readonly messageErreur = signal<string | null>(null);
  readonly alertesDoublon = signal<string[]>([]);

  // Preuve visuelle de la CNI : sans les deux photos, le membre ne peut pas etre valide
  // (voir MembreService.valider() cote backend). La carte d'electeur ne necessite pas de
  // photo (numero seul suffisant).
  readonly photoRectoPresente = signal(false);
  readonly photoVersoPresente = signal(false);
  readonly enUploadPhotos = signal(false);
  readonly messagePhotos = signal<string | null>(null);
  private fichierRecto: File | null = null;
  private fichierVerso: File | null = null;

  // Aperçus (URL locale du fichier choisi, ou de la photo deja stockee cote serveur une
  // fois recuperee). On garde une trace des URL creees pour les liberer a la destruction
  // du composant et eviter les fuites memoire.
  readonly apercuRecto = signal<string | null>(null);
  readonly apercuVerso = signal<string | null>(null);
  readonly chargementApercuRecto = signal(false);
  readonly chargementApercuVerso = signal(false);
  private readonly urlsObjetCreees: string[] = [];

  // Photo de profil (portrait) : donnee non sensible, distincte des photos de CNI.
  readonly photoProfilPresente = signal(false);
  readonly apercuProfil = signal<string | null>(null);
  readonly chargementApercuProfil = signal(false);
  readonly enUploadPhotoProfil = signal(false);
  readonly messagePhotoProfil = signal<string | null>(null);
  private fichierProfil: File | null = null;

  readonly formulaire = this.fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    prenom: ['', [Validators.required, Validators.minLength(2)]],
    dateNaissance: ['', Validators.required],
    lieuNaissance: [''],
    sexe: ['M' as 'M' | 'F', Validators.required],
    telephone: [''],
    email: [''],
    adresse: [''],
    comiteId: [null as number | null, Validators.required],
    numeroCNI: ['', Validators.required],
    dateDelivranceCNI: [''],
    dateExpirationCNI: [''],
    lieuDelivranceCNI: [''],
    numeroCarteElecteur: ['']
  });

  constructor() {
    this.comiteService.listerTous().subscribe({
      next: (comites) => this.comites.set(comites),
      error: () => this.messageErreur.set('Impossible de charger les comites.')
    });

    if (this.modeEdition && this.membreId !== null) {
      this.membreService.trouverParId(this.membreId).subscribe({
        next: (membre) => {
          this.comiteService.listerTous().subscribe((comites) => {
            const comite = comites.find((c) => c.code === membre.comiteCode);
            this.formulaire.patchValue({
              nom: membre.nom,
              prenom: membre.prenom,
              dateNaissance: membre.dateNaissance,
              sexe: membre.sexe,
              telephone: membre.telephone ?? '',
              comiteId: comite ? comite.id : null,
              // Le CNI/carte electeur ne sont renvoyes que si l'utilisateur a le droit CNI_LIRE ;
              // sans ce droit, ils restent vides et ne seront pas modifies via ce formulaire.
              numeroCNI: membre.numeroCNI ?? '',
              numeroCarteElecteur: membre.numeroCarteElecteur ?? ''
            });
          });
          this.photoRectoPresente.set(membre.photoRectoPresente);
          this.photoVersoPresente.set(membre.photoVersoPresente);
          this.photoProfilPresente.set(membre.photoProfilPresente);
          if (membre.photoRectoPresente) {
            this.voirPhotoExistanteCni('recto');
          }
          if (membre.photoVersoPresente) {
            this.voirPhotoExistanteCni('verso');
          }
          if (membre.photoProfilPresente) {
            this.voirPhotoProfilExistante();
          }
        },
        error: () => this.messageErreur.set('Membre introuvable.')
      });
    }
  }

  enregistrer(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }

    this.enCours.set(true);
    this.messageErreur.set(null);
    this.alertesDoublon.set([]);
    const v = this.formulaire.getRawValue();
    const requete = {
      nom: v.nom,
      prenom: v.prenom,
      dateNaissance: v.dateNaissance,
      lieuNaissance: v.lieuNaissance || undefined,
      sexe: v.sexe,
      telephone: v.telephone || undefined,
      email: v.email || undefined,
      adresse: v.adresse || undefined,
      comiteId: v.comiteId!,
      numeroCNI: v.numeroCNI,
      dateDelivranceCNI: v.dateDelivranceCNI || undefined,
      dateExpirationCNI: v.dateExpirationCNI || undefined,
      lieuDelivranceCNI: v.lieuDelivranceCNI || undefined,
      numeroCarteElecteur: v.numeroCarteElecteur || undefined
    };

    const requete$ = this.modeEdition && this.membreId !== null
      ? this.membreService.modifier(this.membreId, requete)
      : this.membreService.creer(requete);

    requete$.subscribe({
      next: (membre) => {
        if (membre.alertesDoublon?.length) {
          this.alertesDoublon.set(membre.alertesDoublon);
        }
        if (this.modeEdition) {
          this.router.navigate(['/membre/membres']);
        } else {
          // Apres creation, on reste sur la fiche (en mode modification) pour permettre
          // de televerser immediatement les photos recto/verso de la piece d'identite.
          this.router.navigate(['/membre/membres', membre.id, 'modifier']);
        }
      },
      error: (err) => {
        this.enCours.set(false);
        this.messageErreur.set(err?.error?.message ?? 'Une erreur est survenue. Verifiez le numero CNI (deja utilise ?).');
      }
    });
  }

  surChangementRecto(evenement: Event): void {
    const input = evenement.target as HTMLInputElement;
    this.fichierRecto = input.files?.[0] ?? null;
    this.definirApercuLocal(this.fichierRecto, this.apercuRecto);
  }

  surChangementVerso(evenement: Event): void {
    const input = evenement.target as HTMLInputElement;
    this.fichierVerso = input.files?.[0] ?? null;
    this.definirApercuLocal(this.fichierVerso, this.apercuVerso);
  }

  televerserPhotos(): void {
    if (this.membreId === null || (!this.fichierRecto && !this.fichierVerso)) {
      this.messagePhotos.set('Choisissez au moins une photo (recto ou verso) avant de televerser.');
      return;
    }
    this.enUploadPhotos.set(true);
    this.messagePhotos.set(null);
    this.membreService.televerserPhotos(this.membreId, this.fichierRecto, this.fichierVerso).subscribe({
      next: (membre) => {
        this.photoRectoPresente.set(membre.photoRectoPresente);
        this.photoVersoPresente.set(membre.photoVersoPresente);
        this.fichierRecto = null;
        this.fichierVerso = null;
        this.enUploadPhotos.set(false);
        this.messagePhotos.set('Photo(s) enregistree(s) avec succes.');
      },
      error: (err) => {
        this.enUploadPhotos.set(false);
        this.messagePhotos.set(err?.error?.message ?? 'Impossible d\'enregistrer la ou les photos.');
      }
    });
  }

  // Charge une photo de CNI deja televersee (session precedente ou apres rechargement de
  // la page) pour l'afficher, puisque <img src> seul ne peut pas envoyer le jeton d'authentification.
  private voirPhotoExistanteCni(cote: 'recto' | 'verso'): void {
    if (this.membreId === null) {
      return;
    }
    const chargement = cote === 'recto' ? this.chargementApercuRecto : this.chargementApercuVerso;
    const apercu = cote === 'recto' ? this.apercuRecto : this.apercuVerso;
    chargement.set(true);
    this.membreService.recupererPhotoCni(this.membreId, cote).subscribe({
      next: (blob) => {
        this.definirApercuDepuisBlob(blob, apercu);
        chargement.set(false);
      },
      error: () => chargement.set(false)
    });
  }

  private definirApercuLocal(fichier: File | null, cible: ReturnType<typeof signal<string | null>>): void {
    if (!fichier) {
      return;
    }
    const url = URL.createObjectURL(fichier);
    this.urlsObjetCreees.push(url);
    cible.set(url);
  }

  private definirApercuDepuisBlob(blob: Blob, cible: ReturnType<typeof signal<string | null>>): void {
    const url = URL.createObjectURL(blob);
    this.urlsObjetCreees.push(url);
    cible.set(url);
  }

  surChangementPhotoProfil(evenement: Event): void {
    const input = evenement.target as HTMLInputElement;
    this.fichierProfil = input.files?.[0] ?? null;
    this.definirApercuLocal(this.fichierProfil, this.apercuProfil);
  }

  televerserPhotoProfil(): void {
    if (this.membreId === null || !this.fichierProfil) {
      this.messagePhotoProfil.set('Choisissez une photo avant de televerser.');
      return;
    }
    this.enUploadPhotoProfil.set(true);
    this.messagePhotoProfil.set(null);
    this.membreService.televerserPhotoProfil(this.membreId, this.fichierProfil).subscribe({
      next: (membre) => {
        this.photoProfilPresente.set(membre.photoProfilPresente);
        this.fichierProfil = null;
        this.enUploadPhotoProfil.set(false);
        this.messagePhotoProfil.set('Photo de profil enregistree avec succes.');
      },
      error: (err) => {
        this.enUploadPhotoProfil.set(false);
        this.messagePhotoProfil.set(err?.error?.message ?? "Impossible d'enregistrer la photo de profil.");
      }
    });
  }

  private voirPhotoProfilExistante(): void {
    if (this.membreId === null) {
      return;
    }
    this.chargementApercuProfil.set(true);
    this.membreService.recupererPhotoProfil(this.membreId).subscribe({
      next: (blob) => {
        this.definirApercuDepuisBlob(blob, this.apercuProfil);
        this.chargementApercuProfil.set(false);
      },
      error: () => this.chargementApercuProfil.set(false)
    });
  }

  ngOnDestroy(): void {
    // Libere toutes les URL d'objet creees pour les apercus (fichiers locaux ou photos
    // recuperees du serveur), sinon elles restent en memoire jusqu'au rechargement de la page.
    this.urlsObjetCreees.forEach((url) => URL.revokeObjectURL(url));
  }

  annuler(): void {
    this.router.navigate(['/membre/membres']);
  }
}
