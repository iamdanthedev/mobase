*mobase* is an adapter connecting your firebase nodes to mobx-powered reactive store.

It's based on a unididrectional data flow pattern, meaning that the only way to alternate data in the store is to write it to firebase.

1. npm install --save mobase

2. Define an observable model. A model must have two methods getFields and setFields declared:

~~~~
import { observable, toJS, autorun } from 'mobx';
import {MobaseStore} from 'mobase';


// this is our model

class Todo {
  id = null;
  @observable title = '';
  @observable properties = {};

  getFields() {
    return toJS(this);
  }

  setFields(params) {
    this.id = params.id;
    this.title = params.title ? params.title : '';
    this.properties = params.properties ? params.properties : {};
  }
}
~~~~


3. Now let's set store options:

~~~~

const options = {
  database: firebase.database(),    //this is firebase database
  path: '/todos',                   //firebase node path
  modelClass: Todo,                 //our model class
  userBased: true,                  // if we want to have subnodes for every user (/todos/userId/todoId),
  userId: firebase.auth().userId,   // actual userId
  immediateSubscription: true       // subscribe to firebase immediately after initialising MobaseStore.
}

~~~~

4. And finally creating a store:

~~~~
const TodoStore = new MobaseStore(options);

autorun(() => {
  if(TodoStore.isReady) {
    TodoStore.values().map( (item) => {
      console.log(item.title);
    });
  }
});
~~~~








