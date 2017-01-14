import {asMap, observable, computed, toJS} from 'mobx';
//import {isNil} from 'lodash';
import {assign, merge} from 'lodash';

export class MobaseStore {


  //options = {
  //  path: '/path_inside_firebase_db',
  //  userBased: bool,
  //  userId: if undefined - get it from firebase.auth()
  //  model class
  // }

  @observable _isReady;


  constructor(options) {

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
    this._collection = asMap();

    this.options = merge(this.options, options);

    if(this.options.immediateSubscription) {
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


  subscribe(options) {
    if(options)
      this.options = merge(this.options, options);

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

  entries() {
    return this._collection.entries();
  }

  get(id) {
    return this._collection.get(id);
  }

  has(id) {
    return this._collection.has(id);
  }

  toJS() {
    return toJS(this._collection);
  }

  write(params, toRoot = false) {
    return new Promise( (resolve, reject) => {

      let ref = null;

      if(!toRoot) {
        ref =  this._getChildRef(params.id);
        params.id = ref.key;
      }
      else {
        ref = this._ref;
      }



      this._write(ref, params).then((e) => {
        if(e)
            reject("Writing failed");
        else
            resolve(ref.key);
      });
    });
  }

  update(params, toRoot = false) {
    return new Promise( (resolve, reject) => {

      let ref = null;

      if(!toRoot) {
        ref =  this._getChildRef(params.id);
        params.id = ref.key;
      }
      else {
        ref = this._ref;
      }


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
  // Checks whether all necessary options are set
  //
  _checkOptions() {
    let result = true;

    if(!this.options.database) {
      this.__error('OPTIONS_NO_DB');
      result = false;
    }

    if(!this.options.path) {
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

    let ref = this.options.database.ref(path);

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
    const newItem = new this.options.modelClass(data, {userId: this.options.userId});

    // if(typeof newItem.getFields != "function")
    //   newItem.prototype.getFields = this._getFieldsFallback;
    //
    // if(typeof newItem.setFields != "function")
    //     newItem.prototype.setFields = this._setFieldsFallback;

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
  // Return root ref
  //
  _getRootRef() {
    return this._ref;
  }


  //
  // Sets  provided ref with information. Returns firebase ref promise
  //
  _write(ref, data) {
    if(!ref) {
      this.__error('WRITE_NO_REF');
      return;
    }

    const d = this.__removePrivateKeys(data);

    this.__log('WRITE', ref.key, d);

    return ref.set(d);
  }


  //
  // Updates  provided ref with information. Returns firebase ref promise
  //
  _update(ref, data) {
    if(!ref) {
      this.__error('UPDATE_NO_REF');
      return;
    }

    const d = this.__removePrivateKeys(data);

    this.__log('UPDATE', ref.key, d);

    return ref.update(d);
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


  __removePrivateKeys(d) {
    let result = assign({}, d);

    result.forEach((value, key) => {
      if(key[0] == '_') {
        delete result[key];
        this.__log('REMOVED_PRIVATE_KEY', key[0], d);
      }
    });

    return result;
  }

  __makePath() {
    let path = this.options.path;

    if(!!this.options.userId)
      path += '/' + this.options.userId;

    if(!!this.options.childId)
      path += '/' + this.options.childId;

    return path;
  }


  __log() {
    let args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));

    if(!this.options.debug)
        return;

    let message = null;

    switch(args[0]) {

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

    if(message) {
      message = 'MOBASE: (' + this.__makePath() + '): \n' + message;
      let formatted = message;
      if(args.length > 1)
          formatted = this.__format(message, args.slice(1, args.length));

      console.info(formatted);
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
      message = 'MOBASE: (' + this.__makePath() + '): ' + message;
      console.error.apply(this, [message].concat(args.slice(1, args.length)));
    }
  }


  __format(message, args) {
    var formatted = message;

    if(args) {

      for (var i = 0; i < args.length; i++) {
        let regexp = new RegExp('\\{'+i+'\\}', 'gi');
        let replace = JSON.stringify(args[i]);
        formatted = formatted.replace(regexp, replace);
      }

    }

    return formatted;
  }

}
