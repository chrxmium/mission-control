import {
    Box,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";

type NumberChoicesProps = {
    label: string;
    description?: string;
    value: number;
    values: number[];
    onChange: (value: number) => void;
    plusLabelForLast?: boolean;
};

export default function NumberChoices({
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
                value={value}
                onChange={(_, newValue) => {
                    if (newValue !== null) {
                        onChange(newValue);
                    }
                }}
                sx={{ flexShrink: 0 }}
            >
                {values.map((option, index) => (
                    <ToggleButton
                        key={option}
                        value={option}
                        sx={{
                            minWidth: 52,
                            minHeight: 48,
                        }}
                    >
                        {plusLabelForLast &&
                        index === values.length - 1
                            ? `${option}+`
                            : option}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
        </Stack>
    );
}