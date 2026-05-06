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

describe('DocumentPreviewPage Component', () => {
  it('renders standard document header and action buttons correctly', () => {
    render(<DocumentPreviewPage />);
    
    // Check Top Controls
    expect(screen.getByText('Document Preview')).toBeDefined();
    expect(screen.getByRole('button', { name: /Back/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Download PDF/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Print Document/i })).toBeDefined();

    // Check inner document content
    expect(screen.getByText('YAKUBU ONOME JOY')).toBeDefined();
    expect(screen.getByText('2018/2019 FIRST SEMESTER RESULTS')).toBeDefined();
    expect(screen.getByText('B.Sc (Hons.) COMPUTER SCIENCE')).toBeDefined();

    // Verify some specific data rendering
    expect(screen.getByText('Leadership Skills')).toBeDefined();
    expect(screen.getByText('GEDS 280')).toBeDefined();
    
    expect(screen.getAllByText('Students Industrial Work Experience SIWES').length).toBeGreaterThan(0);
  });
});
