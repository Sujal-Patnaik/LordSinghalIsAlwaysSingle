import { useMemo, useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTheme } from '../context/ThemeContext';
import { fetchHistoricalAqi } from '../services/api';
import './AqiDistribution.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const CATEGORIES = [
  { key: 'Good', color: '#55a84f', test: aqi => aqi <= 50 },
  { key: 'Moderate', color: '#a3c853', test: aqi => aqi > 50 && aqi <= 100 },
  { key: 'Poor', color: '#fff833', test: aqi => aqi > 100 && aqi <= 150 },
  { key: 'Unhealthy', color: '#f29c33', test: aqi => aqi > 150 && aqi <= 200 },
  { key: 'Severe', color: '#e93f33', test: aqi => aqi > 200 && aqi <= 300 },
  { key: 'Hazardous', color: '#af2d24', test: aqi => aqi > 300 },
];

export default function AqiDistribution({ locations, selectedYear, selectedMonth, granularity }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [yearData, setYearData] = useState([]); // { id, name, avgAqi }
  const [isLoading, setIsLoading] = useState(false);

  const isYearly = granularity === 'yearly';

  // Fetch historical data for all cities and extract the selected year's avg AQI
  useEffect(() => {
    if (!locations || locations.length === 0) return;

    let ignore = false;
    async function loadData() {
      setIsLoading(true);
      const results = [];

      const monthsToFetch = isYearly
        ? Array.from({ length: selectedYear === 2026 ? 3 : 12 }, (_, i) => i)
        : [selectedMonth];

      for (const loc of locations) {
        try {
          let totalAqi = 0, count = 0;

          for (const m of monthsToFetch) {
            const historical = await fetchHistoricalAqi({ cityId: loc.id, month: m });
            const yearEntry = historical.find(h => h.year === selectedYear);
            if (yearEntry) {
              totalAqi += yearEntry.avgAqi;
              count++;
            }
          }

          if (count > 0) {
            results.push({
              id: loc.id,
              name: loc.name,
              state: loc.state,
              avgAqi: Math.round(totalAqi / count),
            });
          }
        } catch {
          // skip city on error
        }
      }

      if (!ignore) {
        setYearData(results);
        setIsLoading(false);
      }
    }

    loadData();
    return () => { ignore = true; };
  }, [locations, selectedYear, selectedMonth, isYearly]);

  // Group cities into AQI categories
  const { chartCategories, cityMap } = useMemo(() => {
    if (yearData.length === 0) return { chartCategories: [], cityMap: {} };

    const map = {};
    CATEGORIES.forEach(cat => { map[cat.key] = []; });

    yearData.forEach(city => {
      const category = CATEGORIES.find(c => c.test(city.avgAqi));
      if (category) {
        map[category.key].push(city);
      }
    });

    const active = CATEGORIES.filter(c => map[c.key].length > 0);
    return { chartCategories: active, cityMap: map };
  }, [yearData]);

  if (isLoading) {
    return (
      <div className="aqi-distribution">
        <div className="dist-header">
          <h3 className="dist-title">AQI Distribution</h3>
          <span className="dist-subtitle">Loading data for {selectedYear}...</span>
        </div>
      </div>
    );
  }

  if (chartCategories.length === 0) return null;

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const periodLabel = isYearly ? `Year ${selectedYear}` : `${monthNames[selectedMonth]} ${selectedYear}`;

  const chartData = {
    labels: chartCategories.map(c => c.key),
    datasets: [{
      data: chartCategories.map(c => cityMap[c.key].length),
      backgroundColor: chartCategories.map(c => c.color),
      borderColor: isLight ? '#ffffff' : '#1a1d26',
      borderWidth: 3,
      hoverOffset: 18,
      hoverBorderWidth: 0,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '55%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: isLight ? '#4b5563' : '#9aa0b0',
          font: { size: 12, family: 'Inter', weight: '500' },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          generateLabels: (chart) => {
            const data = chart.data;
            return data.labels.map((label, i) => ({
              text: `${label} (${data.datasets[0].data[i]})`,
              fillStyle: data.datasets[0].backgroundColor[i],
              strokeStyle: 'transparent',
              pointStyle: 'circle',
              index: i,
            }));
          },
        },
      },
      tooltip: {
        backgroundColor: isLight ? 'rgba(255,255,255,0.97)' : 'rgba(30,34,48,0.97)',
        titleColor: isLight ? '#1a1d26' : '#e8eaed',
        bodyColor: isLight ? '#4b5563' : '#9aa0b0',
        borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        cornerRadius: 10,
        padding: 14,
        titleFont: { size: 13, weight: '700', family: 'Inter' },
        bodyFont: { size: 12, family: 'Inter' },
        callbacks: {
          title: (items) => {
            const idx = items[0]?.dataIndex;
            const cat = chartCategories[idx];
            return cat ? `${cat.key} — ${cityMap[cat.key].length} ${cityMap[cat.key].length === 1 ? 'city' : 'cities'}` : '';
          },
          label: () => '',
          afterBody: (items) => {
            const idx = items[0]?.dataIndex;
            const cat = chartCategories[idx];
            if (!cat) return '';
            return cityMap[cat.key].map(c => `  • ${c.name} (Avg AQI: ${c.avgAqi})`);
          },
        },
      },
    },
    onHover: (event, elements) => {
      if (elements.length > 0) {
        setHoveredIndex(elements[0].index);
      } else {
        setHoveredIndex(null);
      }
    },
  };

  return (
    <div className="aqi-distribution">
      <div className="dist-header">
        <h3 className="dist-title">AQI Distribution</h3>
        <span className="dist-subtitle">Cities by air quality category — {periodLabel}</span>
      </div>
      <div className="dist-chart-container">
        <div className="dist-chart-wrap">
          <Doughnut data={chartData} options={options} />
        </div>
        {hoveredIndex !== null && chartCategories[hoveredIndex] && (
          <div className="dist-detail-panel fade-in">
            <div className="dist-detail-cat" style={{ color: chartCategories[hoveredIndex].color }}>
              {chartCategories[hoveredIndex].key}
            </div>
            <ul className="dist-city-list">
              {cityMap[chartCategories[hoveredIndex].key].map(city => (
                <li key={city.id} className="dist-city-item">
                  <span className="dist-city-name">{city.name}</span>
                  <span className="dist-city-aqi" style={{ color: chartCategories[hoveredIndex].color }}>
                    {city.avgAqi}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
