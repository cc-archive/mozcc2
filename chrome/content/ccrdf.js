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
 * The Original Code is mozCC/ccRdf
 *
 * The Initial Developer of the Original Code is
 * Nathan R. Yergler.
 * Portions created by the Initial Developer are Copyright (C) 2004-2006
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 * Nathan R. Yergler <nathan@creativecommons.org>
 *
 * ***** END LICENSE BLOCK ***** */

/* ccrdf.js
 * Creative Commons RDF parsing/manipulation support
 *
 * $Id: ccrdf.js,v 1.5 2004/11/08 17:12:02 nathan Exp $
 */

RDF = Components.classes['@mozilla.org/rdf/rdf-service;1'].
      getService(Components.interfaces.nsIRDFService);

function Triple(subject, predicate, object) {

    this.subject = subject;
    this.predicate = predicate;
    this.object = object;

    this.toString = toString;

    function toString() {
	return this.subject.Value + " -> " + 
	    this.predicate.Value + " -> " + 
	    this.object.Value;
    } // toString

}// Triple


/* rdfDict
 *  Provides a dictionary-like wrapper around a set of RDF triples with a
 *  common subject.  In addition to the standard dictionary interface
 *  provides convenience methods for manipulating the triples.
 **/
function rdfDict(subject, datasource) {

  this.subject = subject
  this.store = datasource

  // method definitions
  this.asString = asString
  this.about    = about
  this.__getvalues = __getvalues
  this.keys = keys
  this.getFirst = getFirst
  this.getAll = getAll
  this.length = length
  this.contains = contains
  this.serialize = serialize

  function asString() {
  } // asString

  function about() {
    return this.subject.Value
  } // about

  function serialize() {
     var outputStream = {
       data: "",
       close : function(){},
       flush : function(){},
       write : function (buffer,count){
         this.data += buffer;
         return count;
       },
       writeFrom : function (stream,count){},
       isNonBlocking: false
     }

     var atomic=Components.classes["@mozilla.org/atom-service;1"]
                  .createInstance(Components.interfaces.nsIAtomService);
     var serializer=Components.classes["@mozilla.org/rdf/xml-serializer;1"]
                  .createInstance(Components.interfaces.nsIRDFXMLSerializer);

     // add namespaces
     serializer.addNameSpace(atomic.getAtom("cc"), 
                             "http://web.resource.org/cc/");
     serializer.addNameSpace(atomic.getAtom("dc"), 
                             "http://purl.org/dc/elements/1.1/");

     serializer.init(this.store);
     serializer.QueryInterface(Components.interfaces.nsIRDFXMLSource);
     serializer.Serialize(outputStream);

     return outputStream.data;
  } // serialize

  function __getvalues(key) {

    values = new Array();

    objects = this.store.GetTargets(this.subject, RDF.GetResource(key), true);
    while (objects.hasMoreElements()) {
      current = objects.getNext();

      if (current instanceof Components.interfaces.nsIRDFResource) {
         values.push(current);
      } else
      if (current instanceof Components.interfaces.nsIRDFLiteral) {
         values.push(current);
      }

    } // while more elements

    return values;
  } // __getvalues

  function keys() {
    keys = new Array();

    resources = this.store.ArcLabelsOut(this.subject);
    while (resources.hasMoreElements()) {
      current = resources.getNext();

      if (current instanceof Components.interfaces.nsIRDFResource) {
         keys.push(current);
      } else { alert ('What the hell? Peggy?'); }

    } // while more keys

    return keys;

  } // keys

  function getFirst(key) {
    return this.__getvalues(key)[0];
  } // getFirst

  function getAll(key) {
    return this.__getvalues(key);
  } // getAll

  function length() {
    // return the number of keys/predicates
    return (this.keys().length);
  } // length

  function contains(key) {
    return (this.__getvalues(key).length > 0);
  } // contains

} // rdfDict

function ccLicense (subject, datasource) {
  this.subject = subject
  this.store   = datasource

  // method definitions
  this.isPublicDomain = isPD;
  this.isSampling = isSampling;
  this.isSamplingPlus = isSamplingPlus;
  this.isGPL = isGPL;
  this.isLGPL = isLGPL;
  this.isDevNations = isDevNations;
  this.asString = asString;
  this.appliesTo = appliesTo;

  // override asString to output this license's RDF
  function asString() {
    // serialize the source RDF fragment
    var lic_text = "";
    lic_text = this.serialize();

    // return lic_text;

    // now extract the relevant portion
    restr = "<cc:License about=\"" + this.about() + "\" [\\w\\W\\r\\n]*?</cc:License>";
    restr = "<cc:License [\\w\\W\\r\\n]*?</cc:License>";
    lic_regex = new RegExp(restr, "i");
    matches = lic_regex.exec(new String(lic_text));

    if (matches != null) {
      return matches[0];
    } // if a match was found

    return "(no source available)";

  } // asString

  function isPD() {
    return (this.subject.Value == 'http://web.resource.org/cc/PublicDomain');
  } // isPD

  function isSampling() {
    return (this.subject.Value == 'http://creativecommons.org/licenses/sampling/1.0/');
  } // isSampling

  function isSamplingPlus() {
    return (this.subject.Value == 'http://creativecommons.org/licenses/sampling+/1.0/');
  } // isSamplingPlus

  function isGPL() {
    return (this.subject.Value == 'http://creativecommons.org/licenses/GPL/2.0/');
  } // isGPL

  function isLGPL() {
    return (this.subject.Value == 'http://creativecommons.org/licenses/LGPL/2.1/');
  } // isLGPL

  function isDevNations() {
    return (this.subject.Value == 'http://creativecommons.org/licenses/devnations/2.0/');
  } // isDevNations

  function appliesTo() {
    // returns a list of Works which this license applies to
    works = new Array();

    // make sure the source contains data
    if (this.store == null) {
       return works;
    } 

    // get a list of works defined in this datastore    
    source_works = this.store.GetSources(
         RDF.GetResource('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
         RDF.GetResource('http://web.resource.org/cc/Work'), true);

    // while there are more works to look at
    while (source_works.hasMoreElements()) {
      curr_work = source_works.getNext();
      curr_work.QueryInterface(Components.interfaces.nsIRDFResource);

      // get a list of the licenses this work uses
      work_licenses = this.store.GetTargets(curr_work,
         RDF.GetResource('http://web.resource.org/cc/license'), true);

      // check each license and see if it's "me"
      while (work_licenses.hasMoreElements()) {
        curr_work_lic = work_licenses.getNext();
        curr_work_lic.QueryInterface(Components.interfaces.nsIRDFResource);

        if (curr_work_lic == this.subject) {
           // this work declares our license; add it to the list
           works.push(new ccWork(curr_work, this.store));
        } // if the current work's licenses matches "me"
        
      } // while there are more licenses

    } // while there are more works
    return works;

  } // applies to

} // ccLicense
ccLicense.prototype = new rdfDict;

function ccWork (subject, datasource) {

  this.subject = subject
  this.store = datasource

  // method definitions
  this.licenses = licenses
  this.asString = asString

  function licenses() {
    licenses = new Array();

    // make sure the source contains data
    if (this.store == null) {
       return licenses;
    } // if store is null
    
    source_licenses = this.store.GetTargets(
         this.subject,
         RDF.GetResource('http://web.resource.org/cc/license'), true);

    while (source_licenses.hasMoreElements()) {
      curr_license = source_licenses.getNext();
      curr_license.QueryInterface(Components.interfaces.nsIRDFResource);

      licenses.push(new ccLicense(curr_license, this.store));
    } // while has more elements

    return licenses;

  } // licenses

  // override asString to output this work's RDF
  function asString() {
    // serialize the source RDF fragment
    var lic_text = "";
    lic_text = this.serialize();

    // return lic_text;

    // now extract the relevant portion
    restr = "<cc:Work about=\"" + this.about() + "\" [\\w\\W\\r\\n]*?</cc:Work>";
    restr = "<cc:Work [\\w\\W\\r\\n]*?</cc:Work>";
    lic_regex = new RegExp(restr, "i");
    matches = lic_regex.exec(new String(lic_text));

    if (matches != null) {
      return matches[0];
    } // if a match was found

    return "(no source available)";

  } // asString

} // ccWork
ccWork.prototype = new rdfDict;

function ccRdf() {

  // internal members
  this.store = null;
  this.uri = null
  this.rdf = null;
  this.flag = 0;
  
  // method definitions
  this.parse    = parse;
  this.output   = output;

  // CC-specific helper methods
  this.works    = works;
  this.licenses = licenses;

  // RDF-traversal helper methods
  this.subjects = subjects;
  this.predicates=predicates;
  this.objects  = objects;
  this.triples  = triples;


  function subjects() {
      // generator which yields all available resources in the datastore
      // objects yielded are instances of nsIRDFResource
      var resources = this.store.GetAllResources();
      var current = -1;

      while(resources.hasMoreElements()) {
	  current = resources.getNext();
	  current.QueryInterface(Components.interfaces.nsIRDFResource);

	  yield current;
      }

  } // subjects

  function predicates(subject) {
      // generator which yields all arc-labels out from a specified subject
      // objects yielded are instances of nsIRDFResource
      // subject should be an instance of nsIRDFResource

      var arcs = this.store.ArcLabelsOut(subject);
      var current = -1;

      while(arcs.hasMoreElements()) {
	  current = arcs.getNext();
	  current.QueryInterface(Components.interfaces.nsIRDFResource);

	  yield current;
      }

  } // predicates

  function objects(subject, arclabel) {
      // generator which yields all targets for the subjet/arclabel combination
      // objects yielded are instances of nsIRDF[Resource|Literal]
      // subject and arclabel are instances of nsIRDFResource

      var objects = this.store.GetTargets(subject, arclabel, true);
      var current = -1;

      while (objects.hasMoreElements()) {
	  current = objects.getNext();

	  if (current instanceof Components.interfaces.nsIRDFResource) {
	      current.QueryInterface(Components.interfaces.nsIRDFResource);
	  } else
	      if (current instanceof Components.interfaces.nsIRDFLiteral) {
		  current.QueryInterface(Components.interfaces.nsIRDFLiteral);
	      } else {
		  continue;
	      }

	  yield current;

      } // while more elements

  } // objects

  function triples() {
      // generator which yields all triples known; yielded values are returned
      // as 3-element array [subject, predicate, object]

      for each (var s in this.subjects()) {
	      for each (var p in this.predicates(s)) {
		      for each (var o in this.objects(s, p)) {
			      
			      var t = new Triple(s,p,o);
			      yield t;

			  } // for each object
		  } //for each predicate
	  } // for each subject

  } // triples

  function parse(rdfString, uri) {

    this.uri = uri || "http://mozcc.yergler.net/#"
    this.rdf = rdfString;

    // see if we need to create a new datastore
    if (this.store == null) {

	logMessage("ccrdf: instantiating datasource");

	var xml = '@mozilla.org/rdf/datasource;1?name=in-memory-datasource';
	this.store = Components.classes[xml].
             createInstance(Components.interfaces.nsIRDFDataSource);

    } // if this.store is null...

    // Used to create a URI below
    var ios = Components.classes["@mozilla.org/network/io-service;1"].
      getService(Components.interfaces.nsIIOService);
    var xmlParser = '@mozilla.org/rdf/xml-parser;1';
    var parser = Components.classes[xmlParser].
         createInstance(Components.interfaces.nsIRDFXMLParser);

    uri = ios.newURI(this.uri, null, null);

    // Entire RDF File stored in a string
    parser.parseString(this.store, uri, rdfString);

  } // parse

  function output() {
  } // output

  function works() {

    works = new Array();

    // make sure the source contains data
    if (this.store == null) {
       return works;
    } // if store is null
    
    source_works = this.store.GetSources(
         RDF.GetResource('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
         RDF.GetResource('http://web.resource.org/cc/Work'), true);

    while (source_works.hasMoreElements()) {
      curr_work = source_works.getNext();
      curr_work.QueryInterface(Components.interfaces.nsIRDFResource);

      works.push(new ccWork(curr_work, this.store));
    } // while has more elements

    return works;

  } // works
  
  function licenses() {

    licenses = new Array();

    // make sure the source contains data
    if (this.store == null) {
       return licenses;
    } // if store is null
    
    source_licenses = this.store.GetSources(
         RDF.GetResource('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
         RDF.GetResource('http://web.resource.org/cc/License'), true);

    while (source_licenses.hasMoreElements()) {
      curr_license = source_licenses.getNext();
      curr_license.QueryInterface(Components.interfaces.nsIRDFResource);

      licenses.push(new ccLicense(curr_license, this.store));
    } // while has more elements

    return licenses;

  } // licenses

} // ccRdf
