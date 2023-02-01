import {detectedContentMessageSchema} from "~/DetectedContentMessage";
import * as yup from "yup";
import {InferType} from "yup";

export const NO_DETECTED_CONTENT_MESSAGE_TYPE = "no";

const noDetectedContentMessageSchema = detectedContentMessageSchema.concat(
  yup.object({
    type: yup
      .string()
      .matches(new RegExp("^" + NO_DETECTED_CONTENT_MESSAGE_TYPE + "$")),
  })
);

export type NoDetectedContentMessage = InferType<
  typeof noDetectedContentMessageSchema
>;
