import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { User, UserRole, AuthState, UserOrganization } from '../models/user.model';
import { MemberRole } from '../models/organization.model';

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
    const storedOrgId = localStorage.getItem('almonds_current_org');

    if (storedUser && storedToken) {
      const user: User = JSON.parse(storedUser);
      const currentOrg = user.organizations?.find(o =>
        o.organizationId === (storedOrgId || user.currentOrganizationId)
      );

      this.authStateSubject.next({
        user,
        isAuthenticated: true,
        token: storedToken,
        currentOrganization: currentOrg ? {
          id: currentOrg.organizationId,
          name: currentOrg.organizationName,
          slug: currentOrg.organizationSlug,
          role: currentOrg.role
        } : undefined
      });
    }
  }

  /**
   * Login user
   */
  login(email: string, password: string): Observable<User> {
    // Mock implementation - replace with actual API call
    const mockOrganizations: UserOrganization[] = [
      {
        organizationId: 'org-1',
        organizationName: 'Acme Corporation',
        organizationSlug: 'acme-corp',
        role: MemberRole.ADMIN,
        joinedAt: new Date('2024-01-01'),
        isDefault: true
      }
    ];

    return of({
      id: '1',
      email,
      name: email.split('@')[0],
      role: UserRole.DEVELOPER,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      organizations: mockOrganizations,
      currentOrganizationId: 'org-1',
      preferences: {
        theme: 'auto',
        defaultOrganization: 'org-1',
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
        const currentOrg = user.organizations.find(o => o.organizationId === user.currentOrganizationId);

        localStorage.setItem('almonds_user', JSON.stringify(user));
        localStorage.setItem('almonds_token', token);
        if (currentOrg) {
          localStorage.setItem('almonds_current_org', currentOrg.organizationId);
        }

        this.authStateSubject.next({
          user,
          isAuthenticated: true,
          token,
          currentOrganization: currentOrg ? {
            id: currentOrg.organizationId,
            name: currentOrg.organizationName,
            slug: currentOrg.organizationSlug,
            role: currentOrg.role
          } : undefined
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
    localStorage.removeItem('almonds_current_org');

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
   * Get current organization from auth state
   */
  getCurrentOrganization(): Observable<AuthState['currentOrganization'] | undefined> {
    return this.authState$.pipe(map(state => state.currentOrganization));
  }

  /**
   * Switch current organization
   */
  switchOrganization(organizationId: string): Observable<boolean> {
    const currentState = this.authStateSubject.value;
    if (!currentState.user) {
      return of(false);
    }

    const org = currentState.user.organizations?.find(o => o.organizationId === organizationId);
    if (!org) {
      return of(false);
    }

    const updatedUser = {
      ...currentState.user,
      currentOrganizationId: organizationId
    };

    localStorage.setItem('almonds_user', JSON.stringify(updatedUser));
    localStorage.setItem('almonds_current_org', organizationId);

    this.authStateSubject.next({
      ...currentState,
      user: updatedUser,
      currentOrganization: {
        id: org.organizationId,
        name: org.organizationName,
        slug: org.organizationSlug,
        role: org.role
      }
    });

    return of(true);
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
