import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { ClinicalTrackersPage } from '@/pages/admin/clinical-trackers';

describe('ClinicalTrackers Smoke Test', () => {
  it('loads the clinical trackers page without crashing', async () => {
    renderWithProviders(<ClinicalTrackersPage />);
    
    // Check for the page title
    expect(screen.getByText('Clinical Trackers')).toBeInTheDocument();
    
    // Check for a few tracker cards
    expect(screen.getByText('Sleep Quality')).toBeInTheDocument();
    expect(screen.getByText('Bowel Amounts')).toBeInTheDocument();
    expect(screen.getByText('Hygiene Support Levels')).toBeInTheDocument();
  });
});
