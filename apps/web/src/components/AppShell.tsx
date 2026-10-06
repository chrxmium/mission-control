import {
    AppBar,
    Box,
    Button,
    Container,
    Toolbar,
    Typography,
} from "@mui/material";

import {
    Link,
    Outlet,
} from "react-router-dom";

import ThemeSelector from "./ThemeSelector";
import type { ThemeMode } from "../theme";

type AppShellProps = {
    themeMode: ThemeMode;
    onThemeModeChange: (mode: ThemeMode) => void;
};

export default function AppShell({
                                     themeMode,
                                     onThemeModeChange,
                                 }: AppShellProps) {
    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: "background.default",
            }}
        >
            <AppBar
                position="sticky"
                color="default"
                elevation={1}
            >
                <Toolbar>
                    <Typography
                        variant="h6"
                        component={Link}
                        to="/rankings"
                        sx={{
                            flexGrow: 1,
                            fontWeight: 800,
                            color: "inherit",
                            textDecoration: "none",
                        }}
                    >
                        Mission Control
                    </Typography>

                    <Button
                        component={Link}
                        to="/rankings"
                        color="inherit"
                    >
                        Rankings
                    </Button>

                    <Button
                        component={Link}
                        to="/score/new"
                        color="inherit"
                    >
                        New Score
                    </Button>

                    <Button
                        component={Link}
                        to="/admin"
                        color="inherit"
                    >
                        Admin
                    </Button>

                    <ThemeSelector
                        themeMode={themeMode}
                        onChange={onThemeModeChange}
                    />
                </Toolbar>
            </AppBar>

            <Container
                maxWidth="lg"
                sx={{
                    px: {
                        xs: 1,
                        sm: 2,
                    },
                }}
            >
                <Outlet />
            </Container>
        </Box>
    );
}