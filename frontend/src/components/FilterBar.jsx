import './FilterBar.css';

const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const years = [2022, 2023, 2024, 2025, 2026];

export default function FilterBar({ locations = [], selectedLocation, onLocationChange, selectedMonth, onMonthChange, selectedYear, onYearChange, granularity, onGranularityChange }) {
  const maxMonth = selectedYear === 2026 ? 2 : 11;
  const isYearly = granularity === 'yearly';

  return (
    <div className="filter-bar">
      <div className="filter-group" style={{ flex: 2 }}>
        <label className="filter-label">Location</label>
        <select
          className="filter-select"
          value={selectedLocation}
          onChange={e => onLocationChange(e.target.value)}
        >
          <option value="">All Regions</option>
          {locations.map(loc => (
            <option key={loc.id} value={String(loc.id)}>
              {loc.name}, {loc.state}
            </option>
          ))}
        </select>
      </div>

      {!isYearly && (
        <div className="filter-group">
          <label className="filter-label">Month</label>
          <select
            className="filter-select"
            value={selectedMonth}
            onChange={e => onMonthChange(Number(e.target.value))}
          >
            {months.map((m, i) => (
              i <= maxMonth && <option key={i} value={i}>{m}</option>
            ))}
          </select>
        </div>
      )}

      <div className="filter-group">
        <label className="filter-label">Year</label>
        <select
          className="filter-select"
          value={selectedYear}
          onChange={e => onYearChange(Number(e.target.value))}
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Granularity</label>
        <div className="granularity-toggle">
          {['Daily', 'Weekly', 'Monthly', 'Yearly'].map(g => (
            <button
              key={g}
              className={`granularity-btn ${granularity === g.toLowerCase() ? 'active' : ''}`}
              onClick={() => onGranularityChange(g.toLowerCase())}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
