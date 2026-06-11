// cache.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY = 'cache:key';
export const CACHE_TTL = 'cache:ttl';
export const CACHE_INVALIDATE = 'cache:invalidate';

/**
 * Cache the response of a GET endpoint.
 *
 * @param key   - Unique prefix for the cache group (e.g. 'courses', 'admin:stats')
 * @param ttl   - Time to live in seconds (default: 60)
 *
 * @example
 * @Get()
 * @Cacheable('courses', 120)
 * listCourses() { ... }
 */
export const Cacheable = (key: string, ttl = 60) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY, key)(target, propertyKey, descriptor);
    SetMetadata(CACHE_TTL, ttl)(target, propertyKey, descriptor);
  };
};

/**
 * Invalidate cache groups when a mutation endpoint is called.
 *
 * @param keys - Array of cache group prefixes to invalidate
 *
 * @example
 * @Post()
 * @InvalidatesCache(['courses'])
 * createCourse() { ... }
 */
export const InvalidatesCache = (keys: string[]) =>
  SetMetadata(CACHE_INVALIDATE, keys);
