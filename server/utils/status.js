/**
 * Status Logic for FieldPulse
 *
 * Status is computed dynamically based on:
 *  - Current stage
 *  - Days since last update
 *  - Days since planting
 *
 * Rules:
 *  1. Completed  → stage is 'Harvested'
 *  2. At Risk    → stage is NOT 'Harvested' AND
 *                  (a) no update in the past 14 days (for fields > 7 days old), OR
 *                  (b) field has been planted > 150 days without reaching 'Harvested'
 *  3. Active     → everything else (healthy, progressing field)
 */

/**
 * @param {object} field - field row from DB (must include planting_date, current_stage)
 * @param {string|null} lastUpdateDate - ISO date of the most recent field_update, or null
 * @returns {'Active'|'At Risk'|'Completed'}
 */
function computeStatus(field, lastUpdateDate = null) {
  const today = new Date();
  const planted  = new Date(field.planting_date);
  const lastUpdt = lastUpdateDate ? new Date(lastUpdateDate) : planted;

  const daysSincePlanted = Math.floor((today - planted)  / (1000 * 60 * 60 * 24));
  const daysSinceUpdate  = Math.floor((today - lastUpdt) / (1000 * 60 * 60 * 24));

  // Rule 1 – Completed
  if (field.current_stage === 'Harvested') return 'Completed';

  // Rule 2a – No recent activity on a field that's been around for a while
  if (daysSincePlanted > 7 && daysSinceUpdate > 14) return 'At Risk';

  // Rule 2b – Way past typical growing season without harvest
  if (daysSincePlanted > 150) return 'At Risk';

  // Rule 3 – All good
  return 'Active';
}

module.exports = { computeStatus };
