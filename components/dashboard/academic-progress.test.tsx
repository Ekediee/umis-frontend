import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AcademicProgress } from './academic-progress';

describe('AcademicProgress Component Visibility', () => {
  it('renders initial GPA values correctly', () => {
    render(<AcademicProgress />);
    expect(screen.getByText('3.67')).toBeDefined();
    expect(screen.getByText('3.52')).toBeDefined();
  });

  it('toggles CGPA visibility when the first eye icon is clicked', () => {
    const { container } = render(<AcademicProgress />);
    const buttons = container.querySelectorAll('button');
    const cgpaEyeIconBtn = buttons[0]; 

    // Values are visible initially
    expect(screen.getByText('3.67')).toBeDefined();

    // Hide CGPA
    fireEvent.click(cgpaEyeIconBtn);
    expect(screen.queryByText('3.67')).toBeNull();
    
    // Shows asterisks
    expect(screen.getAllByText('****').length).toBeGreaterThanOrEqual(1);

    // Show CGPA again
    fireEvent.click(cgpaEyeIconBtn);
    expect(screen.getByText('3.67')).toBeDefined();
  });

  it('toggles Semester GPA visibility when the second eye icon is clicked', () => {
    const { container } = render(<AcademicProgress />);
    const buttons = container.querySelectorAll('button');
    const semesterGpaEyeIconBtn = buttons[1];

    // Values are visible initially
    expect(screen.getByText('3.52')).toBeDefined();

    // Hide Semester GPA
    fireEvent.click(semesterGpaEyeIconBtn);
    expect(screen.queryByText('3.52')).toBeNull();

    // Show Semester GPA again
    fireEvent.click(semesterGpaEyeIconBtn);
    expect(screen.getByText('3.52')).toBeDefined();
  });
});
