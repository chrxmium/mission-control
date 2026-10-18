import * as v from "valibot";

export const loginSchema = v.object({
    password: v.string(),
});

export type LoginInput = v.InferOutput<typeof loginSchema>;
