import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Tooltip, Typography, useTheme, Button } from '@mui/material';
import BackgroundCard from '../components/BackgroundCard';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import {
    LineChart,
    Line,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { DatePicker, DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
    addDays,
    endOfDay,
    endOfMonth,
    endOfYear,
    format,
    isValid,
    parseISO,
    startOfDay,
    startOfWeek,
    startOfYear,
    subMinutes,
} from 'date-fns';
import { getTimezoneOffset } from 'date-fns-tz';
import { ApiClient } from '../common/api';
import worldData from 'world-atlas/countries-110m.json';
import { feature } from 'topojson-client';
import { GlobalStatisticsDto, PeriodCountsDto, StatsPeriod } from '../model/statistics';
import config from '../config/config';
import bbox from '@turf/bbox';
import { randomPoint } from '@turf/random';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import shp from 'shpjs';
import type { Feature, Polygon, MultiPolygon, Point, Geometry, FeatureCollection } from 'geojson';
import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(en);

function getRandomPointsInCountry(
    feature: Feature<Polygon | MultiPolygon>,
    count: number,
): Feature<Point, any>[] {
    const box = bbox(feature);
    const ptsFc = randomPoint(count * 3, { bbox: box });
    const inside = ptsFc.features.filter((pt) => booleanPointInPolygon(pt, feature));
    return inside.slice(0, count);
}

const geoJson = feature(
    worldData as any,
    (worldData as any).objects.countries,
) as unknown as FeatureCollection<Geometry, any>;

const CITY_COORDINATES: Record<string, [number, number]> = {
    'New York': [-74.006, 40.7128],
    Kyiv: [30.5234, 50.4501],
    Tokyo: [139.6917, 35.6895],
    London: [-0.1276, 51.5074],
};

const PERIOD_LABELS: Record<StatsPeriod, string> = {
    [StatsPeriod.MINUTE]: 'Minutely Opens',
    [StatsPeriod.HOUR]: 'Hourly Opens',
    [StatsPeriod.DAY]: 'Daily Opens',
    [StatsPeriod.MONTH]: 'Monthly Opens',
};

const parseShifted = (value: string): Date | null => {
    const raw = value.includes('#') ? value.split('#')[1] : value;
    const d = parseISO(raw);
    if (!isValid(d)) return null;
    d.setHours(d.getHours() + getTimezoneOffset('Europe/Kyiv') / 3600000);
    return d;
};

export default function ShortUrlStatsPage() {
    const theme = useTheme();
    const primaryColor = theme.palette.primary.main;
    const { urlId } = useParams<{ urlId: string }>();
    const id = Number(urlId);
    const slug = localStorage.getItem(config.currentOrganizationSlugKey)!;

    const [globalStats, setGlobalStats] = useState<GlobalStatisticsDto | null>(null);
    const [loadingGlobal, setLoadingGlobal] = useState(false);
    const [disputedGeo, setDisputedGeo] = useState<FeatureCollection | null>(null);

    useEffect(() => {
        shp('/data/ne_10m_admin_0_disputed_areas.zip')
            .then((geojson) => {
                const fc = Array.isArray(geojson) ? geojson[0] : geojson;
                setDisputedGeo(fc as FeatureCollection);
            })
            .catch((err) => console.error('Failed loading disputed areas:', err));
    }, []);

    const [mapPos, setMapPos] = useState<{ zoom: number; coordinates: [number, number] }>({
        zoom: 1,
        coordinates: [0, 20],
    });
    const handleZoomIn = () => setMapPos((p) => ({ ...p, zoom: Math.min(p.zoom * 1.2, 8) }));
    const handleZoomOut = () => setMapPos((p) => ({ ...p, zoom: Math.max(p.zoom / 1.2, 1) }));
    const handleMove = (dx: number, dy: number) =>
        setMapPos((p) => ({
            ...p,
            coordinates: [p.coordinates[0] + dx / p.zoom, p.coordinates[1] - dy / p.zoom],
        }));

    useEffect(() => {
        if (!slug || !id) return;
        setLoadingGlobal(true);
        ApiClient.getGlobalStats(slug, id)
            .then((res) => {
                if (!('errorType' in res)) setGlobalStats(res as GlobalStatisticsDto);
            })
            .finally(() => setLoadingGlobal(false));
    }, [slug, id]);

    const countryMarkers = useMemo(() => {
        if (!globalStats) return [];
        return Object.entries(globalStats.countryCounts).flatMap(([iso, count]) => {
            if (iso === 'RU') return [];
            const feat = geoJson.features.find((f) =>
                iso === 'XX'
                    ? f.properties.name === 'Antarctica'
                    : f.properties.name === countries.getName(iso, 'en'),
            );
            if (!feat) return [];
            const label = iso === 'XX' ? 'Another dimension' : countries.getName(iso, 'en') || iso;
            return getRandomPointsInCountry(feat as any, count)
                .map((pt) => pt.geometry.coordinates as [number, number])
                .map((coords, i) => ({ coords, label, count, key: `${iso}-${i}` }));
        });
    }, [globalStats]);

    const periods: StatsPeriod[] = [
        StatsPeriod.MINUTE,
        StatsPeriod.HOUR,
        StatsPeriod.DAY,
        StatsPeriod.MONTH,
    ];
    const defaultRanges = {
        [StatsPeriod.MINUTE]: { start: subMinutes(new Date(), 60), end: new Date() },
        [StatsPeriod.HOUR]: { start: startOfDay(new Date()), end: endOfDay(new Date()) },
        [StatsPeriod.DAY]: { start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: new Date() },
        [StatsPeriod.MONTH]: { start: startOfYear(new Date()), end: endOfYear(new Date()) },
    } as Record<StatsPeriod, { start: Date; end: Date }>;
    const [range, setRange] = useState(defaultRanges);
    const [timeData, setTimeData] = useState<Record<StatsPeriod, PeriodCountsDto | null>>(() =>
        periods.reduce((a, p) => ({ ...a, [p]: null }), {} as any),
    );
    const [loadingTime, setLoadingTime] = useState<Record<StatsPeriod, boolean>>(() =>
        periods.reduce((a, p) => ({ ...a, [p]: false }), {} as any),
    );

    const formatRangeISO = (p: StatsPeriod) => {
        const { start, end } = range[p];
        if (p === StatsPeriod.DAY)
            return {
                start: format(start, "yyyy-MM-dd'T'00:00"),
                end: format(addDays(end, 1), "yyyy-MM-dd'T'00:00"),
            };
        if (p === StatsPeriod.MONTH)
            return {
                start: format(start, "yyyy-MM-01'T'00:00"),
                end: format(endOfMonth(end), "yyyy-MM-dd'T'23:59"),
            };
        return { start: start.toISOString(), end: end.toISOString() };
    };

    const fetchTimeData = (p: StatsPeriod) => {
        const { start, end } = formatRangeISO(p);
        setLoadingTime((t) => ({ ...t, [p]: true }));
        ApiClient.getTimeRangeStats(slug, id, start, end, p)
            .then((res) => {
                if (!('errorType' in res))
                    setTimeData((t) => ({ ...t, [p]: res as PeriodCountsDto }));
            })
            .finally(() => setLoadingTime((t) => ({ ...t, [p]: false })));
    };

    useEffect(() => {
        if (slug && id)
            periods.forEach((p) => {
                if (range[p].start <= range[p].end) fetchTimeData(p);
            });
    }, [range, slug, id]);

    const tickFormatter: Record<StatsPeriod, (v: string) => string> = {
        [StatsPeriod.MINUTE]: (v) => {
            const d = parseShifted(v);
            return d ? format(d, 'HH:mm') : v;
        },
        [StatsPeriod.HOUR]: (v) => {
            const d = parseShifted(v);
            return d ? format(d, 'HH:00') : v;
        },
        [StatsPeriod.DAY]: (v) => {
            const d = parseShifted(v);
            return d ? format(d, 'dd.MM.yy') : v;
        },
        [StatsPeriod.MONTH]: (v) => {
            const d = parseShifted(v);
            return d ? format(d, 'MMM yyyy') : v;
        },
    };
    const tooltipFormatter: Record<StatsPeriod, (v: string) => string> = {
        [StatsPeriod.MINUTE]: (v) => {
            const d = parseShifted(v);
            return d ? format(d, 'dd.MM.yy HH:mm') : v;
        },
        [StatsPeriod.HOUR]: (v) => {
            const d = parseShifted(v);
            return d ? format(d, 'dd.MM.yy HH:mm') : v;
        },
        [StatsPeriod.DAY]: (v) => {
            const d = parseShifted(v);
            return d ? format(d, 'dd.MM.yy') : v;
        },
        [StatsPeriod.MONTH]: (v) => {
            const d = parseShifted(v);
            return d ? format(d, 'MMM yyyy') : v;
        },
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <BackgroundCard padding={4} width="100%">
                <Typography variant="h4" gutterBottom>
                    URL Opening Statistics
                </Typography>

                {!globalStats || loadingGlobal ? (
                    <Box textAlign="center" py={6}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <Box
                            sx={{
                                position: 'relative',
                                width: '100%',
                                height: '75vh',
                                mb: 4,
                                border: `1px solid ${theme.palette.divider}`,
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1,
                                    zIndex: 10,
                                }}
                            >
                                <Button size="small" onClick={handleZoomIn}>
                                    +
                                </Button>
                                <Button size="small" onClick={handleZoomOut}>
                                    –
                                </Button>
                                <Button size="small" onClick={() => handleMove(-20, 0)}>
                                    ←
                                </Button>
                                <Button size="small" onClick={() => handleMove(20, 0)}>
                                    →
                                </Button>
                                <Button size="small" onClick={() => handleMove(0, -10)}>
                                    ↑
                                </Button>
                                <Button size="small" onClick={() => handleMove(0, 10)}>
                                    ↓
                                </Button>
                            </Box>

                            <ComposableMap
                                projectionConfig={{ scale: 160 }}
                                style={{ width: '100%', height: '100%' }}
                            >
                                <ZoomableGroup
                                    zoom={mapPos.zoom}
                                    center={mapPos.coordinates}
                                    onMoveEnd={setMapPos}
                                >
                                    <Geographies geography={geoJson}>
                                        {({ geographies }) =>
                                            geographies
                                                .filter((g) => g.properties.name !== 'Russia')
                                                .map((g) => (
                                                    <Geography
                                                        key={(g as any).rsmKey}
                                                        geography={g}
                                                        fill="none"
                                                        stroke={primaryColor}
                                                        strokeWidth={0.75}
                                                    />
                                                ))
                                        }
                                    </Geographies>

                                    {disputedGeo && (
                                        <Geographies geography={disputedGeo}>
                                            {({ geographies }) =>
                                                geographies
                                                    .filter((g) => g.properties.ABBREV === 'Crimea')
                                                    .map((g) => (
                                                        <Geography
                                                            key={(g as any).rsmKey}
                                                            geography={g}
                                                            fill="none"
                                                            stroke={primaryColor}
                                                            strokeWidth={0.75}
                                                        />
                                                    ))
                                            }
                                        </Geographies>
                                    )}

                                    {countryMarkers.map(({ coords, label, count, key }) => (
                                        <Marker key={key} coordinates={coords}>
                                            <Tooltip title={`${label} – ${count} openings`}>
                                                <circle r={2} fill="green" />
                                            </Tooltip>
                                        </Marker>
                                    ))}

                                    {Object.entries(globalStats.cityCounts).map(([city, count]) => {
                                        const coords = CITY_COORDINATES[city];
                                        if (!coords) return null;
                                        return (
                                            <Marker key={city} coordinates={coords}>
                                                <Tooltip title={`${city} – ${count} openings`}>
                                                    <circle
                                                        r={Math.max(4, Math.sqrt(count) * 1.5)}
                                                        fill={primaryColor}
                                                    />
                                                </Tooltip>
                                            </Marker>
                                        );
                                    })}
                                </ZoomableGroup>
                            </ComposableMap>
                        </Box>

                        <Box
                            display="grid"
                            gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
                            gap={4}
                        >
                            {periods.map((period) => {
                                const { start, end } = range[period];
                                const invalid = start > end;
                                return (
                                    <Box key={period}>
                                        <Typography variant="h6" gutterBottom>
                                            {PERIOD_LABELS[period]}
                                        </Typography>
                                        <Box
                                            display="flex"
                                            gap={2}
                                            mb={2}
                                            flexWrap="wrap"
                                            alignItems="center"
                                        >
                                            {period === StatsPeriod.MINUTE ||
                                            period === StatsPeriod.HOUR ? (
                                                <>
                                                    <DateTimePicker
                                                        label="Start"
                                                        value={start}
                                                        onChange={(d) =>
                                                            setRange((r) => ({
                                                                ...r,
                                                                [period]: {
                                                                    ...r[period],
                                                                    start: d!,
                                                                },
                                                            }))
                                                        }
                                                        views={
                                                            period === StatsPeriod.MINUTE
                                                                ? ['hours', 'minutes']
                                                                : ['year', 'month', 'day', 'hours']
                                                        }
                                                        format={
                                                            period === StatsPeriod.MINUTE
                                                                ? 'HH:mm'
                                                                : 'dd.MM.yy HH:mm'
                                                        }
                                                        ampm={false}
                                                        slotProps={{
                                                            textField: {
                                                                size: 'small',
                                                                error: invalid,
                                                                sx: {
                                                                    width:
                                                                        period === StatsPeriod.HOUR
                                                                            ? 200
                                                                            : 150,
                                                                },
                                                            },
                                                        }}
                                                    />
                                                    <DateTimePicker
                                                        label="End"
                                                        value={end}
                                                        onChange={(d) =>
                                                            setRange((r) => ({
                                                                ...r,
                                                                [period]: { ...r[period], end: d! },
                                                            }))
                                                        }
                                                        views={
                                                            period === StatsPeriod.MINUTE
                                                                ? ['hours', 'minutes']
                                                                : ['year', 'month', 'day', 'hours']
                                                        }
                                                        format={
                                                            period === StatsPeriod.MINUTE
                                                                ? 'HH:mm'
                                                                : 'dd.MM.yy HH:mm'
                                                        }
                                                        ampm={false}
                                                        slotProps={{
                                                            textField: {
                                                                size: 'small',
                                                                error: invalid,
                                                                sx: {
                                                                    width:
                                                                        period === StatsPeriod.HOUR
                                                                            ? 200
                                                                            : 150,
                                                                },
                                                            },
                                                        }}
                                                    />
                                                </>
                                            ) : period === StatsPeriod.DAY ? (
                                                <>
                                                    <DatePicker
                                                        label="Start"
                                                        value={start}
                                                        onChange={(d) =>
                                                            setRange((r) => ({
                                                                ...r,
                                                                [period]: {
                                                                    ...r[period],
                                                                    start: d!,
                                                                },
                                                            }))
                                                        }
                                                        format="dd.MM.yy"
                                                        slotProps={{
                                                            textField: {
                                                                size: 'small',
                                                                error: invalid,
                                                                sx: { width: 150 },
                                                            },
                                                        }}
                                                    />
                                                    <DatePicker
                                                        label="End"
                                                        value={end}
                                                        onChange={(d) =>
                                                            setRange((r) => ({
                                                                ...r,
                                                                [period]: { ...r[period], end: d! },
                                                            }))
                                                        }
                                                        format="dd.MM.yy"
                                                        slotProps={{
                                                            textField: {
                                                                size: 'small',
                                                                error: invalid,
                                                                sx: { width: 150 },
                                                            },
                                                        }}
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <DatePicker
                                                        views={['year', 'month']}
                                                        label="Start"
                                                        value={start}
                                                        onChange={(d) =>
                                                            setRange((r) => ({
                                                                ...r,
                                                                [period]: {
                                                                    ...r[period],
                                                                    start: d!,
                                                                },
                                                            }))
                                                        }
                                                        format="MMM yyyy"
                                                        slotProps={{
                                                            textField: {
                                                                size: 'small',
                                                                error: invalid,
                                                                sx: { width: 150 },
                                                            },
                                                        }}
                                                    />
                                                    <DatePicker
                                                        views={['year', 'month']}
                                                        label="End"
                                                        value={end}
                                                        onChange={(d) =>
                                                            setRange((r) => ({
                                                                ...r,
                                                                [period]: { ...r[period], end: d! },
                                                            }))
                                                        }
                                                        format="MMM yyyy"
                                                        slotProps={{
                                                            textField: {
                                                                size: 'small',
                                                                error: invalid,
                                                                sx: { width: 150 },
                                                            },
                                                        }}
                                                    />
                                                </>
                                            )}
                                        </Box>

                                        {loadingTime[period] || !timeData[period] ? (
                                            <Box textAlign="center" py={2}>
                                                <CircularProgress />
                                            </Box>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={300}>
                                                <LineChart data={timeData[period]!.counts}>
                                                    <XAxis
                                                        dataKey="timestamp"
                                                        tickFormatter={tickFormatter[period]}
                                                    />
                                                    <YAxis />
                                                    <RechartsTooltip
                                                        labelFormatter={tooltipFormatter[period]}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="count"
                                                        stroke={primaryColor}
                                                        dot={false}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        )}
                                    </Box>
                                );
                            })}
                        </Box>
                    </>
                )}
            </BackgroundCard>
        </LocalizationProvider>
    );
}
