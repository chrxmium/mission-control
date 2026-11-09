export type { EventRepository } from "./events.js";
export type { TeamRepository } from "./teams.js";
export type { MatchRepository } from "./matches.js";
export type { ScoresheetRepository } from "./scoresheets.js";
export type { RefereeRepository } from "./referees.js";
export type { AuthRepository } from "./auth.js";

export interface Repositories {
    events: import("./events.js").EventRepository;
    teams: import("./teams.js").TeamRepository;
    matches: import("./matches.js").MatchRepository;
    scoresheets: import("./scoresheets.js").ScoresheetRepository;
    referees: import("./referees.js").RefereeRepository;
    auth: import("./auth.js").AuthRepository;
}
