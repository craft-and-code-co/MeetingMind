# Testing Infrastructure

This directory contains the comprehensive test suite for the MeetingMind application.

## Test Structure

```
__tests__/
├── components/          # Unit tests for React components
├── services/           # Unit tests for service classes
├── utils/             # Unit tests for utility functions
├── pages/             # Unit tests for page components
├── hooks/             # Unit tests for custom React hooks
├── integration/       # Integration tests for workflows
├── mocks/            # Mock implementations
└── test-utils.tsx    # Testing utilities and custom render
```

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode (no watch, with coverage)
npm run test:ci

# Run specific test file
npm test -- QuickStats

# Run tests matching pattern
npm test -- --testNamePattern="should validate"
```

## Writing Tests

### Component Tests
```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Service Tests
```typescript
import { MyService } from '../services/MyService';

describe('MyService', () => {
  let service: MyService;
  
  beforeEach(() => {
    service = new MyService();
  });
  
  it('should perform operation', async () => {
    const result = await service.doSomething();
    expect(result).toBe('expected');
  });
});
```

### Integration Tests
```typescript
import { render, screen, fireEvent, waitFor } from '../test-utils';
import { Dashboard } from '../pages/Dashboard';

describe('Dashboard Integration', () => {
  it('should complete workflow', async () => {
    render(<Dashboard />);
    
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });
});
```

## Mocking

### Electron API
The Electron API is automatically mocked in `setupTests.ts`. Access the mock:
```typescript
const { mockElectronAPI } = require('../mocks/electronAPI');
mockElectronAPI.getApiKey.mockResolvedValue('test-key');
```

### Media Devices
Audio recording is mocked automatically. Control recording:
```typescript
const { mockGetUserMedia } = require('../mocks/mediaDevices');
mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));
```

## Best Practices

1. **Use test-utils for rendering**: Always import render from test-utils.tsx
2. **Mock external dependencies**: Mock API calls, Electron APIs, etc.
3. **Test user interactions**: Focus on how users interact with the app
4. **Avoid implementation details**: Test behavior, not implementation
5. **Use meaningful test names**: Describe what the test verifies
6. **Keep tests focused**: One assertion per test when possible
7. **Use beforeEach for setup**: Reset state between tests
8. **Test error cases**: Include tests for error handling

## Coverage Goals

- Statements: 70%
- Branches: 70%
- Functions: 70%
- Lines: 70%

Run `npm run test:coverage` to see current coverage.

## Debugging Tests

1. **Use screen.debug()**: Print the current DOM
   ```typescript
   screen.debug();
   ```

2. **Use prettyDOM()**: Print specific elements
   ```typescript
   import { prettyDOM } from '@testing-library/react';
   console.log(prettyDOM(element));
   ```

3. **Run single test**: Focus on one test
   ```typescript
   it.only('should work', () => {
     // test code
   });
   ```

4. **Skip test**: Temporarily disable
   ```typescript
   it.skip('should work later', () => {
     // test code
   });
   ```

## Common Issues

### "Can't perform a React state update on an unmounted component"
Use `waitFor` or `act` to ensure async operations complete:
```typescript
await waitFor(() => {
  expect(screen.getByText('Done')).toBeInTheDocument();
});
```

### "Element type is invalid"
Check your imports - use named exports where appropriate:
```typescript
// Wrong
import Dashboard from '../pages/Dashboard';

// Correct
import { Dashboard } from '../pages/Dashboard';
```

### Tests timing out
Increase timeout for slow operations:
```typescript
it('should complete', async () => {
  // test code
}, 10000); // 10 second timeout
```