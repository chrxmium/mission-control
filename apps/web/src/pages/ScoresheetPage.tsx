import { useEffect, useState } from "react";

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
    Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link, useParams } from "react-router-dom";

type Team = {
    id: number;
    number: number;
    name: string;
};

type Scoresheet = {
    id: number;
    teamId: number;
    matchNumber: number;
    tableNumber: number;

    m01YoungForest: number;
    m01GrandTree: number;
    m01HollowTree: number;
    m01QueenKnockedDown: boolean;

    m02Base: number;
    m02Canopy: number;

    m03Waterfall: number;

    m04Nest: boolean;
    m04Hollow: boolean;

    m05Haven: number;

    luAdded: number;
    luContained: number;

    interference: number;
    gp: number;

    totalScore: number;
    submittedAt: string;
};

type Mission = {
    title: string;
    rows: [string, string][];
};

const yesNo = (value: boolean): string =>
    value ? "Yes" : "No";

function buildMissions(sheet: Scoresheet): Mission[] {
    return [
        {
            title: "M01 - Mighty Microbiomes",
            rows: [
                [
                    "Young Forest",
                    String(sheet.m01YoungForest),
                ],
                [
                    "Grand Tree",
                    String(sheet.m01GrandTree),
                ],
                [
                    "Hollow Tree",
                    String(sheet.m01HollowTree),
                ],
                [
                    "Invasive queen knocked down",
                    yesNo(sheet.m01QueenKnockedDown),
                ],
            ],
        },
        {
            title: "M02 - Roots of Renewal",
            rows: [
                [
                    "Grand Tree base",
                    String(sheet.m02Base),
                ],
                [
                    "Canopy Chamber",
                    String(sheet.m02Canopy),
                ],
            ],
        },
        {
            title: "M03 - Cave Waterfall",
            rows: [
                [
                    "Keystone species cycled",
                    String(sheet.m03Waterfall),
                ],
            ],
        },
        {
            title: "M04 - Rainforest Awakening",
            rows: [
                [
                    "All (3) keystone species released",
                    yesNo(sheet.m04Nest),
                ],
                [
                    "All (2) resources released",
                    yesNo(sheet.m04Hollow),
                ],
            ],
        },
        {
            title: "M05 - Central Haven",
            rows: [
                [
                    "Scoring objects in Central Haven",
                    String(sheet.m05Haven),
                ],
            ],
        },
        {
            title: "Level Up - Invasive Attack",
            rows: [
                [
                    "Invasive species added",
                    String(sheet.luAdded),
                ],
                [
                    "Invasive species contained",
                    String(sheet.luContained),
                ],
            ],
        },
        {
            title: "Interference",
            rows: [
                [
                    "Violations",
                    String(sheet.interference),
                ],
            ],
        },
        {
            title: "Gracious Professionalism",
            rows: [
                [
                    "Rating",
                    sheet.gp === 2
                        ? "Developing (2)"
                        : sheet.gp === 3
                            ? "Accomplished (3)"
                            : sheet.gp === 4
                                ? "Exceeds (4)"
                                : String(sheet.gp),
                ],
            ],
        },
    ];
}

export default function ScoresheetPage() {
    const { id } = useParams();

    const [scoresheet, setScoresheet] =
        useState<Scoresheet | null>(null);

    const [team, setTeam] =
        useState<Team | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        const loadScoresheet = async () => {
            setLoading(true);
            setError("");
            setScoresheet(null);
            setTeam(null);

            try {
                const response = await fetch(
                    `http://localhost:3001/api/v1/scoresheets/${id}`,
                    { signal: controller.signal },
                );

                if (!response.ok) {
                    setError(
                        response.status === 404
                            ? "Scoresheet not found."
                            : `Failed to load scoresheet (${response.status}).`,
                    );
                    return;
                }

                const data: {
                    scoresheet: Scoresheet;
                } = await response.json();

                if (controller.signal.aborted) {
                    return;
                }

                const sheet = data.scoresheet;

                setScoresheet(sheet);

                const teamResponse = await fetch(
                    `http://localhost:3001/api/v1/teams/${sheet.teamId}`,
                    { signal: controller.signal },
                );

                if (teamResponse.ok) {
                    const teamData: {
                        team: Team;
                    } = await teamResponse.json();

                    if (!controller.signal.aborted) {
                        setTeam(teamData.team);
                    }
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error(error);
                    setError(
                        "Failed to connect to the server.",
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        void loadScoresheet();

        return () => controller.abort();
    }, [id]);

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

    if (error || !scoresheet) {
        return (
            <Stack spacing={2} sx={{ py: 3 }}>
                <Alert severity="error">
                    {error || "Scoresheet not found."}
                </Alert>

                <Button
                    component={Link}
                    to="/matches"
                    startIcon={<ArrowBackIcon />}
                >
                    Back to Matches
                </Button>
            </Stack>
        );
    }

    const missions = buildMissions(scoresheet);

    const submittedAt = new Date(
        scoresheet.submittedAt,
    ).toLocaleString("en-AU", {
        dateStyle: "medium",
        timeStyle: "short",
    });

    return (
        <Box sx={{ py: 3 }}>
            <Stack spacing={2}>
                <Stack
                    direction={{
                        xs: "column",
                        sm: "row",
                    }}
                    spacing={2}
                    justifyContent="space-between"
                    alignItems={{
                        xs: "flex-start",
                        sm: "center",
                    }}
                >
                    <Box>
                        <Typography
                            variant="h4"
                            fontWeight={800}
                        >
                            Scoresheet
                        </Typography>

                        <Typography color="text.secondary">
                            Score #{scoresheet.id}
                        </Typography>
                    </Box>

                    <Button
                        component={Link}
                        to="/matches"
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                    >
                        Back to Matches
                    </Button>
                </Stack>

                <Card variant="outlined">
                    <CardContent>
                        <Stack
                            direction={{
                                xs: "column",
                                sm: "row",
                            }}
                            spacing={3}
                            justifyContent="space-between"
                        >
                            <Box>
                                <Typography
                                    variant="h5"
                                    fontWeight={800}
                                >
                                    {team
                                        ? `Team ${team.number}`
                                        : `Team ID ${scoresheet.teamId}`}
                                </Typography>

                                <Typography color="text.secondary">
                                    {team?.name ??
                                        "Team details unavailable"}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    sx={{ mt: 1 }}
                                >
                                    Match{" "}
                                    {scoresheet.matchNumber}
                                    {" · "}
                                    Table{" "}
                                    {scoresheet.tableNumber}
                                </Typography>
                            </Box>

                            <Box
                                sx={{
                                    textAlign: {
                                        xs: "left",
                                        sm: "right",
                                    },
                                }}
                            >
                                <Typography
                                    variant="overline"
                                    color="text.secondary"
                                >
                                    Final Score
                                </Typography>

                                <Typography
                                    variant="h3"
                                    fontWeight={900}
                                >
                                    {scoresheet.totalScore}
                                </Typography>

                                <Chip
                                    label="Submitted"
                                    color="success"
                                    size="small"
                                />
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>

                {missions.map((mission) => (
                    <Card
                        key={mission.title}
                        variant="outlined"
                    >
                        <CardContent>
                            <Typography
                                variant="h6"
                                fontWeight={800}
                                sx={{ mb: 1.5 }}
                            >
                                {mission.title}
                            </Typography>

                            <Stack
                                divider={<Divider flexItem />}
                            >
                                {mission.rows.map(
                                    ([label, value]) => (
                                        <Stack
                                            key={label}
                                            direction="row"
                                            spacing={2}
                                            justifyContent="space-between"
                                            alignItems="center"
                                            sx={{ py: 1.25 }}
                                        >
                                            <Typography>
                                                {label}
                                            </Typography>

                                            <Typography
                                                fontWeight={700}
                                            >
                                                {value}
                                            </Typography>
                                        </Stack>
                                    ),
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                ))}

                <Card variant="outlined">
                    <CardContent>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Submitted at
                        </Typography>

                        <Typography fontWeight={600}>
                            {submittedAt}
                        </Typography>
                    </CardContent>
                </Card>
            </Stack>
        </Box>
    );
}