/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is MozCC 2.
 *
 * The Initial Developer of the Original Code is
 * Nathan R. Yergler, Creative Commons.
 * Portions created by the Initial Developer are Copyright (C) 2006
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Nathan R. Yergler <nathan@creativecommons.org>
 *
 * ***** END LICENSE BLOCK ***** */

const RDFCOMMENT = "rdfcomment";

function extractRdf(inputstr, curr_doc_uri, results) {

    // check for embedded RDF
    var rdf_regex = /<rdf:rdf[\w\W]*?<\/rdf:rdf>/i;

    var match = inputstr.match(rdf_regex);

    // extract any embedded RDF
    while (match != null) {

	// create a new parser and process the match
	var index = results.push(new ccRdf()) - 1;
        results[index].parse(match, curr_doc_uri);

	// shorten the input string
        inputstr = inputstr.substr(inputstr.search(rdf_regex) + 
				   match[0].length, inputstr.length);
	match = inputstr.match(rdf_regex);

    } // while match is not null

} // extractRdf

function extractRdfDoc(curr_doc, curr_doc_uri, results) {

    var inputstr = "";

    // serialize the document so we can scan for RDF
    var serializer = new XMLSerializer();
    inputstr = serializer.serializeToString(curr_doc.documentElement);

    return extractRdf(inputstr, curr_doc_uri, results);

} // extractRdfDoc

function rdfcomment(meta_doc) {

    // short circuit -- if the page hasn't changed, the comments haven't either
    if (!meta_doc.changed) return;

    // flush the current rdf for this page + provider
    getStorage().flush_assertions(meta_doc.page_id, RDFCOMMENT);

    // extract RDF
    var results = new Array();
    extractRdfDoc(meta_doc.document, meta_doc.uri, results);

    // start the database transaction
    // getStorage().start_transaction();

    // add each triple to our stored data set
    for each (var block in results) {
	    for each (var t in block.triples()) {
		    getStorage().assert(meta_doc.page_id, t, RDFCOMMENT);
		    logMessage(t);
		} // for each triple...

	} // for each RDF block extracted

    // commit the transaction
    // getStorage().commit();

    logMessage('rdfcomment completed.');
    onSelectTab(null);

} // commentRdf
