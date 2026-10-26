import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    Divider,
    FormControl,
    InputLabel,
    ListItemText,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { QRCodeSVG } from "qrcode.react";

type MatchOption = {
    id: number;
    matchNumber: number;
    scheduledAt: string | null;
    status: string;
    teams: string;
};
type Referee = {
    id: number;
    name: string;
    username: string;
    active: boolean;
    createdAt: number;
    tableNumber: number | null;
    matchIds: number[];
};
type LoginCode = {
    code: string;
    expiresAt: number;
    expiresIn: number;
    referee: { id: number; name: string; username: string };
};

export default function AdminPage() {
    const [token, setToken] = useState(() => sessionStorage.getItem("headref_token") || "");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [referees, setReferees] = useState<Referee[]>([]);
    const [matchOptions, setMatchOptions] = useState<MatchOption[]>([]);
    const [loginCode, setLoginCode] = useState<LoginCode | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [tableNumber, setTableNumber] = useState("");
    const [selectedMatchIds, setSelectedMatchIds] = useState<number[]>([]);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [loading, setLoading] = useState(false);

    const api = useCallback(
        async (path: string, init: RequestInit = {}) => {
            const response = await fetch(`/api/v1${path}`, {
                ...init,
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    ...init.headers,
                },
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
            return body;
        },
        [token],
    );

    const load = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError("");
        try {
            const [refereeResult, optionResult] = await Promise.all([
                api("/referees"),
                api("/referees/assignment-options"),
            ]);
            setReferees(refereeResult.referees);
            setMatchOptions(optionResult.matches);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Could not load referee data.";
            setError(message);
            if (/session|authori[sz]|forbidden|expired/i.test(message)) {
                sessionStorage.removeItem("headref_token");
                setToken("");
            }
        } finally {
            setLoading(false);
        }
    }, [api, token]);

    useEffect(() => {
        void load();
    }, [load]);

    const signIn = async () => {
        setError("");
        try {
            const result = await fetch("/api/v1/auth/headref/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            const body = await result.json().catch(() => ({}));
            if (!result.ok) {
                setError(body.error || "Head referee sign-in failed.");
                return;
            }
            sessionStorage.setItem("headref_token", body.token);
            setToken(body.token);
            setPassword("");
            setNotice("Signed in as head referee.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Sign-in failed.");
        }
    };

    const signOut = () => {
        sessionStorage.removeItem("headref_token");
        setToken("");
        setReferees([]);
        setMatchOptions([]);
        setLoginCode(null);
        setNotice("");
        setError("");
    };

    const createReferee = async () => {
        setError("");
        setNotice("");
        try {
            await api("/referees", { method: "POST", body: JSON.stringify({ name, username }) });
            setName("");
            setUsername("");
            setNotice("Referee created.");
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not create referee.");
        }
    };

    const toggleActive = async (referee: Referee) => {
        setError("");
        setNotice("");
        try {
            await api(`/referees/${referee.id}/active`, {
                method: "PATCH",
                body: JSON.stringify({ active: !referee.active }),
            });
            setNotice(`${referee.name} ${referee.active ? "deactivated" : "reactivated"}.`);
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not update referee.");
        }
    };

    const generateCode = async (referee: Referee) => {
        setError("");
        setNotice("");
        try {
            const result = await api(`/referees/${referee.id}/login-code`, { method: "POST" });
            setLoginCode(result);
            setNotice(
                `Generated a new QR code for ${referee.name}. Any older unused code for this referee has been invalidated.`,
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not generate QR code.");
        }
    };

    const startAssignmentEdit = (referee: Referee) => {
        setEditingId(referee.id);
        setTableNumber(referee.tableNumber == null ? "" : String(referee.tableNumber));
        setSelectedMatchIds(referee.matchIds || []);
    };

    const saveAssignments = async (referee: Referee) => {
        setError("");
        setNotice("");
        const table = tableNumber.trim() === "" ? null : Number(tableNumber);
        if (table !== null && (!Number.isInteger(table) || table < 1 || table > 99)) {
            setError("Table number must be between 1 and 99, or left blank.");
            return;
        }
        try {
            await api(`/referees/${referee.id}/assignments`, {
                method: "PATCH",
                body: JSON.stringify({ tableNumber: table, matchIds: selectedMatchIds }),
            });
            setEditingId(null);
            setNotice(`Assignments saved for ${referee.name}.`);
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save assignments.");
        }
    };

    if (!token) {
        return (
            <Box sx={{ py: 5, display: "flex", justifyContent: "center" }}>
                <Card variant="outlined" sx={{ width: "100%", maxWidth: 480 }}>
                    <CardContent>
                        <Stack spacing={2}>
                            <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                Head referee sign-in
                            </Typography>
                            <Typography color="text.secondary">
                                Sign in to manage referee accounts, QR codes, tables, and match
                                assignments.
                            </Typography>
                            {error && <Alert severity="error">{error}</Alert>}
                            <TextField
                                label="Head referee password"
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") void signIn();
                                }}
                                fullWidth
                            />
                            <Button
                                variant="contained"
                                onClick={() => void signIn()}
                                disabled={!password.trim()}
                            >
                                Sign in
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    return (
        <Box sx={{ py: 3 }}>
            <Stack spacing={3}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    sx={{
                        justifyContent: "space-between",
                        alignItems: { xs: "flex-start", sm: "center" },
                    }}
                >
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800 }}>
                            Referee management
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                            Manage access and assign tables and matches.
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Button variant="outlined" onClick={() => void load()} disabled={loading}>
                            Refresh
                        </Button>
                        <Button variant="outlined" color="inherit" onClick={signOut}>
                            Sign out
                        </Button>
                    </Stack>
                </Stack>

                {error && <Alert severity="error">{error}</Alert>}
                {notice && (
                    <Alert severity="success" onClose={() => setNotice("")}>
                        {notice}
                    </Alert>
                )}

                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                            Create referee
                        </Typography>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                            <TextField
                                label="Full name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                fullWidth
                            />
                            <TextField
                                label="Username"
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                fullWidth
                            />
                            <Button
                                variant="contained"
                                onClick={() => void createReferee()}
                                disabled={!name.trim() || username.trim().length < 3}
                                sx={{ minWidth: 140 }}
                            >
                                Create
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>

                {loginCode && (
                    <Card variant="outlined">
                        <CardContent>
                            <Stack spacing={2} sx={{ alignItems: "center" }}>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                    QR code for {loginCode.referee.name}
                                </Typography>
                                <Box sx={{ p: 2, bgcolor: "#fff", display: "inline-flex" }}>
                                    <QRCodeSVG
                                        value={`${window.location.origin}/unlock?code=${encodeURIComponent(loginCode.code)}`}
                                        size={240}
                                        level="M"
                                        includeMargin
                                    />
                                </Box>
                                <Typography color="text.secondary" sx={{ textAlign: "center" }}>
                                    Single-use code. Expires in five minutes. Generating another QR
                                    for this referee invalidates this unused code.
                                </Typography>
                                <Button variant="outlined" onClick={() => setLoginCode(null)}>
                                    Close QR
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                )}

                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>
                        Referee accounts
                    </Typography>
                    {referees.length === 0 ? (
                        <Alert severity="info">
                            {loading ? "Loading referee accounts…" : "No referee accounts yet."}
                        </Alert>
                    ) : (
                        <Stack spacing={2}>
                            {referees.map((referee) => (
                                <Card variant="outlined" key={referee.id}>
                                    <CardContent>
                                        <Stack spacing={2}>
                                            <Stack
                                                direction={{ xs: "column", sm: "row" }}
                                                spacing={2}
                                                sx={{
                                                    justifyContent: "space-between",
                                                    alignItems: { xs: "flex-start", sm: "center" },
                                                }}
                                            >
                                                <Box>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{ fontWeight: 800 }}
                                                    >
                                                        {referee.name}
                                                    </Typography>
                                                    <Typography color="text.secondary">
                                                        @{referee.username}
                                                    </Typography>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        sx={{ mt: 1, flexWrap: "wrap" }}
                                                    >
                                                        <Chip
                                                            size="small"
                                                            label={
                                                                referee.active
                                                                    ? "Active"
                                                                    : "Inactive"
                                                            }
                                                            color={
                                                                referee.active
                                                                    ? "success"
                                                                    : "default"
                                                            }
                                                        />
                                                        <Chip
                                                            size="small"
                                                            variant="outlined"
                                                            label={
                                                                referee.tableNumber == null
                                                                    ? "No table"
                                                                    : `Table ${referee.tableNumber}`
                                                            }
                                                        />
                                                        <Chip
                                                            size="small"
                                                            variant="outlined"
                                                            label={`${(referee.matchIds || []).length} matches`}
                                                        />
                                                    </Stack>
                                                </Box>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    sx={{ flexWrap: "wrap" }}
                                                >
                                                    <Button
                                                        variant="contained"
                                                        onClick={() => void generateCode(referee)}
                                                        disabled={!referee.active}
                                                    >
                                                        Generate QR
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        onClick={() => startAssignmentEdit(referee)}
                                                    >
                                                        Assignments
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        color={referee.active ? "error" : "success"}
                                                        onClick={() => void toggleActive(referee)}
                                                    >
                                                        {referee.active
                                                            ? "Deactivate"
                                                            : "Reactivate"}
                                                    </Button>
                                                </Stack>
                                            </Stack>

                                            {editingId === referee.id && (
                                                <>
                                                    <Divider />
                                                    <Typography sx={{ fontWeight: 700 }}>
                                                        Assignments for {referee.name}
                                                    </Typography>
                                                    <Stack
                                                        direction={{ xs: "column", sm: "row" }}
                                                        spacing={2}
                                                    >
                                                        <TextField
                                                            label="Table number"
                                                            type="number"
                                                            value={tableNumber}
                                                            onChange={(event) =>
                                                                setTableNumber(event.target.value)
                                                            }
                                                            helperText="Leave blank to clear the table assignment."
                                                            slotProps={{
                                                                htmlInput: { min: 1, max: 99 },
                                                            }}
                                                            sx={{ minWidth: 180 }}
                                                        />
                                                        <FormControl fullWidth>
                                                            <InputLabel
                                                                id={`match-select-label-${referee.id}`}
                                                            >
                                                                Assigned matches
                                                            </InputLabel>
                                                            <Select
                                                                labelId={`match-select-label-${referee.id}`}
                                                                multiple
                                                                value={selectedMatchIds}
                                                                label="Assigned matches"
                                                                onChange={(event) =>
                                                                    setSelectedMatchIds(
                                                                        typeof event.target
                                                                            .value === "string"
                                                                            ? event.target.value
                                                                                  .split(",")
                                                                                  .map(Number)
                                                                            : (event.target
                                                                                  .value as number[]),
                                                                    )
                                                                }
                                                                renderValue={(selected) =>
                                                                    `${selected.length} matches selected`
                                                                }
                                                            >
                                                                {matchOptions.map((match) => (
                                                                    <MenuItem
                                                                        key={match.id}
                                                                        value={match.id}
                                                                    >
                                                                        <Checkbox
                                                                            checked={selectedMatchIds.includes(
                                                                                match.id,
                                                                            )}
                                                                        />
                                                                        <ListItemText
                                                                            primary={`Match ${match.matchNumber}: ${match.teams}`}
                                                                            secondary={
                                                                                match.scheduledAt ||
                                                                                match.status
                                                                            }
                                                                        />
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>
                                                    </Stack>
                                                    <Stack direction="row" spacing={1}>
                                                        <Button
                                                            variant="contained"
                                                            onClick={() =>
                                                                void saveAssignments(referee)
                                                            }
                                                        >
                                                            Save assignments
                                                        </Button>
                                                        <Button
                                                            variant="outlined"
                                                            onClick={() => setEditingId(null)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </Stack>
                                                </>
                                            )}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    )}
                </Box>
            </Stack>
        </Box>
    );
}
