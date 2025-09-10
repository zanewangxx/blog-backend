const blogsRouter = require('express').Router()
const { request, response } = require('../app')
const Blog = require('../models/blog')

// GET blogs
blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({})
    response.json(blogs)
})

blogsRouter.get('/:id', async (request, response, next) => {
    try{
    const blog = await Blog.findById(request.params.id)
    if(blog){
        response.json(blog)
    }else{
        response.status(404).end()
    }
}catch(error){
    next(error)
}
})

// POST blog
blogsRouter.post('/', async (request, response, next) => {
    try{
        const body = request.body
        if (!body.title || !body.url) {
            return response.status(400).json({ error: 'title and url are required' })
          }      
        const blog = new Blog({
            title: body.title,
            author: body.author,
            url: body.url,
            likes: body.likes || 0,
        })
        const savedBlog = await blog.save()
        response.status(201).json(savedBlog)
    }catch(error){
        next(error)
    }
})

//DELETE blog
blogsRouter.delete('/:id', async (request, response) => {
    await Blog.findByIdAndDelete(request.params.id)
    response.status(204).end()
})

//UPDATE blog likes
blogsRouter.put('/:id', async (request, response, next) => {
    try {
      const { likes } = request.body
  
      const updatedBlog = await Blog.findByIdAndUpdate(
        request.params.id,
        { likes },
        { new: true, runValidators: true, context: 'query' }
      )
  
      if (!updatedBlog) {
        return response.status(404).end()
      }
  
      response.json(updatedBlog)
    } catch (error) {
      next(error)
    }
  })
  


module.exports = blogsRouter
