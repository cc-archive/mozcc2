/**
 *	RDF/A in Javascript
 *	Ben Adida - ben@mit.edu
 *  Nathan Yergler - nathan@creativecommons.org
 *
 *	licensed under GPL v2
 */

//
// A better associative array
//
Array.prototype.add = function(name,value) {
    this.push(value);
    this[name] = value;

    // keep a list of names
    if (!this.names) {
        this.names = new Array();
    }

    this.names.push(name);
};

// a shallow copy of an array (only the named items)
Array.prototype.copy = function() {
    var the_copy = new Array();

    if (this.names) {
        // loop and copy
        for (var i=0; i < this.names.length; i++) {
            the_copy.add(this.names[i],this[this.names[i]]);
        }
    }

    return the_copy;
};

// setup the basic
function RDFA() {

    // CONFIGURATION
    this.base_url = 'http://www.w3.org/2001/sw/BestPractices/HTML/rdfa-bookmarklet/2006-05-22/rdfa.js';


    // internal data structures
    this.triples = new Array();
    this.bnode_counter = 0;
    

    //
    // dummy callbacks in case they're not defined
    //
    if (!this.CALLBACK_NEW_TRIPLE_WITH_URI_OBJECT)
	this.CALLBACK_NEW_TRIPLE_WITH_URI_OBJECT = function(foo,bar) {};

    if (!this.CALLBACK_NEW_TRIPLE_WITH_LITERAL_OBJECT)
	this.CALLBACK_NEW_TRIPLE_WITH_LITERAL_OBJECT = function(foo,bar) {};

    if (!this.CALLBACK_NEW_TRIPLE_WITH_SUBJECT)
	this.CALLBACK_NEW_TRIPLE_WITH_SUBJECT = function(foo,bar) {};

    //
    //
    //

    // XML Namespace abstraction
    this.Namespace = function(prefix, uri) {
	this.prefix = prefix;
	this.uri = uri;

	this.equals = function(other) {
	    return (this.uri == other.uri);
	} // equals

    }; // Namespace


    // RDF/A CURIE abstraction
    this.CURIE = function(ns,suffix) {
	this.ns = ns;
	this.suffix = suffix;


	this.pretty = function() {
	    return (this.ns? this.ns.prefix:'?') + ':' + this.suffix;
	}; // pretty

	this.uri = function() {
	    return (this.ns? this.ns.uri + this.suffix:'');
	}; // uri

	this.equals = function() {
	    return (this.ns.equals(other.ns) && (this.suffix == other.suffix));
	}; // equals


	this.parse = function(str, namespaces) {
	    var position = str.indexOf(':');

	    // this will work even if prefix == -1
	    var prefix = str.substring(0,position);
	    var suffix = str.substring(position+1);

	    var curie = new this.CURIE(namespaces[prefix],suffix);
	    return curie;
	};

	this.prettyCURIEorURI = function(str) {
	    if (str[0] == '[')
		return str.substring(1,str.length - 1);
	    else
		return '<' + str + '>';
	}

	this.prettyCURIEorURIinHTML = function(str) {
	    if (str[0] == '[')
		return str.substring(1,str.length - 1);
	    else
		return '&lt;' + str + '&gt;';
	}

    }; // CURIE

// RDF Triple abstraction
this.Triple = function() {
    this.subject = '';
    this.predicate = '';
    this.object = '';
    this.object_literal_p = null;


    this.setLiteral = function(is_literal) {
	this.object_literal_p = is_literal;
    } // setLiteral


    this.pretty = function() {

	// subject
	var pretty_string = this.CURIE.prettyCURIEorURI(this.subject) + ' ';
    
	// predicate
	pretty_string += this.predicate.pretty() + ' ';
    
	if (this.object_literal_p) {
	    pretty_string+= '"'+ this.object + '"';
	} else {
	    pretty_string+= this.CURIE.prettyCURIEorURI(this.object);
	}

	return pretty_string;
    };

    this.prettyhtml = function() {
	var pretty_subject = this.subject;

	var pretty_string= this.CURIE.prettyCURIEorURIinHTML(this.subject) + ' <a href="' + this.predicate.uri() + '">' + this.predicate.pretty() + '</a> ';

	if (this.object_literal_p) {
	    pretty_string+= '"'+ this.object + '"';
	} else {
	    pretty_string+= this.CURIE.prettyCURIEorURIinHTML(this.object);
	}

	return pretty_string;
    };

}; // Triple


//
// This would be done by editing Node.prototype if all browsers supported it... (-Ben)
//
this.getNodeAttributeValue = function(element, attr) {
    if (!element)
        return null;

    if (element.getAttribute) {
        if (element.getAttribute(attr))
            return(element.getAttribute(attr));
    }

    if (!element.attributes)
        return null;

	if (!element.attributes[attr])
		return null;

	return element.attributes[attr].value;
};

this.setNodeAttributeValue = function(element, attr, value) {
    if (!element)
        return;

    if (element.setAttribute) {
        element.setAttribute(attr,value);
        return;
    }

    if (!element.attributes)
        element.attributes = new Object();

    element.attributes[attr] = new Object();
    element.attributes[attr].value = value;
};

//
// Support for loading other files
//

this.GRDDL = new Object();

this.GRDDL.CALLBACKS = new Array();

this.GRDDL.DONE_LOADING = function(url) {
    this.GRDDL.CALLBACKS[url]();
};

this.GRDDL.load = function(url, callback)
{
    var s = document.createElement("script");
    s.type = 'text/javascript';
    s.src = url;

    // set up the callback
    this.GRDDL.CALLBACKS[url] = callback;

    // add it to the document tree, load it up!
    document.getElementsByTagName('head')[0].appendChild(s);
};

//
// Support of in-place-GRDDL
//

this.GRDDL._profiles = new Array();

this.GRDDL.addProfile = function(js_url) {
    this.GRDDL._profiles[this.GRDDL._profiles.length] = js_url;
};

this.GRDDL.runProfiles = function(callback) {
    alert('in run profiles');

    var next_profile = this.GRDDL._profiles.shift();
    alert('going through profile ' + next_profile);

    if (!next_profile) {
        alert('no more profiles!');
        callback();
        return;
    }

    // load the next profile, and when that is done, run the next profiles
    this.GRDDL.load(next_profile, function() {
        alert('back from profile ' + next_profile);
        this.GRDDL.runProfiles(callback);
    });
}


//
//
//

this.add_triple = function (subject, predicate, object, literal_p) {
    var triple = new this.Triple();
    triple.subject = subject;
    triple.predicate = predicate;
    triple.object = object;
    triple.setLiteral(literal_p);

    // set up the array for that subject
    if (!this.triples[triple.subject]) {
        this.triples.add(triple.subject, new Array());
    }

    // we have to index by a string, so let's get the unique string, the URI
    var predicate_uri = triple.predicate.uri();

    if (!this.triples[triple.subject][predicate_uri]) {
        this.triples[triple.subject][predicate_uri] = new Array();
    }

    // store the triple
    var the_array = this.triples[triple.subject][predicate_uri];
    the_array.push(triple);

	return triple;
};

this.get_special_subject = function(element) {
	// ABOUT overrides ID
	if (this.getNodeAttributeValue(element,'about'))
		return this.getNodeAttributeValue(element,'about');

    // there is no ABOUT, but this might be the HEAD
    if (element.name == 'head')
        return ""

	// ID
	if (this.getNodeAttributeValue(element,'id'))
		return "#" + this.getNodeAttributeValue(element,'id');

	// BNODE, let's set it up if we need to
	if (!element.special_subject) {
		element.special_subject = '[_:' + element.nodeName + this.bnode_counter + ']';
		this.bnode_counter++;
	}

	return element.special_subject
};

//
// Process Namespaces
//
this.add_namespaces = function(element, namespaces) {
    // we only copy the namespaces array if we really need to
    var copied_yet = 0;

    // go through the attributes
    var attributes = element.attributes;

    if (!attributes)
        return namespaces;

    for (var i=0; i<attributes.length; i++) {
        if (attributes[i].name.substring(0,5) == "xmlns") {
            if (!copied_yet) {
                namespaces = namespaces.copy();
                copied_yet = 1;
            }

            if (attributes[i].name.length == 5) {
                namespaces.add('',new this.Namespace('',attributes[i].value));
            }

            if (attributes[i].name[5] != ':')
                continue;

            var prefix = attributes[i].name.substring(6);
            var uri = attributes[i].value;

            namespaces.add(prefix, new this.Namespace(prefix,uri));
        }
    }

    return namespaces;
};

// this function takes a given element in the DOM tree and:
//
// - determines RDF/a statements about this particular element and adds the triples.
// - recurses down the DOM tree appropriately
//
// the namespaces is an associative array where the default namespace is namespaces['']
//
this.traverse = function (element, inherited_about, explicit_about, namespaces) {

    // are there namespaces declared
    namespaces = this.add_namespaces(element,namespaces);

    // determine the current about
    var current_about = inherited_about;
	var element_to_callback = element;

    // do we explicitly override it?
    var new_explicit_about = null;
    if (this.getNodeAttributeValue(element,'about')) {
        new_explicit_about = this.getNodeAttributeValue(element,'about');
        current_about = new_explicit_about;
    }

	// determine the object
	var el_object = null;
	if (this.getNodeAttributeValue(element,'href'))
		el_object = this.getNodeAttributeValue(element,'href');
	if (this.getNodeAttributeValue(element,'src'))
		el_object = this.getNodeAttributeValue(element,'src');

	// LINK
	if (element.nodeName == 'link' || element.nodeName == 'meta') {
		current_about = this.get_special_subject(element.parentNode);
		element_to_callback = element.parentNode;
	}

    // REL attribute
	if (this.getNodeAttributeValue(element,'rel')) {
		var triple = this.add_triple(current_about, this.CURIE.parse(this.getNodeAttributeValue(element,'rel'),namespaces), el_object, 0);
        this.CALLBACK_NEW_TRIPLE_WITH_URI_OBJECT(element_to_callback, triple);
	}

    // REV attribute
    if (this.getNodeAttributeValue(element,'rev')) {
        var triple = this.add_triple(el_object, this.CURIE.parse(this.getNodeAttributeValue(element,'rev'),namespaces), current_about, 0);
        this.CALLBACK_NEW_TRIPLE_WITH_URI_OBJECT(element_to_callback, triple);
    }

    // PROPERTY attribute
    if (this.getNodeAttributeValue(element,'property')) {
        var content = this.getNodeAttributeValue(element,'content');

        if (!content)
            content = element.textContent;

        var triple = this.add_triple(current_about, this.CURIE.parse(this.getNodeAttributeValue(element,'property'),namespaces), content, 1);
        this.CALLBACK_NEW_TRIPLE_WITH_LITERAL_OBJECT(element_to_callback, triple);
    }


    // recurse down the children
	var children = element.childNodes;
	for (var i=0; i < children.length; i++) {
		this.traverse(children[i], current_about, new_explicit_about, namespaces);
	}
};

this.getTriples = function(subject, predicate) {
    if (!this.triples[subject])
        return null;

    return this.triples[subject][predicate.uri()];
};

this.parse = function(doc_element) {
    // by default, about is the current URL, and the namespace is XHTML1
    alert(1);
    var xhtml = new this.Namespace('xhtml','http://www.w3.org/1999/xhtml');
    alert(2);
    var namespaces = new Array();

    // set up default namespace
    namespaces.add('',xhtml);

    alert('blarf');

    // do the profiles, and then traverse
    this.GRDDL.runProfiles(function() {
        //alert('now traversing.... ');
        this.traverse(doc_element, '', null, namespaces);

        this.CALLBACK_DONE_PARSING();
    });
};

this.log = function(str) {
    alert(str);
};

} // RDFA 


// RDFA.CALLBACK_DONE_LOADING();
