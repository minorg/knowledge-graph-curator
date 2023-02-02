import {Translator} from "~/Translator";
import {
  DetectedContentMessage,
  detectedContentMessageSchema,
} from "~/DetectedContentMessage";
import * as yup from "yup";
import {InferType} from "yup";
import {DataFactory, Store} from "n3";
import {dcterms} from "@tpluscode/rdf-ns-builders";
import {ScrapedContent} from "~/ScrapedContent";

const WIKIMEDIA_COMMONS_TRANSLATOR_TYPE = "wikimedia-commons";

const wikimediaCommonsDetectedContentMessageSchema =
  detectedContentMessageSchema.concat(
    yup.object({
      fileUri: yup.string().required(),
      licenseUri: yup.string(),
      rightsHolder: yup.string(),
      rightsStatementUri: yup.string(),
      type: yup
        .string()
        .matches(new RegExp("^" + WIKIMEDIA_COMMONS_TRANSLATOR_TYPE + "$")),
    })
  );

export class WikimediaCommonsTranslator implements Translator {
  detect() {
    if (window.location.host !== "commons.wikimedia.org") {
      console.debug(
        "Wikimedia Commons translator: not on commons.wikipedia.org"
      );
      return null;
    } else if (!window.location.pathname.startsWith("/wiki/File:")) {
      console.debug(
        "Wikimedia Commons translator: not on a Wikimedia Commons file page"
      );
      return null;
    }

    const hiddenCategoriesDivElement =
      document.getElementById("mw-hidden-catlinks");
    if (!hiddenCategoriesDivElement) {
      console.debug("Wikimedia Commons translator: no hidden categories div");
      return null;
    }

    let licenseUri: string | undefined;
    let rightsHolder: string | undefined;
    let rightsStatementUri: string | undefined;

    const fileinfoTableElements = document.getElementsByClassName(
      "fileinfotpl-type-information"
    );
    if (fileinfoTableElements.length > 0) {
      for (const fileinfoTableRowElement of fileinfoTableElements[0].getElementsByTagName(
        "tr"
      )) {
        const fileinfoTableCellElements =
          fileinfoTableRowElement.getElementsByTagName("td");
        if (fileinfoTableCellElements.length === 2) {
          const label = fileinfoTableCellElements[0].textContent?.trim();
          const value = fileinfoTableCellElements[1].textContent?.trim();
          if (!label || label.length === 0 || !value || value.length === 0) {
            continue;
          }
          console.debug(
            "Wikimedia Commons translator: file info field:",
            label,
            "=",
            value
          );
          switch (label) {
            case "Author":
              rightsHolder = value;
              break;
          }
        }
      }
    } else {
      console.debug("Wikimedia Commons translator: no file info table located");
    }

    for (const hiddenCategoryAnchorElement of hiddenCategoriesDivElement.getElementsByTagName(
      "a"
    )) {
      const hiddenCategoryText = hiddenCategoryAnchorElement.text;
      console.debug(
        "Wikimedia Commons translator: hidden category text:",
        hiddenCategoryText
      );
      if (!hiddenCategoryText || hiddenCategoryText.length === 0) {
        continue;
      }
      switch (hiddenCategoryText) {
        case "CC-BY-2.0":
          licenseUri = "http://creativecommons.org/licenses/by/2.0/";
          rightsStatementUri = "http://rightsstatements.org/vocab/InC/1.0/";
          break;
        case "CC-BY-3.0":
          licenseUri = "http://creativecommons.org/licenses/by/3.0/";
          rightsStatementUri = "http://rightsstatements.org/vocab/InC/1.0/";
          break;
        case "CC-PD-Mark":
          licenseUri = "http://creativecommons.org/publicdomain/mark/1.0/";
          break;
        case "Works copyrighted in the U.S.":
          rightsStatementUri = "http://rightsstatements.org/vocab/InC/1.0/";
          break;
      }
    }

    const detectedContentMessage: InferType<
      typeof wikimediaCommonsDetectedContentMessageSchema
    > = {
      rightsHolder,
      fileUri: window.location.toString(),
      licenseUri,
      rightsStatementUri,
      type: this.type,
    };
    return detectedContentMessage;
  }

  scrape(kwds: {detectedContentMessage: DetectedContentMessage}) {
    const {detectedContentMessage} = kwds;
    console.debug(
      "Wikimedia Commons translator: detected content message: ",
      JSON.stringify(detectedContentMessage)
    );
    return wikimediaCommonsDetectedContentMessageSchema
      .validate(detectedContentMessage)
      .then((wikimediaCommonsDetectedContentMessage) => {
        const paradicmsDataset = new Store();
        const paradicmsSubject = DataFactory.namedNode(
          wikimediaCommonsDetectedContentMessage.fileUri
        );
        paradicmsDataset.addQuad(
          DataFactory.quad(
            paradicmsSubject,
            dcterms.source,
            DataFactory.namedNode(
              wikimediaCommonsDetectedContentMessage.fileUri
            )
          )
        );
        if (wikimediaCommonsDetectedContentMessage.licenseUri) {
          paradicmsDataset.addQuad(
            DataFactory.quad(
              paradicmsSubject,
              dcterms.license,
              DataFactory.namedNode(
                wikimediaCommonsDetectedContentMessage.licenseUri
              )
            )
          );
        }
        if (wikimediaCommonsDetectedContentMessage.rightsHolder) {
          paradicmsDataset.addQuad(
            DataFactory.quad(
              paradicmsSubject,
              dcterms.rightsHolder,
              DataFactory.literal(
                wikimediaCommonsDetectedContentMessage.rightsHolder
              )
            )
          );
        }
        if (wikimediaCommonsDetectedContentMessage.rightsStatementUri) {
          paradicmsDataset.addQuad(
            DataFactory.quad(
              paradicmsSubject,
              dcterms.rights,
              DataFactory.namedNode(
                wikimediaCommonsDetectedContentMessage.rightsStatementUri
              )
            )
          );
        }

        const scrapedContent: ScrapedContent = {
          paradicmsDataset,
        };
        return scrapedContent;
      });
  }

  readonly type = WIKIMEDIA_COMMONS_TRANSLATOR_TYPE;
}
