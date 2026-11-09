export type DomainErrorCode =
    | "NOT_FOUND"
    | "CONFLICT"
    | "INVALID_STATE"
    | "FORBIDDEN"
    | "VALIDATION";

export class DomainError extends Error {
    public readonly code: DomainErrorCode;

    constructor(code: DomainErrorCode, message: string) {
        super(message);
        this.code = code;
        this.name = "DomainError";
    }
}

export const notFound = (message: string) =>
    new DomainError("NOT_FOUND", message);

export const conflict = (message: string) =>
    new DomainError("CONFLICT", message);

export const invalidState = (message: string) =>
    new DomainError("INVALID_STATE", message);

export const forbidden = (message: string) =>
    new DomainError("FORBIDDEN", message);

export const validationError = (message: string) =>
    new DomainError("VALIDATION", message);
