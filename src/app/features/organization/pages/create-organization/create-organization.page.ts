import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, switchMap } from 'rxjs/operators';

import { OrganizationService } from '@core/services/organization.service';
import { OrganizationPlan } from '@core/models/organization.model';

@Component({
  selector: 'app-create-organization',
  templateUrl: './create-organization.page.html',
  styleUrls: ['./create-organization.page.scss']
})
export class CreateOrganizationPage implements OnInit {
  createForm: FormGroup;
  isLoading = false;
  slugAvailable = false;
  checkingSlug = false;
  errorMessage = '';

  plans = [
    { value: OrganizationPlan.FREE, label: 'Free', description: 'Perfect for individuals and small teams' },
    { value: OrganizationPlan.STARTER, label: 'Starter', description: 'For growing teams' },
    { value: OrganizationPlan.PROFESSIONAL, label: 'Professional', description: 'For professional teams' },
    { value: OrganizationPlan.ENTERPRISE, label: 'Enterprise', description: 'For large organizations' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private organizationService: OrganizationService
  ) {
    this.createForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      description: [''],
      plan: [OrganizationPlan.FREE, Validators.required]
    });
  }

  ngOnInit() {
    // Auto-generate slug from name
    this.createForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.createForm.get('slug')?.touched) {
        const slug = this.generateSlug(name);
        this.createForm.patchValue({ slug }, { emitEvent: false });
      }
    });

    // Check slug availability
    this.createForm.get('slug')?.valueChanges.pipe(
      debounceTime(500),
      switchMap(slug => {
        this.checkingSlug = true;
        return this.organizationService.checkSlugAvailability(slug);
      })
    ).subscribe({
      next: (available) => {
        this.slugAvailable = available;
        this.checkingSlug = false;
      },
      error: () => {
        this.checkingSlug = false;
      }
    });
  }

  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }

  onSubmit() {
    if (this.createForm.valid && this.slugAvailable) {
      this.isLoading = true;
      this.errorMessage = '';

      this.organizationService.createOrganization(this.createForm.value).subscribe({
        next: (org) => {
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Failed to create organization';
        }
      });
    }
  }

  get name() {
    return this.createForm.get('name');
  }

  get slug() {
    return this.createForm.get('slug');
  }
}
