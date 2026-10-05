import {
    useState,
    type ReactNode,
    type MouseEvent,
} from "react";

import {
    AppBar,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Toolbar,
    Tooltip,
    Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import BrightnessAutoIcon from "@mui/icons-material/BrightnessAuto";
import CheckIcon from "@mui/icons-material/Check";

import { score } from "../../../packages/rules/src/score";
import type { ScoreSheet } from "../../../packages/rules/src/types";
import type { ThemeMode } from "./theme";

type AppProps = {
    themeMode: ThemeMode;
    onThemeModeChange: (mode: ThemeMode) => void;
};

function validateNumber(
    value: number,
    max?: number,
) {
    if (!Number.isFinite(value)) return 0;
    if (!Number.isInteger(value)) return 0;
    if (value < 0) return 0;

    if (
        max !== undefined &&
        value > max
    ) {
        return 0;
    }

    return value;
}

type StepperProps = {
    label: string;
    description?: string;
    value: number;
    onChange: (value: number) => void;
    max?: number;
};

function Stepper({
                     label,
                     description,
                     value,
                     onChange,
                     max,
                 }: StepperProps) {
    const commitValue = (raw: string) => {
        onChange(
            validateNumber(
                Number(raw),
                max,
            ),
        );
    };

    return (
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
            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                }}
            >
                <Typography
                    sx={{
                        fontWeight: 600,
                    }}
                >
                    {label}
                </Typography>

                {description && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mt: 0.25,
                        }}
                    >
                        {description}
                    </Typography>
                )}
            </Box>

            <Stack
                direction="row"
                spacing={1}
                sx={{
                    alignItems: "center",
                    flexShrink: 0,
                }}
            >
                <IconButton
                    aria-label={`Decrease ${label}`}
                    disabled={value <= 0}
                    onClick={() =>
                        onChange(
                            Math.max(
                                0,
                                value - 1,
                            ),
                        )
                    }
                    sx={{
                        width: 52,
                        height: 52,
                        border: 1,
                        borderColor: "divider",
                    }}
                >
                    <RemoveIcon />
                </IconButton>

                <TextField
                    value={value}
                    type="number"
                    size="small"
                    slotProps={{
                        htmlInput: {
                            min: 0,
                            max,
                            inputMode: "numeric",

                            style: {
                                textAlign: "center",
                                fontSize: "1.2rem",
                            },
                        },
                    }}
                    onChange={(event) => {
                        const parsed =
                            Number(
                                event.target.value,
                            );

                        if (
                            Number.isFinite(
                                parsed,
                            )
                        ) {
                            onChange(parsed);
                        }
                    }}
                    onBlur={(event) => {
                        commitValue(
                            event.target.value,
                        );
                    }}
                    onKeyDown={(event) => {
                        if (
                            event.key ===
                            "Enter"
                        ) {
                            const input =
                                event.target as HTMLInputElement;

                            commitValue(
                                input.value,
                            );

                            input.blur();
                        }
                    }}
                    sx={{
                        width: 100,
                    }}
                />

                <IconButton
                    aria-label={`Increase ${label}`}
                    disabled={
                        max !== undefined &&
                        value >= max
                    }
                    onClick={() => {
                        if (
                            max === undefined ||
                            value < max
                        ) {
                            onChange(
                                value + 1,
                            );
                        }
                    }}
                    sx={{
                        width: 52,
                        height: 52,
                        border: 1,
                        borderColor: "divider",
                    }}
                >
                    <AddIcon />
                </IconButton>
            </Stack>
        </Stack>
    );
}

type NumberChoicesProps = {
    label: string;
    description?: string;
    value: number;
    values: number[];
    onChange: (value: number) => void;
    plusLabelForLast?: boolean;
};

function NumberChoices({
                           label,
                           description,
                           value,
                           values,
                           onChange,
                           plusLabelForLast = false,
                       }: NumberChoicesProps) {
    return (
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
            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                }}
            >
                <Typography
                    sx={{
                        fontWeight: 600,
                    }}
                >
                    {label}
                </Typography>

                {description && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mt: 0.25,
                        }}
                    >
                        {description}
                    </Typography>
                )}
            </Box>

            <ToggleButtonGroup
                exclusive
                value={value}
                onChange={(
                    _,
                    newValue,
                ) => {
                    if (
                        newValue !== null
                    ) {
                        onChange(newValue);
                    }
                }}
                sx={{
                    flexShrink: 0,
                }}
            >
                {values.map(
                    (
                        option,
                        index,
                    ) => (
                        <ToggleButton
                            key={option}
                            value={option}
                            sx={{
                                minWidth: 52,
                                minHeight: 48,
                            }}
                        >
                            {plusLabelForLast &&
                            index ===
                            values.length -
                            1
                                ? `${option}+`
                                : option}
                        </ToggleButton>
                    ),
                )}
            </ToggleButtonGroup>
        </Stack>
    );
}

type YesNoProps = {
    label: string;
    description?: string;
    value: boolean;
    onChange: (value: boolean) => void;
};

function YesNo({
                   label,
                   description,
                   value,
                   onChange,
               }: YesNoProps) {
    return (
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
            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                }}
            >
                <Typography
                    sx={{
                        fontWeight: 600,
                    }}
                >
                    {label}
                </Typography>

                {description && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mt: 0.25,
                        }}
                    >
                        {description}
                    </Typography>
                )}
            </Box>

            <ToggleButtonGroup
                exclusive
                value={
                    value
                        ? "yes"
                        : "no"
                }
                onChange={(
                    _,
                    newValue,
                ) => {
                    if (
                        newValue === "no"
                    ) {
                        onChange(false);
                    }

                    if (
                        newValue === "yes"
                    ) {
                        onChange(true);
                    }
                }}
                sx={{
                    flexShrink: 0,
                }}
            >
                <ToggleButton
                    value="no"
                    sx={{
                        gap: 1,
                        minWidth: 100,
                        minHeight: 48,
                    }}
                >
                    <Box
                        sx={{
                            width: 12,
                            height: 12,
                            borderRadius:
                                "50%",
                            border: 2,

                            bgcolor:
                                !value
                                    ? "currentColor"
                                    : "transparent",
                        }}
                    />

                    No
                </ToggleButton>

                <ToggleButton
                    value="yes"
                    sx={{
                        gap: 1,
                        minWidth: 100,
                        minHeight: 48,
                    }}
                >
                    <Box
                        sx={{
                            width: 12,
                            height: 12,
                            borderRadius:
                                "50%",
                            border: 2,

                            bgcolor:
                                value
                                    ? "currentColor"
                                    : "transparent",
                        }}
                    />

                    Yes
                </ToggleButton>
            </ToggleButtonGroup>
        </Stack>
    );
}

type MissionCardProps = {
    title: string;
    description?: string;
    note?: string;
    children: ReactNode;
};

function MissionCard({
                         title,
                         description,
                         note,
                         children,
                     }: MissionCardProps) {
    return (
        <Card variant="outlined">
            <CardContent>
                <Box
                    sx={{
                        mb: 1.5,
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 800,
                        }}
                    >
                        {title}
                    </Typography>

                    {description && (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                mt: 0.5,
                            }}
                        >
                            {description}
                        </Typography>
                    )}
                </Box>

                {children}

                {note && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mt: 1.5,
                            pt: 1.5,

                            borderTop: 1,
                            borderColor:
                                "divider",

                            fontStyle:
                                "italic",
                        }}
                    >
                        {note}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}

function ThemeSelector({
                           themeMode,
                           onChange,
                       }: {
    themeMode: ThemeMode;
    onChange: (mode: ThemeMode) => void;
}) {
    const [
        anchorEl,
        setAnchorEl,
    ] =
        useState<HTMLElement | null>(
            null,
        );

    const open = Boolean(anchorEl);

    const openMenu = (
        event: MouseEvent<HTMLElement>,
    ) => {
        setAnchorEl(
            event.currentTarget,
        );
    };

    const closeMenu = () => {
        setAnchorEl(null);
    };

    const selectMode = (
        mode: ThemeMode,
    ) => {
        onChange(mode);
        closeMenu();
    };

    const icon =
        themeMode === "light" ? (
            <LightModeIcon />
        ) : themeMode ===
        "dark" ? (
            <DarkModeIcon />
        ) : (
            <BrightnessAutoIcon />
        );

    return (
        <>
            <Tooltip title="Theme">
                <IconButton
                    onClick={openMenu}
                    aria-label="Change theme"
                >
                    {icon}
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={closeMenu}
            >
                <MenuItem
                    onClick={() =>
                        selectMode(
                            "system",
                        )
                    }
                >
                    <ListItemIcon>
                        <BrightnessAutoIcon />
                    </ListItemIcon>

                    <ListItemText>
                        System
                    </ListItemText>

                    {themeMode ===
                        "system" && (
                            <CheckIcon
                                fontSize="small"
                            />
                        )}
                </MenuItem>

                <MenuItem
                    onClick={() =>
                        selectMode(
                            "light",
                        )
                    }
                >
                    <ListItemIcon>
                        <LightModeIcon />
                    </ListItemIcon>

                    <ListItemText>
                        Light
                    </ListItemText>

                    {themeMode ===
                        "light" && (
                            <CheckIcon
                                fontSize="small"
                            />
                        )}
                </MenuItem>

                <MenuItem
                    onClick={() =>
                        selectMode(
                            "dark",
                        )
                    }
                >
                    <ListItemIcon>
                        <DarkModeIcon />
                    </ListItemIcon>

                    <ListItemText>
                        Dark
                    </ListItemText>

                    {themeMode ===
                        "dark" && (
                            <CheckIcon
                                fontSize="small"
                            />
                        )}
                </MenuItem>
            </Menu>
        </>
    );
}

export default function App({
                                themeMode,
                                onThemeModeChange,
                            }: AppProps) {
    const [
        m01YoungForest,
        setM01YoungForest,
    ] = useState(0);

    const [
        m01GrandTree,
        setM01GrandTree,
    ] = useState(0);

    const [
        m01HollowTree,
        setM01HollowTree,
    ] = useState(0);

    const [
        m01QueenKnockedDown,
        setM01QueenKnockedDown,
    ] = useState(false);

    const [
        m02Base,
        setM02Base,
    ] = useState(0);

    const [
        m02Canopy,
        setM02Canopy,
    ] = useState(0);

    const [
        m03Waterfall,
        setM03Waterfall,
    ] = useState(0);

    const [
        m04Nest,
        setM04Nest,
    ] = useState(false);

    const [
        m04Hollow,
        setM04Hollow,
    ] = useState(false);

    const [
        m05Haven,
        setM05Haven,
    ] = useState(0);

    const [
        luAdded,
        setLuAdded,
    ] = useState(0);

    const [
        luContained,
        setLuContained,
    ] = useState(0);

    const [
        interference,
        setInterference,
    ] = useState(0);

    const [
        gp,
        setGp,
    ] =
        useState<2 | 3 | 4>(3);

    const currentSheet: ScoreSheet =
        {
            m01_young_forest:
            m01YoungForest,

            m01_grand_tree:
            m01GrandTree,

            m01_hollow_tree:
            m01HollowTree,

            m01_queen_knocked_down:
            m01QueenKnockedDown,

            m02_base:
            m02Base,

            m02_canopy:
            m02Canopy,

            m03_waterfall:
            m03Waterfall,

            m04_nest:
            m04Nest,

            m04_hollow:
            m04Hollow,

            m05_haven:
            m05Haven,

            lu_added:
            luAdded,

            lu_contained:
            luContained,

            interference,

            gp,
        };

    const currentScore =
        score(currentSheet);

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor:
                    "background.default",

                pb: 12,
            }}
        >
            <AppBar
                position="sticky"
                color="default"
                elevation={1}
            >
                <Toolbar>
                    <Box
                        sx={{
                            flexGrow: 1,
                            minWidth: 0,
                        }}
                    >
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 800,
                            }}
                        >
                            FLL Scoring
                        </Typography>

                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            Match 1 · Table 1 ·
                            Team 12345
                        </Typography>
                    </Box>

                    <ThemeSelector
                        themeMode={
                            themeMode
                        }
                        onChange={
                            onThemeModeChange
                        }
                    />

                    <Box
                        sx={{
                            ml: 1.5,
                            minWidth: 70,
                            textAlign:
                                "center",
                        }}
                    >
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                                display:
                                    "block",
                            }}
                        >
                            SCORE
                        </Typography>

                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 800,
                            }}
                        >
                            {currentScore}
                        </Typography>
                    </Box>
                </Toolbar>
            </AppBar>

            <Container
                maxWidth="md"
                sx={{
                    py: 2,
                }}
            >
                <Stack spacing={2}>
                    <MissionCard
                        title="M01 - MIGHTY MICROBIOMES"
                        description="Score the keystone species resting in each microbiome."
                    >
                        <NumberChoices
                            label="Keystone species in the Young Forest:"
                            description="20 points each · Maximum (3)"
                            value={
                                m01YoungForest
                            }
                            values={[
                                0,
                                1,
                                2,
                                3,
                            ]}
                            onChange={
                                setM01YoungForest
                            }
                        />

                        <NumberChoices
                            label="Keystone species in the Grand Tree:"
                            description="20 points each · Maximum (3)"
                            value={
                                m01GrandTree
                            }
                            values={[
                                0,
                                1,
                                2,
                                3,
                            ]}
                            onChange={
                                setM01GrandTree
                            }
                        />

                        <NumberChoices
                            label="Keystone species in the Hollow Tree:"
                            description="20 points each · Maximum (3)"
                            value={
                                m01HollowTree
                            }
                            values={[
                                0,
                                1,
                                2,
                                3,
                            ]}
                            onChange={
                                setM01HollowTree
                            }
                        />

                        <YesNo
                            label="Bonus: (3) keystone species are in the Young Forest AND the invasive queen on the opposite side of the field is knocked down:"
                            description="+40 points"
                            value={
                                m01QueenKnockedDown
                            }
                            onChange={
                                setM01QueenKnockedDown
                            }
                        />
                    </MissionCard>

                    <MissionCard
                        title="M02 - ROOTS OF RENEWAL"
                        description="Score the resources in the Grand Tree."
                    >
                        <Stepper
                            label="Resources in the Grand Tree base:"
                            description="5 points each"
                            value={
                                m02Base
                            }
                            onChange={
                                setM02Base
                            }
                        />

                        <Stepper
                            label="Resources in the Canopy Chamber:"
                            description="10 points each · Maximum (15)"
                            value={
                                m02Canopy
                            }
                            max={15}
                            onChange={
                                setM02Canopy
                            }
                        />
                    </MissionCard>

                    <MissionCard
                        title="M03 - CAVE WATERFALL"
                        description="Score keystone species cycled through the waterfall."
                    >
                        <Stepper
                            label="Keystone species cycled through the waterfall:"
                            description="5 points each · Maximum (50)"
                            value={
                                m03Waterfall
                            }
                            max={50}
                            onChange={
                                setM03Waterfall
                            }
                        />
                    </MissionCard>

                    <MissionCard
                        title="M04 - RAINFOREST AWAKENING"
                        description="Release the keystone species and resources."
                    >
                        <YesNo
                            label="All (3) keystone species are released from the nest:"
                            description="30 points"
                            value={
                                m04Nest
                            }
                            onChange={
                                setM04Nest
                            }
                        />

                        <YesNo
                            label="All (2) resources are released from the Hollow Tree:"
                            description="20 points"
                            value={
                                m04Hollow
                            }
                            onChange={
                                setM04Hollow
                            }
                        />
                    </MissionCard>

                    <MissionCard
                        title="M05 - CENTRAL HAVEN"
                        description="This is a shared mission. Both teams receive the full Central Haven score."
                    >
                        <Stepper
                            label="Keystone species or resources resting completely in the Central Haven:"
                            description="5 points each"
                            value={
                                m05Haven
                            }
                            onChange={
                                setM05Haven
                            }
                        />
                    </MissionCard>

                    <MissionCard
                        title="LEVEL UP CHALLENGE - INVASIVE ATTACK"
                        description="Score invasive species added before the match and invasive species in the containment zone."
                    >
                        <NumberChoices
                            label="Invasive species added before the match:"
                            description="20 points each · Maximum (5)"
                            value={
                                luAdded
                            }
                            values={[
                                0,
                                1,
                                2,
                                3,
                                4,
                                5,
                            ]}
                            onChange={
                                setLuAdded
                            }
                        />

                        <Stepper
                            label="Invasive species in the containment zone:"
                            description="10 points each"
                            value={
                                luContained
                            }
                            onChange={
                                setLuContained
                            }
                        />
                    </MissionCard>

                    <MissionCard
                        title="INTERFERENCE"
                        description="Record this team's total number of interference penalties."
                    >
                        <NumberChoices
                            label="Interferences:"
                            description="1st: −10 · 2nd: −30 total · 3rd or more: match score becomes 0"
                            value={
                                interference
                            }
                            values={[
                                0,
                                1,
                                2,
                                3,
                            ]}
                            plusLabelForLast
                            onChange={
                                setInterference
                            }
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
                                justifyContent:
                                    "space-between",

                                alignItems: {
                                    xs: "stretch",
                                    sm: "center",
                                },

                                py: 1.5,

                                borderTop: 1,
                                borderColor:
                                    "divider",
                            }}
                        >
                            <Box>
                                <Typography
                                    sx={{
                                        fontWeight: 600,
                                    }}
                                >
                                    Gracious
                                    Professionalism:
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        mt: 0.25,
                                    }}
                                >
                                    Developing (2)
                                    · Accomplished
                                    (3) · Exceeds
                                    (4)
                                </Typography>
                            </Box>

                            <ToggleButtonGroup
                                exclusive
                                value={gp}
                                onChange={(
                                    _,
                                    newValue,
                                ) => {
                                    if (
                                        newValue !==
                                        null
                                    ) {
                                        setGp(
                                            newValue,
                                        );
                                    }
                                }}
                            >
                                <ToggleButton
                                    value={2}
                                >
                                    Developing
                                </ToggleButton>

                                <ToggleButton
                                    value={3}
                                >
                                    Accomplished
                                </ToggleButton>

                                <ToggleButton
                                    value={4}
                                >
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
                    left: 0,
                    right: 0,
                    bottom: 0,

                    bgcolor:
                        "background.paper",

                    borderTop: 1,
                    borderColor:
                        "divider",

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
                            alignItems:
                                "center",

                            justifyContent:
                                "space-between",
                        }}
                    >
                        <Box>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    display:
                                        "block",
                                }}
                            >
                                CURRENT SCORE
                            </Typography>

                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 800,
                                }}
                            >
                                {currentScore}
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            size="large"
                            sx={{
                                minWidth: 170,
                                minHeight: 52,
                                fontWeight: 700,
                            }}
                        >
                            Submit Score
                        </Button>
                    </Stack>
                </Container>
            </Box>
        </Box>
    );
}