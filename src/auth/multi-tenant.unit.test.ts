import { describe, expect, it } from 'vitest';

export interface UserAppMetadata {
  organisation_id?: string;
  active_organisation_id?: string;
  organisations?: Array<{ id: string; name: string; slug: string }>;
  staff_id?: string;
  role_id?: string;
  is_admin?: boolean;
}

export function getActiveOrganisationId(metadata?: UserAppMetadata | null): string {
  const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';
  if (!metadata) return DEFAULT_ORG_ID;
  return metadata.active_organisation_id || metadata.organisation_id || DEFAULT_ORG_ID;
}

export function isMasterItemVisibleForTenant(
  itemOrganisationId: string | null | undefined,
  activeOrganisationId: string,
): boolean {
  // Global items (organisation_id IS NULL) are visible to all tenants
  if (!itemOrganisationId) return true;
  // Tenant-specific items are visible only to the active tenant
  return itemOrganisationId === activeOrganisationId;
}

describe('Multi-Tenant Context & JWT Claims Logic', () => {
  const PRIMARY_ORG_ID = '00000000-0000-0000-0000-000000000001';
  const SECONDARY_ORG_ID = '11111111-2222-3333-4444-555555555555';

  it('extracts active_organisation_id when explicitly set', () => {
    const metadata: UserAppMetadata = {
      active_organisation_id: SECONDARY_ORG_ID,
      organisation_id: PRIMARY_ORG_ID,
    };
    expect(getActiveOrganisationId(metadata)).toBe(SECONDARY_ORG_ID);
  });

  it('falls back to organisation_id when active_organisation_id is missing', () => {
    const metadata: UserAppMetadata = {
      organisation_id: PRIMARY_ORG_ID,
    };
    expect(getActiveOrganisationId(metadata)).toBe(PRIMARY_ORG_ID);
  });

  it('falls back to default Primary Care Organisation UUID when metadata is empty or null', () => {
    expect(getActiveOrganisationId(null)).toBe(PRIMARY_ORG_ID);
    expect(getActiveOrganisationId({})).toBe(PRIMARY_ORG_ID);
  });

  it('correctly parses multi-organisation memberships array', () => {
    const metadata: UserAppMetadata = {
      organisations: [
        { id: PRIMARY_ORG_ID, name: 'Primary Care', slug: 'primary-care' },
        { id: SECONDARY_ORG_ID, name: 'Secondary Care', slug: 'secondary-care' },
      ],
    };
    expect(metadata.organisations).toHaveLength(2);
    expect(metadata.organisations?.[0].slug).toBe('primary-care');
    expect(metadata.organisations?.[1].slug).toBe('secondary-care');
  });

  it('evaluates hybrid master list visibility rules correctly', () => {
    // Global item (null org_id) -> Visible to any org
    expect(isMasterItemVisibleForTenant(null, PRIMARY_ORG_ID)).toBe(true);
    expect(isMasterItemVisibleForTenant(null, SECONDARY_ORG_ID)).toBe(true);

    // Primary Org item -> Visible ONLY to Primary Org
    expect(isMasterItemVisibleForTenant(PRIMARY_ORG_ID, PRIMARY_ORG_ID)).toBe(true);
    expect(isMasterItemVisibleForTenant(PRIMARY_ORG_ID, SECONDARY_ORG_ID)).toBe(false);

    // Secondary Org item -> Visible ONLY to Secondary Org
    expect(isMasterItemVisibleForTenant(SECONDARY_ORG_ID, SECONDARY_ORG_ID)).toBe(true);
    expect(isMasterItemVisibleForTenant(SECONDARY_ORG_ID, PRIMARY_ORG_ID)).toBe(false);
  });
});
