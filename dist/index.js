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

    // logging to console?
    this._debug = true;

    this._parseOptions(options);

    if (this._immediateSubscription) {
      this._subscribe();
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //                                                                                                                  //
  //                                              PUBLIC MEMBERS                                                      //
  //                                                                                                                  //
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  _createClass(MobaseStore, [{
    key: 'config',
    value: function config(options) {
      this._parseOptions(options);
    }
  }, {
    key: 'subscribe',
    value: function subscribe(options) {
      if (options) this._parseOptions(options);

      this._subscribe();
    }
  }, {
    key: 'unsubscribe',
    value: function unsubscribe() {
      this._unsubscribe();
    }
  }, {
    key: 'values',
    value: function values() {
      return this._collection.values();
    }
  }, {
    key: 'get',
    value: function get(id) {
      return this._collection.get(id);
    }
  }, {
    key: 'toJS',
    value: function (_toJS) {
      function toJS() {
        return _toJS.apply(this, arguments);
      }

      toJS.toString = function () {
        return _toJS.toString();
      };

      return toJS;
    }(function () {
      return toJS(this._collection);
    })
  }, {
    key: 'write',
    value: function write(params) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var ref = _this._getChildRef(params.id);
        _this._update(ref, params).then(function (e) {
          if (e) reject("Writing failed");else resolve();
        });
      });
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //                                                                                                                  //
    //                                              PRIVATE MEMBERS                                                     //
    //                                                                                                                  //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    //
    // Parse options object and show errors if present
    //

  }, {
    key: '_parseOptions',
    value: function _parseOptions(options) {

      if (options.userBased === true) this._userBased = true;

      if (options.userBased === false) this._userBased = false;

      if (typeof options.userId != 'undefined') this._userId = options.userId;

      if (options.modelClass) this._modelClass = options.modelClass;

      if (typeof options.database != 'undefined') this._database = options.database;

      if (!!options.path) {
        //remove trailing slash
        this._path = options.path.replace(/\/+$/, "");
      }

      if (options.immediateSubscription === true) this._immediateSubscription = true;

      if (options.immediateSubscription === false) this._immediateSubscription = false;
    }

    //
    // Checks whether all necessary options are set
    //

  }, {
    key: '_checkOptions',
    value: function _checkOptions() {
      var result = true;

      if (!this._database) {
        this.__error('OPTIONS_NO_DB');
        result = false;
      }

      if (!!!this._path) {
        this.__error('OPTIONS_NO_PATH');
        result = false;
      }

      if (this._userBased && !!!this._userId) {
        this.__error('OPTIONS_NO_USERID');
        result = false;
      }

      return result;
    }

    //
    // Subscribes to firebase db
    //

  }, {
    key: '_subscribe',
    value: function _subscribe() {

      var optionsAreOK = this._checkOptions();

      if (!optionsAreOK) return;

      var path = this._path;
      if (this._userBased) path += '/' + this._userId;

      var ref = this._database.ref(path);

      if (!ref) {
        this.__error('SUBSCRIBE_NO_REF');
        return;
      }

      this.__log('SUBSCRIBE_REF_SET');

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

      this.__log('CHILD_ADDED', data);
    }
  }, {
    key: '_childRemoved',
    value: function _childRemoved(data) {
      this._collection.delete(data.id);

      this.__log('CHILD_REMOVED', data.id);
    }
  }, {
    key: '_childChanged',
    value: function _childChanged(data) {

      var item = this._collection.get(data.id);

      if (!item) {
        this.__error('CHILD_CHANGED_NO_ITEM');
        return;
      }

      item.setFields(data);

      this.__log('CHILD_CHANGED', data);
    }
  }, {
    key: '_getFieldsFallback',
    value: function _getFieldsFallback(data) {
      console.log("NOT IMPLEMENTED");
    }
  }, {
    key: '_setFieldsFallback',
    value: function _setFieldsFallback(data) {
      console.log("NOT IMPLEMENTED");
    }

    //
    // Return child ref and creates a new one if needed
    //

  }, {
    key: '_getChildRef',
    value: function _getChildRef(id) {
      var newRef = null;

      if (id) newRef = this._ref.child(id);else newRef = this._ref.push();

      if (!newRef) {
        this.__error('GET_CHILD_REF_NO_REF');
        return;
      }

      return newRef;
    }

    //
    // Updates  provided ref with information. Returns firebase ref promise
    //

  }, {
    key: '_update',
    value: function _update(ref, data) {
      if (!ref) {
        this.__error('UPDATE_NO_REF');
        return;
      }

      this.__log('UPDATE_UPDATING', ref.key, data);

      return ref.update(data);
    }
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


  }, {
    key: '__log',
    value: function __log() {
      var args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);

      if (!this._debug) return;

      var message = null;

      switch (args[0]) {

        case 'SUBSCRIBE_REF_SET':
          message = 'Firebase reference retrieved';
          break;

        case 'CHILD_ADDED':
          message = 'Child was added to collection with data: ';
          break;

        case 'CHILD_REMOVED':
          message = 'Child was removed from collection, id: ';
          break;

        case 'CHILD_CHANGED':
          message = 'Child was updated with data: ';
          break;

        default:
          message = 'Unspecified log message ' + args[0];
          break;

      }

      if (message) {
        message = 'MOBASE: (' + this._path + '): ' + message;
        console.info.apply(this, [message].concat(args.slice(1, args.length)));
      }
    }

    //
    // throws errors to console
    //

  }, {
    key: '__error',
    value: function __error(e) {
      var args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);

      var message = null;

      switch (args[0]) {

        case 'OPTIONS_NO_DB':
          message = 'Firebase database instance is not specified or null. mobase won\'t work without';
          break;

        case 'OPTIONS_NO_PATH':
          message = 'options.path is not specified or null.';
          break;

        default:
          message = 'Unspecified error ' + e + 'occured';
          break;
      }

      if (message) {
        message = 'MOBASE: (' + this._path + '): ' + message;
        console.error.apply(this, [message].concat(args.slice(1, args.length)));
      }
    }
  }, {
    key: 'size',
    get: function get() {
      return this._collection.size;
    }
  }]);

  return MobaseStore;
}();
