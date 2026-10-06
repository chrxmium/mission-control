import {
    Box,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";

type YesNoProps = {
    label: string;
    description?: string;
    value: boolean;
    onChange: (value: boolean) => void;
};

export default function YesNo({
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

            <ToggleButtonGroup
                exclusive
                value={value ? "yes" : "no"}
                onChange={(_, newValue) => {
                    if (newValue === "no") {
                        onChange(false);
                    }

                    if (newValue === "yes") {
                        onChange(true);
                    }
                }}
                sx={{ flexShrink: 0 }}
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
                            borderRadius: "50%",
                            border: 2,

                            bgcolor: !value
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
                            borderRadius: "50%",
                            border: 2,

                            bgcolor: value
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