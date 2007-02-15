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
 * Portions created by the Initial Developer are Copyright (C) 2006 - 2007
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Nathan R. Yergler <nathan@creativecommons.org>
 *
 * ***** END LICENSE BLOCK ***** */


/*  metadataExtractorRegistry
 *  -------------------------
 *  Add a metadata extractor by calling:
 * 
 *      metadataExtractorRegistry.push(My_Extract);
 * 
 *  My_Extract should be a callable which takes a single parameter,
 *  an object which implements IMetaDoc.
 * 
 */
var metadataExtractorRegistry = [ ];

function make_meta_doc(a_document) {
   // Take a Document object and return a meta_doc instance.

   meta_doc = {'uri' : a_document.documentURI,
               'document' : a_document,
               'lastModified' : a_document.lastModified,
               'changed' : getStorage().needs_update(a_document.documentURI,
                                                     a_document.lastModified),
               'page_id' : null,
               'seen' : new Array()
              }

   return meta_doc;

} // make_meta_doc

function processPage(meta_doc) {

    // call each metadata extractor
    for (x in metadataExtractorRegistry) {
	metadataExtractorRegistry[x](meta_doc);
	// window.setTimeout(metadataExtractorRegistry[x], 500, meta_doc);
    }

} // processPage

function processUri(uri) {
    // retrieve the specified URI and scan it for rdf-in-a-commnent
    // XXX this should eventually be a generalized entry point to all parsers

    logMessage("Retrieving additional metadata from " + uri);

    // retrieve the remote URI
    var req = new XMLHttpRequest();

    req.open('GET', uri, true);
    req.remote_uri = uri;

    // attach the handler and go...
    req.onload = function(event) {

	// ******************************************************
	// ** 
	// **  onLoad Handler
	// **

	// extract RDF from the returned document
	var results = new Array();

	var lastModified = event.target.getResponseHeader("Last-Modified");

	if (lastModified == null) {
	    // lastModified not provided; 
	    // use a hash of the response text instead
	    var obj = Components.classes[
			    "@mozilla.org/io/string-input-stream;1"].
			createInstance(
		           Components.interfaces.nsIStringInputStream);

	    obj.setData(event.target.responseText, -1);
	    var hashFactory = Components.classes[
			      "@mozilla.org/security/hash;1"].
		createInstance(Components.interfaces.nsICryptoHash);

	    // use the SHA1 hash
	    hashFactory.initWithString("SHA1");
	    hashFactory.updateFromStream(obj, -1);

	    lastModified = hashFactory.finish(true);
	    logMessage("using hash instead of lastModified: " + lastModified);
	} // if lastModified not provided

	var remote_uri = event.target.remote_uri;
	var remote_pageid = -1;

	// check our record last-modified information if the server
	// provided a last-modified header for the request
	if (!getStorage().needs_update(remote_uri, lastModified)) {

		 // no update needed
		 return;

	} else {
	    // make sure we're in the pages table
	    getStorage().update(remote_uri, lastModified);

	    // get the page id for the remote data source
	    remote_pageid = getStorage().page_id(remote_uri);

	    // flush the current rdf for this page + provider
	    getStorage().flush_assertions(remote_pageid, RDFCOMMENT);

	} // if needs updated


	extractRdf(event.target.responseText, 
		   event.target.remote_uri, results);

	for each (var block in results) {
		for each (var t in block.triples()) {
			getStorage().assert(remote_pageid, t, RDFCOMMENT);
			// logMessage(remote_pageid + " " + t);
		    } // for each triple...

	    } // for each RDF block extracted
		 
	// make another call to the tab selector to pick up any changes
	onSelectTab(null);

    } // onload handler

    req.send(null);

} // processUri


function onShowPage(event) {
    /*
     * Page Load Event Handler
     *
     * - get page information including URI and lastModified 
     * - query storage to find out if we've seen the page or new lastModified 
     * - construct a IMetaDoc object
     * - iterate through the extractors
     *
     */

    // make sure we're dealing with an HTML document
    if ( (!(event.originalTarget instanceof HTMLDocument)) ||
         (event.originalTarget != content.document) ) return;

    // see if we're loading from the cache
    if (!event.persisted) {
        // not loading from the cache
        var meta_doc = make_meta_doc(_content.document);

        // update the page table if necessary; 
        // do this before calling extractors
        // so that calls to page_id will succeed
        if (meta_doc.changed) {

	    logMessage("lastModified changed; updating stored information.");

	    // update the last modified information
	    getStorage().update(meta_doc.uri, meta_doc.lastModified);

        } // if meta_doc.changed...

        // get the page id to save on future db hits
        meta_doc.page_id = getStorage().page_id(meta_doc.uri);

        // process the page contents
        processPage(meta_doc);

    } // if not loading from cache...

    // update the display window
    onSelectTab(event);

} // onShowPage
var onLoadContent = onShowPage;

function onSelectTab(event) {

    var uri = _mozcc_get_document().documentURI;

    if (uri) updateStatusBar(uri);

} // onSelectTab
