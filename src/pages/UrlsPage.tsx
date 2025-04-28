import { ChangeEvent, KeyboardEvent, MouseEvent, SyntheticEvent, useEffect, useState } from 'react';
import {
    Autocomplete,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormHelperText,
    IconButton,
    Link,
    Menu,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TablePagination,
    TableRow,
    TableSortLabel,
    TextField,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BarChartIcon from '@mui/icons-material/BarChart';
import { z } from 'zod';
import BackgroundCard from '../components/BackgroundCard';
import {
    ChangeUrlStateDto,
    ShortUrlDto,
    ShortUrlsListDto,
    ShortUrlsSearchParams,
    ShortUrlState,
} from '../model/urls';
import config from '../config/config';
import { ErrorResponseElement } from '../model/common';
import { ApiClient } from '../common/api';
import { MemberRole, TokenResponseDto } from '../model/auth';
import { hasRole } from '../auth/auth.ts';
import { useAppToast } from '../components/toast.tsx';

const createShortUrlSchema = z.object({
    originalUrl: z
        .string({ required_error: 'Original URL is required' })
        .nonempty('Original URL is required')
        .url('Must be a valid URL'),
    tags: z.array(z.string(), {}),
});

const STATE_LABELS: Record<ShortUrlState, string> = {
    [ShortUrlState.PENDING]: 'Pending',
    [ShortUrlState.ACTIVE]: 'Active',
    [ShortUrlState.NOT_ACTIVE]: 'Not Active',
    [ShortUrlState.ARCHIVED]: 'Archived',
};
const STATE_COLORS: Record<ShortUrlState, 'default' | 'info' | 'success' | 'warning'> = {
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

    const [createOpen, setCreateOpen] = useState(false);
    const [newOriginalUrl, setNewOriginalUrl] = useState('');
    const [newTags, setNewTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [formErrors, setFormErrors] = useState<{ originalUrl?: string; tags?: string }>({});

    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const [menuRowId, setMenuRowId] = useState<number | null>(null);

    const { success, error } = useAppToast();

    const allStates = Object.values(ShortUrlState) as ShortUrlState[];

    const slug = localStorage.getItem(config.currentOrganizationSlugKey)!;

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
        const resEntries = (await ApiClient.getShortUrls(slug, params)) as
            | ShortUrlsListDto
            | ErrorResponseElement;
        if (!('errorType' in resEntries)) {
            setEntries(resEntries.entries);
            setTotal(resEntries.total);
            setPerPage(resEntries.perPage);
        } else {
            error('Could not get short URLs info');
        }
        const resTags = (await ApiClient.getTags(slug)) as string[] | ErrorResponseElement;
        if (!('errorType' in resTags)) {
            setAllTags(resTags);
        } else {
            error('Could not get all tags');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [page, perPage, tagsFilter, stateFilter, orderBy, orderDir]);

    const handleSort = (_: SyntheticEvent, prop: 'originalUrl' | 'shortUrl') => {
        const isAsc = orderBy === prop && orderDir === 'asc';
        setOrderBy(prop);
        setOrderDir(isAsc ? 'desc' : 'asc');
    };

    const handlePageChange = (_: unknown, newPage: number) => setPage(newPage);
    const handleRowsPerPage = (e: ChangeEvent<HTMLInputElement>) => {
        setPerPage(+e.target.value);
        setPage(0);
    };

    const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            const val = tagInput.trim();
            if (val) {
                setNewTags((prev) => [...prev, val]);
                setTagInput('');
            }
        } else if (e.key === 'Backspace' && tagInput === '') {
            setNewTags((prev) => prev.slice(0, -1));
        }
    };

    const handleStateMenuOpen = (
        e: MouseEvent<HTMLElement>,
        rowId: number,
        currentState: ShortUrlState,
    ) => {
        if (currentState === ShortUrlState.ARCHIVED) return;
        setMenuAnchor(e.currentTarget);
        setMenuRowId(rowId);
    };
    const handleStateMenuClose = () => {
        setMenuAnchor(null);
        setMenuRowId(null);
    };

    const handleStateChange = async (newState: ShortUrlState) => {
        if (menuRowId == null) return;
        const current = entries.find((e) => e.id === menuRowId);
        if (!current) return;
        if (
            current.state === ShortUrlState.ARCHIVED ||
            ((current.state === ShortUrlState.ACTIVE ||
                current.state === ShortUrlState.NOT_ACTIVE) &&
                newState === ShortUrlState.PENDING)
        ) {
            handleStateMenuClose();
            return;
        }
        const res = (await ApiClient.updateShortUrlState(slug, menuRowId, {
            newState,
        } as ChangeUrlStateDto)) as ShortUrlDto | ErrorResponseElement;
        if (!('errorType' in res)) {
            success("Short URL's state was successfully changed");
            setEntries((prev) =>
                prev.map((e) =>
                    e.id === menuRowId ? { ...e, state: (res as ShortUrlDto).state } : e,
                ),
            );
        } else {
            error('Could not change state of the short URL');
        }
        handleStateMenuClose();
    };

    const handleCreate = async () => {
        setFormErrors({});
        const parsed = createShortUrlSchema.safeParse({
            originalUrl: newOriginalUrl,
            tags: newTags,
        });
        if (!parsed.success) {
            const errs = parsed.error.flatten().fieldErrors;
            setFormErrors({ originalUrl: errs.originalUrl?.[0], tags: errs.tags?.[0] });
            return;
        }
        const res = (await ApiClient.createShortUrl(slug, parsed.data)) as
            | TokenResponseDto
            | ErrorResponseElement;
        if ('errorType' in res) {
            error('Could not create short URL');
        } else {
            success('Short URL was successfully created');
            setCreateOpen(false);
            setNewOriginalUrl('');
            setNewTags([]);
            setTagInput('');
            fetchData();
        }
    };

    const handleStatsOpen = (id: number) => {
        window.location.href = `/urls/${id}`;
    };

    return (
        <BackgroundCard padding={4} width="100%">
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <Autocomplete
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
                <Autocomplete
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
                {(hasRole(MemberRole.ORGANIZATION_OWNER) ||
                    hasRole(MemberRole.ORGANIZATION_ADMIN) ||
                    hasRole(MemberRole.ORGANIZATION_URLS_MANAGER)) && (
                    <Button
                        variant="contained"
                        onClick={() => setCreateOpen(true)}
                        sx={{ ml: 'auto' }}
                    >
                        Create Short URL
                    </Button>
                )}
            </Box>

            {loading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
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
                                <TableCell sx={{ width: '150px' }}>State</TableCell>
                                <TableCell>Tags</TableCell>
                                {(hasRole(MemberRole.ORGANIZATION_OWNER) ||
                                    hasRole(MemberRole.ORGANIZATION_ADMIN) ||
                                    hasRole(MemberRole.ORGANIZATION_URLS_MANAGER)) && (
                                    <TableCell width={65}>Stats</TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {entries.map((row) => (
                                <TableRow
                                    key={row.id}
                                    hover
                                    sx={{
                                        '& .MuiTableCell-root': { borderBottom: 'none' },
                                        borderBottom: 1,
                                        borderColor: 'divider',
                                    }}
                                >
                                    <TableCell>
                                        <Link href={row.shortUrl} target="_blank" rel="noopener">
                                            {row.shortUrl}
                                        </Link>
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            maxWidth: 300,
                                            overflow: 'hidden',
                                            whiteSpace: 'nowrap',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        <Link
                                            href={row.originalUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{
                                                display: 'block',
                                                overflow: 'hidden',
                                                whiteSpace: 'nowrap',
                                                textOverflow: 'ellipsis',
                                                maxWidth: '100%',
                                                color: 'primary.main',
                                            }}
                                        >
                                            {row.originalUrl}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{row.creatorName}</TableCell>
                                    <TableCell sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Chip
                                            label={STATE_LABELS[row.state]}
                                            color={STATE_COLORS[row.state]}
                                            size="small"
                                            variant="outlined"
                                        />
                                        {(hasRole(MemberRole.ORGANIZATION_OWNER) ||
                                            hasRole(MemberRole.ORGANIZATION_ADMIN) ||
                                            hasRole(MemberRole.ORGANIZATION_URLS_MANAGER)) && (
                                            <IconButton
                                                size="small"
                                                onClick={(e) =>
                                                    handleStateMenuOpen(e, row.id, row.state)
                                                }
                                                disabled={row.state === ShortUrlState.ARCHIVED}
                                            >
                                                <ExpandMoreIcon fontSize="small" />
                                            </IconButton>
                                        )}
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
                                    {(hasRole(MemberRole.ORGANIZATION_OWNER) ||
                                        hasRole(MemberRole.ORGANIZATION_ADMIN) ||
                                        hasRole(MemberRole.ORGANIZATION_URLS_MANAGER)) && (
                                        <TableCell width={65}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleStatsOpen(row.id)}
                                            >
                                                <BarChartIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    )}
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

            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleStateMenuClose}>
                {allStates.map((st) => {
                    const current = entries.find((e) => e.id === menuRowId);
                    const disabled =
                        !current ||
                        current.state === ShortUrlState.ARCHIVED ||
                        ((current.state === ShortUrlState.ACTIVE ||
                            current.state === ShortUrlState.NOT_ACTIVE) &&
                            st === ShortUrlState.PENDING);
                    return (
                        <MenuItem
                            key={st}
                            onClick={() => handleStateChange(st)}
                            disabled={disabled}
                            sx={{
                                color: (theme) => {
                                    if (STATE_COLORS[st] === 'default') {
                                        return theme.palette.text.primary;
                                    }
                                    const key = STATE_COLORS[st] as 'info' | 'success' | 'warning';
                                    return theme.palette[key].main;
                                },
                            }}
                        >
                            {STATE_LABELS[st]}
                        </MenuItem>
                    );
                })}
            </Menu>

            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ px: 4, pt: 3 }}>Create a New Short URL</DialogTitle>
                <DialogContent
                    sx={{ px: 4, py: 2, display: 'flex', flexDirection: 'column', gap: 3 }}
                >
                    <TextField
                        variant="outlined"
                        label="Original URL"
                        fullWidth
                        value={newOriginalUrl}
                        onChange={(e) => setNewOriginalUrl(e.target.value)}
                        error={!!formErrors.originalUrl}
                        helperText={formErrors.originalUrl}
                        sx={{ mt: 1 }}
                    />
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 2,
                            alignItems: 'center',
                            border: '1px solid',
                            borderColor: formErrors.tags ? 'error.main' : 'divider',
                            borderRadius: 1,
                            px: 2,
                            py: 1,
                        }}
                    >
                        {newTags.map((tag, idx) => (
                            <Chip
                                key={idx}
                                label={tag}
                                size="small"
                                onDelete={() =>
                                    setNewTags((prev) => prev.filter((_, i) => i !== idx))
                                }
                            />
                        ))}
                        <TextField
                            variant="standard"
                            placeholder="Tags (Optional)"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            InputProps={{ disableUnderline: true }}
                            sx={{ flexGrow: 1, minWidth: 100 }}
                        />
                    </Box>
                    {formErrors.tags && (
                        <FormHelperText error sx={{ pl: 2 }}>
                            {formErrors.tags}
                        </FormHelperText>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 4, pb: 3, gap: 2 }}>
                    <Button onClick={() => setCreateOpen(false)} sx={{ py: 1, px: 3 }}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleCreate} sx={{ py: 1, px: 3 }}>
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </BackgroundCard>
    );
}
