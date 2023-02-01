import {Translator} from "~/Translator";
import {
  DetectedContentMessage,
  detectedContentMessageSchema,
} from "~/DetectedContentMessage";
import {DataFactory, Parser, Store} from "n3";
import * as yup from "yup";
import {ScrapedContent} from "~/ScrapedContent";
import {DatasetCore} from "@rdfjs/types";
import {dcterms, rdf, schema} from "@tpluscode/rdf-ns-builders";

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

const toParadicmsDataset = (wikidataDataset: Store): DatasetCore => {
  for (const schemaDataset of wikidataDataset.getSubjects(
    rdf.type,
    schema.Dataset,
    null
  )) {
    for (const schemaAbout of wikidataDataset.getObjects(
      schemaDataset,
      schema.about,
      null
    )) {
      const conceptWikibaseItem = schemaAbout;

      const paradicmsDataset = new Store();

      const paradicmsSubject = DataFactory.blankNode();
      paradicmsDataset.addQuad(
        DataFactory.quad(
          paradicmsSubject,
          dcterms.relation,
          conceptWikibaseItem
        )
      );

      for (const enWikipediaPage of wikidataDataset.getSubjects(
        schema.isPartOf,
        DataFactory.namedNode("https://en.wikipedia.org/"),
        null
      )) {
        paradicmsDataset.addQuad(
          DataFactory.quad(paradicmsSubject, dcterms.relation, enWikipediaPage)
        );
      }

      return paradicmsDataset;
    }
  }
  throw new EvalError();
};

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
      "Wikidata translator: detected content message: ",
      JSON.stringify(detectedContentMessage)
    );
    return wikidataDetectedContentMessageSchema
      .validate(detectedContentMessage)
      .then((wikidataDetectedContentMessage) => {
        // @ts-ignore
        const {conceptUri} = wikidataDetectedContentMessage;
        const conceptTtlUri = conceptUri + ".ttl";
        console.debug("Wikidata translator: fetching", conceptTtlUri);
        return fetch(conceptTtlUri).then((response) =>
          response.text().then((responseText) => {
            console.debug("Wikidata translator: fetched", conceptTtlUri);
            const parser = new Parser();
            const sourceDataset = new Store();
            sourceDataset.addQuads(parser.parse(responseText));
            console.debug(
              "parsed",
              sourceDataset.size,
              "quads into source dataset"
            );
            const scrapedContent: ScrapedContent = {
              paradicmsDataset: toParadicmsDataset(sourceDataset),
              sourceDataset,
            };
            return scrapedContent;
          })
        );
      });
  }

  readonly type = WIKIDATA_TRANSLATOR_TYPE;
}
