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

function _mfs_no_op() {

}

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

function foo() {

    // open a handle to the media library for web playlists
    sbMediaLibrary = (new MediaLibrary()).QueryInterface(Components.interfaces.sbIMediaLibrary);   

    aDBQuery = new sbIDatabaseQuery();
    aDBQuery.setAsyncQuery( false );
    aDBQuery.setDatabaseGUID( "songbird" );

    sbMediaLibrary.setQueryObject(aDBQuery);

    // ensure the ccLicense metadata column is available
    if (!has_column(sbMediaLibrary, "ccLicense")) {
	add_license_column(sbMediaLibrary);
    }
}

function _mfs_open() {

    // open a handle to the media library for web playlists
    this.sbMediaLibrary = (new MediaLibrary()).QueryInterface(Components.interfaces.sbIMediaLibrary);   

    this.aDBQuery = new sbIDatabaseQuery();
    this.aDBQuery.setAsyncQuery( false );
    this.aDBQuery.setDatabaseGUID( WEB_PLAYLIST_CONTEXT );

    this.sbMediaLibrary.setQueryObject(this.aDBQuery);

    // ensure the ccLicense metadata column is available
    if (!has_column(this.sbMediaLibrary, "ccLicense")) {
	add_license_column(this.sbMediaLibrary);
    }

    foo();

} // _mfs_open

function _mfs_db_version () {
    return 1;
} // _mfs_db_version

function _mfs_needs_update(uri, lastModified) {
    return true;
} // _mfs_needs_update

function _mfs_page_id(uri) {

    return uri;
} // _mfs_page_id

function _mfs_flush_assertions(pageid, provider) {

    // XXX do something here songbird-ish

} // _mfs_flush_assertions

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

function _mfs_query(subject, predicate) {

    return null;

} // _mfs_query

function _mfs_pred_obj_for_subject(subject) {
    return null;
} // _mfs_pred_obj_for_subject

function MozccStorage() {

    // attach class properties
    this.DB_NAME = "mozcc.sqlite";
    this.SCHEMA_VERSION = 1;
    this.in_transaction = false;

    // database/schema methods
    this.open = _mfs_open;
    this.initialize = _mfs_no_op;
    this.db_version = _mfs_db_version;
    this.needs_update = _mfs_needs_update;
    this.update = _mfs_no_op;
    this.start_transaction = _mfs_start_transaction;
    this.commit = _mfs_commit_transaction;
    this.query = _mfs_query;
    this.predicates = _mfs_no_op;
    this.query_unique = _mfs_no_op;
    this.query_by_subject = _mfs_pred_obj_for_subject;

    // extractor interface methods
    this.page_id = _mfs_page_id;
    this.assert_for_uri = _mfs_assert_for_uri;
    this.assert = _mfs_assert;
    this.flush_assertions = _mfs_flush_assertions;

    this.pages = _mfs_no_op;

    // open the mozStorage database
    this.open();

    function _mfs_start_transaction() {
    } // _mfs_start_transaction

    function _mfs_commit_transaction() {
    } // _mfs_commit_transaction

} // MozccStorage

function getStorage() {

    // return the global instance of MozccStorage
    if (!navigator.mozcc_storage) {
	navigator.mozcc_storage = new MozccStorage();
    }

    return navigator.mozcc_storage;

} // getStorage

