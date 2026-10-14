export type FieldType = "counter" | "boolean" | "single_choice";

export type FieldValue = number | boolean | string;

export interface ChoiceOption {
    value: string;
    label: string;
    points: number;
}

export interface ScoreField {
    id: string;
    label: string;
    type: FieldType;

    min?: number;
    max?: number;
    pointsEach?: number;
    pointsIfTrue?: number;

    options?: ChoiceOption[];

    shared?: boolean;
    required?: boolean;
}

export interface ScoreMission {
    id: string;
    name: string;
    description?: string;
    fields: ScoreField[];
}

export interface ScoresheetTemplate {
    id: string;
    name: string;
    description?: string;

    version: number;
    status: "draft" | "published";

    missions: ScoreMission[];
}

export type ScoresheetValues = Record<string, FieldValue>;
