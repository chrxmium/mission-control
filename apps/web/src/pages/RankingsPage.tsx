import {
    Box,
    Card,
    CardContent,
    Chip,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";

const mockRankings = [
    {
        rank: 1,
        teamNumber: 12345,
        teamName: "Sample Team Alpha",
        matches: 3,
        averageScore: 427.3,
        highScore: 455,
    },
    {
        rank: 2,
        teamNumber: 67890,
        teamName: "Sample Team Beta",
        matches: 3,
        averageScore: 401.7,
        highScore: 430,
    },
    {
        rank: 3,
        teamNumber: 24680,
        teamName: "Sample Team Gamma",
        matches: 3,
        averageScore: 389.0,
        highScore: 412,
    },
    {
        rank: 4,
        teamNumber: 13579,
        teamName: "Sample Team Delta",
        matches: 2,
        averageScore: 365.5,
        highScore: 381,
    },
];

export default function RankingsPage() {
    return (
        <Box sx={{ py: 3 }}>
            <Stack
                direction={{
                    xs: "column",
                    sm: "row",
                }}
                spacing={2}
                sx={{
                    justifyContent: "space-between",
                    alignItems: {
                        xs: "flex-start",
                        sm: "center",
                    },
                    mb: 3,
                }}
            >
                <Box>
                    <Typography
                        variant="h4"
                        sx={{ fontWeight: 800 }}
                    >
                        Rankings
                    </Typography>

                    <Typography
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                    >
                        BIOGLOW · Official Match Rankings
                    </Typography>
                </Box>

                <Chip
                    label="Qualification"
                    color="primary"
                    variant="outlined"
                />
            </Stack>

            <Card variant="outlined">
                <CardContent sx={{ p: 0 }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>
                                        Rank
                                    </TableCell>

                                    <TableCell sx={{ fontWeight: 700 }}>
                                        Team
                                    </TableCell>

                                    <TableCell
                                        align="center"
                                        sx={{ fontWeight: 700 }}
                                    >
                                        Matches
                                    </TableCell>

                                    <TableCell
                                        align="right"
                                        sx={{ fontWeight: 700 }}
                                    >
                                        Average
                                    </TableCell>

                                    <TableCell
                                        align="right"
                                        sx={{ fontWeight: 700 }}
                                    >
                                        High
                                    </TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {mockRankings.map((team) => (
                                    <TableRow
                                        key={team.teamNumber}
                                        hover
                                    >
                                        <TableCell>
                                            <Typography
                                                sx={{
                                                    fontWeight: 800,
                                                    fontSize: "1.1rem",
                                                }}
                                            >
                                                {team.rank}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <Typography
                                                sx={{ fontWeight: 700 }}
                                            >
                                                {team.teamNumber}
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                {team.teamName}
                                            </Typography>
                                        </TableCell>

                                        <TableCell align="center">
                                            {team.matches}
                                        </TableCell>

                                        <TableCell align="right">
                                            <Typography
                                                sx={{
                                                    fontWeight: 800,
                                                    fontSize: "1.1rem",
                                                }}
                                            >
                                                {team.averageScore.toFixed(1)}
                                            </Typography>
                                        </TableCell>

                                        <TableCell align="right">
                                            {team.highScore}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 2 }}
            >
                Rankings are ordered by average score across official matches.
            </Typography>
        </Box>
    );
}