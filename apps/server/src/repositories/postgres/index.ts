import type { PostgresDb } from "../../db/postgres-client.js";
import type { Repositories } from "../interfaces/index.js";

import { createPostgresAuthRepository } from "./auth.js";
import { createPostgresEventRepository } from "./events.js";
import { createPostgresMatchRepository } from "./matches.js";
import { createPostgresRefereeRepository } from "./referees.js";
import { createPostgresScoresheetRepository } from "./scoresheets.js";
import { createPostgresTeamRepository } from "./teams.js";

export function createPostgresRepositories(db: PostgresDb): Repositories {
    return {
        events: createPostgresEventRepository(db),
        teams: createPostgresTeamRepository(db),
        matches: createPostgresMatchRepository(db),
        scoresheets: createPostgresScoresheetRepository(db),
        referees: createPostgresRefereeRepository(db),
        auth: createPostgresAuthRepository(db),
    };
}
