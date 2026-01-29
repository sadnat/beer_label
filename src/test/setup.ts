import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';

// ============================================
// localStorage Mock
// ============================================
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    // Helper for tests to access the store
    __getStore: () => store,
    __setStore: (newStore: Record<string, string>) => {
      store = newStore;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// ============================================
// Fetch Mock
// ============================================
interface MockFetchOptions {
  status?: number;
  ok?: boolean;
  headers?: Record<string, string>;
}

interface MockFetchCall {
  url: string;
  options?: RequestInit;
}

const fetchMockState = {
  calls: [] as MockFetchCall[],
  responses: [] as { body: unknown; options: MockFetchOptions }[],
};

export const mockFetch = (body: unknown, options: MockFetchOptions = {}) => {
  const { status = 200, ok = true, headers = {} } = options;

  fetchMockState.responses.push({ body, options: { status, ok, headers } });

  global.fetch = vi.fn().mockImplementation((url: string, requestOptions?: RequestInit) => {
    fetchMockState.calls.push({ url, options: requestOptions });

    const response = fetchMockState.responses.shift();
    if (!response) {
      return Promise.reject(new Error('No mock response configured'));
    }

    return Promise.resolve({
      ok: response.options.ok ?? true,
      status: response.options.status ?? 200,
      headers: new Headers(response.options.headers),
      json: () => Promise.resolve(response.body),
      text: () => Promise.resolve(JSON.stringify(response.body)),
    });
  });
};

export const mockFetchOnce = (body: unknown, options: MockFetchOptions = {}) => {
  const { status = 200, ok = true, headers = {} } = options;

  (global.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
    (url: string, requestOptions?: RequestInit) => {
      fetchMockState.calls.push({ url, options: requestOptions });

      return Promise.resolve({
        ok,
        status,
        headers: new Headers(headers),
        json: () => Promise.resolve(body),
        text: () => Promise.resolve(JSON.stringify(body)),
      });
    }
  );
};

export const mockFetchError = (errorMessage: string = 'Network error') => {
  global.fetch = vi.fn().mockRejectedValue(new Error(errorMessage));
};

export const getFetchCalls = () => fetchMockState.calls;

export const clearFetchMock = () => {
  fetchMockState.calls = [];
  fetchMockState.responses = [];
};

export const resetFetchMock = () => {
  clearFetchMock();
  global.fetch = vi.fn();
};

// Default fetch mock
global.fetch = vi.fn();

// ============================================
// ResizeObserver Mock
// ============================================
class ResizeObserverMock {
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  // Helper to trigger the callback
  trigger(entries: ResizeObserverEntry[]) {
    this.callback(entries, this);
  }
}

global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// ============================================
// Canvas Mock
// ============================================
const createCanvasContextMock = () => ({
  canvas: document.createElement('canvas'),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: 'start' as CanvasTextAlign,
  textBaseline: 'alphabetic' as CanvasTextBaseline,
  globalAlpha: 1,
  globalCompositeOperation: 'source-over' as GlobalCompositeOperation,

  // Drawing methods
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  clearRect: vi.fn(),

  // Path methods
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  arcTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  rect: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  clip: vi.fn(),

  // Text methods
  fillText: vi.fn(),
  strokeText: vi.fn(),
  measureText: vi.fn(() => ({
    width: 100,
    actualBoundingBoxAscent: 10,
    actualBoundingBoxDescent: 2,
    actualBoundingBoxLeft: 0,
    actualBoundingBoxRight: 100,
    fontBoundingBoxAscent: 12,
    fontBoundingBoxDescent: 3,
  })),

  // Image methods
  drawImage: vi.fn(),
  createImageData: vi.fn(() => ({
    width: 100,
    height: 100,
    data: new Uint8ClampedArray(100 * 100 * 4),
    colorSpace: 'srgb' as PredefinedColorSpace,
  })),
  getImageData: vi.fn(() => ({
    width: 100,
    height: 100,
    data: new Uint8ClampedArray(100 * 100 * 4),
    colorSpace: 'srgb' as PredefinedColorSpace,
  })),
  putImageData: vi.fn(),

  // Transform methods
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  translate: vi.fn(),
  transform: vi.fn(),
  setTransform: vi.fn(),
  resetTransform: vi.fn(),

  // Gradient and pattern
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  createPattern: vi.fn(() => null),

  // Other
  isPointInPath: vi.fn(() => false),
  isPointInStroke: vi.fn(() => false),
  getLineDash: vi.fn(() => []),
  setLineDash: vi.fn(),
});

HTMLCanvasElement.prototype.getContext = vi.fn(function(this: HTMLCanvasElement, contextId: string) {
  if (contextId === '2d') {
    return createCanvasContextMock() as unknown as CanvasRenderingContext2D;
  }
  return null;
}) as unknown as typeof HTMLCanvasElement.prototype.getContext;

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mockdata');
HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
  callback(new Blob(['mock'], { type: 'image/png' }));
});

// ============================================
// Intersection Observer Mock
// ============================================
class IntersectionObserverMock {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor() {}

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

global.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;

// ============================================
// matchMedia Mock
// ============================================
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ============================================
// URL Mock
// ============================================
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

URL.createObjectURL = vi.fn(() => 'blob:mock-url');
URL.revokeObjectURL = vi.fn();

// ============================================
// Console Error Suppression (optional)
// ============================================
const originalConsoleError = console.error;

// Suppress specific React errors in tests
const suppressedErrors = [
  'Warning: ReactDOM.render',
  'Warning: An update to',
];

console.error = (...args: unknown[]) => {
  const message = args[0];
  if (typeof message === 'string' && suppressedErrors.some(e => message.includes(e))) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// ============================================
// Test Lifecycle Hooks
// ============================================
beforeEach(() => {
  // Reset localStorage before each test
  localStorageMock.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  // Clean up after each test
  clearFetchMock();
});

// ============================================
// Type Declarations for Test Helpers
// ============================================
declare global {
  function mockFetch(body: unknown, options?: MockFetchOptions): void;
  function mockFetchOnce(body: unknown, options?: MockFetchOptions): void;
  function mockFetchError(errorMessage?: string): void;
  function getFetchCalls(): MockFetchCall[];
  function clearFetchMock(): void;
  function resetFetchMock(): void;
}
