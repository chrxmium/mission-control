import {
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import AppShell from "./components/AppShell";

import AdminPage from "./pages/AdminPage";
import MatchesPage from "./pages/MatchesPage";
import MatchPage from "./pages/MatchPage";
import RankingsPage from "./pages/RankingsPage";
import ScoresheetPage from "./pages/ScoresheetPage";
import UnlockPage from "./pages/UnlockPage";

import type { ThemeMode } from "./theme";

type AppProps = {
    themeMode: ThemeMode;
    onThemeModeChange: (mode: ThemeMode) => void;
};

export default function App({
                                themeMode,
                                onThemeModeChange,
                            }: AppProps) {
    return (
        <Routes>
            <Route
                element={
                    <AppShell
                        themeMode={themeMode}
                        onThemeModeChange={onThemeModeChange}
                    />
                }
            >
                <Route
                    path="/"
                    element={<Navigate to="/matches" replace />}
                />

                <Route
                    path="/matches"
                    element={<MatchesPage />}
                />

                <Route
                    path="/match/:id"
                    element={<MatchPage />}
                />

                <Route
                    path="/rankings"
                    element={<RankingsPage />}
                />

                <Route
                    path="/scoresheet/:id"
                    element={<ScoresheetPage />}
                />

                <Route
                    path="/unlock"
                    element={<UnlockPage />}
                />

                <Route
                    path="/admin"
                    element={<AdminPage />}
                />

                <Route
                    path="*"
                    element={<Navigate to="/matches" replace />}
                />
            </Route>
        </Routes>
    );
}