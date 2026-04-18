const CROP_ICONS = {
  maize:     '🌽',
  corn:      '🌽',
  cassava:   '🍠',
  tomatoes:  '🍅',
  tomato:    '🍅',
  beans:     '🫘',
  bean:      '🫘',
  sorghum:   '🌾',
  rice:      '🍚',
  broccoli:  '🥦',
  onions:    '🧅',
  onion:     '🧅',
  sunflower: '🌻',
  carrot:    '🥕',
  carrots:   '🥕',
  wheat:     '🌾',
  potato:    '🥔',
  potatoes:  '🥔',
};

export function cropEmoji(cropType = '') {
  const key = cropType.toLowerCase().trim();
  return CROP_ICONS[key] || '🌿';
}

export default function CropIcon({ cropType, size = '2rem' }) {
  return (
    <span
      className="field-crop-icon"
      style={{ fontSize: size }}
      title={cropType}
      aria-label={cropType}
    >
      {cropEmoji(cropType)}
    </span>
  );
}
