import { useState, useMemo } from 'react';
import { getAqiLabel, computeVolatility, computeMomentum } from '../utils/aqiHelpers';
import './DeepDivePanel.css';

export default function DeepDivePanel({ dailyData, location, metric = 'aqi' }) {
  const [activeTab, setActiveTab] = useState('trends');

  const tabs = [
    { id: 'trends', label: 'Trends' },
    { id: 'seasonality', label: 'Seasonality' },
    { id: 'growth', label: 'Growth' },
    { id: 'forecast', label: 'Forecast' },
  ];

  const metricKey = metric === 'aqi' ? 'avgAqi' : metric === 'pm25' ? 'avgPm25' : 'avgPm10';
  const metricLabel = metric === 'aqi' ? 'AQI' : metric === 'pm25' ? 'PM2.5' : 'PM10';

  // Compute insights from daily data
  const insights = useMemo(() => {
    if (!dailyData || dailyData.length < 2) return [];

    const values = dailyData.map(d => d.daily[metricKey]);
    const avg = Math.round(values.reduce((s, v) => s + v, 0) / values.length);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const latest = values[values.length - 1];
    const previous = values.length > 7 ? values[values.length - 8] : values[0];

    const volatility = computeVolatility(values);
    const momentum = computeMomentum(latest, previous);

    const maxDay = dailyData[values.indexOf(max)];
    const minDay = dailyData[values.indexOf(min)];

    const items = [];
    items.push(`Average ${metricLabel} this period: **${avg}** (${getAqiLabel(avg)})`);
    items.push(`Peak ${metricLabel}: **${max}** on ${maxDay?.date || 'N/A'}`);
    items.push(`Lowest ${metricLabel}: **${min}** on ${minDay?.date || 'N/A'}`);
    items.push(`Volatility: **${volatility.label}** (σ = ${volatility.stddev})`);
    if (momentum.direction !== 'flat') {
      items.push(`Momentum: **${momentum.label}** (${momentum.value > 0 ? '+' : ''}${momentum.value} from last week)`);
    }

    return items;
  }, [dailyData, metricKey, metricLabel]);

  // Seasonality — group by week and find best/worst
  const seasonality = useMemo(() => {
    if (!dailyData || dailyData.length < 7) return null;

    // Group into weeks
    const weeks = [];
    for (let i = 0; i < dailyData.length; i += 7) {
      const chunk = dailyData.slice(i, i + 7);
      if (chunk.length === 0) continue;
      const avg = Math.round(chunk.reduce((s, d) => s + d.daily[metricKey], 0) / chunk.length);
      weeks.push({ start: chunk[0].date, end: chunk[chunk.length - 1].date, avg });
    }

    if (weeks.length < 2) return null;

    const best = weeks.reduce((a, b) => a.avg < b.avg ? a : b);
    const worst = weeks.reduce((a, b) => a.avg > b.avg ? a : b);

    return { best, worst };
  }, [dailyData, metricKey]);

  // Growth — compare first half vs second half
  const growth = useMemo(() => {
    if (!dailyData || dailyData.length < 4) return null;
    const mid = Math.floor(dailyData.length / 2);
    const firstHalf = dailyData.slice(0, mid);
    const secondHalf = dailyData.slice(mid);
    const avgFirst = Math.round(firstHalf.reduce((s, d) => s + d.daily[metricKey], 0) / firstHalf.length);
    const avgSecond = Math.round(secondHalf.reduce((s, d) => s + d.daily[metricKey], 0) / secondHalf.length);
    const change = avgSecond - avgFirst;
    const pct = avgFirst > 0 ? Math.round((change / avgFirst) * 100) : 0;
    return { avgFirst, avgSecond, change, pct };
  }, [dailyData, metricKey]);

  if (!dailyData || dailyData.length === 0 || !location) return null;

  return (
    <div className="deep-dive fade-in">
      <div className="deep-dive-header">
        <h3 className="deep-dive-title">Deep Dive: {location.name}</h3>
      </div>

      <div className="deep-dive-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`deep-dive-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="deep-dive-content">
        {activeTab === 'trends' && (
          <div className="deep-dive-section">
            <h4>Key Insights</h4>
            <ul className="insight-list">
              {insights.map((item, i) => (
                <li key={i} className="insight-item" dangerouslySetInnerHTML={{
                  __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                }} />
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'seasonality' && seasonality && (
          <div className="deep-dive-section">
            <h4>Weekly Patterns</h4>
            <div className="season-cards">
              <div className="season-card best">
                <div className="season-label">Best Week</div>
                <div className="season-value">{seasonality.best.avg} {metricLabel}</div>
                <div className="season-dates">{seasonality.best.start} → {seasonality.best.end}</div>
              </div>
              <div className="season-card worst">
                <div className="season-label">Worst Week</div>
                <div className="season-value">{seasonality.worst.avg} {metricLabel}</div>
                <div className="season-dates">{seasonality.worst.start} → {seasonality.worst.end}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'growth' && growth && (
          <div className="deep-dive-section">
            <h4>Period Comparison</h4>
            <div className="growth-comparison">
              <div className="growth-half">
                <div className="growth-label">First Half Avg</div>
                <div className="growth-value">{growth.avgFirst}</div>
              </div>
              <div className="growth-arrow">
                <span className={growth.change > 0 ? 'negative' : 'positive'}>
                  {growth.change > 0 ? '↑' : '↓'} {Math.abs(growth.pct)}%
                </span>
              </div>
              <div className="growth-half">
                <div className="growth-label">Second Half Avg</div>
                <div className="growth-value">{growth.avgSecond}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'forecast' && (
          <div className="deep-dive-section">
            <h4>Forecast Summary</h4>
            <p className="forecast-note">
              Based on current trends, {location.name}'s {metricLabel} is expected to
              {growth && growth.change > 0
                ? ` continue rising. Consider monitoring closely.`
                : ` remain stable or improve.`
              }
            </p>
            {insights.length > 0 && (
              <ul className="insight-list">
                <li className="insight-item">
                  Latest {metricLabel}: <strong>{dailyData[dailyData.length - 1]?.daily[metricKey]}</strong>
                </li>
                <li className="insight-item">
                  Category: <strong>{getAqiLabel(dailyData[dailyData.length - 1]?.daily[metricKey] || 0)}</strong>
                </li>
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
