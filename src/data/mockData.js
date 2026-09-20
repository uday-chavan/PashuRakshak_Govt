// ============================================================
// PashuRakshak – DEMONSTRATION MOCK DATA
// ------------------------------------------------------------
// All figures below are illustrative sample data for a static
// front-end prototype only. They are NOT real government
// statistics.
// ============================================================

// ----- Overview statistics -----
export const overviewStats = [
  { key: 'cases', label: 'Active Cases', value: 1284, icon: 'Virus', tone: 'green' },
  { key: 'outbreaks', label: 'Active Outbreaks', value: 18, icon: 'Activity', tone: 'orange' },
  { key: 'animals', label: 'Animals Affected', value: 8492, icon: 'PawPrint', tone: 'green' },
  { key: 'highRisk', label: 'High-Risk Areas', value: 7, icon: 'ShieldAlert', tone: 'red' },
];

// ----- Disease activity over recent months -----
export const diseaseActivity = [
  { month: 'Apr', cases: 186, mortality: 12, vaccinated: 1240, atRisk: 320, recoveryRate: 74, rValue: 1.18, alerts: 4 },
  { month: 'May', cases: 212, mortality: 11, vaccinated: 1580, atRisk: 290, recoveryRate: 78, rValue: 1.31, alerts: 6 },
  { month: 'Jun', cases: 268, mortality: 18, vaccinated: 1820, atRisk: 410, recoveryRate: 69, rValue: 1.52, alerts: 9 },
  { month: 'Jul', cases: 241, mortality: 14, vaccinated: 2140, atRisk: 360, recoveryRate: 72, rValue: 1.38, alerts: 7 },
  { month: 'Aug', cases: 295, mortality: 16, vaccinated: 2510, atRisk: 430, recoveryRate: 71, rValue: 1.61, alerts: 11 },
  { month: 'Sep', cases: 312, mortality: 15, vaccinated: 2760, atRisk: 480, recoveryRate: 73, rValue: 1.55, alerts: 10 },
  { month: 'Oct', cases: 278, mortality: 13, vaccinated: 3020, atRisk: 390, recoveryRate: 76, rValue: 1.42, alerts: 8 },
  { month: 'Nov', cases: 231, mortality: 10, vaccinated: 3340, atRisk: 310, recoveryRate: 82, rValue: 1.21, alerts: 5 },
  { month: 'Dec', cases: 198, mortality: 9,  vaccinated: 3590, atRisk: 260, recoveryRate: 86, rValue: 1.07, alerts: 3 },
];

// ----- Important alerts (dashboard + alerts page) -----
export const importantAlerts = [
  {
    id: 'AL-1042',
    level: 'critical',
    title: 'FMD outbreak spreading in Nashik',
    district: 'Nashik',
    time: '2 hrs ago',
    desc: '124 cases reported in the last 7 days. Ring vaccination drive prioritised for the affected belt.',
  },
  {
    id: 'AL-1043',
    level: 'critical',
    title: 'Lumpy Skin Disease containment in Solapur',
    district: 'Solapur',
    time: '4 hrs ago',
    desc: '47 cattle herds infected. Veterinary rapid response team deployed to quarantine boundary.',
  },
  {
    id: 'AL-1041',
    level: 'warning',
    title: 'PPR cases rising in Pune',
    district: 'Pune',
    time: '5 hrs ago',
    desc: '86 goat herds affected. Monitoring enhanced and clinical advisory dispatched to field staff.',
  },
  {
    id: 'AL-1040',
    level: 'warning',
    title: 'FMD cluster in Ahmednagar',
    district: 'Ahmednagar',
    time: '1 day ago',
    desc: '53 cases under control. Buffer zone surveillance initiated across 12 adjacent villages.',
  },
  {
    id: 'AL-1039',
    level: 'info',
    title: 'Statewide Vaccination Drive scheduled in Latur',
    district: 'Latur',
    time: '2 days ago',
    desc: 'Free FMD and HS vaccination camps planned on 12 Sep for 400+ cattle.',
  },
  {
    id: 'AL-1038',
    level: 'info',
    title: 'Biosecurity Protocol circular issued',
    district: 'Satara',
    time: '3 days ago',
    desc: 'Standard Operating Procedures updated for live animal transit and weekly cattle markets.',
  },
];

// ----- Maharashtra hotspot districts (normal / attention / critical) -----
// Each district carries the full "district intelligence" record used by the
// Disease Intelligence Map (risk shading, activity markers, vaccination coverage).
export const hotspotDistricts = [
  {
    district: 'Nashik', x: 52, y: 75, risk: 'critical', affected: 124, disease: 'FMD', lastReported: '06 Sep 2026',
    affectedAnimals: 124, newCases: 11, activeVillages: 6, vaccinationCoverage: 72,
    riskTrend: 'Increasing', pendingLab: 3,
    recentActivity: [
      { day: 'Today', delta: '+6' },
      { day: 'Yesterday', delta: '+4' },
      { day: '2 days ago', delta: '+2' },
    ],
  },
  {
    district: 'Pune', x: 55, y: 122, risk: 'warning', affected: 86, disease: 'PPR', lastReported: '06 Sep 2026',
    affectedAnimals: 86, newCases: 7, activeVillages: 5, vaccinationCoverage: 91,
    riskTrend: 'Stable', pendingLab: 7,
    recentActivity: [
      { day: 'Today', delta: '+3' },
      { day: 'Yesterday', delta: '+2' },
      { day: '2 days ago', delta: '+2' },
    ],
  },
  {
    district: 'Ahmednagar', x: 87, y: 104, risk: 'warning', affected: 53, disease: 'FMD', lastReported: '05 Sep 2026',
    affectedAnimals: 53, newCases: 5, activeVillages: 4, vaccinationCoverage: 73,
    riskTrend: 'Stable', pendingLab: 2,
    recentActivity: [
      { day: 'Today', delta: '+2' },
      { day: 'Yesterday', delta: '+2' },
      { day: '2 days ago', delta: '+1' },
    ],
  },
  {
    district: 'Solapur', x: 128, y: 150, risk: 'critical', affected: 47, disease: 'FMD', lastReported: '05 Sep 2026',
    affectedAnimals: 47, newCases: 12, activeVillages: 4, vaccinationCoverage: 66,
    riskTrend: 'Increasing', pendingLab: 5,
    recentActivity: [
      { day: 'Today', delta: '+5' },
      { day: 'Yesterday', delta: '+4' },
      { day: '2 days ago', delta: '+3' },
    ],
  },
  {
    district: 'Latur', x: 155, y: 126, risk: 'warning', affected: 61, disease: 'LSD', lastReported: '06 Sep 2026',
    affectedAnimals: 61, newCases: 6, activeVillages: 3, vaccinationCoverage: 81,
    riskTrend: 'Stable', pendingLab: 1,
    recentActivity: [
      { day: 'Today', delta: '+2' },
      { day: 'Yesterday', delta: '+2' },
      { day: '2 days ago', delta: '+2' },
    ],
  },
  {
    district: 'Nagpur', x: 242, y: 38, risk: 'normal', affected: 22, disease: 'HS', lastReported: '04 Sep 2026',
    affectedAnimals: 22, newCases: 1, activeVillages: 2, vaccinationCoverage: 88,
    riskTrend: 'Decreasing', pendingLab: 0,
    recentActivity: [
      { day: 'Today', delta: '0' },
      { day: 'Yesterday', delta: '+1' },
      { day: '2 days ago', delta: '0' },
    ],
  },
  {
    district: 'Aurangabad', x: 108, y: 79, risk: 'warning', affected: 38, disease: 'PPR', lastReported: '05 Sep 2026',
    affectedAnimals: 38, newCases: 4, activeVillages: 3, vaccinationCoverage: 69,
    riskTrend: 'Stable', pendingLab: 2,
    recentActivity: [
      { day: 'Today', delta: '+2' },
      { day: 'Yesterday', delta: '+1' },
      { day: '2 days ago', delta: '+1' },
    ],
  },
  {
    district: 'Amravati', x: 195, y: 45, risk: 'normal', affected: 12, disease: 'HS', lastReported: '03 Sep 2026',
    affectedAnimals: 12, newCases: 0, activeVillages: 1, vaccinationCoverage: 78,
    riskTrend: 'Decreasing', pendingLab: 0,
    recentActivity: [
      { day: 'Today', delta: '0' },
      { day: 'Yesterday', delta: '0' },
      { day: '2 days ago', delta: '0' },
    ],
  },
  {
    district: 'Kolhapur', x: 69, y: 181, risk: 'normal', affected: 9, disease: 'FMD', lastReported: '02 Sep 2026',
    affectedAnimals: 9, newCases: 0, activeVillages: 1, vaccinationCoverage: 84,
    riskTrend: 'Stable', pendingLab: 0,
    recentActivity: [
      { day: 'Today', delta: '0' },
      { day: 'Yesterday', delta: '0' },
      { day: '2 days ago', delta: '0' },
    ],
  },
  {
    district: 'Jalgaon', x: 116, y: 42, risk: 'critical', affected: 7, disease: 'PPR', lastReported: '01 Sep 2026',
    affectedAnimals: 342, newCases: 18, activeVillages: 6, vaccinationCoverage: 64,
    riskTrend: 'Increasing', pendingLab: 4,
    recentActivity: [
      { day: 'Today', delta: '+8' },
      { day: 'Yesterday', delta: '+5' },
      { day: '2 days ago', delta: '+3' },
    ],
  },
  {
    district: 'Raigad', x: 34, y: 108, risk: 'normal', affected: 5, disease: 'FMD', lastReported: '01 Sep 2026',
    affectedAnimals: 5, newCases: 0, activeVillages: 1, vaccinationCoverage: 76,
    riskTrend: 'Stable', pendingLab: 0,
    recentActivity: [
      { day: 'Today', delta: '0' },
      { day: 'Yesterday', delta: '0' },
      { day: '2 days ago', delta: '0' },
    ],
  },
  {
    district: 'Wardha', x: 225, y: 51, risk: 'warning', affected: 4, disease: 'HS', lastReported: '31 Aug 2026',
    affectedAnimals: 4, newCases: 0, activeVillages: 1, vaccinationCoverage: 71,
    riskTrend: 'Stable', pendingLab: 0,
    recentActivity: [
      { day: 'Today', delta: '0' },
      { day: 'Yesterday', delta: '0' },
      { day: '2 days ago', delta: '0' },
    ],
  },
];

// ---- Related outbreak activity connections (NOT transmission) ----
export const outbreakConnections = [
  { from: 'Nashik', to: 'Jalgaon' },
  { from: 'Nashik', to: 'Ahmednagar' },
  { from: 'Ahmednagar', to: 'Solapur' },
  { from: 'Solapur', to: 'Latur' },
  { from: 'Solapur', to: 'Pune' },
];

// ---- Compact "Areas needing attention" quick list ----
export const attentionAreas = [
  { district: 'Jalgaon', note: '18 new cases', risk: 'critical' },
  { district: 'Nashik', note: '11 new cases', risk: 'critical' },
  { district: 'Pune', note: '7 pending lab reports', risk: 'warning' },
];

// ----- Outbreak monitoring table -----
export const outbreakList = [
  { id: 'OB-118', district: 'Nashik', disease: 'FMD', cases: 124, risk: 'High', status: 'Active' },
  { id: 'OB-117', district: 'Pune', disease: 'PPR', cases: 86, risk: 'Medium', status: 'Monitoring' },
  { id: 'OB-116', district: 'Ahmednagar', disease: 'FMD', cases: 53, risk: 'Low', status: 'Controlled' },
  { id: 'OB-115', district: 'Solapur', disease: 'FMD', cases: 47, risk: 'Medium', status: 'Monitoring' },
  { id: 'OB-114', district: 'Latur', disease: 'LSD', cases: 61, risk: 'High', status: 'Active' },
  { id: 'OB-113', district: 'Aurangabad', disease: 'PPR', cases: 38, risk: 'Medium', status: 'Monitoring' },
  { id: 'OB-112', district: 'Nagpur', disease: 'HS', cases: 22, risk: 'Low', status: 'Controlled' },
  { id: 'OB-111', district: 'Amravati', disease: 'HS', cases: 12, risk: 'Low', status: 'Controlled' },
];

// ----- Outbreak summary stats -----
export const outbreakStats = [
  { key: 'newCases', label: 'New Cases (7 days)', value: 342, tone: 'red' },
  { key: 'mortality', label: 'Mortality (7 days)', value: 18, tone: 'orange' },
  { key: 'affected', label: 'Affected Animals', value: 8492, tone: 'green' },
  { key: 'active', label: 'Active Outbreaks', value: 18, tone: 'green' },
];

// ----- Case management -----
export const cases = [
  {
    id: 'CS-2601',
    animal: 'Crossbred Cow (Herd of 12)',
    district: 'Nashik',
    disease: 'FMD',
    vet: 'Dr. A. Patil',
    status: 'Active',
    lastUpdated: '06 Sep 2026',
    owner: 'Ramesh Jadhav',
    village: 'Niphad',
    phone: '98765 43210',
    symptoms: 'Excessive salivation, mouth blisters, lameness, reduced feed intake.',
    treatment: 'Antiseptic mouth wash, supportive fluids, anti-inflammatory medication.',
    vetStatus: 'Treatment ongoing',
    labStatus: 'Sample sent for confirmation',
    timeline: [
      { time: '06 Sep 09:00', text: 'Daily clinical round completed' },
      { time: '05 Sep 16:00', text: 'Vaccination of contact herd completed' },
      { time: '04 Sep 12:00', text: 'Case registered by field officer' },
    ],
  },
  {
    id: 'CS-2602',
    animal: 'Goat Herd (20 animals)',
    district: 'Pune',
    disease: 'PPR',
    vet: 'Dr. S. Kulkarni',
    status: 'Under Treatment',
    lastUpdated: '06 Sep 2026',
    owner: 'Suresh Pawar',
    village: 'Baramati',
    phone: '97561 22334',
    symptoms: 'Fever, nasal discharge, diarrhoea, oral lesions.',
    treatment: 'Supportive care, electrolytes, antibiotics for secondary infection.',
    vetStatus: 'Treatment ongoing',
    labStatus: 'Pending sample collection',
    timeline: [
      { time: '05 Sep 17:00', text: 'Supportive treatment started' },
      { time: '04 Sep 10:00', text: 'Case reported by village volunteer' },
    ],
  },
  {
    id: 'CS-2603',
    animal: 'Buffalo (1 animal)',
    district: 'Ahmednagar',
    disease: 'FMD',
    vet: 'Dr. R. Deshmukh',
    status: 'Resolved',
    lastUpdated: '05 Sep 2026',
    owner: 'Kavita More',
    village: 'Shirdi',
    phone: '98900 55678',
    symptoms: 'Mouth blisters, mild fever, reduced appetite.',
    treatment: 'Completed full course of care; animal recovered.',
    vetStatus: 'Recovered',
    labStatus: 'Negative',
    timeline: [
      { time: '01 Sep 14:00', text: 'Case resolved after 14-day observation' },
      { time: '18 Aug 09:00', text: 'Treatment completed' },
    ],
  },
  {
    id: 'CS-2604',
    animal: 'Crossbred Cow (1 animal)',
    district: 'Solapur',
    disease: 'FMD',
    vet: 'Dr. M. Shinde',
    status: 'Pending',
    lastUpdated: '06 Sep 2026',
    owner: 'Vijay Kale',
    village: 'Pandharpur',
    phone: '98230 11223',
    symptoms: 'Suspected mouth lesions, fever — awaiting vet confirmation.',
    treatment: 'Not started — awaiting assessment',
    vetStatus: 'Pending vet visit',
    labStatus: 'Not initiated',
    timeline: [
      { time: '06 Sep 08:00', text: 'Case reported by owner' },
    ],
  },
  {
    id: 'CS-2605',
    animal: 'Ovine Herd (Grass Cutter)',
    district: 'Latur',
    disease: 'LSD',
    vet: 'Dr. A. Patil',
    status: 'Under Treatment',
    lastUpdated: '06 Sep 2026',
    owner: 'Anil Bansode',
    village: 'Udgir',
    phone: '97654 90876',
    symptoms: 'Skin nodules, mild fever, reduced milk yield.',
    treatment: 'Isolation, supportive therapy, insect control.',
    vetStatus: 'Treatment ongoing',
    labStatus: 'Sample under testing',
    timeline: [
      { time: '06 Sep 10:00', text: 'Follow-up visit completed' },
      { time: '03 Sep 11:00', text: 'Case registered' },
    ],
  },
  {
    id: 'CS-2606',
    animal: 'Bullock (1 animal)',
    district: 'Aurangabad',
    disease: 'PPR',
    vet: 'Dr. S. Kulkarni',
    status: 'Resolved',
    lastUpdated: '04 Sep 2026',
    owner: 'Nitin Joshi',
    village: 'Paithan',
    phone: '99300 44556',
    symptoms: 'Nasal discharge, mild fever, depression.',
    treatment: 'Completed supportive course; animal recovered.',
    vetStatus: 'Recovered',
    labStatus: 'Negative',
    timeline: [
      { time: '30 Aug 13:00', text: 'Case resolved' },
    ],
  },
];

// ----- Vaccination page -----
export const vaccinationStats = [
  { key: 'total', label: 'Total Vaccinations', value: 28450, tone: 'green' },
  { key: 'completed', label: 'Completed', value: 18760, tone: 'green' },
  { key: 'pending', label: 'Pending', value: 6930, tone: 'orange' },
  { key: 'upcoming', label: 'Upcoming', value: 2760, tone: 'sky' },
];

export const vaccinationSchedule = [
  { disease: 'FMD', vaccine: 'FMD Vaccine', district: 'Nashik', completed: 820, pending: 180, upcomingDate: '12 Sep' },
  { disease: 'PPR', vaccine: 'PPR Vaccine', district: 'Pune', completed: 640, pending: 120, upcomingDate: '15 Sep' },
  { disease: 'HS', vaccine: 'HS Vaccine', district: 'Ahmednagar', completed: 430, pending: 90, upcomingDate: '18 Sep' },
  { disease: 'LSD', vaccine: 'LSD Vaccine', district: 'Latur', completed: 510, pending: 140, upcomingDate: '20 Sep' },
  { disease: 'FMD', vaccine: 'FMD Vaccine', district: 'Solapur', completed: 380, pending: 110, upcomingDate: '22 Sep' },
  { disease: 'PPR', vaccine: 'PPR Vaccine', district: 'Aurangabad', completed: 290, pending: 95, upcomingDate: '25 Sep' },
];

export const vaccinationProgress = [
  { disease: 'FMD', pct: 82 },
  { disease: 'PPR', pct: 68 },
  { disease: 'HS', pct: 76 },
  { disease: 'LSD', pct: 61 },
];

// ----- Laboratory page -----
export const labStats = [
  { key: 'collected', label: 'Samples Collected', value: 642, tone: 'sky' },
  { key: 'pending', label: 'Pending Diagnosis', value: 118, tone: 'orange' },
  { key: 'positive', label: 'Positive', value: 84, tone: 'red' },
  { key: 'reports', label: 'Reports Ready', value: 217, tone: 'green' },
];

export const samples = [
  { id: 'LAB-2041', caseId: 'CS-2601', district: 'Nashik', test: 'ELISA - FMD', status: 'Positive', date: '06 Sep 2026' },
  { id: 'LAB-2040', caseId: 'CS-2602', district: 'Pune', test: 'PCR - PPR', status: 'Under Testing', date: '06 Sep 2026' },
  { id: 'LAB-2039', caseId: 'CS-2604', district: 'Solapur', test: 'ELISA - FMD', status: 'Report Ready', date: '05 Sep 2026' },
  { id: 'LAB-2038', caseId: 'CS-2605', district: 'Latur', test: 'PCR - LSD', status: 'Under Testing', date: '05 Sep 2026' },
  { id: 'LAB-2037', caseId: 'CS-2603', district: 'Ahmednagar', test: 'ELISA - FMD', status: 'Negative', date: '05 Sep 2026' },
  { id: 'LAB-2036', caseId: 'CS-2606', district: 'Aurangabad', test: 'PCR - PPR', status: 'Negative', date: '04 Sep 2026' },
  { id: 'LAB-2035', caseId: 'CS-2601', district: 'Nashik', test: 'PCR - FMD', status: 'Collected', date: '04 Sep 2026' },
];

export const labReport = {
  lab: 'Regional Disease Diagnostic Laboratory, Pune',
  reportNo: 'RDDL/PUNE/2026/0891',
  disease: 'Foot and Mouth Disease',
  sampleType: 'Epithelial Swab',
  testMethod: 'ELISA',
};

// ----- Alerts page -----
export const previousAlerts = [
  { id: 'AD-1042', date: '06 Sep 2026', district: 'Nashik', message: 'FMD vaccination camp scheduled for affected belt.', status: 'Sent' },
  { id: 'AD-1041', date: '05 Sep 2026', district: 'Pune', message: 'Advisory: report any goat fever or diarrhoea immediately.', status: 'Sent' },
  { id: 'AD-1040', date: '04 Sep 2026', district: 'Ahmednagar', message: 'Movement restriction advisory for FMD area.', status: 'Sent' },
  { id: 'AD-1039', date: '03 Sep 2026', district: 'Latur', message: 'LSD awareness notice for cattle owners.', status: 'Sent' },
];

// ----- District list for the alert form -----
export const districtOptions = [
  'Nashik', 'Pune', 'Ahmednagar', 'Solapur', 'Latur', 'Nagpur',
  'Aurangabad', 'Amravati', 'Kolhapur', 'Jalgaon', 'Raigad', 'Wardha',
];

// ----- Map / risk helpers -----
export const riskMeta = {
  critical: { label: 'Critical', color: '#dc2626' },
  warning: { label: 'Attention', color: '#f59e0b' },
  normal: { label: 'Normal', color: '#22a06b' },
};

export const riskPill = {
  High: 'pill-high',
  Medium: 'pill-medium',
  Low: 'pill-low',
};

export const caseStatusPill = {
  Active: 'pill-active',
  'Under Treatment': 'pill-pending',
  Resolved: 'pill-complete',
  Pending: 'pill-neutral',
};

export const labStatusPill = {
  Collected: 'pill-neutral',
  'Under Testing': 'pill-pending',
  Positive: 'pill-positive',
  Negative: 'pill-negative',
  'Report Ready': 'pill-complete',
};

// ----- Recent cases table (Overview) -----
export const recentCases = [
  { id: 'CS-2601', animal: 'Crossbred Cow', district: 'Nashik', disease: 'FMD', status: 'Active', updated: 'Today' },
  { id: 'CS-2602', animal: 'Goat Herd', district: 'Pune', disease: 'PPR', status: 'Under Treatment', updated: 'Today' },
  { id: 'CS-2604', animal: 'Crossbred Cow', district: 'Solapur', disease: 'FMD', status: 'Pending', updated: 'Today' },
  { id: 'CS-2605', animal: 'Ovine Herd', district: 'Latur', disease: 'LSD', status: 'Under Treatment', updated: 'Today' },
  { id: 'CS-2603', animal: 'Buffalo', district: 'Ahmednagar', disease: 'FMD', status: 'Resolved', updated: 'Yesterday' },
];
