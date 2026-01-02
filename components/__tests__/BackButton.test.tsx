import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BackButton from '../BackButton';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('BackButton', () => {
  it('should render the back button', () => {
    const mockRouter = {
      back: jest.fn(),
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    render(<BackButton />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('<');
  });

  it('should call router.back() when clicked', () => {
    const mockBack = jest.fn();
    const mockRouter = {
      back: mockBack,
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    render(<BackButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('should have correct styling classes', () => {
    const mockRouter = {
      back: jest.fn(),
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    render(<BackButton />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-200', 'rounded-md', 'shadow');
  });
});

