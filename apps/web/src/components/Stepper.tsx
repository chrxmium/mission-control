import {
    Box,
    IconButton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

type StepperProps = {
    label: string;
    description?: string;
    value: number;
    onChange: (value: number) => void;
    max?: number;
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

export default function Stepper({
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
                <Typography sx={{ fontWeight: 600 }}>
                    {label}
                </Typography>

                {description && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.25 }}
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
                            Number(event.target.value);

                        if (Number.isFinite(parsed)) {
                            onChange(parsed);
                        }
                    }}
                    onBlur={(event) => {
                        commitValue(event.target.value);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            const input =
                                event.target as HTMLInputElement;

                            commitValue(input.value);
                            input.blur();
                        }
                    }}
                    sx={{ width: 100 }}
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
                            onChange(value + 1);
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