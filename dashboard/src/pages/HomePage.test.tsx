/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import HomePage from './HomePage';

// Mock document before rendering the component
beforeEach(() => {
  window.addEventListener = jest.fn();
  window.removeEventListener = jest.fn();
  document.addEventListener = jest.fn();
});

test('renders HomePage component', () => {
  render(<HomePage />);
});
