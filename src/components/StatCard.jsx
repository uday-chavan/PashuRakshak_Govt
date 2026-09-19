import AnimatedNumber from './AnimatedNumber.jsx';
import activeCasesImg from '../assets/Active Cases.avif';
import activeOutbreaksImg from '../assets/Active Outbreaks.png';
import animalsAffectedImg from '../assets/Animals Affected.png';
import highRiskAreasImg from '../assets/High-Risk Areas.jpg';
import mortalityImg from '../assets/Mortality 2.jpg';
import newCasesImg from '../assets/New Cases.png';

const CARD_BG_IMAGES = {
  'Active Cases': activeCasesImg,
  'Active Outbreaks': activeOutbreaksImg,
  'Animals Affected': animalsAffectedImg,
  'High-Risk Areas': highRiskAreasImg,
  'High Risk Areas': highRiskAreasImg,
  'Affected Animals': animalsAffectedImg,
  'Mortality': mortalityImg,
  'Mortality (7 days)': mortalityImg,
  'Mortality (7 Days)': mortalityImg,
  'New Cases': newCasesImg,
  'New Cases (7 days)': newCasesImg,
  'New Cases (7 Days)': newCasesImg,
};

const CARD_BG_SIZES = {
  'Animals Affected': '46%',
  'Affected Animals': '46%',
  'Mortality': '46%',
  'Mortality (7 days)': '46%',
  'Mortality (7 Days)': '46%',
  'High-Risk Areas': '46%',
  'High Risk Areas': '46%',
  'New Cases': '26%',
  'New Cases (7 days)': '26%',
  'New Cases (7 Days)': '26%',
};

function resolveCardBg(label, bgImage) {
  if (bgImage) return bgImage;
  if (!label || typeof label !== 'string') return null;
  const clean = label.trim();
  if (CARD_BG_IMAGES[clean]) return CARD_BG_IMAGES[clean];
  const lower = clean.toLowerCase();
  if (lower.includes('mortality')) return mortalityImg;
  if (lower.includes('new case')) return newCasesImg;
  if (lower.includes('active case')) return activeCasesImg;
  if (lower.includes('outbreak')) return activeOutbreaksImg;
  if (lower.includes('animal') || lower.includes('affected')) return animalsAffectedImg;
  if (lower.includes('risk')) return highRiskAreasImg;
  return null;
}

function resolveCardBgSize(label, customBgSize) {
  if (customBgSize) return customBgSize;
  if (!label || typeof label !== 'string') return '33%';
  const clean = label.trim();
  if (CARD_BG_SIZES[clean]) return CARD_BG_SIZES[clean];
  const lower = clean.toLowerCase();
  if (lower.includes('animal') || lower.includes('affected')) return '46%';
  if (lower.includes('mortality')) return '46%';
  if (lower.includes('risk')) return '46%';
  if (lower.includes('new case')) return '26%';
  return '33%';
}

function resolveCardBgPosition(label, customBgPosition) {
  if (customBgPosition) return customBgPosition;
  if (!label || typeof label !== 'string') return 'center';
  const clean = label.trim();
  if (clean === 'Animals Affected' || clean === 'Affected Animals') return 'center 62%';
  const lower = clean.toLowerCase();
  if (lower.includes('animal') || lower.includes('affected')) return 'center 62%';
  return 'center';
}

export default function StatCard({
  label,
  value,
  note,
  tone,
  bgImage,
  bgSize,
  bgPosition,
  className = '',
}) {
  const isNumeric = typeof value === 'number' || (typeof value === 'string' && /^[+-]?[\d,]+(\.\d+)?%?$/.test(value.trim()));
  const resolvedBg = resolveCardBg(label, bgImage);
  const resolvedBgSize = resolveCardBgSize(label, bgSize);
  const resolvedBgPosition = resolveCardBgPosition(label, bgPosition);

  return (
    <div
      className={`card stat-card ${resolvedBg ? 'stat-card-has-bg' : ''} ${tone ? `tone-${tone}` : ''} ${className}`.trim()}
    >
      {resolvedBg && (
        <div
          className="stat-card-bg"
          style={{
            backgroundImage: `url("${resolvedBg}")`,
            backgroundSize: resolvedBgSize,
            backgroundPosition: resolvedBgPosition,
            backgroundRepeat: 'no-repeat',
          }}
          aria-hidden="true"
        />
      )}
      <div className="stat-card-content">
        <div className="stat-row">
          <span className="stat-label">{label}</span>
        </div>
        <div className="stat-value">
          {isNumeric ? <AnimatedNumber value={value} /> : value}
        </div>
        {note && <div className="stat-note">{note}</div>}
      </div>
    </div>
  );
}

