import * as yup from "yup";
import {InferType} from "yup";

export const configurationSchema = yup.object({
  datasetStringFormat: yup.string().required(),
});

export type Configuration = InferType<typeof configurationSchema>;
