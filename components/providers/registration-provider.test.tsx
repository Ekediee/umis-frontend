import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegistrationProvider, useRegistration } from './registration-provider';
import { getClassGroupsAction, getCoursesAction } from '@/app/actions/registration';
import { getOfflineDraft } from '@/lib/offline-storage';

// Mock the modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@/app/actions/registration', () => ({
  getClassGroupsAction: vi.fn(),
  getCoursesAction: vi.fn(),
}));

vi.mock('@/lib/offline-storage', () => ({
  getOfflineDraft: vi.fn(),
  saveOfflineDraft: vi.fn(),
  clearOfflineDraft: vi.fn(),
  OFFLINE_COURSE_CART_KEY: 'offline-course-cart',
}));

// Test consumer component
function TestConsumer() {
  const {
    currentStep,
    totalSteps,
    handleNext,
    handlePrevious,
    selectedGroup,
    setSelectedGroup,
    selectedCourseIds,
    toggleCourse,
    totalUnits,
    isNextDisabled,
  } = useRegistration();

  return (
    <div>
      <div data-testid="current-step">{currentStep}</div>
      <div data-testid="total-steps">{totalSteps}</div>
      <div data-testid="selected-group">{selectedGroup || 'none'}</div>
      <div data-testid="selected-courses">{selectedCourseIds.join(',')}</div>
      <div data-testid="total-units">{totalUnits}</div>
      <div data-testid="is-next-disabled">{isNextDisabled ? 'yes' : 'no'}</div>
      <button data-testid="next-btn" onClick={handleNext}>Next</button>
      <button data-testid="prev-btn" onClick={handlePrevious}>Previous</button>
      <button data-testid="select-group-btn" onClick={() => setSelectedGroup('group-1')}>Select Group 1</button>
      <button data-testid="toggle-course-btn" onClick={() => toggleCourse('course-1')}>Toggle Course 1</button>
    </div>
  );
}

describe('RegistrationProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getClassGroupsAction).mockResolvedValue({
      data: [
        { id: 'group-1', name: 'Group 1' },
        { id: 'group-2', name: 'Group 2' },
      ],
      hasMany: true,
    });
    vi.mocked(getCoursesAction).mockResolvedValue({
      data: {
        studentType: 'Undergraduate',
        courses: [
          { id: 'course-1', code: 'CS101', title: 'Intro', units: 3, lecturer: 'Dr. A', level: '100L' },
          { id: 'course-2', code: 'CS102', title: 'OOP', units: 4, lecturer: 'Dr. B', level: '100L' },
        ],
      },
    });
    vi.mocked(getOfflineDraft).mockResolvedValue(undefined);
  });

  it('renders with initial values and fetches class groups', async () => {
    render(
      <RegistrationProvider>
        <TestConsumer />
      </RegistrationProvider>
    );

    expect(screen.getByTestId('current-step').textContent).toBe('1');
    expect(screen.getByTestId('total-steps').textContent).toBe('4');
    expect(screen.getByTestId('selected-group').textContent).toBe('none');
    expect(screen.getByTestId('is-next-disabled').textContent).toBe('yes');

    await waitFor(() => {
      expect(getClassGroupsAction).toHaveBeenCalledTimes(1);
    });
  });

  it('handles class group selection and fetches courses', async () => {
    render(
      <RegistrationProvider>
        <TestConsumer />
      </RegistrationProvider>
    );

    fireEvent.click(screen.getByTestId('select-group-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('selected-group').textContent).toBe('group-1');
      expect(getCoursesAction).toHaveBeenCalledWith('group-1');
    });
  });

  it('allows navigation and selection toggle', async () => {
    render(
      <RegistrationProvider>
        <TestConsumer />
      </RegistrationProvider>
    );

    // Select group first to enable "Next"
    fireEvent.click(screen.getByTestId('select-group-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('is-next-disabled').textContent).toBe('no');
    });

    // Advance to step 2
    fireEvent.click(screen.getByTestId('next-btn'));
    expect(screen.getByTestId('current-step').textContent).toBe('2');

    // Next is disabled initially in step 2 (no courses selected)
    expect(screen.getByTestId('is-next-disabled').textContent).toBe('yes');

    // Toggle course 1 selection
    fireEvent.click(screen.getByTestId('toggle-course-btn'));
    expect(screen.getByTestId('selected-courses').textContent).toBe('course-1');

    // Next should now be enabled
    expect(screen.getByTestId('is-next-disabled').textContent).toBe('no');

    // Go back to step 1
    fireEvent.click(screen.getByTestId('prev-btn'));
    expect(screen.getByTestId('current-step').textContent).toBe('1');
  });

  it('restores draft state if found in offline storage', async () => {
    vi.mocked(getOfflineDraft).mockResolvedValue({
      group: 'group-2',
      courses: ['course-2'],
    });

    render(
      <RegistrationProvider>
        <TestConsumer />
      </RegistrationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('selected-group').textContent).toBe('group-2');
      expect(screen.getByTestId('selected-courses').textContent).toBe('course-2');
    });
  });
});
