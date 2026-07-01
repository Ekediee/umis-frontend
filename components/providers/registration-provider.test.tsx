import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegistrationProvider, useRegistration } from './registration-provider';
import { getClassGroupsAction, getCoursesAction, getWorshipCentersAction } from '@/app/actions/registration';
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
  getWorshipCentersAction: vi.fn(),
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
    selectedGroups,
    toggleGroup,
    selectedCourseIds,
    toggleCourse,
    totalUnits,
    isNextDisabled,
  } = useRegistration();

  return (
    <div>
      <div data-testid="current-step">{currentStep}</div>
      <div data-testid="total-steps">{totalSteps}</div>
      <div data-testid="selected-groups">{selectedGroups.join(',') || 'none'}</div>
      <div data-testid="selected-courses">{selectedCourseIds.join(',')}</div>
      <div data-testid="total-units">{totalUnits}</div>
      <div data-testid="is-next-disabled">{isNextDisabled ? 'yes' : 'no'}</div>
      <button data-testid="next-btn" onClick={handleNext}>Next</button>
      <button data-testid="prev-btn" onClick={handlePrevious}>Previous</button>
      <button data-testid="toggle-group-1-btn" onClick={() => toggleGroup('group-1')}>Toggle Group 1</button>
      <button data-testid="toggle-group-2-btn" onClick={() => toggleGroup('group-2')}>Toggle Group 2</button>
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
        rawCourses: [],
      },
    });
    vi.mocked(getOfflineDraft).mockResolvedValue(undefined);
    vi.mocked(getWorshipCentersAction).mockResolvedValue({
      data: [
        { id: 'worship-1', name: 'Worship Center 1', location: 'Loc 1', pastor: 'Pastor A', declaredCapacity: 100, spacesLeft: 50 },
      ]
    });
  });

  it('renders with initial values and fetches class groups', async () => {
    render(
      <RegistrationProvider>
        <TestConsumer />
      </RegistrationProvider>
    );

    expect(screen.getByTestId('current-step').textContent).toBe('1');
    expect(screen.getByTestId('total-steps').textContent).toBe('4');
    expect(screen.getByTestId('selected-groups').textContent).toBe('none');
    expect(screen.getByTestId('is-next-disabled').textContent).toBe('yes');

    await waitFor(() => {
      expect(getClassGroupsAction).toHaveBeenCalledTimes(1);
    });
  });

  it('toggles a single class group on and off', async () => {
    render(
      <RegistrationProvider>
        <TestConsumer />
      </RegistrationProvider>
    );

    // Toggle group 1 on
    fireEvent.click(screen.getByTestId('toggle-group-1-btn'));
    expect(screen.getByTestId('selected-groups').textContent).toBe('group-1');
    expect(screen.getByTestId('is-next-disabled').textContent).toBe('no');

    // Toggle group 1 off
    fireEvent.click(screen.getByTestId('toggle-group-1-btn'));
    expect(screen.getByTestId('selected-groups').textContent).toBe('none');
    expect(screen.getByTestId('is-next-disabled').textContent).toBe('yes');
  });

  it('allows selecting multiple class groups simultaneously', async () => {
    render(
      <RegistrationProvider>
        <TestConsumer />
      </RegistrationProvider>
    );

    fireEvent.click(screen.getByTestId('toggle-group-1-btn'));
    fireEvent.click(screen.getByTestId('toggle-group-2-btn'));

    expect(screen.getByTestId('selected-groups').textContent).toBe('group-1,group-2');
    expect(screen.getByTestId('is-next-disabled').textContent).toBe('no');
  });

  it('fetches courses for all selected groups when Next is clicked on step 1', async () => {
    render(
      <RegistrationProvider>
        <TestConsumer />
      </RegistrationProvider>
    );

    // Select two groups
    fireEvent.click(screen.getByTestId('toggle-group-1-btn'));
    fireEvent.click(screen.getByTestId('toggle-group-2-btn'));

    // Click Next — should trigger course fetch with both IDs
    fireEvent.click(screen.getByTestId('next-btn'));

    await waitFor(() => {
      expect(getCoursesAction).toHaveBeenCalledWith(['group-1', 'group-2']);
      expect(screen.getByTestId('current-step').textContent).toBe('2');
    });
  });

  it('stays on step 1 if the course fetch fails', async () => {
    vi.mocked(getCoursesAction).mockResolvedValue({ error: 'Server error' });

    render(
      <RegistrationProvider>
        <TestConsumer />
      </RegistrationProvider>
    );

    fireEvent.click(screen.getByTestId('toggle-group-1-btn'));
    fireEvent.click(screen.getByTestId('next-btn'));

    await waitFor(() => {
      expect(getCoursesAction).toHaveBeenCalledWith(['group-1']);
      // Step should NOT have advanced
      expect(screen.getByTestId('current-step').textContent).toBe('1');
    });
  });

  it('allows navigation and course selection toggle', async () => {
    render(
      <RegistrationProvider>
        <TestConsumer />
      </RegistrationProvider>
    );

    // Select a group to enable Next
    fireEvent.click(screen.getByTestId('toggle-group-1-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('is-next-disabled').textContent).toBe('no');
    });

    // Advance to step 2
    fireEvent.click(screen.getByTestId('next-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('current-step').textContent).toBe('2');
    });

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

  it('restores draft state (multiple groups) from offline storage', async () => {
    vi.mocked(getOfflineDraft).mockResolvedValue({
      groups: ['group-1', 'group-2'],
      courses: ['course-2'],
    });

    render(
      <RegistrationProvider>
        <TestConsumer />
      </RegistrationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('selected-groups').textContent).toBe('group-1,group-2');
      expect(screen.getByTestId('selected-courses').textContent).toBe('course-2');
    });
  });
});
