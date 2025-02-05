import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RideData {
  ride_name: string;
  wait_time: number;
  last_update: string;
  is_open: boolean;
  timestamp: string;
}

interface RideMaxMinData {
  ride_name: string;
  max_wait_time?: number;
  min_wait_time?: number;
  timestamp: string;
}

interface TimeDataEntry {
  time: string;
  waitTime: number | null;
  isOpen: boolean;
}

interface ProcessedData {
  currentData: RideData[];
  maxData: RideMaxMinData[];
  minData: RideMaxMinData[];
  timeData: Record<string, TimeDataEntry[]>;
  latestTimestamp: string | null;
}

const DisneyQueueDashboard = () => {
  const [allData, setAllData] = useState<RideData[]>([]);
  const [maxData, setMaxData] = useState<RideMaxMinData[]>([]);
  const [minData, setMinData] = useState<RideMaxMinData[]>([]);
  const [selectedAttraction, setSelectedAttraction] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [attractionTimeData, setAttractionTimeData] = useState<Record<string, TimeDataEntry[]>>({});

  const WALT_DISNEY_STUDIOS_URL = 'https://bestnextridestack-bestnextridebucket135078ea-swjzevhnqjw9.s3.eu-west-1.amazonaws.com/Walt_Disney_Studios_Paris/2025/02/02/queue_times.csv';
  const DISNEYLAND_PARK_URL = 'https://bestnextridestack-bestnextridebucket135078ea-swjzevhnqjw9.s3.eu-west-1.amazonaws.com/Disneyland_Park_Paris/2025/02/02/queue_times.csv';

  const categoryColors: Record<string, string> = {
    'Short': 'bg-green-600 text-white',
    'Medium': 'bg-yellow-600 text-white',
    'Long': 'bg-orange-600 text-white',
    'Very Long': 'bg-red-600 text-white',
    'Closed': 'bg-gray-600 text-white',
  };

  const getWaitTimeColor = (waitTime: number, isOpen: boolean): string => {
    if (!isOpen) return 'text-gray-700';
    if (waitTime <= 15) return 'text-green-700';
    if (waitTime <= 30) return 'text-yellow-700';
    if (waitTime <= 45) return 'text-orange-700';
    return 'text-red-700';
  };

  const getCategoryFromWaitTime = (waitTime: number, isOpen: boolean): string => {
    if (!isOpen) return 'Closed';
    if (waitTime <= 15) return 'Short';
    if (waitTime <= 30) return 'Medium';
    if (waitTime <= 45) return 'Long';
    return 'Very Long';
  };

  const processCSVData = (csvText: string): ProcessedData => {
    const rows = csvText.trim().split('\n').map(row =>
      row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        .map(field => field.trim().replace(/^"|"$/g, ''))
    );

    const latestEntries: Record<string, RideData> = {};
    const maxWaitTimes: Record<string, RideMaxMinData> = {};
    const minWaitTimes: Record<string, RideMaxMinData> = {};
    const timeData: Record<string, TimeDataEntry[]> = {};

    rows.slice(1).forEach(([timestamp, rideName, waitTime, lastUpdate, isOpen]) => {
      const numericWaitTime = parseInt(waitTime, 10) || 0;
      const isRideOpen = isOpen.toLowerCase() === 'true';
      const rideKey = rideName.trim();

      const currentDate = new Date(timestamp);
      currentDate.setHours(currentDate.getHours() + 1);
      const currentHour = currentDate.getHours();

      if (!timeData[rideKey]) {
        timeData[rideKey] = [];
      }
      if (currentHour >= 8 && currentHour <= 21) {
        timeData[rideKey].push({
          time: currentDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }),
          waitTime: isRideOpen ? numericWaitTime : null,
          isOpen: isRideOpen
        });
      }

      const existingDate = latestEntries[rideKey] ? new Date(latestEntries[rideKey].timestamp).getTime() : 0;
      if (!latestEntries[rideKey] || currentDate.getTime() > existingDate) {
        latestEntries[rideKey] = {
          ride_name: rideKey,
          wait_time: numericWaitTime,
          last_update: lastUpdate,
          is_open: isRideOpen,
          timestamp: currentDate.toISOString(),
        };
      }

      if (isRideOpen) {
        if (!maxWaitTimes[rideKey] || numericWaitTime > maxWaitTimes[rideKey].max_wait_time!) {
          maxWaitTimes[rideKey] = {
            ride_name: rideKey,
            max_wait_time: numericWaitTime,
            timestamp: currentDate.toISOString()
          };
        }

        if (currentHour >= 10 && currentHour < 18) {
          if (!minWaitTimes[rideKey] || numericWaitTime < minWaitTimes[rideKey].min_wait_time!) {
            minWaitTimes[rideKey] = {
              ride_name: rideKey,
              min_wait_time: numericWaitTime,
              timestamp: currentDate.toISOString()
            };
          }
        }
      }
    });

    Object.keys(timeData).forEach(key => {
      timeData[key].sort((a, b) => {
        return new Date('1970/01/01 ' + a.time).getTime() - new Date('1970/01/01 ' + b.time).getTime();
      });
    });

    const currentData = Object.values(latestEntries);
    const maxData = Object.values(maxWaitTimes);
    const minData = Object.values(minWaitTimes);

    const latestTimestamp = currentData.length > 0
      ? currentData.reduce((max, entry) =>
          Math.max(max, new Date(entry.timestamp).getTime()), 0)
      : null;

    return {
      currentData,
      maxData,
      minData,
      timeData,
      latestTimestamp: latestTimestamp ? new Date(latestTimestamp).toISOString() : null
    };
  };

  const fetchCSVFromS3 = async (url: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const csvText = await response.text();
      const { currentData, maxData, minData, timeData, latestTimestamp } = processCSVData(csvText);

      setAllData(currentData);
      setMaxData(maxData);
      setMinData(minData);
      setAttractionTimeData(timeData);
      setLastUpdated(latestTimestamp ? new Date(latestTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown');
    } catch (err) {
      console.error("Error fetching CSV from S3:", err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const categorizeAttractions = (): Record<string, RideData[]> => {
    const categories = {
      'Short': [],
      'Medium': [],
      'Long': [],
      'Very Long': [],
      'Closed': [],
    } as Record<string, RideData[]>;

    return allData.reduce((acc, entry) => {
      const category = getCategoryFromWaitTime(entry.wait_time, entry.is_open);
      acc[category].push(entry);
      return acc;
    }, categories);
  };

  const filteredAttractions = (): string[] => {
    return allData
      .filter(entry => entry.ride_name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(entry => entry.ride_name)
      .sort();
  };

  const selectedAttractionData = (): RideData | undefined => {
    if (!selectedAttraction) return undefined;
    return allData.find(entry => entry.ride_name === selectedAttraction);
  };

  const renderWaitTimeChart = () => {
    if (!selectedAttraction || !attractionTimeData[selectedAttraction]) return null;

    return (
      <div className="h-64 w-full mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={attractionTimeData[selectedAttraction]}
            margin={{ top: 5, right: 20, bottom: 25, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tickFormatter={(time: string) => time}
              interval="preserveStartEnd"
              minTickGap={50}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              label={{
                value: 'Wait Time (minutes)',
                angle: -90,
                position: 'insideLeft',
                offset: 10
              }}
            />
            <Tooltip
              formatter={(value: number) => [value ? `${value} minutes` : 'Closed', 'Wait Time']}
              labelFormatter={(label: string) => `Time: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="waitTime"
              stroke="#4f46e5"
              dot={false}
              name="Wait Time"
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderAttractionDetails = () => {
    const data = selectedAttractionData();
    if (!data) return null;

    const maxEntry = maxData.find(entry => entry.ride_name === selectedAttraction);
    const minEntry = minData.find(entry => entry.ride_name === selectedAttraction);

    return (
      <div className="bg-white shadow-lg rounded-lg p-6 mt-4">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">{data.ride_name}</h2>
        {renderWaitTimeChart()}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Current Wait</h3>
            <span className={`text-2xl font-bold ${getWaitTimeColor(data.wait_time, data.is_open)}`}>
              {data.is_open ? `${data.wait_time} min` : 'Closed'}
            </span>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Peak Wait Today</h3>
            <span className={`text-2xl font-bold ${maxEntry ? getWaitTimeColor(maxEntry.max_wait_time!, true) : 'text-gray-700'}`}>
              {maxEntry ? `${maxEntry.max_wait_time} min` : 'N/A'}
            </span>
            {maxEntry && (
              <div className="text-xs text-gray-600 mt-1">
                at {new Date(maxEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Least Wait Today</h3>
            <span className={`text-2xl font-bold ${minEntry ? getWaitTimeColor(minEntry.min_wait_time!, true) : 'text-gray-700'}`}>
              {minEntry ? `${minEntry.min_wait_time} min` : 'N/A'}
            </span>
            {minEntry && (
              <div className="text-xs text-gray-600 mt-1">
                at {new Date(minEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-700">Category:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColors[getCategoryFromWaitTime(data.wait_time, data.is_open)]}`}>
            {getCategoryFromWaitTime(data.wait_time, data.is_open)}
          </span>
        </div>
        <div className="text-sm text-gray-600 text-center">
          Last updated: {lastUpdated || 'Unknown'}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-md bg-gray-50">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search attractions..."
          className="w-full p-2 border rounded shadow-sm text-gray-800 bg-white"
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="attraction-select" className="block text-sm font-medium text-gray-700">
          Select an attraction
        </label>
        <select
          id="attraction-select"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-gray-800 bg-white border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
          value={selectedAttraction}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedAttraction(e.target.value)}
        >
          <option value="">Select an attraction</option>
          {filteredAttractions().map((attraction) => (
            <option key={attraction} value={attraction}>
              {attraction}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          className="w-1/2 p-2 bg-indigo-600 text-white rounded shadow-sm hover:bg-indigo-700 font-medium"
          onClick={() => fetchCSVFromS3(DISNEYLAND_PARK_URL)}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Disneyland Park'}
        </button>
        <button
          className="w-1/2 p-2 bg-purple-600 text-white rounded shadow-sm hover:bg-purple-700 font-medium"
          onClick={() => fetchCSVFromS3(WALT_DISNEY_STUDIOS_URL)}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Disney Studios'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded shadow-sm border border-red-200">
          {error}
        </div>
      )}

      {renderAttractionDetails()}

      <div className="mt-6">
        {Object.entries(categorizeAttractions()).map(([category, items]) => (
          <div key={category} className="mb-6">
            <h3 className={`text-lg font-bold mb-3 p-2 rounded shadow-sm ${categoryColors[category]}`}>
              {category} ({items.length})
            </h3>
            {items.length > 0 ? (
              <div className="grid gap-2">
                {items.map((item) => (
                  <div
                    key={item.ride_name}
                    className="flex justify-between items-center p-3 bg-white shadow-sm rounded cursor-pointer hover:bg-gray-50 border border-gray-100"
                    onClick={() => setSelectedAttraction(item.ride_name)}
                  >
                    <span className="font-medium text-gray-800">{item.ride_name}</span>
                    <span className={`text-sm font-semibold ${getWaitTimeColor(item.wait_time, item.is_open)}`}>
                      {item.is_open ? `${item.wait_time} min` : 'Closed'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center bg-white p-4 rounded shadow-sm">
                No attractions in this category
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DisneyQueueDashboard;