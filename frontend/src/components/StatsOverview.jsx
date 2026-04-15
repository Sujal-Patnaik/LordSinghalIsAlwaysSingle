import { useEffect, useMemo, useState } from 'react';
import { FiMapPin, FiWind, FiTrendingDown, FiSearch, FiGrid, FiList, FiArrowUp, FiArrowDown, FiMinus } from 'react-icons/fi';
import { getAqiCategory } from '../data/mockData';
import { fetchHistoricalAqi } from '../services/api';
import { computeRanks, sortByWorst, sortByBest, sortByImproving, computeMomentum } from '../utils/aqiHelpers';
import './StatsOverview.css';

export default function StatsOverview({ onSelectCity, locations, selectedYear, selectedMonth, granularity }) {
  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState('default');
  const [viewMode, setViewMode] = useState('grid');

  const isYearly = granularity === 'yearly';

  // Fetch historical data — single month or average across all months for yearly
  useEffect(() => {
    if (!locations || locations.length === 0) return;

    let ignore = false;

    async function loadData() {
      try {
        setIsLoading(true);
        setError('');
        const results = [];

        // For yearly: fetch months 0-11 (or 0-2 for 2026), then average
        const monthsToFetch = isYearly
          ? Array.from({ length: selectedYear === 2026 ? 3 : 12 }, (_, i) => i)
          : [selectedMonth];

        for (const loc of locations) {
          try {
            let totalAqi = 0, totalPm25 = 0, totalPm10 = 0, count = 0;
            let prevTotalAqi = 0, prevCount = 0;

            for (const m of monthsToFetch) {
              const historical = await fetchHistoricalAqi({ cityId: loc.id, month: m });
              const yearEntry = historical.find(h => h.year === selectedYear);
              const prevYearEntry = historical.find(h => h.year === selectedYear - 1);

              if (yearEntry) {
                totalAqi += yearEntry.avgAqi;
                totalPm25 += yearEntry.avgPm25;
                totalPm10 += yearEntry.avgPm10;
                count++;
              }
              if (prevYearEntry) {
                prevTotalAqi += prevYearEntry.avgAqi;
                prevCount++;
              }
            }

            if (count > 0) {
              results.push({
                ...loc,
                currentAqi: Math.round(totalAqi / count),
                currentPm25: Math.round(totalPm25 / count),
                currentPm10: Math.round(totalPm10 / count),
                monthAvg: prevCount > 0 ? { aqi: Math.round(prevTotalAqi / prevCount) } : null,
              });
            }
          } catch {
            // skip city on error
          }
        }

        if (!ignore) {
          setStats(results);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || 'Failed to load overview data.');
          setStats([]);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [locations, selectedYear, selectedMonth, isYearly]);

  // Compute ranks
  const rankedStats = useMemo(() => computeRanks(stats), [stats]);

  // Apply search + sort
  const filteredStats = useMemo(() => {
    let result = rankedStats;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        c => c.name.toLowerCase().includes(term) || c.state.toLowerCase().includes(term)
      );
    }

    if (sortMode === 'worst') result = sortByWorst(result);
    else if (sortMode === 'best') result = sortByBest(result);
    else if (sortMode === 'improving') result = sortByImproving(result);

    return result;
  }, [rankedStats, searchTerm, sortMode]);

  const { avgAqi, worst, best } = useMemo(() => {
    if (stats.length === 0) {
      return { avgAqi: 0, worst: null, best: null };
    }

    return {
      avgAqi: Math.round(stats.reduce((sum, city) => sum + city.currentAqi, 0) / stats.length),
      worst: stats.reduce((prev, current) => (prev.currentAqi > current.currentAqi ? prev : current)),
      best: stats.reduce((prev, current) => (prev.currentAqi < current.currentAqi ? prev : current)),
    };
  }, [stats]);

  function getAqiClass(aqi) {
    if (aqi <= 50) return 'aqi-good';
    if (aqi <= 100) return 'aqi-moderate';
    if (aqi <= 150) return 'aqi-poor';
    if (aqi <= 200) return 'aqi-unhealthy';
    if (aqi <= 300) return 'aqi-severe';
    return 'aqi-hazardous';
  }

  function getMomentumInfo(city) {
    if (!city.monthAvg) return null;
    return computeMomentum(city.currentAqi, city.monthAvg.aqi);
  }

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const periodLabel = isYearly ? `Year ${selectedYear}` : `${monthNames[selectedMonth]} ${selectedYear}`;

  if (isLoading) {
    return (
      <div className="stats-overview-empty">Loading overview data for {periodLabel}...</div>
    );
  }

  if (error) {
    return (
      <div className="stats-overview-empty">{error}</div>
    );
  }

  if (stats.length === 0 || !worst || !best) {
    return (
      <div className="stats-overview-empty">No overview data available for {selectedYear}.</div>
    );
  }

  return (
    <>
      <div className="overview-summary">
        <div className="overview-summary-card gradient-1">
          <div className="overview-summary-icon"><FiWind /></div>
          <div className="overview-summary-value">{avgAqi}</div>
          <div className="overview-summary-label">Avg AQI — {periodLabel}</div>
        </div>
        <div className="overview-summary-card gradient-2">
          <div className="overview-summary-icon"><FiTrendingDown style={{ transform: 'rotate(180deg)' }} /></div>
          <div className="overview-summary-value">{worst.currentAqi}</div>
          <div className="overview-summary-label">Worst: {worst.name}</div>
        </div>
        <div className="overview-summary-card gradient-3">
          <div className="overview-summary-icon"><FiTrendingDown /></div>
          <div className="overview-summary-value">{best.currentAqi}</div>
          <div className="overview-summary-label">Best: {best.name}</div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="overview-controls">
        <div className="overview-search">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search cities..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="overview-search-input"
          />
          {searchTerm && (
            <button className="search-clear-x" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>
        <div className="overview-sort-btns">
          <button
            className={`sort-btn ${sortMode === 'worst' ? 'active' : ''}`}
            onClick={() => setSortMode(sortMode === 'worst' ? 'default' : 'worst')}
          >
            Worst Cities
          </button>
          <button
            className={`sort-btn ${sortMode === 'best' ? 'active' : ''}`}
            onClick={() => setSortMode(sortMode === 'best' ? 'default' : 'best')}
          >
            Best Cities
          </button>
          <button
            className={`sort-btn ${sortMode === 'improving' ? 'active' : ''}`}
            onClick={() => setSortMode(sortMode === 'improving' ? 'default' : 'improving')}
          >
            Improving
          </button>
        </div>
        <div className="overview-view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <FiGrid />
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Table View"
          >
            <FiList />
          </button>
        </div>
      </div>

      <div className="section-title"><FiMapPin className="icon" /> Regional Air Quality — {periodLabel}</div>

      {viewMode === 'grid' ? (
        <div className="stats-overview">
          {filteredStats.map((city, i) => {
            const cat = getAqiCategory(city.currentAqi);
            const momentum = getMomentumInfo(city);
            return (
              <div
                key={city.id}
                className={`stat-card ${getAqiClass(city.currentAqi)}`}
                style={{ animationDelay: `${i * 0.05}s` }}
                onClick={() => onSelectCity(city.id)}
              >
                <div className={`rank-badge ${city.rank <= 3 ? 'top' : city.rank >= stats.length - 2 ? 'bottom' : ''}`}>
                  #{city.rank}
                </div>

                <div className="stat-card-header">
                  <div>
                    <div className="stat-city-name">{city.name}</div>
                    <div className="stat-city-state">{city.state}</div>
                  </div>
                  <div className="stat-aqi-badge" style={{ background: cat.color }}>
                    {city.currentAqi}
                    <small>AQI</small>
                  </div>
                </div>

                {momentum && (
                  <div className={`momentum-badge ${momentum.direction}`}>
                    {momentum.direction === 'up' ? <FiArrowUp /> : momentum.direction === 'down' ? <FiArrowDown /> : <FiMinus />}
                    <span>{momentum.label}</span>
                  </div>
                )}

                <div className="stat-metrics">
                  <div className="stat-metric">
                    <div className="stat-metric-label">PM2.5</div>
                    <div className="stat-metric-value">{city.currentPm25} <span className="stat-metric-unit">µg/m³</span></div>
                  </div>
                  <div className="stat-metric">
                    <div className="stat-metric-label">PM10</div>
                    <div className="stat-metric-value">{city.currentPm10} <span className="stat-metric-unit">µg/m³</span></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="stats-table-wrap">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>City</th>
                <th>State</th>
                <th>AQI</th>
                <th>PM2.5</th>
                <th>PM10</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStats.map(city => {
                const cat = getAqiCategory(city.currentAqi);
                const momentum = getMomentumInfo(city);
                return (
                  <tr key={city.id} onClick={() => onSelectCity(city.id)} className="stats-table-row">
                    <td>
                      <span className={`rank-badge-inline ${city.rank <= 3 ? 'top' : ''}`}>#{city.rank}</span>
                    </td>
                    <td className="table-city-name">{city.name}</td>
                    <td>{city.state}</td>
                    <td>
                      <span className="table-aqi" style={{ color: cat.color }}>{city.currentAqi}</span>
                    </td>
                    <td>{city.currentPm25}</td>
                    <td>{city.currentPm10}</td>
                    <td>
                      {momentum && (
                        <span className={`momentum-inline ${momentum.direction}`}>
                          {momentum.direction === 'up' ? '↑' : momentum.direction === 'down' ? '↓' : '—'}
                          {' '}{momentum.label}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredStats.length === 0 && (
        <div className="stats-overview-empty">No cities match "{searchTerm}"</div>
      )}
    </>
  );
}
