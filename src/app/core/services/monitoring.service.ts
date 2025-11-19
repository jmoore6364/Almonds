import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, interval } from 'rxjs';
import { map, delay } from 'rxjs/operators';

import {
  HealthCheck,
  HealthCheckResult,
  UptimeMetrics,
  ServiceStatus,
  MonitoringDashboard,
  CreateHealthCheckDto,
  HealthCheckType,
  HealthStatus,
  TimePeriod,
  UptimeIncident,
  ResourceMetrics,
  MetricTimeSeries,
  DataPoint
} from '@core/models/monitoring.model';
import { AuthService } from './auth.service';
import { ResourceService } from './resource.service';

@Injectable({
  providedIn: 'root'
})
export class MonitoringService {
  private healthChecksSubject = new BehaviorSubject<HealthCheck[]>([]);
  private allHealthChecksSubject = new BehaviorSubject<HealthCheck[]>([]);
  private healthCheckResultsSubject = new BehaviorSubject<HealthCheckResult[]>([]);
  private uptimeIncidentsSubject = new BehaviorSubject<UptimeIncident[]>([]);

  healthChecks$: Observable<HealthCheck[]>;
  healthCheckResults$: Observable<HealthCheckResult[]>;

  constructor(
    private authService: AuthService,
    private resourceService: ResourceService
  ) {
    // Filter health checks by current organization
    this.healthChecks$ = combineLatest([
      this.allHealthChecksSubject.asObservable(),
      this.authService.getCurrentOrganization()
    ]).pipe(
      map(([checks, currentOrg]) => {
        if (!currentOrg) return [];
        return checks.filter(c => c.organizationId === currentOrg.id);
      })
    );

    this.healthCheckResults$ = this.healthCheckResultsSubject.asObservable();

    this.initializeMockData();
    this.startHealthCheckMonitoring();
  }

  private initializeMockData(): void {
    const mockHealthChecks: HealthCheck[] = [
      {
        id: 'hc-1',
        organizationId: 'org-1',
        resourceId: 'res-1',
        name: 'Production API Health',
        type: HealthCheckType.HTTPS,
        endpoint: 'https://api.example.com/health',
        interval: 5,
        timeout: 10,
        enabled: true,
        status: HealthStatus.HEALTHY,
        lastCheck: new Date(Date.now() - 5 * 60 * 1000),
        nextCheck: new Date(Date.now() + 5 * 60 * 1000),
        consecutiveFailures: 0,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'hc-2',
        organizationId: 'org-1',
        resourceId: 'res-2',
        name: 'Database Connection',
        type: HealthCheckType.DATABASE,
        interval: 10,
        timeout: 15,
        enabled: true,
        status: HealthStatus.HEALTHY,
        lastCheck: new Date(Date.now() - 10 * 60 * 1000),
        nextCheck: new Date(Date.now() + 5 * 60 * 1000),
        consecutiveFailures: 0,
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'hc-3',
        organizationId: 'org-1',
        resourceId: 'res-3',
        name: 'Static Site Availability',
        type: HealthCheckType.HTTPS,
        endpoint: 'https://www.example.com',
        interval: 15,
        timeout: 10,
        enabled: true,
        status: HealthStatus.DEGRADED,
        lastCheck: new Date(Date.now() - 15 * 60 * 1000),
        nextCheck: new Date(Date.now()),
        consecutiveFailures: 1,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      }
    ];

    const mockResults: HealthCheckResult[] = [
      {
        id: 'result-1',
        healthCheckId: 'hc-1',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        status: HealthStatus.HEALTHY,
        responseTime: 145,
        statusCode: 200
      },
      {
        id: 'result-2',
        healthCheckId: 'hc-2',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        status: HealthStatus.HEALTHY,
        responseTime: 52
      },
      {
        id: 'result-3',
        healthCheckId: 'hc-3',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        status: HealthStatus.DEGRADED,
        responseTime: 2340,
        statusCode: 200
      }
    ];

    this.allHealthChecksSubject.next(mockHealthChecks);
    this.healthCheckResultsSubject.next(mockResults);
  }

  private startHealthCheckMonitoring(): void {
    // Run health checks every minute
    interval(60 * 1000).subscribe(() => {
      this.runHealthChecks();
    });
  }

  private runHealthChecks(): void {
    // In production, this would actually perform health checks
    // For now, this is a mock implementation
    console.log('Running health checks...');
  }

  getHealthChecks(): Observable<HealthCheck[]> {
    return this.healthChecks$;
  }

  getHealthCheckById(id: string): Observable<HealthCheck | undefined> {
    return this.healthChecks$.pipe(
      map(checks => checks.find(c => c.id === id))
    );
  }

  getHealthChecksByResource(resourceId: string): Observable<HealthCheck[]> {
    return this.healthChecks$.pipe(
      map(checks => checks.filter(c => c.resourceId === resourceId))
    );
  }

  createHealthCheck(dto: CreateHealthCheckDto): Observable<HealthCheck> {
    return this.authService.getCurrentOrganization().pipe(
      map(currentOrg => {
        const newCheck: HealthCheck = {
          id: `hc-${Date.now()}`,
          organizationId: currentOrg.id,
          resourceId: dto.resourceId,
          name: dto.name,
          type: dto.type,
          endpoint: dto.endpoint,
          interval: dto.interval,
          timeout: dto.timeout,
          enabled: dto.enabled !== undefined ? dto.enabled : true,
          status: HealthStatus.UNKNOWN,
          consecutiveFailures: 0,
          createdAt: new Date(),
          nextCheck: new Date(Date.now() + dto.interval * 60 * 1000)
        };

        const current = this.allHealthChecksSubject.value;
        this.allHealthChecksSubject.next([...current, newCheck]);

        return newCheck;
      }),
      delay(500)
    );
  }

  updateHealthCheck(id: string, updates: Partial<HealthCheck>): Observable<HealthCheck> {
    const current = this.allHealthChecksSubject.value;
    const index = current.findIndex(c => c.id === id);

    if (index === -1) {
      throw new Error('Health check not found');
    }

    const updated = { ...current[index], ...updates };
    current[index] = updated;
    this.allHealthChecksSubject.next([...current]);

    return new Observable(observer => {
      setTimeout(() => {
        observer.next(updated);
        observer.complete();
      }, 500);
    });
  }

  deleteHealthCheck(id: string): Observable<boolean> {
    const current = this.allHealthChecksSubject.value;
    const filtered = current.filter(c => c.id !== id);
    this.allHealthChecksSubject.next(filtered);

    return new Observable(observer => {
      setTimeout(() => {
        observer.next(true);
        observer.complete();
      }, 500);
    });
  }

  toggleHealthCheck(id: string): Observable<HealthCheck> {
    const current = this.allHealthChecksSubject.value;
    const check = current.find(c => c.id === id);

    if (!check) {
      throw new Error('Health check not found');
    }

    return this.updateHealthCheck(id, { enabled: !check.enabled });
  }

  getUptimeMetrics(resourceId: string, period: TimePeriod): Observable<UptimeMetrics> {
    return combineLatest([
      this.healthChecks$,
      this.healthCheckResults$
    ]).pipe(
      map(([checks, results]) => {
        const resourceChecks = checks.filter(c => c.resourceId === resourceId);
        const checkIds = resourceChecks.map(c => c.id);
        const relevantResults = results.filter(r => checkIds.includes(r.healthCheckId));

        const totalChecks = relevantResults.length;
        const successfulChecks = relevantResults.filter(r => r.status === HealthStatus.HEALTHY).length;
        const failedChecks = totalChecks - successfulChecks;

        const uptime = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100;
        const avgResponseTime = relevantResults.reduce((sum, r) => sum + r.responseTime, 0) / totalChecks || 0;

        return {
          resourceId,
          period,
          uptime,
          downtime: failedChecks * 5, // Assuming 5 minutes per check
          totalChecks,
          successfulChecks,
          failedChecks,
          averageResponseTime: avgResponseTime,
          incidents: []
        };
      }),
      delay(500)
    );
  }

  getServiceStatus(resourceId: string): Observable<ServiceStatus> {
    return combineLatest([
      this.resourceService.getResourceById(resourceId),
      this.getHealthChecksByResource(resourceId),
      this.getUptimeMetrics(resourceId, TimePeriod.DAY),
      this.getUptimeMetrics(resourceId, TimePeriod.WEEK),
      this.getUptimeMetrics(resourceId, TimePeriod.MONTH)
    ]).pipe(
      map(([resource, checks, day, week, month]) => {
        if (!resource) {
          throw new Error('Resource not found');
        }

        const currentStatus = checks.length > 0
          ? checks[0].status
          : HealthStatus.UNKNOWN;

        return {
          organizationId: resource.organizationId,
          resourceId: resource.id,
          resourceName: resource.name,
          provider: resource.provider,
          currentStatus,
          uptime24h: day.uptime,
          uptime7d: week.uptime,
          uptime30d: month.uptime,
          activeHealthChecks: checks.filter(c => c.enabled).length,
          lastChecked: checks.length > 0 ? checks[0].lastCheck : undefined
        };
      })
    );
  }

  getMonitoringDashboard(): Observable<MonitoringDashboard> {
    return combineLatest([
      this.authService.getCurrentOrganization(),
      this.resourceService.getAllResources(),
      this.healthChecks$,
      this.uptimeIncidentsSubject.asObservable()
    ]).pipe(
      map(([currentOrg, resources, checks, incidents]) => {
        const orgResources = resources.filter(r => r.organizationId === currentOrg.id);
        const healthyCount = checks.filter(c => c.status === HealthStatus.HEALTHY).length;
        const degradedCount = checks.filter(c => c.status === HealthStatus.DEGRADED).length;
        const unhealthyCount = checks.filter(c => c.status === HealthStatus.UNHEALTHY).length;

        const activeIncidents = incidents.filter(i => !i.resolved);
        const resolvedToday = incidents.filter(i =>
          i.resolved &&
          i.endTime &&
          i.endTime > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );

        const avgUptime = checks.length > 0
          ? (healthyCount / checks.length) * 100
          : 100;

        return {
          organizationId: currentOrg.id,
          totalServices: checks.length,
          healthyServices: healthyCount,
          degradedServices: degradedCount,
          unhealthyServices: unhealthyCount,
          activeIncidents: activeIncidents.length,
          resolvedIncidentsToday: resolvedToday.length,
          averageUptime: avgUptime,
          averageResponseTime: 0, // Would be calculated from actual results
          topIncidents: activeIncidents.slice(0, 5),
          serviceStatuses: []
        };
      }),
      delay(500)
    );
  }

  getResourceMetrics(resourceId: string, period: TimePeriod): Observable<ResourceMetrics> {
    // Generate mock time series data
    const now = Date.now();
    const dataPoints: DataPoint[] = [];
    const numPoints = period === TimePeriod.DAY ? 24 : period === TimePeriod.WEEK ? 7 : 30;

    for (let i = numPoints; i >= 0; i--) {
      const timestamp = new Date(now - i * 60 * 60 * 1000);
      dataPoints.push({
        timestamp,
        value: Math.random() * 100
      });
    }

    const createTimeSeries = (name: string, unit: string, multiplier: number = 1): MetricTimeSeries => {
      const points = dataPoints.map(p => ({
        timestamp: p.timestamp,
        value: p.value * multiplier
      }));

      const values = points.map(p => p.value);

      return {
        name,
        unit,
        dataPoints: points,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    };

    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          resourceId,
          period,
          metrics: {
            cpu: createTimeSeries('CPU Usage', '%', 1),
            memory: createTimeSeries('Memory Usage', '%', 0.8),
            disk: createTimeSeries('Disk Usage', '%', 0.6),
            network: createTimeSeries('Network Traffic', 'Mbps', 5),
            requests: createTimeSeries('Requests', 'req/s', 100),
            errors: createTimeSeries('Errors', 'count', 2),
            latency: createTimeSeries('Latency', 'ms', 50)
          }
        });
        observer.complete();
      }, 500);
    });
  }
}
