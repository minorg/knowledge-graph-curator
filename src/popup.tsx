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

const sessionStorage = new SessionStorage();

const Popup: React.FunctionComponent = () => {
  console.debug("popup: rendering");

  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);
  const [scrapedContent, setScrapedContent] = useState<ScrapedContent | null>(
    null
  );
  const refreshScrapedContent = () => {
    sessionStorage
      .getCurrentDetectedContentMessage()
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

        if (detectedContentMessage.type === NO_DETECTED_CONTENT_MESSAGE_TYPE) {
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
  };
  useEffect(() => {
    refreshScrapedContent();
  }, []);

  const scrapedContentString = useMemo(() => {
    if (!scrapedContent) {
      return null;
    }
    return datasetToString(scrapedContent.paradicmsDataset);
  }, [scrapedContent]);

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
    children = (
      <Container fluid>
        <Row>
          <Col className="text-end" xs={12}>
            <div className="me-1 pt-2" style={{cursor: "pointer"}}>
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
            <SyntaxHighlighter language="turtle">
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
