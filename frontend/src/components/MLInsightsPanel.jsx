import { useState, useEffect, useRef } from "react";
import { fetchQueryResult } from "../services/api";
import "./MLInsightsPanel.css";

const QUERIES = {
  1: {
    question:
      "Which city experiences the longest consecutive duration of Severe AQI days in a year?",
    category: "Health Risk",
    icon: "",
    mlModel: "Linear Regression + Health Risk",
    sqlTech: "Window Functions (streak)",
  },
  2: {
    question:
      "Which state has shown the most improvement in average AQI over the last 3 years?",
    category: "Trend Forecast",
    icon: "",
    mlModel: "Trend Analysis",
    sqlTech: "Yearly Aggregation + LAG",
  },
  3: {
    question: "On which dates did extreme AQI spikes occur in each city?",
    category: "Anomaly Detection",
    icon: "",
    mlModel: "Isolation Forest",
    sqlTech: "Mean + StdDev Threshold",
  },
  4: {
    question:
      "Which cities have the highest number of Severe or Very Poor AQI days annually?",
    category: "Health Risk",
    icon: "",
    mlModel: "Rule-Based (NAQI)",
    sqlTech: "CASE + Category Count",
  },
  5: {
    question:
      "Which cities consistently remain in the Good AQI category across years?",
    category: "Clustering",
    icon: "",
    mlModel: "K-Means Clustering",
    sqlTech: "HAVING + Threshold",
  },
  6: {
    question:
      "What is the monthly average AQI for each city over the last 5 years?",
    category: "LSTM Forecast",
    icon: "",
    mlModel: "LSTM Neural Network",
    sqlTech: "GROUP BY month, city",
  },
  7: {
    question: "What is the monthly average PM2.5 level for each city?",
    category: "LSTM Forecast",
    icon: "",
    mlModel: "LSTM Neural Network",
    sqlTech: "GROUP BY month, city",
  },
  8: {
    question: "What is the yearly growth or decline rate of AQI in each city?",
    category: "Trend Forecast",
    icon: "",
    mlModel: "Linear Trend Projection",
    sqlTech: "LAG() Window Function",
  },
  9: {
    question:
      "Which month has the worst air quality (highest average AQI) each year?",
    category: "Pattern Analysis",
    icon: "",
    mlModel: "Pattern Detection + Heatmap",
    sqlTech: "ROW_NUMBER() + MAX",
  },
  10: {
    question:
      "How do PM2.5 levels fluctuate between summer and winter in North India?",
    category: "Seasonal Analysis",
    icon: "",
    mlModel: "Seasonal Decomposition",
    sqlTech: "CASE (Season Classification)",
  },
  11: {
    question: "Which pollutant (PM2.5 or PM10) dominates AQI in each city?",
    category: "Clustering",
    icon: "",
    mlModel: "Correlation Clustering",
    sqlTech: "Pearson Correlation (SQL)",
  },
  12: {
    question:
      "What is the correlation between PM2.5 and overall AQI across cities?",
    category: "Correlation",
    icon: "",
    mlModel: "Pearson Correlation Matrix",
    sqlTech: "AVG/STDDEV Correlation",
  },
  13: {
    question:
      "Which cities show increasing PM2.5 trends but stable overall AQI?",
    category: "Anomaly Detection",
    icon: "",
    mlModel: "Trend Divergence Detection",
    sqlTech: "Half-split Comparison",
  },
  14: {
    question:
      "What is the average AQI during weekends vs weekdays in each city?",
    category: "Pattern Analysis",
    icon: "",
    mlModel: "Statistical Comparison",
    sqlTech: "DAYOFWEEK + CASE",
  },
  15: {
    question:
      "How frequently do AQI levels change drastically (high volatility)?",
    category: "Anomaly Detection",
    icon: "",
    mlModel: "Volatility Analysis",
    sqlTech: "LAG() + ABS difference",
  },
  16: {
    question: "Which cities have the most unpredictable AQI patterns?",
    category: "Clustering",
    icon: "",
    mlModel: "Volatility Clustering",
    sqlTech: "STDDEV()",
  },
  17: {
    question:
      "What is the average duration of continuous polluted air spells (AQI > 200)?",
    category: "Health Risk",
    icon: "",
    mlModel: "Rule-Based (WHO)",
    sqlTech: "Streak Grouping (ROW_NUMBER)",
  },
  18: {
    question: "How does AQI change before and after rainfall/monsoon events?",
    category: "Seasonal Analysis",
    icon: "",
    mlModel: "Before/After Analysis",
    sqlTech: "Seasonal CASE Comparison",
  },
  19: {
    question:
      "Which cities show the fastest AQI recovery after extreme pollution days?",
    category: "Health Risk",
    icon: "",
    mlModel: "Recovery Pattern Analysis",
    sqlTech: "MIN(date) with JOIN",
  },
  20: {
    question:
      "How do pollution profiles (Gas vs Particulate) differ across regions?",
    category: "Clustering",
    icon: "",
    mlModel: "Profile Clustering",
    sqlTech: "SUM + CASE by Region",
  },
  21: {
    question:
      "Which region experiences the earliest onset of winter pollution spikes?",
    category: "Trend Forecast",
    icon: "",
    mlModel: "Onset Detection",
    sqlTech: "7-day Rolling AVG",
  },
  22: {
    question:
      "What are the 90th and 95th percentile pollution levels for each state?",
    category: "Health Risk",
    icon: "",
    mlModel: "Statistical Percentiles",
    sqlTech: "PERCENTILE_CONT()",
  },
  23: {
    question: "How does ground-level Ozone (O₃) vary across seasons?",
    category: "Seasonal Analysis",
    icon: "",
    mlModel: "Seasonal Comparison",
    sqlTech: "Seasonal CASE Groups",
  },
  24: {
    question:
      "Which cities exhibit the highest NO₂/AQI ratio indicating heavy traffic pollution?",
    category: "Trend Analysis",
    icon: "",
    mlModel: "Ratio Analysis",
    sqlTech: "AVG Ratio Computation",
  },
  25: {
    question:
      "What is the co-occurrence rate of CO and PM2.5 spikes during winter?",
    category: "Correlation",
    icon: "",
    mlModel: "Co-occurrence Analysis",
    sqlTech: "Percentile Threshold + CASE",
  },
  26: {
    question:
      "Are there hidden hazard days where O₃ or CO are dangerous but AQI remains Good?",
    category: "Anomaly Detection",
    icon: "",
    mlModel: "Multi-pollutant Anomaly",
    sqlTech: "WHERE + AND/OR Conditions",
  },
  27: {
    question:
      "How long does it take cities to recover after severe AQI events (≥401)?",
    category: "Health Risk",
    icon: "",
    mlModel: "Recovery Time Analysis",
    sqlTech: "DATEDIFF + MIN",
  },
  28: {
    question:
      "How many days before severe AQI does PM2.5 cross critical levels (early warning)?",
    category: "Trend Analysis",
    icon: "",
    mlModel: "Lead-Time Detection",
    sqlTech: "Self-JOIN + DATEDIFF",
  },
  29: {
    question: "Which cities have the sharpest winter-to-summer AQI drop?",
    category: "Seasonal Analysis",
    icon: "",
    mlModel: "Seasonal Contrast",
    sqlTech: "Seasonal AVG Difference",
  },
  30: {
    question: "Do severe AQI days cluster together in bursts?",
    category: "Anomaly Detection",
    icon: "",
    mlModel: "Burst Cluster Analysis",
    sqlTech: "ROW_NUMBER streak grouping",
  },
};

const CATEGORIES = [
  { key: "all", label: "All Queries", icon: "" },
  { key: "LSTM Forecast", label: "LSTM Forecast", icon: "" },
  { key: "Trend Forecast", label: "Trend", icon: "" },
  { key: "Anomaly Detection", label: "Anomaly", icon: "" },
  { key: "Clustering", label: "Clustering", icon: "" },
  { key: "Health Risk", label: "Health Risk", icon: "" },
  { key: "Seasonal Analysis", label: "Seasonal", icon: "" },
  { key: "Pattern Analysis", label: "Patterns", icon: "" },
  { key: "Correlation", label: "Correlation", icon: "" },
  { key: "Trend Analysis", label: "Analysis", icon: "" },
];

// --- NLP Query Matching Helpers ---
const STOP_WORDS = new Set([
  "what",
  "is",
  "the",
  "which",
  "do",
  "how",
  "are",
  "in",
  "of",
  "for",
  "to",
  "and",
  "on",
  "a",
  "an",
  "why",
  "where",
  "when",
  "who",
  "does",
  "did",
  "has",
  "have",
  "or",
  "with",
  "about",
]);

const SYNONYMS = {
  pollution: [
    "aqi",
    "pm25",
    "pm10",
    "pollutant",
    "smog",
    "air quality",
    "gas",
    "particulate",
  ],
  winter: ["december", "january", "february", "cold"],
  summer: ["april", "may", "june", "hot"],
  city: ["cities", "region", "area", "state", "regions", "states"],
  spike: [
    "increase",
    "rise",
    "high",
    "severe",
    "extreme",
    "burst",
    "anomaly",
    "hazard",
    "dangerous",
  ],
  drop: [
    "decrease",
    "fall",
    "low",
    "good",
    "improvement",
    "recovery",
    "stable",
    "clean",
  ],
  traffic: ["car", "no2", "vehicle", "vehicles"],
  health: ["risk", "severe", "hazard", "emergency"],
};

function expandTokens(tokens) {
  const expanded = new Set(tokens);
  for (const t of tokens) {
    for (const [key, syns] of Object.entries(SYNONYMS)) {
      if (key === t || syns.includes(t)) {
        expanded.add(key);
        syns.forEach((s) => expanded.add(s));
      }
    }
  }
  return Array.from(expanded);
}

function nlpScore(question, category, search) {
  if (!search.trim()) return 1;
  const cleanSearch = search.toLowerCase().replace(/[^\w\s]/g, "");
  const searchTokens = cleanSearch
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w));
  if (searchTokens.length === 0) return 1; // Fallback to full list if only stop words typed

  const searchExpanded = expandTokens(searchTokens);

  const textToSearch = (question + " " + category)
    .toLowerCase()
    .replace(/[^\w\s]/g, "");
  const targetTokens = textToSearch
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w));
  const targetExpanded = expandTokens(targetTokens);

  let score = 0;
  for (const st of searchExpanded) {
    if (targetExpanded.some((tt) => tt.includes(st) || st.includes(tt))) {
      score += 1;
    }
  }
  return score / Math.max(searchTokens.length, 1);
}
// ----------------------------------

export default function MLInsightsPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [sqlData, setSqlData] = useState(null);
  const [mlData, setMlData] = useState(null);
  const [isSqlLoading, setIsSqlLoading] = useState(false);
  const [isMlLoading, setIsMlLoading] = useState(false);
  const [sqlError, setSqlError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const detailRef = useRef(null);

  async function handleQueryClick(qid) {
    setSelectedQuery(qid);
    setSqlData(null);
    setMlData(null);
    setSqlError("");

    // Fetch SQL results
    setIsSqlLoading(true);
    try {
      const rows = await fetchQueryResult(qid);
      setSqlData(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setSqlError(err.message || "Failed to fetch SQL results");
    }
    setIsSqlLoading(false);

    // Fetch ML JSON data
    setIsMlLoading(true);
    try {
      let mlJson = null;

      // Try data.json first
      const res1 = await fetch(`/ml-results/q${qid}/data.json`);
      const ct1 = res1.headers.get("content-type") || "";
      if (res1.ok && ct1.includes("application/json")) {
        mlJson = await res1.json();
      }

      // Fallback: summary.json (Q3 uses this structure)
      if (!mlJson) {
        const res2 = await fetch(`/ml-results/q${qid}/summary.json`);
        const ct2 = res2.headers.get("content-type") || "";
        if (res2.ok && ct2.includes("application/json")) {
          mlJson = await res2.json();
        }
      }

      if (mlJson) {
        setMlData(mlJson);
      } else {
        setMlData({ error: "ML results not generated. Run generate_all.py." });
      }
    } catch {
      setMlData({ error: "Could not load ML results." });
    }
    setIsMlLoading(false);

    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  const filteredQueries = Object.entries(QUERIES)
    .map(([qid, q]) => {
      const matchesCategory =
        activeCategory === "all" || q.category === activeCategory;
      const score = searchTerm
        ? nlpScore(q.question, q.category, searchTerm)
        : 1;
      const exactMatch =
        searchTerm &&
        q.question.toLowerCase().includes(searchTerm.toLowerCase());
      const finalScore = exactMatch ? score + 1 : score;
      return { qid, q, matchesCategory, finalScore };
    })
    .filter(
      ({ matchesCategory, finalScore }) =>
        matchesCategory && (finalScore > 0.2 || !searchTerm),
    )
    .sort((a, b) => b.finalScore - a.finalScore)
    .map(({ qid, q }) => [qid, q]);

  function formatColumnName(key) {
    return key
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function formatCellValue(val) {
    if (val === null || val === undefined) return "—";
    if (typeof val === "number")
      return Number.isInteger(val) ? val.toLocaleString() : val.toFixed(2);
    if (typeof val === "string" && val.match(/^\d{4}-\d{2}-\d{2}/))
      return val.slice(0, 10);
    return String(val);
  }

  return (
    <div className="ml-insights-panel fade-in">
      {/* Header */}
      <div className="ml-header">
        <div className="ml-header-text">
          <h2 className="ml-title">
            <span className="ml-icon"></span>
            Research Query Engine
          </h2>
          <p className="ml-subtitle">
            Ask any of 30 analytical questions — get live SQL results from the
            database paired with ML-powered visual insights
          </p>
        </div>
        <div className="ml-model-badges">
          <span className="model-badge lstm">LSTM</span>
          <span className="model-badge isolation">Isolation Forest</span>
          <span className="model-badge kmeans">K-Means</span>
          <span className="model-badge health">Health Risk</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="ml-search-bar">
        <span className="search-icon"></span>
        <input
          type="text"
          className="search-input"
          placeholder="Search queries... e.g. 'severe AQI', 'PM2.5', 'winter', 'recovery'..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          id="query-search"
        />
        {searchTerm && (
          <button className="search-clear" onClick={() => setSearchTerm("")}>
            ✕
          </button>
        )}
        <span className="search-count">{filteredQueries.length} of 30</span>
      </div>

      {/* Category Filter */}
      <div className="ml-category-bar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={`ml-cat-btn ${activeCategory === cat.key ? "active" : ""}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            <span>{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      {/* Query Grid */}
      <div className="ml-query-grid">
        {filteredQueries.map(([qid, q]) => (
          <div
            key={qid}
            className={`ml-query-card ${selectedQuery === Number(qid) ? "selected" : ""}`}
            onClick={() => handleQueryClick(Number(qid))}
            id={`query-card-${qid}`}
          >
            <div className="qcard-header">
              <span className="qcard-icon">{q.icon}</span>
              <span className="qcard-id">Q{qid}</span>
            </div>
            <p className="qcard-question">{q.question}</p>
            <div className="qcard-footer">
              <span
                className={`qcard-badge ${q.category.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {q.category}
              </span>
            </div>
            <div className="qcard-tech-row">
              <span className="tech-tag sql-tag">SQL: {q.sqlTech}</span>
              <span className="tech-tag ml-tag">ML: {q.mlModel}</span>
            </div>
          </div>
        ))}
        {filteredQueries.length === 0 && (
          <div className="no-results">
            <span className="no-results-icon"></span>
            <p>No queries match "{searchTerm}"</p>
            <button
              className="search-clear-btn"
              onClick={() => {
                setSearchTerm("");
                setActiveCategory("all");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Detail Panel — SQL + ML Side by Side */}
      {selectedQuery && (
        <div
          className="ml-detail-panel fade-in"
          ref={detailRef}
          id="query-detail"
        >
          <div className="detail-header">
            <h3>
              <span className="detail-icon">
                {QUERIES[selectedQuery]?.icon}
              </span>
              Q{selectedQuery}: {QUERIES[selectedQuery]?.question}
            </h3>
            <button
              className="detail-close"
              onClick={() => {
                setSelectedQuery(null);
                setSqlData(null);
                setMlData(null);
              }}
            >
              ✕
            </button>
          </div>

          <div className="detail-meta">
            <span className="meta-badge sql-badge">
              SQL: {QUERIES[selectedQuery]?.sqlTech}
            </span>
            <span className="meta-badge ml-badge">
              ML: {QUERIES[selectedQuery]?.mlModel}
            </span>
            <span className="meta-badge category">
              {QUERIES[selectedQuery]?.category}
            </span>
          </div>

          <div className="detail-dual-view">
            {/* SQL Results Panel */}
            <div className="detail-panel-sql">
              <div className="panel-label">
                <span className="panel-label-icon"></span>
                SQL Query Results
                <span className="panel-label-sub">Live from MariaDB</span>
              </div>

              {isSqlLoading && (
                <div className="panel-loading">
                  <div className="spinner"></div> Running SQL query...
                </div>
              )}
              {sqlError && <div className="panel-error"> {sqlError}</div>}

              {sqlData && !isSqlLoading && (
                <div className="sql-results-wrap">
                  <div className="sql-row-count">
                    {sqlData.length} row{sqlData.length !== 1 ? "s" : ""}{" "}
                    returned
                  </div>
                  {sqlData.length > 0 ? (
                    <div className="sql-table-scroll">
                      <table className="sql-table">
                        <thead>
                          <tr>
                            {Object.keys(sqlData[0]).map((key) => (
                              <th key={key}>{formatColumnName(key)}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sqlData.slice(0, 50).map((row, i) => (
                            <tr key={i}>
                              {Object.values(row).map((val, j) => (
                                <td key={j}>{formatCellValue(val)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {sqlData.length > 50 && (
                        <div className="sql-truncated">
                          Showing first 50 of {sqlData.length} rows
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="sql-empty">
                      No rows returned for this query.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ML Insights Panel */}
            <div className="detail-panel-ml">
              <div className="panel-label">
                <span className="panel-label-icon"></span>
                ML-Powered Analysis
                <span className="panel-label-sub">Pre-computed Insights</span>
              </div>

              {isMlLoading && (
                <div className="panel-loading">
                  <div className="spinner"></div> Loading ML insights...
                </div>
              )}

              {mlData && !isMlLoading && (
                <div className="ml-results-wrap">
                  {mlData.error ? (
                    <div className="panel-error">{mlData.error}</div>
                  ) : (
                    <>
                      {/* Main plot */}
                      <div className="ml-plot-container">
                        <img
                          src={`/ml-results/q${selectedQuery}/plot.png`}
                          alt={`Q${selectedQuery} Visualization`}
                          className="ml-main-plot"
                          loading="lazy"
                        />
                      </div>

                      {/* Trend plot if exists */}
                      <div className="ml-plot-container">
                        <img
                          src={`/ml-results/q${selectedQuery}/trend.png`}
                          alt={`Q${selectedQuery} Trend`}
                          className="ml-main-plot"
                          loading="lazy"
                          onError={(e) => {
                            e.target.parentElement.style.display = "none";
                          }}
                        />
                      </div>

                      {/* Key findings */}
                      <div className="ml-findings">
                        <h4> Key Findings</h4>
                        {mlData.prediction && (
                          <div className="finding-item prediction">
                            <strong> Prediction:</strong> {mlData.prediction}
                          </div>
                        )}
                        {mlData.trend_slope !== undefined && (
                          <div className="finding-item">
                            <strong> Trend Slope:</strong> {mlData.trend_slope}{" "}
                            per year
                          </div>
                        )}
                        {mlData.best_improving && (
                          <div className="finding-item positive">
                            <strong> Most Improved:</strong>{" "}
                            {mlData.best_improving}
                          </div>
                        )}
                        {mlData.worst_declining && (
                          <div className="finding-item negative">
                            <strong> Most Declined:</strong>{" "}
                            {mlData.worst_declining}
                          </div>
                        )}
                        {mlData.most_unpredictable && (
                          <div className="finding-item">
                            <strong> Most Unpredictable:</strong>{" "}
                            {mlData.most_unpredictable}
                          </div>
                        )}
                        {mlData.cities_forecasted && (
                          <div className="finding-item">
                            <strong> Cities Forecasted:</strong>{" "}
                            {mlData.cities_forecasted.join(", ")}
                          </div>
                        )}
                        {mlData.good_cities && (
                          <div className="finding-item positive">
                            <strong> Clean Cities:</strong>{" "}
                            {mlData.good_cities.join(", ") || "None found"}
                          </div>
                        )}
                        {mlData.total_hazard_days !== undefined && (
                          <div className="finding-item negative">
                            <strong> Hidden Hazard Days:</strong>{" "}
                            {mlData.total_hazard_days} total
                          </div>
                        )}
                        {mlData.ml_type && (
                          <div className="finding-item">
                            <strong> ML Approach:</strong> {mlData.ml_type}
                          </div>
                        )}
                        {/* Q3 anomaly summary stats */}
                        {mlData.cities && Array.isArray(mlData.cities) && (
                          <div className="finding-item">
                            <strong> Cities Analyzed:</strong>{" "}
                            {mlData.cities.length} cities — Avg anomaly rate:{" "}
                            {(mlData.cities.reduce((s, c) => s + c.anomaly_rate, 0) / mlData.cities.length).toFixed(2)}%
                          </div>
                        )}
                      </div>

                      {/* Sub-city forecasts for Q6/Q7 */}
                      {(selectedQuery === 6 || selectedQuery === 7) &&
                        mlData.cities_forecasted && (
                          <div className="ml-sub-plots">
                            <h4> Per-City Forecast Plots</h4>
                            <div className="sub-plots-grid">
                              {mlData.cities_forecasted.map((city) => (
                                <div key={city} className="sub-plot-card">
                                  <h5>{city}</h5>
                                  <img
                                    src={`/ml-results/q${selectedQuery}/${city.replace(/ /g, "_").toLowerCase()}/plot.png`}
                                    alt={`${city} forecast`}
                                    className="sub-plot-img"
                                    loading="lazy"
                                    onError={(e) => {
                                      e.target.parentElement.style.display =
                                        "none";
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Q3 per-city anomaly detection plots */}
                      {selectedQuery === 3 &&
                        mlData.cities && Array.isArray(mlData.cities) && (
                          <div className="ml-sub-plots">
                            <h4> Per-City Anomaly Detection</h4>
                            <div className="sub-plots-grid">
                              {mlData.cities.map((c) => (
                                <div key={c.city} className="sub-plot-card">
                                  <h5>{c.city} <small style={{opacity:0.6}}>({c.anomalies_detected} anomalies, {c.anomaly_rate}%)</small></h5>
                                  <img
                                    src={`/ml-results/q3/${c.city.toLowerCase()}/plot.png`}
                                    alt={`${c.city} anomaly detection`}
                                    className="sub-plot-img"
                                    loading="lazy"
                                    onError={(e) => {
                                      e.target.parentElement.style.display =
                                        "none";
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
