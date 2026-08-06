import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SemesterResultsPage from './page';

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: vi.fn(),
  }),
  usePathname: () => '/academic-details/semester-results',
}));

vi.mock('@/app/actions/academic-details', () => ({
  getAcademicResultsAction: vi.fn().mockResolvedValue({
    data: [
      {
        semester: '2018/2019.1',
        total_credit_unit: 22,
        semester_gpa: 3.45,
        semester_level: 100,
        session: '2018/2019',
        courses: [],
      },
      {
        semester: '2019/2020.2',
        total_credit_unit: 21,
        semester_gpa: 3.52,
        semester_level: 200,
        session: '2019/2020',
        courses: [],
      },
    ],
  }),
}));

vi.mock('@/contexts/user-data-context', () => ({
  useUserData: () => ({
    user_data: {
      cummulative_gpa: 3.67,
      current_level: 200,
      academic_information: {
        cummulative_gpa: 3.67,
        study_level: 200,
      },
    },
  }),
}));

describe('SemesterResultsPage Component', () => {
  it('renders summary cards and semester results listed correctly', async () => {
    render(<SemesterResultsPage />);
    
    // Check Top Summary Cards
    expect(screen.getByText('CGPA')).toBeDefined();
    expect(screen.getByText('3.67')).toBeDefined();
    
    expect(screen.getAllByText('Semester GPA').length).toBeGreaterThan(0);

    expect(screen.getByText('Study Level')).toBeDefined();

    // Check that there is a back button
    expect(screen.getByRole('button', { name: /Back/i })).toBeDefined();
  });
});
