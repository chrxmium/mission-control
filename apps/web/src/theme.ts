import { createTheme } from "@mui/material/styles";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedThemeMode = "light" | "dark";

export function createAppTheme(mode: ResolvedThemeMode) {
    const light = mode === "light";

    return createTheme({
        palette: {
            mode,

            primary: {
                main: light ? "#5c5fc4" : "#9a9cf2",
            },

            background: {
                default: light ? "#f3f1f5" : "#18181f",
                paper: light ? "#fcfbfd" : "#23232c",
            },

            text: {
                primary: light ? "#26252c" : "#f2f0f5",
                secondary: light ? "#6c6974" : "#aaa7b3",
            },

            divider: light ? "#ddd9e1" : "#3b3944",
        },

        shape: {
            borderRadius: 12,
        },

        typography: {
            fontFamily: [
                "Inter",
                "system-ui",
                "-apple-system",
                "BlinkMacSystemFont",
                '"Segoe UI"',
                "sans-serif",
            ].join(","),
        },

        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        backgroundColor: light
                            ? "#f3f1f5"
                            : "#18181f",
                    },
                },
            },

            MuiCard: {
                styleOverrides: {
                    root: {
                        backgroundImage: "none",
                    },
                },
            },

            MuiButton: {
                defaultProps: {
                    disableElevation: true,
                },

                styleOverrides: {
                    root: {
                        textTransform: "none",
                    },
                },
            },

            MuiToggleButton: {
                styleOverrides: {
                    root: {
                        textTransform: "none",
                        borderColor: light
                            ? "#d8d4dd"
                            : "#45434e",

                        "&.Mui-selected": {
                            backgroundColor: light
                                ? "#e5e5f8"
                                : "#393957",

                            color: light
                                ? "#42449b"
                                : "#dedfff",
                        },

                        "&.Mui-selected:hover": {
                            backgroundColor: light
                                ? "#dcdcf4"
                                : "#444467",
                        },
                    },
                },
            },

            MuiIconButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 10,
                    },
                },
            },
        },
    });
}