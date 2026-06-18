import { describe, it, expect } from 'vitest';
import { mapParticipantToTags } from './participant-tags';
import { mapStaffToTags } from './staff-tags';
import { mapHouseToTags } from './house-tags';
import { flattenMappedArray } from './generator';

describe('Document Template Mappings', () => {
  describe('mapParticipantToTags', () => {
    it('correctly maps direct and computed participant fields', () => {
      const participant = {
        participant_name: 'John Doe',
        date_of_birth: '1990-05-15',
        email: 'john.doe@example.com',
        personal_mobile: '0400 000 000',
        address: '123 Main St, Sydney',
        ndis_number: '430 000 000',
        status: 'active',
        support_coordinator: 'Sarah Smith',
        support_level: 'Standard',
        service_providers: 'Physio Co',
        move_in_date: '2024-01-01',
        current_goals: 'Build independent cooking skills',
        behaviour_of_concern: 'Anxiety pacing',
        pbsp_engaged: true,
        bsp_available: false,
        specialist_name: 'Dr. Watson',
        specialist_phone: '0400 111 222',
        specialist_email: 'watson@example.com',
        restrictive_practices_yn: true,
        restrictive_practices: 'Requires supervision',
        restrictive_practice_details: 'Locked kitchen cupboard',
        restrictive_practice_authorisation: true,
        routine: 'Wake up 7am',
        hygiene_support: 'Verbal prompts',
        mobility_support: 'None',
        meal_prep_support: 'Full prep',
        household_support: 'Heavy cleaning help',
        finance_support: 'Budgeting help',
        health_wellbeing_support: 'Hydration prompts',
        cultural_religious_support: 'Sunday church',
        communication_type: 'Verbal',
        communication_notes: 'Slow speed',
        communication_language_needs: 'English',
        other_support: 'Quiet settings',
        mtmp_required: true,
        mtmp_details: 'Soft diet',
        primary_diagnosis: 'ASD',
        secondary_diagnosis: 'Anxiety',
        allergies: 'Peanuts',
        general_notes: 'History of skin irritation',
        pharmacy_name: 'Chemist A',
        pharmacy_contact: '02 9000 1111',
        pharmacy_location: '12 Chemist Rd',
        gp_name: 'Dr. Lin',
        gp_contact: '02 8000 1111',
        gp_location: '45 GP St',
        psychiatrist_name: 'Dr. Chen',
        psychiatrist_contact: '02 7000 1111',
        psychiatrist_location: '78 Mind Ave',
        medical_routine_other: 'Needs driver',
        medical_routine_general_process: 'Accompanied appts',
        current_medications: 'Panadol 500mg',
        mental_health_plan: 'Crisis plan text',
        medical_plan: 'Diabetes plan text',
        natural_disaster_plan: 'Evac plan text',
        track_bowel: true,
        track_seizure: false,
        track_sleep: true,
        track_behaviour: true,
        track_community: false,
        track_nutrition: false,
        track_mtm: true,
        track_hygiene: false,
        house_name: 'Sunshine House',
        house_phone: '02 6000 1111',
      };

      const result = mapParticipantToTags(participant);

      expect(result.full_name).toBe('John Doe');
      expect(result.first_name).toBe('John');
      expect(result.last_name).toBe('Doe');
      expect(result.date_of_birth).toBe('15/05/1990'); // DD/MM/YYYY en-AU date
      expect(result.email).toBe('john.doe@example.com');
      expect(result.pbsp_engaged).toBe('Yes');
      expect(result.bsp_available).toBe('No');
      expect(result.track_bowel).toBe('Yes');
      expect(result.track_seizure).toBe('No');
    });

    it('correctly maps medications, goals, contacts, and provider child relations', () => {
      const participant = { participant_name: 'Jane Doe' };
      const relatedData = {
        medications: [
          {
            is_active: true,
            dosage: '500mg',
            medication_info: {
              medication_name: 'Paracetamol',
              brand_name: 'Panadol',
              medication_type: {
                medication_type_name: 'Analgesic',
              },
            },
          },
          {
            is_active: false,
            dosage: '10mg',
          },
        ],
        goals: [
          { is_active: true, goal_type: 'NDIS', description: 'Goal 1' },
          { is_active: false, goal_type: 'Personal', description: 'Goal 2' },
        ],
        contacts: [
          {
            is_active: true,
            contact_name: 'Bill Doe',
            phone: '0499 999 999',
            email: 'bill@example.com',
            address: '10 Road St',
            notes: 'Emergency contact',
            contact_type_info: {
              contact_type_name: 'Father',
            },
          },
        ],
        providers: [
          {
            is_active: true,
            provider_name: 'Clinic A',
            company: 'Health Corp',
            provider_type: 'Physio',
            phone: '02 4444 4444',
            email: 'clinic@health.com',
            notes: 'Weekly visits',
          },
        ],
        funding: [
          {
            status: 'Active',
            code: 'F123',
            invoice_recipient: 'Plan Manager',
            end_date: '2026-12-31',
            allocated_amount: 50000,
            used_amount: 20000,
            remaining_amount: 30000,
            notes: 'Yearly package',
            funding_source_info: { funding_source_name: 'NDIS' },
            funding_type_info: { funding_type_name: 'Core' },
          },
        ],
      };

      const result = mapParticipantToTags(participant, relatedData);

      // Verify medications
      expect(result.medications).toHaveLength(1);
      expect(result.medications[0].medication_name).toBe('Paracetamol');
      expect(result.medications[0].brand_name).toBe('Panadol');
      expect(result.medications[0].medication_type).toBe('Analgesic');

      // Verify goals
      expect(result.goals).toHaveLength(1);
      expect(result.goals[0].description).toBe('Goal 1');

      // Verify contacts
      expect(result.contacts).toHaveLength(1);
      expect(result.contacts[0].contact_name).toBe('Bill Doe');
      expect(result.contacts[0].contact_type).toBe('Father');

      // Verify providers (our newly exposed fields)
      expect(result.providers).toHaveLength(1);
      expect(result.providers[0].provider_name).toBe('Clinic A');
      expect(result.providers[0].company).toBe('Health Corp');
      expect(result.providers[0].provider_type).toBe('Physio');
      expect(result.providers[0].phone).toBe('02 4444 4444');
      expect(result.providers[0].email).toBe('clinic@health.com');

      // Verify funding
      expect(result.funding).toHaveLength(1);
      expect(result.funding[0].code).toBe('F123');
      expect(result.funding[0].allocated_amount).toBe('$50,000.00');
    });

    it('correctly flattens participant repeating arrays to numbered index tags', () => {
      const participant = { participant_name: 'Jane Doe' };
      const relatedData = {
        medications: [
          {
            is_active: true,
            dosage: '500mg',
            medication_info: {
              medication_name: 'Paracetamol',
              brand_name: 'Panadol',
              medication_type: { medication_type_name: 'Analgesic' },
            },
          },
        ],
        goals: [
          { is_active: true, goal_type: 'NDIS', description: 'Goal 1' },
        ],
        contacts: [
          {
            is_active: true,
            contact_name: 'Bill Doe',
            phone: '0499 999 999',
            email: 'bill@example.com',
            address: '10 Road St',
            notes: 'Emergency contact',
            contact_type_info: { contact_type_name: 'Father' },
          },
        ],
        providers: [
          {
            is_active: true,
            provider_name: 'Clinic A',
            company: 'Health Corp',
            provider_type: 'Physio',
            phone: '02 4444 4444',
            email: 'clinic@health.com',
            notes: 'Weekly visits',
          },
        ],
        funding: [
          {
            status: 'Active',
            code: 'F123',
            invoice_recipient: 'Plan Manager',
            end_date: '2026-12-31',
            allocated_amount: 50000,
            used_amount: 20000,
            remaining_amount: 30000,
            notes: 'Yearly package',
            funding_source_info: { funding_source_name: 'NDIS' },
            funding_type_info: { funding_type_name: 'Core' },
          },
        ],
      };

      const result = mapParticipantToTags(participant, relatedData);

      // Verify Medication 1 Flat Tags
      expect(result.medication_name1).toBe('Paracetamol');
      expect(result.brand_name1).toBe('Panadol');
      expect(result.dosage1).toBe('500mg');
      expect(result.medication_type1).toBe('Analgesic');

      // Verify Goal 1 Flat Tags
      expect(result.goal_type1).toBe('NDIS');
      expect(result.goal_description1).toBe('Goal 1');

      // Verify Contact 1 Flat Tags
      expect(result.contact_name1).toBe('Bill Doe');
      expect(result.contact_phone1).toBe('0499 999 999');
      expect(result.contact_email1).toBe('bill@example.com');
      expect(result.contact_address1).toBe('10 Road St');
      expect(result.contact_notes1).toBe('Emergency contact');
      expect(result.contact_type1).toBe('Father');

      // Verify Provider 1 Flat Tags
      expect(result.provider_name1).toBe('Clinic A');
      expect(result.provider_company1).toBe('Health Corp');
      expect(result.provider_type1).toBe('Physio');
      expect(result.provider_phone1).toBe('02 4444 4444');
      expect(result.provider_email1).toBe('clinic@health.com');
      expect(result.provider_notes1).toBe('Weekly visits');

      // Verify Funding 1 Flat Tags
      expect(result.funding_source1).toBe('NDIS');
      expect(result.funding_type1).toBe('Core');
      expect(result.funding_code1).toBe('F123');
      expect(result.funding_recipient1).toBe('Plan Manager');
      expect(result.funding_end_date1).toBe('31/12/2026');
      expect(result.funding_allocated_amount1).toBe('$50,000.00');
      expect(result.funding_total_budget1).toBe('$50,000.00');
      expect(result.funding_used_amount1).toBe('$20,000.00');
      expect(result.funding_remaining_amount1).toBe('$30,000.00');
      expect(result.funding_remaining_budget1).toBe('$30,000.00');
      expect(result.funding_notes1).toBe('Yearly package');

      // Verify next indexes do not exist (they should be undefined)
      expect(result.medication_name2).toBeUndefined();
      expect(result.contact_name2).toBeUndefined();
      expect(result.goal_type2).toBeUndefined();
    });
  });

  describe('mapStaffToTags', () => {
    it('correctly maps direct and loop fields for staff', () => {
      const staff = {
        staff_name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '0411 111 111',
        address: '456 Oak St, Melbourne',
        date_of_birth: '1985-10-20',
        status: 'active',
        hire_date: '2024-01-01',
        separation_date: null,
        allergies: 'None',
        hobbies: 'Reading',
        notes: 'Experienced carer',
        availability: 'Weekdays',
        emergency_contact_name: 'Michael Smith',
        emergency_contact_phone: '0422 222 222',
        role: { role_name: 'Support Worker' },
        department_info: { department_name: 'Care' },
        employment_type_info: { employment_type_name: 'Full-time' },
      };

      const relatedData = {
        qualifications: [
          {
            title: 'First Aid',
            institution: 'Red Cross',
            date_completed: '2025-05-15',
            expiry_date: '2028-05-15',
            file_name: 'cert.pdf',
          },
        ],
        training: [
          {
            title: 'NDIS Induction',
            category: 'Compliance',
            description: 'Core rules training',
            provider: 'Commission',
            date_completed: '2026-01-10',
            expiry_date: '2027-01-10',
            file_name: 'training.pdf',
          },
        ],
        compliance: [
          {
            status: 'complete',
            completion_date: '2026-02-20',
            expiry_date: '2027-02-20',
            compliance_type: {
              compliance_name: 'Screening Check',
            },
          },
        ],
      };

      const result = mapStaffToTags(staff, relatedData);

      expect(result.staff_name).toBe('Jane Smith');
      expect(result.role).toBe('Support Worker');
      expect(result.department).toBe('Care');
      expect(result.employment_type).toBe('Full-time');
      
      expect(result.qualifications).toHaveLength(1);
      expect(result.qualifications[0].title).toBe('First Aid');
      expect(result.qualifications[0].date_completed).toBe('15/05/2025');

      expect(result.training).toHaveLength(1);
      expect(result.training[0].title).toBe('NDIS Induction');

      expect(result.compliance).toHaveLength(1);
      expect(result.compliance[0].compliance_name).toBe('Screening Check');
    });

    it('correctly flattens staff repeating arrays to numbered index tags', () => {
      const staff = { staff_name: 'Jane Smith' };
      const relatedData = {
        qualifications: [
          {
            title: 'First Aid',
            institution: 'Red Cross',
            date_completed: '2025-05-15',
            expiry_date: '2028-05-15',
            file_name: 'cert.pdf',
          },
        ],
        training: [
          {
            title: 'NDIS Induction',
            category: 'Compliance',
            description: 'Core rules training',
            provider: 'Commission',
            date_completed: '2026-01-10',
            expiry_date: '2027-01-10',
            file_name: 'training.pdf',
          },
        ],
        compliance: [
          {
            status: 'complete',
            completion_date: '2026-02-20',
            expiry_date: '2027-02-20',
            compliance_type: {
              compliance_name: 'Screening Check',
            },
          },
        ],
      };

      const result = mapStaffToTags(staff, relatedData);

      // Verify Qualification 1 Flat Tags
      expect(result.qualification_title1).toBe('First Aid');
      expect(result.qualification_institution1).toBe('Red Cross');
      expect(result.qualification_date_completed1).toBe('15/05/2025');
      expect(result.qualification_expiry_date1).toBe('15/05/2028');
      expect(result.qualification_file_name1).toBe('cert.pdf');

      // Verify Training 1 Flat Tags
      expect(result.training_title1).toBe('NDIS Induction');
      expect(result.training_category1).toBe('Compliance');
      expect(result.training_description1).toBe('Core rules training');
      expect(result.training_provider1).toBe('Commission');
      expect(result.training_date_completed1).toBe('10/01/2026');
      expect(result.training_expiry_date1).toBe('10/01/2027');
      expect(result.training_file_name1).toBe('training.pdf');

      // Verify Compliance 1 Flat Tags
      expect(result.compliance_name1).toBe('Screening Check');
      expect(result.compliance_completion_date1).toBe('20/02/2026');
      expect(result.compliance_expiry_date1).toBe('20/02/2027');

      // Verify next indexes do not exist
      expect(result.qualification_title2).toBeUndefined();
    });
  });

  describe('mapHouseToTags', () => {
    it('correctly maps direct and loop fields for houses', () => {
      const house = {
        house_name: 'Sunshine Villa',
        address: '123 Care Lane',
        phone: '02 9000 0000',
        status: 'active',
        house_manager: 'John Manager',
        capacity: 5,
        current_occupancy: 3,
        notes: 'Wheelchair access',
        general_house_details: 'Routines details',
        individuals_breakdown: 'Person A details',
        participant_dynamics: 'Interaction notes',
        risk_management: 'Lock doors',
        observations: 'Quiet night shifts',
      };

      const relatedData = {
        residents: [
          {
            status: 'active',
            participant_name: 'Alice Resident',
            ndis_number: '111 222 333',
            email: 'alice@example.com',
            personal_mobile: '0400 111 111',
            date_of_birth: '1995-10-10',
          },
        ],
        staff: [
          {
            status: 'active',
            staff: {
              status: 'active',
              staff_name: 'Bob Worker',
              email: 'bob@example.com',
              phone: '0400 222 222',
              role: {
                role_name: 'Supervisor',
              },
            },
          },
        ],
      };

      const result = mapHouseToTags(house, relatedData);

      expect(result.house_name).toBe('Sunshine Villa');
      expect(result.observations).toBe('Quiet night shifts');
      
      expect(result.residents).toHaveLength(1);
      expect(result.residents[0].participant_name).toBe('Alice Resident');
      expect(result.residents[0].date_of_birth).toBe('10/10/1995');

      expect(result.staff).toHaveLength(1);
      expect(result.staff[0].staff_name).toBe('Bob Worker');
      expect(result.staff[0].role).toBe('Supervisor');
    });

    it('correctly flattens house residents and staff to numbered index tags (aligned with DB field names)', () => {
      const house = { house_name: 'Sunshine Villa' };
      const relatedData = {
        residents: [
          {
            status: 'active',
            participant_name: 'Alice Resident',
            ndis_number: '111 222 333',
            email: 'alice@example.com',
            personal_mobile: '0400 111 111',
            date_of_birth: '1995-10-10',
          },
        ],
        staff: [
          {
            status: 'active',
            staff: {
              status: 'active',
              staff_name: 'Bob Worker',
              email: 'bob@example.com',
              phone: '0400 222 222',
              role: {
                role_name: 'Supervisor',
              },
            },
          },
        ],
      };

      const result = mapHouseToTags(house, relatedData);

      // Verify Resident 1 Flat Tags (using database-aligned field names)
      expect(result.participant_name1).toBe('Alice Resident');
      expect(result.ndis_number1).toBe('111 222 333');
      expect(result.email1).toBe('alice@example.com');
      expect(result.personal_mobile1).toBe('0400 111 111');
      expect(result.date_of_birth1).toBe('10/10/1995');

      // Verify Staff 1 Flat Tags
      expect(result.staff_name1).toBe('Bob Worker');
      expect(result.staff_role1).toBe('Supervisor');
      expect(result.staff_email1).toBe('bob@example.com');
      expect(result.staff_phone1).toBe('0400 222 222');

      // Verify next indexes do not exist
      expect(result.participant_name2).toBeUndefined();
      expect(result.staff_name2).toBeUndefined();
    });
  });

  describe('flattenMappedArray helper', () => {
    it('correctly flattens arbitrary objects using a mapping configuration', () => {
      const items = [
        { orig_a: 'val_a1', orig_b: 'val_b1' },
        { orig_a: 'val_a2', orig_b: 'val_b2' },
      ];
      const prefixMap = {
        orig_a: 'tag_a',
        orig_b: 'tag_b',
      };

      const result = flattenMappedArray(items, prefixMap);

      expect(result.tag_a1).toBe('val_a1');
      expect(result.tag_b1).toBe('val_b1');
      expect(result.tag_a2).toBe('val_a2');
      expect(result.tag_b2).toBe('val_b2');
      
      expect(result.tag_a3).toBeUndefined();
    });
  });
});
