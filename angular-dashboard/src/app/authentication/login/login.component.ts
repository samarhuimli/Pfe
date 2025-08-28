import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Import uniquement FormsModule
import { AuthService } from '../../services/auth.service'; // Ajuste le chemin si nécessaire
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, FormsModule], // FormsModule pour ngModel
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export default class LoginComponent {
  username: string = 'info@codedthemes.com';
  password: string = '123456789';
  rememberMe: boolean = true;

  SignInOptions = [
    { image: 'assets/images/authentication/google.svg', name: 'Google' },
    { image: 'assets/images/authentication/twitter.svg', name: 'Twitter' },
    { image: 'assets/images/authentication/facebook.svg', name: 'Facebook' }
  ];

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (this.username && this.password) { // Validation simple
      this.authService.login(this.username, this.password).subscribe({
        next: (response) => {
          const token = response.token;
          if (token) {
            this.authService.setToken(token);
            console.log('Login successful, token:', token);
            this.router.navigate(['/dashboard']).then(() => {
              console.log('Navigation to dashboard completed');
            }).catch(err => {
              console.error('Navigation error:', err);
            });
          } else {
            console.error('No token received:', response);
            alert('Login failed: No token received');
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Login failed:', error);
          if (error.status === 401) {
            alert('Invalid username or password');
          } else {
            alert('An error occurred. Please try again later.');
          }
        },
        complete: () => console.log('Login request completed')
      });
    }
  }
}