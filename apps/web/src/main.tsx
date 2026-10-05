import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
    CssBaseline,
    ThemeProvider,
    useMediaQuery,
} from "@mui/material";

import App from "./App";
import {
    createAppTheme,
    type ThemeMode,
} from "./theme";

function getSavedThemeMode(): ThemeMode {
    const saved = localStorage.getItem("theme-mode");

    if (
        saved === "light" ||
        saved === "dark" ||
        saved === "system"
    ) {
        return saved;
    }

    return "system";
}

function Root() {
    const systemDark = useMediaQuery(
        "(prefers-color-scheme: dark)",
        {
            noSsr: true,
        },
    );

    const [themeMode, setThemeMode] =
        useState<ThemeMode>(getSavedThemeMode);

    const resolvedMode =
        themeMode === "system"
            ? systemDark
                ? "dark"
                : "light"
            : themeMode;

    const theme = useMemo(
        () => createAppTheme(resolvedMode),
        [resolvedMode],
    );

    const changeThemeMode = (mode: ThemeMode) => {
        setThemeMode(mode);
        localStorage.setItem("theme-mode", mode);
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />

            <App
                themeMode={themeMode}
                onThemeModeChange={changeThemeMode}
            />
        </ThemeProvider>
    );
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <Root />
    </StrictMode>,
);