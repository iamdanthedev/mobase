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

    this.options = {
      // firebase database instance
      database: null,

      //path to firebase db node
      path: null,

      //add userId to path
      userId: null,

      //add chillId to path (path/userId/childId)
      childId: null,

      //model class to instanciate
      modelClass: null,

      //should we subscribe to firebase on store creation
      immediateSubscription: true,

      //output debug information
      debug: true
    };

    // firebase reference
    this._ref = null;

    // is collection ready?
    this._isReady = false;

    // mobx collection map
    this._collection = (0, _mobx.asMap)();

    this.options = (0, _lodash.merge)(this.options, options);

    if (this.options.immediateSubscription) {
      this._subscribe();
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //                                                                                                                  //
  //                                              PUBLIC MEMBERS                                                      //
  //                                                                                                                  //
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  _createClass(MobaseStore, [{
    key: 'subscribe',
    value: function subscribe(options) {
      if (options) this.options = (0, _lodash.merge)(this.options, options);

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
          ref = _this._getChildRef(params.id);
          params.id = ref.key;
        } else {
          ref = _this._ref;
        }

        _this._write(ref, params).then(function (e) {
          if (e) reject("Writing failed");else resolve(ref.key);
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
          ref = _this2._getChildRef(params.id);
          params.id = ref.key;
        } else {
          ref = _this2._ref;
        }

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

      var optionsAreOK = this._checkOptions();

      if (!optionsAreOK) return;

      var path = this.__makePath();

      var ref = this.options.database.ref(path);

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
      var newItem = new this.options.modelClass(data, { userId: this.options.userId });

      // if(typeof newItem.getFields != "function")
      //   newItem.prototype.getFields = this._getFieldsFallback;
      //
      // if(typeof newItem.setFields != "function")
      //     newItem.prototype.setFields = this._setFieldsFallback;

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
      if (!ref) {
        this.__error('WRITE_NO_REF');
        return;
      }

      var d = this.__removePrivateKeys(data);

      this.__log('WRITE', ref.key, d);

      return ref.set(d);
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

      var d = this.__removePrivateKeys(data);

      this.__log('UPDATE', ref.key, d);

      return ref.update(d);
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
    key: '__removePrivateKeys',
    value: function __removePrivateKeys(d) {
      var _this4 = this;

      var result = (0, _lodash.assign)({}, d);

      result.forEach(function (value, key) {
        if (key[0] == '_') {
          delete result[key];
          _this4.__log('REMOVED_PRIVATE_KEY', key[0], d);
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

      var message = null;

      switch (args[0]) {

        case 'SUBSCRIBE_REF_SET':
          message = 'Firebase reference retrieved';
          break;

        case 'CHILD_ADDED':
          message = 'Child was added to collection with data: {0}';
          break;

        case 'CHILD_REMOVED':
          message = 'Child was removed from collection, id: {0}';
          break;

        case 'CHILD_CHANGED':
          message = 'Child was updated with data: {1}';
          break;

        case 'REMOVED_PRIVATE_KEY':
          message = 'Private key {0} removed from {1}';
          break;

        case 'WRITE':
          message = 'Writing key {0} with data {1}';
          break;

        case 'UPDATE':
          message = 'Updating key {0} with data {1}';
          break;

        default:
          message = 'Unspecified log message ' + args[0];
          break;

      }

      if (message) {
        message = 'MOBASE: (' + this.__makePath() + '): \n' + message;
        var formatted = message;
        if (args.length > 1) formatted = this.__format(message, args.slice(1, args.length));

        console.info(formatted);
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
        message = 'MOBASE: (' + this.__makePath() + '): ' + message;
        console.error.apply(this, [message].concat(args.slice(1, args.length)));
      }
    }
  }, {
    key: '__format',
    value: function __format(message, args) {
      var formatted = message;

      if (args) {

        for (var i = 0; i < args.length; i++) {
          var regexp = new RegExp('\\{' + i + '\\}', 'gi');
          var replace = JSON.stringify(args[i]);
          formatted = formatted.replace(regexp, replace);
        }
      }

      return formatted;
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
