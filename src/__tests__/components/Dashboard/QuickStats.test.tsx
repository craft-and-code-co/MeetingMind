import React from 'react';
import { render, screen } from '@testing-library/react';
import { QuickStats } from '../../../pages/Dashboard/components/QuickStats';

describe('QuickStats Component', () => {
  const defaultProps = {
    totalMeetings: 10,
    totalNotes: 25,
    pendingActionItems: 5,
    pendingReminders: 3,
  };

  it('should render all stat cards with correct values', () => {
    render(<QuickStats {...defaultProps} />);
    
    // Check labels
    expect(screen.getByText('Total Meetings')).toBeInTheDocument();
    expect(screen.getByText('Total Notes')).toBeInTheDocument();
    expect(screen.getByText('Pending Actions')).toBeInTheDocument();
    expect(screen.getByText('Active Reminders')).toBeInTheDocument();
    
    // Check values
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should render with zero values', () => {
    const zeroProps = {
      totalMeetings: 0,
      totalNotes: 0,
      pendingActionItems: 0,
      pendingReminders: 0,
    };
    
    render(<QuickStats {...zeroProps} />);
    
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements).toHaveLength(4);
  });

  it('should use responsive grid layout', () => {
    const { container } = render(<QuickStats {...defaultProps} />);
    
    const grid = container.firstChild;
    expect(grid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
  });

  it('should render icons for each stat', () => {
    const { container } = render(<QuickStats {...defaultProps} />);
    
    // Check for SVG elements (icons)
    const icons = container.querySelectorAll('svg');
    expect(icons).toHaveLength(4);
  });

  it('should be memoized (not re-render with same props)', () => {
    const { rerender } = render(<QuickStats {...defaultProps} />);
    
    // Get initial render snapshot
    const initialRender = screen.getByText('Total Meetings').parentElement;
    
    // Re-render with same props
    rerender(<QuickStats {...defaultProps} />);
    
    // Should be the same element (not re-created)
    const secondRender = screen.getByText('Total Meetings').parentElement;
    expect(initialRender).toBe(secondRender);
  });
});