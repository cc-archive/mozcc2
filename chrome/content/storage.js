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

// MetaFoxStorage()
//

function _mfs_open() {

        var file = Components.classes["@mozilla.org/file/directory_service;1"]
                     .getService(Components.interfaces.nsIProperties)
                     .get("ProfD", Components.interfaces.nsIFile);
        file.append(this.DB_NAME);

        var storageService = Components.classes[
                      "@mozilla.org/storage/service;1"]
                      .getService(Components.interfaces.mozIStorageService);
        this.dbConn = storageService.openDatabase(file);

} // _mfs_open

function _mfs_db_version () {

    // return true if the database has been initialized

    var value = -1;

    // first just check if the table exists
    if (!this.dbConn.tableExists("mozcc")) {
	return -1;
    }

    // now try to retrieve our stored version value
    try {
	var stmt = this.dbConn.createStatement("select value from mozcc where key='version'");

	stmt.executeStep();
	value = stmt.getInt32(0);

    } finally {

	// reset the statement to clear locks
	if (stmt) stmt.reset();
    }

    return value;
} // _mfs_db_version

function _mfs_initialize() {

    const MOZCC_SCHEMA = "key TEXT, value TEXT";
    const SQL_INIT_MF_DATA = "INSERT INTO mozcc VALUES ('version', " + this.SCHEMA_VERSION + ")";

    const PAGES_SCHEMA = "uri TEXT, lastModified TEXT, UNIQUE(uri) ON CONFLICT REPLACE";
    const METADATA_SCHEMA = "subject TEXT, predicate TEXT, object TEXT, page TEXT, provider TEXT";

    ///////////////////////////////////////////////////////////////////////

    // create the Mozcc settings table
    this.dbConn.createTable("mozcc", MOZCC_SCHEMA);

    // insert the default values
    var stmt = this.dbConn.createStatement(SQL_INIT_MF_DATA);
    stmt.execute();

    ///////////////////////////////////////////////////////////////////////

    // create the pages table
    this.dbConn.createTable("pages", PAGES_SCHEMA);

    ///////////////////////////////////////////////////////////////////////

    // create the meta table
    this.dbConn.createTable("meta", METADATA_SCHEMA);

} // _mfs_initialize

function _mfs_needs_update(uri, lastModified) {
    // query the database to find out if we've seen this page, and if so
    // if the lastModified is different -- if we haven't or it is, return
    // true

    const SQL_QUERY_PAGE = "SELECT lastModified FROM pages WHERE uri = ?1";

    var stmt = this.dbConn.createStatement(SQL_QUERY_PAGE);
    stmt.bindUTF8StringParameter(0, uri);

    var last = null;

    try{
       if (stmt.executeStep()) {
	   last = stmt.getString(0);
       }
    } finally {
	stmt.reset();
    }

    if (last != lastModified) {
	return true;
    } else {
	return false;
    }

} // _mfs_needs_update

function _mfs_update(uri, lastModified) {
    const SQL_DELETE_PAGE = "DELETE FROM pages WHERE uri=?1";
    const SQL_UPDATE_PAGE = "REPLACE INTO pages (uri, lastModified) VALUES (?1, ?2)";

    var stmt = this.dbConn.createStatement(SQL_UPDATE_PAGE);

    stmt.bindUTF8StringParameter(0, uri);
    stmt.bindStringParameter(1, lastModified);
    stmt.execute();

} // _mfs_update

function _mfs_page_id(uri) {

    return uri;
    /*
    const SQL_SELECT_PAGE = "SELECT ROWID FROM pages WHERE uri=?1";


    var page_id = -1;

    try {
	var stmt = this.dbConn.createStatement(SQL_SELECT_PAGE);
	stmt.bindUTF8StringParameter(0, uri);

	stmt.executeStep();
	return stmt.getInt32(0);

    } catch (e) {

	// an exception occured; return our fallback value
	return -1;

    } finally {

	// reset the statement to clear locks
	if (stmt) stmt.reset();
    }
    */

} // _mfs_page_id

function _mfs_pages() {

    const SQL_ALL_PAGES = "SELECT ROWID, uri, lastModified FROM pages";

    var result = new Array();

    try {
	var stmt = this.dbConn.createStatement(SQL_ALL_PAGES);

	while(stmt.executeStep()) {

	    result.push([stmt.getUTF8String(0),
			 stmt.getUTF8String(1),
			 stmt.getUTF8String(2)]);
	} // while more data...
    } finally {
	// clean up the statement
	if (stmt) stmt.reset();
    } 


    return result;

} // _mfs_pages

function _mfs_flush_assertions(pageid, provider) {

    const SQL_FLUSH = "DELETE FROM meta WHERE page=?1 AND provider=?2";

    try {
	var stmt = this.dbConn.createStatement(SQL_FLUSH);
	stmt.bindUTF8StringParameter(0, pageid);
	stmt.bindUTF8StringParameter(1, provider);

	stmt.execute();
    } finally {
	if (stmt) stmt.reset();
    }

} // _mfs_flush_assertions

function _mfs_assert(pageid, triple, provider) {

    // XXX need to check for existing record here and delete if necessary

    const SQL_ASSERT = "INSERT INTO meta (subject, predicate, object, page, provider) " +
	"VALUES (?1, ?2, ?3, ?4, ?5)";

    var stmt = this.dbConn.createStatement(SQL_ASSERT);
    stmt.bindUTF8StringParameter(0, triple.subject.Value);
    stmt.bindUTF8StringParameter(1, triple.predicate.Value);
    stmt.bindUTF8StringParameter(2, triple.object.Value);

    stmt.bindUTF8StringParameter(3, pageid);
    stmt.bindUTF8StringParameter(4, provider);

    stmt.execute();

} // _mfs_assert

function _mfs_assert_for_uri(uri, triple) {

    this.assert(this.page_id(uri), triple);

} // _mfs_assert_for_uri

function _mfs_query(subject, predicate) {

    const SQL_QUERY = "SELECT object, page FROM meta WHERE subject like ?1 and predicate like ?2";

    var result = new Array();

    try {
	var stmt = this.dbConn.createStatement(SQL_QUERY);
	stmt.bindUTF8StringParameter(0, subject);
	stmt.bindUTF8StringParameter(1, predicate);

	while (stmt.executeStep()) {
	    result.push([stmt.getUTF8String(0), stmt.getInt32(1)]);
	} // while more data...

    } finally {
	if (stmt) stmt.reset();
    } // clean-up...

    return result;

} // _mfs_query

function _mfs_query_unique(subject, predicate) {
    // perform a query and return a set of unique results, discarding page
    // source information

    var results = new Array();
    var all_results = this.query(subject, predicate);

    for each (var r in all_results) {
	    if (results.indexOf(r[0]) < 0) {
		results.push(r[0]);
	    }
	} // for each..

    return results;

} // _mfs_query_unique

function _mfs_predicates(subject) {

    const SQL_QUERY = "SELECT DISTINCT predicate FROM meta WHERE subject like ?1";

    var result = new Array();

    try {
	var stmt = this.dbConn.createStatement(SQL_QUERY);
	stmt.bindUTF8StringParameter(0, subject);

	while (stmt.executeStep()) {
	    result.push(stmt.getUTF8String(0));
	} // while more data...

    } finally {
	// clean up
	if (stmt) stmt.reset();
    }

    return result;

} // _mfs_predicates

function _mfs_pred_obj_for_subject(subject) {

    const SQL_QUERY = "SELECT DISTINCT meta.predicate, meta.object, meta.page, meta.provider FROM meta WHERE meta.subject like ?1 ORDER BY meta.predicate, meta.object";

    var result = new Array();

    try {
	var stmt = this.dbConn.createStatement(SQL_QUERY);
	stmt.bindUTF8StringParameter(0, subject);

	while (stmt.executeStep()) {
	    result.push([stmt.getUTF8String(0), 
			 stmt.getUTF8String(1),
			 stmt.getUTF8String(2),
			 stmt.getUTF8String(3)]);
	} // while more data...

    } finally {
	if (stmt) stmt.reset();
    } // clean-up...

    return result;

} // _mfs_pred_obj_for_subject

function MozccStorage() {

    // attach class properties
    this.DB_NAME = "mozcc.sqlite";
    this.SCHEMA_VERSION = 1;
    this.in_transaction = false;

    // database/schema methods
    this.open = _mfs_open;
    this.initialize = _mfs_initialize;
    this.db_version = _mfs_db_version;
    this.needs_update = _mfs_needs_update;
    this.update = _mfs_update;
    this.start_transaction = _mfs_start_transaction;
    this.commit = _mfs_commit_transaction;
    this.query = _mfs_query;
    this.predicates = _mfs_predicates;
    this.query_unique = _mfs_query_unique;
    this.query_by_subject = _mfs_pred_obj_for_subject;

    // extractor interface methods
    this.page_id = _mfs_page_id;
    this.assert_for_uri = _mfs_assert_for_uri;
    this.assert = _mfs_assert;
    this.flush_assertions = _mfs_flush_assertions;

    this.pages = _mfs_pages;

    // open the mozStorage database
    this.open();

    // check the db version
    var version = this.db_version();

    if (version == -1) {
	// database is uninitialized
	this.initialize();
    } else {
	// XXX check for upgrade needed here...
    }

    function _mfs_start_transaction() {

	// short circuit if we've already started a transaction or we're locked
	if (this.in_transaction || this.dbConn.transactionInProgress) return;

	// start a transaction with deferred locking
	this.dbConn.beginTransactionAs(this.dbConn.TRANSACTION_DEFERRED);
	this.in_transaction = true;
    } // _mfs_start_transaction

    function _mfs_commit_transaction() {

	// only attempt to commit if we started the transaction
	if (this.in_transaction) {
	    this.dbConn.commitTransaction();
	    this.in_transaction = false;
	}

    } // _mfs_commit_transaction

} // MozccStorage

function getStorage() {
    // return the global instance of MozccStorage
    if (!navigator.mozcc_storage) {
	navigator.mozcc_storage = new MozccStorage();
    }

    return navigator.mozcc_storage;
} // getStorage

