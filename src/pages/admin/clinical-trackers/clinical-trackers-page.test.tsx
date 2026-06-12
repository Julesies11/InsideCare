import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { ClinicalTrackersPage } from './clinical-trackers-page';

describe('ClinicalTrackersPage', () => {
  it('renders all 13 tracker categories', () => {
    renderWithProviders(<ClinicalTrackersPage />);

    expect(screen.getByText('Sleep Quality')).toBeInTheDocument();
    expect(screen.getByText('Sleep Types')).toBeInTheDocument();
    expect(screen.getByText('Behaviour Intensity')).toBeInTheDocument();
    expect(screen.getByText('Nutrition Meal Types')).toBeInTheDocument();
    expect(screen.getByText('Nutrition Intake')).toBeInTheDocument();
    expect(screen.getByText('MTM Diet Types')).toBeInTheDocument();
    expect(screen.getByText('MTM Fluids Consistency')).toBeInTheDocument();
    expect(screen.getByText('MTM Meal Intake')).toBeInTheDocument();
    expect(screen.getByText('MTM Fluid Intake')).toBeInTheDocument();
    expect(screen.getByText('MTM Swallowing Concerns')).toBeInTheDocument();
    expect(screen.getByText('Hygiene Support Levels')).toBeInTheDocument();
    expect(screen.getByText('Bowel Amounts')).toBeInTheDocument();
    expect(screen.getByText('Bowel Assistance')).toBeInTheDocument();
  });
});
