import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { PopoverController } from '@ionic/angular';

import { OrganizationService } from '@core/services/organization.service';
import { AuthService } from '@core/services/auth.service';
import { Organization } from '@core/models/organization.model';
import { User } from '@core/models/user.model';

@Component({
  selector: 'app-organization-switcher',
  templateUrl: './organization-switcher.component.html',
  styleUrls: ['./organization-switcher.component.scss']
})
export class OrganizationSwitcherComponent implements OnInit {
  user$: Observable<User | null>;
  currentOrganization$: Observable<Organization | null>;
  userOrganizations: any[] = [];

  constructor(
    private router: Router,
    private organizationService: OrganizationService,
    private authService: AuthService,
    private popoverController: PopoverController
  ) {
    this.user$ = this.authService.getCurrentUser();
    this.currentOrganization$ = this.organizationService.getCurrentOrganization();
  }

  ngOnInit() {
    this.user$.subscribe(user => {
      if (user) {
        this.userOrganizations = user.organizations || [];
      }
    });
  }

  async switchOrganization(orgId: string) {
    await this.authService.switchOrganization(orgId).toPromise();
    await this.organizationService.switchOrganization(orgId).toPromise();
    // Close popover if open
    this.popoverController.dismiss();
    // Reload the page to refresh all data
    window.location.reload();
  }

  createOrganization() {
    this.popoverController.dismiss();
    this.router.navigate(['/organization/create']);
  }

  manageOrganization() {
    this.popoverController.dismiss();
    this.router.navigate(['/organization/settings']);
  }
}
