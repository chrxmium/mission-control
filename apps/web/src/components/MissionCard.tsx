import type { ReactNode } from "react";

import {
    Box,
    Card,
    CardContent,
    Typography,
} from "@mui/material";

type MissionCardProps = {
    title: string;
    description?: string;
    note?: string;
    children: ReactNode;
};

export default function MissionCard({
                                        title,
                                        description,
                                        note,
                                        children,
                                    }: MissionCardProps) {
    return (
        <Card variant="outlined">
            <CardContent>
                <Box sx={{ mb: 1.5 }}>
                    <Typography
                        variant="h6"
                        sx={{ fontWeight: 800 }}
                    >
                        {title}
                    </Typography>

                    {description && (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                        >
                            {description}
                        </Typography>
                    )}
                </Box>

                {children}

                {note && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mt: 1.5,
                            pt: 1.5,
                            borderTop: 1,
                            borderColor: "divider",
                            fontStyle: "italic",
                        }}
                    >
                        {note}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}