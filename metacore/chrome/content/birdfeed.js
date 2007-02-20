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

function mozcc_webplaylist_observer() {

    // observer for changes to the webplaylist.current attribute
    this.observe = function(arg1, arg2, current) {

	// see if we're done parsing the web playlist yet...
	if (current == SBDataGetIntValue("webplaylist.total")) {

	    // parse the page for embedded metadata
	    // ************************************

	    // construct the meta_doc object
	    browser  = document.getElementById( "frame_main_pane" );
	    uri = SBDataGetStringValue( "browser.uri" );
	    lm = null;

            meta_doc = make_meta_doc(browser.contentDocument);
	    processPage(meta_doc);

	} // if we're done parsing the web playlist...

    } // this.observer

} // mozcc_webplaylist_observer


function mozcc_initialize() {

    // attach the webplaylist.total observer
    var remote = SB_NewDataRemote("webplaylist.current", null);
    remote.bindObserver(new mozcc_webplaylist_observer(), true);


    // call storage.open so we add our columns right away
    getStorage().open();

} // mozcc_initialize

mozcc_initialize();

