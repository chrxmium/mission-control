export const isSqliteUniqueConstraintError = (error: unknown) =>
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "SQLITE_CONSTRAINT_UNIQUE";
