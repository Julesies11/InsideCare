DO $$
DECLARE
    v_house_id uuid := '51b47c06-ce82-48e0-ae04-5e3283955c6e';
    v_morning_id uuid;
    v_day_id uuid;
    v_night_id uuid;
    v_cl_mon_id uuid;
    v_cl_tue_id uuid;
    v_cl_wed_id uuid;
    v_cl_thu_id uuid;
    v_cl_fri_id uuid;
    v_cl_sat_id uuid;
    v_cl_sun_id uuid;
    v_cl_start_id uuid;
    v_cl_end_id uuid;
BEGIN
    -- 1. Get the dynamic shift IDs for this house
    SELECT id INTO v_morning_id FROM public.house_shift_types WHERE house_id = v_house_id AND name = 'Morning';
    SELECT id INTO v_day_id FROM public.house_shift_types WHERE house_id = v_house_id AND name = 'Day';
    SELECT id INTO v_night_id FROM public.house_shift_types WHERE house_id = v_house_id AND name = 'Night';

    -- 2. MONDAY
    INSERT INTO public.house_checklists (house_id, name, frequency, description, days_of_week)
    VALUES (v_house_id, 'Monday Tasks', 'weekly', 'Facility tasks for Mondays', ARRAY['Monday'])
    RETURNING id INTO v_cl_mon_id;

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order) VALUES
    (v_cl_mon_id, 'Turn off outside lights near the kitchen', v_morning_id, 'Morning', 10),
    (v_cl_mon_id, 'Check feedback & complaint form (if something is in, tell Donna)', v_morning_id, 'Morning', 20),
    (v_cl_mon_id, 'Record Fridge Temperature', v_morning_id, 'Morning', 30),
    (v_cl_mon_id, 'Jas BGL before food', v_morning_id, 'Morning', 40),
    (v_cl_mon_id, 'Promt Sheetal to brush teeth', v_morning_id, 'Morning', 50),
    (v_cl_mon_id, 'Send signing sheets to Ea', v_morning_id, 'Morning', 60),
    (v_cl_mon_id, 'Refill from costco items as needed', v_day_id, 'Day', 70),
    (v_cl_mon_id, 'Jasmine''s linen & room', v_day_id, 'Day', 80),
    (v_cl_mon_id, 'Vacuum', v_day_id, 'Day', 90),
    (v_cl_mon_id, 'Promt Sheetal to brush teeth', v_night_id, 'Night', 100),
    (v_cl_mon_id, 'Mop', v_night_id, 'Night', 110),
    (v_cl_mon_id, 'Remind Jas to put cream on her foot', v_night_id, 'Night', 120);

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order, instructions) VALUES
    (v_cl_mon_id, 'Shop', v_day_id, 'Day', 130, 'WhatsApp relevant house "shopping done" - Receipts: email Donna & Operations'),
    (v_cl_mon_id, 'Next day reminders for residents (appts, chores etc.)', v_night_id, 'Night', 140, 'Enter reminders given here:'),
    (v_cl_mon_id, 'Check fridge & pantry to ensure food is sealed, labelled, within expiry.', v_night_id, 'Night', 150, 'If close to expiry, take action. Describe action here:');

    -- 3. TUESDAY
    INSERT INTO public.house_checklists (house_id, name, frequency, description, days_of_week)
    VALUES (v_house_id, 'Tuesday Tasks', 'weekly', 'Facility tasks for Tuesdays', ARRAY['Tuesday'])
    RETURNING id INTO v_cl_tue_id;

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order) VALUES
    (v_cl_tue_id, 'Turn off outside lights near the kitchen', v_morning_id, 'Morning', 10),
    (v_cl_tue_id, 'Check feedback & complaint form (if something is in, tell Donna)', v_morning_id, 'Morning', 20),
    (v_cl_tue_id, 'Record Fridge Temperature', v_morning_id, 'Morning', 30),
    (v_cl_tue_id, 'Check mailbox & action', v_morning_id, 'Morning', 40),
    (v_cl_tue_id, 'Promt Sheetal to brush teeth', v_morning_id, 'Morning', 50),
    (v_cl_tue_id, 'Check medication (call pharmacy if on last week)', v_day_id, 'Day', 60),
    (v_cl_tue_id, 'Container for change when all girls are on support', v_day_id, 'Day', 70),
    (v_cl_tue_id, 'SW linen & clean SW bedroom', v_day_id, 'Day', 80),
    (v_cl_tue_id, 'Vacuum', v_day_id, 'Day', 90),
    (v_cl_tue_id, 'Promt Sheetal to brush teeth', v_night_id, 'Night', 100),
    (v_cl_tue_id, 'Add new week menu to whiteboard', v_night_id, 'Night', 110),
    (v_cl_tue_id, 'Mop', v_night_id, 'Night', 120),
    (v_cl_tue_id, 'Remind Jas to put cream on her foot', v_night_id, 'Night', 130);

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order, instructions) VALUES
    (v_cl_tue_id, 'Next day reminders for residents (appts, chores etc.)', v_night_id, 'Night', 140, 'Enter reminders given here:'),
    (v_cl_tue_id, 'Check fridge & pantry to ensure food is sealed, labelled, within expiry.', v_night_id, 'Night', 150, 'If close to expiry, take action. Describe action here:');

    -- 4. WEDNESDAY
    INSERT INTO public.house_checklists (house_id, name, frequency, description, days_of_week)
    VALUES (v_house_id, 'Wednesday Tasks', 'weekly', 'Facility tasks for Wednesdays', ARRAY['Wednesday'])
    RETURNING id INTO v_cl_wed_id;

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order) VALUES
    (v_cl_wed_id, 'Turn off outside lights near the kitchen', v_morning_id, 'Morning', 10),
    (v_cl_wed_id, 'Check feedback & complaint form (if something is in, tell Donna)', v_morning_id, 'Morning', 20),
    (v_cl_wed_id, 'Record Fridge Temperature', v_morning_id, 'Morning', 30),
    (v_cl_wed_id, 'Clean toilets', v_morning_id, 'Morning', 40),
    (v_cl_wed_id, 'Promt Sheetal to brush teeth', v_morning_id, 'Morning', 50),
    (v_cl_wed_id, 'Jas Ozempic', v_morning_id, 'Morning', 60),
    (v_cl_wed_id, 'Exercise with Jasmine (Marco''s program)', v_day_id, 'Day', 70),
    (v_cl_wed_id, 'Vacuum', v_day_id, 'Day', 80),
    (v_cl_wed_id, 'Promt Sheetal to brush teeth', v_night_id, 'Night', 90),
    (v_cl_wed_id, 'Bin night', v_night_id, 'Night', 100),
    (v_cl_wed_id, 'Mop', v_night_id, 'Night', 110),
    (v_cl_wed_id, 'Remind Jas to put cream on her foot', v_night_id, 'Night', 120);

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order, instructions) VALUES
    (v_cl_wed_id, 'Next day reminders for residents (appts, chores etc.)', v_night_id, 'Night', 130, 'Enter reminders given here:'),
    (v_cl_wed_id, 'Check fridge & pantry to ensure food is sealed, labelled, within expiry.', v_night_id, 'Night', 140, 'If close to expiry, take action. Describe action here:');

    -- 5. THURSDAY
    INSERT INTO public.house_checklists (house_id, name, frequency, description, days_of_week)
    VALUES (v_house_id, 'Thursday Tasks', 'weekly', 'Facility tasks for Thursdays', ARRAY['Thursday'])
    RETURNING id INTO v_cl_thu_id;

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order) VALUES
    (v_cl_thu_id, 'Turn off outside lights near the kitchen', v_morning_id, 'Morning', 10),
    (v_cl_thu_id, 'Check feedback & complaint form (if something is in, tell Donna)', v_morning_id, 'Morning', 20),
    (v_cl_thu_id, 'Record Fridge Temperature', v_morning_id, 'Morning', 30),
    (v_cl_thu_id, 'Promt Sheetal to brush teeth', v_morning_id, 'Morning', 40),
    (v_cl_thu_id, 'Pick up medication if ordered', v_day_id, 'Day', 50),
    (v_cl_thu_id, 'Sheetel''s linen & room', v_day_id, 'Day', 60),
    (v_cl_thu_id, 'Vacuum', v_day_id, 'Day', 70),
    (v_cl_thu_id, 'Promt Sheetal to brush teeth', v_night_id, 'Night', 80),
    (v_cl_thu_id, 'Mop', v_night_id, 'Night', 90),
    (v_cl_thu_id, 'Remind Jas to put cream on her foot', v_night_id, 'Night', 100);

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order, instructions) VALUES
    (v_cl_thu_id, 'Next day reminders for residents (appts, chores etc.)', v_night_id, 'Night', 110, 'Enter reminders given here:'),
    (v_cl_thu_id, 'Check fridge & pantry to ensure food is sealed, labelled, within expiry.', v_night_id, 'Night', 120, 'If close to expiry, take action. Describe action here:');

    -- 6. FRIDAY
    INSERT INTO public.house_checklists (house_id, name, frequency, description, days_of_week)
    VALUES (v_house_id, 'Friday Tasks', 'weekly', 'Facility tasks for Fridays', ARRAY['Friday'])
    RETURNING id INTO v_cl_fri_id;

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order) VALUES
    (v_cl_fri_id, 'Turn off outside lights near the kitchen', v_morning_id, 'Morning', 10),
    (v_cl_fri_id, 'Check feedback & complaint form (if something is in, tell Donna)', v_morning_id, 'Morning', 20),
    (v_cl_fri_id, 'Record Fridge Temperature', v_morning_id, 'Morning', 30),
    (v_cl_fri_id, 'Jas BGL before food', v_morning_id, 'Morning', 40),
    (v_cl_fri_id, 'Promt Sheetal to brush teeth', v_morning_id, 'Morning', 50),
    (v_cl_fri_id, 'Caroline linen & room', v_day_id, 'Day', 60),
    (v_cl_fri_id, 'Vacuum', v_day_id, 'Day', 70),
    (v_cl_fri_id, 'Promt Sheetal to brush teeth', v_night_id, 'Night', 80),
    (v_cl_fri_id, 'Mop', v_night_id, 'Night', 90),
    (v_cl_fri_id, 'Remind Jas to put cream on her foot', v_night_id, 'Night', 100);

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order, instructions) VALUES
    (v_cl_fri_id, 'Next day reminders for residents (appts, chores etc.)', v_night_id, 'Night', 110, 'Enter reminders given here:'),
    (v_cl_fri_id, 'Check fridge & pantry to ensure food is sealed, labelled, within expiry.', v_night_id, 'Night', 120, 'If close to expiry, take action. Describe action here:');

    -- 7. SATURDAY
    INSERT INTO public.house_checklists (house_id, name, frequency, description, days_of_week)
    VALUES (v_house_id, 'Saturday Tasks', 'weekly', 'Facility tasks for Saturdays', ARRAY['Saturday'])
    RETURNING id INTO v_cl_sat_id;

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order) VALUES
    (v_cl_sat_id, 'Turn off outside lights near the kitchen', v_morning_id, 'Morning', 10),
    (v_cl_sat_id, 'Check feedback & complaint form (if something is in, tell Donna)', v_morning_id, 'Morning', 20),
    (v_cl_sat_id, 'Record fridge temperature', v_morning_id, 'Morning', 30),
    (v_cl_sat_id, 'Promt Sheetal to brush teeth', v_morning_id, 'Morning', 40),
    (v_cl_sat_id, 'Weeding (10/15mins)', v_morning_id, 'Morning', 50),
    (v_cl_sat_id, 'Meal Spreadsheet', v_day_id, 'Day', 60),
    (v_cl_sat_id, 'Deep clean bathrooms & laundry', v_day_id, 'Day', 70),
    (v_cl_sat_id, 'Vacuum', v_day_id, 'Day', 80),
    (v_cl_sat_id, 'Promt Sheetal to brush teeth', v_night_id, 'Night', 90),
    (v_cl_sat_id, 'Mop', v_night_id, 'Night', 100),
    (v_cl_sat_id, 'Remind Jas to put cream on her foot', v_night_id, 'Night', 110);

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order, instructions) VALUES
    (v_cl_sat_id, 'Next day reminders for residents (appts, chores etc.)', v_night_id, 'Night', 120, 'Enter reminders given here:'),
    (v_cl_sat_id, 'Check fridge & pantry to ensure food is sealed, labelled, within expiry.', v_night_id, 'Night', 130, 'If close to expiry, take action. Describe action here:');

    -- 8. SUNDAY
    INSERT INTO public.house_checklists (house_id, name, frequency, description, days_of_week)
    VALUES (v_house_id, 'Sunday Tasks', 'weekly', 'Facility tasks for Sundays', ARRAY['Sunday'])
    RETURNING id INTO v_cl_sun_id;

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order) VALUES
    (v_cl_sun_id, 'Turn off outside lights near the kitchen', v_morning_id, 'Morning', 10),
    (v_cl_sun_id, 'Check feedback & complaint form (if something is in, tell Donna)', v_morning_id, 'Morning', 20),
    (v_cl_sun_id, 'Record fridge temperature', v_morning_id, 'Morning', 30),
    (v_cl_sun_id, 'Promt Sheetal to brush teeth', v_morning_id, 'Morning', 40),
    (v_cl_sun_id, 'Weeding (10/15mins)', v_morning_id, 'Morning', 50),
    (v_cl_sun_id, 'SW linen & clean SW bedroom', v_day_id, 'Day', 60),
    (v_cl_sun_id, 'Outdoor tidy up', v_day_id, 'Day', 70),
    (v_cl_sun_id, 'Deep clean shared areas (e.g. theatre room, quiet space…)', v_day_id, 'Day', 80),
    (v_cl_sun_id, 'Vacuum', v_day_id, 'Day', 90),
    (v_cl_sun_id, 'Promt Sheetal to brush teeth', v_night_id, 'Night', 100),
    (v_cl_sun_id, 'Add new week menu to whiteboard', v_night_id, 'Night', 110),
    (v_cl_sun_id, 'Mop', v_night_id, 'Night', 120),
    (v_cl_sun_id, 'Remind Jas to put cream on her foot', v_night_id, 'Night', 130);

    INSERT INTO public.house_checklist_items (checklist_id, title, group_id, group_title, sort_order, instructions) VALUES
    (v_cl_sun_id, 'Next day reminders for residents (appts, chores etc.)', v_night_id, 'Night', 140, 'Enter reminders given here:'),
    (v_cl_sun_id, 'Check fridge & pantry to ensure food is sealed, labelled, within expiry.', v_night_id, 'Night', 150, 'If close to expiry, take action. Describe action here:');

    -- 9. STANDARDIZED SHIFT CHECKLISTS (Created ONCE per house)
    INSERT INTO public.house_checklists (house_id, name, frequency, description)
    VALUES (v_house_id, 'Start of Shift', 'daily', 'Standard prep tasks for the beginning of every shift')
    RETURNING id INTO v_cl_start_id;

    INSERT INTO public.house_checklist_items (checklist_id, title, group_title, sort_order, instructions) VALUES
    (v_cl_start_id, 'Check emails & calendar - act accordingly', 'General', 10, 'WhatsApp relevant house "shopping done" - Receipts: email Donna & Operations'),
    (v_cl_start_id, 'Check what medication has been given', 'General', 20, NULL),
    (v_cl_start_id, 'Read all checklist and comms since your last shift', 'General', 30, NULL);

    INSERT INTO public.house_checklists (house_id, name, frequency, description)
    VALUES (v_house_id, 'End of Shift', 'daily', 'Standard handover and wrap-up tasks for the end of every shift')
    RETURNING id INTO v_cl_end_id;

    INSERT INTO public.house_checklist_items (checklist_id, title, group_title, sort_order) VALUES
    (v_cl_end_id, 'Have you filled out Jasmine''s Bowel tracker?', 'General', 10),
    (v_cl_end_id, 'Have you put the phone and card back?', 'General', 20),
    (v_cl_end_id, 'Have you signed for all medication?', 'General', 30),
    (v_cl_end_id, 'Have you entered/canceled/moved appts as required?', 'General', 40),
    (v_cl_end_id, 'Have you entered receipts?', 'General', 50),
    (v_cl_end_id, 'Have you cleaned, put dishes away, emptied bins etc?', 'General', 60),
    (v_cl_end_id, 'Have you done you SIL Shift Notes?', 'General', 70);

END $$;
