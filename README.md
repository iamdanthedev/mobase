# Mobase.js: Firebase-MobX adapter (a no-painer)

### This project is not production ready. You are welcome to explore the code in educational purposes. ###
#### (Also I was still quite C#-biased at the days of writing this code ####

Documentation: https://rasdaniil.gitbooks.io/mobase/content/

**mobase** helps you to create MobX-powered Firebase-syncronised reactive MobaseStores in a simple and intuitive manner.

It's based on a unidirectional data flow pattern. So the the only way to alternate data in the store is to write it to firebase. Because of the nature of Firebase changes will take effect immediately (don't have to wait until it syncs with the server)

MobaseStore has a MobX map as a collection of elements (items) at the core. It supports most of MobX maps' methods like values(), entries(), size, etc..

It's important that every item had it's own id (any unique field can be an id, see options.idField)



**GETTING STARTED**

**npm install --save mobase**

Let's say we expect to have our data in firebase structured as following:

```
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
```


There are a few expressive ways to define our store:

```javascript
import {MobaseStore} from 'mobase'

// don't forget to firebase.initializeApp(credentials)

const todoStore = new MobaseStore({
     path: '/todos',
     database: firebase.database(),
     fields: {
         id: observable.ref,
         isDone: {
             modifier: observable.ref,
             default: ''
         },
         subtasks: {
             modifier: observable.shallow,
             default: []
         },
         text: observable.ref
     }
})

```


Now let's use the store created in a reactive manner with React.

```javascript
import {observer} from 'mobx-react'

const App = observer( ({todoStore}) => {

    return (
        <main>
            <div>Total: {todoStore.size}</div>

            <ul>
                {todoStore.values().map( item => (
                    <li key={item.id}>
                        {item.text}

                        {item.subtasks.map( (subtask, i) => (
                            <div key={i}>{subtask}</div>
                        )}
                    </li>
                ))}
            </ul>
        </main>
    )

} )

ReactDOM.render(<App todoStore={todoStore} />, document.getElementById('app'));
```

To add data:

```javascript
const addTodo = text => {
    todoStore
         .write({ text })
         .then( id => console.log('New item id: %s', id) )
}
```


To modify existing item:

```javascript
const completeTodo = todo => {
    todoStore
        .update( {id: todo.id, isDone: true} ) // don't forget to specify id of the object being updated
        .then( id => console.log('Updated successfully, id: %s', id) )
}


const addSubtask = (todo, subtask) => {
    const subtasks = todo.subtasks.slice().concat( subtask ) //new subtasks array

    todoStore
        .update( {id: todo.id, subtasks } )
        .then( id => console.log('Updated successfully, id: %s', id) )
}


const todo = todoStore.values()[0] //getting the first todo from the store
completeTodo(todo)
addSubtask(todo, "Yet another subtask")
```

To remove an item:

```javascript

const removeTodo = todo => {
    todoStore
         .delete(todo.id)
         .then( id => console.log('Deleted item %s', id) )
}
```





















