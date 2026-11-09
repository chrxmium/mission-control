import type { SqliteDb } from "../../db/client.js";
import type { Repositories } from "../interfaces/index.js";

import { createSqliteAuthRepository } from "./auth.js";
import { createSqliteEventRepository } from "./events.js";
import { createSqliteMatchRepository } from "./matches.js";
import { createSqliteRefereeRepository } from "./referees.js";
import { createSqliteScoresheetRepository } from "./scoresheets.js";
import { createSqliteTeamRepository } from "./teams.js";

export function createSqliteRepositories(db: SqliteDb): Repositories {
    return {
        events: createSqliteEventRepository(db),
        teams: createSqliteTeamRepository(db),
        matches: createSqliteMatchRepository(db),
        scoresheets: createSqliteScoresheetRepository(db),
        referees: createSqliteRefereeRepository(db),
        auth: createSqliteAuthRepository(db),
    };
}
