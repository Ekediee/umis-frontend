import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DocumentPreviewPage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: vi.fn(),
  }),
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
          { course_code: 'GEDS 280', course_title: 'Leadership Skills', unit: 3, score: 85, grade: 'A', remark: 'Superior' },
        ],
      },
    ],
  }),
}));

vi.mock('@/contexts/user-data-context', () => ({
  useUserData: () => ({
    user_data: {
      student_name: 'YAKUBU ONOME JOY',
      degree_name: 'B.Sc (Hons.) COMPUTER SCIENCE',
    },
  }),
}));

describe('DocumentPreviewPage Component', () => {
  it('renders standard document header and action buttons correctly', () => {
    render(<DocumentPreviewPage />);
    
    // Check Top Controls
    expect(screen.getByText('Document Preview')).toBeDefined();
    expect(screen.getByRole('button', { name: /Back/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Download PDF/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Print Document/i })).toBeDefined();
  });
});
