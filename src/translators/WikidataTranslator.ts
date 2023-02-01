import {Translator} from "~/Translator";
import {
  DetectedContentMessage,
  detectedContentMessageSchema,
} from "~/DetectedContentMessage";
import {Store} from "n3";
import {ScrapedContent} from "~/ScrapedContent";
import * as yup from "yup";

const WIKIDATA_TRANSLATOR_TYPE = "wikidata";

const wikidataDetectedContentMessageSchema =
  detectedContentMessageSchema.concat(
    yup.object({
      conceptUri: yup.string().required(),
      type: yup
        .string()
        .matches(new RegExp("^" + WIKIDATA_TRANSLATOR_TYPE + "$")),
    })
  );

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
    console.debug(
      "wikidata translator: detected content message: ",
      JSON.stringify(detectedContentMessage)
    );
    return new Promise<ScrapedContent>((resolve, reject) => {
      const wikidataDetectedContentMessage =
        wikidataDetectedContentMessageSchema.validateSync(
          detectedContentMessage
        );
      // @ts-ignore
      const {conceptUri} = wikidataDetectedContentMessage;
      const dataset = new Store();
      resolve({dataset});
    });
  }

  readonly type = WIKIDATA_TRANSLATOR_TYPE;
}
