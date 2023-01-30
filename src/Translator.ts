import {DetectedContentMessage} from "~/DetectedContentMessage";
import {ScrapedContent} from "~/ScrapedContent";

export interface Translator {
  readonly detect: () => DetectedContentMessage | null;
  readonly scrape: (kwds: {
    detectedContentMessage: DetectedContentMessage;
  }) => Promise<ScrapedContent>;
  readonly type: string;
}
