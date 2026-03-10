// ============================================================
// PharmAgent — Mock Data Layer
// ============================================================

// ---- 1. Drug Inventory (20 drugs, 2 batches each) ----
export const drugInventory = [
  {
    id: 'DRG001', name: 'Paracetamol 500mg', category: 'Analgesic', department: 'General Ward',
    reorderLevel: 100, unitCost: 2.5,
    batches: [
      { batchId: 'PCM-2024-A1', quantity: 250, expiryDate: '2026-12-15', mfgDate: '2024-06-15' },
      { batchId: 'PCM-2025-B2', quantity: 180, expiryDate: '2027-06-20', mfgDate: '2025-01-10' },
    ]
  },
  {
    id: 'DRG002', name: 'Metformin 500mg', category: 'Antidiabetic', department: 'Endocrinology',
    reorderLevel: 150, unitCost: 3.0,
    batches: [
      { batchId: 'MET-2024-A3', quantity: 500, expiryDate: '2028-01-20', mfgDate: '2024-07-20' },
      { batchId: 'MET-2025-B1', quantity: 120, expiryDate: '2027-08-10', mfgDate: '2025-02-10' },
    ]
  },
  {
    id: 'DRG003', name: 'Insulin Regular 100IU', category: 'Antidiabetic', department: 'Endocrinology',
    reorderLevel: 50, unitCost: 450,
    batches: [
      { batchId: 'INS-2024-C1', quantity: 4, expiryDate: '2026-12-12', mfgDate: '2024-06-12' },
      { batchId: 'INS-2025-A2', quantity: 16, expiryDate: '2027-03-15', mfgDate: '2025-01-15' },
    ]
  },
  {
    id: 'DRG004', name: 'Amoxicillin 500mg', category: 'Antibiotic', department: 'General Ward',
    reorderLevel: 100, unitCost: 8.5,
    batches: [
      { batchId: 'AMX-2024-B7', quantity: 15, expiryDate: '2026-04-07', mfgDate: '2024-04-07' },
      { batchId: 'AMX-2025-A1', quantity: 120, expiryDate: '2026-08-15', mfgDate: '2025-02-15' },
    ]
  },
  {
    id: 'DRG005', name: 'Amlodipine 5mg', category: 'Antihypertensive', department: 'Cardiology',
    reorderLevel: 80, unitCost: 5.0,
    batches: [
      { batchId: 'AML-2024-D1', quantity: 200, expiryDate: '2027-05-10', mfgDate: '2024-05-10' },
      { batchId: 'AML-2025-B3', quantity: 150, expiryDate: '2027-11-20', mfgDate: '2025-03-20' },
    ]
  },
  {
    id: 'DRG006', name: 'Atorvastatin 20mg', category: 'Statin', department: 'Cardiology',
    reorderLevel: 60, unitCost: 12.0,
    batches: [
      { batchId: 'ATV-2024-A5', quantity: 120, expiryDate: '2026-04-24', mfgDate: '2024-04-24' },
      { batchId: 'ATV-2025-C1', quantity: 80, expiryDate: '2027-02-15', mfgDate: '2025-02-15' },
    ]
  },
  {
    id: 'DRG007', name: 'Pantoprazole 40mg', category: 'PPI', department: 'Gastroenterology',
    reorderLevel: 70, unitCost: 6.0,
    batches: [
      { batchId: 'PAN-2024-B2', quantity: 300, expiryDate: '2027-03-10', mfgDate: '2024-03-10' },
      { batchId: 'PAN-2025-A4', quantity: 100, expiryDate: '2027-09-25', mfgDate: '2025-03-25' },
    ]
  },
  {
    id: 'DRG008', name: 'Telmisartan 40mg', category: 'ARB', department: 'Cardiology',
    reorderLevel: 60, unitCost: 7.5,
    batches: [
      { batchId: 'TEL-2024-C3', quantity: 90, expiryDate: '2027-01-18', mfgDate: '2024-07-18' },
      { batchId: 'TEL-2025-B1', quantity: 110, expiryDate: '2027-07-30', mfgDate: '2025-01-30' },
    ]
  },
  {
    id: 'DRG009', name: 'Salbutamol Inhaler', category: 'Bronchodilator', department: 'Pulmonology',
    reorderLevel: 40, unitCost: 120,
    batches: [
      { batchId: 'SAL-2024-A8', quantity: 25, expiryDate: '2026-09-05', mfgDate: '2024-03-05' },
      { batchId: 'SAL-2025-C2', quantity: 30, expiryDate: '2027-04-12', mfgDate: '2025-04-12' },
    ]
  },
  {
    id: 'DRG010', name: 'Levothyroxine 50mcg', category: 'Thyroid', department: 'Endocrinology',
    reorderLevel: 50, unitCost: 4.0,
    batches: [
      { batchId: 'LEV-2024-D2', quantity: 180, expiryDate: '2027-06-15', mfgDate: '2024-06-15' },
      { batchId: 'LEV-2025-A3', quantity: 90, expiryDate: '2027-12-20', mfgDate: '2025-06-20' },
    ]
  },
  {
    id: 'DRG011', name: 'Vitamin D3 60K IU', category: 'Supplement', department: 'General Ward',
    reorderLevel: 100, unitCost: 15,
    batches: [
      { batchId: 'VTD-2024-B5', quantity: 400, expiryDate: '2027-08-10', mfgDate: '2024-08-10' },
      { batchId: 'VTD-2025-A1', quantity: 200, expiryDate: '2028-02-15', mfgDate: '2025-02-15' },
    ]
  },
  {
    id: 'DRG012', name: 'Ceftriaxone 1g Inj', category: 'Antibiotic', department: 'Surgery',
    reorderLevel: 30, unitCost: 85,
    batches: [
      { batchId: 'TX-2210', quantity: 45, expiryDate: '2026-03-21', mfgDate: '2024-03-21' },
      { batchId: 'CFT-2025-B3', quantity: 20, expiryDate: '2027-01-10', mfgDate: '2025-01-10' },
    ]
  },
  {
    id: 'DRG013', name: 'Ondansetron 4mg', category: 'Antiemetic', department: 'Surgery',
    reorderLevel: 40, unitCost: 18,
    batches: [
      { batchId: 'OND-2024-A2', quantity: 150, expiryDate: '2027-04-05', mfgDate: '2024-04-05' },
      { batchId: 'OND-2025-C4', quantity: 60, expiryDate: '2027-10-20', mfgDate: '2025-04-20' },
    ]
  },
  {
    id: 'DRG014', name: 'Heparin 5000IU Inj', category: 'Anticoagulant', department: 'Cardiology',
    reorderLevel: 25, unitCost: 250,
    batches: [
      { batchId: 'HEP-2024-D3', quantity: 12, expiryDate: '2026-07-15', mfgDate: '2024-01-15' },
      { batchId: 'HEP-2025-A6', quantity: 18, expiryDate: '2027-05-20', mfgDate: '2025-05-20' },
    ]
  },
  {
    id: 'DRG015', name: 'Midazolam 5mg Inj', category: 'Sedative', department: 'Surgery',
    reorderLevel: 20, unitCost: 35,
    batches: [
      { batchId: 'MID-2024-B4', quantity: 40, expiryDate: '2027-02-28', mfgDate: '2024-08-28' },
      { batchId: 'MID-2025-A1', quantity: 25, expiryDate: '2027-08-15', mfgDate: '2025-02-15' },
    ]
  },
  {
    id: 'DRG016', name: 'Morphine 10mg Inj', category: 'Opioid Analgesic', department: 'Surgery',
    reorderLevel: 15, unitCost: 60,
    batches: [
      { batchId: 'MOR-2024-C2', quantity: 10, expiryDate: '2026-11-10', mfgDate: '2024-05-10' },
      { batchId: 'MOR-2025-B5', quantity: 20, expiryDate: '2027-06-20', mfgDate: '2025-06-20' },
    ]
  },
  {
    id: 'DRG017', name: 'Dexamethasone 4mg', category: 'Corticosteroid', department: 'General Ward',
    reorderLevel: 50, unitCost: 10,
    batches: [
      { batchId: 'DEX-2024-A7', quantity: 8, expiryDate: '2026-05-15', mfgDate: '2024-05-15' },
      { batchId: 'DEX-2025-C3', quantity: 75, expiryDate: '2027-04-10', mfgDate: '2025-04-10' },
    ]
  },
  {
    id: 'DRG018', name: 'Folic Acid 5mg', category: 'Supplement', department: 'General Ward',
    reorderLevel: 80, unitCost: 1.5,
    batches: [
      { batchId: 'FOL-2024-D4', quantity: 500, expiryDate: '2027-10-20', mfgDate: '2024-10-20' },
      { batchId: 'FOL-2025-B2', quantity: 300, expiryDate: '2028-04-15', mfgDate: '2025-04-15' },
    ]
  },
  {
    id: 'DRG019', name: 'Ranitidine 150mg', category: 'H2 Blocker', department: 'Gastroenterology',
    reorderLevel: 60, unitCost: 4.5,
    batches: [
      { batchId: 'RAN-2024-A9', quantity: 35, expiryDate: '2026-06-30', mfgDate: '2024-06-30' },
      { batchId: 'RAN-2025-C1', quantity: 100, expiryDate: '2027-03-15', mfgDate: '2025-03-15' },
    ]
  },
  {
    id: 'DRG020', name: 'Ciprofloxacin 250mg', category: 'Antibiotic', department: 'General Ward',
    reorderLevel: 70, unitCost: 6.0,
    batches: [
      { batchId: 'CIP-4491', quantity: 180, expiryDate: '2027-05-09', mfgDate: '2024-11-09' },
      { batchId: 'CIP-2025-A2', quantity: 90, expiryDate: '2027-11-20', mfgDate: '2025-05-20' },
    ]
  },
];

// ---- 2. Vendor Catalog ----
export const vendorCatalog = [
  {
    id: 'VND001', name: 'MediSupply Co.', reliability: 92,
    drugs: {
      'DRG003': { pricePerUnit: 90, leadTimeHours: 48 },
      'DRG004': { pricePerUnit: 7.5, leadTimeHours: 36 },
      'DRG006': { pricePerUnit: 35.25, leadTimeHours: 72 },
      'DRG001': { pricePerUnit: 2.0, leadTimeHours: 24 },
      'DRG002': { pricePerUnit: 2.5, leadTimeHours: 36 },
      'DRG005': { pricePerUnit: 4.2, leadTimeHours: 48 },
      'DRG009': { pricePerUnit: 105, leadTimeHours: 48 },
      'DRG012': { pricePerUnit: 75, leadTimeHours: 24 },
      'DRG014': { pricePerUnit: 220, leadTimeHours: 36 },
      'DRG017': { pricePerUnit: 8.5, leadTimeHours: 24 },
    }
  },
  {
    id: 'VND002', name: 'PharmaLink', reliability: 74,
    drugs: {
      'DRG003': { pricePerUnit: 95, leadTimeHours: 72 },
      'DRG004': { pricePerUnit: 6.8, leadTimeHours: 96 },
      'DRG006': { pricePerUnit: 28.2, leadTimeHours: 48 },
      'DRG001': { pricePerUnit: 1.8, leadTimeHours: 48 },
      'DRG002': { pricePerUnit: 2.8, leadTimeHours: 72 },
      'DRG007': { pricePerUnit: 5.0, leadTimeHours: 36 },
      'DRG010': { pricePerUnit: 3.5, leadTimeHours: 48 },
      'DRG013': { pricePerUnit: 15, leadTimeHours: 36 },
      'DRG016': { pricePerUnit: 52, leadTimeHours: 48 },
      'DRG020': { pricePerUnit: 5.0, leadTimeHours: 36 },
    }
  },
  {
    id: 'VND003', name: 'GlobalMed Logistics', reliability: 88,
    drugs: {
      'DRG003': { pricePerUnit: 88, leadTimeHours: 168 },
      'DRG004': { pricePerUnit: 8.0, leadTimeHours: 48 },
      'DRG006': { pricePerUnit: 30, leadTimeHours: 72 },
      'DRG001': { pricePerUnit: 2.2, leadTimeHours: 36 },
      'DRG008': { pricePerUnit: 6.5, leadTimeHours: 48 },
      'DRG009': { pricePerUnit: 110, leadTimeHours: 72 },
      'DRG011': { pricePerUnit: 12, leadTimeHours: 48 },
      'DRG015': { pricePerUnit: 30, leadTimeHours: 36 },
      'DRG018': { pricePerUnit: 1.2, leadTimeHours: 24 },
      'DRG019': { pricePerUnit: 3.8, leadTimeHours: 48 },
    }
  }
];

// ---- 3. OT Schedule (5 surgeries) ----
export const otSchedule = [
  {
    id: 'OT001', surgeryType: 'Appendectomy', date: '2026-03-10', surgeon: 'Dr. Vikram',
    drugKit: [
      { drugId: 'DRG012', name: 'Ceftriaxone 1g Inj', quantity: 2 },
      { drugId: 'DRG013', name: 'Ondansetron 4mg', quantity: 3 },
      { drugId: 'DRG015', name: 'Midazolam 5mg Inj', quantity: 2 },
      { drugId: 'DRG016', name: 'Morphine 10mg Inj', quantity: 1 },
    ]
  },
  {
    id: 'OT002', surgeryType: 'CABG (Bypass)', date: '2026-03-10', surgeon: 'Dr. Anand',
    drugKit: [
      { drugId: 'DRG014', name: 'Heparin 5000IU Inj', quantity: 4 },
      { drugId: 'DRG015', name: 'Midazolam 5mg Inj', quantity: 3 },
      { drugId: 'DRG016', name: 'Morphine 10mg Inj', quantity: 2 },
      { drugId: 'DRG017', name: 'Dexamethasone 4mg', quantity: 4 },
    ]
  },
  {
    id: 'OT003', surgeryType: 'Knee Replacement', date: '2026-03-11', surgeon: 'Dr. Priya',
    drugKit: [
      { drugId: 'DRG012', name: 'Ceftriaxone 1g Inj', quantity: 2 },
      { drugId: 'DRG016', name: 'Morphine 10mg Inj', quantity: 3 },
      { drugId: 'DRG001', name: 'Paracetamol 500mg', quantity: 20 },
      { drugId: 'DRG017', name: 'Dexamethasone 4mg', quantity: 6 },
    ]
  },
  {
    id: 'OT004', surgeryType: 'Cholecystectomy', date: '2026-03-11', surgeon: 'Dr. Vikram',
    drugKit: [
      { drugId: 'DRG012', name: 'Ceftriaxone 1g Inj', quantity: 2 },
      { drugId: 'DRG013', name: 'Ondansetron 4mg', quantity: 2 },
      { drugId: 'DRG015', name: 'Midazolam 5mg Inj', quantity: 1 },
    ]
  },
  {
    id: 'OT005', surgeryType: 'Hernia Repair', date: '2026-03-12', surgeon: 'Dr. Shweta',
    drugKit: [
      { drugId: 'DRG012', name: 'Ceftriaxone 1g Inj', quantity: 1 },
      { drugId: 'DRG001', name: 'Paracetamol 500mg', quantity: 10 },
      { drugId: 'DRG015', name: 'Midazolam 5mg Inj', quantity: 2 },
    ]
  },
];

// ---- 4. Admission Forecast (15 patients, next 3 days) ----
export const admissionForecast = [
  { id: 'PAT-F01', name: 'Ramesh K.', condition: 'Diabetic', admissionDate: '2026-03-10', likelyDrugs: ['DRG002', 'DRG003'] },
  { id: 'PAT-F02', name: 'Sunita D.', condition: 'Cardiac', admissionDate: '2026-03-10', likelyDrugs: ['DRG005', 'DRG006', 'DRG014', 'DRG008'] },
  { id: 'PAT-F03', name: 'Ajay M.', condition: 'Post-op', admissionDate: '2026-03-10', likelyDrugs: ['DRG012', 'DRG013', 'DRG016', 'DRG017'] },
  { id: 'PAT-F04', name: 'Priya S.', condition: 'Respiratory', admissionDate: '2026-03-10', likelyDrugs: ['DRG009', 'DRG017'] },
  { id: 'PAT-F05', name: 'Mohan L.', condition: 'Diabetic', admissionDate: '2026-03-10', likelyDrugs: ['DRG002', 'DRG003'] },
  { id: 'PAT-F06', name: 'Deepa R.', condition: 'General', admissionDate: '2026-03-11', likelyDrugs: ['DRG001', 'DRG007'] },
  { id: 'PAT-F07', name: 'Karthik N.', condition: 'Cardiac', admissionDate: '2026-03-11', likelyDrugs: ['DRG005', 'DRG006', 'DRG008'] },
  { id: 'PAT-F08', name: 'Lakshmi V.', condition: 'Diabetic', admissionDate: '2026-03-11', likelyDrugs: ['DRG002', 'DRG003'] },
  { id: 'PAT-F09', name: 'Ravi T.', condition: 'Post-op', admissionDate: '2026-03-11', likelyDrugs: ['DRG012', 'DRG013', 'DRG016'] },
  { id: 'PAT-F10', name: 'Anita G.', condition: 'Respiratory', admissionDate: '2026-03-11', likelyDrugs: ['DRG009', 'DRG017'] },
  { id: 'PAT-F11', name: 'Vijay P.', condition: 'Cardiac', admissionDate: '2026-03-12', likelyDrugs: ['DRG005', 'DRG006', 'DRG014'] },
  { id: 'PAT-F12', name: 'Meena S.', condition: 'General', admissionDate: '2026-03-12', likelyDrugs: ['DRG001', 'DRG018'] },
  { id: 'PAT-F13', name: 'Suresh B.', condition: 'Post-op', admissionDate: '2026-03-12', likelyDrugs: ['DRG012', 'DRG016', 'DRG017'] },
  { id: 'PAT-F14', name: 'Kavitha J.', condition: 'Diabetic', admissionDate: '2026-03-12', likelyDrugs: ['DRG002', 'DRG003'] },
  { id: 'PAT-F15', name: 'Arjun D.', condition: 'Respiratory', admissionDate: '2026-03-12', likelyDrugs: ['DRG009', 'DRG017'] },
];

// ---- 5. Patient Profiles (5 patients) ----
export const patientProfiles = [
  {
    id: 'PP001', name: 'James Mathew', age: 58, conditions: ['Diabetic', 'Hypertension'],
    regularMeds: [
      { drugId: 'DRG002', name: 'Metformin 500mg', dosage: '2x daily', monthlyQty: 60 },
      { drugId: 'DRG005', name: 'Amlodipine 5mg', dosage: '1x daily', monthlyQty: 30 },
    ],
    lastPurchaseDate: '2026-02-15', estimatedNextNeed: '2026-04-15', autoBuyEnabled: true,
  },
  {
    id: 'PP002', name: 'Alicia Henderson', age: 45, conditions: ['Type 2 Diabetes'],
    regularMeds: [
      { drugId: 'DRG002', name: 'Metformin 500mg', dosage: '2x daily', monthlyQty: 60 },
    ],
    lastPurchaseDate: '2026-03-07', estimatedNextNeed: '2026-04-17', autoBuyEnabled: true,
  },
  {
    id: 'PP003', name: 'Jonathan Miller', age: 62, conditions: ['Hypertension'],
    regularMeds: [
      { drugId: 'DRG008', name: 'Telmisartan 40mg', dosage: '1x daily', monthlyQty: 30 },
    ],
    lastPurchaseDate: '2026-02-20', estimatedNextNeed: '2026-04-11', autoBuyEnabled: false,
  },
  {
    id: 'PP004', name: 'Priya Sharma', age: 35, conditions: ['Hypothyroid'],
    regularMeds: [
      { drugId: 'DRG010', name: 'Levothyroxine 50mcg', dosage: '1x daily', monthlyQty: 30 },
    ],
    lastPurchaseDate: '2026-02-25', estimatedNextNeed: '2026-04-18', autoBuyEnabled: true,
  },
  {
    id: 'PP005', name: 'Robert Chen', age: 70, conditions: ['Cardiac', 'Hyperlipidemia'],
    regularMeds: [
      { drugId: 'DRG006', name: 'Atorvastatin 20mg', dosage: '1x daily', monthlyQty: 30 },
      { drugId: 'DRG005', name: 'Amlodipine 5mg', dosage: '1x daily', monthlyQty: 30 },
    ],
    lastPurchaseDate: '2026-02-28', estimatedNextNeed: '2026-04-20', autoBuyEnabled: true,
  },
];

// ---- 6. Community Requests ----
export const communityRequests = [
  {
    id: 'CR001', requestor: 'St. Jude Community Hospital', type: 'Hospital',
    drugNeeded: 'Insulin Glargine (Lantus)', quantity: 50, urgency: 'High', neededBy: 'Immediate',
    icon: 'person_heart',
  },
  {
    id: 'CR002', requestor: 'Aisha M. (Private Patient)', type: 'Patient',
    drugNeeded: 'Salbutamol Inhaler', quantity: 2, urgency: 'Medium', neededBy: '3 Days',
    icon: 'person_2',
  },
  {
    id: 'CR003', requestor: 'Global Relief NGO', type: 'NGO',
    drugNeeded: 'Vitamin C Supplements (Bulk)', quantity: 500, urgency: 'Low', neededBy: 'Anytime',
    icon: 'corporate_fare',
  },
];

// ---- 7. Vendor Surplus Posts ----
export const vendorSurplusPosts = [
  {
    id: 'VS001', vendor: 'PharmaDirect Wholesale', drug: 'Amoxicillin 500mg',
    quantity: 500, expiryDate: '2025-10-15', askingPrice: 124.50, tag: 'In Stock', icon: 'medication',
  },
  {
    id: 'VS002', vendor: 'Apex Med Supplies', drug: 'Lisinopril 10mg',
    quantity: 1200, expiryDate: '2026-01-20', askingPrice: 88.20, tag: 'Wholesale', icon: 'vaccines',
  },
  {
    id: 'VS003', vendor: 'Global Health Corp', drug: 'Atorvastatin 40mg',
    quantity: 300, expiryDate: '2024-12-10', askingPrice: 45.00, tag: 'Batch', icon: 'pill',
  },
  {
    id: 'VS004', vendor: 'City Medical Dist.', drug: 'Metformin 850mg',
    quantity: 850, expiryDate: '2026-03-15', askingPrice: 310.00, tag: 'In Stock', icon: 'medical_information',
  },
  {
    id: 'VS005', vendor: 'LifeCare Pharma', drug: 'Paracetamol 650mg',
    quantity: 2000, expiryDate: '2027-06-20', askingPrice: 180.00, tag: 'Bulk', icon: 'pill',
  },
];

// ---- 8. Substitution Map ----
export const substitutionMap = [
  { originalDrug: 'Metformin 500mg', originalId: 'DRG002', substitute: 'Glipizide 5mg', notes: 'Pharmacist approval required' },
  { originalDrug: 'Insulin Regular', originalId: 'DRG003', substitute: 'Insulin NPH', notes: 'Check dosage adjustment' },
  { originalDrug: 'Ceftriaxone 1g', originalId: 'DRG012', substitute: 'Cefepime 1g', notes: 'Same class, check allergy' },
  { originalDrug: 'Amlodipine 5mg', originalId: 'DRG005', substitute: 'Nifedipine 10mg', notes: 'Monitor BP closely' },
  { originalDrug: 'Pantoprazole 40mg', originalId: 'DRG007', substitute: 'Omeprazole 20mg', notes: 'Equivalent efficacy' },
  { originalDrug: 'Salbutamol inhaler', originalId: 'DRG009', substitute: 'Ipratropium inhaler', notes: 'Pharmacist to verify' },
  { originalDrug: 'Telmisartan 40mg', originalId: 'DRG008', substitute: 'Losartan 50mg', notes: 'Same ARB class' },
];

// ---- 9. Seasonal Map ----
export const seasonalMap = [
  { season: 'Winter', months: [12, 1, 2], drugsToPrioritize: ['DRG001', 'DRG009', 'DRG011'], names: ['Paracetamol', 'Salbutamol', 'Vitamin D3'] },
  { season: 'Monsoon', months: [6, 7, 8, 9], drugsToPrioritize: ['DRG020', 'DRG004'], names: ['Ciprofloxacin', 'Amoxicillin'] },
  { season: 'Summer', months: [3, 4, 5], drugsToPrioritize: ['DRG011', 'DRG018'], names: ['Vitamin D3', 'Folic Acid'] },
  { season: 'Autumn', months: [10, 11], drugsToPrioritize: ['DRG001', 'DRG017'], names: ['Paracetamol', 'Dexamethasone'] },
];

// ---- 10. Donation Listings ----
export const donationListings = [
  { id: 'DN001', drug: 'Omeprazole 20mg', quantity: 45, expiryDate: '2024-11-15', estimatedValue: 2250 },
  { id: 'DN002', drug: 'Ibuprofen 400mg', quantity: 100, expiryDate: '2026-02-20', estimatedValue: 800 },
  { id: 'DN003', drug: 'Ciprofloxacin 500mg', quantity: 20, expiryDate: '2024-10-10', estimatedValue: 300 },
];

// ---- 11. Alerts (pre-generated for demo) ----
export const alerts = [
  {
    id: 'ALT001', type: 'CRITICAL', severity: 'critical', drugName: 'Amoxicillin 500mg',
    message: 'Critical Stock Level: Amoxicillin 500mg capsules have fallen below the 5% threshold. 15 units remaining. Immediate procurement required to avoid patient service disruption.',
    timestamp: '2 mins ago', recipient: 'Pharmacy Head + HOD', actionRequired: true, actionLabel: 'Reorder Now',
  },
  {
    id: 'ALT002', type: 'WARNING', severity: 'warning', drugName: 'Insulin Storage',
    message: 'Abnormal Temperature Detected: Fridge Unit #4 (Insulin Storage) reported 8.2°C. Normal range is 2°C - 8°C. Please check the door seal and compressor status.',
    timestamp: '15 mins ago', recipient: 'Pharmacy Head', actionRequired: true, actionLabel: 'View Details',
  },
  {
    id: 'ALT003', type: 'EXPIRY', severity: 'expiry', drugName: 'Atorvastatin 20mg',
    message: 'Upcoming Expiry: Batch #ATV-2024-A5 of Atorvastatin 20mg (120 tablets) will expire in 30 days. Recommend moving to front shelf for prioritised dispensing.',
    timestamp: '2 hours ago', recipient: 'Pharmacist', actionRequired: true, actionLabel: 'Mark for Action',
  },
  {
    id: 'ALT004', type: 'INFO', severity: 'info', drugName: 'Weekly Summary',
    message: 'Weekly Summary Ready: The PharmAgent AI has completed the analysis of last week\'s procurement efficiency. Savings of 4.2% identified through supplier consolidation.',
    timestamp: '5 hours ago', recipient: 'Pharmacy Head', actionRequired: false, actionLabel: 'View Report',
  },
  {
    id: 'ALT005', type: 'CRITICAL', severity: 'critical', drugName: 'Insulin Regular 100IU',
    message: 'Critical Stock Level: Insulin Regular has only 4 vials remaining. Predicted stockout by tomorrow. Auto-PO has been dispatched to MediSupply Co.',
    timestamp: '30 mins ago', recipient: 'Pharmacy Head + HOD', actionRequired: true, actionLabel: 'View PO',
  },
  {
    id: 'ALT006', type: 'EXPIRY', severity: 'expiry', drugName: 'Ceftriaxone 1g Inj',
    message: 'High Expiry Risk: Batch #TX-2210 of Ceftriaxone 1g (45 units) expires in 12 days. Suggest posting to Community Donation Board or inter-department transfer.',
    timestamp: '1 hour ago', recipient: 'Pharmacist', actionRequired: true, actionLabel: 'Take Action',
  },
  {
    id: 'ALT007', type: 'INFO', severity: 'info', drugName: 'Metformin 500mg',
    message: 'Auto-PO Dispatched: Standing order for Metformin 500mg (qty: 225) sent to MediSupply Co. Estimated delivery in 36 hours.',
    timestamp: '3 hours ago', recipient: 'Pharmacy Head', actionRequired: false, actionLabel: 'View PO',
  },
  {
    id: 'ALT008', type: 'WARNING', severity: 'warning', drugName: 'Dexamethasone 4mg',
    message: 'Low Stock Warning: Dexamethasone 4mg has only 8 units in primary batch. With 5 scheduled surgeries requiring it, stock may not last 3 days.',
    timestamp: '45 mins ago', recipient: 'Pharmacy Head', actionRequired: true, actionLabel: 'Order Now',
  },
];

// ---- 12. Purchase Orders (pre-generated for demo) ----
export const purchaseOrders = [
  {
    id: 'PO-2026-001', drugId: 'DRG003', drugName: 'Insulin Regular', vendorId: 'VND001',
    vendorName: 'MediSupply Co.', quantity: 500, unitPrice: 90, totalCost: 45000,
    leadTimeDays: 2, vendorScore: 9.2, status: 'Pending Approval', autoBuy: false,
    createdAt: '2026-03-09T10:30:00',
  },
  {
    id: 'PO-2026-002', drugId: 'DRG004', drugName: 'Amoxicillin 500mg', vendorId: 'VND002',
    vendorName: 'PharmaLink', quantity: 1200, unitPrice: 6.8, totalCost: 12800,
    leadTimeDays: 4, vendorScore: 7.4, status: 'Pending Approval', autoBuy: false,
    createdAt: '2026-03-09T10:35:00',
  },
  {
    id: 'PO-2026-003', drugId: 'DRG006', drugName: 'Atorvastatin 20mg', vendorId: 'VND003',
    vendorName: 'GlobalMed Logistics', quantity: 800, unitPrice: 35.25, totalCost: 28200,
    leadTimeDays: 3, vendorScore: 8.8, status: 'Pending Approval', autoBuy: false,
    createdAt: '2026-03-09T10:40:00',
  },
];

// ---- 13. Financial Data ----
export const financialData = {
  monthlyBudget: 450000,
  spent: 292500,
  wastedInventory: 12400,
  aiSavings: 38200,
  expiryRiskAmount: 45000,
  remaining: 112500,
  cycle: 'Mar 2026',
  topLossDrugs: [
    { name: 'Meropenem 1g Inj.', reason: 'Overstocking', loss: 42500 },
    { name: 'Dexamethasone', reason: 'Expired Inventory', loss: 18200 },
    { name: 'Enoxaparin 40mg', reason: 'Damaged Stock', loss: 12400 },
    { name: 'Augmentin 625 Duo', reason: 'Expiry in 15 days', loss: 4250 },
    { name: 'Janumet 50/500mg', reason: 'Overstocked / Low demand', loss: 2890 },
    { name: 'Lipitor 20mg', reason: 'Damaged during storage', loss: 1420 },
    { name: 'Voveran SR 100', reason: 'Near expiry batch', loss: 980 },
  ],
  wasteAvoided: 24000,
};

// ---- 14. Slow Movement Items ----
export const slowMovementItems = [
  { id: 'SM001', drugId: 'DRG005', name: 'Amlodipine 5mg', batch: 'AML-2024-D1', daysSlow: 110, qty: 150, valueRisk: 750, category: 'Antihypertensive', department: 'Cardiology', lastSoldDate: '2025-11-20', avgMonthlyUsage: 12, actioned: false, actionType: null },
  { id: 'SM002', drugId: 'DRG012', name: 'Ceftriaxone 1g Inj', batch: 'TX-2210', daysSlow: 145, qty: 40, valueRisk: 3400, category: 'Antibiotic', department: 'Surgery', lastSoldDate: '2025-10-15', avgMonthlyUsage: 4, actioned: false, actionType: null },
  { id: 'SM003', drugId: 'DRG019', name: 'Ranitidine 150mg', batch: 'RAN-2024-A9', daysSlow: 205, qty: 35, valueRisk: 157.5, category: 'H2 Blocker', department: 'Gastroenterology', lastSoldDate: '2025-08-16', avgMonthlyUsage: 2, actioned: true, actionType: 'discount' },
  { id: 'SM004', drugId: 'DRG011', name: 'Vitamin D3 60K IU', batch: 'VTD-2024-B5', daysSlow: 95, qty: 120, valueRisk: 1800, category: 'Supplement', department: 'General Ward', lastSoldDate: '2025-12-05', avgMonthlyUsage: 15, actioned: false, actionType: null },
  { id: 'SM005', drugId: 'DRG017', name: 'Dexamethasone 4mg', batch: 'DEX-2024-A7', daysSlow: 180, qty: 8, valueRisk: 80, category: 'Corticosteroid', department: 'General Ward', lastSoldDate: '2025-09-10', avgMonthlyUsage: 0, actioned: true, actionType: 'community' },
  { id: 'SM006', drugId: 'DRG008', name: 'Telmisartan 40mg', batch: 'TEL-2024-C3', daysSlow: 120, qty: 60, valueRisk: 450, category: 'ARB', department: 'Cardiology', lastSoldDate: '2025-11-10', avgMonthlyUsage: 8, actioned: false, actionType: null },
  { id: 'SM007', drugId: 'DRG015', name: 'Midazolam 5mg Inj', batch: 'MID-2024-B4', daysSlow: 92, qty: 25, valueRisk: 875, category: 'Sedative', department: 'Surgery', lastSoldDate: '2025-12-08', avgMonthlyUsage: 5, actioned: false, actionType: null },
  { id: 'SM008', drugId: 'DRG002', name: 'Metformin 500mg', batch: 'MET-2024-A3', daysSlow: 220, qty: 200, valueRisk: 600, category: 'Antidiabetic', department: 'Endocrinology', lastSoldDate: '2025-08-01', avgMonthlyUsage: 10, actioned: true, actionType: 'flash_sale' },
];

// ---- 15. Auto-Buy enabled drugs ----
export const autoBuyDrugs = ['DRG002', 'DRG003', 'DRG005', 'DRG001', 'DRG010', 'DRG009', 'DRG006', 'DRG007', 'DRG008', 'DRG011'];
export const autoBuyDrugNames = ['Metformin', 'Insulin', 'Amlodipine', 'Paracetamol', 'Levothyroxine', 'Salbutamol', 'Atorvastatin', 'Pantoprazole', 'Telmisartan', 'Vitamin D3'];

// ---- 16. Patient Medicine Expiry Tracker ----
export const patientMedicineTracker = [
  { id: 'PT01', patientName: 'Ram', phone: '+919876543210', email: 'naveen83d.a@gmail.com', medicineName: 'Metformin 500mg', quantity: 60, dailyDosage: 2, purchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), reminderSent: false, reminderTime: null }, // 25 days remaining
  { id: 'PT02', patientName: 'James M.', phone: '+1234567890', email: 'naveen83d.a@gmail.com', medicineName: 'Atorvastatin 20mg', quantity: 30, dailyDosage: 1, purchaseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), reminderSent: false, reminderTime: null }, // 20 days remaining
  { id: 'PT03', patientName: 'Sarah K.', phone: '+1987654321', email: 'naveen83d.a@gmail.com', medicineName: 'Amlodipine 5mg', quantity: 90, dailyDosage: 1, purchaseDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), reminderSent: true, reminderTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }, // Safe
  { id: 'PT04', patientName: 'Rahul D.', phone: '+919876512345', email: 'naveen83d.a@gmail.com', medicineName: 'Pantoprazole 40mg', quantity: 14, dailyDosage: 1, purchaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), reminderSent: false, reminderTime: null }, // 12 days remaining
];
