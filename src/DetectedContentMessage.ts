import * as yup from "yup";
import {InferType} from "yup";

export const detectedContentMessageSchema = yup.object({
  type: yup.string().required(),
});

export type DetectedContentMessage = InferType<
  typeof detectedContentMessageSchema
>;
