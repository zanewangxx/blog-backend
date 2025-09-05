const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

// GET blogs
blogsRouter.get('/', (request, response) => {
    Blog.find({}).then(blogs => {
        response.json(blogs)
    })
})

blogsRouter.get('/:id', (request, response) => {
    Blog.findById(request.params.id)
    .then(blog => {
        if (blog) {
            response.json(blog)
        } else {
            response.status(404).end()
        }
    })
    .catch(error => next(error))
})

// POST blog
blogsRouter.post('/', (request, response, next) => {
    const body = request.body

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes,
    })
    
    blog.save()
    .then(savedBlog => {
        response.status(201).json(savedBlog)
    })
    .catch(error => next(error))
})

module.exports = blogsRouter
