import {
    Check as CheckIcon,
    BrightnessAuto as BrightnessAutoIcon,
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
} from "@mui/icons-material";

import {
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Tooltip,
} from "@mui/material";

import { useState, type MouseEvent } from "react";

import type { ThemeMode } from "../theme";

type ThemeSelectorProps = {
    themeMode: ThemeMode;
    onChange: (mode: ThemeMode) => void;
};

export default function ThemeSelector({
                                          themeMode,
                                          onChange,
                                      }: ThemeSelectorProps) {
    const [anchorEl, setAnchorEl] =
        useState<HTMLElement | null>(null);

    const open = Boolean(anchorEl);

    const openMenu = (
        event: MouseEvent<HTMLElement>,
    ) => {
        setAnchorEl(event.currentTarget);
    };

    const closeMenu = () => {
        setAnchorEl(null);
    };

    const selectMode = (mode: ThemeMode) => {
        onChange(mode);
        closeMenu();
    };

    const icon =
        themeMode === "light" ? (
            <LightModeIcon />
        ) : themeMode === "dark" ? (
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
                        selectMode("system")
                    }
                >
                    <ListItemIcon>
                        <BrightnessAutoIcon />
                    </ListItemIcon>

                    <ListItemText>
                        System
                    </ListItemText>

                    {themeMode === "system" && (
                        <CheckIcon fontSize="small" />
                    )}
                </MenuItem>

                <MenuItem
                    onClick={() =>
                        selectMode("light")
                    }
                >
                    <ListItemIcon>
                        <LightModeIcon />
                    </ListItemIcon>

                    <ListItemText>
                        Light
                    </ListItemText>

                    {themeMode === "light" && (
                        <CheckIcon fontSize="small" />
                    )}
                </MenuItem>

                <MenuItem
                    onClick={() =>
                        selectMode("dark")
                    }
                >
                    <ListItemIcon>
                        <DarkModeIcon />
                    </ListItemIcon>

                    <ListItemText>
                        Dark
                    </ListItemText>

                    {themeMode === "dark" && (
                        <CheckIcon fontSize="small" />
                    )}
                </MenuItem>
            </Menu>
        </>
    );
}