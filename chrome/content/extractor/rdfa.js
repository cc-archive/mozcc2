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


function rdfa(meta_doc) {


    logMessage("in rdfa...");

    rdfa = new RDFA();
    rdfa.parse(meta_doc.document.documentElement);
    alert('foo');
    var cc = new RDFA.Namespace('cc', 'http://web.resource.org/cc/');
    var cc_license = new RDFA.CURIE(cc, 'license');

    triples = rdfa.getTriples('', cc_license);

    if (triples)
	alert(triples[0].object);


    // alert('in commentRdf', meta_doc);

} // commentRdf
