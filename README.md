# Mobase.js: Firebase-MobX adapter (a no-painer)

**mobase** helps you to create MobX-powered Firebase-syncronised reactive stores in a simple and intuitive manner.

It's based on a unidirectional data flow pattern. So the the only way to alternate data in the store is to write it to firebase. Because of the nature of Firebase changes will take effect immediately (don't have to wait until it syncs with the server)

**npm install --save mobase**


**Basic usage**

Let's say we expect to have our data in firebase structured as following:

~~~~
/todos
      -KdqjbX-oyvjM7ftb43K
          id: "-KdqjbX-oyvjM7ftb43K"
          isDone: false
          subtasks
              0: "Subtask #1"
              1: "Subtask #2"
          text: "This is my first todo"
      -KdvJzu-bynbpyMa1fGl
      -KdvRsT9-FeN4vVEGTj0
      // and so on
~~~~


There are a few expressive ways to define our store:

~~~~
import {MobaseStore} from 'mobase';

// don't forget to firebase.initializeApp(credentials)

const todoStore = new MobaseStore({
     path: '/todos',
     database: firebase.database(),
     fields: {

     }
})



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



























# (GitHub-Flavored) Markdown Editor

Basic useful feature list:

 * Ctrl+S / Cmd+S to save the file
 * Ctrl+Shift+S / Cmd+Shift+S to choose to save as Markdown or HTML
 * Drag and drop a file into here to load it
 * File contents are saved in the URL so you can share files


I'm no good at writing sample / filler text, so go write something yourself.

Look, a list!

 * foo
 * bar
 * baz

And here's some code! :+1:

```javascript
$(function(){
  $('div').html('I am a div.');
});
```

This is [on GitHub](https://github.com/jbt/markdown-editor) so let me know if I've b0rked it somewhere.


Props to Mr. Doob and his [code editor](http://mrdoob.com/projects/code-editor/), from which
the inspiration to this, and some handy implementation hints, came.

### Stuff used to make this:

 * [markdown-it](https://github.com/markdown-it/markdown-it) for Markdown parsing
 * [CodeMirror](http://codemirror.net/) for the awesome syntax-highlighted editor
 * [highlight.js](http://softwaremaniacs.org/soft/highlight/en/) for syntax highlighting in output code blocks
 * [js-deflate](https://github.com/dankogai/js-deflate) for gzipping of data to make it fit in URLs
