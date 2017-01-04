'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MobaseStore = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mobx = require('mobx');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MobaseStore = exports.MobaseStore = function () {

  //options = {
  //  path: '/path_inside_firebase_db',
  //  userBased: bool,
  //  userId: if undefined - get it from firebase.auth()
  //  model class
  // }

  function MobaseStore(options) {
    _classCallCheck(this, MobaseStore);

    // firebase database instance
    this._database = null;

    // firebase reference  
    this._ref = null;

    // is collection ready?
    this._isReady = false;

    // mobx collection map
    this._collection = (0, _mobx.asMap)();

    // should we include /userId after path?
    this._userBased = false;

    // actual user id. if null = get it from firebase.auth()
    this._userId = null;

    //instanced of this class will belong to this._collection
    this._modelClass = null;

    //path to firebase db
    this._path = null;

    // should we subscribe to firebase on store creation?
    this._immediateSubscription = true;

    var optionsAreOk = this._parseOptions(options);

    if (!optionsAreOk) return;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //                                                                                                                  //
  //                                              PUBLIC MEMBERS                                                      //
  //                                                                                                                  //
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //                                                                                                                  //
  //                                              PRIVATE MEMBERS                                                     //
  //                                                                                                                  //
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  //
  // Parse options object and show errors if present
  //


  _createClass(MobaseStore, [{
    key: '_parseOptions',
    value: function _parseOptions(options) {

      if (options.userBased) this._userBased = true;

      if (!!options.userId) this._userId = options.userId;

      if (options.modelClass) this._modelClass = options.modelClass;

      if (options.database) this._database = options.database;

      if (!!options.path) {
        //remove trailing slash
        this._path = options.path.replace(/\/+$/, "");
      }

      if (!this._database) {
        this.__error('OPTIONS_NO_DB');
        return;
      }

      if (!!!this._path) {
        this.__error('OPTIONS_NO_PATH');
        return;
      }

      if (options.immediateSubscription) this._immediateSubscription = true;

      return true;
    }
  }, {
    key: '_subscribe',
    value: function _subscribe() {

      var path = this._path;
      if (this._userBased) path += '/' + this._userId;

      var ref = this._database.ref(path);

      if (!ref) {
        this.__error('SUBSCRIBE_NO_REF');
        return;
      }

      ref.on('value', function (snapshot) {
        this._setReady(true);
      }, this);
      ref.on('child_added', function (snapshot) {
        this._childAdded(snapshot.val());
      }, this);
      ref.on('child_removed', function (snapshot) {
        this._childRemoved(snapshot.val());
      }, this);
      ref.on('child_changed', function (snapshot) {
        this._childChanged(snapshot.val());
      }, this);

      this._ref = ref;
    }
  }, {
    key: '_unsubscribe',
    value: function _unsubscribe() {
      this._ref.off();
    }
  }, {
    key: '_childAdded',
    value: function _childAdded(data) {
      var newItem = new this._modelClass();

      if (typeof newItem.getFields != "function") newItem.prototype.getFields = this._getFieldsFallback;

      if (typeof newItem.setFields != "function") newItem.prototype.setFields = this._setFieldsFallback;

      newItem.setFields(data);

      this._collection.set(newItem.id, newItem);
    }
  }, {
    key: '_childRemoved',
    value: function _childRemoved(data) {}
  }, {
    key: '_childChanged',
    value: function _childChanged(data) {}
  }, {
    key: '_getFieldsFallback',
    value: function _getFieldsFallback(data) {}
  }, {
    key: '_setFieldsFallback',
    value: function _setFieldsFallback(data) {}
  }, {
    key: '_setReady',
    value: function _setReady(v) {
      this._isReady = v;
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //                                                                                                                  //
    //                                              HELPERS                                                             //
    //                                                                                                                  //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    //
    // throws errors to console
    //

  }, {
    key: '__error',
    value: function __error(e) {
      switch (e) {

        case 'OPTIONS_NO_DB':
          console.error('Firebase database instance is not specified or null. mobase won\'t work without');
          return;

        case 'OPTIONS_NO_PATH':
          console.error('options.path is not specified or null.');
          return;

        default:
          console.error('Unspecified error ' + e + 'occured');
          return;
      }
    }
  }]);

  return MobaseStore;
}();
