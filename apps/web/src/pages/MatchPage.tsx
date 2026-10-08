import { useEffect, useState } from "react";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Grid,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import { useNavigate, useParams } from "react-router-dom";

import MissionCard from "../components/MissionCard";
import Stepper from "../components/Stepper";
import TeamScoreForm from "../components/TeamScoreForm";

import { createDefaultScoreSheet } from "../lib/defaultScoreSheet";
import {
    calculateTeamMatchScore,
} from "../lib/matchScoring";

import type {
    ParticipationStatus,
} from "../lib/matchScoring";

import type {
    ScoreSheet,
} from "../../../../packages/rules/src/types.ts";

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

export default function MatchPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [match, setMatch] = useState<Match | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const [tableNumber, setTableNumber] = useState(1);
    const [sharedM05, setSharedM05] = useState(0);

    const [team1Sheet, setTeam1Sheet] = useState<ScoreSheet>(
        createDefaultScoreSheet(),
    );

    const [team2Sheet, setTeam2Sheet] = useState<ScoreSheet>(
        createDefaultScoreSheet(),
    );

    const [team1Participation, setTeam1Participation] =
        useState<ParticipationStatus>("playing");

    const [team2Participation, setTeam2Participation] =
        useState<ParticipationStatus>("playing");

    useEffect(() => {
        const controller = new AbortController();

        const loadMatch = async () => {
            setLoading(true);
            setError("");
            setMatch(null);

            try {
                const response = await fetch(
                    "http://localhost:3001/api/v1/matches",
                    { signal: controller.signal },
                );

                if (!response.ok) {
                    setError(
                        `Failed to load match (${response.status}).`,
                    );
                    return;
                }

                const data: MatchesResponse =
                    await response.json();

                if (controller.signal.aborted) {
                    return;
                }

                const selectedMatch = data.matches.find(
                    (entry) => entry.id === Number(id),
                );

                if (!selectedMatch) {
                    setError("Match not found.");
                    return;
                }

                setMatch(selectedMatch);

                // Reset scoring state when opening another match.
                setTeam1Sheet(createDefaultScoreSheet());
                setTeam2Sheet(createDefaultScoreSheet());
                setTeam1Participation("playing");
                setTeam2Participation("playing");
                setSharedM05(0);
                setTableNumber(1);
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error(error);
                    setError("Failed to connect to the server.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        void loadMatch();

        return () => controller.abort();
    }, [id]);

    const team1Score = calculateTeamMatchScore(
        {
            teamId: match?.team1.id ?? 0,
            participation: team1Participation,
            sheet: team1Sheet,
        },
        sharedM05,
    );

    const team2Score = match?.team2
        ? calculateTeamMatchScore(
            {
                teamId: match.team2.id,
                participation: team2Participation,
                sheet: team2Sheet,
            },
            sharedM05,
        )
        : null;

    const submitMatch = async () => {
        if (!match || submitting) {
            return;
        }

        // Check that this browser tab has a referee session.
        const token = sessionStorage.getItem("referee_token");

        if (!token) {
            navigate("/unlock");
            return;
        }

        setSubmitting(true);
        setSubmitError("");

        try {
            const response = await fetch(
                `http://localhost:3001/api/v1/matches/${match.id}/submit`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        tableNumber,
                        sharedM05,

                        team1: {
                            teamId: match.team1.id,
                            participation: team1Participation,
                            sheet: team1Sheet,
                        },

                        team2: match.team2
                            ? {
                                teamId: match.team2.id,
                                participation: team2Participation,
                                sheet: team2Sheet,
                            }
                            : null,
                    }),
                },
            );

            // If the session is invalid or expired,
            // clear it and require a new login.
            if (response.status === 401) {
                sessionStorage.removeItem("referee_token");

                navigate("/unlock");
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                setSubmitError(
                    data.error ?? "Failed to submit match.",
                );
                return;
            }

            // Match successfully submitted.
            navigate("/matches");
        } catch (error) {
            console.error("Match submission failed:", error);

            setSubmitError(
                "Failed to connect to the server.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    py: 8,
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error || !match) {
        return (
            <Container maxWidth="lg" sx={{ py: 3 }}>
                <Stack spacing={2}>
                    <Alert severity="error">
                        {error || "Match not found."}
                    </Alert>

                    <Button
                        variant="outlined"
                        onClick={() => navigate("/matches")}
                    >
                        Back to Matches
                    </Button>
                </Stack>
            </Container>
        );
    }

    return (
        <Box sx={{ pb: 12 }}>
            <Container maxWidth="xl" sx={{ py: 3 }}>
                <Stack spacing={3}>
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        alignItems={{
                            xs: "stretch",
                            sm: "center",
                        }}
                        spacing={2}
                    >
                        <Box>
                            <Typography
                                variant="h4"
                                fontWeight={800}
                            >
                                Match {match.matchNumber}
                            </Typography>

                            <Typography color="text.secondary">
                                One referee ·{" "}
                                {match.team2
                                    ? "Two-team match"
                                    : "Solo / remote match"}
                            </Typography>
                        </Box>

                        <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                        >
                            <Chip
                                label={match.status}
                                variant="outlined"
                            />

                            <TextField
                                label="Table"
                                type="number"
                                size="small"
                                value={tableNumber}
                                onChange={(event) => {
                                    const value = Number(
                                        event.target.value,
                                    );

                                    if (
                                        Number.isInteger(value) &&
                                        value > 0
                                    ) {
                                        setTableNumber(value);
                                    }
                                }}
                                slotProps={{
                                    htmlInput: {
                                        min: 1,
                                        step: 1,
                                    },
                                }}
                                sx={{ width: 110 }}
                            />
                        </Stack>
                    </Stack>

                    <Grid container spacing={2}>
                        <Grid
                            size={{
                                xs: 12,
                                md: match.team2 ? 6 : 12,
                            }}
                        >
                            <TeamScoreForm
                                teamNumber={match.team1.number}
                                teamName={match.team1.name}
                                sheet={team1Sheet}
                                onChange={setTeam1Sheet}
                                participation={team1Participation}
                                onParticipationChange={
                                    setTeam1Participation
                                }
                                totalScore={team1Score}
                            />
                        </Grid>

                        {match.team2 && (
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TeamScoreForm
                                    teamNumber={match.team2.number}
                                    teamName={match.team2.name}
                                    sheet={team2Sheet}
                                    onChange={setTeam2Sheet}
                                    participation={team2Participation}
                                    onParticipationChange={
                                        setTeam2Participation
                                    }
                                    totalScore={team2Score ?? 0}
                                />
                            </Grid>
                        )}
                    </Grid>

                    <MissionCard
                        title="M05 - CENTRAL HAVEN"
                        description="Shared mission. Enter the result once for the match. Each participating, non-nullified team receives the full points."
                    >
                        <Stepper
                            label="Keystone species or resources resting completely in the Central Haven:"
                            description="5 points each"
                            value={sharedM05}
                            onChange={setSharedM05}
                        />

                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                            sx={{ mt: 2 }}
                        >
                            <Chip
                                label={`Team ${match.team1.number}: ${
                                    team1Participation === "playing"
                                        ? sharedM05 * 5
                                        : 0
                                } M05 pts`}
                            />

                            {match.team2 && (
                                <Chip
                                    label={`Team ${match.team2.number}: ${
                                        team2Participation === "playing"
                                            ? sharedM05 * 5
                                            : 0
                                    } M05 pts`}
                                />
                            )}
                        </Stack>
                    </MissionCard>
                </Stack>
            </Container>

            <Box
                sx={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: "background.paper",
                    borderTop: 1,
                    borderColor: "divider",
                    zIndex: 10,
                    py: 1.5,
                    px: 2,
                }}
            >
                <Container maxWidth="xl">
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        alignItems={{
                            xs: "stretch",
                            sm: "center",
                        }}
                        justifyContent="space-between"
                    >
                        <Stack
                            direction="row"
                            spacing={3}
                            flexWrap="wrap"
                        >
                            <Box>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    TEAM {match.team1.number}
                                </Typography>

                                <Typography
                                    variant="h5"
                                    fontWeight={800}
                                >
                                    {team1Score}
                                </Typography>
                            </Box>

                            {match.team2 && (
                                <Box>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        TEAM {match.team2.number}
                                    </Typography>

                                    <Typography
                                        variant="h5"
                                        fontWeight={800}
                                    >
                                        {team2Score}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>

                        <Stack spacing={1}>
                            {submitError && (
                                <Alert severity="error">
                                    {submitError}
                                </Alert>
                            )}

                            <Button
                                variant="contained"
                                size="large"
                                onClick={submitMatch}
                                disabled={submitting}
                                sx={{
                                    minHeight: 52,
                                    minWidth: 180,
                                    fontWeight: 700,
                                }}
                            >
                                {submitting ? "Submitting..." : "Submit Match"}
                            </Button>
                        </Stack>
                    </Stack>
                </Container>
            </Box>
        </Box>
    );
}