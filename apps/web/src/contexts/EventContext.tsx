import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import { api } from "../lib/api.js";

export type Event = {
    id: number;
    name: string;
    season: string;
    location: string | null;
    eventDate: string | null;
    status: "draft" | "active" | "completed";
    ruleset: string;
    tableCount: number;
    practiceMatchesEnabled: boolean;
    createdAt: number;
};

type EventContextValue = {
    events: Event[];
    selectedEventId: number | null;
    selectedEvent: Event | null;
    setSelectedEventId: (id: number) => void;
    loadingEvents: boolean;
    eventsError: string;
    refreshEvents: () => Promise<void>;
};

const EventContext = createContext<EventContextValue | null>(null);

const STORAGE_KEY = "mission-control-event-id";

export function EventProvider({ children }: { children: ReactNode }) {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEventId, setSelectedEventIdState] = useState<number | null>(null);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [eventsError, setEventsError] = useState("");

    const refreshEvents = useCallback(async () => {
        setLoadingEvents(true);
        setEventsError("");

        try {
            const response = await api.api.v1.events.$get();

            if (!response.ok) {
                throw new Error(`Failed to load events (${response.status})`);
            }

            const data = await response.json();
            const loadedEvents = data.events as Event[];

            setEvents(loadedEvents);

            const savedValue = localStorage.getItem(STORAGE_KEY);
            const savedId = savedValue === null ? null : Number(savedValue);

            const savedEvent = loadedEvents.find((event) => event.id === savedId);
            const activeEvent = loadedEvents.find((event) => event.status === "active");
            const nextEvent = savedEvent ?? activeEvent ?? loadedEvents[0] ?? null;

            setSelectedEventIdState(nextEvent?.id ?? null);

            if (nextEvent) {
                localStorage.setItem(STORAGE_KEY, String(nextEvent.id));
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (error) {
            console.error(error);
            setEventsError("Failed to load events. Check your connection and try again.");
        } finally {
            setLoadingEvents(false);
        }
    }, []);

    useEffect(() => {
        void refreshEvents();
    }, [refreshEvents]);

    const setSelectedEventId = useCallback(
        (id: number) => {
            if (!events.some((event) => event.id === id)) return;

            setSelectedEventIdState(id);
            localStorage.setItem(STORAGE_KEY, String(id));
        },
        [events],
    );

    const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;

    const value = useMemo(
        () => ({
            events,
            selectedEventId,
            selectedEvent,
            setSelectedEventId,
            loadingEvents,
            eventsError,
            refreshEvents,
        }),
        [
            events,
            selectedEventId,
            selectedEvent,
            setSelectedEventId,
            loadingEvents,
            eventsError,
            refreshEvents,
        ],
    );

    return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEventContext() {
    const context = useContext(EventContext);

    if (!context) {
        throw new Error("useEventContext must be used inside EventProvider");
    }

    return context;
}
