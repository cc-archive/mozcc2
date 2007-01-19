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

function open_license(event) {
    // open the license when the URI is clicked

    uri = event.target.getElementById('mozcc-license-uri').value;
    alert(uri);

} // open_license

function last_url_segment(element) {

    var url_segments = element[0].split("/");
    url_segments.reverse();

    return url_segments[0].toLowerCase();

} // last_url_segment

function clearStatusBar() {

    var panel = document.getElementById('mozcc-attrib-icons');

    while(panel.hasChildNodes()) {
	panel.removeChild(panel.firstChild);
    }

} // clearStatusBar

function addIcon(filename) {
    // add the icon to the status bar

    var icon = document.createElement('image');
    icon.setAttribute("src", "chrome://mozcc/content/icons/" + filename);

    document.getElementById('mozcc-attrib-icons').appendChild(icon);
} // addIcon

function updateStatusBar(page_uri) {

    // update the status bar with current licensing information
    clearStatusBar();

    // look up the license for this page, if available
    license_data = getStorage().query(page_uri,
				      "http://web.resource.org/cc/license");

    // if we retrieved license information, set the tooltip and enable the icon
    if (license_data.length > 0) {
	document.getElementById("mozcc-info").hidden = false;

	// get the license URI itself
	// XXX we should really handle ambiguous results here (n > 1)
	license_uri = license_data[0][0];

	// show the license URI
	document.getElementById("mozcc-license-uri").value = license_uri;
	

	// add the status bar images
	// ***************************************************************
	var requires = getStorage().query(license_uri,
					  'http://web.resource.org/cc/requires').map(last_url_segment);

	var prohibits = getStorage().query(license_uri,
					'http://web.resource.org/cc/prohibits').
	    map(last_url_segment);
	var permits = getStorage().query(license_uri,
					'http://web.resource.org/cc/permits').
	    map(last_url_segment);

	// attribution
	if ( (requires.indexOf('notice') > -1) ||
	     (requires.indexOf('attribution') > -1) ) {

	    addIcon('attrib');
	}

	// non-commercial
	if (prohibits.indexOf('commercialuse') > -1) {

	    addIcon('noncomm');
	}

	// no-derivatives
	if ((permits.length > 0) && (permits.indexOf('derivativeworks') == -1)) {
	    addIcon('nomod');
	}

	// share-alike
	if (requires.indexOf('sharealike') > -1) {
	    addIcon('share');
	}

    } else {
	document.getElementById("mozcc-info").hidden = true;
	license_uri = '';
    }


} // updateStatusBar
