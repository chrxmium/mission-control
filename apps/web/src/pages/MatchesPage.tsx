import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Stack,
    Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

type MatchesResponse = {
    matches: Match[];
};

export default function MatchesPage() {
    const navigate = useNavigate();

    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadMatches = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                "http://localhost:3001/api/v1/matches",
            );

            if (!response.ok) {
                setError(
                    `Failed to load matches (${response.status}).`,
                );

                return;
            }

            const data: MatchesResponse =
                await response.json();

            setMatches(data.matches);
        } catch (error) {
            console.error(error);

            setError(
                "Failed to connect to the server.",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMatches();
    }, []);

    const openMatch = (match: Match) => {
        navigate(`/match/${match.id}`);
    };

    return (
        <Container
            maxWidth="md"
            sx={{
                py: 3,
            }}
        >
            <Stack spacing={3}>
                <Box>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 800,
                        }}
                    >
                        Matches
                    </Typography>

                    <Typography color="text.secondary">
                        Select a match to begin scoring.
                    </Typography>
                </Box>

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
                        {matches.map((match) => (
                            <Card
                                key={match.id}
                                variant="outlined"
                            >
                                <CardContent>
                                    <Stack spacing={2}>
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            justifyContent="space-between"
                                        >
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                alignItems="center"
                                            >
                                                <Typography
                                                    variant="h6"
                                                    sx={{ fontWeight: 800 }}
                                                >
                                                    Match {match.matchNumber}
                                                </Typography>

                                                <Chip
                                                    size="small"
                                                    label={match.status}
                                                />
                                            </Stack>

                                            {match.scheduledAt && (
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    {new Date(
                                                        match.scheduledAt,
                                                    ).toLocaleTimeString(
                                                        [],
                                                        {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        },
                                                    )}
                                                </Typography>
                                            )}
                                        </Stack>

                                        <Stack
                                            direction={{
                                                xs: "column",
                                                sm: "row",
                                            }}
                                            spacing={2}
                                            alignItems="center"
                                            justifyContent="center"
                                        >
                                            <Box
                                                sx={{
                                                    flex: 1,
                                                    width: "100%",
                                                    textAlign: {
                                                        xs: "left",
                                                        sm: "right",
                                                    },
                                                }}
                                            >
                                                <Typography
                                                    variant="h5"
                                                    sx={{ fontWeight: 800 }}
                                                >
                                                    {match.team1.number}
                                                </Typography>

                                                <Typography color="text.secondary">
                                                    {match.team1.name}
                                                </Typography>
                                            </Box>

                                            {match.team2 ? (
                                                <>
                                                    <Typography
                                                        sx={{
                                                            fontWeight: 900,
                                                            color: "text.secondary",
                                                        }}
                                                    >
                                                        VS
                                                    </Typography>

                                                    <Box
                                                        sx={{
                                                            flex: 1,
                                                            width: "100%",
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="h5"
                                                            sx={{ fontWeight: 800 }}
                                                        >
                                                            {match.team2.number}
                                                        </Typography>

                                                        <Typography color="text.secondary">
                                                            {match.team2.name}
                                                        </Typography>
                                                    </Box>
                                                </>
                                            ) : (
                                                <Box
                                                    sx={{
                                                        flex: 1,
                                                        width: "100%",
                                                    }}
                                                >
                                                    <Chip
                                                        label="Solo / Remote Match"
                                                        variant="outlined"
                                                    />
                                                </Box>
                                            )}
                                        </Stack>

                                        <Button
                                            variant="contained"
                                            size="large"
                                            fullWidth
                                            onClick={() =>
                                                openMatch(match)
                                            }
                                            sx={{
                                                minHeight: 50,
                                                fontWeight: 700,
                                            }}
                                        >
                                            Open Match
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}

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