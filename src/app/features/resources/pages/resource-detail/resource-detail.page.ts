import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { ResourceService } from '@core/services/resource.service';
import { Resource } from '@core/models/resource.model';

@Component({
  selector: 'app-resource-detail',
  templateUrl: './resource-detail.page.html',
  styleUrls: ['./resource-detail.page.scss']
})
export class ResourceDetailPage implements OnInit {
  resourceId: string = '';
  resource$?: Observable<Resource | undefined>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private resourceService: ResourceService
  ) {}

  ngOnInit() {
    this.resourceId = this.route.snapshot.paramMap.get('id') || '';
    if (this.resourceId) {
      this.resource$ = this.resourceService.getResourceById(this.resourceId);
    }
  }

  goBack() {
    this.router.navigate(['/resources']);
  }

  getMetadataEntries(metadata: any): Array<{key: string, value: any}> {
    if (!metadata) return [];
    return Object.entries(metadata).map(([key, value]) => ({ key, value }));
  }

  getTagEntries(tags: any): Array<{key: string, value: any}> {
    if (!tags) return [];
    return Object.entries(tags).map(([key, value]) => ({ key, value }));
  }
}
