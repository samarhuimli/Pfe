import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService, User } from '../../services/user.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-user.component.html',
  styleUrl: './edit-user.component.scss',
  animations: [
    trigger('slideIn', [
      state('in', style({transform: 'translateY(0)', opacity: 1})),
      transition('void => *', [
        style({transform: 'translateY(-100%)', opacity: 0}),
        animate(300)
      ]),
      transition('* => void', [
        animate(300, style({transform: 'translateY(-100%)', opacity: 0}))
      ])
    ])
  ]
})
export class EditUserComponent implements OnInit {
  userForm: FormGroup;
  isSubmitting = false;
  showSuccessToast = false;
  showErrorToast = false;
  toastMessage = '';
  username: string = '';
  originalUser: User | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.userForm = this.fb.group({
      username: [{value: '', disabled: true}, [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      role: ['ROLE_SCIENTIST', [Validators.required]],
      enabled: [true, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.username = this.route.snapshot.params['username'];
    this.loadUser();
  }

  loadUser(): void {
    this.userService.getUserByUsername(this.username).subscribe({
      next: (user) => {
        this.originalUser = user;
        this.userForm.patchValue({
          username: user.username,
          email: user.email,
          role: user.role,
          enabled: user.enabled
        });
      },
      error: (error) => {
        console.error('Error loading user:', error);
        this.showError('Erreur lors du chargement de l\'utilisateur');
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const formValue = this.userForm.getRawValue();
      const updatedUser: User = {
        username: formValue.username,
        email: formValue.email,
        role: formValue.role,
        enabled: formValue.enabled,
        validationCode: this.originalUser?.validationCode || ''
      };

      // Only include password if it's provided
      if (formValue.password && formValue.password.trim()) {
        updatedUser.password = formValue.password;
      }

      this.userService.updateUser(this.username, updatedUser).subscribe({
        next: (response) => {
          this.showSuccess('Utilisateur modifié avec succès!');
          setTimeout(() => {
            this.router.navigate(['/users']);
          }, 2000);
        },
        error: (error) => {
          console.error('Error updating user:', error);
          const errorMessage = error.error?.error || error.error?.message || 'Erreur lors de la modification de l\'utilisateur';
          this.showError(errorMessage);
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/users']);
  }

  showSuccess(message: string): void {
    this.toastMessage = message;
    this.showSuccessToast = true;
    this.showErrorToast = false;
    setTimeout(() => this.hideToasts(), 5000);
  }

  showError(message: string): void {
    this.toastMessage = message;
    this.showErrorToast = true;
    this.showSuccessToast = false;
    setTimeout(() => this.hideToasts(), 5000);
  }

  hideToasts(): void {
    this.showSuccessToast = false;
    this.showErrorToast = false;
  }
}
