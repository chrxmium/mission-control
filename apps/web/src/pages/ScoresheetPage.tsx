import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Stack,
    Typography,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import { Link, useParams } from "react-router-dom";

const mockScoresheet = {
    id: "87",
    teamNumber: 12345,
    teamName: "Sample Team Alpha",
    match: 3,
    table: 2,
    score: 455,
    submittedBy: "Referee 1",
    submittedAt: "6 Oct 2026, 2:34 PM",

    missions: [
        {
            title: "M01 - Mighty Microbiomes",
            rows: [
                ["Young Forest", "3"],
                ["Grand Tree", "2"],
                ["Hollow Tree", "1"],
                ["Queen knocked down", "Yes"],
            ],
        },
        {
            title: "M02 - Roots of Renewal",
            rows: [
                ["Grand Tree base", "4"],
                ["Canopy Chamber", "7"],
            ],
        },
        {
            title: "M03 - Cave Waterfall",
            rows: [
                ["Keystone species cycled", "12"],
            ],
        },
        {
            title: "M04 - Rainforest Awakening",
            rows: [
                ["All (3) keystone species released", "Yes"],
                ["All (2) resources released", "Yes"],
            ],
        },
        {
            title: "M05 - Central Haven",
            rows: [
                ["Keystone species/resources in haven", "5"],
            ],
        },
        {
            title: "Level Up - Invasive Attack",
            rows: [
                ["Invasive species added", "2"],
                ["Invasive species contained", "3"],
            ],
        },
        {
            title: "Interference",
            rows: [
                ["Interferences", "0"],
            ],
        },
        {
            title: "Gracious Professionalism",
            rows: [
                ["Rating", "Accomplished (3)"],
            ],
        },
    ],
};

export default function ScoresheetPage() {
    const { id } = useParams();

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
                        Scoresheet
                    </Typography>

                    <Typography
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                    >
                        Score #{id ?? mockScoresheet.id}
                    </Typography>
                </Box>

                <Button
                    component={Link}
                    to={`/score/${id ?? mockScoresheet.id}/edit`}
                    variant="outlined"
                    startIcon={<EditIcon />}
                >
                    Edit Score
                </Button>
            </Stack>

            <Card
                variant="outlined"
                sx={{ mb: 2 }}
            >
                <CardContent>
                    <Stack
                        direction={{
                            xs: "column",
                            sm: "row",
                        }}
                        spacing={3}
                        sx={{
                            justifyContent: "space-between",
                        }}
                    >
                        <Box>
                            <Typography
                                variant="h5"
                                sx={{ fontWeight: 800 }}
                            >
                                Team {mockScoresheet.teamNumber}
                            </Typography>

                            <Typography color="text.secondary">
                                {mockScoresheet.teamName}
                            </Typography>

                            <Typography
                                variant="body2"
                                sx={{ mt: 1 }}
                            >
                                Match {mockScoresheet.match} · Table{" "}
                                {mockScoresheet.table}
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
                                sx={{ fontWeight: 900 }}
                            >
                                {mockScoresheet.score}
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

            <Stack spacing={2}>
                {mockScoresheet.missions.map((mission) => (
                    <Card
                        key={mission.title}
                        variant="outlined"
                    >
                        <CardContent>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 800,
                                    mb: 1.5,
                                }}
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
                                            sx={{
                                                py: 1.25,
                                                justifyContent:
                                                    "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Typography>
                                                {label}
                                            </Typography>

                                            <Typography
                                                sx={{
                                                    fontWeight: 700,
                                                }}
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
            </Stack>

            <Card
                variant="outlined"
                sx={{ mt: 2 }}
            >
                <CardContent>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        Submitted by
                    </Typography>

                    <Typography sx={{ fontWeight: 600 }}>
                        {mockScoresheet.submittedBy}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                    >
                        {mockScoresheet.submittedAt}
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}