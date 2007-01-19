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

function processPage(meta_doc) {

    // call each metadata extractor
    for (x in metadataExtractorRegistry) {
	// metadataExtractorRegistry[x](meta_doc);
	window.setTimeout(metadataExtractorRegistry[x], 500, meta_doc);
    }

} // processPage

function onLoadContent(event) {
    /*
     * Page Load Event Handler
     *
     * - get page information including URI and lastModified 
     * - query storage to find out if we've seen the page or new lastModified 
     * - construct a IMetaDoc object
     * - iterate through the extractors
     *
     */

    uri = _content.document.documentURI;
    lm = _content.document.lastModified;

    meta_doc = {'uri' : uri,
		'document' : _content.document,
		'lastModified' : lm,
		'changed' : getStorage().needs_update(uri, lm),
		'page_id' : null,
		'seen' : new Array()
    }

    // update the page table if necessary; do this before calling extractors
    // so that calls to page_id will succeed
    if (meta_doc.changed) {

	logMessage("lastModified changed; updating stored information.");

	// update the last modified information
	getStorage().update(uri, lm);

    } // if meta_doc.changed...

    // get the page id to save on future db hits
    meta_doc.page_id = getStorage().page_id(meta_doc.uri);

    // process the page contents
    processPage(meta_doc);

    // update the display window
    onSelectTab(event);

} // onLoadContent

function onSelectTab(event) {

    // logMessage("Tab selection changed." + event);
    updateStatusBar(_content.document.documentURI);

} // onSelectTab
