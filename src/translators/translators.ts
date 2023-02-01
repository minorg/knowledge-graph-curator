import {WikidataTranslator} from "~/translators/WikidataTranslator";
import {WikimediaCommonsTranslator} from "~/translators/WikimediaCommonsTranslator";

export const translators = [
  new WikidataTranslator(),
  new WikimediaCommonsTranslator(),
];
