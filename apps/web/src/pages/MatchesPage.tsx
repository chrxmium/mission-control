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

type Match = {
    id: number;
    matchNumber: number;
    scheduledAt: string | null;
    status: string;

    teamId: number;
    teamNumber: number;
    teamName: string;
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
        navigate(
            `/score/new?teamId=${match.teamId}&matchNumber=${match.matchNumber}`,
        );
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
                                    <Stack
                                        direction={{
                                            xs: "column",
                                            sm: "row",
                                        }}
                                        spacing={2}
                                        alignItems={{
                                            xs: "stretch",
                                            sm: "center",
                                        }}
                                        justifyContent="space-between"
                                    >
                                        <Stack spacing={0.5}>
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                alignItems="center"
                                            >
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        fontWeight: 800,
                                                    }}
                                                >
                                                    Match{" "}
                                                    {
                                                        match.matchNumber
                                                    }
                                                </Typography>

                                                <Chip
                                                    size="small"
                                                    label={
                                                        match.status
                                                    }
                                                />
                                            </Stack>

                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontWeight: 700,
                                                }}
                                            >
                                                Team{" "}
                                                {
                                                    match.teamNumber
                                                }
                                            </Typography>

                                            <Typography color="text.secondary">
                                                {
                                                    match.teamName
                                                }
                                            </Typography>

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

                                        <Button
                                            variant="contained"
                                            size="large"
                                            onClick={() =>
                                                openMatch(match)
                                            }
                                            sx={{
                                                minWidth: 150,
                                                minHeight: 48,
                                                fontWeight: 700,
                                            }}
                                        >
                                            Score Match
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