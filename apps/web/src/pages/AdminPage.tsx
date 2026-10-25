import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import RefreshIcon from "@mui/icons-material/Refresh";
import LogoutIcon from "@mui/icons-material/Logout";
import { QRCodeSVG } from "qrcode.react";

type Referee = {
    id: number;
    name: string;
    username: string;
    active: boolean;
    createdAt: number;
};

type LoginCode = {
    code: string;
    expiresAt: number;
    expiresIn: number;
    referee: {
        id: number;
        name: string;
        username: string;
    };
};

type ApiError = {
    error?: string;
};

async function readError(response: Response): Promise<string> {
    const data = (await response.json().catch(() => ({}))) as ApiError;
    return data.error ?? `Request failed (${response.status})`;
}

export default function AdminPage() {
    const [token, setToken] = useState(() => sessionStorage.getItem("headref_token") ?? "");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [referees, setReferees] = useState<Referee[]>([]);
    const [loginCode, setLoginCode] = useState<LoginCode | null>(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [loading, setLoading] = useState(false);

    const loadReferees = useCallback(async () => {
        if (!token) return;

        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/v1/referees", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    sessionStorage.removeItem("headref_token");
                    setToken("");
                }
                throw new Error(await readError(response));
            }

            const data = (await response.json()) as { referees: Referee[] };
            setReferees(data.referees);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to load referees.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) void loadReferees();
    }, [token, loadReferees]);

    const handleLogin = async () => {
        if (!password.trim() || loading) return;

        setLoading(true);
        setError("");
        setNotice("");

        try {
            const response = await fetch("/api/v1/auth/headref/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            if (!response.ok) throw new Error(await readError(response));

            const data = (await response.json()) as { token: string };
            sessionStorage.setItem("headref_token", data.token);
            setToken(data.token);
            setPassword("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to sign in.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem("headref_token");
        setToken("");
        setReferees([]);
        setLoginCode(null);
        setNotice("");
        setError("");
    };

    const handleCreateReferee = async () => {
        if (!name.trim() || !username.trim() || loading) return;

        setLoading(true);
        setError("");
        setNotice("");

        try {
            const response = await fetch("/api/v1/referees", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name, username }),
            });

            if (!response.ok) throw new Error(await readError(response));

            setName("");
            setUsername("");
            setNotice("Referee account created.");
            await loadReferees();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to create referee.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (referee: Referee) => {
        setError("");
        setNotice("");

        try {
            const response = await fetch(`/api/v1/referees/${referee.id}/active`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ active: !referee.active }),
            });

            if (!response.ok) throw new Error(await readError(response));

            setNotice(`${referee.name} ${referee.active ? "deactivated" : "reactivated"}.`);
            await loadReferees();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to update referee.");
        }
    };

    const handleGenerateCode = async (referee: Referee) => {
        setError("");
        setNotice("");
        setLoginCode(null);

        try {
            const response = await fetch(`/api/v1/referees/${referee.id}/login-code`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error(await readError(response));

            const data = (await response.json()) as LoginCode;
            setLoginCode(data);
            setNotice(`A five-minute login QR was generated for ${referee.name}.`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to generate QR code.");
        }
    };

    if (!token) {
        return (
            <Box sx={{ py: 5, display: "flex", justifyContent: "center" }}>
                <Card variant="outlined" sx={{ width: "100%", maxWidth: 480 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Stack spacing={2.5}>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                    Head referee
                                </Typography>
                                <Typography color="text.secondary" sx={{ mt: 1 }}>
                                    Sign in to manage referee accounts and generate their temporary
                                    scoring login QR codes.
                                </Typography>
                            </Box>

                            {error && <Alert severity="error">{error}</Alert>}

                            <TextField
                                label="Event referee password"
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                disabled={loading}
                                onChange={(event) => setPassword(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") void handleLogin();
                                }}
                                fullWidth
                            />

                            <Button
                                variant="contained"
                                size="large"
                                disabled={loading || !password.trim()}
                                onClick={() => void handleLogin()}
                            >
                                {loading ? "Signing in…" : "Sign in"}
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    return (
        <Box sx={{ py: 3 }}>
            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{
                    mb: 3,
                    justifyContent: "space-between",
                    alignItems: { xs: "flex-start", sm: "center" },
                }}
            >
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        Head referee dashboard
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                        Manage event referee access and scoring tablets.
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={() => void loadReferees()}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="outlined"
                        color="inherit"
                        startIcon={<LogoutIcon />}
                        onClick={handleLogout}
                    >
                        Sign out
                    </Button>
                </Stack>
            </Stack>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                    {error}
                </Alert>
            )}
            {notice && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice("")}>
                    {notice}
                </Alert>
            )}

            <Stack spacing={3}>
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                            Create referee
                        </Typography>
                        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                            Each referee gets an individual identity. They do not need a separate
                            password; generate a temporary QR for sign-in.
                        </Typography>

                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                            sx={{ alignItems: { sm: "flex-start" } }}
                        >
                            <TextField
                                label="Full name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                slotProps={{ htmlInput: { maxLength: 100 } }}
                                fullWidth
                            />
                            <TextField
                                label="Username"
                                value={username}
                                onChange={(event) =>
                                    setUsername(event.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))
                                }
                                helperText="Letters, numbers, _ and -"
                                slotProps={{ htmlInput: { maxLength: 50 } }}
                                fullWidth
                            />
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => void handleCreateReferee()}
                                disabled={loading || !name.trim() || username.trim().length < 3}
                                sx={{ minHeight: 56, minWidth: 150 }}
                            >
                                Create
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>

                <Card variant="outlined">
                    <CardContent>
                        <Stack
                            direction="row"
                            sx={{
                                mb: 1,
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                    Referee accounts
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {referees.length} account{referees.length === 1 ? "" : "s"}
                                </Typography>
                            </Box>
                            {loading && <CircularProgress size={24} />}
                        </Stack>

                        {referees.length === 0 && !loading && (
                            <Typography color="text.secondary" sx={{ py: 2 }}>
                                No referee accounts yet. Create one above.
                            </Typography>
                        )}

                        <Stack divider={<Divider flexItem />}>
                            {referees.map((referee) => (
                                <Stack
                                    key={referee.id}
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={2}
                                    sx={{
                                        py: 2,
                                        alignItems: { sm: "center" },
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <Box>
                                        <Typography sx={{ fontWeight: 700 }}>
                                            {referee.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            @{referee.username} · ID {referee.id}
                                        </Typography>
                                    </Box>

                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        sx={{ alignItems: "center" }}
                                    >
                                        <Chip
                                            label={referee.active ? "Active" : "Inactive"}
                                            color={referee.active ? "success" : "default"}
                                            size="small"
                                        />
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            disabled={!referee.active || loading}
                                            startIcon={<QrCode2Icon />}
                                            onClick={() => void handleGenerateCode(referee)}
                                        >
                                            Generate QR
                                        </Button>
                                        <Button
                                            size="small"
                                            color={referee.active ? "error" : "success"}
                                            onClick={() => void handleToggleActive(referee)}
                                            disabled={loading}
                                        >
                                            {referee.active ? "Deactivate" : "Reactivate"}
                                        </Button>
                                    </Stack>
                                </Stack>
                            ))}
                        </Stack>
                    </CardContent>
                </Card>

                {loginCode && (
                    <Card variant="outlined">
                        <CardContent>
                            <Stack spacing={2} sx={{ alignItems: "center" }}>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                    Login QR for {loginCode.referee.name}
                                </Typography>
                                <Alert severity="warning" sx={{ width: "100%" }}>
                                    This code expires in five minutes and can only be used once.
                                    Only show it to the intended referee.
                                </Alert>
                                <Box
                                    sx={{
                                        bgcolor: "#fff",
                                        p: 2,
                                        borderRadius: 2,
                                        display: "inline-flex",
                                    }}
                                >
                                    <QRCodeSVG
                                        value={`${window.location.origin}/unlock?code=${encodeURIComponent(loginCode.code)}`}
                                        size={240}
                                        level="M"
                                        includeMargin
                                    />
                                </Box>
                                <Typography color="text.secondary" variant="body2">
                                    Scan this QR with the referee's scoring tablet.
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Expires at {new Date(loginCode.expiresAt).toLocaleTimeString()}
                                </Typography>
                                <Button variant="outlined" onClick={() => setLoginCode(null)}>
                                    Close QR
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                )}
            </Stack>
        </Box>
    );
}
