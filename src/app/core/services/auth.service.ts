import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { User, UserRole, AuthState } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStateSubject = new BehaviorSubject<AuthState>({
    user: null,
    isAuthenticated: false
  });

  public authState$ = this.authStateSubject.asObservable();

  constructor() {
    this.checkStoredAuth();
  }

  /**
   * Check for stored authentication
   */
  private checkStoredAuth(): void {
    const storedUser = localStorage.getItem('almonds_user');
    const storedToken = localStorage.getItem('almonds_token');

    if (storedUser && storedToken) {
      const user: User = JSON.parse(storedUser);
      this.authStateSubject.next({
        user,
        isAuthenticated: true,
        token: storedToken
      });
    }
  }

  /**
   * Login user
   */
  login(email: string, password: string): Observable<User> {
    // Mock implementation - replace with actual API call
    return of({
      id: '1',
      email,
      name: email.split('@')[0],
      role: UserRole.DEVELOPER,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      preferences: {
        theme: 'auto',
        notifications: {
          email: true,
          push: true,
          resourceAlerts: true
        }
      }
    }).pipe(
      delay(1000),
      map(user => {
        const token = 'mock-jwt-token';
        localStorage.setItem('almonds_user', JSON.stringify(user));
        localStorage.setItem('almonds_token', token);

        this.authStateSubject.next({
          user,
          isAuthenticated: true,
          token
        });

        return user;
      })
    );
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('almonds_user');
    localStorage.removeItem('almonds_token');

    this.authStateSubject.next({
      user: null,
      isAuthenticated: false
    });
  }

  /**
   * Get current user
   */
  getCurrentUser(): Observable<User | null> {
    return this.authState$.pipe(map(state => state.user));
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): Observable<boolean> {
    return this.authState$.pipe(map(state => state.isAuthenticated));
  }

  /**
   * Update user preferences
   */
  updateUserPreferences(preferences: Partial<User['preferences']>): Observable<boolean> {
    const currentState = this.authStateSubject.value;
    if (currentState.user) {
      const updatedUser = {
        ...currentState.user,
        preferences: {
          ...currentState.user.preferences,
          ...preferences
        }
      };

      localStorage.setItem('almonds_user', JSON.stringify(updatedUser));
      this.authStateSubject.next({
        ...currentState,
        user: updatedUser
      });

      return of(true);
    }
    return of(false);
  }
}
