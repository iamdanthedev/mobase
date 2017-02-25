// CHANGELOG
// Added options.name (arguable?)
// Models are injected with _mobase object
// Added onAfterChildAdded, onAfterChildRemoved, onAfterChildChanged hooks
//       onBeforeChildAdded, onBeforeChildRemoved, onBeforeChildChanged
//       onBeforeValue, onAfterValue


import {observable, computed, toJS} from 'mobx';
import {assign, merge, forEach} from 'lodash';

export class MobaseStore {


  static options = {
    debug: false
  }

  static stores = {};

  @observable _isReady;


  constructor(options) {

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
    this._collection = observable.map();

    merge(this.options, MobaseStore.options, options);

    if(this.options.immediateSubscription) {
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


  @computed get isReady() {
    return this._isReady;
  }

  //Subscribe to firebase (if options.immediateSubscription == false)
  subscribe(options) {
    if(options)
      merge(this.options, MobaseStore.options, options);

    this._subscribe();
  }

  unsubscribe() {
    this._unsubscribe();
  }


  @computed get size() {
    return this._collection.size;
  }

  //exposes internal collection
  @computed get collection() {
    return this._collection;
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
        ref =  this._getChildRef( this.__extractId(params) )
        params.id = ref.key;
      }
      else {
        ref = this._ref;
      }

      this._write(ref, params)
        .then(key => resolve(key))
        .catch( (e) => reject("Writing failed") )
    });
  }

  update(params, toRoot = false) {
    return new Promise( (resolve, reject) => {

      let ref = null;

      if(!toRoot) {
        ref =  this._getChildRef( this.__extractId(params) )
        params.id = ref.key;
      }
      else {
        ref = this._ref;
      }

      this._update(ref, params)
        .then( () => resolve() )
        .catch( () => reject("Updating failed") )
    });
  }

  delete(_ids) {

    return new Promise ( (resolve, reject) => {
      let update = {}
      let ids

      if(Array.isArray(_ids))
        ids = Array.from(_ids)
      else if(typeof _ids == "string")
        ids = [_ids]
      else if(typeof _ids == "object")
        ids = Object.keys(_ids)
      else
        reject( this.__error('DELETE_WRONG_ARGS_TYPE', false) )

      ids.forEach( function (id) {
        update[id] = null
      })

      this._ref
        .update(update)
        .then( e => e ? reject (e) : resolve (ids))

    })
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

    if( !this._checkOptions() )
      return;

    let path = this.__makePath();

    let ref = this.options.database.ref(path);

    if(!ref) {
      this.__error('SUBSCRIBE_NO_REF');
      return;
    }

    this.__log('SUBSCRIBE_REF_SET');

    ref.on('value', function(snapshot) { this._value(snapshot.val()) }, this)
    ref.on('child_added', function(snapshot) { this._childAdded(snapshot.val()) }, this)
    ref.on('child_removed', function(snapshot) { this._childRemoved(snapshot.val()) }, this)
    ref.on('child_changed', function(snapshot) { this._childChanged(snapshot.val()) }, this)

    this._ref = ref;
  }


  _unsubscribe() {
    this._ref.off();
  }


  //values event handler.
  _value(data) {

    this.__trigger('onBeforeValue', {data})

    let buffer = {}

    forEach(data, (itemData, id) => {

      this.__trigger('onBeforeChildAdded', {id, data: itemData})

      const newItem = new this.options.modelClass(itemData)

      this.__injectMeta(newItem)

      buffer[id] = newItem

    })

    this._collection.replace(buffer)

    forEach(buffer, (item, id) => this.__trigger('onAfterChildAdded', {id, item, data: data[id]}, item))

    this.__trigger('onAfterValue', {data, items: buffer})

    this.__log('VALUE', buffer, data)

    this._setReady(true)
  }


  //child_added event handler
  _childAdded(data) {

    //prevent before initial value() event has been triggered
    if(!this.isReady) return

    //extract id from incoming data
    const newId = this.__extractId(data)

    if(!!!newId) {
      this.__error('CHILD_ADDED_NO_ID', data)
      return
    }

    this.__trigger('onBeforeChildAdded', {id, data})

    const newItem = new this.options.modelClass(data)

    this.__injectMeta(newItem)

    this._collection.set(newId, newItem)

    this.__trigger('onAfterChildAdded', {id: newId, data, item: newItem}, newItem)

    this.__log('CHILD_ADDED', newId, data)
  }

  //child_changed event handler
  _childChanged(data) {
    //extract id from incoming data
    const id = this.__extractId(data)

    if(!!!id) {
      this.__error('CHILD_CHANGED_NO_ID', data)
      return
    }

    let item = this._collection.get(id);

    if(!item) {
      this.__error('CHILD_CHANGED_NO_ITEM', data)
      return
    }

    this.__trigger('onBeforeChildChanged', {id, data, item}, item)

    if(item.setFields && typeof item.setFields == "function")
      item.setFields(data) //TODO: or fallback !

    //invoking set() creates a mobx reaction
    this._collection.set(id, item)

    this.__trigger('onAfterChildChanged', {id, data, item}, item)

    this.__log('CHILD_CHANGED', id, data);
  }

  //child_removed event handler
  _childRemoved(data) {
    //extract id from incoming data
    const id = this.__extractId(data)

    if(!!!id) {
      this.__error('CHILD_REMOVED_NO_ID', data)
      return
    }

    let item = this._collection.get(id);

    if(!item) {
      this.__error('CHILD_REMOVED_NO_ITEM')
      return
    }

    this.__trigger('onBeforeChildRemoved', {id, item, data}, item)

    this._collection.delete(id)

    this.__trigger('onAfterChildRemoved', {id, data})

    this.__log('CHILD_REMOVED', id)
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

    return new Promise( (resolve, reject) => {

      if (!ref) {
        this.__error('WRITE_NO_REF');
        return reject();
      }

      const d = this.__removePrivateKeys(data);

      this.__log('WRITE', ref.key, d);

      ref.set(d).then( e => e ? reject(e) : resolve(ref.key) )
    })
  }


  //
  // Updates  provided ref with information. Returns firebase ref promise
  //
  _update(ref, data) {

    return new Promise ( (resolve, reject) => {

      if (!ref) {
        this.__error('UPDATE_NO_REF');
        return reject();
      }

      const d = this.__removePrivateKeys(data);

      this.__log('UPDATE', ref.key, d);

      ref.update(d).then ( e => e ? reject(e) : resolve(ref.key) )
    })
  }

  //
  // Remove provided ref
  //
  _remove(ref) {

    return new Promise ( (resolve, reject) => {

      if (!ref) {
        this.__error('DELETE_NO_REF')
        return reject('DELETE_NO_REF')
      }

      this.__log('DELETE_DELETING', ref.key, data)

      ref.remove().then( e => e ? reject(e) : resolve ()  )
    })
  }





  _setReady(v) {
    this._isReady = v;
  }




  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //                                                                                                                  //
  //                                              HELPERS                                                             //
  //                                                                                                                  //
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  __extractId(data) {
    return data[this.options.idField]
  }


  __injectMeta(item) {
    if(!item) return

    Object.defineProperty(item, '$mobaseStore', { value: this, enumerable: false })
    Object.defineProperty(item, '$mobaseStores', { value: MobaseStore.stores, enumerable: false })
    Object.defineProperty(item, '$mobaseUserId', { value: this.options.userId, enumerable: false })
  }

  __trigger(e, eventParams, item) {

    if(item && item[e] && typeof item[e] == "function")
      item[e](params)

    if(this[e] && typeof this[e] == "function")
      this[e](params)

    if(this.options[e] && typeof this.options[e] == "function")
      this.options[e](params)


  }

  __removePrivateKeys(d) {
    let result = assign({}, d)

    forEach(result, (value, key) => {
      if(key[0] == '_') {
        delete result[key]
        this.__log('REMOVED_PRIVATE_KEY', key[0], d)
      }
    })

    return result
  }

  __makePath() {
    let path = this.options.path

    if(!!this.options.userId)
      path += '/' + this.options.userId

    if(!!this.options.childId)
      path += '/' + this.options.childId

    return path
  }


  __log() {
    let args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));

    if(!this.options.debug)
      return

    let message = this.__messages[args[0]] ? this.__messages[args[0]] : this.__messages['_LOG_DEFAULT_']

    if(message) {
      message = 'mobase ' + this.__makePath() + '\n' + message
      console.info.apply(this, [message].concat(args.slice(1, args.length)))
    }
  }

  // throws errors to console
  __error(e, shouldPrintToConsole = true) {
    let args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments))

    let message = this.__messages[args[0]] ? this.__messages[args[0]] : this.__messages['_ERROR_DEFAULT_'] + args[0]

    if(message) {
      message = 'mobase ' + this.__makePath() + '\n' + message
      if(shouldPrintToConsole)
        console.error.apply(this, [message].concat(args.slice(1, args.length)))
      else
        return [message].concat(args.slice(1, args.length))
    }
  }


  __messages = {

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
  }

}
