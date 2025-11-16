// src/valuation_engine.js
const { computeValueFromBreakdown, round2 } = require('./reference_utils');

const CATEGORY_BASES = [
  { keywords: ['textbook', 'algorithms', 'calculus', 'physics', 'chemistry'], base: 100 },
  { keywords: ['phone', 'iphone', 'samsung', 'pixel', 'smartphone'], base: 350 },
  { keywords: ['bike', 'bicycle', 'commuter', 'hybrid'], base: 400 },
  { keywords: ['laptop', 'macbook', 'notebook'], base: 700 },
  { keywords: ['calculator', 'ti-84', 'graphing'], base: 80 },
  { keywords: ['desk', 'chair', 'furniture'], base: 150 },
  { keywords: ['clothes', 'jacket', 'coat', 'sneakers'], base: 60 }
];

function inferBasePrice(title = '', description = '') {
  const text = (title + ' ' + description).toLowerCase();
  for (const c of CATEGORY_BASES) {
    for (const kw of c.keywords) {
      if (text.includes(kw)) return c.base;
    }
  }
  return 50;
}

function inferAgeFactor(year) {
  if (!year) return 0.8;
  const y = Number(year);
  if (isNaN(y)) return 0.8;
  const age = new Date().getFullYear() - y;
  if (age <= 1) return 0.95;
  if (age <= 3) return 0.85;
  if (age <= 6) return 0.70;
  return 0.5;
}

function inferConditionFactor(condition) {
  if (!condition) return 0.8;
  const c = condition.toLowerCase();
  if (c === 'new') return 1.0;
  if (c === 'like new' || c === 'excellent') return 0.95;
  if (c === 'good') return 0.85;
  if (c === 'fair') return 0.7;
  if (c === 'poor' || c === 'for parts') return 0.4;
  return 0.8;
}

function inferBrandFactor(brand) {
  if (!brand) return 1.0;
  const b = brand.toLowerCase();
  const premium = ['apple', 'nike', 'sony', 'dell', 'lenovo', 'samsung'];
  for (const p of premium) if (b.includes(p)) return 1.1;
  const discount = ['no-brand', 'generic'];
  for (const d of discount) if (b.includes(d)) return 0.9;
  return 1.0;
}

function inferAccessoryValue(accessories = []) {
  if (!Array.isArray(accessories)) return 0;
  let sum = 0;
  for (const a of accessories) {
    const s = ('' + a).toLowerCase();
    if (s.includes('charger')) sum += 10;
    else if (s.includes('manual') || s.includes('guide')) sum += 5;
    else if (s.includes('lock')) sum += 15;
    else if (s.includes('case')) sum += 12;
    else if (s.includes('rack')) sum += 20;
    else sum += 5;
  }
  return round2(sum);
}

function generateValuation(metadata = {}) {
  const title = metadata.title || '';
  const description = metadata.description || '';
  const brand = metadata.brand || null;
  const year = metadata.year || null;
  const condition = metadata.condition || null;
  const accessories = metadata.accessories || [];

  const basePrice = inferBasePrice(title, description);
  const ageFactor = inferAgeFactor(year);
  const conditionFactor = inferConditionFactor(condition);
  const brandFactor = inferBrandFactor(brand);
  const accessoryValue = inferAccessoryValue(accessories);

  const breakdown = {
    basePrice: round2(basePrice),
    ageFactor: round2(ageFactor),
    conditionFactor: round2(conditionFactor),
    brandFactor: round2(brandFactor),
    accessoryValue: round2(accessoryValue)
  };

  const { value } = computeValueFromBreakdown(breakdown);

  let confidence = 1.0;
  if (!brand) confidence -= 0.05;
  if (!year) confidence -= 0.10;
  if (!metadata.description) confidence -= 0.05;
  if (!metadata.title) confidence -= 0.10;
  confidence = Math.max(0.0, Math.min(1.0, confidence));

  const explanation = `${title || 'Item'} estimated at $${value}. Base $${breakdown.basePrice} adjusted by age(${breakdown.ageFactor}), condition(${breakdown.conditionFactor}), brand(${breakdown.brandFactor}), accessories +$${breakdown.accessoryValue}.`;

  return {
    value: round2(value),
    confidence: round2(confidence),
    breakdown,
    explanation
  };
}

module.exports = { generateValuation };