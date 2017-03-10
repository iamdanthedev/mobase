'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class, _descriptor, _class2, _temp; /**
                                                         * @description Is triggered on firebase value event before processing received data. Altering data will affect items created
                                                         * @callback Mobase.onBeforeValue
                                                         * @param {object} params
                                                         * @param {object} params.data Data received from firebase. Important: this is a reference so you can alter this object and if will effect the collection created
                                                         */

/**
 * @description Is triggered on firebase value event after the data has been processed and the collection updated with new item.
 * @callback Mobase.onAfterValue
 * @param {object} params
 * @param {object} params.data Data received from firebase.
 * @param {object} params.items Collection of items in shape {id1: Item1, id2: Item2}
 */

/**
 * @description Is triggered before a new item is going to be instantiated and added to the collection. Altering data will affect the new item
 * @callback Mobase.onBeforeChildAdded
 * @param {object} params
 * @param {string} params.id Id of a future item
 * @param {object} params.data Data object fetched from firebase. Alter this to affect a new item
 */

/**
 * @description Is triggered after a new item was instantiated added to collection
 * @callback Mobase.onAfterChildAdded
 * @param {object} params
 * @param {string} params.id New item id
 * @param {object} params.item New item instance
 * @param {object} params.date New item data
 */

/**
 * @description Is triggered after an item was changed in firebase and before it's changed in the collection
 * @callback Mobase.onBeforeChildChanged
 * @param {object} params
 * @param {string} params.id
 * @param {object} params.data
 * @params {object} params.item
 */

/**
 * @description Is triggered after an item was changed in firebase and after it's changed in the collection
 * @callback Mobase.onAfterChildChanged
 * @param {object} params
 * @param {string} params.id
 * @param {object} params.data
 * @params {object} params.item
 */

/**
 * @description Is triggered after an item was removed from firebase and before an item was removed from collection
 * @callback Mobase.onBeforeChildRemoved
 * @param {object} params
 * @param {string} params.id
 * @param {object} params.data
 * @params {object} params.item
 */

/**
 * @description Is triggered after an item was removed from firebase and before an item was removed from collection
 * @callback Mobase.onAfterChildRemoved
 * @param {object} params
 * @param {string} params.id Item id
 * @param {object} params.data Item data provided by firebase
 */

var _mobx = require('mobx');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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
      'OPTIONS_NO_FIELDS': 'options.fields is not specified',
      'SUBSCRIBE_NO_REF': 'Cannon establish firebase ref object in order to make a connection',
      'CHILD_ADDED_NO_ID': 'child_added event received, but id field is not present or null or empty',
      'CHILD_CHANGED_NO_ID': 'child_changed event received, but id field is not present or null or empty',
      'CHILD_REMOVED_NO_ID': 'child_removed event received, but id field is not present or null or empty',
      'DELETE_WRONG_ARGS_TYPE': 'Wrong id provided. Should be string, object (keys act as ids) or array of ids',

      // Log messages
      '_LOG_DEFAULT_': 'Default log action occured',
      'SUBSCRIBE_REF_SET': 'Firebase reference retrieved',
      'VALUE': '(value event) collection updated. items: %o , data: %o',
      'CHILD_ADDED': '(child_added event) child (%s) has been added with %o',
      'CHILD_REMOVED': '(child_removed event) removed (%s)',
      'CHILD_CHANGED': '(child_changed event) child (%s) has been updated with %o',
      'REMOVED_PRIVATE_KEY': 'Private key %s removed from %o',
      'WRITE': 'Writing child (%s) with %o',
      'UPDATE': 'Updating child (%s) with %o',
      'OPTIONS_FIELDS_AND_MODEL': 'options.fields and options.model are both specified. options.fields will not be used'
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

      //model class to instantiate
      model: null,

      //fields
      fields: null,

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

    this.options = Object.assign({}, MobaseStore.options, this.options, options);

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
      if (options) this.options = Object.assign(this.options, options);

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

    /**
     * Create a new item either from model class provided or as an empty object. Extra fields ($mobaseStores etc..) will be injected
     * Item will not be added to the collection (store) upon saving
     * @param {object} fields - Fields to set to a new item
     * @returns {object} Returns new item
     */

  }, {
    key: 'create',
    value: function create(fields) {
      var item = this.__newItem();
      this.__injectMeta(item);
      return item;
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

        _this2._update(ref, params).then(function (updatedId) {
          return resolve(updatedId);
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

      if (!this.options.fields && !this.options.model) {
        this.__error('OPTIONS_NO_FIELDS');
        result = false;
      }

      if (this.options.fields && this.options.model) {
        this.__log('OPTIONS_FIELDS_AND_MODEL');
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

      /* Prevent triggering after initial value event has already been triggered  */
      if (this._isReady) return;

      if (!data) data = {};

      this.__trigger('onBeforeValue', { data: data });

      var buffer = {};

      Object.keys(data).forEach(function (id) {

        var itemData = data[id];

        _this4.__trigger('onBeforeChildAdded', { id: id, data: itemData });

        var newItem = _this4.__newItem();

        _this4.__setFields(newItem, itemData);

        _this4.__injectMeta(newItem);

        buffer[id] = newItem;
      });

      this._collection.replace(buffer);

      Object.entries(buffer).forEach(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            id = _ref2[0],
            item = _ref2[1];

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
      if (!this._isReady) return;

      //extract id from incoming data
      var newId = this.__extractId(data);

      if (!newId) {
        this.__error('CHILD_ADDED_NO_ID', data);
        return;
      }

      this.__trigger('onBeforeChildAdded', { id: newId, data: data });

      var newItem = this.__newItem();

      this.__setFields(newItem, data);

      this.__injectMeta(newItem);

      this._collection.set(newId, newItem);

      this.__trigger('onAfterChildAdded', { id: newId, data: data, item: newItem }, newItem);

      this.__log('CHILD_ADDED', newId, data);
    }

    /**
     * Child_changed event handler
     * @param {object} data
     * @private
     */

  }, {
    key: '_childChanged',
    value: function _childChanged(data) {
      //extract id from incoming data
      var id = this.__extractId(data);

      if (!id) {
        this.__error('CHILD_CHANGED_NO_ID', data);
        return;
      }

      var item = this._collection.get(id);

      if (!item) {
        this.__error('CHILD_CHANGED_NO_ITEM', data);
        return;
      }

      this.__trigger('onBeforeChildChanged', { id: id, data: data, item: item }, item);

      this.__setFields(item, data);

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

      if (!id) {
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
    key: '__newItem',
    value: function __newItem() {
      return this.options.model ? new this.options.model() : {};
    }

    /*
     *   Sets fields (properties) of store items.
     *
     *   If options.model is provided the method only sets $mobaseFields property, which is assumed
     *   to be a setter managing fields on its own
     *
     *   If options.model is not set the method sets fields according to options.fields
     *   setting, setting only those fields specified in the setting.
     *
     *   observable.ref is a modifier by default
     *
     *   supported modifiers:
     *
     *     observable: in this case of plain values field should be accessed through field.set()/ fields.get()
     *
     *     observable.deep, observable.ref: for plain values which are accessed through "=" operator
     *
     *     observable.shallow: for shallowly observed collections
     *
     *     observable.map, observable.shallowMap: collections turned into mobx maps
     *
     *     computed: created a mobx computed field.
     *               default value must be a function executed inside the computed. 'this' will be bound
     *               to the current store item
     *
     * */

  }, {
    key: '__setFields',
    value: function __setFields(item) {
      var _this8 = this;

      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


      if (!item) return;

      /*
       * If model is specified we expect item.$mobaseFields to be a setter taking care of fields assignment.
       * */
      if (this.options.model != null) {
        item.$mobaseFields = data;
        return;
      }

      /*
       *   Otherwise MobaseStore handles fields
       * */

      if (item.hasOwnProperty('$mobaseFields')) item['$mobaseFields'] = data;else Object.defineProperty(item, '$mobaseFields', {
        configurable: false,
        enumerable: false,
        writable: true,
        value: data
      });

      var fields = Object.keys(this.options.fields);

      fields.forEach(function (key) {

        var modifier = typeof _this8.options.fields[key] == "function" ? _this8.options.fields[key] : _this8.options.fields[key].modifier || _mobx.observable.ref;
        var defVal = _this8.options.fields[key].default || '';

        var val = typeof data[key] != "undefined" ? data[key] : defVal;

        //if property already exists
        if ((0, _mobx.isObservable)(item, key)) {

          switch (modifier) {
            case _mobx.observable:
              item[key].set(val);
              break;

            case _mobx.observable.deep:
            case _mobx.observable.ref:
            case _mobx.observable.shallow:
              item[key] = val;
              break;

            case _mobx.observable.map:
            case _mobx.observable.shallowMap:
              item.replace(val);
              break;

          }
        }

        // property doesn't yet exist
        else {
            var bound = typeof val == "function" ? val.bind(item) : val;
            (0, _mobx.extendObservable)(item, _defineProperty({}, key, modifier(bound)));
          }
      });
    }

    /**
     * Extracts item id from data object according to store options
     * @param {object} data
     * @returns {*}
     * @private
     * @returns Id or null if undefined or null
     */

  }, {
    key: '__extractId',
    value: function __extractId(data) {
      var id = data[this.options.idField];

      if (typeof id == "undefined" || id == null) return null;else return id;
    }
  }, {
    key: '__injectMeta',
    value: function __injectMeta(item) {
      if (!item) return;

      Object.defineProperty(item, '$mobaseStore', { value: this, enumerable: false });
      Object.defineProperty(item, '$mobaseStores', { value: MobaseStore.stores, enumerable: false });
      Object.defineProperty(item, '$mobaseUserId', { value: this.options.userId, enumerable: false });
    }

    /*
     *   Triggers event in all possible ways
     * */

  }, {
    key: '__trigger',
    value: function __trigger(e, eventParams, item) {

      /* Event triggered on item*/
      if (item && item[e] && typeof item[e] == "function") item[e](eventParams);

      /* Event triggered on mobase object */
      if (this[e] && typeof this[e] == "function") this[e](eventParams);

      /* Event triggered through options*/
      if (this.options[e] && typeof this.options[e] == "function") this.options[e](eventParams);
    }

    /*
     *   Removes all keys starting with _ or $
     * */

  }, {
    key: '__removePrivateKeys',
    value: function __removePrivateKeys(d) {
      var _this9 = this;

      var result = {};

      Object.entries(d).forEach(function (_ref3) {
        var _ref4 = _slicedToArray(_ref3, 2),
            key = _ref4[0],
            value = _ref4[1];

        if (key[0] == '_' || key[0] == '$') _this9.__log('REMOVED_PRIVATE_KEY', key[0], d);else result[key] = value;
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
