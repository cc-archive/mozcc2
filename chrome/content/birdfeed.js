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

	    meta_doc = {'uri' : uri,
			'document' : browser.contentDocument,
			'lastModified' : browser.contentDocument.lastModified,
			'changed' : getStorage().needs_update(uri, lm),
			'page_id' : null,
			'seen' : new Array(),
	    }


	    processPage(meta_doc);

	} // if we're done parsing the web playlist...

    } // this.observer

} // mozcc_webplaylist_observer


function mozcc_initialize() {

    // attach the webplaylist.total observer
    var remote = SB_NewDataRemote("webplaylist.current", null);
    remote.bindObserver(new mozcc_webplaylist_observer(), true);

} // mozcc_initialize


alert('foo');

mozcc_initialize();