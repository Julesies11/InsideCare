DO $$
DECLARE
    v_house_id uuid := '51b47c06-ce82-48e0-ae04-5e3283955c6e';
    v_checklist_id uuid;
BEGIN
    INSERT INTO public.house_checklists (
        house_id, 
        name, 
        frequency, 
        description, 
        days_of_week
    )
    VALUES (
        v_house_id, 
        'Monday', 
        'weekly', 
        'Monday House Calendar checklist', 
        ARRAY['Monday']
    )
    RETURNING id INTO v_checklist_id;

    -- Morning Tasks
    INSERT INTO public.house_checklist_items (checklist_id, title, group_title, sort_order) VALUES
    (v_checklist_id, 'Turn off outside lights near the kitchen', 'Morning', 10),
    (v_checklist_id, 'Check feedback & complaint form (if something is in, tell Donna)', 'Morning', 20),
    (v_checklist_id, 'Record Fridge Temperature', 'Morning', 30),
    (v_checklist_id, 'Jas BGL before food', 'Morning', 40),
    (v_checklist_id, 'Promt Sheetal to brush teeth', 'Morning', 50),
    (v_checklist_id, 'Send signing sheets to Ea', 'Morning', 60);

    -- Day Tasks
    INSERT INTO public.house_checklist_items (checklist_id, title, group_title, sort_order, instructions) VALUES
    (v_checklist_id, 'Shop', 'Day', 70, 'WhatsApp relevant house "shopping done" - Receipts: email Donna & Operations'),
    (v_checklist_id, 'Refill from costco items as needed', 'Day', 80, NULL),
    (v_checklist_id, 'Jasmine''s linen & room', 'Day', 90, NULL),
    (v_checklist_id, 'Vacuum', 'Day', 100, NULL);

    -- Night Tasks
    INSERT INTO public.house_checklist_items (checklist_id, title, group_title, sort_order, instructions) VALUES
    (v_checklist_id, 'Promt Sheetal to brush teeth', 'Night', 110, NULL),
    (v_checklist_id, 'Next day reminders for residents (appts, chores etc.)', 'Night', 120, 'Enter reminders given here:'),
    (v_checklist_id, 'Check fridge & pantry to ensure food is sealed, labelled, within expiry.', 'Night', 130, 'If close to expiry, take action. Describe action here:'),
    (v_checklist_id, 'Mop', 'Night', 140, NULL),
    (v_checklist_id, 'Remind Jas to put cream on her foot', 'Night', 150, NULL);

    -- Start of Shift (Moved to Morning group for schema compatibility)
    INSERT INTO public.house_checklist_items (checklist_id, title, group_title, sort_order) VALUES
    (v_checklist_id, 'START OF SHIFT: Check emails & calendar - act accordingly', 'Morning', 160),
    (v_checklist_id, 'START OF SHIFT: Check what medication has been given', 'Morning', 170),
    (v_checklist_id, 'START OF SHIFT: Read all checklist and comms since your last shift', 'Morning', 180);

    -- End of Shift (Moved to Night group for schema compatibility)
    INSERT INTO public.house_checklist_items (checklist_id, title, group_title, sort_order) VALUES
    (v_checklist_id, 'END OF SHIFT: Have you filled out Jasmine''s Bowel tracker?', 'Night', 190),
    (v_checklist_id, 'END OF SHIFT: Have you put the phone and card back?', 'Night', 200),
    (v_checklist_id, 'END OF SHIFT: Have you signed for all medication?', 'Night', 210),
    (v_checklist_id, 'END OF SHIFT: Have you entered/canceled/moved appts as required?', 'Night', 220),
    (v_checklist_id, 'END OF SHIFT: Have you entered receipts?', 'Night', 230),
    (v_checklist_id, 'END OF SHIFT: Have you cleaned, put dishes away, emptied bins etc?', 'Night', 240),
    (v_checklist_id, 'END OF SHIFT: Have you done you SIL Shift Notes?', 'Night', 250);
END $$;
