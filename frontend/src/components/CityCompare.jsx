import { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { FiX } from 'react-icons/fi';
import { fetchDailyAqi } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { getAqiColor } from '../utils/aqiHelpers';
import './CityCompare.css';

const COMPARE_COLORS = ['#3b82f6', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6'];

export default function CityCompare({ locations, selectedMonth, selectedYear }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCities, setSelectedCities] = useState([]);
  const [cityData, setCityData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Date range
  const dateRange = useMemo(() => {
    const daysInMonth = selectedYear === 2026 && selectedMonth === 2
      ? 26
      : new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const start = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
    const end = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
    return { start, end };
  }, [selectedMonth, selectedYear]);

  // Fetch data for selected cities
  useEffect(() => {
    if (selectedCities.length === 0) {
      setCityData({});
      return;
    }

    let ignore = false;
    async function loadData() {
      setIsLoading(true);
      const results = {};
      for (const cityId of selectedCities) {
        try {
          const data = await fetchDailyAqi({
            cityId,
            startDate: dateRange.start,
            endDate: dateRange.end,
          });
          if (!ignore) results[cityId] = data;
        } catch {
          if (!ignore) results[cityId] = [];
        }
      }
      if (!ignore) {
        setCityData(results);
        setIsLoading(false);
      }
    }
    loadData();
    return () => { ignore = true; };
  }, [selectedCities, dateRange]);

  function toggleCity(cityId) {
    setSelectedCities(prev => {
      if (prev.includes(cityId)) return prev.filter(id => id !== cityId);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, cityId];
    });
  }

  function removeCity(cityId) {
    setSelectedCities(prev => prev.filter(id => id !== cityId));
  }

  // Build chart data
  const chartData = useMemo(() => {
    if (selectedCities.length === 0) return null;

    // Find the city with the most data points for labels
    let maxLabels = [];
    selectedCities.forEach(id => {
      const data = cityData[id] || [];
      if (data.length > maxLabels.length) {
        maxLabels = data.map(d => {
          const parts = d.date.split('-');
          return `${parseInt(parts[2])}/${parseInt(parts[1])}`;
        });
      }
    });

    const datasets = selectedCities.map((cityId, i) => {
      const city = locations.find(l => String(l.id) === String(cityId));
      const data = cityData[cityId] || [];
      return {
        label: city?.name || cityId,
        data: data.map(d => d.daily.avgAqi),
        borderColor: COMPARE_COLORS[i % COMPARE_COLORS.length],
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
      };
    });

    return { labels: maxLabels, datasets };
  }, [selectedCities, cityData, locations]);

  const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)';
  const tickColor = isLight ? '#4b5563' : '#6b7280';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: tickColor,
          font: { size: 11, family: 'Inter' },
          usePointStyle: true,
          pointStyle: 'line',
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(30,34,48,0.95)',
        titleColor: isLight ? '#1a1d26' : '#e8eaed',
        bodyColor: isLight ? '#4b5563' : '#9aa0b0',
        borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: tickColor, font: { size: 10 }, maxTicksLimit: 15 },
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: tickColor, font: { size: 11 } },
        title: { display: true, text: 'AQI', color: tickColor, font: { size: 12, weight: '500' } },
      },
    },
  };

  if (!isOpen) {
    return (
      <button className="compare-toggle-btn" onClick={() => setIsOpen(true)}>
        Compare Cities
      </button>
    );
  }

  return (
    <div className="city-compare fade-in">
      <div className="compare-header">
        <h3 className="compare-title">Compare Cities (select up to 3)</h3>
        <button className="compare-close" onClick={() => { setIsOpen(false); setSelectedCities([]); }}>
          <FiX />
        </button>
      </div>

      <div className="compare-city-selector">
        {locations.map(loc => {
          const isSelected = selectedCities.includes(String(loc.id));
          const colorIdx = selectedCities.indexOf(String(loc.id));
          return (
            <button
              key={loc.id}
              className={`compare-city-chip ${isSelected ? 'selected' : ''}`}
              style={isSelected ? { borderColor: COMPARE_COLORS[colorIdx], color: COMPARE_COLORS[colorIdx] } : {}}
              onClick={() => toggleCity(String(loc.id))}
              disabled={!isSelected && selectedCities.length >= 3}
            >
              {loc.name}
              {isSelected && <FiX className="chip-remove" onClick={e => { e.stopPropagation(); removeCity(String(loc.id)); }} />}
            </button>
          );
        })}
      </div>

      {isLoading && <div className="compare-loading">Loading comparison data...</div>}

      {chartData && chartData.datasets.length > 0 && !isLoading && (
        <div className="compare-chart-wrap">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}

      {selectedCities.length === 0 && (
        <div className="compare-empty">Select cities above to compare their AQI trends</div>
      )}
    </div>
  );
}
