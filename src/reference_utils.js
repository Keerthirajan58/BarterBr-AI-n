// src/reference_utils.js
function round2(x) {
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

function computeValueFromBreakdown(breakdown) {
  const basePrice = Number(breakdown.basePrice || 0);
  const ageFactor = Number(breakdown.ageFactor || 1);
  const conditionFactor = Number(breakdown.conditionFactor || 1);
  const brandFactor = Number(breakdown.brandFactor || 1);
  const accessoryValue = Number(breakdown.accessoryValue || 0);

  const step1 = basePrice * ageFactor;
  const step2 = step1 * conditionFactor;
  const step3 = step2 * brandFactor;
  const value = round2(step3 + accessoryValue);

  const components = {
    basePrice, ageFactor, conditionFactor, brandFactor, accessoryValue,
    step1: round2(step1),
    step2: round2(step2),
    step3: round2(step3)
  };

  return { value, components };
}

function computeFairness(offerVal, requestVal, proposerCash = 0) {
  const V_offer = Number(offerVal || 0);
  let V_request = Number(requestVal || 0);
  if (V_request <= 0) V_request = 1.0;

  const W = Number(proposerCash || 0);
  const fairnessRatio = (V_offer + W) / V_request;
  const fairnessScoreRaw = Math.max(0, Math.min(1, fairnessRatio));
  const fairnessScore = Math.round(fairnessScoreRaw * 100) / 100;
  const suggestedCash = Math.round(Math.max(0, V_request - V_offer) * 100) / 100;

  return { fairnessScore, suggestedCash, fairnessRatio: round2(fairnessRatio) };
}

function formatExplanation(itemTitle, breakdown, value, confidence) {
  return `${itemTitle || 'Item'}: estimated $${value} (confidence ${Math.round(confidence*100)}%). Base: $${breakdown.basePrice}, adjusted by age ${breakdown.ageFactor}, condition ${breakdown.conditionFactor}, brand ${breakdown.brandFactor}, accessories +$${breakdown.accessoryValue}.`;
}

module.exports = { computeValueFromBreakdown, computeFairness, formatExplanation, round2 };