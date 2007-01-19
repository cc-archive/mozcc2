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

const RDFA_DICT='RDFa';

function RDFA(base_uri) {

    var ios=Components.classes["@mozilla.org/network/io-service;1"]
                  .getService(Components.interfaces.nsIIOService);
    this.base_uri = ios.newURI(base_uri, null, null);

    this.resolve_uri = function (curie_or_uri) {
       // XXX
       return this.base_uri.resolve(curie_or_uri); //  curie_or_uri;
    } // resolve_uri

    this.resolve_subject = function (node) {

        // check for meta or link which don't traverse up the entire tree
        if (node.nodeName == "link" || node.nodeName == "meta") {
            // look for an about attribute on the node or its parent
            var explicit_parent = "";
            if (node.hasAttribute("about")) {
                explicit_parent = node.getAttribute("about");
            } else if (node.getParent().hasAttribute("about")) {
                explicit_parent = node.getParent().getAttribute("about");
            }

	    if (explicit_parent) return this.resolve_uri(explicit_parent);

	    // XXX we should probably do something different here
	    return "";            
        } // if link or meta

        // traverse up tree looking for an about tag
	var about = document.evaluate( "ancestor-or-self::*/@about",
 		node, null, XPathResult.STRING_TYPE, null);

        if (about.stringValue) {
            return this.resolve_uri(about.stringValue);
        } else {
            return "";
	}

    } // resolve_subject

    this.parse = function(document, sink) {

    	// create a namespace resolver for this document
    	var ns_resolver = meta_doc.document.createNSResolver( document.documentElement );

        // RDFA_ATTRS = ("about", "property", "rel", "rev", "href", "content")
        // PRED_ATTRS = ("rel", "rev", "property")

        // extract triples
	// ---------------

        // using the property
	var prop_nodes = document.evaluate( "//*[@property]", document.documentElement,
		ns_resolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );

	for ( var i=0 ; i < prop_nodes.snapshotLength; i++ ) {
	    var node = prop_nodes.snapshotItem(i);

	    var subject = ( this.resolve_subject( node ) || this.base_uri.resolve("") );
	    var obj = ( node.getAttribute('content') || node.textContent );

	    var prop_list = node.getAttribute('property').split();
	    for ( var j=0; j < prop_list.length; j++ ) {
                sink( subject, this.resolve_uri(prop_list[j]), obj );
	    } // for each property

	} // for each property attribute

	// using rel
	var rel_nodes = document.evaluate( '//*[@rel]', document.documentElement,
		ns_resolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );

	for (var i=0; i < rel_nodes.snapshotLength; i++) {
	    var node = rel_nodes.snapshotItem(i);

	    var subject = ( this.resolve_subject( node ) || this.base_uri.resolve("") );
	    var obj = this.resolve_uri( node.getAttribute('href') );

            var prop_list = node.getAttribute('rel').split();
            for (var j=0; j < prop_list.length; j++) {
	        sink ( subject, this.resolve_uri(prop_list[j]), obj );
	    } // for each rel

	} // for each rel attribute

	    
	// using rev
	var rel_nodes = document.evaluate( '//*[@rev]', document.documentElement,
		ns_resolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );

	for (var i=0; i < rel_nodes.snapshotLength; i++) {
	    var node = rel_nodes.snapshotItem(i);

	    var obj = ( this.resolve_subject( node ) || this.base_uri.resolve("") );
	    var subject = this.resolve_uri( node.getAttribute('href') );

            var prop_list = node.getAttribute('rev').split();
            for (var j=0; j < prop_list.length; j++) {
	        sink ( subject, this.resolve_uri(prop_list[j]), obj );
	    } // for each rel

	} // for each rel attribute

    } // parse

} // RDFA


function rdfa_dict_extractor(meta_doc) {

	function triple_sink (s, p, o) {

	   var triple = new Triple(s, p, o);

	   logMessage(s + " -> " + p + " -> " + o);

	   getStorage().assert(meta_doc.page_id, triple, RDFA_DICT);

	} // triple_sink

    // short circuit -- if the page hasn't changed, the comments haven't either
    if (!meta_doc.changed) return;

    // flush the current rdf for this page + provider
    getStorage().flush_assertions(meta_doc.page_id, RDFA_DICT);

    // create the RDFa parser
    var parser = new RDFA(meta_doc.uri);

    // parse the document 
    parser.parse(meta_doc.document, triple_sink);

    logMessage('rdfa completed');
} // rdfa_extractor
