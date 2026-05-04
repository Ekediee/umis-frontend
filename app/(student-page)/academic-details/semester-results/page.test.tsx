import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SemesterResultsPage from './page';

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: vi.fn(),
  }),
}));

describe('SemesterResultsPage Component', () => {
  it('renders summary cards and semester results listed correctly', () => {
    render(<SemesterResultsPage />);
    
    // Check Top Summary Cards
    expect(screen.getByText('CGPA')).toBeDefined();
    expect(screen.getByText('3.67')).toBeDefined();
    
    expect(screen.getAllByText('Semester GPA').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3.52').length).toBeGreaterThan(0);

    expect(screen.getByText('Study Level')).toBeDefined();
    expect(screen.getAllByText('200').length).toBeGreaterThan(0);

    // Check specific rows
    expect(screen.getByText('2018/2019.1')).toBeDefined();
    expect(screen.getByText('2019/2020.2')).toBeDefined();

    // Check that there is a back button
    expect(screen.getByRole('button', { name: /Back/i })).toBeDefined();

    // Check that there are view buttons for the semester rows
    const viewButtons = screen.getAllByRole('button', { name: /View/i });
    expect(viewButtons.length).toBeGreaterThan(0);
  });
});
