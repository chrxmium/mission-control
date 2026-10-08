import { useState } from "react";
import {
    Link,
    Outlet,
    useLocation,
    useNavigate,
} from "react-router-dom";

import {
    AppBar,
    Box,
    Button,
    Container,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    Stack,
    Toolbar,
    Tooltip,
    Typography,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

import type { ThemeMode } from "../theme";

type AppShellProps = {
    themeMode: ThemeMode;
    onThemeModeChange: (mode: ThemeMode) => void;
};

const links = [
    {
        label: "Matches",
        path: "/matches",
    },
    {
        label: "Rankings",
        path: "/rankings",
    },
    {
        label: "Admin",
        path: "/admin",
    },
];

export default function AppShell({
                                     themeMode,
                                     onThemeModeChange,
                                 }: AppShellProps) {
    const location = useLocation();
    const navigate = useNavigate();

    const [menuAnchor, setMenuAnchor] =
        useState<HTMLElement | null>(null);

    const menuOpen = Boolean(menuAnchor);

    const isActive = (path: string) => {
        if (path === "/matches") {
            return (
                location.pathname === "/matches" ||
                location.pathname.startsWith("/match/") ||
                location.pathname.startsWith("/scoresheet/")
            );
        }

        return location.pathname === path;
    };

    const navigateTo = (path: string) => {
        setMenuAnchor(null);
        navigate(path);
    };

    const lockReferee = () => {
        sessionStorage.removeItem("referee_token");
        navigateTo("/unlock");
    };

    const toggleTheme = () => {
        onThemeModeChange(
            themeMode === "dark" ? "light" : "dark",
        );
    };

    return (
        <Box sx={{ minHeight: "100vh" }}>
            <AppBar
                position="sticky"
                color="inherit"
                elevation={0}
                sx={{
                    borderBottom: 1,
                    borderColor: "divider",
                    bgcolor: "background.paper",
                }}
            >
                <Container maxWidth="xl">
                    <Toolbar
                        disableGutters
                        sx={{
                            minHeight: 72,
                            gap: 2,
                        }}
                    >
                        <Typography
                            component={Link}
                            to="/matches"
                            variant="h6"
                            sx={{
                                textDecoration: "none",
                                color: "text.primary",
                                fontWeight: 900,
                                letterSpacing: -0.5,
                                whiteSpace: "nowrap",
                            }}
                        >
                            Mission Control
                        </Typography>

                        {/* Desktop navigation */}
                        <Stack
                            direction="row"
                            spacing={1}
                            sx={{
                                ml: 3,
                                flexGrow: 1,
                                display: {
                                    xs: "none",
                                    md: "flex",
                                },
                            }}
                        >
                            {links.map((link) => (
                                <Button
                                    key={link.path}
                                    component={Link}
                                    to={link.path}
                                    color={
                                        isActive(link.path)
                                            ? "primary"
                                            : "inherit"
                                    }
                                    variant={
                                        isActive(link.path)
                                            ? "outlined"
                                            : "text"
                                    }
                                    sx={{
                                        fontWeight: 700,
                                        textTransform: "none",
                                    }}
                                >
                                    {link.label}
                                </Button>
                            ))}
                        </Stack>

                        {/* Desktop controls */}
                        <Stack
                            direction="row"
                            spacing={1}
                            sx={{
                                alignItems: "center",
                                ml: "auto",
                                display: {
                                    xs: "none",
                                    md: "flex",
                                },
                            }}
                        >
                            <Button
                                component={Link}
                                to="/unlock"
                                startIcon={<LockOpenOutlinedIcon />}
                                variant="contained"
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 700,
                                }}
                            >
                                Referee Unlock
                            </Button>

                            <Tooltip title="Lock referee session">
                                <IconButton
                                    aria-label="Lock referee session"
                                    onClick={lockReferee}
                                >
                                    <LogoutOutlinedIcon />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Toggle theme">
                                <IconButton
                                    aria-label="Toggle theme"
                                    onClick={toggleTheme}
                                >
                                    {themeMode === "dark" ? (
                                        <LightModeOutlinedIcon />
                                    ) : (
                                        <DarkModeOutlinedIcon />
                                    )}
                                </IconButton>
                            </Tooltip>
                        </Stack>

                        {/* Mobile controls */}
                        <Box
                            sx={{
                                ml: "auto",
                                display: {
                                    xs: "flex",
                                    md: "none",
                                },
                                alignItems: "center",
                            }}
                        >
                            <IconButton
                                aria-label="Toggle theme"
                                onClick={toggleTheme}
                            >
                                {themeMode === "dark" ? (
                                    <LightModeOutlinedIcon />
                                ) : (
                                    <DarkModeOutlinedIcon />
                                )}
                            </IconButton>

                            <IconButton
                                aria-label="Open navigation"
                                aria-controls={
                                    menuOpen
                                        ? "navigation-menu"
                                        : undefined
                                }
                                aria-haspopup="true"
                                aria-expanded={menuOpen}
                                onClick={(event) =>
                                    setMenuAnchor(event.currentTarget)
                                }
                            >
                                <MenuIcon />
                            </IconButton>
                        </Box>

                        <Menu
                            id="navigation-menu"
                            anchorEl={menuAnchor}
                            open={menuOpen}
                            onClose={() => setMenuAnchor(null)}
                            slotProps={{
                                paper: {
                                    sx: { minWidth: 220 },
                                },
                            }}
                        >
                            {links.map((link) => (
                                <MenuItem
                                    key={link.path}
                                    selected={isActive(link.path)}
                                    onClick={() =>
                                        navigateTo(link.path)
                                    }
                                >
                                    {link.label}
                                </MenuItem>
                            ))}

                            <Divider />

                            <MenuItem
                                onClick={() =>
                                    navigateTo("/unlock")
                                }
                            >
                                Referee Unlock
                            </MenuItem>

                            <MenuItem onClick={lockReferee}>
                                Lock Referee Session
                            </MenuItem>
                        </Menu>
                    </Toolbar>
                </Container>
            </AppBar>

            <Container
                maxWidth="xl"
                component="main"
                sx={{
                    pb: 4,
                }}
            >
                <Outlet />
            </Container>
        </Box>
    );
}