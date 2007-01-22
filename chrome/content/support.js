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

var gBrowser = null;

function getBrowser() {
    if (!gBrowser)
	gBrowser = document.getElementById("content");

    return gBrowser;

} // getBrowser

function logError(msg) {

    // log a message to the Javascript console with severity = error
    Components.utils.reportError("MetaFox: " + msg);

} // logError

function logMessage(msg) {

    // log a message to the Javascript console with normal severity
    var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                          .getService(Components.interfaces.nsIConsoleService);
    consoleService.logStringMessage("MozCC: " + msg);

} // logMessage

function showMetaFoxWindow() {

    openDialog("chrome://metafox/content/details.xul",
	       "mf_details",
	       "chrome,modal=no,dialog=no,resizable,titlebar,centerscreen",
	       getStorage(), _content.document.documentURI );

    alert(getStorage().db_version());

    /*
  // find out if we have any licenses
  if (window.mozCCcache.parsed[aDocument.URL].length == 0) {
     alert('No Creative Commons license available.');
  } else {
  // open a dialog displaying current license information
  openDialog("chrome://mozcc/content/license.xul", "Creative Commons License",
             "chrome,modal=no,dialog=no,resizable,titlebar,centerscreen", 
	     aDocument,window.mozCCcache.parsed[aDocument.URL]);

  }

  return true;
    */
} // showMetaFoxWindow

  function makeAbsolute(base_uri, link_href) {

      // this is an RDF link; parse it
      if (link_href.indexOf('http://') == 0) {
         // absolute link with protocol; no massaging necessary
         return link_href;
      } else 
      if (link_href.charAt(0) == '/') {
         // absolute link; add the server
	var abs_parts = base_uri.split('/');

	// drop off everything after the server
	while (abs_parts.length > 3) {
	   abs_parts.pop();
	} // while more than the server

        // push the absolute link (without the initial '/')
	abs_parts.push(link_href.substring(1));

	return abs_parts.join('/');
      } else {
         // relative link
         var abs_parts = base_uri.split('/');

         // assemble the new link
         abs_parts.pop()
         abs_parts.push(link_href);

         return abs_parts.join('/');

      } // relative link

      // fall-through case (although we shouldn't be able to get here)
      return link_href;

  } // makeAbsolute
