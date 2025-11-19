import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, ModalController } from '@ionic/angular';
import { Observable } from 'rxjs';

import { OrganizationService } from '@core/services/organization.service';
import { AuthService } from '@core/services/auth.service';
import {
  OrganizationMember,
  OrganizationInvitation,
  MemberRole
} from '@core/models/organization.model';

@Component({
  selector: 'app-team-members',
  templateUrl: './team-members.page.html',
  styleUrls: ['./team-members.page.scss']
})
export class TeamMembersPage implements OnInit {
  members$?: Observable<OrganizationMember[]>;
  invitations$?: Observable<OrganizationInvitation[]>;
  currentOrgId: string = '';
  currentUserRole?: MemberRole;

  showInviteForm = false;
  inviteForm: FormGroup;
  isInviting = false;

  roles = [
    { value: MemberRole.OWNER, label: 'Owner', description: 'Full control of organization' },
    { value: MemberRole.ADMIN, label: 'Admin', description: 'Manage resources and members' },
    { value: MemberRole.DEVELOPER, label: 'Developer', description: 'Manage resources' },
    { value: MemberRole.VIEWER, label: 'Viewer', description: 'View only access' },
    { value: MemberRole.BILLING, label: 'Billing', description: 'Manage billing only' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private organizationService: OrganizationService,
    private authService: AuthService,
    private alertController: AlertController
  ) {
    this.inviteForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      role: [MemberRole.DEVELOPER, Validators.required],
      message: ['']
    });
  }

  ngOnInit() {
    this.authService.getCurrentOrganization().subscribe(currentOrg => {
      if (currentOrg) {
        this.currentOrgId = currentOrg.id;
        this.currentUserRole = currentOrg.role;
        this.members$ = this.organizationService.getMembers(currentOrg.id);
        this.invitations$ = this.organizationService.getInvitations(currentOrg.id);
      }
    });
  }

  toggleInviteForm() {
    this.showInviteForm = !this.showInviteForm;
    if (!this.showInviteForm) {
      this.inviteForm.reset({ role: MemberRole.DEVELOPER });
    }
  }

  async inviteMember() {
    if (this.inviteForm.valid) {
      this.isInviting = true;

      this.organizationService.inviteMember(this.currentOrgId, this.inviteForm.value).subscribe({
        next: async () => {
          this.isInviting = false;
          this.toggleInviteForm();

          const alert = await this.alertController.create({
            header: 'Invitation Sent',
            message: `An invitation has been sent to ${this.inviteForm.value.email}`,
            buttons: ['OK']
          });
          await alert.present();
        },
        error: async (error) => {
          this.isInviting = false;
          const alert = await this.alertController.create({
            header: 'Error',
            message: error.message || 'Failed to send invitation',
            buttons: ['OK']
          });
          await alert.present();
        }
      });
    }
  }

  async updateMemberRole(member: OrganizationMember) {
    const alert = await this.alertController.create({
      header: 'Update Role',
      message: `Change role for ${member.name}`,
      inputs: this.roles.map(role => ({
        type: 'radio',
        label: role.label,
        value: role.value,
        checked: role.value === member.role
      })),
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Update',
          handler: (selectedRole) => {
            if (selectedRole && selectedRole !== member.role) {
              this.organizationService.updateMemberRole(
                this.currentOrgId,
                member.id,
                { role: selectedRole }
              ).subscribe();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async removeMember(member: OrganizationMember) {
    const alert = await this.alertController.create({
      header: 'Remove Member',
      message: `Are you sure you want to remove ${member.name} from this organization?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            this.organizationService.removeMember(this.currentOrgId, member.id).subscribe();
          }
        }
      ]
    });

    await alert.present();
  }

  async cancelInvitation(invitation: OrganizationInvitation) {
    const alert = await this.alertController.create({
      header: 'Cancel Invitation',
      message: `Cancel invitation to ${invitation.email}?`,
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Yes',
          handler: () => {
            this.organizationService.cancelInvitation(invitation.id).subscribe();
          }
        }
      ]
    });

    await alert.present();
  }

  getRoleColor(role: MemberRole): string {
    const colors: { [key in MemberRole]: string } = {
      [MemberRole.OWNER]: 'danger',
      [MemberRole.ADMIN]: 'warning',
      [MemberRole.DEVELOPER]: 'primary',
      [MemberRole.VIEWER]: 'medium',
      [MemberRole.BILLING]: 'tertiary'
    };
    return colors[role];
  }

  canManageMembers(): boolean {
    return this.currentUserRole === MemberRole.OWNER ||
           this.currentUserRole === MemberRole.ADMIN;
  }
}
