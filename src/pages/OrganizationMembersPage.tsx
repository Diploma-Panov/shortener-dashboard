import { useState, useEffect, MouseEvent } from 'react';
import {
    Box,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TablePagination,
    IconButton,
    Menu,
    MenuItem,
    FormGroup,
    FormControlLabel,
    Button,
    Link,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Autocomplete,
    Checkbox,
    TableSortLabel,
    Avatar,
    Chip,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { z } from 'zod';
import { ApiClient } from '../common/api';
import { MemberRole } from '../model/auth';
import {
    OrganizationMemberDto,
    InviteMemberDto,
    UpdateMemberRolesDto,
    UpdateMemberUrlsDto,
} from '../model/organizationMembers';
import { ShortUrlDto } from '../model/urls';
import { getAccessToken } from '../auth/auth';
import BackgroundCard from '../components/BackgroundCard';
import config from '../config/config';
import { ErrorResponseElement, MessageResponseDto } from '../model/common.ts';
import * as _ from 'lodash';

const ROLE_LABELS: Record<MemberRole, string> = {
    [MemberRole.ORGANIZATION_OWNER]: 'Owner',
    [MemberRole.ORGANIZATION_ADMIN]: 'Admin',
    [MemberRole.ORGANIZATION_MANAGER]: 'Organization Manager',
    [MemberRole.ORGANIZATION_MEMBERS_MANAGER]: 'Members Manager',
    [MemberRole.ORGANIZATION_URLS_MANAGER]: 'URLs Manager',
    [MemberRole.ORGANIZATION_MEMBER]: 'Member',
};

const inviteSchema = z
    .object({
        firstname: z.string().nonempty(),
        lastname: z.string().nonempty(),
        email: z.string().email(),
        roles: z
            .array(
                z.enum([
                    MemberRole.ORGANIZATION_MEMBERS_MANAGER,
                    MemberRole.ORGANIZATION_MANAGER,
                    MemberRole.ORGANIZATION_URLS_MANAGER,
                    MemberRole.ORGANIZATION_MEMBER,
                ]),
            )
            .optional(),
        allowedAllUrls: z.boolean(),
        allowedUrls: z.array(z.number()).optional(),
    })
    .refine((data) => data.allowedAllUrls || (data.allowedUrls && data.allowedUrls.length > 0), {
        message: 'Select at least one URL or Allow All URLs',
        path: ['allowedUrls'],
    });

export default function OrganizationMembersPage() {
    const slug = localStorage.getItem(config.currentOrganizationSlugKey)!;
    const currentEmail = getAccessToken()?.username;

    const [members, setMembers] = useState<OrganizationMemberDto[]>([]);
    const [page, setPage] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [orderBy, setOrderBy] = useState<'name' | 'email'>('name');
    const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('asc');
    const [loading, setLoading] = useState(false);

    const [rolesAnchor, setRolesAnchor] = useState<HTMLElement | null>(null);
    const [rolesRow, setRolesRow] = useState<OrganizationMemberDto | null>(null);
    const [newRoles, setNewRoles] = useState<MemberRole[]>([]);

    const [urlsOpen, setUrlsOpen] = useState(false);
    const [urlsMember, setUrlsMember] = useState<OrganizationMemberDto | null>(null);
    const [allowedAll, setAllowedAll] = useState(false);
    const [selectedUrls, setSelectedUrls] = useState<ShortUrlDto[]>([]);
    const [allUrls, setAllUrls] = useState<ShortUrlDto[]>([]);
    const [urlsLoading, setUrlsLoading] = useState(false);

    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteData, setInviteData] = useState<InviteMemberDto & { roles: MemberRole[] }>({
        firstname: '',
        lastname: '',
        email: '',
        allowedAllUrls: true,
        allowedUrls: [],
        roles: [],
    });
    const [inviteErrors, setInviteErrors] = useState<Partial<Record<string, string>>>({});

    const [removeAnchor, setRemoveAnchor] = useState<HTMLElement | null>(null);
    const [removeRow, setRemoveRow] = useState<OrganizationMemberDto | null>(null);

    const fetchMembers = async () => {
        setLoading(true);
        const res = await ApiClient.getOrganizationMembers(slug, {
            p: page,
            q: perPage,
            sb: orderBy,
            dir: orderDir,
        });
        if (!('errorType' in res)) {
            const sorted = res.entries.sort(
                (a, b) =>
                    (b.roles.includes(MemberRole.ORGANIZATION_OWNER) ? 1 : 0) -
                    (a.roles.includes(MemberRole.ORGANIZATION_OWNER) ? 1 : 0),
            );
            setMembers(sorted);
            setTotal(res.total);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMembers();
    }, [page, perPage, orderBy, orderDir]);

    const handleSort = (property: 'name' | 'email') => {
        const isAsc = orderBy === property && orderDir === 'asc';
        setOrderDir(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
        setPage(0);
    };

    const handleRolesClick = (e: MouseEvent<HTMLElement>, member: OrganizationMemberDto) => {
        if (member.email === currentEmail || member.roles.includes(MemberRole.ORGANIZATION_OWNER))
            return;
        setRolesRow(member);
        setNewRoles(member.roles.filter((r) => r !== MemberRole.ORGANIZATION_OWNER));
        setRolesAnchor(e.currentTarget);
    };

    const handleRolesClose = () => {
        setRolesAnchor(null);
        setRolesRow(null);
    };

    const handleRoleToggle = (role: MemberRole) => {
        setNewRoles((prev) =>
            prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
        );
    };

    const handleRolesUpdate = async () => {
        if (!rolesRow) return;
        const payload: UpdateMemberRolesDto = {
            newRoles: newRoles.length ? newRoles : [MemberRole.ORGANIZATION_MEMBER],
        };
        await ApiClient.updateMemberRoles(slug, rolesRow.id, payload);
        handleRolesClose();
        fetchMembers();
    };

    const openUrlsDialog = async (member: OrganizationMemberDto) => {
        if (member.email === currentEmail || member.roles.includes(MemberRole.ORGANIZATION_OWNER))
            return;
        setUrlsOpen(true);
        setUrlsLoading(true);
        setUrlsMember(member);

        const urlsRes = await ApiClient.getShortUrls(slug, { q: 10000 });
        let entries: ShortUrlDto[] = [];
        if (!('errorType' in urlsRes)) {
            entries = urlsRes.entries;
            setAllUrls(entries);
        }

        setAllowedAll(member.allowedAllUrls);
        if (member.allowedAllUrls) {
            setSelectedUrls([]);
        } else {
            setSelectedUrls(entries.filter((u) => member.allowedUrls.includes(u.id)));
        }

        setUrlsLoading(false);
    };

    const handleUrlsSave = async () => {
        if (!urlsMember) return;
        const dto: UpdateMemberUrlsDto = {
            allowedAllUrls: allowedAll,
            newUrlsIds: allowedAll ? [] : selectedUrls.map((u) => u.id),
        };
        await ApiClient.updateMemberUrls(slug, urlsMember.id, dto);
        setUrlsOpen(false);
        fetchMembers();
    };

    const handleInviteOpen = async () => {
        setInviteOpen(true);
        const urlsRes = await ApiClient.getShortUrls(slug, { q: 10000 });
        if (!('errorType' in urlsRes)) setAllUrls(urlsRes.entries);
    };

    const handleInviteClose = () => setInviteOpen(false);

    const handleInviteChange = (field: keyof InviteMemberDto, value: any) => {
        setInviteData((prev) => ({ ...prev, [field]: value }));
    };

    const handleInviteSubmit = async () => {
        const parsed = inviteSchema.safeParse(inviteData);
        if (!parsed.success) {
            const errs: any = {};
            parsed.error.errors.forEach((e) => {
                errs[e.path[0]] = e.message;
            });
            setInviteErrors(errs);
            return;
        }
        const dto: InviteMemberDto = {
            ...inviteData,
            roles: inviteData.roles.length ? inviteData.roles : [MemberRole.ORGANIZATION_MEMBER],
        };
        const res: MessageResponseDto | ErrorResponseElement = await ApiClient.inviteMember(
            slug,
            dto,
        );
        if (_.has(res, 'errorType')) {
            return;
        }
        handleInviteClose();
        fetchMembers();
        setInviteData({
            firstname: '',
            lastname: '',
            email: '',
            allowedAllUrls: true,
            allowedUrls: [],
            roles: [],
        });
        setInviteErrors({});
    };

    const handleRemoveClick = (e: MouseEvent<HTMLElement>, member: OrganizationMemberDto) => {
        setRemoveRow(member);
        setRemoveAnchor(e.currentTarget);
    };

    const handleRemove = async () => {
        if (!removeRow) return;
        await ApiClient.deleteMember(slug, removeRow.id);
        setRemoveAnchor(null);
        setPage(0);
        fetchMembers();
    };

    return (
        <BackgroundCard padding={4} width="100%">
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <Button variant="contained" onClick={handleInviteOpen}>
                    Invite Member
                </Button>
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
                                <TableCell>Avatar</TableCell>
                                <TableCell sortDirection={orderBy === 'name' ? orderDir : false}>
                                    <TableSortLabel
                                        active={orderBy === 'name'}
                                        direction={orderBy === 'name' ? orderDir : 'asc'}
                                        onClick={() => handleSort('name')}
                                    >
                                        Name
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sortDirection={orderBy === 'email' ? orderDir : false}>
                                    <TableSortLabel
                                        active={orderBy === 'email'}
                                        direction={orderBy === 'email' ? orderDir : 'asc'}
                                        onClick={() => handleSort('email')}
                                    >
                                        Email
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>Roles</TableCell>
                                <TableCell>URLs</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {members.map((m) => {
                                const isDisabled =
                                    m.email === currentEmail ||
                                    m.roles.includes(MemberRole.ORGANIZATION_OWNER);
                                const labels =
                                    m.roles.length === 1 &&
                                    m.roles[0] === MemberRole.ORGANIZATION_MEMBER
                                        ? ['Member']
                                        : m.roles.map((r) => ROLE_LABELS[r]);
                                return (
                                    <TableRow key={m.id} hover>
                                        <TableCell>
                                            <Avatar
                                                src={m.pictureUrl ?? undefined}
                                                sx={{ width: 32, height: 32 }}
                                            >
                                                {!m.pictureUrl && m.fullName.charAt(0)}
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>{m.fullName}</TableCell>
                                        <TableCell>{m.email}</TableCell>
                                        <TableCell
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'flex-start',
                                                cursor: isDisabled ? 'default' : 'pointer',
                                                py: 1.5,
                                            }}
                                            onClick={(e) => handleRolesClick(e, m)}
                                        >
                                            {labels.map((lbl, idx) => (
                                                <Chip
                                                    key={idx}
                                                    label={lbl}
                                                    size="small"
                                                    color={lbl === 'Owner' ? 'error' : 'default'}
                                                    variant={
                                                        lbl === 'Owner' ? 'filled' : 'outlined'
                                                    }
                                                    sx={{ mb: 0.5 }}
                                                />
                                            ))}
                                            {!isDisabled && (
                                                <ExpandMoreIcon fontSize="small" sx={{ mt: 0.5 }} />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isDisabled ? (
                                                m.allowedAllUrls ? (
                                                    'All URLs'
                                                ) : (
                                                    `${m.allowedUrls.length} URLs`
                                                )
                                            ) : (
                                                <Link
                                                    component="button"
                                                    onClick={() => openUrlsDialog(m)}
                                                >
                                                    {m.allowedAllUrls
                                                        ? 'All URLs'
                                                        : `${m.allowedUrls.length} URLs`}
                                                </Link>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {!isDisabled && (
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleRemoveClick(e, m)}
                                                >
                                                    <MoreVertIcon />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                    <TablePagination
                        component="div"
                        count={total}
                        page={page}
                        rowsPerPage={perPage}
                        onPageChange={(_, p) => setPage(p)}
                        onRowsPerPageChange={(e) => {
                            setPerPage(+e.target.value);
                            setPage(0);
                        }}
                        rowsPerPageOptions={[5, 10, 25]}
                    />
                </>
            )}
            <Menu anchorEl={rolesAnchor} open={Boolean(rolesAnchor)} onClose={handleRolesClose}>
                <FormGroup sx={{ px: 2 }}>
                    {[
                        MemberRole.ORGANIZATION_MEMBERS_MANAGER,
                        MemberRole.ORGANIZATION_MANAGER,
                        MemberRole.ORGANIZATION_URLS_MANAGER,
                    ].map((role) => (
                        <FormControlLabel
                            key={role}
                            control={
                                <Checkbox
                                    checked={newRoles.includes(role)}
                                    onChange={() => handleRoleToggle(role)}
                                />
                            }
                            label={ROLE_LABELS[role]}
                        />
                    ))}
                    <Button
                        onClick={handleRolesUpdate}
                        sx={{ mt: 1 }}
                        disabled={newRoles.length === 0}
                    >
                        Update Roles
                    </Button>
                </FormGroup>
            </Menu>
            <Dialog open={urlsOpen} onClose={() => setUrlsOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Manage URLs Access</DialogTitle>
                <DialogContent>
                    <FormControlLabel
                        control={
                            <Checkbox checked={allowedAll} onChange={(_, c) => setAllowedAll(c)} />
                        }
                        label="Allow All URLs"
                    />
                    {!allowedAll &&
                        (urlsLoading ? (
                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Autocomplete
                                multiple
                                options={allUrls}
                                getOptionLabel={(opt) => opt.originalUrl}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                value={selectedUrls}
                                onChange={(_, v) => setSelectedUrls(v)}
                                renderInput={(params) => (
                                    <TextField {...params} label="Select URLs" />
                                )}
                            />
                        ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUrlsOpen(false)}>Cancel</Button>
                    <Button onClick={handleUrlsSave}>Save</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={inviteOpen} onClose={handleInviteClose} fullWidth maxWidth="sm">
                <DialogTitle>Invite Member</DialogTitle>
                <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="First Name"
                        value={inviteData.firstname}
                        onChange={(e) => handleInviteChange('firstname', e.target.value)}
                        error={!!inviteErrors.firstname}
                        helperText={inviteErrors.firstname}
                        margin={'normal'}
                    />
                    <TextField
                        label="Last Name"
                        value={inviteData.lastname}
                        onChange={(e) => handleInviteChange('lastname', e.target.value)}
                        error={!!inviteErrors.lastname}
                        helperText={inviteErrors.lastname}
                        margin={'normal'}
                    />
                    <TextField
                        label="Email"
                        value={inviteData.email}
                        onChange={(e) => handleInviteChange('email', e.target.value)}
                        error={!!inviteErrors.email}
                        helperText={inviteErrors.email}
                        margin={'normal'}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={inviteData.allowedAllUrls}
                                onChange={(_, c) => handleInviteChange('allowedAllUrls', c)}
                            />
                        }
                        label="Allow All URLs"
                    />
                    {!inviteData.allowedAllUrls && (
                        <Autocomplete
                            multiple
                            options={allUrls}
                            getOptionLabel={(opt) => opt.originalUrl}
                            value={allUrls.filter((u) => inviteData.allowedUrls.includes(u.id))}
                            onChange={(_, v) =>
                                handleInviteChange(
                                    'allowedUrls',
                                    v.map((u) => u.id),
                                )
                            }
                            renderInput={(params) => <TextField {...params} label="Select URLs" />}
                        />
                    )}
                    <FormGroup>
                        {[
                            MemberRole.ORGANIZATION_MEMBERS_MANAGER,
                            MemberRole.ORGANIZATION_MANAGER,
                            MemberRole.ORGANIZATION_URLS_MANAGER,
                        ].map((role) => (
                            <FormControlLabel
                                key={role}
                                label={ROLE_LABELS[role]}
                                control={
                                    <Checkbox
                                        checked={inviteData.roles.includes(role)}
                                        onChange={(_, c) =>
                                            handleInviteChange(
                                                'roles',
                                                c
                                                    ? [...inviteData.roles, role]
                                                    : inviteData.roles.filter((r) => r !== role),
                                            )
                                        }
                                    />
                                }
                            />
                        ))}
                    </FormGroup>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleInviteClose}>Cancel</Button>
                    <Button
                        onClick={handleInviteSubmit}
                        disabled={!inviteData.allowedAllUrls && inviteData.allowedUrls.length === 0}
                    >
                        Send Invite
                    </Button>
                </DialogActions>
            </Dialog>
            <Menu
                anchorEl={removeAnchor}
                open={Boolean(removeAnchor)}
                onClose={() => setRemoveAnchor(null)}
            >
                <MenuItem onClick={handleRemove}>Remove Member</MenuItem>
            </Menu>
        </BackgroundCard>
    );
}
