import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Collapse,
    Container,
    Divider,
    Stack,
    Typography,
} from "@mui/material";

import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";

type Team = {
    id: number;
    number: number;
    name: string;
};

type Match = {
    id: number;
    matchNumber: number;
    scheduledAt: string | null;
    status: string;
    team1: Team;
    team2: Team | null;
};

type Scoresheet = {
    id: number;
    teamId: number;
    matchNumber: number;
    totalScore: number;
};

type MatchesResponse = {
    matches: Match[];
};

type ScoresheetsResponse = {
    scoresheets: Scoresheet[];
};

export default function MatchesPage() {
    const navigate = useNavigate();

    const [matches, setMatches] = useState<Match[]>([]);
    const [scoresheets, setScoresheets] = useState<Scoresheet[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [expandedMatch, setExpandedMatch] =
        useState<number | null>(null);

    const loadMatches = async () => {
        setLoading(true);
        setError("");

        try {
            const [matchesResponse, scoresheetsResponse] =
                await Promise.all([
                    fetch("/api/v1/matches"),
                    fetch("/api/v1/scoresheets"),
                ]);

            if (!matchesResponse.ok) {
                throw new Error(
                    `Failed to load matches (${matchesResponse.status})`,
                );
            }

            if (!scoresheetsResponse.ok) {
                throw new Error(
                    `Failed to load scoresheets (${scoresheetsResponse.status})`,
                );
            }

            const matchesData: MatchesResponse =
                await matchesResponse.json();

            const scoresheetsData: ScoresheetsResponse =
                await scoresheetsResponse.json();

            setMatches(matchesData.matches);
            setScoresheets(scoresheetsData.scoresheets);
        } catch (error) {
            console.error(error);
            setError("Failed to load match information.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadMatches();
    }, []);

    const getTeamScoresheet = (
        match: Match,
        team: Team,
    ): Scoresheet | undefined => {
        return scoresheets.find(
            (sheet) =>
                sheet.matchNumber === match.matchNumber &&
                sheet.teamId === team.id,
        );
    };

    const renderTeamResult = (
        match: Match,
        team: Team,
    ) => {
        const sheet = getTeamScoresheet(match, team);

        return (
            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{
                    alignItems: { xs: "stretch", sm: "center" },
                    justifyContent: "space-between",
                }}
            >
                <Box>
                    <Typography sx={{ fontWeight: 700 }}>
                        Team {team.number}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        {team.name}
                    </Typography>
                </Box>

                <Stack
                    direction="row"
                    spacing={2}
                    sx={{
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                        {sheet?.totalScore ?? "—"}
                    </Typography>

                    <Button
                        variant="outlined"
                        size="small"
                        disabled={!sheet}
                        onClick={() => {
                            if (sheet) {
                                navigate(`/scoresheet/${sheet.id}`);
                            }
                        }}
                    >
                        Scoresheet
                    </Button>
                </Stack>
            </Stack>
        );
    };

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            <Stack spacing={3}>
                <Stack
                    direction={{
                        xs: "column",
                        sm: "row",
                    }}
                    spacing={2}
sx={{
                            alignItems: { xs: "stretch", sm: "center" },
                            justifyContent: "space-between",
                        }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800 }}>
                            Matches
                        </Typography>

                        <Typography color="text.secondary">
                            Score upcoming matches and review
                            submitted results.
                        </Typography>
                    </Box>

                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={() => void loadMatches()}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                </Stack>

                {error && (
                    <Alert severity="error">
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            py: 6,
                        }}
                    >
                        <CircularProgress />
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {matches.map((match) => {
                            const submitted =
                                match.status === "submitted";

                            const expanded =
                                expandedMatch === match.id;

                            return (
                                <Card
                                    key={match.id}
                                    variant="outlined"
                                >
                                    <CardContent>
                                        <Stack spacing={2}>
                                            <Stack
                                                direction={{
                                                    xs: "column",
                                                    sm: "row",
                                                }}
                                                spacing={2}
sx={{
                            alignItems: { xs: "stretch", sm: "center" },
                            justifyContent: "space-between",
                        }}>
                                                <Box>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                     sx={{ alignItems: "center" }}>
                                                        <Typography
                                                            variant="h6"
                                                         sx={{ fontWeight: 800 }}>
                                                            Match{" "}
                                                            {match.matchNumber}
                                                        </Typography>

                                                        <Chip
                                                            size="small"
                                                            label={
                                                                submitted
                                                                    ? "Submitted"
                                                                    : match.status
                                                            }
                                                            color={
                                                                submitted
                                                                    ? "success"
                                                                    : "default"
                                                            }
                                                            variant="outlined"
                                                        />
                                                    </Stack>

                                                    <Typography
                                                        sx={{
                                                            mt: 1,
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        Team{" "}
                                                        {match.team1.number}
                                                        {match.team2
                                                            ? ` vs Team ${match.team2.number}`
                                                            : " — Solo / Remote"}
                                                    </Typography>

                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        {match.team1.name}
                                                        {match.team2
                                                            ? ` · ${match.team2.name}`
                                                            : ""}
                                                    </Typography>

                                                    {match.scheduledAt && (
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ mt: 0.5 }}
                                                        >
                                                            {new Date(
                                                                match.scheduledAt,
                                                            ).toLocaleString(
                                                                "en-AU",
                                                                {
                                                                    dateStyle: "medium",
                                                                    timeStyle: "short",
                                                                },
                                                            )}
                                                        </Typography>
                                                    )}
                                                </Box>

                                                <Button
                                                    variant={
                                                        submitted
                                                            ? "outlined"
                                                            : "contained"
                                                    }
                                                    size="large"
                                                    startIcon={
                                                        submitted
                                                            ? <VisibilityIcon />
                                                            : <PlayArrowIcon />
                                                    }
                                                    onClick={() => {
                                                        if (submitted) {
                                                            setExpandedMatch(
                                                                expanded
                                                                    ? null
                                                                    : match.id,
                                                            );
                                                        } else {
                                                            navigate(
                                                                `/match/${match.id}`,
                                                            );
                                                        }
                                                    }}
                                                    sx={{
                                                        minWidth: 170,
                                                        minHeight: 48,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {submitted
                                                        ? expanded
                                                            ? "Hide Results"
                                                            : "View Results"
                                                        : "Score Match"}
                                                </Button>
                                            </Stack>

                                            {submitted && (
                                                <Collapse in={expanded}>
                                                    <Divider sx={{ mb: 1 }} />

                                                    <Typography
                                                        variant="subtitle1"
                                                        sx={{
                                                            mt: 1,
                                                            fontWeight: 800,
                                                        }}
                                                    >
                                                        Match Results
                                                    </Typography>

                                                    {renderTeamResult(
                                                        match,
                                                        match.team1,
                                                    )}

                                                    {match.team2 && (
                                                        <>
                                                            <Divider />
                                                            {renderTeamResult(
                                                                match,
                                                                match.team2,
                                                            )}
                                                        </>
                                                    )}
                                                </Collapse>
                                            )}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {matches.length === 0 && (
                            <Typography color="text.secondary">
                                No matches scheduled.
                            </Typography>
                        )}
                    </Stack>
                )}
            </Stack>
        </Container>
    );
}