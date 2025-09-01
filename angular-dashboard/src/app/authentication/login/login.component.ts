// angular import
import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

// Toast notification interface
interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  show: boolean;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export default class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  toast: ToastMessage = {
    message: '',
    type: 'info',
    show: false
  };

  // public method
  SignInOptions = [
    {
      image: 'assets/images/authentication/google.svg',
      name: 'Google'
    },
    {
      image: 'assets/images/authentication/twitter.svg',
      name: 'Twitter'
    },
    {
      image: 'assets/images/authentication/facebook.svg',
      name: 'Facebook'
    }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      username: ['admin', [Validators.required]],
      password: ['123456789', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      const { username, password } = this.loginForm.value;

      this.authService.login(username, password).subscribe({
        next: (response) => {
          this.showToast('Connexion réussie! Redirection vers le tableau de bord...', 'success');
          this.isLoading = false;
          // Navigation is handled in the auth service
        },
        error: (error) => {
          this.showToast(error.message || 'Erreur de connexion. Veuillez réessayer.', 'error');
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
      this.showToast('Veuillez remplir tous les champs requis.', 'warning');
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  private showToast(message: string, type: ToastMessage['type']): void {
    this.toast = { message, type, show: true };
    setTimeout(() => {
      this.toast.show = false;
    }, 4000);
  }

  closeToast(): void {
    this.toast.show = false;
  }

  // Helper methods for template
  get username() { return this.loginForm.get('username'); }
  get password() { return this.loginForm.get('password'); }
}
