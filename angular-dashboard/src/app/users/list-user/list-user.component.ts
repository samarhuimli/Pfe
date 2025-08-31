// list-user.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Utilisateur' | 'Modérateur' | string;
  status: 'Actif' | 'Inactif';
  registrationDate: string;
  initials: string;
  username?: string;
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
      next: (backendUsers) => {
        this.users = backendUsers.map(user => ({
          id: this.generateId(), // You might want to use actual user ID from backend
          name: user.username, // Or map to actual name if available
          email: user.email || `${user.username}@example.com`,
          role: this.mapRole(user.role),
          status: user.enabled ? 'Actif' : 'Inactif',
          registrationDate: new Date().toLocaleDateString(), // Update with actual date from backend
          initials: this.getInitials(user.username)
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
    console.log('Supprimer utilisateur:', user);
    // Logique pour supprimer un utilisateur
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
