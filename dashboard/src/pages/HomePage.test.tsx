import { render } from '@testing-library/react';
import HomePage from './HomePage';

// Mock document before rendering the component
beforeEach(() => {
  Object.defineProperty(global, 'document', {
    value: {
      documentElement: {
        classList: {
          toggle: jest.fn(),
        },
      },
    },
    writable: true,
  });
});

test('renders HomePage component', () => {
  render(<HomePage />);
});
