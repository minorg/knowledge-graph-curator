import React, {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import {ScrapedContent} from "~/ScrapedContent";
import {SessionStorage} from "~/SessionStorage";
import {translators} from "~/translators/translators";
import {Alert, Col, Container, Row} from "reactstrap";
import {NO_DETECTED_CONTENT_MESSAGE_TYPE} from "~/NoDetectedContentMessage";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
import "bootswatch/dist/lumen/bootstrap.min.css";
import {datasetToString} from "~/datasetToString";
import {CopyToClipboard} from "react-copy-to-clipboard";
import {faCopy} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Configuration} from "~/Configuration";
import {SyncStorage} from "~/SyncStorage";

const sessionStorage = new SessionStorage();
const syncStorage = new SyncStorage();

const Popup: React.FunctionComponent = () => {
  const [copied, setCopied] = useState<boolean>(false);

  // @ts-ignore
  const [configuration, setConfiguration] = useState<Configuration | null>(
    null
  );
  const [error, setError] = useState<any>(null);
  const [scrapedContent, setScrapedContent] = useState<ScrapedContent | null>(
    null
  );

  const refreshScrapedContent = () => {
    chrome.tabs
      .query({active: true, currentWindow: true})
      .then((currentTabs) => {
        const currentTab = currentTabs[0];
        if (!currentTab.url) {
          console.error("popup: current tab has no URL");
          setError("Current tab has no URL");
          return;
        }

        sessionStorage
          .getDetectedContentMessage(currentTab.url)
          .then((detectedContentMessage) => {
            if (!detectedContentMessage) {
              console.debug("popup: no detected content message");
              setError("No content detected (implicit)");
              return;
            }

            console.debug(
              "popup: detected content message:",
              JSON.stringify(detectedContentMessage)
            );

            if (
              detectedContentMessage.type === NO_DETECTED_CONTENT_MESSAGE_TYPE
            ) {
              setError("No content detected");
              return;
            }

            for (const translator of translators) {
              if (translator.type === detectedContentMessage.type) {
                translator
                  .scrape({detectedContentMessage})
                  .then((scrapedContent) => {
                    console.debug(
                      "popup: successfully scraped detected content ",
                      JSON.stringify(detectedContentMessage)
                    );
                    setScrapedContent(scrapedContent);
                  }, setError);
                return;
              }
            }

            console.error(
              "popup: no translator for detected content message:",
              JSON.stringify(detectedContentMessage)
            );
            setError("No translator for detected content message");
          }, setError);
      }, setError);
  };
  useEffect(() => {
    refreshScrapedContent();
  }, []);

  useEffect(() => {
    syncStorage.getConfiguration().then(setConfiguration, setError);
  }, []);

  const scrapedContentString = useMemo(() => {
    if (!configuration || !scrapedContent) {
      return null;
    }
    return datasetToString(scrapedContent.paradicmsDataset, {
      format: configuration.datasetStringFormat,
    });
  }, [configuration, scrapedContent]);

  if (!configuration) {
    return null;
  }

  let children: React.ReactElement;
  if (error) {
    children = (
      <Alert
        className="rounded-0 text-center"
        color="danger"
        style={{marginBottom: 0, width: "100%"}}
      >
        {error.toString()}
      </Alert>
    );
  } else if (scrapedContent) {
    let syntaxHighlighterLanguage: string;
    switch (configuration.datasetStringFormat) {
      case "markdown-directory-yaml":
        syntaxHighlighterLanguage = "YAML";
        break;
      case "Turtle":
        syntaxHighlighterLanguage = "turtle";
        break;
      default:
        throw new RangeError(configuration.datasetStringFormat);
    }

    children = (
      <Container fluid>
        <Row>
          <Col className="d-flex" xs={12}>
            <div className="ms-2 pt-2">
              <Row className="align-items-center">
                <label className="col-auto">Format</label>
                <div className="col-auto">
                  <select
                    className="form-select"
                    onChange={(ev) => {
                      const newConfiguration: Configuration = {
                        ...configuration,
                        datasetStringFormat: ev.target.value,
                      };
                      console.debug(
                        "popup: changed configuration:",
                        JSON.stringify(newConfiguration)
                      );
                      syncStorage
                        .setConfiguration(newConfiguration)
                        .then(() => setConfiguration(newConfiguration));
                    }}
                    value={configuration.datasetStringFormat}
                  >
                    <option value="markdown-directory-yaml">
                      Markdown directory YAML
                    </option>
                    <option>Turtle</option>
                  </select>
                </div>
              </Row>
            </div>
            <div className="flex-grow-1"></div>
            <div className="me-2 pt-2" style={{cursor: "pointer"}}>
              <CopyToClipboard
                onCopy={() => setCopied(true)}
                text={scrapedContentString!}
              >
                <FontAwesomeIcon icon={faCopy} size="lg" />
              </CopyToClipboard>
              {copied ? (
                <span className="text-success">&nbsp;&nbsp;Copied</span>
              ) : null}
            </div>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <SyntaxHighlighter language={syntaxHighlighterLanguage}>
              {scrapedContentString!}
            </SyntaxHighlighter>
          </Col>
        </Row>
      </Container>
    );
  } else {
    children = (
      <Alert
        className="rounded-0 text-center"
        color="secondary"
        style={{marginBottom: 0, minWidth: "32em"}}
      >
        Loading...
      </Alert>
    );
  }

  return (
    <Container className="px-0" fluid>
      <Row className="px-0">
        <Col className="px-0" xs={12}>
          {children}
        </Col>
      </Row>
    </Container>
  );
};

function load() {
  createRoot(document.getElementById("root")!).render(<Popup />);
}

window.onload = load;
