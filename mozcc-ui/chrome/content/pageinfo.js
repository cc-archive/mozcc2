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

/* ************************************************************************
 *
 * Shamelessly cribbed from the Mozilla source tree:
 *
 * http://lxr.mozilla.org/mozilla1.8/source/extensions/
 *        p3p/resources/content/pageInfoOverlay.js
 *
 */

var gTopWin = null;
var gTopDoc = null;
var gIOService = null;

function initTopDocAndWin()
{
   if ("arguments" in window && window.arguments.length > 0 && 
       window.arguments[0] && window.arguments[0].doc)
   {
     gTopWin = null;
     gTopDoc = window.arguments[0].doc;
   }
   else 
   {
     if ("gBrowser" in window.opener)
       gTopWin = window.opener.gBrowser.contentWindow;
     else
       gTopWin = window.opener.frames[0];
     gTopDoc = gTopWin.document;
   }
}

function addRow(aRootID, row_cells) {
   const kXULNS = 
     "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
   var root = document.getElementById(aRootID);
   var item = document.createElementNS(kXULNS, "treeitem");
   root.appendChild(item);
   var row = document.createElementNS(kXULNS, "treerow");
   item.appendChild(row);

   for each (var c in row_cells) {

	   var cell = document.createElementNS(kXULNS, "treecell");
	   cell.setAttribute("label", c);
	   row.appendChild(cell);
       }

   return row;

} // addRow

/*
 * End shameless cribbing.
 *
 * *************************************************************************/

function addContainerRow(aRootId, cell_contents) {

    // aRootId should be the element id of a treechildren element
   const kXULNS = 
     "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

   // get a handle to the root treechildren element
   var root = document.getElementById(aRootId);

   // create the tree item and set the container property
   var item = document.createElementNS(kXULNS, "treeitem");
   item.setAttribute("container", "true");
   item.setAttribute("expanded", "true");
   root.appendChild(item);

   // add the row cells
   var row = document.createElementNS(kXULNS, "treerow");
   item.appendChild(row);

   var cell = document.createElementNS(kXULNS, "treecell");
   cell.setAttribute("label", cell_contents);
   row.appendChild(cell);

   // add a treechildren element
   var treechildren = document.createElementNS(kXULNS, "treechildren");
   item.appendChild(treechildren);

   // return the treechildren element
   return treechildren;

} // addContainerRow

function addChildRow(containerNode, row_cells) {

   const kXULNS = 
     "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

   var item = document.createElementNS(kXULNS, "treeitem");
   containerNode.appendChild(item);

   var row = document.createElementNS(kXULNS, "treerow");
   item.appendChild(row);

   for each (var c in row_cells) {

	   // create the empty left-hand cell
	   var cell = document.createElementNS(kXULNS, "treecell");
	   cell.setAttribute("label", "");
	   row.appendChild(cell);

	   var cell = document.createElementNS(kXULNS, "treecell");
	   cell.setAttribute("label", c);
	   row.appendChild(cell);
       }

} // addRow

function on_dbl_click_item(event) {
    var tree = document.getElementById("mozcc-tree");

    // make sure we're on a predicate row
    if (tree.view.getLevel(tree.currentIndex) != 1) return;

    // get the cell text
    var uri = tree.view.getCellText(tree.currentIndex,
				    tree.columns.getColumnAt(0));

    // open the new window
    // alert(uri);

} // on_dbl_click_item

function MozccLoadFunc() {

    // initialize window-global variables
    initTopDocAndWin();
    var doc_uri = gTopDoc.documentURI;

    // populate the appropriate labels on this page
    window.document.getElementById('mozcc-page-uri').value = doc_uri;

    // add rows for metadata, grouped by predicate
    var meta_rows = getStorage().query_by_subject(doc_uri);

    var last = "XXX";
    for each (var meta in meta_rows) {
	    // see if we need to repeat the predicate
	    if (meta[0] == last) {
		meta[0] = "";
	    } // if the first column is repeated
	    else { last=meta[0];}

	    addRow("mozcc-tree-children", meta);
	} // for each metadata row

} // MozccLoadFunc


// register our loader
onLoadRegistry.push(MozccLoadFunc);