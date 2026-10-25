import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

type Team = { id: number; number: number; name: string };
type AssignedMatch = {
    id: number;
    matchNumber: number;
    scheduledAt: string | null;
    status: string;
    team1: Team;
    team2: Team | null;
};
type Dashboard = {
    referee: { id: number; name: string; username: string; tableNumber: number | null };
    session: { expiresAt: number };
    matches: AssignedMatch[];
};

export default function RefereeHomePage() {
    const navigate = useNavigate();
    const [data, setData] = useState<Dashboard | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        const token = sessionStorage.getItem("referee_token");
        if (!token) {
            navigate("/unlock", { replace: true });
            return;
        }

        setLoading(true);
        setError("");
        try {
            const response = await fetch("/api/v1/referees/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const body = await response.json().catch(() => ({}));
            if (response.status === 401 || response.status === 403) {
                sessionStorage.removeItem("referee_token");
                navigate("/unlock", { replace: true });
                return;
            }
            if (!response.ok) {
                setError(body.error || "Could not load your referee dashboard.");
                return;
            }
            setData(body as Dashboard);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load your dashboard.");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => { void load(); }, [load]);

    const logout = () => {
        sessionStorage.removeItem("referee_token");
        navigate("/unlock", { replace: true });
    };

    return (
        <Box sx={{ py: 3 }}>
            {loading && !data ? (
                <Stack spacing={2} sx={{ py: 8, alignItems: "center" }}>
                    <CircularProgress />
                    <Typography color="text.secondary">Loading your assignments…</Typography>
                </Stack>
            ) : error && !data ? (
                <Stack spacing={2}>
                    <Alert severity="error">{error}</Alert>
                    <Button onClick={() => void load()} variant="contained">Try again</Button>
                </Stack>
            ) : data ? (
                <Stack spacing={3}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}
                        sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" } }}>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                Hello, {data.referee.name}
                            </Typography>
                            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                                Your referee dashboard
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                            <Button variant="outlined" onClick={() => void load()}>Refresh</Button>
                            <Button variant="outlined" color="inherit" onClick={logout}>Log out</Button>
                        </Stack>
                    </Stack>

                    {error && <Alert severity="warning">{error}</Alert>}

                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Your assignment</Typography>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">Referee</Typography>
                                    <Typography sx={{ fontWeight: 700 }}>{data.referee.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">@{data.referee.username}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">Assigned table</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                        {data.referee.tableNumber == null ? "Not assigned" : `Table ${data.referee.tableNumber}`}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">Scheduled matches</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 800 }}>{data.matches.length}</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>

                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>Your matches</Typography>
                        {data.matches.length === 0 ? (
                            <Alert severity="info">You don't have any matches assigned yet. Ask the head referee to update your assignments.</Alert>
                        ) : (
                            <Stack spacing={1.5}>
                                {data.matches.map((match) => (
                                    <Card key={match.id} variant="outlined">
                                        <CardContent>
                                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}
                                                sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" } }}>
                                                <Box>
                                                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Match {match.matchNumber}</Typography>
                                                    <Typography>
                                                        Team {match.team1.number} — {match.team1.name}
                                                    </Typography>
                                                    {match.team2 && (
                                                        <Typography>
                                                            Team {match.team2.number} — {match.team2.name}
                                                        </Typography>
                                                    )}
                                                    {match.scheduledAt && (
                                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                            Scheduled: {match.scheduledAt}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <Chip label={match.status} variant="outlined" />
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        )}
                    </Box>
                    <Divider />
                    <Typography variant="body2" color="text.secondary">
                        Your dashboard only displays assignments associated with your referee account.
                    </Typography>
                </Stack>
            ) : null}
        </Box>
    );
}
