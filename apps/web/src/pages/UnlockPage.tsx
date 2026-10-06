import { useState } from "react";

import LockOpenIcon from "@mui/icons-material/LockOpen";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

export default function UnlockPage() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handlePasswordUnlock = () => {
        setError("");

        if (!password.trim()) {
            setError("Enter the referee password.");
            return;
        }

        // Backend authentication will go here later.
        console.log("Unlock with password:", password);
    };

    const handleQrUnlock = () => {
        // QR/token authentication will go here later.
        console.log("Start QR unlock");
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
                                Unlock
                            </Typography>

                            <Typography
                                color="text.secondary"
                                sx={{ mt: 0.5 }}
                            >
                                Unlock this device for referee access.
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
                                fullWidth
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        handlePasswordUnlock();
                                    }
                                }}
                            />

                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<LockOpenIcon />}
                                onClick={handlePasswordUnlock}
                                sx={{
                                    minHeight: 52,
                                    fontWeight: 700,
                                }}
                            >
                                Unlock
                            </Button>
                        </Stack>

                        <Divider>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                OR
                            </Typography>
                        </Divider>

                        <Button
                            variant="outlined"
                            size="large"
                            startIcon={<QrCodeScannerIcon />}
                            onClick={handleQrUnlock}
                            sx={{
                                minHeight: 52,
                                fontWeight: 700,
                            }}
                        >
                            Unlock with QR Code
                        </Button>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ textAlign: "center" }}
                        >
                            Referee access is required to enter or edit scores.
                        </Typography>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
}