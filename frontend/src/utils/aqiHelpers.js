/**
 * aqiHelpers.js — Shared AQI utility functions
 * All functions are pure (no API calls). They derive insights from existing data.
 */

/** Consistent AQI color from Green → Purple scale */
export function getAqiColor(aqi) {
  if (aqi <= 50) return '#55a84f';
  if (aqi <= 100) return '#a3c853';
  if (aqi <= 150) return '#fff833';
  if (aqi <= 200) return '#f29c33';
  if (aqi <= 300) return '#e93f33';
  return '#af2d24';
}

/** AQI category label */
export function getAqiLabel(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Poor';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Severe';
  return 'Hazardous';
}

/**
 * Rank cities by AQI (ascending = best first).
 * Returns new array with `rank` property added.
 */
export function computeRanks(stats) {
  const sorted = [...stats].sort((a, b) => a.currentAqi - b.currentAqi);
  return sorted.map((city, i) => ({ ...city, rank: i + 1 }));
}

/** % change between two values */
export function computeGrowthPercent(current, previous) {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Momentum = current - previous.
 * Returns { value, label, direction }
 */
export function computeMomentum(current, previous) {
  const diff = current - previous;
  if (diff > 20) return { value: diff, label: 'Rapidly Worsening', direction: 'up' };
  if (diff > 5) return { value: diff, label: 'Worsening', direction: 'up' };
  if (diff < -20) return { value: diff, label: 'Rapidly Improving', direction: 'down' };
  if (diff < -5) return { value: diff, label: 'Improving', direction: 'down' };
  return { value: diff, label: 'Stable', direction: 'flat' };
}

/**
 * Compute volatility (std deviation) from an array of daily AQI values.
 * Returns { stddev, label }
 */
export function computeVolatility(dailyValues) {
  if (!dailyValues || dailyValues.length < 2) {
    return { stddev: 0, label: 'Insufficient Data' };
  }
  const mean = dailyValues.reduce((s, v) => s + v, 0) / dailyValues.length;
  const variance = dailyValues.reduce((s, v) => s + (v - mean) ** 2, 0) / dailyValues.length;
  const stddev = Math.sqrt(variance);

  let label = 'Stable';
  if (stddev > 50) label = 'Volatile';
  else if (stddev > 25) label = 'Moderate';

  return { stddev: Math.round(stddev * 10) / 10, label };
}

/**
 * Find best and worst month from monthly averages.
 * Input: array of { month: string, avgAqi: number }
 * Returns { bestMonth, worstMonth }
 */
export function computeSeasonality(monthlyAverages) {
  if (!monthlyAverages || monthlyAverages.length === 0) {
    return { bestMonth: null, worstMonth: null };
  }
  const best = monthlyAverages.reduce((a, b) => (a.avgAqi < b.avgAqi ? a : b));
  const worst = monthlyAverages.reduce((a, b) => (a.avgAqi > b.avgAqi ? a : b));
  return { bestMonth: best, worstMonth: worst };
}

/**
 * Calculate % of days in each AQI category.
 * Input: array of daily AQI numbers.
 * Returns { good, moderate, poor, unhealthy, severe, hazardous } (each 0-100)
 */
export function getAqiDistribution(dailyValues) {
  if (!dailyValues || dailyValues.length === 0) {
    return { good: 0, moderate: 0, poor: 0, unhealthy: 0, severe: 0, hazardous: 0 };
  }
  const total = dailyValues.length;
  const counts = { good: 0, moderate: 0, poor: 0, unhealthy: 0, severe: 0, hazardous: 0 };

  dailyValues.forEach(aqi => {
    if (aqi <= 50) counts.good++;
    else if (aqi <= 100) counts.moderate++;
    else if (aqi <= 150) counts.poor++;
    else if (aqi <= 200) counts.unhealthy++;
    else if (aqi <= 300) counts.severe++;
    else counts.hazardous++;
  });

  return {
    good: Math.round((counts.good / total) * 100),
    moderate: Math.round((counts.moderate / total) * 100),
    poor: Math.round((counts.poor / total) * 100),
    unhealthy: Math.round((counts.unhealthy / total) * 100),
    severe: Math.round((counts.severe / total) * 100),
    hazardous: Math.round((counts.hazardous / total) * 100),
  };
}

/** Sort helpers for quick filter buttons */
export function sortByWorst(stats) {
  return [...stats].sort((a, b) => b.currentAqi - a.currentAqi);
}

export function sortByBest(stats) {
  return [...stats].sort((a, b) => a.currentAqi - b.currentAqi);
}

/**
 * Sort by "improving" — cities with highest negative monthAvg.aqi compared to currentAqi.
 * Approximates growth rate from existing data.
 */
export function sortByImproving(stats) {
  return [...stats].sort((a, b) => {
    const growthA = a.monthAvg ? a.currentAqi - a.monthAvg.aqi : 0;
    const growthB = b.monthAvg ? b.currentAqi - b.monthAvg.aqi : 0;
    return growthA - growthB; // most negative (most improved) first
  });
}
