import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import LockOpenIcon from "@mui/icons-material/LockOpen";
import QrCode2Icon from "@mui/icons-material/QrCode2";

import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";

export default function UnlockPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const code = searchParams.get("code");

    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Prevent duplicate redemption attempts during React Strict Mode effect replay.
    const redemptionStarted = useRef(false);

    const handleCodeRedemption = useCallback(
        async (loginCode: string) => {
            if (loading) return;

            setError("");
            setLoading(true);

            try {
                const response = await fetch("/api/v1/auth/referee/redeem", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ code: loginCode }),
                });

                const data: {
                    token?: string;
                    error?: string;
                } = await response.json();

                if (!response.ok) {
                    setError(data.error ?? "Unable to redeem this QR code.");
                    return;
                }

                if (!data.token) {
                    setError("Server did not return a session token.");
                    return;
                }

                sessionStorage.setItem("referee_token", data.token);
                navigate("/matches", { replace: true });
            } catch (error) {
                console.error("QR code redemption failed:", error);
                setError("Unable to connect to the server.");
            } finally {
                setLoading(false);
            }
        },
        [navigate, loading],
    );

    useEffect(() => {
        if (!code || redemptionStarted.current) return;

        redemptionStarted.current = true;
        void handleCodeRedemption(code);
    }, [code, handleCodeRedemption]);

    const handlePasswordUnlock = async () => {
        if (loading) return;

        setError("");

        if (!password.trim()) {
            setError("Enter the referee password.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/v1/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ password }),
            });

            const data: {
                token?: string;
                error?: string;
            } = await response.json();

            if (!response.ok) {
                setError(data.error ?? "Unable to unlock.");
                return;
            }

            if (!data.token) {
                setError("Server did not return a session token.");
                return;
            }

            sessionStorage.setItem("referee_token", data.token);
            setPassword("");
            navigate("/matches", { replace: true });
        } catch (error) {
            console.error("Login failed:", error);
            setError("Unable to connect to the server.");
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
                            <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                Referee Unlock
                            </Typography>

                            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                                Unlock match scoring using your referee QR code or the event
                                password.
                            </Typography>
                        </Box>

                        {code && loading && (
                            <Alert severity="info" icon={<QrCode2Icon />}>
                                Redeeming your referee QR code...
                            </Alert>
                        )}

                        {error && <Alert severity="error">{error}</Alert>}

                        <Stack spacing={2}>
                            <TextField
                                label="Referee password"
                                type="password"
                                autoComplete="current-password"
                                fullWidth
                                value={password}
                                disabled={loading}
                                onChange={(event) => setPassword(event.target.value)}
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
                                onClick={() => void handlePasswordUnlock()}
                                disabled={loading}
                                sx={{
                                    minHeight: 52,
                                    fontWeight: 700,
                                }}
                            >
                                {loading
                                    ? code
                                        ? "Redeeming QR code..."
                                        : "Unlocking..."
                                    : "Unlock"}
                            </Button>
                        </Stack>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textAlign: "center" }}
                        >
                            Referee access is required to submit match scores. QR login codes are
                            single-use and expire after five minutes.
                        </Typography>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
}
