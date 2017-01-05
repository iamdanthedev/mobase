'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MobaseStore = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class, _descriptor;
//import {isNil} from 'lodash';


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

var MobaseStore = exports.MobaseStore = (_class = function () {
  function MobaseStore(options) {
    _classCallCheck(this, MobaseStore);

    _initDefineProp(this, '_isReady', _descriptor, this);

    // firebase database instance
    this._database = null;

    // firebase reference
    this._ref = null;

    // is collection ready?
    this._isReady = false;

    // mobx collection map
    this._collection = (0, _mobx.asMap)();

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

        if (!childId) params.id = ref.key;

        _this._write(ref, params).then(function (e) {
          if (e) reject("Writing failed");else resolve(ref.key);
        });
      });
    }
  }, {
    key: 'update',
    value: function update(params) {
      var _this2 = this;

      var childId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      return new Promise(function (resolve, reject) {
        var ref = _this2._getChildRef(childId ? childId : params.id);

        if (!childId) params.id = ref.key;

        _this2._update(ref, params).then(function (e) {
          if (e) reject("Writing failed");else resolve();
        });
      });
    }
  }, {
    key: 'delete',
    value: function _delete(id) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        if (!!!id) {
          _this3.__error('REMOVE_ID_INCORRECT');
          reject('Removing failed');
        } else {
          var ref = _this3._getChildRef(id);
          _this3._remove(ref).then(function (e) {
            if (e) reject('Removing item failed');else resolve();
          });
        }
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

      this._userId = (0, _lodash.defaultTo)(options.userId, null);

      this._childId = (0, _lodash.defaultTo)(options.childId, null);

      this._modelClass = (0, _lodash.defaultTo)(options.modelClass, null);

      this._database = (0, _lodash.defaultTo)(options.database, null);

      this._path = (0, _lodash.defaultTo)(options.path.replace(/\/+$/, ""), null); // remove trailing slash

      this._immediateSubscription = (0, _lodash.defaultTo)(options.immediateSubscription, true);
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

      var path = this.__makePath();

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

      if (!!this._userId) newItem._userId = this._userId;

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
    // Sets  provided ref with information. Returns firebase ref promise
    //

  }, {
    key: '_write',
    value: function _write(ref, data) {
      if (!ref) {
        this.__error('WRITE_NO_REF');
        return;
      }

      var d = (0, _lodash.assign)({}, data);
      if ((0, _lodash.has)(d, '_userId')) delete d._userId;

      this.__log('WRITE_UPDATING', ref.key, data);

      return ref.set(data);
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

    //
    // Remove provided ref
    //

  }, {
    key: '_remove',
    value: function _remove(ref) {
      if (!ref) {
        this.__error('DELETE_NO_REF');
        return;
      }

      this.__log('DELETE_DELETING', ref.key, data);

      return ref.remove();
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
    key: '__makePath',
    value: function __makePath() {
      var path = this._path;

      if (!!this._userId) path += '/' + this._userId;

      if (!!this.childId) path += '/' + this._childId;

      return path;
    }
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
    key: 'isReady',
    get: function get() {
      return this._isReady;
    }
  }, {
    key: 'size',
    get: function get() {
      return this._collection.size;
    }
  }]);

  return MobaseStore;
}(), (_descriptor = _applyDecoratedDescriptor(_class.prototype, '_isReady', [_mobx.observable], {
  enumerable: true,
  initializer: null
}), _applyDecoratedDescriptor(_class.prototype, 'isReady', [_mobx.computed], Object.getOwnPropertyDescriptor(_class.prototype, 'isReady'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'size', [_mobx.computed], Object.getOwnPropertyDescriptor(_class.prototype, 'size'), _class.prototype)), _class);

// class Todo extends MobaseModel {
//   properties = {
//     'title': '',
//     'someOptions': {},
//     'arrayoption': []
//   }
// }

//
//
//
// export class MobaseModel {
//
//   constructor(options) {
//
//     if(_.isNil(this.properties)) {
//       this.__error('CONSTRUCTOR_NO_PROPERTIES');
//       return;
//     }
//
//     this._defineProperties(this.properties);
//   }
//
//   getValues() {
//     return this._getValues();
//   }
//
//
//   _defineProperties(properties) {
//     properties.forEach((value, key) => {
//       Object.defineProperties(this, key, {
//         value: value,
//         enumerable: true
//       })
//     });
//   }
//
//   _getValues() {
//     return toJS(this);
//   }
//
//
//
//
//   //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//   //                                                                                                                  //
//   //                                              HELPERS                                                             //
//   //                                                                                                                  //
//   //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//
//
//   __log() {
//     let args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));
//
//     if(!this._debug)
//       return;
//
//     let message = null;
//
//     switch(args[0]) {
//
//       default:
//         message = 'Unspecified log message ' + args[0];
//         break;
//
//     }
//
//     if(message) {
//       message = 'MOBASE: (' + this._path + '): ' + message;
//       console.info.apply(this, [message].concat(args.slice(1, args.length)));
//     }
//
//   }
//
//
//   //
//   // throws errors to console
//   //
//   __error(e) {
//     let args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));
//
//     let message = null;
//
//     switch (args[0]) {
//
//       case 'CONSTRUCTOR_NO_PROPERTIES':
//         message = 'Properties must be specified for a mobase model';
//         break;
//
//       default:
//         message = 'Unspecified error ' + e + 'occured';
//         break;
//     }
//
//     if(message) {
//       message = 'MOBASE: (' + this._path + '): ' + message;
//       console.error.apply(this, [message].concat(args.slice(1, args.length)));
//     }
//   }
//
//
// }
