import { Component, inject, signal, computed } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/user.model';

// Custom age-range validator
export const ageRangeValidator =
  (min: number, max: number): ValidatorFn =>
  (control: AbstractControl): ValidationErrors | null => {
    const val = Number(control.value);
    if (isNaN(val) || val < min || val > max) {
      return { ageRange: { min, max, actual: val } };
    }
    return null;
  };

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  loading = signal(false);

  form: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    age: [null, [Validators.required, ageRangeValidator(18, 100)]],
    monthlyIncome: [null, [Validators.required, Validators.min(0)]],
  });

  get fullName() { return this.form.get('fullName')!; }
  get email()    { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }
  get age()      { return this.form.get('age')!; }
  get monthlyIncome() { return this.form.get('monthlyIncome')!; }

  /** Password strength: 0 = weak, 1 = medium, 2 = strong */
  readonly passwordStrength = computed(() => {
    const val: string = this.password.value ?? '';
    if (val.length < 8) return 0;
    const hasUpper = /[A-Z]/.test(val);
    const hasDigit = /\d/.test(val);
    const hasSpecial = /[^A-Za-z0-9]/.test(val);
    const score = [hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
    return score >= 2 ? 2 : score >= 1 ? 1 : 0;
  });

  readonly strengthLabel = computed(() =>
    ['Weak', 'Medium', 'Strong'][this.passwordStrength()],
  );

  readonly strengthClass = computed(() =>
    ['strength-weak', 'strength-medium', 'strength-strong'][this.passwordStrength()],
  );

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const payload: RegisterRequest = this.form.value;

    this.authService.register(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        const message =
          err?.error?.message ?? 'Registration failed. Please try again.';
        this.messageService.add({
          severity: 'error',
          summary: 'Registration Failed',
          detail: message,
          life: 5000,
        });
      },
    });
  }
}
