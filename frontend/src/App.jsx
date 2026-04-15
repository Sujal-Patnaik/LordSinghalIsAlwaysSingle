import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import MetricTabs from './components/MetricTabs';
import AqiScale from './components/AqiScale';
import TrendChart from './components/TrendChart';
import HistoricalChart from './components/HistoricalChart';
import StatsOverview from './components/StatsOverview';
import MLInsightsPanel from './components/MLInsightsPanel';
import CityCompare from './components/CityCompare';
import AqiDistribution from './components/AqiDistribution';
import DeepDivePanel from './components/DeepDivePanel';
import { fetchCities, fetchDailyAqi } from './services/api';
import { aggregateWeekly, aggregateMonthly } from './utils/dataTransforms';
import './App.css';

export default function App() {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(2); // March
  const [selectedYear, setSelectedYear] = useState(2026);
  const [granularity, setGranularity] = useState('daily');
  const [activeMetric, setActiveMetric] = useState('aqi');
  const [dailyData, setDailyData] = useState([]);
  const [isDailyLoading, setIsDailyLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'ml-insights'


  useEffect(() => {
    let ignore = false;

    async function loadCities() {
      try {
        const cities = await fetchCities();
        if (!ignore) {
          setLocations(cities);
        }
      } catch (error) {
        if (!ignore) {
          setDataError(error.message || 'Failed to load cities.');
        }
      }
    }

    loadCities();

    return () => {
      ignore = true;
    };
  }, []);



  const location = useMemo(() => (
    locations.find(l => String(l.id) === String(selectedLocation))
  ), [locations, selectedLocation]);

  // Build the date range for selected month/year
  const dateRange = useMemo(() => {
    const daysInMonth = selectedYear === 2026 && selectedMonth === 2
      ? 26
      : new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const start = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
    const end = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
    return { start, end };
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    let ignore = false;

    async function loadDailyData() {
      if (!selectedLocation) {
        setDailyData([]);
        return;
      }

      try {
        setIsDailyLoading(true);
        setDataError('');

        const response = await fetchDailyAqi({
          cityId: selectedLocation,
          startDate: dateRange.start,
          endDate: dateRange.end,
        });

        if (!ignore) {
          setDailyData(response);
        }
      } catch (error) {
        if (!ignore) {
          setDailyData([]);
          setDataError(error.message || 'Failed to load AQI data.');
        }
      } finally {
        if (!ignore) {
          setIsDailyLoading(false);
        }
      }
    }

    loadDailyData();

    return () => {
      ignore = true;
    };
  }, [selectedLocation, dateRange]);

  const aggregatedData = useMemo(() => {
    if (granularity === 'weekly') return aggregateWeekly(dailyData);
    if (granularity === 'monthly') return aggregateMonthly(dailyData);
    return dailyData;
  }, [dailyData, granularity]);

  const currentAqi = dailyData.length > 0
    ? dailyData[dailyData.length - 1].daily.avgAqi
    : 0;

  function handleSelectCity(cityId) {
    setSelectedLocation(String(cityId));
  }

  function handleYearChange(year) {
    setSelectedYear(year);
    // Clamp month if 2026
    if (year === 2026 && selectedMonth > 2) {
      setSelectedMonth(2);
    }
  }

  return (
    <div className="app">
      <Header location={location} />

      <div className="view-switcher">
        <button
          className={`view-tab ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveView('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`view-tab ${activeView === 'ml-insights' ? 'active' : ''}`}
          onClick={() => setActiveView('ml-insights')}
        >
          Queries
        </button>
      </div>

      <main className="app-content">
        {activeView === 'dashboard' ? (
          /* ── Dashboard View ─── */
          <>
            <FilterBar
              locations={locations}
              selectedLocation={selectedLocation}
              onLocationChange={setSelectedLocation}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              selectedYear={selectedYear}
              onYearChange={handleYearChange}
              granularity={granularity}
              onGranularityChange={setGranularity}
            />

            {dataError && <p className="app-data-error">{dataError}</p>}

            {!selectedLocation ? (
              <>
                <StatsOverview
                  onSelectCity={handleSelectCity}
                  locations={locations}
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                  granularity={granularity}
                />

                {/* City Compare Mode */}
                <CityCompare
                  locations={locations}
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                />

                {/* AQI Distribution Chart */}
                <AqiDistribution locations={locations} selectedYear={selectedYear} selectedMonth={selectedMonth} granularity={granularity} />
              </>
            ) : (
              <div className="city-detail fade-in">
                <div className="city-detail-header">
                  <h2 className="city-title">
                    <span className="city-name-highlight">{location?.name}, {location?.state}</span>
                    {' '}Historical Air Quality Analysis
                  </h2>
                  <p className="city-subtitle">
                    Dive into detailed Air Quality Insights with historical data, monthly patterns, and yearly trends at your fingertips!
                  </p>
                </div>

                <AqiScale currentAqi={currentAqi} />
                <MetricTabs activeMetric={activeMetric} onMetricChange={setActiveMetric} />
                {isDailyLoading && <p className="city-loading">Loading city data...</p>}

                <TrendChart
                  data={aggregatedData}
                  metric={activeMetric}
                  granularity={granularity}
                />
                <HistoricalChart
                  locationId={selectedLocation}
                  month={selectedMonth}
                  metric={activeMetric}
                  locationName={`${location?.name}, ${location?.state}`}
                />

                {/* Deep Dive Panel */}
                <DeepDivePanel
                  dailyData={dailyData}
                  location={location}
                  metric={activeMetric}
                />
              </div>
            )}
          </>
        ) : (
          /* ── ML Insights View ─── */
          <MLInsightsPanel />
        )}
      </main>


    </div>
  );
}
