-- Migration: 2026060204_seed_medication_data.sql
-- Description: Seeds medication types and medication data.

BEGIN;

-- 1. Empty existing data (CASCADE removes linked participant medications)
TRUNCATE TABLE public.ic_medications_master CASCADE;
TRUNCATE TABLE public.ic_medication_types_master CASCADE;

-- 2. Populate ic_medication_types_master

INSERT INTO public.ic_medication_types_master (medication_type_name)
SELECT DISTINCT medication_type_name
FROM (
    VALUES 
    ('Antipsychotics'), ('Antidepressents'), ('Benzodiazepines & Sedatives'), ('Pain Relief'), 
    ('Antiepileptic'), ('Antibiotics'), ('Diabetes'), ('Cardiovascular'), ('Respiratory'), 
    ('GI & Bowel'), ('Supplements'), ('Topical Skin'), ('Eye Ear Nasal'), ('Antifungals'), 
    ('Antivirals'), ('Hormonal Endocrine'), ('Urology'), ('Antihistamines'), ('Depots LAI')
) AS t(medication_type_name)
ON CONFLICT (medication_type_name) DO NOTHING;

INSERT INTO public.ic_medication_types_master (medication_type_name)
VALUES ('Other');

-- 3. Import Data
INSERT INTO public.ic_medications_master (
    medication_name, brand_name, type_id, sub_class, purpose, contraindications, interactions, side_effects
)
SELECT 
    d.medication_name, d.brand_name, t.id, d.sub_class, d.purpose, d.contraindications, d.interactions, d.side_effects
FROM (
    VALUES 
    ('Risperidone', 'Risperdal', 'Antipsychotics', 'Atypical', 'Psychosis and mood stabilisation ; Schizophrenia; schizoaffective disorder; bipolar mania; behavioural disturbance', 'QT prolongation; severe EPS history; Parkinson’s disease; dementia-related psychosis', 'QT-prolonging meds; alcohol; high-dose benzodiazepines; other antipsychotics unless ordered', 'EPS; sedation; raised prolactin; weight gain'),
    ('Olanzapine', 'Zyprexa', 'Antipsychotics', 'Atypical', 'Sedating antipsychotic and mood stabiliser ; Schizophrenia; bipolar disorder; acute agitation', 'Uncontrolled diabetes; severe metabolic syndrome', 'Benzodiazepines (esp IM); alcohol; CNS depressants; QT-risk meds', 'Major weight gain; hyperglycaemia; heavy sedation'),
    ('Quetiapine', 'Seroquel', 'Antipsychotics', 'Atypical', 'Sedating antipsychotic; mood stabilisation ; Schizophrenia; bipolar disorder; adjunct depression', 'Severe hypotension; cardiac disease; high falls risk', 'Alcohol; benzodiazepines; CYP3A4 inhibitors', 'Sedation; dizziness; orthostatic hypotension'),
    ('Aripiprazole', 'Abilify', 'Antipsychotics', 'Atypical (partial agonist)', 'Activating antipsychotic ; Schizophrenia; bipolar disorder; adjunct depression', 'Severe akathisia history', 'Alcohol; other antipsychotics unless specialist-directed', 'Akathisia; anxiety; insomnia'),
    ('Paliperidone', 'Invega', 'Antipsychotics', 'Atypical', 'Sustained psychosis control ; Schizophrenia; schizoaffective disorder', 'Severe renal impairment; QT prolongation; risperidone allergy', 'QT-prolonging meds; alcohol; other antipsychotics', 'EPS; prolactin elevation; sedation'),
    ('Ziprasidone', 'Zeldox', 'Antipsychotics', 'Atypical', 'Antipsychotic with high cardiac risk ; Schizophrenia; bipolar mania', 'QT prolongation; arrhythmia; recent MI', 'ANY QT-prolonging meds; methadone; certain antibiotics', 'QT changes; dizziness; collapse risk'),
    ('Haloperidol', 'Haldol', 'Antipsychotics', 'Typical', 'High-potency antipsychotic ; Acute psychosis; severe agitation', 'Parkinson’s disease; severe EPS; QT prolongation', 'QT-prolonging meds; dopamine agonists; alcohol', 'Rigidity; dystonia; severe EPS'),
    ('Chlorpromazine', 'Largactil', 'Antipsychotics', 'Typical', 'Sedating antipsychotic ; Psychosis; severe agitation', 'Severe hypotension; liver disease', 'Alcohol; CNS depressants', 'Sedation; hypotension; anticholinergic effects'),
    ('Clozapine', 'Clozaril', 'Antipsychotics', 'Atypical – SPECIAL AUTHORITY', 'Treatment‑resistant psychosis ; Treatment‑resistant schizophrenia; suicide risk reduction', 'Agranulocytosis history; uncontrolled epilepsy; heart disease; paralytic ileus', 'Carbamazepine; other antipsychotics; benzodiazepines; alcohol; marrow-suppressing drugs', 'Agranulocytosis; seizures; myocarditis; severe constipation; sedation'),
    ('Sertraline', 'Zoloft', 'Antidepressents', 'SSRI', 'Antidepressant acting on serotonin ; Depression; anxiety disorders; PTSD; OCD', 'Known hypersensitivity; mania history without mood stabiliser', 'MAOIs; St John’s Wort; other serotonergic meds (risk serotonin syndrome)', 'GI upset; agitation; insomnia; sexual dysfunction'),
    ('Fluoxetine', 'Lovan', 'Antidepressents', 'SSRI', 'Long-acting antidepressant ; Depression; anxiety; OCD', 'Severe hepatic impairment; bipolar disorder without stabiliser', 'MAOIs; TCAs; tramadol; other serotonergic meds', 'Activation; insomnia; GI upset'),
    ('Escitalopram', 'Lexapro', 'Antidepressents', 'SSRI', 'Antidepressant for mood and anxiety ; Depression; generalised anxiety', 'QT prolongation; cardiac arrhythmias', 'QT-prolonging meds; MAOIs; serotonergic meds', 'QT changes; nausea; headache'),
    ('Venlafaxine', 'Efexor', 'Antidepressents', 'SNRI', 'Serotonin & noradrenaline antidepressant ; Depression; anxiety disorders', 'Uncontrolled hypertension; severe cardiac disease', 'MAOIs; serotonergic meds', 'Hypertension; agitation; withdrawal symptoms'),
    ('Desvenlafaxine', 'Pristiq', 'Antidepressents', 'SNRI', 'SNRI antidepressant ; Depression', 'Severe renal impairment; uncontrolled hypertension', 'MAOIs; serotonergic meds', 'Increased BP; nausea; dizziness'),
    ('Mirtazapine', 'Avanza', 'Antidepressents', 'NaSSA', 'Sedating antidepressant ; Depression with insomnia or poor appetite', 'Severe obesity-related complications', 'Alcohol; benzodiazepines (sedation)', 'Sedation; weight gain; increased appetite'),
    ('Amitriptyline', 'Endep', 'Antidepressents', 'TCA', 'Older antidepressant affecting multiple neurotransmitters ; Depression; neuropathic pain', 'Cardiac disease; glaucoma; overdose risk', 'MAOIs; alcohol; other QT-prolonging meds', 'Anticholinergic effects; arrhythmia risk'),
    ('Bupropion', 'Zyban', 'Antidepressents', 'Atypical', 'Noradrenaline/dopamine antidepressant ; Depression; smoking cessation', 'Seizure disorders; eating disorders', 'MAOIs; other seizure-threshold-lowering meds', 'Insomnia; anxiety; seizure risk'),
    ('Diazepam', 'Valium', 'Benzodiazepines & Sedatives', 'Benzodiazepine', 'Sedative, anxiolytic, muscle relaxant ; Anxiety; acute agitation; alcohol withdrawal; muscle spasm', 'Severe respiratory depression; sleep apnoea; myasthenia gravis; severe liver disease', 'Opioids; alcohol; other sedatives; clozapine', 'Sedation; confusion; respiratory depression; falls'),
    ('Lorazepam', 'Ativan', 'Benzodiazepines & Sedatives', 'Benzodiazepine', 'Short‑acting anxiolytic/sedative ; Acute anxiety; agitation; procedural sedation', 'Respiratory compromise; sleep apnoea', 'Opioids; alcohol; other benzodiazepines; antipsychotics', 'Drowsiness; confusion; paradoxical agitation'),
    ('Oxazepam', 'Serepax', 'Benzodiazepines & Sedatives', 'Benzodiazepine', 'Anxiolytic (short‑acting) ; Anxiety disorders; alcohol withdrawal', 'Severe respiratory disease', 'Alcohol; opioids; other sedatives', 'Sedation; dizziness'),
    ('Temazepam', 'Temaze', 'Benzodiazepines & Sedatives', 'Benzodiazepine (hypnotic)', 'Sleep‑inducing sedative ; Short‑term insomnia', 'Sleep apnoea; respiratory failure', 'Alcohol; opioids; other sedatives', 'Daytime drowsiness; confusion; falls'),
    ('Midazolam', '—', 'Benzodiazepines & Sedatives', 'Benzodiazepine (short‑acting)', 'Rapid sedation ; Acute agitation; procedural use', 'Respiratory depression; shock', 'Opioids; alcohol; other sedatives', 'Respiratory suppression; oversedation'),
    ('Paracetamol', 'Panadol', 'Pain Relief', 'Simple analgesic', 'Pain and fever relief ; Mild–moderate pain; fever', 'Severe liver disease; chronic alcohol misuse', 'Other paracetamol‑containing products (dose stacking)', 'Liver toxicity (overdose)'),
    ('Ibuprofen', 'Nurofen', 'Pain Relief', 'NSAID', 'Anti‑inflammatory pain relief ; Pain; inflammation', 'Peptic ulcer disease; renal failure; pregnancy (3rd trimester)', 'Other NSAIDs; anticoagulants; steroids', 'GI bleeding; renal impairment'),
    ('Celecoxib', 'Celebrex', 'Pain Relief', 'COX‑2 NSAID', 'Anti‑inflammatory pain relief ; Arthritis; inflammatory pain', 'Cardiovascular disease; sulfonamide allergy', 'Other NSAIDs; anticoagulants', 'Cardiac events; GI upset'),
    ('Codeine', '—', 'Pain Relief', 'Opioid', 'Moderate pain relief ; Short‑term pain management', 'Respiratory depression; children; breastfeeding', 'Alcohol; benzodiazepines; other opioids', 'Sedation; respiratory depression; constipation'),
    ('Morphine', '—', 'Pain Relief', 'Opioid (Schedule 8)', 'Severe pain relief ; Severe acute or chronic pain', 'Respiratory depression; head injury', 'Benzodiazepines; alcohol; other opioids', 'Respiratory depression; confusion; constipation'),
    ('Oxycodone', 'Endone', 'Pain Relief', 'Opioid (Schedule 8)', 'Moderate–severe pain relief ; Acute pain; cancer pain', 'Respiratory depression; paralytic ileus', 'Benzodiazepines; alcohol; other opioids', 'Sedation; dependence; respiratory suppression'),
    ('Sodium Valproate', 'Epilim', 'Antiepileptic', 'Antiepileptic / Mood stabiliser', 'Seizure control and mood stabilisation ; Epilepsy; bipolar disorder; seizure prophylaxis', 'Pregnancy; liver disease; urea cycle disorders', 'Carbapenem antibiotics; clozapine (seizure risk); alcohol', 'Sedation; tremor; weight gain; liver toxicity'),
    ('Levetiracetam', 'Keppra', 'Antiepileptic', 'Antiepileptic', 'Seizure prevention ; Focal and generalised seizures', 'Severe psychiatric instability (caution)', 'Alcohol (behavioural change risk)', 'Irritability; mood change; fatigue'),
    ('Carbamazepine', 'Tegretol', 'Antiepileptic', 'Antiepileptic', 'Seizure control; mood stabilisation ; Epilepsy; trigeminal neuralgia', 'Bone-marrow disorders; cardiac conduction disorders', 'Clozapine; MAOIs; many other meds (enzyme induction)', 'Dizziness; diplopia; blood dyscrasias'),
    ('Lamotrigine', 'Lamictal', 'Antiepileptic', 'Antiepileptic / Mood stabiliser', 'Seizure and mood stabilisation ; Epilepsy; bipolar disorder', 'Previous severe skin reaction', 'Valproate (↑ lamotrigine levels)', 'Rash; headache; dizziness'),
    ('Topiramate', 'Topamax', 'Antiepileptic', 'Antiepileptic', 'Seizure control; migraine prevention ; Epilepsy; migraine prophylaxis', 'History of kidney stones', 'Carbonic anhydrase inhibitors', 'Cognitive slowing; weight loss; paraesthesia'),
    ('Phenytoin', 'Dilantin', 'Antiepileptic', 'Antiepileptic', 'Seizure control ; Epilepsy', 'Sinus bradycardia; heart block', 'Many drugs incl. warfarin; alcohol', 'Ataxia; gingival hyperplasia; toxicity signs'),
    ('Amoxicillin', 'Amoxil', 'Antibiotics', 'Penicillin antibiotic', 'Treatment of bacterial infections ; Respiratory, skin, ear, urinary infections', 'Penicillin allergy', 'Other penicillins in allergy; allopurinol (rash risk)', 'Rash; diarrhoea; nausea'),
    ('Amoxicillin + Clavulanate', 'Augmentin', 'Antibiotics', 'Penicillin/β‑lactamase inhibitor', 'Broader‑spectrum antibiotic ; Respiratory, bite wounds, resistant infections', 'Penicillin allergy; previous cholestatic jaundice', 'Penicillin allergy cross‑reactivity', 'Diarrhoea; liver irritation'),
    ('Cefalexin', 'Keflex', 'Antibiotics', 'Cephalosporin', 'Treatment of bacterial infections ; Skin, urinary, respiratory infections', 'Severe penicillin allergy (cross‑reaction)', 'Other beta-lactam antibiotics in severe allergy', 'GI upset; rash'),
    ('Doxycycline', 'Doxylin', 'Antibiotics', 'Tetracycline antibiotic', 'Broad‑spectrum antibiotic ; Respiratory, skin infections; acne', 'Pregnancy; children <8 years', 'Isotretinoin; antacids; iron (absorption interference)', 'Photosensitivity; GI upset'),
    ('Azithromycin', 'Zithromax', 'Antibiotics', 'Macrolide antibiotic', 'Treatment of bacterial infections ; Respiratory and atypical infections', 'QT prolongation; severe liver disease', 'QT‑prolonging meds; antipsychotics', 'QT changes; diarrhoea'),
    ('Trimethoprim', 'Trimex', 'Antibiotics', 'Antifolate antibiotic', 'Treatment of UTIs ; Urinary tract infections', 'Severe renal impairment; folate deficiency', 'Methotrexate; warfarin', 'Rash; blood disorders'),
    ('Metformin', 'Diabex', 'Diabetes', 'Biguanide', 'First-line blood glucose control ; Type 2 diabetes', 'Severe renal impairment; metabolic acidosis', 'Contrast media (temporary stop)', 'GI upset; lactic acidosis (rare)'),
    ('Gliclazide', 'Diamicron', 'Diabetes', 'Sulfonylurea', 'Stimulates insulin release ; Type 2 diabetes', 'Frequent hypoglycaemia; severe hepatic/renal disease', 'Alcohol; other hypoglycaemics', 'Hypoglycaemia; weight gain'),
    ('Insulin Glargine', 'Lantus', 'Diabetes', 'Long-acting insulin', 'Basal insulin control ; Type 1 and Type 2 diabetes', 'Hypoglycaemia without dose review', 'Other insulins without medical order', 'Hypoglycaemia'),
    ('Insulin Aspart', 'NovoRapid', 'Diabetes', 'Rapid-acting insulin', 'Meal-time glucose control ; Diabetes requiring insulin', 'Hypoglycaemia risk if meals missed', 'Other insulins without order', 'Hypoglycaemia'),
    ('Sitagliptin', 'Januvia', 'Diabetes', 'DPP-4 inhibitor', 'Improves insulin response ; Type 2 diabetes', 'Severe renal impairment', 'Other hypoglycaemics (caution)', 'GI upset; pancreatitis (rare)'),
    ('Empagliflozin', 'Jardiance', 'Diabetes', 'SGLT2 inhibitor', 'Reduces glucose via urine excretion ; Type 2 diabetes; cardiovascular benefit', 'Recurrent UTIs; dehydration', 'Diuretics (dehydration risk)', 'UTIs; dehydration; ketoacidosis'),
    ('Ramipril', 'Tritace', 'Cardiovascular', 'ACE inhibitor', 'Lowers blood pressure and reduces cardiac strain ; Hypertension; heart failure; renal protection', 'History of angioedema; pregnancy; bilateral renal artery stenosis', 'Potassium supplements; potassium-sparing diuretics; NSAIDs', 'Hypotension; cough; dizziness'),
    ('Perindopril', 'Coversyl', 'Cardiovascular', 'ACE inhibitor', 'Blood pressure control ; Hypertension; cardiovascular risk reduction', 'Angioedema; pregnancy', 'Potassium-sparing diuretics; NSAIDs', 'Dizziness; cough'),
    ('Amlodipine', 'Norvasc', 'Cardiovascular', 'Calcium channel blocker', 'Relaxes blood vessels ; Hypertension; angina', 'Severe hypotension', 'Other BP-lowering agents', 'Ankle swelling; headache'),
    ('Metoprolol', 'Betaloc', 'Cardiovascular', 'Beta blocker', 'Slows heart rate and lowers BP ; Hypertension; angina; arrhythmia', 'Severe bradycardia; heart block', 'Other beta blockers; verapamil', 'Bradycardia; fatigue; dizziness'),
    ('Atorvastatin', 'Lipitor', 'Cardiovascular', 'Statin', 'Lowers cholesterol ; Hyperlipidaemia; cardiovascular risk reduction', 'Active liver disease', 'Certain antibiotics (e.g. clarithromycin)', 'Muscle pain; liver enzyme changes'),
    ('Warfarin', 'Coumadin', 'Cardiovascular', 'Anticoagulant', 'Prevents blood clots ; Atrial fibrillation; DVT/PE', 'Active bleeding; pregnancy', '🚨 Many drugs incl. antibiotics, NSAIDs, alcohol', 'Bleeding; bruising'),
    ('Apixaban', 'Eliquis', 'Cardiovascular', 'DOAC anticoagulant', 'Prevents blood clots ; Atrial fibrillation; DVT/PE', 'Active bleeding; severe renal disease', 'Other anticoagulants; NSAIDs', 'Bleeding'),
    ('Aspirin', 'Cartia', 'Cardiovascular', 'Antiplatelet', 'Prevents clot formation ; Secondary prevention of cardiovascular disease', 'Active GI bleeding; aspirin allergy', 'Other anticoagulants; NSAIDs', 'GI bleeding; bruising'),
    ('Salbutamol', 'Ventolin', 'Respiratory', 'Short-acting bronchodilator (SABA)', 'Relieves acute airway narrowing ; Asthma; COPD; acute shortness of breath', 'Hypersensitivity; severe tachyarrhythmia', 'Other beta-agonists (overuse risk)', 'Tremor; tachycardia; anxiety'),
    ('Terbutaline', 'Bricanyl', 'Respiratory', 'Short-acting bronchodilator (SABA)', 'Relieves bronchospasm ; Asthma; reversible airway disease', 'Severe cardiac disease', 'Other beta-agonists', 'Palpitations; tremor'),
    ('Tiotropium', 'Spiriva', 'Respiratory', 'Long-acting bronchodilator (LAMA)', 'Maintains open airways ; COPD; chronic asthma management', 'Narrow-angle glaucoma; urinary retention', 'Other anticholinergics', 'Dry mouth; urinary retention'),
    ('Fluticasone', 'Flixotide', 'Respiratory', 'Inhaled corticosteroid', 'Reduces airway inflammation ; Asthma; COPD (adjunct)', 'Untreated respiratory infections', 'Strong CYP3A4 inhibitors (systemic steroid risk)', 'Oral thrush; hoarse voice'),
    ('Budesonide/Formoterol', 'Symbicort', 'Respiratory', 'ICS/LABA combination', 'Maintenance and reliever therapy ; Asthma; COPD', 'Acute asthma without bronchodilator', 'Other LABAs', 'Tremor; oral thrush'),
    ('Prednisolone', '—', 'Respiratory', 'Systemic corticosteroid', 'Reduces severe airway inflammation ; Acute asthma/COPD exacerbations', 'Systemic fungal infections', 'NSAIDs (GI risk); immunosuppressants', 'Hyperglycaemia; mood change; infection risk'),
    ('Montelukast', 'Singulair', 'Respiratory', 'Leukotriene receptor antagonist', 'Reduces airway inflammation ; Asthma; allergic rhinitis', 'History of serious neuropsychiatric reactions', '—', 'Mood changes; sleep disturbance'),
    ('Macrogol', 'Movicol', 'GI & Bowel', 'Osmotic laxative', 'Softens stool by drawing in water ; Chronic constipation; faecal impaction', 'Bowel obstruction; ileus', '—', 'Bloating; diarrhoea'),
    ('Lactulose', 'Duphalac', 'GI & Bowel', 'Osmotic laxative', 'Increases bowel water content ; Constipation; hepatic encephalopathy', 'Galactosaemia; bowel obstruction', 'Other laxatives (diarrhoea risk)', 'Bloating; flatulence; diarrhoea'),
    ('Senna', 'Senokot', 'GI & Bowel', 'Stimulant laxative', 'Stimulates bowel movement ; Constipation (short-term use)', 'Intestinal obstruction; Crohn’s disease', 'Other stimulant laxatives', 'Cramping; diarrhoea'),
    ('Docusate', 'Coloxyl', 'GI & Bowel', 'Stool softener', 'Softens stool ; Constipation; prevention of straining', 'Intestinal obstruction', 'Mineral oil', 'Abdominal cramping'),
    ('Bisacodyl', 'Dulcolax', 'GI & Bowel', 'Stimulant laxative', 'Promotes bowel movement ; Constipation', 'Acute abdomen; bowel obstruction', 'Other stimulant laxatives', 'Abdominal pain; diarrhoea'),
    ('Loperamide', 'Imodium', 'GI & Bowel', 'Antidiarrhoeal', 'Slows bowel transit ; Short-term diarrhoea', 'Infective diarrhoea; colitis', 'Opioids; anticholinergics', 'Constipation; abdominal distension'),
    ('Omeprazole', 'Losec', 'GI & Bowel', 'Proton pump inhibitor', 'Reduces stomach acid ; GORD; peptic ulcer disease', 'Hypersensitivity', 'Clopidogrel (reduced effect)', 'Headache; abdominal pain; long-term fracture risk'),
    ('Ondansetron', 'Zofran', 'GI & Bowel', 'Antiemetic (5HT3 antagonist)', 'Prevents nausea and vomiting ; Post-op nausea; medication-induced nausea', 'QT prolongation', 'Other QT-prolonging medications', 'Constipation; QT changes'),
    ('Multivitamin', 'Various', 'Supplements', 'Vitamin supplement', 'General nutritional supplementation ; Dietary deficiency; poor appetite', 'Hypervitaminosis; iron overload (some preparations)', 'Other vitamin supplements (over-dosing)', 'GI upset'),
    ('Vitamin D (Colecalciferol)', 'Ostelin', 'Supplements', 'Vitamin', 'Bone and muscle health ; Vitamin D deficiency; osteoporosis prevention', 'Hypercalcaemia', 'High-dose calcium supplements', 'Nausea; constipation'),
    ('Calcium Carbonate', 'Caltrate', 'Supplements', 'Mineral supplement', 'Bone health ; Osteoporosis; calcium deficiency', 'Hypercalcaemia; kidney stones', 'Thyroxine; bisphosphonates (absorption affected)', 'Constipation'),
    ('Iron', 'Ferro-Gradumet', 'Supplements', 'Mineral supplement', 'Treats iron deficiency ; Iron deficiency anaemia', 'Haemochromatosis', 'Antacids; calcium; tetracyclines', 'Constipation; dark stools'),
    ('Omega-3 fatty acids', 'Swisse/Fish Oil', 'Supplements', 'Nutritional supplement', 'Cardiovascular and brain support ; Hypertriglyceridaemia; supplementation', 'Fish allergy', 'Anticoagulants (bleeding risk)', 'GI upset; fishy aftertaste'),
    ('Probiotics', 'Inner Health', 'Supplements', 'Gut microbiome support', 'Restores gut flora ; Post-antibiotic diarrhoea; IBS', 'Severe immunocompromise', '—', 'Bloating'),
    ('St John’s Wort', '—', 'Supplements', 'Herbal antidepressant', 'Mood support ; Mild depressive symptoms', 'Bipolar disorder; severe depression', 'Antidepressants; antipsychotics; anticoagulants; oral contraceptives', 'Serotonin syndrome; photosensitivity'),
    ('Paracetamol (OTC)', 'Panadol', 'Supplements', 'OTC analgesic', 'Pain and fever relief ; Mild pain; fever', 'Severe liver disease', 'Other paracetamol-containing products', 'Liver toxicity'),
    ('Hydrocortisone (topical)', 'Various', 'Topical Skin', 'Mild topical corticosteroid', 'Reduces inflammation and itching ; Dermatitis; eczema', 'Untreated skin infection', 'Other topical steroids', 'Skin thinning'),
    ('Betamethasone (topical)', 'Diprosone', 'Topical Skin', 'Potent topical corticosteroid', 'Treats severe inflammation ; Psoriasis; severe eczema', 'Untreated infection; facial use', 'Occlusion unless directed', 'Skin atrophy'),
    ('Clotrimazole (topical)', 'Canesten', 'Topical Skin', 'Antifungal', 'Treats fungal skin infections ; Tinea; candidiasis', 'Hypersensitivity', 'Other antifungals same site', 'Local irritation'),
    ('Mupirocin', 'Bactroban', 'Topical Skin', 'Topical antibiotic', 'Treats bacterial skin infection ; Impetigo', 'Large surface area use', 'Other topical antibiotics', 'Local irritation'),
    ('Chloramphenicol (eye)', 'Chlorsig', 'Eye Ear Nasal', 'Ophthalmic antibiotic', 'Treats bacterial eye infection ; Conjunctivitis', 'Hypersensitivity', 'Other antibiotic eye drops', 'Eye irritation'),
    ('Artificial tears', 'Various', 'Eye Ear Nasal', 'Eye lubricant', 'Moistens eyes ; Dry eye', 'Preservative sensitivity', '—', 'Blurred vision'),
    ('Fluticasone (nasal)', 'Flixonase', 'Eye Ear Nasal', 'Intranasal corticosteroid', 'Reduces nasal inflammation ; Allergic rhinitis', 'Untreated infection', 'Other nasal steroids', 'Epistaxis'),
    ('Fluconazole', 'Diflucan', 'Antifungals', 'Systemic antifungal', 'Treats fungal infections ; Candidiasis', 'Severe liver disease', 'QT meds', 'Liver dysfunction'),
    ('Nystatin (oral)', 'Nilstat', 'Antifungals', 'Antifungal', 'Treats oral thrush ; Oral candidiasis', 'Hypersensitivity', '—', 'GI upset'),
    ('Aciclovir', 'Zovirax', 'Antivirals', 'Antiviral', 'Treats HSV ; Herpes simplex', 'Renal impairment', 'Nephrotoxic meds', 'Headache'),
    ('Valaciclovir', 'Valtrex', 'Antivirals', 'Antiviral', 'HSV suppression ; Recurrent herpes', 'Renal impairment', 'Nephrotoxic meds', 'Nausea'),
    ('Levothyroxine', 'Oroxine', 'Hormonal Endocrine', 'Thyroid hormone', 'Replaces thyroid hormone ; Hypothyroidism', 'Adrenal insufficiency', 'Calcium; iron', 'Palpitations'),
    ('Hydrocortisone (oral)', 'Cortate', 'Hormonal Endocrine', 'Systemic corticosteroid', 'Hormone replacement ; Adrenal insufficiency', 'Untreated infection', 'NSAIDs', 'Immunosuppression'),
    ('Oxybutynin', 'Ditropan', 'Urology', 'Anticholinergic', 'Reduces bladder spasm ; Overactive bladder', 'Urinary retention', 'Other anticholinergics', 'Dry mouth'),
    ('Tamsulosin', 'Flomaxtra', 'Urology', 'Alpha blocker', 'Improves urine flow ; BPH', 'Hypotension', 'Other BP meds', 'Dizziness'),
    ('Loratadine', 'Claratyne', 'Antihistamines', 'Non-sedating antihistamine', 'Allergy relief ; Hay fever', 'Liver disease', '—', 'Headache'),
    ('Cetirizine', 'Zyrtec', 'Antihistamines', 'Low-sedating antihistamine', 'Allergy relief ; Urticaria', 'Renal impairment', 'CNS depressants', 'Drowsiness'),
    ('Promethazine', 'Phenergan', 'Antihistamines', 'Sedating antihistamine', 'Allergy/sedation ; Severe allergy', 'Respiratory depression', 'Benzos; opioids', 'Sedation'),
    ('Risperidone LAI', 'Risperdal Consta', 'Depots LAI', 'Antipsychotic – Long‑Acting Injectable', 'Long‑term management of psychosis ; Schizophrenia; schizoaffective disorder', 'Hypersensitivity; severe EPS history', 'Other antipsychotics unless directed; CNS depressants', 'EPS; sedation; prolactin elevation'),
    ('Paliperidone Palmitate', 'Invega Sustenna / Trinza', 'Depots LAI', 'Antipsychotic – Long‑Acting Injectable', 'Sustained antipsychotic treatment ; Schizophrenia; schizoaffective disorder', 'Severe renal impairment; QT prolongation', 'QT‑prolonging medications; CNS depressants', 'EPS; weight gain; sedation'),
    ('Olanzapine LAI', 'Zyprexa Relprevv', 'Depots LAI', 'Antipsychotic – Long‑Acting Injectable', 'Maintenance treatment of psychosis ; Schizophrenia', 'Post‑injection syndrome risk; uncontrolled diabetes', 'Benzodiazepines; alcohol', 'Sedation; metabolic effects'),
    ('Aripiprazole LAI', 'Abilify Maintena', 'Depots LAI', 'Antipsychotic – Long‑Acting Injectable', 'Relapse prevention in psychosis ; Schizophrenia', 'Hypersensitivity; akathisia history', 'Other dopamine agents', 'Akathisia; insomnia'),
    ('Haloperidol Decanoate', 'Haldol Depot', 'Depots LAI', 'Antipsychotic – Long‑Acting Injectable', 'Long‑term control of psychosis ; Chronic schizophrenia', 'Parkinson’s disease; severe QT prolongation', 'QT‑prolonging medications; alcohol', 'Severe EPS; rigidity')
) AS d(medication_name, brand_name, type_name, sub_class, purpose, contraindications, interactions, side_effects)
JOIN public.ic_medication_types_master t ON d.type_name = t.medication_type_name;

COMMIT;
