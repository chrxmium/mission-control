import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Container,
    MenuItem,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";

import MissionCard from "../components/MissionCard";
import NumberChoices from "../components/NumberChoices";
import Stepper from "../components/Stepper";
import YesNo from "../components/YesNo";

import { score } from "../../../../packages/rules/src/score.ts";
import type { ScoreSheet } from "../../../../packages/rules/src/types.ts";

type Team = {
    id: number;
    number: number;
    name: string;
};

export default function ScorePage() {
    const [searchParams] = useSearchParams();

    const teamId = Number(searchParams.get("teamId"));
    const matchNumber = Number(
        searchParams.get("matchNumber"),
    );

    const [tableNumber, setTableNumber] = useState(1);

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const [team, setTeam] = useState<Team | null>(null);

    const [m01YoungForest, setM01YoungForest] = useState(0);
    const [m01GrandTree, setM01GrandTree] = useState(0);
    const [m01HollowTree, setM01HollowTree] = useState(0);
    const [
        m01QueenKnockedDown,
        setM01QueenKnockedDown,
    ] = useState(false);

    const [m02Base, setM02Base] = useState(0);
    const [m02Canopy, setM02Canopy] = useState(0);

    const [m03Waterfall, setM03Waterfall] = useState(0);

    const [m04Nest, setM04Nest] = useState(false);
    const [m04Hollow, setM04Hollow] = useState(false);

    const [m05Haven, setM05Haven] = useState(0);

    const [luAdded, setLuAdded] = useState(0);
    const [luContained, setLuContained] = useState(0);

    const [interference, setInterference] = useState(0);
    const [gp, setGp] = useState<2 | 3 | 4>(3);

    const hasMatchContext =
        Number.isInteger(teamId) &&
        teamId > 0 &&
        Number.isInteger(matchNumber) &&
        matchNumber > 0;

    useEffect(() => {
        if (!Number.isInteger(teamId) || teamId <= 0) {
            return;
        }

        const loadTeam = async () => {
            try {
                const response = await fetch(
                    `/api/v1/teams/${teamId}`,
                );

                if (!response.ok) {
                    setTeam(null);
                    return;
                }

                const data: { team: Team } =
                    await response.json();

                setTeam(data.team);
            } catch (error) {
                console.error(error);
                setTeam(null);
            }
        };

        loadTeam();
    }, [teamId]);

    const currentSheet: ScoreSheet = {
        m01_young_forest: m01YoungForest,
        m01_grand_tree: m01GrandTree,
        m01_hollow_tree: m01HollowTree,
        m01_queen_knocked_down: m01QueenKnockedDown,

        m02_base: m02Base,
        m02_canopy: m02Canopy,

        m03_waterfall: m03Waterfall,

        m04_nest: m04Nest,
        m04_hollow: m04Hollow,

        m05_haven: m05Haven,

        lu_added: luAdded,
        lu_contained: luContained,

        interference,
        gp,
    };

    const currentScore = score(currentSheet);

    const submitScore = async () => {
        if (!hasMatchContext) {
            setSubmitError(
                "This scoresheet is missing its team or match.",
            );

            return;
        }

        setSubmitting(true);
        setSubmitError("");

        try {
            const response = await fetch(
                "/api/v1/scoresheets",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer change-me-later",
                    },
                    body: JSON.stringify({
                        teamId,
                        matchNumber,
                        tableNumber,
                        ...currentSheet,
                    }),
                },
            );

            const data = await response.json();

            if (!response.ok) {
                setSubmitError(
                    data.error ?? "Failed to submit score.",
                );

                return;
            }

            window.location.hash =
                `/scoresheet/${data.scoresheet.id}`;
        } catch (error) {
            console.error(error);

            setSubmitError(
                "Failed to connect to the server.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box sx={{ pb: 12 }}>
            <Container
                maxWidth="md"
                sx={{
                    py: 2,
                }}
            >
                <Box sx={{ mb: 2 }}>
                    <Typography
                        variant="h4"
                        sx={{ fontWeight: 800 }}
                    >
                        Score Match
                    </Typography>

                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Match {matchNumber}
                        {team
                            ? ` · Team ${team.number} · ${team.name}`
                            : ` · Team ${teamId}`}
                    </Typography>

                    <TextField
                        select
                        label="Table"
                        value={tableNumber}
                        onChange={(event) =>
                            setTableNumber(Number(event.target.value))
                        }
                        sx={{
                            minWidth: 140,
                        }}
                    >
                        <MenuItem value={1}>Table 1</MenuItem>
                        <MenuItem value={2}>Table 2</MenuItem>
                    </TextField>
                </Box>

                <Stack spacing={2}>
                    <MissionCard
                        title="M01 - MIGHTY MICROBIOMES"
                        description="Score the keystone species resting in each microbiome."
                    >
                        <NumberChoices
                            label="Keystone species in the Young Forest:"
                            description="20 points each · Maximum 3 (60)"
                            value={m01YoungForest}
                            values={[0, 1, 2, 3]}
                            onChange={setM01YoungForest}
                        />

                        <NumberChoices
                            label="Keystone species in the Grand Tree:"
                            description="20 points each · Maximum 3 (60)"
                            value={m01GrandTree}
                            values={[0, 1, 2, 3]}
                            onChange={setM01GrandTree}
                        />

                        <NumberChoices
                            label="Keystone species in the Hollow Tree:"
                            description="20 points each · Maximum 3 (60)"
                            value={m01HollowTree}
                            values={[0, 1, 2, 3]}
                            onChange={setM01HollowTree}
                        />

                        <YesNo
                            label="Bonus: (3) keystone species are in the Young Forest AND the invasive queen on the opposite side of the field is knocked down:"
                            description="+40 points"
                            value={m01QueenKnockedDown}
                            onChange={setM01QueenKnockedDown}
                        />
                    </MissionCard>

                    <MissionCard
                        title="M02 - ROOTS OF RENEWAL"
                    >
                        <Stepper
                            label="Resources in the Grand Tree base:"
                            description="5 points each"
                            value={m02Base}
                            onChange={setM02Base}
                        />

                        <Stepper
                            label="Resources in the Canopy Chamber:"
                            description="10 points each · Maximum 3 (15)"
                            value={m02Canopy}
                            max={15}
                            onChange={setM02Canopy}
                        />
                    </MissionCard>

                    <MissionCard
                        title="M03 - CAVE WATERFALL"
                    >
                        <Stepper
                            label="Keystone species cycled through the waterfall:"
                            description="5 points each · Maximum 10 (50)"
                            value={m03Waterfall}
                            max={50}
                            onChange={setM03Waterfall}
                        />
                    </MissionCard>

                    <MissionCard
                        title="M04 - RAINFOREST AWAKENING"
                    >
                        <YesNo
                            label="All (3) keystone species are released from the nest:"
                            description="30 points"
                            value={m04Nest}
                            onChange={setM04Nest}
                        />

                        <YesNo
                            label="All (2) resources are released from the Hollow Tree:"
                            description="20 points"
                            value={m04Hollow}
                            onChange={setM04Hollow}
                        />
                    </MissionCard>

                    <MissionCard
                        title="M05 - CENTRAL HAVEN"
                        description="This is a shared mission. Both teams receive the full Central Haven score."
                    >
                        <Stepper
                            label="Keystone species or resources resting completely in the Central Haven:"
                            description="5 points each"
                            value={m05Haven}
                            onChange={setM05Haven}
                        />
                    </MissionCard>

                    <MissionCard
                        title="LEVEL UP CHALLENGE - INVASIVE ATTACK"
                    >
                        <NumberChoices
                            label="Invasive species added before the match:"
                            description="20 points each · Maximum 5 (100)"
                            value={luAdded}
                            values={[0, 1, 2, 3, 4, 5]}
                            onChange={setLuAdded}
                        />

                        <Stepper
                            label="Invasive species in the containment zone:"
                            description="10 points each"
                            value={luContained}
                            onChange={setLuContained}
                        />
                    </MissionCard>

                    <MissionCard
                        title="INTERFERENCE"
                    >
                        <NumberChoices
                            label="Interferences:"
                            description="1st: −10 · 2nd: −30 total · 3rd: nullified"
                            value={interference}
                            values={[0, 1, 2, 3]}
                            plusLabelForLast
                            onChange={setInterference}
                        />
                    </MissionCard>

                    <MissionCard
                        title="GRACIOUS PROFESSIONALISM"
                        description="This rating does not change the match score."
                    >
                        <Stack
                            direction={{
                                xs: "column",
                                sm: "row",
                            }}
                            spacing={2}
                            sx={{
                                justifyContent: "space-between",
                                alignItems: {
                                    xs: "stretch",
                                    sm: "center",
                                },
                                py: 1.5,
                                borderTop: 1,
                                borderColor: "divider",
                            }}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 600 }}>
                                    Gracious Professionalism:
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 0.25 }}
                                >
                                    Developing (2) · Accomplished (3) ·
                                    Exceeds (4)
                                </Typography>
                            </Box>

                            <ToggleButtonGroup
                                exclusive
                                value={gp}
                                onChange={(_, newValue) => {
                                    if (newValue !== null) {
                                        setGp(newValue);
                                    }
                                }}
                            >
                                <ToggleButton value={2}>
                                    Developing
                                </ToggleButton>

                                <ToggleButton value={3}>
                                    Accomplished
                                </ToggleButton>

                                <ToggleButton value={4}>
                                    Exceeds
                                </ToggleButton>
                            </ToggleButtonGroup>
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

                    py: 1.5,
                    px: 2,
                    zIndex: 10,
                }}
            >
                <Container maxWidth="md">
                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <Box>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block" }}
                            >
                                CURRENT SCORE
                            </Typography>

                            <Typography
                                variant="h5"
                                sx={{ fontWeight: 800 }}
                            >
                                {currentScore}
                            </Typography>
                        </Box>

                        {submitError && (
                            <Alert severity="error">
                                {submitError}
                            </Alert>
                        )}

                        <Button
                            variant="contained"
                            size="large"
                            onClick={submitScore}
                            disabled={submitting}
                            sx={{
                                minWidth: 170,
                                minHeight: 52,
                                fontWeight: 700,
                            }}
                        >
                            {submitting ? "Submitting..." : "Submit Score"}
                        </Button>
                    </Stack>
                </Container>
            </Box>
        </Box>
    );
}