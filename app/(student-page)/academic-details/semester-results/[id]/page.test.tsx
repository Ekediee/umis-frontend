import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SemesterResultDetailPage from './page';

// Mock navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: vi.fn(),
  }),
  usePathname: () => '/academic-details/semester-results/1',
  useParams: () => ({
    id: "2018%2F2019.1",
  })
}));

vi.mock('@/app/actions/academic-details', () => ({
  getAcademicResultsAction: vi.fn().mockResolvedValue({
    data: [
      {
        semester: '2018/2019.1',
        total_credit_unit: 22,
        semester_gpa: 3.52,
        semester_level: 100,
        session: '2018/2019',
        courses: [
          { course_code: 'CSC 101', course_title: 'Introduction to Computer Science', unit: 3, score: 95, grade: 'A', remark: 'Superior' },
        ],
      },
    ],
  }),
}));

describe('SemesterResultDetailPage Component', () => {
  it('renders semester identifier correctly', () => {
    render(<SemesterResultDetailPage />);
    
    // Check Top Controls
    expect(screen.getByText('Semester Result')).toBeDefined();
    expect(screen.getByText('2018/2019.1')).toBeDefined();
    expect(screen.getByRole('button', { name: /Export Result/i })).toBeDefined();

    // Check that there is a back button
    expect(screen.getByRole('button', { name: /Back/i })).toBeDefined();
  });
});
