import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SemesterResultDetailPage from './page';

// Mock navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: vi.fn(),
  }),
  useParams: () => ({
    id: "2018%2F2019.1",
  })
}));

describe('SemesterResultDetailPage Component', () => {
  it('renders semester identifier correctly', () => {
    render(<SemesterResultDetailPage />);
    
    // Check Top Controls
    expect(screen.getByText('Semester Result')).toBeDefined();
    // By matching the decoded string
    expect(screen.getByText('2018/2019.1')).toBeDefined();
    expect(screen.getByText('Semester GPA: 3.52')).toBeDefined();
    expect(screen.getByRole('button', { name: /Export Result/i })).toBeDefined();

    // Check specific specific rows exist
    expect(screen.getAllByText('CSC 101').length).toBeGreaterThan(0);
    expect(screen.getByText('Introduction to Computer Science')).toBeDefined();
    // Score contains 95
    expect(screen.getAllByText('95').length).toBeGreaterThan(0);
    // Grade points
    expect(screen.getByText('12')).toBeDefined();

    // Check that there is a back button
    expect(screen.getByRole('button', { name: /Back/i })).toBeDefined();
  });
});
