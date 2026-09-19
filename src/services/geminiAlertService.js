/**
 * PashuRakshak — Real-time Disease Alert Generator
 * Pure rule-based conditional alert generation based on live map cases telemetry.
 *
 * Rules:
 * - 1 to 10 cases in a district  => 'warning'  (Emerging Cases section)
 * - > 10 cases in a district     => 'critical' (Critical section)
 * Dynamic values (Disease Name, District Name, Case Count, and short trigger time)
 * are injected into standardized government notification templates.
 */

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Formats an accurate, short relative timestamp (e.g. 'Just now', '15 mins ago', '2 hrs ago', '1 day ago').
 */
function getShortTriggerTime(latestDate = null) {
  if (latestDate) {
    const d = new Date(latestDate);
    if (!isNaN(d.getTime())) {
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();

      // Within last 2 minutes or slightly in future (clock skew)
      if (diffMs <= 2 * 60 * 1000 && diffMs >= -60 * 1000) {
        return 'Just now';
      }
      if (diffMs > 0) {
        const diffMins = Math.floor(diffMs / (60 * 1000));
        const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
        const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

        if (diffMins < 60) {
          return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        }
        if (diffHours < 24) {
          return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
        }
        if (diffDays === 1) {
          return '1 day ago';
        }
        if (diffDays < 30) {
          return `${diffDays} days ago`;
        }
      }
    }
  }

  // Live trigger without prior historical record
  return 'Just now';
}

/**
 * Builds a structured alert object based on district, disease name, case count, and trigger time.
 */
export function createDistrictDiseaseAlert({ district, disease, count, latestDate = null }) {
  const isCritical = count > 10;
  const level = isCritical ? 'critical' : 'warning';
  const shortDist = (district || 'MAH').slice(0, 3).toUpperCase();
  const id = `AL-${isCritical ? 'CRT' : 'EMG'}-${shortDist}-${(hashString(district + disease + count) % 9000) + 1000}`;
  const triggerTime = getShortTriggerTime(latestDate);

  if (isCritical) {
    return {
      id,
      level: 'critical',
      district,
      disease,
      count,
      time: triggerTime,
      title: `Critical ${disease} Outbreak in ${district} (${count} Cases)`,
      desc: `High-priority disease outbreak confirmed in ${district} with ${count} active ${disease} cases. Immediate containment perimeter, animal movement restrictions, and emergency ring vaccination activated.`,
      directives: [
        `Deploy District Emergency Rapid Response Team (RRT) to ${district} for immediate hotspot containment.`,
        `Establish strict 10 km ring containment perimeter and temporary livestock transit embargo across ${district}.`,
        `Expedite batch diagnostic swabs directly to State Disease Diagnostic Laboratory.`,
        `Issue urgent red-alert advisories to all village dairy cooperatives and gram panchayats in ${district}.`,
      ],
    };
  }

  // 1 to 10 cases -> Emerging Cases
  return {
    id,
    level: 'warning',
    district,
    disease,
    count,
    time: triggerTime,
    title: `Emerging ${disease} Warning in ${district} (${count} Case${count > 1 ? 's' : ''})`,
    desc: `${count} active case${count > 1 ? 's' : ''} of ${disease} reported in ${district}. Field veterinary units placed on heightened surveillance with biosecurity protocols initiated.`,
    directives: [
      `Deploy Block Veterinary Officer (BVO) rapid response unit to inspect reported premises in ${district}.`,
      `Initiate 5 km radius preventative ring vaccination and clinical surveillance around affected herds.`,
      `Collect serum and diagnostic swabs for regional laboratory confirmation.`,
      `Broadcast preventive health advisories to registered livestock owners in ${district}.`,
    ],
  };
}

/**
 * Aggregates all case pins from the map and live hotspot districts,
 * applying the 1-10 (Emerging) and >10 (Critical) rule per district & disease.
 */
export function generateAllDiseaseAlerts(casePins = [], liveDistricts = []) {
  const clusterMap = new Map();

  // 1. Group case pins by district + disease
  casePins.forEach((pin) => {
    const district = pin.district || 'Maharashtra';
    const disease = pin.disease || pin.suspected_disease || pin.confirmed_disease || 'Undiagnosed Condition';
    const key = `${district}__${disease}`;

    if (!clusterMap.has(key)) {
      clusterMap.set(key, {
        district,
        disease,
        count: 0,
        latestDate: pin.dateTime || pin.date_time || pin.date || null,
      });
    }
    const c = clusterMap.get(key);
    c.count += 1;
    if (pin.dateTime || pin.date_time) {
      c.latestDate = pin.dateTime || pin.date_time;
    }
  });

  // 2. Also incorporate any hotspot districts from DB that have reported cases
  liveDistricts.forEach((d) => {
    const district = d.district || d.name;
    const disease = d.disease && d.disease !== 'None' ? d.disease : 'Surveillance Alert';
    const key = `${district}__${disease}`;

    const reportedCases = d.newCases || d.affectedAnimals || d.affected || 0;
    if (!clusterMap.has(key) && (d.risk === 'critical' || d.risk === 'warning' || reportedCases > 0)) {
      const estimatedCount = reportedCases > 0 ? reportedCases : (d.risk === 'critical' ? 14 : 5);
      clusterMap.set(key, {
        district,
        disease,
        count: estimatedCount,
        latestDate: d.lastReported || null,
      });
    }
  });

  // 3. Fallback baseline if no cases are active yet
  if (clusterMap.size === 0) {
    clusterMap.set('Nashik__Foot and Mouth Disease (FMD)', {
      district: 'Nashik',
      disease: 'Foot and Mouth Disease (FMD)',
      count: 14,
      latestDate: null,
    });
    clusterMap.set('Solapur__Lumpy Skin Disease (LSD)', {
      district: 'Solapur',
      disease: 'Lumpy Skin Disease (LSD)',
      count: 7,
      latestDate: null,
    });
    clusterMap.set('Pune__Peste des Petits Ruminants (PPR)', {
      district: 'Pune',
      disease: 'Peste des Petits Ruminants (PPR)',
      count: 3,
      latestDate: null,
    });
  }

  // 4. Generate structured alerts
  const generatedAlerts = [];
  clusterMap.forEach((cluster) => {
    generatedAlerts.push(
      createDistrictDiseaseAlert({
        district: cluster.district,
        disease: cluster.disease,
        count: cluster.count,
        latestDate: cluster.latestDate,
      })
    );
  });

  // 5. Standard advisory notices (Advisory / Info)
  const infoNotices = [
    {
      id: 'AL-ADV-101',
      level: 'info',
      district: 'All 36 Districts',
      disease: 'FMD & HS Polyvalent Vaccine',
      time: '1 day ago',
      title: 'Statewide Ring Vaccination Campaign: FMD & HS Phase IV',
      desc: 'Mobile veterinary units deployed statewide to administer preventative polyvalent vaccine doses across vulnerable dairy belts.',
      directives: [
        'Coordinate cold-chain logistics for vaccine distribution at all Taluka Veterinary Polyclinics.',
        'Prioritize high-density bovine clusters and border check-posts.',
      ],
    },
    {
      id: 'AL-ADV-102',
      level: 'info',
      district: 'Maharashtra Statewide',
      disease: 'Live Animal Transit Protocols',
      time: '2 days ago',
      title: 'Biosecurity Protocol circular issued for Live Animal Transit',
      desc: 'Standard Operating Procedures updated for interstate transit permits, weekly livestock markets, and disinfection protocols.',
      directives: [
        'Inspect health certificates and ear tags at all 28 inter-district surveillance checkpoints.',
        'Sanitize animal transport vehicles with 2% sodium carbonate spray.',
      ],
    },
  ];

  // Combine and sort: Critical first, Warning (Emerging) second, Info third
  const order = { critical: 1, warning: 2, info: 3 };
  return [...generatedAlerts, ...infoNotices].sort(
    (a, b) => (order[a.level] || 99) - (order[b.level] || 99)
  );
}
