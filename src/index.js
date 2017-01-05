import {asMap, observable, computed} from 'mobx';
//import {isNil} from 'lodash';
import {assign, has, defaultTo} from 'lodash';

export class MobaseStore {


  //options = {
  //  path: '/path_inside_firebase_db',
  //  userBased: bool,
  //  userId: if undefined - get it from firebase.auth()
  //  model class
  // }

  @observable _isReady;


  constructor(options) {

    // firebase database instance
    this._database = null;

    // firebase reference
    this._ref = null;

    // is collection ready?
    this._isReady = false;

    // mobx collection map
    this._collection = asMap();

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

    if(this._immediateSubscription) {
      this._subscribe();
    }
  }



  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //                                                                                                                  //
  //                                              PUBLIC MEMBERS                                                      //
  //                                                                                                                  //
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  @computed get isReady() {
    return this._isReady;
  }

  config(options) {
    this._parseOptions(options);
  }

  subscribe(options) {
    if(options)
        this._parseOptions(options);

    this._subscribe();
  }

  unsubscribe() {
    this._unsubscribe();
  }


  @computed get size() {
    return this._collection.size;
  }

  values() {
    return this._collection.values();
  }

  get(id) {
    return this._collection.get(id);
  }

  toJS() {
    return toJS(this._collection);
  }



  write(params) {
    return new Promise( (resolve, reject) => {
      const ref = this._getChildRef(params.id);

      if(!childId)
        params.id = ref.key;

      this._write(ref, params).then((e) => {
        if(e)
            reject("Writing failed");
        else
            resolve(ref.key);
      });
    });
  }

  update(params, childId = null) {
    return new Promise( (resolve, reject) => {
      const ref = this._getChildRef(childId ? childId : params.id);

      if(!childId)
        params.id = ref.key;

      this._update(ref, params).then((e) => {
        if(e)
            reject("Writing failed");
        else
            resolve();
      });
    });
  }

  delete(id) {
    return new Promise ( (resolve, reject) => {
      if(!!!id) {
        this.__error('REMOVE_ID_INCORRECT');
        reject('Removing failed');
      }
      else {
        const ref = this._getChildRef(id);
        this._remove(ref).then (e => {
          if(e)
            reject('Removing item failed');
          else
            resolve();
        })
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
  _parseOptions(options) {

    this._userId = defaultTo(options.userId, null);

    this._childId = defaultTo(options.childId, null);

    this._modelClass = defaultTo(options.modelClass, null);

    this._database = defaultTo(options.database, null);

    this._path = defaultTo( options.path.replace(/\/+$/, "") , null); // remove trailing slash

    this._immediateSubscription = defaultTo(options.immediateSubscription, true);

  }

  //
  // Checks whether all necessary options are set
  //
  _checkOptions() {
    let result = true;

    if(!this._database) {
      this.__error('OPTIONS_NO_DB');
      result = false;
    }

    if(!!!this._path) {
      this.__error('OPTIONS_NO_PATH');
      result = false;
    }

    return result;
  }


  //
  // Subscribes to firebase db
  //
  _subscribe() {

    const optionsAreOK = this._checkOptions();

    if(!optionsAreOK)
        return;

    let path = this.__makePath();

    let ref = this._database.ref(path);

    if(!ref) {
      this.__error('SUBSCRIBE_NO_REF');
      return;
    }

    this.__log('SUBSCRIBE_REF_SET');

    ref.on('value', function(snapshot) { this._setReady(true); }, this);
    ref.on('child_added', function(snapshot) { this._childAdded(snapshot.val()); }, this);
    ref.on('child_removed', function(snapshot) { this._childRemoved(snapshot.val()); }, this);
    ref.on('child_changed', function(snapshot) { this._childChanged(snapshot.val()); }, this);

    this._ref = ref;
  }


  _unsubscribe() {
    this._ref.off();
  }



  _childAdded(data) {
    const newItem = new this._modelClass();

    if(typeof newItem.getFields != "function")
      newItem.prototype.getFields = this._getFieldsFallback;

    if(typeof newItem.setFields != "function")
        newItem.prototype.setFields = this._setFieldsFallback;

    newItem.setFields(data);

    if(!!this._userId)
      newItem._userId = this._userId;

    this._collection.set(newItem.id, newItem);

    this.__log('CHILD_ADDED', data);
  }


  _childRemoved(data) {
    this._collection.delete(data.id);

    this.__log('CHILD_REMOVED', data.id);
  }


  _childChanged(data) {

    let item = this._collection.get(data.id);

    if(!item) {
      this.__error('CHILD_CHANGED_NO_ITEM');
      return;
    }

    item.setFields(data);

    this.__log('CHILD_CHANGED', data);
  }


  _getFieldsFallback(data) {
    console.log("NOT IMPLEMENTED");
  }


  _setFieldsFallback(data) {
    console.log("NOT IMPLEMENTED");
  }



  //
  // Return child ref and creates a new one if needed
  //
  _getChildRef(id) {
    let newRef = null;

    if(id)
      newRef = this._ref.child(id);
    else
        newRef = this._ref.push();


    if(!newRef) {
      this.__error('GET_CHILD_REF_NO_REF');
      return;
    }

    return newRef;
  }


  //
  // Sets  provided ref with information. Returns firebase ref promise
  //
  _write(ref, data) {
    if(!ref) {
      this.__error('WRITE_NO_REF');
      return;
    }

    let d = assign({}, data);
    if( has (d, '_userId'))
      delete d._userId;

    this.__log('WRITE_UPDATING', ref.key, data);

    return ref.set(data);
  }


  //
  // Updates  provided ref with information. Returns firebase ref promise
  //
  _update(ref, data) {
    if(!ref) {
      this.__error('UPDATE_NO_REF');
      return;
    }

    this.__log('UPDATE_UPDATING', ref.key, data);

    return ref.update(data);
  }

  //
  // Remove provided ref
  //
  _remove(ref) {
    if(!ref) {
      this.__error('DELETE_NO_REF');
      return;
    }

    this.__log('DELETE_DELETING', ref.key, data);

    return ref.remove();
  }





  _setReady(v) {
    this._isReady = v;
  }




  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //                                                                                                                  //
  //                                              HELPERS                                                             //
  //                                                                                                                  //
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  __makePath() {
    let path = this._path;

    if(!!this._userId)
      path += '/' + this._userId;

    if(!!this.childId)
      path += '/' + this._childId;

    return path;
  }


  __log() {
    let args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));

    if(!this._debug)
        return;

    let message = null;

    switch(args[0]) {

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

    if(message) {
      message = 'MOBASE: (' + this._path + '): ' + message;
      console.info.apply(this, [message].concat(args.slice(1, args.length)));
    }

  }


  //
  // throws errors to console
  //
  __error(e) {
    let args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));

    let message = null;

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

    if(message) {
      message = 'MOBASE: (' + this._path + '): ' + message;
      console.error.apply(this, [message].concat(args.slice(1, args.length)));
    }
  }





}



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
