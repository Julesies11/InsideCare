DO $$
DECLARE
    v_house_id uuid := '51b47c06-ce82-48e0-ae04-5e3283955c6e';
    v_morning_id uuid;
    v_day_id uuid;
    v_night_id uuid;
    v_cl_mon_id uuid;
    v_cl_tue_id uuid;
    v_cl_start_id uuid;
    v_cl_end_id uuid;
BEGIN
    -- 1. Get the dynamic shift IDs for this house (Created by the 2026032401 migration)
    SELECT id INTO v_morning_id FROM public.house_shift_types WHERE house_id = v_house_id AND name = 'Morning';
    SELECT id INTO v_day_id FROM public.house_shift_types WHERE house_id = v_house_id AND name = 'Day';
    SELECT id INTO v_night_id FROM public.house_shift_types WHERE house_id = v_house_id AND name = 'Night';

    -- 2. Create the shared "Monday Tasks" checklist
    INSERT INTO public.house_checklists (house_id, name, frequency, description, days_of_week)
    VALUES (v_house_id, 'Monday Tasks', 'weekly', 'Shared facility tasks for Mondays', ARRAY['Monday'])
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

    -- 3. Create the shared "Tuesday Tasks" checklist
    INSERT INTO public.house_checklists (house_id, name, frequency, description, days_of_week)
    VALUES (v_house_id, 'Tuesday Tasks', 'weekly', 'Shared facility tasks for Tuesdays', ARRAY['Tuesday'])
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

    -- 4. Create the standard "Start of Shift" checklist
    INSERT INTO public.house_checklists (house_id, name, frequency, description)
    VALUES (v_house_id, 'Start of Shift', 'daily', 'Prep tasks for the beginning of every shift')
    RETURNING id INTO v_cl_start_id;

    INSERT INTO public.house_checklist_items (checklist_id, title, group_title, sort_order, instructions) VALUES
    (v_cl_start_id, 'Check emails & calendar - act accordingly', 'General', 10, 'WhatsApp relevant house "shopping done" - Receipts: email Donna & Operations'),
    (v_cl_start_id, 'Check what medication has been given', 'General', 20, NULL),
    (v_cl_start_id, 'Read all checklist and comms since your last shift', 'General', 30, NULL);

    -- 5. Create the standard "End of Shift" checklist
    INSERT INTO public.house_checklists (house_id, name, frequency, description)
    VALUES (v_house_id, 'End of Shift', 'daily', 'Handover and wrap-up tasks for the end of every shift')
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
