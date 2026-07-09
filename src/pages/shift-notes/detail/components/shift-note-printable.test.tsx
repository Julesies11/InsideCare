import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShiftNotePrintable } from './shift-note-printable';

describe('ShiftNotePrintable Component', () => {
  const mockNote = {
    id: 'note-123',
    start_date: '2026-07-09',
    shift_start_time: '08:00:00',
    shift_end_time: '16:00:00',
    general_notes: 'Did normal tasks.',
    participant: {
      participant_name: 'John Doe',
      track_bowel: true,
      track_sleep: true,
      track_mtm: true,
      track_behaviour: true,
    },
    staff: {
      staff_name: 'Jane Staff',
    },
    house: {
      house_name: 'St Kilda House',
    },
    // Bowel
    bowel_movement_occurred: true,
    bowel_time: '10:30:00',
    bowel_bristol_scale: 4,
    bowel_amount: { name: 'Normal' },
    bowel_assistance: { name: 'Independent' },
    bowel_notes: 'No concerns.',
    // Behaviour
    behaviour_observed: true,
    behaviour_type: 'Agitation',
    behaviour_intensity: { name: 'Moderate' },
    behaviour_notes: 'Paced around 2 PM.',
    // Sleep Records
    sleep_occurred: true,
    sleep_records: [
      {
        id: 'sleep-1',
        sleep_start_time: '22:00:00',
        sleep_wake_time: '01:00:00',
        sleep_type: { name: 'Active Sleep' },
        sleep_quality: { name: 'Restless' },
        sleep_support_required: 'Yes',
      },
      {
        id: 'sleep-2',
        sleep_start_time: '03:00:00',
        sleep_wake_time: '06:00:00',
        sleep_type: { name: 'Quiet Sleep' },
        sleep_quality: { name: 'Good' },
        sleep_support_required: 'No',
      },
    ],
    // MTM Mealtime
    mtm_meal_provided: true,
    mtm_diet_type: { name: 'Pureed' },
    mtm_fluids: { name: 'Level 100 Thickened' },
    mtm_texture_correct: true,
    mtm_consistency_correct: true,
    mtm_positioning_appropriate: true,
    mtm_supervision_required: false,
    mtm_swallowing_concerns: { name: 'None' },
    mtm_meal_intake: { name: '75%' },
    mtm_meal_intake_notes: 'Ate well.',
    mtm_notes: 'Very cooperative.',
  };

  it('renders core metadata correctly', () => {
    render(<ShiftNotePrintable note={mockNote} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Staff')).toBeInTheDocument();
    expect(screen.getByText('St Kilda House')).toBeInTheDocument();
    expect(screen.getByText('09 Jul 2026')).toBeInTheDocument();
  });

  it('renders bowel tracking details correctly', () => {
    render(<ShiftNotePrintable note={mockNote} />);

    expect(screen.getByText('Bowel Movement Logged')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(screen.getByText('Independent')).toBeInTheDocument();
    expect(screen.getByText('No concerns.')).toBeInTheDocument();
  });

  it('renders behaviour tracking details with text behaviour type correctly', () => {
    render(<ShiftNotePrintable note={mockNote} />);

    expect(screen.getByText('Behaviour of Concern Observed')).toBeInTheDocument();
    expect(screen.getByText('Agitation')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
    expect(screen.getByText('Paced around 2 PM.')).toBeInTheDocument();
  });

  it('renders multiple sleep records correctly', () => {
    render(<ShiftNotePrintable note={mockNote} />);

    expect(screen.getByText('Sleep Intervals Recorded')).toBeInTheDocument();
    
    // Check first record
    expect(screen.getByText('22:00')).toBeInTheDocument();
    expect(screen.getByText('01:00')).toBeInTheDocument();
    expect(screen.getByText('Active Sleep')).toBeInTheDocument();
    expect(screen.getByText('Restless')).toBeInTheDocument();
    expect(screen.getAllByText('Yes').length).toBeGreaterThan(0);

    // Check second record
    expect(screen.getByText('03:00')).toBeInTheDocument();
    expect(screen.getByText('06:00')).toBeInTheDocument();
    expect(screen.getByText('Quiet Sleep')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('renders mealtime management tracking details correctly', () => {
    render(<ShiftNotePrintable note={mockNote} />);

    expect(screen.getByText('Mealtime Management Plan (MTMP) Enforcement')).toBeInTheDocument();
    expect(screen.getByText('Pureed')).toBeInTheDocument();
    expect(screen.getByText('Level 100 Thickened')).toBeInTheDocument();
    expect(screen.getByText('Very cooperative.')).toBeInTheDocument();
  });
});
