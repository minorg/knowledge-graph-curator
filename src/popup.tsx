import React, {useEffect, useState} from "react";
import {createRoot} from "react-dom/client";
import {ScrapedContent} from "~/ScrapedContent";
import {SessionStorage} from "~/SessionStorage";
import {translators} from "~/translators/translators";
import {Alert, Col, Container, Row} from "reactstrap";
import {NO_DETECTED_CONTENT_MESSAGE_TYPE} from "~/NoDetectedContentMessage";
import "bootswatch/dist/lumen/bootstrap.min.css";

const sessionStorage = new SessionStorage();

const Popup: React.FunctionComponent = () => {
  console.debug("popup: rendering");

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
          setError("No content detected");
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

  if (!error && !scrapedContent) {
    return null;
  }

  let children: React.ReactElement;
  if (error) {
    children = (
      <Alert className="rounded-0 text-center" color="danger" style={{marginBottom: 0; width: "100%"}}>
        {error}
      </Alert>
    );
  } else {
    children = <div>Scraped content</div>;
  }

  return (
    <Container fluid style={{minWidth: "400px"}}>
      <Row className="px-0">
        <Col className="px-0" xs={12}>{children}</Col>
      </Row>
    </Container>
  );
};

function load() {
  createRoot(document.getElementById("root")!).render(<Popup />);
}

window.onload = load;
