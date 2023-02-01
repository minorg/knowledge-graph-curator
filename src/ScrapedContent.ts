import {DatasetCore} from "@rdfjs/types";

export interface ScrapedContent {
  readonly paradicmsDataset: DatasetCore;
  readonly sourceDataset: DatasetCore;
}
