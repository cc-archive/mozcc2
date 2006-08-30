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

const RDFA_EXTRACTOR='RDFa';

// declare the RDFA object as a browser-level object
var RDFA = new Object();

RDFA.CALLBACK_DONE_LOADING = function() {

    // rdfa.js has finished loading; register the extractor
    metadataExtractorRegistry[RDFA_EXTRACTOR] = rdfa_extractor;

} // CALLBACK_DONE_PARSING

RDFA.CALLBACK_DONE_PARSING = function() {

} // CALLBACK_DONE_PARSING

function rdfa_extractor(meta_doc) {

    // short circuit -- if the page hasn't changed, the comments haven't either
    if (!meta_doc.changed) return;

    // flush the current rdf for this page + provider
    getStorage().flush_assertions(meta_doc.page_id, RDFA_EXTRACTOR);

    // set up the post-parse handler
    RDFA.reset();
    RDFA.CALLBACK_DONE_PARSING = function() {

	// iterate over our nested array
	for (s in RDFA.triples) {
	    for (p in RDFA.triples[s]) {
		for each (var triple in RDFA.triples[s][p]) {
			if (triple.subject != null) {
			    if (!triple.subject) triple.subject = meta_doc.uri;

			    logMessage(triple.pretty());

			    getStorage().assert(meta_doc.page_id, 
						triple,
						RDFA_EXTRACTOR);

			} // if this is a triple...

		} // for each triple
	    } // for each predicate
	} // for each subject

    } // CALLBACK_DONE_PARSING

    // call the RDFA parser
    RDFA.parse(meta_doc.document);

    logMessage('rdfa completed');
} // rdfa_extractor
