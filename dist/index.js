'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class, _descriptor, _class2, _temp; // CHANGELOG
// Added options.name (arguable?)
// Models are injected with _mobase object
// Added onAfterChildAdded, onAfterChildRemoved, onAfterChildChanged hooks
//       onBeforeChildAdded, onBeforeChildRemoved, onBeforeChildChanged
//       onBeforeValue, onAfterValue


var _mobx = require('mobx');

var _lodash = require('lodash');

function _initDefineProp(target, property, descriptor, context) {
  if (!descriptor) return;
  Object.defineProperty(target, property, {
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable,
    writable: descriptor.writable,
    value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
  });
}

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

function _initializerWarningHelper(descriptor, context) {
  throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
}

var MobaseStore = (_class = (_temp = _class2 = function () {
  function MobaseStore(options) {
    _classCallCheck(this, MobaseStore);

    _initDefineProp(this, '_isReady', _descriptor, this);

    this.__messages = {

      // Error messages
      '_ERROR_DEFAULT_': 'Unspecified error occured',
      'OPTIONS_NO_DB': 'Firebase database instance is not specified or null.',
      'OPTIONS_NO_PATH': 'options.path is not specified or null',
      'SUBSCRIBE_NO_REF': 'Cannon establish firebase ref object in order to make a connection',
      'CHILD_ADDED_NO_ID': 'child_added event received, but id field is not present or null or empty',
      'CHILD_CHANGED_NO_ID': 'child_changed event received, but id field is not present or null or empty',
      'CHILD_REMOVED_NO_ID': 'child_removed event received, but id field is not present or null or empty',
      'DELETE_WRONG_ARGS_TYPE': 'Wrong id provided. Should be string, object (keys act as ids) or array of ids',

      // Log messages
      '_LOG_DEFAULT_': 'Default log action occured',
      'SUBSCRIBE_REF_SET': 'Firebase reference retrieved',
      'VALUE': 'Children %o have been added to collection from data %o',
      'CHILD_ADDED': 'Child (%s) has been added with %o',
      'CHILD_REMOVED': 'Child (%s) has been removed',
      'CHILD_CHANGED': 'Child %s has been updated with %o',
      'REMOVED_PRIVATE_KEY': 'Private key %s removed from %o',
      'WRITE': 'Writing child (%s) with %o',
      'UPDATE': 'Updating child (%s) with %o'
    };


    this.options = {
      // this collection name to keep ref in stores[name]
      name: null,

      // firebase database instance
      database: null,

      //path to firebase db node
      path: null,

      //default if field of a record
      idField: 'id',

      //add userId to path
      userId: null,

      //add childId to path (path/userId/childId)
      childId: null,

      //model class to instanciate
      modelClass: null,

      //should we subscribe to firebase on store creation
      immediateSubscription: true,

      //output debug information
      debug: MobaseStore.options.debug
    };

    // firebase reference
    this._ref = null;

    // is collection ready?
    this._isReady = false;

    // mobx collection map
    this._collection = _mobx.observable.map();

    (0, _lodash.merge)(this.options, MobaseStore.options, options);

    if (this.options.immediateSubscription) {
      this._subscribe();
    }

    //keep reference for future injections
    MobaseStore.stores[this.options.name ? this.options.name : this.options.path] = this;
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //                                                                                                                  //
  //                                              PUBLIC MEMBERS                                                      //
  //                                                                                                                  //
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  _createClass(MobaseStore, [{
    key: 'subscribe',


    //Subscribe to firebase (if options.immediateSubscription == false)
    value: function subscribe(options) {
      if (options) (0, _lodash.merge)(this.options, MobaseStore.options, options);

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
    key: 'entries',
    value: function entries() {
      return this._collection.entries();
    }
  }, {
    key: 'get',
    value: function get(id) {
      return this._collection.get(id);
    }
  }, {
    key: 'has',
    value: function has(id) {
      return this._collection.has(id);
    }
  }, {
    key: 'toJS',
    value: function toJS() {
      return (0, _mobx.toJS)(this._collection);
    }
  }, {
    key: 'write',
    value: function write(params) {
      var _this = this;

      var toRoot = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      return new Promise(function (resolve, reject) {

        var ref = null;

        if (!toRoot) {
          ref = _this._getChildRef(_this.__extractId(params));
          params.id = ref.key;
        } else {
          ref = _this._ref;
        }

        _this._write(ref, params).then(function (key) {
          return resolve(key);
        }).catch(function (e) {
          return reject("Writing failed");
        });
      });
    }
  }, {
    key: 'update',
    value: function update(params) {
      var _this2 = this;

      var toRoot = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      return new Promise(function (resolve, reject) {

        var ref = null;

        if (!toRoot) {
          ref = _this2._getChildRef(_this2.__extractId(params));
          params.id = ref.key;
        } else {
          ref = _this2._ref;
        }

        _this2._update(ref, params).then(function () {
          return resolve();
        }).catch(function () {
          return reject("Updating failed");
        });
      });
    }
  }, {
    key: 'delete',
    value: function _delete(_ids) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        var update = {};
        var ids = void 0;

        if (Array.isArray(_ids)) ids = Array.from(_ids);else if (typeof _ids == "string") ids = [_ids];else if ((typeof _ids === 'undefined' ? 'undefined' : _typeof(_ids)) == "object") ids = Object.keys(_ids);else reject(_this3.__error('DELETE_WRONG_ARGS_TYPE', false));

        ids.forEach(function (id) {
          update[id] = null;
        });

        _this3._ref.update(update).then(function (e) {
          return e ? reject(e) : resolve(ids);
        });
      });
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //                                                                                                                  //
    //                                              PRIVATE MEMBERS                                                     //
    //                                                                                                                  //
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    //
    // Checks whether all necessary options are set
    //

  }, {
    key: '_checkOptions',
    value: function _checkOptions() {
      var result = true;

      if (!this.options.database) {
        this.__error('OPTIONS_NO_DB');
        result = false;
      }

      if (!this.options.path) {
        this.__error('OPTIONS_NO_PATH');
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

      if (!this._checkOptions()) return;

      var path = this.__makePath();

      var ref = this.options.database.ref(path);

      if (!ref) {
        this.__error('SUBSCRIBE_NO_REF');
        return;
      }

      this.__log('SUBSCRIBE_REF_SET');

      ref.on('value', function (snapshot) {
        this._value(snapshot.val());
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

    //values event handler.

  }, {
    key: '_value',
    value: function _value(data) {
      var _this4 = this;

      this.__trigger('onBeforeValue', { data: data });

      var buffer = {};

      (0, _lodash.forEach)(data, function (itemData, id) {

        _this4.__trigger('onBeforeChildAdded', { id: id, data: itemData });

        var newItem = _this4.options.modelClass ? new _this4.options.modelClass(itemData) : {};

        _this4.__setFields(newItem, itemData);

        _this4.__injectMeta(newItem);

        buffer[id] = newItem;
      });

      this._collection.replace(buffer);

      (0, _lodash.forEach)(buffer, function (item, id) {
        return _this4.__trigger('onAfterChildAdded', { id: id, item: item, data: data[id] }, item);
      });

      this.__trigger('onAfterValue', { data: data, items: buffer });

      this.__log('VALUE', buffer, data);

      this._setReady(true);
    }

    //child_added event handler

  }, {
    key: '_childAdded',
    value: function _childAdded(data) {

      //prevent before initial value() event has been triggered
      if (!this.isReady) return;

      //extract id from incoming data
      var newId = this.__extractId(data);

      if (!!!newId) {
        this.__error('CHILD_ADDED_NO_ID', data);
        return;
      }

      this.__trigger('onBeforeChildAdded', { id: id, data: data });

      var newItem = this.options.modelClass ? new this.options.modelClass(data) : {};

      this.__setFields(newItem, data);

      this.__injectMeta(newItem);

      this._collection.set(newId, newItem);

      this.__trigger('onAfterChildAdded', { id: newId, data: data, item: newItem }, newItem);

      this.__log('CHILD_ADDED', newId, data);
    }

    //child_changed event handler

  }, {
    key: '_childChanged',
    value: function _childChanged(data) {
      //extract id from incoming data
      var id = this.__extractId(data);

      if (!!!id) {
        this.__error('CHILD_CHANGED_NO_ID', data);
        return;
      }

      var item = this._collection.get(id);

      if (!item) {
        this.__error('CHILD_CHANGED_NO_ITEM', data);
        return;
      }

      this.__trigger('onBeforeChildChanged', { id: id, data: data, item: item }, item);

      if (item.setFields && typeof item.setFields == "function") item.setFields(data); //TODO: or fallback !

      //invoking set() creates a mobx reaction
      this._collection.set(id, item);

      this.__trigger('onAfterChildChanged', { id: id, data: data, item: item }, item);

      this.__log('CHILD_CHANGED', id, data);
    }

    //child_removed event handler

  }, {
    key: '_childRemoved',
    value: function _childRemoved(data) {
      //extract id from incoming data
      var id = this.__extractId(data);

      if (!!!id) {
        this.__error('CHILD_REMOVED_NO_ID', data);
        return;
      }

      var item = this._collection.get(id);

      if (!item) {
        this.__error('CHILD_REMOVED_NO_ITEM');
        return;
      }

      this.__trigger('onBeforeChildRemoved', { id: id, item: item, data: data }, item);

      this._collection.delete(id);

      this.__trigger('onAfterChildRemoved', { id: id, data: data });

      this.__log('CHILD_REMOVED', id);
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
    // Return root ref
    //

  }, {
    key: '_getRootRef',
    value: function _getRootRef() {
      return this._ref;
    }

    //
    // Sets  provided ref with information. Returns firebase ref promise
    //

  }, {
    key: '_write',
    value: function _write(ref, data) {
      var _this5 = this;

      return new Promise(function (resolve, reject) {

        if (!ref) {
          _this5.__error('WRITE_NO_REF');
          return reject();
        }

        var d = _this5.__removePrivateKeys(data);

        _this5.__log('WRITE', ref.key, d);

        ref.set(d).then(function (e) {
          return e ? reject(e) : resolve(ref.key);
        });
      });
    }

    //
    // Updates  provided ref with information. Returns firebase ref promise
    //

  }, {
    key: '_update',
    value: function _update(ref, data) {
      var _this6 = this;

      return new Promise(function (resolve, reject) {

        if (!ref) {
          _this6.__error('UPDATE_NO_REF');
          return reject();
        }

        var d = _this6.__removePrivateKeys(data);

        _this6.__log('UPDATE', ref.key, d);

        ref.update(d).then(function (e) {
          return e ? reject(e) : resolve(ref.key);
        });
      });
    }

    //
    // Remove provided ref
    //

  }, {
    key: '_remove',
    value: function _remove(ref) {
      var _this7 = this;

      return new Promise(function (resolve, reject) {

        if (!ref) {
          _this7.__error('DELETE_NO_REF');
          return reject('DELETE_NO_REF');
        }

        _this7.__log('DELETE_DELETING', ref.key, data);

        ref.remove().then(function (e) {
          return e ? reject(e) : resolve();
        });
      });
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
    key: '__setFields',
    value: function __setFields(item) {
      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      console.log('__setFields() %o %o', item, data);

      if (!item) return;

      Object.defineProperty(item, '$mobaseFields', {
        configurable: false,
        enumerable: false,
        writable: true,
        value: data
      });

      var fields = Object.keys(this.options.fields || data);

      fields.forEach(function (key) {
        Object.defineProperty(item, key, {
          configurable: false,
          enumerable: true,
          value: (0, _mobx.computed)(function () {
            return item.$mobaseFields[key];
          }),
          writable: false
        });
      });
    }
  }, {
    key: '__extractId',
    value: function __extractId(data) {
      return data[this.options.idField];
    }
  }, {
    key: '__injectMeta',
    value: function __injectMeta(item) {
      if (!item) return;

      Object.defineProperty(item, '$mobaseStore', { value: this, enumerable: false });
      Object.defineProperty(item, '$mobaseStores', { value: MobaseStore.stores, enumerable: false });
      Object.defineProperty(item, '$mobaseUserId', { value: this.options.userId, enumerable: false });
    }
  }, {
    key: '__trigger',
    value: function __trigger(e, eventParams, item) {

      if (item && item[e] && typeof item[e] == "function") item[e](params);

      if (this[e] && typeof this[e] == "function") this[e](params);

      if (this.options[e] && typeof this.options[e] == "function") this.options[e](params);
    }
  }, {
    key: '__removePrivateKeys',
    value: function __removePrivateKeys(d) {
      var _this8 = this;

      var result = (0, _lodash.assign)({}, d);

      (0, _lodash.forEach)(result, function (value, key) {
        if (key[0] == '_') {
          delete result[key];
          _this8.__log('REMOVED_PRIVATE_KEY', key[0], d);
        }
      });

      return result;
    }
  }, {
    key: '__makePath',
    value: function __makePath() {
      var path = this.options.path;

      if (!!this.options.userId) path += '/' + this.options.userId;

      if (!!this.options.childId) path += '/' + this.options.childId;

      return path;
    }
  }, {
    key: '__log',
    value: function __log() {
      var args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);

      if (!this.options.debug) return;

      var message = this.__messages[args[0]] ? this.__messages[args[0]] : this.__messages['_LOG_DEFAULT_'];

      if (message) {
        message = 'mobase ' + this.__makePath() + '\n' + message;
        console.info.apply(this, [message].concat(args.slice(1, args.length)));
      }
    }

    // throws errors to console

  }, {
    key: '__error',
    value: function __error(e) {
      var shouldPrintToConsole = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      var args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);

      var message = this.__messages[args[0]] ? this.__messages[args[0]] : this.__messages['_ERROR_DEFAULT_'] + args[0];

      if (message) {
        message = 'mobase ' + this.__makePath() + '\n' + message;
        if (shouldPrintToConsole) console.error.apply(this, [message].concat(args.slice(1, args.length)));else return [message].concat(args.slice(1, args.length));
      }
    }
  }, {
    key: 'isReady',
    get: function get() {
      return this._isReady;
    }
  }, {
    key: 'size',
    get: function get() {
      return this._collection.size;
    }

    //exposes internal collection

  }, {
    key: 'collection',
    get: function get() {
      return this._collection;
    }
  }]);

  return MobaseStore;
}(), _class2.options = {
  debug: false
}, _class2.stores = {}, _temp), (_descriptor = _applyDecoratedDescriptor(_class.prototype, '_isReady', [_mobx.observable], {
  enumerable: true,
  initializer: null
}), _applyDecoratedDescriptor(_class.prototype, 'isReady', [_mobx.computed], Object.getOwnPropertyDescriptor(_class.prototype, 'isReady'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'size', [_mobx.computed], Object.getOwnPropertyDescriptor(_class.prototype, 'size'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'collection', [_mobx.computed], Object.getOwnPropertyDescriptor(_class.prototype, 'collection'), _class.prototype)), _class);
exports.default = MobaseStore;
