import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    Stack,
    Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";

const recentScores = [
    {
        id: 87,
        team: 12345,
        match: 3,
        table: 2,
        score: 455,
        status: "Submitted",
    },
    {
        id: 86,
        team: 67890,
        match: 3,
        table: 1,
        score: 430,
        status: "Submitted",
    },
    {
        id: 85,
        team: 24680,
        match: 2,
        table: 2,
        score: 412,
        status: "Submitted",
    },
];

export default function AdminPage() {
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
                        Admin
                    </Typography>

                    <Typography
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                    >
                        Head referee dashboard
                    </Typography>
                </Box>

                <Stack
                    direction="row"
                    spacing={1}
                >
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                    >
                        Refresh
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<SettingsIcon />}
                    >
                        Settings
                    </Button>
                </Stack>
            </Stack>

            <Grid
                container
                spacing={2}
                sx={{ mb: 2 }}
            >
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Teams
                            </Typography>

                            <Typography
                                variant="h4"
                                sx={{
                                    mt: 0.5,
                                    fontWeight: 800,
                                }}
                            >
                                24
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Scores Submitted
                            </Typography>

                            <Typography
                                variant="h4"
                                sx={{
                                    mt: 0.5,
                                    fontWeight: 800,
                                }}
                            >
                                18
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Current Match
                            </Typography>

                            <Typography
                                variant="h4"
                                sx={{
                                    mt: 0.5,
                                    fontWeight: 800,
                                }}
                            >
                                7
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Active Tablets
                            </Typography>

                            <Typography
                                variant="h4"
                                sx={{
                                    mt: 0.5,
                                    fontWeight: 800,
                                }}
                            >
                                4
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid
                container
                spacing={2}
            >
                <Grid size={{ xs: 12, md: 7 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Stack
                                direction="row"
                                spacing={2}
                                sx={{
                                    justifyContent:
                                        "space-between",
                                    alignItems: "center",
                                    mb: 2,
                                }}
                            >
                                <Box>
                                    <Typography
                                        variant="h6"
                                        sx={{ fontWeight: 800 }}
                                    >
                                        Recent Scores
                                    </Typography>

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Latest submitted scoresheets
                                    </Typography>
                                </Box>

                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                >
                                    New Score
                                </Button>
                            </Stack>

                            <Stack
                                divider={<Divider flexItem />}
                            >
                                {recentScores.map((entry) => (
                                    <Stack
                                        key={entry.id}
                                        direction={{
                                            xs: "column",
                                            sm: "row",
                                        }}
                                        spacing={2}
                                        sx={{
                                            py: 1.5,
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
                                                sx={{ fontWeight: 700 }}
                                            >
                                                Team {entry.team}
                                            </Typography>

                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                Match {entry.match} · Table{" "}
                                                {entry.table}
                                            </Typography>
                                        </Box>

                                        <Stack
                                            direction="row"
                                            spacing={2}
                                            sx={{
                                                alignItems: "center",
                                            }}
                                        >
                                            <Typography
                                                sx={{
                                                    fontWeight: 800,
                                                }}
                                            >
                                                {entry.score}
                                            </Typography>

                                            <Chip
                                                label={entry.status}
                                                color="success"
                                                size="small"
                                            />
                                        </Stack>
                                    </Stack>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 5 }}>
                    <Stack spacing={2}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    sx={{ fontWeight: 800 }}
                                >
                                    Referee Access
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 0.5, mb: 2 }}
                                >
                                    Generate a temporary QR code to unlock a
                                    referee tablet.
                                </Typography>

                                <Box
                                    sx={{
                                        border: 1,
                                        borderColor: "divider",
                                        borderRadius: 2,
                                        minHeight: 220,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        mb: 2,
                                    }}
                                >
                                    <Stack
                                        spacing={1}
                                        sx={{
                                            alignItems: "center",
                                            color: "text.secondary",
                                        }}
                                    >
                                        <QrCode2Icon
                                            sx={{
                                                fontSize: 96,
                                            }}
                                        />

                                        <Typography variant="body2">
                                            QR code will appear here
                                        </Typography>
                                    </Stack>
                                </Box>

                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={<QrCode2Icon />}
                                >
                                    Generate Unlock QR
                                </Button>
                            </CardContent>
                        </Card>

                        <Card variant="outlined">
                            <CardContent>
                                <Typography
                                    variant="h6"
                                    sx={{ fontWeight: 800 }}
                                >
                                    Match Control
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 0.5, mb: 2 }}
                                >
                                    Match calling and table status will go here.
                                </Typography>

                                <Stack
                                    direction="row"
                                    spacing={1}
                                >
                                    <Chip
                                        label="Table 1 Ready"
                                        color="success"
                                        variant="outlined"
                                    />

                                    <Chip
                                        label="Table 2 Ready"
                                        color="success"
                                        variant="outlined"
                                    />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
}