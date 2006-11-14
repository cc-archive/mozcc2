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

const MediaLibrary = new Components.Constructor("@songbirdnest.com/Songbird/MediaLibrary;1", "sbIMediaLibrary");

function has_column(mediaLibrary, col_name) {

    mediaLibrary.getColumnInfo();
    var resultset = mediaLibrary.getQueryObject().getResultObject();
    var column_names = "";
    for (var i = 0; i < resultset.getRowCount(); i++) {
	if (resultset.getRowCellByColumn(i, "column_name") == col_name)
	    return true;
    }

    return false;


} // has_column

function add_license_column(mediaLibrary) {

    mediaLibrary.addColumn("ccLicense", "TEXT DEFAULT ''");
    mediaLibrary.setColumnInfo("ccLicense",
			       "License",
			       true,
			       true,
			       true,
			       1,
			       100,
			       "TEXT",
			       true,
			       false);

} // add_license_column

function createLibraryHandle(library) {
    // create and return a handle to the specified media library;
    // also creates a DB query and associates it with the library instance

    // open a handle to the media library for web playlists
    result = (new MediaLibrary()).QueryInterface(
			        Components.interfaces.sbIMediaLibrary);   

    aDBQuery = new sbIDatabaseQuery();
    aDBQuery.setAsyncQuery( false );
    aDBQuery.setDatabaseGUID( library );

    result.setQueryObject(aDBQuery);

    // ensure the ccLicense metadata column is available
    if (!has_column(result, "ccLicense")) {
	add_license_column(result);
    }

    return result;
} // createLibraryHandle

function _mfs_open() {

    // open a handle to the web playlist media library 
    this.sbMediaLibrary = createLibraryHandle( WEB_PLAYLIST_CONTEXT );

    // open a handle to the "main" media library
    // this just ensures the ccLicense column is created
    createLibraryHandle("songbird");

} // _mfs_open

function _mfs_assert(pageid, triple, provider) {

    // get the subject
    var subject = (triple.subject.Value != null?
		   triple.subject.Value : triple.subject);

    var predicate = (triple.predicate.Value != null?
		     triple.predicate.Value : triple.predicate.uri());
	
    var object = (triple.object.Value != null?
		  trip.object.Value : triple.object);

    if (predicate.indexOf("license") > -1) {

	var guid = this.sbMediaLibrary.findByURL(subject);

	if (guid) {
	    // add the license metadata
	    this.sbMediaLibrary.setValuesByGUID(guid,
						1,
						["ccLicense"],
						1,
						[object],
						false);

	}

    }
    
} // _mfs_assert

function _mfs_assert_for_uri(uri, triple) {

    this.assert(this.page_id(uri), triple);

} // _mfs_assert_for_uri

function MozccStorage() {

    // attach class properties
    this.DB_NAME = "mozcc.sqlite";
    this.SCHEMA_VERSION = 1;
    this.in_transaction = false;

    // database/schema methods
    this.open = _mfs_open;
    this.initialize = function() {};
    this.db_version = function() { return 1 };
    this.needs_update = function() { return true };
    this.update = function() {};
    this.start_transaction = function () {};
    this.commit = function() {};
    this.query = function() {};
    this.predicates = function() {};
    this.query_unique = function() {};
    this.query_by_subject = function() {};

    // extractor interface methods
    this.page_id = function(uri) { return uri };
    this.assert_for_uri = _mfs_assert_for_uri;
    this.assert = _mfs_assert;
    this.flush_assertions = function (page_id, provider) {};

    this.pages = function() {};

    // open the mozStorage database
    this.open();

} // MozccStorage

function getStorage() {

    // return the global instance of MozccStorage
    if (!navigator.mozcc_storage) {
	navigator.mozcc_storage = new MozccStorage();
    }

    return navigator.mozcc_storage;

} // getStorage

