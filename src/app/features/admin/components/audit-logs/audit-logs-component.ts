import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AdminService,
  AuditLogSliceResponse,
  AuditLogResponse,
  PageResponse,
} from '@core/services/admin/admin-service';
import {
  Subject,
  debounceTime,
  takeUntil,
} from 'rxjs';

type AuditLogApiResponse =
  | AuditLogSliceResponse
  | PageResponse<AuditLogResponse>
  | AuditLogResponse[]
  | {
      content?: unknown;
      data?: unknown;
      page?: unknown;
      size?: unknown;
      hasNext?: unknown;
      hasPrevious?: unknown;
      last?: unknown;
      first?: unknown;
      numberOfElements?: unknown;
      totalElements?: unknown;
    };

type AuditLogRecord = Record<string, unknown>;

@Component({
  selector: 'app-audit-logs-component',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
  ],
  templateUrl: './audit-logs-component.html',
  styleUrl: './audit-logs-component.css',
})
export class AuditLogsComponent implements OnInit, OnDestroy {
  private readonly adminService = inject(AdminService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);
  private readonly destroy$ = new Subject<void>();
  private readonly filterChanges$ = new Subject<void>();
  private requestId = 0;

  readonly sizeOptions = [10, 15, 25, 50];
  readonly quickActions = [
    '',
    'FETCH_SUCCESS',
    'UPDATE_SUCCESS',
    'UPLOAD_SUCCESS',
    'DELETE_SUCCESS',
    'FAILED',
  ];

  logs: AuditLogResponse[] = [];
  search = '';
  username = '';
  action = '';
  entityType = '';
  startDate = '';
  endDate = '';
  page = 0;
  size = 15;
  hasNext = false;
  hasPrevious = false;
  numberOfElements = 0;
  loading = false;
  error = '';
  loadedAt: Date | null = null;

  ngOnInit(): void {
    this.filterChanges$
      .pipe(
        debounceTime(350),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.loadLogs(0));

    this.loadLogs(0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLogs(page = this.page): void {
    const currentRequestId = ++this.requestId;
    this.page = Math.max(page, 0);
    this.loading = true;
    this.error = '';
    this.changeDetector.detectChanges();

    this.adminService
      .getAuditLogSlice(
        this.page,
        this.size,
        {
          username: this.username,
          action: this.normalizedActionFilter(),
          entityType: this.entityType,
          search: this.search,
          startDate: this.toStartInstant(this.startDate),
          endDate: this.toEndInstant(this.endDate),
        },
      )
      .pipe(
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (response) => {
          this.zone.run(() => {
            if (currentRequestId !== this.requestId) {
              return;
            }

            const normalized = this.normalizeResponse(response);
            this.logs = normalized.content;
            this.page = normalized.page;
            this.size = normalized.size;
            this.numberOfElements = normalized.numberOfElements;
            this.hasNext = normalized.hasNext;
            this.hasPrevious = normalized.hasPrevious;
            this.loadedAt = new Date();
            this.loading = false;
            this.changeDetector.detectChanges();
          });
        },
        error: (error) => {
          this.zone.run(() => {
            if (currentRequestId !== this.requestId) {
              return;
            }

            this.logs = [];
            this.numberOfElements = 0;
            this.hasNext = false;
            this.hasPrevious = this.page > 0;
            this.loading = false;
            this.error =
              error?.error?.message ??
              error?.message ??
              'Failed to load audit logs.';
            this.changeDetector.detectChanges();
          });
        },
      });
  }

  onFilterChange(): void {
    this.filterChanges$.next();
  }

  refresh(): void {
    this.loadLogs(this.page);
  }

  searchNow(): void {
    this.loadLogs(0);
  }

  resetFilters(): void {
    this.search = '';
    this.username = '';
    this.action = '';
    this.entityType = '';
    this.startDate = '';
    this.endDate = '';
    this.loadLogs(0);
  }

  previousPage(): void {
    if (!this.hasPrevious || this.loading) {
      return;
    }

    this.loadLogs(this.page - 1);
  }

  nextPage(): void {
    if (!this.hasNext || this.loading) {
      return;
    }

    this.loadLogs(this.page + 1);
  }

  onSizeChange(): void {
    this.loadLogs(0);
  }

  trackLog(index: number, log: AuditLogResponse): string {
    return `${log.id ?? 'row'}-${log.createdAt ?? index}-${index}`;
  }

  statusClass(status: string | null | undefined): string {
    return (status ?? '').toLowerCase();
  }

  actionLabel(action: string | null | undefined): string {
    return action?.replace(/_/g, ' ') ?? '-';
  }

  entityLabel(log: AuditLogResponse): string {
    const entity = log.entityType || 'System';
    return log.entityId == null ? entity : `${entity} #${log.entityId}`;
  }

  get hasActiveFilters(): boolean {
    return Boolean(
      this.search ||
      this.username ||
      this.action ||
      this.entityType ||
      this.startDate ||
      this.endDate,
    );
  }

  get activeFilterCount(): number {
    return [
      this.search,
      this.username,
      this.action,
      this.entityType,
      this.startDate,
      this.endDate,
    ].filter(Boolean).length;
  }

  get rangeLabel(): string {
    if (!this.logs.length) {
      return `Page ${this.page + 1}`;
    }

    const start = this.page * this.size + 1;
    const end = start + this.logs.length - 1;
    return `${start}-${end}`;
  }

  get successCount(): number {
    return this.logs.filter(
      (log) => this.statusClass(log.status) === 'success',
    ).length;
  }

  get failedCount(): number {
    return this.logs.filter(
      (log) => this.statusClass(log.status) === 'failed',
    ).length;
  }

  get slowCount(): number {
    return this.logs.filter(
      (log) => (log.executionTimeMs ?? 0) >= 1000,
    ).length;
  }

  private normalizedActionFilter(): string {
    return this.action;
  }

  private toStartInstant(value: string): string | undefined {
    return value ? new Date(`${value}T00:00:00`).toISOString() : undefined;
  }

  private toEndInstant(value: string): string | undefined {
    return value ? new Date(`${value}T23:59:59`).toISOString() : undefined;
  }

  private normalizeResponse(response: AuditLogApiResponse) {
    const root = this.asRecord(response);
    const data = this.asRecord(root['data']);
    const rawContent =
      Array.isArray(response)
        ? response
        : this.arrayFrom(root['content']) ??
          this.arrayFrom(data['content']) ??
          this.arrayFrom(root['data']) ??
          [];
    const content = rawContent
      .map((item, index) => this.normalizeLog(item, index))
      .filter((item): item is AuditLogResponse => item !== null);
    const page = this.toNumber(root['page'] ?? data['page'], this.page);
    const size = this.toNumber(root['size'] ?? data['size'], this.size);
    const numberOfElements = this.toNumber(
      root['numberOfElements'] ?? data['numberOfElements'],
      content.length,
    );
    const last = this.toBoolean(root['last'] ?? data['last'], false);

    return {
      content,
      page,
      size,
      numberOfElements,
      hasNext: this.toBoolean(root['hasNext'] ?? data['hasNext'], !last && content.length >= size),
      hasPrevious: this.toBoolean(root['hasPrevious'] ?? data['hasPrevious'], page > 0),
    };
  }

  private normalizeLog(value: unknown, index: number): AuditLogResponse | null {
    const log = this.asRecord(value);

    if (!Object.keys(log).length) {
      return null;
    }

    const action = this.toText(log['action'] ?? log['action_name']);
    const status = this.toText(log['status']) || this.resolveStatus(action);

    return {
      id: this.toNumber(log['id'] ?? log['auditLogId'] ?? log['audit_log_id'], index),
      userId: this.nullableNumber(log['userId'] ?? log['user_id']),
      username: this.toNullableText(log['username']),
      entityType: this.toNullableText(log['entityType'] ?? log['entity_type']),
      entityId: this.nullableNumber(log['entityId'] ?? log['entity_id']),
      action,
      ipAddress: this.toNullableText(log['ipAddress'] ?? log['ip_address']),
      userAgent: this.toNullableText(log['userAgent'] ?? log['user_agent']),
      requestMethod: this.toNullableText(log['requestMethod'] ?? log['request_method']),
      requestPath: this.toNullableText(log['requestPath'] ?? log['request_path']),
      executionTimeMs: this.nullableNumber(log['executionTimeMs'] ?? log['execution_time_ms']),
      status,
      createdAt: this.toText(log['createdAt'] ?? log['created_at'] ?? new Date().toISOString()),
    };
  }

  private asRecord(value: unknown): AuditLogRecord {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as AuditLogRecord
      : {};
  }

  private arrayFrom(value: unknown): unknown[] | null {
    return Array.isArray(value) ? value : null;
  }

  private toNumber(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private nullableNumber(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toText(value: unknown): string {
    return value == null ? '' : String(value);
  }

  private toNullableText(value: unknown): string | null {
    const text = this.toText(value).trim();
    return text || null;
  }

  private toBoolean(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback;
  }

  private resolveStatus(action: string | null | undefined): string {
    if (!action) {
      return 'UNKNOWN';
    }

    if (action.endsWith('_SUCCESS')) {
      return 'SUCCESS';
    }

    if (action.endsWith('_FAILED')) {
      return 'FAILED';
    }

    return 'RECORDED';
  }
}
