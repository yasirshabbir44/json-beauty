import { TestBed } from '@angular/core/testing';
import { LazyJsonParserService } from './lazy-json-parser.service';
import { firstValueFrom } from 'rxjs';

describe('LazyJsonParserService', () => {
  let service: LazyJsonParserService;
  
  // Sample JSON data for testing
  const smallJson = JSON.stringify({ name: 'Test', value: 123 });
  const largeJson = JSON.stringify(Array(1000).fill(0).map((_, i) => ({ id: i, name: `Item ${i}` })));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LazyJsonParserService]
    });
    service = TestBed.inject(LazyJsonParserService);
    
    // Override the size threshold for testing
    (service as any).SIZE_THRESHOLD = 1000;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  
  it('should determine if JSON should be parsed lazily based on size', () => {
    expect(service.shouldParseLazily(smallJson)).toBeFalse();
    expect(service.shouldParseLazily(largeJson)).toBeTrue();
  });
  
  it('should parse small JSON synchronously', async () => {
    const result = await firstValueFrom(service.parseLazily(smallJson));
    expect(result).toEqual(JSON.parse(smallJson));
  });
  
  it('should parse large JSON asynchronously', async () => {
    const result = await firstValueFrom(service.parseLazily(largeJson));
    expect(result).toEqual(JSON.parse(largeJson));
  });
  
  it('should get value at specific path', async () => {
    const json = JSON.stringify({
      user: {
        name: 'John',
        address: {
          city: 'New York'
        }
      },
      items: [1, 2, 3]
    });
    
    const userName = await firstValueFrom(service.getValueAtPath(json, 'user.name'));
    expect(userName).toEqual('John');
    
    const city = await firstValueFrom(service.getValueAtPath(json, 'user.address.city'));
    expect(city).toEqual('New York');
    
    const secondItem = await firstValueFrom(service.getValueAtPath(json, 'items[1]'));
    expect(secondItem).toEqual(2);
  });
  
  it('should paginate arrays correctly', () => {
    const array = Array(100).fill(0).map((_, i) => ({ id: i }));
    
    // Test default pagination
    const result1 = service.paginateArray(array);
    expect(result1.items.length).toBe(100);
    expect(result1.totalItems).toBe(100);
    expect(result1.pageIndex).toBe(0);
    expect(result1.pageSize).toBe(100);
    expect(result1.totalPages).toBe(1);
    
    // Test custom page size
    const result2 = service.paginateArray(array, 10);
    expect(result2.items.length).toBe(10);
    expect(result2.totalItems).toBe(100);
    expect(result2.pageIndex).toBe(0);
    expect(result2.pageSize).toBe(10);
    expect(result2.totalPages).toBe(10);
    
    // Test custom page index
    const result3 = service.paginateArray(array, 10, 5);
    expect(result3.items.length).toBe(10);
    expect(result3.items[0].id).toBe(50);
    expect(result3.totalItems).toBe(100);
    expect(result3.pageIndex).toBe(5);
    expect(result3.pageSize).toBe(10);
    expect(result3.totalPages).toBe(10);
  });
  
  it('should create lazy loading proxy for objects', () => {
    const obj = {
      name: 'Test',
      nested: {
        value: 123
      },
      items: [1, 2, 3]
    };
    
    const proxy = service.createLazyLoadingProxy(obj);
    
    // Test basic property access
    expect(proxy.name).toEqual('Test');
    
    // Test nested property access
    expect(proxy.nested.value).toEqual(123);
    
    // Test array access
    expect(proxy.items[1]).toEqual(2);
    expect(proxy.items.length).toEqual(3);
  });
});