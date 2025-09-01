// list-user.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import Swal from 'sweetalert2';

export interface User {
  id?: number;
  name: string;
  email: string;
  role: 'Admin' | 'Utilisateur' | 'Modérateur' | string;
  status: 'Actif' | 'Inactif';
  registrationDate: string;
  initials: string;
  username?: string;
  enabled?: boolean;
}

@Component({
  selector: 'app-list-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list-user.component.html',
  styleUrls: ['./list-user.component.scss'] // Corrected styleUrl to styleUrls
})
export class ListUserComponent implements OnInit {
  users: User[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (backendUsers: any[]) => {
        this.users = backendUsers.map(user => ({
          id: user.id, // Will be undefined if not present
          name: user.name || user.username, // Use name if available, otherwise username
          email: user.email || `${user.username}@example.com`,
          username: user.username,
          role: this.mapRole(user.role || 'Utilisateur'),
          status: user.enabled ? 'Actif' : 'Inactif',
          registrationDate: user.registrationDate || new Date().toLocaleDateString(),
          initials: this.getInitials(user.name || user.username || '')
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.error = 'Failed to load users. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  private getInitials(username: string): string {
    if (!username) return '??';
    return username.substring(0, 2).toUpperCase();
  }

  private mapRole(role: string): string {
    const roleMap: { [key: string]: string } = {
      'ROLE_ADMIN': 'Admin',
      'ROLE_SCIENTIST': 'Scientifique',
      'ROLE_ANALYSTE': 'Analyste',
      'ROLE_USER': 'Utilisateur'
    };
    return roleMap[role] || 'Utilisateur';
  }

  private generateId(): number {
    return Math.floor(Math.random() * 1000); // Replace with actual ID from backend
  }

  onCreateUser(): void {
    this.router.navigate(['/add-user']); // Example route
    // Logique pour créer un utilisateur
  }

  onEditUser(user: User): void {
    console.log('Modifier utilisateur:', user);
    // Logique pour modifier un utilisateur
  }

  onDeleteUser(user: User): void {
    if (!user.username) {
      console.error('Cannot delete user: username is missing', user);
      Swal.fire('Erreur', 'Impossible de supprimer l\'utilisateur: nom d\'utilisateur manquant', 'error');
      return;
    }

    // Show SweetAlert confirmation dialog
    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: `Voulez-vous vraiment supprimer l'utilisateur "${user.name || user.username}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        // Show loading indicator
        Swal.fire({
          title: 'Suppression en cours...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        console.log('Attempting to delete user:', user.username);
        
        // Call the delete API
        this.userService.deleteUser(user.username).subscribe({
          next: (response) => {
            console.log('Delete response:', response);
            // Remove the user from the local array for immediate UI update
            this.users = this.users.filter(u => u.username !== user.username);
            // Show success message
            Swal.fire(
              'Supprimé!',
              response?.message || 'L\'utilisateur a été supprimé avec succès.',
              'success'
            );
          },
          error: (error) => {
            console.error('❌ Error deleting user:', error);
            const errorMessage = error.error?.message || 
                              error.error?.error || 
                              error.message || 
                              'Une erreur est survenue lors de la suppression';
            Swal.fire(
              'Erreur!',
              `Échec de la suppression: ${errorMessage}`,
              'error'
            );
          }
        });
      }
    });
  }

  navigateToHome(): void {
    console.log('Navigation vers Home');
    // Logique de navigation
  }

  getRoleClass(role: string): string {
    switch (role) {
      case 'Admin':
        return 'role-admin';
      case 'Utilisateur':
        return 'role-user';
      case 'Modérateur':
        return 'role-moderator';
      default:
        return '';
    }
  }

  getStatusClass(status: string): string {
    return status === 'Actif' ? 'status-active' : 'status-inactive';
  }
}
