const express = require('express')
const {readFile, writeFile, readdir, unlink} =require("fs").promises
const {nanoid} = require('nanoid')

const port = process.env.PORT || 8000
const server = express()
server.use(express.json())

const read = (category) => {
    return readFile(`./data/${category}.json`, 'utf-8')
        .then(data => JSON.parse(data))
}

const write = (data, category, res) => {
    writeFile(`./data/${category}.json`, data, 'utf-8')
        .then(() => res.send("Bravo"))
        .catch(err => res.json(err))
}

const getAllTodos = (data) => {
    const categories = data.map(it => it.replace(/\.json$/, ''))
    const allCat = categories.map(it => read(it))
    return Promise.all(allCat).then(data => data.flat())
}

server.get("/api/todos", (reg, res) => {
    readdir('./data')
        .then(data => {
            getAllTodos(data).then(todos => res.json(todos))
        })
})

server.get("/api/todos/:id", (reg, res) => {
    const {id} = reg.params
    readdir('./data')
        .then(data => {
            getAllTodos(data).then(todos => {
                const todo = todos.find(it => it.id === id)
                if (!todo) return res.status(404).end('No false')
                res.json(todo)
            })
        })
})

server.get("/api/categories", (reg, res) => {
    readdir('./data')
        .then(data => {
            const categories = data.map(it => it.replace(/\.json$/, ''))
            res.json(categories)
        }).catch(err => res.json(err))
})

server.patch('/api/todos/:id', (reg, res) => {
    const {id} = reg.params
    const {title} = reg.body

    readdir('./data')
        .then(data => {
            getAllTodos(data)
                .then(files => {
                    const todo = files.find(it => it.id === id)
                    if (!todo) return res.status(404).end('Неверный id')
                    const todos = files
                        .map(it => {
                        if (it.id === id) {
                          it.title = title
                        }
                        return it
                    })
                        .filter(it => it.category === todo.category)
                writeFile(`./data/${todo.category}.json`, JSON.stringify(todos), 'utf-8')
                res.json(todo)
            })
        })
})

server.delete('/api/todos/:id',(reg, res) => {
    const {id} = reg.params
    readdir('./data')
        .then(data => {
            getAllTodos(data)
                .then(files => {
                    const todo = files.find(it => it.id === id)
                    if (!todo) return res.status(404).end('Неверный id')
                    const todos = files.filter(it => it.id !== id && it.category === todo.category )

                    writeFile(`./data/${todo.category}.json`, JSON.stringify(todos), 'utf-8')
                    res.json(todo)
                })
        })
})

server.post("/api/todos", (reg, res) => {
    const {category = 'other', title} = reg.body

    const newTodo = {
        title,
        category,
        id: nanoid(8),
        createAt: new Date()
    }

    readFile(`./data/${category}.json`, 'utf-8')
        .then(data => {
            const todos = JSON.parse(data)
            todos.push(newTodo)

        write(JSON.stringify(todos), category, res)
        })
        .catch(() => {
            write(JSON.stringify([newTodo]), category, res)
        })
})

server.delete('/api/categories/:category', (reg, res) => {
    const {category} = reg.params

    unlink(`./data/${category}.json`)
        .then(() => res.json({message:'Удалено'}))
        .catch((e) => res.json({message:'Ошибка', e}))
})

server.get('/api/search',(reg, res) => {
    const {search} = reg.query
    readdir('./data')
        .then(data => {
            getAllTodos(data)
                .then(files => {
                    const todo = files.find(it => it.title === search)
                    if (!todo) return res.status(404).end('Неверный id')

                    res.json(todo)
                }).catch(err => res.json(err))
        }).catch(err => res.json(err))
})


server.listen(port, () => {
    console.log(`Server is running http://localhost:${port}`)
})