import {DatasetCore, NamedNode} from "@rdfjs/types";
import {BlankNode, Writer} from "n3";
import {dcterms} from "@tpluscode/rdf-ns-builders";
import TermSet from "@rdfjs/term-set";
import * as yaml from "js-yaml";

const NAMESPACES_BY_PREFIX: {[index: string]: string} = {
  dcterms: dcterms[""].value,
  wd: "http://www.wikidata.org/entity/",
};

const datasetToYamlString = (dataset: DatasetCore): string => {
  if (dataset.size === 0) {
    console.debug("cannot convert empty dataset to YAML");
    return "";
  }

  const subjects = new TermSet<BlankNode | NamedNode>();
  for (const quad of dataset) {
    switch (quad.subject.termType) {
      case "BlankNode":
      case "NamedNode":
        subjects.add(quad.subject as BlankNode | NamedNode);
        break;
    }
  }

  if (subjects.size === 0) {
    throw new RangeError("dataset has no subjects?");
  } else if (subjects.size > 1) {
    throw new RangeError("dataset has more than one subject");
  }

  let yamlObject: {[index: string]: any} = {};
  for (const quad of dataset) {
    let objectString: string;
    switch (quad.object.termType) {
      case "Literal":
        objectString = quad.object.value;
        break;
      case "NamedNode":
        objectString = "<" + quad.object.value + ">";
        break;
      default:
        continue;
    }

    let predicateString: string | undefined;
    for (const namespacePrefix of Object.keys(NAMESPACES_BY_PREFIX)) {
      const namespaceUri: string = NAMESPACES_BY_PREFIX[namespacePrefix];
      if (quad.predicate.value.startsWith(namespaceUri)) {
        predicateString =
          namespacePrefix +
          "_" +
          quad.predicate.value.substring(namespaceUri.length);
        break;
      }
    }
    if (!predicateString) {
      predicateString = quad.predicate.value;
    }

    let existingObjectYaml = yamlObject[predicateString];
    if (!existingObjectYaml) {
      yamlObject[predicateString] = objectString;
    } else if (typeof existingObjectYaml === "string") {
      yamlObject[predicateString] = [existingObjectYaml, objectString];
    } else {
      (existingObjectYaml as string[]).push(objectString);
    }
  }

  return yaml.dump(yamlObject);
};

export const datasetToString = (
  dataset: DatasetCore,
  options?: {format?: string}
): string => {
  if (!options?.format || options.format.toLocaleLowerCase() === "yaml") {
    return datasetToYamlString(dataset);
  }

  const writer = new Writer({format: options.format});
  writer.addPrefixes(NAMESPACES_BY_PREFIX);
  for (const quad of dataset) {
    writer.addQuad(quad);
  }
  let resultString: string;
  writer.end((error, result: string) => (resultString = result));
  return resultString!;
};
