// hi lol so also yeah this had a qr code thing but it's being remove for now bc mvp thanks bye
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import LockOpenIcon from "@mui/icons-material/LockOpen";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

export default function UnlockPage() {
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handlePasswordUnlock = async () => {
        if (loading) return;

        setError("");

        if (!password.trim()) {
            setError("Enter the referee password.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                "/api/v1/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ password }),
                },
            );

            const data: {
                token?: string;
                error?: string;
            } = await response.json();

            if (!response.ok) {
                setError(
                    data.error ?? "Unable to unlock.",
                );
                return;
            }

            if (!data.token) {
                setError("Server did not return a session token.");
                return;
            }

            // Store the token for this browser tab.
            sessionStorage.setItem(
                "referee_token",
                data.token,
            );

            setPassword("");

            // Take the referee to the match list.
            navigate("/matches", { replace: true });
        } catch (error) {
            console.error("Login failed:", error);

            setError(
                "Unable to connect to the server.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                py: 5,
                display: "flex",
                justifyContent: "center",
            }}
        >
            <Card
                variant="outlined"
                sx={{
                    width: "100%",
                    maxWidth: 520,
                }}
            >
                <CardContent sx={{ p: 3 }}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography
                                variant="h4"
                                sx={{ fontWeight: 800 }}
                            >
                                Referee Unlock
                            </Typography>

                            <Typography
                                color="text.secondary"
                                sx={{ mt: 0.5 }}
                            >
                                Enter the event referee password
                                to unlock match scoring.
                            </Typography>
                        </Box>

                        {error && (
                            <Alert severity="error">
                                {error}
                            </Alert>
                        )}

                        <Stack spacing={2}>
                            <TextField
                                label="Referee password"
                                type="password"
                                autoComplete="current-password"
                                fullWidth
                                value={password}
                                disabled={loading}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        void handlePasswordUnlock();
                                    }
                                }}
                            />

                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<LockOpenIcon />}
                                onClick={() =>
                                    void handlePasswordUnlock()
                                }
                                disabled={loading}
                                sx={{
                                    minHeight: 52,
                                    fontWeight: 700,
                                }}
                            >
                                {loading
                                    ? "Unlocking..."
                                    : "Unlock"}
                            </Button>
                        </Stack>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                textAlign: "center",
                            }}
                        >
                            Referee access is required
                            to submit match scores.
                        </Typography>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
}