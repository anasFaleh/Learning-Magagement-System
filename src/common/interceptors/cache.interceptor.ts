// cache.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of, tap } from 'rxjs';
import {
  CACHE_KEY,
  CACHE_TTL,
  CACHE_INVALIDATE,
} from '../decorators/cache.decorator';

// In-memory cache store — replace with Redis adapter in production
// Map<cacheKey, { data, expiresAt }>
const cacheStore = new Map<string, { data: any; expiresAt: number }>();

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Only cache GET requests
    if (request.method !== 'GET') {
      // On mutation (POST/PATCH/DELETE), check if we should invalidate a cache group
      const invalidateKeys = this.reflector.getAllAndOverride<string[]>(
        CACHE_INVALIDATE,
        [context.getHandler(), context.getClass()],
      );
      if (invalidateKeys?.length) {
        this.invalidateByGroup(invalidateKeys);
      }
      return next.handle();
    }

    const customKey = this.reflector.getAllAndOverride<string>(CACHE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const ttl = this.reflector.getAllAndOverride<number>(CACHE_TTL, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Cacheable decorator → skip caching
    if (!customKey) return next.handle();

    // Build full cache key: base key + query string (for paginated/filtered endpoints)
    const queryString = new URLSearchParams(request.query ?? {}).toString();
    const userId = request.user?.userId ?? 'anon';
    const cacheKey = `${customKey}:${userId}:${queryString}`;

    // Check cache hit
    const cached = cacheStore.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return of(cached.data);
    }

    // Cache miss — call handler and store result
    const ttlMs = (ttl ?? 60) * 1000;
    return next.handle().pipe(
      tap((data) => {
        cacheStore.set(cacheKey, { data, expiresAt: Date.now() + ttlMs });
        this.logger.debug(`Cache SET: ${cacheKey} (TTL: ${ttl ?? 60}s)`);
      }),
    );
  }

  private invalidateByGroup(groups: string[]) {
    let count = 0;
    for (const key of cacheStore.keys()) {
      if (groups.some((g) => key.startsWith(g))) {
        cacheStore.delete(key);
        count++;
      }
    }
    if (count > 0) {
      this.logger.debug(
        `Cache INVALIDATED ${count} entries for groups: ${groups.join(', ')}`,
      );
    }
  }
}
