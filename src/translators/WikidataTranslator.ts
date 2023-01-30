import {Translator} from "~/Translator";
import {DetectedContentMessage} from "~/DetectedContentMessage";
import invariant from "ts-invariant";
import {Store} from "n3";
import {ScrapedContent} from "~/ScrapedContent";

interface WikidataDetectedContentMessage extends DetectedContentMessage {
  readonly conceptUri: string;
  readonly type: "wikidata";
}

export class WikidataTranslator implements Translator {
  detect() {
    if (window.location.host !== "www.wikidata.org") {
      console.debug("not on wikidata.org");
      return null;
    } else if (!window.location.pathname.startsWith("/wiki/Q")) {
      console.debug("not on a Wikidata concept page");
      return null;
    }

    const conceptUriLiElement = document.getElementById("t-wb-concept-uri");
    if (!conceptUriLiElement) {
      console.debug("Wikidata page has no concept URI element");
      return null;
    }
    for (const conceptUriAElement of conceptUriLiElement.getElementsByTagName(
      "a"
    )) {
      const href = conceptUriAElement.attributes.getNamedItem("href");
      if (href) {
        return {
          conceptUri: href.value,
          type: this.type,
        };
      }
    }
    console.debug("Wikidata page has no concept URI link");
    return null;
  }

  scrape(kwds: {detectedContentMessage: DetectedContentMessage}) {
    const {detectedContentMessage} = kwds;
    invariant(detectedContentMessage.type === this.type);
    // @ts-ignore
    const {conceptUri} =
      detectedContentMessage as WikidataDetectedContentMessage;

    const dataset = new Store();

    return new Promise<ScrapedContent>((resolve, reject) => resolve({dataset}));
  }

  readonly type = "wikidata";
}
