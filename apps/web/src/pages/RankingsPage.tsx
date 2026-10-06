import { useEffect, useState } from "react";

import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";

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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";

type Ranking = {
    rank: number | null;
    teamId: number;
    teamNumber: number;
    teamName: string;
    matches: number;
    averageScore: number | null;
    highScore: number | null;
};

type RankingsResponse = {
    rankings: Ranking[];
};

export default function RankingsPage() {
    const [rankings, setRankings] =
        useState<Ranking[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const loadRankings = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                "http://localhost:3001/api/v1/rankings",
            );

            if (!response.ok) {
                setError(
                    `Failed to load rankings (${response.status}).`,
                );

                return;
            }

            const data: RankingsResponse =
                await response.json();

            setRankings(data.rankings);
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
        void loadRankings();
    }, []);

    const rankedTeams =
        rankings.filter(
            (team) =>
                team.rank !== null,
        );

    const unrankedTeams =
        rankings.filter(
            (team) =>
                team.rank === null,
        );

    return (
        <Box sx={{ py: 3 }}>
            <Stack
                direction={{
                    xs: "column",
                    sm: "row",
                }}
                spacing={2}
                sx={{
                    justifyContent:
                        "space-between",
                    alignItems: {
                        xs: "stretch",
                        sm: "center",
                    },
                    mb: 3,
                }}
            >
                <Box>
                    <Stack
                        direction="row"
                        spacing={1.5}
                        sx={{
                            alignItems: "center",
                        }}
                    >
                        <EmojiEventsOutlinedIcon
                            color="primary"
                            sx={{
                                fontSize: 34,
                            }}
                        />

                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 800,
                            }}
                        >
                            Rankings
                        </Typography>
                    </Stack>

                    <Typography
                        color="text.secondary"
                        sx={{ mt: 0.75 }}
                    >
                        BIOGLOW · Official Match Rankings
                    </Typography>
                </Box>

                <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                        alignItems: "center",
                    }}
                >
                    <Chip
                        label="Qualification"
                        color="primary"
                        variant="outlined"
                    />

                    <Button
                        variant="outlined"
                        startIcon={
                            <RefreshIcon />
                        }
                        onClick={() =>
                            void loadRankings()
                        }
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                </Stack>
            </Stack>

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                >
                    {error}
                </Alert>
            )}

            <Card
                variant="outlined"
                sx={{
                    overflow: "hidden",
                }}
            >
                <CardContent
                    sx={{
                        p: 0,
                    }}
                >
                    <Box
                        sx={{
                            px: 2.5,
                            py: 2,
                            borderBottom: 1,
                            borderColor:
                                "divider",
                        }}
                    >
                        <Stack
                            direction={{
                                xs: "column",
                                sm: "row",
                            }}
                            spacing={1}
                            sx={{
                                justifyContent:
                                    "space-between",
                                alignItems: {
                                    xs: "flex-start",
                                    sm: "center",
                                },
                            }}
                        >
                            <Box>
                                <Typography
                                    sx={{
                                        fontWeight: 800,
                                    }}
                                >
                                    Team standings
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Ranked by average score across official matches.
                                </Typography>
                            </Box>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                {rankings.length} teams
                            </Typography>
                        </Stack>
                    </Box>

                    {loading ? (
                        <Box
                            sx={{
                                py: 8,
                                display: "flex",
                                justifyContent:
                                    "center",
                            }}
                        >
                            <CircularProgress />
                        </Box>
                    ) : rankings.length === 0 ? (
                        <Box
                            sx={{
                                py: 8,
                                px: 2,
                                textAlign:
                                    "center",
                            }}
                        >
                            <Typography
                                sx={{
                                    fontWeight: 700,
                                }}
                            >
                                No teams yet
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.5 }}
                            >
                                Rankings will appear once teams and scores are added.
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell
                                            sx={{
                                                width: 90,
                                                fontWeight: 700,
                                            }}
                                        >
                                            Rank
                                        </TableCell>

                                        <TableCell
                                            sx={{
                                                fontWeight: 700,
                                            }}
                                        >
                                            Team
                                        </TableCell>

                                        <TableCell
                                            align="center"
                                            sx={{
                                                width: 110,
                                                fontWeight: 700,
                                            }}
                                        >
                                            Matches
                                        </TableCell>

                                        <TableCell
                                            align="right"
                                            sx={{
                                                width: 130,
                                                fontWeight: 700,
                                            }}
                                        >
                                            Average
                                        </TableCell>

                                        <TableCell
                                            align="right"
                                            sx={{
                                                width: 120,
                                                fontWeight: 700,
                                            }}
                                        >
                                            High
                                        </TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {rankedTeams.map(
                                        (team) => (
                                            <TableRow
                                                key={
                                                    team.teamId
                                                }
                                                hover
                                            >
                                                <TableCell>
                                                    <Box
                                                        sx={{
                                                            width: 38,
                                                            height: 38,
                                                            borderRadius:
                                                                "50%",
                                                            bgcolor:
                                                                team.rank === 1
                                                                    ? "primary.main"
                                                                    : "action.hover",
                                                            color:
                                                                team.rank === 1
                                                                    ? "primary.contrastText"
                                                                    : "text.primary",
                                                            display:
                                                                "flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            fontWeight: 800,
                                                        }}
                                                    >
                                                        {
                                                            team.rank
                                                        }
                                                    </Box>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography
                                                        sx={{
                                                            fontWeight: 800,
                                                        }}
                                                    >
                                                        {
                                                            team.teamNumber
                                                        }
                                                    </Typography>

                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        {
                                                            team.teamName
                                                        }
                                                    </Typography>
                                                </TableCell>

                                                <TableCell align="center">
                                                    {
                                                        team.matches
                                                    }
                                                </TableCell>

                                                <TableCell align="right">
                                                    <Typography
                                                        sx={{
                                                            fontWeight: 800,
                                                            fontSize:
                                                                "1.05rem",
                                                        }}
                                                    >
                                                        {team.averageScore !==
                                                        null
                                                            ? team.averageScore.toFixed(
                                                                1,
                                                            )
                                                            : "—"}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell align="right">
                                                    <Typography
                                                        sx={{
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {team.highScore ??
                                                            "—"}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )}

                                    {unrankedTeams.length >
                                        0 && (
                                            <>
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={
                                                            5
                                                        }
                                                        sx={{
                                                            py: 0,
                                                        }}
                                                    >
                                                        <Divider />
                                                    </TableCell>
                                                </TableRow>

                                                <TableRow>
                                                    <TableCell
                                                        colSpan={
                                                            5
                                                        }
                                                        sx={{
                                                            bgcolor:
                                                                "action.hover",
                                                            py: 1,
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            sx={{
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            NOT YET RANKED
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>

                                                {unrankedTeams.map(
                                                    (team) => (
                                                        <TableRow
                                                            key={
                                                                team.teamId
                                                            }
                                                            hover
                                                        >
                                                            <TableCell>
                                                                <Typography
                                                                    color="text.secondary"
                                                                    sx={{
                                                                        fontWeight: 700,
                                                                    }}
                                                                >
                                                                    —
                                                                </Typography>
                                                            </TableCell>

                                                            <TableCell>
                                                                <Typography
                                                                    sx={{
                                                                        fontWeight: 700,
                                                                    }}
                                                                >
                                                                    {
                                                                        team.teamNumber
                                                                    }
                                                                </Typography>

                                                                <Typography
                                                                    variant="body2"
                                                                    color="text.secondary"
                                                                >
                                                                    {
                                                                        team.teamName
                                                                    }
                                                                </Typography>
                                                            </TableCell>

                                                            <TableCell align="center">
                                                                {
                                                                    team.matches
                                                                }
                                                            </TableCell>

                                                            <TableCell align="right">
                                                                —
                                                            </TableCell>

                                                            <TableCell align="right">
                                                                —
                                                            </TableCell>
                                                        </TableRow>
                                                    ),
                                                )}
                                            </>
                                        )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}