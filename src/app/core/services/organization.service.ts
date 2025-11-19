import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import {
  Organization,
  OrganizationMember,
  OrganizationInvitation,
  OrganizationStats,
  CreateOrganizationDto,
  UpdateOrganizationDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
  OrganizationPlan,
  OrganizationStatus,
  MemberRole,
  InvitationStatus
} from '../models/organization.model';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private organizationsSubject = new BehaviorSubject<Organization[]>([]);
  public organizations$ = this.organizationsSubject.asObservable();

  private currentOrganizationSubject = new BehaviorSubject<Organization | null>(null);
  public currentOrganization$ = this.currentOrganizationSubject.asObservable();

  private membersSubject = new BehaviorSubject<OrganizationMember[]>([]);
  public members$ = this.membersSubject.asObservable();

  private invitationsSubject = new BehaviorSubject<OrganizationInvitation[]>([]);
  public invitations$ = this.invitationsSubject.asObservable();

  constructor() {
    this.initializeMockData();
  }

  /**
   * Initialize with mock data for demo
   */
  private initializeMockData(): void {
    const mockOrganization: Organization = {
      id: 'org-1',
      name: 'Acme Corporation',
      slug: 'acme-corp',
      description: 'Leading technology company',
      plan: OrganizationPlan.PROFESSIONAL,
      status: OrganizationStatus.ACTIVE,
      settings: {
        requireMFA: false,
        allowPublicResources: true,
        retentionDays: 90,
        notificationPreferences: {
          resourceAlerts: true,
          costAlerts: true,
          securityAlerts: true,
          weeklyReports: true,
          email: true
        },
        features: {
          aiRecommendations: true,
          advancedAnalytics: true,
          customIntegrations: false,
          apiAccess: true,
          sso: false
        }
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      createdBy: 'user-1',
      memberCount: 5,
      resourceCount: 12
    };

    this.organizationsSubject.next([mockOrganization]);
    this.currentOrganizationSubject.next(mockOrganization);

    // Mock members
    const mockMembers: OrganizationMember[] = [
      {
        id: 'member-1',
        organizationId: 'org-1',
        userId: 'user-1',
        email: 'admin@acme.com',
        name: 'Admin User',
        role: MemberRole.OWNER,
        joinedAt: new Date('2024-01-01'),
        lastActiveAt: new Date()
      },
      {
        id: 'member-2',
        organizationId: 'org-1',
        userId: 'user-2',
        email: 'dev@acme.com',
        name: 'Developer User',
        role: MemberRole.DEVELOPER,
        joinedAt: new Date('2024-01-15'),
        lastActiveAt: new Date()
      }
    ];

    this.membersSubject.next(mockMembers);
  }

  /**
   * Get all organizations for current user
   */
  getAllOrganizations(): Observable<Organization[]> {
    return this.organizations$;
  }

  /**
   * Get organization by ID
   */
  getOrganizationById(id: string): Observable<Organization | undefined> {
    return this.organizations$.pipe(
      map(orgs => orgs.find(org => org.id === id))
    );
  }

  /**
   * Get organization by slug
   */
  getOrganizationBySlug(slug: string): Observable<Organization | undefined> {
    return this.organizations$.pipe(
      map(orgs => orgs.find(org => org.slug === slug))
    );
  }

  /**
   * Get current organization
   */
  getCurrentOrganization(): Observable<Organization | null> {
    return this.currentOrganization$;
  }

  /**
   * Set current organization
   */
  setCurrentOrganization(organizationId: string): Observable<boolean> {
    return this.getOrganizationById(organizationId).pipe(
      tap(org => {
        if (org) {
          this.currentOrganizationSubject.next(org);
          localStorage.setItem('almonds_current_org', organizationId);
        }
      }),
      map(org => !!org)
    );
  }

  /**
   * Create new organization
   */
  createOrganization(dto: CreateOrganizationDto): Observable<Organization> {
    // Check if slug already exists
    const exists = this.organizationsSubject.value.some(org => org.slug === dto.slug);
    if (exists) {
      return throwError(() => new Error('Organization slug already exists'));
    }

    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      plan: dto.plan || OrganizationPlan.FREE,
      status: OrganizationStatus.ACTIVE,
      settings: {
        requireMFA: false,
        allowPublicResources: true,
        retentionDays: 30,
        notificationPreferences: {
          resourceAlerts: true,
          costAlerts: true,
          securityAlerts: true,
          weeklyReports: false,
          email: true
        },
        features: {
          aiRecommendations: false,
          advancedAnalytics: false,
          customIntegrations: false,
          apiAccess: false,
          sso: false
        }
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user-id',
      memberCount: 1,
      resourceCount: 0
    };

    return of(newOrg).pipe(
      delay(1000),
      tap(org => {
        const current = this.organizationsSubject.value;
        this.organizationsSubject.next([...current, org]);
        this.currentOrganizationSubject.next(org);
      })
    );
  }

  /**
   * Update organization
   */
  updateOrganization(id: string, dto: UpdateOrganizationDto): Observable<Organization> {
    const orgs = this.organizationsSubject.value;
    const index = orgs.findIndex(org => org.id === id);

    if (index === -1) {
      return throwError(() => new Error('Organization not found'));
    }

    const updated: Organization = {
      ...orgs[index],
      ...dto,
      settings: dto.settings ? { ...orgs[index].settings, ...dto.settings } : orgs[index].settings,
      updatedAt: new Date()
    };

    return of(updated).pipe(
      delay(800),
      tap(org => {
        orgs[index] = org;
        this.organizationsSubject.next([...orgs]);

        if (this.currentOrganizationSubject.value?.id === id) {
          this.currentOrganizationSubject.next(org);
        }
      })
    );
  }

  /**
   * Delete organization
   */
  deleteOrganization(id: string): Observable<boolean> {
    const orgs = this.organizationsSubject.value.filter(org => org.id !== id);

    return of(true).pipe(
      delay(1000),
      tap(() => {
        this.organizationsSubject.next(orgs);

        if (this.currentOrganizationSubject.value?.id === id) {
          this.currentOrganizationSubject.next(orgs.length > 0 ? orgs[0] : null);
        }
      })
    );
  }

  /**
   * Get organization statistics
   */
  getOrganizationStats(organizationId: string): Observable<OrganizationStats> {
    // Mock implementation
    return of({
      totalMembers: 5,
      totalResources: 12,
      activeResources: 10,
      totalCost: 453.50,
      costByProvider: {
        'aws': 234.50,
        'azure': 123.00,
        'railway': 96.00
      },
      resourcesByType: {
        'compute': 4,
        'database': 3,
        'storage': 2,
        'container': 3
      },
      monthlyGrowth: 15.5
    }).pipe(delay(500));
  }

  /**
   * Get organization members
   */
  getMembers(organizationId: string): Observable<OrganizationMember[]> {
    return this.members$.pipe(
      map(members => members.filter(m => m.organizationId === organizationId))
    );
  }

  /**
   * Invite member to organization
   */
  inviteMember(organizationId: string, dto: InviteMemberDto): Observable<OrganizationInvitation> {
    const invitation: OrganizationInvitation = {
      id: `inv-${Date.now()}`,
      organizationId,
      email: dto.email,
      role: dto.role,
      status: InvitationStatus.PENDING,
      invitedBy: 'current-user-id',
      invitedByName: 'Current User',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      token: `inv-token-${Date.now()}`
    };

    return of(invitation).pipe(
      delay(800),
      tap(inv => {
        const current = this.invitationsSubject.value;
        this.invitationsSubject.next([...current, inv]);
      })
    );
  }

  /**
   * Get pending invitations
   */
  getInvitations(organizationId: string): Observable<OrganizationInvitation[]> {
    return this.invitations$.pipe(
      map(invs => invs.filter(inv =>
        inv.organizationId === organizationId &&
        inv.status === InvitationStatus.PENDING
      ))
    );
  }

  /**
   * Cancel invitation
   */
  cancelInvitation(invitationId: string): Observable<boolean> {
    const invitations = this.invitationsSubject.value.filter(inv => inv.id !== invitationId);

    return of(true).pipe(
      delay(500),
      tap(() => this.invitationsSubject.next(invitations))
    );
  }

  /**
   * Update member role
   */
  updateMemberRole(
    organizationId: string,
    memberId: string,
    dto: UpdateMemberRoleDto
  ): Observable<OrganizationMember> {
    const members = this.membersSubject.value;
    const index = members.findIndex(m => m.id === memberId && m.organizationId === organizationId);

    if (index === -1) {
      return throwError(() => new Error('Member not found'));
    }

    const updated: OrganizationMember = {
      ...members[index],
      role: dto.role,
      permissions: dto.permissions
    };

    return of(updated).pipe(
      delay(800),
      tap(member => {
        members[index] = member;
        this.membersSubject.next([...members]);
      })
    );
  }

  /**
   * Remove member from organization
   */
  removeMember(organizationId: string, memberId: string): Observable<boolean> {
    const members = this.membersSubject.value.filter(m =>
      !(m.id === memberId && m.organizationId === organizationId)
    );

    return of(true).pipe(
      delay(800),
      tap(() => this.membersSubject.next(members))
    );
  }

  /**
   * Check if slug is available
   */
  checkSlugAvailability(slug: string): Observable<boolean> {
    const available = !this.organizationsSubject.value.some(org => org.slug === slug);
    return of(available).pipe(delay(300));
  }

  /**
   * Switch organization context
   */
  switchOrganization(organizationId: string): Observable<Organization> {
    return this.getOrganizationById(organizationId).pipe(
      tap(org => {
        if (org) {
          this.currentOrganizationSubject.next(org);
          localStorage.setItem('almonds_current_org', organizationId);
        }
      }),
      map(org => {
        if (!org) {
          throw new Error('Organization not found');
        }
        return org;
      })
    );
  }
}
