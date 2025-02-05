import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Container,
  Button,
  Input,
  ChartContainer,
  CategoryHeader,
  AttractionItem,
  StatsContainer,
  StatBox,
  ErrorMessage,
  WaitTime,
  theme,
  ButtonGroup,
  UpdateInfo,
  AttractionTitle,
  SearchSuggestions,
  SearchSuggestionItem,
  DateModeContainer,
  RadioGroup,
  RadioLabel,
  DateInput,
} from './style';

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
  // Existing state variables...
  const [allData, setAllData] = useState<RideData[]>([]);
  const [maxData, setMaxData] = useState<RideMaxMinData[]>([]);
  const [minData, setMinData] = useState<RideMaxMinData[]>([]);
  const [selectedAttraction, setSelectedAttraction] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [attractionTimeData, setAttractionTimeData] = useState<Record<string, TimeDataEntry[]>>({});

  // New state for date mode selection:
  const [dateMode, setDateMode] = useState<'today' | 'historical'>('today');
  // historicalDate in format "YYYY-MM-DD"
  const [historicalDate, setHistoricalDate] = useState<string>('');

  // Utility: formats a Date to "YYYY/MM/DD"
  const formatDateForUrl = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  // Returns the S3 URL for the given park based on the date mode.
  const getUrl = (park: 'disneyland' | 'studios'): string => {
    let datePath = '';
    if (dateMode === 'today') {
      datePath = formatDateForUrl(new Date());
    } else if (dateMode === 'historical' && historicalDate) {
      // Convert from "YYYY-MM-DD" to "YYYY/MM/DD"
      datePath = historicalDate.replace(/-/g, '/');
    } else {
      // Fallback: if historical selected but no date chosen, use today’s date.
      datePath = formatDateForUrl(new Date());
    }

    if (park === 'disneyland') {
      return `https://bestnextridestack-bestnextridebucket135078ea-swjzevhnqjw9.s3.eu-west-1.amazonaws.com/Disneyland_Park_Paris/${datePath}/queue_times.csv`;
    } else {
      return `https://bestnextridestack-bestnextridebucket135078ea-swjzevhnqjw9.s3.eu-west-1.amazonaws.com/Walt_Disney_Studios_Paris/${datePath}/queue_times.csv`;
    }
  };

  const getWaitTimeColor = (waitTime: number, isOpen: boolean): string => {
    if (!isOpen) return theme.colors.gray;
    if (waitTime <= 15) return theme.colors.success;
    if (waitTime <= 30) return theme.colors.warning;
    if (waitTime <= 45) return theme.colors.danger;
    return theme.colors.danger;
  };

  const getCategoryFromWaitTime = (
    waitTime: number,
    isOpen: boolean
  ): keyof typeof theme.categoryColors => {
    if (!isOpen) return 'Closed';
    if (waitTime <= 15) return 'Short';
    if (waitTime <= 30) return 'Medium';
    if (waitTime <= 45) return 'Long';
    return 'Very Long';
  };

  const processCSVData = (csvText: string): ProcessedData => {
    const rows = csvText
      .trim()
      .split('\n')
      .map((row) =>
        row
          .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
          .map((field) => field.trim().replace(/^"|"$/g, ''))
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
            hour12: false,
          }),
          waitTime: isRideOpen ? numericWaitTime : null,
          isOpen: isRideOpen,
        });
      }

      const existingDate = latestEntries[rideKey]
        ? new Date(latestEntries[rideKey].timestamp).getTime()
        : 0;
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
        if (
          !maxWaitTimes[rideKey] ||
          numericWaitTime > (maxWaitTimes[rideKey].max_wait_time || 0)
        ) {
          maxWaitTimes[rideKey] = {
            ride_name: rideKey,
            max_wait_time: numericWaitTime,
            timestamp: currentDate.toISOString(),
          };
        }

        if (currentHour >= 10 && currentHour < 18) {
          if (
            !minWaitTimes[rideKey] ||
            numericWaitTime < (minWaitTimes[rideKey].min_wait_time || Infinity)
          ) {
            minWaitTimes[rideKey] = {
              ride_name: rideKey,
              min_wait_time: numericWaitTime,
              timestamp: currentDate.toISOString(),
            };
          }
        }
      }
    });

    Object.keys(timeData).forEach((key) => {
      timeData[key].sort((a, b) => {
        return (
          new Date(`1970/01/01 ${a.time}`).getTime() -
          new Date(`1970/01/01 ${b.time}`).getTime()
        );
      });
    });

    const currentData = Object.values(latestEntries);
    const maxData = Object.values(maxWaitTimes);
    const minData = Object.values(minWaitTimes);

    const latestTimestamp =
      currentData.length > 0
        ? currentData.reduce(
            (max, entry) => Math.max(max, new Date(entry.timestamp).getTime()),
            0
          )
        : null;

    return {
      currentData,
      maxData,
      minData,
      timeData,
      latestTimestamp: latestTimestamp ? new Date(latestTimestamp).toISOString() : null,
    };
  };

  const fetchCSVFromS3 = async (url: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const csvText = await response.text();
      const { currentData, maxData, minData, timeData, latestTimestamp } = processCSVData(
        csvText
      );

      setAllData(currentData);
      setMaxData(maxData);
      setMinData(minData);
      setAttractionTimeData(timeData);
      setLastUpdated(
        latestTimestamp
          ? new Date(latestTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Unknown'
      );
    } catch (err) {
      console.error('Error fetching CSV from S3:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const categorizeAttractions = (): Record<string, RideData[]> => {
    const categories = {
      Short: [],
      Medium: [],
      Long: [],
      'Very Long': [],
      Closed: [],
    } as Record<string, RideData[]>;

    return allData.reduce((acc, entry) => {
      const category = getCategoryFromWaitTime(entry.wait_time, entry.is_open);
      acc[category].push(entry);
      return acc;
    }, categories);
  };

  const filteredAttractions = (): string[] => {
    return allData
      .filter((entry) =>
        entry.ride_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map((entry) => entry.ride_name)
      .sort();
  };

  const selectedAttractionData = (): RideData | undefined => {
    return allData.find((entry) => entry.ride_name === selectedAttraction);
  };

  const renderWaitTimeChart = () => {
    if (!selectedAttraction || !attractionTimeData[selectedAttraction]) return null;

    return (
      <ChartContainer>
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
                value: 'Wait Time (min)',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
              }}
            />
            <Tooltip
              formatter={(value: number) =>
                [value ? `${value} minutes` : 'Closed', 'Wait Time']
              }
              labelFormatter={(label: string) => `Time: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="waitTime"
              stroke={theme.colors.primary}
              dot={false}
              name="Wait Time"
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    );
  };

  const renderAttractionDetails = () => {
    const data = selectedAttractionData();
    if (!data) return null;

    const maxEntry = maxData.find((entry) => entry.ride_name === selectedAttraction);
    const minEntry = minData.find((entry) => entry.ride_name === selectedAttraction);

    return (
      <div>
        <AttractionTitle>{data.ride_name}</AttractionTitle>
        {renderWaitTimeChart()}
        <StatsContainer>
          <StatBox>
            <h3>Current Wait</h3>
            <WaitTime color={getWaitTimeColor(data.wait_time, data.is_open)}>
              {data.is_open ? `${data.wait_time} min` : 'Closed'}
            </WaitTime>
          </StatBox>
          <StatBox>
            <h3>Peak Wait Today</h3>
            <WaitTime color={maxEntry ? getWaitTimeColor(maxEntry.max_wait_time!, true) : theme.colors.gray}>
              {maxEntry ? `${maxEntry.max_wait_time} min` : 'N/A'}
            </WaitTime>
            {maxEntry && (
              <div style={{ fontSize: '0.8rem', color: theme.colors.gray }}>
                at{' '}
                {new Date(maxEntry.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            )}
          </StatBox>
          <StatBox>
            <h3>Least Wait Today</h3>
            <WaitTime color={minEntry ? getWaitTimeColor(minEntry.min_wait_time!, true) : theme.colors.gray}>
              {minEntry ? `${minEntry.min_wait_time} min` : 'N/A'}
            </WaitTime>
            {minEntry && (
              <div style={{ fontSize: '0.8rem', color: theme.colors.gray }}>
                at{' '}
                {new Date(minEntry.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            )}
          </StatBox>
        </StatsContainer>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            margin: theme.spacing.md,
          }}
        >
          <span>Category:</span>
          <CategoryHeader category={getCategoryFromWaitTime(data.wait_time, data.is_open)}>
            {getCategoryFromWaitTime(data.wait_time, data.is_open)}
          </CategoryHeader>
        </div>
        <UpdateInfo>Last updated: {lastUpdated || 'Unknown'}</UpdateInfo>
      </div>
    );
  };

  // When a park button is clicked, data is fetched and the search box appears.
  // We clear any previous search and selection.
  const handleParkClick = (park: 'disneyland' | 'studios') => {
    setSearchTerm('');
    setSelectedAttraction('');
    fetchCSVFromS3(getUrl(park));
  };

  return (
    <Container>
      {/* Date Mode Selector */}
      <DateModeContainer>
        <RadioGroup>
          <RadioLabel>
            <input
              type="radio"
              value="today"
              checked={dateMode === 'today'}
              onChange={() => setDateMode('today')}
            />{' '}
            Today
          </RadioLabel>
          <RadioLabel>
            <input
              type="radio"
              value="historical"
              checked={dateMode === 'historical'}
              onChange={() => setDateMode('historical')}
            />{' '}
            Historical
          </RadioLabel>
        </RadioGroup>
        {dateMode === 'historical' && (
          <DateInput
            type="date"
            value={historicalDate}
            onChange={(e) => setHistoricalDate(e.target.value)}
          />
        )}
      </DateModeContainer>

      {/* Park Selection Buttons */}
      <ButtonGroup>
        <Button
          variant="primary"
          onClick={() => handleParkClick('disneyland')}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Disneyland Park'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleParkClick('studios')}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Disney Studios'}
        </Button>
      </ButtonGroup>

      {/* Show search input only when data is available */}
      {allData.length > 0 && (
        <>
          <Input
            type="text"
            placeholder="Search attractions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* Auto-suggest list */}
          {searchTerm && filteredAttractions().length > 0 && (
            <SearchSuggestions>
              {filteredAttractions().map((attraction) => (
                <SearchSuggestionItem
                  key={attraction}
                  onClick={() => {
                    setSelectedAttraction(attraction);
                    setSearchTerm('');
                  }}
                >
                  {attraction}
                </SearchSuggestionItem>
              ))}
            </SearchSuggestions>
          )}
        </>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {renderAttractionDetails()}

      <div style={{ marginTop: theme.spacing.xl }}>
        {Object.entries(categorizeAttractions()).map(([category, items]) => (
          <div key={category} style={{ marginBottom: theme.spacing.xl }}>
            <CategoryHeader category={category as keyof typeof theme.categoryColors}>
              {category} ({items.length})
            </CategoryHeader>
            {items.length > 0 ? (
              <div style={{ display: 'grid', gap: theme.spacing.sm }}>
                {items.map((item) => (
                  <AttractionItem
                    key={item.ride_name}
                    color={getWaitTimeColor(item.wait_time, item.is_open)}
                    onClick={() => setSelectedAttraction(item.ride_name)}
                  >
                    <span>{item.ride_name}</span>
                    <WaitTime color={getWaitTimeColor(item.wait_time, item.is_open)}>
                      {item.is_open ? `${item.wait_time} min` : 'Closed'}
                    </WaitTime>
                  </AttractionItem>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: theme.colors.gray, padding: theme.spacing.md }}>
                No attractions in this category
              </p>
            )}
          </div>
        ))}
      </div>
    </Container>
  );
};

export default DisneyQueueDashboard;
