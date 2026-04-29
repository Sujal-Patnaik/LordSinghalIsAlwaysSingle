USE aqi_db;

INSERT INTO cities (city_name, state, region) VALUES
('Delhi', 'Delhi', 'North'),
('Mumbai', 'Maharashtra', 'West'),
('Kolkata', 'West Bengal', 'East'),
('Chennai', 'Tamil Nadu', 'South'),
('Bangalore', 'Karnataka', 'South'),
('Hyderabad', 'Telangana', 'South'),
('Ahmedabad', 'Gujarat', 'West'),
('Pune', 'Maharashtra', 'West'),
('Jaipur', 'Rajasthan', 'North'),
('Lucknow', 'Uttar Pradesh', 'North'),
('Chandigarh', 'Chandigarh', 'North'),
('Bhopal', 'Madhya Pradesh', 'Central'),
('Indore', 'Madhya Pradesh', 'Central'),
('Noida', 'Uttar Pradesh', 'North'),
('Guwahati', 'Assam', 'Northeast');

-- Create a temporary staging table
CREATE TEMPORARY TABLE aqi_data_staging (
    city_name VARCHAR(50),
    date DATE,
    co FLOAT,
    no2 FLOAT,
    o3 FLOAT,
    pm10 FLOAT,
    pm25 FLOAT,
    aqi_daily FLOAT
);

LOAD DATA LOCAL INFILE 'data/csv/merged/final_merged_aqi_data.csv'
INTO TABLE aqi_data_staging
FIELDS TERMINATED BY ','
IGNORE 1 ROWS
(city_name, date, co, no2, o3, pm10, pm25, aqi_daily, @aqi_monthly);

INSERT INTO aqi_data (city_id, date, co, no2, o3, pm10, pm25, aqi_daily)
SELECT 
    c.city_id, 
    s.date, 
    s.co, 
    s.no2, 
    s.o3, 
    s.pm10, 
    s.pm25, 
    s.aqi_daily
FROM aqi_data_staging s
JOIN cities c ON LOWER(TRIM(s.city_name)) = LOWER(TRIM(c.city_name));

DROP TEMPORARY TABLE aqi_data_staging;
