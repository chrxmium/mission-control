import {
    Box,
    Chip,
    MenuItem,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";

import MissionCard from "./MissionCard";
import NumberChoices from "./NumberChoices";
import Stepper from "./Stepper";
import YesNo from "./YesNo";

import type { ScoreSheet } from "../../../../packages/rules/src/types.ts";
import type {
    ParticipationStatus,
} from "../lib/matchScoring";

type TeamScoreFormProps = {
    teamNumber: number;
    teamName: string;

    sheet: ScoreSheet;
    onChange: (sheet: ScoreSheet) => void;

    participation: ParticipationStatus;
    onParticipationChange: (
        status: ParticipationStatus,
    ) => void;

    totalScore: number;
};

export default function TeamScoreForm({
                                          teamNumber,
                                          teamName,
                                          sheet,
                                          onChange,
                                          participation,
                                          onParticipationChange,
                                          totalScore,
                                      }: TeamScoreFormProps) {
    const updateField = <K extends keyof ScoreSheet>(
        field: K,
        value: ScoreSheet[K],
    ) => {
        onChange({
            ...sheet,
            [field]: value,
        });
    };

    const disabled = participation !== "playing";

    return (
        <Stack spacing={2}>
            <Box>
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Box>
                        <Typography
                            variant="h5"
                            sx={{ fontWeight: 800 }}
                        >
                            Team {teamNumber}
                        </Typography>

                        <Typography color="text.secondary">
                            {teamName}
                        </Typography>
                    </Box>

                    <Chip
                        label={`${totalScore} pts`}
                        color="primary"
                    />
                </Stack>

                <TextField
                    select
                    fullWidth
                    size="small"
                    label="Participation"
                    value={participation}
                    onChange={(event) =>
                        onParticipationChange(
                            event.target.value as ParticipationStatus,
                        )
                    }
                    sx={{ mt: 2 }}
                >
                    <MenuItem value="playing">
                        Playing
                    </MenuItem>

                    <MenuItem value="no_show">
                        No-show
                    </MenuItem>

                    <MenuItem value="nullified">
                        Nullified
                    </MenuItem>
                </TextField>
            </Box>

            <Box
                sx={{
                    opacity: disabled ? 0.5 : 1,
                    pointerEvents: disabled ? "none" : "auto",
                }}
            >
                <Stack spacing={2}>
                    <MissionCard
                        title="M01 - MIGHTY MICROBIOMES"
                    >
                        <NumberChoices
                            label="Keystone species in the Young Forest:"
                            description="20 points each · Maximum 3 (60)"
                            value={sheet.m01_young_forest}
                            values={[0, 1, 2, 3]}
                            onChange={(value) =>
                                updateField("m01_young_forest", value)
                            }
                        />

                        <NumberChoices
                            label="Keystone species in the Grand Tree:"
                            description="20 points each · Maximum 3 (60)"
                            value={sheet.m01_grand_tree}
                            values={[0, 1, 2, 3]}
                            onChange={(value) =>
                                updateField("m01_grand_tree", value)
                            }
                        />

                        <NumberChoices
                            label="Keystone species in the Hollow Tree:"
                            description="20 points each · Maximum 3 (60)"
                            value={sheet.m01_hollow_tree}
                            values={[0, 1, 2, 3]}
                            onChange={(value) =>
                                updateField("m01_hollow_tree", value)
                            }
                        />

                        <YesNo
                            label="Bonus: (3) keystone species are in the Young Forest AND the invasive queen on the opposite side of the field is knocked down:"
                            description="40 points"
                            value={sheet.m01_queen_knocked_down}
                            onChange={(value) =>
                                updateField(
                                    "m01_queen_knocked_down",
                                    value,
                                )
                            }
                        />
                    </MissionCard>

                    <MissionCard
                        title="M02 - ROOTS OF RENEWAL"
                    >
                        <Stepper
                            label="Resources in the Grand Tree base:"
                            description="5 points each"
                            value={sheet.m02_base}
                            onChange={(value) =>
                                updateField("m02_base", value)
                            }
                        />

                        <Stepper
                            label="Resources in the Canopy Chamber:"
                            description="10 points each · Maximum 15 (150)"
                            value={sheet.m02_canopy}
                            max={15}
                            onChange={(value) =>
                                updateField("m02_canopy", value)
                            }
                        />
                    </MissionCard>

                    <MissionCard
                        title="M03 - CAVE WATERFALL"
                    >
                        <Stepper
                            label="Keystone species cycled through the waterfall:"
                            description="5 points each · Maximum 50 (250)"
                            value={sheet.m03_waterfall}
                            max={50}
                            onChange={(value) =>
                                updateField("m03_waterfall", value)
                            }
                        />
                    </MissionCard>

                    <MissionCard
                        title="M04 - RAINFOREST AWAKENING"
                    >
                        <YesNo
                            label="All (3) keystone species are released from the nest:"
                            description="30 points"
                            value={sheet.m04_nest}
                            onChange={(value) =>
                                updateField("m04_nest", value)
                            }
                        />

                        <YesNo
                            label="All (2) resources are released from the Hollow Tree:"
                            description="20 points"
                            value={sheet.m04_hollow}
                            onChange={(value) =>
                                updateField("m04_hollow", value)
                            }
                        />
                    </MissionCard>

                    {/*
                        note to future me:
                        m05 isn't here because it belongs to parent (MatchPage),
                        where ref puts in shared value once for both teams.
                        null pens and noshows are handled on MatchPage too btw lol
                    */}

                    <MissionCard
                        title="LEVEL UP CHALLENGE - INVASIVE ATTACK"
                    >
                        <NumberChoices
                            label="Invasive species added before the match:"
                            description="20 points each · Maximum 5 (100)"
                            value={sheet.lu_added}
                            values={[0, 1, 2, 3, 4, 5]}
                            onChange={(value) =>
                                updateField("lu_added", value)
                            }
                        />

                        <Stepper
                            label="Invasive species in the containment zone:"
                            description="10 points each"
                            value={sheet.lu_contained}
                            onChange={(value) =>
                                updateField("lu_contained", value)
                            }
                        />
                    </MissionCard>

                    <MissionCard
                        title="INTERFERENCE"
                    >
                        <NumberChoices
                            label="Interferences:"
                            description="1st: −10 · 2nd: −30 · 3rd: match score zero"
                            value={sheet.interference}
                            values={[0, 1, 2, 3]}
                            plusLabelForLast
                            onChange={(value) =>
                                updateField("interference", value)
                            }
                        />
                    </MissionCard>

                    <MissionCard
                        title="GRACIOUS PROFESSIONALISM"
                        description="This rating does not change the match score."
                    >
                        <Stack spacing={1.5}>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Developing (2) · Accomplished (3) · Exceeds (4)
                            </Typography>

                            <ToggleButtonGroup
                                exclusive
                                fullWidth
                                value={sheet.gp}
                                onChange={(_, value) => {
                                    if (value !== null) {
                                        updateField("gp", value);
                                    }
                                }}
                                size="small"
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
            </Box>
        </Stack>
    );
}