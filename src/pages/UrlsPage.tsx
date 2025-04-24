import { useState, useEffect, SyntheticEvent, ChangeEvent } from 'react';
import {
    Box,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableSortLabel,
    TablePagination,
    Autocomplete,
    TextField,
    Chip,
    CircularProgress,
} from '@mui/material';
import BackgroundCard from '../components/BackgroundCard';
import { ShortUrlDto, ShortUrlsListDto, ShortUrlsSearchParams, ShortUrlState } from '../model/urls';
import config from '../config/config';
import { AbstractResponseDto } from '../model/common';

const STATE_LABELS: Record<ShortUrlState, string> = {
    [ShortUrlState.PENDING]: 'Pending',
    [ShortUrlState.ACTIVE]: 'Active',
    [ShortUrlState.NOT_ACTIVE]: 'Not Active',
    [ShortUrlState.ARCHIVED]: 'Archived',
};

const STATE_COLORS: Record<
    ShortUrlState,
    'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
> = {
    [ShortUrlState.PENDING]: 'info',
    [ShortUrlState.ACTIVE]: 'success',
    [ShortUrlState.NOT_ACTIVE]: 'warning',
    [ShortUrlState.ARCHIVED]: 'default',
};

export default function UrlsPage() {
    const [entries, setEntries] = useState<ShortUrlDto[]>([]);
    const [allTags, setAllTags] = useState<string[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [loading, setLoading] = useState(false);

    const [tagsFilter, setTagsFilter] = useState<string[]>([]);
    const [stateFilter, setStateFilter] = useState<ShortUrlState[]>([]);

    const [orderBy, setOrderBy] = useState<'originalUrl' | 'shortUrl'>('shortUrl');
    const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const params: ShortUrlsSearchParams = {
                p: page,
                q: perPage,
                tags: tagsFilter.length ? tagsFilter : undefined,
                s: stateFilter.length ? stateFilter : undefined,
                sb: orderBy,
                dir: orderDir,
            };
            const qs = new URLSearchParams();
            if (params.tags) qs.append('tags', params.tags.join(','));
            if (params.s) qs.append('s', params.s.join(','));
            if (params.t) qs.append('t', params.t.join(','));
            if (params.sb) qs.append('sb', params.sb);
            if (params.dir) qs.append('dir', params.dir);
            if (params.p) qs.append('p', params.p.toString());
            if (params.q) qs.append('q', params.q.toString());

            const resEntries = await fetch(
                `${config.apiBase}/user/organizations/test-user-149126240-mpanov-com/urls?${qs}`,
            );
            const dataEntries: AbstractResponseDto<ShortUrlsListDto> = await resEntries.json();
            setEntries(dataEntries.payload.entries);
            setTotal(dataEntries.payload.total);
            setPerPage(dataEntries.payload.perPage);

            const resTags = await fetch(
                `${config.apiBase}/user/organizations/test-user-149126240-mpanov-com/urls/tags`,
            );
            const resData: AbstractResponseDto<string[]> = await resTags.json();
            setAllTags(resData.payload);

            setLoading(false);
        };
        fetchData();
    }, [page, perPage, tagsFilter, stateFilter, orderBy, orderDir]);

    const allStates = Object.values(ShortUrlState) as ShortUrlState[];

    const handleSort = (_: SyntheticEvent, prop: 'originalUrl' | 'shortUrl') => {
        const isAsc = orderBy === prop && orderDir === 'asc';
        setOrderBy(prop);
        setOrderDir(isAsc ? 'desc' : 'asc');
    };
    const handlePageChange = (_: unknown, newPage: number) => setPage(newPage);
    const handleRowsPerPage = (e: ChangeEvent<HTMLInputElement>) => {
        setPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

    return (
        <BackgroundCard padding={4}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <Autocomplete<string, true, false, false>
                    multiple
                    options={allTags}
                    value={tagsFilter}
                    onChange={(_, v) => {
                        setTagsFilter(v);
                        setPage(0);
                    }}
                    renderInput={(params) => (
                        <TextField {...params} label="Filter by Tags" size="small" />
                    )}
                    ChipProps={{ size: 'small', variant: 'outlined' }}
                    sx={{ minWidth: 200 }}
                />

                <Autocomplete<ShortUrlState, true, false, false>
                    multiple
                    options={allStates}
                    value={stateFilter}
                    getOptionLabel={(opt) => STATE_LABELS[opt]}
                    onChange={(_, v) => {
                        setStateFilter(v);
                        setPage(0);
                    }}
                    renderInput={(params) => (
                        <TextField {...params} label="Filter by State" size="small" />
                    )}
                    ChipProps={{ size: 'small', variant: 'outlined' }}
                    sx={{ minWidth: 200 }}
                />
            </Box>

            {loading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    sortDirection={orderBy === 'shortUrl' ? orderDir : false}
                                >
                                    <TableSortLabel
                                        active={orderBy === 'shortUrl'}
                                        direction={orderBy === 'shortUrl' ? orderDir : 'asc'}
                                        onClick={(e) => handleSort(e, 'shortUrl')}
                                    >
                                        Short URL
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell
                                    sortDirection={orderBy === 'originalUrl' ? orderDir : false}
                                >
                                    <TableSortLabel
                                        active={orderBy === 'originalUrl'}
                                        direction={orderBy === 'originalUrl' ? orderDir : 'asc'}
                                        onClick={(e) => handleSort(e, 'originalUrl')}
                                    >
                                        Original URL
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>Creator</TableCell>
                                <TableCell>State</TableCell>
                                <TableCell>Tags</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {entries.map((row) => (
                                <TableRow key={row.id} hover>
                                    <TableCell>{row.shortUrl}</TableCell>
                                    <TableCell>{row.originalUrl}</TableCell>
                                    <TableCell>{row.creatorName}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={STATE_LABELS[row.state]}
                                            color={STATE_COLORS[row.state]}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {row.tags.map((t) => (
                                            <Chip
                                                key={t}
                                                label={t}
                                                size="small"
                                                sx={{ mr: 0.5, mb: 0.5 }}
                                                variant="outlined"
                                            />
                                        ))}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <TablePagination
                        component="div"
                        count={total}
                        page={page}
                        onPageChange={handlePageChange}
                        rowsPerPage={perPage}
                        onRowsPerPageChange={handleRowsPerPage}
                        rowsPerPageOptions={[5, 10, 25]}
                    />
                </>
            )}
        </BackgroundCard>
    );
}
