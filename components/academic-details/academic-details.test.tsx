import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AcademicDetailsPage from '@/app/(student-page)/academic-details/page';

describe('AcademicDetailsPage Component', () => {
  it('renders all expected left and right column sections correctly', () => {
    render(<AcademicDetailsPage />);
    
    // Check Left Column Cards
    expect(screen.getByText('Academic Progress')).toBeDefined();
    expect(screen.getByText('Graduation Progress')).toBeDefined();
    expect(screen.getByText('Quick Actions')).toBeDefined();

    // Check Right Column Cards
    expect(screen.getByText('Quick Info')).toBeDefined();
    expect(screen.getByText('Current Semester Registration')).toBeDefined();
    expect(screen.getByText('Academic Alerts & Insight')).toBeDefined();
  });
});
